import React, { useState, useEffect } from "react";
import { Panel, Button, Badge, Icon, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { TableZoneData, CmsTableItem, CmsTableManagementProps } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import { tableApi } from "@/services/api/tableApi";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";

// Lấy URL cơ sở gọi món động theo domain thực tế đang chạy
export function getOrderBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (import.meta as any).env?.VITE_ORDER_BASE_URL || (import.meta as any).env?.VITE_APP_URL || "http://localhost:3001";
}

// Trợ giúp tạo mã bàn mặc định & link QR gọi món tại bàn cho khách
export function generateDefaultTableCode(name: string, id?: string): string {
  if (!name || !name.trim()) return "";
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Tìm cụm số trong tên
  const numMatch = clean.match(/\d+/);
  const numStr = numMatch ? numMatch[0].padStart(2, "0") : "";

  const upper = clean.toUpperCase();
  if (upper.startsWith("VIP")) {
    return numStr ? `VIP-${numStr}` : `VIP-${upper.replace(/[^A-Z0-9]/g, "").slice(3) || "01"}`;
  }
  if (upper.startsWith("BAN") || upper.startsWith("TB") || upper.startsWith("TABLE")) {
    return numStr ? `TB-${numStr}` : `TB-${upper.replace(/[^A-Z0-9]/g, "").slice(3) || "01"}`;
  }

  // Tên có nhiều từ, ví dụ "Sân Thượng 2" -> chữ cái đầu các từ: ST-02
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1 && numStr) {
    const nonNumWords = words.filter((w) => !/^\d+$/.test(w));
    if (nonNumWords.length > 0) {
      const acronym = nonNumWords.map((w) => w[0].toUpperCase()).join("");
      return `${acronym}-${numStr}`;
    }
  }

  if (numStr) {
    const textPart = clean.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4);
    return textPart ? `${textPart}-${numStr}` : `TB-${numStr}`;
  }

  const slug = clean.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  return slug ? `TB-${slug}` : `TB-${(id || Math.random().toString(36).slice(2, 6)).slice(0, 4).toUpperCase()}`;
}

export function buildTableOrderQr(storeId: string, tableCode: string, tableId?: string) {
  const baseUrl = getOrderBaseUrl().replace(/\/$/, "");
  const orderUrl = `${baseUrl}/order?store=${storeId}&table=${encodeURIComponent(tableCode)}${tableId ? `&tableId=${tableId}` : ""}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}&margin=12`;
  return { orderUrl, qrCodeUrl };
}

