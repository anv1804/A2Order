import React from "react";
import { Icon } from "@/components/ui";
import { CustomerVoucher, CustomerOrderedItem } from "@/types";

export const SAMPLE_VOUCHERS: CustomerVoucher[] = [
  { code: "A2GIAM10", discountType: "PERCENT", value: 10, description: "Giảm 10% tổng hóa đơn gọi món" },
  { code: "A2GIAM20K", discountType: "FIXED", value: 20000, description: "Giảm trực tiếp 20.000 đ cho đơn từ 80k", minOrder: 80000 },
  { code: "VIP15", discountType: "PERCENT", value: 15, description: "Ưu đãi 15% cho thành viên thân thiết" },
  { code: "FREESHIP", discountType: "FIXED", value: 15000, description: "Tặng voucher 15.000 đ trải nghiệm tại bàn" },
];

interface CustomerOffersTabProps {
  voucherInput: string;
  onChangeVoucherInput: (code: string) => void;
  appliedVoucher: CustomerVoucher | null;
  onApplyVoucher: (code?: string) => void;
  onRemoveVoucher: () => void;
  customerPhone: string;
  onChangeCustomerPhone: (phone: string) => void;
  isPhoneSaved: boolean;
  onSavePhone: (e: React.FormEvent) => void;
  orderedItems: CustomerOrderedItem[];
}

export const CustomerOffersTab: React.FC<CustomerOffersTabProps> = ({
  voucherInput,
  onChangeVoucherInput,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
  customerPhone,
  onChangeCustomerPhone,
  isPhoneSaved,
  onSavePhone,
  orderedItems,
}) => {
  const currentTotal = orderedItems
    .filter((it) => it.status !== "CANCELLED")
    .reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* 1. Nhập Voucher */}
      <div className="bg-white p-4 rounded-3xl border border-surface-border shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center shadow-2xs">
            <Icon name="tag" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-ink-primary">Voucher & Mã Giảm Giá</h3>
            <p className="text-[11px] text-ink-muted">Áp dụng trực tiếp vào tổng hóa đơn</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={voucherInput}
            onChange={(e) => onChangeVoucherInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher (VD: A2GIAM10)"
            className="flex-1 h-11 px-3.5 rounded-2xl border border-surface-border bg-surface-canvas text-xs font-black uppercase text-ink-primary focus:outline-none focus:border-brand-800 focus:bg-white transition"
          />
          <button
            type="button"
            onClick={() => onApplyVoucher()}
            className="px-5 rounded-2xl bg-brand-900 text-white font-black text-xs hover:bg-brand-800 transition active:scale-95 shadow-xs"
          >
            Áp Dụng
          </button>
        </div>

        {appliedVoucher && (
          <div className="p-3 bg-brand-50 rounded-2xl border border-brand-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-brand-950 flex items-center gap-1.5">
                <Icon name="tag" size={13} />
                <span>Mã {appliedVoucher.code} đã áp dụng</span>
              </span>
              <p className="text-[10px] text-brand-800">{appliedVoucher.description}</p>
            </div>
            <button
              type="button"
              onClick={onRemoveVoucher}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50"
            >
              Bỏ chọn
            </button>
          </div>
        )}

        {/* Danh sách voucher gợi ý */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Mã ưu đãi đang có:</p>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_VOUCHERS.map((v) => (
              <div
                key={v.code}
                onClick={() => onApplyVoucher(v.code)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  appliedVoucher?.code === v.code
                    ? "bg-brand-50 border-brand-300 ring-1 ring-brand-200"
                    : "bg-surface-canvas hover:bg-brand-50/40 border-surface-border"
                }`}
              >
                <div>
                  <span className="text-xs font-black font-mono text-brand-900 bg-white px-2.5 py-0.5 rounded-lg border border-brand-200 shadow-2xs">
                    {v.code}
                  </span>
                  <p className="text-xs text-ink-primary font-semibold mt-1">{v.description}</p>
                </div>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-xl transition ${
                    appliedVoucher?.code === v.code
                      ? "bg-brand-900 text-white"
                      : "bg-white text-brand-900 border border-brand-200"
                  }`}
                >
                  {appliedVoucher?.code === v.code ? "Đã chọn" : "+ Dùng"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Nhập SĐT Tích Điểm */}
      <div className="bg-white p-4 rounded-3xl border border-surface-border shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center justify-center shadow-2xs">
            <Icon name="phone" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-ink-primary">Tích Điểm Thành Viên</h3>
            <p className="text-[11px] text-ink-muted">10.000 đ = 1 điểm thưởng đổi quà</p>
          </div>
        </div>

        <form onSubmit={onSavePhone} className="flex gap-2">
          <input
            type="tel"
            maxLength={11}
            value={customerPhone}
            onChange={(e) => onChangeCustomerPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Nhập số điện thoại (10 số)"
            className="flex-1 h-10 px-3 rounded-xl border border-surface-border bg-surface-canvas text-xs font-bold text-ink-primary focus:outline-none focus:border-brand-800 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 rounded-xl bg-brand-900 text-white font-black text-xs hover:bg-brand-800 transition active:scale-95 shadow-2xs"
          >
            {isPhoneSaved ? "Đã Lưu" : "Lưu SĐT"}
          </button>
        </form>

        {isPhoneSaved && customerPhone && (
          <div className="p-3 bg-brand-950 text-white rounded-xl shadow-xs space-y-1 border border-brand-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand-200 uppercase">Thẻ Thành Viên A2</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">Standard</span>
            </div>
            <p className="text-sm font-black tracking-wider font-mono">{customerPhone}</p>
            <p className="text-[10px] text-brand-200">
              Số điểm tích lũy dự kiến: +{Math.floor(currentTotal / 10000)} điểm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
