import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { FieldOption } from "./types";

type Select = { name: string; label: string; value?: string; options: FieldOption[]; all: string };

/** GET-based filter form: works without JavaScript and keeps filters in the URL. */
export function FilterBar({ basePath, q, selects, searchLabel = "Suchen", hidden, searchable = true }: { basePath: string; q?: string; selects: Select[]; searchLabel?: string; hidden?: Record<string, string | undefined>; searchable?: boolean }) {
  const active = Boolean(q) || selects.some((s) => s.value);
  return (
    <form method="get" action={basePath} className="glass grid gap-2 rounded-2xl p-2 sm:flex sm:flex-wrap sm:items-center" role="search">
      {hidden && Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {searchable ? (
      <div className="relative min-w-0 sm:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input name="q" defaultValue={q} placeholder={searchLabel} aria-label={searchLabel} maxLength={100} className="border-transparent bg-transparent pl-9 shadow-none" />
      </div>
      ) : (
        <div className="hidden sm:block sm:flex-1" />
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex">
        {selects.map((s) => (
          <div key={s.name} className="sm:w-44">
            <NativeSelect name={s.name} defaultValue={s.value ?? ""} aria-label={s.label}>
              <option value="">{s.all}</option>
              {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </NativeSelect>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="secondary" className="flex-1 sm:flex-none">Filtern</Button>
        {active && <Button asChild variant="ghost"><Link href={basePath}>Zurücksetzen</Link></Button>}
      </div>
    </form>
  );
}
