import React from "react";
import { Icon, Portal } from "@/components/ui";
import { IconName } from "@/types";

export interface CustomerServiceOption {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
}

export const CUSTOMER_SERVICE_OPTIONS: CustomerServiceOption[] = [
  { id: "ice", icon: "cup", label: "Thêm đá lạnh", desc: "Đem thêm xô hoặc ly đá" },
  { id: "napkin", icon: "fileText", label: "Thêm khăn giấy", desc: "Bổ sung hộp khăn giấy" },
  { id: "clean", icon: "refresh", label: "Dọn dẹp bàn", desc: "Thu dọn vỏ chai, đĩa dư" },
  { id: "utensils", icon: "utensils", label: "Thêm chén đũa", desc: "Thêm bát đĩa, muỗng đũa" },
  { id: "waiter", icon: "bell", label: "Gọi nhân viên", desc: "Nhân viên tới bàn hỗ trợ" },
  { id: "bill", icon: "creditCard", label: "Yêu cầu tính tiền", desc: "In hóa đơn thanh toán" },
];

interface CustomerServiceRequestModalProps {
  isOpen: boolean;
  serviceNote: string;
  onChangeServiceNote: (note: string) => void;
  isSendingService: boolean;
  onSendService: (option: CustomerServiceOption) => void;
  onClose: () => void;
}

export const CustomerServiceRequestModal: React.FC<CustomerServiceRequestModalProps> = ({
  isOpen,
  serviceNote,
  onChangeServiceNote,
  isSendingService,
  onSendService,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/70 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-elevated border border-surface-border space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center">
                <Icon name="bell" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink-primary">Hỗ Trợ Nhanh Tại Bàn</h3>
                <p className="text-[10.5px] text-ink-muted">Yêu cầu phục vụ tới nhân viên quầy</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          {/* Grid 6 nút hỗ trợ nhanh */}
          <div className="grid grid-cols-2 gap-2">
            {CUSTOMER_SERVICE_OPTIONS.map((srv) => (
              <button
                key={srv.id}
                type="button"
                disabled={isSendingService}
                onClick={() => onSendService(srv)}
                className="p-3 rounded-2xl border border-surface-border bg-surface-canvas hover:bg-brand-50 hover:border-brand-300 text-left transition active:scale-95 space-y-1.5 shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-surface-border flex items-center justify-center text-brand-900 group-hover:bg-brand-900 group-hover:text-white transition-colors">
                  <Icon name={srv.icon} size={16} />
                </div>
                <div>
                  <span className="font-black text-xs text-ink-primary group-hover:text-brand-950 block truncate">
                    {srv.label}
                  </span>
                  <span className="text-[9.5px] text-ink-muted block truncate">{srv.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Ghi chú thêm nếu cần */}
          <div>
            <input
              type="text"
              value={serviceNote}
              onChange={(e) => onChangeServiceNote(e.target.value)}
              placeholder="Ghi chú thêm nếu cần (VD: 2 ly đá, ít ngọt...)"
              className="w-full h-9 px-3 rounded-xl border border-surface-border bg-white text-xs font-medium text-ink-primary focus:outline-none focus:border-brand-800"
            />
          </div>

          <p className="text-[10px] text-ink-muted text-center leading-relaxed">
            Nhân viên sẽ nhận thông báo chuông tức thì và phục vụ trong ít phút.
          </p>
        </div>
      </div>
    </Portal>
  );
};
