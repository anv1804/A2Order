import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Component Skeleton cơ bản với hiệu ứng nhịp đập mượt mà (Smooth Pulse Shimmer)
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-surface-muted/80 rounded-2xl ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton dạng khối thẻ (Card)
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`p-4 rounded-3xl bg-white border border-surface-border shadow-xs space-y-3.5 ${className}`}>
      <div className="flex items-start gap-3">
        <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2 py-0.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <div className="flex items-center justify-between pt-2 border-t border-surface-border/60">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-14 rounded-xl" />
          <Skeleton className="h-7 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton dạng bảng danh sách (Table)
 */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-3xl border border-surface-border shadow-xs overflow-hidden">
      <div className="p-4 bg-surface-canvas border-b border-surface-border flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-7 w-48 rounded-xl" />
      </div>
      <div className="divide-y divide-surface-border">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                <Skeleton className="h-2.5 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-24 rounded-lg hidden sm:block" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg hidden md:block" />
            <div className="flex gap-1.5 shrink-0">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton chuyên dụng cho trang Thực Đơn Mẫu F&B (ScenarioTemplateSkeleton)
 * Mô phỏng chính xác cấu trúc 3 Trụ Cột, thanh Danh Mục và lưới Thẻ Món Ăn
 */
export const ScenarioTemplateSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-72 rounded-xl" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-96 rounded-lg" />
        </div>
      </div>

      {/* 2. 2-Panel Layout Skeleton */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Panel 1 (Left): Menu & Category List */}
        <div className="w-full lg:w-80 xl:w-[340px] shrink-0 space-y-4">
          <div className="bg-white rounded-3xl border border-surface-border p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-canvas rounded-2xl">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-9 w-full rounded-xl border border-dashed border-surface-border" />
            </div>
          </div>
        </div>

        {/* Panel 2 (Right): Dish List Liền Khối 1 Card */}
        <div className="flex-1 min-w-0 bg-white rounded-3xl border border-surface-border shadow-xs flex flex-col overflow-hidden">
          {/* Header Toolbar */}
          <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-44 rounded-xl" />
              <Skeleton className="h-8 w-16 rounded-xl" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="p-4 space-y-3 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-surface-border/60">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-36 rounded-md" />
                    <Skeleton className="h-2.5 w-48 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-3.5 w-16 rounded-md" />
                <div className="flex gap-1.5">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <Skeleton className="w-7 h-7 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Pagination */}
          <div className="p-3.5 border-t border-surface-border bg-surface-canvas/30 flex justify-between items-center">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-7 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton dùng chung cho toàn bộ trang CMS (CmsPageSkeleton)
 * Giúp chuyển trang mượt mà không bao giờ bị trắng trang (No Blank Screen)
 */
export const CmsPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header bar placeholder */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-surface-border shadow-xs">
        <div className="space-y-2">
          <Skeleton className="h-5 w-56 rounded-xl" />
          <Skeleton className="h-3 w-80 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-2xl" />
          <Skeleton className="h-9 w-32 rounded-2xl" />
        </div>
      </div>

      {/* 4 KPI cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-3xl bg-white border border-surface-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main content table placeholder */}
      <SkeletonTable rows={5} />
    </div>
  );
};
