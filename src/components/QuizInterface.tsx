import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { QuizSession } from '../App';
import VoiceManager from './VoiceManager';

interface QuizInterfaceProps {
  session: QuizSession;
  onQuizComplete: (finalScore: number, totalQuestions: number) => void;
  voiceManager: VoiceManager;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ session: initialSession, onQuizComplete, voiceManager }) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const currentQuestion = session.questions[session.current_question];

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      voiceManager.speak("Voice recognition is not supported. Please click your answer instead.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      voiceManager.speak("I'm listening for your answer. You can say A, B, C, or D, or speak the full answer.");
    };

    recognition.onresult = (event) => {
      const spokenAnswer = event.results[0][0].transcript.toLowerCase();
      
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

    recognition.onerror = () => {
      voiceManager.speak("I didn't catch that. Please try speaking again or click your answer.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
        setSession(prev => ({
          ...prev,
          score: data.current_score,
          current_question: prev.current_question + 1,
        }));

        // Speak feedback
        const feedbackText = data.is_correct 
          ? `Correct! ${data.explanation}` 
          : `Not quite right. ${data.explanation}`;
        voiceManager.speak(feedbackText);

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
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {session.current_question + 1} of {session.questions.length}
          </span>
          <span className="text-sm font-medium text-gray-600">
            Score: {session.score}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((session.current_question + 1) / session.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        {!showFeedback ? (
          <>
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex-1">
                  {currentQuestion.question}
                </h2>
                <button
                  onClick={readQuestionAloud}
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Read question aloud"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedAnswer === index
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200'
                  }`}
                >
                  <span className="font-medium text-purple-600 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  isListening
                    ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                    : 'border-blue-200 bg-white text-blue-600 hover:border-blue-400'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isListening ? 'Stop Listening' : 'Speak Answer'}</span>
              </button>

              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null || isSubmitting}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Feedback */
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              currentFeedback?.isCorrect 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {currentFeedback?.isCorrect ? (
                <CheckCircle className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12" />
              )}
            </div>

            <h3 className={`text-3xl font-bold ${
              currentFeedback?.isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentFeedback?.isCorrect ? 'Correct!' : 'Not quite right!'}
            </h3>

            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              {currentFeedback?.explanation}
            </p>

            <div className="pt-4">
              {session.current_question < session.questions.length ? (
                <button
                  onClick={nextQuestion}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Next Question
                  <ArrowRight className="w-5 h-5 inline ml-2" />
                </button>
              ) : (
                <div className="text-gray-600">
                  <p className="text-lg mb-4">Quiz Complete!</p>
                  <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
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