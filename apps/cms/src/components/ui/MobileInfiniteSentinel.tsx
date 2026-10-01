import React from "react";
import { Icon } from "./Icon.js";

export interface MobileInfiniteSentinelProps {
  hasMore: boolean;
  totalCount: number;
  visibleCount?: number;
  displayedCount?: number;
  isLoadingMore?: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  className?: string;
}

export const MobileInfiniteSentinel: React.FC<MobileInfiniteSentinelProps> = ({
  hasMore,
  totalCount,
  visibleCount,
  displayedCount,
  sentinelRef,
  className = "",
}) => {
  if (totalCount === 0) return null;
  const currentCount = displayedCount ?? visibleCount ?? 10;

  return (
    <div ref={sentinelRef as React.LegacyRef<HTMLDivElement>} className={`py-4 select-none ${className}`}>
      {hasMore ? (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-white/80 py-2.5 px-4 rounded-xl border border-slate-200/60 shadow-2xs mx-auto w-fit">
          <Icon name="loader" size={15} className="animate-spin text-emerald-700" />
          <span>Đang cuộn tải thêm... ({currentCount}/{totalCount})</span>
        </div>
      ) : totalCount > 10 ? (
        <div className="text-center text-[11px] font-medium text-slate-400 py-1">
          Đã hiển thị toàn bộ {totalCount} bản ghi
        </div>
      ) : null}
    </div>
  );
};
