import React, { useState } from "react";
import { useDialogAccessibility } from "@a2order/shared/react";
import { UnifiedAuthModalProps } from "@/types";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { Button, Icon } from "@/components/ui";

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({ isOpen, onPinSubmit, onAdminLogin, onClose }) => {
  const dialogRef = useDialogAccessibility(isOpen, onClose);
  const [mode, setMode] = useState<"pin" | "account">("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;

  const digit = async (value: string) => {
    if (busy || pin.length >= 6) return;
    const next = pin + value;
    setPin(next);
    if (next.length !== 6) return;
    setBusy(true);
    try { await onPinSubmit(next); }
    finally { setPin(""); setBusy(false); }
  };

  const submitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !onAdminLogin) return;
    setBusy(true);
    try { await onAdminLogin(email, password); }
    finally { setBusy(false); }
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Đổi ca đăng nhập" tabIndex={-1} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-primary/60 sm:p-4">
      <div className="w-full max-w-md max-h-[100dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-surface-border bg-surface-card p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div><h2 className="text-xl font-extrabold text-ink-primary">Đổi ca đăng nhập</h2><p className="text-sm text-ink-muted">Nhập mã của nhân viên tiếp theo</p></div>
          <button type="button" onClick={onClose} className="size-11 shrink-0 rounded-2xl border border-surface-border flex items-center justify-center" aria-label="Đóng"><Icon name="x" size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-surface-border bg-surface-canvas p-1 mb-5">
          <button type="button" onClick={() => setMode("pin")} className={`h-11 rounded-xl text-sm font-bold ${mode === "pin" ? "bg-brand-900 text-white" : "text-ink-muted"}`}>Mã PIN</button>
          <button type="button" onClick={() => setMode("account")} className={`h-11 rounded-xl text-sm font-bold ${mode === "account" ? "bg-brand-900 text-white" : "text-ink-muted"}`}>Tài khoản</button>
        </div>
        {mode === "pin" ? <div className="space-y-4">
          <p className="text-center text-sm text-ink-muted">Nhập mã PIN 6 số của bạn</p>
          <div className="flex justify-center gap-2.5" aria-label={`${pin.length} trên 6 số đã nhập`}>{Array.from({ length: 6 }, (_, index) => <span key={index} className={`size-3.5 rounded-full border ${index < pin.length ? "bg-brand-900 border-brand-900" : "bg-surface-canvas border-surface-border"}`} />)}</div>
          <NumericKeypad variant="classic" onDigitPress={digit} onDeletePress={() => setPin(value => value.slice(0, -1))} onClearPress={() => setPin("")} />
          {busy && <p role="status" className="text-center text-sm text-ink-muted">Đang xác thực...</p>}
        </div> : <form onSubmit={submitAccount} className="space-y-4">
          <label className="block text-sm font-bold">Email<input type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full h-12 rounded-2xl border border-surface-border px-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-800/20" /></label>
          <label className="block text-sm font-bold">Mật khẩu<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full h-12 rounded-2xl border border-surface-border px-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-800/20" /></label>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Đang xác thực..." : "Đăng nhập"}</Button>
        </form>}
      </div>
    </div>
  );
};
