import React from "react";
import { Icon } from "@/components/ui";
import { VoucherItem as Voucher, CustomerOrderedItem } from "@/types";

export interface CustomerOffersTabProps {
  voucherInput: string;
  setVoucherInput: (val: string) => void;
  appliedVoucher: Voucher | null;
  onApplyVoucher: (code?: string) => void;
  onRemoveVoucher: () => void;
  sampleVouchers: Voucher[];
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  isPhoneSaved: boolean;
  setIsPhoneSaved: (saved: boolean) => void;
  onSavePhone: (e: React.FormEvent) => void;
  orderedItems: CustomerOrderedItem[];
}

export const CustomerOffersTab: React.FC<CustomerOffersTabProps> = ({
  voucherInput,
  setVoucherInput,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
  sampleVouchers,
  customerPhone,
  setCustomerPhone,
  isPhoneSaved,
  setIsPhoneSaved,
  onSavePhone,
  orderedItems,
}) => {
  const pointsEstimate = Math.floor(
    orderedItems
      .filter((it) => it.status !== "CANCELLED")
      .reduce((s, it) => s + it.price * it.quantity, 0) / 10000
  );

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* 1. Nhập Voucher */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
            <Icon name="tag" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Voucher & Mã Giảm Giá</h3>
            <p className="text-[11px] text-slate-400">Áp dụng trực tiếp vào tổng hóa đơn</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={voucherInput}
            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher (VD: A2GIAM10)"
            className="flex-1 h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />
          <button
            type="button"
            onClick={() => onApplyVoucher()}
            className="px-5 rounded-2xl bg-emerald-700 text-white font-black text-xs hover:bg-emerald-800 transition active:scale-95 shadow-sm"
          >
            Áp Dụng
          </button>
        </div>

        {appliedVoucher && (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-900">
                <Icon name="tag" size={13} />
                <span>Mã {appliedVoucher.code} đã áp dụng</span>
              </span>
              <p className="text-[10px] text-emerald-700">{appliedVoucher.description}</p>
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
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mã ưu đãi đang có:</p>
          {sampleVouchers && sampleVouchers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {sampleVouchers.map((v) => (
                <div
                  key={v.code}
                  onClick={() => onApplyVoucher(v.code)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    appliedVoucher?.code === v.code
                      ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200"
                      : "bg-slate-50/70 hover:bg-emerald-50/40 border-slate-200/80"
                  }`}
                >
                  <div>
                    <span className="text-xs font-black font-mono text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                      {v.code}
                    </span>
                    <p className="text-xs text-slate-700 font-semibold mt-1">{v.description}</p>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-xl transition ${
                    appliedVoucher?.code === v.code
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-emerald-800 border border-emerald-200"
                  }`}>
                    {appliedVoucher?.code === v.code ? "Đã chọn" : "+ Dùng"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 font-medium">
              Chưa có chương trình ưu đãi nào đang diễn ra.
            </div>
          )}
        </div>
      </div>

      {/* 2. Nhập SĐT Tích Điểm */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center shadow-2xs">
            <Icon name="phone" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Tích Điểm Thành Viên</h3>
            <p className="text-[11px] text-slate-400">10.000 đ = 1 điểm thưởng đổi quà</p>
          </div>
        </div>

        <form onSubmit={onSavePhone} className="flex gap-2">
          <input
            type="tel"
            maxLength={11}
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""));
              setIsPhoneSaved(false);
            }}
            placeholder="Nhập số điện thoại (10 số)"
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 rounded-xl bg-cyan-700 text-white font-black text-xs hover:bg-cyan-800 transition active:scale-95"
          >
            {isPhoneSaved ? "Đã Lưu" : "Lưu SĐT"}
          </button>
        </form>

        {isPhoneSaved && customerPhone && (
          <div className="p-3 bg-gradient-to-r from-cyan-900 to-slate-900 text-white rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-300 uppercase">Thẻ Thành Viên A2</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">Standard</span>
            </div>
            <p className="text-sm font-black tracking-wider font-mono">{customerPhone}</p>
            <p className="text-[10px] text-cyan-200">
              Số điểm tích lũy dự kiến: +{pointsEstimate} điểm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
