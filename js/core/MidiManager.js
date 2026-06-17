class MidiManager {
    constructor(bus) {
        this.bus = bus;
        this.init();
    }

    init() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(this.onSuccess.bind(this), this.onFailure);
        } else {
            console.warn("La Web MIDI API no es compatible con este navegador.");
        }
    }

    onSuccess(midiAccess) {
        const inputs = midiAccess.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            console.log(`Conectado a: ${input.value.name}`);
            input.value.onmidimessage = this.handleMessage.bind(this);
        }
    }

    onFailure() {
        console.error("Web MIDI no soportado o bloqueado.");
    }

    handleMessage(message) {
        const [comando, notaMidi, velocidad] = message.data;
        
        // Note On
        if (comando === 144 && velocidad > 0) {
            this.bus.emit('noteOn', { midi: notaMidi, velocity: velocidad });
        } 
        // Note Off
        else if (comando === 128 || (comando === 144 && velocidad === 0)) {
            this.bus.emit('noteOff', { midi: notaMidi });
        }
    }
}
