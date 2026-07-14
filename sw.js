// Minimaler Service Worker — nur fuer die Installierbarkeit der PWA.
// Kein aggressives Caching: die App lebt von Live-Daten, die sollen frisch sein.
// Der App-Shell (HTML) wird best-effort gecacht, damit sie offline oeffnet;
// die Daten kommen immer live aus Supabase.
const SHELL = 'daytrading-shell-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== SHELL).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Supabase-/CDN-Anfragen NIE cachen — immer live.
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('esm.sh')) return;
  // App-Shell: erst Netz, dann Cache-Fallback.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
