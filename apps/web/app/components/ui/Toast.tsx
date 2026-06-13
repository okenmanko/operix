"use client";

export function Toast({ type = "info", children }: { type?: "info" | "success" | "error"; children: React.ReactNode }) {
  const cls =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : type === "error"
        ? "border-red-200 bg-red-50 text-red-600"
        : "border-[#dbe7ff] bg-[#eef4ff] text-[#315efb]";

  return <div className={`mb-5 rounded-[22px] border px-5 py-4 text-[14px] font-normal ${cls}`}>{children}</div>;
}
