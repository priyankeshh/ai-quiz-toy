import React, { useState, useEffect } from 'react';
import { Sparkles, User, Brain, Trophy } from 'lucide-react';
import ProfileCreation from './components/ProfileCreation';
import TopicSelection from './components/TopicSelection';
import QuizInterface from './components/QuizInterface';
import VoiceManager from './components/VoiceManager';

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

function App() {
  const [currentState, setCurrentState] = useState<AppState>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize voice manager
  const voiceManager = new VoiceManager();

  useEffect(() => {
    // Welcome message when app loads
    voiceManager.speak("Welcome to the AI Quiz Toy! Let's start by creating your profile.");
  }, []);

  const handleProfileCreated = (newProfile: Profile) => {
    setProfile(newProfile);
    setCurrentState('topic');
    voiceManager.speak(`Great to meet you, ${newProfile.name}! Now let's choose a topic for your quiz.`);
  };

  const handleTopicSelected = async (topic: string) => {
    if (!profile) return;
    
    setCurrentTopic(topic);
    setIsLoading(true);
    voiceManager.speak(`Excellent choice! I'm creating a fun quiz about ${topic} just for you. This will only take a moment.`);

    try {
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

      const data = await response.json();
      
      if (data.success) {
        // Fetch the session data
        const sessionResponse = await fetch(`http://localhost:5000/api/quiz/session/${data.session_id}`);
        const sessionData = await sessionResponse.json();
        
        if (sessionData.success) {
          setQuizSession(sessionData.session);
          setCurrentState('quiz');
          voiceManager.speak(`Your quiz is ready! Let's begin with the first question.`);
        }
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      voiceManager.speak("I'm sorry, there was a problem creating your quiz. Let's try a different topic.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (finalScore: number, totalQuestions: number) => {
    setCurrentState('results');
    const percentage = Math.round((finalScore / totalQuestions) * 100);
    voiceManager.speak(`Congratulations! You completed the quiz with ${finalScore} out of ${totalQuestions} correct answers. That's ${percentage} percent! You did amazing!`);
  };

  const handlePlayAgain = () => {
    setCurrentState('topic');
    setQuizSession(null);
    setCurrentTopic('');
    voiceManager.speak("Let's choose a new topic for another fun quiz!");
  };

  const handleNewProfile = () => {
    setCurrentState('profile');
    setProfile(null);
    setQuizSession(null);
    setCurrentTopic('');
    voiceManager.speak("Let's create a new profile and start fresh!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Quiz Toy
              </h1>
            </div>
            
            {profile && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">{profile.name}</span>
                </div>
                {quizSession && (
                  <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2">
                    <Trophy className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Score: {quizSession.score}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Creating your quiz...</p>
              <p className="text-sm text-gray-500 mt-2">This will only take a moment!</p>
            </div>
          </div>
        )}

        {currentState === 'profile' && (
          <ProfileCreation 
            onProfileCreated={handleProfileCreated}
            voiceManager={voiceManager}
          />
        )}

        {currentState === 'topic' && profile && (
          <TopicSelection 
            profile={profile}
            onTopicSelected={handleTopicSelected}
            voiceManager={voiceManager}
          />
        )}

        {currentState === 'quiz' && quizSession && (
          <QuizInterface 
            session={quizSession}
            onQuizComplete={handleQuizComplete}
            voiceManager={voiceManager}
          />
        )}

        {currentState === 'results' && quizSession && (
          <div className="text-center space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Congratulations, {profile?.name}! 🎉
              </h2>
              
              <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-4">
                {quizSession.score}/{quizSession.questions.length}
              </div>
              
              <p className="text-xl text-gray-600 mb-6">
                You got {Math.round((quizSession.score / quizSession.questions.length) * 100)}% correct!
              </p>
              
              <p className="text-lg text-gray-700 mb-8">
                Great job learning about <span className="font-semibold text-purple-600">{currentTopic}</span>!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handlePlayAgain}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Brain className="w-5 h-5 inline mr-2" />
                  Play Again
                </button>
                <button
                  onClick={handleNewProfile}
                  className="px-8 py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <User className="w-5 h-5 inline mr-2" />
                  New Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;