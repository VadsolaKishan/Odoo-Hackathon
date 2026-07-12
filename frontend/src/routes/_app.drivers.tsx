import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, AlertTriangle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/context/StoreContext";
import type { DriverStatus, LicenseCategory } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/drivers")({
  head: () => ({ meta: [{ title: "Drivers — FleetNova" }] }),
  component: DriversPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  license: z.string().trim().min(5).max(40),
  category: z.enum(["LMV", "HMV", "HTV", "PSV"]),
  expiry: z.string(),
  phone: z.string().trim().min(6).max(20),
  safetyScore: z.coerce.number().int().min(0).max(100),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]),
});
type FormValues = z.infer<typeof schema>;

function scoreColor(s: number) {
  if (s >= 90) return "text-success";
  if (s >= 70) return "text-warning";
  return "text-destructive";
}

function DriversPage() {
  const { drivers, addDriver } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      drivers.filter(
        (d) =>
          (!q ||
            d.name.toLowerCase().includes(q.toLowerCase()) ||
            d.license.toLowerCase().includes(q.toLowerCase())) &&
          (status === "all" || d.status === status),
      ),
    [drivers, q, status],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      license: "",
      category: "LMV",
      expiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      phone: "",
      safetyScore: 85,
      status: "Available",
    },
  });

  const onSubmit = (v: FormValues) => {
    addDriver(v);
    toast.success(`${v.name} added to drivers`);
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Directory of active and off-duty drivers."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or license…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {["Available", "On Trip", "Off Duty", "Suspended"].map((s) => (
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
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Safety</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const expired = new Date(d.expiry) < new Date();
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="font-mono text-xs">{d.license}</TableCell>
                      <TableCell>{d.category}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            expired && "text-destructive font-medium",
                          )}
                        >
                          {expired && <AlertTriangle className="h-3.5 w-3.5" />}
                          {d.expiry}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{d.phone}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          scoreColor(d.safetyScore),
                        )}
                      >
                        {d.safetyScore}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <Field label="Name" className="col-span-2">
              <Input {...form.register("name")} />
            </Field>
            <Field label="License Number">
              <Input {...form.register("license")} />
            </Field>
            <Field label="Category">
              <Select
                defaultValue={form.getValues("category")}
                onValueChange={(v) => form.setValue("category", v as LicenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LMV", "HMV", "HTV", "PSV"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Expiry">
              <Input type="date" {...form.register("expiry")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Safety Score">
              <Input type="number" {...form.register("safetyScore")} />
            </Field>
            <Field label="Status">
              <Select
                defaultValue={form.getValues("status")}
                onValueChange={(v) => form.setValue("status", v as DriverStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Available", "On Trip", "Off Duty", "Suspended"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter className="col-span-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Driver</Button>
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
