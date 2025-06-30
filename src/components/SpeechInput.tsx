import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface SpeechInputProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  language?: string;
  className?: string;
  children?: React.ReactNode | ((props: { listening: boolean; supported: boolean }) => React.ReactNode);
  disabled?: boolean;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onResult,
  onError,
  onStart,
  onEnd,
  continuous = false,
  language = 'en-US',
  className = '',
  children,
  disabled = false
}) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      if (onError) {
        onError('Sorry, your browser doesn\'t support Speech Recognition. Please use Chrome, Edge, or Safari.');
      }
      return;
    }

    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = language;

    // Event handlers
    recognition.onstart = () => {
      setListening(true);
      if (onStart) onStart();
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      setListening(false);
      const errorMessage = `Speech recognition error: ${event.error}`;
      console.error(errorMessage);
      if (onError) onError(errorMessage);
    };

    recognition.onend = () => {
      setListening(false);
      if (onEnd) onEnd();
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current && listening) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult, onError, onStart, onEnd, continuous, language, listening]);

  const startListening = () => {
    if (!supported) {
      if (onError) {
        onError('Speech recognition is not supported in this browser.');
      }
      return;
    }

    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        if (onError) {
          onError('Failed to start speech recognition. Please try again.');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  // If children are provided, render them with click handler
  if (children) {
    const childContent = typeof children === 'function'
      ? children({ listening, supported })
      : children;

    return (
      <div
        onClick={listening ? stopListening : startListening}
        className={className}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {childContent}
      </div>
    );
  }

  // Default button rendering
  const defaultClassName = `flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
    listening
      ? 'border-red-400 bg-red-100 text-red-600 animate-pulse'
      : 'border-blue-400 bg-blue-100 text-blue-600 hover:bg-blue-200'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`;

  return (
    <button
      onClick={listening ? stopListening : startListening}
      disabled={disabled || !supported}
      className={defaultClassName}
      title={!supported ? 'Speech recognition not supported' : listening ? 'Stop listening' : 'Start listening'}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      <span>{listening ? 'Stop' : 'Start'}</span>
    </button>
  );
};

export default SpeechInput;
