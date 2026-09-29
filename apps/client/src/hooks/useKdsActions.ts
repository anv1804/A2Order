import { OrderItemStatus } from "@a2order/shared";
import { KdsTicket } from "@/types";
import { toast } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";

interface UseKdsActionsParams {
  setKdsTickets: React.Dispatch<React.SetStateAction<KdsTicket[]>>;
}

export function useKdsActions({ setKdsTickets }: UseKdsActionsParams) {
  // Đổi trạng thái món KDS
  const handleToggleKdsItem = (itemId: string) => {
    setKdsTickets((prev) =>
      prev.map((ticket) => ({
        ...ticket,
        items: ticket.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status:
                  i.status === OrderItemStatus.QUEUED
                    ? OrderItemStatus.COOKING
                    : i.status === OrderItemStatus.COOKING
                    ? OrderItemStatus.DONE
                    : OrderItemStatus.QUEUED,
              }
            : i
        ),
      }))
    );
  };

  const handleCompleteKdsTicket = (ticketId: string) => {
    setKdsTickets((prev) => prev.filter((t) => t.id !== ticketId));
    sound.playKitchenChime();
    toast.success("Đã hoàn tất vé bếp!");
  };

  return { handleToggleKdsItem, handleCompleteKdsTicket };
}
