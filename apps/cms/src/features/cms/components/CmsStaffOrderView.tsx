import React, { useState, useMemo } from "react";
import { Icon, Button, Badge, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { WaiterOrderItem, WaiterTableOrder } from "@/types/cms.types";

interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  isPopular?: boolean;
  modifiers?: string[];
}

const SAMPLE_DISHES: DishItem[] = [
  {
    id: "d1",
    name: "Phở Bò Tái Lăn Đặc Biệt",
    category: "Món Chính",
    price: 65000,
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&auto=format&fit=crop&q=80",
    description: "Thịt bò tái xào tỏi thơm lừng, nước dùng hầm xương 24h",
    isPopular: true,
    modifiers: ["Không hành", "Nhiều hành", "Ít bánh phở", "Thịt tái mềm", "Trứng chần"],
  },
  {
    id: "d2",
    name: "Phở Gà Đùi Lá Chanh",
    category: "Món Chính",
    price: 55000,
    image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=300&auto=format&fit=crop&q=80",
    description: "Gà ta thả vườn da giòn thịt ngọt, thơm hương lá chanh",
    modifiers: ["Thịt nạc", "Có da", "Thêm trứng non", "Đầu cánh"],
  },
  {
    id: "d3",
    name: "Bún Chả Nem Cua Bể",
    category: "Món Chính",
    price: 60000,
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=300&auto=format&fit=crop&q=80",
    description: "Chả nướng than hoa vàng rộm ăn kèm nem cua bể giòn rụm",
    isPopular: true,
    modifiers: ["Nhiều chả miếng", "Nhiều chả băm", "Không cay", "Nhiều rau sống"],
  },
  {
    id: "d4",
    name: "Nem Rán Hà Nội (Dĩa 6 cuốn)",
    category: "Khai Vị",
    price: 45000,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80",
    description: "Vỏ giòn rụm nhân thịt mộc nhĩ nấm hương truyền thống",
    modifiers: ["Tương ớt riêng", "Nước mắm chua ngọt"],
  },
  {
    id: "d5",
    name: "Quẩy Giòn Phở (Dĩa 3 chiếc)",
    category: "Khai Vị",
    price: 15000,
    image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=300&auto=format&fit=crop&q=80",
    description: "Quẩy nóng giòn rụm nhúng súp phở",
  },
  {
    id: "d6",
    name: "Trà Đào Cam Sả Tươi",
    category: "Đồ Uống",
    price: 35000,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&auto=format&fit=crop&q=80",
    description: "Trà ủ lạnh kèm miếng đào giòn và sả tươi thanh mát",
    isPopular: true,
    modifiers: ["50% đường", "Ít đá", "Không đá", "Đá riêng", "Thêm đào"],
  },
  {
    id: "d7",
    name: "Trà Chanh Giã Tay Quảng Đông",
    category: "Đồ Uống",
    price: 29000,
    image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=300&auto=format&fit=crop&q=80",
    description: "Chanh nước hoa thơm nồng dập tươi đậm vị",
    modifiers: ["Ít ngọt", "Chua nhiều", "Ít đá", "Mang về"],
  },
  {
    id: "d8",
    name: "Cà Phê Sữa Đá Sài Gòn",
    category: "Đồ Uống",
    price: 28000,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&auto=format&fit=crop&q=80",
    description: "Cà phê Robusta đậm đặc pha phin sữa đặc béo ngậy",
    modifiers: ["Nhiều sữa", "Đậm cà phê", "Ít đá"],
  },
  {
    id: "d9",
    name: "Lẩu Riêu Cua Bắp Bò Sườn Sụn (Nồi Vừa)",
    category: "Lẩu & Nướng",
    price: 280000,
    image: "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=300&auto=format&fit=crop&q=80",
    description: "Nước lẩu giấm bỗng chua thanh, riêu cua đồng xịn, bắp bò hoa",
    isPopular: true,
    modifiers: ["Không cay", "Cay nồng", "Thêm trứng vịt lộn", "Thêm rau muống chẻ"],
  },
];

