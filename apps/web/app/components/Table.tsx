"use client";

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
      {children}
    </div>
  );
}

export function EmptyState({
  title = "Ma’lumot yo‘q",
  subtitle = "Hozircha jadval bo‘sh.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#dfe8f3] bg-[#fbfdff] px-6 py-10 text-center">
      <p className="text-[16px] font-normal text-[#111827]">{title}</p>
      <p className="mt-2 text-[13px] font-normal text-[#8aa0ba]">{subtitle}</p>
    </div>
  );
}
