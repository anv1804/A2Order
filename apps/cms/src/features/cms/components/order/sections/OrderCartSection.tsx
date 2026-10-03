import React from "react";
import { Icon, Button } from "@/components/ui";
import { WaiterTableOrder, WaiterOrderItem } from "@/types";

interface OrderCartSectionProps {
  activeTable: WaiterTableOrder;
  newOrderCart: WaiterOrderItem[];
  activeTab: "MENU" | "SERVED_ITEMS";
  onSelectTab: (tab: "MENU" | "SERVED_ITEMS") => void;
  isCashier: boolean;
  cartTotalAmount: number;
  foodTotalAmount: number;
  surchargesTotalAmount: number;
  discountTotalAmount: number;
  finalPayableAmount: number;
  formatElapsed: (openedAtMs?: number) => string;
  onNavigateTab?: (tab: string) => void;
  onOpenManualTableModal: () => void;
  onRotateTablePin: () => void;
  onCloseTableSession: () => void;
  onSetMobileStep: (step: "TABLES" | "MENU" | "CART") => void;
  onUpdateCartQuantity: (idx: number, delta: number) => void;
  onClearCart: () => void;
  onSendToKitchen: () => void;
  onCancelWaitingItem: (idx: number) => void;
  onMarkItemServed: (idx: number) => void;
  onOpenVoidCooking: (idx: number) => void;
  onOpenServedAction: (idx: number) => void;
  onOpenTransferModal: () => void;
  onOpenSplitBill: () => void;
  onOpenSurchargeModal: () => void;
  onRequestBill: () => void;
  onOpenOfflineModal: () => void;
}

