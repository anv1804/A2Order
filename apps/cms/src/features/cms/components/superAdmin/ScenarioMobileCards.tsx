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
      return { label: "Quầy Bar", dotColor: "bg-amber-500", textColor: "text-amber-800", bgColor: "bg-amber-50 border-amber-200/60" };
    case "DESSERT":
      return { label: "Quầy Bánh", dotColor: "bg-purple-500", textColor: "text-purple-800", bgColor: "bg-purple-50 border-purple-200/60" };
    case "KITCHEN":
    default:
      return { label: "Bếp Nóng", dotColor: "bg-emerald-500", textColor: "text-emerald-800", bgColor: "bg-emerald-50 border-emerald-200/60" };
  }
};

const getMajorBadge = (major?: FnbMajorCategory) => {
  switch (major) {
    case "DRINK":
      return { label: "Đồ Uống", className: "bg-sky-50 text-sky-700 border-sky-200/80", icon: "coffee" as const };
    case "DESSERT":
      return { label: "Tráng Miệng", className: "bg-purple-50 text-purple-700 border-purple-200/80", icon: "cake" as const };
    case "FOOD":
    default:
      return { label: "Đồ Ăn", className: "bg-orange-50 text-orange-700 border-orange-200/80", icon: "utensils" as const };
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
    <div className="block lg:hidden w-full space-y-2.5">
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
                className={`bg-white rounded-2xl border p-3 shadow-2xs transition-all space-y-2.5 ${
                  isSelected ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20" : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Header Card: Checkbox + Ảnh + Tên + Nút Thao Tác */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelectDish(dish.id)}
                        title={`Chọn ${dish.name}`}
                      />
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Icon name={majorInfo.icon} size={20} className="text-slate-400" />
                      )}
                      {dish.isBestSeller && (
                        <span
                          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                          title="Món bán chạy"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {dish.name}
                        </h4>
                        {dish.isBestSeller && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200/70">
                            <Icon name="flame" size={9} className="text-amber-500 fill-amber-400" />
                            Hot
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black border ${majorInfo.className}`}>
                          <Icon name={majorInfo.icon} size={9} />
                          {majorInfo.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {dish.category || "Món Chung"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút thao tác (Icon-only) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditDish(dish)}
                      title={`Chỉnh sửa ${dish.name}`}
                      aria-label="Chỉnh sửa món"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 active:scale-95 cursor-pointer"
                    >
                      <Icon name="edit" size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish)}
                      title={`Xóa ${dish.name}`}
                      aria-label="Xóa món"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 active:scale-95 cursor-pointer"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>

                {/* Footer Card: Giá bán, Giá vốn, Lợi nhuận và Trạm */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900">
                      {dish.price.toLocaleString("vi-VN")} đ
                    </span>
                    {hasMargin && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{marginPercent}% lãi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {variantCount > 1 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                        {variantCount} size
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${stationInfo.bgColor} ${stationInfo.textColor}`}>
                      <span className={`w-1 h-1 rounded-full ${stationInfo.dotColor}`} />
                      {stationInfo.label}
                    </span>
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
