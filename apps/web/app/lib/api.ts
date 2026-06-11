export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("operix_token") || localStorage.getItem("token");
}

function cleanPath(path: string) {
  return path.split("?")[0];
}

function isListPath(path: string) {
  const clean = cleanPath(path);
  return [
    "/clients",
    "/debts",
    "/payments",
    "/reports",
    "/users",
    "/delivery",
    "/inventory/products",
    "/inventory/warehouses",
    "/inventory/items",
    "/inventory/movements",
    "/cashflow",
    "/qr/items",
    "/qr/labels",
    "/super-admin/plans",
    "/super-admin/companies",
    "/super-admin/modules",
  ].includes(clean);
}

function unwrapList(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.clients)) return data.clients;
  if (Array.isArray(data?.debts)) return data.debts;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.warehouses)) return data.warehouses;
  if (Array.isArray(data?.movements)) return data.movements;
  if (Array.isArray(data?.cashflows)) return data.cashflows;
  if (Array.isArray(data?.plans)) return data.plans;
  if (Array.isArray(data?.companies)) return data.companies;
  if (Array.isArray(data?.modules)) return data.modules;
  if (Array.isArray(data?.labels)) return data.labels;
  return [];
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

export async function apiJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "API error");
  }

  const method = String(options.method || "GET").toUpperCase();
  if (method === "GET" && isListPath(path)) return unwrapList(data) as T;
  return data as T;
}

export function asArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : unwrapList(value);
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("operix_token");
  localStorage.removeItem("operix_user");
  localStorage.removeItem("operix_company");
  localStorage.removeItem("token");
  document.cookie = "operix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  window.location.href = "/login";
}

export const api = apiFetch;
