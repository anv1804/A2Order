import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { TableZoneData } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";

export const CmsTableManagement: React.FC = () => {
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
    <div className="space-y-5 animate-fadeIn pb-16 lg:pb-0">
      {/* Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Sơ Đồ Bàn Ăn & Mã QR
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Tự Động Sinh QR
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Cấu hình khu vực bàn, in mã QR dán tại bàn để khách tự quét gọi món & thanh toán
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2 text-xs bg-white border-surface-border text-ink-primary hover:bg-surface-canvas font-bold px-3.5 py-2 shadow-2xs"
            onClick={() => setIsBatchQrModalOpen(true)}
          >
            <Icon name="print" className="w-3.5 h-3.5 text-ink-muted" />
            <span>In QR<span className="hidden sm:inline"> Hàng Loạt</span></span>
          </Button>

          <Button
            size="sm"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-brand-950 text-white hover:bg-black font-bold shadow-sm transition-all shrink-0"
            onClick={() => setIsAddZoneOpen(true)}
            title="Thêm Khu Vực"
            aria-label="Thêm Khu Vực"
          >
            <Icon name="plus" className="w-4 h-4 text-brand-400" />
          </Button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Nhanh Bàn Ăn */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Panel variant="featured" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <span className="text-xs font-semibold text-brand-200 truncate">Tổng Số Bàn Ăn</span>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">{totalTables}</span>
              <span className="text-xs text-brand-200 ml-1 font-normal">bàn ({zones.length} khu)</span>
            </div>
            <span className="text-xs text-brand-200 truncate font-medium block">QR bàn sẵn sàng</span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <span className="text-xs font-semibold text-ink-muted truncate">Bàn Trống Sẵn Sàng</span>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">{emptyTables}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">bàn</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit truncate block">
              Đón ~{emptyTables * 4} khách
            </span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <span className="text-xs font-semibold text-ink-muted truncate">Đang Phục Vụ</span>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">{occupiedTables}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">bàn</span>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full w-fit truncate block">
              {Math.round((occupiedTables / (totalTables || 1)) * 100)}% công suất
            </span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <span className="text-xs font-semibold text-ink-muted truncate">Chờ Tính Tiền</span>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">{paymentPendingTables}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">bàn</span>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full w-fit truncate block">
              {paymentPendingTables > 0 ? "Yêu cầu thanh toán" : "Không có yêu cầu"}
            </span>
          </div>
        </Panel>
      </div>

      {/* Thanh Điều Hướng Khu Vực & Bộ Lọc Trạng Thái */}
      <div className="p-3 sm:p-4 bg-white rounded-3xl border border-surface-border space-y-3 shadow-xs">
        {/* Zone Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setSelectedZoneTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedZoneTab === "ALL"
                ? "bg-brand-900 text-white shadow-xs font-black"
                : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
            }`}
          >
            Tất Cả Khu Vực ({totalTables})
          </button>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZoneTab(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedZoneTab === z.id
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              {z.name} ({z.tables.length})
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1.5 border-t border-surface-border/60">
          <div className="relative w-full sm:w-64">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              placeholder="Tìm kiếm bàn ăn theo tên..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800 shadow-2xs"
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
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedStatusFilter === st.id
                    ? "bg-brand-900 text-white shadow-2xs font-extrabold"
                    : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danh Sách Các Khu Vực & Bàn Ăn */}
      <div className="space-y-5">
        {displayedZones.map((zone) => (
          <Panel key={zone.id} variant="default" padding="lg" className="space-y-3.5 p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-ink-primary">{zone.name}</h3>
                <span className="text-[11px] text-ink-muted">{zone.tables.length} bàn</span>
              </div>
              <Button
                size="sm"
                className="rounded-xl h-8 w-8 p-0 flex items-center justify-center bg-brand-900 text-white shadow-xs shrink-0"
                onClick={() => handleOpenAddTable(zone.id)}
                title="Thêm Bàn"
                aria-label="Thêm Bàn"
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
              </Button>
            </div>

            {zone.tables.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted font-bold">
                Chưa có bàn nào trong khu vực này hoặc không khớp bộ lọc tìm kiếm
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {zone.tables.map((table) => (
                  <div
                    key={table.id}
                    className="p-3 sm:p-4 rounded-2xl bg-surface-canvas border border-surface-border flex flex-col justify-between hover:border-brand-600 transition-all shadow-2xs min-h-[128px]"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm sm:text-base text-ink-primary truncate">{table.name}</h4>
                        <span className="text-[10px] sm:text-[11px] text-ink-muted block">~{table.capacity} chỗ</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold whitespace-nowrap shrink-0 ${
                          table.status === "EMPTY"
                            ? "bg-emerald-100 text-emerald-800"
                            : table.status === "PAYMENT_PENDING"
                            ? "bg-amber-100 text-amber-800 font-black"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {table.status === "EMPTY" ? "Trống" : table.status === "PAYMENT_PENDING" ? "Chờ bill" : "Có khách"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-surface-border/60">
                      <button
                        onClick={() => setSelectedQrTable({ name: table.name, qrUrl: table.qrCodeUrl })}
                        className="flex items-center gap-1 text-[11px] font-bold text-brand-800 hover:text-brand-950 transition-all truncate"
                      >
                        <Icon name="vietqr" size={13} />
                        <span>Xem QR</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTable(zone.id, table.id, table.name)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-subtle hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                        title="Xóa bàn này"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        ))}
      </div>

      {/* Modal Thêm Bàn Mới */}
      {isAddTableOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-surface-border space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-ink-primary">Thêm Bàn Ăn Mới</h3>
                <button
                  onClick={() => setIsAddTableOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTableSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Tên Bàn *</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Ví dụ: Bàn 05, VIP 03..."
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Sức Chứa (Số Người)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setIsAddTableOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm"
                  >
                    Tạo Bàn & Sinh QR
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Thêm Khu Vực Mới */}
      {isAddZoneOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-surface-border space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-ink-primary">Thêm Khu Vực Mới</h3>
                <button
                  onClick={() => setIsAddZoneOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddZoneSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Tên Khu Vực *</label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Ví dụ: Tầng 3 (Rooftop)..."
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setIsAddZoneOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm"
                  >
                    Lưu Khu Vực
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Xem Đơn Lẻ 1 Mã QR Bàn */}
      {selectedQrTable && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs select-none animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-2xl border border-surface-border animate-scaleUp">
              <h3 className="text-lg sm:text-xl font-bold text-ink-primary mb-1">Mã QR {selectedQrTable.name}</h3>
              <p className="text-xs text-ink-muted mb-4">In mã này dán lên mặt bàn để khách quét gọi món và thanh toán</p>

              <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border-2 border-brand-900 shadow-md mb-4 flex items-center justify-center">
                <img src={selectedQrTable.qrUrl} alt="QR" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-2">
                <Button
                  size="md"
                  className="w-full rounded-xl sm:rounded-2xl bg-brand-900 text-white font-bold text-xs gap-2"
                  onClick={() => {
                    toast.success(`Đang tải ảnh mã QR ${selectedQrTable.name} chất lượng cao...`);
                    setSelectedQrTable(null);
                  }}
                >
                  <Icon name="download" className="w-4 h-4" />
                  <span>Tải File In Ép Plastic</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedQrTable(null)}
                  className="text-xs font-bold text-ink-muted hover:text-ink-primary py-2"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs select-none animate-fadeIn">
            <div className="w-full max-w-3xl max-h-[88vh] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-surface-border flex flex-col justify-between overflow-hidden animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink-primary">In Hàng Loạt Mã QR Bàn ({allTables.length} Bàn)</h3>
                  <p className="text-xs text-ink-muted">Xem trước thẻ để bàn chuẩn kích thước dán mica / ép plastic</p>
                </div>
                <button
                  onClick={() => setIsBatchQrModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 my-3 bg-surface-canvas/50 rounded-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allTables.map((t) => (
                    <div key={t.id} className="p-3 bg-white rounded-2xl border-2 border-brand-900/40 text-center shadow-sm flex flex-col items-center justify-between">
                      <span className="font-black text-xs text-ink-primary">{t.name}</span>
                      <span className="text-[10px] text-ink-muted">{t.zoneName}</span>
                      <div className="w-28 h-28 my-2 p-1 bg-white border border-surface-border rounded-xl">
                        <img src={t.qrCodeUrl} alt={t.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[9px] font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-full">
                        Quét Để Gọi Món
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsBatchQrModalOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white font-black text-xs gap-1.5 px-6 shadow-sm"
                  onClick={() => {
                    toast.success("Đang kết nối máy in để in toàn bộ thẻ để bàn...");
                    setIsBatchQrModalOpen(false);
                  }}
                >
                  <Icon name="print" className="w-4 h-4" />
                  <span>In Tất Cả ({allTables.length} Thẻ)</span>
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
