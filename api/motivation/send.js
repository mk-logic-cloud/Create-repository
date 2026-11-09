// GET|POST /api/motivation/send – täglicher Versand, ausgelöst vom Scheduler.
// Geschützt durch "Authorization: Bearer <CRON_SECRET>" (Vercel Cron sendet
// diesen Header automatisch, sobald CRON_SECRET gesetzt ist).
// Mehrfachaufrufe sind gefahrlos: Zeitfenster und Tagessperre entscheiden.
const { json, safeEqual, context } = require('../../lib/motivation/http.js');
const { runDaily, readConfig } = require('../../lib/motivation/service.js');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Methode nicht erlaubt' });
  const secret = readConfig().cronSecret;
  if (!secret) return json(res, 503, { error: 'CRON_SECRET nicht gesetzt' });
  if (!safeEqual(req.headers.authorization || '', `Bearer ${secret}`)) return json(res, 401, { error: 'Nicht autorisiert' });
  const ctx = context(res);
  if (!ctx) return;
  try {
    json(res, 200, await runDaily({ store: ctx.store, send: ctx.send, name: ctx.cfg.name }));
  } catch (e) {
    json(res, 500, { error: e.message });
  }
};
