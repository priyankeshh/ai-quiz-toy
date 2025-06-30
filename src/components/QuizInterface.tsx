import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, CheckCircle, XCircle, ArrowRight, Star, Zap, Heart } from 'lucide-react';
import { QuizSession } from '../App';
import VoiceManager from './VoiceManager';
import SpeechInput from './SpeechInput';
import Fireworks from './Fireworks';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [answerAnimation, setAnswerAnimation] = useState<string>('');
  const [questionAnimation, setQuestionAnimation] = useState('slide-in-right');
  const confettiRef = useRef<HTMLDivElement>(null);

  const currentQuestion = session.questions[session.current_question];

  // Confetti Component
  const ConfettiPiece: React.FC<{ delay: number; color: string }> = ({ delay, color }) => (
    <div
      className={`absolute w-3 h-3 ${color} confetti-burst`}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${delay}ms`,
      }}
    />
  );

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

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
      setAnswerAnimation('bounce-gentle');
      voiceManager.speak(`You chose ${String.fromCharCode(65 + answerIndex)}: ${currentQuestion.options[answerIndex]}`);
      setTimeout(() => setAnswerAnimation(''), 1000);
    } else {
      setAnswerAnimation('error-shake');
      voiceManager.speak("I didn't understand that answer. Please try again or click your choice.");
      setTimeout(() => setAnswerAnimation(''), 500);
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

        // Speak feedback with enhanced emotion and trigger celebrations
        if (data.is_correct) {
          triggerConfetti();
          setShowFireworks(true);
          setAnswerAnimation('success-celebration');
          voiceManager.speakCorrectAnswer(data.explanation);
        } else {
          setAnswerAnimation('shake-celebration');
          voiceManager.speakIncorrectAnswer(data.explanation);
        }
        setTimeout(() => setAnswerAnimation(''), 1200);

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
    setQuestionAnimation('slide-bounce');

    // Read next question
    setTimeout(() => {
      if (session.current_question < session.questions.length) {
        readQuestionAloud();
      }
      setQuestionAnimation('');
    }, 600);
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
    <div className="max-w-4xl mx-auto relative">
      {/* Fireworks for correct answers */}
      <Fireworks
        show={showFireworks}
        duration={2000}
        onComplete={() => setShowFireworks(false)}
      />

      {/* Enhanced Progress Bar */}
      <div className="mb-8 relative">
        {/* Confetti Container */}
        {showConfetti && (
          <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiPiece
                key={i}
                delay={i * 100}
                color={['bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][i % 5]}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-3 rounded-2xl border-2 border-blue-200 shadow-lg interactive-hover magic-sparkle">
            📝 Question {session.current_question + 1} of {session.questions.length}
          </span>
          <span className={`text-xl font-bold text-gray-800 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-2xl border-2 border-yellow-200 shadow-lg ${answerAnimation} heart-beat`}>
            ⭐ Score: {session.score} points!
          </span>
        </div>

        <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-8 shadow-inner border-2 border-gray-300 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-8 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden glow-pulse"
            style={{ width: `${((session.current_question + 1) / session.questions.length) * 100}%` }}
          >
            <div className="absolute inset-0 bg-white/30 particle-trail"></div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Star className="w-4 h-4 text-white star-sparkle" />
            </div>
          </div>
        </div>

        <div className="text-center mt-3">
          <span className="text-xl font-bold rainbow-text">
            🚀 {Math.round(((session.current_question + 1) / session.questions.length) * 100)}% Complete! 🚀
          </span>
        </div>
      </div>

      <div className={`kid-card-rainbow p-10 ${questionAnimation}`}>
        {!showFeedback ? (
          <>
            {/* Enhanced Question Display */}
            <div className="mb-8 relative">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex-1 leading-relaxed relative">
                  <span className="inline-block mr-3 text-4xl bounce-gentle">🤔</span>
                  <span className="rainbow-text">{currentQuestion.question}</span>
                  <div className="absolute -top-2 -right-2 text-2xl rotate-slow">✨</div>
                </h2>
                <button
                  onClick={readQuestionAloud}
                  className="ml-4 p-4 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all transform hover:scale-110 shadow-lg border-2 border-blue-200 interactive-hover glow-pulse"
                  title="🔊 Hear the question again!"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              {/* Floating decorative elements around question */}
              <div className="absolute -top-4 left-4 text-2xl bubble-float opacity-60">🌟</div>
              <div className="absolute -bottom-2 right-8 text-xl bubble-float opacity-50" style={{animationDelay: '1s'}}>💫</div>
            </div>

            {/* Enhanced Answer Options */}
            <div className="space-y-6 mb-10">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAnswer(index);
                    setAnswerAnimation('bounce-gentle');
                    setTimeout(() => setAnswerAnimation(''), 600);
                  }}
                  className={`w-full p-6 text-left rounded-2xl border-4 transition-all duration-300 transform shadow-lg text-xl font-semibold relative overflow-hidden group ${
                    selectedAnswer === index
                      ? 'border-purple-400 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 text-purple-700 scale-105 shadow-2xl glow-pulse'
                      : 'border-pink-200 bg-gradient-to-r from-white to-pink-50 text-gray-700 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 interactive-hover'
                  } ${selectedAnswer === index ? answerAnimation : ''}`}
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                  <div className="relative flex items-center">
                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg mr-4 transition-all duration-300 ${
                      selectedAnswer === index
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110 heart-beat'
                        : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white group-hover:scale-110'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {selectedAnswer === index && (
                      <div className="ml-4 text-2xl">
                        <Heart className="w-6 h-6 text-pink-500 heart-beat" />
                      </div>
                    )}
                  </div>

                  {/* Sparkle effect for selected answer */}
                  {selectedAnswer === index && (
                    <div className="absolute top-2 right-2 text-yellow-400 star-sparkle">✨</div>
                  )}
                </button>
              ))}
            </div>

            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <SpeechInput
                onResult={handleSpeechResult}
                onError={handleSpeechError}
                onStart={handleSpeechStart}
                onEnd={handleSpeechEnd}
                className={`flex items-center space-x-3 px-8 py-4 rounded-2xl border-4 transition-all transform shadow-lg text-lg font-semibold relative overflow-hidden ${
                  isListening
                    ? 'border-red-400 bg-gradient-to-r from-red-100 to-pink-100 text-red-600 glow-pulse scale-105'
                    : 'border-blue-300 bg-gradient-to-r from-white to-blue-50 text-blue-600 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 interactive-hover'
                }`}
              >
                <div className="relative">
                  {isListening ? (
                    <MicOff className="w-6 h-6 shake-celebration" />
                  ) : (
                    <Mic className="w-6 h-6 bounce-gentle" />
                  )}
                  {isListening && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span>{isListening ? '🛑 Stop Listening' : '🎤 Speak Your Answer'}</span>
                {isListening && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                )}
              </SpeechInput>

              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null || isSubmitting}
                className={`kid-button-primary text-xl py-4 px-10 relative overflow-hidden ${
                  selectedAnswer !== null && !isSubmitting
                    ? 'glow-pulse scale-105 shadow-2xl'
                    : 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full mr-3"></div>
                    <span>✨ Checking your answer... ✨</span>
                    <Zap className="w-5 h-5 ml-2 text-yellow-300 star-sparkle" />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>🚀 Submit My Answer!</span>
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    {selectedAnswer !== null && (
                      <div className="absolute top-1 right-1 text-yellow-300 star-sparkle">⭐</div>
                    )}
                  </div>
                )}

                {/* Animated background for enabled state */}
                {selectedAnswer !== null && !isSubmitting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Enhanced Feedback */
          <div className="text-center space-y-8 bounce-in relative">
            {/* Enhanced celebration effects */}
            {currentFeedback?.isCorrect && (
              <>
                {/* Floating celebration elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-4 left-1/4 text-3xl star-sparkle">🎊</div>
                  <div className="absolute top-8 right-1/4 text-2xl bubble-float">🎈</div>
                  <div className="absolute bottom-1/3 left-1/6 text-4xl rotate-slow">🌟</div>
                  <div className="absolute bottom-1/4 right-1/6 text-3xl bounce-gentle">🎉</div>
                </div>

                {/* Main celebration stars */}
                <div className="flex justify-center space-x-6 mb-6">
                  <div className="text-5xl star-sparkle">⭐</div>
                  <div className="text-6xl star-sparkle zoom-in-out" style={{animationDelay: '0.2s'}}>🌟</div>
                  <div className="text-5xl star-sparkle" style={{animationDelay: '0.4s'}}>⭐</div>
                </div>
              </>
            )}

            {/* Encouraging elements for incorrect answers */}
            {!currentFeedback?.isCorrect && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-6 left-1/3 text-3xl bounce-gentle">💪</div>
                <div className="absolute top-10 right-1/3 text-2xl heart-beat">❤️</div>
                <div className="absolute bottom-1/3 left-1/5 text-3xl bubble-float">🌈</div>
                <div className="absolute bottom-1/4 right-1/5 text-2xl star-sparkle">✨</div>
              </div>
            )}

            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden ${
              currentFeedback?.isCorrect
                ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white celebration-bounce glow-pulse'
                : 'bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 text-white shake-celebration'
            }`}>
              {currentFeedback?.isCorrect ? (
                <CheckCircle className="w-20 h-20 success-celebration" />
              ) : (
                <XCircle className="w-20 h-20 heart-beat" />
              )}

              {/* Animated ring effect */}
              <div className={`absolute inset-0 rounded-full border-4 ${
                currentFeedback?.isCorrect ? 'border-green-300' : 'border-orange-300'
              } animate-ping opacity-30`}></div>
            </div>

            <h3 className={`text-6xl font-bold rainbow-text ${
              currentFeedback?.isCorrect ? 'success-celebration' : 'bounce-gentle'
            }`}>
              {currentFeedback?.isCorrect ? '🎉 Awesome! 🎉' : '💪 Good try! 💪'}
            </h3>

            <div className={`p-8 rounded-3xl border-4 max-w-2xl mx-auto shadow-xl relative overflow-hidden ${
              currentFeedback?.isCorrect
                ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-green-200'
                : 'bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-orange-200'
            }`}>
              <p className="text-2xl text-gray-800 font-semibold leading-relaxed">
                {currentFeedback?.explanation}
              </p>

              {/* Decorative elements */}
              <div className="absolute top-2 right-2 text-2xl star-sparkle">
                {currentFeedback?.isCorrect ? '🏆' : '🌟'}
              </div>
            </div>

            <div className="pt-8">
              {session.current_question < session.questions.length ? (
                <button
                  onClick={nextQuestion}
                  className="kid-button-primary text-2xl py-6 px-16 relative overflow-hidden group glow-pulse"
                >
                  <div className="flex items-center">
                    <span>🚀 Next Adventure!</span>
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                    <div className="absolute top-1 right-1 text-yellow-300 star-sparkle">⭐</div>
                  </div>

                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              ) : (
                <div className="text-gray-700 space-y-6">
                  <div className="flex justify-center space-x-4 mb-4">
                    <div className="text-4xl star-sparkle">🎊</div>
                    <div className="text-5xl celebration-bounce">🏆</div>
                    <div className="text-4xl star-sparkle" style={{animationDelay: '0.3s'}}>🎊</div>
                  </div>

                  <p className="text-3xl font-bold rainbow-text mb-6">🎊 Quiz Complete! 🎊</p>

                  <div className="flex justify-center items-center space-x-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="relative">
                      <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Star className="w-6 h-6 text-purple-600 star-sparkle" />
                      </div>
                    </div>
                    <span className="text-xl font-bold text-purple-700">Calculating your amazing results...</span>
                    <div className="text-2xl bounce-gentle">✨</div>
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