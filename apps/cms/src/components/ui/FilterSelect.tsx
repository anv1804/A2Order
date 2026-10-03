import React from "react";
import { SearchableSelect, SearchableSelectOption } from "./SearchableSelect";
import { Icon, IconName } from "./Icon";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: IconName;
  badge?: string | number;
}

export interface FilterSelectProps {
  labelPrefix?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  align?: "left" | "right" | "auto";
  disabled?: boolean;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  labelPrefix,
  placeholder = "Chọn lọc...",
  searchPlaceholder = "Tìm kiếm mục...",
  options,
  value,
  onChange,
  className = "w-auto min-w-[130px] sm:w-44 shrink-0",
  triggerClassName,
  menuClassName,
  align = "auto",
  disabled = false,
}) => {
  // Tự động bật ô tìm kiếm nếu danh sách có từ 5 mục trở lên
  const shouldShowSearch = options.length >= 5;

  const mappedOptions: SearchableSelectOption[] = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
    badge: opt.badge !== undefined ? opt.badge : opt.count !== undefined ? opt.count : undefined,
    icon: opt.icon ? <Icon name={opt.icon} size={14} /> : undefined,
  }));

  return (
    <SearchableSelect
      options={mappedOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      labelPrefix={labelPrefix}
      showSearch={shouldShowSearch}
      align={align}
      disabled={disabled}
      className={className}
      triggerClassName={triggerClassName}
      menuClassName={menuClassName}
    />
  );
};
