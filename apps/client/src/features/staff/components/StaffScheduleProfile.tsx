import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { sound } from "@/lib/sound";
import { toast } from "@/stores/notificationStore";
import { StaffMember, AttendanceRecord } from "@/types";

interface StaffScheduleProfileProps {
  currentStaff: StaffMember;
  attendanceRecords: AttendanceRecord[];
  onClockIn: (staff: StaffMember) => void;
  onClockOut: (staff: StaffMember) => void;
  onOpenPinModal: () => void;
}

export const StaffScheduleProfile: React.FC<StaffScheduleProfileProps> = ({
  currentStaff,
  attendanceRecords,
  onClockIn,
  onClockOut,
  onOpenPinModal,
}) => {
  const currentRecord = attendanceRecords.find(
    (r) => r.staffId === currentStaff.id && r.status === "ACTIVE"
  );
  const isClockedIn = !!currentRecord;

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Tháng 9/2026
  const [selectedDayNum, setSelectedDayNum] = useState(29);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon

  // Điều chỉnh firstDay để Tuần bắt đầu bằng Thứ 2 (T2, T3, T4, T5, T6, T7, CN)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const calendarGrid = Array.from({ length: Math.ceil((daysInMonth + startOffset) / 7) * 7 }).map((_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    
    // Mock logic
    const isFuture = currentYear > 2026 || (currentYear === 2026 && currentMonth > 8) || (currentYear === 2026 && currentMonth === 8 && dayNum > 29);
    const isToday = currentYear === 2026 && currentMonth === 8 && dayNum === 29;
    
    let status = "UPCOMING";
    if (isToday) {
      status = isClockedIn ? "WORKING" : "UPCOMING";
    } else if (!isFuture) {
      status = dayNum % 6 === 0 ? "OFF" : "WORKED"; // Nghỉ mỗi 6 ngày
    }
    
    return { dayNum, status, isToday, isFuture };
  });

  // Lọc nhật ký chấm công của nhân viên này
  const myLogs = attendanceRecords.filter((r) => r.staffId === currentStaff.id);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header Profile Card */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-surface-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-brand-900 text-white flex items-center justify-center text-lg sm:text-xl font-black shadow-md ring-4 ring-brand-100 shrink-0">
            {currentStaff.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-ink-primary tracking-tight">
                {currentStaff.name}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                isClockedIn ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-surface-muted text-ink-muted"
              }`}>
                {isClockedIn ? "🔵 Đang Trong Ca" : "⚪ Chưa Vào Ca"}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Mã NV: <span className="font-mono font-bold text-ink-primary">{currentStaff.id.toUpperCase()}</span> • Vai trò:{" "}
              <strong className="text-brand-800">{currentStaff.role}</strong>
            </p>
            {isClockedIn && (
              <p className="text-[11px] text-blue-700 font-bold mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                <span>Đã vào ca lúc {currentRecord.clockInTime} ({currentRecord.shiftName})</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-surface-border">
          {isClockedIn ? (
            <Button
              size="md"
              variant="danger"
              className="rounded-2xl text-xs font-black gap-1.5 shadow-sm"
              onClick={() => onClockOut(currentStaff)}
            >
              <Icon name="logout" className="w-4 h-4 text-white" />
              <span>Chốt Ca & Ra Về</span>
            </Button>
          ) : (
            <Button
              size="md"
              className="rounded-2xl bg-brand-900 text-white text-xs font-black gap-1.5 shadow-sm hover:bg-black"
              onClick={() => onClockIn(currentStaff)}
            >
              <Icon name="checkCircle" className="w-4 h-4 text-white" />
              <span>Chấm Công Vào Ca</span>
            </Button>
          )}

          <Button
            size="md"
            variant="outline"
            className="rounded-2xl text-xs font-bold gap-1.5"
            onClick={onOpenPinModal}
          >
            <Icon name="key" className="w-4 h-4 text-ink-muted" />
            <span>Đổi PIN</span>
          </Button>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Panel variant="featured" padding="sm" className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-brand-200">Đơn Phục Vụ Hôm Nay</span>
          <div className="my-1 sm:my-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">18</span>
            <span className="text-xs text-brand-200 ml-1">đơn</span>
          </div>
          <span className="text-[10px] font-bold text-brand-200">Đạt chỉ tiêu ca</span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted">Doanh Số Đóng Góp</span>
          <div className="my-1 sm:my-1.5">
            <span className="text-base sm:text-xl font-black text-brand-900">
              {formatCurrency(2450000)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
            Đạt 112%
          </span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted">Giờ Làm Tích Lũy</span>
          <div className="my-1 sm:my-1.5">
            <span className="text-2xl sm:text-3xl font-black text-ink-primary">42.5</span>
            <span className="text-xs text-ink-muted ml-1">giờ</span>
          </div>
          <span className="text-[10px] font-bold text-ink-muted">Chỉ tiêu 48h/tuần</span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted">Đánh Giá Phục Vụ</span>
          <div className="my-1 sm:my-1.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">4.9</span>
            <span className="text-amber-500 text-sm">★</span>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
            Top nhân viên
          </span>
        </Panel>
      </div>

      {/* GIAO DIỆN LỊCH CHẤM CÔNG DẠNG GRID THEO MÀU YÊU CẦU:
          - ĐỎ: NGHỈ (OFF)
          - XANH LÁ: ĐÃ LÀM XONG
          - XANH DƯƠNG: ĐANG LÀM
          - XÁM/TRẮNG: LỊCH SẮP TỚI
      */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-surface-border p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center">
              <Icon name="calendar" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-ink-primary">Lịch Chấm Công Tháng Này</h3>
              <p className="text-xs text-ink-muted">Xem trực quan theo trạng thái màu ca trực</p>
            </div>
          </div>

          {/* Color Legend (Chú thích màu) */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] font-black uppercase tracking-wider">
            <span className="text-rose-600">Nghỉ (OFF)</span>
            <span className="text-emerald-600">Đã làm</span>
            <span className="text-blue-600">Đang trực</span>
          </div>
        </div>

        {/* Calendar Header Controls */}
        <div className="flex items-center justify-between mb-2 mt-2">
          <button onClick={handlePrevMonth} className="p-2 sm:p-2.5 -ml-2 rounded-full hover:bg-surface-hover text-ink-muted transition-colors">
            <Icon name="chevronLeft" className="w-5 h-5" />
          </button>
          <h3 className="font-black text-ink-primary text-sm sm:text-base tracking-tight">
            Tháng {currentMonth + 1}, {currentYear}
          </h3>
          <button onClick={handleNextMonth} className="p-2 sm:p-2.5 -mr-2 rounded-full hover:bg-surface-hover text-ink-muted transition-colors">
            <Icon name="chevronRight" className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid (7 days) */}
        <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2 text-center pb-2">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="text-[10px] sm:text-xs font-black text-ink-muted mb-2 opacity-70">{d}</div>
          ))}
          {calendarGrid.map((cal, idx) => {
            if (!cal) return <div key={`empty-${idx}`} />;

            const isSelected = selectedDayNum === cal.dayNum;
            let cellClass = "bg-transparent hover:bg-surface-hover";
            let textColor = "text-ink-primary";

            if (cal.status === "OFF") textColor = "text-rose-600";
            else if (cal.status === "WORKED") textColor = "text-emerald-600";
            else if (cal.status === "WORKING") textColor = "text-blue-600";

            if (isSelected) {
              cellClass = "bg-brand-900 shadow-md ring-2 ring-brand-200 ring-offset-1";
              textColor = "text-white";
            } else if (cal.isToday) {
              cellClass = "border border-brand-300";
            }

            return (
              <div key={idx} className="flex justify-center">
                <button
                  onClick={() => setSelectedDayNum(cal.dayNum)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${cellClass}`}
                >
                  <span className={`text-[13px] sm:text-sm font-bold ${textColor} ${cal.isFuture && !isSelected ? "opacity-30" : ""}`}>
                    {cal.dayNum}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Date Details */}
        <div className="mt-2 border-t border-surface-border pt-4">
           <h4 className="text-[10px] font-black text-ink-muted mb-3 uppercase tracking-wider">
             Lịch trình • Ngày {selectedDayNum}/{currentMonth + 1}/{currentYear}
           </h4>
           
           <div className="space-y-2.5">
             {calendarGrid.find(c => c?.dayNum === selectedDayNum)?.status === "OFF" ? (
               <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                 <span className="text-sm font-bold text-rose-700">Hôm nay nghỉ ca (OFF)</span>
               </div>
             ) : (
               <>
                 <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border flex flex-col gap-2.5">
                   <div className="flex items-center justify-between">
                     <span className="font-black text-ink-primary text-sm">Ca Sáng</span>
                     <Badge variant={calendarGrid.find(c => c?.dayNum === selectedDayNum)?.status === "WORKING" ? "brand" : "success"}>
                       {calendarGrid.find(c => c?.dayNum === selectedDayNum)?.status === "WORKING" ? "Đang trực" : "Đã làm"}
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between text-xs text-ink-muted">
                     <div className="flex items-center gap-1.5">
                       <Icon name="clock" className="w-3.5 h-3.5" />
                       <span className="font-medium">06:30 - 14:30</span>
                     </div>
                     <span className="font-bold text-ink-primary bg-white px-2 py-0.5 rounded-md border border-surface-border shadow-sm">
                       8.0h
                     </span>
                   </div>
                 </div>
                 {/* Mock multiple shift on day 29 */}
                 {selectedDayNum === 29 && currentMonth === 8 && (
                   <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border flex flex-col gap-2.5">
                     <div className="flex items-center justify-between">
                       <span className="font-black text-ink-primary text-sm">Ca Tối (Tăng cường)</span>
                       <Badge variant="default">Sắp tới</Badge>
                     </div>
                     <div className="flex items-center justify-between text-xs text-ink-muted">
                       <div className="flex items-center gap-1.5">
                         <Icon name="clock" className="w-3.5 h-3.5" />
                         <span className="font-medium">18:00 - 22:30</span>
                       </div>
                       <span className="font-bold text-ink-primary bg-white px-2 py-0.5 rounded-md border border-surface-border shadow-sm">
                         4.5h
                       </span>
                     </div>
                   </div>
                 )}
               </>
             )}
           </div>
        </div>
      </div>

      {/* Nhật Ký Chấm Công Gần Đây (Attendance Timesheet Log) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-surface-border p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-muted text-ink-primary flex items-center justify-center">
              <Icon name="history" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-ink-primary">Nhật Ký Chấm Công Hôm Nay</h3>
              <p className="text-xs text-ink-muted">Lưu vết giờ vào/ra thời gian thực tế</p>
            </div>
          </div>
        </div>

        {myLogs.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-6">Chưa có bản ghi chấm công nào hôm nay</p>
        ) : (
          <div className="space-y-2">
            {myLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <div>
                    <span className="font-black text-ink-primary">{log.shiftName}</span>
                    <span className="text-ink-muted text-[11px] ml-2 font-mono">Ngày: {log.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-bold text-ink-primary">Vào: {log.clockInTime}</span>
                    {log.clockOutTime && (
                      <span className="text-ink-muted ml-2">→ Ra: {log.clockOutTime}</span>
                    )}
                  </div>
                  <Badge variant={log.status === "ACTIVE" ? "brand" : "default"}>
                    {log.status === "ACTIVE" ? "Đang trực" : "Đã chốt ca"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
