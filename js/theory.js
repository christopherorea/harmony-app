const NOMBRES_NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MODOS = {
    ionian: [2, 2, 1, 2, 2, 2, 1],
    dorian: [2, 1, 2, 2, 2, 1, 2],
    phrygian: [1, 2, 2, 2, 1, 2, 2],
    lydian: [2, 2, 2, 1, 2, 2, 1],
    mixolydian: [2, 2, 1, 2, 2, 1, 2],
    aeolian: [2, 1, 2, 2, 1, 2, 2],
    locrian: [1, 2, 2, 1, 2, 2, 2]
};

function obtenerEscala(tonica, modo) {
    const startIdx = NOMBRES_NOTAS.indexOf(tonica);
    const intervals = MODOS[modo];
    const escala = [];
    let currentIdx = startIdx;

    for (let i = 0; i < intervals.length; i++) {
        escala.push(NOMBRES_NOTAS[currentIdx % 12]);
        currentIdx += intervals[i];
    }
    return escala;
}

function obtenerAcorde(notaRaiz) {
    const rootIdx = NOMBRES_NOTAS.indexOf(notaRaiz);
    return [
        NOMBRES_NOTAS[rootIdx % 12],
        NOMBRES_NOTAS[(rootIdx + 4) % 12], // Tercera mayor
        NOMBRES_NOTAS[(rootIdx + 7) % 12]  // Quinta justa
    ];
}
