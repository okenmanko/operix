export type ModuleKey =
  | "CRM"
  | "HR"
  | "DELIVERY"
  | "MOYSKLAD"
  | "ONE_C"
  | "ANALYTICS"
  | "KPI"
  | "AI_DIRECTOR";

export type PlanKey = "STARTER" | "BUSINESS" | "PRO";
export type CompanyStatus = "TRIAL" | "ACTIVE" | "BLOCKED";

export type Company = {
  id: string;
  name: string;
  phone?: string | null;
  status?: CompanyStatus | string;
  subscriptionPlan?: PlanKey | string;
  enabledModules?: ModuleKey[] | string[];
  createdAt?: string;
  trialEndsAt?: string | null;
  users?: Array<{ id: string; fullName: string; phone: string; role: string; isActive?: boolean }>;
  _count?: { clients?: number; debts?: number; payments?: number; users?: number };
};

export const moduleCatalog: Record<ModuleKey, {
  labelUz: string;
  labelRu: string;
  short: string;
  description: string;
  route: string;
  gradient: string;
  features: string[];
}> = {
  CRM: {
    labelUz: "CRM",
    labelRu: "CRM",
    short: "Mijoz, qarz va to‘lovlar",
    description: "Mijozlar bazasi, qarzdorlar, to‘lovlar, kechikkanlar va hisobotlar nazorati.",
    route: "/",
    gradient: "from-sky-500 to-cyan-400",
    features: ["Mijozlar bazasi", "Qarzlar", "To‘lovlar", "Hisobotlar", "Excel import/export"],
  },
  HR: {
    labelUz: "HR",
    labelRu: "HR",
    short: "Hodimlar va ish jarayoni",
    description: "Hodimlar profili, rollar, ishga qabul, statuslar va ichki jarayonlar uchun modul.",
    route: "/hr",
    gradient: "from-emerald-500 to-teal-400",
    features: ["Hodimlar ro‘yxati", "Lavozimlar", "Ishga qabul pipeline", "Aktiv/passiv status", "Role permissions"],
  },
  DELIVERY: {
    labelUz: "Delivery",
    labelRu: "Доставка",
    short: "Dostavka va kuryerlar",
    description: "Buyurtma yig‘ish, kuryer workflow, photo proof, statuslar va delivery reportlar.",
    route: "/delivery",
    gradient: "from-blue-500 to-indigo-400",
    features: ["Zayavkalar", "Kuryerlar", "Status tracking", "Rasm proof", "Kunlik delivery report"],
  },
  MOYSKLAD: {
    labelUz: "MoySklad",
    labelRu: "МойСклад",
    short: "MoySklad integratsiyasi",
    description: "MoySklad kontragentlar, balanslar, to‘lovlar va ombor ma’lumotlarini Operix bilan ulash.",
    route: "/moysklad",
    gradient: "from-violet-500 to-fuchsia-400",
    features: ["Token orqali ulash", "Kontragent sync", "Qarz balanslari", "To‘lovlar", "Omborlar"],
  },
  ONE_C: {
    labelUz: "1C",
    labelRu: "1C",
    short: "1C integratsiyasi",
    description: "1C bilan almashinuv, accounting data, hujjatlar va biznes hisobotlari uchun integratsiya.",
    route: "/one-c",
    gradient: "from-amber-500 to-orange-400",
    features: ["1C endpoint", "Token", "Hujjat sync", "Accounting export", "Status monitoring"],
  },
  ANALYTICS: {
    labelUz: "Analytics",
    labelRu: "Аналитика",
    short: "Ideal chart va trendlar",
    description: "Tushum, qarz, to‘lov, filial, hodimlar va top mijozlar bo‘yicha chuqur analitika.",
    route: "/analytics",
    gradient: "from-cyan-500 to-blue-500",
    features: ["Revenue trend", "Debt trend", "Payment dynamics", "Top debtors", "Employee performance"],
  },
  KPI: {
    labelUz: "KPI",
    labelRu: "KPI",
    short: "Hodim samaradorligi",
    description: "Sotuvchi, kollektor, operator, HR va delivery hodimlari KPI nazorati.",
    route: "/kpi",
    gradient: "from-rose-500 to-pink-400",
    features: ["Sotuvchi KPI", "Kollektor KPI", "Kuryer KPI", "HR KPI", "Manager ranking"],
  },
  AI_DIRECTOR: {
    labelUz: "AI Director",
    labelRu: "AI Директор",
    short: "Rahbar uchun AI xulosa",
    description: "Rahbar savol beradi, Operix raqamlar asosida qisqa va aniq xulosa beradi.",
    route: "/ai-director",
    gradient: "from-slate-900 to-slate-600",
    features: ["Natural language questions", "Raqamli xulosa", "Risk alerts", "Daily insight", "Action plan"],
  },
};

export const planModules: Record<PlanKey, ModuleKey[]> = {
  STARTER: ["CRM", "HR", "DELIVERY"],
  BUSINESS: ["CRM", "HR", "DELIVERY", "MOYSKLAD", "ONE_C", "ANALYTICS"],
  PRO: ["CRM", "HR", "DELIVERY", "MOYSKLAD", "ONE_C", "ANALYTICS", "KPI", "AI_DIRECTOR"],
};

export const planCatalog: Record<PlanKey, {
  title: string;
  price: string;
  description: string;
  badge: string;
  modules: ModuleKey[];
  bestFor: string;
}> = {
  STARTER: {
    title: "Starter",
    price: "300 000 so‘m / oy",
    description: "CRM, HR va Delivery bilan biznesni tartibga solish uchun boshlang‘ich paket.",
    badge: "Start",
    modules: planModules.STARTER,
    bestFor: "Kichik do‘kon, servis, kichik jamoa",
  },
  BUSINESS: {
    title: "Business",
    price: "700 000 so‘m / oy",
    description: "Starter imkoniyatlari + MoySklad, 1C va premium analytics.",
    badge: "Most popular",
    modules: planModules.BUSINESS,
    bestFor: "Ombori, hisob-kitobi va filiallari bor biznes",
  },
  PRO: {
    title: "Pro",
    price: "1 500 000 so‘m / oy",
    description: "Business imkoniyatlari + KPI va AI Director bilan to‘liq Business OS.",
    badge: "Full OS",
    modules: planModules.PRO,
    bestFor: "Katta jamoa, filiallar, top management",
  },
};

export const statusLabels: Record<CompanyStatus, string> = {
  TRIAL: "TRIAL · 30 kun",
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
};

export function modulesForPlan(plan?: string): ModuleKey[] {
  if (plan === "BUSINESS") return planModules.BUSINESS;
  if (plan === "PRO") return planModules.PRO;
  return planModules.STARTER;
}

export function normalizeModules(modules?: string[] | null): ModuleKey[] {
  if (!modules || modules.length === 0) return ["CRM"];
  return modules.filter((m): m is ModuleKey => Object.keys(moduleCatalog).includes(m));
}

export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
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

export function getStoredCompany(): Company | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("company");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
