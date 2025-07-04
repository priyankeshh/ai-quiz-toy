# AI Quiz Toy Prototype

A beautiful, production-ready web application that demonstrates the core functionality of an AI-powered educational quiz toy. Built with React frontend and Python Flask backend, featuring voice interaction and AI-generated quizzes.

## Features

### Core Functionality
- **Child Profile Creation**: Name, age, and interests
- **Topic Selection**: Type or speak your topic of interest
- **AI Quiz Generation**: Powered by Google's Gemini API
- **Voice Interaction**: Speak questions aloud and accept voice answers
- **Real-time Feedback**: Immediate response with explanations
- **Progress Tracking**: Score tracking and session management
- **Responsive Design**: Optimized for laptop demonstrations

### Voice Features
- Web Speech API integration for voice input
- Text-to-speech for questions and feedback
- Voice-friendly interface with clear audio cues
- Support for both voice and text input modes

### Beautiful Design
- Child-friendly interface with playful colors
- Smooth animations and micro-interactions
- Accessible design with large buttons and clear typography
- Professional gradient backgrounds and modern styling

## Prerequisites

- Python 3.8+
- Node.js 16+
- Google Gemini API key (optional - app works with mock data)

## Installation

### 1. Clone and Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your Gemini API key (optional)
# GEMINI_API_KEY=your_api_key_here
```

**Note**: The app works perfectly without an API key using intelligent mock responses for demonstration purposes.

### 3. Build Frontend

```bash
# Build the React frontend
npm run build
```

## Running the Application

### Start the Backend Server
```bash
python app.py
```

The application will be available at `http://localhost:5000`

### Development Mode (Optional)
For frontend development:
```bash
# In one terminal - start the backend
python app.py

# In another terminal - start the frontend dev server
npm run dev
```

## Usage

### Demo Flow
1. **Create Profile**: Enter name, age, and select interests
2. **Choose Topic**: Type or speak a topic you want to learn about
3. **Take Quiz**: Answer AI-generated questions using voice or clicks
4. **Get Feedback**: Receive immediate feedback with explanations
5. **View Results**: See your final score and play again

### Voice Commands
- **Topic Selection**: "I want to learn about dinosaurs"
- **Quiz Answers**: Say "A", "B", "C", "D" or speak the full answer
- **Navigation**: All buttons also support voice interaction

## API Endpoints

### Profile Management
- `POST /api/profile` - Create a new child profile

### Quiz System
- `POST /api/quiz/generate` - Generate quiz questions for a topic
- `POST /api/quiz/answer` - Submit an answer and get feedback
- `GET /api/quiz/session/<id>` - Get quiz session details

## Technical Architecture

### Frontend (React + TypeScript)
- **Components**: Modular design with ProfileCreation, TopicSelection, QuizInterface
- **Voice Integration**: Web Speech API for recognition and synthesis
- **State Management**: React hooks for application state
- **Styling**: Tailwind CSS with custom gradients and animations

### Backend (Python Flask)
- **API Routes**: RESTful endpoints for profile and quiz management
- **AI Integration**: Google Gemini API for quiz generation
- **CORS Support**: Cross-origin requests for frontend communication
- **Session Management**: In-memory storage for demo purposes

### Voice System
- **Speech Recognition**: Browser-native voice input
- **Text-to-Speech**: Natural voice feedback and question reading
- **Voice Manager**: Centralized voice control with child-friendly settings

## Customization

### Adding New Topics
The app automatically generates quizzes for any topic using AI. Popular topics include:
- Science (Animals, Space, Human Body)
- History (Ancient India, Dinosaurs)
- Arts (Music, Colors, Drawing)
- Math (Numbers, Shapes, Patterns)

### Voice Settings
Modify `VoiceManager.ts` to adjust:
- Speech rate and pitch
- Voice selection preferences
- Language settings

### Styling
Update `tailwind.config.js` and component styles to match your brand:
- Color schemes
- Typography
- Animation preferences
- Layout variations

## Production Deployment

### Backend Deployment
- Use a production WSGI server like Gunicorn
- Set up environment variables securely
- Configure proper CORS settings
- Add rate limiting and authentication as needed

### Frontend Deployment
- Build assets are served by the Flask backend
- Can be deployed to any static hosting service
- CDN integration for better performance

## Troubleshooting

### Voice Recognition Issues
- Ensure HTTPS for production (required for microphone access)
- Check browser compatibility (Chrome/Edge recommended)
- Verify microphone permissions

### API Key Issues
- App works without API key using mock responses
- Check `.env` file for correct key format
- Verify Gemini API quota and billing

### Build Issues
- Clear `node_modules` and reinstall if needed
- Check Python and Node.js versions
- Verify all dependencies are installed

## Contributing

This prototype is designed for educational demonstration. Key areas for enhancement:
- Database integration for persistent storage
- Multi-language support (Hindi/English)
- Advanced progress analytics
- Parent/teacher dashboard
- Hardware integration for physical device

## License

This project is a prototype for educational purposes. Please respect the terms of service for any third-party APIs used.