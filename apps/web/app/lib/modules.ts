export type PlanCode = "STARTER" | "BUSINESS" | "PRO";
export type CompanyStatus = "TRIAL" | "ACTIVE" | "BLOCKED";
export type ModuleCode =
  | "CRM"
  | "HR"
  | "DELIVERY"
  | "MOYSKLAD"
  | "ONE_C"
  | "ANALYTICS"
  | "KPI"
  | "AI_DIRECTOR";

export const moduleLabels: Record<ModuleCode, { uz: string; ru: string; desc: string }> = {
  CRM: { uz: "CRM", ru: "CRM", desc: "Mijozlar, qarzlar, to‘lovlar va hisobotlar" },
  HR: { uz: "HR", ru: "HR", desc: "Hodimlar, rollar va ish jarayonlari" },
  DELIVERY: { uz: "Delivery", ru: "Доставка", desc: "Zayavka, kuryer, status va foto proof" },
  MOYSKLAD: { uz: "MoySklad", ru: "МойСклад", desc: "Tovar, kontragent va ombor integratsiyasi" },
  ONE_C: { uz: "1C", ru: "1C", desc: "Buxgalteriya va hisob integratsiyasi" },
  ANALYTICS: { uz: "Analytics", ru: "Аналитика", desc: "Trendlar, chartlar, top ro‘yxatlar" },
  KPI: { uz: "KPI", ru: "KPI", desc: "Sotuvchi, kollektor, kuryer va manager KPI" },
  AI_DIRECTOR: { uz: "AI Director", ru: "AI Директор", desc: "Raqamlar asosida qisqa xulosa va maslahat" },
};

export const planModules: Record<PlanCode, ModuleCode[]> = {
  STARTER: ["CRM", "HR", "DELIVERY"],
  BUSINESS: ["CRM", "HR", "DELIVERY", "MOYSKLAD", "ONE_C", "ANALYTICS"],
  PRO: ["CRM", "HR", "DELIVERY", "MOYSKLAD", "ONE_C", "ANALYTICS", "KPI", "AI_DIRECTOR"],
};

export const plans: Record<PlanCode, { name: string; price: string; subtitle: string; accent: string }> = {
  STARTER: {
    name: "Starter",
    price: "300 000 so‘m / oy",
    subtitle: "CRM, HR va Delivery uchun ideal start",
    accent: "from-sky-50 to-white",
  },
  BUSINESS: {
    name: "Business",
    price: "700 000 so‘m / oy",
    subtitle: "Integratsiya va analitika kerak bo‘lgan bizneslar",
    accent: "from-emerald-50 to-white",
  },
  PRO: {
    name: "Pro",
    price: "1 500 000 so‘m / oy",
    subtitle: "KPI, AI Director va to‘liq Business OS",
    accent: "from-indigo-50 to-white",
  },
};

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

export function modulesForPlan(plan?: string): ModuleCode[] {
  return planModules[(plan as PlanCode) || "STARTER"] || planModules.STARTER;
}

export function formatPhone(value: string) {
  const raw = value.replace(/\D/g, "");
  let digits = raw;
  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.startsWith("8") && digits.length > 9) digits = digits.slice(1);
  digits = digits.slice(0, 9);

  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 7);
  const d = digits.slice(7, 9);

  let result = "+998";
  if (a) result += ` ${a}`;
  if (b) result += ` ${b}`;
  if (c) result += ` ${c}`;
  if (d) result += ` ${d}`;
  return result === "+998" ? "" : result;
}
