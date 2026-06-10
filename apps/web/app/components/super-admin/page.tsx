"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiFetch } from "../lib/api";

type User = {
    id: string;
    fullName: string;
    phone: string;
    role: string;
    companyId: string;
};

type Company = {
    id: string;
    name: string;
    phone?: string;
    usdRate?: number;
    createdAt: string;
};

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);

    const a = digits.slice(0, 2);
    const b = digits.slice(2, 5);
    const c = digits.slice(5, 7);
    const d = digits.slice(7, 9);

    let result = "+998";
    if (a) result += ` ${a}`;
    if (b) result += ` ${b}`;
    if (c) result += ` ${c}`;
    if (d) result += ` ${d}`;

    return result;
}

export default function SuperAdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);

    const [companyName, setCompanyName] = useState("");
    const [companyPhone, setCompanyPhone] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;

        setUser(parsedUser);

        loadCompanies();
    }, []);

    async function loadCompanies() {
        const token = localStorage.getItem("token");

        const res = await apiFetch("/companies", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        setCompanies(data);
    }

    async function createCompanyOwner() {
        if (!companyName || !ownerName || !ownerPhone || !ownerPassword) {
            setMessage("Kompaniya, owner ism, telefon va parol majburiy");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await apiFetch("/auth/create-company-owner", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    companyName,
                    companyPhone: companyPhone || undefined,
                    fullName: ownerName,
                    phone: ownerPhone,
                    password: ownerPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Xatolik");
            }

            setCompanyName("");
            setCompanyPhone("");
            setOwnerName("");
            setOwnerPhone("");
            setOwnerPassword("");

            setMessage("Kompaniya va owner login muvaffaqiyatli yaratildi");

            await loadCompanies();
        } catch (err: any) {
            setMessage(err.message || "Xatolik");
        } finally {
            setLoading(false);
        }
    }

    if (user && user.role !== "SUPER_ADMIN") {
        return (
            <AppLayout title="Ruxsat yo‘q" subtitle="Bu sahifa faqat Operix admin uchun">
                <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-600">
                    Sizda Super Admin huquqi yo‘q.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Super Admin" subtitle="Operix kompaniyalari va owner loginlari">
            <div className="grid grid-cols-5 gap-5">
                <div className="col-span-2 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-[20px] font-semibold text-slate-950">
                        Yangi kompaniya
                    </h2>

                    <p className="mt-1 text-[13px] font-medium text-slate-400">
                        Kompaniya va uning owner loginini yarating
                    </p>

                    <div className="mt-6 space-y-3">
                        <input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Kompaniya nomi"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        />

                        <input
                            value={companyPhone}
                            onChange={(e) => setCompanyPhone(formatPhone(e.target.value))}
                            placeholder="Kompaniya telefoni"
                            inputMode="tel"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        />

                        <div className="pt-3">
                            <p className="mb-2 text-[13px] font-semibold text-slate-600">
                                Owner login
                            </p>

                            <div className="space-y-3">
                                <input
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="Owner ismi"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                                />

                                <input
                                    value={ownerPhone}
                                    onChange={(e) => setOwnerPhone(formatPhone(e.target.value))}
                                    placeholder=""
                                    inputMode="tel"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                                />

                                <input
                                    value={ownerPassword}
                                    onChange={(e) => setOwnerPassword(e.target.value)}
                                    placeholder="Parol"
                                    type="password"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                                />
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                            {message}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={createCompanyOwner}
                        disabled={loading}
                        className="mt-5 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                    >
                        {loading ? "Yaratilmoqda..." : "Kompaniya yaratish"}
                    </button>
                </div>

                <div className="col-span-3 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-[20px] font-semibold text-slate-950">
                        Kompaniyalar
                    </h2>

                    <p className="mt-1 text-[13px] font-medium text-slate-400">
                        Operix ichidagi barcha kompaniyalar
                    </p>

                    <div className="mt-5 divide-y divide-slate-100">
                        {companies.map((company) => (
                            <div
                                key={company.id}
                                className="flex items-center justify-between py-4"
                            >
                                <div>
                                    <p className="text-[15px] font-semibold text-slate-950">
                                        {company.name}
                                    </p>
                                    <p className="mt-1 text-[12px] font-medium text-slate-400">
                                        {company.phone || "-"} • USD rate:{" "}
                                        {Number(company.usdRate || 0).toLocaleString("ru-RU")}
                                    </p>
                                </div>

                                <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-600">
                                    ACTIVE
                                </span>
                            </div>
                        ))}

                        {companies.length === 0 && (
                            <div className="py-6 text-sm font-medium text-slate-400">
                                Kompaniya yo‘q
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}