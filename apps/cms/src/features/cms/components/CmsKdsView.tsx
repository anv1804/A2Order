import React, { useState, useEffect } from "react";
import { Button, Badge, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

type KdsStation = "KITCHEN" | "BAR" | "DESSERT";
type KdsStatus = "NEW" | "IN_PROGRESS" | "DONE";

interface KdsOrderItem {
  dishName: string;
  quantity: number;
  notes?: string;
}

interface KdsTicket {
  id: string;
  ticketCode: string;
  tableName: string;
  orderTime: string;
  orderTimestamp: number;
  status: KdsStatus;
  station: KdsStation;
  items: KdsOrderItem[];
  waiterName: string;
  priority?: "URGENT" | "NORMAL";
}

const MOCK_TICKETS: KdsTicket[] = [
  {
    id: "kt1",
    ticketCode: "#B04-001",
    tableName: "Bàn 04 (VIP 1)",
    orderTime: "18:42",
    orderTimestamp: Date.now() - 8 * 60 * 1000,
    status: "NEW",
    station: "KITCHEN",
    waiterName: "Minh Tuấn",
    priority: "URGENT",
    items: [
      { dishName: "Lẩu Thái Chua Cay", quantity: 1, notes: "Cay vừa, bỏ sả" },
      { dishName: "Thịt Bò Nhúng Mỡ Hành", quantity: 2 },
      { dishName: "Đậu Hũ Chiên Sốt Tứ Xuyên", quantity: 1, notes: "Không hành lá" },
    ],
  },
  {
    id: "kt2",
    ticketCode: "#B08-002",
    tableName: "Bàn 08 (Tầng 2)",
    orderTime: "18:39",
    orderTimestamp: Date.now() - 11 * 60 * 1000,
    status: "NEW",
    station: "KITCHEN",
    waiterName: "Thu Hà",
    items: [
      { dishName: "Cơm Chiên Hải Sản", quantity: 1 },
      { dishName: "Canh Chua Cá Lộc", quantity: 1 },
    ],
  },
  {
    id: "kt3",
    ticketCode: "#B02-003",
    tableName: "Bàn 02 (Tầng 1)",
    orderTime: "18:35",
    orderTimestamp: Date.now() - 15 * 60 * 1000,
    status: "IN_PROGRESS",
    station: "KITCHEN",
    waiterName: "Hồng Nhung",
    items: [
      { dishName: "Bò Nướng Lá Lốt", quantity: 2, notes: "Chín hoàn toàn" },
      { dishName: "Nem Nướng Nha Trang", quantity: 1 },
    ],
  },
  {
    id: "kt4",
    ticketCode: "#B12-004",
    tableName: "Bàn 12 (Sân Vườn)",
    orderTime: "18:41",
    orderTimestamp: Date.now() - 9 * 60 * 1000,
    status: "NEW",
    station: "BAR",
    waiterName: "Đức Minh",
    items: [
      { dishName: "Coca Cola Tươi", quantity: 3 },
      { dishName: "Bia Tiger Lon Bạc", quantity: 6 },
      { dishName: "Nước Suối Khoáng", quantity: 4 },
    ],
  },
  {
    id: "kt5",
    ticketCode: "#B03-005",
    tableName: "Bàn 03 (Tầng 1)",
    orderTime: "18:30",
    orderTimestamp: Date.now() - 20 * 60 * 1000,
    status: "IN_PROGRESS",
    station: "BAR",
    waiterName: "Ngọc Ánh",
    items: [
      { dishName: "Sinh Tố Bơ Đắk Lắk", quantity: 2, notes: "Ít đường" },
      { dishName: "Trà Đào Cam Sả", quantity: 2 },
    ],
  },
  {
    id: "kt6",
    ticketCode: "#B04-006",
    tableName: "Bàn 04 (VIP 1)",
    orderTime: "18:20",
    orderTimestamp: Date.now() - 30 * 60 * 1000,
    status: "DONE",
    station: "KITCHEN",
    waiterName: "Minh Tuấn",
    items: [
      { dishName: "Gỏi Cuốn Tôm Thịt", quantity: 2 },
      { dishName: "Chả Giò Chiên Giòn", quantity: 1 },
    ],
  },
];

function minutesAgo(ts: number): number {
  return Math.floor((Date.now() - ts) / 60000);
}

export const CmsKdsView: React.FC = () => {
  const [tickets, setTickets] = useState<KdsTicket[]>(MOCK_TICKETS);
  const [stationFilter, setStationFilter] = useState<"ALL" | KdsStation>("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleStartCooking = (ticket: KdsTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t))
    );
    toast.info(`Bếp đã nhận chế biến vé ${ticket.ticketCode} - ${ticket.tableName}`);
  };

  const handleDone = (ticket: KdsTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "DONE" } : t))
    );
    toast.success(`Vé ${ticket.ticketCode} đã xong! Phục vụ mang ra bàn.`);
  };

  const handleRecall = (ticket: KdsTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t))
    );
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
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          isOverdue
            ? "bg-amber-100 text-amber-900 border border-amber-300 font-extrabold"
            : isWarning
            ? "bg-amber-50 text-amber-800 border border-amber-200"
            : "bg-surface-canvas border border-surface-border text-ink-muted"
        }`}
      >
        <Icon name="clock" size={11} />
        <span>{mins} phút</span>
      </span>
    );
  };

  const renderTicket = (ticket: KdsTicket, col: KdsStatus) => {
    return (
      <div
        key={ticket.id}
        className={`rounded-2xl p-3.5 space-y-2.5 transition-all shadow-2xs ${
          col === "NEW"
            ? "bg-white border border-surface-border hover:border-amber-400"
            : col === "IN_PROGRESS"
            ? "bg-white border border-surface-border hover:border-brand-600"
            : "bg-white/80 border border-surface-border opacity-85 hover:opacity-100"
        }`}
      >
        {/* Header vé */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-sm text-ink-primary tracking-tight">
              {ticket.ticketCode}
            </span>
            {ticket.priority === "URGENT" && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-brand-900 text-white shadow-xs">
                GẤP
              </span>
            )}
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                ticket.station === "BAR"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {ticket.station === "BAR" ? "BAR" : "BẾP"}
            </span>
          </div>
          {renderTimer(ticket.orderTimestamp)}
        </div>

        {/* Thông tin bàn & nhân viên phục vụ */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted flex-wrap">
          <div className="flex items-center gap-1 font-bold text-ink-primary">
            <Icon name="table" size={13} className="text-ink-subtle" />
            <span>{ticket.tableName}</span>
          </div>
          <span>•</span>
          <span>Phục vụ: {ticket.waiterName}</span>
          <span>•</span>
          <span className="font-semibold">{ticket.orderTime}</span>
        </div>

        {/* Danh sách món ăn cần làm */}
        <div className="space-y-2 border-t border-surface-border/60 pt-2">
          {ticket.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-ink-primary block leading-snug">
                  {item.dishName}
                </span>
                {item.notes && (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded-md inline-block mt-0.5">
                    Ghi chú: {item.notes}
                  </span>
                )}
              </div>
              <span className="text-sm font-black text-brand-900 shrink-0">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Nút hành động thao tác */}
        <div className="pt-2 border-t border-surface-border/60">
          {col === "NEW" && (
            <Button
              size="sm"
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black gap-2 h-9 shadow-xs"
              onClick={() => handleStartCooking(ticket)}
            >
              <Icon name="flame" size={15} />
              <span>Bắt Đầu Làm</span>
            </Button>
          )}
          {col === "IN_PROGRESS" && (
            <Button
              size="sm"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black gap-2 h-9 shadow-xs"
              onClick={() => handleDone(ticket)}
            >
              <Icon name="check" size={15} />
              <span>Xong ➔ Đưa Ra Bàn</span>
            </Button>
          )}
          {col === "DONE" && (
            <button
              type="button"
              onClick={() => handleRecall(ticket)}
              className="text-[11px] text-ink-muted hover:text-brand-900 font-bold w-full text-center hover:underline py-1 transition-colors"
            >
              ↩ Thu hồi (làm lại)
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-20">
      {/* Tiêu đề & Cài đặt âm thanh thông báo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Màn Hình Bếp & Bar (KDS)
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px] animate-pulse">
              Live
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Vé chế biến tự động cập nhật từ đơn POS & QR • Xử lý theo thứ tự ưu tiên.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs self-start sm:self-auto ${
            soundEnabled
              ? "bg-brand-900 text-white border-brand-900 shadow-xs"
              : "bg-white text-ink-muted border-surface-border hover:bg-surface-canvas"
          }`}
          aria-label="Cài đặt âm báo bếp"
        >
          <Icon name="bell" size={14} className={soundEnabled ? "text-amber-300" : "text-ink-subtle"} />
          <span>Âm Thanh: {soundEnabled ? "Bật" : "Tắt"}</span>
        </button>
      </div>

      {/* Bộ lọc trạm chế biến & Trạng thái cập nhật */}
      <div className="flex items-center justify-between gap-2 flex-wrap p-2 bg-white rounded-2xl border border-surface-border shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "Tất Cả", count: filtered.length },
            {
              id: "KITCHEN",
              label: "Bếp Nóng",
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
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  stationFilter === s.id
                    ? "bg-white/20 text-white"
                    : "bg-surface-muted text-ink-muted font-black"
                }`}
              >
                {s.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted font-bold px-2 ml-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Cập nhật:{" "}
            {new Date(now).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* 3 Cột Kanban tiến trình chế biến */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột 1: Đơn Mới */}
        <div className="space-y-3 bg-surface-canvas/60 p-3 rounded-3xl border border-surface-border/80">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
              <span className="text-sm font-black text-ink-primary">Đơn Mới</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 shadow-2xs">
              {newTickets.length}
            </span>
          </div>

          {newTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-surface-border p-8 text-center bg-white/60">
              <p className="text-xs text-ink-muted font-bold">Không có vé mới chờ làm</p>
            </div>
          ) : (
            newTickets.map((t) => renderTicket(t, "NEW"))
          )}
        </div>

        {/* Cột 2: Đang Chế Biến */}
        <div className="space-y-3 bg-surface-canvas/60 p-3 rounded-3xl border border-surface-border/80">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-900 shadow-xs" />
              <span className="text-sm font-black text-ink-primary">Đang Chế Biến</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-100 text-brand-900 shadow-2xs">
              {inProgressTickets.length}
            </span>
          </div>

          {inProgressTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-surface-border p-8 text-center bg-white/60">
              <p className="text-xs text-ink-muted font-bold">Bếp đang rảnh rỗi</p>
            </div>
          ) : (
            inProgressTickets.map((t) => renderTicket(t, "IN_PROGRESS"))
          )}
        </div>

        {/* Cột 3: Hoàn Thành */}
        <div className="space-y-3 bg-surface-canvas/60 p-3 rounded-3xl border border-surface-border/80">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-xs" />
              <span className="text-sm font-black text-ink-primary">Hoàn Thành</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 shadow-2xs">
              {doneTickets.length}
            </span>
          </div>

          {doneTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-surface-border p-8 text-center bg-white/60">
              <p className="text-xs text-ink-muted font-bold">Chưa có vé nào hoàn thành</p>
            </div>
          ) : (
            doneTickets.map((t) => renderTicket(t, "DONE"))
          )}
        </div>
      </div>
    </div>
  );
};
