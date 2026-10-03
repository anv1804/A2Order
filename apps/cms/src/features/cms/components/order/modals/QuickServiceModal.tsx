import React from "react";
import { Icon, Portal } from "@/components/ui";
import { IconName } from "@/types";

export interface QuickServiceOption {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
}

export const QUICK_SERVICE_OPTIONS: QuickServiceOption[] = [
  { id: "ice", icon: "cup", label: "Thêm đá lạnh", desc: "Đem thêm xô hoặc ly đá" },
  { id: "napkin", icon: "fileText", label: "Thêm khăn giấy", desc: "Bổ sung hộp khăn giấy" },
  { id: "clean", icon: "refresh", label: "Dọn dẹp bàn", desc: "Thu dọn vỏ chai, đĩa dư" },
  { id: "utensils", icon: "utensils", label: "Thêm chén đũa", desc: "Thêm bát đĩa, muỗng đũa" },
  { id: "waiter", icon: "bell", label: "Gọi nhân viên", desc: "Nhân viên tới bàn hỗ trợ" },
  { id: "bill", icon: "creditCard", label: "Yêu cầu tính tiền", desc: "In hóa đơn thanh toán" },
];

export const getServiceTypeInfo = (type: string): { icon: IconName; color: string; label: string } => {
  const t = (type || "").toLowerCase();
  if (t.includes("đá")) return { icon: "cup", color: "bg-brand-50 text-brand-900 border-brand-200", label: "Thêm đá lạnh" };
  if (t.includes("khăn") || t.includes("giấy")) return { icon: "fileText", color: "bg-brand-50 text-brand-900 border-brand-200", label: "Thêm khăn giấy" };
  if (t.includes("dọn")) return { icon: "refresh", color: "bg-brand-50 text-brand-900 border-brand-200", label: "Dọn dẹp bàn" };
  if (t.includes("đũa") || t.includes("chén") || t.includes("bát")) return { icon: "utensils", color: "bg-brand-50 text-brand-900 border-brand-200", label: "Thêm chén đũa" };
  if (t.includes("tiền") || t.includes("bill") || t.includes("toán")) return { icon: "creditCard", color: "bg-amber-50 text-amber-900 border-amber-200", label: "Yêu cầu tính tiền" };
  return { icon: "bell", color: "bg-brand-50 text-brand-900 border-brand-200", label: type || "Hỗ trợ bàn" };
};

interface QuickServiceModalProps {
  isOpen: boolean;
  tableName: string;
  selectedOption: string;
  onSelectOption: (option: string) => void;
  customNote: string;
  onChangeCustomNote: (note: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const QuickServiceModal: React.FC<QuickServiceModalProps> = ({
  isOpen,
  tableName,
  selectedOption,
  onSelectOption,
  customNote,
  onChangeCustomNote,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-900 border border-brand-200 flex items-center justify-center">
                <Icon name="bell" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink-primary">Yêu Cầu Phục Vụ Bàn</h3>
                <p className="text-[11px] text-ink-muted">
                  Ghi nhận yêu cầu hỗ trợ cho {tableName || "bàn đang chọn"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-canvas transition"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-secondary block">
              Chọn loại dịch vụ hỗ trợ:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_SERVICE_OPTIONS.map((opt) => {
                const isSelected = selectedOption === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectOption(opt.label)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? "border-brand-800 bg-brand-50 text-brand-950 ring-2 ring-brand-800/20 font-black"
                        : "border-surface-border bg-white text-ink-primary hover:border-brand-300 hover:bg-brand-50/20"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-brand-900 text-white" : "bg-brand-50 text-brand-800 border border-brand-200"
                      }`}
                    >
                      <Icon name={opt.icon} size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs block leading-tight font-bold">{opt.label}</span>
                      <span className="text-[9.5px] text-ink-muted truncate block">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-secondary block">
              Ghi chú thêm (tùy chọn):
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => onChangeCustomNote(e.target.value)}
              placeholder="VD: Cho xô đá to, 3 khăn lạnh..."
              className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 bg-surface-canvas focus:bg-white transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-ink-muted hover:bg-surface-canvas transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-brand-900 hover:bg-brand-800 shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <Icon name="check" size={13} />
              <span>Xác Nhận Gửi Yêu Cầu</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