const INITIAL_TABLES: WaiterTableOrder[] = [
  {
    tableId: "t1",
    tableName: "Bàn 01",
    zoneName: "Tầng 1",
    guestCount: 2,
    status: "OCCUPIED",
    openedAt: "18:20",
    items: [
      { dishId: "d1", name: "Phở Bò Tái Lăn Đặc Biệt", price: 65000, quantity: 2, notes: "Không hành, 1 chín 1 tái", status: "COOKING" },
      { dishId: "d5", name: "Quẩy Giòn Phở", price: 15000, quantity: 1, status: "SERVED" },
      { dishId: "d6", name: "Trà Đào Cam Sả Tươi", price: 35000, quantity: 2, notes: "Ít đá", status: "SERVED" },
    ],
    totalAmount: 180000,
  },
  {
    tableId: "t2",
    tableName: "Bàn 02",
    zoneName: "Tầng 1",
    guestCount: 4,
    status: "WAITING_FOOD",
    openedAt: "18:45",
    items: [
      { dishId: "d9", name: "Lẩu Riêu Cua Bắp Bò", price: 280000, quantity: 1, notes: "Ít cay", status: "WAITING" },
      { dishId: "d4", name: "Nem Rán Hà Nội", price: 45000, quantity: 2, status: "COOKING" },
    ],
    totalAmount: 370000,
  },
  {
    tableId: "t3",
    tableName: "Bàn 03",
    zoneName: "Tầng 1",
    guestCount: 0,
    status: "EMPTY",
    items: [],
    totalAmount: 0,
  },
  {
    tableId: "t4",
    tableName: "Bàn 04",
    zoneName: "Tầng 1",
    guestCount: 3,
    status: "BILL_REQUESTED",
    openedAt: "17:50",
    items: [
      { dishId: "d1", name: "Phở Bò Tái Lăn Đặc Biệt", price: 65000, quantity: 3, status: "SERVED" },
      { dishId: "d7", name: "Trà Chanh Giã Tay", price: 29000, quantity: 3, status: "SERVED" },
    ],
    totalAmount: 282000,
  },
  {
    tableId: "t5",
    tableName: "Bàn 05",
    zoneName: "Tầng 2",
    guestCount: 0,
    status: "EMPTY",
    items: [],
    totalAmount: 0,
  },
  {
    tableId: "t6",
    tableName: "Bàn VIP 1",
    zoneName: "Phòng VIP",
    guestCount: 8,
    status: "OCCUPIED",
    openedAt: "18:10",
    items: [
      { dishId: "d9", name: "Lẩu Riêu Cua Bắp Bò", price: 280000, quantity: 2, status: "SERVED" },
      { dishId: "d4", name: "Nem Rán Hà Nội", price: 45000, quantity: 3, status: "SERVED" },
      { dishId: "d8", name: "Cà Phê Sữa Đá Sài Gòn", price: 28000, quantity: 8, status: "SERVED" },
    ],
    totalAmount: 919000,
  },
];

import { usePersistentState } from "@/hooks/usePersistentState";

