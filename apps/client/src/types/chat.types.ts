export type IntercomChannelId = "ALL" | "KITCHEN" | "WAITER" | "CASHIER";

export interface IntercomMessage {
  id: string;
  senderName: string;
  senderRole: string;
  targetRole: IntercomChannelId;
  content: string;
  timestamp: string;
  type: "TEXT" | "QUICK_ALERT" | "VOICE_NOTE";
  audioDurationSec?: number;
}

export interface StaffIntercomWidgetProps {
  currentStaffName: string;
  currentStaffRole: string;
  fullScreenMode?: boolean;
  tables?: any[];
}
