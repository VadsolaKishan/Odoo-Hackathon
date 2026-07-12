import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Truck,
  ArrowRight,
  Search,
  RotateCcw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useStore } from "@/context/StoreContext";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import type { Trip } from "@/types";

export const Route = createFileRoute("/_app/trips")({
  head: () => ({ meta: [{ title: "Trips — TransitOps" }] }),
  component: TripsPage,
});

// ── Form schema ────────────────────────────────────────────
const tripSchema = z.object({
  source: z.string().trim().min(2, "Required").max(80),
  destination: z.string().trim().min(2, "Required").max(80),
  vehicleId: z.string().min(1, "Select a vehicle"),
  driverId: z.string().min(1, "Select a driver"),
  cargoWeight: z.coerce.number().min(1, "Must be > 0"),
  distance: z.coerce.number().min(1, "Must be > 0"),
});
type TripForm = z.infer<typeof tripSchema>;

// ── Lifecycle steps ────────────────────────────────────────
const STEPS = ["Draft", "Dispatched", "Completed", "Cancelled"] as const;
type TripStatus = (typeof STEPS)[number];

const stepMeta: Record<TripStatus, { color: string; bg: string; icon: typeof Circle }> = {
  Draft: { color: "text-muted-foreground", bg: "bg-muted", icon: Circle },
  Dispatched: { color: "text-blue-400", bg: "bg-blue-500/20", icon: Truck },
  Completed: { color: "text-success", bg: "bg-success/20", icon: CheckCircle2 },
  Cancelled: { color: "text-destructive", bg: "bg-destructive/20", icon: XCircle },
};

// ── Status filter chips ────────────────────────────────────
const STATUS_FILTERS = ["All", "Draft", "Dispatched", "Completed", "Cancelled"] as const;