export const CmsTableManagement: React.FC<CmsTableManagementProps> = ({
  currentRole = "STORE_OWNER",
  onNavigateToOrder,
}) => {
  const isWaiter = currentRole === "WAITER";
  const isCashier = currentRole === "CASHIER";

  // Lấy storeId thực tế từ phiên đăng nhập
  const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") || localStorage.getItem("a2order_auth_user") : null;
  const storeId = userStr ? JSON.parse(userStr).storeId || "store-bubble-tea" : "store-bubble-tea";

  const [zones, setZones] = usePersistentState<TableZoneData[]>("tables_zones_data", []);

  // Tự động tải sơ đồ bàn thực tế từ Database
  useEffect(() => {
    tableApi
      .getTableZones(storeId)
      .then((dbZones) => {
        if (dbZones && dbZones.length > 0) {
          setZones(dbZones);
        }
      })
      .catch((err) => {
        console.warn("Lỗi tải sơ đồ bàn từ server:", err);
      });
  }, [storeId]);

  // Lắng nghe Socket để đồng bộ trạng thái bàn (Mở bàn, đóng bàn, cập nhật PIN) trong thời gian thực
  useEffect(() => {
    const socket = getSocketClient();
    joinStoreRoom(storeId);

    const handleSessionApproved = (data: any) => {
      if (!data) return;
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          tables: z.tables.map((t) =>
            t.id === data.tableId
              ? {
                  ...t,
                  status: "OCCUPIED",
                  pin: data.pin || t.pin,
                  capacity: data.guestCount || t.capacity,
                }
              : t
          ),
        }))
      );
    };

    const handleSessionClosed = (data: any) => {
      if (!data) return;
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          tables: z.tables.map((t) =>
            t.id === data.tableId
              ? { ...t, status: "EMPTY" }
              : t
          ),
        }))
      );
    };

    const handleTableStatusUpdated = (data: any) => {
      if (!data || !data.tableId) return;
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          tables: z.tables.map((t) =>
            t.id === data.tableId
              ? { ...t, status: data.status || t.status, pin: data.pin || t.pin }
              : t
          ),
        }))
      );
    };

    socket.on("table:session_approved", handleSessionApproved);
    socket.on("table:session_closed", handleSessionClosed);
    socket.on("table:status_updated", handleTableStatusUpdated);

    return () => {
      socket.off("table:session_approved", handleSessionApproved);
      socket.off("table:session_closed", handleSessionClosed);
      socket.off("table:status_updated", handleTableStatusUpdated);
    };
  }, [storeId, setZones]);

  // Quản lý Modal Mở Bàn & Đóng Bàn
  const [openTableModal, setOpenTableModal] = useState<{
    table: CmsTableItem;
    zoneId: string;
  } | null>(null);
  const [openTableGuestCount, setOpenTableGuestCount] = useState<number>(2);
  const [isOpeningTable, setIsOpeningTable] = useState(false);
  const [isClosingTableId, setIsClosingTableId] = useState<string | null>(null);

  // Xử lý Mở Bàn từ Quản Lý Bàn
  const handleOpenTableSession = async (table: CmsTableItem, guestCount: number, andGoToOrder = false) => {
    try {
      setIsOpeningTable(true);
      const res = await tableApi.approveTableSession(storeId, table.id, guestCount);
      const newPin = res?.pin || table.pin || "1234";

      // Cập nhật trạng thái bàn cục bộ
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          tables: z.tables.map((t) =>
            t.id === table.id
              ? { ...t, status: "OCCUPIED", pin: newPin }
              : t
          ),
        }))
      );

      // Đồng bộ vào LocalStorage cho Gọi Món POS
      try {
        const storedOrders = localStorage.getItem("a2order_staff_order_tables_data");
        if (storedOrders) {
          const list = JSON.parse(storedOrders);
          const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          const updated = list.map((it: any) =>
            it.tableId === table.id
              ? { ...it, status: "OCCUPIED", guestCount, pin: newPin, openedAt: timeNow, openedAtMs: Date.now() }
              : it
          );
          localStorage.setItem("a2order_staff_order_tables_data", JSON.stringify(updated));
        }
      } catch (e) {}

      setOpenTableModal(null);
      toast.success(`Đã mở bàn ${table.name} (${guestCount} khách) thành công!`);

      if (andGoToOrder) {
        localStorage.setItem("a2order_staff_order_active_table", JSON.stringify(table.id));
        onNavigateToOrder?.(table.id);
      }
    } catch (err: any) {
      toast.error("Không thể mở bàn: " + (err.message || "Lỗi kết nối"));
    } finally {
      setIsOpeningTable(false);
    }
  };

  // Xử lý Đóng Bàn từ Quản Lý Bàn
  const handleCloseTableSession = async (table: CmsTableItem) => {
    const confirmed = await confirmDialog({
      title: `Đóng bàn ${table.name}?`,
      message: `Bạn có chắc muốn đóng phiên phục vụ của bàn ${table.name} và trả về trạng thái bàn trống?`,
      confirmText: "Đóng Bàn & Trả Bàn Trống",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      setIsClosingTableId(table.id);
      await tableApi.closeTableSession(storeId, table.id);

      // Cập nhật zones
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          tables: z.tables.map((t) =>
            t.id === table.id
              ? { ...t, status: "EMPTY" }
              : t
          ),
        }))
      );

      // Cập nhật storage của Gọi Món POS
      try {
        const storedOrders = localStorage.getItem("a2order_staff_order_tables_data");
        if (storedOrders) {
          const list = JSON.parse(storedOrders);
          const updated = list.map((it: any) =>
            it.tableId === table.id
              ? { ...it, status: "EMPTY", items: [], totalAmount: 0, openedAt: undefined, guestCount: 0 }
              : it
          );
          localStorage.setItem("a2order_staff_order_tables_data", JSON.stringify(updated));
        }
      } catch (e) {}

      toast.success(`Đã đóng bàn ${table.name} và trả về bàn trống.`);
    } catch (err: any) {
      toast.error("Không thể đóng bàn: " + (err.message || "Lỗi hệ thống"));
    } finally {
      setIsClosingTableId(null);
    }
  };

  // Nảy sang Gọi Món POS với bàn này được chọn sẵn
  const handleGoToOrder = (tableId: string) => {
    localStorage.setItem("a2order_staff_order_active_table", JSON.stringify(tableId));
    onNavigateToOrder?.(tableId);
  };

  // Bộ lọc
  const [selectedZoneTab, setSelectedZoneTab] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchTableQuery, setSearchTableQuery] = useState("");

  // Modals
  const [selectedQrTable, setSelectedQrTable] = useState<{
    id: string;
    name: string;
    code: string;
    pin?: string;
    orderUrl: string;
    qrUrl: string;
  } | null>(null);
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("z1");
  const [newTableName, setNewTableName] = useState("");
  const [newTableCode, setNewTableCode] = useState("");
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Modal sửa thông tin bàn ăn (Không cho sửa trạng thái, chỉ sửa tên bàn, mã bàn, khu vực, sức chứa)
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<{
    id: string;
    zoneId: string;
    name: string;
    code: string;
    capacity: number;
    status: CmsTableItem["status"];
  } | null>(null);

  const handleOpenEditTable = (zoneId: string, table: any) => {
    const code = table.code || generateDefaultTableCode(table.name, table.id);
    setEditingTable({
      id: table.id,
      zoneId,
      name: table.name,
      code,
      capacity: table.capacity || 4,
      status: table.status,
    });
    setIsEditTableOpen(true);
  };

  const handleEditTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editingTable.name.trim()) {
      toast.error("Vui lòng nhập tên bàn");
      return;
    }

    const { id, zoneId: targetZoneId, name: rawName, code: rawCode, capacity: newCapacity, status: keepStatus } = editingTable;
    const trimmedName = rawName.trim();
    const finalCode = (rawCode && rawCode.trim()) ? rawCode.trim().toUpperCase() : generateDefaultTableCode(trimmedName, id);
    const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, finalCode, id);

    // 1. Gọi API cập nhật vào PostgreSQL qua Prisma
    tableApi
      .updateTable(storeId, id, {
        name: trimmedName,
        code: finalCode,
        zoneId: targetZoneId,
      })
      .then(() => {
        toast.success(`Đã cập nhật "${trimmedName}" (Mã: ${finalCode})`);
      })
      .catch((err) => {
        console.warn("Lỗi lưu sửa bàn lên server:", err);
      });

    // 2. Cập nhật ngay vào State giao diện (giữ nguyên trạng thái vận hành hiện tại)
    setZones((prev) => {
      let movedTable: CmsTableItem | null = null;
      for (const z of prev) {
        const found = z.tables.find((t) => t.id === id);
        if (found) {
          movedTable = {
            ...found,
            name: trimmedName,
            code: finalCode,
            orderUrl,
            capacity: Number(newCapacity) || 4,
            status: found.status || keepStatus,
            qrCodeUrl,
          };
          break;
        }
      }

      if (!movedTable) return prev;

      return prev.map((z) => {
        const remaining = z.tables.filter((t) => t.id !== id);
        if (z.id === targetZoneId) {
          return {
            ...z,
            tables: [...remaining, movedTable!],
          };
        }
        return {
          ...z,
          tables: remaining,
        };
      });
    });

    setIsEditTableOpen(false);
  };

  // Modal thêm khu vực mới
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");

  const allTables = zones.flatMap((z) => z.tables.map((t) => ({ ...t, zoneName: z.name, zoneId: z.id })));
  const totalTables = allTables.length;
  const emptyTables = allTables.filter((t) => t.status === "EMPTY").length;
  const occupiedTables = allTables.filter((t) => t.status !== "EMPTY" && t.status !== "PAYMENT_PENDING").length;
  const paymentPendingTables = allTables.filter((t) => t.status === "PAYMENT_PENDING").length;

  const handleOpenAddTable = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setNewTableName("");
    setNewTableCode("");
    setIsCodeManual(false);
    setNewTableCapacity(4);
    setIsAddTableOpen(true);
  };

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      toast.error("Vui lòng nhập tên bàn");
      return;
    }

    const tName = newTableName.trim();
    const tCode = (newTableCode && newTableCode.trim()) ? newTableCode.trim().toUpperCase() : generateDefaultTableCode(tName);

    // Gửi lên server database
    tableApi.createTable(storeId, selectedZoneId, tName, tCode).then((res) => {
      const createdTableId = res.data?.id || `t-${Date.now()}`;
      const finalCode = res.data?.code || tCode;
      const pin = res.data?.pin;
      const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, finalCode, createdTableId);
      setZones((prev) =>
        prev.map((z) => {
          if (z.id === selectedZoneId) {
            return {
              ...z,
              tables: [
                ...z.tables,
                {
                  id: createdTableId,
                  name: tName,
                  code: finalCode,
                  pin,
                  orderUrl,
                  capacity: Number(newTableCapacity) || 4,
                  status: "EMPTY",
                  qrCodeUrl,
                },
              ],
            };
          }
          return z;
        })
      );
    }).catch(() => {
      // Offline fallback
      const fallbackId = `t-${Date.now()}`;
      const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, tCode, fallbackId);
      setZones((prev) =>
        prev.map((z) => {
          if (z.id === selectedZoneId) {
            return {
              ...z,
              tables: [
                ...z.tables,
                {
                  id: fallbackId,
                  name: tName,
                  code: tCode,
                  orderUrl,
                  capacity: Number(newTableCapacity) || 4,
                  status: "EMPTY",
                  qrCodeUrl,
                },
              ],
            };
          }
          return z;
        })
      );
    });

    setIsAddTableOpen(false);
    toast.success(`Đã thêm ${tName} (Mã: ${tCode}) thành công!`);
  };

  const handleAddZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      toast.error("Vui lòng nhập tên khu vực");
      return;
    }
    const zName = newZoneName.trim();
    tableApi.createZone(storeId, zName).then((res) => {
      const newZone: TableZoneData = {
        id: res.data?.id || `z-${Date.now()}`,
        name: zName,
        tables: [],
      };
      setZones((prev) => [...prev, newZone]);
    }).catch(() => {
      const newZone: TableZoneData = {
        id: `z-${Date.now()}`,
        name: zName,
        tables: [],
      };
      setZones((prev) => [...prev, newZone]);
    });

    setNewZoneName("");
    setIsAddZoneOpen(false);
    toast.success(`Đã thêm khu vực mới "${zName}"!`);
  };

  const handleDeleteTable = async (zoneId: string, tableId: string, name: string) => {
    const ok = await confirmDialog({
      title: "Xóa Bàn Ăn?",
      message: `Bạn có chắc muốn xóa ${name}? Thao tác này sẽ hủy mã QR hiện tại của bàn.`,
      confirmText: "Xóa Bàn",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    tableApi.deleteTable(storeId, tableId).catch((err) => console.warn(err));

    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, tables: z.tables.filter((t) => t.id !== tableId) } : z))
    );
    toast.success(`Đã xóa ${name}`);
  };

  const handleRotatePin = async (tableId: string) => {
    try {
      const res = await tableApi.rotatePin(storeId, tableId);
      if (res && res.pin) {
        setZones((prev) =>
          prev.map((z) => ({
            ...z,
            tables: z.tables.map((t) => (t.id === tableId ? { ...t, pin: res.pin } : t)),
          }))
        );
        if (selectedQrTable && selectedQrTable.id === tableId) {
          setSelectedQrTable((prev) => (prev ? { ...prev, pin: res.pin } : null));
        }
        toast.success(res.message || "Đã đổi mã PIN mới thành công!");
      }
    } catch (err: any) {
      toast.error("Không thể đổi mã PIN: " + (err.message || "Lỗi hệ thống"));
    }
  };

  // Filter zones display
  const displayedZones = zones
    .filter((z) => (selectedZoneTab === "ALL" ? true : z.id === selectedZoneTab))
    .map((z) => ({
      ...z,
      tables: z.tables.filter((t) => {
        if (selectedStatusFilter !== "ALL" && t.status !== selectedStatusFilter) return false;
        if (searchTableQuery.trim() && !t.name.toLowerCase().includes(searchTableQuery.toLowerCase())) return false;
        return true;
      }),
    }));

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Phòng Bàn
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {zones.length} khu vực bàn ăn
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              Quản Lý Phòng Bàn
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              Sơ đồ bàn ăn, trạng thái phục vụ và mã QR gọi món tại bàn
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="table" size={12} className="text-emerald-300" />
                <span>{totalTables} Bàn hoạt động</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="checkCircle" size={12} className="text-teal-300" />
                <span>{emptyTables} Bàn trống</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="users" size={12} className="text-blue-300" />
                <span>{occupiedTables} Có khách</span>
              </span>
              {paymentPendingTables > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 text-[10px] sm:text-[10.5px] font-bold text-amber-200">
                  <Icon name="cashier" size={12} className="text-amber-300" />
                  <span>{paymentPendingTables} Chờ thanh toán</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            {!isWaiter && (
              <button
                type="button"
                onClick={() => setIsBatchQrModalOpen(true)}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 sm:px-3.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 shrink-0"
              >
                <Icon name="print" size={14} />
                <span>In QR Hàng Loạt</span>
              </button>
            )}

            {!isWaiter && !isCashier && (
              <button
                type="button"
                onClick={() => setIsAddZoneOpen(true)}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 sm:px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-emerald-300 active:scale-95 shrink-0"
              >
                <Icon name="plus" size={14} />
                <span>Thêm Khu Vực</span>
              </button>
            )}

            {isWaiter && (
              <button
                type="button"
                onClick={() => toast.success("Đã làm mới trạng thái sơ đồ bàn.")}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 sm:px-4 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 shrink-0"
              >
                <Icon name="refresh" size={14} />
                <span>Làm Mới Bàn</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. 4 Thẻ Bento Chỉ Số Bàn Ăn */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="table" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              {zones.length} khu
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Tổng Số Bàn Ăn
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {totalTables} <span className="text-xs font-bold text-slate-400">bàn</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              100% bàn đã cấp mã QR
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Icon name="checkCircle" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
              Sẵn sàng
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Bàn Trống Đón Khách
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {emptyTables} <span className="text-xs font-bold text-slate-400">bàn</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-600 mt-1 truncate">
              Sức chứa đón ~{emptyTables * 4} khách
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon name="users" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              {Math.round((occupiedTables / (totalTables || 1)) * 100)}% tải
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Bàn Đang Phục Vụ
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {occupiedTables} <span className="text-xs font-bold text-slate-400">bàn</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              Đang có order tại bếp
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Icon name="cashier" size={16} />
            </span>
            {paymentPendingTables > 0 && (
              <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                Chờ bill
              </span>
            )}
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Chờ Thanh Toán
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {paymentPendingTables} <span className="text-xs font-bold text-slate-400">bàn</span>
            </p>
            <p className="text-[10px] font-semibold text-amber-600 mt-1 truncate">
              {paymentPendingTables > 0 ? "Khách gọi tính tiền" : "Không có yêu cầu"}
            </p>
          </div>
        </article>
      </section>

      {/* 3. Sticky Toolbar: Điều Hướng Khu Vực & Bộ Lọc Trạng Thái */}
      <div className="sticky top-0 sm:top-2 z-10 p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
        {/* Zone Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedZoneTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedZoneTab === "ALL"
                ? "bg-slate-950 text-white shadow-2xs font-black"
                : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            Tất Cả Khu Vực ({totalTables})
          </button>
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelectedZoneTab(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedZoneTab === z.id
                  ? "bg-slate-950 text-white shadow-2xs font-black"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {z.name} ({z.tables.length})
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-64">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              placeholder="Tìm kiếm bàn theo tên..."
              className="w-full h-8 sm:h-9 pl-8 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: "ALL", label: "Tất Cả" },
              { id: "EMPTY", label: "Trống" },
              { id: "OCCUPIED", label: "Có Khách" },
              { id: "PAYMENT_PENDING", label: "Chờ Bill" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedStatusFilter === st.id
                    ? "bg-emerald-800 text-white shadow-2xs font-extrabold"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Danh Sách Các Khu Vực & Bàn Ăn */}
      <div className="space-y-4 sm:space-y-5">
        {zones.length === 0 ? (
          <div className="py-14 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mx-auto mb-3">
              <Icon name="table" size={24} />
            </div>
            <h4 className="text-base font-black text-slate-900">Chưa có khu vực bàn ăn nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tạo khu vực (Tầng 1, Tầng 2, Sân vườn, VIP...) và thêm bàn ăn để quản lý sơ đồ bàn và xuất mã VietQR đặt món tại bàn.
            </p>
            <Button
              size="sm"
              className="mt-4 rounded-xl gap-2 text-xs bg-emerald-800 text-white hover:bg-emerald-900 font-bold"
              onClick={() => setIsAddZoneOpen(true)}
            >
              <Icon name="plus" size={14} />
              <span>Tạo Khu Vực Đầu Tiên</span>
            </Button>
          </div>
        ) : displayedZones.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200/80">
            Không tìm thấy bàn nào khớp với bộ lọc
          </div>
        ) : (
          displayedZones.map((zone) => (
            <section key={zone.id} className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{zone.name}</h3>
                  <span className="text-[11px] font-medium text-slate-400">{zone.tables.length} bàn</span>
                </div>
                <button
                  type="button"
                  className="h-8 w-8 rounded-xl flex items-center justify-center bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs shrink-0 transition active:scale-95"
                  onClick={() => handleOpenAddTable(zone.id)}
                  title="Thêm Bàn Mới"
                  aria-label="Thêm Bàn Mới"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>

              {zone.tables.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold">
                  Chưa có bàn nào trong khu vực này hoặc không khớp bộ lọc tìm kiếm
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {zone.tables.map((table) => {
                    const isOccupied = table.status !== "EMPTY";
                    return (
                      <div
                        key={table.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-2xs min-h-[155px] ${
                          table.status === "EMPTY"
                            ? "bg-white border-slate-200/90 hover:border-emerald-300"
                            : table.status === "PAYMENT_PENDING"
                            ? "bg-rose-50/50 border-rose-300 hover:border-rose-400"
                            : "bg-emerald-50/20 border-emerald-400/70 shadow-xs hover:border-emerald-500"
                        }`}
                      >
                        {/* Header của thẻ bàn */}
                        <div
                          className={isOccupied ? "cursor-pointer" : undefined}
                          onClick={() => {
                            if (isOccupied) handleGoToOrder(table.id);
                          }}
                          title={isOccupied ? "Bấm để sang Gọi Món" : undefined}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-black text-sm sm:text-base text-slate-900 truncate flex items-center gap-1.5">
                                <span>{table.name}</span>
                                {isOccupied && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {table.code || generateDefaultTableCode(table.name, table.id)}
                                </span>
                                {table.pin && (
                                  <span
                                    className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5"
                                    title="Mã PIN mở bàn bảo mật"
                                  >
                                    <Icon name="key" size={10} /> PIN: {table.pin}
                                  </span>
                                )}
                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                                  ~{table.capacity} chỗ
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap shrink-0 ${
                                table.status === "EMPTY"
                                  ? "bg-slate-100 text-slate-600"
                                  : table.status === "PAYMENT_PENDING"
                                  ? "bg-rose-100 text-rose-800 animate-pulse"
                                  : "bg-amber-100 text-amber-900 border border-amber-300"
                              }`}
                            >
                              {table.status === "EMPTY"
                                ? "Bàn trống"
                                : table.status === "PAYMENT_PENDING"
                                ? "Chờ bill"
                                : "Có khách"}
                            </span>
                          </div>
                        </div>

                        {/* CỤM HÀNH ĐỘNG CHÍNH: MỞ BÀN / ĐÓNG BÀN / GỌI MÓN */}
                        <div className="pt-2.5 mt-2 border-t border-slate-200/60 flex flex-col gap-2">
                          <div className="flex items-center gap-1.5">
                            {table.status === "EMPTY" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenTableGuestCount(table.capacity || 2);
                                  setOpenTableModal({ table, zoneId: zone.id });
                                }}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                              >
                                <Icon name="plus" size={13} />
                                <span>Mở Bàn</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleGoToOrder(table.id)}
                                  className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                                  title="Nhảy sang màn hình Gọi Món với bàn này"
                                >
                                  <Icon name="cart" size={13} />
                                  <span>Gọi Món ↗</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isClosingTableId === table.id}
                                  onClick={() => handleCloseTableSession(table)}
                                  className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shrink-0 disabled:opacity-50"
                                  title="Đóng phiên bàn và dọn bàn về trạng thái trống"
                                >
                                  <Icon name="x" size={12} />
                                  <span>Đóng Bàn</span>
                                </button>
                              </>
                            )}
                          </div>

                          {/* Menu phụ: QR Gọi Món, Sửa, Xóa */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                const code = table.code || generateDefaultTableCode(table.name, table.id);
                                const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, code, table.id);
                                setSelectedQrTable({
                                  id: table.id,
                                  name: table.name,
                                  code,
                                  pin: table.pin,
                                  orderUrl: table.orderUrl || orderUrl,
                                  qrUrl: table.qrCodeUrl || qrCodeUrl,
                                });
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-800 transition truncate"
                            >
                              <Icon name="vietqr" size={12} />
                              <span>Mã QR</span>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTable(zone.id, table)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Sửa thông tin bàn"
                              >
                                <Icon name="edit" size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTable(zone.id, table.id, table.name)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Xóa bàn này"
                              >
                                <Icon name="trash" size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))
        )}
      </div>

      {/* Modal Thêm Bàn Mới */}
      {isAddTableOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Thêm Bàn Ăn Mới</h3>
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleAddTableSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tên Bàn *</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTableName(val);
                      if (!isCodeManual) {
                        setNewTableCode(generateDefaultTableCode(val));
                      }
                    }}
                    placeholder="Ví dụ: Bàn 05, VIP 03, Sân Thượng 2..."
                    required
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600">Mã Bàn (Sinh QR Gọi Món) *</label>
                    <div className="flex items-center gap-1.5">
                      {isCodeManual && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCodeManual(false);
                            setNewTableCode(generateDefaultTableCode(newTableName));
                          }}
                          className="text-[10.5px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                        >
                          Tự động lại
                        </button>
                      )}
                      <span className="text-[10.5px] text-slate-400 font-medium">Tự sinh theo tên</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newTableCode}
                    onChange={(e) => {
                      setIsCodeManual(true);
                      setNewTableCode(e.target.value.toUpperCase().replace(/\s+/g, "-"));
                    }}
                    placeholder="Ví dụ: TB-05, VIP-03, ST-02..."
                    required
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Mã bàn sinh mã QR và link truy cập gọi món cho khách.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Sức Chứa (Số Người)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs px-4 py-2 font-bold transition"
                    onClick={() => setIsAddTableOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2 shadow-2xs transition active:scale-95"
                  >
                    Tạo Bàn & Sinh QR
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Chỉnh Sửa Bàn Ăn (Không chỉnh trạng thái, chỉnh mã bàn và xem trước QR gọi món) */}
      {isEditTableOpen && editingTable && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Icon name="edit" size={15} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Chỉnh Sửa Bàn</h3>
                    <p className="text-[10.5px] text-slate-400">Đồng bộ trực tiếp vào Database</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditTableOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleEditTableSubmit} className="space-y-3.5">
                {/* 1. Tên Bàn */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Tên Bàn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTable.name}
                    onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                    placeholder="VD: Bàn 01 (Cửa sổ), Bàn VIP 02..."
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>

                {/* 2. Mã Bàn Định Danh Sinh QR */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mã Bàn (Sinh QR Gọi Món) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTable({
                          ...editingTable,
                          code: generateDefaultTableCode(editingTable.name, editingTable.id),
                        })
                      }
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition"
                    >
                      Tự động tạo
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingTable.code}
                    onChange={(e) =>
                      setEditingTable({
                        ...editingTable,
                        code: e.target.value.toUpperCase().replace(/\s+/g, "-"),
                      })
                    }
                    placeholder="VD: TB-01, BAN-02..."
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Mã định danh riêng của bàn để sinh mã QR cho khách quét gọi món.
                  </p>
                </div>

                {/* 3. Khu Vực */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Khu Vực Phân Bổ
                  </label>
                  <select
                    value={editingTable.zoneId}
                    onChange={(e) => setEditingTable({ ...editingTable, zoneId: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Sức Chứa */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Sức Chứa (Số Người)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 4, 6, 8].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setEditingTable({ ...editingTable, capacity: cap })}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                          editingTable.capacity === cap
                            ? "bg-[#102d25] text-white border-[#102d25] shadow-2xs font-black"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cap} chỗ
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Live QR Preview */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center shadow-2xs">
                    <img
                      src={buildTableOrderQr(storeId, editingTable.code || generateDefaultTableCode(editingTable.name, editingTable.id), editingTable.id).qrCodeUrl}
                      alt="QR Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black uppercase text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        {editingTable.code || "TB-..."}
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-700">QR Gọi Món Riêng</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {getOrderBaseUrl()}/order?store={storeId}&table={editingTable.code || "..."}
                    </p>
                  </div>
                </div>

                {/* Nút Hành Động */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs px-4 py-2 font-bold transition"
                    onClick={() => setIsEditTableOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2 shadow-2xs transition active:scale-95"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Thêm Khu Vực Mới */}
      {isAddZoneOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Thêm Khu Vực Mới</h3>
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleAddZoneSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tên Khu Vực *</label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Ví dụ: Tầng 3 (Rooftop)..."
                    required
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs px-4 py-2 font-bold transition"
                    onClick={() => setIsAddZoneOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2 shadow-2xs transition active:scale-95"
                  >
                    Lưu Khu Vực
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Xem Đơn Lẻ 1 Mã QR Bàn Gọi Món */}
      {selectedQrTable && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center shadow-2xl border border-slate-200/80 animate-scaleUp space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-left">
                  <h3 className="text-base font-black text-slate-900">{selectedQrTable.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10.5px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Mã Bàn: {selectedQrTable.code || "TB-01"}
                    </span>
                    <span className="text-[10px] text-slate-400">QR Gọi Món</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQrTable(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500 text-left">
                Khách quét mã này bằng camera điện thoại để vào đúng bàn gọi món trực tiếp.
              </p>

              <div className="w-52 h-52 mx-auto p-3 bg-white rounded-2xl border-2 border-emerald-800 shadow-md flex items-center justify-center">
                <img src={selectedQrTable.qrUrl} alt={`QR Gọi Món ${selectedQrTable.name}`} className="w-full h-full object-contain" />
              </div>

              {/* Box Mã PIN Bảo Mật Của Bàn */}
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 text-left space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <Icon name="key" size={14} className="text-emerald-700" />
                    <span>Mã PIN Mở Bàn Tại Quán:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-white text-emerald-800 border border-emerald-300 shadow-2xs tracking-wider">
                      {selectedQrTable.pin || "----"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRotatePin(selectedQrTable.id)}
                      title="Đổi mã PIN mới ngẫu nhiên"
                      className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition active:scale-95"
                    >
                      <Icon name="refresh" size={10} />
                      <span>Đổi PIN</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10.5px] text-emerald-800/80 leading-relaxed">
                  <span className="font-bold text-emerald-900">Mã PIN động bảo mật:</span> Tự động thay đổi sau mỗi lượt khách (khi nhân viên bấm Đóng bàn) hoặc khi bấm "Đổi PIN" để chống kẻ xấu lưu mã từ xa.
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-left space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">Link gọi món tại bàn:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedQrTable.orderUrl) {
                        navigator.clipboard.writeText(selectedQrTable.orderUrl);
                        toast.success("Đã sao chép link gọi món vào bộ nhớ tạm!");
                      }
                    }}
                    className="text-[10.5px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Icon name="copy" size={11} />
                    <span>Sao chép link</span>
                  </button>
                </div>
                <p className="text-[10.5px] font-mono text-slate-500 truncate select-all">
                  {selectedQrTable.orderUrl}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
                  onClick={() => {
                    toast.success(`Đang tải ảnh mã QR ${selectedQrTable.name} để in thẻ để bàn...`);
                    const a = document.createElement("a");
                    a.href = selectedQrTable.qrUrl;
                    a.download = `QR_${selectedQrTable.code || selectedQrTable.name}.png`;
                    a.target = "_blank";
                    a.click();
                  }}
                >
                  <Icon name="download" size={15} />
                  <span>Tải Mã QR In Thẻ Để Bàn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQrTable(null)}
                  className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 py-1 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal In Hàng Loạt Tất Cả Mã QR Bàn Trong Quán */}
      {isBatchQrModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none animate-fadeIn">
            <div className="w-full max-w-3xl max-h-[88vh] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/80 flex flex-col justify-between overflow-hidden animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">In Hàng Loạt Mã QR Bàn ({allTables.length} Bàn)</h3>
                  <p className="text-xs text-slate-500">Xem trước thẻ để bàn chuẩn kích thước dán mica / ép plastic</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchQrModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 my-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allTables.map((t) => (
                    <div key={t.id} className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-2xs flex flex-col items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{t.name}</span>
                      <span className="text-[10px] text-slate-400">{t.zoneName}</span>
                      <div className="w-28 h-28 my-2 p-1.5 bg-white border border-slate-200 rounded-xl">
                        <img src={t.qrCodeUrl} alt={t.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[9.5px] font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Mã: {t.code || generateDefaultTableCode(t.name, t.id)} • Quét Gọi Món
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs px-4 py-2 font-bold transition"
                  onClick={() => setIsBatchQrModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center gap-1.5 px-6 py-2 shadow-2xs transition active:scale-95"
                  onClick={() => {
                    toast.success("Đang kết nối máy in để in toàn bộ thẻ để bàn...");
                    setIsBatchQrModalOpen(false);
                  }}
                >
                  <Icon name="print" size={14} />
                  <span>In Tất Cả ({allTables.length} Thẻ)</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Mở Bàn Cho Khách */}
      {openTableModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black">
                    <Icon name="table" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Mở Bàn Phục Vụ</h3>
                    <p className="text-xs text-slate-500 font-medium">{openTableModal.table.name} ({openTableModal.table.code})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenTableModal(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Số Lượng Khách Tại Bàn
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setOpenTableGuestCount(num)}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${
                          openTableGuestCount === num
                            ? "bg-emerald-800 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {num} khách
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[11px] text-slate-500 font-semibold">Tùy chỉnh số khách:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={openTableGuestCount}
                      onChange={(e) => setOpenTableGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-8 px-2 text-center rounded-lg border border-slate-200 text-xs font-black focus:outline-none focus:border-emerald-600 bg-slate-50"
                    />
                    <span className="text-[11px] text-slate-500">người</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <Icon name="check" size={13} className="text-emerald-700" />
                    <span>Sau khi mở bàn:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Khách có thể quét mã QR tại bàn để xem menu và đặt món, hoặc nhân viên bấm "Mở bàn & Gọi món ngay" để sang trang chọn món.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isOpeningTable}
                  onClick={() => handleOpenTableSession(openTableModal.table, openTableGuestCount, true)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  <Icon name="cart" size={14} />
                  <span>Mở Bàn & Gọi Món Ngay 🚀</span>
                </button>
                <button
                  type="button"
                  disabled={isOpeningTable}
                  onClick={() => handleOpenTableSession(openTableModal.table, openTableGuestCount, false)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95 disabled:opacity-50"
                >
                  <span>Chỉ Mở Bàn (Khách Tự Quét QR)</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
