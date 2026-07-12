import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, IndianRupee, Fuel, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/context/StoreContext";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({ meta: [{ title: "Fuel & Expenses — TransitOps" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { vehicles, trips, fuelLogs, expenses, maintenance, addFuelLog, addExpense } = useStore();
  const [openFuel, setOpenFuel] = useState(false);
  const [openExp, setOpenExp] = useState(false);

  const fuelForm = useForm({
    defaultValues: { vehicleId: "", date: new Date().toISOString().slice(0, 10), liters: 50, pricePerLiter: 100 },
  });
  const expForm = useForm({
    defaultValues: { tripId: "", vehicleId: "", toll: 0, repair: 0, misc: 0, date: new Date().toISOString().slice(0, 10) },
  });

  const totals = useMemo(() => {
    const fuelCost = fuelLogs.reduce((s, f) => s + f.liters * f.pricePerLiter, 0);
    const maintCost = maintenance.reduce((s, m) => s + m.cost, 0);
    const otherCost = expenses.reduce((s, e) => s + e.toll + e.repair + e.misc, 0);
    return { fuelCost, maintCost, otherCost, total: fuelCost + maintCost + otherCost };
  }, [fuelLogs, maintenance, expenses]);

  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel & Expenses" description="Track fuel consumption and operational spend." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Fuel Cost" value={Math.round(totals.fuelCost)} suffix="₹" icon={Fuel} tint="primary" />
        <KpiCard label="Maintenance" value={Math.round(totals.maintCost)} suffix="₹" icon={Wrench} tint="info" />
        <KpiCard label="Other Expenses" value={Math.round(totals.otherCost)} suffix="₹" icon={IndianRupee} tint="muted" />
        <Card className="p-5 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Total Operational Cost</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">
            ₹ {Math.round(totals.total).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">across fuel, maintenance and other spend</p>
        </Card>
      </div>

      <Tabs defaultValue="fuel">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
            <TabsTrigger value="other">Other Expenses</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpenFuel(true)}><Plus className="mr-1.5 h-4 w-4" /> Fuel Log</Button>
            <Button size="sm" onClick={() => setOpenExp(true)}><Plus className="mr-1.5 h-4 w-4" /> Expense</Button>
          </div>
        </div>

        <TabsContent value="fuel" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vehicle</TableHead><TableHead>Date</TableHead>
                <TableHead className="text-right">Litres</TableHead><TableHead className="text-right">₹/L</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fuelLogs.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{vehicleById[f.vehicleId]?.registration}</TableCell>
                    <TableCell>{f.date}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.liters}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.pricePerLiter}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">₹ {(f.liters * f.pricePerLiter).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Trip</TableHead><TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Toll</TableHead>
                <TableHead className="text-right">Repair</TableHead>
                <TableHead className="text-right">Misc</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.tripId}</TableCell>
                    <TableCell className="font-mono text-xs">{vehicleById[e.vehicleId]?.registration}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.toll}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.repair}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.misc}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">₹ {(e.toll + e.repair + e.misc).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openFuel} onOpenChange={setOpenFuel}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Fuel Log</DialogTitle></DialogHeader>
          <form
            onSubmit={fuelForm.handleSubmit((v) => {
              if (!v.vehicleId) return toast.error("Select a vehicle");
              addFuelLog({ ...v, liters: Number(v.liters), pricePerLiter: Number(v.pricePerLiter) });
              toast.success("Fuel log added");
              setOpenFuel(false);
              fuelForm.reset();
            })}
            className="grid grid-cols-2 gap-4"
          >
            <F label="Vehicle" className="col-span-2">
              <Select onValueChange={(v) => fuelForm.setValue("vehicleId", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registration}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Date"><Input type="date" {...fuelForm.register("date")} /></F>
            <F label="Litres"><Input type="number" {...fuelForm.register("liters")} /></F>
            <F label="₹ per Litre" className="col-span-2"><Input type="number" {...fuelForm.register("pricePerLiter")} /></F>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpenFuel(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openExp} onOpenChange={setOpenExp}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
          <form
            onSubmit={expForm.handleSubmit((v) => {
              if (!v.vehicleId) return toast.error("Select a vehicle");
              addExpense({
                ...v, toll: Number(v.toll), repair: Number(v.repair), misc: Number(v.misc),
              });
              toast.success("Expense added");
              setOpenExp(false);
              expForm.reset();
            })}
            className="grid grid-cols-2 gap-4"
          >
            <F label="Trip">
              <Select onValueChange={(v) => expForm.setValue("tripId", v)}>
                <SelectTrigger><SelectValue placeholder="(optional)" /></SelectTrigger>
                <SelectContent>{trips.map((t) => <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Vehicle">
              <Select onValueChange={(v) => expForm.setValue("vehicleId", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registration}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Toll (₹)"><Input type="number" {...expForm.register("toll")} /></F>
            <F label="Repair (₹)"><Input type="number" {...expForm.register("repair")} /></F>
            <F label="Misc (₹)" className="col-span-2"><Input type="number" {...expForm.register("misc")} /></F>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpenExp(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
