class EventBus {
    constructor() {
        this.listeners = {};
    }

    // Suscribirse a un evento
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Emitir (gritar) un evento
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Creamos una única instancia global
const appBus = new EventBus();