function TripsPage() {
  const {
    vehicles,
    drivers,
    trips,
    createTrip,
    dispatchTrip,
    cancelTrip,
    completeTrip,
    distanceUnit,
  } = useStore();
  const { can } = usePermission();

  const [completing, setCompleting] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: "", fuelUsed: "", notes: "" });
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const isDispatcher = can("trips", "manage");

  // ── Available options for new trip form ─────────────────
  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const eligibleDrivers = drivers.map((d) => ({
    ...d,
    disabled: d.status !== "Available" || new Date(d.expiry) < new Date(),
  }));

  // ── React Hook Form ──────────────────────────────────────
  const form = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeight: 0,
      distance: 0,
    },
  });

  const watchedVehicleId = form.watch("vehicleId");
  const watchedCargo = Number(form.watch("cargoWeight") || 0);
  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);
  const overCapacity =
    selectedVehicle && watchedCargo > selectedVehicle.capacity
      ? watchedCargo - selectedVehicle.capacity
      : 0;

  // ── Lookup maps ──────────────────────────────────────────
  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);
  const driverById = useMemo(() => Object.fromEntries(drivers.map((d) => [d.id, d])), [drivers]);

  // ── Filtered trips for Live Board ────────────────────────
  const filtered = useMemo(() => {
    return trips.filter((t) => {
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        (vehicleById[t.vehicleId]?.registration ?? "").toLowerCase().includes(q) ||
        (driverById[t.driverId]?.name ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [trips, statusFilter, search, vehicleById, driverById]);

  // ── Current "active" step for lifecycle display ──────────
  const draftCount = trips.filter((t) => t.status === "Draft").length;
  const dispatchedCount = trips.filter((t) => t.status === "Dispatched").length;
  const completedCount = trips.filter((t) => t.status === "Completed").length;
  const cancelledCount = trips.filter((t) => t.status === "Cancelled").length;

  // ── Handlers ─────────────────────────────────────────────
  const onCreate = async (values: TripForm) => {
    const res = await createTrip(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Trip ${res.id} created as Draft`);
    form.reset();
  };

  const handleDispatch = async (id: string) => {
    setDispatchingId(id);
    const res = await dispatchTrip(id);
    setDispatchingId(null);
    if (!res.ok) toast.error(res.error);
    else toast.success("Trip dispatched successfully");
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const res = await cancelTrip(id);
    setCancellingId(null);
    if (!res.ok) toast.error(res.error);
    else toast.info("Trip cancelled");
  };

  const handleComplete = async () => {
    if (!completing) return;
    setIsSubmittingComplete(true);
    const res = await completeTrip(completing, {
      finalOdometer: Number(completeForm.finalOdometer),
      fuelUsed: Number(completeForm.fuelUsed),
      notes: completeForm.notes,
    });
    if (!res.ok) {
      toast.error(res.error || "Failed to complete trip");
      setIsSubmittingComplete(false);
      return;
    }
    toast.success("Trip marked as completed");
    setCompleting(null);
    setCompleteForm({ finalOdometer: "", fuelUsed: "", notes: "" });
    setIsSubmittingComplete(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Trip Dispatcher</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage trip lifecycle · Draft → Dispatch → Complete
        </p>
      </div>

      {/* Split layout */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* ── LEFT: Lifecycle + Create Form ──────────────── */}
        <div className="xl:col-span-5 space-y-4">
          {/* Trip Lifecycle Stepper */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Trip Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {STEPS.map((step, idx) => {
                  const meta = stepMeta[step];
                  const counts: Record<TripStatus, number> = {
                    Draft: draftCount,
                    Dispatched: dispatchedCount,
                    Completed: completedCount,
                    Cancelled: cancelledCount,
                  };
                  const count = counts[step];
                  const isActive = count > 0;

                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                            isActive
                              ? `${meta.bg} ${meta.color}`
                              : "bg-muted text-muted-foreground/40",
                          )}
                        >
                          {count}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            isActive ? meta.color : "text-muted-foreground/40",
                          )}
                        >
                          {step}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={cn("h-px flex-1 mx-1 mb-4", "bg-border")} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Create Trip Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Create Trip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PermissionGuard
                resource="trips"
                required="manage"
                fallback={
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Read-only access.</span>{" "}
                      Dispatch clearance required to schedule trips.
                    </p>
                  </div>
                }
              >
                <form onSubmit={form.handleSubmit(onCreate)} className="space-y-3">
                  {/* Source + Destination */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Source</Label>
                      <Input
                        className="mt-1"
                        placeholder="Gandhinagar Depot"
                        {...form.register("source")}
                      />
                      {form.formState.errors.source && (
                        <p className="mt-0.5 text-[11px] text-destructive">
                          {form.formState.errors.source.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Destination</Label>
                      <Input
                        className="mt-1"
                        placeholder="Ahmedabad Hub"
                        {...form.register("destination")}
                      />
                      {form.formState.errors.destination && (
                        <p className="mt-0.5 text-[11px] text-destructive">
                          {form.formState.errors.destination.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Vehicle (Available Only)
                    </Label>
                    <Select onValueChange={(v) => form.setValue("vehicleId", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select available vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            No available vehicles
                          </div>
                        ) : (
                          availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.registration} · {v.type} · {v.capacity.toLocaleString("en-IN")} kg
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.vehicleId && (
                      <p className="mt-0.5 text-[11px] text-destructive">
                        {form.formState.errors.vehicleId.message}
                      </p>
                    )}
                  </div>

                  {/* Driver */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Driver (Available Only)</Label>
                    <Select onValueChange={(v) => form.setValue("driverId", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleDrivers
                          .filter((d) => !d.disabled)
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} · {d.category}
                            </SelectItem>
                          ))}
                        {eligibleDrivers.filter((d) => !d.disabled).length === 0 && (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            No available drivers
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.driverId && (
                      <p className="mt-0.5 text-[11px] text-destructive">
                        {form.formState.errors.driverId.message}
                      </p>
                    )}
                  </div>

                  {/* Cargo + Distance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cargo Weight (kg)</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        placeholder="700"
                        {...form.register("cargoWeight")}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Distance ({distanceUnit})
                      </Label>
                      <Input
                        type="number"
                        className="mt-1"
                        placeholder="58"
                        {...form.register("distance")}
                      />
                    </div>
                  </div>

                  {/* Capacity Validation Banner */}
                  {selectedVehicle && (
                    <div
                      className={cn(
                        "rounded-lg border p-3 text-xs",
                        overCapacity > 0
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-success/30 bg-success/10 text-success",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {overCapacity > 0 ? (
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p>
                            Vehicle Capacity:{" "}
                            <strong>{selectedVehicle.capacity.toLocaleString("en-IN")} kg</strong>
                          </p>
                          <p>
                            Cargo Weight: <strong>{watchedCargo.toLocaleString("en-IN")} kg</strong>
                          </p>
                          {overCapacity > 0 ? (
                            <p className="mt-1 font-semibold">
                              ✕ Capacity exceeded by {overCapacity.toLocaleString("en-IN")} kg —
                              dispatch blocked
                            </p>
                          ) : (
                            <p className="mt-1 font-semibold">✓ Within capacity — good to go</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={overCapacity > 0}
                      isLoading={form.formState.isSubmitting}
                    >
                      Create &amp; Dispatch
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => form.reset()}
                      title="Reset form"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </PermissionGuard>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Live Board ───────────────────────────── */}
        <div className="xl:col-span-7 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Live Board
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filtered.length} trips
                </Badge>
              </div>

              {/* Search */}
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search trips, vehicles, routes…"
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status filter chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                      statusFilter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <EmptyState text="No trips match the current filters." />
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      vehicle={vehicleById[trip.vehicleId]}
                      driver={driverById[trip.driverId]}
                      canDispatch={isDispatcher}
                      distanceUnit={distanceUnit}
                      isDispatching={dispatchingId === trip.id}
                      isCancelling={cancellingId === trip.id}
                      onDispatch={() => handleDispatch(trip.id)}
                      onCancel={() => handleCancel(trip.id)}
                      onComplete={() => setCompleting(trip.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Complete Trip Dialog ──────────────────────────── */}
      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Trip — {completing}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            On complete: odometer updated → fuel log created → vehicle &amp; driver set Available
          </p>
          <div className="grid gap-3 pt-2">
            <div>
              <Label className="text-xs">Final Odometer ({distanceUnit})</Label>
              <Input
                type="number"
                className="mt-1"
                value={completeForm.finalOdometer}
                onChange={(e) => setCompleteForm((c) => ({ ...c, finalOdometer: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Fuel Used (litres)</Label>
              <Input
                type="number"
                className="mt-1"
                value={completeForm.fuelUsed}
                onChange={(e) => setCompleteForm((c) => ({ ...c, fuelUsed: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="Any observations for this trip…"
                value={completeForm.notes}
                onChange={(e) => setCompleteForm((c) => ({ ...c, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleting(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!completeForm.finalOdometer || !completeForm.fuelUsed}
              isLoading={isSubmittingComplete}
            >
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TripCard Sub-component ─────────────────────────────────
interface TripCardProps {
  trip: Trip;
  vehicle?: { registration: string; type: string } | undefined;
  driver?: { name: string } | undefined;
  canDispatch: boolean;
  distanceUnit: string;
  isDispatching: boolean;
  isCancelling: boolean;
  onDispatch: () => void;
  onCancel: () => void;
  onComplete: () => void;
}

function TripCard({
  trip,
  vehicle,
  driver,
  canDispatch,
  distanceUnit,
  isDispatching,
  isCancelling,
  onDispatch,
  onCancel,
  onComplete,
}: TripCardProps) {
  const etaDate = trip.eta ? new Date(trip.eta) : null;
  const now = new Date();
  const diffMin = etaDate ? Math.round((etaDate.getTime() - now.getTime()) / 60000) : 0;

  const etaLabel = (() => {
    if (trip.status === "Completed") return "Completed";
    if (trip.status === "Cancelled") return "Vehicle went to shop";
    if (!driver) return "Unassigned";
    if (!vehicle) return "Awaiting vehicle";
    if (trip.status === "Draft") return "Awaiting driver";
    if (diffMin <= 0) return "Arriving soon";
    if (diffMin < 60) return `${diffMin} min`;
    return etaDate
      ? etaDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : "";
  })();

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group",
      )}
    >
      {/* Left: trip info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold text-muted-foreground">{trip.id}</span>
          <StatusBadge status={trip.status} />
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground flex items-center gap-1.5">
          <span className="truncate">{trip.source}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{trip.destination}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {trip.cargoWeight.toLocaleString("en-IN")} kg · {trip.distance} {distanceUnit}
        </p>
      </div>

      {/* Right: vehicle/driver + ETA + actions */}
      <div className="shrink-0 text-right">
        <p className="text-xs font-mono text-muted-foreground">
          {vehicle?.registration ?? "—"} / {driver?.name ?? "—"}
        </p>
        <p
          className={cn(
            "text-xs mt-0.5 font-medium",
            trip.status === "Dispatched"
              ? "text-blue-400"
              : trip.status === "Completed"
                ? "text-success"
                : trip.status === "Cancelled"
                  ? "text-destructive"
                  : "text-muted-foreground",
          )}
        >
          {etaLabel}
        </p>

        {/* Action buttons — Dispatcher only */}
        {canDispatch && (
          <div className="flex gap-1.5 justify-end mt-2">
            {trip.status === "Draft" && (
              <>
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={onDispatch}
                  isLoading={isDispatching}
                  disabled={isDispatching || isCancelling}
                >
                  Dispatch
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2"
                  onClick={onCancel}
                  isLoading={isCancelling}
                  disabled={isDispatching || isCancelling}
                >
                  Cancel
                </Button>
              </>
            )}
            {trip.status === "Dispatched" && (
              <>
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={onComplete}
                  disabled={isDispatching || isCancelling}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2"
                  onClick={onCancel}
                  isLoading={isCancelling}
                  disabled={isDispatching || isCancelling}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
