import React, { useState, useEffect, useMemo } from "react";
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
import { ScenarioTemplateSkeleton } from "@/components/ui";

const ScenarioTemplateManager = React.lazy(() =>
  import("./superAdmin/ScenarioTemplateManager").then((m) => ({ default: m.ScenarioTemplateManager }))
);

export const CmsSuperAdminView: React.FC<CmsSuperAdminViewProps> = ({
  subView: initialSubView = "telemetry",
  onTabChange,
  onImpersonateStore,
}) => {
  const [activeTab, setActiveTab] = useState<"tenants" | "licenses" | "invoices" | "telemetry" | "audit" | "scenarios">(
    initialSubView === "license_manager"
      ? "licenses"
      : initialSubView === "tenants"
      ? "tenants"
      : initialSubView === "software_invoices"
      ? "invoices"
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
    else if (initialSubView === "software_invoices") setActiveTab("invoices");
    else if (initialSubView === "audit_logs") setActiveTab("audit");
    else if (initialSubView === "scenarios") setActiveTab("scenarios");
    else setActiveTab("telemetry");
  }, [initialSubView]);

  const handleSwitchTab = (tab: "tenants" | "licenses" | "invoices" | "telemetry" | "audit" | "scenarios") => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bộ lọc & Phân trang Quán thuê
  const [storeSearch, setStoreSearch] = useState("");
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>("ALL");
  const [tenantPage, setTenantPage] = useState(1);
  const TENANT_PAGE_SIZE = 4;

  // Modal xem chi tiết toàn diện hồ sơ quán thuê
  const [viewingStoreDetails, setViewingStoreDetails] = useState<TenantStoreRecord | null>(null);

  // Quản lý & Cấp License Key (License Manager)
  const [licenses, setLicenses] = useState<LicenseKeyRecord[]>(INITIAL_LICENSES);
  const [stores, setStores] = useState<TenantStoreRecord[]>(INITIAL_STORES);
  const [invoices, setInvoices] = useState<SoftwareInvoiceRecord[]>(INITIAL_INVOICES);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogRecord[]>(INITIAL_AUDIT_LOGS);

  // Thử đồng bộ dữ liệu từ Server API khi mount
  useEffect(() => {
    storeApi
      .getStores()
      .then((serverStores) => {
        if (serverStores && serverStores.length > 0) {
          setStores(serverStores);
        }
      })
      .catch(() => {});

    storeApi
      .getLicenses()
      .then((serverLicenses) => {
        if (serverLicenses && serverLicenses.length > 0) {
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
        }
      })
      .catch(() => {});
  }, []);

  const [licenseSearch, setLicenseSearch] = useState("");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState("ALL");
  const [licensePage, setLicensePage] = useState(1);
  const LICENSE_PAGE_SIZE = 4;

  // Modal tạo license key mới
  const [isCreateLicenseModalOpen, setIsCreateLicenseModalOpen] = useState(false);

  // Bộ lọc & Phân trang Hóa đơn
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("ALL");
  const [invoicePage, setInvoicePage] = useState(1);
  const INVOICE_PAGE_SIZE = 4;

  // Modal Cấp Mới / Gia Hạn License Key
  const [licenseTargetStore, setLicenseTargetStore] = useState<TenantStoreRecord | null>(null);

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

  const handleGenerateLicenseKeySubmit = (data: {
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

    setLicenses((prev) => [newKey, ...prev]);

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
        actor: "Super Admin",
        actorRole: "SUPER_ADMIN",
        ipAddress: "127.0.0.1",
        action: "GENERATE_LICENSE_KEY",
        storeName: data.storeName || "Standalone Key",
        details: `Cấp License Key ${keyCode} (${data.plan}, ${data.durationMonths} tháng, max ${data.maxDevices} máy)`,
        status: "SUCCESS",
      },
      ...prev,
    ]);

    setIsCreateLicenseModalOpen(false);
    toast.success(`Đã cấp License Key ${keyCode} thành công!`);
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

    setLicenses((prev) =>
      prev.map((l) => (l.id === lic.id ? { ...l, status: "REVOKED" } : l))
    );
    toast.warning(`Đã thu hồi License Key ${lic.keyCode}`);
  };

  // Refresh Telemetry
  const handleRefreshTelemetry = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Đã đồng bộ chỉ số doanh thu SaaS và trạng thái kết nối các quán!");
    }, 400);
  };

  // Xác nhận thanh toán hóa đơn cước
  const handleConfirmInvoice = async (inv: SoftwareInvoiceRecord) => {
    const ok = await confirmDialog({
      title: "Xác Nhận Đã Nhận Tiền Thuê?",
      message: `Xác nhận đã nhận đủ ${inv.finalAmount.toLocaleString("vi-VN")} đ cước thuê phần mềm của ${inv.storeName}? Hệ thống sẽ tự động kích hoạt License Key cho quán.`,
      confirmText: "Xác Nhận & Gia Hạn Key",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

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
              daysLeft: s.daysLeft + inv.durationMonths * 30,
              licenseKey: `A2-${s.plan}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            }
          : s
      )
    );

    toast.success(`Đã xác nhận thanh toán hóa đơn ${inv.invoiceCode}! License Key đã gia hạn thêm ${inv.durationMonths} tháng.`);
    setViewingInvoice(null);
  };

  // Lưu cấp / gia hạn License Key từ modal
  const handleSaveLicense = (payload: {
    storeId: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    finalAmount: number;
  }) => {
    const store = stores.find((s) => s.id === payload.storeId);
    if (!store) return;

    const newKey = `A2-${payload.plan}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Cập nhật trạng thái quán
    setStores((prev) =>
      prev.map((s) =>
        s.id === store.id
          ? {
              ...s,
              plan: payload.plan,
              status: "ACTIVE",
              daysLeft: s.daysLeft + payload.durationMonths * 30,
              licenseKey: newKey,
            }
          : s
      )
    );

    // Tự động tạo hóa đơn thuê phần mềm mới
    const newInvoice: SoftwareInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceCode: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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

    setInvoices((prev) => [newInvoice, ...prev]);
    toast.success(`Đã cấp License Key mới [${newKey}] cho ${store.name} và tạo hóa đơn thuê phần mềm!`);
    setLicenseTargetStore(null);
  };

  // Tạm khóa / Mở khóa quán
  const handleToggleStoreStatus = async (store: TenantStoreRecord) => {
    const isSuspending = store.status !== "SUSPENDED";
    const ok = await confirmDialog({
      title: isSuspending ? "Tạm Khóa Quán Này?" : "Mở Khóa Quán Hoạt Động Lại?",
      message: isSuspending
        ? `Tạm khóa ${store.name} sẽ ngắt kết nối toàn bộ các máy POS và mã QR đặt món của quán này.`
        : `Mở khóa lại cho ${store.name} để tiếp tục hoạt động bán hàng bình thường.`,
      confirmText: isSuspending ? "Tạm Khóa Quán" : "Mở Khóa Ngay",
      cancelText: "Hủy",
      variant: isSuspending ? "danger" : "primary",
    });
    if (!ok) return;

    const newStatus = isSuspending ? "SUSPENDED" : "ACTIVE";
    setStores((prev) =>
      prev.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s))
    );
    if (viewingStoreDetails?.id === store.id) {
      setViewingStoreDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    toast.info(`Đã ${isSuspending ? "tạm khóa" : "mở khóa"} quán ${store.name}`);
  };

  // Bật / Tắt module tính năng (Feature Flags) cho quán
  const handleToggleStoreModule = (storeId: string, modId: AppModule) => {
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
      actor: "superadmin@a2order.vn",
      actorRole: "SUPER_ADMIN",
      ipAddress: "14.225.24.12",
      timestamp: "Vừa xong",
      details: `${exists ? "Vô hiệu hóa" : "Kích hoạt"} module ${modName} (Feature Flag cấp quyền)`,
      status: "SUCCESS",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Thu hồi bản quyền thiết bị (Revoke Terminal)
  const handleRevokeTerminal = async (storeId: string, terminalId: string, terminalName: string) => {
    const ok = await confirmDialog({
      title: `Thu Hồi Thiết Bị: ${terminalName}?`,
      message: `Máy POS/KDS này sẽ bị ngắt kết nối và đăng xuất tức thì khỏi hệ thống của quán. Thao tác này giúp ngăn ngừa việc chia sẻ lậu License Key sang máy khác ngoài hợp đồng.`,
      confirmText: "Thu Hồi & Đăng Xuất",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const remainingTerminals = (store.terminals || []).filter((t) => t.id !== terminalId);
    const updatedStore: TenantStoreRecord = {
      ...store,
      terminals: remainingTerminals,
      activeDevices: remainingTerminals.filter((t) => t.status === "ONLINE").length,
    };

    setStores((prev) => prev.map((s) => (s.id === storeId ? updatedStore : s)));
    if (viewingStoreDetails?.id === storeId) {
      setViewingStoreDetails(updatedStore);
    }

    toast.success(`Đã thu hồi máy "${terminalName}". Thiết bị đã bị đăng xuất khỏi hệ thống.`);

    const newLog: SystemAuditLogRecord = {
      id: `a-${Date.now()}`,
      action: "TERMINAL_REVOKE",
      storeName: store.name,
      actor: "superadmin@a2order.vn",
      actorRole: "SUPER_ADMIN",
      ipAddress: "14.225.24.12",
      timestamp: "Vừa xong",
      details: `Thu hồi bản quyền máy POS: ${terminalName} (ID: ${terminalId}) - ngắt kết nối tức thì`,
      status: "WARNING",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Tạo quán mới từ modal onboarding
  const handleCreateNewStoreSubmit = (storeData: {
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
      invoiceCode: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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

    setStores((prev) => [newStore, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    // Async lưu lên backend
    storeApi.createStore(newStore).catch(() => {});

    // Seed kịch bản menu thực đơn & bàn mẫu cho quán mới
    const scenario = BUSINESS_SCENARIOS[businessType];
    if (scenario) {
      try {
        localStorage.setItem(`store_${newId}_dishes`, JSON.stringify(scenario.dishes));
        localStorage.setItem(`store_${newId}_tables`, JSON.stringify(scenario.defaultTables));
        localStorage.setItem("menu_dishes_data", JSON.stringify(scenario.dishes));
      } catch (err) {
        console.error("Failed to seed scenario data:", err);
      }
    }

    toast.success(`Đã đăng ký quán "${name}" thành công với License Key [${newKey}]!`);
    setIsNewStoreModalOpen(false);
  };

  // Lọc quán thuê
  const filteredStores = stores.filter((s) => {
    if (storeStatusFilter !== "ALL" && s.status !== storeStatusFilter) return false;
    if (storeSearch.trim()) {
      const q = storeSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.owner.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.licenseKey.toLowerCase().includes(q)
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
    return true;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (invoicePage - 1) * INVOICE_PAGE_SIZE,
    invoicePage * INVOICE_PAGE_SIZE
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Chuyên Nghiệp Theo Phân Hệ (Chuẩn SaaS F&B) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-ink-primary tracking-tight">
              {activeTab === "telemetry" && "Tổng Quan & Doanh Số Nền Tảng (SaaS Overview)"}
              {activeTab === "tenants" && "Quản Lý Quán Thuê & Chuỗi F&B"}
              {activeTab === "licenses" && "Kho License Key Bản Quyền (License Manager)"}
              {activeTab === "scenarios" && "Quản Trị Kịch Bản & Thực Đơn Mẫu F&B"}
              {activeTab === "invoices" && "Hóa Đơn Thuê & Thu Phí Dịch Vụ"}
              {activeTab === "audit" && "Kiểm Toán Thao Tác & Giám Sát Hạ Tầng"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] whitespace-nowrap shrink-0">
              A2Order Core v2.4
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            {activeTab === "telemetry" && "Chỉ số tài chính định kỳ (MRR/ARR), lưu lượng đơn hàng toàn hệ thống và theo dõi thuê bao khách hàng."}
            {activeTab === "tenants" && "Quản lý hợp đồng đối tác, cấu hình phân quyền module tính năng và theo dõi thiết bị POS online."}
            {activeTab === "licenses" && "Phát hành và quản lý mã License Key bản quyền cho các máy POS/KDS, quản lý key dự phòng chưa gán."}
            {activeTab === "scenarios" && "Quản lý kho thực đơn mẫu, các biến thể size và nhóm topping đề xuất cho từng mô hình F&B. Độc lập 100% với dữ liệu các quán."}
            {activeTab === "invoices" && "Theo dõi các kỳ cước thuê phần mềm, xác nhận thanh toán chuyển khoản VietQR tự động và xuất hóa đơn."}
            {activeTab === "audit" && "Nhật ký kiểm toán thao tác quản trị và trạng thái sức khỏe các dịch vụ đám mây."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "licenses" ? (
            <Button
              size="sm"
              className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white font-bold shadow-sm whitespace-nowrap"
              onClick={() => setIsCreateLicenseModalOpen(true)}
            >
              <Icon name="key" className="w-3.5 h-3.5 text-white" />
              <span>Cấp License Key Mới</span>
            </Button>
          ) : activeTab === "scenarios" ? null : (
            <Button
              size="sm"
              className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white font-bold shadow-sm whitespace-nowrap"
              onClick={() => setIsNewStoreModalOpen(true)}
            >
              <Icon name="plus" className="w-3.5 h-3.5 text-white" />
              <span>Đăng Ký Quán Mới</span>
            </Button>
          )}

          {activeTab === "telemetry" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-1.5 text-xs bg-white text-ink-primary font-bold shadow-xs whitespace-nowrap"
              onClick={() => toast.info("Đã xuất báo cáo doanh số SaaS định dạng Excel")}
            >
              <Icon name="download" className="w-3.5 h-3.5 text-brand-900" />
              <span>Xuất Báo Cáo SaaS</span>
            </Button>
          )}

          {activeTab === "audit" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-1.5 text-xs bg-white text-ink-primary font-bold shadow-xs whitespace-nowrap"
              onClick={handleRefreshTelemetry}
              disabled={isRefreshing}
            >
              <Icon name="refresh" className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Làm Mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sub-Nav Switcher giữa Quán Thuê & Kho License Key */}
      {(activeTab === "tenants" || activeTab === "licenses") && (
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-canvas rounded-2xl border border-surface-border max-w-full shadow-xs">
          <button
            type="button"
            onClick={() => handleSwitchTab("tenants")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "tenants"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white"
            }`}
          >
            <Icon name="building" className="w-3.5 h-3.5" />
            <span>Quán Thuê & Điểm Bán ({stores.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab("licenses")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "licenses"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white"
            }`}
          >
            <Icon name="key" className="w-3.5 h-3.5" />
            <span>Kho License Key ({licenses.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: QUẢN LÝ QUÁN THUÊ & HỢP ĐỒNG */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
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
              <span className="text-xs font-bold text-ink-muted shrink-0">Khớp {filteredStores.length} / {stores.length} quán</span>
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
                    className="w-full h-8 pl-8 pr-3 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "ALL", label: "Tất Cả", count: stores.length },
                    { id: "ACTIVE", label: "🟢 Hoạt Động", count: stores.filter((s) => s.status === "ACTIVE").length },
                    { id: "EXPIRING_SOON", label: "⏳ Sắp Hạn", count: stores.filter((s) => s.status === "EXPIRING_SOON").length },
                    { id: "EXPIRED", label: "⚠️ Hết Hạn", count: stores.filter((s) => s.status === "EXPIRED").length },
                    { id: "SUSPENDED", label: "🔒 Khóa", count: stores.filter((s) => s.status === "SUSPENDED").length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setStoreStatusFilter(st.id);
                        setTenantPage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
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

            {/* Mobile / Tablet Cards View (< lg) - Không scroll ngang */}
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

            {/* Phân trang quán thuê */}
            <Pagination
              currentPage={tenantPage}
              totalItems={filteredStores.length}
              pageSize={TENANT_PAGE_SIZE}
              onPageChange={setTenantPage}
            />
          </Panel>
        </div>
      )}

      {/* TAB 2: CẤP & QUẢN LÝ LICENSE KEY (LICENSE MANAGER) */}
      {activeTab === "licenses" && (
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

              <Button
                size="sm"
                className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white font-bold shrink-0 whitespace-nowrap shadow-sm"
                onClick={() => setIsCreateLicenseModalOpen(true)}
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                <span className="sm:hidden">+ Sinh Key Mới</span>
                <span className="hidden sm:inline">+ Sinh License Key Mới</span>
              </Button>
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
                    className="w-full h-8 pl-8 pr-3 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "ALL", label: "Tất Cả", count: licenses.length },
                    { id: "ACTIVE", label: "🟢 Đang Dùng", count: licenses.filter((l) => l.status === "ACTIVE").length },
                    { id: "UNASSIGNED", label: "⚪ Chưa Gán", count: licenses.filter((l) => l.status === "UNASSIGNED").length },
                    { id: "EXPIRING_SOON", label: "⏳ Sắp Hạn", count: licenses.filter((l) => l.status === "EXPIRING_SOON").length },
                    { id: "EXPIRED", label: "⚠️ Hết Hạn", count: licenses.filter((l) => l.status === "EXPIRED").length },
                    { id: "REVOKED", label: "🚫 Thu Hồi", count: licenses.filter((l) => l.status === "REVOKED").length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setLicenseStatusFilter(st.id);
                        setLicensePage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
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

            {/* Mobile / Tablet Cards View (< lg) - Không scroll ngang */}
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

            <Pagination
              currentPage={licensePage}
              totalItems={filteredLicenses.length}
              pageSize={LICENSE_PAGE_SIZE}
              onPageChange={setLicensePage}
            />
          </Panel>
        </div>
      )}

      {/* TAB 3: HÓA ĐƠN THUÊ PHẦN MỀM (VIETQR SAAS INVOICES) */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-surface-border pb-3 mb-4">
              <div>
                <h3 className="font-black text-sm sm:text-base text-ink-primary flex items-center gap-2">
                  <Icon name="fileText" className="w-4 h-4 text-brand-800 shrink-0" />
                  <span className="sm:hidden">Sổ Hóa Đơn Thuê</span>
                  <span className="hidden sm:inline">Sổ Hóa Đơn Thuê Phần Mềm (VietQR SaaS Invoices)</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Quản lý các khoản phí thuê bao phần mềm và duyệt gia hạn tự động qua chuyển khoản VietQR
                </p>
              </div>

              {/* Lọc trạng thái hóa đơn */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "ALL", label: "Tất Cả", count: invoices.length },
                  { id: "PAID", label: "Đã Thu", count: invoices.filter((i) => i.status === "PAID").length },
                  { id: "PENDING", label: "Chờ Duyệt", count: invoices.filter((i) => i.status === "PENDING").length },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setInvoiceStatusFilter(st.id);
                      setInvoicePage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      invoiceStatusFilter === st.id
                        ? "bg-brand-900 text-white shadow-sm"
                        : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${invoiceStatusFilter === st.id ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"}`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="pb-3 px-3">Mã Hóa Đơn</th>
                    <th className="pb-3 px-3">Tên Quán Thuê</th>
                    <th className="pb-3 px-3">Gói Thuê & Thời Gian</th>
                    <th className="pb-3 px-3 text-right">Số Tiền (VND)</th>
                    <th className="pb-3 px-3 text-center">Trạng Thái</th>
                    <th className="pb-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-medium">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-ink-muted font-bold">
                        Không có hóa đơn nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-brand-50/20 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-ink-primary">
                          {inv.invoiceCode}
                          <span className="text-[10px] text-ink-muted block">{inv.createdAt}</span>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-ink-primary">
                          {inv.storeName}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-bold text-brand-900">{inv.plan}</span>
                          <span className="text-[10px] text-ink-muted block">Thời hạn: {inv.durationMonths} tháng</span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <span className="font-black text-sm text-brand-950">
                            {inv.finalAmount.toLocaleString("vi-VN")} đ
                          </span>
                          {inv.discountAmount > 0 && (
                            <span className="text-[10px] text-emerald-700 block">
                              Đã giảm {inv.discountAmount.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800 animate-pulse"
                            }`}
                          >
                            {inv.status === "PAID" ? "Đã thanh toán VietQR" : "Chờ thanh toán"}
                          </span>
                          {inv.paidAt && (
                            <span className="text-[9px] text-ink-subtle block mt-0.5">{inv.paidAt}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingInvoice(inv)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 transition-colors"
                            >
                              Xem VietQR
                            </button>

                            {inv.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleConfirmInvoice(inv)}
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-brand-900 text-white hover:bg-brand-950 transition-all shadow-sm"
                              >
                                Duyệt Đã Nhận Tiền
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

            {/* Mobile / Tablet Cards View (< lg) - Không scroll ngang */}
            <div className="block lg:hidden">
              {paginatedInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted font-bold bg-surface-canvas rounded-2xl border border-surface-border">
                  Không có hóa đơn nào phù hợp với bộ lọc
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {paginatedInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-3xl bg-white border border-surface-border shadow-xs hover:shadow-elevated transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Header card */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-black text-brand-950 px-2 py-0.5 rounded-lg bg-surface-canvas border border-surface-border">
                              {inv.invoiceCode}
                            </span>
                            <span className="text-[10px] text-ink-muted block mt-1">{inv.createdAt}</span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800 animate-pulse"
                            }`}
                          >
                            {inv.status === "PAID" ? "Đã thanh toán" : "Chờ thu tiền"}
                          </span>
                        </div>

                        {/* Thông tin quán */}
                        <div>
                          <h4 className="text-sm font-black text-ink-primary">{inv.storeName}</h4>
                          <span className="text-xs font-bold text-brand-900">{inv.plan}</span>
                        </div>

                        {/* Số tiền & chiết khấu */}
                        <div className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-baseline justify-between">
                          <span className="text-xs text-ink-muted font-bold">Số tiền thanh toán:</span>
                          <div className="text-right">
                            <span className="text-base font-black text-brand-950 block">
                              {inv.finalAmount.toLocaleString("vi-VN")} đ
                            </span>
                            {inv.discountAmount > 0 && (
                              <span className="text-[10px] text-emerald-700 block">
                                Đã giảm {inv.discountAmount.toLocaleString("vi-VN")} đ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-ink-muted flex items-center justify-between">
                          <span>Kỳ hạn: {inv.durationMonths} tháng</span>
                          {inv.paidAt && <span>Đã duyệt: {inv.paidAt}</span>}
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="pt-2 border-t border-surface-border flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(inv)}
                          className="flex-1 py-1.5 rounded-xl text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 transition-colors text-center"
                        >
                          Xem Mã VietQR
                        </button>
                        {inv.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleConfirmInvoice(inv)}
                            className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-brand-900 text-white hover:bg-brand-950 transition-all shadow-sm text-center"
                          >
                            Duyệt Đã Thu
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phân trang hóa đơn */}
            <Pagination
              currentPage={invoicePage}
              totalItems={filteredInvoices.length}
              pageSize={INVOICE_PAGE_SIZE}
              onPageChange={setInvoicePage}
            />
          </Panel>
        </div>
      )}

      {/* PHÂN HỆ: TỔNG QUAN NỀN TẢNG & DOANH SỐ SAAS */}
      {activeTab === "telemetry" && (
        <div className="space-y-6">
          {/* 4 Thẻ KPI Doanh Số & Quy Mô SaaS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <Panel variant="featured" padding="sm" className="p-3.5 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-brand-200">Doanh Thu Định Kỳ (MRR)</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name="banknote" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-xl sm:text-3xl font-black tracking-tight text-white">18.450.000</span>
                <span className="text-xs text-brand-200 ml-1">đ/tháng</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-300">
                <span>+12.8% vs tháng trước</span>
                <span className="text-brand-200 font-normal">ARR: 221.4M</span>
              </div>
            </Panel>

            <Panel variant="default" padding="sm" className="p-3.5 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink-muted">Cơ Sở Hoạt Động</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                  <Icon name="building" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-800" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">42</span>
                <span className="text-[10px] sm:text-xs text-ink-muted ml-1">điểm bán</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                Tỷ lệ duy trì: 96.2%
              </span>
            </Panel>

            <Panel variant="default" padding="sm" className="p-3.5 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink-muted">Cảnh Báo Hết Hạn (&lt; 7 ngày)</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Icon name="alertCircle" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">3</span>
                <span className="text-[10px] sm:text-xs text-ink-muted ml-1">quán cần gọi</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                1 quán hết hạn hôm nay
              </span>
            </Panel>

            <Panel variant="default" padding="sm" className="p-3.5 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink-muted">Giao Dịch Hôm Nay</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                  <Icon name="activity" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">4.820</span>
                <span className="text-[10px] sm:text-xs text-ink-muted ml-1">đơn hàng</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted">
                GMV xử lý: 342.500.000 đ
              </span>
            </Panel>
          </div>

          {/* 2 Khối Doanh Số & Chăm Sóc Khách Hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Phân Bổ Gói Cước Thuê Bao */}
            <Panel variant="default" padding="lg">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between items-start mb-4 border-b border-surface-border pb-3 gap-1">
                <h3 className="font-black text-sm sm:text-base text-ink-primary flex items-center gap-2">
                  <Icon name="chart" className="w-4 h-4 text-brand-900" />
                  <span>Cơ Cấu Thuê Bao & Phân Bổ Gói Cước</span>
                </h3>
                <span className="text-xs font-bold text-ink-muted">Cập nhật lúc 14:00</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex flex-col xl:flex-row xl:items-end justify-between text-xs font-bold mb-1 gap-1">
                    <span className="text-purple-900">Chuỗi Chuyên Nghiệp (PRO - 599k/tháng)</span>
                    <span className="font-black text-ink-primary">8 quán • 4.792.000 đ (26%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="w-[26%] h-full bg-purple-600 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col xl:flex-row xl:items-end justify-between text-xs font-bold mb-1 gap-1">
                    <span className="text-blue-900">Quán Vừa Tăng Trưởng (GROWTH - 399k/tháng)</span>
                    <span className="font-black text-ink-primary">18 quán • 7.182.000 đ (39%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="w-[39%] h-full bg-blue-600 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col xl:flex-row xl:items-end justify-between text-xs font-bold mb-1 gap-1">
                    <span className="text-emerald-900">Quán Nhỏ Tiết Kiệm (STARTER - 199k/tháng)</span>
                    <span className="font-black text-ink-primary">16 quán • 3.184.000 đ (17%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="w-[17%] h-full bg-emerald-600 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col xl:flex-row xl:items-end justify-between text-xs font-bold mb-1 gap-1">
                    <span className="text-brand-900">Dịch Vụ Add-on (Module KDS, Kế Toán, Web)</span>
                    <span className="font-black text-ink-primary">3.292.000 đ (18%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="w-[18%] h-full bg-brand-800 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
                <span>Tỷ lệ chuyển đổi (Trial-to-Paid): <strong className="text-emerald-700">68.5%</strong></span>
                <span className="font-bold text-brand-900 cursor-pointer hover:underline" onClick={() => onTabChange?.("pricing_config")}>
                  Quản lý bảng giá &rarr;
                </span>
              </div>
            </Panel>

            {/* Quán Cần CSKH Gọi Gia Hạn Gấp */}
            <Panel variant="default" padding="lg">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between items-start mb-4 border-b border-surface-border pb-3 gap-1">
                <h3 className="font-black text-sm sm:text-base text-ink-primary flex items-center gap-2">
                  <Icon name="phone" className="w-4 h-4 text-amber-600" />
                  <span>Quán Cần CSKH Chăm Sóc Gấp (&lt; 7 ngày)</span>
                </h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  3 đối tác
                </span>
              </div>

              <div className="space-y-2.5">
                {stores
                  .filter((s) => s.status === "EXPIRING_SOON" || s.status === "EXPIRED")
                  .map((store) => (
                    <div
                      key={store.id}
                      className="p-3 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-ink-primary font-black">{store.name}</strong>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                              store.status === "EXPIRED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {store.status === "EXPIRED" ? "Đã hết hạn" : `Còn ${store.daysLeft} ngày`}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {store.owner} • <a href={`tel:${store.phone}`} className="text-brand-900 font-bold hover:underline">{store.phone}</a> • Gói {store.plan}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setLicenseTargetStore(store)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-brand-900 text-white hover:bg-black shadow-xs whitespace-nowrap"
                        >
                          Gia Hạn
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
                <span>Chính sách: Khách gia hạn 1 năm tặng thêm 2 tháng.</span>
                <span className="font-bold text-brand-900 cursor-pointer hover:underline" onClick={() => onTabChange?.("tenants")}>
                  Xem tất cả quán &rarr;
                </span>
              </div>
            </Panel>
          </div>

          {/* Trạng Thái Hệ Thống Đám Mây (SLA 99.9%) */}
          <Panel variant="default" padding="lg">
            <h3 className="font-black text-base text-ink-primary flex items-center gap-2 mb-3">
              <Icon name="shield" className="w-4 h-4 text-brand-900" />
              <span>Trạng Thái Cụm Hạ Tầng Nền Tảng (A2Order Cloud SLA 99.9%)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-primary">API Gateway & Load Balancer</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-black text-emerald-700 text-xs">SLA 99.99% • 14ms</div>
                <span className="text-[10px] text-ink-muted block">Cụm máy chủ Hà Nội & TP.HCM</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-primary">Realtime Sync (KDS & POS)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-black text-emerald-700 text-xs">WebSocket Connected</div>
                <span className="text-[10px] text-ink-muted block">Không độ trễ đơn hàng</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-primary">Cổng Thanh Toán VietQR</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-black text-emerald-700 text-xs">Sẵn Sàng 100%</div>
                <span className="text-[10px] text-ink-muted block">Tự động đối soát biến động số dư</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-primary">Cloud CDN Menu & Ảnh Món</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-black text-emerald-700 text-xs">Edge Cache Tốc Độ Cao</div>
                <span className="text-[10px] text-ink-muted block">Tải ảnh tức thì trên mobile</span>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 4: NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT TRAIL) */}
      {activeTab === "audit" && (
        <Panel variant="default" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base text-ink-primary flex items-center gap-2">
                <Icon name="history" className="w-4 h-4 text-brand-800 shrink-0" />
                <span className="sm:hidden">Nhật Ký Kiểm Toán</span>
                <span className="hidden sm:inline">Nhật Ký Kiểm Toán Toàn Nền Tảng (System Audit Trail)</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                Theo dõi minh bạch mọi thao tác gia hạn license, cấp quyền, cấu hình và bảo mật
              </p>
            </div>
          </div>

          <div className="divide-y divide-surface-border">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500"
                          : log.status === "WARNING"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span className="font-black text-ink-primary">{log.action}</span>
                    <span className="text-ink-muted">• {log.storeName}</span>
                  </div>
                  <p className="text-ink-secondary mt-0.5">{log.details}</p>
                  <div className="flex items-center gap-3 text-[10px] text-ink-muted mt-1">
                    <span>{log.timestamp}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-md w-fit">
                  {log.actor}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* TAB 5: QUẢN LÝ KỊCH BẢN & THỰC ĐƠN MẪU F&B */}
      {activeTab === "scenarios" && (
        <React.Suspense fallback={<ScenarioTemplateSkeleton />}>
          <ScenarioTemplateManager />
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
        onClose={() => setViewingStoreDetails(null)}
        onCopyKey={handleCopyKey}
        onOpenRenewModal={(target) => {
          setViewingStoreDetails(null);
          setLicenseTargetStore(target);
        }}
        onToggleModule={handleToggleStoreModule}
        onRevokeTerminal={handleRevokeTerminal}
        onToggleStoreStatus={handleToggleStoreStatus}
        onImpersonateStore={onImpersonateStore}
        onViewInvoice={(inv) => setViewingInvoice(inv)}
      />
    </div>
  );
};


