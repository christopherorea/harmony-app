importScripts('https://unpkg.com/workbox-sw@7.0.0/dist/workbox-sw.js');

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
});

// Estrategia de Cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});