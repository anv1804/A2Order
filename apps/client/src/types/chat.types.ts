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

export interface ChatChannelTabsProps {
  activeChannel: IntercomChannelId;
  setActiveChannel: (channel: IntercomChannelId) => void;
  variant?: "full" | "compact";
}

export interface ChatInputBarProps {
  activeChannel: IntercomChannelId;
  isTalkingPTT: boolean;
  pttSeconds: number;
  onStartPTT: (e: React.MouseEvent | React.TouchEvent) => void;
  onStopPTT: (e: React.MouseEvent | React.TouchEvent) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  variant?: "full" | "compact";
}

export interface QuickAlertBarProps {
  activeChannel: IntercomChannelId;
  onSendAlert: (alertText: string, target: IntercomChannelId) => void;
  variant?: "full" | "compact";
}

export interface ChatMessageListProps {
  messages: IntercomMessage[];
  currentStaffName: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  variant?: "full" | "compact";
}

export interface ChannelAlertItem {
  text: string;
  icon: any;
  color: string;
}


