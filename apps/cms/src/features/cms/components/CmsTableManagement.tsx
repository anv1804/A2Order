import React, { useState, useEffect } from "react";
import { Button, Icon } from "@/components/ui";
import { HeroBanner, StatCard, EmptyState } from "@/components/shared";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { TableZoneData, CmsTableItem, CmsTableManagementProps } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import { tableApi } from "@/services/api/tableApi";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";
import {
  AddTableModal,
  EditTableModal,
  AddZoneModal,
  TableQrModal,
  BatchQrModal,
  OpenTableModal,
  TableCardItem,
  SelectedQrTableData,
} from "./tables";

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

  // Lắng nghe Socket để đồng bộ trạng thái bàn
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
  const [selectedQrTable, setSelectedQrTable] = useState<SelectedQrTableData | null>(null);
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("z1");
  const [newTableName, setNewTableName] = useState("");
  const [newTableCode, setNewTableCode] = useState("");
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Modal sửa thông tin bàn ăn
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<CmsTableItem | null>(null);

  const handleOpenEditTable = (zoneId: string, table: CmsTableItem) => {
    const code = table.code || generateDefaultTableCode(table.name, table.id);
    setEditingTable({
      ...table,
      code,
      zoneId: (table as any).zoneId || zoneId,
      capacity: table.capacity || 4,
    });
    setIsEditTableOpen(true);
  };

  const handleEditTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editingTable.name.trim()) {
      toast.error("Vui lòng nhập tên bàn");
      return;
    }

    const { id, name: rawName, code: rawCode, capacity: newCapacity, status: keepStatus } = editingTable;
    const targetZoneId = (editingTable as any).zoneId || selectedZoneId;
    const trimmedName = rawName.trim();
    const finalCode = rawCode && rawCode.trim() ? rawCode.trim().toUpperCase() : generateDefaultTableCode(trimmedName, id);
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

    // 2. Cập nhật ngay vào State giao diện
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
    const tCode = newTableCode && newTableCode.trim() ? newTableCode.trim().toUpperCase() : generateDefaultTableCode(tName);

    tableApi
      .createTable(storeId, selectedZoneId, tName, tCode)
      .then((res) => {
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
      })
      .catch(() => {
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
    tableApi
      .createZone(storeId, zName)
      .then((res) => {
        const newZone: TableZoneData = {
          id: res.data?.id || `z-${Date.now()}`,
          name: zName,
          tables: [],
        };
        setZones((prev) => [...prev, newZone]);
      })
      .catch(() => {
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
      <HeroBanner
        badge={{ label: "Phòng Bàn", dot: true }}
        tagline={`${zones.length} khu vực bàn ăn`}
        title="Quản Lý Phòng Bàn"
        description="Sơ đồ bàn ăn, trạng thái phục vụ và mã QR gọi món tại bàn"
        chips={[
          { icon: "table", label: `${totalTables} Bàn hoạt động`, variant: "default" },
          { icon: "checkCircle", label: `${emptyTables} Bàn trống`, variant: "teal" },
          { icon: "users", label: `${occupiedTables} Có khách`, variant: "blue" },
          ...(paymentPendingTables > 0
            ? [{ icon: "cashier" as const, label: `${paymentPendingTables} Chờ thanh toán`, variant: "amber" as const, highlight: true }]
            : []),
        ]}
        actions={
          <>
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
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition hover:bg-brand-300 active:scale-95 shrink-0"
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
          </>
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số Bàn Ăn */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="table"
          title="Tổng Số Bàn Ăn"
          value={
            <>
              {totalTables} <span className="text-xs font-bold text-ink-muted">bàn</span>
            </>
          }
          subtext="100% bàn đã cấp mã QR"
          badge={`${zones.length} khu`}
          variant="success"
        />

        <StatCard
          icon="checkCircle"
          title="Bàn Trống Đón Khách"
          value={
            <>
              {emptyTables} <span className="text-xs font-bold text-ink-muted">bàn</span>
            </>
          }
          subtext={`Sức chứa đón ~${emptyTables * 4} khách`}
          badge="Sẵn sàng"
          variant="info"
        />

        <StatCard
          icon="users"
          title="Bàn Đang Phục Vụ"
          value={
            <>
              {occupiedTables} <span className="text-xs font-bold text-ink-muted">bàn</span>
            </>
          }
          subtext="Đang có order tại bếp"
          badge={`${Math.round((occupiedTables / (totalTables || 1)) * 100)}% tải`}
          variant="default"
        />

        <StatCard
          icon="cashier"
          title="Chờ Thanh Toán"
          value={
            <>
              {paymentPendingTables} <span className="text-xs font-bold text-ink-muted">bàn</span>
            </>
          }
          subtext={paymentPendingTables > 0 ? "Khách gọi tính tiền" : "Không có yêu cầu"}
          badge={paymentPendingTables > 0 ? { text: "Chờ bill", variant: "warning" } : undefined}
          variant="warning"
        />
      </section>

      {/* 3. Sticky Toolbar: Điều Hướng Khu Vực & Bộ Lọc Trạng Thái */}
      <div className="sticky top-0 sm:top-2 z-10 p-2.5 sm:p-3.5 bg-surface-card/95 backdrop-blur-md rounded-2xl border border-surface-border space-y-2.5 shadow-card">
        {/* Zone Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedZoneTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedZoneTab === "ALL"
                ? "bg-brand-900 text-white shadow-card font-black"
                : "bg-surface-muted text-ink-muted hover:text-ink-primary hover:bg-surface-border"
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
                  ? "bg-brand-900 text-white shadow-card font-black"
                  : "bg-surface-muted text-ink-muted hover:text-ink-primary hover:bg-surface-border"
              }`}
            >
              {z.name} ({z.tables.length})
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-surface-border">
          <div className="relative w-full sm:w-64">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              placeholder="Tìm kiếm bàn theo tên..."
              className="w-full h-8 sm:h-9 pl-8 pr-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-subtle focus:bg-white focus:outline-none focus:border-brand-600 shadow-2xs"
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
                    ? "bg-brand-800 text-white shadow-card font-extrabold"
                    : "bg-surface-muted text-ink-muted hover:text-ink-primary hover:bg-surface-border"
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
          <EmptyState
            icon="table"
            title="Chưa có khu vực bàn ăn nào"
            description="Tạo khu vực (Tầng 1, Tầng 2, Sân vườn, VIP...) và thêm bàn ăn để quản lý sơ đồ bàn và xuất mã VietQR đặt món tại bàn."
            action={{
              label: "Tạo Khu Vực Đầu Tiên",
              icon: "plus",
              onClick: () => setIsAddZoneOpen(true),
            }}
          />
        ) : displayedZones.length === 0 ? (
          <EmptyState
            icon="search"
            title="Không tìm thấy bàn nào"
            description="Không có bàn ăn nào khớp với bộ lọc tìm kiếm hoặc trạng thái đã chọn."
          />
        ) : (
          displayedZones.map((zone) => (
            <section
              key={zone.id}
              className="rounded-2xl sm:rounded-3xl border border-surface-border bg-surface-card p-3.5 sm:p-5 shadow-card space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-ink-primary">{zone.name}</h3>
                  <span className="text-[11px] font-medium text-ink-muted">{zone.tables.length} bàn</span>
                </div>
                <button
                  type="button"
                  className="h-8 w-8 rounded-xl flex items-center justify-center bg-brand-800 hover:bg-brand-900 text-white shadow-card shrink-0 transition active:scale-95"
                  onClick={() => handleOpenAddTable(zone.id)}
                  title="Thêm Bàn Mới"
                  aria-label="Thêm Bàn Mới"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>

              {zone.tables.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted font-bold">
                  Chưa có bàn nào trong khu vực này hoặc không khớp bộ lọc tìm kiếm
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {zone.tables.map((table) => (
                    <TableCardItem
                      key={table.id}
                      table={table}
                      zoneId={zone.id}
                      storeId={storeId}
                      isClosing={isClosingTableId === table.id}
                      onOpenTable={(tbl, zId) => {
                        setOpenTableGuestCount(tbl.capacity || 2);
                        setOpenTableModal({ table: tbl, zoneId: zId });
                      }}
                      onCloseTable={handleCloseTableSession}
                      onGoToOrder={handleGoToOrder}
                      onSelectQr={setSelectedQrTable}
                      onEdit={handleOpenEditTable}
                      onDelete={handleDeleteTable}
                      generateDefaultTableCode={generateDefaultTableCode}
                      buildTableOrderQr={buildTableOrderQr}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>

      {/* Extracted Dedicated Modals */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        onSubmit={handleAddTableSubmit}
        name={newTableName}
        setName={setNewTableName}
        code={newTableCode}
        setCode={setNewTableCode}
        capacity={newTableCapacity}
        setCapacity={setNewTableCapacity}
        zoneId={selectedZoneId}
        setZoneId={setSelectedZoneId}
        zones={zones}
        isCodeManual={isCodeManual}
        setIsCodeManual={setIsCodeManual}
        generateDefaultTableCode={generateDefaultTableCode}
      />

      <EditTableModal
        isOpen={isEditTableOpen}
        onClose={() => setIsEditTableOpen(false)}
        onSubmit={handleEditTableSubmit}
        editingTable={editingTable}
        setEditingTable={setEditingTable}
        zones={zones}
        storeId={storeId}
        generateDefaultTableCode={generateDefaultTableCode}
        buildTableOrderQr={buildTableOrderQr}
        getOrderBaseUrl={getOrderBaseUrl}
      />

      <AddZoneModal
        isOpen={isAddZoneOpen}
        onClose={() => setIsAddZoneOpen(false)}
        onSubmit={handleAddZoneSubmit}
        newZoneName={newZoneName}
        setNewZoneName={setNewZoneName}
      />

      <TableQrModal
        selectedQrTable={selectedQrTable}
        onClose={() => setSelectedQrTable(null)}
        onRotatePin={handleRotatePin}
      />

      <BatchQrModal
        isOpen={isBatchQrModalOpen}
        onClose={() => setIsBatchQrModalOpen(false)}
        allTables={allTables.map((t) => ({
          ...t,
          qrCodeUrl: t.qrCodeUrl || buildTableOrderQr(storeId, t.code || generateDefaultTableCode(t.name, t.id), t.id).qrCodeUrl,
        }))}
        generateDefaultTableCode={generateDefaultTableCode}
      />

      <OpenTableModal
        openTableModal={openTableModal}
        onClose={() => setOpenTableModal(null)}
        isOpeningTable={isOpeningTable}
        guestCount={openTableGuestCount}
        setGuestCount={setOpenTableGuestCount}
        onConfirm={handleOpenTableSession}
      />
    </div>
  );
};
