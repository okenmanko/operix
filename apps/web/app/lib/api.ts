export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("operix_token") ||
    localStorage.getItem("token") ||
    getCookie("operix_token")
  );
}

function isListPath(path: string) {
  const clean = path.split("?")[0];

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

  return [];
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export async function apiJson<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "API error");
  }

  const method = String(options.method || "GET").toUpperCase();

  if (method === "GET" && isListPath(path)) {
    return unwrapList(data) as T;
  }

  return data as T;
}

export function asArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : unwrapList(value);
}

export const api = apiFetch;

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("operix_token");
  localStorage.removeItem("operix_user");
  localStorage.removeItem("operix_company");
  localStorage.removeItem("token");

  document.cookie =
    "operix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

  window.location.href = "/login";
}
