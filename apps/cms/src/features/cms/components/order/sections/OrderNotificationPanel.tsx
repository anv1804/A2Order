import React from "react";
import { Icon } from "@/components/ui";
import { PendingSessionRequest, ServiceRequestItem } from "@/types";
import { PendingOrder } from "@/services/api/orderApi";
import { getServiceTypeInfo } from "../modals/QuickServiceModal";

interface OrderNotificationPanelProps {
  pendingOrders: PendingOrder[];
  serviceRequests: ServiceRequestItem[];
  pendingRequests: PendingSessionRequest[];
  notifTab: "ORDERS" | "SERVICE" | "OPEN_TABLE";
  onSelectNotifTab: (tab: "ORDERS" | "SERVICE" | "OPEN_TABLE") => void;
  isProcessingOrderId: string | null;
  isApprovingId: string | null;
  onOpenQuickService: () => void;
  onSelectTable: (tableId: string) => void;
  onApproveOrder: (order: PendingOrder) => Promise<void>;
  onRejectOrder: (order: PendingOrder) => void;
  onCompleteServiceRequest: (index: number, tableName?: string) => void;
  onApproveSession: (request: PendingSessionRequest) => Promise<void>;
  onRejectSession: (request: PendingSessionRequest) => void;
  formatTableName: (name?: string) => string;
}

