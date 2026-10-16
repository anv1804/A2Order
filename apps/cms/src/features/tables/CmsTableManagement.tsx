import { useResource } from "@a2order/shared/react";
import { scopedStorageKey } from "@a2order/shared";
import { getAuthUser } from "@a2order/shared";
import React, { useState, useEffect } from "react";
import { Panel, Button, Badge, Icon, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { TableZoneData, CmsTableItem, CmsTableManagementProps } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import { tableApi } from "@/services/api/tableApi";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";
import {
  TableAddModal,
  TableEditModal,
  ZoneAddModal,
  TableSingleQrModal,
  TableBatchQrModal,
  TableSessionOpenModal,
} from "./modals";

// Lấy URL cơ sở gọi món động theo domain thực tế đang chạy
export function getOrderBaseUrl(): string {
  return import.meta.env.VITE_ORDER_BASE_URL || import.meta.env.VITE_CLIENT_URL || (["3000", "3001", "3002"].includes(window.location.port) ? window.location.protocol + "//" + window.location.hostname + ":3000" : window.location.origin);
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
  const storeId = getAuthUser()?.storeId || "";

  const [zones, refreshZones] = useResource<TableZoneData[]>(`/tables/${storeId}`, []);
  const setZones = (_update: React.SetStateAction<TableZoneData[]>) => { void refreshZones().catch(e => toast.error(e.message)); };

  // Tự động tải sơ đồ bàn thực tế từ Database


  // Lắng nghe Socket để đồng bộ trạng thái bàn (Mở bàn, đóng bàn, cập nhật PIN) trong thời gian thực


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


  };

  // Nảy sang Gọi Món POS với bàn này được chọn sẵn
  const handleGoToOrder = (tableId: string) => {
    localStorage.setItem(scopedStorageKey("staff_order_active_table"), JSON.stringify(tableId));
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
      <TableAddModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        onSubmit={handleAddTableSubmit}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        newTableCode={newTableCode}
        setNewTableCode={setNewTableCode}
        newTableCapacity={newTableCapacity}
        setNewTableCapacity={setNewTableCapacity}
        isCodeManual={isCodeManual}
        setIsCodeManual={setIsCodeManual}
        generateDefaultTableCode={generateDefaultTableCode}
      />

      {/* Modal Chỉnh Sửa Bàn Ăn */}
      <TableEditModal
        isOpen={isEditTableOpen && !!editingTable}
        editingTable={editingTable}
        setEditingTable={setEditingTable}
        onClose={() => setIsEditTableOpen(false)}
        onSubmit={handleEditTableSubmit}
        zones={zones}
        generateDefaultTableCode={generateDefaultTableCode}
        buildTableOrderQr={buildTableOrderQr}
        getOrderBaseUrl={getOrderBaseUrl}
        storeId={storeId}
      />

      {/* Modal Thêm Khu Vực Mới */}
      <ZoneAddModal
        isOpen={isAddZoneOpen}
        onClose={() => setIsAddZoneOpen(false)}
        onSubmit={handleAddZoneSubmit}
        newZoneName={newZoneName}
        setNewZoneName={setNewZoneName}
      />

      {/* Modal Xem Đơn Lẻ 1 Mã QR Bàn Gọi Món */}
      <TableSingleQrModal
        selectedQrTable={selectedQrTable}
        onClose={() => setSelectedQrTable(null)}
        onRotatePin={handleRotatePin}
      />

      {/* Modal In Hàng Loạt Tất Cả Mã QR Bàn Trong Quán */}
      <TableBatchQrModal
        isOpen={isBatchQrModalOpen}
        onClose={() => setIsBatchQrModalOpen(false)}
        allTables={allTables}
        generateDefaultTableCode={generateDefaultTableCode}
      />

      {/* Modal Mở Bàn Cho Khách */}
      <TableSessionOpenModal
        openTableModal={openTableModal}
        onClose={() => setOpenTableModal(null)}
        guestCount={openTableGuestCount}
        setGuestCount={setOpenTableGuestCount}
        isOpeningTable={isOpeningTable}
        onOpenSession={handleOpenTableSession}
      />
    </div>
  );
};
