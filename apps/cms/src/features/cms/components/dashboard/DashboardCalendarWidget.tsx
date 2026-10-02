import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/ui";
import { usePersistentState } from "@/hooks/usePersistentState";

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  tag: "URGENT" | "INVENTORY" | "STAFF" | "GENERAL";
  isCompleted: boolean;
  createdAt: string;
}

const TAG_CONFIG: Record<CalendarNote["tag"], { label: string; bg: string; text: string; border: string }> = {
  URGENT: { label: "Khẩn cấp", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  INVENTORY: { label: "Nhập hàng", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  STAFF: { label: "Nhân sự", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  GENERAL: { label: "Ghi nhớ", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const VIETNAMESE_DAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export interface DashboardCalendarWidgetProps {
  onNavigateTab?: (tab: string) => void;
}

export const DashboardCalendarWidget: React.FC<DashboardCalendarWidgetProps> = ({ onNavigateTab }) => {
  // 1. Đồng hồ thời gian thực
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = useMemo(() => formatDateKey(now), [now]);

  // 2. Ngày đang chọn trên lịch & Tháng đang hiển thị
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  // 3. Danh sách ghi chú lưu persistent (khởi tạo mảng trống, tuyệt đối không chèn fake data)
  const [notes, setNotes] = usePersistentState<CalendarNote[]>("calendar_notes", []);

  // Tự động quét và dọn sạch note fake mẫu cũ nếu còn lưu trong localStorage trình duyệt
  useEffect(() => {
    try {
      ["a2order_calendar_notes", "a2order_a2order_calendar_notes"].forEach((k) => {
        const item = localStorage.getItem(k);
        if (item && (item.includes("note-init-1") || item.includes("Kiểm tra số lượng nguyên liệu"))) {
          localStorage.removeItem(k);
        }
      });
      setNotes((prev) =>
        prev.filter((n) => n.id !== "note-init-1" && !n.content.includes("Kiểm tra số lượng nguyên liệu"))
      );
    } catch {
      // Ignore storage error
    }
  }, []);

  // Form thêm ghi chú mới
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState<CalendarNote["tag"]>("GENERAL");

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) return;

    const newNote: CalendarNote = {
      id: `note-${Date.now()}`,
      date: selectedDate,
      content: trimmed,
      tag: newTag,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewContent("");
  };

  const handleToggleNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isCompleted: !n.isCompleted } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Tính toán các ngày trong tháng hiện tại
  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    // Ngày cuối cùng của tháng
    const lastDay = new Date(year, month + 1, 0);

    // Thứ của ngày đầu tiên (0: CN, 1: T2, ... 6: T7). Chuyển về 0: T2 ... 6: CN
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Các ngày của tháng trước để lấp đầy hàng đầu
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        dateStr: formatDateKey(d),
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }

    // Các ngày của tháng này
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        dateStr: formatDateKey(d),
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    // Các ngày của tháng sau để đủ lưới 35 hoặc 42 ô
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          dateStr: formatDateKey(d),
          dayNum: i,
          isCurrentMonth: false,
        });
      }
    }

    return { year, month: month + 1, days };
  }, [viewDate]);

  // Set các ngày có ghi chú
  const noteDatesSet = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => set.add(n.date));
    return set;
  }, [notes]);

  // Danh sách ghi chú cho ngày đang chọn
  const selectedDayNotes = useMemo(() => {
    return notes.filter((n) => n.date === selectedDate);
  }, [notes, selectedDate]);

  // Format ngày đang chọn
  const selectedDateObj = useMemo(() => {
    const parts = selectedDate.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }, [selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    const dayOfWeek = VIETNAMESE_DAYS[selectedDateObj.getDay()];
    const day = String(selectedDateObj.getDate()).padStart(2, "0");
    const month = String(selectedDateObj.getMonth() + 1).padStart(2, "0");
    return `${dayOfWeek}, ${day}/${month}`;
  }, [selectedDateObj]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const t = new Date();
    setViewDate(t);
    setSelectedDate(formatDateKey(t));
  };

  // Giờ phút giây
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const currentDayName = VIETNAMESE_DAYS[now.getDay()];
  const currentFullDate = `${currentDayName}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  return (
    <aside className="space-y-3">
      {/* 1. KHỐI THỜI GIAN & LỊCH ĐIỀU HÀNH THỐNG NHẤT (Executive Time & Calendar Hub) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Header Doanh Nhân: Giờ Hệ Thống & Thứ Ngày Tháng */}
        <div className="bg-gradient-to-br from-[#0a271d] via-[#103a2c] to-[#0d3125] p-3.5 sm:p-4 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-200">
                Giờ Hệ Thống
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-emerald-100 border border-white/10">
              Trực Tuyến
            </span>
          </div>

          {/* Giờ Phút Giây & Thứ Ngày */}
          <div className="relative z-10 flex items-end justify-between gap-2">
            <div className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline">
              <span>{hours}</span>
              <span className="animate-pulse text-emerald-300 mx-0.5">:</span>
              <span>{minutes}</span>
              <span className="animate-pulse text-emerald-300 mx-0.5">:</span>
              <span className="text-lg sm:text-xl text-emerald-300/80 font-bold">{seconds}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-emerald-300 block leading-tight">
                {currentDayName}
              </span>
              <span className="text-[11px] text-emerald-100/90 font-medium font-mono leading-tight mt-0.5 block">
                {String(now.getDate()).padStart(2, "0")}/{String(now.getMonth() + 1).padStart(2, "0")}/{now.getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Lịch Tháng Tinh Gọn, Liền Mạch Ngay Bên Dưới */}
        <div className="p-3 sm:p-3.5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                Tháng {monthData.month} / {monthData.year}
              </h4>
              {selectedDate !== todayKey && (
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md transition active:scale-95"
                >
                  Hôm nay
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                title="Tháng trước"
                aria-label="Tháng trước"
                className="w-6.5 h-6.5 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 text-xs"
              >
                <Icon name="chevronLeft" size={13} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                title="Tháng sau"
                aria-label="Tháng sau"
                className="w-6.5 h-6.5 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 text-xs"
              >
                <Icon name="chevronRight" size={13} />
              </button>
            </div>
          </div>

          {/* Thứ trong tuần */}
          <div className="grid grid-cols-7 gap-1 text-center text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span className="text-amber-600">T7</span>
            <span className="text-rose-600">CN</span>
          </div>

          {/* Lưới các ngày */}
          <div className="grid grid-cols-7 gap-1 text-[11px]">
            {monthData.days.map((d) => {
              const isToday = d.dateStr === todayKey;
              const isSelected = d.dateStr === selectedDate;
              const hasNotes = noteDatesSet.has(d.dateStr);

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`relative h-6.5 sm:h-7 rounded-lg flex flex-col items-center justify-center font-bold text-[11px] transition-all ${
                    isSelected
                      ? "bg-[#0a271d] text-white shadow-xs font-black"
                      : isToday
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-black"
                      : d.isCurrentMonth
                      ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{d.dayNum}</span>
                  {hasNotes && (
                    <span
                      className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                        isSelected ? "bg-emerald-300" : "bg-amber-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. KHỐI GHI CHÚ QUAN TRỌNG VÀO LỊCH */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Icon name="calendarCheck" size={14} />
            </span>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900">
                Ghi Chú {selectedDate === todayKey ? "Hôm Nay" : selectedDateFormatted}
              </h4>
              <p className="text-[9.5px] text-slate-400">
                {selectedDayNotes.length} việc cần lưu ý
              </p>
            </div>
          </div>
          {selectedDate !== todayKey && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayKey)}
              className="text-[9.5px] font-bold text-emerald-800 hover:underline"
            >
              Về hôm nay
            </button>
          )}
        </div>

        {/* Form thêm ghi chú */}
        <form onSubmit={handleAddNote} className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Nhập việc cần lưu ý cho ngày này..."
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!newContent.trim()}
              title="Thêm ghi chú"
              className="h-7.5 px-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white font-bold text-xs shrink-0 flex items-center justify-center transition active:scale-95 shadow-2xs"
            >
              <Icon name="plus" size={13} />
            </button>
          </div>

          {/* Chọn Tag Phân Loại */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[9.5px]">
            {(["GENERAL", "INVENTORY", "URGENT", "STAFF"] as CalendarNote["tag"][]).map((t) => {
              const active = newTag === t;
              const cfg = TAG_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewTag(t)}
                  className={`px-2 py-0.5 rounded-lg font-bold border transition ${
                    active
                      ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-emerald-500/30`
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </form>

        {/* Danh sách ghi chú */}
        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-0.5 sidebar-scroll">
          {selectedDayNotes.length === 0 ? (
            <div className="py-2.5 text-center text-slate-400">
              <p className="text-[11px] font-semibold text-slate-500">Chưa có ghi chú nào</p>
              <p className="text-[9.5px] text-slate-400">Nhập ở trên để lưu việc cần nhớ vào lịch</p>
            </div>
          ) : (
            selectedDayNotes.map((note) => {
              const cfg = TAG_CONFIG[note.tag];
              return (
                <div
                  key={note.id}
                  className={`p-2 rounded-xl border flex items-start gap-2 transition-all group ${
                    note.isCompleted
                      ? "bg-slate-50/70 border-slate-200 opacity-60"
                      : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={note.isCompleted}
                    onChange={() => handleToggleNote(note.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug text-slate-800 break-words ${
                        note.isCompleted ? "line-through text-slate-400" : "font-medium"
                      }`}
                    >
                      {note.content}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`px-1.5 py-0.2 rounded-md text-[8.5px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    title="Xóa ghi chú"
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition shrink-0"
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. KHỐI VẬN HÀNH & BÀN GIAO CA (Trực Quan, Không Bị Lặp Nhàm Chán) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Icon name="clock" size={12} />
            </span>
            <h4 className="font-extrabold text-xs text-slate-900">
              Vận Hành & Bàn Giao Ca
            </h4>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("team")}
              className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
            >
              <span>Xếp ca</span>
              <Icon name="chevronRight" size={10} />
            </button>
          )}
        </div>

        {/* Timeline Tiến Độ 2 Ca */}
        {(() => {
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          const totalMinutesNow = currentHour * 60 + currentMin;

          // Ca Sáng: 06:00 (360) -> 14:00 (840) -> 480 phút
          const isMorningActive = currentHour >= 6 && currentHour < 14;
          const morningProgress = isMorningActive
            ? Math.min(100, Math.max(0, Math.round(((totalMinutesNow - 360) / 480) * 100)))
            : currentHour >= 14 ? 100 : 0;

          // Ca Tối: 14:00 (840) -> 22:30 (1350) -> 510 phút
          const isEveningActive = currentHour >= 14 && (currentHour < 22 || (currentHour === 22 && currentMin <= 30));
          const eveningProgress = isEveningActive
            ? Math.min(100, Math.max(0, Math.round(((totalMinutesNow - 840) / 510) * 100)))
            : totalMinutesNow > 1350 ? 100 : 0;

          return (
            <div className="space-y-2 text-xs">
              {/* Ca Sáng */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                isMorningActive
                  ? "bg-emerald-50/60 border-emerald-200 shadow-2xs"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isMorningActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                    <span className="font-black text-xs text-slate-800">Ca Sáng</span>
                    <span className="font-mono text-[10.5px] text-slate-500 font-semibold">(06:00 - 14:00)</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    isMorningActive
                      ? "text-emerald-700 bg-white border-emerald-200 font-black"
                      : "text-slate-400 bg-slate-100 border-slate-200"
                  }`}>
                    {isMorningActive ? "Đang trực" : currentHour >= 14 ? "Đã xong" : "Chưa tới"}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden my-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMorningActive ? "bg-emerald-500" : currentHour >= 14 ? "bg-slate-400" : "bg-transparent"
                    }`}
                    style={{ width: `${morningProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9.5px] text-slate-500">
                  <span>Tiến độ ca: {morningProgress}%</span>
                  <span>{isMorningActive ? "Bàn giao lúc 14:00" : currentHour >= 14 ? "Đã kết ca" : "Chuẩn bị vào ca"}</span>
                </div>
              </div>

              {/* Ca Tối */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                isEveningActive
                  ? "bg-emerald-50/60 border-emerald-200 shadow-2xs"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isEveningActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                    <span className="font-black text-xs text-slate-800">Ca Tối</span>
                    <span className="font-mono text-[10.5px] text-slate-500 font-semibold">(14:00 - 22:30)</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    isEveningActive
                      ? "text-emerald-700 bg-white border-emerald-200 font-black"
                      : "text-slate-400 bg-slate-100 border-slate-200"
                  }`}>
                    {isEveningActive ? "Đang trực" : "Sắp tới"}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden my-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isEveningActive ? "bg-emerald-500" : "bg-transparent"
                    }`}
                    style={{ width: `${eveningProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9.5px] text-slate-500">
                  <span>{isEveningActive ? `Tiến độ ca: ${eveningProgress}%` : "Chưa bắt đầu"}</span>
                  <span>Auto chốt ca lúc 22:30</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};
