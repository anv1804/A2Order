import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsRecentOrdersSectionProps } from "@/types";

export const CmsRecentOrdersSection: React.FC<
  CmsRecentOrdersSectionProps & { onNavigateTab?: (tab: string) => void }
> = ({ bills, onNavigateTab }) => {
  const recentBills = [...bills].reverse().slice(0, 5);

  return (
    <section className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header (Coinest My Portfolio Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-surface-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
              <Icon name="cart" size={15} />
            </span>
            <h4 className="text-base font-black text-ink-primary tracking-tight">
              Đơn Hàng & Bàn Ăn Gần Nhất
            </h4>
          </div>
          <p className="text-xs text-ink-muted font-medium mt-0.5">
            Theo dõi trạng thái phục vụ và đối soát hóa đơn theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-canvas border border-surface-border text-ink-primary">
            <span>Ca hôm nay</span>
            <Icon name="chevronDown" size={12} className="text-ink-subtle" />
          </span>

          <button
            type="button"
            onClick={() => onNavigateTab?.("tables")}
            className="text-xs font-bold text-brand-800 hover:text-brand-900 hover:underline shrink-0"
          >
            Sơ Đồ Bàn →
          </button>
        </div>
      </div>

      {recentBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-canvas text-ink-muted flex items-center justify-center mb-2.5">
            <Icon name="cart" size={22} />
          </div>
          <p className="text-sm font-bold text-ink-primary">Chưa có đơn hàng nào trong ca</p>
          <p className="text-xs text-ink-muted mt-0.5 max-w-xs">
            Đơn hàng mới tạo tại bàn hoặc quầy thu ngân sẽ tự động xuất hiện tại đây theo thời gian thực.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet View: Clean Coinest Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border/60 text-ink-subtle text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3 font-bold">Bàn Ăn / Mã Đơn</th>
                  <th className="pb-3 font-bold">Thời Gian</th>
                  <th className="pb-3 font-bold">Món Đã Gọi</th>
                  <th className="pb-3 font-bold">Hình Thức</th>
                  <th className="pb-3 font-bold">Trạng Thái</th>
                  <th className="pb-3 text-right font-bold">Tổng Thanh Toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40">
                {recentBills.map((b: any) => {
                  const isPaid = b.status === "COMPLETED" || b.status === "PAID";
                  const itemsSummary = (b.items || [])
                    .slice(0, 2)
                    .map((i: any) => `${i.quantity}x ${i.name}`)
                    .join(", ");
                  const remainingCount = (b.items || []).length - 2;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-surface-canvas/50 transition-colors cursor-pointer group"
                      onClick={() => onNavigateTab?.("tables")}
                    >
                      {/* Bàn Ăn */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center font-bold text-xs shrink-0">
                            <Icon name="table" size={14} />
                          </span>
                          <div>
                            <span className="font-bold text-ink-primary block">{b.tableName || "Mang về"}</span>
                            <span className="text-[10px] text-ink-subtle font-mono">#{b.id?.slice(-6) || "BILL"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Thời Gian */}
                      <td className="py-3.5 pr-3 text-ink-muted font-medium">
                        {b.closedAt ? b.closedAt.slice(0, 5) : b.createdAt ? new Date(b.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong"}
                      </td>

                      {/* Món Đã Gọi */}
                      <td className="py-3.5 pr-3 max-w-[200px]">
                        <span className="truncate block text-ink-primary font-medium">
                          {itemsSummary || "—"}
                          {remainingCount > 0 && <span className="text-ink-subtle text-[10px]"> +{remainingCount} món khác</span>}
                        </span>
                      </td>

                      {/* Hình Thức Thanh Toán */}
                      <td className="py-3.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold ${
                            b.paymentMethod === "VIETQR"
                              ? "bg-teal-50 text-teal-800 border border-teal-200/50"
                              : "bg-amber-50 text-amber-800 border border-amber-200/50"
                          }`}
                        >
                          <Icon name={b.paymentMethod === "VIETQR" ? "vietqr" : "banknote"} size={11} />
                          <span>{b.paymentMethod === "VIETQR" ? "VietQR" : "Tiền Mặt"}</span>
                        </span>
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black ${
                            isPaid
                              ? "bg-[#E8F5EE] text-brand-900"
                              : "bg-blue-50 text-blue-800"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-brand-700" : "bg-blue-600 animate-pulse"}`} />
                          <span>{isPaid ? "Đã Trả Tiền" : "Đang Dùng Bữa"}</span>
                        </span>
                      </td>

                      {/* Tổng Tiền */}
                      <td className="py-3.5 text-right font-black text-ink-primary text-sm">
                        {formatCurrency(b.finalAmount || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Coinest Touch-friendly Cards */}
          <div className="block sm:hidden space-y-2.5">
            {recentBills.map((b: any) => {
              const isPaid = b.status === "COMPLETED" || b.status === "PAID";
              return (
                <div
                  key={b.id}
                  onClick={() => onNavigateTab?.("tables")}
                  className="p-3.5 rounded-2xl bg-surface-canvas/60 border border-surface-border/80 space-y-2 active:bg-surface-canvas transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-900 flex items-center justify-center font-bold text-xs">
                        <Icon name="table" size={13} />
                      </span>
                      <span className="font-bold text-xs text-ink-primary">{b.tableName || "Mang về"}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        isPaid ? "bg-[#E8F5EE] text-brand-900" : "bg-blue-50 text-blue-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-brand-700" : "bg-blue-600 animate-pulse"}`} />
                      <span>{isPaid ? "Đã trả" : "Đang ăn"}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-ink-muted truncate font-medium">
                    {(b.items || []).slice(0, 2).map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-xs">
                    <span className="text-[11px] text-ink-subtle font-medium">
                      {b.paymentMethod === "VIETQR" ? "VietQR Chuyển Khoản" : "Tiền Mặt"}
                    </span>
                    <span className="font-black text-ink-primary text-xs">
                      {formatCurrency(b.finalAmount || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
