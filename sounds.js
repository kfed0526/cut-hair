// Original synthesized sounds: no downloads, external requests or extra media files.
// Keep one context unlocked by a real tap; recreating it at the end of a round
// can leave iOS and Android celebration audio suspended.
export class GameSounds {
  constructor(createContext = () => new (window.AudioContext || window.webkitAudioContext)()) {
    this.createContext = createContext;
    this.enabled = true;
    this.volume = 1;
    this.nodes = new Set();
    this.context = null;
  }

  setVolume(value) { this.volume=Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):1));if(this.output)this.output.gain.value=.45*this.volume; }

  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = this.createContext();
        this.output = this.context.createGain();
        this.output.gain.value = 0.45*this.volume;
        this.output.connect(this.context.destination);
      }
      // Run resume synchronously from the click handler, before any speech awaits.
      this.context.resume()?.catch(() => {});
    } catch { this.context = null; }
  }

  stop() {
    for (const node of this.nodes) {
      try { node.stop(); } catch { /* Already ended. */ }
      try { node.disconnect(); } catch { /* Optional browser cleanup. */ }
    }
    this.nodes.clear();
  }

  track(node, gain) {
    this.nodes.add(node);
    node.onended = () => {
      this.nodes.delete(node);
      node.disconnect();
      gain.disconnect();
    };
  }

  tone(frequency, offset, duration, volume = 0.16, type = 'sine', endFrequency) {
    const context = this.context;
    const start = context.currentTime + offset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.output);
    this.track(oscillator, gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  clap(offset, volume = 0.17) {
    const context = this.context;
    const duration = 0.12;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.025));
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.output);
    this.track(source, gain);
    source.start(context.currentTime + offset);
    source.stop(context.currentTime + offset + duration);
  }

  ready() {
    return this.enabled && this.context && this.context.state === 'running';
  }

  correct() {
    this.stop();
    if (!this.ready()) return 0;
    try {
      // A quick, bright three-note sparkle. Speech starts after it has finished.
      [659.25, 830.61, 1046.5].forEach((note, i) => this.tone(note, i * 0.085, 0.22, 0.2));
      return 420;
    } catch { this.stop(); return 0; }
  }

  sand() {
    if (!this.ready()) return;
    try { this.clap(0, .035); this.clap(.04, .02); } catch { this.stop(); }
  }

  salon(tool) {
    if (!this.ready() || !['scissors','comb','dryer','finish'].includes(tool)) return false;
    try {
      if (this.nodes.size > 36) this.stop();
      if (tool === 'finish') { this.tone(659,0,.18,.1);this.tone(880,.12,.22,.1); }
      else if (tool === 'scissors') { this.clap(0,.055);this.tone(1800,.025,.055,.025,'triangle',850); }
      else if (tool === 'comb') this.clap(0,.025);
      else { this.clap(0,.022);this.clap(.08,.018); }
      return true;
    } catch { this.stop();return false; }
  }

  instrument(kind, note = 0) {
    if (!this.ready() || !['piano','xylophone','drum','shaker'].includes(kind) || !Number.isInteger(note) || note < 0 || note > 7) return false;
    try {
      if (this.nodes.size > 48) this.stop();
      const frequency = [261.63,293.66,329.63,349.23,392,440,493.88,523.25][note];
      if (kind === 'piano') { this.tone(frequency,0,.65,.17,'triangle');this.tone(frequency*2,0,.26,.035); }
      else if (kind === 'xylophone') { this.tone(frequency*2,0,.42,.17);this.tone(frequency*5.51,0,.13,.025); }
      else if (kind === 'drum') { this.tone(95+note*55,0,.21,.19,'sine',45+note*25);this.clap(.015,.045+note*.015); }
      else { this.clap(0,.07);this.clap(.07+note*.012,.045); }
      return true;
    } catch { this.stop(); return false; }
  }

  festival(kind) {
    this.stop();
    if (!this.ready()) return;
    try {
      if (kind === 'firework' || kind === 'pop') {
        this.tone(300, 0, .18, .12, 'sine', 850);
        this.clap(.18, .12); this.clap(.25, .07);
      } else if (kind === 'drum' || kind === 'row') {
        this.tone(145, 0, .16, .18, 'sine', 65);
        this.tone(390, .08, .12, .08, 'triangle');
      } else if (kind === 'bite' || kind === 'rustle') {
        this.clap(0, .045); this.tone(760, .07, .1, .055);
      } else if (kind === 'wish') {
        [880, 784, 659, 523].forEach((n,i)=>this.tone(n,i*.09,.2,.1));
      } else this.correct();
    } catch { this.stop(); }
  }

  dance(seconds = 9) {
    this.stop();
    if (!this.ready()) return;
    try {
      const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 783.99];
      const beat = 0.3;
      for (let i = 0; i * beat + 0.24 < seconds; i++) {
        const offset = i * beat;
        this.tone(melody[i % melody.length], offset, 0.23, 0.15, 'triangle');
        if (i % 2 === 0) this.tone(125, offset, 0.12, 0.19, 'sine', 55);
        else {
          this.clap(offset, 0.2);
          this.clap(offset + 0.035, 0.09);
        }
      }
      // Friendly slide whistles and a tiny end-of-dance applause burst.
      this.tone(440, 0, 0.3, 0.12, 'sine', 880);
      if (seconds > 3) {
        this.tone(660, 3, 0.3, 0.1, 'sine', 990);
        this.tone(880, 6, 0.3, 0.1, 'sine', 440);
        for (let i = 0; i < 6; i++) this.clap(seconds - 0.8 + i * 0.1, 0.13);
      }
    } catch { this.stop(); }
  }
}
