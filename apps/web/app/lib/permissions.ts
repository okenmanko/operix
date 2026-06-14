"use client";

import { getStoredUser } from "./api";

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "COURIER" | "USER" | "SUPER_ADMIN";

export const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  ACCOUNTANT: "Accountant",
  COURIER: "Courier",
  USER: "User",
  SUPER_ADMIN: "Super Admin",
};

export function currentRole(): Role {
  const user = getStoredUser();
  return ((user?.role || "OWNER").toUpperCase() as Role) || "OWNER";
}

export function can(action?: string, role: Role = currentRole()) {
  const r = String(role || "OWNER").toUpperCase();

  if (r === "SUPER_ADMIN" || r === "OWNER" || r === "ADMIN") return true;

  const managerAllowed = [
    "clients.view",
    "clients.create",
    "debts.view",
    "debts.create",
    "payments.view",
    "reports.view",
    "products.view",
    "warehouses.view",
    "inventory.view",
    "sales.view",
    "pos.view",
  ];

  const accountantAllowed = [
    "clients.view",
    "debts.view",
    "payments.view",
    "payments.create",
    "reports.view",
  ];

  const courierAllowed = ["delivery.view", "delivery.update"];

  if (!action) return true;
  if (r === "MANAGER") return managerAllowed.includes(action);
  if (r === "ACCOUNTANT") return accountantAllowed.includes(action);
  if (r === "COURIER") return courierAllowed.includes(action);

  return false;
}

export function hasPermission(action?: string) {
  return can(action);
}

export function requireRole(roles: Role[] = []) {
  const role = currentRole();
  return roles.length === 0 || roles.includes(role);
}

export function isOwner() {
  return ["OWNER", "ADMIN", "SUPER_ADMIN"].includes(currentRole());
}
