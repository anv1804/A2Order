import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { TableZoneData, CmsTableManagementProps } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";

export const CmsTableManagement: React.FC<CmsTableManagementProps> = ({ currentRole = "STORE_OWNER" }) => {
  const isWaiter = currentRole === "WAITER";
  const isCashier = currentRole === "CASHIER";
  const [zones, setZones] = usePersistentState<TableZoneData[]>("tables_zones_data", [
    {
      id: "z1",
      name: "Tầng 1 (Khu Máy Lạnh)",
      tables: [
        { id: "t1", name: "Bàn 01", capacity: 4, status: "EMPTY", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN01" },
        { id: "t2", name: "Bàn 02", capacity: 4, status: "OCCUPIED", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN02" },
        { id: "t3", name: "Bàn 03", capacity: 6, status: "WAITING_FOOD", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN03" },
        { id: "t4", name: "Bàn 04", capacity: 4, status: "SERVED", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN04" },
      ],
    },
    {
      id: "z2",
      name: "Tầng 2 (Sân Vườn Thoáng Mát)",
      tables: [
        { id: "t5", name: "Bàn 201", capacity: 4, status: "SERVED", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN201" },
        { id: "t6", name: "Bàn 202", capacity: 8, status: "PAYMENT_PENDING", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN202" },
        { id: "t7", name: "Bàn 203", capacity: 4, status: "EMPTY", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=BAN203" },
      ],
    },
    {
      id: "z3",
      name: "Phòng Tiệc VIP",
      tables: [
        { id: "t8", name: "VIP 01 (Sen Vàng)", capacity: 12, status: "EMPTY", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=VIP01" },
        { id: "t9", name: "VIP 02 (Trúc Xanh)", capacity: 10, status: "OCCUPIED", qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=VIP02" },
      ],
    },
  ]);

  // Bộ lọc
  const [selectedZoneTab, setSelectedZoneTab] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchTableQuery, setSearchTableQuery] = useState("");

  // Modals
  const [selectedQrTable, setSelectedQrTable] = useState<{ name: string; qrUrl: string } | null>(null);
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("z1");
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);

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
    setZones((prev) =>
      prev.map((z) => {
        if (z.id === selectedZoneId) {
          return {
            ...z,
            tables: [
              ...z.tables,
              {
                id: `t-${Date.now()}`,
                name: tName,
                capacity: Number(newTableCapacity) || 4,
                status: "EMPTY",
                qrCodeUrl: `https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=0&addInfo=${encodeURIComponent(tName)}`,
              },
            ],
          };
        }
        return z;
      })
    );
    setIsAddTableOpen(false);
    toast.success(`Đã thêm ${tName} thành công!`);
  };

  const handleAddZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      toast.error("Vui lòng nhập tên khu vực");
      return;
    }
    const newZone: TableZoneData = {
      id: `z-${Date.now()}`,
      name: newZoneName.trim(),
      tables: [],
    };
    setZones((prev) => [...prev, newZone]);
    setNewZoneName("");
    setIsAddZoneOpen(false);
    toast.success(`Đã thêm khu vực mới "${newZone.name}"!`);
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

    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, tables: z.tables.filter((t) => t.id !== tableId) } : z))
    );
    toast.success(`Đã xóa ${name}`);
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
                Tự Động Sinh VietQR
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {zones.length} khu vực bàn ăn
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              {isWaiter
                ? "Sơ Đồ Bàn Phục Vụ & Điều Phối Bàn"
                : isCashier
                ? "Sơ Đồ Bàn & Trạng Thái Thanh Toán"
                : "Sơ Đồ Bàn Ăn & Mã QR Tự Phục Vụ"}
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              {isWaiter
                ? "Theo dõi tình trạng bàn trống, bàn đang ăn, chuyển ghép bàn và hỗ trợ gọi món tại chỗ."
                : isCashier
                ? "Theo dõi bàn yêu cầu thanh toán, bàn đang dùng bữa và in phiếu tạm tính cho khách."
                : "Cấu hình phân khu bàn ăn, in thẻ mica QR để khách tự quét gọi món và thanh toán không tiền mặt."}
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
        {displayedZones.map((zone) => (
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
                {zone.tables.map((table) => (
                  <div
                    key={table.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-500 hover:shadow-xs transition-all shadow-2xs min-h-[132px]"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">{table.name}</h4>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block">~{table.capacity} chỗ</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] font-black whitespace-nowrap shrink-0 ${
                          table.status === "EMPTY"
                            ? "bg-emerald-100 text-emerald-800"
                            : table.status === "PAYMENT_PENDING"
                            ? "bg-rose-100 text-rose-800 font-black animate-pulse"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {table.status === "EMPTY" ? "Trống" : table.status === "PAYMENT_PENDING" ? "Chờ bill" : "Có khách"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setSelectedQrTable({ name: table.name, qrUrl: table.qrCodeUrl })}
                        className="flex items-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-950 transition-all truncate"
                      >
                        <Icon name="vietqr" size={13} />
                        <span>Xem QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTable(zone.id, table.id, table.name)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                        title="Xóa bàn này"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
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
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Ví dụ: Bàn 05, VIP 03..."
                    required
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
                  />
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

      {/* Modal Xem Đơn Lẻ 1 Mã QR Bàn */}
      {selectedQrTable && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-2xl border border-slate-200/80 animate-scaleUp">
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">Mã QR {selectedQrTable.name}</h3>
              <p className="text-xs text-slate-500 mb-4">In mã này dán lên mặt bàn để khách quét gọi món và thanh toán VietQR</p>

              <div className="w-48 h-48 mx-auto p-2.5 bg-white rounded-2xl border-2 border-emerald-800 shadow-md mb-4 flex items-center justify-center">
                <img src={selectedQrTable.qrUrl} alt="QR" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
                  onClick={() => {
                    toast.success(`Đang tải ảnh mã QR ${selectedQrTable.name} chất lượng cao...`);
                    setSelectedQrTable(null);
                  }}
                >
                  <Icon name="download" size={15} />
                  <span>Tải File In Ép Plastic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQrTable(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 py-1 transition"
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
                      <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Quét Gọi Món VietQR
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
    </div>
  );
};
