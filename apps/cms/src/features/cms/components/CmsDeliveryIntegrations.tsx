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
  FilterSelect,
  DataTableCard,
} from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { toast } from "@/stores/notificationStore";
import {
  DeliveryPlatform,
  DeliveryChannelConfig,
  DeliveryOrderRecord,
} from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";

const DEFAULT_CHANNELS: DeliveryChannelConfig[] = [
  {
    id: "GRAB_FOOD",
    name: "GrabFood",
    logo: "GF",
    badgeColor: "bg-emerald-600 text-white",
    isConnected: false,
    merchantStoreId: "",
    webhookUrl: "https://api.a2order.com/api/webhooks/delivery/grabfood",
    autoAccept: false,
    autoSendToKds: false,
    priceMarkupPercent: 15,
  },
  {
    id: "SHOPEE_FOOD",
    name: "ShopeeFood",
    logo: "SPF",
    badgeColor: "bg-orange-500 text-white",
    isConnected: false,
    merchantStoreId: "",
    webhookUrl: "https://api.a2order.com/api/webhooks/delivery/shopeefood",
    autoAccept: false,
    autoSendToKds: false,
    priceMarkupPercent: 20,
  },
  {
    id: "BE_FOOD",
    name: "BeFood",
    logo: "BE",
    badgeColor: "bg-amber-400 text-slate-900",
    isConnected: false,
    merchantStoreId: "",
    webhookUrl: "https://api.a2order.com/api/webhooks/delivery/befood",
    autoAccept: false,
    autoSendToKds: false,
    priceMarkupPercent: 10,
  },
  {
    id: "GO_FOOD",
    name: "GoFood",
    logo: "GO",
    badgeColor: "bg-red-600 text-white",
    isConnected: false,
    merchantStoreId: "",
    webhookUrl: "https://api.a2order.com/api/webhooks/delivery/gofood",
    autoAccept: false,
    autoSendToKds: false,
    priceMarkupPercent: 15,
  },
];

const INITIAL_DELIVERY_ORDERS: DeliveryOrderRecord[] = [];

