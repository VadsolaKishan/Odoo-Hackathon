import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — FleetNova" }] }),
  component: SettingsPage,
});

type Perm = "Manage" | "Edit" | "View" | "Read Only" | "—";

const modules = ["Fleet", "Drivers", "Trips", "Fuel", "Analytics"] as const;
const roles = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] as const;

const rbac: Record<(typeof modules)[number], Record<(typeof roles)[number], Perm>> = {
  Fleet: {
    "Fleet Manager": "Manage",
    Dispatcher: "View",
    "Safety Officer": "View",
    "Financial Analyst": "Read Only",
  },
  Drivers: {
    "Fleet Manager": "Manage",
    Dispatcher: "Edit",
    "Safety Officer": "Manage",
    "Financial Analyst": "Read Only",
  },
  Trips: {
    "Fleet Manager": "View",
    Dispatcher: "Manage",
    "Safety Officer": "View",
    "Financial Analyst": "Read Only",
  },
  Fuel: {
    "Fleet Manager": "Edit",
    Dispatcher: "Edit",
    "Safety Officer": "Read Only",
    "Financial Analyst": "Manage",
  },
  Analytics: {
    "Fleet Manager": "View",
    Dispatcher: "View",
    "Safety Officer": "View",
    "Financial Analyst": "Manage",
  },
};

const permStyle: Record<Perm, string> = {
  Manage: "bg-primary/15 text-primary border-primary/30",
  Edit: "bg-info/15 text-info border-info/30",
  View: "bg-success/15 text-success border-success/30",
  "Read Only": "bg-muted text-muted-foreground border-border",
  "—": "bg-muted text-muted-foreground border-border",
};

function SettingsPage() {
  const [dept, setDept] = useState("Northern Logistics Dept");
  const [currency, setCurrency] = useState("INR");
  const [unit, setUnit] = useState("km");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="General preferences and role-based access controls."
      />

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Department Name</Label>
            <Input className="mt-1.5" value={dept} onChange={(e) => setDept(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Distance Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">Kilometres</SelectItem>
                <SelectItem value="mi">Miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button onClick={() => toast.success("Settings saved")}>
              <Check className="mr-2 h-4 w-4" /> Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Access Control</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                {roles.map((r) => (
                  <TableHead key={r} className="text-center">
                    {r}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((m) => (
                <TableRow key={m}>
                  <TableCell className="font-medium">{m}</TableCell>
                  {roles.map((r) => {
                    const p = rbac[m][r];
                    return (
                      <TableCell key={r} className="text-center">
                        <Badge variant="outline" className={cn("font-medium", permStyle[p])}>
                          {p === "Read Only" || p === "—" ? p : <>✔ {p}</>}
                        </Badge>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
