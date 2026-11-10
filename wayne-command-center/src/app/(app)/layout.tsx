import { Brand } from "@/components/layout/brand";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { UserBadge } from "@/components/layout/user-badge";
import { getProfile, requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const profile = await getProfile();
  const badge = <UserBadge name={profile?.full_name ?? null} email={user.email ?? ""} />;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Zum Inhalt springen
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-white/[0.06] bg-black/20 p-4 backdrop-blur-2xl lg:flex">
        <div className="px-2 pt-2"><Brand /></div>
        <div className="flex-1 overflow-y-auto"><NavLinks /></div>
        {badge}
      </aside>
      <MobileNav footer={badge} />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-10 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
