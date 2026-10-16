export interface BrowserAuthUser {
  id: string;
  name: string;
  role: string;
  storeId: string;
  email?: string | null;
  storeName?: string | null;
  phone?: string;
  address?: string;
  slug?: string;
}

export interface BrowserAuth {
  token: string;
  user: BrowserAuthUser;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

let apiBase = "/api";
const pendingWrites = new Map<string, Promise<unknown>>();
const retryKeys = new Map<string, { key: string; createdAt: number }>();

export function configureApi(url?: string) {
  const host = typeof window !== "undefined" ? window.location : null;
  apiBase = url || (host && ["3000", "3001", "3002"].includes(host.port) ? host.protocol + "//" + host.hostname + ":4000/api" : "/api");
  if (host && !["localhost", "127.0.0.1"].includes(host.hostname)) apiBase = apiBase.replace(/localhost|127\.0\.0\.1/, host.hostname);
  apiBase = apiBase.replace(/\/$/, "");
  return apiBase;
}

export function readAuth(): BrowserAuth | null {
  if (typeof window === "undefined") return null;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const token = storage.getItem("a2order_auth_token");
      const raw = storage.getItem("a2order_auth_user");
      if (token && raw) { const user = JSON.parse(raw); if (user?.id && user?.storeId && user?.role) return { token, user }; }
    } catch { /* Corrupt cached sessions never grant access. */ }
  }
  return null;
}

export function getAuthUser() { return readAuth()?.user || null; }

export function saveAuth(user: BrowserAuthUser, token: string, remember = false) {
  clearAuth(false);
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem("a2order_auth_token", token);
  storage.setItem("a2order_auth_user", JSON.stringify(user));
  window.dispatchEvent(new Event("a2order:auth"));
}

export function clearAuth(notify = true) {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) for (const key of ["a2order_auth_token", "a2order_auth_user", "auth_user", "a2order_current_user", "user", "a2order_client_active_staff"]) storage.removeItem(key);
  pendingWrites.clear(); retryKeys.clear();
  if (notify) window.dispatchEvent(new Event("a2order:auth"));
}

export function customerStorageKey(kind: "token" | "request", storeId: string, tableCode: string) { return "a2order_customer_" + kind + ":" + storeId + ":" + tableCode; }
export function saveCustomerToken(storeId: string, tableCode: string, token: string) { window.sessionStorage.setItem(customerStorageKey("token", storeId, tableCode), token); window.dispatchEvent(new Event("a2order:auth")); }
export function clearCustomerToken(storeId: string, tableCode: string) { window.sessionStorage.removeItem(customerStorageKey("token", storeId, tableCode)); window.sessionStorage.removeItem(customerStorageKey("request", storeId, tableCode)); window.dispatchEvent(new Event("a2order:auth")); }
export function getBrowserToken() {
  if (typeof window === "undefined") return "";
  if (window.location.pathname.startsWith("/order")) {
    const query = new URLSearchParams(window.location.search);
    return window.sessionStorage.getItem(customerStorageKey("token", query.get("store") || "", query.get("table") || "")) || "";
  }
  return readAuth()?.token || "";
}

export function notifyDataChange(endpoint = "") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("a2order:data", { detail: { endpoint } }));
}

export async function browserRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  const method = (options.method || "GET").toUpperCase();
  const writing = !["GET", "HEAD", "OPTIONS"].includes(method);
  const signature = scopedStorageKey(getBrowserToken().slice(-16)) + ":" + method + ":" + path + ":" + String(options.body || "");
  if (writing && pendingWrites.has(signature)) return pendingWrites.get(signature) as Promise<T>;
  const execute = async (): Promise<T> => {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
    const token = getBrowserToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
    if (typeof window !== "undefined") {
      let clientId = window.sessionStorage.getItem("a2order_client_id");
      if (!clientId) { clientId = crypto.randomUUID(); window.sessionStorage.setItem("a2order_client_id", clientId); }
      headers.set("x-client-id", clientId);
      if (window.location.pathname.startsWith("/order")) {
        const query = new URLSearchParams(window.location.search);
        const proof = window.sessionStorage.getItem(customerStorageKey("request", query.get("store") || "", query.get("table") || ""));
        if (proof) headers.set("x-session-request", proof);
      }
    }
    if (writing && !headers.has("x-idempotency-key")) {
      for (const [id, record] of retryKeys) if (Date.now() - record.createdAt > 600000) retryKeys.delete(id);
      const record = retryKeys.get(signature) || { key: crypto.randomUUID(), createdAt: Date.now() };
      if (retryKeys.size < 1000) retryKeys.set(signature, record);
      headers.set("x-idempotency-key", record.key);
    }
    let response: Response;
    try { response = await fetch(apiBase + path, { ...options, headers, signal: options.signal || AbortSignal.timeout(20000) }); }
    catch { throw new ApiError("Chưa nhận được xác nhận từ máy chủ. Có thể thử lại an toàn.", 0, "NETWORK_ERROR"); }
    if (response.status === 204 || response.status === 304) return null as T;
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.success === false) {
      if (response.status < 500) retryKeys.delete(signature);
      if (response.status === 401 && getBrowserToken() === token && !path.startsWith("/auth/login")) {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/order")) { const q = new URLSearchParams(window.location.search); clearCustomerToken(q.get("store") || "", q.get("table") || ""); }
        else clearAuth();
      }
      throw new ApiError(json?.error || json?.message || "Không thể hoàn tất yêu cầu", response.status, json?.code);
    }
    if (writing) { retryKeys.delete(signature); notifyDataChange(path); }
    return (json?.data !== undefined ? json.data : json) as T;
  };
  const result = execute();
  if (writing) {
    pendingWrites.set(signature, result);
    void result.finally(() => pendingWrites.delete(signature)).catch(() => undefined);
  }
  return result;
}

export function scopedStorageKey(key: string) {
  const auth = readAuth();
  return "a2order:v2:" + (auth?.user.storeId || "signed-out") + ":" + (auth?.user.id || "anonymous") + ":" + key;
}
