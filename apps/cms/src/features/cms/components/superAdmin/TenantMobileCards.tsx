import React from "react";
import { Icon } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";

export interface TenantMobileCardsProps {
  paginatedStores: TenantStoreRecord[];
  onImpersonateStore?: (store: TenantStoreRecord) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantMobileCards: React.FC<TenantMobileCardsProps> = ({
  paginatedStores,
  onImpersonateStore,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
}) => {
  return (
                <div className="block lg:hidden">
              {paginatedStores.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted font-bold bg-surface-canvas rounded-2xl border border-surface-border">
                  Không tìm thấy quán nào phù hợp với bộ lọc tìm kiếm
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {paginatedStores.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-3xl bg-white border border-surface-border shadow-xs hover:shadow-elevated transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Header card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-black text-ink-primary truncate" title={s.name}>
                              {s.name}
                            </h4>
                            <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                              {s.owner} • <a href={`tel:${s.phone}`} className="text-brand-900 font-bold hover:underline">{s.phone}</a>
                            </p>
                            <p className="text-[10px] text-ink-subtle truncate">{s.address}</p>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 whitespace-nowrap ${
                              s.plan === "PRO"
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : s.plan === "GROWTH"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {s.plan === "PRO" ? "Chuỗi Pro" : s.plan === "GROWTH" ? "Quán Vừa" : "Quán Nhỏ"}
                          </span>
                        </div>

                        {/* Badges mô hình & trạng thái */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.businessType && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                              {BUSINESS_TYPE_CONFIG[s.businessType].emoji} {BUSINESS_TYPE_CONFIG[s.businessType].label}
                            </span>
                          )}

                          {s.status === "ACTIVE" && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-bold flex items-center gap-1">
                              <Icon name="checkCircle" className="w-3 h-3 text-emerald-600" />
                              Còn {s.daysLeft} ngày
                            </span>
                          )}
                          {s.status === "EXPIRING_SOON" && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 font-bold flex items-center gap-1">
                              <Icon name="clock" className="w-3 h-3 text-amber-600" />
                              Sắp hết ({s.daysLeft} ngày)
                            </span>
                          )}
                          {s.status === "EXPIRED" && (
                            <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 font-bold flex items-center gap-1">
                              <Icon name="alert" className="w-3 h-3 text-rose-600" />
                              Hết hạn
                            </span>
                          )}
                          {s.status === "SUSPENDED" && (
                            <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold flex items-center gap-1">
                              <Icon name="ban" className="w-3 h-3 text-slate-500" />
                              Tạm khóa
                            </span>
                          )}
                        </div>

                        {/* Thông số kỹ thuật */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-surface-canvas border border-surface-border text-[11px]">
                          <div>
                            <span className="text-[10px] text-ink-muted block">Mã License:</span>
                            <span className="font-mono font-bold text-ink-primary truncate block">{s.licenseKey}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-muted block">Quy mô:</span>
                            <span className="font-bold text-ink-primary">{s.tableCount} bàn</span>
                          </div>
                          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-surface-border/60 text-[10px]">
                            <span className="flex items-center gap-1 text-ink-primary font-bold">
                              <span className={`w-2 h-2 rounded-full ${s.activeDevices > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                              {s.activeDevices > 0 ? `${s.activeDevices} POS Online` : "Chưa kết nối"}
                            </span>
                            <span className="text-ink-muted">{s.configVer}</span>
                          </div>
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="pt-2 border-t border-surface-border flex items-center gap-1.5 flex-wrap">
                        {onImpersonateStore && (
                          <button
                            type="button"
                            onClick={() => onImpersonateStore(s)}
                            className="flex-1 py-1.5 px-2 rounded-xl text-xs font-black bg-brand-900 text-white flex items-center justify-center gap-1 shadow-xs hover:bg-black transition-colors"
                          >
                            <Icon name="externalLink" size={11} />
                            <span>Vào Quán</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewingStoreDetails(s)}
                          className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-white border border-surface-border text-ink-primary hover:border-brand-300 hover:text-brand-900 transition-colors shadow-xs text-center"
                        >
                          Hồ Sơ
                        </button>

                        <button
                          type="button"
                          onClick={() => setLicenseTargetStore(s)}
                          className="py-1.5 px-3 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors"
                        >
                          Gia Hạn
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStoreStatus(s)}
                          className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                            s.status === "SUSPENDED"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {s.status === "SUSPENDED" ? "Mở" : "Khóa"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

  );
};
