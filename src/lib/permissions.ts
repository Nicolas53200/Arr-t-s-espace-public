import type { Role, Permission } from "@/types";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "arrete:create",
    "arrete:edit",
    "arrete:abrogate",
    "arrete:publish",
    "arrete:view",
    "arrete:view_history",
    "reference:create",
    "reference:edit",
    "reference:view",
    "settings:manage",
    "users:manage",
  ],
  redacteur: [
    "arrete:create",
    "arrete:edit",
    "arrete:abrogate",
    "arrete:publish",
    "arrete:view",
    "arrete:view_history",
    "reference:view",
  ],
  lecteur: ["arrete:view", "arrete:view_history", "reference:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canCreateArrete(role: Role): boolean {
  return hasPermission(role, "arrete:create");
}

export function canEditArrete(role: Role): boolean {
  return hasPermission(role, "arrete:edit");
}

export function canAbrogerArrete(role: Role): boolean {
  return hasPermission(role, "arrete:abrogate");
}

export function canManageReferences(role: Role): boolean {
  return hasPermission(role, "reference:edit");
}
