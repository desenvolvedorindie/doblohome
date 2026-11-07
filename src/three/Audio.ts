/**
 * Sintetizador de Áudio Automotivo e Mecânico (Web Audio API)
 * - Emite som de partida do motor (arranque/crank) e marcha lenta contínua da Fiat Doblò
 * - Emite som de rolamentos de esferas de aço nos trilhos telescópicos
 * - Emite clique metálico das travas de retenção
 */
export class MechanicalAudio {
  audioCtx: AudioContext | null = null;
  enabled: boolean = true;
  slidingOsc: OscillatorNode | null = null;
  slidingGain: GainNode | null = null;

  // Áudio do Motor da Van (Partida + Marcha Lenta Contínua)
  isEngineRunning: boolean = false;
  engineMasterGain: GainNode | null = null;
  engineOsc1: OscillatorNode | null = null;
  engineOsc2: OscillatorNode | null = null;
  engineAlternatorOsc: OscillatorNode | null = null;
  engineLFO: OscillatorNode | null = null;
  engineLFOGain: GainNode | null = null;
  engineFilter: BiquadFilterNode | null = null;
  starterTimer: any = null;

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
    if (!this.enabled) {
      if (this.engineMasterGain && this.audioCtx) {
        this.engineMasterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
      if (this.slidingGain && this.audioCtx) {
        this.slidingGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
    } else {
      if (this.isEngineRunning) {
        this.startEngineSound();
      }
    }
  }

  /**
   * Toca o som realista de partida (crank do motor de arranque)
   * e entra automaticamente na marcha lenta contínua da Fiat Doblò
   */
  startEngineSound() {
    this.initContext();
    this.isEngineRunning = true;
    if (!this.enabled || !this.audioCtx) return;

    this.stopEngineSound(false);
    this.isEngineRunning = true;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Master gain do motor
    this.engineMasterGain = ctx.createGain();
    this.engineMasterGain.gain.setValueAtTime(0.001, now);
    this.engineMasterGain.connect(ctx.destination);

    // ── FASE 1: Motor de Partida (Arrancada / Cranking) ──
    const starterOsc = ctx.createOscillator();
    const starterGain = ctx.createGain();
    const starterFilter = ctx.createBiquadFilter();

    starterOsc.type = 'sawtooth';
    starterOsc.frequency.setValueAtTime(135, now);
    starterOsc.frequency.linearRampToValueAtTime(80, now + 0.22);
    starterOsc.frequency.linearRampToValueAtTime(145, now + 0.44);
    starterOsc.frequency.linearRampToValueAtTime(90, now + 0.64);

    starterFilter.type = 'lowpass';
    starterFilter.frequency.setValueAtTime(320, now);

    // 2 pulsos de compressão do motor de arranque
    starterGain.gain.setValueAtTime(0.25, now);
    starterGain.gain.linearRampToValueAtTime(0.06, now + 0.20);
    starterGain.gain.linearRampToValueAtTime(0.28, now + 0.42);
    starterGain.gain.linearRampToValueAtTime(0.08, now + 0.62);
    starterGain.gain.linearRampToValueAtTime(0.001, now + 0.78);

    starterOsc.connect(starterFilter);
    starterFilter.connect(starterGain);
    starterGain.connect(ctx.destination);

    starterOsc.start(now);
    starterOsc.stop(now + 0.80);

    // ── FASE 2: Ignição e Marcha Lenta Contínua (Idle Engine) ──
    this.starterTimer = setTimeout(() => {
      if (!this.isEngineRunning || !this.audioCtx) return;
      const t = this.audioCtx.currentTime;

      // 1. Oscilador Principal de Escape (4 cilindros em marcha lenta ~850 RPM = ~29 Hz)
      this.engineOsc1 = ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      // Blip inicial de aceleração quando pega o motor (~70Hz), estabilizando em ~30Hz
      this.engineOsc1.frequency.setValueAtTime(70, t);
      this.engineOsc1.frequency.exponentialRampToValueAtTime(30, t + 0.45);

      // 2. Sub-grave do bloco do motor
      this.engineOsc2 = ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(45, t);
      this.engineOsc2.frequency.exponentialRampToValueAtTime(15, t + 0.45);

      // 3. LFO para pulsar a exaustão (ciclo dos 4 tempos do motor a 14Hz)
      this.engineLFO = ctx.createOscillator();
      this.engineLFO.type = 'sine';
      this.engineLFO.frequency.setValueAtTime(14.5, t);

      this.engineLFOGain = ctx.createGain();
      this.engineLFOGain.gain.setValueAtTime(0.12, t);
      this.engineLFO.connect(this.engineLFOGain.gain);

      // 4. Filtro passa-baixa ressonante do escapamento
      this.engineFilter = ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, t);
      this.engineFilter.Q.setValueAtTime(2.6, t);

      // 5. Zumbido sutil do alternador gerando carga (360Hz)
      this.engineAlternatorOsc = ctx.createOscillator();
      this.engineAlternatorOsc.type = 'sine';
      this.engineAlternatorOsc.frequency.setValueAtTime(360, t);

      const altGain = ctx.createGain();
      altGain.gain.setValueAtTime(0.012, t);
      this.engineAlternatorOsc.connect(altGain);
      altGain.connect(this.engineMasterGain!);

      // Conexões de áudio
      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineLFOGain);
      this.engineLFOGain.connect(this.engineMasterGain!);

      // Fade-in suave da marcha lenta
      this.engineMasterGain!.gain.cancelScheduledValues(t);
      this.engineMasterGain!.gain.setValueAtTime(0.001, t);
      this.engineMasterGain!.gain.exponentialRampToValueAtTime(0.18, t + 0.4);

      this.engineOsc1.start(t);
      this.engineOsc2.start(t);
      this.engineLFO.start(t);
      this.engineAlternatorOsc.start(t);
    }, 700);
  }

  /**
   * Desliga o motor com desaceleração realista
   */
  stopEngineSound(setRunningFlag: boolean = true) {
    if (setRunningFlag) {
      this.isEngineRunning = false;
    }
    if (this.starterTimer) {
      clearTimeout(this.starterTimer);
      this.starterTimer = null;
    }
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    if (this.engineMasterGain) {
      if (this.engineOsc1) {
        this.engineOsc1.frequency.linearRampToValueAtTime(8, t + 0.42);
      }
      if (this.engineOsc2) {
        this.engineOsc2.frequency.linearRampToValueAtTime(4, t + 0.42);
      }
      this.engineMasterGain.gain.cancelScheduledValues(t);
      this.engineMasterGain.gain.setValueAtTime(this.engineMasterGain.gain.value, t);
      this.engineMasterGain.gain.linearRampToValueAtTime(0.0001, t + 0.45);

      const osc1 = this.engineOsc1;
      const osc2 = this.engineOsc2;
      const lfo = this.engineLFO;
      const alt = this.engineAlternatorOsc;
      const master = this.engineMasterGain;

      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          lfo?.stop();
          alt?.stop();
          osc1?.disconnect();
          osc2?.disconnect();
          lfo?.disconnect();
          alt?.disconnect();
          master?.disconnect();
        } catch (e) {
          // ignore
        }
      }, 480);

      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineLFO = null;
      this.engineAlternatorOsc = null;
      this.engineMasterGain = null;
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

