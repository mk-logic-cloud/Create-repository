import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center"><Brand /></div>
        <div className="glass rounded-3xl p-6 sm:p-8">{children}</div>
        <p className="text-center text-xs text-muted-foreground">Geschützter Bereich · Zugriff nur für autorisierte Personen</p>
      </div>
    </main>
  );
}
