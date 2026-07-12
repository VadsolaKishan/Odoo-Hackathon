import { createFileRoute } from "@tanstack/react-router";
import { Truck, Users, Route as RouteIcon, Wrench, Activity, CheckCircle2, Clock, Percent } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TransitOps" }] }),
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
      (statusFilter === "all" || v.status === statusFilter)
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
      <PageHeader title="Dashboard" description="Real-time overview of your fleet and operations." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active Vehicles" value={stats.active} icon={Truck} tint="primary" delta="of total fleet" />
        <KpiCard label="Available" value={stats.available} icon={CheckCircle2} tint="success" />
        <KpiCard label="In Maintenance" value={stats.inShop} icon={Wrench} tint="primary" />
        <KpiCard label="Active Trips" value={stats.activeTrips} icon={RouteIcon} tint="info" />
        <KpiCard label="Pending Trips" value={stats.pending} icon={Clock} tint="muted" />
        <KpiCard label="Drivers On Duty" value={stats.onDuty} icon={Users} tint="info" />
        <KpiCard label="Fleet Utilization" value={stats.util} suffix="%" icon={Percent} tint="success" />
        <KpiCard label="Total Trips" value={trips.length} icon={Activity} tint="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Trips</CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {["Truck", "Van", "Bus", "Car", "Trailer"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  {["Available", "On Trip", "In Shop", "Retired"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
                  {trips.filter((t) => {
                    const v = vehicleById[t.vehicleId];
                    if (!v) return false;
                    const matchType = typeFilter === "all" || v.type === typeFilter;
                    const matchStatus = statusFilter === "all" || v.status === statusFilter;
                    return matchType && matchStatus;
                  }).slice(0, 8).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>{vehicleById[t.vehicleId]?.registration ?? "—"}</TableCell>
                      <TableCell>{driverById[t.driverId]?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {t.source} → {t.destination}
                      </TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-xs">{new Date(t.eta).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing recent trips for {filteredVehicles.length} matching vehicles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vehicle Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
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

      <TransitMap activeTrips={trips.filter((t) => t.status === "Dispatched")} />
    </div>
  );
}

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  Delhi: { x: 260, y: 90 },
  Jaipur: { x: 210, y: 140 },
  Ahmedabad: { x: 150, y: 240 },
  Surat: { x: 155, y: 290 },
  Mumbai: { x: 160, y: 350 },
  Pune: { x: 185, y: 380 },
  Bangalore: { x: 260, y: 490 },
  Chennai: { x: 310, y: 490 },
  Hyderabad: { x: 280, y: 390 },
  Kolkata: { x: 470, y: 240 },
};

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  distance: number;
  status: "Draft" | "Dispatched" | "Completed" | "Cancelled";
  eta: string;
}

function TransitMap({ activeTrips }: { activeTrips: Trip[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Live Logistics Operations Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg border bg-card p-4 min-h-[400px] flex items-center justify-center">
          <svg className="w-full max-w-[600px] aspect-[4/3] stroke-slate-500/10 fill-none" viewBox="0 0 600 550">
            {/* Background Grid Lines */}
            <g className="stroke-slate-500/[0.04] stroke-[0.5]">
              {Array.from({ length: 12 }, (_, i) => (
                <line key={`x-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={550} />
              ))}
              {Array.from({ length: 11 }, (_, i) => (
                <line key={`y-${i}`} x1={0} y1={i * 50} x2={600} y2={i * 50} />
              ))}
            </g>

            {/* Static Connection Lines */}
            {Object.keys(CITY_COORDS).map((c1, i) =>
              Object.keys(CITY_COORDS).slice(i + 1).map((c2) => {
                const p1 = CITY_COORDS[c1];
                const p2 = CITY_COORDS[c2];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 220) {
                  return (
                    <line
                      key={`${c1}-${c2}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="1"
                    />
                  );
                }
                return null;
              })
            )}

            {/* Active En-Route Paths */}
            {activeTrips.map((trip) => {
              const p1 = CITY_COORDS[trip.source];
              const p2 = CITY_COORDS[trip.destination];
              if (!p1 || !p2) return null;
              return (
                <g key={trip.id}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    className="opacity-30 blur-[1px]"
                  />
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="var(--color-primary)"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <circle r="4" fill="var(--color-primary)">
                    <animateMotion
                      dur="15s"
                      repeatCount="indefinite"
                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    />
                  </circle>
                </g>
              );
            })}

            {/* City Nodes */}
            {Object.entries(CITY_COORDS).map(([name, pt]) => {
              const isActiveNode = activeTrips.some(
                (t) => t.source === name || t.destination === name
              );
              return (
                <g key={name} transform={`translate(${pt.x}, ${pt.y})`}>
                  {isActiveNode ? (
                    <>
                      <circle r="10" className="fill-primary/20 stroke-primary animate-ping" />
                      <circle r="5" className="fill-primary stroke-background stroke-2" />
                    </>
                  ) : (
                    <circle r="3.5" className="fill-muted-foreground/60 stroke-background stroke-2" />
                  )}
                  <text
                    y="-10"
                    textAnchor="middle"
                    className="text-[9px] font-semibold fill-foreground/80 stroke-background stroke-[2.5] paint-order-stroke pointer-events-none"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
