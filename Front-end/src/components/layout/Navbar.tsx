import { Bell, LogOut, Menu, Search, User, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function Navbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "U";

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("transitops.theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("transitops.theme", theme);
  }, [theme]);

  return (
    <header className="navbar-header">
      {/* Left section: hamburger + search */}
      <div className="navbar-left">
        <Button variant="ghost" size="icon" className="navbar-menu-btn lg:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="navbar-search">
          <Search className="navbar-search-icon" />
          <Input placeholder="Search vehicles, drivers, trips…" className="navbar-search-input" />
        </div>
      </div>

      {/* Right section: actions + user */}
      <div className="navbar-right">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="navbar-action-btn"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px] text-amber-400" /> : <Moon className="h-[18px] w-[18px] text-blue-400" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="navbar-action-btn navbar-notification-btn">
          <Bell className="h-[18px] w-[18px]" />
          <span className="navbar-notification-dot" />
        </Button>

        {/* Divider */}
        <div className="navbar-divider" />

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="navbar-user-trigger">
              <Avatar className="h-9 w-9 navbar-avatar">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="navbar-user-info hidden sm:block">
                <p className="navbar-user-name">{user?.name}</p>
                <p className="navbar-user-email">{user?.email}</p>
              </div>
              <Badge variant="secondary" className="navbar-role-badge hidden md:inline-flex">{user?.role}</Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