export const CmsStaffOrderView: React.FC = () => {
  const [tables, setTables] = usePersistentState<WaiterTableOrder[]>("staff_order_tables_data", INITIAL_TABLES);
  const [selectedZone, setSelectedZone] = useState<string>("TẤT CẢ");
  const [activeTableId, setActiveTableId] = usePersistentState<string>("staff_order_active_table", "t1");
  const [activeTab, setActiveTab] = useState<"MENU" | "SERVED_ITEMS">("MENU");

  // Điểm then chốt giải quyết khiếu nại UX Mobile: Luồng 3 bước rõ ràng
  const [mobileStep, setMobileStep] = useState<"TABLES" | "MENU" | "CART">("TABLES");

  // Giỏ hàng món mới đang chọn cho bàn active
  const [newOrderCart, setNewOrderCart] = useState<WaiterOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TẤT CẢ");

  // Modal tùy chỉnh ghi chú món
  const [modifyingDish, setModifyingDish] = useState<DishItem | null>(null);
  const [dishModifiers, setDishModifiers] = useState<string[]>([]);
  const [dishCustomNote, setDishCustomNote] = useState("");

  // Modal chuyển / ghép bàn
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState("");
  const [transferMode, setTransferMode] = useState<"MOVE" | "MERGE">("MOVE");

  // Bàn đang được chọn
  const activeTable = useMemo(
    () => tables.find((t) => t.tableId === activeTableId) || tables[0],
    [tables, activeTableId]
  );

  // Danh sách khu vực bàn
  const zones = useMemo(() => {
    const list = Array.from(new Set(tables.map((t) => t.zoneName)));
    return ["TẤT CẢ", ...list];
  }, [tables]);

  // Lọc bàn theo khu vực
  const filteredTables = useMemo(() => {
    if (selectedZone === "TẤT CẢ") return tables;
    return tables.filter((t) => t.zoneName === selectedZone);
  }, [tables, selectedZone]);

  // Danh mục món
  const categories = useMemo(() => {
    const list = Array.from(new Set(SAMPLE_DISHES.map((d) => d.category)));
    return ["TẤT CẢ", ...list];
  }, []);

  // Lọc món theo category & search
  const filteredDishes = useMemo(() => {
    return SAMPLE_DISHES.filter((d) => {
      const matchCat = selectedCategory === "TẤT CẢ" || d.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Thêm món nhanh vào giỏ order
  const handleQuickAddDish = (dish: DishItem) => {
    setNewOrderCart((prev) => {
      const existIdx = prev.findIndex((item) => item.dishId === dish.id && !item.notes);
      if (existIdx > -1) {
        const updated = [...prev];
        updated[existIdx] = {
          ...updated[existIdx],
          quantity: updated[existIdx].quantity + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          status: "WAITING",
        },
      ];
    });
    toast.success(`Đã thêm ${dish.name} vào đơn bàn ${activeTable.tableName}`);
  };

  // Mở modal tùy chỉnh ghi chú cho món
  const handleOpenCustomize = (dish: DishItem) => {
    setModifyingDish(dish);
    setDishModifiers([]);
    setDishCustomNote("");
  };

  // Xác nhận thêm món có tùy chỉnh ghi chú
  const handleAddToCart = (dish: DishItem, modifiers: string[], customNote: string) => {
    const allNotes = [...modifiers, customNote.trim()].filter(Boolean).join(", ");
    setNewOrderCart((prev) => [
      ...prev,
      {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        notes: allNotes,
        status: "WAITING",
      },
    ]);
    toast.success(`Đã thêm ${dish.name} (có ghi chú)`);
  };

  // Tăng giảm số lượng trong giỏ
  const handleUpdateQuantity = (index: number, delta: number) => {
    setNewOrderCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
      }
      return updated;
    });
  };

  // Gửi order mới vào bếp nấu
  const handleSendToKitchen = () => {
    if (newOrderCart.length === 0) return;

    const addedAmount = newOrderCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const newServedItems: WaiterOrderItem[] = newOrderCart.map((item) => ({
      ...item,
      status: "COOKING",
      orderedAt: timeNow,
    }));

    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          return {
            ...t,
            status: "WAITING_FOOD",
            openedAt: t.openedAt || timeNow,
            items: [...t.items, ...newServedItems],
            totalAmount: t.totalAmount + addedAmount,
          };
        }
        return t;
      })
    );

    toast.success(`Đã bắn ${newOrderCart.length} món của ${activeTable.tableName} vào Bếp KDS thành công! 🔥`);
    setNewOrderCart([]);
    setActiveTab("SERVED_ITEMS");
    // Chuyển sang bước xem phiếu để nhân viên xác nhận
    setMobileStep("CART");
  };

  // Yêu cầu in tạm tính bill cho bàn
  const handleRequestBill = async () => {
    const ok = await confirmDialog({
      title: `In tạm tính cho ${activeTable.tableName}?`,
      message: `Tổng tiền hiện tại: ${activeTable.totalAmount.toLocaleString("vi-VN")} đ (${activeTable.items.length} món). Bấm xác nhận để gửi lệnh in bill tới máy in thu ngân.`,
      confirmText: "In Tạm Tính Ngay",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    setTables((prev) =>
      prev.map((t) => (t.tableId === activeTable.tableId ? { ...t, status: "BILL_REQUESTED" } : t))
    );
    toast.success(`Đã gửi lệnh in tạm tính cho ${activeTable.tableName} tới thu ngân!`);
  };

  // Gọi dịch vụ phục vụ bàn
  const handleCallStaffService = (serviceName: string) => {
    toast.info(`Đã gửi yêu cầu "${serviceName}" cho ${activeTable.tableName}`);
  };

  // Thực hiện chuyển hoặc ghép bàn
  const handleExecuteTransfer = () => {
    if (!targetTransferTableId) {
      toast.error("Vui lòng chọn bàn đích để thực hiện");
      return;
    }

    const target = tables.find((t) => t.tableId === targetTransferTableId);
    if (!target) return;

    if (transferMode === "MOVE") {
      setTables((prev) =>
        prev.map((t) => {
          if (t.tableId === activeTable.tableId) {
            return { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined };
          }
          if (t.tableId === target.tableId) {
            return {
              ...t,
              items: activeTable.items,
              totalAmount: activeTable.totalAmount,
              status: activeTable.status,
              openedAt: activeTable.openedAt,
            };
          }
          return t;
        })
      );
      toast.success(`Đã chuyển toàn bộ đơn từ ${activeTable.tableName} sang ${target.tableName}`);
      setActiveTableId(target.tableId);
    } else {
      setTables((prev) =>
        prev.map((t) => {
          if (t.tableId === activeTable.tableId) {
            return { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined };
          }
          if (t.tableId === target.tableId) {
            return {
              ...t,
              items: [...target.items, ...activeTable.items],
              totalAmount: target.totalAmount + activeTable.totalAmount,
              status: "OCCUPIED",
            };
          }
          return t;
        })
      );
      toast.success(`Đã ghép đơn ${activeTable.tableName} vào ${target.tableName}`);
      setActiveTableId(target.tableId);
    }

    setIsTransferModalOpen(false);
    setTargetTransferTableId("");
  };

  // Hủy món đã gọi
  const handleCancelServedItem = async (index: number) => {
    const item = activeTable.items[index];
    if (!item) return;

    const ok = await confirmDialog({
      title: `Hủy món "${item.name}"?`,
      message: `Hủy món sẽ trừ ${item.price * item.quantity}đ khỏi bàn ${activeTable.tableName}.`,
      confirmText: "Xác Nhận Hủy Món",
      cancelText: "Không Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updatedItems = [...t.items];
          const removed = updatedItems.splice(index, 1)[0];
          return {
            ...t,
            items: updatedItems,
            totalAmount: Math.max(0, t.totalAmount - removed.price * removed.quantity),
          };
        }
        return t;
      })
    );
    toast.info(`Đã hủy món ${item.name} của ${activeTable.tableName}`);
  };

  const cartTotalAmount = newOrderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalQuantity = newOrderCart.reduce((sum, item) => sum + item.quantity, 0);

  // Component UI: Sơ đồ chọn bàn
  const renderTableGrid = () => (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border space-y-3 shadow-xs flex-1 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="table" className="w-4 h-4 text-brand-900" />
          <span className="text-xs font-black uppercase tracking-wider text-ink-primary">
            Chọn Bàn Phục Vụ
          </span>
          <span className="text-xs text-ink-muted">({tables.length} bàn)</span>
        </div>

        {/* Filter Khu Vực */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1 rounded-full transition-all shrink-0 ${
                selectedZone === z
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Grid thẻ bàn */}
      <div className="overflow-y-auto flex-1 min-h-0 pr-0.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {filteredTables.map((t) => {
          const isSelected = t.tableId === activeTable.tableId;
          return (
            <button
              key={t.tableId}
              type="button"
              onClick={() => {
                setActiveTableId(t.tableId);
                // Bấm chọn bàn trên mobile sẽ lập tức chuyển sang bước 2 (Gọi món)
                setMobileStep("MENU");
              }}
              className={`p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between min-h-[96px] active:scale-95 ${
                isSelected
                  ? "border-brand-900 ring-2 ring-brand-900/20 shadow-md bg-brand-50/40"
                  : t.status === "EMPTY"
                  ? "border-surface-border bg-white hover:border-brand-200"
                  : t.status === "OCCUPIED"
                  ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                  : t.status === "WAITING_FOOD"
                  ? "border-purple-300 bg-purple-50/50 hover:border-purple-400"
                  : "border-rose-400 bg-rose-50/60 hover:border-rose-500 animate-pulse"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-black text-ink-primary">{t.tableName}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    t.status === "EMPTY"
                      ? "bg-slate-300"
                      : t.status === "OCCUPIED"
                      ? "bg-amber-500"
                      : t.status === "WAITING_FOOD"
                      ? "bg-purple-600"
                      : "bg-rose-600"
                  }`}
                />
              </div>

              <div className="mt-1">
                <div className="text-[10px] text-ink-muted">{t.zoneName}</div>
                {t.items.length > 0 ? (
                  <div className="text-xs font-black text-brand-950 mt-0.5">
                    {t.totalAmount.toLocaleString("vi-VN")} đ
                  </div>
                ) : (
                  <div className="text-[11px] font-bold text-slate-400 italic">Bàn trống</div>
                )}
              </div>

              {t.items.length > 0 && (
                <div className="flex items-center justify-between text-[10px] text-ink-muted border-t border-surface-border/40 pt-1 mt-1">
                  <span>{t.items.length} món</span>
                  <span>{t.openedAt}</span>
                </div>
              )}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );

  // Component UI: Menu gọi món
  const renderMenuSection = () => (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs space-y-3 flex-1 flex flex-col min-h-0">
      {/* Banner thông tin bàn hiện tại trên mobile */}
      <div className="lg:hidden flex items-center justify-between p-2.5 bg-brand-50 border border-brand-200/60 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileStep("TABLES")}
          className="flex items-center gap-1 text-xs font-black text-brand-900"
        >
          <Icon name="arrowRight" size={12} className="rotate-180" />
          <span>Đổi Bàn</span>
        </button>

        <div className="text-center">
          <span className="font-black text-sm text-brand-950 block leading-tight">
            {activeTable.tableName}
          </span>
          <span className="text-[10px] text-brand-700 font-semibold">
            {activeTable.zoneName} • {activeTable.status === "EMPTY" ? "Bàn Trống" : `Có ${activeTable.items.length} món`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileStep("CART")}
          className="text-xs font-black text-brand-900 bg-white px-2.5 py-1 rounded-xl border border-brand-200 shadow-2xs flex items-center gap-1"
        >
          <Icon name="cart" size={13} />
          <span>Phiếu ({activeTable.items.length + newOrderCart.length})</span>
        </button>
      </div>

      {/* Thanh tìm kiếm & lọc category */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh món ăn, nước uống..."
            className="w-full h-10 pl-9 pr-3 rounded-2xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 ${
                selectedCategory === c
                  ? "bg-brand-900 text-white"
                  : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách món ăn */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0 lg:max-h-[520px] pr-1 ${
        mobileStep === "MENU" && (newOrderCart.length > 0 || activeTable.items.length > 0) ? "pb-16" : ""
      }`}>
        {filteredDishes.map((dish) => (
          <div
            key={dish.id}
            className="p-3 rounded-2xl border border-surface-border bg-white hover:border-brand-300 hover:shadow-xs transition-all flex gap-3 group"
          >
            <img
              src={dish.image}
              alt={dish.name}
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-xs font-bold text-ink-primary leading-snug">
                    {dish.name}
                  </h4>
                  {dish.isPopular && (
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black shrink-0">
                      HOT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-ink-muted line-clamp-1 mt-0.5">
                  {dish.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-border/40">
                <span className="text-xs font-black text-brand-950">
                  {dish.price.toLocaleString("vi-VN")} đ
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenCustomize(dish)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-ink-muted bg-surface-canvas hover:bg-surface-muted border border-surface-border"
                    title="Ghi chú khẩu vị"
                  >
                    Ghi chú
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAddDish(dish)}
                    className="w-7 h-7 rounded-xl bg-brand-900 text-white flex items-center justify-center hover:bg-brand-950 shadow-xs active:scale-90 transition-transform"
                    title="Thêm nhanh"
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Component UI: Phiếu gọi món & giỏ hàng
  const renderCartSection = () => (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs flex flex-col flex-1 min-h-0">
      {/* Header bàn đang chọn */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-ink-primary">
              {activeTable.tableName}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTable.status === "EMPTY"
                  ? "bg-slate-100 text-slate-700"
                  : activeTable.status === "OCCUPIED"
                  ? "bg-amber-100 text-amber-900"
                  : activeTable.status === "WAITING_FOOD"
                  ? "bg-purple-100 text-purple-900"
                  : "bg-rose-100 text-rose-900"
              }`}
            >
              {activeTable.status === "EMPTY"
                ? "Bàn trống"
                : activeTable.status === "OCCUPIED"
                ? "Có khách"
                : activeTable.status === "WAITING_FOOD"
                ? "Chờ món"
                : "Chờ thanh toán"}
            </span>
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            Số khách: <span className="font-bold text-ink-primary">{activeTable.guestCount || 0} người</span> • Giờ vào:{" "}
            <span className="font-bold text-ink-primary">{activeTable.openedAt || "Chưa mở bàn"}</span>
          </div>
        </div>

        {/* Toggle 2 Tab */}
        <div className="p-1 bg-surface-canvas rounded-xl border border-surface-border flex text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("MENU")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "MENU"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Món Mới ({newOrderCart.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SERVED_ITEMS")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "SERVED_ITEMS"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Đã Gọi ({activeTable.items.length})
          </button>
        </div>
      </div>

      {/* TAB 1: GIỎ MÓN MỚI SẮP GỬI BẾP */}
      {activeTab === "MENU" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 lg:max-h-[360px] pr-1">
            {newOrderCart.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted space-y-2">
                <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto text-ink-subtle">
                  <Icon name="cart" className="w-6 h-6" />
                </div>
                <p className="font-bold">Chưa chọn món mới nào</p>
                <p className="text-[11px]">Bấm dấu (+) trên menu để thêm món vào order</p>
                <button
                  type="button"
                  onClick={() => setMobileStep("MENU")}
                  className="lg:hidden mt-2 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-bold"
                >
                  ← Mở Menu Chọn Món
                </button>
              </div>
            ) : (
              newOrderCart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink-primary truncate">{item.name}</div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-700 italic truncate font-semibold">
                        Ghi chú: {item.notes}
                      </div>
                    )}
                    <div className="text-[11px] font-black text-brand-900 mt-0.5">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  {/* Bộ điều khiển số lượng */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-surface-border">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(idx, -1)}
                      className="w-6 h-6 rounded-lg text-ink-subtle hover:bg-surface-muted flex items-center justify-center font-bold"
                    >
                      <Icon name="minus" className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-black text-xs text-ink-primary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(idx, 1)}
                      className="w-6 h-6 rounded-lg text-ink-subtle hover:bg-surface-muted flex items-center justify-center font-bold"
                    >
                      <Icon name="plus" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Giỏ hàng & Nút Gửi Bếp */}
          <div className="pt-3 border-t border-surface-border mt-3 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Tạm tính món mới:</span>
              <span className="font-black text-sm text-brand-950">
                {cartTotalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={newOrderCart.length === 0}
                onClick={() => setNewOrderCart([])}
                className="rounded-2xl text-xs font-bold"
              >
                Xóa Giỏ
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={newOrderCart.length === 0}
                onClick={handleSendToKitchen}
                className="rounded-2xl bg-brand-900 text-white text-xs font-black shadow-sm gap-1.5"
              >
                <Icon name="kitchen" className="w-3.5 h-3.5" />
                <span>Gửi Bếp Ngay 🔥</span>
              </Button>
            </div>

            {/* Nút quay lại menu chọn thêm trên mobile */}
            <button
              type="button"
              onClick={() => setMobileStep("MENU")}
              className="lg:hidden w-full py-2 rounded-xl text-xs font-bold text-brand-900 hover:bg-brand-50 border border-brand-200 transition-colors mt-1"
            >
              + Gọi Thêm Món Khác
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CÁC MÓN BÀN NÀY ĐÃ GỌI TRƯỚC ĐÓ */}
      {activeTab === "SERVED_ITEMS" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 lg:max-h-[380px] pr-1">
            {activeTable.items.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                Bàn này chưa có món nào được gửi vào bếp.
              </div>
            ) : (
              activeTable.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-brand-950">{item.quantity}x</span>
                      <span className="font-bold text-ink-primary truncate">{item.name}</span>
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-ink-muted italic truncate">
                        {item.notes}
                      </div>
                    )}
                    <div className="text-[10px] text-ink-subtle mt-0.5">
                      Gọi lúc: {item.orderedAt || "Trước đó"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.status === "SERVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "COOKING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.status === "SERVED"
                        ? "Đã lên bàn"
                        : item.status === "COOKING"
                        ? "Bếp đang nấu"
                        : "Chờ bếp"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCancelServedItem(idx)}
                      className="p-1 text-ink-subtle hover:text-rose-600 hover:bg-white rounded transition-colors"
                      title="Hủy món"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-surface-border mt-3 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Tổng cộng toàn bàn:</span>
              <span className="font-black text-base text-brand-950">
                {activeTable.totalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleRequestBill}
              className="w-full rounded-2xl bg-amber-600 text-white text-xs font-black shadow-xs gap-1.5"
            >
              <Icon name="print" className="w-3.5 h-3.5" />
              <span>In Tạm Tính / Báo Thu Ngân</span>
            </Button>

            <button
              type="button"
              onClick={() => setMobileStep("MENU")}
              className="lg:hidden w-full py-2 rounded-xl text-xs font-bold text-brand-900 hover:bg-brand-50 border border-brand-200 transition-colors mt-1"
            >
              + Gọi Thêm Món
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Top Header thanh điều hành Order Cầm Tay */}
      <div className="hidden lg:flex items-center justify-between gap-3 pb-1 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              POS Cầm Tay Phục Vụ (Waiter Handheld)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Trực Tuyến
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Nhân viên: <span className="font-bold text-ink-primary">Tuấn Anh (Ca Sáng)</span> • Đang phục vụ tại bàn
          </p>
        </div>

        {/* Nút tác vụ nhanh */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => handleCallStaffService("Thêm đá & khăn lạnh")}
            className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold bg-surface-canvas hover:bg-brand-50 hover:text-brand-900 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Icon name="bell" className="w-3.5 h-3.5 text-brand-900" />
            <span>Xin Đá / Khăn</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            disabled={activeTable.items.length === 0}
            className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold bg-white hover:border-brand-300 hover:text-brand-900 transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          >
            <Icon name="refresh" className="w-3.5 h-3.5" />
            <span>Chuyển / Ghép Bàn</span>
          </button>

          <button
            type="button"
            onClick={handleRequestBill}
            disabled={activeTable.items.length === 0}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          >
            <Icon name="print" className="w-3.5 h-3.5" />
            <span>In Tạm Tính</span>
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG 3 BƯỚC THÔNG MINH CHO MOBILE (STEP-BY-STEP) */}
      <div className="lg:hidden p-1 bg-white rounded-2xl border border-surface-border shadow-xs flex items-center gap-1 text-xs font-bold shrink-0">
        <button
          type="button"
          onClick={() => setMobileStep("TABLES")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileStep === "TABLES"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "text-ink-muted hover:text-ink-primary bg-surface-canvas"
          }`}
        >
          <Icon name="table" size={13} />
          <span>1. Chọn Bàn</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileStep("MENU")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileStep === "MENU"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "text-ink-muted hover:text-ink-primary bg-surface-canvas"
          }`}
        >
          <Icon name="menu" size={13} />
          <span>2. Gọi Món</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileStep("CART")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
            mobileStep === "CART"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "text-ink-muted hover:text-ink-primary bg-surface-canvas"
          }`}
        >
          <Icon name="cart" size={13} />
          <span>3. Phiếu Bàn</span>
          {(newOrderCart.length > 0 || activeTable.items.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-2" />
          )}
        </button>
      </div>

      {/* HIỂN THỊ TRÊN MOBILE: CHỈ HIỆN BƯỚC ĐANG CHỌN (KHÔNG CUỘN DỌC TRÀN LAN) */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        {mobileStep === "TABLES" && renderTableGrid()}
        {mobileStep === "MENU" && renderMenuSection()}
        {mobileStep === "CART" && renderCartSection()}
      </div>

      {/* HIỂN THỊ TRÊN DESKTOP: BẢNG ĐIỀU KHIỂN TOÀN CẢNH ĐA CỘT */}
      <div className="hidden lg:block space-y-4">
        {/* Sơ đồ bàn desktop */}
        {renderTableGrid()}

        {/* 2 Cột Menu & Phiếu bàn desktop */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7">{renderMenuSection()}</div>
          <div className="col-span-5">{renderCartSection()}</div>
        </div>
      </div>

      {/* Mobile Floating Sticky Cart Bar (Giỏ hàng nổi khi đang ở bước chọn món) */}
      {mobileStep === "MENU" && (newOrderCart.length > 0 || activeTable.items.length > 0) && (
        <aside aria-label="Giỏ hàng di động" className="lg:hidden fixed bottom-18 left-3 right-3 z-40 animate-slideUp">
          <div className="bg-brand-950 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-brand-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {cartTotalQuantity || activeTable.items.length}
              </div>
              <div>
                <div className="text-xs font-black">
                  {activeTable.tableName} • {newOrderCart.length > 0 ? "Món mới chờ gửi" : "Đang phục vụ"}
                </div>
                <div className="text-[11px] text-brand-200 font-bold">
                  {(cartTotalAmount || activeTable.totalAmount).toLocaleString("vi-VN")} đ
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setMobileStep("CART")}
              className="rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-black shadow-md px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <span>Xem Phiếu ➔</span>
            </Button>
          </div>
        </aside>
      )}

      {/* MODAL TÙY CHỈNH GHI CHÚ KHẨU VỊ (MODIFIER MODAL) */}
      {modifyingDish && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated p-5 space-y-4 border border-surface-border animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-ink-primary">{modifyingDish.name}</h3>
                  <span className="text-xs font-bold text-brand-900">
                    {modifyingDish.price.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setModifyingDish(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chọn nhanh modifier */}
              {modifyingDish.modifiers && modifyingDish.modifiers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-secondary block">
                    Khẩu vị khách yêu cầu:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {modifyingDish.modifiers.map((m) => {
                      const isSelected = dishModifiers.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setDishModifiers((prev) => prev.filter((item) => item !== m));
                            } else {
                              setDishModifiers((prev) => [...prev, m]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-brand-900 text-white shadow-xs"
                              : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ghi chú tự do */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-secondary block">
                  Ghi chú riêng cho đầu bếp:
                </label>
                <input
                  type="text"
                  value={dishCustomNote}
                  onChange={(e) => setDishCustomNote(e.target.value)}
                  placeholder="VD: Cay vừa, làm nóng, bỏ đá riêng..."
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setModifyingDish(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                  onClick={() => {
                    handleAddToCart(modifyingDish, dishModifiers, dishCustomNote);
                    setModifyingDish(null);
                  }}
                >
                  Xác Nhận Thêm
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL CHUYỂN BÀN / GHÉP BÀN */}
      {isTransferModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-sm font-black text-ink-primary">
                    Chuyển Hoặc Ghép Bàn
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Bàn hiện tại: <span className="font-bold text-brand-900">{activeTable.tableName}</span> ({activeTable.items.length} món)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chọn hình thức */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-canvas rounded-2xl border border-surface-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTransferMode("MOVE")}
                  className={`py-2 rounded-xl transition-all ${
                    transferMode === "MOVE"
                      ? "bg-white text-brand-900 shadow-xs"
                      : "text-ink-muted hover:text-ink-primary"
                  }`}
                >
                  🔄 Chuyển Sang Bàn Khác
                </button>
                <button
                  type="button"
                  onClick={() => setTransferMode("MERGE")}
                  className={`py-2 rounded-xl transition-all ${
                    transferMode === "MERGE"
                      ? "bg-white text-brand-900 shadow-xs"
                      : "text-ink-muted hover:text-ink-primary"
                  }`}
                >
                  🔗 Ghép 2 Bàn Lại
                </button>
              </div>

              {/* Chọn bàn đích */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-ink-secondary block">
                  Chọn Bàn Đích:
                </label>
                <select
                  value={targetTransferTableId}
                  onChange={(e) => setTargetTransferTableId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                >
                  <option value="">-- Chọn bàn cần thao tác --</option>
                  {tables
                    .filter((t) => t.tableId !== activeTable.tableId)
                    .map((t) => (
                      <option key={t.tableId} value={t.tableId}>
                        {t.tableName} ({t.zoneName}) - {t.status === "EMPTY" ? "Trống" : `Có khách (${t.totalAmount.toLocaleString("vi-VN")} đ)`}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsTransferModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                  onClick={handleExecuteTransfer}
                >
                  Xác Nhận Thực Hiện
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
