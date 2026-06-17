$(function() {
    // 1. Generar Teclado
    const keyboard = document.getElementById('piano-keyboard');
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Generar 2 octavas
    for (let octave = 0; octave < 2; octave++) {
        notes.forEach(note => {
            const keyDiv = document.createElement('div');
            keyDiv.className = `key ${note.includes('#') ? 'black' : 'white'}`;
            keyDiv.dataset.note = note;
            keyDiv.innerText = note;
            
            keyDiv.addEventListener('mousedown', () => {
                const chord = obtenerAcorde(note);
                chord.forEach(n => {
                    document.querySelectorAll(`.key[data-note="${n}"]`).forEach(k => k.classList.add('activa'));
                });
            });
            
            keyDiv.addEventListener('mouseup', () => {
                document.querySelectorAll('.key').forEach(k => k.classList.remove('activa'));
            });
            
            keyboard.appendChild(keyDiv);
        });
    }

    // 2. Generar Círculo de Quintas (Simplificado)
    const circleSvg = document.getElementById('circle-svg');
    const centerX = 200, centerY = 200, radius = 150;
    
    const circleNotes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
    
    circleNotes.forEach((note, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        const circleNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleNode.setAttribute("cx", x);
        circleNode.setAttribute("cy", y);
        circleNode.setAttribute("r", 20);
        circleNode.setAttribute("fill", "white");
        circleNode.setAttribute("stroke", "black");
        circleNode.setAttribute("data-note", note);
        circleNode.classList.add('circle-note');
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y + 5);
        text.setAttribute("text-anchor", "middle");
        text.textContent = note;
        
        circleSvg.appendChild(circleNode);
        circleSvg.appendChild(text);
        
        circleNode.addEventListener('click', () => {
            const chord = obtenerAcorde(note);
            chord.forEach(n => {
                document.querySelectorAll(`.key[data-note="${n}"]`).forEach(k => k.classList.add('activa'));
            });
            setTimeout(() => {
                document.querySelectorAll('.key').forEach(k => k.classList.remove('activa'));
            }, 500);
        });
    });

    // 3. Inicializar MIDI
    initMIDI();
});
