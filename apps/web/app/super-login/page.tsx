"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, setCookie, setStoredUser, setToken } from "../lib/api";

export default function SuperLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("+998882962500");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await apiJson<any>("/auth/super-login", {
        method: "POST",
        body: JSON.stringify({ phone, password, masterKey, secretKey: masterKey }),
      });

      const token = data?.accessToken || data?.token || data?.jwt || "";
      if (token) setToken(token);

      const user = data?.user || { phone, role: "SUPER_ADMIN", isSuperAdmin: true };

      setStoredUser({ ...user, role: "SUPER_ADMIN", isSuperAdmin: true });
      setCookie("operix_super_admin", "true");
      setCookie("operix_role", "SUPER_ADMIN");

      if (typeof window !== "undefined") {
        localStorage.setItem("operix_role", "SUPER_ADMIN");
        localStorage.setItem("operix_super_admin", "true");
      }

      router.push("/super-admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Super admin login xatosi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-10">
      <div className="mx-auto mt-8 w-full max-w-[560px] rounded-[34px] border border-[#dfe8f3] bg-white p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mb-9">
          <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center rounded-[26px] bg-red-50">
            <span className="block h-8 w-8 rounded-full bg-red-500" />
          </div>
          <h1 className="text-[40px] font-semibold tracking-[-0.06em] text-[#0f172a]">Super Admin</h1>
          <p className="mt-2 text-[16px] text-[#64748b]">Operix master panel</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-[62px] w-full rounded-[18px] border border-[#dfe8f3] bg-white px-6 text-[16px] text-[#0f172a] outline-none" placeholder="Telefon" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="h-[62px] w-full rounded-[18px] border border-[#dfe8f3] bg-white px-6 text-[16px] text-[#0f172a] outline-none" placeholder="Parol" type="password" />
          <input value={masterKey} onChange={(e) => setMasterKey(e.target.value)} className="h-[62px] w-full rounded-[18px] border border-[#dfe8f3] bg-white px-6 text-[16px] text-[#0f172a] outline-none" placeholder="Master key" type="password" />
          {error ? <div className="rounded-[18px] bg-red-50 px-5 py-4 text-[14px] font-medium text-red-600">{error}</div> : null}
          <button type="submit" disabled={loading} className="h-[64px] w-full rounded-[18px] bg-red-500 text-[16px] font-semibold text-white disabled:opacity-60">
            {loading ? "Kirilmoqda..." : "Super Admin kirish"}
          </button>
        </form>
      </div>
    </main>
  );
}
