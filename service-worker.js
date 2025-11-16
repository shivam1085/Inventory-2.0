const CACHE_VERSION = 3;
const CACHE_NAME = `inventory2-cache-v${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/logooo.PNG'
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE_NAME && caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  
  // Intercept old icon paths and return 204 No Content to prevent 404 errors
  if (req.method === 'GET' && (url.pathname.includes('/icons/icon-192.png') || url.pathname.includes('/icons/icon-512.png'))) {
    e.respondWith(
      // Try to serve the actual logo, or return empty 204 response
      caches.match('./icons/logooo.PNG')
        .then(cached => cached || fetch('./icons/logooo.PNG').catch(() => 
          new Response(null, { status: 204, statusText: 'No Content' })
        ))
    );
    return;
  }
  
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        // Don't cache 404s
        if (res.status === 404) return res;
        const copy = res.clone();
        if(req.method === 'GET' && res.ok){
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
