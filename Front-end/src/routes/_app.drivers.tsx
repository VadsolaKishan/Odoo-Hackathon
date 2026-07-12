import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, AlertTriangle, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useStore } from "@/context/StoreContext";
import { usePermission } from "@/hooks/usePermission";
import type { Driver, DriverStatus, LicenseCategory } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/drivers")({
  head: () => ({ meta: [{ title: "Drivers — TransitOps" }] }),
  component: DriversPage,
});

const schema = z.object({
  name:        z.string().trim().min(2, "Required").max(80),
  license:     z.string().trim().min(5, "Required").max(40),
  category:    z.enum(["LMV", "HMV", "HTV", "PSV"]),
  expiry:      z.string().min(1, "Required"),
  phone:       z.string().trim().min(6, "Required").max(20),
  safetyScore: z.coerce.number().int().min(0).max(100),
  status:      z.enum(["Available", "On Trip", "Off Duty", "Suspended"]),
});
type FormValues = z.infer<typeof schema>;

const DRIVER_STATUSES = ["Available", "On Trip", "Off Duty", "Suspended"] as const;
const LICENSE_CATS    = ["LMV", "HMV", "HTV", "PSV"] as const;
const PAGE_SIZE = 10;

function scoreColor(s: number) {
  if (s >= 90) return "text-success";
  if (s >= 70) return "text-warning";
  return "text-destructive";
}

function scoreBg(s: number) {
  if (s >= 90) return "bg-success/15";
  if (s >= 70) return "bg-warning/15";
  return "bg-destructive/15";
}

// Compute trip completion % from the trips list — placeholder based on driver availability pattern
function tripStats(trips: { driverId: string; status: string }[], driverId: string) {
  const driverTrips = trips.filter((t) => t.driverId === driverId);
  if (!driverTrips.length) return 0;
  const done = driverTrips.filter((t) => t.status === "Completed").length;
  return Math.round((done / driverTrips.length) * 100);
}

function DriversPage() {
  const { drivers, trips, addDriver, updateDriver } = useStore();
  const { can } = usePermission();

  const [q, setQ]           = useState("");
  const [statusF, setStatusF] = useState("all");
  const [open, setOpen]     = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [page, setPage]     = useState(1);

  const canManage = can("drivers", "manage");

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return drivers.filter(
      (d) =>
        (!lq || d.name.toLowerCase().includes(lq) || d.license.toLowerCase().includes(lq) || d.phone.includes(lq)) &&
        (statusF === "all" || d.status === statusF)
    );
  }, [drivers, q, statusF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", license: "", category: "LMV",
      expiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      phone: "+91 ", safetyScore: 85, status: "Available",
    },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({
      name: "", license: "", category: "LMV",
      expiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      phone: "+91 ", safetyScore: 85, status: "Available",
    });
    setOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    form.reset(d);
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateDriver(editing.id, values);
      toast.success(`${values.name} updated`);
    } else {
      addDriver(values);
      toast.success(`${values.name} added to drivers`);
    }
    setOpen(false);
    form.reset();
  };

  // Stats
  const stats = useMemo(() => ({
    total:     drivers.length,
    available: drivers.filter((d) => d.status === "Available").length,
    onTrip:    drivers.filter((d) => d.status === "On Trip").length,
    offDuty:   drivers.filter((d) => d.status === "Off Duty").length,
    suspended: drivers.filter((d) => d.status === "Suspended").length,
  }), [drivers]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Directory of active and off-duty drivers · {filtered.length} of {drivers.length}
          </p>
        </div>
        <PermissionGuard resource="drivers" required="manage">
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        </PermissionGuard>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total",     count: stats.total,     color: "text-foreground" },
          { label: "Available", count: stats.available, color: "text-success" },
          { label: "On Trip",   count: stats.onTrip,    color: "text-blue-400" },
          { label: "Off Duty",  count: stats.offDuty,   color: "text-warning" },
          { label: "Suspended", count: stats.suspended, color: "text-destructive" },
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, license, phone…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusF} onValueChange={(v) => { setStatusF(v); setPage(1); }}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {DRIVER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {paginated.length === 0 ? (
            <EmptyState
              text="No drivers match your filters."
              action={canManage ? <Button onClick={openAdd} size="sm"><Plus className="mr-1.5 h-4 w-4" />Add Driver</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Safety</TableHead>
                    <TableHead className="text-center">Trip %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((d) => {
                    const expired  = new Date(d.expiry) < new Date();
                    const tripPct  = tripStats(trips, d.id);
                    return (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">{d.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{d.license}</TableCell>
                        <TableCell>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold">
                            {d.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1.5 text-sm", expired && "text-destructive font-medium")}>
                            {expired && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                            {d.expiry}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{d.phone}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                            scoreColor(d.safetyScore), scoreBg(d.safetyScore)
                          )}>
                            <ShieldCheck className="h-3 w-3" />
                            {d.safetyScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "text-xs font-semibold",
                            tripPct >= 70 ? "text-success" : tripPct >= 40 ? "text-warning" : "text-muted-foreground"
                          )}>
                            {tripPct}%
                          </span>
                        </TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-right">
                          <PermissionGuard
                            resource="drivers"
                            required="manage"
                            fallback={<span className="text-[11px] text-muted-foreground italic">View</span>}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => openEdit(d)}
                            >
                              Edit
                            </Button>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = safePage <= 3 ? i + 1 : safePage - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <Button key={p} variant={p === safePage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit · ${editing.name}` : "Register New Driver"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
            <Field label="Full Name" className="col-span-2" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="License Number" error={form.formState.errors.license?.message}>
              <Input {...form.register("license")} />
            </Field>
            <Field label="Category">
              <Select defaultValue={form.getValues("category")} onValueChange={(v) => form.setValue("category", v as LicenseCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENSE_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="License Expiry" error={form.formState.errors.expiry?.message}>
              <Input type="date" {...form.register("expiry")} />
            </Field>
            <Field label="Phone (+91)" error={form.formState.errors.phone?.message}>
              <Input {...form.register("phone")} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Safety Score (0–100)">
              <Input type="number" {...form.register("safetyScore")} min={0} max={100} />
            </Field>
            <Field label="Status">
              <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as DriverStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DRIVER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter className="col-span-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save Changes" : "Add Driver"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, error, className }: {
  label: string; children: React.ReactNode; error?: string; className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
