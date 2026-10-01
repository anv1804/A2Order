import React, { useState, useEffect, useMemo } from "react";
import { SaasDashboard } from "./superAdmin/SaasDashboard";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import {
  CmsSuperAdminViewProps,
  TenantStoreRecord,
  ConnectedTerminalRecord,
  SoftwareInvoiceRecord,
  SystemAuditLogRecord,
  AppModule,
  BusinessType,
  BUSINESS_TYPE_CONFIG,
} from "@/types/cms.types";
import { APP_MODULE_CATALOG, StoreScale } from "@a2order/shared";
import { BUSINESS_SCENARIOS } from "@/data/businessScenarios";
import { storeApi } from "@/services/api/storeApi";
import {
  LicenseKeyRecord,
  INITIAL_LICENSES,
  INITIAL_STORES,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
} from "./superAdmin/superAdminMockData";
import { LicenseModal } from "./superAdmin/modals/LicenseModal";
import { InvoiceModal } from "./superAdmin/modals/InvoiceModal";
import { StoreOnboardingModal } from "./superAdmin/modals/StoreOnboardingModal";
import { CreateLicenseKeyModal } from "./superAdmin/modals/CreateLicenseKeyModal";
import { StoreDossierModal } from "./superAdmin/modals/StoreDossierModal";
import { SuspendStoreModal } from "./superAdmin/modals/SuspendStoreModal";
import { ScenarioTemplateSkeleton } from "@/components/ui";

import { TenantManager } from "./superAdmin/TenantManager";
import { LicenseManager } from "./superAdmin/LicenseManager";
import { InvoiceManager } from "./superAdmin/InvoiceManager";
import { AuditLogViewer } from "./superAdmin/AuditLogViewer";
import { StoreUserManager } from "./superAdmin/StoreUserManager";
import { CmsAdminPricingManager } from "./CmsAdminPricingManager";

const ScenarioTemplateManager = React.lazy(() =>
  import("./superAdmin/ScenarioTemplateManager").then((m) => ({ default: m.ScenarioTemplateManager }))
);

