"use client";

export default function QrLabel({
  qrCode,
  productName,
  warehouseName,
  status,
}: {
  qrCode: string;
  productName: string;
  warehouseName?: string;
  status?: string;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`;

  return (
    <div className="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <img src={qrUrl} alt={qrCode} className="mx-auto h-[150px] w-[150px]" />

      <div className="mt-3 text-[13px] font-bold text-slate-950">
        {productName}
      </div>

      {warehouseName && (
        <div className="mt-1 text-[11px] font-semibold text-slate-400">
          {warehouseName}
        </div>
      )}

      {status && (
        <div className="mt-1 text-[11px] font-bold text-sky-600">
          {status}
        </div>
      )}

      <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 font-mono text-[11px] font-bold text-slate-600">
        {qrCode}
      </div>
    </div>
  );
}
