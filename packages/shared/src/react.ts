import { useState, useRef, useEffect, useCallback } from "react";
import { browserRequest, getBrowserToken, scopedStorageKey } from "./browser.js";

export function useDialogAccessibility(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el => el.getClientRects().length);
    (focusable()[0] || dialog).focus();
    const keydown = (event: KeyboardEvent) => {
      const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')];
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== "Tab") return;
      const controls = focusable(), first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey ? document.activeElement === first || !dialog.contains(document.activeElement) : document.activeElement === last || !dialog.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    };
    document.addEventListener("keydown", keydown, true);
    return () => { document.removeEventListener("keydown", keydown, true); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}

export function useAntiSpamAction<T, R>(actionPrefix: string, action: (payload: T, key: string) => Promise<R>, cooldownMs = 800) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lock = useRef(false);
  const last = useRef(0);
  const retry = useRef<{ payload: string; key: string } | null>(null);
  const execute = async (payload: T): Promise<R | null> => {
    if (lock.current || Date.now() - last.current < cooldownMs) return null;
    lock.current = true; last.current = Date.now(); setIsSubmitting(true);
    const signature = JSON.stringify(payload);
    if (!retry.current || retry.current.payload !== signature) retry.current = { payload: signature, key: actionPrefix + ":" + crypto.randomUUID() };
    try { const result = await action(payload, retry.current.key); retry.current = null; return result; }
    finally { lock.current = false; setIsSubmitting(false); }
  };
  return { execute, isSubmitting };
}

export function useResource<T>(path: string | null, fallback: T, intervalMs = 10000) {
  const initial = useRef(fallback);
  const key = scopedStorageKey(path || "disabled");
  const [state, setState] = useState({ key, value: initial.current });
  const [error, setError] = useState<Error | null>(null);
  const active = useRef(0);
  const refresh = useCallback(async () => {
    if (!path || !getBrowserToken()) return initial.current;
    const revision = ++active.current;
    try {
      const value = await browserRequest<T>(path);
      if (revision === active.current) { setState({ key, value }); setError(null); }
      return value;
    } catch (caught) {
      if (revision === active.current) setError(caught instanceof Error ? caught : new Error("Không thể tải dữ liệu"));
      throw caught;
    }
  }, [path, key]);
  useEffect(() => {
    const load = () => { void refresh().catch(() => undefined); };
    load();
    const timer = intervalMs > 0 ? setInterval(load, intervalMs) : undefined;
    window.addEventListener("a2order:data", load);
    return () => { active.current++; if (timer) clearInterval(timer); window.removeEventListener("a2order:data", load); };
  }, [refresh, intervalMs]);
  return [state.key === key ? state.value : initial.current, refresh, error] as const;
}
