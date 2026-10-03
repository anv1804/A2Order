import React from "react";
import { twMerge } from "tailwind-merge";
import { Icon } from "./Icon";
import { SearchInput } from "./Input";
import { Pagination } from "./Pagination";

export interface DataTablePaginationConfig {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalPages?: number;
}

export interface DataTableCardProps {
  /** Tiêu đề hoặc nhóm tab trên cùng của Card */
  tabs?: React.ReactNode;
  title?: string;
  subtitle?: string;

  /** Ô tìm kiếm chuẩn hóa */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchClear?: () => void;

  /** Phần tử tùy chỉnh bên trái toolbar */
  toolbarLeft?: React.ReactNode;

  /** Nhóm bộ lọc FilterSelect tùy chỉnh riêng cho từng bảng */
  filters?: React.ReactNode;

  /** Nút thao tác chính (+ Thêm mới, Xuất Excel, v.v.) */
  actions?: React.ReactNode;

  /** Trạng thái có bộ lọc đang áp dụng & hàm xóa nhanh toàn bộ lọc */
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;

  /** Text tóm tắt số lượng (ví dụ: "Hiển thị 12 / 48 hóa đơn") */
  summaryText?: React.ReactNode;

  /** Cấu hình phân trang chuẩn Desktop tích hợp sẵn */
  pagination?: DataTablePaginationConfig;

  /** Phân trang tùy biến hoặc nội dung thanh footer bổ sung */
  footer?: React.ReactNode;

  /** Nội dung bảng Table hoặc lưới danh sách */
  children: React.ReactNode;

  /** Tự động bọc trong div cuộn ngang (Mặc định true) */
  scrollable?: boolean;

  /** Class tùy biến cho khung Card */
  className?: string;
}

export const DataTableCard: React.FC<DataTableCardProps> = ({
  tabs,
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchClear,
  toolbarLeft,
  filters,
  actions,
  hasActiveFilters,
  onResetFilters,
  summaryText,
  pagination,
  footer,
  children,
  scrollable = true,
  className,
}) => {
  const hasSearch = typeof onSearchChange === "function";
  const hasToolbar = hasSearch || toolbarLeft || filters || actions || title;
  const hasFooter = summaryText !== undefined || footer || pagination;

  return (
    <div
      className={twMerge(
        "w-full rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden",
        className
      )}
    >
      {/* 1. Header Tabs (Nếu có) */}
      {tabs && (
        <div className="border-b border-slate-100 bg-slate-50/70 p-2 sm:p-2.5">
          {tabs}
        </div>
      )}

      {/* 2. Unified Toolbar (Tìm kiếm + Bộ lọc riêng từng bảng + Nút hành động) */}
      {hasToolbar && (
        <div className="p-3 sm:p-3.5 border-b border-slate-100/90 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Cụm Trái: Tìm kiếm & Tiêu đề */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {title && (
              <div className="shrink-0 mr-1">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
              </div>
            )}

            {hasSearch && (
              <div className="w-full sm:w-72 lg:w-80 shrink-0">
                <SearchInput
                  placeholder={searchPlaceholder || "Tìm kiếm nhanh..."}
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onClear={onSearchClear || (() => onSearchChange(""))}
                  inputSize="md"
                />
              </div>
            )}

            {toolbarLeft && <div className="flex items-center gap-2">{toolbarLeft}</div>}
          </div>

          {/* Cụm Phải: Bộ lọc đặc thù của từng bảng + Nút xóa lọc + Nút hành động (luôn giữ trên 1 hàng ở tablet/desktop) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-start lg:justify-end">
            {filters && <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">{filters}</div>}

            {hasActiveFilters && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="h-9 px-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition flex items-center gap-1 active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
                title="Đặt lại toàn bộ lọc về mặc định"
              >
                <Icon name="refresh" size={13} />
                <span>Xóa lọc</span>
              </button>
            )}

            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      )}

      {/* 3. Nội dung bảng dữ liệu */}
      {scrollable ? (
        <div className="overflow-x-auto no-scrollbar">{children}</div>
      ) : (
        children
      )}

      {/* 4. Footer thống nhất (Tóm tắt số bản ghi + Phân trang chuẩn Desktop) */}
      {hasFooter && (
        <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          {/* Cụm trái: Thông tin tóm tắt số bản ghi */}
          <div className="text-slate-500 font-medium truncate">
            {summaryText !== undefined ? (
              summaryText
            ) : pagination ? (
              pagination.totalItems === 0 ? (
                <span>0 bản ghi</span>
              ) : (
                <>
                  <span className="sm:hidden font-bold text-slate-800">
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} / {pagination.totalItems} bản ghi
                  </span>
                  <span className="hidden sm:inline">
                    Hiển thị{" "}
                    <span className="font-bold text-slate-800">
                      {(pagination.currentPage - 1) * pagination.pageSize + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-bold text-slate-800">
                      {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-black text-emerald-800">{pagination.totalItems}</span> bản ghi
                  </span>
                </>
              )
            ) : null}
          </div>

          {/* Cụm phải: Phân trang Desktop & bổ sung sentinel mobile */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0 ml-auto pr-0 sm:pr-2 lg:pr-14">
            {pagination && pagination.totalItems > pagination.pageSize && (
              <Pagination
                currentPage={pagination.currentPage}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                totalPages={pagination.totalPages}
                onPageChange={pagination.onPageChange}
                showSummary={false}
                bordered={false}
              />
            )}
            {footer && <div>{footer}</div>}
          </div>
        </div>
      )}
    </div>
  );
};
