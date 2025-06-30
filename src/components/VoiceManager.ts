class VoiceManager {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[];
  private selectedVoice: SpeechSynthesisVoice | null = null;

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

  speak(text: string, options: { rate?: number; pitch?: number } = {}) {
    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    utterance.rate = options.rate || 0.9; // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.1; // Slightly higher for friendliness
    utterance.volume = 1;

    this.synthesis.speak(utterance);
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