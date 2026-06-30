// public/sw.js

self.addEventListener('install', () => {
  console.log('[Service Worker] Install event fired');
  self.skipWaiting(); // Forces the browser to activate immediately
});

self.addEventListener('activate', () => {
  console.log('[Service Worker] Activated');
});

// Chrome requires a 'fetch' listener to pass the PWA install test
self.addEventListener('fetch', () => {
  // We aren't doing anything complex yet, just letting network requests pass through normally
  return; 
});