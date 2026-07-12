import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, TrendingUp, Fuel, Percent, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/context/StoreContext";
import { monthlyRevenue } from "@/data/mock";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — FleetNova" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];

function AnalyticsPage() {
  const { vehicles, fuelLogs, maintenance } = useStore();
  const active = vehicles.filter((v) => v.status !== "Retired").length;
  const util = active
    ? Math.round(
        ((active - vehicles.filter((v) => v.status === "Available").length) / active) * 100,
      )
    : 0;

  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalDistance = 42000; // mock
  const efficiency = totalLiters ? Math.round((totalDistance / totalLiters) * 10) / 10 : 0;

  const opCost =
    fuelLogs.reduce((s, f) => s + f.liters * f.pricePerLiter, 0) +
    maintenance.reduce((s, m) => s + m.cost, 0);
  const roi = 156;

  const statusData = ["Available", "On Trip", "In Shop", "Retired"].map((s, i) => ({
    name: s,
    value: vehicles.filter((v) => v.status === s).length,
    color: COLORS[i],
  }));

  const vehicleCostData = vehicles
    .slice(0, 8)
    .map((v) => ({ name: v.registration, cost: Math.round(v.cost / 1000) }));

  const fuelData = monthlyRevenue.map((m, i) => ({
    month: m.month,
    litres: 2000 + Math.round(Math.sin(i) * 400) + i * 60,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Operational and financial insights across the fleet."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("CSV exported (mock)")}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button onClick={() => toast.success("PDF exported (mock)")}>
              <FileDown className="mr-2 h-4 w-4" /> PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Fuel Efficiency"
          value={efficiency}
          suffix="km/L"
          icon={Fuel}
          tint="primary"
        />
        <KpiCard label="Fleet Utilization" value={util} suffix="%" icon={Percent} tint="success" />
        <KpiCard
          label="Operational Cost"
          value={Math.round(opCost / 1000)}
          suffix="k ₹"
          icon={IndianRupee}
          tint="info"
        />
        <KpiCard label="Vehicle ROI" value={roi} suffix="%" icon={TrendingUp} tint="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue vs Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={monthlyRevenue}>
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
          <CardHeader>
            <CardTitle>Vehicle Costs (₹k)</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Usage (Litres / month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={fuelData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="litres"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
