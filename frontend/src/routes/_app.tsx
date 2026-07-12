import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/auth" });
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
