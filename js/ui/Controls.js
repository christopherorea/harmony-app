class Controls {
    constructor(bus) {
        this.bus = bus;
        this.init();
    }

    init() {
        const keySelect = document.getElementById('keynote-select');
        const modeSelect = document.getElementById('mode-select');

        if (keySelect) {
            keySelect.addEventListener('change', (e) => {
                this.bus.emit('keyChange', e.target.value);
            });
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.bus.emit('modeChange', e.target.value);
            });
        }
    }
}
