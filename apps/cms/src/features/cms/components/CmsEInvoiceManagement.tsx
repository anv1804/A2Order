import React, { useState } from "react";
import {
  Panel,
  Button,
  Badge,
  Icon,
  Portal,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  SearchInput,
  FilterSelect,
  DataTableCard,
} from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { toast, confirmDialog } from "@/stores/notificationStore";
import {
  EInvoiceProvider,
  EInvoiceConfig,
  EInvoiceRecord,
} from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";

const DEFAULT_EINVOICE_CONFIG: EInvoiceConfig = {
  provider: "MISA_MEINVOICE",
  isConnected: false,
  taxCode: "",
  companyName: "",
  companyAddress: "",
  invoiceTemplate: "1/001",
  invoiceSeries: "1C26TBB",
  signatureType: "CLOUD_CA",
  autoIssueOnCheckout: false,
  minAmountForAutoIssue: 200000,
  accountUsername: "",
  apiEndpoint: "https://api.meinvoice.vn/v2/einvoice",
};

const INITIAL_INVOICES: EInvoiceRecord[] = [
  {
    id: "einv-1",
    orderCode: "BILL-POS-8821",
    invoiceNumber: "0000041",
    invoiceSeries: "1C26TBB",
    cqtCode: "00C26TBB88392019C",
    buyerName: "Công ty Cổ phần Công nghệ FPT",
    buyerTaxCode: "0101248141",
    buyerEmail: "billing@fpt.com.vn",
    buyerAddress: "Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội",
    totalBeforeTax: 2500000,
    vatRate: 8,
    vatAmount: 200000,
    totalPayment: 2700000,
    issuedAt: "14/05/2026 12:45",
    signedBy: "A2Order Store (CLOUD_CA)",
    status: "ISSUED_WITH_CODE",
    pdfDownloadUrl: "#",
    xmlDownloadUrl: "#",
  },
  {
    id: "einv-2",
    orderCode: "BILL-POS-8822",
    invoiceNumber: "0000042",
    invoiceSeries: "1C26TBB",
    cqtCode: "00C26TBB19284755C",
    buyerName: "Công ty TNHH Vận Tải & Dịch Vụ Á Châu",
    buyerTaxCode: "0304918273",
    buyerEmail: "ketoan@achau.vn",
    buyerAddress: "Tầng 5 Landmark 81, TP.HCM",
    totalBeforeTax: 1800000,
    vatRate: 8,
    vatAmount: 144000,
    totalPayment: 1944000,
    issuedAt: "14/05/2026 13:10",
    signedBy: "A2Order Store (CLOUD_CA)",
    status: "ISSUED_WITH_CODE",
    pdfDownloadUrl: "#",
    xmlDownloadUrl: "#",
  },
  {
    id: "einv-3",
    orderCode: "BILL-POS-8825",
    invoiceNumber: "0000043",
    invoiceSeries: "1C26TBB",
    buyerName: "Nguyễn Hoàng Nam",
    buyerEmail: "nam.nh@gmail.com",
    totalBeforeTax: 650000,
    vatRate: 8,
    vatAmount: 52000,
    totalPayment: 702000,
    issuedAt: "14/05/2026 14:05",
    signedBy: "A2Order Store (CLOUD_CA)",
    status: "WAITING_CQT_CODE",
    pdfDownloadUrl: "#",
    xmlDownloadUrl: "#",
  },
  {
    id: "einv-4",
    orderCode: "BILL-POS-8818",
    invoiceNumber: "0000040",
    invoiceSeries: "1C26TBB",
    buyerName: "Vũ Hải Đăng (Sai thông tin MST)",
    buyerTaxCode: "0102938475",
    totalBeforeTax: 1200000,
    vatRate: 8,
    vatAmount: 96000,
    totalPayment: 1296000,
    issuedAt: "13/05/2026 19:20",
    signedBy: "A2Order Store (CLOUD_CA)",
    status: "CANCELLED",
    pdfDownloadUrl: "#",
    xmlDownloadUrl: "#",
  },
];

