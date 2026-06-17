class CircleOfFifths {
    constructor(bus, containerId) {
        this.bus = bus;
        this.container = document.getElementById(containerId);
        this.centerX = 200; this.centerY = 200; 
        this.radiusMaj = 160; 
        this.radiusMin = 110; 
        this.radiusDim = 65;

        this.majors = ['C', 'G', 'D', 'A', 'E', 'B', 'F#/Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
        this.minors = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
        this.dims =   ['Bdim', 'F#dim', 'C#dim', 'G#dim', 'D#dim', 'A#dim', 'E#dim', 'Cdim', 'Gdim', 'Ddim', 'Adim', 'Edim'];

        this.render();
        this.highlightKeyGroup(0, 'ionian'); // Empieza en C

        this.activeModifiers = [];
        this.bus.on('modifiersUpdated', (mods) => {
            this.activeModifiers = mods;
        });

        // Escuchar al motor de teoría
        this.bus.on('chordDetected', (chordData) => {
            const chordName = typeof chordData === 'object' ? chordData.name : chordData;
            const isMinor = chordName.includes('Min');
            const rootNote = chordName.split(' ')[0]; // Extrae "C", "A", etc.

            // 1. Iluminar el Key-Group central
            const targetArray = isMinor ? this.minors : this.majors;
            const index = targetArray.findIndex(n => n.startsWith(rootNote));
            
            if (index !== -1) {
                this.highlightKeyGroup(index, isMinor ? 'aeolian' : 'ionian');
            }
        });

        this.bus.on('chordCleared', () => {
            // Opcional: limpiar los highlights cuando se sueltan las teclas
        });
    }

    minimize() {
        if (!this.container) return;
        this.container.style.transition = "transform 0.4s ease, opacity 0.4s ease";
        this.container.style.transform = "scale(0.75)";
        this.container.style.transformOrigin = "center center";
    }

    restore() {
        if (!this.container) return;
        this.container.style.transition = "transform 0.4s ease, opacity 0.4s ease";
        this.container.style.transform = "scale(1)";
        this.container.style.transformOrigin = "center center";
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.style.position = 'relative';

        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI / 6) - (Math.PI / 2);
            this.createNode(this.majors[i], angle, this.radiusMaj, 'maj', i);
            this.createNode(this.minors[i], angle, this.radiusMin, 'min', i);
            this.createNode(this.dims[i], angle, this.radiusDim, 'dim', i);
        }
    }

    createNode(label, angle, radius, type, index) {
        const x = this.centerX + radius * Math.cos(angle);
        const y = this.centerY + radius * Math.sin(angle);
        const size = type === 'maj' ? 55 : (type === 'min' ? 45 : 38);

        const btn = document.createElement('div');
        btn.className = `circle-node ${type}`;
        btn.dataset.index = index;
        btn.style.left = `${x - size/2}px`;
        btn.style.top = `${y - size/2}px`;
        btn.style.width = `${size}px`;
        btn.style.height = `${size}px`;

        btn.innerHTML = `<span class="chord-name">${label}</span><span class="roman-numeral"></span>`;
        
        let activeNotes = [];

        const playChord = () => {
            this.highlightKeyGroup(index, type === 'min' ? 'aeolian' : 'ionian');
            this.bus.emit('keyChanged', { note: label, type: type, index: index });

            if (activeNotes.length > 0) {
                activeNotes.forEach(midi => this.bus.emit('noteOff', { midi }));
            }

            activeNotes = this.getChordMidiNotes(label, type);
            activeNotes.forEach(midi => {
                this.bus.emit('noteOn', { midi: midi, velocity: 90 });
            });
        };

        const releaseChord = () => {
            if (activeNotes.length > 0) {
                activeNotes.forEach(midi => {
                    this.bus.emit('noteOff', { midi: midi });
                });
                activeNotes = [];
            }
        };

        // Eventos de ratón
        btn.addEventListener('mousedown', (e) => {
            playChord();
        });

        btn.addEventListener('mouseup', releaseChord);
        btn.addEventListener('mouseleave', releaseChord);

        // Soporte para dispositivos táctiles
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playChord();
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            releaseChord();
        });

        this.container.appendChild(btn);
    }

    getChordMidiNotes(label, type) {
        // 1. Extraer nombre de nota raíz
        let rootName = label;
        if (type === 'min' && label.endsWith('m')) {
            rootName = label.slice(0, -1);
        } else if (type === 'dim' && label.endsWith('dim')) {
            rootName = label.slice(0, -3);
        }
        
        // Dividir nombres dobles como F#/Gb
        if (rootName.includes('/')) {
            rootName = rootName.split('/')[0];
        }

        // Mapear nombre de nota a pitch class
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        const rootPitch = noteMap[rootName] !== undefined ? noteMap[rootName] : 0;
        
        // Colocar la tónica en una octava cómoda (ej. octava 3, MIDI 48-59)
        const baseMidi = 48 + rootPitch;

        // 2. Definir intervalos de tríada básica
        let intervals = [];
        let isSus4 = this.activeModifiers.includes('sus4');
        let isSus2 = this.activeModifiers.includes('sus2');
        let isAug = this.activeModifiers.includes('aug');
        let isDim = this.activeModifiers.includes('dim') || type === 'dim';

        let third = type === 'min' ? 3 : 4;
        if (isSus4) third = 5;
        if (isSus2) third = 2;

        let fifth = 7;
        if (isAug) fifth = 8;
        if (isDim) fifth = 6;

        intervals.push(0);
        intervals.push(third);
        intervals.push(fifth);

        // Aplicar extensiones/modificadores adicionales si están activos
        this.activeModifiers.forEach(mod => {
            switch (mod) {
                case '6':
                    intervals.push(9);
                    break;
                case '7':
                    intervals.push(10);
                    break;
                case 'maj7':
                    intervals.push(11);
                    break;
                case '9':
                case 'add9':
                    intervals.push(14);
                    break;
                case 'maj9':
                    intervals.push(11);
                    intervals.push(14);
                    break;
                case 'b9':
                    intervals.push(13);
                    break;
                case '#9':
                case '7#9':
                    intervals.push(10);
                    intervals.push(15);
                    break;
                case '11':
                case 'add11':
                    intervals.push(17);
                    break;
                case 'maj11':
                    intervals.push(11);
                    intervals.push(17);
                    break;
                case '#11':
                    intervals.push(18);
                    break;
                case '13':
                case 'add13':
                    intervals.push(21);
                    break;
                case 'maj13':
                    intervals.push(11);
                    intervals.push(21);
                    break;
                case 'b13':
                    intervals.push(20);
                    break;
                case 'dim7':
                    intervals.push(9);
                    break;
                case 'halfDim':
                    intervals.push(10);
                    break;
                case '-12':
                    intervals.push(-12);
                    break;
                case '-24':
                    intervals.push(-24);
                    break;
            }
        });

        // Eliminar duplicados y ordenar
        const uniqueIntervals = Array.from(new Set(intervals)).sort((a, b) => a - b);

        // Devolver notas MIDI completas
        return uniqueIntervals.map(interval => baseMidi + interval);
    }

    highlightKeyGroup(tonicIndex, mode = 'ionian') {
        document.querySelectorAll('.circle-node').forEach(n => {
            n.classList.remove('active');
            n.querySelector('.roman-numeral').textContent = '';
        });

        const mod = (n, m) => ((n % m) + m) % m;
        
        // El grupo diatónico depende de si la tónica es mayor (ionian) o menor (aeolian)
        let activeIndices = [];
        let mapping = { maj: {}, min: {}, dim: {} };

        if (mode === 'aeolian') {
            // Relativos menores: el tónico principal es menor (ej. Am es vi)
            // Am (vi) -> C (I), Dm (ii) -> F (IV), Em (iii) -> G (V), Bdim (vii°)
            // Para Am (index 0 de menores, que se alinea con C index 0 de mayores):
            // Su I relativo mayor está en tonicIndex (C)
            const majTonic = tonicIndex; 
            activeIndices = [majTonic, mod(majTonic - 1, 12), mod(majTonic + 1, 12)];

            mapping = {
                maj: { [majTonic]: 'I', [mod(majTonic - 1, 12)]: 'IV', [mod(majTonic + 1, 12)]: 'V' },
                min: { [majTonic]: 'vi', [mod(majTonic - 1, 12)]: 'ii', [mod(majTonic + 1, 12)]: 'iii' },
                dim: { [majTonic]: 'vii°' }
            };
        } else {
            // Mayor (Ionian):
            // C (I) -> F (IV), G (V), Am (vi), Dm (ii), Em (iii), Bdim (vii°)
            activeIndices = [tonicIndex, mod(tonicIndex - 1, 12), mod(tonicIndex + 1, 12)];
            
            mapping = {
                maj: { [tonicIndex]: 'I', [mod(tonicIndex - 1, 12)]: 'IV', [mod(tonicIndex + 1, 12)]: 'V' },
                min: { [tonicIndex]: 'vi', [mod(tonicIndex - 1, 12)]: 'ii', [mod(tonicIndex + 1, 12)]: 'iii' },
                dim: { [tonicIndex]: 'vii°' }
            };
        }

        document.querySelectorAll('.circle-node').forEach(node => {
            const idx = parseInt(node.dataset.index);
            const type = node.classList.contains('maj') ? 'maj' : (node.classList.contains('min') ? 'min' : 'dim');
            
            if (activeIndices.includes(idx)) {
                if (type === 'dim' && idx !== (mode === 'aeolian' ? tonicIndex : tonicIndex)) {
                    // Mantener el vii° alineado al tónico mayor
                    if (idx !== activeIndices[0]) return;
                }
                node.classList.add('active');
                if (mapping[type][idx]) node.querySelector('.roman-numeral').textContent = mapping[type][idx];
            }
        });
    }

    highlightProgressionChords(mappedChords) {
        document.querySelectorAll('.circle-node').forEach(n => {
            n.classList.remove('active');
            n.querySelector('.roman-numeral').textContent = '';
        });

        mappedChords.forEach(item => {
            const isMinor = item.chord.includes('Min');
            const isDim = item.chord.includes('Dim');
            const isMajor = !isMinor && !isDim;

            const rootNote = item.chord.split(' ')[0]; // Extrae "C", "A", etc.

            let targetArray = this.majors;
            let type = 'maj';
            if (isMinor) {
                targetArray = this.minors;
                type = 'min';
            } else if (isDim) {
                targetArray = this.dims;
                type = 'dim';
            }

            const idx = targetArray.findIndex(n => n.split('/')[0] === rootNote || n === rootNote);
            if (idx !== -1) {
                const node = this.container.querySelector(`.circle-node.${type}[data-index="${idx}"]`);
                if (node) {
                    node.classList.add('active');
                    node.querySelector('.roman-numeral').textContent = item.roman;
                }
            }
        });
    }
}
