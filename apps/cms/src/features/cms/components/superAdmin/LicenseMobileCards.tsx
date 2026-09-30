import React from "react";
import { Icon } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseMobileCardsProps {
  paginatedLicenses: LicenseKeyRecord[];
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseMobileCards: React.FC<LicenseMobileCardsProps> = ({
  paginatedLicenses,
  handleCopyKey,
  handleRevokeKey,
}) => {
  return (
                <div className="block lg:hidden">
              {paginatedLicenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted font-bold bg-surface-canvas rounded-2xl border border-surface-border">
                  Không tìm thấy mã License Key nào phù hợp bộ lọc
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {paginatedLicenses.map((lic) => (
                    <div
                      key={lic.id}
                      className="p-4 rounded-3xl bg-white border border-surface-border shadow-xs hover:shadow-elevated transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Header card */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-brand-950 px-2 py-0.5 rounded-lg bg-surface-canvas border border-surface-border">
                              {lic.keyCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(lic.keyCode)}
                              className="p-1 text-ink-subtle hover:text-brand-900"
                              title="Copy"
                            >
                              <Icon name="clipboard" className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            lic.plan === "PRO" ? "bg-purple-100 text-purple-900 border border-purple-200" :
                            lic.plan === "GROWTH" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                            "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}>
                            Gói {lic.plan}
                          </span>
                        </div>

                        {/* Quán liên kết */}
                        <div>
                          <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">Cửa Hàng Liên Kết:</span>
                          {lic.storeName ? (
                            <span className="text-xs font-black text-ink-primary block mt-0.5">{lic.storeName}</span>
                          ) : (
                            <span className="text-xs text-blue-700 italic font-medium block mt-0.5">Key dự phòng (Sẵn sàng kích hoạt)</span>
                          )}
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-surface-canvas border border-surface-border text-[11px]">
                          <div>
                            <span className="text-[10px] text-ink-muted block">Thời hạn:</span>
                            <span className="font-bold text-ink-primary">{lic.durationMonths} tháng</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-muted block">Hạn dùng:</span>
                            <span className="font-bold text-ink-primary">{lic.expiresAt}</span>
                          </div>
                          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-surface-border/60 text-[10px]">
                            <span className="text-ink-muted">Tối đa: {lic.maxDevices} máy POS/KDS</span>
                            <div>
                              {lic.status === "ACTIVE" && (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <Icon name="checkCircle" className="w-3 h-3" /> Hoạt động
                                </span>
                              )}
                              {lic.status === "UNASSIGNED" && (
                                <span className="text-blue-700 font-bold flex items-center gap-1">
                                  <Icon name="info" className="w-3 h-3" /> Chờ gán
                                </span>
                              )}
                              {lic.status === "EXPIRING_SOON" && (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                  <Icon name="clock" className="w-3 h-3" /> Sắp hết
                                </span>
                              )}
                              {lic.status === "EXPIRED" && (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <Icon name="alert" className="w-3 h-3" /> Hết hạn
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="pt-2 border-t border-surface-border flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyKey(lic.keyCode)}
                          className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors text-center"
                        >
                          Copy Mã Key
                        </button>
                        {lic.status !== "REVOKED" && (
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(lic)}
                            className="py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            Thu Hồi
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

  );
};
