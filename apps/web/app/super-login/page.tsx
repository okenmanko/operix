"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, setCookie } from "../lib/api";

export default function SuperLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+998882962500");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/super-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, secretKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Super Admin login xato");
      }

      const token = data.token || data.accessToken;
      if (!token) throw new Error("Token kelmadi");

      localStorage.setItem("operix_token", token);
      localStorage.setItem("operix_user", JSON.stringify(data.user || {}));
      localStorage.setItem("operix_company", JSON.stringify(data.company || {}));
      setCookie("operix_token", token, 1);

      router.replace("/super-admin");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[500px] rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
      >
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
          <div className="h-7 w-7 rounded-xl bg-red-500" />
        </div>

        <h1 className="text-4xl font-bold text-slate-950">Super Admin</h1>
        <p className="mt-3 text-base font-medium text-slate-500">
          Operix master panel
        </p>

        <div className="mt-9 space-y-4">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998..."
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
          />

          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Master secret key"
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
          />

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-red-500 text-base font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Tekshirilmoqda..." : "Super Admin kirish"}
          </button>
        </div>
      </form>
    </main>
  );
}
