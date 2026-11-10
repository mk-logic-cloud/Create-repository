import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-input bg-white/[0.03] px-3.5 py-2.5 text-base text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] outline-none transition-colors placeholder:text-muted-foreground/70 md:text-sm",
        "focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive/70 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
