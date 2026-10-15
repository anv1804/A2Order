export type StoreChannelId = "ALL" | "CASHIER_BAR" | "KITCHEN" | "SERVICE";

export interface ChannelDef {
  id: StoreChannelId;
  name: string;
  tag: string;
  desc: string;
  quickChips: string[];
}

export interface StaffChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  time: string;
  isCurrentUser?: boolean;
}

export interface FloatingSupportGroupProps {
  storeName?: string;
  storeId?: string;
  currentUser?: any;
}
