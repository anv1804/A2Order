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
      return { label: "Quầy Bar", textColor: "text-amber-800" };
    case "DESSERT":
      return { label: "Quầy Bánh", textColor: "text-purple-800" };
    case "KITCHEN":
    default:
      return { label: "Bếp Nóng", textColor: "text-emerald-800" };
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
        <div className="grid grid-cols-1 gap-2.5">
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
                className={`rounded-2xl border p-3 transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/40 shadow-xs"
                    : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* 1. Phần thân chính: Ảnh món ăn + Thông tin rộng rãi */}
                <div className="flex items-start gap-3">
                  {/* Ảnh đại diện món ăn (72x72px): Bo góc mượt mà, bóng đổ nhẹ, badge Hot nếu có */}
                  <div className="relative w-[72px] h-[72px] min-w-[72px] min-h-[72px] max-w-[72px] max-h-[72px] rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 shadow-2xs">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <Icon name={majorInfo.icon} size={26} />
                      </div>
                    )}

                    {/* Huy hiệu Hot ghim góc ảnh */}
                    {dish.isBestSeller && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 leading-none z-10">
                        <Icon name="flame" size={8} className="fill-white" />
                        Hot
                      </span>
                    )}
                  </div>

                  {/* Thông tin món: Rộng rãi, không bị các nút bấm chèn ép */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[72px]">
                    <div>
                      {/* Tên món: Cho phép hiển thị 2 dòng đầy đủ, không bị cắt cụt */}
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
                        {dish.name}
                      </h4>

                      {/* Phân loại & Trạm phục vụ: 1 dòng thanh thoát */}
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-700 shrink-0">{majorInfo.label}</span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate text-slate-600">{dish.category || "Món Chung"}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`font-semibold shrink-0 ${stationInfo.textColor}`}>
                          {stationInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Giá bán + Tỷ lệ lãi: Không bao giờ bị rớt chữ đ */}
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-sm font-black text-slate-950 font-mono tracking-tight whitespace-nowrap">
                        {dish.price.toLocaleString("vi-VN")} đ
                      </span>
                      {hasMargin && (
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 whitespace-nowrap leading-none">
                          +{marginPercent}% lãi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Thanh đáy thẻ: Checkbox chọn món bên trái + Size/Topping + Nút Sửa/Xóa bên phải */}
                <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100">
                  {/* Left: Checkbox chọn món có nhãn dễ bấm */}
                  <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectDish(dish.id)}
                      size="sm"
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      {isSelected ? "Đã chọn" : "Chọn"}
                    </span>
                  </label>

                  {/* Right: Badges size/topping + Nút Sửa / Xóa */}
                  <div className="flex items-center gap-1.5">
                    {variantCount > 1 && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 leading-none">
                        {variantCount} size
                      </span>
                    )}
                    {customGroupCount > 0 && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60 leading-none">
                        +{customGroupCount} topping
                      </span>
                    )}

                    {/* Nút Action: Icon nhỏ gọn, thanh thoát, không thô */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => handleEditDish(dish)}
                        className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition active:scale-90 cursor-pointer"
                        title={`Sửa ${dish.name}`}
                        aria-label="Chỉnh sửa món"
                      >
                        <Icon name="edit" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDish(dish)}
                        className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-90 cursor-pointer"
                        title={`Xóa ${dish.name}`}
                        aria-label="Xóa món"
                      >
                        <Icon name="trash" size={13} />
                      </button>
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
