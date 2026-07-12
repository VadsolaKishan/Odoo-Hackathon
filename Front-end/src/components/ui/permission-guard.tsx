import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, canAccess } from "@/lib/permissions";
import type { Resource, Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  resource: Resource;
  /** Minimum permission required. Defaults to "view". */
  required?: Permission;
  /** If true, blocks the entire page with an access-denied UI. */
  blockPage?: boolean;
  /** Fallback rendered when the guard fails (default: nothing). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * PermissionGuard
 *
 * Renders `children` only when the authenticated user has the required
 * permission on `resource`. Otherwise renders `fallback` (default: null).
 *
 * When `blockPage` is true, renders a full-height access-denied card
 * instead of the children — useful for protecting entire page routes.
 *
 * Usage:
 * ```tsx
 * // Hide a button
 * <PermissionGuard resource="fleet" required="manage">
 *   <Button>Add Vehicle</Button>
 * </PermissionGuard>
 *
 * // Block entire page
 * <PermissionGuard resource="settings" required="manage" blockPage>
 *   <SettingsContent />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  resource,
  required = "view",
  blockPage = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { user } = useAuth();
  const role = user?.role;

  const allowed =
    required === null
      ? canAccess(role, resource)
      : hasPermission(role, resource, required);

  if (allowed) return <>{children}</>;

  if (blockPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Your role <span className="font-medium text-foreground">({role})</span> does not
            have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
}
