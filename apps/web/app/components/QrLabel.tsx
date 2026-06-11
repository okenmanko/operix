"use client";

import { useEffect, useState } from "react";

export default function QrLabel({
  qrCode,
  productName,
  warehouseName,
  status,
  serialNumber,
  price,
  currency = "UZS",
}: {
  qrCode: string;
  productName: string;
  warehouseName?: string;
  status?: string;
  serialNumber?: string | null;
  price?: number | null;
  currency?: string;
}) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    async function generate() {
      const QRCode = await import("qrcode");
      const url = await QRCode.toDataURL(qrCode, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      if (mounted) setQrUrl(url);
    }

    generate().catch(() => setQrUrl(""));

    return () => {
      mounted = false;
    };
  }, [qrCode]);

  return (
    <div className="break-inside-avoid rounded-[18px] border border-slate-300 bg-white p-3 text-center shadow-sm print:rounded-none print:border-slate-400 print:shadow-none">
      <div className="mx-auto flex h-[128px] w-[128px] items-center justify-center rounded-xl bg-white">
        {qrUrl ? (
          <img src={qrUrl} alt={qrCode} className="h-[128px] w-[128px]" />
        ) : (
          <div className="text-[10px] font-bold text-slate-400">QR...</div>
        )}
      </div>

      <div className="mt-2 line-clamp-2 min-h-[32px] text-[12px] font-extrabold leading-4 text-slate-950">
        {productName}
      </div>

      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
        {warehouseName ? <span>{warehouseName}</span> : null}
        {status ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{status}</span> : null}
      </div>

      {serialNumber ? (
        <div className="mt-1 text-[10px] font-semibold text-slate-500">SN: {serialNumber}</div>
      ) : null}

      {price ? (
        <div className="mt-1 text-[11px] font-extrabold text-slate-950">
          {price.toLocaleString("ru-RU")} {currency}
        </div>
      ) : null}

      <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1 font-mono text-[8.5px] font-black tracking-[-0.02em] text-slate-600">
        {qrCode}
      </div>
    </div>
  );
}
