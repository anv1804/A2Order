import React, { useState, useEffect } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { TenantStoreRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface SuspendStoreModalProps {
  store: TenantStoreRecord | null;
  mode: "SUSPEND" | "ACTIVATE";
  onClose: () => void;
  onConfirm: (store: TenantStoreRecord) => void;
}

export const SuspendStoreModal: React.FC<SuspendStoreModalProps> = ({
  store,
  mode,
  onClose,
  onConfirm,
}) => {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset state when store or mode changes
  useEffect(() => {
    setConfirmationInput("");
    setCopied(false);
  }, [store?.id, mode]);

  if (!store) return null;

  const requiredCode =
    store.licenseKey && store.licenseKey !== "Chưa cấp"
      ? store.licenseKey.trim()
      : store.id.trim();

  const isConfirmedMatch =
    confirmationInput.trim().toUpperCase() === requiredCode.toUpperCase();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(requiredCode);
    setCopied(true);
    toast.success(`Đã sao chép mã: ${requiredCode}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = () => {
    if (mode === "SUSPEND" && !isConfirmedMatch) {
      toast.error("Vui lòng nhập chính xác mã hợp đồng để xác nhận khóa.");
      return;
    }
    onConfirm(store);
    onClose();
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl max-w-lg w-full border border-surface-border shadow-2xl overflow-hidden animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`p-5 flex items-start gap-3.5 border-b ${
              mode === "SUSPEND"
                ? "bg-rose-50/70 border-rose-100"
                : "bg-emerald-50/70 border-emerald-100"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                mode === "SUSPEND"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              }`}
            >
              <Icon name={mode === "SUSPEND" ? "shield" : "checkCircle"} size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-ink-primary tracking-tight">
                {mode === "SUSPEND" ? "Xác Nhận Khóa Hoạt Động Cửa Hàng" : "Xác Nhận Mở Khóa Cửa Hàng"}
              </h3>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                {mode === "SUSPEND"
                  ? "Cửa hàng và các thiết bị liên quan sẽ bị ngưng hoạt động ngay lập tức."
                  : "Khôi phục trạng thái hoạt động và quyền đăng nhập cho cửa hàng."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            {/* Store Information Box */}
            <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-ink-primary truncate">
                  {store.name}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    store.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {store.status === "ACTIVE" ? "Đang Hoạt Động" : "Đang Tạm Khóa"}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Đại diện: <strong className="text-ink-primary">{store.owner}</strong> • {store.phone}
              </p>
              {store.address && (
                <p className="text-[11px] text-ink-subtle truncate">{store.address}</p>
              )}
            </div>

            {mode === "SUSPEND" ? (
              <>
                {/* Warning Impact List */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/60 text-xs space-y-2 text-rose-900">
                  <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
                    <Icon name="alert" size={14} />
                    <span>Hậu quả khi thực hiện thao tác khóa:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-800 leading-relaxed font-medium">
                    <li>
                      Toàn bộ máy POS, Tablet và Bếp KDS của quán sẽ bị <strong>ngắt kết nối và đăng xuất</strong>.
                    </li>
                    <li>
                      Chủ quán và toàn bộ nhân viên sẽ <strong>bị từ chối đăng nhập</strong>.
                    </li>
                    <li>
                      Hệ thống đặt món mã QR tại bàn của quán sẽ <strong>tạm ngừng phục vụ</strong>.
                    </li>
                  </ul>
                </div>

                {/* Contract Code Display with Copy Button */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Mã Hợp Đồng / License Key của quán:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Nhấp để sao chép</span>
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="font-mono font-bold text-xs text-slate-900 flex-1 truncate px-1 select-all">
                      {requiredCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
                      title="Sao chép mã"
                    >
                      <Icon name={copied ? "check" : "clipboard"} size={13} className={copied ? "text-emerald-600" : ""} />
                      <span>{copied ? "Đã chép" : "Sao chép"}</span>
                    </button>
                  </div>
                </div>

                {/* Input Field for Confirmation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Dán hoặc nhập chính xác mã ở trên để xác nhận khóa:
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="Dán mã hợp đồng vào đây..."
                    autoFocus
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 ${
                      isConfirmedMatch
                        ? "border-emerald-400 bg-emerald-50/30 text-emerald-900 focus:ring-emerald-400/20"
                        : confirmationInput
                        ? "border-rose-300 bg-rose-50/20 text-rose-900 focus:ring-rose-300/20"
                        : "border-slate-300 bg-white text-slate-800 focus:ring-brand-500/20 focus:border-brand-500"
                    }`}
                  />
                  {confirmationInput && !isConfirmedMatch && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <Icon name="alert" size={11} />
                      <span>Mã xác nhận chưa khớp với mã hợp đồng.</span>
                    </p>
                  )}
                  {isConfirmedMatch && (
                    <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Icon name="check" size={11} />
                      <span>Mã hợp đồng đã khớp chính xác. Bạn có thể tiến hành khóa.</span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-xs space-y-2 text-emerald-950">
                <p className="leading-relaxed">
                  Khi mở khóa cửa hàng <strong>{store.name}</strong>:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-emerald-800 leading-relaxed font-medium">
                  <li>Chủ quán và các nhân viên sẽ có thể đăng nhập lại vào hệ thống quản trị.</li>
                  <li>Các máy POS và màn hình KDS có thể mở ca và nhận đơn bình thường.</li>
                  <li>Mã QR đặt món bàn ăn sẽ hoạt động trở lại.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAction}
              disabled={mode === "SUSPEND" && !isConfirmedMatch}
              className={`rounded-xl text-xs font-bold gap-1.5 shadow-xs ${
                mode === "SUSPEND"
                  ? "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Icon name={mode === "SUSPEND" ? "lock" : "checkCircle"} size={13} />
              <span>{mode === "SUSPEND" ? "Xác Nhận Khóa Cửa Hàng" : "Xác Nhận Mở Khóa"}</span>
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
