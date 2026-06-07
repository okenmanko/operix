"use client";

export default function LanguageSwitcher() {
  return (
    <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
      <button className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white">
        UZ
      </button>

      <button className="rounded-xl px-4 py-2 text-xs font-black text-slate-500">
        RU
      </button>
    </div>
  );
}