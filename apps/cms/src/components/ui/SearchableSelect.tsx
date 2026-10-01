import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Search, X, Check, LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  badge?: string | number;
  description?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  labelPrefix?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  showSearch?: boolean;
  align?: "left" | "right";
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Chọn mục...",
  searchPlaceholder = "Tìm kiếm...",
  labelPrefix,
  className,
  triggerClassName,
  menuClassName,
  disabled = false,
  showSearch = true,
  align = "left",
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Lọc options theo từ khóa tìm kiếm
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
    );
  });

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      if (showSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showSearch]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const renderOptionIcon = (icon?: SearchableSelectOption["icon"], className?: string) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ComponentType<{ size?: number; className?: string }>;
    return <IconComp size={14} className={className} />;
  };

  return (
    <div
      ref={containerRef}
      className={twMerge("relative inline-block w-full", className)}
    >
      {/* Nút Trigger chuẩn SaaS: chiều cao h-9 (36px) đồng bộ tuyệt đối */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={twMerge(
          clsx(
            "w-full h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-2xs select-none",
            isOpen
              ? "border-brand-800 ring-2 ring-brand-800/10 bg-white text-ink-primary"
              : "border-surface-border bg-white text-ink-secondary hover:text-ink-primary hover:border-brand-300 hover:bg-surface-canvas/40",
            disabled && "opacity-50 cursor-not-allowed bg-surface-canvas",
            triggerClassName
          )
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-brand-800">
              {renderOptionIcon(selectedOption.icon, "text-brand-800")}
            </span>
          )}
          {labelPrefix && (
            <span className="text-ink-muted font-medium shrink-0">
              {labelPrefix}
            </span>
          )}
          <span className="truncate text-ink-primary font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-50 text-brand-900 border border-brand-200/60 text-[10px] font-bold shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={14}
          className={twMerge(
            clsx(
              "text-ink-subtle transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-brand-800"
            )
          )}
        />
      </button>

      {/* Popover Menu Xổ Xuống với Ô Tìm Kiếm */}
      {isOpen && (
        <div
          className={twMerge(
            clsx(
              "absolute top-full mt-1.5 z-50 min-w-[200px] w-full max-w-xs sm:max-w-sm bg-white rounded-2xl border border-surface-border shadow-elevated overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100",
              align === "right" ? "right-0" : "left-0",
              menuClassName
            )
          )}
        >
          {/* Ô Tìm Kiếm bên trong Popover */}
          {showSearch && (
            <div className="p-2 border-b border-surface-border bg-surface-canvas/30">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 rounded-xl border border-surface-border bg-white text-xs font-semibold text-ink-primary placeholder:text-ink-subtle focus:border-brand-800 focus:outline-none transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary p-0.5 rounded"
                    title="Xóa tìm kiếm"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Danh Sách Lựa Chọn (Scrollable) */}
          <div className="max-h-56 overflow-y-auto scrollbar-thin p-1.5 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={twMerge(
                      clsx(
                        "w-full px-2.5 py-2 rounded-xl text-xs text-left transition-all flex items-center justify-between gap-2 group",
                        isSelected
                          ? "bg-brand-50 text-brand-950 font-black shadow-2xs"
                          : "text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas font-medium"
                      )
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {opt.icon && (
                        <span
                          className={clsx(
                            "shrink-0",
                            isSelected
                              ? "text-brand-800"
                              : "text-ink-subtle group-hover:text-brand-800"
                          )}
                        >
                          {renderOptionIcon(opt.icon)}
                        </span>
                      )}
                      <div className="min-w-0 truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-ink-muted truncate font-normal">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge !== undefined && (
                        <span
                          className={clsx(
                            "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                            isSelected
                              ? "bg-brand-200/80 text-brand-900"
                              : "bg-surface-muted text-ink-muted"
                          )}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="text-brand-800 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-ink-muted italic">
                Không tìm thấy kết quả phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
