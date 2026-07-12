import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/trips")({
  head: () => ({ meta: [{ title: "Trips — FleetNova" }] }),
  component: TripsPage,
});

const tripSchema = z.object({
  source: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
  vehicleId: z.string().min(1, "Select a vehicle"),
  driverId: z.string().min(1, "Select a driver"),
  cargoWeight: z.coerce.number().min(1),
  distance: z.coerce.number().min(1),
});
type TripForm = z.infer<typeof tripSchema>;

function TripsPage() {
  const { vehicles, drivers, trips, createTrip, dispatchTrip, cancelTrip, completeTrip } =
    useStore();
  const [openCreate, setOpenCreate] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [complete, setComplete] = useState({ finalOdometer: "", fuelUsed: "", notes: "" });

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const eligibleDrivers = drivers.map((d) => ({
    ...d,
    disabled: d.status === "Suspended" || new Date(d.expiry) < new Date(),
  }));

  const form = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeight: 100,
      distance: 100,
    },
  });

  const vehicleId = form.watch("vehicleId");
  const cargoWeight = Number(form.watch("cargoWeight") || 0);
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const overCapacity =
    selectedVehicle && cargoWeight > selectedVehicle.capacity
      ? cargoWeight - selectedVehicle.capacity
      : 0;

  const onCreate = (v: TripForm) => {
    const res = createTrip(v);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Trip ${res.id} created as Draft`);
    setOpenCreate(false);
    form.reset();
  };

  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));

  const drafts = trips.filter((t) => t.status === "Draft");
  const running = trips.filter((t) => t.status === "Dispatched");
  const finished = trips.filter((t) => t.status === "Completed" || t.status === "Cancelled");

  const handleDispatch = (id: string) => {
    const res = dispatchTrip(id);
    if (!res.ok) toast.error(res.error);
    else toast.success("Trip dispatched");
  };

  const handleComplete = () => {
    if (!completing) return;
    completeTrip(completing, {
      finalOdometer: Number(complete.finalOdometer),
      fuelUsed: Number(complete.fuelUsed),
      notes: complete.notes,
    });
    toast.success("Trip completed");
    setCompleting(null);
    setComplete({ finalOdometer: "", fuelUsed: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Dispatcher"
        description="Create trips, run live board, and close out completed runs."
        actions={
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Trip
          </Button>
        }
      />

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live Board ({running.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="history">History ({finished.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          {running.length === 0 ? (
            <EmptyState text="No trips currently on the road." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {running.map((t) => (
                <Card key={t.id} className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-mono">{t.id}</CardTitle>
                    <StatusBadge status={t.status} />
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">
                      {t.source} → {t.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vehicle:{" "}
                      <span className="font-mono">{vehicleById[t.vehicleId]?.registration}</span>
                      {" · "}Driver: {driverById[t.driverId]?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cargo: {t.cargoWeight}kg · Distance: {t.distance}km
                    </p>
                    <p className="text-xs">ETA: {new Date(t.eta).toLocaleString()}</p>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => setCompleting(t.id)}>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          cancelTrip(t.id);
                          toast("Trip cancelled");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Cargo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>
                        {t.source} → {t.destination}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {vehicleById[t.vehicleId]?.registration}
                      </TableCell>
                      <TableCell>{driverById[t.driverId]?.name}</TableCell>
                      <TableCell className="text-right">{t.cargoWeight}kg</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleDispatch(t.id)}>
                          Dispatch
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelTrip(t.id)}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {drafts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No draft trips.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finished.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>
                        {t.source} → {t.destination}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {vehicleById[t.vehicleId]?.registration}
                      </TableCell>
                      <TableCell>{driverById[t.driverId]?.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Trip */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Trip</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreate)} className="grid grid-cols-2 gap-4">
            <Field label="Source">
              <Input {...form.register("source")} />
            </Field>
            <Field label="Destination">
              <Input {...form.register("destination")} />
            </Field>
            <Field label="Vehicle" className="col-span-2">
              <Select onValueChange={(v) => form.setValue("vehicleId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an available vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.length === 0 && (
                    <div className="p-3 text-xs text-muted-foreground">No available vehicles</div>
                  )}
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} · {v.type} · {v.capacity}kg
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Driver" className="col-span-2">
              <Select onValueChange={(v) => form.setValue("driverId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleDrivers
                    .filter((d) => d.status === "Available" || d.disabled)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id} disabled={d.disabled}>
                        {d.name} · {d.category}
                        {d.disabled && " · (unavailable)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cargo Weight (kg)">
              <Input type="number" {...form.register("cargoWeight")} />
            </Field>
            <Field label="Distance (km)">
              <Input type="number" {...form.register("distance")} />
            </Field>

            {selectedVehicle && (
              <div
                className={cn(
                  "col-span-2 rounded-lg border p-3 text-xs",
                  overCapacity > 0
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-success/40 bg-success/10 text-success",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {overCapacity > 0 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Vehicle capacity: {selectedVehicle.capacity}kg · Cargo: {cargoWeight}kg
                </div>
                <p className="mt-1">
                  {overCapacity > 0
                    ? `Capacity exceeded by ${overCapacity}kg — dispatch disabled.`
                    : "Within capacity — good to go."}
                </p>
              </div>
            )}
            <DialogFooter className="col-span-2">
              <Button variant="outline" type="button" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={overCapacity > 0}>
                Create Trip
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete trip */}
      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Final Odometer (km)">
              <Input
                type="number"
                value={complete.finalOdometer}
                onChange={(e) => setComplete((c) => ({ ...c, finalOdometer: e.target.value }))}
              />
            </Field>
            <Field label="Fuel Used (litres)">
              <Input
                type="number"
                value={complete.fuelUsed}
                onChange={(e) => setComplete((c) => ({ ...c, fuelUsed: e.target.value }))}
              />
            </Field>
            <Field label="Notes">
              <Textarea
                value={complete.notes}
                onChange={(e) => setComplete((c) => ({ ...c, notes: e.target.value }))}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleting(null)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>Mark Completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
