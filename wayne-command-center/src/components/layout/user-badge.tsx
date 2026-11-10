import { LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function UserBadge({ name, email }: { name: string | null; email: string }) {
  const display = name || email;
  const initials = display.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2.5">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-xs font-semibold" aria-hidden>
        {initials}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-medium">{display}</div>
        {name && <div className="truncate text-xs text-muted-foreground">{email}</div>}
      </div>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Abmelden" title="Abmelden">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}
