function initMIDI() {
    if (navigator.requestMIDIAccess) {
        console.log("¡Tu navegador soporta Web MIDI API!");
        navigator.requestMIDIAccess()
            .then(onMIDISuccess, onMIDIFailure);
    } else {
        console.warn("La Web MIDI API no es compatible con este navegador. Intenta usar Chrome o Edge.");
    }
}

function onMIDIFailure() {
    console.error("No se pudo acceder a tus dispositivos MIDI.");
}

function onMIDISuccess(midiAccess) {
    const inputs = midiAccess.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        console.log(`Conectado a: ${input.value.name}`);
        input.value.onmidimessage = procesarMensajeMIDI;
    }
}

function procesarMensajeMIDI(mensaje) {
    const comando = mensaje.data[0];
    const notaMidi = mensaje.data[1];
    const velocidad = mensaje.data[2];

    if (comando === 144 && velocidad > 0) {
        teclaPresionada(notaMidi, velocidad);
    } 
    else if (comando === 128 || (comando === 144 && velocidad === 0)) {
        teclaSoltada(notaMidi);
    }
}

function obtenerNombreNota(notaMidi) {
    return NOMBRES_NOTAS[notaMidi % 12];
}

function teclaPresionada(notaMidi, velocidad) {
    const nombreNota = obtenerNombreNota(notaMidi);
    console.log(`Presionaste la nota: ${nombreNota} (MIDI: ${notaMidi})`);
    
    const teclasDOM = document.querySelectorAll(`.key[data-note="${nombreNota}"]`);
    teclasDOM.forEach(tecla => {
        tecla.classList.add('activa');
    });
}

function teclaSoltada(notaMidi) {
    const nombreNota = obtenerNombreNota(notaMidi);
    const teclasDOM = document.querySelectorAll(`.key[data-note="${nombreNota}"]`);
    teclasDOM.forEach(tecla => {
        tecla.classList.remove('activa');
    });
}
