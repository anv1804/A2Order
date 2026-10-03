import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { CustomerRecord, CustomerMembershipTier } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

interface DigitalMemberCardModalProps {
  customer: CustomerRecord | null;
  onClose: () => void;
  tierConfig: Record<CustomerMembershipTier, { label: string; badgeClass: string; discountPercent: number; minSpend: string }>;
}

export const DigitalMemberCardModal: React.FC<DigitalMemberCardModalProps> = ({
  customer,
  onClose,
  tierConfig,
}) => {
  if (!customer) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scaleUp text-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Thẻ Hội Viên Điện Tử</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* Digital Card Preview */}
          <div className={`p-5 rounded-2xl text-white shadow-xl relative overflow-hidden ${
            customer.tier === "DIAMOND"
              ? "bg-gradient-to-tr from-purple-900 via-indigo-800 to-purple-600"
              : customer.tier === "GOLD"
              ? "bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-500"
              : customer.tier === "SILVER"
              ? "bg-gradient-to-tr from-slate-700 via-slate-600 to-blue-500"
              : "bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600"
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] tracking-widest uppercase opacity-80 block">A2Order VIP Club</span>
                <h4 className="font-black text-lg mt-0.5">{tierConfig[customer.tier].label}</h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                ★
              </div>
            </div>

            <div className="my-6">
              <div className="text-[11px] opacity-75">Chủ Thẻ Thành Viên</div>
              <div className="text-base font-bold tracking-wide">{customer.name}</div>
              <div className="font-mono text-xs opacity-90">{customer.phone}</div>
            </div>

            <div className="flex justify-between items-end pt-3 border-t border-white/20 text-xs">
              <div>
                <span className="text-[10px] opacity-75 block">Điểm Tích Lũy</span>
                <span className="font-bold text-sm">{customer.points} pts</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] opacity-75 block">Đặc Quyền Giảm</span>
                <span className="font-bold text-sm">
                  {tierConfig[customer.tier].discountPercent > 0 ? `-${tierConfig[customer.tier].discountPercent}%` : "Thành viên"}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Barcode */}
          <div className="text-center pt-2">
            <div className="font-mono text-xs font-bold text-slate-800">{customer.code}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Đưa mã thẻ này cho thu ngân khi thanh toán tại quầy để áp dụng ưu đãi giảm giá và tích điểm.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success("Đã gửi liên kết Thẻ Thành Viên Điện Tử qua Zalo cho khách hàng!")}
              className="bg-emerald-600 text-white w-full"
            >
              <Icon name="send" size={14} className="mr-1" /> Gửi Thẻ VIP Qua Zalo Khách
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
