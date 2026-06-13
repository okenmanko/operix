"use client";

import { getStoredUser } from "./api";

export type ActionKey =
  | "clients:create" | "clients:import" | "clients:export"
  | "debts:create" | "debts:import" | "debts:export"
  | "payments:create" | "payments:export"
  | "inventory:create" | "inventory:import" | "inventory:export" | "inventory:sync"
  | "warehouses:create" | "stock:movement"
  | "settings:edit" | "integrations:edit" | "integrations:sync";

const MATRIX: Record<string, ActionKey[]> = {
  SUPER_ADMIN: ["clients:create","clients:import","clients:export","debts:create","debts:import","debts:export","payments:create","payments:export","inventory:create","inventory:import","inventory:export","inventory:sync","warehouses:create","stock:movement","settings:edit","integrations:edit","integrations:sync"],
  OWNER: ["clients:create","clients:import","clients:export","debts:create","debts:import","debts:export","payments:create","payments:export","inventory:create","inventory:import","inventory:export","inventory:sync","warehouses:create","stock:movement","settings:edit","integrations:edit","integrations:sync"],
  ADMIN: ["clients:create","clients:import","clients:export","debts:create","debts:import","debts:export","payments:create","payments:export","inventory:create","inventory:import","inventory:export","inventory:sync","warehouses:create","stock:movement","settings:edit","integrations:edit","integrations:sync"],
  MANAGER: ["clients:create","clients:export","debts:create","debts:export","payments:create"],
  ACCOUNTANT: ["clients:export","debts:export","payments:create","payments:export"],
  CASHIER: ["payments:create","payments:export"],
};

export function currentRole() {
  const user = getStoredUser();
  return user?.role || "OWNER";
}

export function can(action: ActionKey) {
  return (MATRIX[currentRole()] || MATRIX.OWNER).includes(action);
}
