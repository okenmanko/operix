"use client";

export type StoredCompany = {
  id: string;
  name: string;
  status?: string;
  subscriptionPlan?: string;
  enabledModules?: string[];
  clientLimit?: number | null;
  userLimit?: number | null;
  productLimit?: number | null;
  warehouseLimit?: number | null;
};

export function getStoredCompany(): StoredCompany | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("operix_company") || "null");
  } catch {
    return null;
  }
}

export function hasModule(module: string) {
  const company = getStoredCompany();
  if (!company?.enabledModules?.length) return true;
  return company.enabledModules.includes(module);
}

export function isBlockedCompany() {
  const company = getStoredCompany();
  return company?.status === "BLOCKED";
}
