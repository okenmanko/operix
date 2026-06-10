"use client";

import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

export default function QrScannerPage() {
  const [qrCode, setQrCode] = useState("");
  const [action, setAction] = useState("OUT");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function scan() {
    setError("");
    setResult(null);

    try {
      const data = await apiJson("/inventory/scan", {
        method: "POST",
        body: JSON.stringify({ qrCode, action }),
      });

      setResult(data);
      setQrCode("");
    } catch (e: any) {
      setError(e.message || "Scan xatosi");
    }
  }

  return (
    <AppLayout title="QR Scanner" subtitle="QR orqali sotish, rezerv, qaytarish va spisaniya">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="rounded-[24px] bg-slate-50 p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-400">Scan operation</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.05em] text-slate-950">QR kodni kiriting</h2>
        </div>

        <div className="mt-6 space-y-4">
          <input
            autoFocus
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && scan()}
            placeholder="OPX-XXXXXX-XXXXXXXX"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          >
            <option value="OUT">Chiqim / sotildi</option>
            <option value="RESERVE">Rezerv qilish</option>
            <option value="CANCEL_RESERVE">Rezervni bekor qilish</option>
            <option value="RETURN">Qaytarish</option>
            <option value="WRITE_OFF">Spisaniya</option>
          </select>

          <button onClick={scan} className="h-14 w-full rounded-2xl bg-sky-500 text-[15px] font-bold text-white transition hover:bg-sky-600">
            Scan qilish
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-bold text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-[14px] font-bold text-emerald-700">✅ Amal bajarildi</p>
            <p className="mt-2 text-[14px] font-semibold text-emerald-700">{result.product?.name}</p>
            <p className="mt-1 font-mono text-[12px] font-semibold text-emerald-600">{result.qrCode}</p>
            <p className="mt-1 text-[12px] font-bold text-emerald-600">Status: {result.status}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
