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

// Push-Nachricht empfangen und als Benachrichtigung anzeigen.
self.addEventListener('push', e => {
  let d = { title: 'DayTrading', body: 'Trade' };
  try { d = e.data.json(); } catch (_) { if (e.data) d.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(d.title || 'DayTrading', {
    body: d.body || '',
    icon: 'icon-180.png',
    badge: 'icon-180.png',
    tag: d.tag || 'trade',
    data: { url: './index.html' },
  }));
});

// Tippen auf die Benachrichtigung -> App in den Vordergrund.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow('./index.html');
  }));
});
