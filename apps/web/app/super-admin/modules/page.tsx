"use client";

import AppLayout from "../../components/AppLayout";
import { moduleCodes, moduleLabels, modulesForPlan, type ModuleCode } from "../../lib/modules";

const moduleDescriptions: Partial<Record<ModuleCode, string>> = {
  CRM: "Mijozlar bazasi va mijoz kartalari",
  DEBTS: "Qarzlar, muddat va qoldiq nazorati",
  PAYMENTS: "To‘lovlar va pul tushumlari",
  REPORTS: "Qarz, to‘lov va balans hisobotlari",
  ANALYTICS: "Savdo va biznes analitika",
  INVENTORY: "Sklad umumiy nazorati",
  PRODUCTS: "Mahsulotlar katalogi, narx va qoldiq",
  WAREHOUSES: "Omborlar va ichidagi mahsulotlar",
  STOCK: "Sklad qoldiqlari",
  STOCK_MOVEMENT: "Kirim, chiqim, transfer harakatlari",
  QR: "QR kod va dona-dona tracking",
  QR_LABELS: "QR label bosib chiqarish",
  DELIVERY: "Yetkazib berish jarayoni",
  DDS: "Pul oqimi va xarajatlar",
  POS: "Kassa va sotuv",
  SALES: "Sotuvlar tarixi",
  HR: "Xodimlar va vakansiyalar",
  KPI: "KPI nazorati",
  MOYSKLAD: "MoySklad integratsiya",
  ONE_C: "1C integratsiya",
  INTEGRATIONS: "Tashqi servislar ulanishi",
};

const plans = ["STARTER", "BUSINESS", "PRO"];

function includedPlans(module: ModuleCode) {
  return plans.filter((plan) => modulesForPlan(plan).includes(module));
}

export default function ModulesPage() {
  return (
    <AppLayout title="Modullar" subtitle="Operix platformasining modullar katalogi">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCodes.map((module) => {
          const label = moduleLabels[module] || module;
          const includedIn = includedPlans(module);

          return (
            <div
              key={module}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-[13px] font-semibold text-sky-600">
                {label.slice(0, 2).toUpperCase()}
              </div>

              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
                {label}
              </h2>

              <p className="mt-2 min-h-[42px] text-[13px] font-medium leading-6 text-slate-500">
                {moduleDescriptions[module] || "Operix moduli"}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {includedIn.length ? (
                  includedIn.map((plan) => (
                    <span
                      key={plan}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                    >
                      {plan}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                    CUSTOM
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
