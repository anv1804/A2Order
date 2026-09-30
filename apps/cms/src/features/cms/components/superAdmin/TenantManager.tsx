
import { TenantDesktopTable } from "./TenantDesktopTable";
import { TenantMobileCards } from "./TenantMobileCards";
import React from "react";
import { Panel, Icon, Pagination } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";

export interface TenantManagerProps {
  stores: TenantStoreRecord[];
  storeSearch: string;
  setStoreSearch: (val: string) => void;
  storeStatusFilter: string;
  setStoreStatusFilter: (val: string) => void;
  tenantPage: number;
  setTenantPage: (page: number) => void;
  filteredStores: TenantStoreRecord[];
  paginatedStores: TenantStoreRecord[];
  TENANT_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  onImpersonateStore?: (store: TenantStoreRecord) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({
  stores,
  storeSearch,
  setStoreSearch,
  storeStatusFilter,
  setStoreStatusFilter,
  tenantPage,
  setTenantPage,
  filteredStores,
  paginatedStores,
  TENANT_PAGE_SIZE,
  downloadCsv,
  onImpersonateStore,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
}) => {
  return (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
      {/* KHỐI THỐNG KÊ (MINI DASHBOARD) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 animate-fadeIn">
        {[
          { label: "Quán Đang Hoạt Động", val: stores.filter(s => s.status === "ACTIVE").length, icon: "building", tone: "blue" },
          { label: "Đang Bị Tạm Khóa", val: stores.filter(s => s.status === "SUSPENDED").length, icon: "shield", tone: "rose" },
          { label: "Thiết Bị Mạng (POS/KDS)", val: stores.reduce((sum, s) => sum + s.activeDevices, 0), icon: "monitor", tone: "indigo" },
        ].map((m, i) => (
          <article key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{m.label}</h4>
              <p className={`text-2xl font-black tracking-tight ${m.tone === "rose" && m.val > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {m.val}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${m.tone}-50 text-${m.tone}-600`}>
              <Icon name={m.icon as any} size={20} />
            </div>
          </article>
        ))}
      </section>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink-primary flex items-center gap-2">
                  <Icon name="building" className="w-4 h-4 text-brand-800 shrink-0" />
                  <span>Danh Sách Quán Thuê & Hợp Đồng Dịch Vụ</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Quản lý gói tính năng theo quy mô, phân quyền module và giám sát thiết bị POS online
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-ink-muted shrink-0">{filteredStores.length} / {stores.length} quán</span>
                <button type="button" onClick={() => downloadCsv("a2order-doi-tac.csv", ["Tên quán", "Chủ quán", "Số điện thoại", "Địa chỉ", "Gói", "Trạng thái", "Ngày hết hạn", "License"], filteredStores.map((store) => [store.name, store.owner, store.phone, store.address, store.plan, store.status, store.expiresAt, store.licenseKey]))} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"><Icon name="download" size={14} />Xuất CSV</button>
              </div>
            </div>

            {/* Thanh tìm kiếm & Lọc trạng thái quán */}
            <div className="space-y-3 mb-4 p-3 bg-surface-canvas rounded-2xl border border-surface-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => {
                      setStoreSearch(e.target.value);
                      setTenantPage(1);
                    }}
                    placeholder="Tìm tên quán, chủ quán, SĐT, key..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "ALL", label: "Tất Cả", count: stores.length },
                    { id: "ACTIVE", label: "Hoạt Động", count: stores.filter((s) => s.status === "ACTIVE").length },
                    { id: "EXPIRING_SOON", label: "Sắp Hạn", count: stores.filter((s) => s.status === "EXPIRING_SOON").length },
                    { id: "EXPIRED", label: "Hết Hạn", count: stores.filter((s) => s.status === "EXPIRED").length },
                    { id: "SUSPENDED", label: "Tạm Khóa", count: stores.filter((s) => s.status === "SUSPENDED").length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStoreStatusFilter(st.id);
                        setTenantPage(1);
                      }}
                      className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                        storeStatusFilter === st.id
                          ? "bg-brand-900 text-white shadow-sm"
                          : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${storeStatusFilter === st.id ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"}`}>
                        {st.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Table View (>= lg) */}
            <TenantDesktopTable
              paginatedStores={paginatedStores}
              onImpersonateStore={onImpersonateStore}
              setViewingStoreDetails={setViewingStoreDetails}
              setLicenseTargetStore={setLicenseTargetStore}
              handleToggleStoreStatus={handleToggleStoreStatus}
            />

            {/* Mobile / Tablet Cards View (< lg) - Không scroll ngang */}
            <TenantMobileCards
              paginatedStores={paginatedStores}
              onImpersonateStore={onImpersonateStore}
              setViewingStoreDetails={setViewingStoreDetails}
              setLicenseTargetStore={setLicenseTargetStore}
              handleToggleStoreStatus={handleToggleStoreStatus}
            />

            {/* Phân trang quán thuê */}
            <Pagination
              currentPage={tenantPage}
              totalItems={filteredStores.length}
              pageSize={TENANT_PAGE_SIZE}
              onPageChange={setTenantPage}
            />
          </Panel>
        </div>
  );
};
