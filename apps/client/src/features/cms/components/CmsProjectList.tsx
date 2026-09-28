import React from "react";
import { Panel } from "@/components/ui";
import { Plus } from "lucide-react";
import { CmsProjectItem } from "@/types";

export const CmsProjectList: React.FC = () => {
  const tasks: CmsProjectItem[] = [
    { id: "1", name: "Nhập hải sản & rau củ tươi", time: "Hạn chót: 14:00 hôm nay", color: "bg-blue-600" },
    { id: "2", name: "Bảo dưỡng máy in nhiệt quầy", time: "Hạn chót: 16:30", color: "bg-emerald-600" },
    { id: "3", name: "Đối soát chuyển khoản VietQR ca trưa", time: "Hạn chót: 15:00", color: "bg-amber-500" },
    { id: "4", name: "Cập nhật menu món mới cuối tuần", time: "Hạn chót: 18:00", color: "bg-orange-500" },
    { id: "5", name: "Kiểm tra nhiệt độ kho đông lạnh", time: "Hạn chót: 21:00", color: "bg-indigo-600" },
  ];

  return (
    <Panel variant="default" padding="md" className="flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold text-ink-primary">Việc Cần Làm</h3>
        <button className="flex items-center gap-1 text-[11px] font-extrabold text-brand-900 border border-surface-border bg-surface-muted px-2.5 py-1 rounded-full hover:bg-slate-200">
          <Plus className="w-3 h-3" />
          <span>Thêm việc</span>
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${task.color} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-ink-primary truncate">{task.name}</h5>
              <p className="text-[10px] text-ink-muted">{task.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};
