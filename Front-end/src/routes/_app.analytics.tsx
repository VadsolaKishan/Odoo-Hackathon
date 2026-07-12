import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, TrendingUp, Percent, Fuel, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useStore } from "@/context/StoreContext";
import { usePermission } from "@/hooks/usePermission";
import * as mock from "@/data/mock";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — TransitOps" }] }),
  component: AnalyticsPage,
});

const CHART_COLORS = {
  primary:     "oklch(0.67 0.148 68)",
  success:     "oklch(0.67 0.17 155)",
  info:        "oklch(0.62 0.15 240)",
  destructive: "oklch(0.62 0.22 27)",
  warning:     "oklch(0.76 0.17 80)",
};

function AnalyticsPage() {
  const { vehicles, drivers, trips, fuelLogs, maintenance, expenses } = useStore();
  const { can, role } = usePermission();

  // ── Block if no access ────────────────────────────────────
  if (!can("analytics", "view")) {
    return (
      <PermissionGuard resource="analytics" required="view" blockPage>
        <></>
      </PermissionGuard>
    );
  }

  const canExport = can("analytics", "manage") || can("fleet", "manage");

  // ── KPIs ─────────────────────────────────────────────────
  const activeVehicles = vehicles.filter((v) => v.status !== "Retired").length;
  const available      = vehicles.filter((v) => v.status === "Available").length;
  const utilization    = activeVehicles > 0 ? Math.round(((activeVehicles - available) / activeVehicles) * 100) : 0;

  const totalLitres   = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.liters * f.pricePerLiter, 0);
  const totalDistance = 42000; // mock km
  const efficiency    = totalLitres ? Math.round((totalDistance / totalLitres) * 10) / 10 : 0;

  const maintCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const otherCost = expenses.reduce((s, e) => s + e.toll + e.repair + e.misc, 0);
  const opCost    = totalFuelCost + maintCost + otherCost;
  const revenue   = mock.monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const roi       = revenue > 0 ? Math.round(((revenue - opCost) / revenue) * 100) : 0;

  // ── Chart data ────────────────────────────────────────────
  const vehicleStatusData = ["Available", "On Trip", "In Shop", "Retired"].map((s) => ({
    name: s,
    value: vehicles.filter((v) => v.status === s).length,
  }));

  const tripStatusData = ["Draft", "Dispatched", "Completed", "Cancelled"].map((s) => ({
    name: s,
    value: trips.filter((t) => t.status === s).length,
  }));

  const PIE_STATUS_COLORS: Record<string, string> = {
    Available: CHART_COLORS.success,
    "On Trip": CHART_COLORS.info,
    "In Shop": CHART_COLORS.warning,
    Retired:   CHART_COLORS.destructive,
    Draft:     "oklch(0.52 0.02 260)",
    Dispatched: CHART_COLORS.info,
    Completed: CHART_COLORS.success,
    Cancelled: CHART_COLORS.destructive,
  };

  // ── CSV Export ────────────────────────────────────────────
  const exportCsv = () => {
    const rows = [
      ["ID", "Registration", "Type", "Capacity (kg)", "Odometer (km)", "Cost (₹)", "Status"],
      ...vehicles.map((v) => [
        v.id, v.registration, v.type, v.capacity, v.odometer, v.cost, v.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `fleet-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fleet performance · operational costs · ROI
          </p>
        </div>
        {canExport && (
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Fleet Utilization" value={utilization} suffix="%" icon={Percent} tint="primary" delta={`${available} available`} />
        <KpiCard label="Fuel Efficiency" value={efficiency} suffix=" km/L" icon={Fuel} tint="success" delta={`${totalLitres.toLocaleString("en-IN")} L total`} />
        <KpiCard label="Operational Cost" value={`₹${Math.round(opCost / 1000)}k`} icon={DollarSign} tint="info" delta="fuel + maint + other" />
        <KpiCard label="Revenue ROI" value={roi} suffix="%" icon={TrendingUp} tint={roi >= 40 ? "success" : "primary"} delta={`₹${Math.round(revenue / 1000)}k revenue`} />
      </div>

      {/* Revenue vs Cost Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Monthly Revenue vs Operational Cost (₹)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mock.monthlyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.destructive} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_COLORS.destructive} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.62 0.01 260)" }} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.62 0.01 260)" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.primary} fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="cost" name="Cost" stroke={CHART_COLORS.destructive} fill="url(#costGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two column charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Vehicle Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Vehicle Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vehicleStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {vehicleStatusData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trip Status Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Trip Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tripStatusData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.62 0.01 260)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "oklch(0.62 0.01 260)" }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    {tripStatusData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_STATUS_COLORS[entry.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
