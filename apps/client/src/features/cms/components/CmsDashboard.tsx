import React from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui";
import { CmsMetricCards } from "./CmsMetricCards";
import { CmsHourlyAnalytics } from "./CmsHourlyAnalytics";
import { CmsReminders } from "./CmsReminders";
import { CmsProjectList } from "./CmsProjectList";
import { CmsStaffCollaboration } from "./CmsStaffCollaboration";
import { CmsKitchenProgress } from "./CmsKitchenProgress";
import { CmsRushHourTimer } from "./CmsRushHourTimer";
import { toast } from "@/stores/notificationStore";
import { CmsMetric } from "@/types";

export const CmsDashboard: React.FC = () => {
  const metrics: CmsMetric[] = [
    {
      id: "active",
      title: "Tổng Bàn Hoạt Động",
      value: 24,
      changeText: "Tăng so với hôm qua",
      isFeatured: true,
    },
    {
      id: "paid",
      title: "Bàn Đã Thanh Toán",
      value: 10,
      changeText: "Hóa đơn hoàn tất",
    },
    {
      id: "cooking",
      title: "Món Đang Phục Vụ",
      value: 12,
      changeText: "Món đang nấu tại bếp",
    },
    {
      id: "pending",
      title: "Bàn Chờ Xử Lý",
      value: 2,
      changeText: "Khách vừa ngồi vào",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons chuẩn Donezo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink-primary tracking-tight">Dashboard</h2>
          <p className="text-xs text-ink-muted mt-1">
            Theo dõi, phân bổ và vận hành quán ăn của bạn với sự mượt mà tối đa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="md"
            className="rounded-full gap-2 bg-brand-900 hover:bg-brand-950 text-white"
            onClick={() => toast.info("Mở form thêm món ăn hoặc bàn mới")}
          >
            <Plus className="w-4 h-4" />
            + Thêm Món / Bàn
          </Button>

          <Button
            variant="outline"
            size="md"
            className="rounded-full gap-2 text-ink-primary"
            onClick={() => toast.info("Đang xuất file báo cáo Excel...")}
          >
            <Download className="w-4 h-4" />
            Xuất Dữ Liệu
          </Button>
        </div>
      </div>

      {/* Row 1: 4 Thẻ Chỉ Số Bento */}
      <CmsMetricCards metrics={metrics} />

      {/* Row 2: Biểu đồ cột + Nhắc nhở ca + Danh sách việc cần làm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <CmsHourlyAnalytics />
          <CmsReminders />
        </div>
        <div className="lg:col-span-1">
          <CmsProjectList />
        </div>
      </div>

      {/* Row 3: Nhân sự trong ca + Tiến độ bếp + Đồng hồ giờ cao điểm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CmsStaffCollaboration />
        <CmsKitchenProgress />
        <CmsRushHourTimer />
      </div>
    </div>
  );
};
