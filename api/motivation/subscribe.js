// POST   /api/motivation/subscribe  { subscription }  – Gerät anmelden (idempotent)
// DELETE /api/motivation/subscribe  { endpoint }      – Gerät abmelden
const { json, body, context } = require('../../lib/motivation/http.js');
const { validSubscription } = require('../../lib/motivation/service.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'DELETE') return json(res, 405, { error: 'Methode nicht erlaubt' });
  const ctx = context(res);
  if (!ctx) return;
  const b = body(req);
  try {
    if (req.method === 'DELETE') {
      if (typeof b.endpoint !== 'string' || !b.endpoint) return json(res, 400, { error: 'endpoint fehlt' });
      await ctx.store.removeSub(b.endpoint);
      return json(res, 200, { ok: true });
    }
    if (!validSubscription(b.subscription)) return json(res, 400, { error: 'Ungültiges Abo' });
    const { endpoint, keys } = b.subscription;
    await ctx.store.saveSub({ endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } });
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
};
