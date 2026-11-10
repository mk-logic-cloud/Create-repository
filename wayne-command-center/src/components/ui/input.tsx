import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-input bg-white/[0.03] px-3.5 py-2 text-base text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] transition-colors outline-none placeholder:text-muted-foreground/70 md:text-sm",
        "focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "aria-invalid:border-destructive/70 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50",
        "[color-scheme:dark] file:border-0 file:bg-transparent file:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
