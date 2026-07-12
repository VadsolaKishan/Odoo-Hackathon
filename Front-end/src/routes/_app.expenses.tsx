import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Fuel, Wrench, IndianRupee, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useStore } from "@/context/StoreContext";
import { usePermission } from "@/hooks/usePermission";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({ meta: [{ title: "Fuel & Expenses — TransitOps" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { vehicles, trips, fuelLogs, expenses, maintenance, addFuelLog, addExpense, currencySymbol } = useStore();
  const { can } = usePermission();

  const [openFuel, setOpenFuel] = useState(false);
  const [openExp, setOpenExp]   = useState(false);

  const fuelForm = useForm({
    defaultValues: {
      vehicleId: "", date: new Date().toISOString().slice(0, 10),
      liters: 50, pricePerLiter: 100,
    },
  });
  const expForm = useForm({
    defaultValues: {
      tripId: "", vehicleId: "", toll: 0, repair: 0, misc: 0,
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const totals = useMemo(() => {
    const fuelCost  = fuelLogs.reduce((s, f) => s + f.liters * f.pricePerLiter, 0);
    const maintCost = maintenance.reduce((s, m) => s + m.cost, 0);
    const otherCost = expenses.reduce((s, e) => s + e.toll + e.repair + e.misc, 0);
    return { fuelCost, maintCost, otherCost, total: fuelCost + maintCost + otherCost };
  }, [fuelLogs, maintenance, expenses]);

  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );

  const submitFuel = async (v: { vehicleId: string; date: string; liters: number; pricePerLiter: number }) => {
    if (!v.vehicleId) { toast.error("Select a vehicle"); return; }
    const res = await addFuelLog({ ...v, liters: Number(v.liters), pricePerLiter: Number(v.pricePerLiter) });
    if (!res.ok) {
      toast.error(res.error || "Failed to add fuel log");
      return;
    }
    toast.success(`Fuel log added — ${currencySymbol}${(Number(v.liters) * Number(v.pricePerLiter)).toLocaleString("en-IN")}`);
    setOpenFuel(false);
    fuelForm.reset();
  };

  const submitExp = async (v: { tripId: string; vehicleId: string; toll: number; repair: number; misc: number; date: string }) => {
    if (!v.vehicleId) { toast.error("Select a vehicle"); return; }
    const res = await addExpense({ ...v, toll: Number(v.toll), repair: Number(v.repair), misc: Number(v.misc) });
    if (!res.ok) {
      toast.error(res.error || "Failed to add expense entry");
      return;
    }
    toast.success("Expense entry added");
    setOpenExp(false);
    expForm.reset();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Fuel &amp; Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track fuel consumption and operational spend
          </p>
        </div>
        <PermissionGuard resource="fuel" required="manage">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenFuel(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Fuel Log
            </Button>
            <Button size="sm" onClick={() => setOpenExp(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Expense
            </Button>
          </div>
        </PermissionGuard>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Fuel Cost"
          value={Math.round(totals.fuelCost / 1000)}
          prefix={currencySymbol}
          suffix="k"
          icon={Fuel}
          tint="primary"
          delta={`${fuelLogs.length} log entries`}
        />
        <KpiCard
          label="Maintenance"
          value={Math.round(totals.maintCost / 1000)}
          prefix={currencySymbol}
          suffix="k"
          icon={Wrench}
          tint="info"
          delta={`${maintenance.length} records`}
        />
        <KpiCard
          label="Other Expenses"
          value={Math.round(totals.otherCost / 1000)}
          prefix={currencySymbol}
          suffix="k"
          icon={IndianRupee}
          tint="muted"
          delta="toll + repair + misc"
        />
        <Card className="p-5 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-widest">Total Op. Cost</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {currencySymbol}{Math.round(totals.total).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">fuel + maintenance + other</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fuel">
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="fuel">Fuel Logs ({fuelLogs.length})</TabsTrigger>
            <TabsTrigger value="other">Other Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
          <PermissionGuard resource="fuel" required="edit">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpenFuel(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Fuel Log
              </Button>
              <Button size="sm" onClick={() => setOpenExp(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Expense
              </Button>
            </div>
          </PermissionGuard>
        </div>

        {/* Fuel Logs Tab */}
        <TabsContent value="fuel" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {fuelLogs.length === 0 ? (
                <EmptyState text="No fuel logs yet." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Litres</TableHead>
                        <TableHead className="text-right">Rate ({currencySymbol}/L)</TableHead>
                        <TableHead className="text-right">Total ({currencySymbol})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelLogs.map((f) => (
                        <TableRow key={f.id} className="hover:bg-muted/30">
                          <TableCell>
                            <p className="font-mono text-sm font-semibold">{vehicleById[f.vehicleId]?.registration ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{vehicleById[f.vehicleId]?.type}</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {f.date ? new Date(f.date).toLocaleDateString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{f.liters.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{currencySymbol}{f.pricePerLiter}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-primary">
                            {currencySymbol}{(f.liters * f.pricePerLiter).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Expenses Tab */}
        <TabsContent value="other" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <EmptyState text="No expense entries yet." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Trip</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Toll ({currencySymbol})</TableHead>
                        <TableHead className="text-right">Repair ({currencySymbol})</TableHead>
                        <TableHead className="text-right">Misc ({currencySymbol})</TableHead>
                        <TableHead className="text-right">Total ({currencySymbol})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-sm font-semibold">{vehicleById[e.vehicleId]?.registration ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">{e.tripId ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {e.date ? new Date(e.date).toLocaleDateString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{e.toll.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right tabular-nums">{e.repair.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right tabular-nums">{e.misc.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-primary">
                            {currencySymbol}{(e.toll + e.repair + e.misc).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fuel Log Dialog */}
      <Dialog open={openFuel} onOpenChange={setOpenFuel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fuel Log</DialogTitle></DialogHeader>
          <form onSubmit={fuelForm.handleSubmit(submitFuel as any)} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Vehicle</Label>
              <Select onValueChange={(v) => fuelForm.setValue("vehicleId", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.filter((v) => v.status !== "Retired").map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration} · {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" className="mt-1" {...fuelForm.register("date")} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Litres</Label>
              <Input type="number" className="mt-1" {...fuelForm.register("liters")} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Price per Litre ({currencySymbol})</Label>
              <Input type="number" className="mt-1" {...fuelForm.register("pricePerLiter")} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpenFuel(false)}>Cancel</Button>
              <Button type="submit" isLoading={fuelForm.formState.isSubmitting}>Add Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={openExp} onOpenChange={setOpenExp}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense Entry</DialogTitle></DialogHeader>
          <form onSubmit={expForm.handleSubmit(submitExp as any)} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Vehicle</Label>
              <Select onValueChange={(v) => expForm.setValue("vehicleId", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration} · {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Trip (optional)</Label>
              <Select onValueChange={(v) => expForm.setValue("tripId", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Link to trip (optional)" /></SelectTrigger>
                <SelectContent>
                  {trips.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.id} · {t.source} → {t.destination}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Toll ({currencySymbol})</Label>
              <Input type="number" className="mt-1" {...expForm.register("toll")} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Repair ({currencySymbol})</Label>
              <Input type="number" className="mt-1" {...expForm.register("repair")} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Misc ({currencySymbol})</Label>
              <Input type="number" className="mt-1" {...expForm.register("misc")} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" className="mt-1" {...expForm.register("date")} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpenExp(false)}>Cancel</Button>
              <Button type="submit" isLoading={expForm.formState.isSubmitting}>Add Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
