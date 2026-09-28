import React from "react";
import { Panel } from "@/components/ui";

export const CmsKitchenProgress: React.FC = () => {
  return (
    <Panel variant="default" padding="lg" className="flex flex-col justify-between">
      <div>
        <h3 className="text-base font-extrabold text-ink-primary">Tiến Độ Ra Món Bếp</h3>
        <p className="text-xs text-ink-muted">Tỷ lệ hoàn thành đơn đúng giờ (SLA &lt;10p)</p>
      </div>

      {/* Semicircle Gauge phong cách Donezo */}
      <div className="flex flex-col items-center justify-center my-2 relative">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 100 55">
          {/* Vòng cung nền xám */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="#ECEEED"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Vòng cung xanh đậm đã hoàn thành */}
          <path
            d="M 10,50 A 40,40 0 0,1 55,10"
            fill="none"
            stroke="#12372A"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>

        {/* Chữ số phần trăm ở trung tâm */}
        <div className="text-center -mt-8">
          <span className="text-3xl font-black text-ink-primary tracking-tight">78%</span>
          <p className="text-[11px] font-bold text-ink-muted">Món Đã Ra Đúng Giờ</p>
        </div>
      </div>

      {/* Chú thích màu sắc */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold pt-2 border-t border-surface-border/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-900" />
          <span className="text-ink-muted text-[11px]">Đã xong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          <span className="text-ink-muted text-[11px]">Đang nấu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400 bg-slate-200" />
          <span className="text-ink-muted text-[11px]">Chờ nhận</span>
        </div>
      </div>
    </Panel>
  );
};
