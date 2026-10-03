import React from "react";
import {
  Icon,
  Checkbox,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import { FnbDishItem, FnbMajorCategory } from "@a2order/shared";

export interface ScenarioDesktopTableProps {
  paginatedDishes: FnbDishItem[];
  selectedDishIds: string[];
  onToggleSelectDish: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleEditDish: (dish: FnbDishItem) => void;
  handleDeleteDish: (dish: FnbDishItem) => void;
}

const getStationInfo = (station?: "KITCHEN" | "BAR" | "DESSERT") => {
  switch (station) {
    case "BAR":
      return { label: "Quầy Bar", dotColor: "bg-amber-500" };
    case "DESSERT":
      return { label: "Quầy Bánh", dotColor: "bg-purple-500" };
    case "KITCHEN":
    default:
      return { label: "Bếp Nóng", dotColor: "bg-emerald-500" };
  }
};

const getMajorLabel = (major?: FnbMajorCategory) => {
  switch (major) {
    case "DRINK":
      return "Đồ Uống";
    case "DESSERT":
      return "Tráng Miệng";
    case "FOOD":
    default:
      return "Đồ Ăn";
  }
};

export const ScenarioDesktopTable: React.FC<ScenarioDesktopTableProps> = ({
  paginatedDishes,
  selectedDishIds,
  onToggleSelectDish,
  onToggleSelectAll,
  isAllSelected,
  isIndeterminate,
  handleEditDish,
  handleDeleteDish,
}) => {
  return (
    <div className="hidden lg:block w-full">
      <TableContainer className="rounded-none border-0 shadow-none">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs shadow-2xs">
            <TableRow>
              <TableHead className="py-2.5 pl-3.5 pr-1 w-10">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={onToggleSelectAll}
                  title="Chọn tất cả món trên trang này"
                />
              </TableHead>
              <TableHead>Món Ăn Mẫu</TableHead>
              <TableHead>Trụ Cột & Danh Mục</TableHead>
              <TableHead>Đơn Giá & Giá Vốn</TableHead>
              <TableHead>Trạm & Tùy Chọn</TableHead>
              <TableHead align="right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDishes.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon="utensils"
                title="Không tìm thấy món mẫu"
                description="Không tìm thấy món ăn mẫu nào phù hợp với bộ lọc."
              />
            ) : (
            paginatedDishes.map((dish) => {
              const isSelected = selectedDishIds.includes(dish.id);
              const major =
                dish.majorCategory ||
                (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");
              const majorText = getMajorLabel(major);
              const stationInfo = getStationInfo(dish.station);

              const hasMargin = dish.costPrice && dish.costPrice > 0 && dish.price > dish.costPrice;
              const marginPercent = hasMargin
                ? Math.round(((dish.price - (dish.costPrice || 0)) / dish.price) * 100)
                : 0;

              const variantCount = dish.variants?.length || 0;
              const customGroupCount = dish.customizationGroups?.length || 0;

              return (
                <tr
                  key={dish.id}
                  className={`transition-colors group ${
                    isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Checkbox chọn từng món */}
                  <td className="py-2.5 pl-3.5 pr-1">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectDish(dish.id)}
                      title={`Chọn ${dish.name}`}
                    />
                  </td>

                  {/* Ảnh & Tên món */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Icon name="utensils" size={16} className="text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => handleEditDish(dish)}
                            className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs truncate max-w-[200px] xl:max-w-[280px] cursor-pointer"
                            title={dish.name}
                          >
                            {dish.name}
                          </span>
                          {dish.isBestSeller && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                              <Icon name="flame" size={9} className="text-amber-500 fill-amber-400" />
                              Hot
                            </span>
                          )}
                        </div>

                        {dish.description && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[220px] xl:max-w-[320px] mt-0.5">
                            {dish.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Trụ cột & Danh mục */}
                  <td className="py-2.5 px-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800">
                        {dish.category || "Món Chung"}
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-medium">
                        {majorText}
                      </div>
                    </div>
                  </td>

                  {/* Đơn giá & Giá vốn */}
                  <td className="py-2.5 px-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900">
                        {dish.price.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span>Vốn: {dish.costPrice ? `${dish.costPrice.toLocaleString("vi-VN")} đ` : "—"}</span>
                        {hasMargin && (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded ml-1">
                            +{marginPercent}% lãi
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Trạm & Tùy chọn kích cỡ/topping */}
                  <td className="py-2.5 px-3">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                        <span className={`w-1.5 h-1.5 rounded-full ${stationInfo.dotColor}`} />
                        {stationInfo.label}
                      </span>
                      {(variantCount > 1 || customGroupCount > 0) && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          {variantCount > 1 && `${variantCount} size`}
                          {variantCount > 1 && customGroupCount > 0 && " • "}
                          {customGroupCount > 0 && `${customGroupCount} topping`}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Thao tác (Icon-only buttons with tooltips) */}
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditDish(dish)}
                        title={`Chỉnh sửa ${dish.name}`}
                        aria-label="Chỉnh sửa món"
                        className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer"
                      >
                        <Icon name="edit" size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDish(dish)}
                        title={`Xóa ${dish.name}`}
                        aria-label="Xóa món"
                        className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95 cursor-pointer"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
  );
};
