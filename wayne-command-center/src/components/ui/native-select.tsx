import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** shadcn/ui native select — keeps the OS picker on mobile, which is the most usable option there. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="native-select"
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-input bg-white/[0.03] pl-3.5 pr-9 text-base text-foreground outline-none transition-colors md:text-sm [color-scheme:dark]",
          "focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive/70 disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

export { NativeSelect };
