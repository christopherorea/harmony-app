class ModifierEditor {
    constructor(bus) {
        this.bus = bus;
        this.isMultiSelect = false;
        this.activeModifiers = new Set();
        this.initDOM();
    }

    initDOM() {
        this.matrix = document.getElementById('extension-matrix');
        this.btnMultiSelect = document.getElementById('btn-multi-select');
        this.btnReset = document.getElementById('btn-reset');

        if (this.btnMultiSelect) {
            this.btnMultiSelect.addEventListener('click', () => {
                this.isMultiSelect = !this.isMultiSelect;
                this.btnMultiSelect.classList.toggle('active', this.isMultiSelect);
                if (!this.isMultiSelect && this.activeModifiers.size > 1) this.resetModifiers();
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => this.resetModifiers());
        }

        if (this.matrix) {
            this.matrix.querySelectorAll('.btn.ext').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleModifierClick(e.currentTarget));
            });
        }
    }

    handleModifierClick(button) {
        const modValue = button.dataset.value;
        const modType = button.dataset.type; 

        if (modType === 'sus') {
            this.matrix.querySelectorAll('.btn.ext[data-type="sus"]').forEach(btn => {
                if (btn !== button) { btn.classList.remove('active'); this.activeModifiers.delete(btn.dataset.value); }
            });
        }

        if (button.classList.contains('active')) {
            button.classList.remove('active');
            this.activeModifiers.delete(modValue);
        } else {
            if (!this.isMultiSelect) this.resetModifiers();
            button.classList.add('active');
            this.activeModifiers.add(modValue);
        }
        
        // Emitir el cambio de modificadores para que el acorde activo se actualice
        this.bus.emit('modifiersUpdated', Array.from(this.activeModifiers));
    }

    resetModifiers() {
        if (this.matrix) {
            this.matrix.querySelectorAll('.btn.ext').forEach(btn => btn.classList.remove('active'));
        }
        this.activeModifiers.clear();
        this.bus.emit('modifiersUpdated', []);
    }
}
