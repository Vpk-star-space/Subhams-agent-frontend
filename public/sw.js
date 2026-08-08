// public/sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Agent Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {
    // Required by Chrome to trigger the install prompt
});