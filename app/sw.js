// This is a basic service worker that will be enhanced by next-pwa
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Let next-pwa handle the caching strategies
  event.respondWith(fetch(event.request));
});
