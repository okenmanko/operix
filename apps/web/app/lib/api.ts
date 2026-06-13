"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("operix_token") || "";
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("operix_user") || "null");
  } catch {
    return null;
  }
}

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${days * 86400}; SameSite=Lax`;
}

export function saveAuth(data: any) {
  if (typeof window === "undefined") return;
  if (data?.token) {
    localStorage.setItem("operix_token", data.token);
    setCookie("operix_token", data.token);
  }
  if (data?.user) localStorage.setItem("operix_user", JSON.stringify(data.user));
  if (data?.company) localStorage.setItem("operix_company", JSON.stringify(data.company));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("operix_token");
  localStorage.removeItem("operix_user");
  localStorage.removeItem("operix_company");
  document.cookie = "operix_token=; path=/; max-age=0; SameSite=Lax";
}

export async function apiJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {
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
  if (!res.ok) throw new Error(data?.message || data?.error || "Server xatosi");
  return data as T;
}

export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || data?.error || "Server xatosi");
  return data as T;
}

export async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error("Fayl yuklanmadi");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function num(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("ru-RU");
}

export function money(value: number | string | null | undefined, currency = "UZS") {
  return `${num(value)} ${currency}`;
}

export function dateText(value: string | Date | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return "—";
  }
}
