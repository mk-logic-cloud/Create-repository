// ============================================================
//  Speicher für Push-Abos und die Tagessperre gegen Doppelversand.
//  Redis über die REST-Schnittstelle von Upstash / Vercel KV
//  (reines fetch, keine zusätzliche Bibliothek).
//  Für Tests gibt es denselben Vertrag als In-Memory-Variante.
// ============================================================
const crypto = require('node:crypto');

const SUBS_KEY = 'dm:subs';
const lockKey = dateKey => `dm:sent:${dateKey}`;
const LOCK_TTL_SECONDS = 2 * 24 * 3600;
const MAX_SUBSCRIPTIONS = 200;

const idOf = endpoint => crypto.createHash('sha256').update(String(endpoint)).digest('hex');

function redisEnv(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

function createRedisStore(env = process.env, fetchImpl = fetch) {
  const cfg = redisEnv(env);
  if (!cfg) return null;

  async function cmd(...args) {
    const r = await fetchImpl(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.error) throw new Error(`Redis: ${data.error || r.status}`);
    return data.result;
  }

  return {
    async saveSub(sub) {
      const id = idOf(sub.endpoint);
      const exists = await cmd('HEXISTS', SUBS_KEY, id);
      if (!exists && (await cmd('HLEN', SUBS_KEY)) >= MAX_SUBSCRIPTIONS) throw new Error('Maximale Anzahl an Geräten erreicht');
      await cmd('HSET', SUBS_KEY, id, JSON.stringify(sub));
    },
    async getSub(endpoint) {
      const v = await cmd('HGET', SUBS_KEY, idOf(endpoint));
      return v ? JSON.parse(v) : null;
    },
    async removeSub(endpoint) { await cmd('HDEL', SUBS_KEY, idOf(endpoint)); },
    async listSubs() {
      const flat = (await cmd('HGETALL', SUBS_KEY)) || [];
      const out = [];
      for (let i = 1; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i])); } catch (_) { /* defekter Eintrag */ } }
      return out;
    },
    // Atomar: nur der erste Aufruf pro Schlüssel bekommt die Sperre (SET NX).
    async acquire(key, ttl = LOCK_TTL_SECONDS) { return (await cmd('SET', lockKey(key), '1', 'NX', 'EX', String(ttl))) === 'OK'; },
    async release(key) { await cmd('DEL', lockKey(key)); },
  };
}

function createMemoryStore() {
  const subs = new Map(), locks = new Set();
  return {
    async saveSub(sub) {
      const id = idOf(sub.endpoint);
      if (!subs.has(id) && subs.size >= MAX_SUBSCRIPTIONS) throw new Error('Maximale Anzahl an Geräten erreicht');
      subs.set(id, JSON.parse(JSON.stringify(sub)));
    },
    async getSub(endpoint) { return subs.get(idOf(endpoint)) || null; },
    async removeSub(endpoint) { subs.delete(idOf(endpoint)); },
    async listSubs() { return [...subs.values()]; },
    async acquire(key) { if (locks.has(key)) return false; locks.add(key); return true; },
    async release(key) { locks.delete(key); },
  };
}

module.exports = { createRedisStore, createMemoryStore, redisEnv, MAX_SUBSCRIPTIONS };
