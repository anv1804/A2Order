import React from "react";
import { Panel } from "@/components/ui";
import { Plus } from "lucide-react";
import { CmsStaffShift } from "@/types";

export const CmsStaffCollaboration: React.FC = () => {
  const staffList: CmsStaffShift[] = [
    {
      id: "1",
      name: "Em Hùng",
      role: "Phục vụ",
      task: "Đang phụ trách khu vực Tầng 1 (6 Bàn)",
      avatar: "H",
      status: "Completed",
    },
    {
      id: "2",
      name: "Chị Lan",
      role: "Thu ngân",
      task: "Đối soát chuyển khoản & In phiếu tạm tính",
      avatar: "L",
      status: "In Progress",
    },
    {
      id: "3",
      name: "Bác Ba",
      role: "Bếp trưởng",
      task: "Chế biến các món phở & xào cao điểm",
      avatar: "B",
      status: "Pending",
    },
    {
      id: "4",
      name: "Bé Mai",
      role: "Pha chế",
      task: "Phụ trách quầy Bar & nước ép giải khát",
      avatar: "M",
      status: "In Progress",
    },
  ];

  const getStatusBadge = (status: CmsStaffShift["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-[#E8F5EE] text-[#194B3A] border-[#A3DBCE]";
      case "In Progress":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Pending":
      default:
        return "bg-rose-50 text-rose-800 border-rose-200";
    }
  };

  return (
    <Panel variant="default" padding="md" className="flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold text-ink-primary">Nhân Sự Trong Ca</h3>
        <button className="flex items-center gap-1 text-[11px] font-extrabold text-brand-900 border border-surface-border bg-surface-muted px-2.5 py-1 rounded-full hover:bg-slate-200">
          <Plus className="w-3 h-3" />
          <span>Thêm nhân sự</span>
        </button>
      </div>

      <div className="space-y-3">
        {staffList.map((staff) => (
          <div key={staff.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                {staff.avatar}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-ink-primary truncate">{staff.name}</h5>
                <p className="text-[10px] text-ink-muted truncate">{staff.task}</p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex-shrink-0 ${getStatusBadge(
                staff.status
              )}`}
            >
              {staff.status === "Completed"
                ? "Sẵn sàng"
                : staff.status === "In Progress"
                ? "Đang phục vụ"
                : "Tạm nghỉ"}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
};
