class ColorTree {
    constructor(bus, theory) {
        this.bus = bus;
        this.theory = theory;
        this.container = document.getElementById('color-tree-container');
        if (!this.container) return;
        this.render();

        this.bus.on('noteOn', ({ midi }) => this.updateColor(midi, true));
        this.bus.on('noteOff', ({ midi }) => this.updateColor(midi, false));
    }

    render() {
        this.container.innerHTML = '<h3>Pirámide de Colores Tonales</h3><div id="tree-canvas-container" style="position:relative; width:400px; height:400px; margin:auto;"></div>';
        const canvasContainer = document.getElementById('tree-canvas-container');
        
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Draw a pyramid structure
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(200, 50);
        ctx.lineTo(50, 350);
        ctx.lineTo(350, 350);
        ctx.closePath();
        ctx.stroke();

        // Add note markers in the pyramid
        const notes = this.theory.NOMBRES_NOTAS;
        notes.forEach((note, i) => {
            const x = 200 + 150 * Math.cos((i * 30 * Math.PI) / 180);
            const y = 200 + 150 * Math.sin((i * 30 * Math.PI) / 180);
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.fillText(note, x + 12, y + 4);
        });

        canvasContainer.appendChild(canvas);
    }

    updateColor(midi, active) {
        // Logic to change colors based on harmonic distance
        console.log(`Updating Color Tree for note ${midi}: ${active}`);
    }
}