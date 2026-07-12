import { useAuth } from "@/context/AuthContext";
import { hasPermission, canAccess, getPermission } from "@/lib/permissions";
import type { Resource, Permission } from "@/lib/permissions";

/**
 * usePermission
 *
 * Returns permission helpers scoped to the current user's role.
 *
 * Usage:
 * ```tsx
 * const { can, access, level } = usePermission();
 *
 * // Check minimum permission level:
 * if (can("fleet", "manage")) { ... }
 *
 * // Check any access (not null):
 * if (access("settings")) { ... }
 *
 * // Get raw permission string:
 * level("trips") // → "manage" | "view" | etc.
 * ```
 */
export function usePermission() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    /** Returns true if user has at least `required` permission on `resource`. */
    can: (resource: Resource, required: Permission = "view") =>
      hasPermission(role, resource, required),

    /** Returns true if user has any non-null access to `resource`. */
    access: (resource: Resource) => canAccess(role, resource),

    /** Returns the raw permission level for `resource`. */
    level: (resource: Resource): Permission => getPermission(role, resource),

    /** The current user's role (may be undefined if not logged in). */
    role,
  };
}
