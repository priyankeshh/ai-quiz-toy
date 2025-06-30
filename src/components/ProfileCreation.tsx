import React, { useState } from 'react';
import { User, Heart, Sparkles } from 'lucide-react';
import { Profile } from '../App';
import VoiceManager from './VoiceManager';

interface ProfileCreationProps {
  onProfileCreated: (profile: Profile) => void;
  voiceManager: VoiceManager;
}

const INTEREST_OPTIONS = [
  { name: 'Animals', emoji: '🐾' },
  { name: 'Space', emoji: '🚀' },
  { name: 'Science', emoji: '🔬' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Art', emoji: '🎨' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Nature', emoji: '🌿' },
  { name: 'Cars', emoji: '🚗' },
  { name: 'Dinosaurs', emoji: '🦕' },
  { name: 'Cooking', emoji: '👨‍🍳' },
  { name: 'Books', emoji: '📚' },
  { name: 'Games', emoji: '🎮' }
];

const ProfileCreation: React.FC<ProfileCreationProps> = ({ onProfileCreated, voiceManager }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(8);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInterestToggle = (interestName: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestName)
        ? prev.filter(i => i !== interestName)
        : [...prev, interestName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          age: age,
          interests: selectedInterests,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onProfileCreated(data.profile);
      } else {
        throw new Error(data.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      voiceManager.speak("I'm sorry, there was a problem creating your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="kid-card-rainbow p-10 bounce-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 wiggle shadow-xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">🌟 Let's Be Friends! 🌟</h2>
          <p className="text-xl text-gray-700">Tell me about yourself so I can make the most amazing quiz just for you! ✨</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-xl font-bold text-gray-800 mb-3">
              👋 What's your name, friend?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 border-4 border-pink-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-xl font-medium bg-white/80 shadow-lg"
              placeholder="Type your awesome name here! ✨"
              required
            />
          </div>

          {/* Age Input */}
          <div>
            <label htmlFor="age" className="block text-xl font-bold text-gray-800 mb-3">
              🎂 How old are you?
            </label>
            <select
              id="age"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-6 py-4 border-4 border-pink-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-xl font-medium bg-white/80 shadow-lg"
            >
              {Array.from({ length: 10 }, (_, i) => i + 5).map(ageOption => (
                <option key={ageOption} value={ageOption}>
                  {ageOption} years old 🎈
                </option>
              ))}
            </select>
          </div>

          {/* Interests Selection */}
          <div>
            <label className="block text-xl font-bold text-gray-800 mb-4">
              <Heart className="w-6 h-6 inline mr-2 text-pink-500" />
              💖 What do you love? (Pick all your favorites!)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest.name}
                  type="button"
                  onClick={() => handleInterestToggle(interest.name)}
                  className={`p-4 rounded-2xl border-4 transition-all duration-200 transform hover:scale-105 text-lg font-semibold shadow-lg ${
                    selectedInterests.includes(interest.name)
                      ? 'border-purple-400 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 wiggle'
                      : 'border-pink-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="text-2xl mb-1">{interest.emoji}</div>
                  {interest.name}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="kid-button-primary w-full text-2xl py-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full mr-3"></div>
                  ✨ Creating your magical profile... ✨
                </div>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 inline mr-3" />
                  🚀 Let's Start the Adventure! 🚀
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;