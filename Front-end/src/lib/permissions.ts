import type { UserRole } from "@/types";

// ── Permission levels ──────────────────────────────────────
export type Permission =
  | "manage" // Full CRUD
  | "edit" // Create + Update (no delete)
  | "edit_assignment" // Update driver assignment only
  | "view" // Read + filter (no mutations)
  | "read" // Strict read-only, no filters that mutate
  | null; // No access — page is blocked

// ── Resource keys ─────────────────────────────────────────
export type Resource =
  "fleet" | "drivers" | "trips" | "maintenance" | "fuel" | "analytics" | "settings";

// ── Central permission matrix ──────────────────────────────
export const PERMISSIONS: Record<UserRole, Record<Resource, Permission>> = {
  "Fleet Manager": {
    fleet: "manage",
    drivers: "manage",
    trips: "view",
    maintenance: "manage",
    fuel: "edit",
    analytics: "view",
    settings: "manage",
  },
  Dispatcher: {
    fleet: "view",
    drivers: "edit_assignment",
    trips: "manage",
    maintenance: "view",
    fuel: "view",
    analytics: "view",
    settings: null,
  },
  "Safety Officer": {
    fleet: "view",
    drivers: "manage",
    trips: "view",
    maintenance: "view",
    fuel: "read",
    analytics: "view",
    settings: null,
  },
  "Financial Analyst": {
    fleet: "read",
    drivers: "read",
    trips: "read",
    maintenance: "read",
    fuel: "manage",
    analytics: "manage",
    settings: null,
  },
};

// ── Permission hierarchy ──────────────────────────────────
// Higher index = more permissive
const LEVEL_ORDER: Permission[] = [null, "read", "view", "edit", "edit_assignment", "manage"];

/**
 * Returns true if the user's permission for a resource
 * is at least as permissive as `required`.
 */
export function hasPermission(
  role: UserRole | undefined,
  resource: Resource,
  required: Permission,
): boolean {
  if (!role) return false;
  const actual = PERMISSIONS[role]?.[resource] ?? null;
  const actualLevel = LEVEL_ORDER.indexOf(actual);
  const requiredLevel = LEVEL_ORDER.indexOf(required);
  if (required === "edit_assignment") {
    // Special case: edit_assignment is only for Dispatcher on drivers
    return actual === "edit_assignment" || actual === "manage" || actual === "edit";
  }
  return actualLevel >= requiredLevel;
}

/**
 * Returns true if the user has any access to the resource (not null).
 */
export function canAccess(role: UserRole | undefined, resource: Resource): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.[resource] !== null;
}

/**
 * Returns the raw permission level for a role+resource.
 */
export function getPermission(role: UserRole | undefined, resource: Resource): Permission {
  if (!role) return null;
  return PERMISSIONS[role]?.[resource] ?? null;
}
