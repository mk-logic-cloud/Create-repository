import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass flex max-w-sm flex-col items-center gap-3 rounded-3xl p-8 text-center">
        <p className="text-5xl font-semibold text-gold-gradient">404</p>
        <h1 className="text-lg font-semibold">Seite nicht gefunden</h1>
        <p className="text-sm text-muted-foreground">Diese Adresse existiert nicht oder wurde verschoben.</p>
        <Button asChild className="mt-2"><Link href="/">Zum Dashboard</Link></Button>
      </div>
    </main>
  );
}
