import React, { useState, useEffect } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
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
    id: "kt1", ticketCode: "#B04-001", tableName: "Ban 04 (VIP 1)", orderTime: "18:42",
    orderTimestamp: Date.now() - 8 * 60 * 1000, status: "NEW", station: "KITCHEN",
    waiterName: "Minh Tuan", priority: "URGENT",
    items: [
      { dishName: "Lau Thai Chua Cay", quantity: 1, notes: "Cay vua, bo sa" },
      { dishName: "Thit Bo Nhung Mo Hanh", quantity: 2 },
      { dishName: "Dau Hu Chien Sot Tu Xuyen", quantity: 1, notes: "Khong hanh la" },
    ],
  },
  {
    id: "kt2", ticketCode: "#B08-002", tableName: "Ban 08 (Tang 2)", orderTime: "18:39",
    orderTimestamp: Date.now() - 11 * 60 * 1000, status: "NEW", station: "KITCHEN",
    waiterName: "Thu Ha",
    items: [
      { dishName: "Com Chien Hai San", quantity: 1 },
      { dishName: "Canh Chua Ca Loc", quantity: 1 },
    ],
  },
  {
    id: "kt3", ticketCode: "#B02-003", tableName: "Ban 02 (Tang 1)", orderTime: "18:35",
    orderTimestamp: Date.now() - 15 * 60 * 1000, status: "IN_PROGRESS", station: "KITCHEN",
    waiterName: "Hong Nhung",
    items: [
      { dishName: "Bo Nuong La Lot", quantity: 2, notes: "Chin hoan toan" },
      { dishName: "Nem Nuong Nha Trang", quantity: 1 },
    ],
  },
  {
    id: "kt4", ticketCode: "#B12-004", tableName: "Ban 12 (San vuon)", orderTime: "18:41",
    orderTimestamp: Date.now() - 9 * 60 * 1000, status: "NEW", station: "BAR",
    waiterName: "Duc Minh",
    items: [
      { dishName: "Coca Cola", quantity: 3 },
      { dishName: "Bia Tiger Lon", quantity: 6 },
      { dishName: "Nuoc Suoi", quantity: 4 },
    ],
  },
  {
    id: "kt5", ticketCode: "#B03-005", tableName: "Ban 03 (Tang 1)", orderTime: "18:30",
    orderTimestamp: Date.now() - 20 * 60 * 1000, status: "IN_PROGRESS", station: "BAR",
    waiterName: "Ngoc Anh",
    items: [
      { dishName: "Sinh To Bo", quantity: 2, notes: "It duong" },
      { dishName: "Tra Dao Cam Sa", quantity: 2 },
    ],
  },
  {
    id: "kt6", ticketCode: "#B04-006", tableName: "Ban 04 (VIP 1)", orderTime: "18:20",
    orderTimestamp: Date.now() - 30 * 60 * 1000, status: "DONE", station: "KITCHEN",
    waiterName: "Minh Tuan",
    items: [
      { dishName: "Goi Cuon Tom Thit", quantity: 2 },
      { dishName: "Cha Gio Chien", quantity: 1 },
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
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t));
    toast.info(`Bep da nhan ve ${ticket.ticketCode} — ${ticket.tableName}`);
  };

  const handleDone = (ticket: KdsTicket) => {
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: "DONE" } : t));
    toast.success(`Ve ${ticket.ticketCode} hoan thanh! Phuc vu dua ra ban.`);
  };

  const handleRecall = (ticket: KdsTicket) => {
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t));
    toast.info(`Da thu hoi ve ${ticket.ticketCode} ve Dang Lam`);
  };

  const filtered = stationFilter === "ALL" ? tickets : tickets.filter((t) => t.station === stationFilter);
  const newTickets = filtered.filter((t) => t.status === "NEW");
  const inProgressTickets = filtered.filter((t) => t.status === "IN_PROGRESS");
  const doneTickets = filtered.filter((t) => t.status === "DONE");

  const renderTimer = (ts: number) => {
    const mins = minutesAgo(ts);
    const isOverdue = mins > 12;
    const isWarning = mins > 8;
    return (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isOverdue ? "bg-rose-100 text-rose-700 animate-pulse" : isWarning ? "bg-amber-100 text-amber-700" : "bg-surface-muted text-ink-muted"}`}>
        {mins} phut {isOverdue ? "Qua lau!" : ""}
      </span>
    );
  };

  const renderTicket = (ticket: KdsTicket, col: KdsStatus) => {
    const mins = minutesAgo(ticket.orderTimestamp);
    const isOverdue = mins > 12;
    return (
      <div key={ticket.id} className={`rounded-2xl border-2 p-3 space-y-2.5 transition-all ${isOverdue && col !== "DONE" ? "border-rose-400 bg-rose-50/30 shadow-sm" : col === "NEW" ? "border-amber-300 bg-amber-50/20" : col === "IN_PROGRESS" ? "border-brand-800 bg-brand-50/20 shadow-sm" : "border-emerald-300 bg-emerald-50/20 opacity-75"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-ink-primary">{ticket.ticketCode}</span>
            {ticket.priority === "URGENT" && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">GAP</span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ticket.station === "BAR" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {ticket.station === "BAR" ? "BAR" : "BEP"}
            </span>
          </div>
          {renderTimer(ticket.orderTimestamp)}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-ink-muted">
          <Icon name="table" className="w-3 h-3" />
          <span className="font-bold text-ink-primary">{ticket.tableName}</span>
          <span>•</span>
          <span>Phuc vu: {ticket.waiterName}</span>
          <span>• {ticket.orderTime}</span>
        </div>

        <div className="space-y-1.5 border-t border-surface-border/50 pt-2">
          {ticket.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-xs font-black text-ink-primary">{item.dishName}</span>
                {item.notes && <div className="text-[10px] text-amber-700 font-bold">Note: {item.notes}</div>}
              </div>
              <span className="text-sm font-black text-brand-900 shrink-0">x{item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="pt-1.5 border-t border-surface-border/50">
          {col === "NEW" && (
            <Button size="sm" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black gap-2 h-8" onClick={() => handleStartCooking(ticket)}>
              <Icon name="flame" className="w-3.5 h-3.5" />
              Bat Dau Lam
            </Button>
          )}
          {col === "IN_PROGRESS" && (
            <Button size="sm" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black gap-2 h-8" onClick={() => handleDone(ticket)}>
              <Icon name="check" className="w-3.5 h-3.5" />
              Xong — Dua Ra Ban
            </Button>
          )}
          {col === "DONE" && (
            <button type="button" onClick={() => handleRecall(ticket)} className="text-[10px] text-ink-muted hover:text-ink-primary font-bold w-full text-center hover:underline">
              Thu hoi (lam lai)
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">Man Hinh Bep & Bar (KDS)</h2>
            <Badge variant="success" className="font-extrabold text-[10px] animate-pulse">Live</Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">Ve che bien tu dong cap nhat tu don POS & QR — Xu ly theo thu tu uu tien.</p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${soundEnabled ? "bg-brand-900 text-white border-brand-900" : "bg-white text-ink-muted border-surface-border"}`}
        >
          <Icon name="wifi" className="w-3.5 h-3.5" />
          <span>Am Thanh: {soundEnabled ? "Bat" : "Tat"}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "ALL", label: "Tat Ca", count: filtered.length },
          { id: "KITCHEN", label: "Bep Nong", count: tickets.filter((t) => t.station === "KITCHEN").length },
          { id: "BAR", label: "Bar & Do Uong", count: tickets.filter((t) => t.station === "BAR").length },
        ].map((s) => (
          <button key={s.id} type="button" onClick={() => setStationFilter(s.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${stationFilter === s.id ? "bg-brand-900 text-white shadow-sm" : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"}`}>
            <span>{s.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${stationFilter === s.id ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"}`}>{s.count}</span>
          </button>
        ))}
        <span className="text-[11px] text-ink-muted ml-auto font-bold">
          Cap nhat: {new Date(now).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-black text-ink-primary">Don Moi</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">{newTickets.length}</span>
          </div>
          {newTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-amber-200 p-6 text-center">
              <p className="text-xs text-ink-muted font-bold">Khong co ve moi</p>
            </div>
          ) : newTickets.map((t) => renderTicket(t, "NEW"))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-900" />
              <span className="text-sm font-black text-ink-primary">Dang Che Bien</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-brand-100 text-brand-900">{inProgressTickets.length}</span>
          </div>
          {inProgressTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-brand-200 p-6 text-center">
              <p className="text-xs text-ink-muted font-bold">Bep dang ranh</p>
            </div>
          ) : inProgressTickets.map((t) => renderTicket(t, "IN_PROGRESS"))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-black text-ink-primary">Hoan Thanh</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">{doneTickets.length}</span>
          </div>
          {doneTickets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-emerald-200 p-6 text-center">
              <p className="text-xs text-ink-muted font-bold">Chua co ve hoan thanh</p>
            </div>
          ) : doneTickets.map((t) => renderTicket(t, "DONE"))}
        </div>
      </div>
    </div>
  );
};
