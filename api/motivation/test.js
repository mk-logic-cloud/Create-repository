// POST /api/motivation/test { endpoint } – Testnachricht an das eigene, bereits
// angemeldete Gerät. Unbekannte Endpunkte werden abgelehnt.
const { json, body, context } = require('../../lib/motivation/http.js');
const { runTest } = require('../../lib/motivation/service.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Methode nicht erlaubt' });
  const ctx = context(res);
  if (!ctx) return;
  const { endpoint } = body(req);
  if (typeof endpoint !== 'string' || !endpoint) return json(res, 400, { error: 'endpoint fehlt' });
  try {
    const r = await runTest({ store: ctx.store, send: ctx.send, endpoint, name: ctx.cfg.name });
    if (r.status === 'unknown_subscription') return json(res, 404, { error: 'Gerät ist nicht angemeldet' });
    if (r.status === 'rate_limited') return json(res, 429, { error: 'Bitte kurz warten' });
    if (r.status !== 'sent') return json(res, 502, { error: 'Push-Dienst hat die Nachricht nicht angenommen' });
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
};
