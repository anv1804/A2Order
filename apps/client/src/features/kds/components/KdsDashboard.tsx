import React from "react";
import { Button, Badge, Icon } from "@/components/ui";
import { KdsTicketCard } from "@/features/kds/components/KdsTicketCard";
import { KdsTicket } from "@/types";
import { toast } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";

interface KdsDashboardProps {
  kdsTickets: KdsTicket[];
  onItemStatusToggle: (itemId: string) => void;
  onCompleteTicket: (ticketId: string) => void;
}

export const KdsDashboard: React.FC<KdsDashboardProps> = ({
  kdsTickets,
  onItemStatusToggle,
  onCompleteTicket,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary">Màn Hình Bếp Trưởng (KDS)</h2>
            <Badge variant="success" className="animate-pulse">Live {kdsTickets.length} Vé</Badge>
          </div>
          <p className="text-xs text-ink-muted">Chạm vào từng món để đổi trạng thái Nấu Xong hoặc bấm Hoàn Tất Vé</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs gap-1.5 bg-white"
          onClick={() => {
            sound.playKitchenChime();
            toast.info("Đã phát âm thanh kiểm tra loa bếp!");
          }}
        >
          <Icon name="bell" className="w-3.5 h-3.5" />
          <span>Thử Chuông Bếp</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kdsTickets.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-surface-border">
            <Icon name="kitchen" className="w-12 h-12 text-ink-subtle mx-auto mb-2" />
            <h3 className="text-sm font-black text-ink-primary">Bếp Đang Trống Vé</h3>
            <p className="text-xs text-ink-muted mt-1">Khi phục vụ nhấn "Gửi Bếp", đơn món sẽ lập tức hiện tại đây</p>
          </div>
        ) : (
          kdsTickets.map((ticket) => (
            <KdsTicketCard
              key={ticket.id}
              ticket={ticket}
              onItemStatusToggle={onItemStatusToggle}
              onCompleteTicket={onCompleteTicket}
            />
          ))
        )}
      </div>
    </div>
  );
};
