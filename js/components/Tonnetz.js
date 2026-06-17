class Tonnetz {
    constructor(bus, theory) {
        this.bus = bus;
        this.theory = theory;
        this.canvas = document.getElementById('tonnetz-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.bus.on('noteOn', ({ midi }) => this.highlightNote(midi, true));
        this.bus.on('noteOff', ({ midi }) => this.highlightNote(midi, false));
        
        this.render();
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight || 400;
    }

    getNotePos(pitch) {
        const p = pitch % 12;
        // Riemann Tonnetz coordinates
        // x = (p % 3) + (p % 6) * 0.5 ... simplified for visualization
        const x = (p % 3) * 100 + (Math.floor(p / 3) * 50);
        const y = Math.floor(p / 3) * 80;
        return { x: x + 50, y: y + 50 };
    }

    highlightNote(midi, active) {
        const note = this.theory.midiToNote(midi);
        // In a real Tonnetz, we'd track active notes in a set
        this.render();
    }

    render() {
        if (!this.ctx) return;
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        
        const notes = this.theory.NOMBRES_NOTAS;
        this.ctx.strokeStyle = '#ccc';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';

        // Draw a simple grid of notes for now
        for (let i = 0; i < 12; i++) {
            const pos = this.getNotePos(i);
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle = 'black';
            this.ctx.fillText(notes[i], pos.x, pos.y + 5);
            this.ctx.fillStyle = 'white';
        }
    }
}