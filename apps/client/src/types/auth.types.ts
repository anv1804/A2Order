export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  clockInTime: string;
  clockOutTime?: string;
  date: string;
  status: "ACTIVE" | "COMPLETED";
  shiftName: string;
  note?: string;
}

export interface PinPadModalProps {
  isOpen: boolean;
  staffList: StaffMember[];
  onPinSubmit: (staffId: string, pin: string) => void;
  onClose?: () => void;
}

export interface UnifiedAuthModalProps {
  isOpen: boolean;
  staffList: StaffMember[];
  onPinSubmit: (staffId: string, pin: string) => void;
  onAdminLogin?: (email: string, pass: string) => void;
  onClockIn?: (staff: StaffMember) => void;
  onClockOut?: (staff: StaffMember) => void;
  attendanceRecords?: AttendanceRecord[];
  onClose: () => void;
}
