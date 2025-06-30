import { useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { logger } from '../utils/logger';
import VoiceManager from '../components/VoiceManager';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
  voiceManager?: VoiceManager;
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const {
    onResult,
    onError,
    continuous = false,
    language = 'en-US',
    voiceManager
  } = options;

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      const errorMsg = "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.";
      logger.voiceError(errorMsg);
      if (onError) onError(errorMsg);
      if (voiceManager) voiceManager.speak("Voice recognition is not supported. Please click your answer instead.");
      return false;
    }

    try {
      resetTranscript();
      SpeechRecognition.startListening({
        continuous,
        language
      });
      
      logger.voiceEvent('Speech recognition started', { continuous, language });
      if (voiceManager) voiceManager.speak("I'm listening for your answer. You can say A, B, C, or D, or speak the full answer.");
      return true;
    } catch (error) {
      const errorMsg = `Failed to start speech recognition: ${error}`;
      logger.voiceError(errorMsg);
      if (onError) onError(errorMsg);
      if (voiceManager) voiceManager.speak("Sorry, I couldn't start listening. Please try again or click your answer.");
      return false;
    }
  }, [browserSupportsSpeechRecognition, continuous, language, resetTranscript, onError, voiceManager]);

  const stopListening = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
      logger.voiceEvent('Speech recognition stopped');
    } catch (error) {
      logger.voiceError(`Failed to stop speech recognition: ${error}`);
    }
  }, []);

  const abortListening = useCallback(() => {
    try {
      SpeechRecognition.abortListening();
      logger.voiceEvent('Speech recognition aborted');
    } catch (error) {
      logger.voiceError(`Failed to abort speech recognition: ${error}`);
    }
  }, []);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && onResult) {
      logger.voiceEvent('Speech recognition result', { transcript });
      onResult(transcript);
    }
  }, [transcript, onResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [listening]);

  return {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    abortListening,
    resetTranscript
  };
};

export default useVoiceInput;
