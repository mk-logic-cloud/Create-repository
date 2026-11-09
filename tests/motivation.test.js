// Tests für das tägliche Motivationssystem. Start: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const webpush = require('web-push');
const ece = require('http_ece');

const core = require('../motivation-core.js');
const { runDaily, runTest, createSender, readConfig, validSubscription, PUSH_TTL_SECONDS } = require('../lib/motivation/service.js');
const { createMemoryStore, createRedisStore } = require('../lib/motivation/store.js');

const sub = n => ({ endpoint: `https://push.example/${n}`, keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) } });
const recorder = (fail = {}) => {
  const calls = [];
  const send = async (s, payload) => {
    if (fail[s.endpoint]) { const e = new Error('push'); e.statusCode = fail[s.endpoint]; throw e; }
    calls.push({ endpoint: s.endpoint, payload });
  };
  return { calls, send };
};
const berlin = d => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).format(d);

// ── Inhalte ─────────────────────────────────────────────────
test('mindestens 100 eindeutige Sprüche', () => {
  assert.ok(core.QUOTES.length >= 100);
  assert.equal(new Set(core.QUOTES.map(q => q.t)).size, core.QUOTES.length);
  assert.ok(core.QUOTES.every(q => q.t.length >= 15 && (q.a === undefined || q.a.length > 2)));
});

test('jeder Zyklus zeigt jeden Spruch genau einmal, nie zweimal hintereinander', () => {
  const n = core.QUOTES.length;
  let prev = -1;
  for (let c = 159; c < 171; c++) {
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      const k = core.indexFor(c * n + i);
      assert.notEqual(k, prev);
      seen.add(k); prev = k;
    }
    assert.equal(seen.size, n);
  }
});

test('Benachrichtigung: Gruß, Spruch, optional Autor, Abschluss, Ziel', () => {
  const n = core.notification(new Date('2026-11-10T05:30:00Z'));
  assert.equal(n.title, 'Guten Morgen! ☀️');
  assert.equal(n.tag, 'dm-2026-11-10');
  assert.equal(n.url, './?motivation=1#/dashboard');
  const q = core.forDate(new Date('2026-11-10T05:30:00Z')).quote;
  assert.ok(n.body.startsWith(q.t));
  assert.equal(n.body.includes('— '), Boolean(q.a));
  assert.ok(core.CLOSINGS.some(c => n.body.endsWith(c)));
  assert.equal(core.notification(new Date(), { name: 'Bruce' }).title, 'Guten Morgen, Bruce! ☀️');
});

// ── Zeitsteuerung ───────────────────────────────────────────
test('Zustellfenster 06:30–09:00 Uhr Berlin, Sommer und Winter', () => {
  const w = iso => core.inSendWindow(new Date(iso));
  // Winter (UTC+1)
  assert.equal(w('2026-12-01T05:29:59Z'), false);
  assert.equal(w('2026-12-01T05:30:00Z'), true);
  assert.equal(w('2026-12-01T07:59:59Z'), true);
  assert.equal(w('2026-12-01T08:00:00Z'), false);
  // Sommer (UTC+2)
  assert.equal(w('2026-07-01T04:29:59Z'), false);
  assert.equal(w('2026-07-01T04:30:00Z'), true);
  assert.equal(w('2026-07-01T06:59:59Z'), true);
  assert.equal(w('2026-07-01T07:00:00Z'), false);
});

test('zwei Jahre Cron-Läufe: jeden Tag genau eine Zustellung, immer um 06:30 Uhr Berlin', async () => {
  const store = createMemoryStore(); await store.saveSub(sub(1));
  const { calls, send } = recorder();
  const sentAt = [];
  let days = 0;
  for (let d = Date.UTC(2026, 0, 1); d < Date.UTC(2028, 0, 1); d += 86400000) {
    days++;
    for (const [h, m] of [[4, 30], [5, 30], [6, 30]]) {          // die drei Einträge aus vercel.json (UTC)
      const now = new Date(d + (h * 60 + m) * 60000);
      const r = await runDaily({ now, store, send });
      if (r.status === 'sent') sentAt.push(berlin(now));
    }
  }
  assert.equal(calls.length, days);
  assert.ok(sentAt.every(t => t === '06:30'), 'Zustellzeiten: ' + [...new Set(sentAt)]);
  assert.equal(new Set(calls.map(c => c.payload.tag)).size, days);   // jeder Kalendertag genau einmal
});

test('Umstellungstage: 29.03.2026 und 25.10.2026 je eine Zustellung um 06:30 Uhr', async () => {
  for (const [day, utc] of [['2026-03-29', '04:30'], ['2026-10-25', '05:30'], ['2026-03-28', '05:30'], ['2026-10-24', '04:30']]) {
    const store = createMemoryStore(); await store.saveSub(sub(1));
    const { calls, send } = recorder();
    for (const slot of ['04:30', '05:30', '06:30']) {
      const r = await runDaily({ now: new Date(`${day}T${slot}:00Z`), store, send });
      assert.equal(r.status === 'sent', slot === utc, `${day} ${slot}Z -> ${r.status}/${r.reason}`);
    }
    assert.equal(calls.length, 1);
    assert.equal(calls[0].payload.tag, `dm-${day}`);
  }
});

test('ungenauer Scheduler (früher Aufruf) sendet nicht vor 06:30 Uhr und holt später nach', async () => {
  const store = createMemoryStore(); await store.saveSub(sub(1));
  const { calls, send } = recorder();
  assert.equal((await runDaily({ now: new Date('2026-12-01T05:07:00Z'), store, send })).reason, 'outside_window'); // 06:07
  assert.equal(calls.length, 0);
  assert.equal((await runDaily({ now: new Date('2026-12-01T06:41:00Z'), store, send })).status, 'sent');           // 07:41
  assert.equal(calls.length, 1);
});

// ── Doppelte verhindern ─────────────────────────────────────
test('gleichzeitige und wiederholte Läufe: genau eine Nachricht pro Gerät und Tag', async () => {
  const store = createMemoryStore();
  for (let i = 0; i < 3; i++) await store.saveSub(sub(i));
  const { calls, send } = recorder();
  const now = new Date('2026-11-10T05:30:00Z');
  const rs = await Promise.all(Array.from({ length: 12 }, () => runDaily({ now, store, send })));
  assert.equal(rs.filter(r => r.status === 'sent').length, 1);
  assert.equal(rs.filter(r => r.reason === 'already_sent').length, 11);
  assert.equal(calls.length, 3);
  assert.equal((await runDaily({ now: new Date('2026-11-10T06:30:00Z'), store, send })).reason, 'already_sent');
  assert.equal(calls.length, 3);
  assert.equal((await runDaily({ now: new Date('2026-11-11T05:30:00Z'), store, send })).status, 'sent');
  assert.equal(calls.length, 6);
});

test('doppelte Anmeldung desselben Geräts erzeugt nur einen Eintrag', async () => {
  const store = createMemoryStore();
  await store.saveSub(sub(1)); await store.saveSub(sub(1));
  assert.equal((await store.listSubs()).length, 1);
});

// ── Fehlerfälle ─────────────────────────────────────────────
test('abgelaufene Abos (410/404) werden entfernt, andere bleiben', async () => {
  const store = createMemoryStore();
  for (let i = 0; i < 4; i++) await store.saveSub(sub(i));
  const { calls, send } = recorder({ 'https://push.example/1': 410, 'https://push.example/2': 404, 'https://push.example/3': 500 });
  const r = await runDaily({ now: new Date('2026-11-10T05:30:00Z'), store, send });
  assert.deepEqual({ sent: r.sent, failed: r.failed, removed: r.removed }, { sent: 1, failed: 3, removed: 2 });
  assert.deepEqual((await store.listSubs()).map(s => s.endpoint).sort(), ['https://push.example/0', 'https://push.example/3']);
  assert.equal(calls.length, 1);
});

test('keine Zustellung gelungen: Sperre wird gelöst, nächster Lauf versucht es erneut', async () => {
  const store = createMemoryStore(); await store.saveSub(sub(1));
  const down = recorder({ 'https://push.example/1': 503 });
  assert.equal((await runDaily({ now: new Date('2026-11-10T05:30:00Z'), store, send: down.send })).status, 'no_delivery');
  const up = recorder();
  assert.equal((await runDaily({ now: new Date('2026-11-10T06:30:00Z'), store, send: up.send })).status, 'sent');
  assert.equal(up.calls.length, 1);
});

test('Testnachricht nur an angemeldete Geräte, mit Drossel', async () => {
  const store = createMemoryStore(); await store.saveSub(sub(1));
  const { calls, send } = recorder();
  assert.equal((await runTest({ store, send, endpoint: 'https://push.example/9' })).status, 'unknown_subscription');
  assert.equal((await runTest({ store, send, endpoint: sub(1).endpoint })).status, 'sent');
  assert.equal(calls[0].payload.tag, 'dm-test');
  assert.equal((await runTest({ store, send, endpoint: sub(1).endpoint })).status, 'rate_limited');
});

test('Abo-Prüfung lehnt Unbrauchbares ab', () => {
  assert.equal(validSubscription(sub(1)), true);
  assert.equal(validSubscription({ endpoint: 'http://push.example/1', keys: sub(1).keys }), false);
  assert.equal(validSubscription({ endpoint: 'https://push.example/1' }), false);
  assert.equal(validSubscription({ endpoint: 'nix', keys: sub(1).keys }), false);
  assert.equal(validSubscription(null), false);
});

// ── Web Push: echte Verschlüsselung und Header ──────────────
test('web-push: Nutzlast wird verschlüsselt und lässt sich mit dem Geräteschlüssel lesen', () => {
  const vapid = webpush.generateVAPIDKeys();
  const device = crypto.createECDH('prime256v1'); device.generateKeys();
  const auth = crypto.randomBytes(16);
  const s = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: device.getPublicKey('base64url'), auth: auth.toString('base64url') } };
  const payload = core.notification(new Date('2026-11-10T05:30:00Z'));

  let captured;
  const fake = { sendNotification: (sub_, body, opts) => { captured = webpush.generateRequestDetails(sub_, body, opts); return Promise.resolve(); } };
  createSender({ subject: 'mailto:test@example.com', publicKey: vapid.publicKey, privateKey: vapid.privateKey }, fake)(s, payload);

  assert.equal(captured.method, 'POST');
  assert.equal(String(captured.headers.TTL), String(PUSH_TTL_SECONDS));
  assert.equal(captured.headers.Urgency, 'high');
  assert.equal(captured.headers.Topic, 'dm-2026-11-10');
  assert.equal(captured.headers['Content-Encoding'], 'aes128gcm');
  assert.match(captured.headers.Authorization, /^vapid t=.+, k=.+/);
  assert.ok(!captured.body.toString('utf8').includes('Guten Morgen'));          // wirklich verschlüsselt
  const plain = ece.decrypt(captured.body, { version: 'aes128gcm', privateKey: device, authSecret: auth.toString('base64url') });
  assert.deepEqual(JSON.parse(plain.toString('utf8')), payload);
});

