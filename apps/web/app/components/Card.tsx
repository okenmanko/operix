"use client";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-[#e7edf5] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-[12px] font-normal uppercase tracking-[0.12em] text-[#8aa0ba]">
        {label}
      </p>
      <p className="mt-3 text-[28px] font-normal tracking-[-0.045em] text-[#111827]">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] font-normal text-[#8aa0ba]">{hint}</p> : null}
    </Card>
  );
}
