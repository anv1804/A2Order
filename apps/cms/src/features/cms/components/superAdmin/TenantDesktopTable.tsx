import React from "react";
import { Icon } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";

export interface TenantDesktopTableProps {
  paginatedStores: TenantStoreRecord[];
  onImpersonateStore?: (store: TenantStoreRecord) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantDesktopTable: React.FC<TenantDesktopTableProps> = ({
  paginatedStores,
  onImpersonateStore,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
}) => {
  return (
                <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="pb-3 px-3">Tên Quán / Chủ Sở Hữu</th>
                    <th className="pb-3 px-3">Gói Thuê & Quy Mô</th>
                    <th className="pb-3 px-3">Mã Hợp Đồng / Key</th>
                    <th className="pb-3 px-3">Hạn Dùng</th>
                    <th className="pb-3 px-3">Thiết Bị POS & Đồng Bộ</th>
                    <th className="pb-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-medium">
                  {paginatedStores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-ink-muted font-bold">
                        Không tìm thấy quán nào phù hợp với bộ lọc tìm kiếm
                      </td>
                    </tr>
                  ) : (
                    paginatedStores.map((s) => (
                      <tr key={s.id} className="hover:bg-brand-50/20 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-ink-primary text-xs">{s.name}</div>
                          <div className="text-[10px] text-ink-muted">{s.owner} • {s.phone}</div>
                          <div className="text-[10px] text-ink-subtle">{s.address}</div>
                          {s.businessType && (
                            <div className="mt-1">
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                {BUSINESS_TYPE_CONFIG[s.businessType].emoji} {BUSINESS_TYPE_CONFIG[s.businessType].label}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                              s.plan === "PRO"
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : s.plan === "GROWTH"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {s.plan === "PRO" ? "Chuỗi Pro (599k)" : s.plan === "GROWTH" ? "Quán Vừa (399k)" : "Quán Nhỏ (199k)"}
                          </span>
                          <div className="text-[10px] text-ink-muted mt-1 whitespace-nowrap">{s.tableCount} bàn</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-ink-primary whitespace-nowrap">
                            {s.licenseKey}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {s.status === "ACTIVE" && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Icon name="checkCircle" className="w-3.5 h-3.5" />
                              Còn {s.daysLeft} ngày
                            </span>
                          )}
                          {s.status === "EXPIRING_SOON" && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Icon name="clock" className="w-3.5 h-3.5" />
                              Sắp hết ({s.daysLeft} ngày)
                            </span>
                          )}
                          {s.status === "EXPIRED" && (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <Icon name="alert" className="w-3.5 h-3.5" />
                              Đã hết hạn
                            </span>
                          )}
                          {s.status === "SUSPENDED" && (
                            <span className="text-slate-500 font-bold flex items-center gap-1">
                              <Icon name="ban" className="w-3.5 h-3.5" />
                              Tạm khóa
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  s.activeDevices > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                }`}
                              />
                              <span className="font-extrabold text-ink-primary text-xs whitespace-nowrap">
                                {s.activeDevices > 0 ? `${s.activeDevices} POS Online` : "Offline"}
                              </span>
                            </div>
                            <span className="text-[10px] text-ink-muted mt-0.5 whitespace-nowrap">
                              {s.activeDevices > 0 ? "Đồng bộ 1p trước" : "Chưa kết nối"} • {s.configVer}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {onImpersonateStore && (
                              <button
                                type="button"
                                onClick={() => onImpersonateStore(s)}
                                className="px-2.5 py-1 rounded-xl text-xs font-black bg-brand-900 text-white hover:bg-black transition-colors shadow-xs flex items-center gap-1 whitespace-nowrap"
                                title="Đăng nhập dưới quyền để hỗ trợ kỹ thuật cho quán"
                              >
                                <Icon name="externalLink" size={11} />
                                <span>Vào Quản Trị</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setViewingStoreDetails(s)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white border border-surface-border text-ink-primary hover:border-brand-300 hover:text-brand-900 transition-colors shadow-xs whitespace-nowrap"
                            >
                              Hồ Sơ & Module
                            </button>

                            <button
                              type="button"
                              onClick={() => setLicenseTargetStore(s)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors whitespace-nowrap"
                            >
                              Gia Hạn
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStoreStatus(s)}
                              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                s.status === "SUSPENDED"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              {s.status === "SUSPENDED" ? "Mở khóa" : "Khóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

  );
};
