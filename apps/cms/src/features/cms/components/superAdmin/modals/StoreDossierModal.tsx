import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import {
  TenantStoreRecord,
  SoftwareInvoiceRecord,
  BUSINESS_TYPE_CONFIG,
  AppModule,
} from "@/types/cms.types";
import { APP_MODULE_CATALOG } from "@a2order/shared";

export interface StoreDossierModalProps {
  store: TenantStoreRecord | null;
  invoices: SoftwareInvoiceRecord[];
  onClose: () => void;
  onCopyKey: (key: string) => void;
  onOpenRenewModal: (store: TenantStoreRecord) => void;
  onToggleModule: (storeId: string, moduleId: AppModule) => void;
  onRevokeTerminal: (storeId: string, terminalId: string, terminalName: string) => void;
  onToggleStoreStatus: (store: TenantStoreRecord) => void;
  onImpersonateStore?: (store: TenantStoreRecord) => void;
  onViewInvoice: (invoice: SoftwareInvoiceRecord) => void;
}

export const StoreDossierModal: React.FC<StoreDossierModalProps> = ({
  store,
  invoices,
  onClose,
  onCopyKey,
  onOpenRenewModal,
  onToggleModule,
  onRevokeTerminal,
  onToggleStoreStatus,
  onImpersonateStore,
  onViewInvoice,
}) => {
  if (!store) return null;

  const storeInvoices = invoices.filter((i) => i.storeId === store.id);

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-3xl rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-canvas shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-2xl shadow-xs">
                {store.businessType && BUSINESS_TYPE_CONFIG[store.businessType]?.emoji
                  ? BUSINESS_TYPE_CONFIG[store.businessType].emoji
                  : "🏪"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-ink-primary tracking-tight">
                    {store.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      store.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : store.status === "EXPIRING_SOON"
                        ? `bg-amber-100 text-amber-800 border border-amber-200`
                        : store.status === "EXPIRED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {store.status === "ACTIVE"
                      ? "Đang hoạt động"
                      : store.status === "EXPIRING_SOON"
                      ? `Sắp hết hạn (${store.daysLeft} ngày)`
                      : store.status === "EXPIRED"
                      ? "Hết hạn"
                      : "Tạm khóa"}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Mã quán: <span className="font-mono font-bold text-ink-primary">{store.id}</span> • Loại hình:{" "}
                  <span className="font-bold text-brand-900">
                    {store.businessType && BUSINESS_TYPE_CONFIG[store.businessType]?.label
                      ? BUSINESS_TYPE_CONFIG[store.businessType].label
                      : "Nhà hàng & F&B"}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Dossier Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Card 1: Bản quyền & Gói thuê */}
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-200/60 pb-2.5">
                <div>
                  <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider block">
                    Bản Quyền Phần Mềm
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm font-black text-brand-950 bg-white px-2.5 py-1 rounded-lg border border-brand-200 shadow-xs">
                      {store.licenseKey}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopyKey(store.licenseKey)}
                      className="p-1 text-brand-800 hover:text-brand-950 hover:bg-white rounded transition-colors"
                      title="Sao chép License Key"
                    >
                      <Icon name="clipboard" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    store.plan === "PRO" ? "bg-purple-100 text-purple-900 border border-purple-200" :
                    store.plan === "GROWTH" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                    "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  }`}>
                    Gói {store.plan}
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenRenewModal(store)}
                    className="px-3 py-1 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-950 transition-colors shadow-xs"
                  >
                    Gia Hạn Ngay
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-ink-muted text-[10px] block">Kích hoạt:</span>
                  <span className="font-bold text-ink-primary">{store.activatedAt}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Hết hạn:</span>
                  <span className="font-bold text-ink-primary">{store.expiresAt}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Thời gian còn lại:</span>
                  <span className={`font-bold ${store.daysLeft <= 3 ? "text-rose-600 font-black" : "text-emerald-700"}`}>
                    {store.daysLeft} ngày
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Quy mô bàn:</span>
                  <span className="font-bold text-ink-primary">{store.tableCount} bàn</span>
                </div>
              </div>
            </div>

            {/* Card 2: Thông tin liên hệ & Hạ tầng POS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block">
                  Đại Diện Quán
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <Icon name="userCheck" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="text-ink-muted">Chủ quán:</span>
                    <span className="font-bold text-ink-primary">{store.owner}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="phone" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="text-ink-muted">Điện thoại:</span>
                    <a href={`tel:${store.phone}`} className="font-bold text-brand-900 hover:underline">
                      {store.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="building" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="text-ink-muted">Địa chỉ:</span>
                    <span className="text-ink-primary truncate">{store.address}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block">
                  Hạ Tầng Kết Nối & Thiết Bị POS
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <Icon name="monitor" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="text-ink-muted">Thiết bị POS / KDS:</span>
                    <span className="font-bold text-ink-primary">
                      {store.activeDevices} / {store.plan === "PRO" ? 10 : store.plan === "GROWTH" ? 4 : 2} máy cho phép
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="text-ink-muted">Đồng bộ gần nhất:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {store.lastSync || "1 phút trước"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="server" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span className="text-ink-muted">Phiên bản POS:</span>
                    <span className="font-mono text-ink-primary font-bold">{store.configVer}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Cấu hình Module Tính Năng (Feature Flags - Dynamic Toggle) */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                    Cấp Quyền Module Tính Năng (Feature Flags)
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Admin có thể bật/tắt tức thì các module cho quán. Quyền sẽ đồng bộ tự động tới máy POS/KDS.
                  </p>
                </div>
                <span className="text-[10px] text-brand-900 font-bold bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full shrink-0">
                  Đang bật {store.modules.length}/6 modules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {APP_MODULE_CATALOG.map((mod) => {
                  const isEnabled = store.modules.includes(mod.id);
                  const isCore = mod.id === AppModule.CORE_POS;

                  return (
                    <div
                      key={mod.id}
                      className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-white border-brand-200 shadow-xs"
                          : "bg-surface-muted/40 border-surface-border opacity-75"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-ink-primary truncate">
                            {mod.name}
                          </span>
                          {isCore && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Bắt buộc
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink-muted line-clamp-2 leading-relaxed">
                          {mod.description}
                        </p>
                        <div className="text-[10px] font-bold text-brand-900">
                          {mod.monthlyPrice.toLocaleString("vi-VN")} đ/tháng
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {isCore ? (
                          <span className="px-2 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Icon name="checkCircle" className="w-3 h-3 text-emerald-600" />
                            Khóa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleModule(store.id, mod.id)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 ${
                              isEnabled
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-surface-muted text-ink-subtle border border-surface-border hover:bg-white hover:text-ink-primary"
                            }`}
                          >
                            <Icon
                              name={isEnabled ? "check" : "power"}
                              className="w-3 h-3"
                            />
                            <span>{isEnabled ? "Đang Bật" : "Tắt"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 4: Quản lý Thiết Bị POS & KDS Đang Đăng Nhập */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                    Thiết Bị Đang Đăng Nhập (Hardware Access Control)
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Kiểm soát thiết bị theo License Key. Thu hồi máy để chống chia sẻ lậu bản quyền sang quán khác.
                  </p>
                </div>
                <span className="text-[10px] text-ink-secondary font-bold bg-white border border-surface-border px-2.5 py-0.5 rounded-full shrink-0">
                  {(store.terminals || []).length} máy kết nối
                </span>
              </div>

              {(!store.terminals || store.terminals.length === 0) ? (
                <div className="p-4 rounded-xl bg-white border border-surface-border text-center text-xs text-ink-muted italic">
                  Chưa ghi nhận thiết bị nào đăng nhập bằng License Key này.
                </div>
              ) : (
                <div className="space-y-2">
                  {store.terminals.map((term) => (
                    <div
                      key={term.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-white border border-surface-border text-xs gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          term.role === "POS_CASHIER"
                            ? "bg-brand-50 text-brand-900 border border-brand-200"
                            : term.role === "KITCHEN_KDS"
                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                            : term.role === "BAR_KDS"
                            ? "bg-purple-50 text-purple-900 border border-purple-200"
                            : "bg-blue-50 text-blue-900 border border-blue-200"
                        }`}>
                          <Icon
                            name={
                              term.role === "POS_CASHIER"
                                ? "cashier"
                                : term.role === "KITCHEN_KDS"
                                ? "kitchen"
                                : term.role === "BAR_KDS"
                                ? "store"
                                : "smartphone"
                            }
                            className="w-4 h-4"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-ink-primary truncate">
                              {term.name}
                            </span>
                            <span className="text-[10px] font-bold text-ink-secondary px-1.5 py-0.2 rounded bg-surface-muted">
                              {term.role === "POS_CASHIER"
                                ? "Thu Ngân"
                                : term.role === "KITCHEN_KDS"
                                ? "Bếp KDS"
                                : term.role === "BAR_KDS"
                                ? "Pha Chế"
                                : "Tablet Phục Vụ"}
                            </span>
                          </div>
                          <div className="text-[10px] text-ink-muted mt-0.5">
                            IP: <span className="font-mono text-ink-primary">{term.ipAddress}</span> • App: {term.appVersion} • Đồng bộ: {term.lastSync}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          term.status === "ONLINE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${term.status === "ONLINE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          {term.status === "ONLINE" ? "Online" : "Offline"}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRevokeTerminal(store.id, term.id, term.name)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors shadow-xs"
                          title="Ngắt kết nối và thu hồi thiết bị này"
                        >
                          Thu Hồi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 5: Lịch sử hóa đơn thuê phần mềm của quán */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                Hóa Đơn Cước Thuê Của Quán
              </span>
              {storeInvoices.length === 0 ? (
                <p className="text-xs text-ink-muted italic">Chưa có hóa đơn cước phần mềm nào cho quán này.</p>
              ) : (
                <div className="space-y-2">
                  {storeInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink-primary">{inv.invoiceCode}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inv.status === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
                          </span>
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {inv.plan} • {inv.durationMonths} tháng • {inv.createdAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-brand-900">{inv.finalAmount.toLocaleString("vi-VN")} đ</span>
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white border border-surface-border text-ink-primary hover:border-brand-300 hover:text-brand-900 shadow-xs transition-colors"
                        >
                          Xem VietQR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-surface-canvas shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`rounded-xl text-xs font-bold ${
                store.status === "SUSPENDED"
                  ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  : "text-rose-700 border-rose-300 hover:bg-rose-50"
              }`}
              onClick={() => onToggleStoreStatus(store)}
            >
              {store.status === "SUSPENDED" ? "Mở Khóa Quán" : "Tạm Khóa Quán Này"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold"
                onClick={onClose}
              >
                Đóng Hồ Sơ
              </Button>

              {onImpersonateStore && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-ink-primary text-white text-xs px-4 shadow-sm font-bold gap-1.5 hover:bg-black"
                  onClick={() => onImpersonateStore(store)}
                >
                  <Icon name="externalLink" className="w-3.5 h-3.5" />
                  <span>Vào Quản Trị Quán</span>
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                onClick={() => onOpenRenewModal(store)}
              >
                Gia Hạn Hợp Đồng Key
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
