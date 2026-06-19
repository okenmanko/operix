"use client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export type StoredUser = {
  id?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  isSuperAdmin?: boolean;
  [key: string]: any;
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
    .map((item) => item.trim())
    .find((item) => item.startsWith(target));

  return found ? decodeURIComponent(found.slice(target.length)) : "";
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("operix_token") ||
    localStorage.getItem("token") ||
    getCookie("operix_token") ||
    getCookie("token") ||
    ""
  );
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("operix_token", token);
  localStorage.setItem("token", token);
  setCookie("operix_token", token);
  setCookie("token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;

  [
    "operix_token",
    "token",
    "operix_user",
    "operix_role",
    "role",
    "super_admin_token",
    "operix_super_token",
    "operix_super_admin",
    "super_admin_key",
  ].forEach((key) => localStorage.removeItem(key));

  deleteCookie("operix_token");
  deleteCookie("token");
}

export function clearAuth() {
  clearToken();
}

export function logout(redirectTo = "/login") {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}

export function setStoredUser(user: StoredUser | null) {
  if (typeof window === "undefined") return;

  if (!user) {
    localStorage.removeItem("operix_user");
    return;
  }

  localStorage.setItem("operix_user", JSON.stringify(user));

  if (user.role) {
    localStorage.setItem("operix_role", user.role);
    localStorage.setItem("role", user.role);
  }
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

function makeUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function makeHeaders(options: RequestInit = {}, isJson = true) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (isJson && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
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
      typeof data === "object" && data
        ? data.message || data.error || `Server xatosi: ${res.status}`
        : data || `Server xatosi: ${res.status}`;

    throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
  }

  return data as T;
}

export async function apiJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(makeUrl(path), {
      ...options,
      credentials: "include",
      headers: makeHeaders(options, true),
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("So‘rov bekor qilindi yoki vaqt tugadi. Background sync davom etishi mumkin. Historyni yangilang.");
    }
    throw new Error(`API ulanmagan. API serverni tekshir: ${API_URL}`);
  }

  return parseResponse<T>(res);
}

// Backward compatibility with older pages/components.
export const apiFetch = apiJson;
export const api = apiJson;
export const request = apiJson;

export async function apiGet<T = any>(path: string) {
  return apiJson<T>(path, { method: "GET" });
}

export async function apiPost<T = any>(path: string, body?: any) {
  return apiJson<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiPatch<T = any>(path: string, body?: any) {
  return apiJson<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiDelete<T = any>(path: string) {
  return apiJson<T>(path, { method: "DELETE" });
}

export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;

  try {
    res = await fetch(makeUrl(path), {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("So‘rov bekor qilindi yoki vaqt tugadi. Background sync davom etishi mumkin. Historyni yangilang.");
    }
    throw new Error(`API ulanmagan. API serverni tekshir: ${API_URL}`);
  }

  return parseResponse<T>(res);
}

export async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;

  try {
    res = await fetch(makeUrl(path), {
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
  return Number.isFinite(n) ? n.toLocaleString("ru-RU").replace(/\s/g, " ") : "0";
}

export function money(value: number | string | null | undefined, currency = "UZS") {
  return `${num(value)} ${currency}`;
}

export function formatMoney(value: number | string | null | undefined, currency = "UZS") {
  return money(value, currency);
}

export function formatNumber(value: number | string | null | undefined) {
  return num(value);
}

export function dateText(value: string | Date | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ru-RU");
}

export function formatDate(value: string | Date | null | undefined) {
  return dateText(value);
}
