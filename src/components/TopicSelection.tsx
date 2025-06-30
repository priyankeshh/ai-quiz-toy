import React, { useState } from 'react';
import { Mic, MicOff, Send, Lightbulb, BookOpen } from 'lucide-react';
import { Profile } from '../App';
import VoiceManager from './VoiceManager';
import SpeechInput from './SpeechInput';

interface TopicSelectionProps {
  profile: Profile;
  onTopicSelected: (topic: string) => void;
  voiceManager: VoiceManager;
}

const SUGGESTED_TOPICS = [
  { name: 'Dinosaurs', emoji: '🦕' },
  { name: 'Space and Planets', emoji: '🚀' },
  { name: 'Ocean Animals', emoji: '🐠' },
  { name: 'How Plants Grow', emoji: '🌱' },
  { name: 'The Human Body', emoji: '🫀' },
  { name: 'Weather and Seasons', emoji: '🌦️' },
  { name: 'Ancient Egypt', emoji: '🏺' },
  { name: 'Inventions', emoji: '💡' },
  { name: 'Musical Instruments', emoji: '🎸' },
  { name: 'Different Countries', emoji: '🌍' },
  { name: 'Math Fun Facts', emoji: '🔢' },
  { name: 'Art and Colors', emoji: '🎨' }
];

const TopicSelection: React.FC<TopicSelectionProps> = ({ profile, onTopicSelected, voiceManager }) => {
  const [topic, setTopic] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSpeechResult = (transcript: string) => {
    setTopic(transcript);
    voiceManager.speak(`I heard "${transcript}". That sounds like a great topic!`);
  };

  const handleSpeechError = (error: string) => {
    console.error('Speech error:', error);
    voiceManager.speak("I didn't catch that. Please try speaking again or type your topic.");
  };

  const handleSpeechStart = () => {
    setIsListening(true);
    voiceManager.speak("I'm listening! Tell me what topic you'd like to learn about.");
  };

  const handleSpeechEnd = () => {
    setIsListening(false);
  };

  const handleTopicSubmit = () => {
    if (topic.trim()) {
      onTopicSelected(topic.trim());
    }
  };

  const handleSuggestedTopic = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
    voiceManager.speak(`Great choice! ${suggestedTopic} is a fascinating topic.`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && topic.trim()) {
      handleTopicSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="kid-card-rainbow p-10 bounce-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 wiggle shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            🎓 Hey {profile.name}! What adventure should we explore? 🎓
          </h2>
          <p className="text-xl text-gray-700">Pick a topic or tell me what makes you curious! ✨</p>
        </div>

        {/* Topic Input */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="🌟 Type your amazing topic here or use the magic microphone! 🎤"
                className="w-full px-6 py-5 pr-16 border-4 border-pink-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all text-xl font-medium bg-white/80 shadow-lg"
              />
              <button
                onClick={topic.trim() ? handleTopicSubmit : undefined}
                disabled={!topic.trim()}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-3 rounded-xl transition-all shadow-lg ${
                  topic.trim()
                    ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>

            <SpeechInput
              onResult={handleSpeechResult}
              onError={handleSpeechError}
              onStart={handleSpeechStart}
              onEnd={handleSpeechEnd}
              className={`p-5 rounded-2xl border-4 transition-all transform hover:scale-105 shadow-lg ${
                isListening
                  ? 'border-red-400 bg-red-100 text-red-600 animate-pulse'
                  : 'border-orange-300 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50'
              }`}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </SpeechInput>
          </div>

          {isListening && (
            <p className="text-center text-orange-600 font-bold text-xl animate-pulse">
              🎤 I'm listening for your awesome idea! Speak now! 🌟
            </p>
          )}
        </div>

        {/* Suggested Topics */}
        <div>
          <div className="flex items-center mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-500 mr-3 star-sparkle" />
            <h3 className="text-2xl font-bold text-gray-800">💡 Or pick one of these amazing adventures:</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SUGGESTED_TOPICS.map((suggestedTopic) => (
              <button
                key={suggestedTopic.name}
                onClick={() => handleSuggestedTopic(suggestedTopic.name)}
                className="p-5 text-center bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 border-4 border-purple-200 rounded-2xl hover:border-purple-400 hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-gray-800 hover:text-purple-700 font-semibold shadow-lg"
              >
                <div className="text-3xl mb-2">{suggestedTopic.emoji}</div>
                <div className="text-lg">{suggestedTopic.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Personal Suggestions */}
        {profile.interests.length > 0 && (
          <div className="mt-8 p-8 bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 rounded-2xl border-4 border-yellow-200 shadow-lg">
            <h3 className="text-2xl font-bold text-purple-700 mb-4 text-center">
              🎯 Perfect for you, {profile.name}! 🎯
            </h3>
            <p className="text-lg text-purple-600 mb-4 text-center">Based on what you love:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {profile.interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleSuggestedTopic(interest)}
                  className="px-6 py-3 bg-white border-3 border-purple-300 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all text-purple-700 hover:text-purple-800 font-semibold text-lg transform hover:scale-105 shadow-md"
                >
                  ⭐ {interest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicSelection;