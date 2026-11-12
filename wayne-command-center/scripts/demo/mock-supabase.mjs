// LOKALE DEMO – NUR FUER DIE VORSCHAU AUF DEM EIGENEN RECHNER.
// Minimaler Ersatz fuer Supabase Auth + PostgREST mit SYNTHETISCHEN Daten im Arbeitsspeicher.
// - lauscht ausschliesslich auf 127.0.0.1
// - speichert nichts dauerhaft (Neustart = Ausgangsdaten)
// - KEIN Sicherheitsnachweis: kein RLS, keine echte Anmeldung, keine Mails
// Wird nie deployt: liegt unter scripts/ und ist nicht Teil des Next.js-Builds.
import http from "node:http";
import { randomUUID } from "node:crypto";

export const DEMO_EMAIL = "demo@wayne.local";
export const DEMO_PASSWORD = "demo-wayne-2026";
const PORT = Number(process.env.DEMO_SUPABASE_PORT ?? 54321);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const uid = "11111111-1111-4111-8111-111111111111";
const nowIso = () => new Date().toISOString();
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const ts = (offset) => new Date(Date.now() + offset * 86400000).toISOString();
const user = {
  id: uid, aud: "authenticated", role: "authenticated", email: DEMO_EMAIL,
  email_confirmed_at: ts(-30), last_sign_in_at: ts(0), created_at: ts(-30),
  app_metadata: { provider: "email" }, user_metadata: { full_name: "Bruce Wayne" },
};
function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: uid, role: "authenticated", aud: "authenticated", exp: now + 3600, iat: now, email: DEMO_EMAIL,
    session_id: "demo-session", aal: "aal1", amr: [{ method: "password", timestamp: now }],
  })}.demo-signature`;
}
const id = () => randomUUID();

// ---------- Synthetische Ausgangsdaten ----------
const D = { strat: id(), tech: id(), ops: id() };
const P = { launch: id(), market: id(), archive: id(), mobile: id() };
const db = {
  profiles: [{ id: uid, full_name: "Bruce Wayne", timezone: "Europe/Berlin", owner_id: uid }],
  departments: [
    { id: D.strat, name: "Strategie", lead: "Lucius", description: "Langfristige Ausrichtung und Portfolio.", created_at: ts(-30) },
    { id: D.tech, name: "Technologie", lead: "Research-Agent", description: "Produktentwicklung und Infrastruktur.", created_at: ts(-30) },
    { id: D.ops, name: "Betrieb", lead: "Alfred", description: "Abläufe, Finanzen, Verwaltung.", created_at: ts(-29) },
  ],
  projects: [
    { id: P.launch, department_id: D.tech, name: "Command Center Launch", description: "Private Steuerzentrale produktiv nehmen.", status: "active", priority: "high", progress: 65, start_date: day(-40), due_date: day(18), created_at: ts(-40), updated_at: ts(-1) },
    { id: P.market, department_id: D.strat, name: "Marktanalyse EU", description: "Wettbewerb und Regulierung im Überblick.", status: "active", priority: "medium", progress: 20, start_date: day(-10), due_date: day(6), created_at: ts(-10), updated_at: ts(-2) },
    { id: P.mobile, department_id: D.tech, name: "Mobile Nutzung", description: "Bedienung auf dem Smartphone optimieren.", status: "planning", priority: "medium", progress: 5, start_date: null, due_date: day(30), created_at: ts(-3), updated_at: ts(-3) },
    { id: P.archive, department_id: null, name: "Archivprojekt", description: null, status: "on_hold", priority: "low", progress: 10, start_date: null, due_date: null, created_at: ts(-60), updated_at: ts(-20) },
  ],
  tasks: [
    { id: id(), project_id: P.launch, title: "Sicherheitsplan v3.11 prüfen lassen", description: "Unabhängiges Audit beauftragen.", status: "in_progress", priority: "critical", due_date: day(0), completed_at: null, created_at: ts(-5), updated_at: ts(-1) },
    { id: id(), project_id: P.launch, title: "Staging-Projekt vorbereiten", description: "Checkliste P1–P8 abarbeiten.", status: "blocked", priority: "high", due_date: day(-2), completed_at: null, created_at: ts(-5), updated_at: ts(-1) },
    { id: id(), project_id: P.market, title: "Wettbewerber-Liste erstellen", description: null, status: "todo", priority: "medium", due_date: day(3), completed_at: null, created_at: ts(-4), updated_at: ts(-4) },
    { id: id(), project_id: P.mobile, title: "iPhone-Ansicht testen", description: null, status: "todo", priority: "low", due_date: null, completed_at: null, created_at: ts(-2), updated_at: ts(-2) },
    { id: id(), project_id: null, title: "Wochenrückblick vorbereiten", description: null, status: "done", priority: "low", due_date: day(-1), completed_at: ts(-1), created_at: ts(-6), updated_at: ts(-1) },
  ],
  milestones: [
    { id: id(), project_id: P.launch, title: "Lokale Vorschau", due_date: day(-1), completed_at: ts(-1) },
    { id: id(), project_id: P.launch, title: "Private Cloud-Vorschau", due_date: day(10), completed_at: null },
    { id: id(), project_id: P.launch, title: "Go-Live", due_date: day(18), completed_at: null },
  ],
  research_entries: [
    { id: id(), project_id: P.market, title: "EU-Regulierung KI-Systeme", summary: "Kernpflichten und Fristen zusammengefasst.", source_url: "https://eur-lex.europa.eu/", tags: ["regulierung", "ki"], status: "verified", confidence: "high", created_at: ts(-8), updated_at: ts(-8) },
    { id: id(), project_id: P.launch, title: "Supabase Auth Hooks", summary: "Custom Access Token Hook auf Free verfügbar.", source_url: "https://supabase.com/docs", tags: ["supabase", "sicherheit"], status: "draft", confidence: "medium", created_at: ts(-3), updated_at: ts(-3) },
  ],
  decisions: [
    { id: id(), project_id: P.launch, title: "Supabase als Datenbank", context: "Auth, Postgres und RLS aus einer Hand.", decision: "Supabase, EU-Region.", alternatives: "Firebase, eigenes Postgres", rationale: "RLS und SQL-Portabilität.", status: "accepted", decided_at: day(-20), created_at: ts(-20) },
    { id: id(), project_id: P.launch, title: "Zuerst benutzbare Oberfläche", context: "Frühe Nutzung auf Laptop und Smartphone.", decision: "UI vor Abschluss der Sicherheitsarchitektur, nur mit synthetischen Daten.", alternatives: "Sicherheit zuerst vollständig", rationale: "Frühes Feedback ohne Risiko für echte Daten.", status: "accepted", decided_at: day(0), created_at: ts(0) },
  ],
  agents: [
    { id: id(), department_id: D.tech, name: "Research-Analyst", role: "Tiefenrecherche", skill_command: "/deep-research", description: "Belegte Recherchen mit Quellen.", status: "active", created_at: ts(-30), updated_at: ts(-30) },
    { id: id(), department_id: D.strat, name: "Red-Team-Auditor", role: "Gegenprüfung", skill_command: "/red-team", description: "Unabhängige Prüfung von Plänen und Code.", status: "active", created_at: ts(-30), updated_at: ts(-30) },
  ],
  weekly_reports: [],
};

// ---------- PostgREST-Teilmenge ----------
const cmp = (a, b) => (a === b ? 0 : a === null || a === undefined ? 1 : b === null || b === undefined ? -1 : a < b ? -1 : 1);
function match(row, key, expr) {
  const i = expr.indexOf("."); const op = expr.slice(0, i); const raw = expr.slice(i + 1);
  const v = row[key];
  const val = decodeURIComponent(raw);
  switch (op) {
    case "eq": return String(v) === val;
    case "neq": return String(v) !== val;
    case "lt": return v !== null && String(v) < val;
    case "lte": return v !== null && String(v) <= val;
    case "gt": return v !== null && String(v) > val;
    case "gte": return v !== null && String(v) >= val;
    case "is": return val === "null" ? v === null || v === undefined : String(v) === val;
    case "not": { const [op2, ...rest] = raw.split("."); return !match(row, key, `${op2}.${rest.join(".")}`); }
    case "in": return val.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")).includes(String(v));
    case "ilike": { const re = new RegExp("^" + val.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/%/g, ".*") + "$", "i"); return re.test(String(v ?? "")); }
    case "cs": { const want = val.replace(/^\{|\}$/g, "").split(",").filter(Boolean).map((s) => s.replace(/^"|"$/g, "")); return Array.isArray(v) && want.every((w) => v.includes(w)); }
    default: return true;
  }
}
const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
function query(rows, params) {
  let out = rows.filter((r) => [...params].every(([k, e]) => RESERVED.has(k) || match(r, k, e)));
  const order = params.get("order");
  if (order) {
    const keys = order.split(",").map((s) => { const [col, dir] = s.split("."); return { col, desc: dir === "desc" }; });
    out = [...out].sort((a, b) => { for (const { col, desc } of keys) { const c = cmp(a[col], b[col]); if (c) return desc ? -c : c; } return 0; });
  }
  const off = Number(params.get("offset") ?? 0); const lim = params.get("limit");
  return out.slice(off, lim ? off + Number(lim) : undefined);
}
function project(rows, select) {
  if (!select || select === "*") return rows;
  const cols = select.split(",").map((s) => s.trim()).filter(Boolean);
  return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null])));
}
function derive(table, row) {
  if (table === "tasks") row.completed_at = row.status === "done" ? row.completed_at ?? nowIso() : null;
  if ("updated_at" in row || ["projects", "tasks", "research_entries", "agents", "weekly_reports"].includes(table)) row.updated_at = nowIso();
  return row;
}

const log = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    log.push(`${req.method} ${url.pathname}`);
    const json = (code, data, headers = {}) => {
      res.writeHead(code, { "content-type": "application/json", ...headers });
      res.end(data === undefined ? "" : JSON.stringify(data));
    };
    const b = body ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : {};
    // --- Auth ---
    if (url.pathname === "/auth/v1/token") {
      const grant = url.searchParams.get("grant_type");
      if (grant === "password" && (b.email !== DEMO_EMAIL || b.password !== DEMO_PASSWORD)) {
        return json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
      }
      return json(200, { access_token: accessToken(), refresh_token: id(), token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user });
    }
    if (url.pathname === "/auth/v1/user") {
      if (req.method === "PUT") return json(200, user);
      return json(200, user);
    }
    if (url.pathname === "/auth/v1/logout") return json(204);
    if (url.pathname === "/auth/v1/signup" || url.pathname === "/auth/v1/recover") {
      return json(400, { code: 400, error_code: "signup_disabled", msg: "In der lokalen Demo deaktiviert" });
    }
    if (url.pathname === "/__demo/log") return json(200, log.slice(-200));
    // --- REST ---
    const m = url.pathname.match(/^\/rest\/v1\/(\w+)$/);
    if (!m || !db[m[1]]) return json(404, { message: "In der lokalen Demo nicht vorhanden" });
    const table = m[1]; const rows = db[table]; const params = url.searchParams;
    const prefer = req.headers.prefer ?? "";
    const accept = req.headers.accept ?? "";
    if (req.method === "HEAD" || (req.method === "GET" && prefer.includes("count="))) {
      const n = query(rows, params).length;
      if (req.method === "HEAD") { res.writeHead(200, { "content-range": `0-${Math.max(n - 1, 0)}/${n}` }); return res.end(); }
    }
    if (req.method === "GET") {
      const out = project(query(rows, params), params.get("select"));
      if (accept.includes("vnd.pgrst.object")) return out.length ? json(200, out[0]) : json(406, { code: "PGRST116", message: "no rows" });
      return json(200, out, { "content-range": `0-${Math.max(out.length - 1, 0)}/${out.length}` });
    }
    if (req.method === "POST") {
      const items = (Array.isArray(b) ? b : [b]).map((x) => derive(table, { id: id(), created_at: nowIso(), ...x }));
      if (table === "weekly_reports" && items.some((x) => rows.some((r) => r.week_start === x.week_start))) {
        return json(409, { code: "23505", message: "duplicate key value" });
      }
      rows.push(...items);
      return prefer.includes("return=representation") ? json(201, project(items, params.get("select"))) : json(201, undefined);
    }
    if (req.method === "PATCH") {
      const hit = query(rows, params);
      for (const r of hit) { Object.assign(r, b); derive(table, r); }
      return json(200, project(hit, params.get("select") ?? "id"));
    }
    if (req.method === "DELETE") {
      const hit = new Set(query(rows, params));
      db[table] = rows.filter((r) => !hit.has(r));
      return json(200, project([...hit], params.get("select") ?? "id"));
    }
    return json(405, { message: "nicht unterstützt" });
  });
});
server.listen(PORT, "127.0.0.1", () => console.log(`[demo] Supabase-Attrappe auf http://127.0.0.1:${PORT} (synthetische Daten, nichts wird gespeichert)`));
