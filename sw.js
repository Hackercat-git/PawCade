const CACHE = 'pawcade-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/games/snake.js',
  '/games/whack.js',
  '/games/memory.js',
  '/games/g2048.js',
  '/games/wordcat.js',
  '/games/zen.js',
  '/games/flappy.js',
  '/games/fish.js',
  '/games/pong.js',
  '/games/breakout.js',
  '/games/dash.js',
  '/games/simon.js',
  '/games/asteroids.js',
  '/games/typing.js',
  '/games/slide.js',
  '/games/pong2p.js',
  '/games/yarnduel.js',
  '/games/stack.js',
  '/games/darts.js',
  '/games/tugofwar.js',
  '/games/seabattle.js',
  '/games/checkers.js',
  '/games/chess.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // cache-first for same-origin assets
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
});
