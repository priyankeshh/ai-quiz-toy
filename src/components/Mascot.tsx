import React, { useState, useEffect } from 'react';

interface MascotProps {
  mood: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'encouraging';
  message?: string;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'medium' | 'large';
}

const Mascot: React.FC<MascotProps> = ({ 
  mood, 
  message, 
  position = 'bottom-right', 
  size = 'medium' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAnimation, setCurrentAnimation] = useState('bounce-in');

  useEffect(() => {
    // Change animation based on mood
    switch (mood) {
      case 'excited':
        setCurrentAnimation('wiggle');
        break;
      case 'celebrating':
        setCurrentAnimation('celebration-bounce');
        break;
      case 'thinking':
        setCurrentAnimation('float');
        break;
      default:
        setCurrentAnimation('bounce-in');
    }
  }, [mood]);

  const getMascotEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'thinking': return '🤔';
      case 'celebrating': return '🎉';
      case 'encouraging': return '💪';
      default: return '😊';
    }
  };

  const getMascotSize = () => {
    switch (size) {
      case 'small': return 'w-16 h-16 text-4xl';
      case 'medium': return 'w-20 h-20 text-5xl';
      case 'large': return 'w-32 h-32 text-8xl';
      default: return 'w-20 h-20 text-5xl';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'fixed bottom-4 left-4 md:bottom-8 md:left-8 z-40';
      case 'center':
        return 'mx-auto';
      case 'bottom-right':
      default:
        return 'fixed bottom-4 right-4 md:bottom-8 md:right-8 z-40';
    }
  };

  const getMoodMessage = () => {
    if (message) return message;
    
    switch (mood) {
      case 'happy':
        return "Hi there! I'm Quizzy, your learning buddy! 🌟";
      case 'excited':
        return "Wow! This is going to be so much fun! 🚀";
      case 'thinking':
        return "Hmm... take your time to think about it! 💭";
      case 'celebrating':
        return "Amazing work! You're doing fantastic! 🎊";
      case 'encouraging':
        return "Don't worry, you've got this! Keep trying! 💪";
      default:
        return "Let's learn something awesome together! ✨";
    }
  };

  if (!isVisible) return null;

  return (
    <div className={getPositionClasses()}>
      {/* Mascot Character */}
      <div className={`${getMascotSize()} bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${currentAnimation} cursor-pointer hover:scale-110 transition-transform`}>
        <span className="select-none">{getMascotEmoji()}</span>
      </div>
      
      {/* Speech Bubble */}
      {message && (
        <div className="absolute bottom-full right-0 mb-4 max-w-xs md:max-w-sm">
          <div className="bg-white rounded-2xl p-3 md:p-4 shadow-xl border-4 border-pink-200 relative">
            <p className="text-xs md:text-sm font-semibold text-gray-800">{getMoodMessage()}</p>
            {/* Speech bubble tail */}
            <div className="absolute top-full right-6 w-0 h-0 border-l-6 border-r-6 border-t-6 md:border-l-8 md:border-r-8 md:border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 md:border-l-6 md:border-r-6 md:border-t-6 border-l-transparent border-r-transparent border-t-pink-200 mt-1"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mascot states for different app sections
export const MascotStates = {
  WELCOME: { mood: 'happy' as const, message: "Welcome to Quiz Adventure! Let's create your profile!" },
  TOPIC_SELECTION: { mood: 'excited' as const, message: "What amazing topic should we explore today?" },
  QUIZ_START: { mood: 'excited' as const, message: "Here we go! You're going to do great!" },
  THINKING: { mood: 'thinking' as const, message: "Take your time... I know you can figure this out!" },
  CORRECT_ANSWER: { mood: 'celebrating' as const, message: "Yes! That's absolutely right! You're so smart!" },
  WRONG_ANSWER: { mood: 'encouraging' as const, message: "That's okay! Every mistake helps us learn!" },
  QUIZ_COMPLETE: { mood: 'celebrating' as const, message: "Wow! You completed the whole quiz! I'm so proud!" },
  ACHIEVEMENT: { mood: 'celebrating' as const, message: "You unlocked an achievement! You're amazing!" }
};

export default Mascot;
