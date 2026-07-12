import { createFileRoute } from "@tanstack/react-router";
import {
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Activity,
  CheckCircle2,
  Clock,
  Percent,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FleetNova" }] }),
  component: Dashboard,
});

const COLORS: Record<string, string> = {
  Available: "hsl(155 60% 45%)",
  "On Trip": "hsl(240 70% 55%)",
  "In Shop": "#F59E0B",
  Retired: "hsl(0 70% 55%)",
};

function Dashboard() {
  const { vehicles, drivers, trips } = useStore();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredVehicles = vehicles.filter(
    (v) =>
      (typeFilter === "all" || v.type === typeFilter) &&
      (statusFilter === "all" || v.status === statusFilter),
  );

  const stats = useMemo(() => {
    const active = vehicles.filter((v) => v.status !== "Retired").length;
    const available = vehicles.filter((v) => v.status === "Available").length;
    const inShop = vehicles.filter((v) => v.status === "In Shop").length;
    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const pending = trips.filter((t) => t.status === "Draft").length;
    const onDuty = drivers.filter((d) => d.status === "On Trip").length;
    const util = active > 0 ? Math.round(((active - available) / active) * 100) : 0;
    return { active, available, inShop, activeTrips, pending, onDuty, util };
  }, [vehicles, drivers, trips]);

  const chartData = ["Available", "On Trip", "In Shop", "Retired"].map((s) => ({
    name: s,
    value: vehicles.filter((v) => v.status === s).length,
  }));

  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your fleet and operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Vehicles"
          value={stats.active}
          icon={Truck}
          tint="primary"
          delta="of total fleet"
        />
        <KpiCard label="Available" value={stats.available} icon={CheckCircle2} tint="success" />
        <KpiCard label="In Maintenance" value={stats.inShop} icon={Wrench} tint="primary" />
        <KpiCard label="Active Trips" value={stats.activeTrips} icon={RouteIcon} tint="info" />
        <KpiCard label="Pending Trips" value={stats.pending} icon={Clock} tint="muted" />
        <KpiCard label="Drivers On Duty" value={stats.onDuty} icon={Users} tint="info" />
        <KpiCard
          label="Fleet Utilization"
          value={stats.util}
          suffix="%"
          icon={Percent}
          tint="success"
        />
        <KpiCard label="Total Trips" value={trips.length} icon={Activity} tint="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Trips</CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 h-9">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9">
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
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.slice(0, 8).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>{vehicleById[t.vehicleId]?.registration ?? "—"}</TableCell>
                      <TableCell>{driverById[t.driverId]?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {t.source} → {t.destination}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-xs">{new Date(t.eta).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Filters applied to {filteredVehicles.length} vehicles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
