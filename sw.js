// ============================================================
//  SERVICE WORKER – nur für die tägliche Motivation (Web Push)
//  Empfängt die Push-Nachricht des Servers auch bei geschlossener
//  Anwendung und zeigt sie als Systembenachrichtigung an.
//  Kein Caching, kein Offline-Modus: bewusst ausschließlich Push.
// ============================================================
const ICON = 'icons/icon-192.png';
const BADGE = 'icons/badge-96.png';
const DEFAULT_URL = './?motivation=1#/dashboard';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { d = { body: e.data ? e.data.text() : '' }; }

  // Jede Push-Nachricht MUSS sichtbar werden (Safari und Chrome entziehen sonst
  // die Berechtigung). Doppelte verhindert der `tag`: Eine zweite Nachricht mit
  // demselben Tag ersetzt die erste lautlos, statt eine weitere anzuzeigen.
  e.waitUntil(self.registration.showNotification(d.title || 'Guten Morgen! ☀️', {
    body: d.body || '',
    tag: d.tag || 'dm',
    renotify: false,
    icon: ICON,
    badge: BADGE,
    lang: 'de',
    data: { url: d.url || DEFAULT_URL },
  }));
});

// Klick: vorhandenes Fenster nach vorn holen und zur Motivationskarte springen,
// sonst die Anwendung direkt im Motivationsbereich öffnen.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || DEFAULT_URL, self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = wins.find(w => w.url.startsWith(self.registration.scope));
    if (win) {
      await win.focus();
      win.postMessage({ type: 'dm-focus' });
      return;
    }
    await self.clients.openWindow(target);
  })());
});
