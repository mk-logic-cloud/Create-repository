import { Badge, type BadgeVariant } from "@/components/ui/badge";

export function EnumBadge<T extends string>({ value, meta }: { value: T; meta: Record<T, { label: string; variant: BadgeVariant }> }) {
  const m = meta[value];
  return <Badge variant={m?.variant ?? "neutral"}>{m?.label ?? value}</Badge>;
}
