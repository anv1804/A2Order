import React from "react";
import { Icon } from "@/components/ui";
import { StaffOrderTableListProps } from "@/types";

export const StaffOrderTableList: React.FC<StaffOrderTableListProps> = ({
  tables,
  activeTableId,
  setActiveTableId,
  selectedZone,
  setSelectedZone,
  pendingRequests,
  isApprovingId,
  onApproveSession,
  onNavigateTab,
  setMobileStep,
  formatTableName,
}) => {
  const zones = ["TẤT CẢ", ...Array.from(new Set(tables.map((t) => t.zoneName).filter(Boolean)))];

  const filteredTables = tables.filter((t) => {
    if (selectedZone === "TẤT CẢ") return true;
    return t.zoneName === selectedZone;
  });

  return (
    <div className="bg-white p-3 sm:p-3.5 rounded-3xl border border-surface-border shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      <div className="flex items-center justify-between gap-1.5 border-b border-surface-border pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon name="table" className="w-4 h-4 text-brand-900" />
          <span className="text-xs font-black uppercase tracking-wider text-ink-primary">
            Bàn Phục Vụ
          </span>
          <span className="text-xs text-ink-muted">({tables.length})</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab?.("tables")}
          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline shrink-0 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
          title="Mở sơ đồ phòng bàn để Mở bàn / Đóng bàn"
        >
          <span>Sơ Đồ Bàn</span>
          <Icon name="arrowRight" size={11} />
        </button>
      </div>

      {/* Tabs lọc Khu vực */}
      <div className="flex items-center gap-1 overflow-x-auto py-2 border-b border-surface-border/60 shrink-0 text-xs no-scrollbar">
        {zones.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => setSelectedZone(zone)}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 whitespace-nowrap text-[11px] ${
              selectedZone === zone
                ? "bg-brand-900 text-white shadow-2xs font-black"
                : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Grid danh sách bàn */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 min-h-0 pr-1 py-2">
        {filteredTables.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-xs text-ink-muted italic">
            Chưa có bàn nào trong khu vực này
          </div>
        ) : (
          filteredTables.map((t) => {
            const isSelected = t.tableId === activeTableId;
            const pendingReq = pendingRequests.find((r) => r.tableId === t.tableId);

            return (
              <button
                key={t.tableId}
                type="button"
                onClick={() => {
                  setActiveTableId(t.tableId);
                  setMobileStep("MENU");
                }}
                className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between active:scale-98 ${
                  pendingReq
                    ? "border-amber-500 ring-2 ring-amber-400 bg-amber-50/90 shadow-md animate-pulse"
                    : isSelected
                    ? "border-brand-900 ring-2 ring-brand-900/20 shadow-md bg-brand-50/40"
                    : t.status === "EMPTY"
                    ? "border-surface-border bg-white hover:border-brand-200"
                    : t.status === "OCCUPIED"
                    ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                    : t.status === "WAITING_FOOD"
                    ? "border-purple-300 bg-purple-50/50 hover:border-purple-400"
                    : "border-rose-400 bg-rose-50/60 hover:border-rose-500 animate-pulse"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-ink-primary block truncate">{t.tableName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mt-0.5">
                      <span>{t.zoneName}</span>
                      {t.pin && (
                        <span className="font-mono font-bold text-[9px] px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          PIN: {t.pin}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[9.5px] font-black shrink-0 ${
                      t.status === "EMPTY"
                        ? "bg-slate-100 text-slate-500"
                        : t.status === "OCCUPIED"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : t.status === "WAITING_FOOD"
                        ? "bg-purple-100 text-purple-900 border border-purple-200"
                        : "bg-rose-100 text-rose-900 border border-rose-200 animate-pulse"
                    }`}
                  >
                    {t.status === "EMPTY" ? "Trống" : t.status === "OCCUPIED" ? "Có khách" : t.status === "WAITING_FOOD" ? "Chờ món" : "Tính tiền"}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-surface-border/40 flex items-center justify-between text-[11px]">
                  {pendingReq ? (
                    <span className="text-[10.5px] font-black text-amber-900">🔔 Chờ duyệt mở bàn</span>
                  ) : t.status !== "EMPTY" && t.items.length > 0 ? (
                    <>
                      <span className="font-black text-brand-950">{t.totalAmount.toLocaleString("vi-VN")} đ</span>
                      <span className="text-[10px] text-ink-muted">{t.items.length} món</span>
                    </>
                  ) : t.status !== "EMPTY" ? (
                    <>
                      <span className="font-bold text-emerald-800 text-[10.5px]">👥 {t.guestCount || 2} khách</span>
                      <span className="text-[10px] text-ink-muted">Vào {t.openedAt || "--:--"}</span>
                    </>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic">Bàn trống</span>
                  )}
                </div>

                {pendingReq && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApproveSession(pendingReq);
                    }}
                    disabled={isApprovingId === pendingReq.tableId}
                    className="w-full mt-2 py-1 px-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-xs transition disabled:opacity-50"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Mở Bàn</span>
                  </button>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
