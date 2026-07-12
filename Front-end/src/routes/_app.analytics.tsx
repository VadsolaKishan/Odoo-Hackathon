import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, TrendingUp, Fuel, Percent, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useStore } from "@/context/StoreContext";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — TransitOps" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];

function AnalyticsPage() {
  const { vehicles, fuelLogs, maintenance, expenses, trips, currencySymbol, distanceUnit } = useStore();
  const active = vehicles.filter((v) => v.status !== "Retired").length;
  const util = active ? Math.round(((active - vehicles.filter((v) => v.status === "Available").length) / active) * 100) : 0;

  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalDistance = trips.filter(t => t.status === "Completed").reduce((s, t) => s + (t.distance || 0), 0);
  const efficiency = totalLiters ? Math.round((totalDistance / totalLiters) * 10) / 10 : 0;

  const opCost = fuelLogs.reduce((s, f) => s + f.liters * f.pricePerLiter, 0) + maintenance.reduce((s, m) => s + m.cost, 0);
  const totalRevenue = trips.reduce((s, t) => s + ((t.distance || 0) * 50), 0); // Simulated revenue at 50 per km
  const roi = opCost > 0 ? Math.round(((totalRevenue - opCost) / opCost) * 100) : 0;

  const statusData = ["Available", "On Trip", "In Shop", "Retired"].map((s, i) => ({
    name: s,
    value: vehicles.filter((v) => v.status === s).length,
    color: COLORS[i],
  }));

  const vehicleCostData = vehicles
    .slice(0, 8)
    .map((v) => ({ name: v.registration, cost: Math.round(v.cost / 1000) }));

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = months.map(m => ({ month: m, revenue: 0, cost: 0, litres: 0 }));

  fuelLogs.forEach(f => {
    const m = new Date(f.date).getMonth();
    if (monthlyData[m]) {
      monthlyData[m].cost += f.liters * f.pricePerLiter;
      monthlyData[m].litres += f.liters;
    }
  });
  maintenance.forEach(m => {
    const idx = new Date(m.date).getMonth();
    if (monthlyData[idx]) monthlyData[idx].cost += m.cost;
  });
  expenses.forEach(e => {
    const idx = new Date(e.date).getMonth();
    if (monthlyData[idx]) monthlyData[idx].cost += e.toll + e.repair + e.misc;
  });
  trips.forEach(t => {
    const idx = new Date(t.createdAt).getMonth();
    if (monthlyData[idx]) monthlyData[idx].revenue += (t.distance || 0) * 50; // Mock revenue logic
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Operational and financial insights across the fleet."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("CSV exported (mock)")}><Download className="mr-2 h-4 w-4" /> CSV</Button>
            <Button onClick={() => toast.success("PDF exported (mock)")}><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Fuel Efficiency" value={efficiency} suffix={`${distanceUnit}/L`} icon={Fuel} tint="primary" />
        <KpiCard label="Fleet Utilization" value={util} suffix="%" icon={Percent} tint="success" />
        <KpiCard label="Operational Cost" value={Math.round(opCost / 1000)} suffix={`k ${currencySymbol}`} icon={IndianRupee} tint="info" />
        <KpiCard label="Vehicle ROI" value={roi} suffix="%" icon={TrendingUp} tint="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue vs Cost</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vehicle Costs ({currencySymbol}k)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={vehicleCostData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                  <Tooltip />
                  <Bar dataKey="cost" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fleet Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fuel Usage (Litres / month)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="litres" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
