"use client";

import { useMemo } from "react";

export default function QrLabel({
  value,
  title,
  subtitle,
}: {
  value: string;
  title?: string;
  subtitle?: string;
}) {
  const qrUrl = useMemo(() => {
    const text = encodeURIComponent(value || "OPERIX");
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${text}`;
  }, [value]);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-sm">
      <img
        src={qrUrl}
        alt="QR"
        className="mx-auto h-[180px] w-[180px] rounded-2xl bg-white"
      />
      {title ? (
        <p className="mt-4 text-[15px] font-medium text-slate-950">{title}</p>
      ) : null}
      {subtitle ? (
        <p className="mt-1 text-[12px] font-normal text-slate-500">
          {subtitle}
        </p>
      ) : null}
      <p className="mt-3 break-all text-[11px] font-normal text-slate-400">
        {value}
      </p>
    </div>
  );
}
