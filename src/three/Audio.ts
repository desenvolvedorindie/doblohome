/**
 * Sintetizador de Áudio Mecânico (Web Audio API)
 * Emite som de rolamentos de esferas de aço nos trilhos telescópicos
 * e clique metálico das travas de retenção
 */
export class MechanicalAudio {
  audioCtx: AudioContext | null = null;
  enabled: boolean = true;
  slidingOsc: OscillatorNode | null = null;
  slidingGain: GainNode | null = null;

  initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound(enable: boolean) {
    this.enabled = enable;
    if (!this.enabled && this.slidingGain && this.audioCtx) {
      this.slidingGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
  }

  /**
   * Toca o clique mecânico da trava de segurança (quando fecha 0% ou abre 100%)
   */
  playLockClick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Toca o ruído de deslizamento das esferas de aço nos trilhos de gaveta
   */
  playSlideSound(speed: number = 1.0) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    if (!this.slidingOsc) {
      this.slidingOsc = this.audioCtx.createOscillator();
      this.slidingGain = this.audioCtx.createGain();

      this.slidingOsc.type = 'sawtooth';
      this.slidingOsc.frequency.setValueAtTime(120, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.audioCtx.currentTime);

      this.slidingGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.slidingOsc.connect(filter);
      filter.connect(this.slidingGain);
      this.slidingGain.connect(this.audioCtx.destination);
      this.slidingOsc.start();
    }

    const t = this.audioCtx.currentTime;
    const targetFreq = 110 + speed * 60;
    this.slidingOsc.frequency.linearRampToValueAtTime(targetFreq, t + 0.05);
    this.slidingGain!.gain.cancelScheduledValues(t);
    this.slidingGain!.gain.setValueAtTime(0.06, t);
    this.slidingGain!.gain.linearRampToValueAtTime(0, t + 0.15);
  }
}