export const CmsDeliveryIntegrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"live_orders" | "channels" | "menu_sync">("live_orders");
  const [channels, setChannels] = usePersistentState<DeliveryChannelConfig[]>("delivery_channels", DEFAULT_CHANNELS);
  const [orders, setOrders] = usePersistentState<DeliveryOrderRecord[]>("delivery_orders", INITIAL_DELIVERY_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingChannel, setEditingChannel] = useState<DeliveryChannelConfig | null>(null);

  // Thống kê nhanh
  const stats = {
    totalOrdersToday: orders.length,
    activeCooking: orders.filter((o) => o.status === "COOKING" || o.status === "WAITING_ACCEPT").length,
    readyForPickup: orders.filter((o) => o.status === "READY_FOR_PICKUP").length,
    todayRevenue: orders
      .filter((o) => o.status === "COMPLETED" || o.status === "READY_FOR_PICKUP" || o.status === "COOKING")
      .reduce((sum, o) => sum + o.netPayout, 0),
  };

  // Lọc đơn
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "ALL") return true;
    return o.status === statusFilter;
  });

  // Chấp nhận đơn hàng
  const handleAcceptOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "COOKING", estimatedPickupTime: "Đang nấu (Khoảng 12 phút)" } : o))
    );
    toast.success("Đã xác nhận đơn hàng và tự động bắn vào Màn Hình Bếp (KDS)!");
  };

  // Báo món hoàn tất sẵn sàng bàn giao cho tài xế
  const handleReadyForPickup = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "READY_FOR_PICKUP", estimatedPickupTime: "Chờ tài xế lấy hàng" } : o))
    );
    toast.success("Món đã nấu xong! Đã gửi thông báo tới ứng dụng của tài xế.");
  };

  // Hoàn tất bàn giao đơn cho shipper
  const handleCompleteDelivery = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED" } : o))
    );
    toast.success("Đã bàn giao đơn hàng cho tài xế thành công!");
  };

  // Giả lập đơn hàng mới bay tới từ Grab / ShopeeFood
  const handleSimulateNewOrder = () => {
    const randomPlatform: DeliveryPlatform = Math.random() > 0.5 ? "GRAB_FOOD" : "SHOPEE_FOOD";
    const newCode = `${randomPlatform === "GRAB_FOOD" ? "GF" : "SPF"}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: DeliveryOrderRecord = {
      id: `do-${Date.now()}`,
      platform: randomPlatform,
      platformOrderCode: newCode,
      customerName: "Khách Hàng Trực Tuyến",
      customerPhone: "090" + Math.floor(1000000 + Math.random() * 9000000),
      driverName: "Tài Xế " + (randomPlatform === "GRAB_FOOD" ? "Grab" : "Shopee"),
      driverPhone: "093" + Math.floor(1000000 + Math.random() * 9000000),
      driverPlate: "29A-" + Math.floor(100 + Math.random() * 900) + "." + Math.floor(10 + Math.random() * 90),
      status: "WAITING_ACCEPT",
      items: [
        { name: "Phở Bò Tái Lăn Hà Nội", quantity: 2, price: 65000, options: ["Nhiều ớt", "Nước béo riêng"] },
        { name: "Trà Tắc Xí Muội Đá", quantity: 2, price: 25000 },
      ],
      subtotal: 180000,
      shippingFee: 20000,
      discountAmount: 0,
      totalAmount: 200000,
      platformCommission: 40000,
      netPayout: 160000,
      orderTime: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      estimatedPickupTime: "Tài xế đang đến (khoảng 8 phút)",
    };

    setOrders((prev) => [newOrder, ...prev]);
    toast.success(`Ting Ting! Có đơn giao hàng mới [${newCode}] từ ${randomPlatform === "GRAB_FOOD" ? "GrabFood" : "ShopeeFood"}!`);
  };

  // Lưu cấu hình kênh
  const handleSaveChannelConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    setChannels((prev) => prev.map((c) => (c.id === editingChannel.id ? editingChannel : c)));
    setEditingChannel(null);
    toast.success(`Đã lưu cấu hình kênh ${editingChannel.name} thành công!`);
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "App Giao Hàng", dot: true }}
        tagline={`${channels.filter((c) => c.isConnected).length}/4 kênh kết nối • ${stats.totalOrdersToday} đơn hôm nay`}
        title="App Giao Hàng & Đối Tác"
        description="Đồng bộ đơn hàng tự động từ GrabFood, ShopeeFood, BeFood về máy bán hàng POS và màn hình bếp KDS"
        chips={[
          { icon: "cart", label: `${stats.totalOrdersToday} Đơn hôm nay`, variant: "default" },
          { icon: "kitchen", label: `${stats.activeCooking} Đang nấu KDS`, variant: stats.activeCooking > 0 ? "amber" : "teal", highlight: stats.activeCooking > 0 },
          { icon: "clock", label: `${stats.readyForPickup} Chờ giao shipper`, variant: "blue" },
          { icon: "banknote", label: `Thực nhận: ${stats.todayRevenue.toLocaleString("vi-VN")} đ`, variant: "teal" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleSimulateNewOrder}
            className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
          >
            <Icon name="bell" size={14} className="animate-bounce" />
            <span>Giả Lập Đơn App</span>
          </button>
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số Đơn Giao Hàng */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="cart"
          variant="default"
          title="Tổng Đơn App Hôm Nay"
          value={stats.totalOrdersToday}
          unit="đơn"
          subtext="Đồng bộ tự động 100%"
          badge="Hôm nay"
        />
        <StatCard
          icon="kitchen"
          variant="warning"
          title="Đang Nấu / Chờ Nhận"
          value={stats.activeCooking}
          unit="đơn"
          subtext="Đã bắn vào màn hình KDS"
          badge={stats.activeCooking > 0 ? "Bếp nấu" : "0 đơn"}
        />
        <StatCard
          icon="clock"
          variant="info"
          title="Chờ Shipper Đến Lấy"
          value={stats.readyForPickup}
          unit="đơn"
          subtext="Món đã gói xong sẵn sàng"
          badge={stats.readyForPickup > 0 ? "Giao shipper" : "0 chờ"}
        />
        <StatCard
          icon="banknote"
          variant="success"
          title="Thực Nhận Từ App (Net)"
          value={stats.todayRevenue.toLocaleString("vi-VN")}
          unit="đ"
          subtext="Đã khấu trừ hoa hồng sàn"
          badge="Doanh thu"
        />
      </section>

      {/* 3. Sticky Toolbar: Tabs Danh Mục */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setActiveTab("live_orders")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "live_orders"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Đơn Giao Hàng Live ({orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length})
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "channels"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Kênh Kết Nối ({channels.filter((c) => c.isConnected).length}/4)
          </button>
          <button
            onClick={() => setActiveTab("menu_sync")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "menu_sync"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Đồng Bộ Menu Thực Đơn
          </button>
        </div>
      </div>

      {/* TAB 1: ĐƠN HÀNG TRỰC TIẾP */}
      {activeTab === "live_orders" && (
        <DataTableCard
          filters={
            <FilterSelect
              labelPrefix="Trạng thái: "
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "Tất cả đơn", count: orders.length },
                { value: "WAITING_ACCEPT", label: "Chờ xác nhận", count: orders.filter((o) => o.status === "WAITING_ACCEPT").length },
                { value: "COOKING", label: "Bếp đang nấu", count: orders.filter((o) => o.status === "COOKING").length },
                { value: "READY_FOR_PICKUP", label: "Chờ giao shipper", count: orders.filter((o) => o.status === "READY_FOR_PICKUP").length },
                { value: "COMPLETED", label: "Đã hoàn thành", count: orders.filter((o) => o.status === "COMPLETED").length },
              ]}
              className="w-56"
            />
          }
          hasActiveFilters={statusFilter !== "ALL"}
          onResetFilters={() => setStatusFilter("ALL")}
          summaryText={`${filteredOrders.length} / ${orders.length} đơn hàng`}
          scrollable={false}
        >
          {/* Orders List */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <Icon name="cart" size={36} className="mx-auto mb-2 opacity-50" />
                <p>Không có đơn hàng nào trong trạng thái này.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isGrab = order.platform === "GRAB_FOOD";
                const badgeBg = isGrab ? "bg-emerald-600 text-white" : "bg-orange-500 text-white";

                return (
                  <Panel
                    key={order.id}
                    className={`p-5 bg-white border rounded-xl shadow-xs transition-all ${
                      order.status === "WAITING_ACCEPT"
                        ? "border-amber-400 ring-2 ring-amber-100"
                        : order.status === "READY_FOR_PICKUP"
                        ? "border-blue-400"
                        : "border-slate-200"
                    }`}
                  >
                    {/* Header đơn */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider ${badgeBg}`}>
                          {order.platform === "GRAB_FOOD" ? "GRAB" : "SHOPEE"}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{order.platformOrderCode}</span>
                        <span className="text-xs text-slate-400">({order.orderTime})</span>
                      </div>

                      <div>
                        {order.status === "WAITING_ACCEPT" && (
                          <Badge variant="warning">Chờ Nhận Đơn</Badge>
                        )}
                        {order.status === "COOKING" && (
                          <Badge variant="default">Bếp Đang Nấu</Badge>
                        )}
                        {order.status === "READY_FOR_PICKUP" && (
                          <Badge variant="info">Chờ Shipper Lấy</Badge>
                        )}
                        {order.status === "COMPLETED" && (
                          <Badge variant="success">Hoàn Tất</Badge>
                        )}
                      </div>
                    </div>

                    {/* Khách & Tài xế */}
                    <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Khách hàng:</span>
                        <span className="font-semibold text-slate-800">{order.customerName}</span>
                        <span className="text-slate-500 block">{order.customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tài xế nhận giao:</span>
                        <span className="font-semibold text-slate-800">{order.driverName || "Chưa gán tài xế"}</span>
                        {order.driverPlate && (
                          <span className="text-slate-600 block font-mono">{order.driverPlate}</span>
                        )}
                      </div>
                    </div>

                    {/* Món ăn */}
                    <div className="space-y-1.5 my-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div>
                            <span className="font-bold text-emerald-800 mr-1.5">{item.quantity}x</span>
                            <span className="font-medium text-slate-800">{item.name}</span>
                            {item.options && (
                              <span className="text-[11px] text-slate-500 block ml-4">
                                {item.options.join(" • ")}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-600">
                            {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Thanh toán & Payout */}
                    <div className="pt-2 border-t border-slate-100 text-xs flex justify-between items-center text-slate-600">
                      <div>
                        Tổng đơn khách: <span className="font-semibold text-slate-800">{order.totalAmount.toLocaleString("vi-VN")} đ</span>
                        <span className="text-slate-400 block text-[11px]">
                          Chiết khấu sàn: -{order.platformCommission.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Quán thực nhận (Net):</span>
                        <span className="font-bold text-sm text-emerald-700 font-mono">
                          {order.netPayout.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                      {order.status === "WAITING_ACCEPT" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                        >
                          <Icon name="check" size={14} className="mr-1" />
                          Xác Nhận & Bắn Vào Bếp KDS
                        </Button>
                      )}
                      {order.status === "COOKING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReadyForPickup(order.id)}
                          className="border-blue-500 text-blue-700 hover:bg-blue-50 w-full"
                        >
                          <Icon name="checkCircle" size={14} className="mr-1" />
                          Báo Đã Nấu Xong (Sẵn Sàng Giao Shipper)
                        </Button>
                      )}
                      {order.status === "READY_FOR_PICKUP" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCompleteDelivery(order.id)}
                          className="bg-slate-800 hover:bg-slate-900 text-white w-full"
                        >
                          <Icon name="arrowRight" size={14} className="mr-1" />
                          Bàn Giao Shipper & Hoàn Tất
                        </Button>
                      )}
                      {order.status === "COMPLETED" && (
                        <div className="text-xs text-emerald-600 flex items-center font-medium">
                          <Icon name="check" size={14} className="mr-1" /> Đã hoàn tất và lưu vào doanh thu
                        </div>
                      )}
                    </div>
                  </Panel>
                );
              })
            )}
          </div>
        </DataTableCard>
      )}

      {/* TAB 2: KÊNH KẾT NỐI */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => (
            <Panel key={channel.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${channel.badgeColor}`}>
                    {channel.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{channel.name}</h3>
                    <p className="text-xs text-slate-500">
                      {channel.isConnected
                        ? `Merchant ID: ${channel.merchantStoreId || "Chưa có"}`
                        : "Chưa kết nối tài khoản đối tác"}
                    </p>
                  </div>
                </div>

                <Badge variant={channel.isConnected ? "success" : "default"}>
                  {channel.isConnected ? "Đang Kết Nối Live" : "Chưa Liên Kết"}
                </Badge>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tự động nhận đơn (Auto-accept):</span>
                  <span className="font-semibold text-slate-800">{channel.autoAccept ? "Bật" : "Tắt"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tự động bắn vào Bếp KDS:</span>
                  <span className="font-semibold text-slate-800">{channel.autoSendToKds ? "Bật" : "Tắt"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tỷ lệ tăng giá bù chiết khấu sàn:</span>
                  <span className="font-semibold text-emerald-700 font-mono">+{channel.priceMarkupPercent}%</span>
                </div>
                {channel.lastSyncAt && (
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Đồng bộ thực đơn lần cuối:</span>
                    <span>{channel.lastSyncAt}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingChannel(channel)}
                  className="text-xs"
                >
                  <Icon name="edit" size={14} className="mr-1" />
                  Cấu Hình Kênh
                </Button>
                {channel.isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.success(`Đã đồng bộ lại thực đơn sang ${channel.name}!`);
                    }}
                    className="text-xs text-emerald-700 border-emerald-300"
                  >
                    <Icon name="refresh" size={14} className="mr-1" />
                    Đồng Bộ Ngay
                  </Button>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* TAB 3: ĐỒNG BỘ MENU */}
      {activeTab === "menu_sync" && (
        <Panel className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Đồng Bộ Thực Đơn Sang GrabFood & ShopeeFood</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tự động áp dụng tỷ lệ tăng giá bù hoa hồng sàn để đảm bảo lợi nhuận ròng cho quán.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success("Đã đồng bộ toàn bộ 28 món sang GrabFood & ShopeeFood thành công!")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Icon name="refresh" size={14} className="mr-1" />
              Đồng Bộ Toàn Bộ Món Sang Tất Cả Kênh
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Món Ăn</TableHead>
                  <TableHead>Giá Bán Tại Bàn</TableHead>
                  <TableHead>Giá Bán Grab (+15%)</TableHead>
                  <TableHead>Giá Bán Shopee (+20%)</TableHead>
                  <TableHead align="center">Bật Bán Trên App</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Phở Bò Tái Nạm Đặc Biệt", price: 55000 },
                  { name: "Phở Gà Đùi Lá Chanh", price: 45000 },
                  { name: "Cơm Rang Dưa Bò Giòn", price: 50000 },
                  { name: "Bún Chả Nem Cua Bể", price: 50000 },
                  { name: "Trà Đào Cam Sả Tươi", price: 30000 },
                  { name: "Cà Phê Muối Kem Béo", price: 28000 },
                ].map((item, i) => {
                  const grabPrice = Math.round((item.price * 1.15) / 1000) * 1000;
                  const shopeePrice = Math.round((item.price * 1.2) / 1000) * 1000;
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-semibold text-slate-800">{item.name}</TableCell>
                      <TableCell className="font-mono text-slate-600">{item.price.toLocaleString("vi-VN")} đ</TableCell>
                      <TableCell className="font-mono text-emerald-700 font-semibold">{grabPrice.toLocaleString("vi-VN")} đ</TableCell>
                      <TableCell className="font-mono text-orange-600 font-semibold">{shopeePrice.toLocaleString("vi-VN")} đ</TableCell>
                      <TableCell align="center">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      )}

      {/* Modal Cấu Hình Kênh */}
      {editingChannel && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Cấu Hình Kết Nối {editingChannel.name}</h3>
                <button onClick={() => setEditingChannel(null)} className="text-slate-400 hover:text-slate-600">
                  <Icon name="x" size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveChannelConfig} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Nhà Hàng (Merchant Store ID):</label>
                  <input
                    type="text"
                    value={editingChannel.merchantStoreId || ""}
                    onChange={(e) => setEditingChannel({ ...editingChannel, merchantStoreId: e.target.value })}
                    placeholder="VD: VN-GF-884902"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Webhook URL Nhận Đơn (Cung cấp cho sàn):</label>
                  <input
                    type="text"
                    readOnly
                    value={editingChannel.webhookUrl}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tỷ lệ tăng giá bán trên app (% bù chiết khấu):</label>
                  <input
                    type="number"
                    value={editingChannel.priceMarkupPercent}
                    onChange={(e) => setEditingChannel({ ...editingChannel, priceMarkupPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingChannel.isConnected}
                      onChange={(e) => setEditingChannel({ ...editingChannel, isConnected: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">Kích hoạt kết nối kênh này</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingChannel.autoAccept}
                      onChange={(e) => setEditingChannel({ ...editingChannel, autoAccept: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Tự động chấp nhận đơn khi sàn gửi webhook</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingChannel.autoSendToKds}
                      onChange={(e) => setEditingChannel({ ...editingChannel, autoSendToKds: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Tự động bắn đơn vào Màn Hình Bếp (KDS)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingChannel(null)}>
                    Hủy Bỏ
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 text-white">
                    Lưu Cấu Hình
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
