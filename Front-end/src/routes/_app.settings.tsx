import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type { Resource } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
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
  const { settings, updateSettings } = useStore();
  const [dept, setDept] = useState("Northern Logistics Dept");
  const [currency, setCurrency] = useState("INR");
  const [unit, setUnit] = useState("km");

  useEffect(() => {
    if (settings) {
      setDept(settings.departmentName);
      setCurrency(settings.currency);
      setUnit(settings.distanceUnit);
    }
  }, [settings]);

  const handleSave = async () => {
    const res = await updateSettings({ departmentName: dept, currency, distanceUnit: unit });
    if (res.ok) {
      toast.success("Settings saved successfully");
    } else {
      toast.error(res.error || "Failed to save settings");
    }
  };

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
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground">Department Name</Label>
                <Input className="mt-1.5" value={dept} onChange={(e) => setDept(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["INR", "USD", "EUR", "GBP", "AED"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Distance Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometres</SelectItem>
                    <SelectItem value="mi">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button onClick={handleSave}><Check className="mr-2 h-4 w-4" /> Save changes</Button>
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
