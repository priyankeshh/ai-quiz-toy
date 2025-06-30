from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import re
import logging

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    logger.warning("GEMINI_API_KEY not found. Using mock responses.")
    model = None

# In-memory storage for demo purposes
profiles = {}
quiz_sessions = {}

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_assets(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/profile', methods=['POST'])
def create_profile():
    try:
        data = request.get_json()
        profile_id = f"profile_{len(profiles) + 1}"
        
        profile = {
            'id': profile_id,
            'name': data.get('name', ''),
            'age': data.get('age', 8),
            'interests': data.get('interests', [])
        }
        
        profiles[profile_id] = profile
        logger.info(f"Created profile: {profile}")
        
        return jsonify({
            'success': True,
            'profile': profile
        })
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        topic = data.get('topic', '')
        profile_id = data.get('profile_id', '')
        
        if not profile_id or profile_id not in profiles:
            return jsonify({'success': False, 'error': 'Invalid profile'}), 400
        
        profile = profiles[profile_id]
        age = profile['age']
        
        if model and GEMINI_API_KEY:
            try:
                # Generate quiz using Gemini API
                prompt = f"""
                Create a fun, educational quiz about "{topic}" for a {age}-year-old child.
                
                Requirements:
                - Generate exactly 4 multiple choice questions
                - Each question should have 4 options (A, B, C, D)
                - Make the language age-appropriate for a {age}-year-old
                - Include encouraging, positive language
                - Make it educational but fun
                
                Return the response in this exact JSON format:
                {{
                    "questions": [
                        {{
                            "question": "Question text here?",
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correct_answer": 0,
                            "explanation": "Brief explanation for kids"
                        }}
                    ]
                }}
                """
                
                response = model.generate_content(prompt)
                logger.info(f"Gemini API response: {response.text}")
                
                # Check if response is empty or None
                if not response.text or response.text.strip() == "":
                    logger.warning("Empty response from Gemini API, using mock data")
                    raise ValueError("Empty response from API")
                
                # Try to parse JSON, with fallback handling
                try:
                    quiz_data = json.loads(response.text)
                except json.JSONDecodeError as json_error:
                    logger.error(f"JSON parsing error: {json_error}")
                    logger.error(f"Raw response text: {repr(response.text)}")
                    
                    # Try to extract JSON from response if it contains other text
                    json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                    if json_match:
                        try:
                            quiz_data = json.loads(json_match.group())
                            logger.info("Successfully extracted JSON from response")
                        except json.JSONDecodeError:
                            logger.error("Failed to extract valid JSON, using mock data")
                            raise ValueError("Invalid JSON in API response")
                    else:
                        logger.error("No JSON found in response, using mock data")
                        raise ValueError("No JSON found in API response")
                
                # Validate the structure of quiz_data
                if not isinstance(quiz_data, dict) or 'questions' not in quiz_data:
                    logger.error("Invalid quiz data structure, using mock data")
                    raise ValueError("Invalid quiz data structure")
                    
                if not isinstance(quiz_data['questions'], list) or len(quiz_data['questions']) == 0:
                    logger.error("No questions in quiz data, using mock data")
                    raise ValueError("No questions in quiz data")
                        
            except Exception as api_error:
                logger.error(f"Gemini API error: {api_error}, falling back to mock data")
                # Fall through to mock response
                quiz_data = None
        else:
            quiz_data = None
            
        # Use mock response if API is not available or failed
        if quiz_data is None:
            quiz_data = {
                "questions": [
                    {
                        "question": f"What is a fun fact about {topic}?",
                        "options": ["It's amazing!", "It's interesting!", "It's cool!", "All of the above!"],
                        "correct_answer": 3,
                        "explanation": f"Great job! {topic} is indeed amazing, interesting, and cool!"
                    },
                    {
                        "question": f"How would you describe {topic} to a friend?",
                        "options": ["Boring", "Exciting", "Confusing", "Scary"],
                        "correct_answer": 1,
                        "explanation": f"That's right! {topic} is exciting and fun to learn about!"
                    },
                    {
                        "question": f"What's the best way to learn about {topic}?",
                        "options": ["Reading books", "Watching videos", "Asking questions", "All of these!"],
                        "correct_answer": 3,
                        "explanation": "Excellent! Learning happens in many different ways!"
                    },
                    {
                        "question": f"Why is {topic} important?",
                        "options": ["It helps us understand the world", "It's fun to know", "It makes us smarter", "All of the above"],
                        "correct_answer": 3,
                        "explanation": f"Perfect! {topic} helps us in many wonderful ways!"
                    }
                ]
            }
        
        # Create quiz session
        session_id = f"session_{len(quiz_sessions) + 1}"
        quiz_sessions[session_id] = {
            'id': session_id,
            'profile_id': profile_id,
            'topic': topic,
            'questions': quiz_data['questions'],
            'current_question': 0,
            'score': 0,
            'answers': []
        }
        
        logger.info(f"Generated quiz for topic: {topic}, profile: {profile_id}")
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'quiz': quiz_data
        })
        
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/answer', methods=['POST'])
def submit_answer():
    try:
        data = request.get_json()
        session_id = data.get('session_id', '')
        answer_index = data.get('answer_index', -1)
        
        if session_id not in quiz_sessions:
            return jsonify({'success': False, 'error': 'Invalid session'}), 400
        
        session = quiz_sessions[session_id]
        current_q = session['current_question']
        
        if current_q >= len(session['questions']):
            return jsonify({'success': False, 'error': 'Quiz completed'}), 400
        
        question = session['questions'][current_q]
        is_correct = answer_index == question['correct_answer']
        
        if is_correct:
            session['score'] += 1
        
        session['answers'].append({
            'question_index': current_q,
            'answer_index': answer_index,
            'is_correct': is_correct
        })
        
        session['current_question'] += 1
        
        response_data = {
            'success': True,
            'is_correct': is_correct,
            'explanation': question['explanation'],
            'current_score': session['score'],
            'is_quiz_complete': session['current_question'] >= len(session['questions'])
        }
        
        if response_data['is_quiz_complete']:
            response_data['final_score'] = session['score']
            response_data['total_questions'] = len(session['questions'])
        
        logger.info(f"Answer submitted for session {session_id}: {'Correct' if is_correct else 'Incorrect'}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/session/<session_id>')
def get_quiz_session(session_id):
    try:
        if session_id not in quiz_sessions:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        session = quiz_sessions[session_id]
        return jsonify({
            'success': True,
            'session': session
        })
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)