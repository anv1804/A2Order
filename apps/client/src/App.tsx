import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TableGrid } from "@/features/tables/components/TableGrid";
import { TableStatus, OrderItemStatus } from "@a2order/shared";
import { KdsTicketCard } from "@/features/kds/components/KdsTicketCard";
import { MenuItemCard } from "@/features/menu/components/MenuItemCard";
import { CartDrawer } from "@/features/ordering/components/CartDrawer";
import { DynamicVietQrModal } from "@/features/billing/components/DynamicVietQrModal";
import { UnifiedAuthModal } from "@/features/auth/components/UnifiedAuthModal";
import { GlobalFeedback } from "@/components/feedback";
import { Panel, Button, Badge, LoadingScreen } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";
import { useAntiSpamAction } from "@/hooks/useAntiSpamAction";
import { ArrowUpRight, Plus, Search, Utensils, Clock, CheckCircle, LayoutDashboard, Monitor } from "lucide-react";
import { TableItem, KdsTicket, MenuItemData, StaffMember, CartItem } from "@/types";
import { CmsLayout, CmsDashboard } from "@/features/cms";

const MOCK_TABLES: TableItem[] = [
  { id: "1", name: "Bàn 01", status: TableStatus.EMPTY },
  { id: "2", name: "Bàn 02", status: TableStatus.OCCUPIED, occupiedMinutes: 3 },
  { id: "3", name: "Bàn 03", status: TableStatus.WAITING_FOOD, occupiedMinutes: 14, totalAmount: 185000 },
  { id: "4", name: "Bàn 04", status: TableStatus.SERVED, occupiedMinutes: 25, totalAmount: 320000 },
  { id: "5", name: "Bàn 05", status: TableStatus.PAYMENT_PENDING, occupiedMinutes: 40, totalAmount: 240000 },
  { id: "6", name: "Bàn 06", status: TableStatus.EMPTY },
];

const MOCK_KDS_TICKETS: KdsTicket[] = [
  {
    id: "t1",
    tableName: "Bàn 03",
    minutesAgo: 14,
    batchNumber: 1,
    items: [
      { id: "i1", name: "Phở Bò Tái Nạm", quantity: 2, notes: "Không hành, nhiều nước béo", status: OrderItemStatus.COOKING },
      { id: "i2", name: "Trứng Trần", quantity: 2, status: OrderItemStatus.DONE },
      { id: "i3", name: "Quẩy Giòn", quantity: 1, status: OrderItemStatus.DONE },
    ],
  },
  {
    id: "t2",
    tableName: "Bàn 02",
    minutesAgo: 3,
    batchNumber: 1,
    items: [
      { id: "i4", name: "Bún Chả Đặc Biệt", quantity: 1, status: OrderItemStatus.QUEUED },
      { id: "i5", name: "Nem Rán Hải Sản", quantity: 2, status: OrderItemStatus.QUEUED },
    ],
  },
];

const MOCK_MENU: MenuItemData[] = [
  { id: "m1", name: "Phở Bò Tái Nạm", price: 65000, isAvailable: true },
  { id: "m2", name: "Bún Chả Hà Nội", price: 60000, isAvailable: true },
  { id: "m3", name: "Bò Tái Thăn", price: 80000, isAvailable: false },
  { id: "m4", name: "Trà Đào Cam Sả", price: 35000, isAvailable: true },
];

const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Em Hùng", role: "Phục vụ" },
  { id: "s2", name: "Chị Lan", role: "Thu ngân" },
  { id: "s3", name: "Bác Ba", role: "Đầu bếp" },
];

