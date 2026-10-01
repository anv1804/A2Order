import React, { useState, useEffect, useRef, useCallback } from "react";
export { MobileInfiniteSentinel } from "@/components/ui/MobileInfiniteSentinel.js";
export type { MobileInfiniteSentinelProps } from "@/components/ui/MobileInfiniteSentinel.js";

export interface UseMobileInfiniteScrollProps<T> {
  items: T[];
  pageSize?: number;
  mobileBreakpoint?: number;
}

export function useMobileInfiniteScroll<T>(
  propsOrItems: UseMobileInfiniteScrollProps<T> | T[],
  defaultPageSize = 10,
  defaultMobileBreakpoint = 1024
) {
  const isArray = Array.isArray(propsOrItems);
  const items: T[] = isArray ? propsOrItems : propsOrItems.items;
  const pageSize = isArray ? defaultPageSize : propsOrItems.pageSize ?? 10;
  const mobileBreakpoint = isArray ? defaultMobileBreakpoint : propsOrItems.mobileBreakpoint ?? 1024;

  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < mobileBreakpoint;
    }
    return false;
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Theo dõi kích thước màn hình
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener("resize", checkIsMobile, { passive: true });
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [mobileBreakpoint]);

  // Reset về pageSize khi danh sách items hoặc bộ lọc thay đổi
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  }, [hasMore, pageSize, items.length]);

  // Tự động load tiếp dữ liệu khi kéo xuống cuối (IntersectionObserver) - Chỉ chạy trên Mobile
  useEffect(() => {
    if (!isMobile || !sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "250px", // pre-fetch trước khi chạm đáy 250px
        threshold: 0.01,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isMobile, hasMore, loadMore]);

  // Lắng nghe sự kiện scroll trên #cms-main-scroll và window để kích hoạt tải thêm liên tục khi cuộn trên mobile
  useEffect(() => {
    if (!isMobile || !hasMore) return;

    const checkAndLoad = () => {
      if (!isMobile || !hasMore || !sentinelRef.current) return;
      const rect = sentinelRef.current.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 300) {
        loadMore();
      }
    };

    window.addEventListener("scroll", checkAndLoad, { passive: true, capture: true });
    const mainScroll = document.getElementById("cms-main-scroll");
    if (mainScroll) {
      mainScroll.addEventListener("scroll", checkAndLoad, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", checkAndLoad, { capture: true });
      if (mainScroll) {
        mainScroll.removeEventListener("scroll", checkAndLoad);
      }
    };
  }, [isMobile, hasMore, loadMore]);

  // Hỗ trợ listener trực tiếp khi scroll trên container nội bộ
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const target = e.currentTarget;
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 200 && hasMore) {
        loadMore();
      }
    },
    [hasMore, loadMore]
  );

  const visibleItems = items.slice(0, visibleCount);

  return {
    visibleItems,
    displayedItems: visibleItems,
    visibleCount,
    displayedCount: visibleCount,
    totalCount: items.length,
    hasMore,
    isLoadingMore: false,
    loadMore,
    sentinelRef,
    handleScroll,
    isMobile,
  };
}
