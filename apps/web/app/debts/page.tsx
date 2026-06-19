"use client";

import { ChevronDown, Plus, Upload, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { apiJson, apiUpload, dateText, downloadFile, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Debt = {
  id: string;
  amount: number;
  currency?: string;
  dueDate?: string | null;
  status?: string;
  comment?: string | null;
  client?: { fullName?: string; phone?: string };
  payments?: Array<{ id?: string; amount: number; currency?: string; method?: string; createdAt?: string }>;
};

type Filter = "open" | "overdue" | "paid" | "closed" | "all";

export default function DebtsPage() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [currency, setCurrency] = useState("ALL");
  const [openId, setOpenId] = useState("");
  const [paying, setPaying] = useState<Debt | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [message, setMessage] = useState("");

  async function load() {
    const data = await apiJson<Debt[]>("/debts");
    setDebts(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load().catch(() => null); }, []);

  const prepared = useMemo(() => debts.map((debt) => {
    const paid = (debt.payments || [])
      .filter((p) => String(p.currency || debt.currency || "UZS").toUpperCase() === String(debt.currency || "UZS").toUpperCase())
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const remaining = Math.max(0, Number(debt.amount || 0) - paid);
    const overdue = remaining > 0 && debt.dueDate ? new Date(debt.dueDate) < new Date() : false;
    const lastPayment = [...(debt.payments || [])].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    const status = remaining <= 0 || debt.status === "CLOSED" ? "closed" : overdue ? "overdue" : "open";
    return { ...debt, paid, remaining, overdue, lastPayment, viewStatus: status };
  }), [debts]);

  const totals = useMemo(() => {
    const open = prepared.filter((d) => d.remaining > 0);
    return {
      open: open.length,
      overdue: open.filter((d) => d.overdue).length,
      uzs: open.filter((d) => d.currency !== "USD").reduce((s, d) => s + d.remaining, 0),
      usd: open.filter((d) => d.currency === "USD").reduce((s, d) => s + d.remaining, 0),
    };
  }, [prepared]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return prepared.filter((d) => {
      if (filter === "open" && d.remaining <= 0) return false;
      if (filter === "overdue" && !d.overdue) return false;
      if ((filter === "paid" || filter === "closed") && d.remaining > 0) return false;
      if (currency !== "ALL" && String(d.currency || "UZS") !== currency) return false;
      if (!q) return true;
      return [d.client?.fullName, d.client?.phone, d.comment, d.currency].join(" ").toLowerCase().includes(q);
    });
  }, [prepared, filter, currency, query]);

  async function importExcel(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("mode", "replace");
    const result: any = await apiUpload("/debts/import-excel", form);
    setMessage(`${t("importExcel")}: ${result?.created || result?.rows || 0} ta`);
    await load();
  }

  async function savePayment() {
    if (!paying) return;
    await apiJson("/payments", { method: "POST", body: JSON.stringify({ debtId: paying.id, amount: Number(amount || 0), currency: paying.currency || "UZS", method }) });
    setPaying(null); setAmount(""); await load();
  }

  return (
    <AppLayout title={t("debts")} subtitle={t("debtPageSubtitle")}>
      {message ? <div className="mb-5 rounded-[22px] bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{message}</div> : null}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("activeDebts")} value={`${num(totals.open)} ta`} />
        <Stat label={t("overdue")} value={`${num(totals.overdue)} ta`} />
        <Stat label="UZS" value={money(totals.uzs, "UZS")} />
        <Stat label="USD" value={money(totals.usd, "USD")} />
      </div>

      <div className="mt-5 premium-card p-5">
        <div className="flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
          <div><h2 className="text-[24px] font-semibold tracking-[-0.05em]">{t("debtCenter")}</h2><p className="mt-1 text-[14px] text-[var(--muted)]">{t("debtCenterSub")}</p></div>
          <div className="flex gap-3 max-md:flex-col">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])} />
            <button className="premium-button premium-button-primary" onClick={() => fileRef.current?.click()}><Upload size={17} />{t("importExcel")}</button>
            <button className="premium-button premium-button-soft" onClick={() => downloadFile("/debts/export-excel", "qanot-debts.xlsx")}><Download size={17} />{t("exportExcel")}</button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1.25fr_0.7fr] gap-5 max-xl:grid-cols-1">
        <section className="premium-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
            <div><h2 className="text-[25px] font-semibold tracking-[-0.06em]">{t("collectorList")}</h2><p className="mt-1 text-[14px] text-[var(--muted)]">{t("collectorListSub")}</p></div>
            <button className="premium-button premium-button-primary"><Plus size={17} />{t("addDebt")}</button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {([ ["open", t("opened")], ["overdue", t("overdue")], ["paid", t("paid")], ["closed", t("closed")], ["all", t("all")] ] as [Filter,string][]).map(([k,label]) => <button key={k} onClick={() => setFilter(k)} className={`qanot-pill ${filter === k ? "qanot-pill-active" : ""}`}>{label}</button>)}
          </div>

          <div className="mb-4 grid grid-cols-[1fr_190px] gap-3 max-md:grid-cols-1">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t("client")}, ${t("phone")}, ${t("productInfo")}...`} className="premium-input" />
            <CustomSelect value={currency} onChange={setCurrency} options={[{ value: "ALL", label: t("allCurrency") }, { value: "USD", label: "USD" }, { value: "UZS", label: "UZS" }]} />
          </div>

          <div className="space-y-3">
            {filtered.map((debt) => {
              const isOpen = openId === debt.id;
              const cur = debt.currency || "UZS";
              return (
                <div key={debt.id} className="qanot-row overflow-hidden">
                  <button onClick={() => setOpenId(isOpen ? "" : debt.id)} className="grid w-full grid-cols-[1fr_120px_140px_32px] items-center gap-4 px-5 py-4 text-left max-md:grid-cols-1">
                    <div><p className="font-semibold">{debt.client?.fullName || "—"}</p><p className="mt-1 text-[13px] text-[var(--muted)]">{debt.client?.phone || "—"}</p></div>
                    <div><p className="premium-label mb-1">{t("dueDate")}</p><p>{dateText(debt.dueDate)}</p></div>
                    <div><p className="premium-label mb-1">{t("remaining")}</p><p className="font-semibold">{money(debt.remaining, cur)}</p></div>
                    <ChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} size={18} />
                  </button>
                  {isOpen ? <div className="border-t border-[var(--line-soft)] px-5 py-5">
                    <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                      <Info label={t("totalDebt")} value={money(debt.amount, cur)} />
                      <Info label={t("paid")} value={money(debt.paid, cur)} />
                      <Info label={t("lastPayment")} value={debt.lastPayment ? `${dateText(debt.lastPayment.createdAt)} · ${money(debt.lastPayment.amount, debt.lastPayment.currency || cur)}` : t("noPayment")} />
                      <Info label={t("status")} value={debt.viewStatus === "overdue" ? t("overdue") : debt.remaining <= 0 ? t("closed") : t("opened")} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <Info label={t("productInfo")} value={extractProduct(debt.comment, cur)} />
                      <Info label={t("note")} value={debt.comment || "—"} />
                    </div>
                    <button onClick={() => { setPaying(debt); setAmount(String(debt.remaining || "")); }} className="premium-button premium-button-primary mt-5">{t("addPayment")}</button>
                  </div> : null}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="premium-card p-6"><h2 className="text-[24px] font-semibold tracking-[-0.05em]">{t("recentPayments")}</h2><p className="mt-4 text-[var(--muted)]">{t("noRecentPayments")}</p></div>
          <div className="premium-card p-6"><h2 className="text-[24px] font-semibold tracking-[-0.05em]">{t("collectorMemo")}</h2><ol className="mt-4 space-y-3 text-[14px] text-[var(--muted)]"><li>1. {t("collectorMemo1")}</li><li>2. {t("collectorMemo2")}</li><li>3. {t("collectorMemo3")}</li></ol></div>
        </aside>
      </div>

      {paying ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
        <div className="w-full max-w-[560px] rounded-[30px] bg-[var(--card)] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
          <h2 className="text-[28px] font-semibold tracking-[-0.06em]">{t("addPayment")}</h2>
          <p className="mt-2 text-[var(--muted)]">{paying.client?.fullName}</p>
          <label className="mt-5 block"><span className="premium-label">{t("amount")} ({paying.currency || "UZS"})</span><input className="premium-input" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="mt-4 block"><span className="premium-label">{t("paymentType")}</span><CustomSelect value={method} onChange={setMethod} options={[{ value: "CASH", label: t("cash") }, { value: "CARD", label: t("card") }, { value: "BANK", label: t("bank") }]} /></label>
          <div className="mt-6 flex justify-end gap-3"><button className="premium-button premium-button-soft" onClick={() => setPaying(null)}>{t("cancel")}</button><button className="premium-button premium-button-primary" onClick={savePayment}>{t("save")}</button></div>
        </div>
      </div> : null}
    </AppLayout>
  );
}

function extractProduct(comment?: string | null, currency?: string) { if (!comment) return currency || "—"; return comment.replace(/EXCEL_IMPORT:/gi, "").replace(/QARZ13:/gi, "").trim() || currency || "—"; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-4 whitespace-nowrap text-[28px] font-semibold tracking-[-0.06em]">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="soft-card p-4"><p className="premium-label mb-2">{label}</p><p className="text-[14px] text-[var(--text)]">{value}</p></div>; }
