import React from "react";
import { PaginationProps } from "@/types/ui.types.js";

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propTotalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}) => {
  if (totalItems === 0) return null;

  const totalPages = propTotalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Sinh danh sách trang (tối đa 5 trang hiển thị)
  const getPageNumbers = () => {
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
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-surface-border text-xs ${className}`}
    >
      {/* Thông tin số lượng */}
      <div className="text-ink-muted font-medium">
        Hiển thị <span className="font-bold text-ink-primary">{startItem}</span> -{" "}
        <span className="font-bold text-ink-primary">{endItem}</span> trên tổng số{" "}
        <span className="font-black text-brand-900">{totalItems}</span>
      </div>

      {/* Dải nút điều hướng */}
      {totalPages > 1 && (
        <div className="flex max-w-full items-center gap-1">
          {/* Nút Trước */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition-all sm:px-3 ${
              currentPage <= 1
                ? "text-ink-subtle bg-surface-canvas cursor-not-allowed opacity-50"
                : "text-ink-secondary bg-white border border-surface-border hover:bg-surface-canvas hover:text-ink-primary shadow-xs"
            }`}
          >
            ← Trước
          </button>

          <span className="px-2 font-bold text-ink-secondary sm:hidden">{currentPage} / {totalPages}</span>

          {/* Dải số trang trên màn hình rộng */}
          <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="w-8 h-8 rounded-xl font-bold bg-white border border-surface-border text-ink-secondary hover:text-ink-primary"
              >
                1
              </button>
              {pageNumbers[0] > 2 && <span className="px-1 text-ink-subtle">...</span>}
            </>
          )}

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-xl font-black transition-all ${
                currentPage === page
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-white border border-surface-border text-ink-secondary hover:bg-surface-canvas hover:text-ink-primary"
              }`}
            >
              {page}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-1 text-ink-subtle">...</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 rounded-xl font-bold bg-white border border-surface-border text-ink-secondary hover:text-ink-primary"
              >
                {totalPages}
              </button>
            </>
          )}
          </div>

          {/* Nút Sau */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition-all sm:px-3 ${
              currentPage >= totalPages
                ? "text-ink-subtle bg-surface-canvas cursor-not-allowed opacity-50"
                : "text-ink-secondary bg-white border border-surface-border hover:bg-surface-canvas hover:text-ink-primary shadow-xs"
            }`}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};
