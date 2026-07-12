import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Available: "bg-success/15 text-success border-success/30",
  "On Trip": "bg-info/15 text-info border-info/30",
  "In Shop": "bg-primary/15 text-primary border-primary/30",
  Retired: "bg-destructive/15 text-destructive border-destructive/30",
  "Off Duty": "bg-muted text-muted-foreground border-border",
  Suspended: "bg-destructive/15 text-destructive border-destructive/30",
  Draft: "bg-muted text-muted-foreground border-border",
  Dispatched: "bg-info/15 text-info border-info/30",
  Completed: "bg-success/15 text-success border-success/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  Scheduled: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        map[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
