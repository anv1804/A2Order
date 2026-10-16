import { useState, useEffect, useCallback, useRef } from "react";
import type { SetStateAction } from "react";
import { getAuthUser, scopedStorageKey } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { toast } from "@/stores/notificationStore";
import type { WorkspaceCache, DocumentResponse } from "@/types/persistence.types";

const documents = new Set(["customers_data", "loyalty_rules", "crm_campaigns", "inventory_ingredients", "inventory_receipts", "inventory_recipes", "reservations_data", "promotions_list", "hardware_printers", "hardware_template", "delivery_channels", "attendance_logs", "calendar_notes"]);
const queues = new Map<string, Promise<unknown>>();

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: SetStateAction<T>) => Promise<boolean>] {
  const storageKey = scopedStorageKey(key);
  const initial = useRef(initialValue);
  const [cached, setCached] = useState<WorkspaceCache<T>>(() => {
    if (documents.has(key)) return { key: storageKey, value: initial.current };
    try { const raw = localStorage.getItem(storageKey); return { key: storageKey, value: raw === null ? initial.current : JSON.parse(raw) }; }
    catch { return { key: storageKey, value: initial.current }; }
  });
  const latest = useRef({ key: storageKey, value: cached.value, version: 0, loaded: false });
  if (latest.current.key !== storageKey) latest.current = { key: storageKey, value: initial.current, version: 0, loaded: false };
  const load = useCallback(async () => {
    const storeId = getAuthUser()?.storeId;
    if (!storeId || !documents.has(key)) return;
    const data = await requestApi<DocumentResponse<T>>("/workspace/" + encodeURIComponent(storeId) + "/" + key);
    if (latest.current.key !== storageKey || data.version < latest.current.version) return;
    latest.current = { key: storageKey, value: data.value ?? initial.current, version: data.version, loaded: true };
    setCached({ key: storageKey, value: latest.current.value });
  }, [key, storageKey]);

  useEffect(() => {
    if (documents.has(key)) { void load().catch(error => toast.error(error.message)); }
    else {
      let value = initial.current;
      try { const raw = localStorage.getItem(storageKey); if (raw !== null) value = JSON.parse(raw); } catch { /* Empty cache is valid. */ }
      latest.current = { key: storageKey, value, version: 0, loaded: true };
      setCached({ key: storageKey, value });
    }
    const refresh = () => { if (documents.has(key)) void load().catch(() => undefined); };
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey || documents.has(key)) return;
      try { const value = event.newValue === null ? initial.current : JSON.parse(event.newValue); latest.current.value = value; setCached({ key: storageKey, value }); } catch { /* Invalid cache is ignored. */ }
    };
    window.addEventListener("a2order:data", refresh);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("a2order:data", refresh); window.removeEventListener("storage", sync); };
  }, [key, storageKey, load]);

  const setValue = useCallback((action: SetStateAction<T>): Promise<boolean> => {
    const previous = queues.get(storageKey) || Promise.resolve();
    const task = previous.catch(() => undefined).then(async () => {
      if (latest.current.key !== storageKey) return false;
      try {
        if (documents.has(key) && !latest.current.loaded) await load();
        const value = typeof action === "function" ? (action as (previous: T) => T)(latest.current.value) : action;
        if (documents.has(key)) {
          const storeId = getAuthUser()?.storeId;
          if (!storeId) throw new Error("Phiên đăng nhập đã kết thúc");
          const result = await requestApi<DocumentResponse<T>>("/workspace/" + encodeURIComponent(storeId) + "/" + key, { method: "PUT", body: JSON.stringify({ value, version: latest.current.version }) });
          if (latest.current.key !== storageKey) return false;
          latest.current.version = result.version;
          latest.current.loaded = true;
        } else localStorage.setItem(storageKey, JSON.stringify(value));
        latest.current.value = value;
        setCached({ key: storageKey, value });
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể lưu dữ liệu");
        if (documents.has(key)) await load().catch(() => undefined);
        return false;
      }
    });
    queues.set(storageKey, task);
    void task.finally(() => { if (queues.get(storageKey) === task) queues.delete(storageKey); });
    return task;
  }, [key, storageKey, load]);
  return [cached.key === storageKey ? cached.value : initial.current, setValue];
}
