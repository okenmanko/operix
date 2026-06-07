"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatUzPhone(value: string) {
  let digits = onlyDigits(value);

  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.startsWith("8")) digits = digits.slice(1);

  digits = digits.slice(0, 9);

  const operator = digits.slice(0, 2);
  const first = digits.slice(2, 5);
  const second = digits.slice(5, 7);
  const third = digits.slice(7, 9);

  let result = "+998";
  if (operator) result += ` ${operator}`;
  if (first) result += ` ${first}`;
  if (second) result += ` ${second}`;
  if (third) result += ` ${third}`;

  return result;
}

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login xatosi");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = `operix_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login xatosi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-6">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
            <div className="h-5 w-5 rounded-md bg-[#3B82F6]" />
          </div>

          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-950">
            Operix
          </h1>

          <p className="mt-2 text-[14px] font-medium text-slate-400">
            Telegram-first Business OS
          </p>
        </div>

        <div className="space-y-4">
          <input
            value={phone}
            onChange={(e) => setPhone(formatUzPhone(e.target.value))}
            placeholder="+998 91 000 00 00"
            inputMode="tel"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3B82F6]"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={login}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-[#3B82F6] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>

        <p className="mt-6 text-center text-[12px] font-medium text-slate-400">
          Operix CRM © 2026
        </p>
      </div>
    </div>
  );
}