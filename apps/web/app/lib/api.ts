"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type StoredUser = {
  id?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  isSuperAdmin?: boolean;
};

export function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const target = `${encodeURIComponent(name)}=`;
  const found = document.cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(target));
  return found ? decodeURIComponent(found.slice(target.length)) : "";
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("operix_token") || localStorage.getItem("token") || getCookie("operix_token") || "";
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("operix_token", token);
  setCookie("operix_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("operix_token");
  localStorage.removeItem("token");
  localStorage.removeItem("operix_user");
  deleteCookie("operix_token");
}

export function setStoredUser(user: StoredUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem("operix_user");
    return;
  }
  localStorage.setItem("operix_user", JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("operix_user");
  if (raw) {
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      localStorage.removeItem("operix_user");
    }
  }

  const role = localStorage.getItem("operix_role") || localStorage.getItem("role") || "";
  if (role) return { role };

  return null;
}

export async function apiJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(`API ulanmagan. API serverni tekshir: ${API_URL}`);
  }

  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "object"
        ? data?.message || data?.error || `Server xatosi: ${res.status}`
        : data || `Server xatosi: ${res.status}`;

    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  return data as T;
}

export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });
  } catch {
    throw new Error(`API ulanmagan. API serverni tekshir: ${API_URL}`);
  }

  const text = await res.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "object"
        ? data?.message || data?.error || `Server xatosi: ${res.status}`
        : data || `Server xatosi: ${res.status}`;

    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  return data as T;
}

export async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(`API ulanmagan. API serverni tekshir: ${API_URL}`);
  }

  if (!res.ok) throw new Error("Fayl yuklanmadi");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

export function num(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString("ru-RU") : "0";
}

export function money(value: number | string | null | undefined, currency = "UZS") {
  return `${num(value)} ${currency}`;
}

export function dateText(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ru-RU");
}
