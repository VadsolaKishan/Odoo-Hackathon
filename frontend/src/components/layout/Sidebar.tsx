import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fleet", label: "Fleet", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trips", label: "Trips", icon: RouteIcon },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/expenses", label: "Fuel & Expenses", icon: Fuel },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:rounded-tr-[20px] lg:rounded-br-[20px]",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {collapsed ? (
        <div className="flex justify-center py-6 px-2">
          <div className="h-10 w-10 shrink-0">
            <img src="/favicon.png" alt="FleetNova Logo" className="h-full w-full object-contain" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3.5 px-5 py-6">
          <div className="h-14 w-14 shrink-0">
            <img src="/favicon.png" alt="FleetNova Logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-sidebar-foreground leading-none">FleetNova</p>
            <p className="truncate text-xs text-sidebar-foreground/60 mt-1">Smart Fleet Operations</p>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                collapsed ? "justify-center px-2" : "",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-sidebar-foreground/40 font-mono">v1.0</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-full border border-sidebar-border bg-sidebar-accent/10 hover:scale-105 active:scale-95 shadow-sm transition-all duration-200"
              onClick={onToggleCollapse}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-sidebar-foreground/50 pl-2">v1.0 · Mock data</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-full border border-sidebar-border bg-sidebar-accent/10 hover:scale-105 active:scale-95 shadow-sm transition-all duration-200"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
