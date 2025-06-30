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
                # Generate quiz using Gemini API with enhanced prompts
                prompt = f"""
                You are Quizzy, a friendly and enthusiastic AI teacher who loves helping children learn!
                Create an amazing, fun quiz about "{topic}" for a {age}-year-old child.

                IMPORTANT REQUIREMENTS:
                - Generate exactly 4 multiple choice questions
                - Each question should have 4 options (A, B, C, D)
                - Use simple, clear language perfect for a {age}-year-old
                - Make questions engaging with "Did you know..." or "Can you guess..." style
                - Include fun facts and surprising information
                - Use emojis and exciting language where appropriate
                - Make explanations encouraging and educational
                - Avoid scary, negative, or complex topics
                - Focus on wonder, discovery, and positive learning

                CONTENT GUIDELINES:
                - Questions should spark curiosity and imagination
                - Include relatable examples from a child's world
                - Make learning feel like an adventure
                - Use positive, encouraging tone throughout
                - Explanations should teach something new and exciting

                Return the response in this exact JSON format:
                {{
                    "questions": [
                        {{
                            "question": "Exciting question that makes kids curious?",
                            "options": ["Fun first option", "Amazing second option", "Cool third option", "Awesome fourth option"],
                            "correct_answer": 0,
                            "explanation": "Wow! That's right! Here's why this is so amazing and what makes it special for kids to understand..."
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
            
        # Use enhanced mock response if API is not available or failed
        if quiz_data is None:
            quiz_data = {
                "questions": [
                    {
                        "question": f"🌟 Did you know that {topic} can be super exciting? What makes {topic} so amazing?",
                        "options": ["It's full of surprises! ✨", "It helps us learn cool things! 🧠", "It's fun to explore! 🔍", "All of these awesome things! 🎉"],
                        "correct_answer": 3,
                        "explanation": f"Wow! You're absolutely right! {topic} is full of surprises, helps us learn amazing things, and is so much fun to explore! You're such a smart learner! 🌟"
                    },
                    {
                        "question": f"🤔 If you could tell your best friend about {topic}, what would you say?",
                        "options": ["It's boring 😴", "It's the most exciting thing ever! 🚀", "It's too hard to understand 😕", "I don't care about it 🤷"],
                        "correct_answer": 1,
                        "explanation": f"Yes! {topic} really IS the most exciting thing ever! There's so much to discover and learn. Your enthusiasm for learning is fantastic! 🎊"
                    },
                    {
                        "question": f"🎯 What's the most fun way to learn about {topic}?",
                        "options": ["Reading colorful books 📚", "Watching awesome videos 📺", "Asking lots of questions ❓", "Doing all of these amazing things! 🌈"],
                        "correct_answer": 3,
                        "explanation": "Outstanding choice! The best learners use ALL these ways - books, videos, and asking questions! You're becoming a learning superhero! 🦸‍♀️🦸‍♂️"
                    },
                    {
                        "question": f"💫 Why do you think learning about {topic} is important for kids like you?",
                        "options": ["It helps us understand our amazing world 🌍", "It's super fun and exciting 🎈", "It makes us smarter and more curious 🧠", "All of these incredible reasons! ⭐"],
                        "correct_answer": 3,
                        "explanation": f"Perfect! Learning about {topic} does ALL these wonderful things! It helps you understand the world, brings joy and excitement, and makes you smarter and more curious every day! Keep being awesome! 🏆"
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
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)