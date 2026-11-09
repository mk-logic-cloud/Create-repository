// Kleine Helfer für die Serverfunktionen unter api/motivation/.
const crypto = require('node:crypto');
const { readConfig, createSender } = require('./service.js');
const { createRedisStore } = require('./store.js');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Vercel liefert req.body bereits geparst; zur Sicherheit auch Strings annehmen.
function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; }
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Konfiguration, Speicher und Sender bereitstellen oder sauber ablehnen (503).
function context(res) {
  const cfg = readConfig();
  if (!cfg.ready) { json(res, 503, { error: 'Push-Dienst nicht eingerichtet', missing: cfg.missing }); return null; }
  return { cfg, store: createRedisStore(), send: createSender(cfg) };
}

module.exports = { json, body, safeEqual, context };
