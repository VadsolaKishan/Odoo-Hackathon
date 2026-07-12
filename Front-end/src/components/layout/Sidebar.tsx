import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench,
  Fuel, BarChart3, Settings, Bus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/permissions";
import type { Resource } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";

const items: { to: string; label: string; icon: typeof LayoutDashboard; resource?: Resource }[] = [
  { to: "/dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { to: "/fleet",        label: "Fleet",           icon: Truck,      resource: "fleet" },
  { to: "/drivers",      label: "Drivers",         icon: Users,      resource: "drivers" },
  { to: "/trips",        label: "Trips",           icon: RouteIcon,  resource: "trips" },
  { to: "/maintenance",  label: "Maintenance",     icon: Wrench,     resource: "maintenance" },
  { to: "/expenses",     label: "Fuel & Expenses", icon: Fuel,       resource: "fuel" },
  { to: "/analytics",    label: "Analytics",       icon: BarChart3,  resource: "analytics" },
  { to: "/settings",     label: "Settings",        icon: Settings,   resource: "settings" },
];

const roleColors: Record<string, string> = {
  "Fleet Manager":    "bg-primary/20 text-primary border-primary/30",
  "Dispatcher":       "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Safety Officer":   "bg-green-500/20 text-green-400 border-green-500/30",
  "Financial Analyst":"bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const role = user?.role;

  const visibleItems = items.filter((item) => {
    if (!item.resource) return true; // Dashboard always visible
    return canAccess(role, item.resource);
  });

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg">
          <Bus className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
            TransitOps
          </p>
          <p className="truncate text-[10px] text-sidebar-foreground/50 font-medium">
            Smart Transport Ops
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">{user.name}</p>
              <span
                className={cn(
                  "inline-block mt-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                  roleColors[role ?? ""] ?? "bg-muted/20 text-muted-foreground border-muted/30"
                )}
              >
                {role}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
