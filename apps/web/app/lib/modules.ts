"use client";

export type ModuleCode =
  | "CRM"
  | "DEBTS"
  | "PAYMENTS"
  | "REPORTS"
  | "ANALYTICS"
  | "INVENTORY"
  | "PRODUCTS"
  | "WAREHOUSES"
  | "STOCK"
  | "STOCK_MOVEMENT"
  | "QR"
  | "QR_LABELS"
  | "DELIVERY"
  | "DDS"
  | "POS"
  | "SALES"
  | "HR"
  | "KPI"
  | "MOYSKLAD"
  | "ONE_C"
  | "INTEGRATIONS";

export type StoredCompany = {
  id?: string;
  name?: string;
  subscriptionPlan?: string;
  enabledModules?: ModuleCode[] | string[] | string | null;
  [key: string]: any;
};

export type StoredUser = {
  id?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  [key: string]: any;
};

export const moduleLabels: Record<ModuleCode, string> = {
  CRM: "CRM",
  DEBTS: "Qarzlar",
  PAYMENTS: "To‘lovlar",
  REPORTS: "Hisobotlar",
  ANALYTICS: "Analytics",
  INVENTORY: "Inventory",
  PRODUCTS: "Products",
  WAREHOUSES: "Omborlar",
  STOCK: "Sklad",
  STOCK_MOVEMENT: "Stock Movement",
  QR: "QR",
  QR_LABELS: "QR Labels",
  DELIVERY: "Delivery",
  DDS: "DDS",
  POS: "POS",
  SALES: "Sales / POS",
  HR: "HR",
  KPI: "KPI",
  MOYSKLAD: "MoySklad",
  ONE_C: "1C",
  INTEGRATIONS: "Integratsiyalar",
};

export const moduleCodes: ModuleCode[] = [
  "CRM",
  "DEBTS",
  "PAYMENTS",
  "REPORTS",
  "ANALYTICS",
  "INVENTORY",
  "PRODUCTS",
  "WAREHOUSES",
  "STOCK",
  "STOCK_MOVEMENT",
  "QR",
  "QR_LABELS",
  "DELIVERY",
  "DDS",
  "POS",
  "SALES",
  "HR",
  "KPI",
  "MOYSKLAD",
  "ONE_C",
  "INTEGRATIONS",
];

export const companyModules = moduleCodes;
export const planModules = companyModules;
export const modules = companyModules;
export const allModules = companyModules;

export const starterModules: ModuleCode[] = ["CRM", "DEBTS", "PAYMENTS", "REPORTS"];
export const businessModules: ModuleCode[] = [
  ...starterModules,
  "ANALYTICS",
  "INVENTORY",
  "PRODUCTS",
  "WAREHOUSES",
  "STOCK",
  "STOCK_MOVEMENT",
  "QR",
  "QR_LABELS",
  "DELIVERY",
  "DDS",
  "POS",
  "SALES",
  "MOYSKLAD",
  "ONE_C",
  "INTEGRATIONS",
];
export const proModules: ModuleCode[] = [...businessModules, "HR", "KPI"];

export function normalizeModule(value: unknown): ModuleCode | null {
  if (!value) return null;
  const code = String(value).trim().toUpperCase().replaceAll("-", "_").replaceAll(" ", "_") as ModuleCode;
  return moduleCodes.includes(code) ? code : null;
}

export function normalizeModules(value: unknown): ModuleCode[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(normalizeModule).filter(Boolean) as ModuleCode[];
  if (typeof value === "string") {
    try { return normalizeModules(JSON.parse(value)); } catch {}
    return value.split(",").map(normalizeModule).filter(Boolean) as ModuleCode[];
  }
  return [];
}

export function modulesForPlan(plan?: string): ModuleCode[] {
  if (plan === "STARTER") return starterModules;
  if (plan === "BUSINESS") return businessModules;
  if (plan === "PRO") return proModules;
  return companyModules;
}

export function getModulesForPlan(plan?: string): ModuleCode[] { return modulesForPlan(plan); }

export function getStoredCompany(): StoredCompany | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("operix_company") || localStorage.getItem("company");
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  const plan = localStorage.getItem("operix_plan") || localStorage.getItem("subscriptionPlan") || "PRO";
  return { subscriptionPlan: plan, enabledModules: modulesForPlan(plan) };
}

export function setStoredCompany(company: StoredCompany | null) {
  if (typeof window === "undefined") return;
  if (!company) return localStorage.removeItem("operix_company");
  localStorage.setItem("operix_company", JSON.stringify(company));
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("operix_user") || localStorage.getItem("user");
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  const role = localStorage.getItem("operix_role") || localStorage.getItem("role") || "OWNER";
  return { role };
}

export function hasModule(companyOrModule?: StoredCompany | ModuleCode | string | null, maybeModule?: ModuleCode | string) {
  const company = typeof maybeModule === "undefined" ? getStoredCompany() : (companyOrModule as StoredCompany | null);
  const module = normalizeModule(typeof maybeModule === "undefined" ? companyOrModule : maybeModule);
  if (!module) return true;
  if (!company) return true;
  const enabled = normalizeModules(company.enabledModules);
  if (!enabled.length) return true;
  return enabled.includes(module);
}

export function formatLimit(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "Cheksiz";
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Cheksiz";
  return n.toLocaleString("ru-RU");
}

export function formatUZS(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return `${Number.isFinite(n) ? n.toLocaleString("ru-RU") : "0"} UZS`;
}

export function moduleTitle(code: ModuleCode | string) { return moduleLabels[code as ModuleCode] || String(code); }