const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
  const escapeCell = (value: unknown) => {
    let text = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blobUrl = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

export const CmsSuperAdminView: React.FC<CmsSuperAdminViewProps> = ({
  subView: initialSubView = "telemetry",
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<"tenants" | "licenses" | "invoices" | "telemetry" | "audit" | "scenarios" | "store_users" | "pricing">(
    initialSubView === "license_manager"
      ? "licenses"
      : initialSubView === "tenants"
      ? "tenants"
      : initialSubView === "store_users"
      ? "store_users"
      : initialSubView === "software_invoices"
      ? "invoices"
      : initialSubView === "pricing_config"
      ? "pricing"
      : initialSubView === "audit_logs"
      ? "audit"
      : initialSubView === "scenarios"
      ? "scenarios"
      : "telemetry"
  );

  // Đồng bộ view ngay lập tức khi người dùng click thanh bên Sidebar
  useEffect(() => {
    if (initialSubView === "license_manager") setActiveTab("licenses");
    else if (initialSubView === "tenants") setActiveTab("tenants");
    else if (initialSubView === "store_users") setActiveTab("store_users");
    else if (initialSubView === "software_invoices") setActiveTab("invoices");
    else if (initialSubView === "pricing_config") setActiveTab("pricing");
    else if (initialSubView === "audit_logs") setActiveTab("audit");
    else if (initialSubView === "scenarios") setActiveTab("scenarios");
    else setActiveTab("telemetry");
  }, [initialSubView]);

  const handleSwitchTab = (tab: "tenants" | "licenses" | "invoices" | "telemetry" | "audit" | "scenarios" | "store_users" | "pricing") => {
    if (onTabChange) onTabChange(tab);
    else setActiveTab(tab);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bộ lọc & Phân trang Quán thuê
  const [storeSearch, setStoreSearch] = useState("");
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>("ALL");
  const [storePlanFilter, setStorePlanFilter] = useState<string>("ALL");
  const [storeProvinceFilter, setStoreProvinceFilter] = useState<string>("ALL");
  const [tenantPage, setTenantPage] = useState(1);
  const TENANT_PAGE_SIZE = 10;
  const [isTenantMaximized, setIsTenantMaximized] = useState(false);
  const [isStoreUserMaximized, setIsStoreUserMaximized] = useState(false);
  const [isLicenseMaximized, setIsLicenseMaximized] = useState(false);
  const [isInvoiceMaximized, setIsInvoiceMaximized] = useState(false);
  const [isPricingMaximized, setIsPricingMaximized] = useState(false);
  const [isScenarioMaximized, setIsScenarioMaximized] = useState(false);
  const [isAuditMaximized, setIsAuditMaximized] = useState(false);

  // Modal xem chi tiết toàn diện hồ sơ quán thuê
  const [viewingStoreDetails, setViewingStoreDetails] = useState<TenantStoreRecord | null>(null);

  // Quản lý & Cấp License Key (License Manager)
  const [licenses, setLicenses] = useState<LicenseKeyRecord[]>(INITIAL_LICENSES);
  const [stores, setStores] = useState<TenantStoreRecord[]>(INITIAL_STORES);
  const [invoices, setInvoices] = useState<SoftwareInvoiceRecord[]>(INITIAL_INVOICES);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [connectedSources, setConnectedSources] = useState<string[]>([]);

  // Thử đồng bộ dữ liệu từ Server API khi mount
  useEffect(() => {
    storeApi
      .getStores()
      .then((serverStores) => {
        if (serverStores && serverStores.length > 0) {
          setStores(serverStores);
          setConnectedSources((sources) => [...new Set([...sources, "stores"])]);
        }
      })
      .catch(() => {});

    storeApi
      .getLicenses()
      .then((serverLicenses) => {
        if (serverLicenses && serverLicenses.length > 0) {
          setConnectedSources((sources) => [...new Set([...sources, "licenses"])]);
          setLicenses(
            serverLicenses.map((l) => ({
              id: l.id,
              keyCode: l.keyCode,
              storeName: l.storeName,
              storeId: l.storeId,
              plan: l.plan || "PRO",
              maxDevices: l.maxDevices || 4,
              durationMonths: l.durationMonths || 12,
              issuedAt: l.issuedAt,
              expiresAt: l.expiresAt,
              status: l.status,
              modules: [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER],
            }))
          );
        }
      })
      .catch(() => {});

    storeApi
      .getInvoices()
      .then((serverInvoices) => {
        if (serverInvoices && serverInvoices.length > 0) {
          setInvoices(serverInvoices);
          setConnectedSources((sources) => [...new Set([...sources, "invoices"])]);
        }
      })
      .catch(() => {});
  }, []);

  const [licenseSearch, setLicenseSearch] = useState("");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState("ALL");
  const [licensePage, setLicensePage] = useState(1);
  const LICENSE_PAGE_SIZE = 10;

  // Modal tạo license key mới
  const [isCreateLicenseModalOpen, setIsCreateLicenseModalOpen] = useState(false);

  // Bộ lọc & Phân trang Hóa đơn
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("ALL");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoicePage, setInvoicePage] = useState(1);
  const INVOICE_PAGE_SIZE = 10;
  const [confirmingInvoiceId, setConfirmingInvoiceId] = useState<string | null>(null);

  // Modal Cấp Mới / Gia Hạn License Key
  const [licenseTargetStore, setLicenseTargetStore] = useState<TenantStoreRecord | null>(null);

  // Modal Xác Nhận Khóa / Mở Khóa Quán (Bảo Mật Bằng Mã Hợp Đồng)
  const [suspendTarget, setSuspendTarget] = useState<{
    store: TenantStoreRecord;
    mode: "SUSPEND" | "ACTIVATE";
  } | null>(null);

  // Modal Đăng Ký Quán Mới (Onboarding)
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SoftwareInvoiceRecord | null>(null);

  // Bộ lọc & Phân trang License Keys
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      if (licenseStatusFilter !== "ALL" && lic.status !== licenseStatusFilter) return false;
      if (licenseSearch.trim()) {
        const q = licenseSearch.toLowerCase();
        const matchCode = lic.keyCode.toLowerCase().includes(q);
        const matchStore = lic.storeName?.toLowerCase().includes(q);
        if (!matchCode && !matchStore) return false;
      }
      return true;
    });
  }, [licenses, licenseSearch, licenseStatusFilter]);

  const paginatedLicenses = useMemo(() => {
    const start = (licensePage - 1) * LICENSE_PAGE_SIZE;
    return filteredLicenses.slice(start, start + LICENSE_PAGE_SIZE);
  }, [filteredLicenses, licensePage]);

  const handleGenerateLicenseKeySubmit = async (data: {
    storeId?: string;
    storeName?: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    maxDevices: number;
  }) => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const keyCode = `A2-${data.plan}-${randomHex}`;
    const targetStore = stores.find((s) => s.id === data.storeId);

    const now = new Date();
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + data.durationMonths);

    const newKey: LicenseKeyRecord = {
      id: `lic-${Date.now()}`,
      keyCode,
      storeName: data.storeName,
      storeId: data.storeId,
      plan: data.plan,
      maxDevices: data.maxDevices,
      durationMonths: data.durationMonths,
      issuedAt: now.toLocaleDateString("vi-VN"),
      expiresAt: expDate.toLocaleDateString("vi-VN"),
      status: targetStore ? "ACTIVE" : "UNASSIGNED",
      modules:
        data.plan === "PRO"
          ? [
              AppModule.CORE_POS,
              AppModule.MODULE_KDS,
              AppModule.MODULE_QR_ORDER,
              AppModule.MODULE_ADVANCED_ANALYTICS,
              AppModule.MODULE_LANDING_PAGE,
            ]
          : data.plan === "GROWTH"
          ? [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER]
          : [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER],
    };

    let savedKey = newKey;
    if (connectedSources.includes("licenses")) {
      if (data.storeId) {
        toast.error("Quán này đã có license. Tạo key dự phòng chưa gán, sau đó gán khi có luồng chuyển license.");
        return;
      }
      try {
        const created = await storeApi.createLicense({
          keyCode,
          plan: data.plan,
          maxDevices: data.maxDevices,
          durationMonths: data.durationMonths,
          issuedAt: now.toLocaleDateString("vi-VN"),
          expiresAt: expDate.toLocaleDateString("vi-VN"),
          status: "UNASSIGNED",
        });
        savedKey = {
          ...newKey,
          id: created.id || newKey.id,
          keyCode: created.keyCode || keyCode,
          storeName: created.storeName,
          storeId: created.storeId,
          status: created.status || "UNASSIGNED",
          issuedAt: created.issuedAt || newKey.issuedAt,
          expiresAt: created.expiresAt || newKey.expiresAt,
        };
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cấp license trên máy chủ.");
        return;
      }
    }

    setLicenses((prev) => [savedKey, ...prev]);

    if (targetStore) {
      setStores((prev) =>
        prev.map((s) =>
          s.id === targetStore.id
            ? {
                ...s,
                licenseKey: keyCode,
                plan: data.plan,
                status: "ACTIVE",
                daysLeft: data.durationMonths * 30,
                expiresAt: expDate.toLocaleDateString("vi-VN"),
              }
            : s
        )
      );
    }

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: "Vừa xong",
        actor: "Quản trị viên",
        actorRole: "SUPER_ADMIN",
        ipAddress: "Chưa ghi nhận",
        action: "GENERATE_LICENSE_KEY",
        storeName: data.storeName || "Standalone Key",
        details: `Cấp License Key ${keyCode} (${data.plan}, ${data.durationMonths} tháng, max ${data.maxDevices} máy)`,
        status: "SUCCESS",
      },
      ...prev,
    ]);

    setIsCreateLicenseModalOpen(false);
    toast[connectedSources.includes("licenses") ? "success" : "info"](
      connectedSources.includes("licenses")
        ? `Đã lưu License Key ${keyCode} trên máy chủ.`
        : `Đã tạo ${keyCode} trong dữ liệu xem trước; chưa lưu lên máy chủ.`
    );
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard?.writeText(key);
    toast.success(`Đã sao chép License Key: ${key}`);
  };

  const handleRevokeKey = async (lic: LicenseKeyRecord) => {
    const ok = await confirmDialog({
      title: `Thu Hồi License Key ${lic.keyCode}?`,
      message: `Khi thu hồi, các máy POS/KDS thuộc key này sẽ bị ngắt kết nối bản quyền ngay lập tức.`,
      confirmText: "Thu Hồi Key",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    if (connectedSources.includes("licenses")) {
      try {
        await storeApi.revokeLicense(lic.keyCode);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể thu hồi license trên máy chủ.");
        return;
      }
    }

    setLicenses((prev) =>
      prev.map((l) => (l.id === lic.id ? { ...l, status: "REVOKED" } : l))
    );
    toast[connectedSources.includes("licenses") ? "success" : "info"](
      connectedSources.includes("licenses")
        ? `Đã thu hồi License Key ${lic.keyCode}.`
        : `Đã mô phỏng thu hồi ${lic.keyCode} trong dữ liệu xem trước.`
    );
  };

  // Refresh Telemetry
  const handleRefreshTelemetry = async () => {
    setIsRefreshing(true);
    const results = await Promise.allSettled([
      storeApi.getStores(),
      storeApi.getLicenses(),
      storeApi.getInvoices(),
    ]);
    let refreshed = 0;
    const [storeResult, licenseResult, invoiceResult] = results;
    const sources: string[] = [];
    if (storeResult.status === "fulfilled") {
      setStores(storeResult.value || []);
      sources.push("stores");
      refreshed += 1;
    }
    if (licenseResult.status === "fulfilled") {
      setLicenses((licenseResult.value || []).map((license) => ({
        id: license.id,
        keyCode: license.keyCode,
        storeName: license.storeName,
        storeId: license.storeId,
        plan: license.plan || "PRO",
        maxDevices: license.maxDevices || 4,
        durationMonths: license.durationMonths || 12,
        issuedAt: license.issuedAt,
        expiresAt: license.expiresAt,
        status: license.status,
        modules: license.modules || [AppModule.CORE_POS],
      })));
      sources.push("licenses");
      refreshed += 1;
    }
    if (invoiceResult.status === "fulfilled") {
      setInvoices(invoiceResult.value || []);
      sources.push("invoices");
      refreshed += 1;
    }
    setConnectedSources(sources);
    setIsRefreshing(false);
    if (refreshed === results.length) toast.success("Dữ liệu đối tác, license và hóa đơn đã được cập nhật.");
    else if (refreshed > 0) toast.warning(`Đã cập nhật ${refreshed}/3 nguồn dữ liệu. Một số dịch vụ chưa phản hồi.`);
    else toast.error("Không thể kết nối máy chủ để làm mới dữ liệu.");
  };

  // Xác nhận thanh toán hóa đơn cước
  const handleConfirmInvoice = async (inv: SoftwareInvoiceRecord) => {
    if (!connectedSources.includes("invoices")) {
      toast.error("Máy chủ chưa kết nối. Không thể xác nhận thanh toán trên dữ liệu xem trước.");
      return;
    }
    const ok = await confirmDialog({
      title: "Xác Nhận Đã Nhận Tiền Thuê?",
      message: `Xác nhận đã nhận đủ ${inv.finalAmount.toLocaleString("vi-VN")} đ cước thuê phần mềm của ${inv.storeName}? Hệ thống sẽ tự động kích hoạt License Key cho quán.`,
      confirmText: "Xác Nhận & Gia Hạn Key",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    setConfirmingInvoiceId(inv.id);
    let confirmedPayment: { success: boolean; newEndDate: string; message: string };
    try {
      confirmedPayment = await storeApi.confirmInvoicePayment(inv.id);
      if (!confirmedPayment.success) throw new Error(confirmedPayment.message || "Không thể xác nhận hóa đơn.");
    } catch (error) {
      setConfirmingInvoiceId(null);
      toast.error(error instanceof Error ? error.message : "Không thể xác nhận thanh toán. Vui lòng thử lại.");
      return;
    }
    const renewedEndDate = new Date(confirmedPayment.newEndDate);

    setInvoices((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: "PAID", paidAt: "Vừa xong" } : i))
    );

    // Tự động cộng ngày cho quán
    setStores((prev) =>
      prev.map((s) =>
        s.id === inv.storeId
          ? {
              ...s,
              status: "ACTIVE",
              daysLeft: Math.max(0, Math.ceil((renewedEndDate.getTime() - Date.now()) / 86400000)),
              expiresAt: renewedEndDate.toLocaleDateString("vi-VN"),
            }
          : s
      )
    );

    toast.success(`Đã xác nhận thanh toán hóa đơn ${inv.invoiceCode}! License Key đã gia hạn thêm ${inv.durationMonths} tháng.`);
    setConfirmingInvoiceId(null);
    setViewingInvoice(null);
  };

  // Lưu cấp / gia hạn License Key từ modal
  const handleSaveLicense = async (payload: {
    storeId: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    finalAmount: number;
  }) => {
    const store = stores.find((s) => s.id === payload.storeId);
    if (!store) return;

    const newInvoice: SoftwareInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceCode: `INV-PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: store.id,
      storeName: store.name,
      plan: `Gói ${payload.plan === "STARTER" ? "Quán Nhỏ (STARTER)" : payload.plan === "GROWTH" ? "Quán Vừa (GROWTH)" : "Chuỗi Chuyên Nghiệp (PRO)"}`,
      durationMonths: payload.durationMonths,
      subTotal: payload.finalAmount,
      discountAmount: 0,
      finalAmount: payload.finalAmount,
      status: "PENDING",
      paymentMethod: "VIETQR",
      createdAt: "Vừa xong",
    };

    if (!connectedSources.includes("invoices")) {
      setInvoices((prev) => [newInvoice, ...prev]);
      toast.info("Hóa đơn đã tạo trong dữ liệu xem trước; license chưa được gia hạn trên máy chủ.");
      setLicenseTargetStore(null);
      return;
    }

    try {
      await storeApi.createSubscriptionInvoice({
        storeId: store.id,
        durationMonths: payload.durationMonths,
        amount: payload.finalAmount,
        enabledModules: store.modules,
      });
      const latestInvoices = await storeApi.getInvoices();
      setInvoices(latestInvoices || []);
      toast.success(`Đã lập hóa đơn gia hạn cho ${store.name}. License sẽ được gia hạn sau khi xác nhận thanh toán.`);
      setLicenseTargetStore(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lập hóa đơn gia hạn.");
    }
  };

  // Tạm khóa / Mở khóa quán (Mở modal cảnh báo & xác thực bằng mã hợp đồng)
  const handleToggleStoreStatus = (store: TenantStoreRecord) => {
    const mode = store.status === "SUSPENDED" ? "ACTIVATE" : "SUSPEND";
    setSuspendTarget({ store, mode });
  };

  const handleConfirmToggleStoreStatus = async (store: TenantStoreRecord) => {
    const isSuspending = store.status !== "SUSPENDED";
    const newStatus = isSuspending ? "SUSPENDED" : "ACTIVE";
    if (!connectedSources.includes("stores")) {
      toast.error("Máy chủ chưa kết nối. Không thể thay đổi trạng thái quán trên dữ liệu xem trước.");
      return;
    }
    try {
      await storeApi.updateStore(store.id, { status: newStatus });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái quán.");
      return;
    }

    setStores((prev) =>
      prev.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s))
    );
    if (viewingStoreDetails?.id === store.id) {
      setViewingStoreDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    toast.success(`Đã ${isSuspending ? "khóa" : "mở khóa"} cửa hàng ${store.name} thành công.`);
  };

  // Bật / Tắt module tính năng (Feature Flags) cho quán
  const handleToggleStoreModule = async (storeId: string, modId: AppModule) => {
    if (modId === AppModule.CORE_POS) {
      toast.warning("Module Vận Hành Bàn & Đơn (Core POS) là module lõi bắt buộc, không thể tắt!");
      return;
    }
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;
    const exists = store.modules.includes(modId);
    const updatedModules = exists
      ? store.modules.filter((m) => m !== modId)
      : [...store.modules, modId];

    const updatedStore = { ...store, modules: updatedModules };
    if (!connectedSources.includes("stores")) {
      toast.error("Máy chủ chưa kết nối. Không thể lưu module trên dữ liệu xem trước.");
      return;
    }
    try {
      await storeApi.updateStore(storeId, { modules: updatedModules });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật module cho cửa hàng.");
      return;
    }

    setStores((prev) => prev.map((s) => (s.id === storeId ? updatedStore : s)));
    if (viewingStoreDetails?.id === storeId) {
      setViewingStoreDetails(updatedStore);
    }

    const modName = APP_MODULE_CATALOG.find((m) => m.id === modId)?.name || modId;
    toast.success(
      exists
        ? `Đã vô hiệu hóa module "${modName}" cho quán ${store.name}`
        : `Đã kích hoạt module "${modName}" cho quán ${store.name}`
    );

    const newLog: SystemAuditLogRecord = {
      id: `a-${Date.now()}`,
      action: "MODULE_CONFIG_CHANGE",
      storeName: store.name,
      actor: "Quản trị viên",
      actorRole: "SUPER_ADMIN",
      ipAddress: "Chưa ghi nhận",
      timestamp: "Vừa xong",
      details: `${exists ? "Vô hiệu hóa" : "Kích hoạt"} module ${modName} (Feature Flag cấp quyền)`,
      status: "SUCCESS",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Tạo quán mới từ modal onboarding
  const handleCreateNewStoreSubmit = async (storeData: {
    name: string;
    owner: string;
    phone: string;
    address: string;
    businessType: BusinessType;
    scale: StoreScale;
    modules: AppModule[];
    tableCount: number;
    durationMonths: number;
    plan: "STARTER" | "GROWTH" | "PRO";
  }) => {
    const { name, owner, phone, businessType, scale, plan, durationMonths, modules, address, tableCount } = storeData;
    if (!name.trim() || !owner.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên quán, chủ quán và số điện thoại");
      return;
    }

    const pricePerMonth = plan === "STARTER" ? 199000 : plan === "GROWTH" ? 399000 : 599000;
    const subTotal = pricePerMonth * durationMonths;
    const discount = durationMonths >= 12 ? Math.round(subTotal * 0.2) : durationMonths >= 6 ? Math.round(subTotal * 0.1) : 0;
    const finalAmount = subTotal - discount;
    const newKey = `A2-${plan}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newId = `s-${Date.now()}`;

    const newStore: TenantStoreRecord = {
      id: newId,
      name: name.trim(),
      owner: owner.trim(),
      phone: phone.trim(),
      address: address.trim() || "Chưa cập nhật",
      tableCount,
      licenseKey: newKey,
      plan,
      scale,
      status: "ACTIVE",
      activatedAt: new Date().toLocaleDateString("vi-VN"),
      expiresAt: new Date(Date.now() + durationMonths * 30 * 86400000).toLocaleDateString("vi-VN"),
      daysLeft: durationMonths * 30,
      pingMs: 0,
      activeDevices: 0,
      configVer: "v1.0.0",
      businessType,
      modules,
    };

    const newInvoice: SoftwareInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceCode: `INV-PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: newId,
      storeName: name.trim(),
      plan: `Gói ${plan === "STARTER" ? "Quán Nhỏ (STARTER)" : plan === "GROWTH" ? "Quán Vừa (GROWTH)" : "Chuỗi Chuyên Nghiệp (PRO)"}`,
      durationMonths,
      subTotal,
      discountAmount: discount,
      finalAmount,
      status: "PENDING",
      paymentMethod: "VIETQR",
      createdAt: "Vừa xong",
    };

    let savedStore = newStore;
    let savedInvoice = false;
    if (connectedSources.includes("stores")) {
      try {
        const createdStore = await storeApi.createStore(newStore);
        savedStore = { ...newStore, ...createdStore, scale, businessType, modules };
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tạo cửa hàng trên máy chủ.");
        return;
      }

      try {
        await storeApi.createSubscriptionInvoice({
          storeId: savedStore.id,
          durationMonths,
          amount: finalAmount,
          enabledModules: modules,
        });
        const latestInvoices = await storeApi.getInvoices();
        setInvoices(latestInvoices || []);
        setConnectedSources((sources) => [...new Set([...sources, "invoices"])]);
        savedInvoice = true;
      } catch (error) {
        toast.warning(`Cửa hàng đã tạo, nhưng hóa đơn chưa được lập: ${error instanceof Error ? error.message : "dịch vụ hóa đơn chưa sẵn sàng"}`);
      }
    } else {
      setInvoices((prev) => [newInvoice, ...prev]);
    }

    setStores((prev) => [savedStore, ...prev]);

    // Seed kịch bản menu thực đơn & bàn mẫu cho quán mới
    const scenario = BUSINESS_SCENARIOS[businessType];
    if (scenario) {
      try {
        localStorage.setItem(`store_${savedStore.id}_dishes`, JSON.stringify(scenario.dishes));
        localStorage.setItem(`store_${savedStore.id}_tables`, JSON.stringify(scenario.defaultTables));
        localStorage.setItem("menu_dishes_data", JSON.stringify(scenario.dishes));
      } catch (err) {
        console.error("Failed to seed scenario data:", err);
      }
    }

    if (connectedSources.includes("stores")) {
      toast.success(savedInvoice ? `Đã tạo ${name} và lập hóa đơn thuê bao.` : `Đã tạo ${name}. Hãy kiểm tra hóa đơn để hoàn tất thiết lập thuê bao.`);
    } else {
      toast.info(`Đã tạo ${name} trong dữ liệu xem trước. Kết nối máy chủ để lưu thay đổi.`);
    }
    setIsNewStoreModalOpen(false);
  };

  // Hàm kiểm tra khớp tỉnh thành
  const matchesProvince = (address: string | undefined, prov: string) => {
    if (prov === "ALL") return true;
    const addr = (address || "").toLowerCase();
    if (prov === "TP.HCM") {
      return (
        addr.includes("hồ chí minh") ||
        addr.includes("tp.hcm") ||
        addr.includes("tphcm") ||
        addr.includes("sài gòn") ||
        addr.includes("phú nhuận") ||
        addr.includes("quận")
      );
    }
    if (prov === "Hà Nội") {
      return (
        addr.includes("hà nội") ||
        addr.includes("cầu giấy") ||
        addr.includes("ba đình") ||
        addr.includes("hoàn kiếm")
      );
    }
    if (prov === "Đà Nẵng") return addr.includes("đà nẵng");
    if (prov === "Bình Dương") return addr.includes("bình dương");
    if (prov === "Đồng Nai") return addr.includes("đồng nai");
    if (prov === "Cần Thơ") return addr.includes("cần thơ");
    if (prov === "Hải Phòng") return addr.includes("hải phòng");
    if (prov === "Khác") {
      return (
        !addr.includes("hồ chí minh") &&
        !addr.includes("tp.hcm") &&
        !addr.includes("hà nội") &&
        !addr.includes("đà nẵng")
      );
    }
    return addr.includes(prov.toLowerCase());
  };

  // Lọc quán thuê (theo trạng thái, gói cước, tỉnh thành, từ khóa)
  const filteredStores = stores.filter((s) => {
    if (storeStatusFilter !== "ALL" && s.status !== storeStatusFilter) return false;
    if (storePlanFilter !== "ALL" && s.plan !== storePlanFilter) return false;
    if (storeProvinceFilter !== "ALL" && !matchesProvince(s.address, storeProvinceFilter)) return false;
    if (storeSearch.trim()) {
      const q = storeSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.owner.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.licenseKey.toLowerCase().includes(q) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const paginatedStores = filteredStores.slice(
    (tenantPage - 1) * TENANT_PAGE_SIZE,
    tenantPage * TENANT_PAGE_SIZE
  );

  // Lọc hóa đơn cước
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter !== "ALL" && inv.status !== invoiceStatusFilter) return false;
    if (invoiceSearch.trim()) {
      const query = invoiceSearch.trim().toLocaleLowerCase("vi");
      if (!`${inv.invoiceCode} ${inv.storeName} ${inv.plan}`.toLocaleLowerCase("vi").includes(query)) return false;
    }
    return true;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (invoicePage - 1) * INVOICE_PAGE_SIZE,
    invoicePage * INVOICE_PAGE_SIZE
  );
  const pendingInvoiceCount = invoices.filter((invoice) => invoice.status === "PENDING").length;
  const unassignedLicenseCount = licenses.filter((license) => license.status === "UNASSIGNED").length;
  const renewalCount = stores.filter((store) => store.status === "EXPIRING_SOON" || store.status === "EXPIRED").length;
  const pendingWorkCount = pendingInvoiceCount + unassignedLicenseCount + renewalCount;

  const isCurrentTabMaximized =
    (activeTab === "tenants" && isTenantMaximized) ||
    (activeTab === "store_users" && isStoreUserMaximized) ||
    (activeTab === "licenses" && isLicenseMaximized) ||
    (activeTab === "scenarios" && isScenarioMaximized) ||
    (activeTab === "invoices" && isInvoiceMaximized) ||
    (activeTab === "pricing" && isPricingMaximized) ||
    (activeTab === "audit" && isAuditMaximized);

  return (
    <div className={`animate-fadeIn w-full max-w-full overflow-x-hidden ${isCurrentTabMaximized || activeTab === "tenants" || activeTab === "store_users" || activeTab === "licenses" || activeTab === "scenarios" || activeTab === "invoices" || activeTab === "pricing" || activeTab === "audit" ? "flex-1 flex flex-col min-h-0 space-y-3.5" : "space-y-5 sm:space-y-7"}`}>
      {/* Header Phân Hệ: Desktop có tiêu đề & mô tả, Mobile ẩn hoàn toàn khi ở tab Tổng Quan (Telemetry). Ẩn đi khi tab đang bật chế độ Phóng to */}
      {!isCurrentTabMaximized && (
        <div className={`${activeTab === "telemetry" ? "hidden sm:flex" : "flex"} shrink-0 flex-wrap items-center justify-between gap-2.5`}>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-ink-primary tracking-tight">
                {activeTab === "telemetry" && "Tổng Quan"}
                {activeTab === "tenants" && "Chuỗi Quán"}
                {activeTab === "store_users" && "User Quán"}
                {activeTab === "licenses" && "License Key"}
                {activeTab === "scenarios" && "Thực Đơn Mẫu"}
                {activeTab === "invoices" && "Hóa Đơn"}
                {activeTab === "pricing" && "Bảng Giá"}
                {activeTab === "audit" && "Kiểm Toán"}
              </h2>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] whitespace-nowrap shrink-0">
                A2Order Admin
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              {activeTab === "telemetry" && "Tổng quan đối tác, thiết bị và các công việc cần xử lý."}
              {activeTab === "tenants" && "Quản lý hợp đồng đối tác, phân quyền module và giám sát thiết bị."}
              {activeTab === "store_users" && "Quản lý tài khoản đăng nhập CMS của Chủ Quán và mã PIN đăng nhập POS/KDS toàn hệ thống."}
              {activeTab === "licenses" && "Phát hành và quản lý mã License Key bản quyền cho các máy POS/KDS."}
              {activeTab === "scenarios" && "Kho thực đơn mẫu, các biến thể size và nhóm topping đề xuất."}
              {activeTab === "invoices" && "Theo dõi các kỳ cước thuê phần mềm và xác nhận thanh toán."}
              {activeTab === "pricing" && "Cấu hình đơn giá thuê module SaaS, khung chiết khấu kỳ hạn và voucher khuyến mại."}
              {activeTab === "audit" && "Nhật ký kiểm toán thao tác và trạng thái hạ tầng đám mây."}
            </p>
          </div>
        </div>
      )}

      {!isCurrentTabMaximized && connectedSources.length < 3 && activeTab !== "telemetry" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-xs text-amber-900 animate-fadeIn">
          <Icon name="info" size={15} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="leading-relaxed"><strong>{connectedSources.length ? "Một phần dữ liệu chưa kết nối." : "Đang ở chế độ xem trước."}</strong> {connectedSources.length ? "Danh sách chỉ bao gồm các nguồn đã tải được; thao tác ghi cần máy chủ phản hồi." : "Các bản ghi minh họa không được lưu. Kết nối máy chủ để dùng dữ liệu và thao tác thật."}</p>
        </div>
      )}


      {/* TAB 1: QUẢN LÝ QUÁN THUÊ & HỢP ĐỒNG */}
      {activeTab === "tenants" && (
        <TenantManager
          stores={stores}
          storeSearch={storeSearch}
          setStoreSearch={setStoreSearch}
          storeStatusFilter={storeStatusFilter}
          setStoreStatusFilter={setStoreStatusFilter}
          storePlanFilter={storePlanFilter}
          setStorePlanFilter={setStorePlanFilter}
          storeProvinceFilter={storeProvinceFilter}
          setStoreProvinceFilter={setStoreProvinceFilter}
          tenantPage={tenantPage}
          setTenantPage={setTenantPage}
          filteredStores={filteredStores}
          paginatedStores={paginatedStores}
          TENANT_PAGE_SIZE={TENANT_PAGE_SIZE}
          downloadCsv={downloadCsv}
          setViewingStoreDetails={setViewingStoreDetails}
          setLicenseTargetStore={setLicenseTargetStore}
          handleToggleStoreStatus={handleToggleStoreStatus}
          onOpenNewStoreModal={() => setIsNewStoreModalOpen(true)}
          isMaximized={isTenantMaximized}
          setIsMaximized={setIsTenantMaximized}
        />
      )}

      {/* TAB: QUẢN LÝ TÀI KHOẢN & USER QUÁN */}
      {activeTab === "store_users" && (
        <StoreUserManager
          stores={stores}
          downloadCsv={downloadCsv}
          isMaximized={isStoreUserMaximized}
          setIsMaximized={setIsStoreUserMaximized}
        />
      )}

      {/* TAB 2: CẤP & QUẢN LÝ LICENSE KEY (LICENSE MANAGER) */}
      {activeTab === "licenses" && (
        <LicenseManager
          licenses={licenses}
          licenseSearch={licenseSearch}
          setLicenseSearch={setLicenseSearch}
          licenseStatusFilter={licenseStatusFilter}
          setLicenseStatusFilter={setLicenseStatusFilter}
          licensePage={licensePage}
          setLicensePage={setLicensePage}
          filteredLicenses={filteredLicenses}
          paginatedLicenses={paginatedLicenses}
          LICENSE_PAGE_SIZE={LICENSE_PAGE_SIZE}
          downloadCsv={downloadCsv}
          setIsCreateLicenseModalOpen={setIsCreateLicenseModalOpen}
          handleCopyKey={handleCopyKey}
          handleRevokeKey={handleRevokeKey}
          isMaximized={isLicenseMaximized}
          setIsMaximized={setIsLicenseMaximized}
        />
      )}

      {/* TAB 3: HÓA ĐƠN THUÊ PHẦN MỀM (VIETQR SAAS INVOICES) */}
      {activeTab === "invoices" && (
        <InvoiceManager
          invoices={invoices}
          invoiceSearch={invoiceSearch}
          setInvoiceSearch={setInvoiceSearch}
          invoiceStatusFilter={invoiceStatusFilter}
          setInvoiceStatusFilter={setInvoiceStatusFilter}
          invoicePage={invoicePage}
          setInvoicePage={setInvoicePage}
          filteredInvoices={filteredInvoices}
          paginatedInvoices={paginatedInvoices}
          INVOICE_PAGE_SIZE={INVOICE_PAGE_SIZE}
          downloadCsv={downloadCsv}
          setViewingInvoice={setViewingInvoice}
          handleConfirmInvoice={handleConfirmInvoice}
          confirmingInvoiceId={confirmingInvoiceId}
          isMaximized={isInvoiceMaximized}
          setIsMaximized={setIsInvoiceMaximized}
        />
      )}

      {/* TAB: BẢNG GIÁ GÓI & VOUCHER */}
      {activeTab === "pricing" && (
        <CmsAdminPricingManager
          isMaximized={isPricingMaximized}
          setIsMaximized={setIsPricingMaximized}
        />
      )}

      {/* PHÂN HỆ: TỔNG QUAN NỀN TẢNG & DOANH SỐ SAAS */}
      {/* TAB: TỔNG QUAN HỆ THỐNG */}
      {activeTab === "telemetry" && (
        <SaasDashboard
          stores={stores}
          invoices={invoices}
          licenses={licenses}
          auditLogs={auditLogs}
          connectedSources={connectedSources}
          isRefreshing={isRefreshing}
          onRefresh={handleRefreshTelemetry}
          onOpenNewStoreModal={() => setIsNewStoreModalOpen(true)}
          onSwitchTab={handleSwitchTab}
          onViewStoreDetails={setViewingStoreDetails}
        />
      )}

      {/* TAB 4: NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT TRAIL) */}
      {activeTab === "audit" && (
        <AuditLogViewer
          auditLogs={auditLogs}
          onRefresh={handleRefreshTelemetry}
          isRefreshing={isRefreshing}
          downloadCsv={downloadCsv}
          isMaximized={isAuditMaximized}
          setIsMaximized={setIsAuditMaximized}
        />
      )}

      {/* TAB 5: QUẢN LÝ KỊCH BẢN & THỰC ĐƠN MẪU F&B */}
      {activeTab === "scenarios" && (
        <React.Suspense fallback={<ScenarioTemplateSkeleton />}>
          <ScenarioTemplateManager
            isMaximized={isScenarioMaximized}
            setIsMaximized={setIsScenarioMaximized}
            downloadCsv={downloadCsv}
          />
        </React.Suspense>
      )}

      {/* 1. Modal Cấp Mới / Gia Hạn License Key */}
      <LicenseModal
        store={licenseTargetStore}
        onClose={() => setLicenseTargetStore(null)}
        onSave={handleSaveLicense}
      />

      {/* 2. Modal Xem Hóa Đơn & QR Thanh Toán Thuê Phần Mềm */}
      <InvoiceModal
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        onConfirmPayment={handleConfirmInvoice}
      />

      {/* 3. Modal Đăng Ký Quán Thuê Mới (2 Step Onboarding) */}
      <StoreOnboardingModal
        isOpen={isNewStoreModalOpen}
        onClose={() => setIsNewStoreModalOpen(false)}
        onSubmit={handleCreateNewStoreSubmit}
      />

      {/* 4. Modal Cấp License Key Mới */}
      <CreateLicenseKeyModal
        isOpen={isCreateLicenseModalOpen}
        stores={stores}
        onClose={() => setIsCreateLicenseModalOpen(false)}
        onSubmit={handleGenerateLicenseKeySubmit}
      />

      {/* 5. Modal Chi Tiết Toàn Diện Hồ Sơ Quán */}
      <StoreDossierModal
        store={viewingStoreDetails}
        invoices={invoices}
        stores={stores}
        onUpdateStore={(updatedStore) => {
          setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
          setViewingStoreDetails(updatedStore);
        }}
        onClose={() => setViewingStoreDetails(null)}
        onCopyKey={handleCopyKey}
        onOpenRenewModal={(target) => {
          setViewingStoreDetails(null);
          setLicenseTargetStore(target);
        }}
        onToggleModule={handleToggleStoreModule}
        onToggleStoreStatus={handleToggleStoreStatus}
        onViewInvoice={(inv) => setViewingInvoice(inv)}
      />

      {/* 6. Modal Cảnh Báo & Xác Nhận Khóa/Mở Quán Bằng Mã Hợp Đồng */}
      <SuspendStoreModal
        store={suspendTarget?.store || null}
        mode={suspendTarget?.mode || "SUSPEND"}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleConfirmToggleStoreStatus}
      />
    </div>
  );
};

export default CmsSuperAdminView;
