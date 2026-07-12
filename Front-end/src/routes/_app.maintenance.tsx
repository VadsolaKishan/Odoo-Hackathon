import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStore } from "@/context/StoreContext";
import type { MaintenanceStatus } from "@/types";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — TransitOps" }] }),
  component: MaintenancePage,
});

const schema = z.object({
  vehicleId: z.string().min(1),
  serviceType: z.string().min(1),
  cost: z.coerce.number().min(0),
  date: z.string(),
  status: z.enum(["Scheduled", "In Progress", "Completed"]),
});
type F = z.infer<typeof schema>;

function MaintenancePage() {
  const { vehicles, maintenance, addMaintenance, updateMaintenance, currencySymbol } = useStore();
  const [open, setOpen] = useState(false);
  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: "", serviceType: "Oil Change", cost: 2500,
      date: new Date().toISOString().slice(0, 10), status: "Scheduled",
    },
  });

  const onSubmit = async (v: F) => {
    const res = await addMaintenance(v);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Maintenance record added");
    setOpen(false);
    form.reset();
  };

  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Track service history and vehicles currently in shop."
        actions={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Record</Button>}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cost ({currencySymbol})</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenance.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{vehicleById[m.vehicleId]?.registration ?? "—"}</TableCell>
                  <TableCell>{m.serviceType}</TableCell>
                  <TableCell>{m.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.cost.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell className="text-right">
                    {m.status !== "Completed" && (
                      <Button size="sm" variant="outline" onClick={async () => { const res = await updateMaintenance(m.id, { status: "Completed" }); if (res.ok) toast.success("Marked completed"); else toast.error(res.error); }}>
                        Mark Completed
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Maintenance Record</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <Field label="Vehicle" className="col-span-2">
              <Select onValueChange={(v) => form.setValue("vehicleId", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.filter((v) => v.status !== "Retired").map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration} · {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Service Type"><Input {...form.register("serviceType")} /></Field>
            <Field label={`Cost (${currencySymbol})`}><Input type="number" {...form.register("cost")} /></Field>
            <Field label="Date"><Input type="date" {...form.register("date")} /></Field>
            <Field label="Status">
              <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as MaintenanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Scheduled", "In Progress", "Completed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter className="col-span-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
