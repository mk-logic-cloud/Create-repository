import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { getSupabaseEnvProblem } from "@/lib/env";

export const metadata: Metadata = { title: "Einrichtung" };
export const dynamic = "force-dynamic";

export default function SetupPage() {
  const problem = getSupabaseEnvProblem();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-8">
        <Brand />
        <section className="glass space-y-5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5" /></div>
            <div>
              <h1 className="text-lg font-semibold">Einrichtung erforderlich</h1>
              <p className="text-sm text-muted-foreground">{problem ?? "Konfiguration unvollständig."}</p>
            </div>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary">
            <li>Supabase-Projekt anlegen und die Migration aus <code className="text-foreground">supabase/migrations</code> ausführen.</li>
            <li>
              Umgebungsvariablen setzen (lokal in <code className="text-foreground">.env.local</code>, auf Vercel unter
              Project Settings → Environment Variables):
              <pre className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-foreground">{`SUPABASE_URL=https://<projekt>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SITE_URL=https://<ihre-domain>`}</pre>
            </li>
            <li>Server neu starten bzw. auf Vercel neu deployen.</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Niemals den Service-Role- oder Secret-Key hinterlegen — die Anwendung lehnt ihn ab. Details: <code>docs/MANUAL_STEPS.md</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
