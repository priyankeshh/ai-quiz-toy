import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, User, Brain, Trophy, Award } from 'lucide-react';
import ProfileCreation from './components/ProfileCreation';
import TopicSelection from './components/TopicSelection';
import QuizInterface from './components/QuizInterface';
import VoiceManager from './components/VoiceManager';
import AchievementSystem, { Achievement } from './components/AchievementSystem';
import Mascot, { MascotStates } from './components/Mascot';
import { logger, BrowserCompatibility } from './utils/logger';
import TestSuite from './components/TestSuite';
import VoiceTest from './components/VoiceTest';
import WebSpeechTest from './components/WebSpeechTest';

export interface Profile {
  id: string;
  name: string;
  age: number;
  interests: string[];
}

export interface QuizSession {
  id: string;
  profile_id: string;
  topic: string;
  questions: Question[];
  current_question: number;
  score: number;
  answers: Answer[];
}

export interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Answer {
  question_index: number;
  answer_index: number;
  is_correct: boolean;
}

type AppState = 'profile' | 'topic' | 'quiz' | 'results';

interface AppProps {
  initialState?: AppState;
}

function App({ initialState }: AppProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  // Determine initial state from route or prop
  const getInitialState = (): AppState => {
    if (initialState) return initialState;

    const path = location.pathname;
    switch (path) {
      case '/register': return 'profile';
      case '/topics': return 'topic';
      case '/quiz': return 'quiz';
      case '/results': return 'results';
      default: return 'profile';
    }
  };

  const [currentState, setCurrentState] = useState<AppState>(getInitialState());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [showWebSpeechTest, setShowWebSpeechTest] = useState(false);
  const [mascotState, setMascotState] = useState<{mood: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'encouraging', message: string}>(MascotStates.WELCOME);

  // Initialize voice manager (memoized for performance)
  const voiceManager = useMemo(() => new VoiceManager(), []);

  useEffect(() => {
    // Initialize app and run compatibility checks
    logger.info('APP', 'Application starting');
    const compatibility = BrowserCompatibility.runAllChecks();
    logger.info('APP', 'Browser compatibility check completed', compatibility);

    // Welcome message when app loads
    voiceManager.speak("Welcome to the AI Quiz Toy! Let's start by creating your profile.");
    logger.userAction('App loaded', { compatibility });
  }, [voiceManager]);

  const handleProfileCreated = useCallback((newProfile: Profile) => {
    logger.userAction('Profile created', { name: newProfile.name, age: newProfile.age, interests: newProfile.interests });
    setProfile(newProfile);
    setCurrentState('topic');
    setMascotState(MascotStates.TOPIC_SELECTION);
    navigate('/topics');
    voiceManager.speak(`Great to meet you, ${newProfile.name}! Now let's choose a topic for your quiz.`);
  }, [voiceManager, navigate]);

  const handleTopicSelected = async (topic: string) => {
    if (!profile) return;

    logger.userAction('Topic selected', { topic, profileId: profile.id });
    setCurrentTopic(topic);
    setIsLoading(true);
    voiceManager.speak(`Excellent choice! I'm creating a fun quiz about ${topic} just for you. This will only take a moment.`);

    const startTime = performance.now();
    try {
      logger.apiRequest('/api/quiz/generate', 'POST', { topic, profile_id: profile.id });

      const response = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          profile_id: profile.id,
        }),
      });

      logger.apiResponse('/api/quiz/generate', response.status);
      const data = await response.json();
      
      if (data.success) {
        logger.info('QUIZ', 'Quiz generation successful', { sessionId: data.session_id });

        // Fetch the session data
        const sessionResponse = await fetch(`http://localhost:5000/api/quiz/session/${data.session_id}`);
        const sessionData = await sessionResponse.json();

        if (sessionData.success) {
          const endTime = performance.now();
          logger.performance('Quiz generation time', endTime - startTime);
          logger.info('QUIZ', 'Quiz session loaded', { questionCount: sessionData.session.questions.length });

          setQuizSession(sessionData.session);
          setCurrentState('quiz');
          setMascotState(MascotStates.QUIZ_START);
          navigate('/quiz');
          
          // Add a small delay to ensure UI state is consistent before clearing loading
          setTimeout(() => {
            setIsLoading(false);
            voiceManager.speak(`Your quiz is ready! Let's begin with the first question.`);
          }, 100);
        } else {
          throw new Error(sessionData.error || 'Failed to load quiz session');
        }
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (error) {
      logger.apiError('/api/quiz/generate', error);
      setIsLoading(false);

      // More specific error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.error('NETWORK', 'Connection failed', { topic, profileId: profile.id });
        voiceManager.speak("Oops! It looks like we're having trouble connecting. Please check your internet connection and try again.");
      } else {
        logger.error('QUIZ', 'Quiz generation failed', { topic, error: error instanceof Error ? error.message : String(error) });
        voiceManager.speak("I'm sorry, there was a problem creating your quiz. Let's try a different topic or try again in a moment.");
      }

      // Show user-friendly error message
      alert("🌟 Don't worry! Sometimes our quiz magic needs a moment to work. Please try selecting your topic again!");
    }
  };

  const handleQuizComplete = (finalScore: number, totalQuestions: number) => {
    // Update the quiz session with final score before showing results
    setQuizSession(prev => prev ? {
      ...prev,
      score: finalScore,
      current_question: totalQuestions
    } : null);

    // Update achievement tracking
    setTotalScore(prev => prev + finalScore);
    if (!completedTopics.includes(currentTopic)) {
      setCompletedTopics(prev => [...prev, currentTopic]);
    }

    setCurrentState('results');
    setMascotState(MascotStates.QUIZ_COMPLETE);
    navigate('/results');
    voiceManager.speakQuizComplete(finalScore, totalQuestions);
  };

  const handleScoreUpdate = useCallback((currentScore: number, currentQuestion: number) => {
    // Update the quiz session state in App component to keep header in sync
    setQuizSession(prev => prev ? {
      ...prev,
      score: currentScore,
      current_question: currentQuestion
    } : null);
  }, []);

  const handleAchievementUnlocked = useCallback((achievement: Achievement) => {
    setMascotState(MascotStates.ACHIEVEMENT);
    voiceManager.speak(`Amazing! You unlocked the ${achievement.name} achievement!`);
  }, [voiceManager]);

  const handlePlayAgain = () => {
    setCurrentState('topic');
    setQuizSession(null);
    setCurrentTopic('');
    navigate('/topics');
    voiceManager.speak("Let's choose a new topic for another fun quiz!");
  };

  const handleNewProfile = () => {
    setCurrentState('profile');
    setProfile(null);
    setQuizSession(null);
    setCurrentTopic('');
    navigate('/register');
    voiceManager.speak("Let's create a new profile and start fresh!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 via-blue-200 to-green-200 relative overflow-hidden">
      {/* Enhanced Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating bubbles */}
        <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-300 rounded-full star-sparkle bubble-float opacity-70" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-32 right-20 w-6 h-6 bg-pink-400 rounded-full star-sparkle bubble-float opacity-60" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-40 left-16 w-10 h-10 bg-blue-400 rounded-full star-sparkle bubble-float opacity-50" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-32 w-7 h-7 bg-green-400 rounded-full star-sparkle bubble-float opacity-65" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-5 h-5 bg-purple-400 rounded-full star-sparkle bubble-float opacity-55" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-20 right-1/3 w-4 h-4 bg-orange-400 rounded-full star-sparkle bubble-float opacity-60" style={{animationDelay: '2.5s'}}></div>

        {/* Additional animated shapes */}
        <div className="absolute top-1/4 left-1/2 w-6 h-6 bg-cyan-400 rounded-full zoom-in-out opacity-40" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-rose-400 rounded-full heart-beat opacity-50" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/6 w-5 h-5 bg-lime-400 rounded-full rotate-slow opacity-45" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-1/2 right-1/6 w-7 h-7 bg-indigo-400 rounded-full bounce-gentle opacity-55" style={{animationDelay: '4.5s'}}></div>

        {/* Emoji decorations */}
        <div className="absolute top-16 left-1/3 text-2xl star-sparkle opacity-60" style={{animationDelay: '5s'}}>⭐</div>
        <div className="absolute bottom-24 left-1/2 text-3xl bubble-float opacity-50" style={{animationDelay: '5.5s'}}>🌟</div>
        <div className="absolute top-2/3 right-1/5 text-2xl rotate-slow opacity-45" style={{animationDelay: '6s'}}>✨</div>
        <div className="absolute bottom-1/4 left-1/5 text-4xl heart-beat opacity-40" style={{animationDelay: '6.5s'}}>💫</div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-pink-300/80 via-purple-300/80 to-blue-300/80 backdrop-blur-sm shadow-lg sticky top-0 z-10 border-b-4 border-white/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-2xl shadow-lg wiggle">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  🌟 AI Quiz Adventure 🌟
                </h1>
                <div className="text-sm md:text-base text-purple-600 font-semibold mt-1 flex items-center">
                  {location.pathname === '/register' && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                      📝 Create Profile
                    </span>
                  )}
                  {location.pathname === '/topics' && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                      🎯 Choose Topic
                    </span>
                  )}
                  {location.pathname === '/quiz' && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      🧠 Quiz Time
                    </span>
                  )}
                  {location.pathname === '/results' && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                      🏆 Results
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {profile && (
              <div className="flex items-center space-x-2 md:space-x-4 flex-wrap">
                <div className="flex items-center space-x-2 bg-white/80 rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg border-2 border-pink-200">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  <span className="text-sm md:text-lg font-semibold text-gray-800">👋 {profile.name}</span>
                </div>
                {quizSession && (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg border-2 border-yellow-400 celebration-bounce">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-orange-700" />
                    <span className="text-sm md:text-lg font-bold text-orange-800">
                      🏆 {quizSession.score}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowAchievements(!showAchievements)}
                  className="flex items-center space-x-1 md:space-x-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg border-2 border-purple-300 text-white hover:shadow-xl transition-all transform hover:scale-105 touch-manipulation"
                >
                  <Award className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-lg font-bold hidden sm:inline">🏅 Achievements</span>
                  <span className="text-sm font-bold sm:hidden">🏅</span>
                </button>

                {/* Test Suite Button (Development Only) */}
                {import.meta.env.DEV && (
                  <>
                    <button
                      onClick={() => setShowTestSuite(!showTestSuite)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full px-4 py-2 shadow-lg border-2 border-gray-300 text-white hover:shadow-xl transition-all transform hover:scale-105 touch-manipulation"
                    >
                      <span className="text-sm font-bold">🧪</span>
                    </button>
                    <button
                      onClick={() => setShowVoiceTest(!showVoiceTest)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full px-4 py-2 shadow-lg border-2 border-blue-300 text-white hover:shadow-xl transition-all transform hover:scale-105 touch-manipulation"
                    >
                      <span className="text-sm font-bold">🎤</span>
                    </button>
                    <button
                      onClick={() => setShowWebSpeechTest(!showWebSpeechTest)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full px-4 py-2 shadow-lg border-2 border-green-300 text-white hover:shadow-xl transition-all transform hover:scale-105 touch-manipulation"
                    >
                      <span className="text-sm font-bold">🗣️</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Achievement System Overlay */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="kid-card-rainbow p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">🏆 Your Amazing Achievements! 🏆</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="kid-button-secondary px-6 py-3"
              >
                ✕ Close
              </button>
            </div>
            <AchievementSystem
              score={totalScore}
              totalQuestions={quizSession?.questions.length || 0}
              currentStreak={currentStreak}
              topicsCompleted={completedTopics}
              onAchievementUnlocked={handleAchievementUnlocked}
            />
          </div>
        </div>
      )}

      {/* Test Suite Overlay (Development Only) */}
      {showTestSuite && import.meta.env.DEV && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">🧪 Development Test Suite</h2>
              <button
                onClick={() => setShowTestSuite(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                ✕ Close
              </button>
            </div>
            <TestSuite />
          </div>
        </div>
      )}

      {/* Voice Test Overlay (Development Only) */}
      {showVoiceTest && import.meta.env.DEV && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">🎤 Voice Recognition Test</h2>
              <button
                onClick={() => setShowVoiceTest(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6">
              <VoiceTest />
            </div>
          </div>
        </div>
      )}

      {/* Web Speech Test Overlay (Development Only) */}
      {showWebSpeechTest && import.meta.env.DEV && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">🗣️ Web Speech API Test</h2>
              <button
                onClick={() => setShowWebSpeechTest(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6">
              <WebSpeechTest />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 md:py-8 pb-24 md:pb-32">
        {isLoading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="kid-card-rainbow p-10 max-w-sm w-full mx-4 text-center bounce-in">
              <div className="relative">
                <div className="animate-spin w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-pink-500 star-sparkle" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">🎨 Creating your magical quiz...</p>
              <p className="text-lg text-gray-600 mb-4">✨ This will only take a moment! ✨</p>

              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
              <p className="text-sm text-gray-500">Preparing amazing questions just for you...</p>
            </div>
          </div>
        )}

        {currentState === 'profile' && (
          <div className="slide-in-up">
            <ProfileCreation
              onProfileCreated={handleProfileCreated}
              voiceManager={voiceManager}
            />
          </div>
        )}

        {currentState === 'topic' && profile && (
          <div className="slide-in-right">
            <TopicSelection
              profile={profile}
              onTopicSelected={handleTopicSelected}
              voiceManager={voiceManager}
            />
          </div>
        )}

        {currentState === 'quiz' && quizSession && (
          <div className="fade-in">
            <QuizInterface
              session={quizSession}
              onQuizComplete={handleQuizComplete}
              onScoreUpdate={handleScoreUpdate}
              voiceManager={voiceManager}
            />
          </div>
        )}

        {currentState === 'results' && quizSession && (
          <div className="text-center space-y-8 slide-in-left">
            <div className="kid-card-rainbow p-10 bounce-in">
              {/* Celebration stars */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className="text-4xl star-sparkle">⭐</div>
                <div className="text-5xl star-sparkle" style={{animationDelay: '0.2s'}}>🌟</div>
                <div className="text-4xl star-sparkle" style={{animationDelay: '0.4s'}}>⭐</div>
              </div>

              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 celebration-bounce shadow-xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-4xl font-bold text-gray-800 mb-6">
                🎉 Amazing job, {profile?.name}! 🎉
              </h2>

              <div className="text-8xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text mb-6 celebration-bounce">
                {quizSession.score}/{quizSession.questions.length}
              </div>

              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-2xl p-6 mb-6 shadow-lg">
                <p className="text-2xl font-bold mb-2">
                  🏆 {Math.round((quizSession.score / quizSession.questions.length) * 100)}% Correct! 🏆
                </p>
                <p className="text-lg">
                  You're a {currentTopic} superstar! ⭐
                </p>
              </div>

              <p className="text-xl text-gray-700 mb-8">
                🎓 You learned so much about <span className="font-bold text-purple-600 bg-yellow-200 px-2 py-1 rounded-lg">{currentTopic}</span>! 🎓
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={handlePlayAgain}
                  className="kid-button-primary text-xl"
                >
                  <Brain className="w-6 h-6 inline mr-3" />
                  🚀 Play Again!
                </button>
                <button
                  onClick={handleNewProfile}
                  className="kid-button-secondary text-xl"
                >
                  <User className="w-6 h-6 inline mr-3" />
                  👤 New Friend
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mascot */}
      <Mascot
        mood={mascotState.mood}
        message={mascotState.message}
        position="bottom-right"
        size="medium"
      />
    </div>
  );
}

export default App;