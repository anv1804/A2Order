import { useState, useEffect, useCallback } from "react";

export function useScrollHideKpi(isMaximized?: boolean) {
  // isScrolled giữ ở false để không unmount đột ngột khối KPI gây giật layout (layout shift loop).
  // Khi ở chế độ phóng to (isMaximized), KPI sẽ tự động ẩn và cố định toàn màn hình.
  const [isScrolled] = useState(false);

  // Khóa cuộn trang khi ở chế độ phóng to, đảm bảo KHÔNG scroll dọc toàn trang mà chỉ cuộn nội bộ bảng
  useEffect(() => {
    const mainEl = document.getElementById("cms-main-scroll");
    if (!mainEl) return;
    if (isMaximized) {
      mainEl.classList.add("cms-maximized-locked");
      mainEl.scrollTop = 0;
    } else {
      mainEl.classList.remove("cms-maximized-locked");
    }
    return () => {
      mainEl.classList.remove("cms-maximized-locked");
    };
  }, [isMaximized]);

  // Cuộn content của bảng là ĐỘC LẬP HOÀN TOÀN, TUYỆT ĐỐI không can thiệp vào cuộn trang ngoài
  const handleInnerScroll = useCallback((_e: React.UIEvent<HTMLDivElement>) => {
    // Nội bộ bảng cuộn độc lập, ngăn ngừa rò rỉ sự kiện cuộn ra trang ngoài
  }, []);

  return { isScrolled, setIsScrolled: () => {}, handleInnerScroll };
}
