import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import SpeechInput from './SpeechInput';

const VoiceTest: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  const handleSpeechResult = (result: string) => {
    setTranscript(result);
    console.log('Speech result:', result);
  };

  const handleSpeechError = (error: string) => {
    console.error('Speech error:', error);
    setSupported(false);
  };

  const handleSpeechStart = () => {
    setListening(true);
    console.log('Started listening...');
  };

  const handleSpeechEnd = () => {
    setListening(false);
    console.log('Stopped listening...');
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  if (!supported) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Browser Not Supported</h2>
        <p className="text-red-600">
          Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Voice Recognition Test</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Browser supports speech recognition: <span className="font-bold text-green-600">Yes</span>
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Currently listening: <span className={`font-bold ${listening ? 'text-red-600' : 'text-gray-600'}`}>
            {listening ? 'Yes' : 'No'}
          </span>
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transcript:
        </label>
        <div className="p-3 bg-gray-100 border border-gray-300 rounded min-h-[60px]">
          {transcript || <span className="text-gray-500 italic">No speech detected yet...</span>}
        </div>
      </div>

      <div className="flex space-x-3">
        <SpeechInput
          onResult={handleSpeechResult}
          onError={handleSpeechError}
          onStart={handleSpeechStart}
          onEnd={handleSpeechEnd}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
            listening
              ? 'border-red-400 bg-red-100 text-red-600 animate-pulse'
              : 'border-blue-400 bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span>{listening ? 'Stop' : 'Start'}</span>
        </SpeechInput>

        <button
          onClick={clearTranscript}
          className="px-4 py-2 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-all"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Click "Start" and speak into your microphone.</p>
        <p>Make sure to allow microphone permissions when prompted.</p>
      </div>
    </div>
  );
};

export default VoiceTest;
