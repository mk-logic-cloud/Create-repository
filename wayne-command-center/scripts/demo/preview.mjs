// Startet die LOKALE DEMO: Supabase-Attrappe (synthetische Daten) + Produktionsbuild der App.
// Aufruf: npm run demo   → http://localhost:3000   (nur dieser Rechner; nicht im Netzwerk erreichbar)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./mock-supabase.mjs";

const port = process.env.DEMO_PORT ?? "3000";
const env = {
  ...process.env,
  NODE_ENV: "production",
  SUPABASE_URL: `http://127.0.0.1:${process.env.DEMO_SUPABASE_PORT ?? 54321}`,
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_LOCAL_DEMO_ONLY",
  // Nur fuer E-Mail-Links relevant (in der Demo gibt es keine). Produktion verlangt https.
  SITE_URL: `https://localhost:${port}`,
};
for (const k of ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"]) delete env[k];

if (!existsSync(".next/BUILD_ID")) {
  console.error("[demo] Kein Produktionsbuild gefunden. Bitte zuerst: npm run build");
  process.exit(1);
}
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", port], { env, stdio: "inherit" });
console.log(`\n[demo] LOKALE DEMO mit synthetischen Daten – nicht für echte Daten, kein Sicherheitsnachweis.`);
console.log(`[demo] Öffnen:   http://localhost:${port}   (Chrome oder Firefox)`);
console.log(`[demo] Anmelden: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
console.log(`[demo] Beenden:  Strg+C (Änderungen gehen dabei verloren)\n`);
const stop = () => { app.kill("SIGTERM"); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
app.on("exit", (code) => process.exit(code ?? 0));
