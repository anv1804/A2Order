import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface ServiceOptionItem {
  id: string;
  label: string;
  desc: string;
  icon: any;
}

export interface CustomerQuickServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOptions: ServiceOptionItem[];
  serviceNote: string;
  setServiceNote: (note: string) => void;
  isSendingService: boolean;
  onSendService: (srv: ServiceOptionItem) => Promise<void> | void;
}

export const CustomerQuickServiceModal: React.FC<CustomerQuickServiceModalProps> = ({
  isOpen,
  onClose,
  serviceOptions,
  serviceNote,
  setServiceNote,
  isSendingService,
  onSendService,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Icon name="bell" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Hỗ Trợ Nhanh Tại Bàn</h3>
                <p className="text-[10.5px] text-slate-400">Yêu cầu phục vụ tới nhân viên quầy</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          {/* Grid các nút hỗ trợ nhanh */}
          <div className="grid grid-cols-2 gap-2">
            {serviceOptions.map((srv) => (
              <button
                key={srv.id}
                type="button"
                disabled={isSendingService}
                onClick={() => onSendService(srv)}
                className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-brand-50 hover:border-brand-300 text-left transition active:scale-95 space-y-1.5 shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-900 group-hover:bg-brand-900 group-hover:text-white transition-colors">
                  <Icon name={srv.icon} size={18} />
                </div>
                <span className="font-bold text-xs text-slate-900 group-hover:text-brand-900 block truncate">
                  {srv.label}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">{srv.desc}</span>
              </button>
            ))}
          </div>

          {/* Ghi chú thêm nếu cần */}
          <div>
            <input
              type="text"
              value={serviceNote}
              onChange={(e) => setServiceNote(e.target.value)}
              placeholder="Ghi chú thêm nếu cần (VD: 2 ly đá, ít ngọt...)"
              className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Nhân viên sẽ nhận thông báo chuông tức thì và phục vụ trong ít phút.
          </p>
        </div>
      </div>
    </Portal>
  );
};
