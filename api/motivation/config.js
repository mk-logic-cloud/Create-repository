// GET /api/motivation/config – öffentlicher VAPID-Schlüssel und Betriebsbereitschaft.
const { json } = require('../../lib/motivation/http.js');
const { readConfig } = require('../../lib/motivation/service.js');
const core = require('../../motivation-core.js');

module.exports = (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Methode nicht erlaubt' });
  const cfg = readConfig();
  json(res, 200, {
    ready: cfg.ready,
    publicKey: cfg.ready ? cfg.publicKey : null,
    time: `${String(core.SEND_HOUR).padStart(2, '0')}:${String(core.SEND_MINUTE).padStart(2, '0')}`,
    timezone: core.TZ,
  });
};
