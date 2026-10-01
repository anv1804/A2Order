import React from "react";
import { Icon, Checkbox } from "@/components/ui";
import { FnbDishItem, FnbMajorCategory } from "@a2order/shared";
import { MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

export interface ScenarioMobileCardsProps {
  dishes: FnbDishItem[];
  selectedDishIds: string[];
  onToggleSelectDish: (id: string) => void;
  handleEditDish: (dish: FnbDishItem) => void;
  handleDeleteDish: (dish: FnbDishItem) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  hasMore: boolean;
  totalCount: number;
  visibleCount: number;
}

const getStationInfo = (station?: "KITCHEN" | "BAR" | "DESSERT") => {
  switch (station) {
    case "BAR":
      return { label: "Quầy Bar", dotColor: "bg-amber-500", textColor: "text-amber-800" };
    case "DESSERT":
      return { label: "Quầy Bánh", dotColor: "bg-purple-500", textColor: "text-purple-800" };
    case "KITCHEN":
    default:
      return { label: "Bếp Nóng", dotColor: "bg-emerald-500", textColor: "text-emerald-800" };
  }
};

const getMajorBadge = (major?: FnbMajorCategory) => {
  switch (major) {
    case "DRINK":
      return { label: "Đồ Uống", icon: "coffee" as const };
    case "DESSERT":
      return { label: "Tráng Miệng", icon: "cake" as const };
    case "FOOD":
    default:
      return { label: "Đồ Ăn", icon: "utensils" as const };
  }
};

export const ScenarioMobileCards: React.FC<ScenarioMobileCardsProps> = ({
  dishes,
  selectedDishIds,
  onToggleSelectDish,
  handleEditDish,
  handleDeleteDish,
  sentinelRef,
  hasMore,
  totalCount,
  visibleCount,
}) => {
  return (
    <div className="block lg:hidden w-full space-y-2">
      {dishes.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-bold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="utensils" size={20} />
            </div>
            <span>Không tìm thấy món mẫu nào phù hợp</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {dishes.map((dish) => {
            const isSelected = selectedDishIds.includes(dish.id);
            const major =
              dish.majorCategory ||
              (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");
            const majorInfo = getMajorBadge(major);
            const stationInfo = getStationInfo(dish.station);

            const hasMargin = dish.costPrice && dish.costPrice > 0 && dish.price > dish.costPrice;
            const marginPercent = hasMargin
              ? Math.round(((dish.price - (dish.costPrice || 0)) / dish.price) * 100)
              : 0;

            const variantCount = dish.variants?.length || 0;
            const customGroupCount = dish.customizationGroups?.length || 0;

            return (
              <div
                key={dish.id}
                className={`rounded-2xl border p-2.5 sm:p-3 transition-all ${
                  isSelected
                    ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/40 shadow-xs"
                    : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* 1. Checkbox chọn món */}
                  <div className="pt-1 shrink-0">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectDish(dish.id)}
                      title={`Chọn ${dish.name}`}
                      size="sm"
                    />
                  </div>

                  {/* 2. Ảnh món ăn: Cố định kích thước chuẩn w-16 h-16 (64x64px), không bao giờ bị phình to */}
                  <div className="relative w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                    ) : (
                      <Icon name={majorInfo.icon} size={22} className="text-slate-400" />
                    )}

                    {/* Huy hiệu Hot tinh tế ghim góc ảnh */}
                    {dish.isBestSeller && (
                      <span className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 leading-none z-10">
                        <Icon name="flame" size={8} className="fill-white" />
                        Hot
                      </span>
                    )}
                  </div>

                  {/* 3. Nội dung thông tin món */}
                  <div className="flex-1 min-w-0">
                    {/* Hàng 1: Tên món + Nút thao tác Sửa/Xóa tinh tế */}
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                        {dish.name}
                      </h4>

                      {/* Nút thao tác Icon-only */}
                      <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditDish(dish)}
                          title={`Chỉnh sửa ${dish.name}`}
                          aria-label="Chỉnh sửa món"
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          <Icon name="edit" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(dish)}
                          title={`Xóa ${dish.name}`}
                          aria-label="Xóa món"
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Hàng 2: Phân loại & Trạm phục vụ - GỌN TRÊN 1 DÒNG DUY NHẤT (Chống bậc thang) */}
                    <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-slate-500 font-medium truncate">
                      <span className="font-bold text-slate-700 shrink-0">{majorInfo.label}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 truncate">{dish.category || "Món Chung"}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`font-semibold shrink-0 ${stationInfo.textColor}`}>
                        {stationInfo.label}
                      </span>
                    </div>

                    {/* Hàng 3: Giá bán + Tỷ lệ lãi + Size/Topping (Đáy thẻ liền mạch) */}
                    <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-slate-950 font-mono tracking-tight">
                          {dish.price.toLocaleString("vi-VN")} đ
                        </span>
                        {hasMargin && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 leading-none">
                            +{marginPercent}% lãi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {variantCount > 1 && (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 leading-none">
                            {variantCount} size
                          </span>
                        )}
                        {customGroupCount > 0 && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 leading-none">
                            +{customGroupCount} topping
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sentinel tự động kích hoạt tải thêm 10 items khi cuộn xuống cuối màn hình */}
      <MobileInfiniteSentinel
        sentinelRef={sentinelRef}
        hasMore={hasMore}
        totalCount={totalCount}
        visibleCount={visibleCount}
      />
    </div>
  );
};

export default ScenarioMobileCards;
