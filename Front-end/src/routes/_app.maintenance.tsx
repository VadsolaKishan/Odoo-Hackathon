import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Wrench, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useStore } from "@/context/StoreContext";
import { usePermission } from "@/hooks/usePermission";
import type { MaintenanceStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — TransitOps" }] }),
  component: MaintenancePage,
});

const schema = z.object({
  vehicleId:   z.string().min(1, "Select a vehicle"),
  serviceType: z.string().trim().min(1, "Required"),
  cost:        z.coerce.number().min(0),
  date:        z.string().min(1, "Required"),
  status:      z.enum(["Scheduled", "In Progress", "Completed"]),
});
type FormValues = z.infer<typeof schema>;

const SERVICE_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Service", "Engine Repair",
  "Battery Replacement", "General Inspection", "Transmission Service", "AC Repair",
];
const MAINT_STATUSES = ["Scheduled", "In Progress", "Completed"] as const;

function MaintenancePage() {
  const { vehicles, maintenance, addMaintenance, updateMaintenance, currencySymbol } = useStore();
  const { can } = usePermission();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const canManage = can("maintenance", "manage");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: "", serviceType: "Oil Change", cost: 2500,
      date: new Date().toISOString().slice(0, 10), status: "Scheduled",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const res = await addMaintenance(values);
    if (!res.ok) {
      toast.error(res.error || "Failed to add maintenance record");
      return;
    }
    toast.success("Maintenance record added. Vehicle status updated.");
    setOpen(false);
    form.reset();
  };

  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );

  const filtered = useMemo(
    () => statusFilter === "all" ? maintenance : maintenance.filter((m) => m.status === statusFilter),
    [maintenance, statusFilter]
  );

  // Stats
  const stats = useMemo(() => ({
    total:      maintenance.length,
    scheduled:  maintenance.filter((m) => m.status === "Scheduled").length,
    inProgress: maintenance.filter((m) => m.status === "In Progress").length,
    completed:  maintenance.filter((m) => m.status === "Completed").length,
    totalCost:  maintenance.reduce((s, m) => s + m.cost, 0),
  }), [maintenance]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track service history · Available → In Shop → Available
          </p>
        </div>
        <PermissionGuard resource="maintenance" required="manage">
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Record
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", count: stats.total, color: "text-foreground" },
          { label: "Scheduled", count: stats.scheduled, color: "text-warning" },
          { label: "In Progress", count: stats.inProgress, color: "text-blue-400" },
          { label: "Completed", count: stats.completed, color: "text-success" },
          { label: "Total Cost", count: `${currencySymbol}${Math.round(stats.totalCost / 1000)}k`, color: "text-primary" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold mt-1", color)}>{count}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          {/* Status filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {["all", ...MAINT_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-all capitalize",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              text="No maintenance records found."
              action={canManage ? <Button onClick={() => setOpen(true)} size="sm"><Plus className="mr-1.5 h-4 w-4" />New Record</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Cost ({currencySymbol})</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-36" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const vehicle = vehicleById[m.vehicleId];
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                        <TableCell>
                          <p className="font-mono text-sm font-semibold">{vehicle?.registration ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{vehicle?.name}</p>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{m.serviceType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.date ? new Date(m.date).toLocaleDateString("en-IN") : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {currencySymbol}{m.cost.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell><StatusBadge status={m.status} /></TableCell>
                        <TableCell className="text-right">
                          <PermissionGuard resource="maintenance" required="manage">
                            {m.status !== "Completed" ? (
                              <div className="flex justify-end gap-1.5">
                                {m.status === "Scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={async () => {
                                      setStartingId(m.id);
                                      const res = await updateMaintenance(m.id, { status: "In Progress" });
                                      setStartingId(null);
                                      if (res.ok) toast.success("Status → In Progress");
                                      else toast.error(res.error);
                                    }}
                                    isLoading={startingId === m.id}
                                    disabled={startingId !== null || completingId !== null}
                                  >
                                    Start
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={async () => {
                                    setCompletingId(m.id);
                                    const res = await updateMaintenance(m.id, { status: "Completed" });
                                    setCompletingId(null);
                                    if (res.ok) toast.success("Completed · Vehicle set Available");
                                    else toast.error(res.error);
                                  }}
                                  isLoading={completingId === m.id}
                                  disabled={startingId !== null || completingId !== null}
                                >
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                  Complete
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-success font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </span>
                            )}
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Record Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Maintenance Record</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Scheduling or starting maintenance will change vehicle status to <strong>In Shop</strong>.
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 pt-1">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Vehicle</Label>
              <Select onValueChange={(v) => form.setValue("vehicleId", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.filter((v) => v.status !== "Retired").map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} · {v.name}
                      {v.status !== "Available" && <span className="text-muted-foreground ml-1">({v.status})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vehicleId && (
                <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.vehicleId.message}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Service Type</Label>
              <Select defaultValue={form.getValues("serviceType")} onValueChange={(v) => form.setValue("serviceType", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as MaintenanceStatus)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MAINT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cost ({currencySymbol})</Label>
              <Input type="number" className="mt-1" {...form.register("cost")} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" className="mt-1" {...form.register("date")} />
            </div>
            <DialogFooter className="col-span-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
