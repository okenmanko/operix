"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("operix_token") || "";
}

export function setCookie(name: string, value: string, days = 7) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("operix_token");
  localStorage.removeItem("operix_user");
  localStorage.removeItem("operix_company");
  document.cookie = "operix_token=; path=/; max-age=0; SameSite=Lax";
}

export async function apiJson<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || "Server xatosi");
  }

  return data;
}

export function money(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("uz-UZ").format(n);
}
