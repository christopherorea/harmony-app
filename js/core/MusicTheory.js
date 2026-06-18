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
        // Mapa de enarmónicos para el círculo de quintas
        const enharmonicMap = {
            'C#': 'Db',
            'D#': 'Eb',
            'F#': 'F#/Gb',
            'G#': 'Ab',
            'A#': 'Bb'
        };

        // Función auxiliar: obtiene el índice del círculo para un Pitch Class (0-11)
        const getCircleIndex = (pitchClass) => {
            const noteName = this.noteNames[pitchClass];
            const circleName = enharmonicMap[noteName] || noteName;
            return this.circleOfFifthsOrder.indexOf(circleName);
        };

        // Recorremos cada nota del acorde como posible raíz para soportar inversiones
        for (let i = 0; i < notes.length; i++) {
            const root = notes[i];
            const intervals = notes.map(n => (n - root + 12) % 12);
            
            const rootName = this.noteNames[root];
            const displayName = enharmonicMap[rootName] || rootName;

            const hasMajorThird = intervals.includes(4);
            const hasMinorThird = intervals.includes(3);
            const hasPerfectFifth = intervals.includes(7);
            const hasAugmentedFifth = intervals.includes(8);
            const hasDiminishedFifth = intervals.includes(6);

            if (hasMajorThird && hasPerfectFifth) {
                return { 
                    name: `${displayName} Maj`, 
                    rootIndex: getCircleIndex(root), 
                    mode: 'ionian', 
                    notes: notes 
                };
            }
            if (hasMinorThird && hasPerfectFifth) {
                // Acorde Menor: El índice del círculo corresponde a su Relativa Mayor (+3 semitonos)
                const relativeMajor = (root + 3) % 12;
                return { 
                    name: `${rootName} Min`, 
                    rootIndex: getCircleIndex(relativeMajor), 
                    mode: 'aeolian', 
                    notes: notes 
                };
            }
            if (hasMajorThird && hasAugmentedFifth) {
                return { 
                    name: `${displayName} Aug`, 
                    rootIndex: getCircleIndex(root), 
                    mode: 'lydian', 
                    notes: notes 
                };
            }
            if (hasMinorThird && hasDiminishedFifth) {
                return { 
                    name: `${displayName} Dim`, 
                    rootIndex: getCircleIndex(root), 
                    mode: 'locrian', 
                    notes: notes 
                };
            }
        }
        return null;
    }
}