class AudioEngine {
    constructor(bus) {
        this.bus = bus;
        this.ctx = null;
        this.gainNode = null;
        this.activeNotes = new Map();
        this.enabled = false;
        this.synthType = 'sine';
        
        this.init();
    }

    init() {
        // AudioContext must be started after a user gesture
        this.bus.on('audioInit', () => this.setupContext());
        
        this.bus.on('noteOn', ({ midi }) => this.noteOn(midi));
        this.bus.on('noteOff', ({ midi }) => this.noteOff(midi));
        
        // Enable audio on first interaction
        document.addEventListener('mousedown', () => {
            if (!this.ctx) this.setupContext();
            this.enabled = true;
        }, { once: true });
    }

    setupContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
            this.gainNode = this.ctx.createGain();
            this.gainNode.gain.value = 0.5;
            this.gainNode.connect(this.ctx.destination);
            console.log("AudioContext initialized");
        }
    }

    noteOn(midi) {
        if (!this.ctx || !this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (this.activeNotes.has(midi)) return;

        const freq = Math.pow(2, (midi - 69) / 12) * 440;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.synthType;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.gainNode);

        osc.start();
        this.activeNotes.set(midi, { osc, gain });
    }

    noteOff(midi) {
        if (!this.activeNotes.has(midi)) return;

        const { osc, gain } = this.activeNotes.get(midi);
        const release = 0.1;

        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + release);

        setTimeout(() => {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
        }, release * 1000);

        this.activeNotes.delete(midi);
    }
}