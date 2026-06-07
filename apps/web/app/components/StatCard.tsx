export default function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <p className="text-sm font-black text-slate-400">{title}</p>
      <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950">
        {value}
      </h2>
      {hint && <p className="mt-3 text-xs font-bold text-slate-400">{hint}</p>}
    </div>
  );
}