<script>
function registerSW() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registrado con éxito:', reg.scope))
                .catch(err => console.log('Error registrando SW:', err));
        });
    }
}
</script>