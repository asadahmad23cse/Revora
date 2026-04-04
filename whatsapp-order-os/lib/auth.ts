/** Revora API base (browser + server). Override with NEXT_PUBLIC_REVORA_API_URL. */
export const API_BASE = (process.env.NEXT_PUBLIC_REVORA_API_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");

const TOKEN_KEY = "revora_token";
const BUSINESS_ID_KEY = "revora_business_id";

export function saveAuth(token: string, businessId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(BUSINESS_ID_KEY, businessId);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BUSINESS_ID_KEY);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BUSINESS_ID_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

/** Full URL for API paths (e.g. `/api/leads`) or returns absolute URLs unchanged. */
export function apiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/**
 * `fetch` wrapper: merges headers and adds `Authorization: Bearer` when a token exists.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  const headers = new Headers(init?.headers ?? undefined);
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}
