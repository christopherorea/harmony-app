class MusicTheory {
    constructor(bus) {
        this.bus = bus;
        this.activeNotes = new Set();
        
        // Diccionario de Pitch Class a nombres
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        // Orden del círculo de quintas para mapear rootIndex
        this.circleOfFifthsOrder = ['C', 'G', 'D', 'A', 'E', 'B', 'F#/Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

        this.attachEvents();
    }

    attachEvents() {
        this.bus.on('noteOn', (data) => {
            this.activeNotes.add(data.midi % 12);
            this.analyzeHarmony();
        });

        this.bus.on('noteOff', (data) => {
            this.activeNotes.delete(data.midi % 12);
            this.analyzeHarmony();
        });
    }

    analyzeHarmony() {
        const notes = Array.from(this.activeNotes).sort((a, b) => a - b);
        
        if (notes.length < 3) {
            this.bus.emit('chordCleared');
            return;
        }

        const chordData = this.detectChord(notes);
        if (chordData) {
            this.bus.emit('chordDetected', chordData);
        }
    }

    detectChord(notes) {
        // Recorremos cada nota del acorde como posible raíz para soportar inversiones
        for (let i = 0; i < notes.length; i++) {
            const root = notes[i];
            const intervals = notes.map(n => (n - root + 12) % 12);

            const rootName = this.noteNames[root];
            // Mapeamos el nombre de la raíz al formato usado en el círculo de quintas
            let circleRootName = rootName;
            if (rootName === 'C#') circleRootName = 'Db';
            if (rootName === 'D#') circleRootName = 'Eb';
            if (rootName === 'F#') circleRootName = 'F#/Gb';
            if (rootName === 'G#') circleRootName = 'Ab';
            if (rootName === 'A#') circleRootName = 'Bb';

            const rootIndex = this.circleOfFifthsOrder.indexOf(circleRootName);

            // [0, 4, 7] = Mayor
            if (intervals.includes(4) && intervals.includes(7)) {
                return {
                    name: `${circleRootName} Maj`,
                    rootIndex: rootIndex,
                    mode: 'ionian',
                    notes: notes
                };
            }
            // [0, 3, 7] = Menor
            if (intervals.includes(3) && intervals.includes(7)) {
                return {
                    name: `${circleRootName} Min`,
                    rootIndex: rootIndex,
                    mode: 'aeolian',
                    notes: notes
                };
            }
            // [0, 3, 6] = Disminuido
            if (intervals.includes(3) && intervals.includes(6)) {
                return {
                    name: `${circleRootName} Dim`,
                    rootIndex: rootIndex,
                    mode: 'locrian',
                    notes: notes
                };
            }
        }
        return null;
    }
}
