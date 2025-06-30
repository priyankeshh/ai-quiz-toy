import React, { useState } from 'react';
import { User, Heart, Sparkles } from 'lucide-react';
import { Profile } from '../App';
import VoiceManager from './VoiceManager';

interface ProfileCreationProps {
  onProfileCreated: (profile: Profile) => void;
  voiceManager: VoiceManager;
}

const INTEREST_OPTIONS = [
  'Animals', 'Space', 'Science', 'Sports', 'Art', 'Music', 
  'Nature', 'Cars', 'Dinosaurs', 'Cooking', 'Books', 'Games'
];

const ProfileCreation: React.FC<ProfileCreationProps> = ({ onProfileCreated, voiceManager }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(8);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Let's Get Started!</h2>
          <p className="text-gray-600">Tell me a little about yourself so I can create the perfect quiz for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
              What's your name?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-lg"
              placeholder="Enter your name here"
              required
            />
          </div>

          {/* Age Input */}
          <div>
            <label htmlFor="age" className="block text-lg font-medium text-gray-700 mb-2">
              How old are you?
            </label>
            <select
              id="age"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-lg"
            >
              {Array.from({ length: 10 }, (_, i) => i + 5).map(ageOption => (
                <option key={ageOption} value={ageOption}>
                  {ageOption} years old
                </option>
              ))}
            </select>
          </div>

          {/* Interests Selection */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-4">
              <Heart className="w-5 h-5 inline mr-2 text-pink-500" />
              What are you interested in? (Choose as many as you like!)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedInterests.includes(interest)
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-medium rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating Profile...
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Create My Profile
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