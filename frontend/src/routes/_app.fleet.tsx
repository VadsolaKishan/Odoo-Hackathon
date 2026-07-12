import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/context/StoreContext";
import type { Vehicle, VehicleStatus, VehicleType } from "@/types";

export const Route = createFileRoute("/_app/fleet")({
  head: () => ({ meta: [{ title: "Fleet — FleetNova" }] }),
  component: FleetPage,
});

const schema = z.object({
  registration: z.string().trim().min(4, "Required").max(20).toUpperCase(),
  name: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  type: z.enum(["Truck", "Van", "Bus", "Car", "Trailer"]),
  capacity: z.coerce.number().int().min(1),
  odometer: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]),
});
type FormValues = z.infer<typeof schema>;

function FleetPage() {
  const { vehicles, addVehicle, updateVehicle } = useStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (!q ||
            v.registration.toLowerCase().includes(q.toLowerCase()) ||
            v.name.toLowerCase().includes(q.toLowerCase())) &&
          (type === "all" || v.type === type) &&
          (status === "all" || v.status === status),
      ),
    [vehicles, q, type, status],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      registration: "",
      name: "",
      model: "",
      type: "Truck",
      capacity: 1000,
      odometer: 0,
      cost: 0,
      status: "Available",
    },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({
      registration: "",
      name: "",
      model: "",
      type: "Truck",
      capacity: 1000,
      odometer: 0,
      cost: 0,
      status: "Available",
    });
    setOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    form.reset(v);
    setOpen(true);
  };

  const onSubmit = (v: FormValues) => {
    if (editing) {
      updateVehicle(editing.id, v);
      toast.success(`Vehicle ${v.registration} updated`);
    } else {
      const res = addVehicle(v);
      if (!res.ok) {
        form.setError("registration", { message: res.error });
        return;
      }
      toast.success(`Vehicle ${v.registration} added`);
    }
    setOpen(false);
  };

  const retired = editing?.status === "Retired";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Registry"
        description="Manage all vehicles across your operation."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by registration or name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["Truck", "Van", "Bus", "Car", "Trailer"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {["Available", "On Trip", "In Shop", "Retired"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead className="text-right">Cost (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">{v.registration}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.type}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.capacity.toLocaleString()} kg
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.odometer.toLocaleString()} km
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.cost.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No vehicles match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.registration}` : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          {retired && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              This vehicle is retired. Only the status can be changed.
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <Field label="Registration" error={form.formState.errors.registration?.message}>
              <Input {...form.register("registration")} disabled={retired} />
            </Field>
            <Field label="Vehicle Name">
              <Input {...form.register("name")} disabled={retired} />
            </Field>
            <Field label="Model" className="col-span-2">
              <Input {...form.register("model")} disabled={retired} />
            </Field>
            <Field label="Type">
              <Select
                disabled={retired}
                defaultValue={form.getValues("type")}
                onValueChange={(v) => form.setValue("type", v as VehicleType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Truck", "Van", "Bus", "Car", "Trailer"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                defaultValue={form.getValues("status")}
                onValueChange={(v) => form.setValue("status", v as VehicleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Available", "On Trip", "In Shop", "Retired"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Capacity (kg)">
              <Input type="number" {...form.register("capacity")} disabled={retired} />
            </Field>
            <Field label="Odometer (km)">
              <Input type="number" {...form.register("odometer")} disabled={retired} />
            </Field>
            <Field label="Purchase Cost (₹)" className="col-span-2">
              <Input type="number" {...form.register("cost")} disabled={retired} />
            </Field>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Add Vehicle"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
