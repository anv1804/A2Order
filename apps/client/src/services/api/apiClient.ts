export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export async function requestApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.error || json?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return (json?.data !== undefined ? json.data : json) as T;
  } catch (error: any) {
    console.warn(`[A2Order API] Request failed: ${url}`, error.message);
    throw error;
  }
}
