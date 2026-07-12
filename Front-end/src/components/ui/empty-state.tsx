import { type ReactNode } from "react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  text?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * EmptyState — displayed when a list or table has no data.
 *
 * Usage:
 * ```tsx
 * <EmptyState text="No vehicles found." action={<Button>Add Vehicle</Button>} />
 * ```
 */
export function EmptyState({ title, text, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <PackageOpen className="h-6 w-6" />}
      </div>
      {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
      {text && <p className="text-sm text-muted-foreground max-w-xs">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
