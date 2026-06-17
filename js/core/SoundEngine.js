class SoundEngine {
    constructor(bus) {
        this.bus = bus;
        // Creamos un sintetizador polifónico básico y lo conectamos a los altavoces
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.audioStarted = false;
        this.muted = false; // Estado de silencio de Tone.Destination

        this.attachEvents();
        this.initDOM();
    }

    initDOM() {
        const selectSynthType = document.getElementById('select-synth-type');
        if (selectSynthType) {
            selectSynthType.addEventListener('change', (e) => {
                this.bus.emit('synthTypeChanged', e.target.value);
            });
        }

        const btnToggleAudio = document.getElementById('btn-toggle-audio');
        if (btnToggleAudio) {
            btnToggleAudio.addEventListener('click', async () => {
                this.muted = !this.muted;
                Tone.Destination.mute = this.muted;
                
                // Liberar todas las notas para detener sonidos colgados inmediatamente
                if (this.synth) {
                    try { this.synth.releaseAll(); } catch(e) {}
                }

                if (this.muted) {
                    btnToggleAudio.textContent = "AUDIO: OFF";
                    btnToggleAudio.style.background = "#555";
                    btnToggleAudio.style.borderColor = "#444";
                } else {
                    btnToggleAudio.textContent = "AUDIO: ON";
                    btnToggleAudio.style.background = "#254099";
                    btnToggleAudio.style.borderColor = "#3a5cce";
                    
                    // Asegurar que el contexto de audio esté activo
                    if (Tone.context.state !== 'running') {
                        await Tone.start();
                        this.audioStarted = true;
                    }
                    
                    // Reset total y limpio del sintetizador para eliminar cualquier saturación o canal colgado
                    const currentType = document.getElementById('select-synth-type')?.value || 'sine';
                    if (this.synth) {
                        try { this.synth.dispose(); } catch(e) {}
                    }
                    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
                    this.synth.set({
                        oscillator: {
                            type: currentType
                        }
                    });
                }
                console.log(`Estado de audio: ${this.muted ? 'Silenciado' : 'Activo y Reseteado'}`);
            });
        }
    }

    attachEvents() {
        // Escuchar cuando se cambia el tipo de sintetizador
        this.bus.on('synthTypeChanged', (type) => {
            this.synth.set({
                oscillator: {
                    type: type
                }
            });
            console.log(`Tipo de sintetizador cambiado a: ${type}`);
        });

        // Escuchar cuando se presiona una nota
        this.bus.on('noteOn', async (data) => {
            // Los navegadores exigen que el usuario interactúe antes de emitir sonido
            if (!this.audioStarted) {
                await Tone.start();
                this.audioStarted = true;
                console.log("Audio Context Iniciado");
            }
            
            // Convertir número MIDI (ej. 60) a Frecuencia (ej. 261.63 Hz para Do)
            const freq = Tone.Frequency(data.midi, "midi").toNote();
            // Disparar la nota
            this.synth.triggerAttack(freq);
        });

        // Escuchar cuando se suelta la nota
        this.bus.on('noteOff', (data) => {
            const freq = Tone.Frequency(data.midi, "midi").toNote();
            this.synth.triggerRelease(freq);
        });
    }
}
