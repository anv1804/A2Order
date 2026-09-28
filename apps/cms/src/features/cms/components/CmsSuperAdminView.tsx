import React, { useState, useMemo } from "react";
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

export const CmsSuperAdminView: React.FC<CmsSuperAdminViewProps> = ({ subView: initialSubView = "tenants" }) => {
  const [activeTab, setActiveTab] = useState<"tenants" | "invoices" | "telemetry" | "audit">(
    initialSubView === "telemetry"
      ? "telemetry"
      : initialSubView === "software_invoices" || initialSubView === "license_manager"
      ? "invoices"
      : initialSubView === "audit_logs"
      ? "audit"
      : "tenants"
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bộ lọc & Phân trang Quán thuê
  const [storeSearch, setStoreSearch] = useState("");
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>("ALL");
  const [tenantPage, setTenantPage] = useState(1);
  const TENANT_PAGE_SIZE = 4;

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
  const [auditLogs] = useState<SystemAuditLogRecord[]>([
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Trung Tâm Điều Hành Nền Tảng (Platform Super Admin)
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Zero-Knowledge Architecture
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Giám sát độ trễ mạng (Ping), cấp License Key theo quy mô quán, hóa đơn thuê phần mềm và bảo mật tuyệt đối bí mật kinh doanh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-xl gap-2 text-xs bg-brand-900 text-white"
            onClick={() => { setIsNewStoreModalOpen(true); setOnboardStep(1); }}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>Đăng Ký Quán Mới</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2 text-xs bg-white"
            onClick={handleRefreshTelemetry}
            disabled={isRefreshing}
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Đo Lại Ping</span>
          </Button>
        </div>
      </div>


      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto text-xs font-bold">
        {[
          { id: "tenants", label: `Quản Lý Quán Thuê (${stores.length})`, icon: "building" },
          { id: "invoices", label: `Hóa Đơn Thuê Phần Mềm (${invoices.length})`, icon: "fileText" },
          { id: "telemetry", label: "Giám Sát Hạ Tầng & Sức Khỏe Mạng", icon: "activity" },
          { id: "audit", label: `Nhật Ký Kiểm Toán (${auditLogs.length})`, icon: "history" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0 transition-all ${
              activeTab === tab.id
                ? "bg-brand-900 text-white shadow-sm font-black"
                : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary hover:border-brand-200"
            }`}
          >
            <Icon name={tab.icon as any} className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: QUẢN LÝ QUÁN THUÊ & LICENSE KEY */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-black text-ink-primary flex items-center gap-2">
                  <Icon name="building" className="w-4 h-4 text-brand-800" />
                  <span>Danh Sách Quán Thuê & Tốc Độ Đường Truyền</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Quản lý gói tính năng theo quy mô, cấp License Key và theo dõi thiết bị POS online
                </p>
              </div>
              <span className="text-xs font-bold text-ink-muted">Khớp {filteredStores.length} / {stores.length} quán</span>
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

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "ALL", label: "Tất Cả", count: stores.length },
                    { id: "ACTIVE", label: "🟢 Hoạt Động", count: stores.filter((s) => s.status === "ACTIVE").length },
                    { id: "EXPIRING_SOON", label: "⏳ Sắp Hết Hạn", count: stores.filter((s) => s.status === "EXPIRING_SOON").length },
                    { id: "EXPIRED", label: "⚠️ Đã Hết Hạn", count: stores.filter((s) => s.status === "EXPIRED").length },
                    { id: "SUSPENDED", label: "🔒 Tạm Khóa", count: stores.filter((s) => s.status === "SUSPENDED").length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setStoreStatusFilter(st.id);
                        setTenantPage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
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

      {/* TAB 2: HÓA ĐƠN THUÊ PHẦN MỀM (VIETQR SAAS INVOICES) */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3 mb-4">
              <div>
                <h3 className="font-black text-base text-ink-primary flex items-center gap-2">
                  <Icon name="fileText" className="w-4 h-4 text-brand-800" />
                  <span>Sổ Hóa Đơn Thuê Phần Mềm (VietQR SaaS Invoices)</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Quản lý các khoản phí thuê bao phần mềm và duyệt gia hạn tự động qua chuyển khoản VietQR
                </p>
              </div>

              {/* Lọc trạng thái hóa đơn */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: "ALL", label: "Tất Cả", count: invoices.length },
                  { id: "PAID", label: "Đã Thanh Toán", count: invoices.filter((i) => i.status === "PAID").length },
                  { id: "PENDING", label: "Chờ Duyệt", count: invoices.filter((i) => i.status === "PENDING").length },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setInvoiceStatusFilter(st.id);
                      setInvoicePage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
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
          {/* 4 Thẻ KPI Hạ Tầng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Panel variant="featured" padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-200">Độ Trễ Mạng Trung Bình</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon name="wifi" className="w-4 h-4 text-emerald-300" />
                </div>
              </div>
              <div className="my-2">
                <span className="text-3xl font-black tracking-tight">14.6</span>
                <span className="text-xs text-brand-200 ml-1">ms</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-300">Đường truyền cực kỳ ổn định</span>
            </Panel>

            <Panel variant="default" padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted">Thiết Bị POS / KDS Online</span>
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
                  <Icon name="activity" className="w-4 h-4 text-brand-800" />
                </div>
              </div>
              <div className="my-2">
                <span className="text-3xl font-black text-ink-primary tracking-tight">9</span>
                <span className="text-xs text-ink-muted ml-1">máy đang kết nối</span>
              </div>
              <span className="text-[11px] font-bold text-ink-muted">WebSocket Sync thời gian thực</span>
            </Panel>

            <Panel variant="default" padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted">Bộ Nhớ Server (RAM)</span>
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
                  <Icon name="server" className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-ink-primary tracking-tight">96 MB RAM</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                CPU: 1.1% (Fastify Core)
              </span>
            </Panel>

            <Panel variant="default" padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted">Bảo Mật Zero-Knowledge</span>
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
                  <Icon name="shield" className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="my-1.5">
                <span className="text-sm font-black text-ink-primary">100% Bảo Mật Doanh Thu</span>
              </div>
              <p className="text-[10px] text-ink-muted leading-tight">
                Super Admin không xem trộm hóa đơn/doanh số của quán, tuân thủ đạo đức kinh doanh SaaS.
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
              <h3 className="font-black text-base text-ink-primary flex items-center gap-2">
                <Icon name="history" className="w-4 h-4 text-brand-800" />
                <span>Nhật Ký Kiểm Toán Toàn Nền Tảng (System Audit Trail)</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
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
    </div>
  );
};

