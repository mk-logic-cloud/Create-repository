// ============================================================
//  MOTIVATION PUSH – Steuerung im Browser
//  Meldet dieses Gerät für die tägliche Push-Nachricht um 06:30 Uhr
//  (Europe/Berlin) an. Der Versand selbst geschieht serverseitig
//  (api/motivation/send), damit er auch bei geschlossener App läuft.
//
//  Grundsatz: Es wird nie ein Zustand angezeigt, der nicht stimmt.
//  „Aktiv“ erscheint nur, wenn Browser-Abo UND Server-Speicherung
//  gelungen sind.
// ============================================================
const MotivationPush = (() => {
  const API = '/api/motivation';
  const SW_URL = 'sw.js';

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  // phase: init | unsupported | ios-install | unavailable | off | on | denied
  const s = { phase: 'init', busy: false, msg: '', err: false, reg: null, key: null };

  const BELL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
  const escH = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function html() {
    const dis = s.busy ? ' disabled' : '';
    const msg = s.msg ? `<div class="dm-msg${s.err ? ' err' : ''}" role="status">${escH(s.msg)}</div>` : '';
    switch (s.phase) {
      case 'off':
        return `<button class="dm-btn" data-dm-act="enable"${dis}>${BELL}Täglich um 06:30 Uhr erinnern</button>${msg}`;
      case 'on':
        return `<span class="dm-state"><span class="dm-dot"></span>Erinnerung aktiv · täglich 06:30 Uhr</span>
          <button class="dm-link" data-dm-act="test"${dis}>Test senden</button>
          <button class="dm-link" data-dm-act="disable"${dis}>Ausschalten</button>${msg}`;
      case 'denied':
        return '<span>Benachrichtigungen sind für diese Seite blockiert. Erlaube sie in den Website-Einstellungen des Browsers, dann lässt sich die Erinnerung um 06:30 Uhr aktivieren.</span>';
      case 'ios-install':
        return '<span>Für die Erinnerung um 06:30 Uhr auf dem iPhone: in Safari „Teilen“ → „Zum Home-Bildschirm“ wählen, die App von dort öffnen und die Erinnerung aktivieren.</span>';
      case 'unsupported':
        return '<span>Dieser Browser unterstützt keine Push-Benachrichtigungen.</span>';
      case 'unavailable':
        return '<span>Die Erinnerung um 06:30 Uhr ist noch nicht verfügbar: Der Push-Dienst des Servers ist nicht eingerichtet.</span>';
      default:
        return '';
    }
  }

  function render() {
    const el = document.getElementById('dm-push');
    if (el) el.innerHTML = html();
  }
  function set(patch) { Object.assign(s, patch); render(); }

  async function api(path, method, body) {
    const r = await fetch(API + path, {
      method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await r.json(); } catch (_) { /* keine JSON-Antwort */ }
    if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
    return data || {};
  }

  const keyBytes = b64 => {
    const raw = atob((b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  };

  async function subscribeBrowser() {
    const opts = { userVisibleOnly: true, applicationServerKey: keyBytes(s.key) };
    try { return await s.reg.pushManager.subscribe(opts); }
    catch (e) {
      // Altes Abo mit anderem Server-Schlüssel: lösen und neu anlegen.
      const old = await s.reg.pushManager.getSubscription();
      if (!old) throw e;
      await old.unsubscribe();
      return s.reg.pushManager.subscribe(opts);
    }
  }

  async function init() {
    if (!supported) return set({ phase: isIOS && !standalone ? 'ios-install' : 'unsupported' });
    try {
      s.reg = await navigator.serviceWorker.register(SW_URL);
      const cfg = await api('/config', 'GET');
      if (!cfg.ready || !cfg.publicKey) return set({ phase: 'unavailable' });
      s.key = cfg.publicKey;
    } catch (_) { return set({ phase: 'unavailable' }); }

    if (Notification.permission === 'denied') return set({ phase: 'denied' });
    const sub = await s.reg.pushManager.getSubscription();
    if (!sub || Notification.permission !== 'granted') return set({ phase: 'off' });
    // Bestehendes Abo beim Server auffrischen (idempotent). „Aktiv“ nur bei Erfolg.
    try { await api('/subscribe', 'POST', { subscription: sub.toJSON() }); set({ phase: 'on' }); }
    catch (_) { set({ phase: 'off', msg: 'Die Anmeldung beim Server konnte nicht bestätigt werden. Bitte erneut aktivieren.', err: true }); }
  }

  async function enable() {
    // Die Berechtigungsabfrage muss direkt aus dem Klick heraus erfolgen (iOS/Safari).
    const perm = await Notification.requestPermission();
    if (perm === 'denied') return set({ phase: 'denied', msg: '' });
    if (perm !== 'granted') return set({ msg: 'Ohne Erlaubnis für Benachrichtigungen kann die Erinnerung nicht zugestellt werden.', err: true });
    set({ busy: true, msg: '', err: false });
    let sub = null;
    try {
      sub = await subscribeBrowser();
      await api('/subscribe', 'POST', { subscription: sub.toJSON() });
      set({ phase: 'on', busy: false, msg: 'Aktiviert. Die nächste Erinnerung kommt um 06:30 Uhr.', err: false });
    } catch (e) {
      // Nichts vortäuschen: scheitert die Speicherung, wird das Browser-Abo zurückgenommen.
      if (sub) { try { await sub.unsubscribe(); } catch (_) { /* egal */ } }
      set({ phase: 'off', busy: false, msg: `Aktivierung fehlgeschlagen (${e.message}).`, err: true });
    }
  }

  async function disable() {
    set({ busy: true, msg: '', err: false });
    try {
      const sub = await s.reg.pushManager.getSubscription();
      if (sub) {
        try { await api('/subscribe', 'DELETE', { endpoint: sub.endpoint }); } catch (_) { /* Server räumt abgelaufene Abos selbst auf */ }
        await sub.unsubscribe();
      }
      set({ phase: 'off', busy: false, msg: 'Erinnerung ausgeschaltet.' });
    } catch (e) { set({ busy: false, msg: `Ausschalten fehlgeschlagen (${e.message}).`, err: true }); }
  }

  async function test() {
    set({ busy: true, msg: '', err: false });
    try {
      const sub = await s.reg.pushManager.getSubscription();
      if (!sub) throw new Error('kein Abo auf diesem Gerät');
      await api('/test', 'POST', { endpoint: sub.endpoint });
      set({ busy: false, msg: 'Test an den Push-Dienst übergeben. Die Benachrichtigung sollte in wenigen Sekunden erscheinen.' });
    } catch (e) { set({ busy: false, msg: `Test fehlgeschlagen (${e.message}).`, err: true }); }
  }

  const actions = { enable, disable, test };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-dm-act]');
    if (b && !s.busy && actions[b.dataset.dmAct]) actions[b.dataset.dmAct]();
  });

  // Klick auf die Benachrichtigung: zur Motivationskarte springen.
  const focusCard = () => { if (window.DailyMotivation || typeof DailyMotivation !== 'undefined') DailyMotivation.focus(); };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'dm-focus') focusCard(); });
  }
  window.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.search);
    if (q.has('motivation')) {
      q.delete('motivation');
      const rest = q.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + '#/dashboard');
      focusCard();
    }
    init();
  });

  return { html, render, state: () => ({ phase: s.phase, busy: s.busy, msg: s.msg }) };
})();
