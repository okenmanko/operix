export type CompanyStatus = "TRIAL" | "ACTIVE" | "BLOCKED" | "EXPIRED";
export type ModuleCode =
  | "CRM"
  | "DEBTS"
  | "PAYMENTS"
  | "REPORTS"
  | "INVENTORY"
  | "QR"
  | "STOCK_MOVEMENT"
  | "POS"
  | "DDS"
  | "DELIVERY"
  | "ANALYTICS"
  | "HR"
  | "SERVICE_CENTER"
  | "CALL_CENTER"
  | "MARKETING"
  | "API"
  | "KPI"
  | "AI_DIRECTOR";

export const moduleLabels: Record<ModuleCode, { uz: string; desc: string }> = {
  CRM: { uz: "CRM", desc: "Mijozlar bazasi" },
  DEBTS: { uz: "Qarzlar", desc: "USD/UZS qarzdorlik nazorati" },
  PAYMENTS: { uz: "To‘lovlar", desc: "Qarzga to‘lov kiritish" },
  REPORTS: { uz: "Hisobotlar", desc: "Qarz, to‘lov, qoldiq" },
  INVENTORY: { uz: "Inventory/Sklad", desc: "Mahsulotlar va omborlar" },
  QR: { uz: "QR Tovarlar", desc: "Dona-dona QR hisob" },
  STOCK_MOVEMENT: { uz: "Stock Movement", desc: "Kirim, chiqim, transfer" },
  POS: { uz: "POS/Sales", desc: "QR skan qilib sotish" },
  DDS: { uz: "Cashflow/DDS", desc: "Pul kirim/chiqim" },
  DELIVERY: { uz: "Delivery", desc: "Yetkazib berish" },
  ANALYTICS: { uz: "Analytics", desc: "Real grafiklar" },
  HR: { uz: "HR", desc: "Hodimlar va maosh" },
  SERVICE_CENTER: { uz: "Service Center", desc: "Remont va servis" },
  CALL_CENTER: { uz: "Call Center", desc: "Lead va qo‘ng‘iroqlar" },
  MARKETING: { uz: "Marketing", desc: "Reklama ROI" },
  API: { uz: "API Access", desc: "Integratsiya API" },
  KPI: { uz: "KPI", desc: "Xodim KPI" },
  AI_DIRECTOR: { uz: "AI Director", desc: "AI xulosa" },
};

export const moduleCodes = Object.keys(moduleLabels) as ModuleCode[];

export function normalizeModules(value: unknown): ModuleCode[] {
  if (Array.isArray(value)) return value.filter(Boolean) as ModuleCode[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean) as ModuleCode[];
    }
  }
  return [];
}

export function companyModules(company?: any): ModuleCode[] {
  return normalizeModules(company?.enabledModules || company?.modules || []);
}

export function hasModule(company: any, module: ModuleCode) {
  const modules = companyModules(company);
  return modules.includes(module);
}

export function getStoredCompany() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("operix_company") || "null");
  } catch {
    return null;
  }
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("operix_user") || "null");
  } catch {
    return null;
  }
}

export function formatLimit(value?: number | null) {
  if (value === null || value === undefined) return "Unlimited";
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function formatUZS(value?: number | null) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(value || 0))} so‘m`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU");
}
