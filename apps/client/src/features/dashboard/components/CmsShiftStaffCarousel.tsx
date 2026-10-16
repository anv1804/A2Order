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
        className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between space-y-3"
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
                <Icon name="users" size={15} />
              </span>
              <h4 className="font-black text-xs sm:text-sm text-ink-primary tracking-tight truncate">
                Nhân Viên Theo Ca
              </h4>
              <div className="flex items-center gap-1">
                <span className={`h-1.5 rounded-full transition-all duration-300 ${activeShift === "MORNING" ? "w-3.5 bg-brand-900" : "w-1.5 bg-surface-border"}`} />
                <span className={`h-1.5 rounded-full transition-all duration-300 ${activeShift === "EVENING" ? "w-3.5 bg-brand-900" : "w-1.5 bg-surface-border"}`} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                title="Ca trước"
                aria-label="Ca trước"
                className="w-8 h-8 rounded-xl border border-surface-border bg-surface-canvas flex items-center justify-center text-ink-muted hover:bg-surface-border/60 hover:text-ink-primary transition active:scale-95"
              >
                <Icon name="chevronLeft" size={14} />
              </button>
              <button
                type="button"
                onClick={goNext}
                title="Ca tiếp theo"
                aria-label="Ca tiếp theo"
                className="w-8 h-8 rounded-xl border border-surface-border bg-surface-canvas flex items-center justify-center text-ink-muted hover:bg-surface-border/60 hover:text-ink-primary transition active:scale-95"
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-surface-canvas mb-3 text-xs shrink-0">
            <button
              type="button"
              onClick={() => selectShift("MORNING")}
              className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-between gap-1 whitespace-nowrap ${
                activeShift === "MORNING"
                  ? "bg-white text-ink-primary shadow-xs font-black border border-surface-border"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isMorningCurrent && <span className="w-1.5 h-1.5 rounded-full bg-brand-700 animate-pulse shrink-0" />}
                <span className={activeShift === "MORNING" && isMorningCurrent ? "text-brand-900 font-black" : "text-ink-primary"}>Sáng</span>
              </div>
              <span className="font-mono text-[10px] text-ink-subtle font-semibold">06:00-14:00</span>
            </button>

            <button
              type="button"
              onClick={() => selectShift("EVENING")}
              className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-between gap-1 whitespace-nowrap ${
                activeShift === "EVENING"
                  ? "bg-white text-ink-primary shadow-xs font-black border border-surface-border"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isEveningCurrent && <span className="w-1.5 h-1.5 rounded-full bg-brand-700 animate-pulse shrink-0" />}
                <span className={activeShift === "EVENING" && isEveningCurrent ? "text-brand-900 font-black" : "text-ink-primary"}>Tối</span>
              </div>
              <span className="font-mono text-[10px] text-ink-subtle font-semibold">14:00-22:30</span>
            </button>
          </div>

          <div className="relative overflow-hidden w-full flex-1 min-h-[110px]">
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
                  <div key={slide.key} className="w-1/4 px-1 flex flex-col justify-center shrink-0 overflow-hidden h-[110px]">
                    {staff.length === 0 ? (
                      <div className="h-full rounded-2xl bg-surface-canvas/60 border border-dashed border-surface-border px-3 py-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-surface-canvas flex items-center justify-center text-ink-muted shrink-0">
                            <Icon name="users" size={15} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-ink-primary truncate leading-tight">Chưa xếp ca</h5>
                            <p className="text-[10px] text-ink-muted truncate leading-tight mt-0.5">Thu ngân & phục vụ</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigateTab?.("team")}
                          className="px-3 py-1.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs transition active:scale-95 shadow-xs shrink-0 whitespace-nowrap"
                        >
                          + Xếp Ca
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 overflow-y-auto max-h-[110px] pr-0.5">
                        {staff.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-2 sm:p-2.5 rounded-2xl bg-surface-canvas/60 border border-surface-border/60 hover:bg-surface-canvas transition">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${isMorning ? "bg-brand-900" : "bg-[#194B3A]"} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}>
                                {s.name?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-ink-primary truncate leading-tight">{s.name}</h5>
                                <span className="text-[10px] text-ink-muted block truncate mt-0.5">
                                  {s.role === "STORE_OWNER" ? "Chủ Quán" : s.role === "CASHIER" ? "Thu Ngân" : s.role === "WAITER" ? "Phục Vụ" : s.role === "CHEF" ? "Bếp Trưởng" : s.role}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 whitespace-nowrap ${
                              isCurrent ? "text-brand-900 bg-[#E8F5EE] border-brand-200/60 font-black" : "text-ink-muted bg-surface-canvas border-surface-border font-medium"
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
        <div className="pt-3 border-t border-surface-border/60 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-canvas border border-surface-border/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 ${
                autoCloseShift ? "bg-brand-100 text-brand-900" : "bg-surface-border text-ink-muted"
              }`}>
                <Icon name="clock" size={14} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-ink-primary whitespace-nowrap">Auto Chốt Ca</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border whitespace-nowrap ${
                    autoCloseShift
                      ? "bg-[#E8F5EE] text-brand-900 border-brand-200/60"
                      : "bg-surface-canvas text-ink-muted border-surface-border"
                  }`}>
                    {activeShift === "MORNING" ? "14:00" : "22:30"}
                  </span>
                </div>
                <p className="text-[10px] text-ink-muted truncate">
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
                autoCloseShift ? "bg-brand-900" : "bg-surface-border"
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
              className="h-10 px-3 rounded-2xl border border-surface-border hover:bg-surface-canvas text-xs font-bold text-ink-primary transition active:scale-95 shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Icon name="users" size={14} className="shrink-0 text-ink-muted" />
              <span>+ Nhân Viên</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toast.info("Chuyển tới Báo Cáo Doanh Thu & Kiểm Kê Ca Làm Việc (Z-Report)");
                onNavigateTab?.("analytics");
              }}
              className="h-10 px-3 rounded-2xl bg-[#E8F5EE] border border-brand-200/60 hover:bg-brand-100 text-xs font-black text-brand-900 transition active:scale-95 shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Icon name="checkCircle" size={14} className="shrink-0 text-brand-800" />
              <span>Chốt Ca</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
