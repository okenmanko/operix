"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, dateText } from "../lib/api";

type Employee = { id: string; fullName: string; phone?: string | null; position?: string | null; salary?: number | null; status: string };
type Attendance = { id: string; date: string; status: string; employee?: Employee };
type SalaryPayment = { id: string; amount: number; paidAt: string; employee?: Employee };

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [e, a, s] = await Promise.all([
        apiJson<Employee[]>("/hr/employees"),
        apiJson<Attendance[]>("/hr/attendance"),
        apiJson<SalaryPayment[]>("/hr/salary-payments"),
      ]);
      setEmployees(Array.isArray(e) ? e : []);
      setAttendance(Array.isArray(a) ? a : []);
      setSalaryPayments(Array.isArray(s) ? s : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "HR yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  async function createEmployee() {
    try {
      await apiJson("/hr/employees", {
        method: "POST",
        body: JSON.stringify({ fullName, phone, position, salary: Number(salary || 0) }),
      });
      setFullName("");
      setPhone("");
      setPosition("");
      setSalary("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hodim saqlanmadi");
    }
  }

  return (
    <AppLayout title="HR" subtitle="Hodimlar, attendance va oylik to‘lovlari.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Hodimlar" value={employees.length} />
        <Stat label="Attendance" value={attendance.length} />
        <Stat label="Salary payments" value={salaryPayments.length} />
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">Hodim qo‘shish</h2>
        <div className="mt-5 grid grid-cols-5 gap-4">
          <Input label="Ism" value={fullName} onChange={setFullName} />
          <Input label="Telefon" value={phone} onChange={setPhone} />
          <Input label="Lavozim" value={position} onChange={setPosition} />
          <Input label="Oylik" value={salary} onChange={setSalary} />
          <div className="flex items-end"><button onClick={createEmployee} className="premium-button premium-button-primary w-full">Saqlash</button></div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <Table title="Hodimlar">
          {employees.map((e) => <tr key={e.id} className="border-t border-[#edf2f7]"><td className="p-4">{e.fullName}</td><td className="p-4 text-[#64748b]">{e.position || "—"}</td><td className="p-4">{money(e.salary, "UZS")}</td></tr>)}
          {!employees.length ? <Empty colSpan={3} /> : null}
        </Table>

        <Table title="Oylik to‘lovlari">
          {salaryPayments.map((s) => <tr key={s.id} className="border-t border-[#edf2f7]"><td className="p-4">{s.employee?.fullName || "—"}</td><td className="p-4">{money(s.amount, "UZS")}</td><td className="p-4 text-[#64748b]">{dateText(s.paidAt)}</td></tr>)}
          {!salaryPayments.length ? <Empty colSpan={3} /> : null}
        </Table>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="premium-card p-5"><p className="text-[12px] uppercase tracking-[0.12em] text-[#8aa0ba]">{label}</p><p className="mt-3 text-[28px] tracking-[-0.04em]">{value}</p></div>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="premium-label">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="premium-input" /></label>;
}

function Table({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="premium-card p-6"><h2 className="text-[22px] font-normal tracking-[-0.04em]">{title}</h2><div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]"><table className="w-full text-left text-[14px]"><tbody>{children}</tbody></table></div></div>;
}

function Empty({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center text-[#8aa0ba]">Ma’lumot yo‘q</td></tr>;
}
