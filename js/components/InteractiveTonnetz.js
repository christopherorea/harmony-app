class InteractiveTonnetz {
    constructor(bus) {
        this.bus = bus;
        this.container = document.getElementById('tonnetz-canvas');
        this.viewEditor = document.getElementById('tab-editor');
        this.viewTonnetz = document.getElementById('tab-tonnetz');
        this.activeKeys = new Set(); 
        this.keyToMidiMap = { 
            'q': 60, 
            'w': 67, 
            'e': 64, 
            'r': 63  
        };
        this.midiToNodeMap = new Map(); 
        this.radius = 22; // Radio de cada nodo para diseño estético
        this.startMidi = 48; // Octava base inicial (Do de la octava 3)
        this.activeMidiNotes = new Set(); // Notas activas reproducidas actualmente

        this.drawBasicGrid(); 
        this.attachKeyboardEvents();
        this.initEvents();
    }

    initEvents() {
        // Escuchar el cambio de tonalidad del Círculo de Quintas para ajustar la octava base del Tonnetz
        this.bus.on('keyChanged', (data) => {
            if (data.type === 'maj') {
                this.startMidi = 48; // Octava 4 base (con Do central en 60, startMidi=48)
            } else if (data.type === 'min') {
                this.startMidi = 36; // Octava 3 base (con Do central en 48, startMidi=36)
            } else if (data.type === 'dim') {
                this.startMidi = 24; // Octava 2 base (con Do central en 36, startMidi=24)
            }
            console.log(`[Tonnetz] Transponiendo base de octava (startMidi): ${this.startMidi}`);
            this.drawBasicGrid();
        });

        // Escuchar notas físicas u on-screen para encender/apagar dinámicamente los nodos de Tonnetz
        this.bus.on('noteOn', (data) => {
            this.activeMidiNotes.add(data.midi);
            this.highlightTriangles(this.activeMidiNotes);
        });

        this.bus.on('noteOff', (data) => {
            this.activeMidiNotes.delete(data.midi);
            if (this.activeMidiNotes.size === 0) {
                this.clearHighlights();
            } else {
                this.highlightTriangles(this.activeMidiNotes);
            }
        });
    }

    drawBasicGrid() {
        this.container.innerHTML = '';
        const width = this.container.clientWidth || 600;
        const height = 400;

        const svg = d3.select('#tonnetz-canvas')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('background', '#08080a'); // Fondo negro/oscuro elegante

        const u = 80; // Aumentado de 55 a 80 para hacer la red más amplia y espaciosa
        const yUnit = u * Math.sqrt(3);

        const cx = width / 2;
        const cy = height / 2;

        const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
        const nodesData = [];

        // Determinar límites del bucle para cubrir completamente el lienzo con un Tonnetz infinito y continuo
        const colsRange = Math.ceil(width / u) + 2;
        const rowsRange = Math.ceil(height / yUnit) + 2;

        // Generar nodos de tipo A y tipo B de forma entrelazada (Triangular Lattice)
        // Matematica Riemanniana:
        // pitch_A = i - 7*j
        // pitch_B = pitch_A + 4 (Tercera Mayor hacia abajo-derecha)
        for (let j = -colsRange; j <= colsRange; j++) {
            for (let i = -rowsRange; i <= rowsRange; i++) {
                // Nodo A
                const xA = cx - j * u;
                const yA = cy + i * yUnit;
                const pitchA = ((i - 7 * j) % 12 + 12) % 12;

                const nodeA = {
                    key: `A_${j}_${i}`,
                    type: 'A',
                    x: xA, y: yA,
                    pitch: pitchA,
                    noteName: noteNames[pitchA],
                    midi: this.startMidi + (pitchA % 12)
                };
                nodesData.push(nodeA);

                // Nodo B (desplazado para completar la red triangular perfecta)
                const xB = cx - (j - 0.5) * u;
                const yB = cy + (i + 0.5) * yUnit;
                const pitchB = ((i - 7 * j + 4) % 12 + 12) % 12;

                const nodeB = {
                    key: `B_${j}_${i}`,
                    type: 'B',
                    x: xB, y: yB,
                    pitch: pitchB,
                    noteName: noteNames[pitchB],
                    midi: this.startMidi + (pitchB % 12)
                };
                nodesData.push(nodeB);
            }
        }

        // Filtrar nodos visibles con un margen para evitar cortes abruptos en el borde
        const visibleNodes = nodesData.filter(n => n.x >= -u && n.x <= width + u && n.y >= -u && n.y <= height + u);

        // Construcción geométrica de caras de triángulos de forma 100% robusta
        // Uniendo tríos de nodos que se encuentran exactamente a distancia 'u' (equiláteros)
        const triangles = [];
        const threshold = 1.5; // Margen de tolerancia para coma flotante
        const n = visibleNodes.length;

        for (let i = 0; i < n; i++) {
            const n1 = visibleNodes[i];
            for (let j = i + 1; j < n; j++) {
                const n2 = visibleNodes[j];
                const d12 = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                if (Math.abs(d12 - u) > threshold) continue;

                for (let k = j + 1; k < n; k++) {
                    const n3 = visibleNodes[k];
                    const d13 = Math.hypot(n1.x - n3.x, n1.y - n3.y);
                    if (Math.abs(d13 - u) > threshold) continue;

                    const d23 = Math.hypot(n2.x - n3.x, n2.y - n3.y);
                    if (Math.abs(d23 - u) > threshold) continue;

                    // ¡Triángulo regular detectado!
                    // Analizamos si la tríada es Mayor o Menor encontrando la nota raíz (fundamental)
                    let chordType = 'unknown';
                    const vertices = [n1, n2, n3];

                    for (let v of vertices) {
                        const root = v.pitch;
                        const otherPitches = vertices.filter(x => x !== v).map(x => (x.pitch - root + 12) % 12);
                        if (otherPitches.includes(4) && otherPitches.includes(7)) {
                            chordType = 'major';
                            break;
                        }
                        if (otherPitches.includes(3) && otherPitches.includes(7)) {
                            chordType = 'minor';
                            break;
                        }
                    }

                    triangles.push({
                        type: chordType,
                        vertices: vertices,
                        midiNotes: vertices.map(v => v.midi)
                    });
                }
            }
        }

        // 1. Dibujar las caras de los triángulos (Polígonos de fondo)
        const faces = svg.selectAll('.tonnetz-face')
            .data(triangles).enter()
            .append('polygon')
            .attr('class', 'tonnetz-face')
            .attr('points', d => d.vertices.map(v => `${v.x},${v.y}`).join(' '))
            .attr('fill', d => d.type === 'major' ? 'rgba(245, 176, 65, 0.02)' : 'rgba(79, 168, 255, 0.02)')
            .attr('stroke', 'rgba(184, 151, 66, 0.15)') // Líneas doradas hermosas
            .attr('stroke-width', 1.2)
            .style('cursor', 'pointer');

        // Añadir etiquetas de notas en el centro de cada triángulo
        svg.selectAll('.tonnetz-label')
            .data(triangles).enter()
            .append('text')
            .attr('class', 'tonnetz-label')
            .attr('x', d => (d.vertices[0].x + d.vertices[1].x + d.vertices[2].x) / 3)
            .attr('y', d => (d.vertices[0].y + d.vertices[1].y + d.vertices[2].y) / 3)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', 'rgba(255, 255, 255, 0.3)')
            .style('font-size', '10px')
            .style('font-family', 'monospace')
            .style('pointer-events', 'none')
            .text(d => {
                // Encontrar la nota raíz del acorde para mostrarla
                let root = '';
                const vertices = d.vertices;
                for (let v of vertices) {
                    const otherPitches = vertices.filter(x => x !== v).map(x => (x.pitch - v.pitch + 12) % 12);
                    if (otherPitches.includes(4) && otherPitches.includes(7)) {
                        root = v.noteName;
                        break;
                    }
                    if (otherPitches.includes(3) && otherPitches.includes(7)) {
                        root = v.noteName;
                        break;
                    }
                }
                return d.type === 'minor' ? root.toLowerCase() : root;
            });

        // Hacer que las caras respondan al clic (reproduce la tríada)
        faces.on('mousedown', (event, d) => {
            d.midiNotes.forEach(midi => this.bus.emit('noteOn', { midi, velocity: 80 }));
        });

        faces.on('mouseup', (event, d) => {
            d.midiNotes.forEach(midi => this.bus.emit('noteOff', { midi }));
        });

        faces.on('mouseleave', (event, d) => {
            if (event.buttons === 1) {
                d.midiNotes.forEach(midi => this.bus.emit('noteOff', { midi }));
            }
        });

        // Soporte táctil mejorado para caras (Glide/Slide)
        faces.on('touchstart', (event, d) => {
            event.preventDefault();
            this.currentActiveChord = d;
            d.midiNotes.forEach(midi => this.bus.emit('noteOn', { midi, velocity: 80 }));
        });

        faces.on('touchmove', (event) => {
            event.preventDefault();
            
            // En touchmove, D3 no pasa automáticamente el dato 'd' del elemento
            // Necesitamos encontrar qué elemento está bajo el dedo
            const touch = event.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (target && target.classList.contains('tonnetz-face')) {
                const d = d3.select(target).datum();
                if (this.currentActiveChord && this.currentActiveChord !== d) {
                    // Apagar el acorde anterior
                    this.currentActiveChord.midiNotes.forEach(midi => this.bus.emit('noteOff', { midi }));
                    // Encender el nuevo
                    d.midiNotes.forEach(midi => this.bus.emit('noteOn', { midi, velocity: 80 }));
                    this.currentActiveChord = d;
                }
            }
        });

        faces.on('touchend', (event, d) => {
            event.preventDefault();
            d.midiNotes.forEach(midi => this.bus.emit('noteOff', { midi }));
            this.currentActiveChord = null;
        });

        // 2. Dibujar los nodos (Círculos)
        const nodes = svg.selectAll('.tonnetz-node')
            .data(visibleNodes).enter()
            .append('g')
            .attr('class', 'tonnetz-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .style('cursor', 'pointer');

        nodes.append('circle')
            .attr('r', this.radius - 4)
            .attr('fill', '#121214')
            .attr('stroke', '#b89742') // Bordes dorados majestuosos como en la imagen
            .attr('stroke-width', 1.5);

        nodes.append('text')
            .text(d => d.noteName)
            .attr('text-anchor', 'middle')
            .attr('dy', 4)
            .attr('fill', '#ffffff')
            .style('font-size', '10px')
            .style('font-weight', '600')
            .style('pointer-events', 'none');

        // Mapear los grupos D3 para actualizaciones visuales rápidas
        this.midiToNodeMap.clear();
        nodes.each((d, i, n) => this.midiToNodeMap.set(d.midi, d3.select(n[i])));

        // Del Tonnetz hacia la App (Clic en un nodo individual)
        nodes.on('mousedown', (event, d) => {
            this.bus.emit('noteOn', { midi: d.midi, velocity: 100 });
        });

        nodes.on('mouseup', (event, d) => {
            this.bus.emit('noteOff', { midi: d.midi });
        });
        
        nodes.on('mouseleave', (event, d) => {
            if (event.buttons === 1) {
                this.bus.emit('noteOff', { midi: d.midi });
            }
        });

        // Soporte táctil completo para nodos
        nodes.on('touchstart', (event, d) => {
            event.preventDefault();
            this.bus.emit('noteOn', { midi: d.midi, velocity: 100 });
        });

        nodes.on('touchend', (event, d) => {
            event.preventDefault();
            this.bus.emit('noteOff', { midi: d.midi });
        });
    }

    highlightTriangles(activeMidiNotes) {
        const activePitches = new Set(Array.from(activeMidiNotes).map(m => m % 12));
        
        // 1. Iluminar caras (triángulos) si sus 3 vértices están encendidos
        d3.selectAll('.tonnetz-face')
            .transition().duration(100)
            .attr('fill', d => {
                const allActive = d.vertices.every(v => activePitches.has(v.pitch));
                if (allActive) {
                    return d.type === 'major' ? 'rgba(245, 176, 65, 0.45)' : 'rgba(79, 168, 255, 0.45)';
                }
                return d.type === 'major' ? 'rgba(245, 176, 65, 0.02)' : 'rgba(79, 168, 255, 0.02)';
            })
            .attr('stroke', d => {
                const allActive = d.vertices.every(v => activePitches.has(v.pitch));
                return allActive ? '#ffffff' : 'rgba(184, 151, 66, 0.15)';
            });

        // 2. Iluminar nodos
        d3.selectAll('.tonnetz-node circle')
            .transition().duration(100)
            .attr('fill', d => activePitches.has(d.pitch) ? '#ffd700' : '#121214')
            .attr('stroke', d => activePitches.has(d.pitch) ? '#ffffff' : '#b89742')
            .attr('r', d => activePitches.has(d.pitch) ? this.radius - 2 : this.radius - 4);

        d3.selectAll('.tonnetz-node text')
            .transition().duration(100)
            .attr('fill', d => activePitches.has(d.pitch) ? '#000000' : '#ffffff');
    }

    clearHighlights() {
        d3.selectAll('.tonnetz-face')
            .transition().duration(100)
            .attr('fill', d => d.type === 'major' ? 'rgba(245, 176, 65, 0.02)' : 'rgba(79, 168, 255, 0.02)')
            .attr('stroke', 'rgba(184, 151, 66, 0.15)');

        d3.selectAll('.tonnetz-node circle')
            .transition().duration(100)
            .attr('fill', '#121214')
            .attr('stroke', '#b89742')
            .attr('r', this.radius - 4);

        d3.selectAll('.tonnetz-node text')
            .transition().duration(100)
            .attr('fill', '#ffffff');
    }

    attachKeyboardEvents() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            const midiNote = this.keyToMidiMap[key];

            if (midiNote !== undefined && !this.activeKeys.has(key)) {
                if (document.getElementById('tab-tonnetz').classList.contains('active')) {
                    this.activeKeys.add(key);
                    this.bus.emit('noteOn', { midi: midiNote, velocity: 100 });
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            const midiNote = this.keyToMidiMap[key];

            if (midiNote !== undefined && this.activeKeys.has(key)) {
                if (document.getElementById('tab-tonnetz').classList.contains('active')) {
                    this.activeKeys.delete(key);
                    this.bus.emit('noteOff', { midi: midiNote });
                }
            }
        });
    }
}