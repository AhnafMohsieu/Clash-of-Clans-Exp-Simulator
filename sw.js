/* CoC XP Simulator service worker (Ibadah-style PWA shell) */
var CACHE = 'coc-xp-v1';
var LOCAL_ASSETS = [
  './',
  'XPC/index.html',
  'XPC/css/themes.css',
  'XPC/css/main.css',
  'XPC/css/components.css',
  'XPC/js/app.js',
  'offline.html',
  'assets/icon.svg',
  'manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) { return cache.addAll(LOCAL_ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(function(hit) { return hit || fetch(event.request); })
        .catch(function() { return caches.match('offline.html'); })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(function() { return caches.match(event.request); })
    );
  }
});
