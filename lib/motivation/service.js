// ============================================================
//  Versandlogik der täglichen Motivation (ohne HTTP, gut testbar).
// ============================================================
const crypto = require('node:crypto');
const core = require('../../motivation-core.js');

const PUSH_TTL_SECONDS = 4 * 3600;   // Gerät aus? Der Push-Dienst hält die Nachricht bis ca. 10:30 Uhr vor.

// Vollständigkeit der Serverkonfiguration prüfen.
function readConfig(env = process.env) {
  const cfg = {
    publicKey: env.VAPID_PUBLIC_KEY || '',
    privateKey: env.VAPID_PRIVATE_KEY || '',
    subject: env.VAPID_SUBJECT || '',
    cronSecret: env.CRON_SECRET || '',
    name: env.MOTIVATION_NAME || '',
    hasStore: Boolean((env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL) && (env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN)),
  };
  cfg.missing = [
    !cfg.publicKey && 'VAPID_PUBLIC_KEY', !cfg.privateKey && 'VAPID_PRIVATE_KEY', !cfg.subject && 'VAPID_SUBJECT',
    !cfg.hasStore && 'KV_REST_API_URL/KV_REST_API_TOKEN',
  ].filter(Boolean);
  cfg.ready = cfg.missing.length === 0;
  return cfg;
}

// Echte Zustellung über Web Push (VAPID). `web-push` verschlüsselt die Nutzlast.
function createSender(cfg, webpush = require('web-push')) {
  return (sub, payload) => webpush.sendNotification(sub, JSON.stringify(payload), {
    vapidDetails: { subject: cfg.subject, publicKey: cfg.publicKey, privateKey: cfg.privateKey },
    TTL: PUSH_TTL_SECONDS,
    urgency: 'high',
    // Gleiches Topic: Der Push-Dienst ersetzt eine noch nicht zugestellte Nachricht, statt zwei zuzustellen.
    topic: payload.tag,
  });
}

// Ein Abo ist endgültig ungültig, wenn der Push-Dienst 404 oder 410 meldet.
const isGone = err => err && (err.statusCode === 404 || err.statusCode === 410);

async function deliver(subs, payload, { store, send }) {
  const results = await Promise.allSettled(subs.map(s => send(s, payload)));
  let sent = 0, failed = 0, removed = 0;
  await Promise.all(results.map(async (r, i) => {
    if (r.status === 'fulfilled') { sent++; return; }
    failed++;
    if (isGone(r.reason)) { await store.removeSub(subs[i].endpoint); removed++; }
  }));
  return { sent, failed, removed, total: subs.length };
}

// Täglicher Lauf. Darf beliebig oft aufgerufen werden:
//  - außerhalb 06:30–09:00 Uhr (Berlin) passiert nichts,
//  - pro Berliner Kalendertag wird höchstens einmal versendet (atomare Sperre).
async function runDaily({ now = new Date(), store, send, name = '' }) {
  const t = core.forDate(now);
  if (!core.inSendWindow(now)) return { status: 'skipped', reason: 'outside_window', date: t.dateKey };
  if (!(await store.acquire(t.dateKey))) return { status: 'skipped', reason: 'already_sent', date: t.dateKey };

  try {
    const subs = await store.listSubs();
    const res = await deliver(subs, core.notification(now, { name }), { store, send });
    // Nichts zugestellt: Sperre lösen, damit der nächste Lauf im Fenster es erneut versucht.
    if (res.sent === 0) await store.release(t.dateKey);
    return { status: res.sent > 0 ? 'sent' : 'no_delivery', date: t.dateKey, ...res };
  } catch (e) {
    await store.release(t.dateKey).catch(() => {});
    throw e;
  }
}

// Testnachricht an genau ein bereits angemeldetes Gerät.
async function runTest({ now = new Date(), store, send, endpoint, name = '' }) {
  const sub = await store.getSub(endpoint);
  if (!sub) return { status: 'unknown_subscription' };
  if (!(await store.acquire(`test:${crypto.createHash('sha256').update(endpoint).digest('hex')}`, 15))) return { status: 'rate_limited' };
  const payload = { ...core.notification(now, { name }), tag: 'dm-test' };
  const res = await deliver([sub], payload, { store, send });
  return { status: res.sent ? 'sent' : 'failed', ...res };
}

// Eingabeprüfung für ein Browser-Abo.
function validSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  const { endpoint, keys } = sub;
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return false;
  try { if (new URL(endpoint).protocol !== 'https:') return false; } catch (_) { return false; }
  const b64 = v => typeof v === 'string' && v.length > 10 && v.length < 200 && /^[A-Za-z0-9_\-+/=]+$/.test(v);
  return Boolean(keys && b64(keys.p256dh) && b64(keys.auth));
}

module.exports = { readConfig, createSender, runDaily, runTest, validSubscription, PUSH_TTL_SECONDS };
