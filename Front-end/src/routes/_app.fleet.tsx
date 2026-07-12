import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useStore } from "@/context/StoreContext";
import { usePermission } from "@/hooks/usePermission";
import type { Vehicle, VehicleStatus, VehicleType } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/fleet")({
  head: () => ({ meta: [{ title: "Fleet — TransitOps" }] }),
  component: FleetPage,
});

// ── Form schema ────────────────────────────────────────────
const schema = z.object({
  registration: z.string().trim().min(4, "Min 4 characters").max(20),
  name:         z.string().trim().min(1, "Required").max(80),
  model:        z.string().trim().min(1, "Required").max(80),
  type:         z.enum(["Truck", "Van", "Bus", "Car", "Trailer"]),
  capacity:     z.coerce.number().int().min(1, "Must be > 0"),
  odometer:     z.coerce.number().int().min(0),
  cost:         z.coerce.number().min(0),
  status:       z.enum(["Available", "On Trip", "In Shop", "Retired"]),
});
type FormValues = z.infer<typeof schema>;

const VEHICLE_TYPES  = ["Truck", "Van", "Bus", "Car", "Trailer"] as const;
const VEHICLE_STATUS = ["Available", "On Trip", "In Shop", "Retired"] as const;
const PAGE_SIZE = 10;

const typeColors: Record<string, string> = {
  Truck:   "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Van:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Bus:     "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Car:     "bg-green-500/15 text-green-400 border-green-500/30",
  Trailer: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

function FleetPage() {
  const { vehicles, addVehicle, updateVehicle } = useStore();
  const { can } = usePermission();

  const [q, setQ]           = useState("");
  const [typeF, setTypeF]   = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [open, setOpen]     = useState(false);
  const [page, setPage]     = useState(1);

  const canManage = can("fleet", "manage");

  // ── Filtering ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return vehicles.filter(
      (v) =>
        (!lq || v.registration.toLowerCase().includes(lq) || v.name.toLowerCase().includes(lq) || v.model.toLowerCase().includes(lq)) &&
        (typeF === "all" || v.type === typeF) &&
        (statusF === "all" || v.status === statusF)
    );
  }, [vehicles, q, typeF, statusF]);

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Form ─────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      registration: "", name: "", model: "", type: "Truck",
      capacity: 5000, odometer: 0, cost: 0, status: "Available",
    },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({ registration: "", name: "", model: "", type: "Truck", capacity: 5000, odometer: 0, cost: 0, status: "Available" });
    setOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    form.reset(v);
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateVehicle(editing.id, { ...values, registration: values.registration.toUpperCase() });
      toast.success(`${values.registration.toUpperCase()} updated`);
    } else {
      const res = addVehicle({ ...values, registration: values.registration.toUpperCase() });
      if (!res.ok) { form.setError("registration", { message: res.error }); return; }
      toast.success(`${values.registration.toUpperCase()} added to fleet`);
    }
    setOpen(false);
  };

  const isRetired = editing?.status === "Retired";

  // ── Stats row ────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     vehicles.length,
    available: vehicles.filter((v) => v.status === "Available").length,
    onTrip:    vehicles.filter((v) => v.status === "On Trip").length,
    inShop:    vehicles.filter((v) => v.status === "In Shop").length,
    retired:   vehicles.filter((v) => v.status === "Retired").length,
  }), [vehicles]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Fleet Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all vehicles · {filtered.length} of {vehicles.length} vehicles
          </p>
        </div>
        <PermissionGuard resource="fleet" required="manage">
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        </PermissionGuard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", count: stats.total, color: "text-foreground" },
          { label: "Available", count: stats.available, color: "text-success" },
          { label: "On Trip", count: stats.onTrip, color: "text-blue-400" },
          { label: "In Shop", count: stats.inShop, color: "text-warning" },
          { label: "Retired", count: stats.retired, color: "text-muted-foreground" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold mt-1", color)}>{count}</p>
          </Card>
        ))}
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search registration, name, model…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={typeF} onValueChange={(v) => { setTypeF(v); setPage(1); }}>
              <SelectTrigger className="sm:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusF} onValueChange={(v) => { setStatusF(v); setPage(1); }}>
              <SelectTrigger className="sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {VEHICLE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {paginated.length === 0 ? (
            <EmptyState
              text="No vehicles match your filters."
              action={canManage ? <Button onClick={openAdd} size="sm"><Plus className="mr-1.5 h-4 w-4" />Add Vehicle</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Registration</TableHead>
                    <TableHead>Name / Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead className="text-right">Odometer</TableHead>
                    <TableHead className="text-right">Cost (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-semibold text-sm">{v.registration}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.model}</p>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          typeColors[v.type] ?? "bg-muted text-muted-foreground"
                        )}>
                          {v.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {v.capacity.toLocaleString("en-IN")} kg
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {v.odometer.toLocaleString("en-IN")} km
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        ₹{v.cost.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                      <TableCell className="text-right">
                        <PermissionGuard
                          resource="fleet"
                          required="manage"
                          fallback={<span className="text-[11px] text-muted-foreground italic">View only</span>}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(v)}
                            title="Edit vehicle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = safePage <= 3 ? i + 1 : safePage - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <Button
                      key={p}
                      variant={p === safePage ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
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
            <DialogTitle>{editing ? `Edit · ${editing.registration}` : "Register New Vehicle"}</DialogTitle>
          </DialogHeader>
          {isRetired && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              ⚠ This vehicle is <strong>Retired</strong>. Only status can be changed.
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
            <Field label="Registration" error={form.formState.errors.registration?.message}>
              <Input {...form.register("registration")} disabled={isRetired} className="uppercase" />
            </Field>
            <Field label="Vehicle Name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} disabled={isRetired} />
            </Field>
            <Field label="Model" className="col-span-2">
              <Input {...form.register("model")} disabled={isRetired} />
            </Field>
            <Field label="Type">
              <Select
                disabled={isRetired}
                defaultValue={form.getValues("type")}
                onValueChange={(v) => form.setValue("type", v as VehicleType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                defaultValue={form.getValues("status")}
                onValueChange={(v) => form.setValue("status", v as VehicleStatus)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Capacity (kg)">
              <Input type="number" {...form.register("capacity")} disabled={isRetired} />
            </Field>
            <Field label="Odometer (km)">
              <Input type="number" {...form.register("odometer")} disabled={isRetired} />
            </Field>
            <Field label="Purchase Cost (₹)" className="col-span-2">
              <Input type="number" {...form.register("cost")} disabled={isRetired} />
            </Field>
            <DialogFooter className="col-span-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save Changes" : "Add to Fleet"}</Button>
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
