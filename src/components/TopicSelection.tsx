import React, { useState } from 'react';
import { Mic, MicOff, Send, Lightbulb, BookOpen, Star, Zap, Heart } from 'lucide-react';
import { Profile } from '../App';
import VoiceManager from './VoiceManager';
import SpeechInput from './SpeechInput';

interface TopicSelectionProps {
  profile: Profile;
  onTopicSelected: (topic: string) => void;
  voiceManager: VoiceManager;
}

const SUGGESTED_TOPICS = [
  { name: 'Dinosaurs', emoji: '🦕', description: 'Roar into prehistoric adventures!', difficulty: 'Easy', color: 'from-green-400 to-emerald-500' },
  { name: 'Space and Planets', emoji: '🚀', description: 'Blast off to the stars!', difficulty: 'Medium', color: 'from-blue-400 to-purple-500' },
  { name: 'Ocean Animals', emoji: '🐠', description: 'Dive deep with sea creatures!', difficulty: 'Easy', color: 'from-cyan-400 to-blue-500' },
  { name: 'How Plants Grow', emoji: '🌱', description: 'Watch nature come alive!', difficulty: 'Easy', color: 'from-green-400 to-lime-500' },
  { name: 'The Human Body', emoji: '🫀', description: 'Discover your amazing body!', difficulty: 'Medium', color: 'from-red-400 to-pink-500' },
  { name: 'Weather and Seasons', emoji: '🌦️', description: 'Explore nature\'s patterns!', difficulty: 'Easy', color: 'from-yellow-400 to-orange-500' },
  { name: 'Ancient India', emoji: '🏺', description: 'Uncover ancient mysteries!', difficulty: 'Hard', color: 'from-yellow-600 to-orange-600' },
  { name: 'Inventions', emoji: '💡', description: 'Meet brilliant inventors!', difficulty: 'Medium', color: 'from-yellow-400 to-amber-500' },
  { name: 'Musical Instruments', emoji: '🎸', description: 'Make beautiful music!', difficulty: 'Easy', color: 'from-purple-400 to-pink-500' },
  { name: 'Different Countries', emoji: '🌍', description: 'Travel around the world!', difficulty: 'Medium', color: 'from-green-400 to-teal-500' },
  { name: 'Math Fun Facts', emoji: '🔢', description: 'Numbers are everywhere!', difficulty: 'Medium', color: 'from-indigo-400 to-purple-500' },
  { name: 'Art and Colors', emoji: '🎨', description: 'Create colorful masterpieces!', difficulty: 'Easy', color: 'from-pink-400 to-rose-500' }
];

