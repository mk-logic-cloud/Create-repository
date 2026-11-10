import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot, Building2, CheckSquare, FolderKanban, Library, Scale, Sparkles, type LucideIcon } from "lucide-react";
import { EnumBadge } from "@/components/entity/enum-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProfile } from "@/lib/auth";
import { formatDate, todayInZone } from "@/lib/dates";
import { DECISION_STATUS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/features/dashboard/queries";
import { getProjectLookup, nameMap, toOptions } from "@/features/shared/lookups";
import { TaskList } from "@/features/tasks/task-list";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(timeZone: string) {
  const h = Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()));
  return h < 5 ? "Gute Nacht" : h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
}

export default async function DashboardPage() {
  const profile = await getProfile();
  const tz = profile?.timezone ?? "Europe/Berlin";
  const today = todayInZone(tz);
  const [data, projects] = await Promise.all([getDashboard(today), getProjectLookup()]);
  const { kpis } = data;
  const isEmpty = kpis.open === 0 && kpis.activeProjects === 0 && kpis.research === 0 && kpis.agents === 0 && data.decisions.length === 0 && projects.length === 0;
  const firstName = profile?.full_name?.split(" ")[0];
  const todayLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date());

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={todayLabel} title={`${greeting(tz)}${firstName ? `, ${firstName}` : ""}.`} description="Lage, Prioritäten und Fortschritt auf einen Blick." />

      {isEmpty ? (
        <Onboarding />
      ) : (
        <>
          <section aria-label="Kennzahlen" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi href="/tasks?status=open" icon={CheckSquare} label="Offene Aufgaben" value={kpis.open} />
            <Kpi href="/tasks?status=open" icon={AlertTriangle} label="Überfällig" value={kpis.overdue} tone={kpis.overdue > 0 ? "danger" : undefined} sub={kpis.blocked > 0 ? `${kpis.blocked} blockiert` : undefined} />
            <Kpi href="/projects?status=active" icon={FolderKanban} label="Aktive Projekte" value={kpis.activeProjects} />
            <Kpi href="/decisions" icon={Scale} label="Entscheidungen" value={kpis.decisions30} sub="letzte 30 Tage" />
            <Kpi href="/research" icon={Library} label="Research" value={kpis.research} />
            <Kpi href="/agents?status=active" icon={Bot} label="Aktive Agenten" value={kpis.agents} />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="space-y-3 lg:col-span-3" aria-labelledby="next-heading">
              <SectionHeader id="next-heading" title="Als Nächstes" href="/tasks?status=open" />
              {data.upcoming.length === 0 ? (
                <Card className="text-sm text-muted-foreground">Keine offenen Aufgaben. Ausgezeichnet.</Card>
              ) : (
                <TaskList tasks={data.upcoming} projects={toOptions(projects)} projectNames={nameMap(projects)} today={today} compact />
              )}
            </section>

            <section className="space-y-3 lg:col-span-2" aria-labelledby="projects-heading">
              <SectionHeader id="projects-heading" title="Aktive Projekte" href="/progress" linkLabel="Fortschritt" />
              <Card className="gap-4">
                {data.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine aktiven Projekte.</p>
                ) : (
                  data.projects.map((p) => (
                    <div key={p.id} className="space-y-2">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} aria-label={`Fortschritt ${p.name}`} />
                      {p.due_date && <p className={cn("text-xs text-muted-foreground", p.due_date < today && "text-destructive")}>Fällig {formatDate(p.due_date, true)}</p>}
                    </div>
                  ))
                )}
              </Card>
            </section>
          </div>

          <section className="space-y-3" aria-labelledby="decisions-heading">
            <SectionHeader id="decisions-heading" title="Letzte Entscheidungen" href="/decisions" />
            {data.decisions.length === 0 ? (
              <Card className="text-sm text-muted-foreground">Noch keine Entscheidungen protokolliert.</Card>
            ) : (
              <ul className="glass divide-y divide-white/[0.06] overflow-hidden rounded-2xl">
                {data.decisions.map((d) => (
                  <li key={d.id} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{formatDate(d.decided_at)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{d.title}</span>
                    <EnumBadge value={d.status} meta={DECISION_STATUS.meta} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ href, icon: Icon, label, value, sub, tone }: { href: string; icon: LucideIcon; label: string; value: number; sub?: string; tone?: "danger" }) {
  return (
    <Link href={href} className="glass group flex flex-col gap-3 rounded-2xl p-4 transition hover:bg-white/[0.06] focus-visible:ring-[3px] focus-visible:ring-ring outline-none">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        <Icon className={cn("size-4", tone === "danger" && value > 0 ? "text-destructive" : "group-hover:text-primary")} />
      </div>
      <div>
        <div className={cn("font-mono text-3xl font-medium tabular-nums tracking-tight", tone === "danger" && value > 0 && "text-destructive")}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </Link>
  );
}

function SectionHeader({ id, title, href, linkLabel = "Alle" }: { id: string; title: string; href: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 id={id} className="text-sm font-semibold">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">{linkLabel}<ArrowRight className="size-3" /></Link>
    </div>
  );
}

function Onboarding() {
  const steps = [
    { href: "/departments", icon: Building2, title: "Abteilungen anlegen", text: "Struktur schaffen: Strategie, Finanzen, Technologie …" },
    { href: "/projects", icon: FolderKanban, title: "Erstes Projekt", text: "Ziel, Fälligkeit und Verantwortung festlegen." },
    { href: "/tasks", icon: CheckSquare, title: "Aufgaben erfassen", text: "Konkrete nächste Schritte mit Priorität." },
    { href: "/agents", icon: Bot, title: "Agenten registrieren", text: "Skills wie /deep-research zuordnen." },
  ];
  return (
    <section className="glass space-y-6 rounded-3xl p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
        <div>
          <h2 className="text-lg font-semibold">Ihr Command Center ist bereit.</h2>
          <p className="text-sm text-muted-foreground">Noch sind keine Daten vorhanden. Kennzahlen erscheinen, sobald Sie Einträge anlegen — nichts hier ist simuliert.</p>
        </div>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.href}>
            <Link href={s.href} className="group flex h-full items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-primary/30 hover:bg-white/[0.04]">
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <div className="space-y-0.5">
                <p className="flex items-center gap-2 text-sm font-medium"><s.icon className="size-4 text-muted-foreground group-hover:text-primary" />{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.text}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <Button asChild variant="outline"><Link href="/settings">Profil & Zeitzone einstellen</Link></Button>
    </section>
  );
}
