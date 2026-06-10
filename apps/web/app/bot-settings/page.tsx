"use client";
import AppLayout from "../components/AppLayout";

export default function BotSettingsPage(){
  return <AppLayout title="Telegram bot" subtitle="Bot kabinet va guruh sozlamalari">
    <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-[20px] font-semibold text-slate-950">Bot ishga tushirish</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <p>1. Bot tokenni apps/bot/.env ichiga qo‘ying.</p>
        <p>2. Company code yarating: OPX-DIGI kabi.</p>
        <p>3. Telegramda /start bosib company code yuboring.</p>
        <p>4. Delivery va report group IDlarini Integratsiyalar sahifasida kiriting.</p>
      </div>
    </div>
  </AppLayout>
}
