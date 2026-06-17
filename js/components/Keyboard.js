class Keyboard {
    constructor(bus, containerId) {
        this.bus = bus;
        this.container = document.getElementById(containerId);
        
        // Empezamos en Do de la octava 3 (MIDI 48) hasta Si de la octava 5 (MIDI 83)
        this.startMidi = 48;
        this.numKeys = 36; 
        this.layoutMode = 'piano'; // 'piano' o 'tonnetz'
        
        this.render();
        this.attachEvents();
        this.initDOM();
    }

    initDOM() {
        const selectKbdMode = document.getElementById('select-kbd-mode');
        if (selectKbdMode) {
            selectKbdMode.addEventListener('change', (e) => {
                this.layoutMode = e.target.value;
                console.log(`Modo de teclado cambiado a: ${this.layoutMode}`);
            });
        }
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        // Un patrón para saber cuáles teclas son negras en una octava
        const blackKeyPattern = [false, true, false, true, false, false, true, false, true, false, true, false];

        for (let i = 0; i < this.numKeys; i++) {
            const isBlack = blackKeyPattern[i % 12];
            const midiNote = this.startMidi + i;

            const key = document.createElement('div');
            key.className = `key ${isBlack ? 'black' : 'white'}`;
            key.dataset.midi = midiNote;

            this.container.appendChild(key);
        }

        this.attachMouseEvents();
    }

    attachMouseEvents() {
        // Hacer las teclas interactivas al ratón/táctil
        const keys = this.container.querySelectorAll('.key');
        keys.forEach(key => {
            const midiNote = parseInt(key.dataset.midi);

            // Al presionar el ratón
            key.addEventListener('mousedown', () => {
                this.bus.emit('noteOn', { midi: midiNote, velocity: 100 });
            });

            // Al soltar el ratón
            key.addEventListener('mouseup', () => {
                this.bus.emit('noteOff', { midi: midiNote });
            });

            // Por si el usuario arrastra el ratón fuera de la tecla presionada
            key.addEventListener('mouseleave', () => {
                if (key.classList.contains('active')) {
                    this.bus.emit('noteOff', { midi: midiNote });
                }
            });
        });
    }

    attachEvents() {
        // 1. Escuchar el bus global para encender/apagar teclas visualmente
        this.bus.on('noteOn', (data) => this.highlightKey(data.midi, true));
        this.bus.on('noteOff', (data) => this.highlightKey(data.midi, false));

        // Escuchar el cambio de tonalidad del Círculo de Quintas para ajustar la octava base
        this.bus.on('keyChanged', (data) => {
            if (data.type === 'maj') {
                this.startMidi = 48; // Octava 4 base
            } else if (data.type === 'min') {
                this.startMidi = 36; // Octava 3 base
            } else if (data.type === 'dim') {
                this.startMidi = 24; // Octava 2 base
            }
            console.log(`[Teclado] Transponiendo base de octava (startMidi): ${this.startMidi}`);
            this.render();
        });

        // 3. Hacer que las teclas de la computadora funcionen
        const computerPianoKeys = {
            'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65, 't': 66,
            'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72, 'o': 73, 'l': 74
        };

        const computerRiemannKeys = {
            '1': 36, '2': 43, '3': 50, '4': 57, '5': 64, '6': 71, '7': 78, '8': 85, '9': 92, '0': 99,
            'q': 40, 'w': 47, 'e': 54, 'r': 61, 't': 68, 'y': 75, 'u': 82, 'i': 89, 'o': 96, 'p': 103,
            'a': 44, 's': 51, 'd': 58, 'f': 65, 'g': 72, 'h': 79, 'j': 86, 'k': 93, 'l': 100,
            'z': 48, 'x': 55, 'c': 62, 'v': 69, 'b': 76, 'n': 83, 'm': 90
        };

        const activeComputerNotes = new Map();

        window.addEventListener('keydown', (event) => {
            if (event.repeat) return;
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

            const key = event.key.toLowerCase();
            const currentKeysMap = this.layoutMode === 'piano' ? computerPianoKeys : computerRiemannKeys;
            let midiNote = currentKeysMap[key];
            if (midiNote !== undefined) {
                // Sincronizar con el desplazamiento de octava
                const shift = this.startMidi - 48;
                midiNote += shift;

                this.bus.emit('noteOn', { midi: midiNote, velocity: 100 });
                activeComputerNotes.set(key, midiNote);
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            const midiNote = activeComputerNotes.get(key);
            if (midiNote !== undefined) {
                this.bus.emit('noteOff', { midi: midiNote });
                activeComputerNotes.delete(key);
            }
        });
    }

    highlightKey(midiNote, isActive) {
        if (!this.container) return;
        const key = this.container.querySelector(`.key[data-midi="${midiNote}"]`);
        if (key) {
            isActive ? key.classList.add('active') : key.classList.remove('active');
        }
    }
}
