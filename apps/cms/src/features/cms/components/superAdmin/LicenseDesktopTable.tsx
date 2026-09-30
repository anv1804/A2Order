import React from "react";
import { Icon } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseDesktopTableProps {
  paginatedLicenses: LicenseKeyRecord[];
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseDesktopTable: React.FC<LicenseDesktopTableProps> = ({
  paginatedLicenses,
  handleCopyKey,
  handleRevokeKey,
}) => {
  return (
                <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="pb-3 px-3">Mã License Key</th>
                    <th className="pb-3 px-3">Gói Thuê & Máy Tối Đa</th>
                    <th className="pb-3 px-3">Quán Sở Hữu</th>
                    <th className="pb-3 px-3">Thời Hạn & Hết Hạn</th>
                    <th className="pb-3 px-3">Trạng Thái</th>
                    <th className="pb-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-medium">
                  {paginatedLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-ink-muted font-bold">
                        Không tìm thấy mã License Key nào phù hợp bộ lọc
                      </td>
                    </tr>
                  ) : (
                    paginatedLicenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-brand-50/20 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-brand-950 px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border shadow-xs">
                              {lic.keyCode}
                            </span>
                            <button
                              onClick={() => handleCopyKey(lic.keyCode)}
                              className="text-ink-subtle hover:text-brand-900 transition-colors p-1"
                              title="Sao chép mã"
                            >
                              <Icon name="clipboard" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            lic.plan === "PRO" ? "bg-purple-100 text-purple-900 border border-purple-200" :
                            lic.plan === "GROWTH" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                            "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}>
                            Gói {lic.plan}
                          </span>
                          <div className="text-[10px] text-ink-muted mt-0.5">Tối đa: {lic.maxDevices} máy POS/KDS</div>
                        </td>

                        <td className="py-3.5 px-3">
                          {lic.storeName ? (
                            <div>
                              <div className="font-bold text-ink-primary">{lic.storeName}</div>
                              <span className="text-[10px] text-emerald-700 font-semibold">Đã liên kết quán</span>
                            </div>
                          ) : (
                            <span className="text-ink-muted italic font-medium">Chưa gán (Sẵn sàng kích hoạt)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-ink-primary">{lic.durationMonths} tháng</div>
                          <span className="text-[10px] text-ink-muted">Hết hạn: {lic.expiresAt}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          {lic.status === "ACTIVE" && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Icon name="checkCircle" className="w-3.5 h-3.5" />
                              Hoạt động
                            </span>
                          )}
                          {lic.status === "UNASSIGNED" && (
                            <span className="text-blue-700 font-bold flex items-center gap-1">
                              <Icon name="info" className="w-3.5 h-3.5" />
                              Chờ kích hoạt
                            </span>
                          )}
                          {lic.status === "EXPIRING_SOON" && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Icon name="clock" className="w-3.5 h-3.5" />
                              Sắp hết hạn
                            </span>
                          )}
                          {lic.status === "EXPIRED" && (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <Icon name="alert" className="w-3.5 h-3.5" />
                              Hết hạn
                            </span>
                          )}
                          {lic.status === "REVOKED" && (
                            <span className="text-ink-subtle font-bold flex items-center gap-1 line-through">
                              <Icon name="ban" className="w-3.5 h-3.5" />
                              Đã thu hồi
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopyKey(lic.keyCode)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors"
                            >
                              Copy Key
                            </button>
                            {lic.status !== "REVOKED" && (
                              <button
                                onClick={() => handleRevokeKey(lic)}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              >
                                Thu Hồi
                              </button>
                            )}
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
