import React, { useState, useEffect, useRef } from 'react';

const WebSpeechTest: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSupported(true);
      
      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Event handlers
      recognition.onstart = () => {
        setListening(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        console.log('Speech recognition result:', result);
      };

      recognition.onerror = (event) => {
        setListening(false);
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        setListening(false);
        console.log('Speech recognition ended');
      };

      recognitionRef.current = recognition;
    } else {
      setSupported(false);
      console.warn('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current && listening) {
        recognitionRef.current.stop();
      }
    };
  }, [listening]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Web Speech API Test</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Browser supports speech recognition: 
          <span className={`font-bold ml-1 ${supported ? 'text-green-600' : 'text-red-600'}`}>
            {supported ? 'Yes' : 'No'}
          </span>
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Currently listening: 
          <span className={`font-bold ml-1 ${listening ? 'text-red-600' : 'text-gray-600'}`}>
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
        <button
          onClick={listening ? stopListening : startListening}
          disabled={!supported}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            !supported
              ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
              : listening
              ? 'border-red-400 bg-red-100 text-red-600 animate-pulse'
              : 'border-blue-400 bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          {listening ? 'Stop Listening' : 'Start Listening'}
        </button>

        <button
          onClick={() => setTranscript('')}
          className="px-4 py-2 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-all"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Click "Start Listening" and speak into your microphone.</p>
        <p>Make sure to allow microphone permissions when prompted.</p>
        {!supported && (
          <p className="text-red-500 font-medium">
            Please use Chrome, Edge, or Safari for speech recognition support.
          </p>
        )}
      </div>
    </div>
  );
};

export default WebSpeechTest;
