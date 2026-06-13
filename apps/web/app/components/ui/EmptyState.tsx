"use client";

import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Ma’lumot topilmadi",
  subtitle = "Filterlarni o‘zgartirib ko‘ring yoki yangi ma’lumot qo‘shing.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="premium-card flex min-h-[280px] flex-col items-center justify-center p-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#e7edf5] bg-[#f8fafc] text-[#8aa0ba]">
        <Inbox size={34} strokeWidth={1.6} />
      </div>
      <p className="mt-5 text-[22px] font-normal tracking-[-0.03em] text-[#7d8ca2]">{title}</p>
      <p className="mt-2 max-w-md text-[14px] font-normal leading-6 text-[#9aa9bd]">{subtitle}</p>
    </div>
  );
}
