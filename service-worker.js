// Service Worker - Controle de Colheita (SS Agro)
// Cache simples do "app shell". Dados (Firestore) sempre vêm da rede, não são cacheados aqui.

const CACHE_NAME = 'controle-colheita-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(nomes) {
      return Promise.all(
        nomes.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: network-first para o HTML (sempre pega versão mais nova quando online),
// cache-first para o resto (ícones, manifest) — evita telas em branco sem internet.
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function(res) {
        var copia = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put('/index.html', copia); });
        return res;
      }).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached) {
      return cached || fetch(req);
    })
  );
});