// ── Redis-Speicher (REST) gegen einen lokalen Nachbau ───────
function fakeRedis() {
  const h = new Map(), k = new Map();
  const run = ([c, ...a]) => {
    switch (c) {
      case 'HSET': h.set(a[1], a[2]); return 1;
      case 'HGET': return h.get(a[1]) ?? null;
      case 'HDEL': return h.delete(a[1]) ? 1 : 0;
      case 'HEXISTS': return h.has(a[1]) ? 1 : 0;
      case 'HLEN': return h.size;
      case 'HGETALL': return [...h].flat();
      case 'SET': if (a.includes('NX') && k.has(a[0])) return null; k.set(a[0], a[1]); return 'OK';
      case 'DEL': return k.delete(a[0]) ? 1 : 0;
      default: throw new Error('unbekannt ' + c);
    }
  };
  const server = http.createServer((req, res) => {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      if (req.headers.authorization !== 'Bearer tok') { res.statusCode = 401; return res.end('{"error":"auth"}'); }
      res.end(JSON.stringify({ result: run(JSON.parse(b)) }));
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}`, keys: k })));
}

test('Redis-Speicher: Abos, atomare Tagessperre, Versand über die REST-Schnittstelle', async () => {
  const { server, url, keys } = await fakeRedis();
  try {
    assert.equal(createRedisStore({}), null);
    const store = createRedisStore({ KV_REST_API_URL: url, KV_REST_API_TOKEN: 'tok' });
    await store.saveSub(sub(1)); await store.saveSub(sub(1)); await store.saveSub(sub(2));
    assert.equal((await store.listSubs()).length, 2);
    assert.deepEqual(await store.getSub(sub(2).endpoint), sub(2));
    await store.removeSub(sub(2).endpoint);
    assert.equal(await store.getSub(sub(2).endpoint), null);

    const { calls, send } = recorder();
    const now = new Date('2026-11-10T05:30:00Z');
    const rs = await Promise.all(Array.from({ length: 8 }, () => runDaily({ now, store, send })));
    assert.equal(rs.filter(r => r.status === 'sent').length, 1);
    assert.equal(calls.length, 1);
    assert.ok(keys.has('dm:sent:2026-11-10'));
    await assert.rejects(createRedisStore({ KV_REST_API_URL: url, KV_REST_API_TOKEN: 'falsch' }).listSubs());
  } finally { server.close(); }
});

// ── HTTP-Endpunkte ──────────────────────────────────────────
const call = (handler, { method = 'GET', headers = {}, body } = {}) => new Promise(resolve => {
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { resolve({ status: this.statusCode, body: JSON.parse(b) }); } };
  handler({ method, headers, body }, res);
});
const withEnv = async (env, fn) => {
  const keys = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'MOTIVATION_NAME'];
  const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  keys.forEach(k => delete process.env[k]); Object.assign(process.env, env);
  try { return await fn(); } finally { keys.forEach(k => old[k] === undefined ? delete process.env[k] : process.env[k] = old[k]); }
};

test('Endpunkte ohne Konfiguration: ehrlich "nicht eingerichtet", kein vorgetäuschter Erfolg', async () => {
  await withEnv({}, async () => {
    assert.deepEqual(readConfig().missing, ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'KV_REST_API_URL/KV_REST_API_TOKEN']);
    const cfg = await call(require('../api/motivation/config.js'));
    assert.deepEqual([cfg.status, cfg.body.ready, cfg.body.publicKey, cfg.body.time, cfg.body.timezone], [200, false, null, '06:30', 'Europe/Berlin']);
    assert.equal((await call(require('../api/motivation/subscribe.js'), { method: 'POST', body: { subscription: sub(1) } })).status, 503);
    assert.equal((await call(require('../api/motivation/send.js'))).status, 503);
    assert.equal((await call(require('../api/motivation/test.js'), { method: 'POST', body: { endpoint: 'x' } })).status, 503);
  });
});

test('Endpunkte mit Konfiguration: Schutz, Anmeldung, Tageslauf', async t => {
  const { server, url } = await fakeRedis();
  const vapid = webpush.generateVAPIDKeys();
  const env = { VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_SUBJECT: 'mailto:test@example.com', CRON_SECRET: 'geheim', KV_REST_API_URL: url, KV_REST_API_TOKEN: 'tok' };
  try {
    await withEnv(env, async () => {
      const send = require('../api/motivation/send.js'), subscribe = require('../api/motivation/subscribe.js');
      assert.equal((await call(require('../api/motivation/config.js'))).body.publicKey, vapid.publicKey);
      assert.equal((await call(send)).status, 401);
      assert.equal((await call(send, { headers: { authorization: 'Bearer falsch' } })).status, 401);
      assert.equal((await call(subscribe, { method: 'POST', body: { subscription: { endpoint: 'x' } } })).status, 400);
      assert.equal((await call(subscribe, { method: 'GET' })).status, 405);
      assert.equal((await call(require('../api/motivation/test.js'), { method: 'POST', body: { endpoint: 'https://push.example/nix' } })).status, 404);

      const auth = { authorization: 'Bearer geheim' };
      t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-10T04:30:00Z') });   // 05:30 Berlin
      assert.deepEqual((await call(send, { headers: auth })).body, { status: 'skipped', reason: 'outside_window', date: '2026-11-10' });
      t.mock.timers.setTime(new Date('2026-11-10T05:30:00Z').getTime());                 // 06:30 Berlin, noch kein Gerät
      assert.equal((await call(send, { headers: auth })).body.status, 'no_delivery');
      t.mock.timers.reset();

      assert.equal((await call(subscribe, { method: 'POST', body: { subscription: sub(1) } })).status, 200);
      assert.equal((await call(subscribe, { method: 'DELETE', body: { endpoint: sub(1).endpoint } })).status, 200);
    });
  } finally { server.close(); }
});
