import React, { useState, useEffect } from "react";
import { Button, Badge, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { KdsStation, KdsStatus, KdsOrderItem, CmsKdsTicket } from "@/types/kds.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";
import { SocketEvents } from "@a2order/shared";
import { sound } from "@/lib/sound";
import { orderApi } from "@/services/api/orderApi";
import { requestApi } from "@/services/api/apiClient";

const MOCK_TICKETS: CmsKdsTicket[] = [];

function minutesAgo(ts: number): number {
  return Math.floor((Date.now() - ts) / 60000);
}

export const CmsKdsView: React.FC = () => {
  const [tickets, setTickets] = usePersistentState<CmsKdsTicket[]>("kds_tickets_data", []);
  const [stationFilter, setStationFilter] = usePersistentState<"ALL" | KdsStation>("kds_station_filter", "ALL");
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("kds_sound_enabled", true);
  const [now, setNow] = useState(Date.now());

  const userStr = typeof window !== "undefined" ? localStorage.getItem("a2order_current_user") || localStorage.getItem("user") : null;
  const storeId = userStr ? JSON.parse(userStr).storeId || "store-bubble-tea" : "store-bubble-tea";

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // 1. Tải danh sách vé từ Backend API khi mở màn hình Bếp
  useEffect(() => {
    requestApi<any>(`/orders/${storeId}/kds/tickets`).then((res) => {
      const serverTickets = res && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      if (serverTickets.length > 0) {
        setTickets((prev) => {
          const map = new Map<string, CmsKdsTicket>();
          serverTickets.forEach((t: any) => map.set(t.id, t));
          prev.forEach((t) => {
            if (!map.has(t.id) || t.status === "DONE" || t.status === "IN_PROGRESS") {
              map.set(t.id, t);
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
  }, [storeId, setTickets]);

  // 2. Lắng nghe WebSocket sự kiện thời gian thực (Bàn -> Thu ngân -> Bếp KDS)
  useEffect(() => {
    const socket = getSocketClient();
    joinStoreRoom(storeId);

    const handleNewOrder = (payload: any) => {
      if (!payload || !payload.items || payload.items.length === 0) return;
      if (payload.storeId && payload.storeId !== storeId) return;

      const orderId = payload.orderId || `ord-${Date.now()}`;
      const nowTs = payload.submittedAt || Date.now();
      const newTicket: CmsKdsTicket = {
        id: orderId,
        ticketCode: orderId.slice(-6).toUpperCase(),
        tableName: payload.tableName || `Bàn ${payload.tableCode || ""}`,
        station: "KITCHEN",
        status: "NEW",
        orderTime: new Date(nowTs).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        orderTimestamp: nowTs,
        createdAt: nowTs,
        waiterName: payload.waiterName || "Khách QR",
        priority: payload.priority || "NORMAL",
        items: payload.items.map((it: any) => ({
          id: it.id || `kds-it-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          dishName: it.name || it.dishName || "Món ăn",
          name: it.name || it.dishName || "Món ăn",
          quantity: it.quantity || 1,
          notes: it.notes,
        })),
      };

      setTickets((prev) => {
        if (prev.some((t) => t.id === newTicket.id)) return prev;
        return [newTicket, ...prev];
      });

      if (soundEnabled) {
        sound.playKitchenChime();
      }
      toast.info(`🔔 Bếp có đơn mới: ${newTicket.tableName} (${newTicket.items.length} món)`);
    };

    const handleItemCancelled = (payload: any) => {
      if (!payload || !payload.itemId) return;
      setTickets((prev) =>
        prev.map((t) => ({
          ...t,
          items: t.items.map((it) =>
            it.id === payload.itemId ? { ...it, isCanceled: true } : it
          ),
        }))
      );
      toast.warning(`⚠️ Món ${payload.dishName || ""} tại ${payload.tableName || "bàn"} đã bị hủy!`);
    };

    const handleItemStatusChanged = (payload: any) => {
      if (!payload || !payload.itemId) return;
      setTickets((prev) =>
        prev.map((t) => ({
          ...t,
          items: t.items.map((it) =>
            it.id === payload.itemId ? { ...it, status: payload.status } : it
          ),
        }))
      );
    };

    socket.on(SocketEvents.ORDER_APPROVED, handleNewOrder);
    socket.on(SocketEvents.ORDER_SUBMITTED, handleNewOrder);
    socket.on(SocketEvents.ORDER_ITEM_CANCELLED, handleItemCancelled);
    socket.on(SocketEvents.ORDER_ITEM_STATUS_CHANGED, handleItemStatusChanged);

    return () => {
      socket.off(SocketEvents.ORDER_APPROVED, handleNewOrder);
      socket.off(SocketEvents.ORDER_SUBMITTED, handleNewOrder);
      socket.off(SocketEvents.ORDER_ITEM_CANCELLED, handleItemCancelled);
      socket.off(SocketEvents.ORDER_ITEM_STATUS_CHANGED, handleItemStatusChanged);
    };
  }, [storeId, soundEnabled, setTickets]);

  const handleStartCooking = (ticket: CmsKdsTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t))
    );
    ticket.items.forEach((it) => {
      if (it.id) {
        orderApi.updateItemStatus(it.id, {
          storeId,
          status: "COOKING",
          dishName: it.dishName || it.name,
        }).catch(() => {});
      }
    });
    toast.info(`Bếp đã nhận chế biến vé ${ticket.ticketCode} - ${ticket.tableName}`);
  };

  const handleDone = (ticket: CmsKdsTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "DONE" } : t))
    );
    ticket.items.forEach((it) => {
      if (it.id) {
        orderApi.updateItemStatus(it.id, {
          storeId,
          status: "SERVED",
          dishName: it.dishName || it.name,
        }).catch(() => {});
      }
    });
    if (soundEnabled) {
      sound.playKitchenChime();
    }
    toast.success(`Vé ${ticket.ticketCode} (${ticket.tableName}) đã nấu xong! Phục vụ lên món.`);
  };

  const handleRecall = (ticket: CmsKdsTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t))
    );
    ticket.items.forEach((it) => {
      if (it.id) {
        orderApi.updateItemStatus(it.id, {
          storeId,
          status: "COOKING",
          dishName: it.dishName || it.name,
        }).catch(() => {});
      }
    });
    toast.info(`Đã thu hồi vé ${ticket.ticketCode} về trạng thái Đang Chế Biến`);
  };

  const filtered =
    stationFilter === "ALL"
      ? tickets
      : tickets.filter((t) => t.station === stationFilter);
  const newTickets = filtered.filter((t) => t.status === "NEW");
  const inProgressTickets = filtered.filter((t) => t.status === "IN_PROGRESS");
  const doneTickets = filtered.filter((t) => t.status === "DONE");

  const renderTimer = (ts: number) => {
    const mins = minutesAgo(ts);
    const isOverdue = mins > 12;
    const isWarning = mins > 8;
    return (
      <span
        className={`text-[10.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs border ${
          isOverdue
            ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
            : isWarning
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-200/80"
        }`}
      >
        <Icon name="clock" size={11} />
        <span>{mins} phút</span>
      </span>
    );
  };

  const renderTicket = (ticket: CmsKdsTicket, col: KdsStatus) => {
    return (
      <div
        key={ticket.id}
        className={`rounded-2xl p-3.5 space-y-3 transition-all shadow-2xs bg-white border ${
          col === "NEW"
            ? "border-amber-200/90 hover:border-amber-400 hover:shadow-md"
            : col === "IN_PROGRESS"
            ? "border-emerald-300 hover:border-emerald-500 hover:shadow-md"
            : "border-slate-200 opacity-80 hover:opacity-100"
        }`}
      >
        {/* Header vé */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-black text-sm text-slate-900 tracking-tight">
              {ticket.ticketCode}
            </span>
            {ticket.priority === "REMAKE" && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-600 text-white shadow-2xs animate-pulse flex items-center gap-1">
                <Icon name="flame" size={10} />
                LÀM LẠI - GẤP
              </span>
            )}
            {ticket.priority === "URGENT" && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-600 text-white shadow-2xs">
                GẤP
              </span>
            )}
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                ticket.station === "BAR"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {ticket.station === "BAR" ? "QUẦY BAR" : "BẾP NẤU"}
            </span>
          </div>
          {renderTimer(ticket.orderTimestamp)}
        </div>

        {/* Thông tin bàn & nhân viên phục vụ */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold flex-wrap bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1 font-black text-slate-900">
            <Icon name="table" size={13} className="text-slate-400" />
            <span>{ticket.tableName}</span>
          </div>
          <span className="text-slate-300">•</span>
          <span>Phục vụ: {ticket.waiterName}</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-700">{ticket.orderTime}</span>
        </div>

        {/* Cảnh báo làm lại khẩn cấp nếu có */}
        {ticket.remakeReason && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 text-[10px] font-bold p-2 rounded-xl flex items-start gap-1.5">
            <Icon name="alert" size={12} className="shrink-0 text-rose-600 mt-0.5" />
            <span>Khách yêu cầu làm lại: <strong>{ticket.remakeReason}</strong></span>
          </div>
        )}

        {/* Cảnh báo khách hủy món nếu có */}
        {ticket.cancelReason && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-black p-2 rounded-xl flex items-start gap-1.5">
            <Icon name="alert" size={12} className="shrink-0 text-amber-700 mt-0.5" />
            <span>{ticket.cancelReason}</span>
          </div>
        )}

        {/* Danh sách món ăn cần làm */}
        <div className="space-y-2 border-t border-slate-100 pt-2.5">
          {ticket.items.map((item: KdsOrderItem, idx: number) => (
            <div key={idx} className={`flex items-start justify-between gap-2 ${item.isCanceled ? "opacity-50 line-through" : ""}`}>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-900 block leading-snug">
                  {item.dishName}
                </span>
                {item.isCanceled && (
                  <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded inline-block mt-0.5 no-underline">
                    ĐÃ HỦY - DỪNG NẤU
                  </span>
                )}
                {item.notes && !item.isCanceled && (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md inline-block mt-1">
                    Ghi chú: {item.notes}
                  </span>
                )}
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg border shrink-0 ${
                item.isCanceled ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-950 border-emerald-200/70"
              }`}>
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Nút hành động thao tác */}
        <div className="pt-2.5 border-t border-slate-100">
          {col === "NEW" && (
            <button
              type="button"
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black gap-1.5 h-9 shadow-xs flex items-center justify-center active:scale-95 transition"
              onClick={() => handleStartCooking(ticket)}
            >
              <Icon name="flame" size={15} />
              <span>Bắt Đầu Nấu</span>
            </button>
          )}
          {col === "IN_PROGRESS" && (
            <button
              type="button"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black gap-1.5 h-9 shadow-xs flex items-center justify-center active:scale-95 transition"
              onClick={() => handleDone(ticket)}
            >
              <Icon name="check" size={15} />
              <span>Hoàn Thành ➔ Đưa Ra Bàn</span>
            </button>
          )}
          {col === "DONE" && (
            <button
              type="button"
              onClick={() => handleRecall(ticket)}
              className="text-[11px] text-slate-500 hover:text-rose-700 font-bold w-full text-center hover:underline py-1 transition-colors"
            >
              ↩ Thu hồi (làm lại vé này)
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Bếp & Pha Chế
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {newTickets.length} Vé chờ nấu • {inProgressTickets.length} Đang trên bếp
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              Bếp & Pha Chế
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              Nhận món từ bàn, điều phối chế biến và thông báo trả món
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="flame" size={12} className="text-amber-300" />
                <span>Bếp nóng & Lẩu</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="activity" size={12} className="text-blue-300" />
                <span>Quầy Bar & Pha chế</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="clock" size={12} className="text-teal-300" />
                <span>Thời gian chuẩn: &lt; 10 phút/món</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 sm:px-4 text-xs font-black shadow-sm transition active:scale-95 shrink-0 ${
                soundEnabled
                  ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              }`}
              aria-label="Cài đặt âm báo bếp"
            >
              <Icon name="bell" size={14} className={soundEnabled ? "text-slate-950" : "text-emerald-300"} />
              <span>Chuông Báo: {soundEnabled ? "Bật" : "Tắt"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4 Thẻ Bento Chỉ Số KDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Icon name="clock" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
              Chờ làm
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Vé Chờ Chế Biến
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {newTickets.length} <span className="text-xs font-bold text-slate-400">vé</span>
            </p>
            <p className="text-[10px] font-semibold text-amber-600 mt-1 truncate">
              Cần nhận làm ngay
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Icon name="flame" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
              Đang nấu
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Đang Chế Biến
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {inProgressTickets.length} <span className="text-xs font-bold text-slate-400">vé</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-600 mt-1 truncate">
              Đang trên bếp & quầy pha
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="checkCircle" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              Hoàn tất
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Đã Ra Bàn Ca Này
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {doneTickets.length} <span className="text-xs font-bold text-slate-400">vé</span>
            </p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-1 truncate">
              Đã phục vụ khách dùng
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon name="activity" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              Tốc độ
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Tốc Độ Ra Món TB
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              8.5 <span className="text-xs font-bold text-slate-400">phút/món</span>
            </p>
            <p className="text-[10px] font-semibold text-blue-600 mt-1 truncate">
              Đạt chuẩn vận hành (&lt; 12p)
            </p>
          </div>
        </article>
      </section>

      {/* 3. Sticky Station Toolbar */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "Tất Cả Trạm", count: filtered.length },
            {
              id: "KITCHEN",
              label: "Bếp Nóng & Lẩu",
              count: tickets.filter((t) => t.station === "KITCHEN").length,
            },
            {
              id: "BAR",
              label: "Bar & Đồ Uống",
              count: tickets.filter((t) => t.station === "BAR").length,
            },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStationFilter(s.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                stationFilter === s.id
                  ? "bg-slate-950 text-white shadow-2xs font-black"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  stationFilter === s.id
                    ? "bg-white/20 text-white"
                    : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                {s.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold px-2 ml-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Đồng bộ:{" "}
            {new Date(now).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* 4. 3 Cột Kanban tiến trình chế biến */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Cột 1: Đơn Mới */}
        <div className="space-y-3 bg-white/70 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-slate-900">1. Chờ Chế Biến</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
              {newTickets.length} vé
            </span>
          </div>

          {newTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <p className="text-xs text-slate-400 font-bold">Không có vé mới chờ làm</p>
            </div>
          ) : (
            newTickets.map((t) => renderTicket(t, "NEW"))
          )}
        </div>

        {/* Cột 2: Đang Chế Biến */}
        <div className="space-y-3 bg-white/70 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-xs" />
              <span className="text-xs sm:text-sm font-black text-slate-900">2. Đang Trên Bếp</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
              {inProgressTickets.length} vé
            </span>
          </div>

          {inProgressTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <p className="text-xs text-slate-400 font-bold">Bếp đang rảnh rỗi</p>
            </div>
          ) : (
            inProgressTickets.map((t) => renderTicket(t, "IN_PROGRESS"))
          )}
        </div>

        {/* Cột 3: Hoàn Thành */}
        <div className="space-y-3 bg-white/70 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span className="text-xs sm:text-sm font-black text-slate-900">3. Đã Xong (Ra Bàn)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              {doneTickets.length} vé
            </span>
          </div>

          {doneTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <p className="text-xs text-slate-400 font-bold">Chưa có vé nào hoàn thành</p>
            </div>
          ) : (
            doneTickets.map((t) => renderTicket(t, "DONE"))
          )}
        </div>
      </div>
    </div>
  );
};
