class VoiceManager {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[];
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
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();

    // Listen for voices changed event
    this.synthesis.onvoiceschanged = () => {
      this.loadVoices();
    };
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    // Try to find a child-friendly or female voice
    this.selectedVoice = this.voices.find(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('veena') ||
      voice.name.toLowerCase().includes('zira')
    ) || this.voices[0] || null;
  }

  speak(text: string, options: { rate?: number; pitch?: number; emotion?: 'excited' | 'encouraging' | 'gentle' | 'celebration' } = {}) {
    // Cancel any ongoing speech
    this.synthesis.cancel();

    let finalText = text;

    // Add emotional context based on the emotion parameter
    if (options.emotion === 'celebration') {
      finalText = `🎉 ${text} ${this.getRandomEncouragement()}`;
    } else if (options.emotion === 'encouraging') {
      finalText = `${text} ${this.getRandomEncouragement()}`;
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

    this.synthesis.speak(utterance);
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