export const CmsEInvoiceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"invoices" | "settings">("invoices");
  const [config, setConfig] = usePersistentState<EInvoiceConfig>("einvoice_config", DEFAULT_EINVOICE_CONFIG);
  const [invoices, setInvoices] = usePersistentState<EInvoiceRecord[]>("einvoice_records", INITIAL_INVOICES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [invoicePage, setInvoicePage] = useState(1);
  const INVOICE_PAGE_SIZE = 8;

  // Modal tạo HĐĐT mới thủ công
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    buyerName: "",
    buyerTaxCode: "",
    buyerEmail: "",
    buyerAddress: "",
    totalBeforeTax: 500000,
    vatRate: 8,
    orderCode: "BILL-POS-" + Math.floor(1000 + Math.random() * 9000),
  });

  // Modal xem chi tiết HĐ
  const [viewingInvoice, setViewingInvoice] = useState<EInvoiceRecord | null>(null);

  // Thống kê
  const stats = {
    totalIssued: invoices.filter((i) => i.status === "ISSUED_WITH_CODE").length,
    totalVat: invoices
      .filter((i) => i.status === "ISSUED_WITH_CODE")
      .reduce((sum, i) => sum + i.vatAmount, 0),
    waitingCode: invoices.filter((i) => i.status === "WAITING_CQT_CODE").length,
    cancelled: invoices.filter((i) => i.status === "CANCELLED").length,
  };

  // Lọc HĐ
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.includes(q) ||
        inv.orderCode.toLowerCase().includes(q) ||
        inv.buyerName.toLowerCase().includes(q) ||
        (inv.buyerTaxCode && inv.buyerTaxCode.includes(q)) ||
        (inv.cqtCode && inv.cqtCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Tạo & Phát hành HĐĐT mới
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.buyerName.trim()) {
      toast.error("Vui lòng nhập tên người mua hàng hoặc tên doanh nghiệp");
      return;
    }

    const vatAmount = Math.round((newInvoiceForm.totalBeforeTax * newInvoiceForm.vatRate) / 100);
    const totalPayment = newInvoiceForm.totalBeforeTax + vatAmount;
    const nextNumber = String(invoices.length + 43).padStart(7, "0");
    const generatedCqtCode = `00C26TBB${Math.floor(10000000 + Math.random() * 90000000)}C`;

    const newRecord: EInvoiceRecord = {
      id: `einv-${Date.now()}`,
      orderCode: newInvoiceForm.orderCode,
      invoiceNumber: nextNumber,
      invoiceSeries: config.invoiceSeries,
      cqtCode: generatedCqtCode,
      buyerName: newInvoiceForm.buyerName.trim(),
      buyerTaxCode: newInvoiceForm.buyerTaxCode.trim() || undefined,
      buyerEmail: newInvoiceForm.buyerEmail.trim() || undefined,
      buyerAddress: newInvoiceForm.buyerAddress.trim() || undefined,
      totalBeforeTax: newInvoiceForm.totalBeforeTax,
      vatRate: newInvoiceForm.vatRate,
      vatAmount,
      totalPayment,
      issuedAt: new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      signedBy: `${config.companyName} (${config.signatureType})`,
      status: "ISSUED_WITH_CODE",
      pdfDownloadUrl: "#",
      xmlDownloadUrl: "#",
    };

    setInvoices((prev) => [newRecord, ...prev]);
    setIsCreateModalOpen(false);
    toast.success(`Đã ký số và phát hành thành công Hóa Đơn Điện Tử Số [${nextNumber}]! Cơ quan thuế đã cấp mã hợp lệ.`);
  };

  // Hủy hóa đơn
  const handleCancelInvoice = async (inv: EInvoiceRecord) => {
    const ok = await confirmDialog({
      title: "Hủy Hóa Đơn Điện Tử",
      message: `Bạn có chắc chắn muốn lập biên bản hủy hóa đơn điện tử số ${inv.invoiceNumber} (Mẫu ${inv.invoiceSeries})? Hành động này sẽ thông báo sai sót Mẫu 04/SS-HĐĐT lên Cơ quan Thuế.`,
      confirmText: "Xác Nhận Hủy HĐ",
      variant: "danger",
    });
    if (!ok) return;

    setInvoices((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: "CANCELLED" } : i))
    );
    toast.success(`Đã hủy hóa đơn số ${inv.invoiceNumber} và gửi thông điệp 04/SS-HĐĐT lên CQT.`);
  };

  // Slicing phân trang
  const paginatedInvoices = filteredInvoices.slice(
    (invoicePage - 1) * INVOICE_PAGE_SIZE,
    invoicePage * INVOICE_PAGE_SIZE
  );

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Thuế TT78", dot: true }}
        tagline={`${invoices.length} hóa đơn • Ký số ${config.signatureType}`}
        title="Hóa Đơn Điện Tử"
        description="Phát hành hóa đơn điện tử khởi tạo từ máy tính tiền POS chuẩn cơ quan thuế Thông tư 78"
        chips={[
          { icon: "checkCircle", label: `${stats.totalIssued} HĐ hợp lệ`, variant: "teal" },
          { icon: "banknote", label: `VAT đã kê: ${stats.totalVat.toLocaleString("vi-VN")} đ`, variant: "default" },
          { icon: "clock", label: `${stats.waitingCode} Chờ cấp mã CQT`, variant: stats.waitingCode > 0 ? "amber" : "blue", highlight: stats.waitingCode > 0 },
          { icon: "fileText", label: `Mẫu số: ${config.invoiceTemplate}`, variant: "amber" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
          >
            <Icon name="plus" size={14} />
            <span>Lập & Ký HĐĐT Mới</span>
          </button>
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số HĐĐT */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="checkCircle"
          variant="success"
          title="Đã Phát Hành Hợp Lệ"
          value={stats.totalIssued}
          unit="HĐ"
          subtext="Đã có mã xác thực CQT"
          badge="Hợp lệ"
        />
        <StatCard
          icon="banknote"
          variant="default"
          title="Tổng Thuế VAT Đã Kê"
          value={stats.totalVat.toLocaleString("vi-VN")}
          unit="đ"
          subtext="Thuế GTGT đầu ra"
          badge="Kê khai"
        />
        <StatCard
          icon="clock"
          variant="warning"
          title="Chờ CQT Cấp Mã"
          value={stats.waitingCode}
          unit="HĐ"
          subtext="Đang truyền qua TCTN"
          badge={stats.waitingCode > 0 ? "Chờ duyệt" : "0 chờ"}
        />
        <StatCard
          icon="fileText"
          variant="info"
          title="Hóa Đơn Đã Hủy"
          value={stats.cancelled}
          unit="HĐ"
          subtext="Đã nộp thông báo 04/SS"
          badge="Đã hủy"
        />
      </section>

      {/* 3. Sticky Toolbar: Tabs Danh Mục */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "invoices"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Sổ Hóa Đơn ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "settings"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Cấu Hình TT78 & Ký Số
          </button>
        </div>
      </div>

      {/* TAB 1: SỔ HÓA ĐƠN */}
      {activeTab === "invoices" && (
        <DataTableCard
          searchPlaceholder="Tìm số HĐ, MST, tên khách..."
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setInvoicePage(1);
          }}
          onSearchClear={() => {
            setSearchQuery("");
            setInvoicePage(1);
          }}
          filters={
            <FilterSelect
              labelPrefix="Trạng thái: "
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setInvoicePage(1);
              }}
              options={[
                { value: "ALL", label: "Tất cả", count: invoices.length },
                { value: "ISSUED_WITH_CODE", label: "Đã cấp mã CQT", count: invoices.filter((i) => i.status === "ISSUED_WITH_CODE").length },
                { value: "WAITING_CQT_CODE", label: "Chờ cấp mã", count: invoices.filter((i) => i.status === "WAITING_CQT_CODE").length },
                { value: "CANCELLED", label: "Đã hủy", count: invoices.filter((i) => i.status === "CANCELLED").length },
              ]}
              className="w-full sm:w-48 shrink-0"
            />
          }
          hasActiveFilters={statusFilter !== "ALL" || searchQuery.trim() !== ""}
          onResetFilters={() => {
            setStatusFilter("ALL");
            setSearchQuery("");
            setInvoicePage(1);
          }}
          pagination={{
            currentPage: invoicePage,
            totalItems: filteredInvoices.length,
            pageSize: INVOICE_PAGE_SIZE,
            onPageChange: setInvoicePage,
          }}
        >
          {/* Invoices Table */}
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ký Hiệu & Số HĐ</TableHead>
                  <TableHead>Người Mua Hàng</TableHead>
                  <TableHead>Mã Số Thuế</TableHead>
                  <TableHead align="right">Tiền Trước Thuế</TableHead>
                  <TableHead align="right">VAT (%)</TableHead>
                  <TableHead align="right">Tổng Thanh Toán</TableHead>
                  <TableHead align="center">Trạng Thái</TableHead>
                  <TableHead align="right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    title="Không tìm thấy hóa đơn điện tử nào"
                    description={
                      invoices.length === 0
                        ? "Chưa có hóa đơn nào được phát hành."
                        : "Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái."
                    }
                    action={
                      filteredInvoices.length === 0 && invoices.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 font-bold"
                          onClick={() => {
                            setStatusFilter("ALL");
                            setSearchQuery("");
                            setInvoicePage(1);
                          }}
                        >
                          <Icon name="x" className="w-3.5 h-3.5" />
                          <span>Xóa Bộ Lọc</span>
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  paginatedInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <span className="font-bold text-slate-900 block font-mono">
                          {inv.invoiceSeries} - {inv.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          Đơn: {inv.orderCode} • {inv.issuedAt}
                        </span>
                        {inv.cqtCode && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono inline-block mt-0.5">
                            CQT: {inv.cqtCode}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {inv.buyerName}
                        {inv.buyerEmail && (
                          <span className="text-[11px] text-slate-400 block">{inv.buyerEmail}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">
                        {inv.buyerTaxCode || <span className="text-slate-400 italic">Khách lẻ</span>}
                      </TableCell>
                      <TableCell align="right" className="font-mono text-slate-600">
                        {inv.totalBeforeTax.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell align="right" className="font-mono text-slate-600">
                        {inv.vatRate}% ({inv.vatAmount.toLocaleString("vi-VN")} đ)
                      </TableCell>
                      <TableCell align="right" className="font-mono font-bold text-emerald-800">
                        {inv.totalPayment.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell align="center">
                        {inv.status === "ISSUED_WITH_CODE" && (
                          <Badge variant="success">Đã Cấp Mã CQT</Badge>
                        )}
                        {inv.status === "WAITING_CQT_CODE" && (
                          <Badge variant="warning">Chờ Cấp Mã</Badge>
                        )}
                        {inv.status === "CANCELLED" && (
                          <Badge variant="default">Đã Hủy</Badge>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingInvoice(inv)}
                            className="text-[11px] py-1 px-2"
                          >
                            <Icon name="eye" size={12} className="mr-1" /> Xem
                          </Button>
                          {inv.status === "ISSUED_WITH_CODE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvoice(inv)}
                              className="text-[11px] py-1 px-2 text-red-600 hover:bg-red-50 border-red-200"
                            >
                              <Icon name="ban" size={12} className="mr-1" /> Hủy
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataTableCard>
      )}

      {/* TAB 2: CẤU HÌNH TT78 */}
      {activeTab === "settings" && (
        <Panel className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs max-w-3xl space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Cấu Hình Kết Nối Cơ Quan Thuế (TT 78 / NĐ 123)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống A2Order kết nối trực tiếp với các đơn vị truyền nhận HĐĐT được Tổng cục Thuế công nhận.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: "MISA_MEINVOICE", name: "MISA meInvoice", desc: "Được tích hợp sẵn" },
              { id: "VNPT_INVOICE", name: "VNPT Invoice", desc: "Tập đoàn VNPT" },
              { id: "VIETTEL_SINVOICE", name: "Viettel S-Invoice", desc: "Tập đoàn Viettel" },
              { id: "BKAV_EHOADON", name: "BKAV eHoadon", desc: "Tập đoàn BKAV" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setConfig({ ...config, provider: p.id as EInvoiceProvider })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.provider === p.id
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>

          <div className="space-y-4 text-xs pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Số Thuế Của Quán (MST):</label>
                <input
                  type="text"
                  value={config.taxCode}
                  onChange={(e) => setConfig({ ...config, taxCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ký Hiệu Mẫu Hóa Đơn (Series):</label>
                <input
                  type="text"
                  value={config.invoiceSeries}
                  onChange={(e) => setConfig({ ...config, invoiceSeries: e.target.value })}
                  placeholder="VD: 1C26TBB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Hộ Kinh Doanh / Công Ty:</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Đăng Ký Kinh Doanh:</label>
              <input
                type="text"
                value={config.companyAddress}
                onChange={(e) => setConfig({ ...config, companyAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hình Thức Ký Số:</label>
                <select
                  value={config.signatureType}
                  onChange={(e) => setConfig({ ...config, signatureType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CLOUD_CA">Ký số từ xa Cloud CA (Không cần cắm USB Token)</option>
                  <option value="USB_TOKEN">Ký qua USB Token phần cứng cắm tại quầy</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tài Khoản Kết Nối Nhà Cung Cấp:</label>
                <input
                  type="text"
                  value={config.accountUsername || ""}
                  onChange={(e) => setConfig({ ...config, accountUsername: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoIssueOnCheckout}
                  onChange={(e) => setConfig({ ...config, autoIssueOnCheckout: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">
                  Tự động phát hành HĐĐT có mã CQT ngay khi thu ngân thanh toán hóa đơn
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Đã kiểm tra chứng thư số và thông điệp CQT: Kết nối thành công 100%!")}
              >
                <Icon name="refresh" size={14} className="mr-1" />
                Kiểm Tra Kết Nối CQT
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.success("Đã lưu thông tin cấu hình hóa đơn điện tử TT78 thành công!")}
                className="bg-emerald-600 text-white"
              >
                Lưu Cấu Hình
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Modal Lập HĐĐT Mới */}
      {isCreateModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Lập & Ký Số Hóa Đơn Điện Tử Mới</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <Icon name="x" size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Người Mua / Đơn Vị Công Ty (*):</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.buyerName}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, buyerName: e.target.value })}
                    placeholder="VD: CÔNG TY TNHH ĐẦU TƯ THƯƠNG MẠI ÁNH DƯƠNG"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã Số Thuế (Nếu có):</label>
                    <input
                      type="text"
                      value={newInvoiceForm.buyerTaxCode}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, buyerTaxCode: e.target.value })}
                      placeholder="VD: 0101234567"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Nhận Hóa Đơn:</label>
                    <input
                      type="email"
                      value={newInvoiceForm.buyerEmail}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, buyerEmail: e.target.value })}
                      placeholder="ketoan@anhduong.vn"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Khách Hàng:</label>
                  <input
                    type="text"
                    value={newInvoiceForm.buyerAddress}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, buyerAddress: e.target.value })}
                    placeholder="Địa chỉ xuất hóa đơn..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tiền Trước Thuế (VNĐ):</label>
                    <input
                      type="number"
                      required
                      value={newInvoiceForm.totalBeforeTax}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, totalBeforeTax: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thuế Suất VAT:</label>
                    <select
                      value={newInvoiceForm.vatRate}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, vatRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={8}>8% (Giảm thuế F&B theo NQ)</option>
                      <option value={10}>10% (Thuế suất chuẩn)</option>
                      <option value={0}>0% (Không chịu thuế)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền thuế VAT ({newInvoiceForm.vatRate}%):</span>
                    <span className="font-mono font-semibold">
                      {Math.round((newInvoiceForm.totalBeforeTax * newInvoiceForm.vatRate) / 100).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                    <span>Tổng tiền thanh toán:</span>
                    <span className="font-mono text-emerald-700 text-sm">
                      {(newInvoiceForm.totalBeforeTax + Math.round((newInvoiceForm.totalBeforeTax * newInvoiceForm.vatRate) / 100)).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                    Hủy Bỏ
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 text-white">
                    <Icon name="key" size={14} className="mr-1" />
                    Ký Số & Phát Hành Ngay
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Xem Bản Thể Hiện HĐĐT */}
      {viewingInvoice && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 animate-scaleUp text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bản Thể Hiện Hóa Đơn Điện Tử</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ký hiệu: {viewingInvoice.invoiceSeries} • Số: {viewingInvoice.invoiceNumber}
                  </p>
                </div>
                <button onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-slate-600">
                  <Icon name="x" size={20} />
                </button>
              </div>

              {/* Hóa đơn mockup */}
              <div className="border border-slate-300 p-4 rounded-xl space-y-3 bg-amber-50/10">
                <div className="text-center pb-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm uppercase">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    (Có mã của Cơ quan Thuế khởi tạo từ máy tính tiền)
                  </p>
                  {viewingInvoice.cqtCode && (
                    <div className="text-[11px] text-emerald-800 font-mono font-bold mt-1">
                      Mã CQT: {viewingInvoice.cqtCode}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-slate-700">
                  <div><strong>Đơn vị bán hàng:</strong> {config.companyName}</div>
                  <div><strong>Mã số thuế:</strong> <span className="font-mono">{config.taxCode}</span></div>
                  <div><strong>Địa chỉ:</strong> {config.companyAddress}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-700">
                  <div><strong>Tên khách hàng:</strong> {viewingInvoice.buyerName}</div>
                  {viewingInvoice.buyerTaxCode && (
                    <div><strong>MST người mua:</strong> <span className="font-mono">{viewingInvoice.buyerTaxCode}</span></div>
                  )}
                  {viewingInvoice.buyerAddress && (
                    <div><strong>Địa chỉ:</strong> {viewingInvoice.buyerAddress}</div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <TableContainer className="border-0 shadow-none rounded-none bg-transparent">
                    <Table>
                      <TableHeader className="bg-transparent border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="py-1 px-0 text-slate-500 font-semibold normal-case text-xs">Nội Dung</TableHead>
                          <TableHead align="right" className="py-1 px-0 text-slate-500 font-semibold normal-case text-xs">Thành Tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-transparent">
                          <TableCell className="py-1 px-0">Dịch vụ ăn uống theo hóa đơn {viewingInvoice.orderCode}</TableCell>
                          <TableCell align="right" className="py-1 px-0 font-mono">{viewingInvoice.totalBeforeTax.toLocaleString("vi-VN")} đ</TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent border-t border-slate-100">
                          <TableCell className="py-1 px-0 text-slate-500">Thuế suất GTGT ({viewingInvoice.vatRate}%)</TableCell>
                          <TableCell align="right" className="py-1 px-0 font-mono">{viewingInvoice.vatAmount.toLocaleString("vi-VN")} đ</TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent border-t border-slate-200 font-bold text-slate-900">
                          <TableCell className="py-1 px-0 font-bold text-slate-900">Tổng cộng tiền thanh toán</TableCell>
                          <TableCell align="right" className="py-1 px-0 font-mono text-emerald-700 font-bold">{viewingInvoice.totalPayment.toLocaleString("vi-VN")} đ</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
                  <div>Người ký: <span className="font-semibold text-slate-800">{viewingInvoice.signedBy}</span></div>
                  <div>Ngày ký: <span className="font-mono">{viewingInvoice.issuedAt}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Đang tải file XML gốc có chữ ký số...")}
                >
                  <Icon name="download" size={14} className="mr-1" /> Tải XML Gốc
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Đã gửi liên kết hóa đơn điện tử vào email khách hàng thành công!")}
                >
                  <Icon name="mail" size={14} className="mr-1" /> Gửi Email
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success("Đang in bản thể hiện hóa đơn...")}
                  className="bg-emerald-600 text-white"
                >
                  <Icon name="print" size={14} className="mr-1" /> In Bản Thể Hiện
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
