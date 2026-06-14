"use client";

import { getStoredUser } from "./api";

type Role = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "CASHIER" | "VIEWER";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  OWNER: ["*"],
  ADMIN: ["clients:*", "debts:*", "payments:*", "reports:*", "analytics:*", "inventory:*", "products:*", "warehouses:*", "stock:*", "qr:*", "sales:*", "settings:*", "integrations:*"],
  MANAGER: ["clients:read", "clients:create", "clients:update", "debts:read", "debts:create", "debts:update", "payments:read", "reports:read", "analytics:read", "products:read", "inventory:read"],
  ACCOUNTANT: ["clients:read", "clients:import", "clients:export", "debts:*", "payments:*", "reports:*", "analytics:read", "settings:read"],
  CASHIER: ["clients:read", "debts:read", "payments:read", "payments:create", "sales:*"],
  VIEWER: ["clients:read", "debts:read", "payments:read", "reports:read", "analytics:read"],
};

export function currentRole(): Role {
  try {
    const user = getStoredUser();
    const raw = String(user?.role || "OWNER").toUpperCase();
    if (raw === "SUPERADMIN") return "SUPER_ADMIN";
    if (raw in ROLE_PERMISSIONS) return raw as Role;
    return "OWNER";
  } catch {
    return "OWNER";
  }
}

export function can(permission: string) {
  const role = currentRole();
  const permissions = ROLE_PERMISSIONS[role] || [];

  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;

  const [module] = permission.split(":");
  return permissions.includes(`${module}:*`);
}

export function hasRole(...roles: Role[]) {
  return roles.includes(currentRole());
}

export function safeGetStoredUser() {
  try {
    return getStoredUser();
  } catch {
    return { role: "OWNER" };
  }
}
