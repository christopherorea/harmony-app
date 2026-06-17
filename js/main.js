document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando Harmony Tool...");

    // 1. Motores Core
    const midiManager = new MidiManager(appBus);
    const soundEngine = new SoundEngine(appBus); 
    const musicTheory = new MusicTheory(appBus); // ¡Agregamos el cerebro aquí!

    // 2. Instanciación de la Interfaz
    const circle = new CircleOfFifths(appBus, 'circle-container');
    const modifierEditor = new ModifierEditor(appBus);
    const progressionManager = new ProgressionManager(appBus);
    const interactiveTonnetz = new InteractiveTonnetz(appBus);
    const keyboard = new Keyboard(appBus, 'keyboard');

    // Inicializamos UI con una progresión por defecto
    progressionManager.loadProgression('popClassic2');

    // Estado global de la aplicación (Director de Estado)
    const appState = {
        currentKey: 'C',
        currentMode: 'ionian',
        currentProgression: 'popClassic2',
        activeView: 'editor'
    };

    // Función global para actualizar el contexto armónico entre todos los módulos
    function updateContext(newKey, newMode) {
        appState.currentKey = newKey;
        appState.currentMode = newMode;
        
        console.log(`Actualizando Contexto Global: ${newKey} (${newMode})`);
        
        // 1. Propagar al Círculo de Quintas
        const targetArray = newMode === 'aeolian' ? circle.minors : circle.majors;
        const rootIndex = targetArray.findIndex(n => n.startsWith(newKey));
        if (rootIndex !== -1) {
            circle.highlightKeyGroup(rootIndex, newMode);
        }

        // 2. Propagar y transponer el ProgressionManager diatónicamente
        progressionManager.refresh(newKey, newMode);
    }

    // Registrar el clic en un nodo del Círculo para cambiar el contexto global
    appBus.on('keyChanged', (data) => {
        const mode = data.type === 'min' ? 'aeolian' : 'ionian';
        const cleanNote = data.note.split('/')[0]; // Limpiar notas dobles como F#/Gb -> F#
        updateContext(cleanNote, mode);
    });

    // Escuchar cambios de la progresión para sincronizar el Círculo de Quintas y la vista prioritaria
    appBus.on('progressionUpdated', (data) => {
        console.log("Sincronizando Progresión con Círculo de Quintas y Vista Prioritaria...");
        // 1. Resaltar exactamente los acordes que componen la progresión activa en el círculo
        circle.highlightProgressionChords(data.mappedChords);

        // 2. Sincronizar el enfoque: Switch automático al Tonnetz (vista prioritaria)
        const viewTonnetz = document.getElementById('view-tonnetz');
        if (viewTonnetz && viewTonnetz.classList.contains('hidden')) {
            const btnToggle = document.getElementById('btn-toggle-tonnetz');
            if (btnToggle) {
                btnToggle.click();
            }
        }
    });

    // Escuchar cambios de vista en el Tonnetz para escalar/minimizar el círculo
    appBus.on('viewChanged', (view) => {
        appState.activeView = view;
        if (view === 'tonnetz') {
            circle.minimize();
        } else {
            circle.restore();
        }
    });

    // Puente de Sincronización Armónica y Propagación de Estado
    appBus.on('chordDetected', (chordData) => {
        console.log("Acorde Detectado en AppBus:", chordData);
        // 1. Actualizar el Círculo de Quintas con la tónica y el modo correcto
        circle.highlightKeyGroup(chordData.rootIndex, chordData.mode);
        
        // 2. Actualizar la vista de Progresiones
        progressionManager.updateProgressionStatus(chordData);
    });

    appBus.on('chordCleared', () => {
        // Limpiar iluminaciones y restablecer estado de progresión
    });

    // 3. Suscripciones Globales de prueba
    appBus.on('noteOn', (data) => console.log(`MIDI In: ${data.midi}`));
    appBus.on('modifiersUpdated', (mods) => console.log(`Extensiones Activas:`, mods));
});
function showSuccess(text) { showAlert(text, 'success'); }
