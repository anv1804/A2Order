import { StaffMember, AttendanceRecord } from "@/types";
import { toast } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";

interface UseAttendanceParams {
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

/** Hook chung cho chấm công — tái sử dụng ở cả schedule tab và auth modal */
export function useAttendance({ setAttendanceRecords }: UseAttendanceParams) {
  const handleClockIn = (staff: StaffMember) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      clockInTime: timeStr,
      date: now.toLocaleDateString("vi-VN"),
      status: "ACTIVE",
      shiftName: now.getHours() < 14 ? "Ca Sáng" : "Ca Tối",
    };
    setAttendanceRecords((prev) => [newRecord, ...prev]);
    sound.playPaymentChime();
    toast.success(`Chấm công thành công! ${staff.name} vào ca lúc ${timeStr}.`);
  };

  const handleClockOut = (staff: StaffMember) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.staffId === staff.id && r.status === "ACTIVE"
          ? { ...r, status: "COMPLETED" as const, clockOutTime: timeStr }
          : r
      )
    );
    sound.playPaymentChime();
    toast.info(`${staff.name} đã kết ca lúc ${timeStr}. Nghỉ ngơi nhé!`);
  };

  return { handleClockIn, handleClockOut };
}
