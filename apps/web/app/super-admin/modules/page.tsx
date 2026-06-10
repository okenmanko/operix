"use client";

import AppLayout from "../../components/AppLayout";
import { moduleLabels, planModules, type ModuleCode } from "../../lib/modules";

const modules = Object.keys(moduleLabels) as ModuleCode[];

export default function ModulesPage() {
  return (
    <AppLayout title="Modullar" subtitle="Operix platformasining homaki modullar katalogi">
      <div className="grid grid-cols-4 gap-4">
        {modules.map((module) => {
          const includedIn = Object.entries(planModules).filter(([, list]) => list.includes(module)).map(([plan]) => plan);
          return (
            <div key={module} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                {moduleLabels[module].uz.slice(0, 2)}
              </div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] dark:text-white">{moduleLabels[module].uz}</h2>
              <p className="mt-2 min-h-[42px] text-[13px] font-medium leading-6 text-slate-500 dark:text-slate-400">{moduleLabels[module].desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {includedIn.map((plan) => (
                  <span key={plan} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{plan}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
