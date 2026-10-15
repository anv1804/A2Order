import React from "react";

import { SkeletonProps } from "@/types";


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
