import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { CmsShiftStaffCarouselProps } from "@/types";

export const CmsShiftStaffCarousel: React.FC<CmsShiftStaffCarouselProps> = ({
  staffList,
  onNavigateTab,
}) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isMorningCurrent = currentHour >= 6 && currentHour < 14;
  const isEveningCurrent = currentHour >= 14 && currentHour < 23;

  const [carouselIndex, setCarouselIndex] = useState<number>(isEveningCurrent ? 2 : 1);
  const [enableTransition, setEnableTransition] = useState<boolean>(true);
  const [isShiftPaused, setIsShiftPaused] = useState<boolean>(false);
  const [autoCloseShift, setAutoCloseShift] = usePersistentState<boolean>("auto_close_shift_enabled", true);

  const activeShift: "MORNING" | "EVENING" =
    carouselIndex === 1 || carouselIndex === 3 ? "MORNING" : "EVENING";

  const goNext = useCallback(() => {
    setEnableTransition(true);
    setCarouselIndex((prev) => prev + 1);
  }, []);

  const goPrev = useCallback(() => {
    setEnableTransition(true);
    setCarouselIndex((prev) => prev - 1);
  }, []);

  useEffect(() => {
    if (carouselIndex >= 3) {
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setCarouselIndex(1);
      }, 510);
      return () => clearTimeout(timer);
    }
    if (carouselIndex <= 0) {
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setCarouselIndex(2);
      }, 510);
      return () => clearTimeout(timer);
    }
  }, [carouselIndex]);

  useEffect(() => {
    if (!enableTransition) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setEnableTransition(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [enableTransition]);

  useEffect(() => {
    if (isShiftPaused) return;
    const timer = setInterval(() => {
      goNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isShiftPaused, goNext]);

  const selectShift = (target: "MORNING" | "EVENING") => {
    if (target === activeShift) return;
    goNext();
  };

  const morningStaff = useMemo(() => {
    return staffList.filter((s: any) => s.isActive && (s.shift === "MORNING" || !s.shift));
  }, [staffList]);

  const eveningStaff = useMemo(() => {
    return staffList.filter((s: any) => s.isActive && s.shift === "EVENING");
  }, [staffList]);

  return (
    <div className="lg:col-span-5 flex flex-col h-full">
      <section
        onMouseEnter={() => setIsShiftPaused(true)}
        onMouseLeave={() => setIsShiftPaused(false)}
        className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs h-full flex flex-col justify-between space-y-2.5"
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide truncate">
                Nhân Viên Theo Ca
              </h4>
              <div className="flex items-center gap-1">
                <span className={`h-1.5 rounded-full transition-all duration-300 ${activeShift === "MORNING" ? "w-3.5 bg-emerald-600" : "w-1.5 bg-slate-300"}`} />
                <span className={`h-1.5 rounded-full transition-all duration-300 ${activeShift === "EVENING" ? "w-3.5 bg-emerald-600" : "w-1.5 bg-slate-300"}`} />
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                title="Ca trước"
                aria-label="Ca trước"
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
              >
                <Icon name="chevronLeft" size={13} />
              </button>
              <button
                type="button"
                onClick={goNext}
                title="Ca tiếp theo"
                aria-label="Ca tiếp theo"
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
              >
                <Icon name="chevronRight" size={13} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/90 mb-2.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => selectShift("MORNING")}
              className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-between gap-1 whitespace-nowrap ${
                activeShift === "MORNING"
                  ? "bg-white text-slate-900 shadow-2xs font-black ring-1 ring-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isMorningCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                <span className={activeShift === "MORNING" && isMorningCurrent ? "text-emerald-700 font-black" : "text-slate-700"}>Sáng</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">06:00-14:00</span>
            </button>

            <button
              type="button"
              onClick={() => selectShift("EVENING")}
              className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-between gap-1 whitespace-nowrap ${
                activeShift === "EVENING"
                  ? "bg-white text-slate-900 shadow-2xs font-black ring-1 ring-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isEveningCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                <span className={activeShift === "EVENING" && isEveningCurrent ? "text-emerald-700 font-black" : "text-slate-700"}>Tối</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">14:00-22:30</span>
            </button>
          </div>

          <div className="relative overflow-hidden w-full flex-1 min-h-[95px]">
            <div
              className="flex h-full w-[400%]"
              style={{
                transform: `translateX(-${carouselIndex * 25}%)`,
                transition: enableTransition ? "transform 500ms ease-in-out" : "none",
              }}
            >
              {[
                { type: "EVENING" as const, key: "clone-evening" },
                { type: "MORNING" as const, key: "real-morning" },
                { type: "EVENING" as const, key: "real-evening" },
                { type: "MORNING" as const, key: "clone-morning" },
              ].map((slide) => {
                const isMorning = slide.type === "MORNING";
                const staff = isMorning ? morningStaff : eveningStaff;
                const isCurrent = isMorning ? isMorningCurrent : isEveningCurrent;

                return (
                  <div key={slide.key} className="w-1/4 px-1 flex flex-col justify-center shrink-0 overflow-hidden h-[95px]">
                    {staff.length === 0 ? (
                      <div className="h-full rounded-xl bg-slate-50/80 border border-dashed border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Icon name="users" size={13} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-700 truncate leading-tight">Chưa xếp ca</h5>
                            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">Thu ngân & phục vụ</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigateTab?.("team")}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] transition active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
                        >
                          + Xếp Ca
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 overflow-y-auto max-h-[95px] pr-0.5">
                        {staff.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/90 border border-slate-100 hover:border-slate-200 transition">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-lg ${isMorning ? "bg-[#102d25]" : "bg-slate-700"} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                                {s.name?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-slate-900 truncate leading-tight">{s.name}</h5>
                                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                  {s.role === "STORE_OWNER" ? "Chủ Quán" : s.role === "CASHIER" ? "Thu Ngân" : s.role === "WAITER" ? "Phục Vụ" : s.role === "CHEF" ? "Bếp Trưởng" : s.role}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                              isCurrent ? "text-emerald-700 bg-emerald-50 border-emerald-100 font-black" : "text-slate-400 bg-slate-100 border-slate-200 font-medium"
                            }`}>
                              {isCurrent ? "Đang trực" : isMorning ? "Đã xong" : "Chưa tới"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auto chốt ca */}
        <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                autoCloseShift ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
              }`}>
                <Icon name="clock" size={13} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 whitespace-nowrap">Auto Chốt Ca</span>
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                    autoCloseShift
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {activeShift === "MORNING" ? "14:00" : "22:30"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {autoCloseShift ? "Tự khóa sổ & kết ca" : "Chưa kích hoạt"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoCloseShift}
              onClick={() => {
                const nextState = !autoCloseShift;
                setAutoCloseShift(nextState);
                if (nextState) {
                  toast.success(`Đã BẬT Auto Chốt Ca (${activeShift === "MORNING" ? "14:00" : "22:30"}). Tự động lưu Z-Report.`);
                } else {
                  toast.info("Đã TẮT Auto Chốt Ca. Bạn sẽ chốt ca thủ công.");
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                autoCloseShift ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoCloseShift ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.("team")}
              className="py-1.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-98 shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Icon name="users" size={13} className="shrink-0 text-slate-500" />
              <span className="whitespace-nowrap font-bold">+ NV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toast.info("Chuyển tới Báo Cáo Doanh Thu & Kiểm Kê Ca Làm Việc (Z-Report)");
                onNavigateTab?.("analytics");
              }}
              className="py-1.5 px-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs font-black text-emerald-800 transition active:scale-98 shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Icon name="checkCircle" size={13} className="shrink-0 text-emerald-600" />
              <span className="whitespace-nowrap font-black">Chốt Ca</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
