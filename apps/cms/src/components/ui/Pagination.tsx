import React from "react";
import { PaginationProps } from "@/types/ui.types.js";
import { Icon } from "./Icon.js";

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propTotalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
  showSummary = true,
  bordered = true,
}) => {
  const calculatedTotalPages = Math.ceil(totalItems / pageSize);
  const totalPages = Math.max(1, propTotalPages ?? calculatedTotalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Khi không có dữ liệu: Chỉ hiện thông báo số lượng (nếu showSummary), không vẽ nút trang
  if (totalItems === 0) {
    if (!showSummary) return null;
    return (
      <div className={`text-slate-400 font-medium text-xs py-1 select-none ${className}`}>
        0 bản ghi
      </div>
    );
  }

  // Sinh danh sách trang (tối đa 5 trang hiển thị)
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages.length > 0 ? pages : [1];
  };

  const pageNumbers = getPageNumbers();
  const hasMultiplePages = totalPages > 1;

  return (
    <div
      className={`flex flex-row items-center justify-between gap-2 text-[11px] sm:text-xs select-none ${
        bordered ? "pt-2.5 sm:pt-3.5 border-t border-slate-200/80" : ""
      } ${className}`}
    >
      {/* Thông tin số lượng & trang */}
      {showSummary && (
        <div className="text-slate-500 font-medium truncate">
          <span className="sm:hidden font-bold text-slate-800">
            {startItem}-{endItem} <span className="font-normal text-slate-400">/</span> {totalItems}
          </span>
          <span className="hidden sm:inline">
            Hiển thị <span className="font-bold text-slate-800">{startItem}</span> -{" "}
            <span className="font-bold text-slate-800">{endItem}</span> trong tổng số{" "}
            <span className="font-black text-emerald-800">{totalItems}</span> bản ghi
            {hasMultiplePages && (
              <span className="text-slate-400 ml-1.5 font-normal">
                (Trang {currentPage} / {totalPages})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Dải nút điều hướng đồng bộ (Chỉ hiển thị khi có từ 2 trang trở lên) */}
      {hasMultiplePages && (
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
        {/* Nút Trước (Icon-only) */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
          title="Trang trước"
          className={`w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold transition-all text-xs ${
            currentPage <= 1
              ? "text-slate-300 bg-slate-50 border border-slate-200/60 cursor-not-allowed opacity-60"
              : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs cursor-pointer active:scale-95"
          }`}
        >
          <Icon name="chevronLeft" size={15} />
        </button>

        <span className="px-1.5 font-bold text-slate-600 sm:hidden">
          {currentPage}/{totalPages}
        </span>

        {/* Dải số trang trên màn hình rộng */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="w-8 h-8 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs cursor-pointer transition-all"
              >
                1
              </button>
              {pageNumbers[0] > 2 && <span className="px-1 text-slate-400">...</span>}
            </>
          )}

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-xl font-black transition-all ${
                currentPage === page
                  ? "bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-800"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs cursor-pointer"
              }`}
            >
              {page}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-1 text-slate-400">...</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs cursor-pointer transition-all"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Nút Sau (Icon-only) */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Trang sau"
          title="Trang sau"
          className={`w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold transition-all text-xs ${
            currentPage >= totalPages
              ? "text-slate-300 bg-slate-50 border border-slate-200/60 cursor-not-allowed opacity-60"
              : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs cursor-pointer active:scale-95"
          }`}
        >
          <Icon name="chevronRight" size={15} />
        </button>
      </div>
      )}
    </div>
  );
};

