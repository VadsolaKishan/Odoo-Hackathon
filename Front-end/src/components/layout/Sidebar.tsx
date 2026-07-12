import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench,
  Fuel, BarChart3, Settings, ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/permissions";
import type { Resource } from "@/lib/permissions";

const items: { to: string; label: string; icon: typeof LayoutDashboard; resource?: Resource }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fleet", label: "Fleet", icon: Truck, resource: "fleet" },
  { to: "/drivers", label: "Drivers", icon: Users, resource: "drivers" },
  { to: "/trips", label: "Trips", icon: RouteIcon, resource: "trips" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, resource: "maintenance" },
  { to: "/expenses", label: "Fuel & Expenses", icon: Fuel, resource: "fuel" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, resource: "analytics" },
  { to: "/settings", label: "Settings", icon: Settings, resource: "settings" },
];

const roleColors: Record<string, string> = {
  "Fleet Manager": "bg-primary/20 text-primary border-primary/30",
  "Dispatcher": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Safety Officer": "bg-green-500/20 text-green-400 border-green-500/30",
  "Financial Analyst": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function Sidebar({ onNavigate, collapsed, onToggleCollapse }: { onNavigate?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const role = user?.role;

  const visibleItems = items.filter((item) => {
    if (!item.resource) return true; // Dashboard always visible
    return canAccess(role, item.resource);
  });

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 overflow-hidden",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border shrink-0 transition-all duration-300",
        collapsed ? "justify-center px-2 py-5" : "gap-2 px-5 py-5"
      )}>
        <img
          src="/favicon.png"
          alt="TransitOps Logo"
          className="h-10 w-10 shrink-0 rounded-lg object-contain"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-sidebar-foreground">
              TransitOps
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/50 font-medium">
              Smart Transport Ops
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-0.5 py-4 overflow-y-auto transition-all duration-300",
        collapsed ? "px-2" : "px-3"
      )}>
        {visibleItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                collapsed
                  ? "justify-center px-0 py-2.5"
                  : "gap-3 px-3 py-2.5",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  active ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + Collapse toggle */}
      <div className="border-t border-sidebar-border shrink-0 px-3 py-3">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "gap-3"
        )}>
          {/* Avatar - always visible */}
          {user && (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
          )}

          {/* Name & role - hidden when collapsed */}
          {user && !collapsed && (
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
          )}

          {/* Collapse toggle */}
          {onToggleCollapse && !collapsed && (
            <button
              onClick={onToggleCollapse}
              className="sidebar-user-action-btn"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* When collapsed, show toggle below avatar */}
        {onToggleCollapse && collapsed && (
          <div className="flex justify-center mt-2">
            <button
              onClick={onToggleCollapse}
              className="sidebar-user-action-btn"
              title="Expand sidebar"
            >
              <ChevronsLeft className="h-4 w-4 transition-transform duration-300 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
