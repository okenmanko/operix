"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatPhone(value: string) {
  let v = value.replace(/[^\d+]/g, "");

  if (!v.startsWith("+998")) {
    v = v.replace(/\D/g, "");
    if (v.startsWith("998")) v = "+" + v;
    else v = "+998" + v.replace(/^998/, "");
  }

  return v.slice(0, 13);
}

function setCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Login yoki parol noto‘g‘ri");
      }

      const token = data.token || data.accessToken;

      if (!token) {
        throw new Error("Token kelmadi. Backend auth response tekshirilsin.");
      }

      localStorage.setItem("operix_token", token);
      localStorage.setItem("token", token);
      localStorage.setItem("operix_user", JSON.stringify(data.user || {}));
      localStorage.setItem("operix_company", JSON.stringify(data.company || {}));

      setCookie("operix_token", token);

      const role = data.user?.role;

      if (role === "SUPER_ADMIN") {
        router.replace("/super-admin");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[480px] rounded-[28px] border border-slate-200 bg-white p-9 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <div className="h-6 w-6 rounded-lg bg-blue-500" />
        </div>

        <h1 className="text-3xl font-bold text-slate-950">Operix</h1>
        <p className="mt-3 text-base text-slate-500">
          Telegram-first Business OS
        </p>

        <div className="mt-9 space-y-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="+998881234567"
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-blue-500 text-base font-bold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? "Kirilmoqda..." : "Kirish"}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Operix CRM © 2026
        </p>
      </form>
    </main>
  );
}