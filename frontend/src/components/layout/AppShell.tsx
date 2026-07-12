import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#090d16]">
      <div className="hidden lg:block h-full">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 border-0 bg-sidebar text-sidebar-foreground">
          <Sidebar onNavigate={() => setOpen(false)} collapsed={false} />
        </SheetContent>
      </Sheet>
      <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background lg:rounded-tl-[20px] lg:rounded-bl-[20px] shadow-[-8px_0_24px_rgba(0,0,0,0.08)] border-l border-black/5">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">{children}</main>
      </div>
    </div>
  );
}
