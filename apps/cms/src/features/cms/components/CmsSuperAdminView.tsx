import React, { useState, useEffect, useMemo } from "react";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import {
  CmsSuperAdminViewProps,
  TenantStoreRecord,
  SoftwareInvoiceRecord,
  SystemAuditLogRecord,
  AppModule,
  BusinessType,
  BUSINESS_TYPE_CONFIG,
} from "@/types/cms.types";

export interface LicenseKeyRecord {
  id: string;
  keyCode: string;
  storeName?: string;
  storeId?: string;
  plan: "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE";
  maxDevices: number;
  durationMonths: number;
  issuedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED" | "UNASSIGNED";
  modules: AppModule[];
}

export const CmsSuperAdminView: React.FC<CmsSuperAdminViewProps> = ({
  subView: initialSubView = "tenants",
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<"tenants" | "licenses" | "invoices" | "telemetry" | "audit">(
    initialSubView === "telemetry"
      ? "telemetry"
      : initialSubView === "license_manager"
      ? "licenses"
      : initialSubView === "software_invoices"
      ? "invoices"
      : initialSubView === "audit_logs"
      ? "audit"
      : "tenants"
  );

  // Đồng bộ tab ngay lập tức khi người dùng click thanh bên Sidebar
  useEffect(() => {
    if (initialSubView === "telemetry") setActiveTab("telemetry");
    else if (initialSubView === "tenants") setActiveTab("tenants");
    else if (initialSubView === "license_manager") setActiveTab("licenses");
    else if (initialSubView === "software_invoices") setActiveTab("invoices");
    else if (initialSubView === "audit_logs") setActiveTab("audit");
  }, [initialSubView]);

  const handleSwitchTab = (tab: "tenants" | "licenses" | "invoices" | "telemetry" | "audit") => {
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
  const [licenses, setLicenses] = useState<LicenseKeyRecord[]>([
    {
      id: "lic-1",
      keyCode: "A2-PRO-9F8A2B",
      storeName: "Phở Bò Nam Định - Chi nhánh 1",
      storeId: "s1",
      plan: "PRO",
      maxDevices: 4,
      durationMonths: 1,
      issuedAt: "01/09/2026",
      expiresAt: "01/10/2026",
      status: "ACTIVE",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_KDS,
        AppModule.MODULE_QR_ORDER,
        AppModule.MODULE_ADVANCED_ANALYTICS,
        AppModule.MODULE_LANDING_PAGE,
      ],
    },
    {
      id: "lic-2",
      keyCode: "A2-STARTER-77X1A",
      storeName: "Bún Chả Cầu Giấy (Quán Nhỏ)",
      storeId: "s2",
      plan: "STARTER",
      maxDevices: 2,
      durationMonths: 1,
      issuedAt: "15/09/2026",
      expiresAt: "15/10/2026",
      status: "ACTIVE",
      modules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER],
    },
    {
      id: "lic-3",
      keyCode: "A2-GROWTH-31AA0",
      storeName: "Cà Phê Muối Chú Long",
      storeId: "s3",
      plan: "GROWTH",
      maxDevices: 3,
      durationMonths: 1,
      issuedAt: "30/08/2026",
      expiresAt: "30/09/2026",
      status: "EXPIRING_SOON",
      modules: [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER],
    },
    {
      id: "lic-4",
      keyCode: "A2-PRO-88BCC2",
      storeName: "Quán Ốc Sài Gòn Đêm",
      storeId: "s4",
      plan: "PRO",
      maxDevices: 5,
      durationMonths: 1,
      issuedAt: "01/08/2026",
      expiresAt: "01/09/2026",
      status: "EXPIRED",
      modules: [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER],
    },
    {
      id: "lic-5",
      keyCode: "A2-GROWTH-99KEY1",
      plan: "GROWTH",
      maxDevices: 3,
      durationMonths: 6,
      issuedAt: "20/09/2026",
      expiresAt: "20/03/2027",
      status: "UNASSIGNED",
      modules: [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER],
    },
  ]);

  const [licenseSearch, setLicenseSearch] = useState("");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState("ALL");
  const [licensePage, setLicensePage] = useState(1);
  const LICENSE_PAGE_SIZE = 4;

  // Modal tạo license key mới
  const [isCreateLicenseModalOpen, setIsCreateLicenseModalOpen] = useState(false);
  const [newLicensePlan, setNewLicensePlan] = useState<"STARTER" | "GROWTH" | "PRO">("PRO");
  const [newLicenseDuration, setNewLicenseDuration] = useState<number>(6);
  const [newLicenseStoreId, setNewLicenseStoreId] = useState<string>("UNASSIGNED");
  const [newLicenseDevices, setNewLicenseDevices] = useState<number>(4);

  // Bộ lọc & Phân trang Hóa đơn
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("ALL");
  const [invoicePage, setInvoicePage] = useState(1);
  const INVOICE_PAGE_SIZE = 4;

  // Danh sách các quán thuê nền tảng A2Order
  const [stores, setStores] = useState<TenantStoreRecord[]>([
    {
      id: "s1",
      name: "Phở Bò Nam Định - Chi nhánh 1",
      owner: "Nguyễn Thành An",
      phone: "0912 345 678",
      address: "128 Phố Huế, Hai Bà Trưng, Hà Nội",
      tableCount: 18,
      licenseKey: "A2-PRO-9F8A2B",
      plan: "PRO",
      status: "ACTIVE",
      activatedAt: "01/09/2026",
      expiresAt: "01/10/2026",
      daysLeft: 28,
      pingMs: 12,
      activeDevices: 4,
      configVer: "v1.0.3",
      businessType: "SPICY_NOODLE",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_KDS,
        AppModule.MODULE_QR_ORDER,
        AppModule.MODULE_LANDING_PAGE,
        AppModule.MODULE_ADVANCED_ANALYTICS,
      ],
    },
    {
      id: "s2",
      name: "Bún Chả Cầu Giấy (Quán Nhỏ)",
      owner: "Trần Thị Mai",
      phone: "0988 123 456",
      address: "45 Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
      tableCount: 8,
      licenseKey: "A2-STARTER-77X1A",
      plan: "STARTER",
      status: "ACTIVE",
      activatedAt: "15/09/2026",
      expiresAt: "15/10/2026",
      daysLeft: 14,
      pingMs: 16,
      activeDevices: 2,
      configVer: "v1.0.1",
      businessType: "SNACK_SHOP",
      modules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER],
    },
    {
      id: "s3",
      name: "Cà Phê Muối Chú Long",
      owner: "Lê Văn Hùng",
      phone: "0905 999 888",
      address: "88 Trần Phú, Ba Đình, Hà Nội",
      tableCount: 12,
      licenseKey: "A2-GROWTH-31AA0",
      plan: "GROWTH",
      status: "EXPIRING_SOON",
      activatedAt: "30/08/2026",
      expiresAt: "30/09/2026",
      daysLeft: 2,
      pingMs: 22,
      activeDevices: 3,
      configVer: "v1.0.0",
      businessType: "COFFEE_SHOP",
      modules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER, AppModule.MODULE_KDS],
    },
    {
      id: "s4",
      name: "Lẩu Nướng Phố Cổ",
      owner: "Vũ Hải Đăng",
      phone: "0934 555 777",
      address: "12 Hàng Buồm, Hoàn Kiếm, Hà Nội",
      tableCount: 25,
      licenseKey: "A2-PRO-EXPIRED",
      plan: "PRO",
      status: "EXPIRED",
      activatedAt: "10/08/2026",
      expiresAt: "10/09/2026",
      daysLeft: 0,
      pingMs: 0,
      activeDevices: 0,
      configVer: "v1.0.5",
      businessType: "BEER_GARDEN",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_KDS,
        AppModule.MODULE_ACCOUNTING,
        AppModule.MODULE_LANDING_PAGE,
      ],
    },
  ]);

  // Danh sách hóa đơn cước thuê phần mềm
  const [invoices, setInvoices] = useState<SoftwareInvoiceRecord[]>([
    {
      id: "inv-1",
      invoiceCode: "INV-2026-0045",
      storeId: "s1",
      storeName: "Phở Bò Nam Định - Chi nhánh 1",
      plan: "Gói Chuỗi Chuyên Nghiệp (PRO)",
      durationMonths: 6,
      subTotal: 3594000,
      discountAmount: 600000,
      finalAmount: 2994000,
      status: "PAID",
      paymentMethod: "VIETQR",
      createdAt: "20/09/2026",
      paidAt: "20/09/2026 14:30",
    },
    {
      id: "inv-2",
      invoiceCode: "INV-2026-0046",
      storeId: "s3",
      storeName: "Cà Phê Muối Chú Long",
      plan: "Gói Quán Vừa (GROWTH)",
      durationMonths: 3,
      subTotal: 1197000,
      discountAmount: 100000,
      finalAmount: 1097000,
      status: "PENDING",
      paymentMethod: "VIETQR",
      createdAt: "28/09/2026",
    },
    {
      id: "inv-3",
      invoiceCode: "INV-2026-0047",
      storeId: "s2",
      storeName: "Bún Chả Cầu Giấy (Quán Nhỏ)",
      plan: "Gói Quán Nhỏ Tiết Kiệm (STARTER)",
      durationMonths: 12,
      subTotal: 2388000,
      discountAmount: 400000,
      finalAmount: 1988000,
      status: "PAID",
      paymentMethod: "VIETQR",
      createdAt: "15/09/2026",
      paidAt: "15/09/2026 10:15",
    },
  ]);

  // Nhật ký kiểm toán hệ thống
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogRecord[]>([
    {
      id: "a1",
      action: "EXTEND_LICENSE",
      storeName: "Phở Bò Nam Định",
      actor: "superadmin@a2order.vn",
      actorRole: "SUPER_ADMIN",
      ipAddress: "14.225.24.12",
      timestamp: "18:45 Hôm nay",
      details: "Gia hạn hợp đồng thuê 6 tháng. Cập nhật License Key A2-PRO-9F8A2B",
      status: "SUCCESS",
    },
    {
      id: "a2",
      action: "CONFIRM_INVOICE",
      storeName: "Bún Chả Cầu Giấy",
      actor: "superadmin@a2order.vn",
      actorRole: "SUPER_ADMIN",
      ipAddress: "14.225.24.12",
      timestamp: "15:20 Hôm nay",
      details: "Xác nhận đã nhận 1.988.000đ qua VietQR. Mở khóa gói STARTER 12 tháng",
      status: "SUCCESS",
    },
    {
      id: "a3",
      action: "AUTH_LOGIN",
      storeName: "Nền tảng A2Order",
      actor: "superadmin@a2order.vn",
      actorRole: "SUPER_ADMIN",
      ipAddress: "14.225.24.12",
      timestamp: "12:00 Hôm nay",
      details: "Đăng nhập Super Admin với chứng chỉ Zero-Knowledge",
      status: "SUCCESS",
    },
    {
      id: "a4",
      action: "CONFIG_CHANGE",
      storeName: "Phở Bò Nam Định",
      actor: "an.owner@a2order.vn",
      actorRole: "STORE_OWNER",
      ipAddress: "118.70.182.4",
      timestamp: "11:30 Hôm nay",
      details: "Chủ quán xuất bản cấu hình thực đơn v1.0.3",
      status: "SUCCESS",
    },
  ]);

  // Modal Cấp Mới / Gia Hạn License Key
  const [licenseTargetStore, setLicenseTargetStore] = useState<TenantStoreRecord | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(6);
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "GROWTH" | "PRO">("PRO");

  // Modal Đăng Ký Quán Mới (Onboarding)
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState<1 | 2>(1); // Step 1: Loại quán, Step 2: Thông tin & module
  const [newStoreForm, setNewStoreForm] = useState({
    name: "",
    owner: "",
    phone: "",
    address: "",
    tableCount: 10,
    businessType: null as BusinessType | null,
    plan: "STARTER" as "STARTER" | "GROWTH" | "PRO",
    durationMonths: 1,
    modules: [AppModule.CORE_POS] as AppModule[],
  });

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

  const handleGenerateLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const keyCode = `A2-${newLicensePlan}-${randomHex}`;
    const targetStore = stores.find((s) => s.id === newLicenseStoreId);

    const now = new Date();
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + newLicenseDuration);

    const newKey: LicenseKeyRecord = {
      id: `lic-${Date.now()}`,
      keyCode,
      storeName: targetStore?.name,
      storeId: targetStore?.id,
      plan: newLicensePlan,
      maxDevices: newLicenseDevices,
      durationMonths: newLicenseDuration,
      issuedAt: now.toLocaleDateString("vi-VN"),
      expiresAt: expDate.toLocaleDateString("vi-VN"),
      status: targetStore ? "ACTIVE" : "UNASSIGNED",
      modules:
        newLicensePlan === "PRO"
          ? [
              AppModule.CORE_POS,
              AppModule.MODULE_KDS,
              AppModule.MODULE_QR_ORDER,
              AppModule.MODULE_ADVANCED_ANALYTICS,
              AppModule.MODULE_LANDING_PAGE,
            ]
          : newLicensePlan === "GROWTH"
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
                plan: newLicensePlan,
                status: "ACTIVE",
                daysLeft: newLicenseDuration * 30,
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
        storeName: targetStore?.name || "Standalone Key",
        details: `Cấp License Key ${keyCode} (${newLicensePlan}, ${newLicenseDuration} tháng, max ${newLicenseDevices} máy)`,
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

  // Modal Xem Hóa Đơn VietQR
  const [viewingInvoice, setViewingInvoice] = useState<SoftwareInvoiceRecord | null>(null);

  // Refresh Telemetry
  const handleRefreshTelemetry = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Đã đồng bộ thông số Telemetry và ping 3 miền thời gian thực!");
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
  const handleSaveLicense = () => {
    if (!licenseTargetStore) return;

    const pricePerMonth = selectedPlan === "STARTER" ? 199000 : selectedPlan === "GROWTH" ? 399000 : 599000;
    const subTotal = pricePerMonth * selectedDuration;
    const discount = selectedDuration >= 12 ? Math.round(subTotal * 0.2) : selectedDuration >= 6 ? Math.round(subTotal * 0.1) : 0;
    const finalAmount = subTotal - discount;

    const newKey = `A2-${selectedPlan}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Cập nhật trạng thái quán
    setStores((prev) =>
      prev.map((s) =>
        s.id === licenseTargetStore.id
          ? {
              ...s,
              plan: selectedPlan,
              status: "ACTIVE",
              daysLeft: s.daysLeft + selectedDuration * 30,
              licenseKey: newKey,
            }
          : s
      )
    );

    // Tự động tạo hóa đơn thuê phần mềm mới
    const newInvoice: SoftwareInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceCode: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: licenseTargetStore.id,
      storeName: licenseTargetStore.name,
      plan: `Gói ${selectedPlan === "STARTER" ? "Quán Nhỏ (STARTER)" : selectedPlan === "GROWTH" ? "Quán Vừa (GROWTH)" : "Chuỗi Chuyên Nghiệp (PRO)"}`,
      durationMonths: selectedDuration,
      subTotal,
      discountAmount: discount,
      finalAmount,
      status: "PENDING",
      paymentMethod: "VIETQR",
      createdAt: "Vừa xong",
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    toast.success(`Đã cấp License Key mới [${newKey}] cho ${licenseTargetStore.name} và tạo hóa đơn thuê phần mềm!`);
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

    setStores((prev) =>
      prev.map((s) =>
        s.id === store.id ? { ...s, status: isSuspending ? "SUSPENDED" : "ACTIVE" } : s
      )
    );
    toast.info(`Đã ${isSuspending ? "tạm khóa" : "mở khóa"} quán ${store.name}`);
  };

  // Tạo quán mới từ modal onboarding
  const handleCreateNewStore = () => {
    const { name, owner, phone, businessType, plan, durationMonths, modules, address, tableCount } = newStoreForm;
    if (!name.trim() || !owner.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên quán, chủ quán và số điện thoại");
      return;
    }
    if (!businessType) {
      toast.error("Vui lòng chọn loại hình kinh doanh");
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
    toast.success(`Đã đăng ký quán "${name}" với License Key [${newKey}]! Hóa đơn chờ xác nhận thanh toán.`);

    // Reset form
    setIsNewStoreModalOpen(false);
    setOnboardStep(1);
    setNewStoreForm({
      name: "", owner: "", phone: "", address: "", tableCount: 10,
      businessType: null, plan: "STARTER", durationMonths: 1,
      modules: [AppModule.CORE_POS],
    });
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-2xl font-black text-ink-primary tracking-tight">
              <span className="sm:hidden">Điều Hành Nền Tảng</span>
              <span className="hidden sm:inline">Trung Tâm Điều Hành Nền Tảng (Super Admin)</span>
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px] whitespace-nowrap shrink-0">
              <span className="sm:hidden">Zero-Knowledge</span>
              <span className="hidden sm:inline">Zero-Knowledge Architecture</span>
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
            Giám sát độ trễ mạng, cấp License và bảo mật dữ liệu quán.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs bg-white border-surface-border text-ink-primary font-bold shadow-xs whitespace-nowrap shrink-0"
            onClick={() => setIsCreateLicenseModalOpen(true)}
          >
            <Icon name="key" className="w-3.5 h-3.5 text-brand-900" />
            <span className="sm:hidden">Cấp Key</span>
            <span className="hidden sm:inline">Cấp License Key</span>
          </Button>

          <Button
            size="sm"
            className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white font-bold shadow-sm whitespace-nowrap shrink-0"
            onClick={() => { setIsNewStoreModalOpen(true); setOnboardStep(1); }}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span className="sm:hidden">+ Quán Mới</span>
            <span className="hidden sm:inline">Đăng Ký Quán Mới</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs bg-white whitespace-nowrap shrink-0"
            onClick={handleRefreshTelemetry}
            disabled={isRefreshing}
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sm:hidden">Đo Ping</span>
            <span className="hidden sm:inline">Đo Lại Ping</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-surface-border pb-2.5 overflow-x-auto no-scrollbar text-xs font-bold">
        {[
          { id: "tenants", label: `Quản Lý Quán Thuê (${stores.length})`, shortLabel: `Quán Thuê (${stores.length})`, icon: "building" },
          { id: "licenses", label: `Cấp License Key (${licenses.length})`, shortLabel: `License (${licenses.length})`, icon: "key" },
          { id: "invoices", label: `Hóa Đơn Thuê Phần Mềm (${invoices.length})`, shortLabel: `Hóa Đơn (${invoices.length})`, icon: "fileText" },
          { id: "telemetry", label: "Giám Sát Hạ Tầng & Sức Khỏe Mạng", shortLabel: "Hạ Tầng & Ping", icon: "activity" },
          { id: "audit", label: `Nhật Ký Kiểm Toán (${auditLogs.length})`, shortLabel: `Kiểm Toán (${auditLogs.length})`, icon: "history" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSwitchTab(tab.id as any)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-brand-900 text-white shadow-sm font-black"
                : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary hover:border-brand-200"
            }`}
          >
            <Icon name={tab.icon as any} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: QUẢN LÝ QUÁN THUÊ & LICENSE KEY */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink-primary flex items-center gap-2">
                  <Icon name="building" className="w-4 h-4 text-brand-800 shrink-0" />
                  <span className="sm:hidden">Danh Sách Quán Thuê</span>
                  <span className="hidden sm:inline">Danh Sách Quán Thuê & Tốc Độ Đường Truyền</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Quản lý gói tính năng theo quy mô, cấp License Key và theo dõi thiết bị POS online
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

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="pb-3 px-3">Tên Quán / Chủ Sở Hữu</th>
                    <th className="pb-3 px-3">Gói Thuê & Quy Mô</th>
                    <th className="pb-3 px-3">Mã License Key</th>
                    <th className="pb-3 px-3">Hạn Dùng</th>
                    <th className="pb-3 px-3">Độ Trễ Ping / Online</th>
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
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              s.plan === "PRO"
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : s.plan === "GROWTH"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {s.plan === "PRO" ? "Chuỗi Pro (599k)" : s.plan === "GROWTH" ? "Quán Vừa (399k)" : "Quán Nhỏ (199k)"}
                          </span>
                          <div className="text-[10px] text-ink-muted mt-1">{s.tableCount} bàn</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-ink-primary">
                            {s.licenseKey}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
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
                          {s.pingMs > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="font-bold text-ink-primary">{s.pingMs}ms</span>
                              <span className="text-[10px] text-ink-muted">({s.activeDevices} máy)</span>
                            </div>
                          ) : (
                            <span className="text-ink-subtle">Offline</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingStoreDetails(s)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white border border-surface-border text-ink-primary hover:border-brand-300 hover:text-brand-900 transition-colors shadow-xs"
                            >
                              Hồ Sơ Quán
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setLicenseTargetStore(s);
                                setSelectedPlan(s.plan === "STARTER" || s.plan === "GROWTH" || s.plan === "PRO" ? s.plan : "PRO");
                              }}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors"
                            >
                              Gia Hạn Key
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStoreStatus(s)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                                s.status === "SUSPENDED"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              {s.status === "SUSPENDED" ? "Mở khóa" : "Khóa quán"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
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

            {/* License Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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

      {/* TAB 3: GIÁM SÁT HẠ TẦNG & SỨC KHỎE MẠNG (TELEMETRY) */}
      {activeTab === "telemetry" && (
        <div className="space-y-6">
          {/* 4 Thẻ KPI Hạ Tầng - 2 cột trên mobile, 4 cột trên desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <Panel variant="featured" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-brand-200 truncate">Độ Trễ Ping</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name="wifi" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">14.6</span>
                <span className="text-xs text-brand-200 ml-1">ms</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 truncate">Đường truyền ổn định</span>
            </Panel>

            <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-ink-muted truncate">Thiết Bị POS</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                  <Icon name="activity" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-800" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">9</span>
                <span className="text-[10px] sm:text-xs text-ink-muted ml-1">online</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted truncate">Sync thời gian thực</span>
            </Panel>

            <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-ink-muted truncate">Bộ Nhớ RAM</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                  <Icon name="server" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </div>
              <div className="my-1 sm:my-2">
                <span className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">96 MB</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit truncate">
                CPU: 1.1%
              </span>
            </Panel>

            <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-ink-muted truncate">Bảo Mật</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                  <Icon name="shield" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                </div>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black text-ink-primary">100% Bảo Mật</span>
              </div>
              <p className="text-[10px] text-ink-muted leading-tight truncate">
                Bảo vệ bí mật kinh doanh
              </p>
            </Panel>
          </div>

          {/* Kiểm tra Ping theo vùng địa lý */}
          <Panel variant="default" padding="lg">
            <h3 className="font-black text-base text-ink-primary flex items-center gap-2 mb-3">
              <Icon name="globe" className="w-4 h-4 text-brand-900" />
              <span>Độ Trễ Cụm Máy Chủ Theo Vùng (3 Miền)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink-primary">Miền Bắc (Hà Nội DC)</span>
                  <span className="text-xs font-black text-emerald-700">8 - 12 ms</span>
                </div>
                <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div className="w-[12%] h-full bg-emerald-600 rounded-full" />
                </div>
                <span className="text-[10px] text-ink-muted block">Trạng thái: Xuất sắc</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink-primary">Miền Trung (Đà Nẵng DC)</span>
                  <span className="text-xs font-black text-emerald-700">14 - 18 ms</span>
                </div>
                <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div className="w-[18%] h-full bg-emerald-600 rounded-full" />
                </div>
                <span className="text-[10px] text-ink-muted block">Trạng thái: Ổn định</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink-primary">Miền Nam (TP. Hồ Chí Minh)</span>
                  <span className="text-xs font-black text-emerald-700">18 - 24 ms</span>
                </div>
                <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div className="w-[24%] h-full bg-emerald-600 rounded-full" />
                </div>
                <span className="text-[10px] text-ink-muted block">Trạng thái: Ổn định</span>
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
                    <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-ink-primary">
                      {log.action}
                    </span>
                    <span className="font-bold text-ink-primary">{log.storeName}</span>
                    <span className="text-[10px] text-ink-muted">• {log.timestamp}</span>
                    <span className="text-[10px] text-ink-subtle font-mono">IP: {log.ipAddress}</span>
                  </div>
                  <p className="text-xs text-ink-secondary mt-1">{log.details}</p>
                </div>
                <span className="text-[11px] font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-md w-fit">
                  {log.actor}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Modal Cấp Mới / Gia Hạn License Key */}
      {licenseTargetStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="key" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Cấp & Gia Hạn License Key</h3>
                  <p className="text-xs text-ink-muted">
                    Quán: <span className="font-bold text-ink-primary">{licenseTargetStore.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLicenseTargetStore(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Chọn Gói theo quy mô quán */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-secondary">
                  Chọn Quy Mô Quán & Gói Tính Năng:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "STARTER", name: "Quán Nhỏ", price: "199k/tháng", desc: "1-2 người, POS cơ bản" },
                    { id: "GROWTH", name: "Quán Vừa", price: "399k/tháng", desc: "POS + Bếp KDS + QR" },
                    { id: "PRO", name: "Chuỗi Pro", price: "599k/tháng", desc: "Đầy đủ Landing + Báo cáo" },
                  ].map((p) => {
                    const isSelected = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id as any)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? "border-brand-900 bg-brand-50/60 shadow-sm"
                            : "border-surface-border bg-surface-canvas hover:border-brand-200"
                        }`}
                      >
                        <div className={`text-xs font-black ${isSelected ? "text-brand-950" : "text-ink-primary"}`}>
                          {p.name}
                        </div>
                        <div className="text-xs font-extrabold text-brand-900 mt-0.5">{p.price}</div>
                        <div className="text-[10px] text-ink-muted mt-1 leading-tight">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn Kỳ Hạn Thuê */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-secondary">
                  Chọn Kỳ Hạn Thuê Phần Mềm:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { months: 1, label: "1 tháng", discount: "" },
                    { months: 3, label: "3 tháng", discount: "" },
                    { months: 6, label: "6 tháng", discount: "Giảm 10%" },
                    { months: 12, label: "12 tháng", discount: "Giảm 20%" },
                  ].map((d) => {
                    const isSelected = selectedDuration === d.months;
                    return (
                      <button
                        key={d.months}
                        type="button"
                        onClick={() => setSelectedDuration(d.months)}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          isSelected
                            ? "border-brand-900 bg-brand-900 text-white font-black"
                            : "border-surface-border bg-surface-canvas text-ink-secondary hover:text-ink-primary"
                        }`}
                      >
                        <div className="text-xs">{d.label}</div>
                        {d.discount && (
                          <div className={`text-[9px] mt-0.5 ${isSelected ? "text-brand-200" : "text-emerald-700 font-bold"}`}>
                            {d.discount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tóm tắt cước và License sinh ra */}
              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Cước thuê:</span>
                  <span className="font-bold text-ink-primary">
                    {(
                      (selectedPlan === "STARTER" ? 199000 : selectedPlan === "GROWTH" ? 399000 : 599000) *
                      selectedDuration
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                </div>
                {selectedDuration >= 6 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Ưu đãi thời hạn:</span>
                    <span>
                      -
                      {Math.round(
                        (selectedPlan === "STARTER" ? 199000 : selectedPlan === "GROWTH" ? 399000 : 599000) *
                          selectedDuration *
                          (selectedDuration >= 12 ? 0.2 : 0.1)
                      ).toLocaleString("vi-VN")}{" "}
                      đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-brand-950 pt-2 border-t border-surface-border">
                  <span>TỔNG TIỀN HỢP ĐỒNG:</span>
                  <span>
                    {(
                      (selectedPlan === "STARTER" ? 199000 : selectedPlan === "GROWTH" ? 399000 : 599000) *
                        selectedDuration -
                      (selectedDuration >= 6
                        ? Math.round(
                            (selectedPlan === "STARTER" ? 199000 : selectedPlan === "GROWTH" ? 399000 : 599000) *
                              selectedDuration *
                              (selectedDuration >= 12 ? 0.2 : 0.1)
                          )
                        : 0)
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setLicenseTargetStore(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm"
                onClick={handleSaveLicense}
              >
                Tạo Hóa Đơn & Gia Hạn Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Hóa Đơn & QR Thanh Toán Thuê Phần Mềm */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp text-center">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-black text-ink-primary uppercase">
                HÓA ĐƠN THUÊ PHẦN MỀM SAAS
              </h3>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-black text-brand-900 text-base">{viewingInvoice.storeName}</div>
              <div className="font-mono text-ink-muted">{viewingInvoice.invoiceCode}</div>
              <div className="text-ink-secondary">{viewingInvoice.plan} • {viewingInvoice.durationMonths} tháng</div>
            </div>

            {/* QR VietQR thanh toán cước thuê */}
            <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border flex flex-col items-center">
              <div className="w-44 h-44 bg-white p-2 rounded-xl border border-surface-border shadow-sm flex items-center justify-center">
                <img
                  src={`https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=${viewingInvoice.finalAmount}&addInfo=${encodeURIComponent(
                    viewingInvoice.invoiceCode
                  )}&accountName=A2ORDER%20PLATFORM`}
                  alt="VietQR SaaS"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-ink-muted mt-2">
                Nội dung CK: <strong className="text-brand-900">{viewingInvoice.invoiceCode}</strong>
              </span>
              <span className="text-sm font-black text-brand-950 mt-1">
                {viewingInvoice.finalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-1/2 rounded-xl text-xs"
                onClick={() => setViewingInvoice(null)}
              >
                Đóng
              </Button>
              {viewingInvoice.status === "PENDING" && (
                <Button
                  type="button"
                  size="sm"
                  className="w-1/2 rounded-xl bg-brand-900 text-white text-xs shadow-sm"
                  onClick={() => handleConfirmInvoice(viewingInvoice)}
                >
                  Duyệt Đã Thu Tiền
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL ĐĂNG KÝ QUÁN MỚI (2 STEP ONBOARDING) ===================== */}
      {isNewStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-canvas shrink-0">
              <div>
                <h3 className="text-sm font-black text-ink-primary">
                  Đăng Ký Quán Thuê Mới
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-1 w-16 rounded-full ${onboardStep >= 1 ? "bg-brand-900" : "bg-surface-muted"}`} />
                  <div className={`h-1 w-16 rounded-full ${onboardStep >= 2 ? "bg-brand-900" : "bg-surface-muted"}`} />
                  <span className="text-[10px] text-ink-muted font-bold">Bước {onboardStep}/2</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsNewStoreModalOpen(false); setOnboardStep(1); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* STEP 1: Chọn loại hình kinh doanh */}
              {onboardStep === 1 && (
                <div className="p-6 space-y-5">
                  <div>
                    <h4 className="text-sm font-black text-ink-primary mb-1">
                      Quán kinh doanh loại hình nào?
                    </h4>
                    <p className="text-xs text-ink-muted">
                      Chọn đúng loại hình để hệ thống gợi ý bộ tính năng phù hợp nhất cho quán.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.entries(BUSINESS_TYPE_CONFIG) as [BusinessType, typeof BUSINESS_TYPE_CONFIG[BusinessType]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewStoreForm((f) => ({
                          ...f,
                          businessType: key,
                          modules: [...cfg.suggestedModules],
                        }))}
                        className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                          newStoreForm.businessType === key
                            ? "border-brand-800 bg-brand-50 shadow-sm"
                            : "border-surface-border bg-white hover:border-brand-300 hover:bg-surface-canvas"
                        }`}
                      >
                        <span className="text-2xl">{cfg.emoji}</span>
                        <span className="text-[11px] font-extrabold text-ink-primary leading-tight">{cfg.label}</span>
                        <span className="text-[10px] text-ink-muted leading-tight">{cfg.description}</span>
                        {newStoreForm.businessType === key && (
                          <span className="w-5 h-5 rounded-full bg-brand-900 flex items-center justify-center">
                            <Icon name="check" className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {newStoreForm.businessType && (
                    <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200">
                      <p className="text-xs font-bold text-brand-900 mb-2">
                        Module gợi ý cho {BUSINESS_TYPE_CONFIG[newStoreForm.businessType].label}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {newStoreForm.modules.map((m) => (
                          <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-900 text-white">
                            {m.replace("MODULE_", "").replace("CORE_", "").replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Thông tin quán & gói thuê */}
              {onboardStep === 2 && (
                <div className="p-6 space-y-4">
                  <h4 className="text-sm font-black text-ink-primary flex items-center gap-2">
                    <span className="text-xl">{newStoreForm.businessType ? BUSINESS_TYPE_CONFIG[newStoreForm.businessType].emoji : "🏪"}</span>
                    Thông Tin Quán & Hợp Đồng Thuê
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-extrabold text-ink-muted mb-1 block">Tên Quán *</label>
                      <input
                        type="text"
                        value={newStoreForm.name}
                        onChange={(e) => setNewStoreForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="VD: Quán Phở Hà Nội - Chi nhánh Q1"
                        className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-ink-muted mb-1 block">Tên Chủ Quán *</label>
                      <input
                        type="text"
                        value={newStoreForm.owner}
                        onChange={(e) => setNewStoreForm((f) => ({ ...f, owner: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-ink-muted mb-1 block">Số Điện Thoại *</label>
                      <input
                        type="tel"
                        value={newStoreForm.phone}
                        onChange={(e) => setNewStoreForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="0912 345 678"
                        className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-extrabold text-ink-muted mb-1 block">Địa Chỉ</label>
                      <input
                        type="text"
                        value={newStoreForm.address}
                        onChange={(e) => setNewStoreForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="128 Phố Huế, Hai Bà Trưng, Hà Nội"
                        className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-ink-muted mb-1 block">Số Bàn</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={newStoreForm.tableCount}
                        onChange={(e) => setNewStoreForm((f) => ({ ...f, tableCount: Number(e.target.value) }))}
                        className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-ink-muted mb-1 block">Thời Hạn Thuê (tháng)</label>
                      <select
                        value={newStoreForm.durationMonths}
                        onChange={(e) => setNewStoreForm((f) => ({ ...f, durationMonths: Number(e.target.value) }))}
                        className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                      >
                        {[1, 3, 6, 12].map((m) => (
                          <option key={m} value={m}>
                            {m} tháng {m >= 12 ? "(-20%)" : m >= 6 ? "(-10%)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Gói plan */}
                  <div>
                    <label className="text-xs font-extrabold text-ink-muted mb-2 block">Gói Tính Năng</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["STARTER", "GROWTH", "PRO"] as const).map((plan) => (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => setNewStoreForm((f) => ({ ...f, plan }))}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                            newStoreForm.plan === plan
                              ? plan === "PRO" ? "border-purple-600 bg-purple-50" : plan === "GROWTH" ? "border-blue-500 bg-blue-50" : "border-emerald-500 bg-emerald-50"
                              : "border-surface-border bg-white hover:border-surface-muted"
                          }`}
                        >
                          <div className="text-xs font-black text-ink-primary">{plan}</div>
                          <div className="text-[10px] text-ink-muted">
                            {plan === "STARTER" ? "199k/tháng" : plan === "GROWTH" ? "399k/tháng" : "599k/tháng"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tóm tắt chi phí */}
                  {(() => {
                    const price = newStoreForm.plan === "STARTER" ? 199000 : newStoreForm.plan === "GROWTH" ? 399000 : 599000;
                    const sub = price * newStoreForm.durationMonths;
                    const disc = newStoreForm.durationMonths >= 12 ? Math.round(sub * 0.2) : newStoreForm.durationMonths >= 6 ? Math.round(sub * 0.1) : 0;
                    return (
                      <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-1">
                        <div className="flex justify-between text-ink-muted">
                          <span>Tạm tính ({newStoreForm.durationMonths} tháng)</span>
                          <span className="font-bold">{sub.toLocaleString("vi-VN")} đ</span>
                        </div>
                        {disc > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Chiết khấu dài hạn</span>
                            <span className="font-bold">-{disc.toLocaleString("vi-VN")} đ</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-brand-900 border-t border-brand-200 pt-1">
                          <span>Tổng thanh toán</span>
                          <span>{(sub - disc).toLocaleString("vi-VN")} đ</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-surface-border bg-surface-canvas shrink-0">
              {onboardStep === 2 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setOnboardStep(1)}
                >
                  ← Quay Lại
                </Button>
              ) : (
                <div />
              )}

              {onboardStep === 1 ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-6"
                  disabled={!newStoreForm.businessType}
                  onClick={() => setOnboardStep(2)}
                >
                  Tiếp Tục →
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-6 shadow-sm"
                  onClick={handleCreateNewStore}
                >
                  Xác Nhận Đăng Ký & Tạo Key
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL CẤP LICENSE KEY MỚI ===================== */}
      {isCreateLicenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-canvas shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900">
                  <Icon name="key" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-ink-primary">
                    Cấp License Key Bản Quyền
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Khởi tạo khóa bản quyền cho máy POS / KDS của đối tác
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateLicenseModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerateLicenseKey} className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Chọn Quán Áp Dụng */}
              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                  Quán Áp Dụng License Key:
                </label>
                <select
                  value={newLicenseStoreId}
                  onChange={(e) => setNewLicenseStoreId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                >
                  <option value="UNASSIGNED">-- Chưa gán (Mã Key dự phòng, kích hoạt sau) --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.owner} - {s.phone})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-ink-muted mt-1">
                  Nếu chưa gán quán, mã key có thể cung cấp cho quán đối tác tự nhập kích hoạt trên máy POS.
                </p>
              </div>

              {/* Chọn Gói Bản Quyền */}
              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1.5 block">
                  Gói Bản Quyền (License Tier):
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "STARTER",
                      name: "STARTER",
                      price: "199.000đ/tháng",
                      devices: "Max 2 máy",
                      desc: "POS Thu ngân + QR Menu",
                      border: "hover:border-emerald-400",
                      active: "border-emerald-600 bg-emerald-50 text-emerald-950",
                    },
                    {
                      id: "GROWTH",
                      name: "GROWTH",
                      price: "399.000đ/tháng",
                      devices: "Max 4 máy",
                      desc: "POS + QR + Màn hình Bếp KDS",
                      border: "hover:border-blue-400",
                      active: "border-blue-600 bg-blue-50 text-blue-950",
                    },
                    {
                      id: "PRO",
                      name: "PRO",
                      price: "599.000đ/tháng",
                      devices: "Max 10 máy",
                      desc: "Toàn bộ module + Kế toán & Web",
                      border: "hover:border-purple-400",
                      active: "border-purple-600 bg-purple-50 text-purple-950",
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setNewLicensePlan(p.id as any);
                        if (p.id === "STARTER") setNewLicenseDevices(2);
                        else if (p.id === "GROWTH") setNewLicenseDevices(4);
                        else setNewLicenseDevices(8);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        newLicensePlan === p.id
                          ? p.active
                          : `border-surface-border bg-white ${p.border}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{p.name}</span>
                        {newLicensePlan === p.id && (
                          <span className="w-4 h-4 rounded-full bg-brand-900 text-white flex items-center justify-center">
                            <Icon name="check" className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-black text-brand-900 mt-0.5">{p.price}</div>
                      <div className="text-[10px] text-ink-muted mt-1 leading-tight">{p.desc}</div>
                      <div className="text-[9px] font-bold text-ink-secondary mt-1 bg-surface-muted/60 px-1.5 py-0.5 rounded inline-block">
                        {p.devices}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Thời hạn bản quyền & Số máy tối đa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                    Kỳ Hạn Thuê (Tháng):
                  </label>
                  <select
                    value={newLicenseDuration}
                    onChange={(e) => setNewLicenseDuration(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                  >
                    <option value={1}>1 tháng (Dùng thử / Gia hạn ngắn)</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng (Ưu đãi giảm 10%)</option>
                    <option value={12}>12 tháng (1 năm - Giảm 20%)</option>
                    <option value={24}>24 tháng (2 năm - Giảm 30%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                    Giới Hạn Máy Kết Nối Cùng Lúc:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newLicenseDevices}
                    onChange={(e) => setNewLicenseDevices(Math.max(1, Number(e.target.value)))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                  />
                </div>
              </div>

              {/* Tóm tắt License & Kiến trúc */}
              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Mã Key dự kiến:</span>
                  <span className="font-mono font-bold text-brand-950 bg-white px-2 py-0.5 rounded border border-surface-border">
                    A2-{newLicensePlan}-XXXXXX
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Quyền truy cập Module:</span>
                  <span className="font-bold text-ink-primary">
                    {newLicensePlan === "PRO"
                      ? "Full Modules (POS + KDS + QR + Báo Cáo + Web)"
                      : newLicensePlan === "GROWTH"
                      ? "Core POS + Bếp KDS + QR Order"
                      : "Core POS + QR Order"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <Icon name="shield" className="w-3.5 h-3.5 shrink-0" />
                  <span>Mã Key mã hóa SHA-256 xác thực độc lập trên từng điểm bán (Edge-First).</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsCreateLicenseModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-6 shadow-sm font-bold gap-2"
                >
                  <Icon name="key" className="w-3.5 h-3.5" />
                  <span>Khởi Tạo & Kích Hoạt Key</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL CHI TIẾT HỒ SƠ QUÁN (STORE DOSSIER) ===================== */}
      {viewingStoreDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-canvas shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-2xl shadow-xs">
                  {viewingStoreDetails.businessType && BUSINESS_TYPE_CONFIG[viewingStoreDetails.businessType]?.emoji
                    ? BUSINESS_TYPE_CONFIG[viewingStoreDetails.businessType].emoji
                    : "🏪"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-ink-primary tracking-tight">
                      {viewingStoreDetails.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        viewingStoreDetails.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : viewingStoreDetails.status === "EXPIRING_SOON"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : viewingStoreDetails.status === "EXPIRED"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {viewingStoreDetails.status === "ACTIVE"
                        ? "Đang hoạt động"
                        : viewingStoreDetails.status === "EXPIRING_SOON"
                        ? `Sắp hết hạn (${viewingStoreDetails.daysLeft} ngày)`
                        : viewingStoreDetails.status === "EXPIRED"
                        ? "Hết hạn"
                        : "Tạm khóa"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Mã quán: <span className="font-mono font-bold text-ink-primary">{viewingStoreDetails.id}</span> • Loại hình:{" "}
                    <span className="font-bold text-brand-900">
                      {viewingStoreDetails.businessType && BUSINESS_TYPE_CONFIG[viewingStoreDetails.businessType]?.label
                        ? BUSINESS_TYPE_CONFIG[viewingStoreDetails.businessType].label
                        : "Nhà hàng & F&B"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingStoreDetails(null)}
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
                        {viewingStoreDetails.licenseKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(viewingStoreDetails.licenseKey)}
                        className="p-1 text-brand-800 hover:text-brand-950 hover:bg-white rounded transition-colors"
                        title="Sao chép License Key"
                      >
                        <Icon name="clipboard" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      viewingStoreDetails.plan === "PRO" ? "bg-purple-100 text-purple-900 border border-purple-200" :
                      viewingStoreDetails.plan === "GROWTH" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                      "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}>
                      Gói {viewingStoreDetails.plan}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingStoreDetails;
                        setViewingStoreDetails(null);
                        setLicenseTargetStore(target);
                        setSelectedPlan(target.plan === "STARTER" || target.plan === "GROWTH" || target.plan === "PRO" ? target.plan : "PRO");
                      }}
                      className="px-3 py-1 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-950 transition-colors shadow-xs"
                    >
                      Gia Hạn Ngay
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-ink-muted text-[10px] block">Kích hoạt:</span>
                    <span className="font-bold text-ink-primary">{viewingStoreDetails.activatedAt}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-[10px] block">Hết hạn:</span>
                    <span className="font-bold text-ink-primary">{viewingStoreDetails.expiresAt}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-[10px] block">Thời gian còn lại:</span>
                    <span className={`font-bold ${viewingStoreDetails.daysLeft <= 3 ? "text-rose-600 font-black" : "text-emerald-700"}`}>
                      {viewingStoreDetails.daysLeft} ngày
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-[10px] block">Quy mô bàn:</span>
                    <span className="font-bold text-ink-primary">{viewingStoreDetails.tableCount} bàn</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Thông tin liên hệ & Vận hành */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                  <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block">
                    Đại Diện Quán
                  </span>
                  <div className="space-y-1.5 font-medium">
                    <div className="flex items-center gap-2">
                      <Icon name="userCheck" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="text-ink-muted">Chủ quán:</span>
                      <span className="font-bold text-ink-primary">{viewingStoreDetails.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="phone" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="text-ink-muted">Điện thoại:</span>
                      <a href={`tel:${viewingStoreDetails.phone}`} className="font-bold text-brand-900 hover:underline">
                        {viewingStoreDetails.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="building" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="text-ink-muted">Địa chỉ:</span>
                      <span className="text-ink-primary truncate">{viewingStoreDetails.address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                  <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block">
                    Hạ Tầng & Sức Khỏe POS
                  </span>
                  <div className="space-y-1.5 font-medium">
                    <div className="flex items-center gap-2">
                      <Icon name="wifi" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="text-ink-muted">Độ trễ (Ping):</span>
                      {viewingStoreDetails.pingMs > 0 ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {viewingStoreDetails.pingMs}ms (Xuất sắc)
                        </span>
                      ) : (
                        <span className="text-ink-subtle">Mất kết nối</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="monitor" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="text-ink-muted">Thiết bị trực tuyến:</span>
                      <span className="font-bold text-ink-primary">{viewingStoreDetails.activeDevices} máy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="server" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="text-ink-muted">Bản phát hành config:</span>
                      <span className="font-mono text-ink-primary font-bold">{viewingStoreDetails.configVer}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Module chức năng được kích hoạt */}
              <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider">
                    Các Module Tính Năng Kích Hoạt ({viewingStoreDetails.modules.length})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Đã kiểm tra cấp phép
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {viewingStoreDetails.modules.map((m) => {
                    const label =
                      m === AppModule.CORE_POS
                        ? "POS Thu Ngân Bán Hàng"
                        : m === AppModule.MODULE_KDS
                        ? "Màn Hình Bếp / Bar KDS"
                        : m === AppModule.MODULE_QR_ORDER
                        ? "Gọi Món Tại Bàn Qua QR"
                        : m === AppModule.MODULE_ADVANCED_ANALYTICS
                        ? "Báo Cáo & Phân Tích Chuyên Sâu"
                        : m === AppModule.MODULE_ACCOUNTING
                        ? "Sổ Kế Toán & Quản Lý Ca Thuế"
                        : m === AppModule.MODULE_LANDING_PAGE
                        ? "Website Đặt Món Riêng"
                        : m;
                    return (
                      <div
                        key={m}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-surface-border text-ink-primary font-bold shadow-xs"
                      >
                        <Icon name="checkCircle" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 4: Lịch sử hóa đơn thuê phần mềm của quán */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                  Hóa Đơn Cước Thuê Của Quán
                </span>
                {invoices.filter((i) => i.storeId === viewingStoreDetails.id).length === 0 ? (
                  <p className="text-xs text-ink-muted italic">Chưa có hóa đơn cước phần mềm nào cho quán này.</p>
                ) : (
                  <div className="space-y-2">
                    {invoices
                      .filter((i) => i.storeId === viewingStoreDetails.id)
                      .map((inv) => (
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
                              onClick={() => {
                                setViewingInvoice(inv);
                              }}
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
                  viewingStoreDetails.status === "SUSPENDED"
                    ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    : "text-rose-700 border-rose-300 hover:bg-rose-50"
                }`}
                onClick={() => handleToggleStoreStatus(viewingStoreDetails)}
              >
                {viewingStoreDetails.status === "SUSPENDED" ? "Mở Khóa Quán" : "Tạm Khóa Quán Này"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                  onClick={() => setViewingStoreDetails(null)}
                >
                  Đóng Hồ Sơ
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                  onClick={() => {
                    const target = viewingStoreDetails;
                    setViewingStoreDetails(null);
                    setLicenseTargetStore(target);
                    setSelectedPlan(target.plan === "STARTER" || target.plan === "GROWTH" || target.plan === "PRO" ? target.plan : "PRO");
                  }}
                >
                  Gia Hạn Hợp Đồng Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

