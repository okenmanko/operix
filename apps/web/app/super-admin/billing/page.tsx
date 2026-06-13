"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson, dateText, money } from "../../lib/api";
import {
  Button,
  Card,
  Company,
  Input,
  PageTop,
  Select,
  StatusBadge,
  SuperAdminShell,
  Toast,
} from "../_components";

type Payment = {
  id: string;
  amountUZS: number;
  paidAt: string;
  method?: string | null;
  comment?: string | null;
  company?: Company;
  companyId?: string;
};

export default function BillingPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [amountUZS, setAmountUZS] = useState("");
  const [method, setMethod] = useState("CASH");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [companiesData, paymentsData] = await Promise.all([
        apiJson<Company[]>("/super-admin/companies"),
        apiJson<Payment[]>("/super-admin/billing/payments"),
      ]);

      const safeCompanies = Array.isArray(companiesData) ? companiesData : [];
      setCompanies(safeCompanies);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      if (!companyId && safeCompanies[0]?.id) setCompanyId(safeCompanies[0].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Billing yuklanmadi");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyOptions = useMemo(
    () => companies.map((company) => ({ value: company.id, label: company.name })),
    [companies],
  );

  async function createPayment() {
    try {
      setError("");
      await apiJson("/super-admin/billing/payments", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          amountUZS: Number(amountUZS || 0),
          method,
          comment,
        }),
      });

      setAmountUZS("");
      setComment("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lov saqlanmadi");
    }
  }

  return (
    <SuperAdminShell>
      <PageTop title="Billing" subtitle="Kompaniya obunalari, tarif narxlari va to‘lovlar." />
      {error ? <Toast>{error}</Toast> : null}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-[12px] uppercase tracking-[0.16em] text-[#8aa0ba]">Monthly MRR</p>
          <p className="mt-2 text-[30px] tracking-[-0.05em]">
            {money(companies.reduce((sum, company) => sum + Number(company.monthlyPriceUZS || 0), 0), "UZS")}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[12px] uppercase tracking-[0.16em] text-[#8aa0ba]">Payments</p>
          <p className="mt-2 text-[30px] tracking-[-0.05em]">{payments.length} ta</p>
        </Card>
        <Card className="p-5">
          <p className="text-[12px] uppercase tracking-[0.16em] text-[#8aa0ba]">Active clients</p>
          <p className="mt-2 text-[30px] tracking-[-0.05em]">
            {companies.filter((company) => company.status === "ACTIVE").length} ta
          </p>
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <h2 className="text-[24px] font-normal tracking-[-0.04em]">To‘lov qo‘shish</h2>
        <div className="mt-5 grid grid-cols-5 gap-4">
          <Select label="Kompaniya" value={companyId} onChange={setCompanyId} options={companyOptions} />
          <Input label="Amount UZS" value={amountUZS} onChange={setAmountUZS} />
          <Select label="Method" value={method} onChange={setMethod} options={["CASH", "CARD", "TRANSFER"]} />
          <Input label="Comment" value={comment} onChange={setComment} />
          <div className="flex items-end">
            <Button onClick={createPayment} className="w-full">Saqlash</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[24px] font-normal tracking-[-0.04em]">Payment history</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Kompaniya</th>
                <th className="p-4 font-normal">Sana</th>
                <th className="p-4 font-normal">Summa</th>
                <th className="p-4 font-normal">Method</th>
                <th className="p-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-[#edf2f7]">
                  <td className="p-4">
                    {payment.company?.name || companies.find((company) => company.id === payment.companyId)?.name || "—"}
                  </td>
                  <td className="p-4 text-[#64748b]">{dateText(payment.paidAt)}</td>
                  <td className="p-4">{money(payment.amountUZS, "UZS")}</td>
                  <td className="p-4 text-[#64748b]">{payment.method || "—"}</td>
                  <td className="p-4"><StatusBadge status="ACTIVE" /></td>
                </tr>
              ))}

              {!payments.length ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#8aa0ba]">
                    To‘lov yo‘q
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </SuperAdminShell>
  );
}
