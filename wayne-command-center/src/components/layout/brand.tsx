export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl border border-primary/25 bg-gradient-to-b from-primary/20 to-primary/5 shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
        <span className="text-gold-gradient text-sm font-bold tracking-tight">W</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Wayne</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Command Center</div>
      </div>
    </div>
  );
}
