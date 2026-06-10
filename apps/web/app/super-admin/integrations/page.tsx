"use client";

import AppLayout from "../../components/AppLayout";

const items = ["MoySklad", "1C", "Telegram Bot", "Google Sheets", "Payme", "Click"];

export default function IntegrationsPage() {
  return (
    <AppLayout title="Integratsiyalar" subtitle="Platforma darajasidagi tashqi ulanishlar">
      <div className="grid grid-cols-3 gap-5">
        {items.map((item) => (
          <div key={item} className="op-card p-6">
            <p className="text-[20px] font-semibold op-text">{item}</p>
            <p className="mt-2 text-[13px] font-semibold leading-6 op-muted">Token, URL, status monitoring va sync loglar uchun tayyor section.</p>
            <button className="op-btn-soft mt-5 px-4 py-2.5 text-sm">Sozlash</button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