export const OrderNotificationPanel: React.FC<OrderNotificationPanelProps> = ({
  pendingOrders,
  serviceRequests,
  pendingRequests,
  notifTab,
  onSelectNotifTab,
  isProcessingOrderId,
  isApprovingId,
  onOpenQuickService,
  onSelectTable,
  onApproveOrder,
  onRejectOrder,
  onCompleteServiceRequest,
  onApproveSession,
  onRejectSession,
  formatTableName,
}) => {
  const totalNotifCount = pendingOrders.length + serviceRequests.length + pendingRequests.length;

  if (totalNotifCount === 0) {
    return (
      <div className="bg-white p-3 rounded-2xl border border-surface-border shadow-2xs flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold text-xs border border-brand-200">
              <Icon name="bell" size={14} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-ink-primary">Thông Báo & Yêu Cầu</span>
                <span className="flex items-center gap-1 text-[10px] text-brand-800 font-bold bg-brand-50 px-1.5 py-0.2 rounded-md border border-brand-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
                  Trực Tuyến
                </span>
              </div>
              <p className="text-[10px] text-ink-muted">Không có yêu cầu chờ xử lý</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenQuickService}
            className="px-2.5 py-1 rounded-xl bg-surface-canvas hover:bg-brand-50 hover:text-brand-900 border border-surface-border text-[11px] font-bold text-ink-primary transition flex items-center gap-1.5 shadow-2xs"
            title="Ghi nhận yêu cầu phục vụ cho bàn"
          >
            <Icon name="bell" size={12} />
            <span>Yêu Cầu Bàn</span>
          </button>
        </div>
      </div>
    );
  }

  const currentTab =
    notifTab === "ORDERS" && pendingOrders.length > 0
      ? "ORDERS"
      : notifTab === "SERVICE" && serviceRequests.length > 0
      ? "SERVICE"
      : notifTab === "OPEN_TABLE" && pendingRequests.length > 0
      ? "OPEN_TABLE"
      : pendingOrders.length > 0
      ? "ORDERS"
      : serviceRequests.length > 0
      ? "SERVICE"
      : pendingRequests.length > 0
      ? "OPEN_TABLE"
      : notifTab;

  return (
    <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-md flex flex-col shrink-0 overflow-hidden animate-fadeIn">
      {/* Header khung thông báo cố định */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon name="bell" className="w-3.5 h-3.5 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-300 ring-2 ring-rose-500" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              Yêu Cầu Chờ Xử Lý ({totalNotifCount})
            </span>
            <span className="text-[9.5px] text-rose-100 font-medium">Cần nhân viên / thu ngân xác nhận</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenQuickService}
            className="text-[10px] font-black bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg transition"
            title="Thêm yêu cầu mới"
          >
            + Thêm
          </button>
        </div>
      </div>

      {/* Tabs chuyển đổi giữa 3 nhóm */}
      <div className="flex border-b border-surface-border bg-slate-50 text-xs font-bold shrink-0">
        <button
          type="button"
          onClick={() => onSelectNotifTab("ORDERS")}
          className={`flex-1 py-1.5 px-2 text-center transition flex items-center justify-center gap-1.5 border-b-2 text-[11px] ${
            currentTab === "ORDERS"
              ? "border-rose-600 text-rose-700 bg-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Icon name="clock" size={12} />
          <span>Đơn Chờ</span>
          <span
            className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
              pendingOrders.length > 0 ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {pendingOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectNotifTab("SERVICE")}
          className={`flex-1 py-1.5 px-2 text-center transition flex items-center justify-center gap-1.5 border-b-2 text-[11px] ${
            currentTab === "SERVICE"
              ? "border-rose-600 text-rose-700 bg-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Icon name="bell" size={12} />
          <span>Hỗ Trợ</span>
          <span
            className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
              serviceRequests.length > 0 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {serviceRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectNotifTab("OPEN_TABLE")}
          className={`flex-1 py-1.5 px-2 text-center transition flex items-center justify-center gap-1.5 border-b-2 text-[11px] ${
            currentTab === "OPEN_TABLE"
              ? "border-rose-600 text-rose-700 bg-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Icon name="key" size={12} />
          <span>Mở Bàn</span>
          <span
            className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
              pendingRequests.length > 0 ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {pendingRequests.length}
          </span>
        </button>
      </div>

      {/* Danh sách thẻ thông báo */}
      <div className="p-2 space-y-2 max-h-[200px] overflow-y-auto">
        {currentTab === "ORDERS" && (
          pendingOrders.length === 0 ? (
            <p className="text-center text-[10.5px] text-slate-400 py-3 italic">Không có đơn chờ duyệt</p>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.orderId} className="bg-brand-50/70 border border-brand-200 rounded-2xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => order.tableId && onSelectTable(order.tableId)}
                    className="font-black text-slate-900 hover:underline text-left"
                  >
                    {formatTableName(order.tableName)} ({order.tableCode})
                  </button>
                  <span className="font-black text-brand-900">{order.finalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
                <p className="text-[11px] text-slate-600 truncate">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</p>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    type="button"
                    disabled={isProcessingOrderId === order.orderId}
                    onClick={() => onRejectOrder(order)}
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition"
                  >
                    Từ Chối
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingOrderId === order.orderId}
                    onClick={() => onApproveOrder(order)}
                    className="flex-1 py-1 px-2.5 rounded-xl text-xs font-black bg-brand-900 hover:bg-brand-800 text-white transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Vào Bếp</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {currentTab === "SERVICE" && (
          serviceRequests.length === 0 ? (
            <p className="text-center text-[10.5px] text-slate-400 py-3 italic">Không có yêu cầu hỗ trợ</p>
          ) : (
            serviceRequests.map((req, idx) => {
              const sInfo = getServiceTypeInfo(req.type);
              return (
                <div key={req.id} className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => req.tableId && onSelectTable(req.tableId)}
                        className="font-black text-xs text-amber-950 hover:underline"
                      >
                        {formatTableName(req.tableName)}
                      </button>
                      <span className="text-[9.5px] text-slate-400 font-mono">{req.time}</span>
                    </div>
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mt-0.5">
                      <div className="w-5 h-5 rounded-md bg-white border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                        <Icon name={sInfo.icon} size={12} />
                      </div>
                      <span>{req.type}</span>
                    </div>
                    {req.note && <p className="text-[10px] text-slate-500 truncate italic mt-0.5">"{req.note}"</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onCompleteServiceRequest(idx, req.tableName)}
                    className="py-1 px-2.5 rounded-xl text-[11px] font-black bg-brand-900 hover:bg-brand-800 text-white transition shrink-0 shadow-2xs active:scale-95 flex items-center gap-1"
                  >
                    <Icon name="check" size={11} />
                    <span>Hoàn Tất</span>
                  </button>
                </div>
              );
            })
          )
        )}

        {currentTab === "OPEN_TABLE" && (
          pendingRequests.length === 0 ? (
            <p className="text-center text-[10.5px] text-slate-400 py-3 italic">Không có yêu cầu mở bàn</p>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.tableId} className="bg-amber-50/70 border border-amber-200 rounded-2xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectTable(req.tableId)}
                    className="font-black text-slate-900 hover:underline text-left"
                  >
                    {formatTableName(req.tableName)}
                  </button>
                  <span className="text-[10.5px] font-bold text-amber-800">{req.guestCount} khách</span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onRejectSession(req)}
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Từ Chối
                  </button>
                  <button
                    type="button"
                    disabled={isApprovingId === req.tableId}
                    onClick={() => onApproveSession(req)}
                    className="flex-1 py-1 px-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Mở Bàn</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