export const OrderCartSection: React.FC<OrderCartSectionProps> = ({
  activeTable,
  newOrderCart,
  activeTab,
  onSelectTab,
  isCashier,
  cartTotalAmount,
  foodTotalAmount,
  surchargesTotalAmount,
  discountTotalAmount,
  finalPayableAmount,
  formatElapsed,
  onNavigateTab,
  onOpenManualTableModal,
  onRotateTablePin,
  onCloseTableSession,
  onSetMobileStep,
  onUpdateCartQuantity,
  onClearCart,
  onSendToKitchen,
  onCancelWaitingItem,
  onMarkItemServed,
  onOpenVoidCooking,
  onOpenServedAction,
  onOpenTransferModal,
  onOpenSplitBill,
  onOpenSurchargeModal,
  onRequestBill,
  onOpenOfflineModal,
}) => {
  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs flex flex-col flex-1 min-h-0 overflow-hidden h-full">
      {/* Header bàn đang chọn */}
      <div className="border-b border-surface-border pb-3 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-ink-primary">
              {activeTable.tableName}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTable.status === "EMPTY"
                  ? "bg-slate-100 text-slate-700"
                  : activeTable.status === "OCCUPIED"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : activeTable.status === "WAITING_FOOD"
                  ? "bg-purple-100 text-purple-900 border border-purple-300"
                  : "bg-rose-100 text-rose-900 border border-rose-300"
              }`}
            >
              {activeTable.status === "EMPTY"
                ? "Bàn trống"
                : activeTable.status === "OCCUPIED"
                ? "Có khách"
                : activeTable.status === "WAITING_FOOD"
                ? "Chờ món"
                : "Chờ thanh toán"}
            </span>
          </div>

          {/* Cụm nút hành động Bàn: Đóng Bàn / Đổi PIN / Mở Bàn */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTable.status === "EMPTY" && activeTable.tableId ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("tables")}
                  className="py-1 px-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1"
                  title="Chuyển sang màn hình Quản Lý Bàn"
                >
                  <Icon name="table" size={11} />
                  <span>Quản Lý Bàn</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenManualTableModal}
                  className="py-1 px-3 rounded-xl text-xs font-black text-white bg-brand-900 hover:bg-brand-800 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Icon name="plus" size={12} />
                  <span>Mở Bàn</span>
                </button>
              </div>
            ) : activeTable.status !== "EMPTY" ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onRotateTablePin}
                  className="py-1 px-2 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1"
                  title="Đổi mã PIN mở bàn"
                >
                  <Icon name="refresh" size={11} />
                  <span>PIN: {activeTable.pin || "---"}</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseTableSession}
                  className="py-1 px-3 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  title="Đóng phiên phục vụ của bàn này và dọn bàn"
                >
                  <Icon name="x" size={12} />
                  <span>Đóng Bàn</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Dòng chi tiết & Tab Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-ink-muted flex items-center gap-1.5 flex-wrap">
            <span>Số khách: <strong className="text-ink-primary">{activeTable.guestCount || 0} người</strong></span>
            <span>•</span>
            {activeTable.status !== "EMPTY" && activeTable.openedAt ? (
              <>
                <span>Vào lúc: <strong className="text-ink-primary">{activeTable.openedAt}</strong></span>
                {(activeTable as any).openedAtMs && (
                  <>
                    <span>•</span>
                    <span className="text-brand-800 font-bold inline-flex items-center gap-1">
                      <Icon name="clock" size={11} />
                      <span>{formatElapsed((activeTable as any).openedAtMs)}</span>
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="italic text-slate-400">Chưa mở phiên</span>
            )}
            {activeTable.mergedTables && activeTable.mergedTables.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[9px] font-black border border-purple-200">
                Đã gộp: {activeTable.mergedTables.join(", ")}
              </span>
            )}
          </div>

          {/* Toggle 2 Tab */}
          <div className="p-1 bg-surface-canvas rounded-xl border border-surface-border flex text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab("MENU")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "MENU"
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              Món Mới ({newOrderCart.length})
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("SERVED_ITEMS")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "SERVED_ITEMS"
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              Đã Gọi ({activeTable.items.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: GIỎ MÓN MỚI SẮP GỬI BẾP */}
      {activeTab === "MENU" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {newOrderCart.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted space-y-2">
                <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto text-ink-subtle">
                  <Icon name="cart" className="w-6 h-6" />
                </div>
                <p className="font-bold">Chưa chọn món mới nào</p>
                <p className="text-[11px]">Bấm dấu (+) trên menu để thêm món vào order</p>
                <button
                  type="button"
                  onClick={() => onSetMobileStep("MENU")}
                  className="lg:hidden mt-2 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-bold"
                >
                  ← Mở Menu Chọn Món
                </button>
              </div>
            ) : (
              newOrderCart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink-primary truncate">{item.name}</div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-700 italic truncate font-semibold">
                        Ghi chú: {item.notes}
                      </div>
                    )}
                    <div className="text-[11px] font-black text-brand-900 mt-0.5">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  {/* Bộ điều khiển số lượng */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-surface-border">
                    <button
                      type="button"
                      onClick={() => onUpdateCartQuantity(idx, -1)}
                      className="w-6 h-6 rounded-lg text-ink-subtle hover:bg-surface-muted flex items-center justify-center font-bold"
                    >
                      <Icon name="minus" className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-black text-xs text-ink-primary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCartQuantity(idx, 1)}
                      className="w-6 h-6 rounded-lg text-ink-subtle hover:bg-surface-muted flex items-center justify-center font-bold"
                    >
                      <Icon name="plus" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Giỏ hàng & Nút Gửi Bếp */}
          <div className="pt-3 border-t border-surface-border mt-3 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Tạm tính món mới:</span>
              <span className="font-black text-sm text-brand-950">
                {cartTotalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={newOrderCart.length === 0}
                onClick={onClearCart}
                className="rounded-2xl text-xs font-bold"
              >
                Xóa Giỏ
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={newOrderCart.length === 0}
                onClick={onSendToKitchen}
                className="rounded-2xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-black shadow-sm gap-1.5"
              >
                <Icon name="kitchen" className="w-3.5 h-3.5" />
                <span>Gửi Bếp Ngay</span>
              </Button>
            </div>

            {/* Nút đóng bàn nhanh nếu bàn đang mở nhưng chưa gọi món */}
            {activeTable.status !== "EMPTY" && newOrderCart.length === 0 && (
              <button
                type="button"
                onClick={onCloseTableSession}
                className="w-full py-2 rounded-xl text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
                <span>Đóng Bàn & Trả Về Bàn Trống</span>
              </button>
            )}

            {/* Nút quay lại menu chọn thêm trên mobile */}
            <button
              type="button"
              onClick={() => onSetMobileStep("MENU")}
              className="lg:hidden w-full py-2 rounded-xl text-xs font-bold text-brand-900 hover:bg-brand-50 border border-brand-200 transition-colors mt-1"
            >
              + Gọi Thêm Món Khác
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CÁC MÓN BÀN NÀY ĐÃ GỌI TRƯỚC ĐÓ */}
      {activeTab === "SERVED_ITEMS" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {activeTable.items.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                Bàn này chưa có món nào được gửi vào bếp.
              </div>
            ) : (
              activeTable.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-brand-950">{item.quantity}x</span>
                      <span className="font-bold text-ink-primary truncate">{item.name}</span>
                      {item.round && (
                        <span className="px-1.5 py-0.2 rounded-md bg-brand-100 text-brand-900 text-[9px] font-black border border-brand-200">
                          Đợt {item.round}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-800 italic truncate font-semibold">
                        {item.notes}
                      </div>
                    )}
                    <div className="text-[10px] text-ink-subtle mt-0.5">
                      Gọi lúc: {item.orderedAt || "Trước đó"} • {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Badge trạng thái */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.status === "SERVED"
                          ? "bg-brand-100 text-brand-900"
                          : item.status === "COOKING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.status === "SERVED"
                        ? "Đã lên bàn"
                        : item.status === "COOKING"
                        ? "Bếp đang nấu"
                        : "Chờ bếp"}
                    </span>

                    {/* Nút hành động tương ứng với trạng thái món */}
                    {item.status === "WAITING" && (
                      <button
                        type="button"
                        onClick={() => onCancelWaitingItem(idx)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                        title="Hủy món chưa nấu"
                      >
                        <Icon name="trash" className="w-3 h-3" />
                        <span>Hủy</span>
                      </button>
                    )}

                    {item.status === "COOKING" && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onMarkItemServed(idx)}
                          className="px-2 py-1 rounded-lg text-[10px] font-black text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1 active:scale-95 shadow-2xs"
                          title="Đánh dấu món đã mang ra bàn"
                        >
                          <Icon name="check" className="w-3 h-3 text-brand-800" />
                          <span>Lên món</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenVoidCooking(idx)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 transition-colors flex items-center gap-1"
                          title="Báo bếp dừng nấu & hủy món"
                        >
                          <Icon name="alert" className="w-3 h-3 text-rose-600" />
                          <span>Hủy</span>
                        </button>
                      </div>
                    )}

                    {item.status === "SERVED" && (
                      <button
                        type="button"
                        onClick={() => onOpenServedAction(idx)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1"
                        title="Khách khiếu nại làm lại hoặc trả món"
                      >
                        <Icon name="refresh" className="w-3 h-3" />
                        <span>Đổi / Trả</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-surface-border mt-3 space-y-2.5 shrink-0">
            {/* Chi tiết tài chính bàn: Tiền món + Phụ phí - Giảm giá */}
            <div className="space-y-1.5 text-xs bg-surface-canvas/60 p-2.5 rounded-2xl border border-surface-border/70">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Tiền món ăn ({activeTable.items.length} món):</span>
                <span className="font-bold text-ink-primary">
                  {foodTotalAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {surchargesTotalAmount > 0 && (
                <div className="flex items-center justify-between text-amber-900 font-medium">
                  <span>+ Phụ thu ({activeTable.surcharges?.length} khoản):</span>
                  <span className="font-bold">+{surchargesTotalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}

              {discountTotalAmount > 0 && (
                <div className="flex items-center justify-between text-rose-700 font-medium">
                  <span>- Giảm giá ({activeTable.discount?.reason}):</span>
                  <span className="font-bold">-{discountTotalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}

              <div className="pt-1.5 border-t border-surface-border/70 flex items-center justify-between">
                <span className="font-black text-ink-primary">Tổng cộng thanh toán:</span>
                <span className="font-black text-base text-brand-950">
                  {finalPayableAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {activeTable.offlinePaid && (
                <div className="mt-1 px-2 py-1 rounded-lg bg-brand-100 text-brand-900 border border-brand-300 text-[10px] font-black flex items-center gap-1">
                  <Icon name="checkCircle" size={12} className="text-brand-800" />
                  <span>Đã thanh toán ngoại tuyến lúc {activeTable.offlinePaidAt}</span>
                </div>
              )}
            </div>

            {/* Cụm 4 nút tác vụ chuyên nghiệp */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenTransferModal}
                disabled={activeTable.items.length === 0}
                className="py-2.5 px-2 rounded-2xl border border-surface-border bg-white hover:bg-surface-canvas text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              >
                <Icon name="refresh" className="w-3.5 h-3.5 text-brand-900" />
                <span>Chuyển / Gộp</span>
              </button>

              <button
                type="button"
                onClick={onOpenSplitBill}
                disabled={activeTable.items.length === 0}
                className="py-2.5 px-2 rounded-2xl border border-surface-border bg-white hover:bg-surface-canvas text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              >
                <Icon name="table" className="w-3.5 h-3.5 text-brand-900" />
                <span>Tách Hóa Đơn</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenSurchargeModal}
                disabled={activeTable.items.length === 0}
                className="py-2.5 px-2 rounded-2xl border border-surface-border bg-white hover:bg-surface-canvas text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              >
                <Icon name="tag" className="w-3.5 h-3.5 text-brand-900" />
                <span>Phụ Thu / Giảm</span>
              </button>

              <Button
                type="button"
                size="sm"
                onClick={onRequestBill}
                disabled={activeTable.items.length === 0}
                className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs gap-1.5 disabled:opacity-40"
              >
                <Icon name={isCashier ? "cashier" : "print"} className="w-3.5 h-3.5" />
                <span>{isCashier ? "Thanh Toán" : "In Tạm Tính"}</span>
              </Button>
            </div>

            {/* Nút 1-chạm cứu hộ khi Mất Điện / Rớt Mạng (Offline Emergency Mode) */}
            <button
              type="button"
              onClick={onOpenOfflineModal}
              disabled={activeTable.items.length === 0}
              className="w-full py-2 px-3 rounded-xl text-xs font-extrabold text-amber-950 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              title="Thanh toán khẩn cấp bằng VietQR tĩnh hoặc tiền mặt khi rớt mạng / mất điện"
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Mất Điện / Offline VietQR</span>
            </button>

            {activeTable.status !== "EMPTY" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onRotateTablePin}
                  className="py-2 px-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Tạo mã PIN 4 số bảo mật mới cho bàn (Mã PIN động)"
                >
                  <Icon name="refresh" className="w-3.5 h-3.5 text-slate-600" />
                  <span>Đổi PIN</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseTableSession}
                  className="py-2 px-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Đóng phiên phục vụ của bàn này và giải phóng bàn về trạng thái Bàn Trống"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                  <span>Đóng Bàn</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onSetMobileStep("MENU")}
              className="lg:hidden w-full py-2 rounded-xl text-xs font-bold text-brand-900 hover:bg-brand-50 border border-brand-200 transition-colors mt-1"
            >
              + Gọi Thêm Món
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
