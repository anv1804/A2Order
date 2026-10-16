import { configureApi, browserRequest } from "@a2order/shared";
export const API_BASE_URL = configureApi((import.meta as any).env?.VITE_API_URL);
export const requestApi = browserRequest;
