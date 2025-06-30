import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, CheckCircle, XCircle, ArrowRight, Star, Zap, Heart } from 'lucide-react';
import { QuizSession } from '../App';
import VoiceManager from './VoiceManager';
import SpeechInput from './SpeechInput';

interface QuizInterfaceProps {
  session: QuizSession;
  onQuizComplete: (finalScore: number, totalQuestions: number) => void;
  onScoreUpdate: (currentScore: number, currentQuestion: number) => void;
  voiceManager: VoiceManager;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ session: initialSession, onQuizComplete, onScoreUpdate, voiceManager }) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const currentQuestion = session.questions[session.current_question];

  const handleSpeechResult = (transcript: string) => {
    const spokenAnswer = transcript.toLowerCase();

    // Try to match spoken answer to options
    let answerIndex = -1;

    // Check for letter answers (A, B, C, D)
    if (spokenAnswer.includes('a') || spokenAnswer.includes('option a')) answerIndex = 0;
    else if (spokenAnswer.includes('b') || spokenAnswer.includes('option b')) answerIndex = 1;
    else if (spokenAnswer.includes('c') || spokenAnswer.includes('option c')) answerIndex = 2;
    else if (spokenAnswer.includes('d') || spokenAnswer.includes('option d')) answerIndex = 3;
    else {
      // Try to match full answer text
      currentQuestion.options.forEach((option, index) => {
        if (spokenAnswer.includes(option.toLowerCase())) {
          answerIndex = index;
        }
      });
    }

    if (answerIndex !== -1) {
      setSelectedAnswer(answerIndex);
      voiceManager.speak(`You chose ${String.fromCharCode(65 + answerIndex)}: ${currentQuestion.options[answerIndex]}`);
    } else {
      voiceManager.speak("I didn't understand that answer. Please try again or click your choice.");
    }
  };

  const handleSpeechError = (error: string) => {
    console.error('Speech error:', error);
    voiceManager.speak("I didn't catch that. Please try speaking again or click your answer.");
  };

  const handleSpeechStart = () => {
    setIsListening(true);
    voiceManager.speak("I'm listening for your answer. You can say A, B, C, or D, or speak the full answer.");
  };

  const handleSpeechEnd = () => {
    setIsListening(false);
  };

  const readQuestionAloud = () => {
    const questionText = `Question ${session.current_question + 1}: ${currentQuestion.question}`;
    const optionsText = currentQuestion.options
      .map((option, index) => `${String.fromCharCode(65 + index)}: ${option}`)
      .join('. ');
    
    voiceManager.speak(`${questionText}. Your options are: ${optionsText}`);
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.id,
          answer_index: selectedAnswer,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentFeedback({
          isCorrect: data.is_correct,
          explanation: data.explanation,
        });
        setShowFeedback(true);

        // Update session state
        const newScore = data.current_score;
        const newQuestionIndex = session.current_question + 1;

        setSession(prev => ({
          ...prev,
          score: newScore,
          current_question: newQuestionIndex,
        }));

        // Update parent component state to keep header score in sync
        onScoreUpdate(newScore, newQuestionIndex);

        // Speak feedback with enhanced emotion
        if (data.is_correct) {
          voiceManager.speakCorrectAnswer(data.explanation);
        } else {
          voiceManager.speakIncorrectAnswer(data.explanation);
        }

        // Check if quiz is complete
        if (data.is_quiz_complete) {
          setTimeout(() => {
            onQuizComplete(data.final_score, data.total_questions);
          }, 3000); // Give time for feedback to be read
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      voiceManager.speak("There was a problem submitting your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCurrentFeedback(null);
    
    // Read next question
    setTimeout(() => {
      if (session.current_question < session.questions.length) {
        readQuestionAloud();
      }
    }, 500);
  };

  // Read question when component mounts or question changes
  React.useEffect(() => {
    if (currentQuestion && !showFeedback) {
      setTimeout(() => readQuestionAloud(), 1000);
    }
  }, [session.current_question, showFeedback]);

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-gray-800 bg-blue-100 px-4 py-2 rounded-2xl border-2 border-blue-200">
            📝 Question {session.current_question + 1} of {session.questions.length}
          </span>
          <span className="text-xl font-bold text-gray-800 bg-yellow-100 px-4 py-2 rounded-2xl border-2 border-yellow-200">
            ⭐ Score: {session.score} points!
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner border-2 border-gray-300">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-6 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
            style={{ width: `${((session.current_question + 1) / session.questions.length) * 100}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-lg font-semibold text-gray-700">
            🚀 {Math.round(((session.current_question + 1) / session.questions.length) * 100)}% Complete!
          </span>
        </div>
      </div>

      <div className="kid-card-rainbow p-10">
        {!showFeedback ? (
          <>
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex-1 leading-relaxed">
                  🤔 {currentQuestion.question}
                </h2>
                <button
                  onClick={readQuestionAloud}
                  className="ml-4 p-4 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all transform hover:scale-105 shadow-lg border-2 border-blue-200"
                  title="🔊 Hear the question again!"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-5 mb-10">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-6 text-left rounded-2xl border-4 transition-all duration-200 transform hover:scale-105 shadow-lg text-xl font-semibold ${
                    selectedAnswer === index
                      ? 'border-purple-400 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 wiggle shadow-xl'
                      : 'border-pink-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 bg-purple-500 text-white rounded-full font-bold text-lg mr-4">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <SpeechInput
                onResult={handleSpeechResult}
                onError={handleSpeechError}
                onStart={handleSpeechStart}
                onEnd={handleSpeechEnd}
                className={`flex items-center space-x-3 px-8 py-4 rounded-2xl border-4 transition-all transform hover:scale-105 shadow-lg text-lg font-semibold ${
                  isListening
                    ? 'border-red-400 bg-red-100 text-red-600 animate-pulse'
                    : 'border-blue-300 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                <span>{isListening ? '🛑 Stop Listening' : '🎤 Speak Your Answer'}</span>
              </SpeechInput>

              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null || isSubmitting}
                className="kid-button-primary text-xl py-4 px-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full mr-3"></div>
                    <span>✨ Checking your answer... ✨</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Submit My Answer!</span>
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Feedback */
          <div className="text-center space-y-8 bounce-in">
            {/* Celebration stars for correct answers */}
            {currentFeedback?.isCorrect && (
              <div className="flex justify-center space-x-4 mb-4">
                <div className="text-4xl star-sparkle">⭐</div>
                <div className="text-5xl star-sparkle" style={{animationDelay: '0.2s'}}>🌟</div>
                <div className="text-4xl star-sparkle" style={{animationDelay: '0.4s'}}>⭐</div>
              </div>
            )}

            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-xl celebration-bounce ${
              currentFeedback?.isCorrect
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-orange-400 to-red-400 text-white'
            }`}>
              {currentFeedback?.isCorrect ? (
                <CheckCircle className="w-16 h-16" />
              ) : (
                <XCircle className="w-16 h-16" />
              )}
            </div>

            <h3 className={`text-5xl font-bold ${
              currentFeedback?.isCorrect ? 'text-green-600' : 'text-orange-600'
            }`}>
              {currentFeedback?.isCorrect ? '🎉 Awesome! 🎉' : '💪 Good try! 💪'}
            </h3>

            <div className={`p-6 rounded-2xl border-4 max-w-2xl mx-auto ${
              currentFeedback?.isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <p className="text-xl text-gray-800 font-medium">
                {currentFeedback?.explanation}
              </p>
            </div>

            <div className="pt-6">
              {session.current_question < session.questions.length ? (
                <button
                  onClick={nextQuestion}
                  className="kid-button-primary text-2xl py-5 px-12"
                >
                  🚀 Next Adventure!
                  <ArrowRight className="w-6 h-6 inline ml-3" />
                </button>
              ) : (
                <div className="text-gray-700">
                  <p className="text-2xl font-bold mb-6">🎊 Quiz Complete! 🎊</p>
                  <div className="flex justify-center items-center space-x-3">
                    <div className="animate-spin w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
                    <span className="text-xl font-semibold">Calculating your amazing results...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizInterface;