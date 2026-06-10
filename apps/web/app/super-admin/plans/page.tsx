"use client";

import AppLayout from "../../components/AppLayout";
import { moduleLabels, planModules, plans, type PlanCode } from "../../lib/modules";

const planCodes: PlanCode[] = ["STARTER", "BUSINESS", "PRO"];

export default function PlansPage() {
  return (
    <AppLayout title="Tariflar" subtitle="Operix planlari va ularga kiradigan modullar">
      <div className="grid grid-cols-3 gap-5">
        {planCodes.map((code) => (
          <div key={code} className={`rounded-[26px] border border-slate-200 bg-gradient-to-br ${plans[code].accent} p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950`}>
            <div className="mb-6">
              <p className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{plans[code].name}</p>
              <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">{plans[code].subtitle}</p>
              <p className="mt-5 text-[20px] font-semibold text-sky-600 dark:text-sky-300">{plans[code].price}</p>
            </div>

            <div className="space-y-2">
              {planModules[code].map((module) => (
                <div key={module} className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{moduleLabels[module].uz}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{moduleLabels[module].desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-[20px] font-semibold tracking-[-0.03em] dark:text-white">Trial qoidasi</h2>
        <p className="mt-2 text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
          Trial muddati 1 oy. Yangi kompaniya odatda TRIAL statusida ochiladi. To‘lov qilingandan keyin ACTIVE qilinadi. To‘lov bo‘lmasa BLOCKED status beriladi.
        </p>
      </div>
    </AppLayout>
  );
}
