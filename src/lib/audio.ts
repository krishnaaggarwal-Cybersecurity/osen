// Audio helper using Web Audio API for alarm beeps and Web Speech API for Twilio voice simulation

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  public playAlarmBeep(_frequency: number = 880, _durationSec: number = 0.3) {
    // Disabled beeping sound as per requirement A.1
    return;
  }

  public speakDispatchNotice(hindiText: string, englishText: string) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Clear previous speech

      const speakText = `${hindiText}. ${englishText}`;
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to select Hindi or English voice
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
