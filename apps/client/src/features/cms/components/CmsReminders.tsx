import React from "react";
import { Panel, Button } from "@/components/ui";
import { Video } from "lucide-react";

export const CmsReminders: React.FC = () => {
  return (
    <Panel variant="default" padding="lg" className="flex flex-col justify-between">
      <div>
        <span className="text-xs font-bold text-ink-muted">Nhắc Nhở Ca Vận Hành</span>
        <h3 className="text-lg font-black text-ink-primary mt-3 leading-snug">
          Kiểm tra thực phẩm tươi & Họp giao ban
        </h3>
        <p className="text-xs text-ink-muted mt-1">Khung giờ : 02.00 pm - 04.00 pm</p>
      </div>

      <div className="pt-6">
        <Button size="lg" className="w-full rounded-full gap-2 bg-brand-900 hover:bg-brand-950 text-white">
          <Video className="w-4 h-4" />
          Bắt Đầu Giao Ban
        </Button>
      </div>
    </Panel>
  );
};