const TopicSelection: React.FC<TopicSelectionProps> = ({ profile, onTopicSelected, voiceManager }) => {
  const [topic, setTopic] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState('');

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
    setSelectedAnimation('success-celebration');
    voiceManager.speak(`Great choice! ${suggestedTopic} is a fascinating topic.`);
    setTimeout(() => setSelectedAnimation(''), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && topic.trim()) {
      handleTopicSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-8 left-12 text-3xl star-sparkle">📚</div>
        <div className="absolute top-16 right-16 text-2xl bubble-float">🎯</div>
        <div className="absolute bottom-32 left-8 text-4xl rotate-slow">🌟</div>
        <div className="absolute bottom-16 right-12 text-3xl bounce-gentle">🚀</div>
      </div>

      <div className={`kid-card-rainbow p-10 bounce-in ${selectedAnimation}`}>
        <div className="text-center mb-10">
          <div className="w-28 h-28 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden group">
            <BookOpen className="w-14 h-14 text-white celebration-bounce" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <div className="absolute -top-2 -right-2 text-2xl star-sparkle">⭐</div>
          </div>
          <h2 className="text-5xl font-bold rainbow-text mb-6">
            🎓 Hey {profile.name}! What adventure should we explore? 🎓
          </h2>
          <p className="text-2xl text-gray-700 leading-relaxed">Pick a topic or tell me what makes you curious! ✨</p>
        </div>

        {/* Enhanced Topic Input */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
            <div className="flex-1 w-full relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="🌟 Type your amazing topic here or use the magic microphone! 🎤"
                className="w-full px-6 py-6 pr-20 border-4 border-pink-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all text-xl font-medium bg-gradient-to-r from-white to-orange-50 shadow-lg interactive-hover"
              />
              <button
                onClick={topic.trim() ? handleTopicSubmit : undefined}
                disabled={!topic.trim()}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-4 rounded-xl transition-all shadow-lg relative overflow-hidden group ${
                  topic.trim()
                    ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white hover:shadow-xl glow-pulse'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-6 h-6" />
                {topic.trim() && (
                  <>
                    <div className="absolute top-1 right-1 text-yellow-300 star-sparkle">⭐</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </>
                )}
              </button>

              {/* Topic length indicator */}
              {topic && (
                <div className="absolute -bottom-8 left-2 text-sm text-green-600 font-semibold">
                  <Heart className="w-4 h-4 inline mr-1 heart-beat" />
                  Great topic choice!
                </div>
              )}
            </div>

            <SpeechInput
              onResult={handleSpeechResult}
              onError={handleSpeechError}
              onStart={handleSpeechStart}
              onEnd={handleSpeechEnd}
              className={`p-6 rounded-2xl border-4 transition-all shadow-lg relative overflow-hidden group ${
                isListening
                  ? 'border-red-400 bg-gradient-to-r from-red-100 to-pink-100 text-red-600 glow-pulse scale-110'
                  : 'border-orange-300 bg-gradient-to-r from-white to-orange-50 text-orange-600 hover:border-orange-400 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 interactive-hover'
              }`}
            >
              <div className="relative">
                {isListening ? (
                  <MicOff className="w-8 h-8 shake-celebration" />
                ) : (
                  <Mic className="w-8 h-8 bounce-gentle" />
                )}
                {isListening && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>

              {/* Animated background effect */}
              {!isListening && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
            </SpeechInput>
          </div>

          {isListening && (
            <div className="text-center bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl p-6 border-4 border-red-200 glow-pulse">
              <p className="text-red-600 font-bold text-2xl mb-2">
                🎤 I'm listening for your awesome idea! Speak now! 🌟
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Suggested Topics */}
        <div className="mb-10">
          <div className="flex items-center justify-center mb-8">
            <Lightbulb className="w-8 h-8 text-yellow-500 mr-4 star-sparkle" />
            <h3 className="text-3xl font-bold rainbow-text">💡 Or pick one of these amazing adventures:</h3>
            <Lightbulb className="w-8 h-8 text-yellow-500 ml-4 star-sparkle" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUGGESTED_TOPICS.map((suggestedTopic, index) => (
              <button
                key={suggestedTopic.name}
                onClick={() => handleSuggestedTopic(suggestedTopic.name)}
                onMouseEnter={() => setHoveredTopic(suggestedTopic.name)}
                onMouseLeave={() => setHoveredTopic(null)}
                className={`p-6 text-center bg-gradient-to-r ${suggestedTopic.color} border-4 border-white rounded-3xl shadow-xl transition-all duration-300 transform text-white font-bold relative overflow-hidden group ${
                  hoveredTopic === suggestedTopic.name ? 'scale-110 shadow-2xl glow-pulse' : 'hover:scale-105'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                <div className="relative">
                  <div className={`text-5xl mb-3 ${hoveredTopic === suggestedTopic.name ? 'celebration-bounce' : 'bounce-gentle'}`}>
                    {suggestedTopic.emoji}
                  </div>
                  <div className="text-xl font-bold mb-2">{suggestedTopic.name}</div>
                  <div className="text-sm opacity-90 mb-3">{suggestedTopic.description}</div>

                  {/* Difficulty indicator */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    suggestedTopic.difficulty === 'Easy' ? 'bg-green-500' :
                    suggestedTopic.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    <Star className="w-3 h-3 mr-1" />
                    {suggestedTopic.difficulty}
                  </div>

                  {/* Hover sparkle effect */}
                  {hoveredTopic === suggestedTopic.name && (
                    <div className="absolute top-2 right-2 text-yellow-300 star-sparkle">✨</div>
                  )}
                </div>
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