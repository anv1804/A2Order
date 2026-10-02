import React, { useState, useEffect } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { TenantStoreRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface DeleteStoreModalProps {
  store: TenantStoreRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (store: TenantStoreRecord) => Promise<void> | void;
}

export const DeleteStoreModal: React.FC<DeleteStoreModalProps> = ({
  store,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setConfirmationInput("");
    setCopied(false);
    setIsDeleting(false);
  }, [store?.id, isOpen]);

  if (!isOpen || !store) return null;

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

  const handleAction = async () => {
    if (!isConfirmedMatch) {
      toast.error("Vui lòng nhập chính xác mã hồ sơ để xác nhận xóa.");
      return;
    }
    try {
      setIsDeleting(true);
      await onConfirm(store);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl max-w-lg w-full border border-surface-border shadow-2xl overflow-hidden animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 flex items-start gap-3.5 border-b bg-rose-50/80 border-rose-100">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-rose-600 text-white shadow-md shadow-rose-600/20">
              <Icon name="trash" size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-rose-950 tracking-tight">
                Xác Nhận Xóa Vĩnh Viễn Cửa Hàng
              </h3>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed font-medium">
                Hành động này mang tính hủy diệt và không thể khôi phục lại dữ liệu sau khi xóa.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
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
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  ID: {store.id}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Đại diện: <strong className="text-ink-primary">{store.owner}</strong> • {store.phone}
              </p>
              {store.address && (
                <p className="text-[11px] text-ink-subtle truncate">{store.address}</p>
              )}
            </div>

            {/* Warning Impact List */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-2 text-rose-900">
              <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
                <Icon name="alert" size={14} />
                <span>Hậu quả khi thực hiện thao tác xóa vĩnh viễn:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-800 leading-relaxed font-medium">
                <li>
                  Toàn bộ <strong>thực đơn, danh mục, khu vực bàn và đơn hàng</strong> của quán sẽ bị xóa vĩnh viễn.
                </li>
                <li>
                  Tất cả <strong>tài khoản nhân viên &amp; chủ quán</strong> liên kết với quán này sẽ bị xóa khỏi cơ sở dữ liệu.
                </li>
                <li>
                  Mã <strong>License Key và các kỳ hóa đơn thuê</strong> của quán sẽ bị hủy bỏ toàn bộ.
                </li>
                <li>
                  Hệ thống <strong>không thể hoàn tác</strong> sau khi lệnh xóa được gửi tới máy chủ.
                </li>
              </ul>
            </div>

            {/* Contract Code Display with Copy Button */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Mã Hồ Sơ / Hợp Đồng xác thực:</span>
                <span className="text-[10px] text-slate-400 font-normal">Nhấp để sao chép</span>
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200">
                <span className="font-mono font-bold text-xs text-slate-900 flex-1 truncate px-1 select-all">
                  {requiredCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 hover:text-rose-700 hover:border-rose-300 border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
                  title="Sao chép mã"
                >
                  <Icon name={copied ? "check" : "clipboard"} size={13} className={copied ? "text-rose-600" : ""} />
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            {/* Input Field for Confirmation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Dán hoặc nhập chính xác mã ở trên để xác nhận xóa:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Dán mã hồ sơ vào đây..."
                autoFocus
                disabled={isDeleting}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 ${
                  isConfirmedMatch
                    ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-400/20"
                    : confirmationInput
                    ? "border-amber-300 bg-amber-50/20 text-amber-900 focus:ring-amber-300/20"
                    : "border-slate-300 bg-white text-slate-800 focus:ring-brand-500/20 focus:border-brand-500"
                }`}
              />
              {confirmationInput && !isConfirmedMatch && (
                <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <Icon name="alert" size={11} />
                  <span>Mã xác nhận chưa khớp với mã hồ sơ.</span>
                </p>
              )}
              {isConfirmedMatch && (
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <Icon name="check" size={11} />
                  <span>Mã xác nhận đã khớp chính xác. Bạn có thể tiến hành xóa vĩnh viễn.</span>
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold"
            >
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAction}
              disabled={!isConfirmedMatch || isDeleting}
              className="rounded-xl text-xs font-bold gap-1.5 shadow-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="trash" size={13} />
              <span>{isDeleting ? "Đang Xóa..." : "Xác Nhận Xóa Vĩnh Viễn"}</span>
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
