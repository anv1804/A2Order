export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface PinPadModalProps {
  isOpen: boolean;
  staffList: StaffMember[];
  onPinSubmit: (staffId: string, pin: string) => void;
  onClose?: () => void;
}
