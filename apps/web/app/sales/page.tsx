"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type ScannedItem = {
  id: string;
  qrCode: string;
  status: string;
  salePrice: number;
  currency: string;
  product: { name: string; brand?: string; model?: string };
  warehouse: { name: string };
};

export default function SalesPage() {
  const [qrCode, setQrCode] = useState("");
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [today, setToday] = useState<any>(null);
  const [message, setMessage] = useState("");

  async function loadToday() {
    try { setToday(await apiJson("/pos/today")); } catch { setToday(null); }
  }

  useEffect(() => { loadToday(); }, []);

  async function scan() {
    setMessage("");
    if (!qrCode.trim()) return;

    try {
      const item = await apiJson<ScannedItem>("/pos/scan", {
        method: "POST",
        body: JSON.stringify({ qrCode }),
      });

      if (!items.find((x) => x.qrCode === item.qrCode)) setItems([item, ...items]);
      setQrCode("");
    } catch (e: any) {
      setMessage(e.message || "QR topilmadi");
    }
  }

  async function sell() {
    setMessage("");
    if (items.length === 0) return;

    try {
      await apiJson("/pos/sell", {
        method: "POST",
        body: JSON.stringify({ qrCodes: items.map((x) => x.qrCode), method: "CASH" }),
      });

      setItems([]);
      setMessage("Sotuv saqlandi. Sklad avtomatik kamaydi.");
      await loadToday();
    } catch (e: any) {
      setMessage(e.message || "Sotuvda xatolik");
    }
  }

  const total = items.reduce((sum, item) => sum + Number(item.salePrice || 0), 0);
  const currency = items[0]?.currency || "UZS";

  return (
    <AppLayout title="Sotuv POS" subtitle="QR skan → sotuv → sklad minus → DDS kirim">
      <div className="operix-grid-stats">
        <div className="operix-card operix-stat"><div className="operix-stat-label">Bugun sotildi</div><div className="operix-stat-value">{today?.soldCount || 0}</div></div>
        <div className="operix-card operix-stat"><div className="operix-stat-label">Bugungi UZS</div><div className="operix-stat-value">{Number(today?.totalUZS || 0).toLocaleString("ru-RU")}</div></div>
        <div className="operix-card operix-stat"><div className="operix-stat-label">Bugungi USD</div><div className="operix-stat-value">{Number(today?.totalUSD || 0).toLocaleString("ru-RU")}</div></div>
        <div className="operix-card operix-stat"><div className="operix-stat-label">Savatcha</div><div className="operix-stat-value">{items.length}</div></div>
      </div>

      <div className="operix-grid-main">
        <div className="operix-card operix-card-pad">
          <h2 className="operix-section-title">QR skan qilish</h2>
          <div className="space-y-3">
            <input className="operix-input" value={qrCode} onChange={(e) => setQrCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") scan(); }} placeholder="QR kod kiriting yoki skaner qiling" autoFocus />
            <button className="operix-btn w-full" onClick={scan}>QR qo‘shish</button>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[13px] font-semibold text-slate-500">Jami summa</p>
              <p className="mt-2 text-[28px] font-bold tracking-[-0.05em] text-slate-950">{total.toLocaleString("ru-RU")} {currency}</p>
            </div>
            <button className="h-12 w-full rounded-2xl bg-slate-950 text-[14px] font-bold text-white transition hover:bg-slate-800" onClick={sell}>Sotuvni yakunlash</button>
            {message && <div className="rounded-2xl bg-sky-50 p-4 text-[13px] font-bold text-sky-700">{message}</div>}
          </div>
        </div>

        <div className="operix-card operix-card-pad">
          <h2 className="operix-section-title">Sotuv savatchasi</h2>
          <div className="divide-y divide-slate-100">
            {items.length === 0 ? <div className="operix-empty">QR qo‘shilmagan</div> : items.map((item) => (
              <div key={item.qrCode} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-[15px] font-bold text-slate-950">{item.product?.name}</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-400">{item.qrCode} • {item.warehouse?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-slate-950">{Number(item.salePrice || 0).toLocaleString("ru-RU")} {item.currency}</p>
                  <button onClick={() => setItems(items.filter((x) => x.qrCode !== item.qrCode))} className="mt-1 text-[12px] font-bold text-red-500">O‘chirish</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
