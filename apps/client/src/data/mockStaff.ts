import { StaffMember, AttendanceRecord } from "@/types";

export const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Em Hùng", role: "Phục vụ" },
  { id: "s2", name: "Chị Lan", role: "Thu ngân" },
  { id: "s3", name: "Bác Ba", role: "Đầu bếp" },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-1",
    staffId: "s1",
    staffName: "Em Hùng",
    role: "Phục vụ",
    clockInTime: "06:45",
    date: new Date().toLocaleDateString("vi-VN"),
    status: "ACTIVE",
    shiftName: "Ca Sáng",
  },
  {
    id: "att-2",
    staffId: "s2",
    staffName: "Chị Lan",
    role: "Thu ngân",
    clockInTime: "07:00",
    date: new Date().toLocaleDateString("vi-VN"),
    status: "ACTIVE",
    shiftName: "Ca Sáng",
  },
];
