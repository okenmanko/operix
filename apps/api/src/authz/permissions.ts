export type Role = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'CASHIER' | string;

export type ActionKey =
  | 'clients:create' | 'clients:import' | 'clients:export'
  | 'debts:create' | 'debts:import' | 'debts:export'
  | 'payments:create' | 'payments:export'
  | 'inventory:create' | 'inventory:import' | 'inventory:export' | 'inventory:sync'
  | 'warehouses:create' | 'stock:movement'
  | 'settings:edit' | 'integrations:edit' | 'integrations:sync';

export const ROLE_PERMISSIONS: Record<string, ActionKey[]> = {
  SUPER_ADMIN: ['clients:create','clients:import','clients:export','debts:create','debts:import','debts:export','payments:create','payments:export','inventory:create','inventory:import','inventory:export','inventory:sync','warehouses:create','stock:movement','settings:edit','integrations:edit','integrations:sync'],
  OWNER: ['clients:create','clients:import','clients:export','debts:create','debts:import','debts:export','payments:create','payments:export','inventory:create','inventory:import','inventory:export','inventory:sync','warehouses:create','stock:movement','settings:edit','integrations:edit','integrations:sync'],
  ADMIN: ['clients:create','clients:import','clients:export','debts:create','debts:import','debts:export','payments:create','payments:export','inventory:create','inventory:import','inventory:export','inventory:sync','warehouses:create','stock:movement','settings:edit','integrations:edit','integrations:sync'],
  MANAGER: ['clients:create','clients:export','debts:create','debts:export','payments:create'],
  ACCOUNTANT: ['clients:export','debts:export','payments:create','payments:export'],
  CASHIER: ['payments:create','payments:export'],
};

export function hasPermission(role: Role, action: ActionKey) {
  return (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.OWNER).includes(action);
}
