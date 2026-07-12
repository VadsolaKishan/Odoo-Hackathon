import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";

export function Navbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "U";
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search vehicles, drivers, trips…" className="pl-9" />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 border border-card" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-full px-1 py-1 pr-3 hover:bg-muted transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-amber-500 text-white text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
              <Badge className="hidden md:inline-flex bg-[#0086ff] hover:bg-[#0076ee] text-white border-0 font-semibold px-3 py-1 text-xs rounded-full">
                {user?.role}
              </Badge>
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
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
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
