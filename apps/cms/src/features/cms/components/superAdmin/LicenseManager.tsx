
import { LicenseDesktopTable } from "./LicenseDesktopTable";
import { LicenseMobileCards } from "./LicenseMobileCards";
import React from "react";
import { Panel, Icon, Pagination, Button } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseManagerProps {
  licenses: LicenseKeyRecord[];
  licenseSearch: string;
  setLicenseSearch: (val: string) => void;
  licenseStatusFilter: string;
  setLicenseStatusFilter: (val: string) => void;
  licensePage: number;
  setLicensePage: (page: number) => void;
  filteredLicenses: LicenseKeyRecord[];
  paginatedLicenses: LicenseKeyRecord[];
  LICENSE_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setIsCreateLicenseModalOpen: (val: boolean) => void;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseManager: React.FC<LicenseManagerProps> = ({
  licenses,
  licenseSearch,
  setLicenseSearch,
  licenseStatusFilter,
  setLicenseStatusFilter,
  licensePage,
  setLicensePage,
  filteredLicenses,
  paginatedLicenses,
  LICENSE_PAGE_SIZE,
  downloadCsv,
  setIsCreateLicenseModalOpen,
  handleCopyKey,
  handleRevokeKey,
}) => {
  return (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink-primary flex items-center gap-2">
                  <Icon name="key" className="w-4 h-4 text-brand-800 shrink-0" />
                  <span className="sm:hidden">Quản Lý License Key</span>
                  <span className="hidden sm:inline">Quản Lý & Phát Hành License Key Bản Quyền</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Phát hành key bản quyền độc lập hoặc gán theo quán, kiểm soát hạn sử dụng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => downloadCsv("a2order-license.csv", ["Mã license", "Cửa hàng", "Gói", "Thiết bị tối đa", "Thời hạn (tháng)", "Ngày cấp", "Ngày hết hạn", "Trạng thái"], filteredLicenses.map((license) => [license.keyCode, license.storeName || "", license.plan, license.maxDevices, license.durationMonths, license.issuedAt, license.expiresAt, license.status]))} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"><Icon name="download" size={14} />Xuất CSV</button>
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white font-bold shrink-0 whitespace-nowrap shadow-sm"
                  onClick={() => setIsCreateLicenseModalOpen(true)}
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Sinh Key</span>
                  <span className="hidden sm:inline">Sinh License Key</span>
                </Button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="space-y-3 mb-4 p-3 bg-surface-canvas rounded-2xl border border-surface-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="text"
                    value={licenseSearch}
                    onChange={(e) => {
                      setLicenseSearch(e.target.value);
                      setLicensePage(1);
                    }}
                    placeholder="Tìm theo mã key, tên quán..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "ALL", label: "Tất Cả", count: licenses.length },
                    { id: "ACTIVE", label: "Đang Dùng", count: licenses.filter((l) => l.status === "ACTIVE").length },
                    { id: "UNASSIGNED", label: "Chưa Gán", count: licenses.filter((l) => l.status === "UNASSIGNED").length },
                    { id: "EXPIRING_SOON", label: "Sắp Hạn", count: licenses.filter((l) => l.status === "EXPIRING_SOON").length },
                    { id: "EXPIRED", label: "Hết Hạn", count: licenses.filter((l) => l.status === "EXPIRED").length },
                    { id: "REVOKED", label: "Thu Hồi", count: licenses.filter((l) => l.status === "REVOKED").length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setLicenseStatusFilter(st.id);
                        setLicensePage(1);
                      }}
                      className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                        licenseStatusFilter === st.id
                          ? "bg-brand-900 text-white shadow-sm"
                          : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${licenseStatusFilter === st.id ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"}`}>
                        {st.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Table View (>= lg) */}
            <LicenseDesktopTable
              paginatedLicenses={paginatedLicenses}
              handleCopyKey={handleCopyKey}
              handleRevokeKey={handleRevokeKey}
            />

            {/* Mobile / Tablet Cards View (< lg) - Không scroll ngang */}
            <LicenseMobileCards
              paginatedLicenses={paginatedLicenses}
              handleCopyKey={handleCopyKey}
              handleRevokeKey={handleRevokeKey}
            />

            <Pagination
              currentPage={licensePage}
              totalItems={filteredLicenses.length}
              pageSize={LICENSE_PAGE_SIZE}
              onPageChange={setLicensePage}
            />
          </Panel>
        </div>
  );
};
