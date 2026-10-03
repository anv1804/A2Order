import React from "react";
import { Icon } from "@/components/ui";
import { WaiterTableOrder, PendingSessionRequest, ServiceRequestItem } from "@/types";
import { PendingOrder } from "@/services/api/orderApi";
import { getServiceTypeInfo } from "../modals/QuickServiceModal";

interface OrderTableGridSectionProps {
  tables: WaiterTableOrder[];
  filteredTables: WaiterTableOrder[];
  activeTable: WaiterTableOrder;
  tableSearchQuery: string;
  onChangeTableSearchQuery: (query: string) => void;
  tableStatusFilter: string;
  onChangeTableStatusFilter: (status: string) => void;
  zones: string[];
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  pendingRequests: PendingSessionRequest[];
  serviceRequests: ServiceRequestItem[];
  pendingOrders: PendingOrder[];
  isApprovingId: string | null;
  onSelectTable: (tableId: string) => void;
  onApproveSession: (req: PendingSessionRequest) => Promise<void>;
  onNavigateTab?: (tab: string) => void;
  onResetFilters: () => void;
}

export const OrderTableGridSection: React.FC<OrderTableGridSectionProps> = ({
  tables,
  filteredTables,
  activeTable,
  tableSearchQuery,
  onChangeTableSearchQuery,
  tableStatusFilter,
  onChangeTableStatusFilter,
  zones,
  selectedZone,
  onSelectZone,
  pendingRequests,
  serviceRequests,
  pendingOrders,
  isApprovingId,
  onSelectTable,
  onApproveSession,
  onNavigateTab,
  onResetFilters,
}) => {
  return (
    <div className="bg-white p-3 sm:p-3.5 rounded-3xl border border-surface-border shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden h-full space-y-2">
      {/* Header Bàn Phục Vụ */}
      <div className="flex items-center justify-between gap-1.5 border-b border-surface-border pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon name="table" className="w-4 h-4 text-brand-900" />
          <span className="text-xs font-black uppercase tracking-wider text-ink-primary">
            Bàn Phục Vụ
          </span>
          <span className="text-xs text-ink-muted">({filteredTables.length}/{tables.length})</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab?.("tables")}
          className="text-[11px] font-bold text-brand-900 hover:text-brand-950 flex items-center gap-1 hover:underline shrink-0 px-2 py-1 rounded-lg bg-brand-50 border border-brand-200"
          title="Mở sơ đồ phòng bàn để Mở bàn / Đóng bàn"
        >
          <span>Quản Lý Bàn</span>
          <Icon name="arrowRight" size={10} />
        </button>
      </div>

      {/* Ô TÌM KIẾM BÀN PHỤC VỤ (Table Search) */}
      <div className="relative shrink-0">
        <Icon name="search" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={tableSearchQuery}
          onChange={(e) => onChangeTableSearchQuery(e.target.value)}
          placeholder="Tìm tên, số bàn, mã PIN..."
          className="w-full h-8.5 pl-8 pr-7 rounded-xl border border-surface-border text-xs font-semibold focus:outline-none focus:border-brand-700 bg-surface-canvas transition placeholder:text-slate-400"
        />
        {tableSearchQuery && (
          <button
            type="button"
            onClick={() => onChangeTableSearchQuery("")}
            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5"
            title="Xóa tìm kiếm"
          >
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {/* Filter Trạng Thái & Khu Vực */}
      <div className="flex items-center gap-1.5 shrink-0">
        <select
          value={tableStatusFilter}
          onChange={(e) => onChangeTableStatusFilter(e.target.value)}
          className="h-7 px-2 rounded-lg border border-surface-border text-[10.5px] font-bold bg-white text-slate-700 focus:outline-none cursor-pointer shrink-0 shadow-2xs"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="EMPTY">Bàn trống</option>
          <option value="OCCUPIED">Đang có khách</option>
          <option value="WAITING_FOOD">Đang chờ món</option>
          <option value="NEEDS_SERVICE">Cần hỗ trợ</option>
        </select>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold no-scrollbar py-0.5">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => onSelectZone(z)}
              className={`px-2 py-0.5 rounded-full transition-all shrink-0 text-[10px] ${
                selectedZone === z
                  ? "bg-brand-900 text-white font-black shadow-xs"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách thẻ bàn: 1 cột rộng rãi, dễ đọc, không bị bóp méo chữ */}
      <div className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-2">
        {filteredTables.length === 0 ? (
          <div className="py-10 px-3 text-center rounded-2xl border border-dashed border-surface-border bg-surface-canvas/50">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-2">
              <Icon name="table" className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-ink-primary">
              {tableSearchQuery || tableStatusFilter !== "ALL" ? "Không có bàn phù hợp bộ lọc" : "Chưa có bàn nào"}
            </p>
            {(tableSearchQuery || tableStatusFilter !== "ALL") && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-2 text-xs font-bold text-brand-900 underline"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredTables.map((t) => {
            const isSelected = t.tableId === activeTable.tableId;
            const pendingReq = pendingRequests.find((r) => r.tableId === t.tableId);
            const tableServiceReq = serviceRequests.find((r) => r.tableId === t.tableId);
            const tablePendingOrder = pendingOrders.find((o) => o.tableId === t.tableId);

            return (
              <button
                key={t.tableId}
                type="button"
                onClick={() => onSelectTable(t.tableId)}
                className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between active:scale-98 ${
                  pendingReq
                    ? "border-amber-500 ring-2 ring-amber-400 bg-amber-50/90 shadow-md animate-pulse"
                    : tableServiceReq
                    ? "border-amber-500 ring-2 ring-amber-400 bg-amber-50/90 shadow-md"
                    : tablePendingOrder
                    ? "border-rose-400 ring-2 ring-rose-400 bg-rose-50/90 shadow-md"
                    : isSelected
                    ? "border-brand-900 ring-2 ring-brand-900/20 shadow-md bg-brand-50/40"
                    : t.status === "EMPTY"
                    ? "border-surface-border bg-white hover:border-brand-200"
                    : t.status === "OCCUPIED"
                    ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                    : t.status === "WAITING_FOOD"
                    ? "border-purple-300 bg-purple-50/50 hover:border-purple-400"
                    : "border-rose-400 bg-rose-50/60 hover:border-rose-500 animate-pulse"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-ink-primary block truncate">{t.tableName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mt-0.5">
                      <span>{t.zoneName}</span>
                      {t.pin && (
                        <span className="font-mono font-bold text-[9px] px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          PIN: {t.pin}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[9.5px] font-black shrink-0 ${
                      t.status === "EMPTY"
                        ? "bg-slate-100 text-slate-500"
                        : t.status === "OCCUPIED"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : t.status === "WAITING_FOOD"
                        ? "bg-purple-100 text-purple-900 border border-purple-200"
                        : "bg-rose-100 text-rose-900 border border-rose-200 animate-pulse"
                    }`}
                  >
                    {t.status === "EMPTY" ? "Trống" : t.status === "OCCUPIED" ? "Có khách" : t.status === "WAITING_FOOD" ? "Chờ món" : "Tính tiền"}
                  </span>
                </div>

                {/* Cảnh báo yêu cầu đang chờ xử lý trên bàn */}
                {tableServiceReq && (
                  <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                    <Icon name={getServiceTypeInfo(tableServiceReq.type).icon} size={11} />
                    <span className="truncate">{tableServiceReq.type}</span>
                  </div>
                )}
                {tablePendingOrder && (
                  <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                    <Icon name="clock" size={11} />
                    <span className="truncate">Đơn chờ duyệt ({tablePendingOrder.items.length} món)</span>
                  </div>
                )}

                <div className="mt-2 pt-1.5 border-t border-surface-border/40 flex items-center justify-between text-[11px]">
                  {pendingReq ? (
                    <span className="text-[10.5px] font-black text-amber-900 flex items-center gap-1">
                      <Icon name="bell" size={11} />
                      <span>Chờ duyệt mở bàn</span>
                    </span>
                  ) : t.status !== "EMPTY" && t.items.length > 0 ? (
                    <>
                      <span className="font-black text-brand-950">{t.totalAmount.toLocaleString("vi-VN")} đ</span>
                      <span className="text-[10px] text-ink-muted">{t.items.length} món</span>
                    </>
                  ) : t.status !== "EMPTY" ? (
                    <>
                      <span className="font-bold text-brand-800 text-[10.5px] flex items-center gap-1">
                        <Icon name="users" size={11} />
                        <span>{t.guestCount || 2} khách</span>
                      </span>
                      <span className="text-[10px] text-ink-muted">Vào {t.openedAt || "--:--"}</span>
                    </>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic">Bàn trống</span>
                  )}
                </div>

                {pendingReq && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApproveSession(pendingReq);
                    }}
                    disabled={isApprovingId === pendingReq.tableId}
                    className="w-full mt-2 py-1 px-1.5 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-xs transition disabled:opacity-50"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Mở Bàn</span>
                  </button>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