export const App: React.FC = () => {
  // Trạng thái Loading ban đầu mượt mà, đồng bộ style Donezo
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chuyển đổi giữa Chế độ CMS Quản trị (mẫu Donezo) và Chế độ POS Vận hành
  const [viewMode, setViewMode] = useState<"cms" | "pos">("cms");
  const [activeTab, setActiveTab] = useState<"tables" | "kds" | "billing" | "menu" | "settings">("tables");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "m1", name: "Phở Bò Tái Nạm", price: 65000, quantity: 2, notes: "Không hành" },
  ]);

  useEffect(() => {
    // Giả lập khởi tạo kết nối socket & tải cấu hình quán
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const { execute: submitOrderWithAntiSpam } = useAntiSpamAction(
    "ORDER",
    async (items: CartItem[], key: string) => {
      console.log("Submitting with Idempotency Key:", key);
      setIsCartOpen(false);
      sound.playKitchenChime();
      toast.success("Đã gửi đơn vào Bếp thành công!");
    }
  );

  const handleTableClick = (table: TableItem) => {
    setSelectedTable(table);
    if (table.status === TableStatus.PAYMENT_PENDING) {
      setIsQrModalOpen(true);
    } else {
      setIsCartOpen(true);
    }
  };

  const handleCloseCartWithConfirm = async () => {
    if (cartItems.length > 0) {
      const confirmed = await confirmDialog({
        title: "Chưa gửi đơn vào bếp!",
        message: "Bạn có món trong giỏ chưa gửi. Bạn có chắc chắn muốn thoát và hủy các món này?",
        confirmText: "Hủy và Thoát",
        cancelText: "Ở lại tiếp tục",
        variant: "danger",
      });
      if (!confirmed) return;
    }
    setIsCartOpen(false);
  };

  if (isLoading) {
    return <LoadingScreen message="Đang kết nối hệ thống A2Order..." subMessage="Chuẩn bị dữ liệu sơ đồ bàn và menu thời gian thực" />;
  }

  return (
    <>
      <GlobalFeedback />

      {/* Floating Mode Switcher ở góc dưới bên phải để xem cả 2 bản */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-brand-950 text-white shadow-2xl border border-brand-800 text-xs font-bold select-none">
        <button
          onClick={() => {
            setViewMode("cms");
            toast.info("Đã chuyển sang Giao diện CMS Quản Trị (Mẫu Donezo)");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
            viewMode === "cms" ? "bg-white text-brand-950 shadow-sm" : "text-brand-200 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Bản CMS</span>
        </button>

        <button
          onClick={() => {
            setViewMode("pos");
            toast.info("Đã chuyển sang Giao diện Vận Hành (POS / KDS)");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
            viewMode === "pos" ? "bg-white text-brand-950 shadow-sm" : "text-brand-200 hover:text-white"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Bản Phục Vụ</span>
        </button>
      </div>

      {/* CHẾ ĐỘ 1: BẢN CMS QUẢN TRỊ (DONEZO STYLE 1:1 CỐ ĐỊNH SIDEBAR & HEADER) */}
      {viewMode === "cms" ? (
        <CmsLayout onLogout={() => setIsAuthModalOpen(true)}>
          <CmsDashboard />
        </CmsLayout>
      ) : (
        /* CHẾ ĐỘ 2: BẢN POS VẬN HÀNH TẠI QUÁN */
        <AppShell
          storeName="Phở Bò Nam Định - Chi nhánh 1"
          userName="Em Hùng"
          userRole="Phục vụ"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={() => setIsAuthModalOpen(true)}
          configVersion="v1.0.3"
          hasNewVersionNotice={false}
          onSyncNewVersion={() => toast.success("Đã đồng bộ thực đơn và sơ đồ bàn mới nhất từ máy chủ!")}
        >
          {activeTab === "tables" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-ink-primary tracking-tight">Sơ Đồ Bàn</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Theo dõi thời gian thực bàn ăn & trạng thái bếp</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
                    <input
                      placeholder="Tìm nhanh bàn... (⌘F)"
                      className="h-11 pl-9 pr-4 rounded-full bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700 w-48 sm:w-60 shadow-sm"
                    />
                  </div>
                  <Button size="md" className="gap-1.5 rounded-full" onClick={() => toast.info("Thêm bàn mới")}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Thêm bàn</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Panel variant="featured" padding="md" className="flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-brand-200">Đang Có Khách</span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">4</span>
                    <span className="text-xs text-brand-200 ml-1.5">/ 6 bàn</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-200">
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10">67%</span>
                    <span>Công suất phục vụ</span>
                  </div>
                </Panel>

                <Panel variant="default" padding="md" className="flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-ink-muted">Bàn Trống Sẵn Sàng</span>
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-primary">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black text-ink-primary tracking-tight">2</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                    Đón được ~8 khách
                  </span>
                </Panel>

                <Panel variant="default" padding="md" className="flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-ink-muted">Món Chờ Bếp</span>
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-primary">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black text-ink-primary tracking-tight">5</span>
                  </div>
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                    2 vé đang nấu
                  </span>
                </Panel>

                <Panel variant="default" padding="md" className="flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-ink-muted">Tạm Tính Giờ Này</span>
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-primary">
                      <Utensils className="w-4 h-4 text-brand-800" />
                    </div>
                  </div>
                  <div className="my-2">
                    <span className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight">745.000 đ</span>
                  </div>
                  <span className="text-[11px] font-bold text-ink-muted">
                    3 bàn chưa tính tiền
                  </span>
                </Panel>
              </div>

              <div className="pt-2">
                <TableGrid tables={MOCK_TABLES} onTableClick={handleTableClick} />
              </div>
            </div>
          )}

          {activeTab === "kds" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-ink-primary">Màn Hình Bếp (KDS)</h2>
                  <p className="text-xs text-ink-muted">2 vé món đang chế biến theo thứ tự thời gian</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="success">Đúng giờ (&lt;7p)</Badge>
                  <Badge variant="danger" className="animate-pulse">Quá hạn (&gt;12p)</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_KDS_TICKETS.map((ticket) => (
                  <KdsTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onItemStatusToggle={(id) => toast.info(`Đã đổi trạng thái món: ${id}`)}
                    onCompleteTicket={(id) => {
                      sound.playKitchenChime();
                      toast.success(`Đã hoàn tất vé: ${ticket.tableName}`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "menu" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-ink-primary">Danh Mục Món Ăn</h2>
                  <p className="text-xs text-ink-muted">Bật/tắt trạng thái còn hàng hoặc hết nguyên liệu (86)</p>
                </div>
                <Button size="sm" className="rounded-full" onClick={() => toast.info("Mở form thêm món")}>
                  + Thêm món mới
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MOCK_MENU.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    showAdminControls
                    onToggleStock={(id, avail) =>
                      toast.warning(`Đã đổi trạng thái món ${item.name}: ${avail ? "Còn hàng" : "Hết hàng (86)"}`)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
              <h2 className="text-2xl font-black text-ink-primary">Quầy Thu Ngân</h2>
              <p className="text-ink-muted text-sm max-w-md mx-auto">
                Chạm vào bất kỳ bàn nào đang có trạng thái "Chờ thanh toán" trên sơ đồ để sinh mã VietQR động có sẵn số tiền.
              </p>
              <Button
                size="lg"
                className="rounded-full"
                onClick={() => setIsQrModalOpen(true)}
              >
                Mở Thử Nghiệm VietQR Bàn 05
              </Button>
            </div>
          )}

          <CartDrawer
            tableName={selectedTable?.name || "Bàn 01"}
            items={cartItems}
            isOpen={isCartOpen}
            onClose={handleCloseCartWithConfirm}
            onUpdateQuantity={(id, delta) => console.log("Update qty", id, delta)}
            onSubmitOrder={() => submitOrderWithAntiSpam(cartItems)}
          />

          <DynamicVietQrModal
            isOpen={isQrModalOpen}
            tableName={selectedTable?.name || "Bàn 05"}
            totalAmount={240000}
            qrUrl="https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=240000&addInfo=A2%20BAN05"
            bankName="VietinBank"
            accountNumber="113366668888"
            accountName="NGUYEN VAN A"
            transferContent="A2 BAN05"
            isPaid={false}
            onClose={() => setIsQrModalOpen(false)}
            onConfirmCash={() => {
              sound.playPaymentChime();
              toast.success("Đã xác nhận thu tiền mặt thành công!");
              setIsQrModalOpen(false);
            }}
            onPrintBill={() => toast.info("Đang gửi lệnh in hóa đơn nhiệt...")}
          />

        </AppShell>
      )}

      {/* Unified Auth Modal cho cả CMS (Chủ quán) và POS (Mã PIN nhân viên) */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        staffList={MOCK_STAFF}
        onPinSubmit={(staffId, pin) => {
          const staff = MOCK_STAFF.find((s) => s.id === staffId);
          toast.success(`Nhân viên ${staff?.name || ""} vào ca thành công!`);
          setIsAuthModalOpen(false);
        }}
        onAdminLogin={(email, pass) => {
          toast.success(`Đăng nhập quản trị viên (${email}) thành công!`);
          setIsAuthModalOpen(false);
        }}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
