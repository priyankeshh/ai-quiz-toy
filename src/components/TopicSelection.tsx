import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Lightbulb, BookOpen } from 'lucide-react';
import { Profile } from '../App';
import VoiceManager from './VoiceManager';

interface TopicSelectionProps {
  profile: Profile;
  onTopicSelected: (topic: string) => void;
  voiceManager: VoiceManager;
}

const SUGGESTED_TOPICS = [
  'Dinosaurs', 'Space and Planets', 'Ocean Animals', 'How Plants Grow',
  'The Human Body', 'Weather and Seasons', 'Ancient Egypt', 'Inventions',
  'Musical Instruments', 'Different Countries', 'Math Fun Facts', 'Art and Colors'
];

const TopicSelection: React.FC<TopicSelectionProps> = ({ profile, onTopicSelected, voiceManager }) => {
  const [topic, setTopic] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      voiceManager.speak("I'm sorry, voice recognition is not supported in your browser. Please type your topic instead.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      voiceManager.speak("I'm listening! Tell me what topic you'd like to learn about.");
    };

    recognition.onresult = (event) => {
      const spokenTopic = event.results[0][0].transcript;
      setTopic(spokenTopic);
      voiceManager.speak(`I heard "${spokenTopic}". That sounds like a great topic!`);
    };

    recognition.onerror = () => {
      voiceManager.speak("I didn't catch that. Please try speaking again or type your topic.");
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Hi {profile.name}! What would you like to learn about?
          </h2>
          <p className="text-gray-600">Choose a topic or tell me what interests you!</p>
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
                placeholder="Type a topic or use the microphone to speak..."
                className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all text-lg"
              />
              <button
                onClick={topic.trim() ? handleTopicSubmit : undefined}
                disabled={!topic.trim()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                  topic.trim() 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                isListening
                  ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                  : 'border-orange-200 bg-white text-orange-600 hover:border-orange-400'
              }`}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>
          
          {isListening && (
            <p className="text-center text-orange-600 font-medium animate-pulse">
              🎤 Listening... Speak now!
            </p>
          )}
        </div>

        {/* Suggested Topics */}
        <div>
          <div className="flex items-center mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-700">Or choose from these fun topics:</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUGGESTED_TOPICS.map((suggestedTopic) => (
              <button
                key={suggestedTopic}
                onClick={() => handleSuggestedTopic(suggestedTopic)}
                className="p-4 text-center bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-100 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 transform hover:scale-105 text-gray-700 hover:text-purple-700"
              >
                {suggestedTopic}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Suggestions */}
        {profile.interests.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <h3 className="text-lg font-semibold text-purple-700 mb-3">
              Based on your interests, you might like:
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleSuggestedTopic(interest)}
                  className="px-4 py-2 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-sm transition-all text-purple-700 hover:text-purple-800"
                >
                  {interest}
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