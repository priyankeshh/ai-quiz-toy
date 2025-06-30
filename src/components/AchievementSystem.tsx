import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Heart, Crown, Medal, Award } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementSystemProps {
  score: number;
  totalQuestions: number;
  currentStreak: number;
  topicsCompleted: string[];
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  score,
  totalQuestions,
  currentStreak,
  topicsCompleted,
  onAchievementUnlocked
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  const initializeAchievements = (): Achievement[] => [
    {
      id: 'first_quiz',
      name: 'Quiz Explorer',
      description: 'Complete your first quiz!',
      icon: <Star className="w-6 h-6" />,
      unlocked: false,
      progress: 0,
      maxProgress: 1,
      rarity: 'common'
    },
    {
      id: 'perfect_score',
      name: 'Perfect Star',
      description: 'Get 100% on a quiz!',
      icon: <Crown className="w-6 h-6" />,
      unlocked: false,
      progress: 0,
      maxProgress: 1,
      rarity: 'epic'
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Answer 3 questions correctly in a row!',
      icon: <Zap className="w-6 h-6" />,
      unlocked: false,
      progress: 0,
      maxProgress: 3,
      rarity: 'rare'
    },
    {
      id: 'topic_explorer',
      name: 'Topic Explorer',
      description: 'Complete quizzes on 3 different topics!',
      icon: <Target className="w-6 h-6" />,
      unlocked: false,
      progress: 0,
      maxProgress: 3,
      rarity: 'rare'
    },
    {
      id: 'learning_champion',
      name: 'Learning Champion',
      description: 'Complete 5 quizzes!',
      icon: <Trophy className="w-6 h-6" />,
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      rarity: 'epic'
    },
    {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Answer 50 questions correctly!',
      icon: <Medal className="w-6 h-6" />,
      unlocked: false,
      progress: 0,
      maxProgress: 50,
      rarity: 'legendary'
    }
  ];

  useEffect(() => {
    const storedAchievements = localStorage.getItem('quiz_achievements');
    if (storedAchievements) {
      setAchievements(JSON.parse(storedAchievements));
    } else {
      setAchievements(initializeAchievements());
    }
  }, []);

  useEffect(() => {
    if (achievements.length === 0) return;

    const updatedAchievements = achievements.map(achievement => {
      const newAchievement = { ...achievement };
      
      switch (achievement.id) {
        case 'first_quiz':
          if (totalQuestions > 0) {
            newAchievement.progress = 1;
            newAchievement.unlocked = true;
          }
          break;
        case 'perfect_score':
          if (score === totalQuestions && totalQuestions > 0) {
            newAchievement.progress = 1;
            newAchievement.unlocked = true;
          }
          break;
        case 'streak_master':
          newAchievement.progress = Math.min(currentStreak, 3);
          if (currentStreak >= 3) {
            newAchievement.unlocked = true;
          }
          break;
        case 'topic_explorer':
          newAchievement.progress = Math.min(topicsCompleted.length, 3);
          if (topicsCompleted.length >= 3) {
            newAchievement.unlocked = true;
          }
          break;
        case 'learning_champion':
          const quizzesCompleted = Math.floor(score / 4); // Assuming 4 questions per quiz
          newAchievement.progress = Math.min(quizzesCompleted, 5);
          if (quizzesCompleted >= 5) {
            newAchievement.unlocked = true;
          }
          break;
        case 'knowledge_seeker':
          newAchievement.progress = Math.min(score, 50);
          if (score >= 50) {
            newAchievement.unlocked = true;
          }
          break;
      }

      // Check if newly unlocked
      if (newAchievement.unlocked && !achievement.unlocked) {
        setNewlyUnlocked(prev => [...prev, newAchievement]);
        if (onAchievementUnlocked) {
          onAchievementUnlocked(newAchievement);
        }
      }

      return newAchievement;
    });

    setAchievements(updatedAchievements);
    localStorage.setItem('quiz_achievements', JSON.stringify(updatedAchievements));
  }, [score, totalQuestions, currentStreak, topicsCompleted]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Achievement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map(achievement => (
          <div
            key={achievement.id}
            className={`p-4 rounded-2xl border-4 transition-all duration-300 ${
              achievement.unlocked
                ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white shadow-lg transform hover:scale-105`
                : `bg-gray-100 border-gray-200 text-gray-500`
            } ${getRarityBorder(achievement.rarity)}`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                achievement.unlocked ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {achievement.icon}
              </div>
              <h4 className="font-bold text-sm mb-1">{achievement.name}</h4>
              <p className="text-xs opacity-80 mb-2">{achievement.description}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 opacity-80">
                {achievement.progress}/{achievement.maxProgress}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Newly Unlocked Achievements Popup */}
      {newlyUnlocked.map(achievement => (
        <div
          key={`popup-${achievement.id}`}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bounce-in"
          onAnimationEnd={() => {
            setTimeout(() => {
              setNewlyUnlocked(prev => prev.filter(a => a.id !== achievement.id));
            }, 3000);
          }}
        >
          <div className={`p-8 rounded-3xl border-4 bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white shadow-2xl text-center max-w-sm`}>
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Achievement Unlocked!</h3>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {achievement.icon}
            </div>
            <h4 className="text-xl font-bold mb-2">{achievement.name}</h4>
            <p className="opacity-90">{achievement.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AchievementSystem;
