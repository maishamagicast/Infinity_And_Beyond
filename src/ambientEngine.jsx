export class AmbientEngine {
  constructor(audioPaths = []) {
    this.paths = audioPaths;
    this.ctx = null;
    this.buffers = new Map();
    this.isPlaying = false;
    this.activeTimeouts = [];
  }

  async init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Fetch and decode all audio files into memory
    await Promise.all(
      this.paths.map(async (path) => {
        try {
          const res = await fetch(path);
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(path, audioBuffer);
        } catch (err) {
          console.warn(`[AmbientEngine] Failed to load audio asset: ${path}`, err);
        }
      })
    );
  }

  async start() {
    await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isPlaying = true;
    this._scheduleNextSound();
  }

  stop() {
    this.isPlaying = false;
    this.activeTimeouts.forEach(clearTimeout);
    this.activeTimeouts = [];
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  _scheduleNextSound() {
    if (!this.isPlaying || this.buffers.size === 0) return;

    // Pick a random audio buffer from your folder
    const keys = Array.from(this.buffers.keys());
    const randomPath = keys[Math.floor(Math.random() * keys.length)];
    const buffer = this.buffers.get(randomPath);

    this._playProcessedSound(buffer);

    // Schedule the next sound to trigger between 4 to 12 seconds later
    // This creates natural breathing room between clips
    const nextInterval = (Math.random() * 8 + 4) * 1000;
    const timeoutId = setTimeout(() => this._scheduleNextSound(), nextInterval);
    this.activeTimeouts.push(timeoutId);
  }

  _playProcessedSound(buffer) {
    if (!this.ctx) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // 1. Stochastic Pitch/Speed Variation (±6%)
    source.playbackRate.value = 0.94 + Math.random() * 0.12;

    // 2. Master Gain / Volume Envelope (Soft fade-in and fade-out)
    const gainNode = this.ctx.createGain();
    const now = this.ctx.currentTime;
    const duration = buffer.duration / source.playbackRate.value;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + duration * 0.3); // Low background volume (15%)
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    // 3. Stereo Panning (Randomly place sound left, center, or right)
    let finalNode = gainNode;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = (Math.random() * 2) - 1; // Between -1 (left) and 1 (right)
      gainNode.connect(panner);
      finalNode = panner;
    }

    // 4. Low-pass filter to warm up harsh samples
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800; // Cuts high scratchy frequencies

    finalNode.connect(filter);
    filter.connect(this.ctx.destination);

    source.start(now);
  }
}