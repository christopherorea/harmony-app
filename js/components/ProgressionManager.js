class ProgressionManager {
    constructor(bus) {
        this.bus = bus;
        this.currentKey = 'C';
        this.currentMode = 'ionian';

        this.isPlaying = false;
        this.currentStep = 0;
        this.loopInterval = null;
        this.activeLoopNotes = [];
        this.mappedChords = [];

        this.presets = {
            // --- POP / ROCK FUNDAMENTAL ---
            popClassic1: { name: "I, V, vi, IV (Pop Classic 1)", numerals: ['I', 'V', 'VI', 'IV'] },
            popClassic2: { name: "vi, IV, I, V (Pop Classic 2)", numerals: ['VI', 'IV', 'I', 'V'] },
            popBallad50s: { name: "I, vi, IV, V (50s Progression)", numerals: ['I', 'VI', 'IV', 'V'] },

            // --- ROCK / CINEMATIC ---
            rockBallad: { name: "Rock Ballad Turnaround", numerals: ['i', 'VI', 'III', 'VII'] },
            cinematicSuspense: { name: "Cinematic Suspense (i, bVI)", numerals: ['i', 'bVI'] },
            epicHeroic: { name: "Epic Heroic (I, bVII, IV)", numerals: ['I', 'bVII', 'IV'] },

            // --- JAZZ / R&B / SOUL ---
            jazzStandard: { name: "ii, V, I (Jazz Standard)", numerals: ['ii', 'V', 'I'] },
            jazzMinor: { name: "iiø, V7, i (Minor ii-V-I)", numerals: ['ii°', 'V', 'i'] },
            neoSoul: { name: "Neo-Soul Movement (iii, VI, ii, V)", numerals: ['iii', 'VI', 'ii', 'V'] },

            // --- MOVIMIENTOS AVANZADOS ---
            pachelbel: { name: "Pachelbel's Canon", numerals: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'] },
            andalusianCadence: { name: "Andalusian Cadence", numerals: ['i', 'bVII', 'bVI', 'V'] },
            tritoneSub: { name: "Jazz Tritone Sub (ii, bII7, I)", numerals: ['ii', 'bII', 'I'] }
        };

        // Mapa extendido para transposición dinámica basado en la tonalidad y modo
        this.chordScaleMaps = {
            'C': { 'i': 'C Min', 'ii': 'D Dim', 'III': 'Eb Maj', 'iv': 'F Min', 'v': 'G Min', 'V': 'G Maj', 'VI': 'Ab Maj', 'VII': 'Bb Maj' },
            'G': { 'i': 'G Min', 'ii': 'A Dim', 'III': 'Bb Maj', 'iv': 'C Min', 'v': 'D Min', 'V': 'D Maj', 'VI': 'Eb Maj', 'VII': 'F Maj' },
            'D': { 'i': 'D Min', 'ii': 'E Dim', 'III': 'F Maj', 'iv': 'G Min', 'v': 'A Min', 'V': 'A Maj', 'VI': 'Bb Maj', 'VII': 'C Maj' },
            'A': { 'i': 'A Min', 'ii': 'B Dim', 'III': 'C Maj', 'iv': 'D Min', 'v': 'E Min', 'V': 'E Maj', 'VI': 'F Maj', 'VII': 'G Maj' },
            'E': { 'i': 'E Min', 'ii': 'F# Dim', 'III': 'G Maj', 'iv': 'A Min', 'v': 'B Min', 'V': 'B Maj', 'VI': 'C Maj', 'VII': 'D Maj' },
            'B': { 'i': 'B Min', 'ii': 'C# Dim', 'III': 'D Maj', 'iv': 'E Min', 'v': 'F# Min', 'V': 'F# Maj', 'VI': 'G Maj', 'VII': 'A Maj' },
            'F#/Gb': { 'i': 'F# Min', 'ii': 'G# Dim', 'III': 'A Maj', 'iv': 'B Min', 'v': 'C# Min', 'V': 'C# Maj', 'VI': 'D Maj', 'VII': 'E Maj' },
            'Db': { 'i': 'C# Min', 'ii': 'D# Dim', 'III': 'E Maj', 'iv': 'F# Min', 'v': 'G# Min', 'V': 'G# Maj', 'VI': 'A Maj', 'VII': 'B Maj' },
            'Ab': { 'i': 'G# Min', 'ii': 'A# Dim', 'III': 'B Maj', 'iv': 'C# Min', 'v': 'D# Min', 'V': 'D# Maj', 'VI': 'E Maj', 'VII': 'F# Maj' },
            'Eb': { 'i': 'Eb Min', 'ii': 'F Dim', 'III': 'Gb Maj', 'iv': 'Ab Min', 'v': 'Bb Min', 'V': 'Bb Maj', 'VI': 'Cb Maj', 'VII': 'Db Maj' },
            'Bb': { 'i': 'Bb Min', 'ii': 'C Dim', 'III': 'Db Maj', 'iv': 'Eb Min', 'v': 'F Min', 'V': 'F Maj', 'VI': 'Gb Maj', 'VII': 'Ab Maj' },
            'F': { 'i': 'F Min', 'ii': 'G Dim', 'III': 'Ab Maj', 'iv': 'Bb Min', 'v': 'C Min', 'V': 'C Maj', 'VI': 'Db Maj', 'VII': 'Eb Maj' }
        };

        this.currentPresetKey = 'popClassic2';
        this.initDOM();
    }

    initDOM() {
        // Preset clicks (delegado para responder correctamente a los botones de la lista de presets)
        document.body.addEventListener('click', (e) => {
            const presetBtn = e.target.closest('.preset-btn');
            if (presetBtn) {
                this.currentPresetKey = presetBtn.dataset.preset;
                this.loadProgression(this.currentPresetKey);
            }
        });

        // Escuchar si el acorde actual pertenece a la progresión cargada en las cajas superiores
        this.bus.on('chordDetected', (chordData) => {
            const chordName = typeof chordData === 'object' ? chordData.name : chordData;
            this.updateProgressionStatus(chordName);
        });

        // Controles de Loop
        const btnToggleLoop = document.getElementById('btn-toggle-loop');
        if (btnToggleLoop) {
            btnToggleLoop.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.stopLoop();
                } else {
                    this.startLoop();
                }
            });
        }

        const loopBpmInput = document.getElementById('loop-bpm');
        if (loopBpmInput) {
            loopBpmInput.addEventListener('input', (e) => {
                const val = e.target.value;
                const bpmValEl = document.getElementById('bpm-val');
                if (bpmValEl) bpmValEl.textContent = val;
                
                // Si está reproduciendo, reiniciar el intervalo con el nuevo tiempo
                if (this.isPlaying) {
                    this.restartLoopInterval();
                }
            });
        }

        // Navegación de Pestañas (Tabs)
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetTab = tab.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(content => {
                    if (content.id === targetTab) {
                        content.classList.remove('hidden');
                        content.classList.add('active');
                    } else {
                        content.classList.add('hidden');
                        content.classList.remove('active');
                    }
                });

                // Si se activa el Tonnetz, avisamos para que se redibuje si es necesario
                if (targetTab === 'tab-tonnetz') {
                    this.bus.emit('viewChanged', 'tonnetz');
                } else {
                    this.bus.emit('viewChanged', 'editor');
                }
            });
        });
    }

    startLoop() {
        if (this.loopInterval) return;
        this.currentStep = 0;
        this.isPlaying = true;
        this.updatePlayButtonUI();

        const tick = () => {
            if (!this.isPlaying) return;
            this.playStep(this.currentStep);
            this.currentStep = (this.currentStep + 1) % this.mappedChords.length;
        };

        tick(); // Ejecutar primer paso inmediatamente
        const bpm = parseInt(document.getElementById('loop-bpm')?.value || '90');
        const intervalMs = (60 / bpm) * 2000; // 2 tiempos por acorde

        this.loopInterval = setInterval(tick, intervalMs);
    }

    stopLoop() {
        this.isPlaying = false;
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.releaseCurrentChord();
        this.currentStep = 0;
        this.updatePlayButtonUI();
        this.highlightActiveStep(-1);
    }

    restartLoopInterval() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }

        const tick = () => {
            if (!this.isPlaying) return;
            this.playStep(this.currentStep);
            this.currentStep = (this.currentStep + 1) % this.mappedChords.length;
        };

        const bpm = parseInt(document.getElementById('loop-bpm')?.value || '90');
        const intervalMs = (60 / bpm) * 2000;

        this.loopInterval = setInterval(tick, intervalMs);
    }

    releaseCurrentChord() {
        if (this.activeLoopNotes && this.activeLoopNotes.length > 0) {
            this.activeLoopNotes.forEach(midi => {
                this.bus.emit('noteOff', { midi: midi });
            });
            this.activeLoopNotes = [];
        }
    }

    playStep(stepIndex) {
        this.releaseCurrentChord();

        if (!this.mappedChords || this.mappedChords.length === 0) return;
        const stepChord = this.mappedChords[stepIndex];
        if (!stepChord || stepChord.chord === '???') return;

        // Obtener las notas MIDI del acorde
        const notes = this.getChordMidiNotes(stepChord.chord);

        // Disparar las notas en el bus
        this.activeLoopNotes = notes;
        this.activeLoopNotes.forEach(midi => {
            this.bus.emit('noteOn', { midi: midi, velocity: 85 });
        });

        this.highlightActiveStep(stepIndex);
    }

    highlightActiveStep(stepIndex) {
        const boxes = document.getElementById('progression-slots').querySelectorAll('.prog-box');
        boxes.forEach((box, i) => {
            if (i === stepIndex) {
                box.style.borderColor = '#ffd700'; // Iluminar dorado el acorde activo del loop
                box.style.backgroundColor = 'rgba(255, 215, 0, 0.25)';
            } else {
                box.style.borderColor = '#444';
                box.style.backgroundColor = 'transparent';
            }
        });
    }

    updatePlayButtonUI() {
        const btn = document.getElementById('btn-toggle-loop');
        if (btn) {
            btn.innerHTML = this.isPlaying ? '⏹️ DETENER LOOP' : '▶️ REPRODUCIR LOOP';
            btn.style.background = this.isPlaying ? '#cc3333' : '#254099';
            btn.style.borderColor = this.isPlaying ? '#dd4444' : '#3a5cce';
        }
    }

    getChordMidiNotes(chordName) {
        // Ej: "C Min", "G Maj", "D Dim", "Am", "F"
        const parts = chordName.split(' ');
        let root = parts[0];
        let type = 'maj';
        if (parts.length > 1) {
            if (parts[1].toLowerCase().includes('min')) type = 'min';
            else if (parts[1].toLowerCase().includes('dim')) type = 'dim';
        } else {
            if (root.endsWith('m')) {
                root = root.slice(0, -1);
                type = 'min';
            } else if (root.endsWith('dim')) {
                root = root.slice(0, -3);
                type = 'dim';
            }
        }

        if (root.includes('/')) {
            root = root.split('/')[0];
        }

        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        const rootPitch = noteMap[root] !== undefined ? noteMap[root] : 0;
        const baseMidi = 48 + rootPitch;

        let intervals = [0, 4, 7];
        if (type === 'min') intervals = [0, 3, 7];
        else if (type === 'dim') intervals = [0, 3, 6];

        // Añadir una octava inferior para el bajo (sensación estéreo/llena)
        const notes = intervals.map(val => baseMidi + val);
        notes.push(baseMidi - 12);

        return notes;
    }

    refresh(newKey, newMode) {
        this.currentKey = newKey;
        this.currentMode = newMode;
        this.loadProgression(this.currentPresetKey);
    }

    updateProgressionStatus(chordData) {
        const chordName = typeof chordData === 'object' ? chordData.name : chordData;
        const boxes = document.getElementById('progression-slots').querySelectorAll('.prog-box');

        boxes.forEach(box => {
            const chordSpan = box.querySelector('.chord');
            if (chordSpan && chordSpan.textContent === chordName) {
                box.style.borderColor = '#4fa8ff'; // Iluminar azul
                box.style.backgroundColor = 'rgba(79, 168, 255, 0.2)';
            } else {
                box.style.borderColor = '#444'; // Apagar los demás
                box.style.backgroundColor = 'transparent';
            }
        });
    }

    loadProgression(presetKey) {
        const preset = this.presets[presetKey];
        if (!preset) return;

        // Mapeamos los grados diatónicos de la progresión a la tonalidad activa
        const keyMap = this.chordScaleMaps[this.currentKey] || this.chordScaleMaps['C'];

        // Ajustamos la capitalización de los números romanos según el modo actual
        const mappedChords = preset.numerals.map(roman => {
            let actualRoman = roman;
            if (this.currentMode === 'ionian') {
                actualRoman = roman === 'VI' ? 'vi' : (roman === 'iv' ? 'IV' : (roman === 'i' ? 'I' : 'V'));
            } else {
                actualRoman = roman === 'VI' ? 'VI' : (roman === 'iv' ? 'iv' : (roman === 'i' ? 'i' : 'V'));
            }

            // Buscar nombre del acorde diatónico
            let chordName = keyMap[actualRoman] || '???';
            return {
                roman: actualRoman,
                chord: chordName
            };
        });

        this.mappedChords = mappedChords;

        document.getElementById('prog-name').textContent = preset.name;
        document.getElementById('prog-roman').textContent = mappedChords.map(c => c.roman).join(' - ');
        document.getElementById('prog-chords').textContent = mappedChords.map(c => c.chord).join(' - ');

        const slotsContainer = document.getElementById('progression-slots');
        slotsContainer.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            const box = document.createElement('div');
            box.className = 'prog-box';
            if (i < mappedChords.length) {
                box.innerHTML = `<span class="roman">${mappedChords[i].roman}</span><span class="chord">${mappedChords[i].chord}</span>`;
            } else {
                box.classList.add('empty');
            }
            slotsContainer.appendChild(box);
        }

        // Si el loop está activo, reiniciar o refrescar notas del paso actual
        if (this.isPlaying) {
            this.playStep(this.currentStep);
        }

        // Notificar que la progresión ha sido actualizada/cargada
        this.bus.emit('progressionUpdated', {
            key: this.currentKey,
            mode: this.currentMode,
            mappedChords: mappedChords
        });
    }
}
