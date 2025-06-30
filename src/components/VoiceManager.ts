import { logger } from '../utils/logger';

class VoiceManager {
  private synthesis!: SpeechSynthesis;
  private voices!: SpeechSynthesisVoice[];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private encouragingPhrases: string[] = [
    "You're doing amazing!",
    "Keep up the great work!",
    "You're so smart!",
    "Fantastic job!",
    "You're a superstar!",
    "Brilliant thinking!",
    "Way to go!",
    "Outstanding!"
  ];

  constructor() {
    logger.voiceEvent('VoiceManager initializing');

    if (!('speechSynthesis' in window)) {
      logger.voiceError('Speech synthesis not supported');
      return;
    }

    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();

    // Listen for voices changed event
    this.synthesis.onvoiceschanged = () => {
      logger.voiceEvent('Voices changed event fired');
      this.loadVoices();
    };
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    logger.voiceEvent('Voices loaded', { count: this.voices.length });

    // Try to find a child-friendly or female voice
    this.selectedVoice = this.voices.find(voice =>
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('veena') ||
      voice.name.toLowerCase().includes('zira')
    ) || this.voices[0] || null;

    if (this.selectedVoice) {
      logger.voiceEvent('Voice selected', {
        name: this.selectedVoice.name,
        lang: this.selectedVoice.lang
      });
    } else {
      logger.voiceError('No voice available');
    }
  }

  private removeEmojis(text: string): string {
    // Remove emojis and other Unicode symbols that might cause pronunciation issues
    // This covers most emoji ranges and common symbols
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{E000}-\u{F8FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F200}-\u{1F2FF}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2B50}]|[\u{2B55}]|[\u{2728}]|[\u{2764}]|[\u{1F60D}]|[\u{1F970}]|[\u{1F389}]|[\u{1F38A}]|[\u{1F3C6}]|[\u{1F3C5}]|[\u{1F947}-\u{1F949}]|[\u{1F4AF}]|[\u{1F525}]|[\u{1F44D}]|[\u{1F44F}]|[\u{1F643}]|[\u{1F929}]/gu, '');
  }

  speak(text: string, options: { rate?: number; pitch?: number; emotion?: 'excited' | 'encouraging' | 'gentle' | 'celebration' } = {}) {
    logger.voiceEvent('Speak requested', { text: text.substring(0, 50) + '...', emotion: options.emotion });

    if (!this.synthesis) {
      logger.voiceError('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Remove emojis from text before processing
    let finalText = this.removeEmojis(text);

    // Add emotional context based on the emotion parameter
    if (options.emotion === 'celebration') {
      finalText = `${finalText} ${this.getRandomEncouragement()}`;
    } else if (options.emotion === 'encouraging') {
      finalText = `${finalText} ${this.getRandomEncouragement()}`;
    }

    const utterance = new SpeechSynthesisUtterance(finalText);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Adjust voice parameters based on emotion
    switch (options.emotion) {
      case 'excited':
        utterance.rate = options.rate || 1.1;
        utterance.pitch = options.pitch || 1.3;
        break;
      case 'celebration':
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.4;
        break;
      case 'encouraging':
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.2;
        break;
      case 'gentle':
        utterance.rate = options.rate || 0.8;
        utterance.pitch = options.pitch || 1.0;
        break;
      default:
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.1;
    }

    utterance.volume = 1;

    // Add error handling for speech synthesis
    utterance.onerror = (event) => {
      logger.voiceError('Speech synthesis error', { error: event.error });
    };

    utterance.onend = () => {
      logger.voiceEvent('Speech completed');
    };

    try {
      this.synthesis.speak(utterance);
      logger.voiceEvent('Speech started');
    } catch (error) {
      logger.voiceError('Failed to start speech', error);
    }
  }

  speakCorrectAnswer(explanation: string) {
    this.speak(`Correct! ${explanation}`, { emotion: 'celebration' });
  }

  speakIncorrectAnswer(explanation: string) {
    this.speak(`That's okay! ${explanation} Keep trying, you're learning so much!`, { emotion: 'encouraging' });
  }

  speakQuizComplete(score: number, total: number) {
    const percentage = Math.round((score / total) * 100);
    let message = '';

    if (percentage === 100) {
      message = `Perfect score! You got all ${total} questions right! You're absolutely incredible!`;
    } else if (percentage >= 80) {
      message = `Excellent work! You got ${score} out of ${total} questions correct! That's ${percentage} percent!`;
    } else if (percentage >= 60) {
      message = `Great job! You got ${score} out of ${total} questions right! You're learning so much!`;
    } else {
      message = `Good effort! You got ${score} out of ${total} questions correct! Every question helps you learn more!`;
    }

    this.speak(message, { emotion: 'celebration' });
  }

  private getRandomEncouragement(): string {
    return this.encouragingPhrases[Math.floor(Math.random() * this.encouragingPhrases.length)];
  }

  // Simulate sound effects with speech
  playSuccessSound() {
    this.speak("Ding ding! Success!", { rate: 1.2, pitch: 1.5 });
  }

  playErrorSound() {
    this.speak("Oops! Try again!", { rate: 0.8, pitch: 0.9 });
  }

  playCompletionSound() {
    this.speak("Ta-da! Quiz complete!", { rate: 1.1, pitch: 1.4 });
  }

  stop() {
    this.synthesis.cancel();
  }

  getAvailableVoices() {
    return this.voices;
  }

  setVoice(voiceName: string) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
    }
  }
}

export default VoiceManager;