import React, { useState } from 'react';
import { User, Heart, Sparkles, Star, Zap } from 'lucide-react';
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
  const [nameAnimation, setNameAnimation] = useState('');
  const [interestAnimation, setInterestAnimation] = useState<string>('');

  const handleInterestToggle = (interestName: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestName)
        ? prev.filter(i => i !== interestName)
        : [...prev, interestName]
    );

    // Add celebration animation for selection
    setInterestAnimation('bounce-gentle');
    setTimeout(() => setInterestAnimation(''), 600);
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
    <div className="max-w-2xl mx-auto relative">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 left-8 text-3xl star-sparkle">🌟</div>
        <div className="absolute top-12 right-12 text-2xl bubble-float">🎈</div>
        <div className="absolute bottom-20 left-4 text-4xl rotate-slow">✨</div>
        <div className="absolute bottom-8 right-8 text-3xl bounce-gentle">🎊</div>
      </div>

      <div className="kid-card-rainbow p-10 bounce-in relative">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden group">
            <User className="w-12 h-12 text-white celebration-bounce" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <div className="absolute -top-2 -right-2 text-2xl star-sparkle">⭐</div>
          </div>
          <h2 className="text-5xl font-bold rainbow-text mb-4">🌟 Let's Be Friends! 🌟</h2>
          <p className="text-xl text-gray-700 leading-relaxed">Tell me about yourself so I can make the most amazing quiz just for you! ✨</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Enhanced Name Input */}
          <div className="relative">
            <label htmlFor="name" className="block text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3 bounce-gentle">👋</span>
              What's your name, friend?
              <div className="ml-2 text-xl star-sparkle">✨</div>
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.length > 0) {
                    setNameAnimation('success-celebration');
                    setTimeout(() => setNameAnimation(''), 600);
                  }
                }}
                className={`w-full px-6 py-5 border-4 border-pink-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-xl font-medium bg-gradient-to-r from-white to-pink-50 shadow-lg interactive-hover ${nameAnimation}`}
                placeholder="Type your awesome name here! ✨"
                required
              />
              {name && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl heart-beat">
                  💖
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Age Selection */}
          <div className="relative">
            <label htmlFor="age" className="block text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3 rotate-slow">🎂</span>
              How old are you?
              <div className="ml-2 text-xl bubble-float">🎈</div>
            </label>
            <div className="relative">
              <select
                id="age"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-6 py-5 border-4 border-pink-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-xl font-medium bg-gradient-to-r from-white to-blue-50 shadow-lg interactive-hover appearance-none cursor-pointer"
              >
                {Array.from({ length: 10 }, (_, i) => i + 5).map(ageOption => (
                  <option key={ageOption} value={ageOption}>
                    {ageOption} years old 🎈
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none">
                <Zap className="w-6 h-6 text-purple-500 star-sparkle" />
              </div>
            </div>

            {/* Age celebration display */}
            <div className="mt-3 text-center">
              <span className="text-lg font-semibold text-purple-600 bg-purple-100 px-4 py-2 rounded-full border-2 border-purple-200 inline-flex items-center">
                <span className="mr-2">🎉</span>
                {age} years of awesome!
                <span className="ml-2">🎉</span>
              </span>
            </div>
          </div>

          {/* Enhanced Interests Selection */}
          <div className="relative">
            <label className="block text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
              <Heart className="w-8 h-8 mr-3 text-pink-500 heart-beat" />
              💖 What do you love? (Pick all your favorites!)
              <div className="ml-3 text-xl star-sparkle">✨</div>
            </label>

            {/* Selected interests counter */}
            {selectedInterests.length > 0 && (
              <div className="text-center mb-4">
                <span className="text-lg font-bold text-green-600 bg-green-100 px-4 py-2 rounded-full border-2 border-green-200 inline-flex items-center success-celebration">
                  <Star className="w-5 h-5 mr-2" />
                  {selectedInterests.length} awesome choice{selectedInterests.length !== 1 ? 's' : ''}!
                  <Star className="w-5 h-5 ml-2" />
                </span>
              </div>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-3 gap-5 ${interestAnimation}`}>
              {INTEREST_OPTIONS.map((interest, index) => (
                <button
                  key={interest.name}
                  type="button"
                  onClick={() => handleInterestToggle(interest.name)}
                  className={`p-5 rounded-2xl border-4 transition-all duration-300 transform shadow-lg text-lg font-semibold relative overflow-hidden group ${
                    selectedInterests.includes(interest.name)
                      ? 'border-purple-400 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 text-purple-700 scale-105 shadow-2xl glow-pulse'
                      : 'border-pink-200 bg-gradient-to-r from-white to-pink-50 text-gray-700 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 interactive-hover'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                  <div className="relative">
                    <div className={`text-3xl mb-2 ${selectedInterests.includes(interest.name) ? 'celebration-bounce' : 'bounce-gentle'}`}>
                      {interest.emoji}
                    </div>
                    <div className="font-bold">{interest.name}</div>

                    {/* Selection indicator */}
                    {selectedInterests.includes(interest.name) && (
                      <div className="absolute top-1 right-1 text-yellow-400 star-sparkle">⭐</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className={`kid-button-primary w-full text-2xl py-6 relative overflow-hidden group ${
                name.trim() && !isSubmitting
                  ? 'glow-pulse shadow-2xl'
                  : 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mr-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white star-sparkle" />
                    </div>
                  </div>
                  <span>✨ Creating your magical profile... ✨</span>
                  <div className="ml-4 text-2xl bounce-gentle">🎨</div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="w-8 h-8 mr-4 star-sparkle" />
                  <span>🚀 Let's Start the Adventure! 🚀</span>
                  <div className="ml-4 text-2xl celebration-bounce">🌟</div>

                  {/* Success indicator */}
                  {name.trim() && selectedInterests.length > 0 && (
                    <div className="absolute top-2 right-2 text-yellow-300 star-sparkle">⭐</div>
                  )}
                </div>
              )}

              {/* Animated background for enabled state */}
              {name.trim() && !isSubmitting && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
            </button>

            {/* Encouragement text */}
            {name.trim() && selectedInterests.length === 0 && (
              <div className="text-center mt-4">
                <span className="text-lg text-purple-600 font-semibold bg-purple-100 px-4 py-2 rounded-full border-2 border-purple-200 bounce-gentle">
                  💡 Pick some interests to make your quiz extra special! 💡
                </span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;