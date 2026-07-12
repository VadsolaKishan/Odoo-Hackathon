import { createFileRoute } from "@tanstack/react-router";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import type { Resource } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — TransitOps" }] }),
  component: SettingsPage,
});

const RESOURCES: Resource[] = ["fleet", "drivers", "trips", "maintenance", "fuel", "analytics", "settings"];
const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] as const;

const permissionLabel: Record<string, { label: string; color: string }> = {
  manage:          { label: "Manage",       color: "bg-primary/20 text-primary border-primary/30" },
  edit:            { label: "Edit",         color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  edit_assignment: { label: "Edit Assign.", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  view:            { label: "View",         color: "bg-success/20 text-success border-success/30" },
  read:            { label: "Read Only",    color: "bg-muted text-muted-foreground border-border" },
};

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          General configuration and access control
        </p>
      </div>

      {/* General Settings — Fleet Manager only */}
      <PermissionGuard resource="settings" required="manage" blockPage>
        <div className="space-y-5">
          {/* General card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Application</p>
                  <p className="text-xs text-muted-foreground">TransitOps Smart Transport Operations Platform</p>
                </div>
                <Badge variant="secondary">v1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Logged In As</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 border">
                  {user?.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-xs text-muted-foreground">Mock mode · Password: demo1234</p>
                </div>
                <Badge variant="outline">Demo</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Data Storage</p>
                  <p className="text-xs text-muted-foreground">In-memory state (resets on refresh)</p>
                </div>
                <Badge variant="outline">Mock</Badge>
              </div>
            </CardContent>
          </Card>

          {/* RBAC Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Role-Based Access Control Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Resource
                      </th>
                      {ROLES.map((r) => (
                        <th key={r} className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map((resource, idx) => (
                      <tr
                        key={resource}
                        className={cn(
                          "border-b border-border last:border-0",
                          idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                        )}
                      >
                        <td className="py-3 px-4 font-medium capitalize">{resource}</td>
                        {ROLES.map((role) => {
                          const perm = PERMISSIONS[role][resource];
                          const meta = perm ? permissionLabel[perm] : null;
                          return (
                            <td key={role} className="py-3 px-4 text-center">
                              {meta ? (
                                <span className={cn(
                                  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                                  meta.color
                                )}>
                                  {meta.label}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive/70">
                                  No Access
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </div>
  );
}
