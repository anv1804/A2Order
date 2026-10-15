import React from "react";
import { Icon } from "@/components/ui";
import { PendingSessionRequest, PendingOrder } from "@/types";

export interface ServiceRequestItem {
  id: string;
  tableId?: string;
  tableName?: string;
  type: string;
  note?: string;
  time?: string;
}

export interface StaffOrderNotificationFeedProps {
  pendingOrders: PendingOrder[];
  serviceRequests: ServiceRequestItem[];
  pendingRequests: PendingSessionRequest[];
  notifTab: "ORDERS" | "SERVICE" | "OPEN_TABLE";
  setNotifTab: (tab: "ORDERS" | "SERVICE" | "OPEN_TABLE") => void;
  isProcessingOrderId: string | null;
  isApprovingId: string | null;
  onRejectOrder: (order: PendingOrder) => void;
  onApproveOrder: (order: PendingOrder) => Promise<void>;
  onRemoveServiceRequest: (idx: number) => void;
  onRejectSession: (req: PendingSessionRequest) => void;
  onApproveSession: (req: PendingSessionRequest) => Promise<void>;
  formatTableName: (name?: string) => string;
}

export const StaffOrderNotificationFeed: React.FC<StaffOrderNotificationFeedProps> = ({
  pendingOrders,
  serviceRequests,
  pendingRequests,
  notifTab,
  setNotifTab,
  isProcessingOrderId,
  isApprovingId,
  onRejectOrder,
  onApproveOrder,
  onRemoveServiceRequest,
  onRejectSession,
  onApproveSession,
  formatTableName,
}) => {
  const totalNotifCount = pendingOrders.length + serviceRequests.length + pendingRequests.length;
  if (totalNotifCount === 0) return null;

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
    <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-sm flex flex-col shrink-0 overflow-hidden animate-fadeIn">
      {/* Header khung thông báo cố định */}
      <div className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon name="bell" className="w-3.5 h-3.5 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-300" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider">
            Yêu Cầu Chờ Xử Lý ({totalNotifCount})
          </span>
        </div>
        <div className="flex items-center gap-1">
          {pendingOrders.length > 0 && (
            <span className="text-[9.5px] font-black bg-white/20 px-2 py-0.5 rounded-full">
              🍽️ {pendingOrders.length}
            </span>
          )}
          {serviceRequests.length > 0 && (
            <span className="text-[9.5px] font-black bg-white/20 px-2 py-0.5 rounded-full">
              ⚡ {serviceRequests.length}
            </span>
          )}
          {pendingRequests.length > 0 && (
            <span className="text-[9.5px] font-black bg-white/20 px-2 py-0.5 rounded-full">
              🔑 {pendingRequests.length}
            </span>
          )}
        </div>
      </div>

      {/* Tabs chuyển đổi giữa 3 nhóm */}
      <div className="flex border-b border-surface-border bg-slate-50 text-xs font-bold shrink-0">
        <button
          type="button"
          onClick={() => setNotifTab("ORDERS")}
          className={`flex-1 py-1.5 px-2 text-center transition flex items-center justify-center gap-1 border-b-2 text-[11px] ${
            currentTab === "ORDERS"
              ? "border-rose-600 text-rose-700 bg-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
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
          onClick={() => setNotifTab("SERVICE")}
          className={`flex-1 py-1.5 px-2 text-center transition flex items-center justify-center gap-1 border-b-2 text-[11px] ${
            currentTab === "SERVICE"
              ? "border-rose-600 text-rose-700 bg-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Hỗ Trợ</span>
          <span
            className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
              serviceRequests.length > 0 ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {serviceRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setNotifTab("OPEN_TABLE")}
          className={`flex-1 py-1.5 px-2 text-center transition flex items-center justify-center gap-1 border-b-2 text-[11px] ${
            currentTab === "OPEN_TABLE"
              ? "border-rose-600 text-rose-700 bg-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
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
      <div className="p-2 space-y-2 max-h-[190px] overflow-y-auto">
        {currentTab === "ORDERS" &&
          (pendingOrders.length === 0 ? (
            <p className="text-center text-[10.5px] text-slate-400 py-3 italic">Không có đơn chờ duyệt</p>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.orderId} className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">
                    {formatTableName(order.tableName)} ({order.tableCode})
                  </span>
                  <span className="font-black text-emerald-800">{order.finalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
                <p className="text-[11px] text-slate-600 truncate">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </p>
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
                    onClick={async () => {
                      await onApproveOrder(order);
                    }}
                    className="flex-1 py-1 px-2.5 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Vào Bếp</span>
                  </button>
                </div>
              </div>
            ))
          ))}

        {currentTab === "SERVICE" &&
          (serviceRequests.length === 0 ? (
            <p className="text-center text-[10.5px] text-slate-400 py-3 italic">Không có yêu cầu hỗ trợ</p>
          ) : (
            serviceRequests.map((req, idx) => (
              <div
                key={req.id}
                className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-black text-xs text-slate-900">{formatTableName(req.tableName)}: </span>
                  <span className="text-xs font-bold text-indigo-700">{req.type}</span>
                  {req.note && <p className="text-[10px] text-slate-500 truncate italic">{req.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveServiceRequest(idx)}
                  className="py-1 px-2 rounded-xl text-[11px] font-bold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0"
                >
                  ✓ Xong
                </button>
              </div>
            ))
          ))}

        {currentTab === "OPEN_TABLE" &&
          (pendingRequests.length === 0 ? (
            <p className="text-center text-[10.5px] text-slate-400 py-3 italic">Không có yêu cầu mở bàn</p>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.tableId} className="bg-amber-50/70 border border-amber-200 rounded-2xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">{formatTableName(req.tableName)}</span>
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
                    onClick={async () => {
                      await onApproveSession(req);
                    }}
                    className="flex-1 py-1 px-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Mở Bàn</span>
                  </button>
                </div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
};
