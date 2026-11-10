"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function MobileNav({ footer }: { footer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="glass-strong sticky top-0 z-40 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
      <Brand />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Navigation öffnen">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Bereiche des Command Centers</SheetDescription>
          <div className="px-1 pt-1"><Brand /></div>
          <div className="flex-1 overflow-y-auto"><NavLinks onNavigate={() => setOpen(false)} /></div>
          {footer}
        </SheetContent>
      </Sheet>
    </header>
  );
}
