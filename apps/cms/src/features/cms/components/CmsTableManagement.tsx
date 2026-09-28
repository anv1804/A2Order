import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";

import { TableZoneData } from "@/types/cms.types";

export const CmsTableManagement: React.FC = () => {
  const [zones, setZones] = useState<TableZoneData[]>([
    {
      id: "z1",
      name: "Tầng 1 (Khu Máy Lạnh)",
      tables: [
        { id: "t1", name: "Bàn 01", capacity: 4, status: "EMPTY", qrCodeUrl: "https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=BAN01" },
        { id: "t2", name: "Bàn 02", capacity: 4, status: "OCCUPIED", qrCodeUrl: "https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=BAN02" },
        { id: "t3", name: "Bàn 03", capacity: 6, status: "WAITING_FOOD", qrCodeUrl: "https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=BAN03" },
      ],
    },
    {
      id: "z2",
      name: "Tầng 2 (Sân Vườn Thoáng Mát)",
      tables: [
        { id: "t4", name: "Bàn 201", capacity: 4, status: "SERVED", qrCodeUrl: "https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=BAN201" },
        { id: "t5", name: "Bàn 202", capacity: 8, status: "PAYMENT_PENDING", qrCodeUrl: "https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=BAN202" },
        { id: "t6", name: "Bàn 203", capacity: 4, status: "EMPTY", qrCodeUrl: "https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=BAN203" },
      ],
    },
  ]);

  const [selectedQrTable, setSelectedQrTable] = useState<{ name: string; qrUrl: string } | null>(null);

  // Modal thêm bàn mới
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("z1");
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);

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
                qrCodeUrl: `https://api.vietqr.io/image/970415-113366668888-compact2.jpg?amount=0&addInfo=${encodeURIComponent(tName)}`,
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-ink-primary tracking-tight">
            Quản Lý Sơ Đồ Bàn & Mã QR Từng Bàn
          </h2>
          <p className="text-xs text-ink-muted">
            Cấu hình khu vực bàn, in mã QR dán tại bàn để khách tự quét gọi món & thanh toán VietQR tự động.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-2 text-xs border-surface-border text-ink-primary hover:bg-surface-muted"
            onClick={() => toast.info("Đang xuất toàn bộ file PDF mã QR các bàn để in...")}
          >
            <Icon name="download" className="w-3.5 h-3.5" />
            <span>In Toàn Bộ Mã QR Bàn</span>
          </Button>
        </div>
      </div>

      {/* Danh sách từng khu vực */}
      <div className="space-y-6">
        {zones.map((zone) => (
          <Panel key={zone.id} variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-ink-primary">{zone.name}</h3>
                <span className="text-[11px] text-ink-muted">{zone.tables.length} bàn</span>
              </div>
              <Button
                size="sm"
                className="rounded-full text-xs gap-1.5 bg-brand-900 text-white"
                onClick={() => handleOpenAddTable(zone.id)}
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                <span>+ Thêm Bàn</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {zone.tables.map((table) => (
                <div
                  key={table.id}
                  className="p-4 rounded-3xl bg-surface-canvas border border-surface-border flex flex-col justify-between hover:border-brand-700 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-base text-ink-primary">{table.name}</h4>
                      <span className="text-[11px] text-ink-muted font-medium">Sức chứa: ~{table.capacity} khách</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        table.status === "EMPTY"
                          ? "bg-emerald-100 text-emerald-800"
                          : table.status === "PAYMENT_PENDING"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {table.status === "EMPTY" ? "Bàn trống" : table.status === "PAYMENT_PENDING" ? "Chờ thanh toán" : "Đang có khách"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-border/60">
                    <button
                      onClick={() => setSelectedQrTable({ name: table.name, qrUrl: table.qrCodeUrl })}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand-800 hover:text-brand-950 transition-all"
                    >
                      <Icon name="vietqr" className="w-3.5 h-3.5" />
                      <span>Xem Mã QR Bàn</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTable(zone.id, table.id, table.name)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-subtle hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Xóa bàn này"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      {/* Modal Thêm Bàn Mới */}
      {isAddTableOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddTableOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-black text-ink-primary">Thêm Bàn Ăn Mới</h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Khu Vực Bàn
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Tên Bàn (Ví dụ: Bàn 04, VIP 01) *
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Nhập tên bàn..."
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Sức Chứa Dự Kiến (Số ghế)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setIsAddTableOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-5"
                >
                  Tạo Bàn & Sinh Mã QR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem mã QR bàn */}
      {selectedQrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm select-none animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-surface-border">
            <h3 className="text-xl font-black text-ink-primary mb-1">Mã QR {selectedQrTable.name}</h3>
            <p className="text-xs text-ink-muted mb-4">In mã này dán lên mặt bàn để khách quét gọi món và thanh toán</p>

            <div className="w-48 h-48 mx-auto p-2 bg-white rounded-2xl border-2 border-brand-900 shadow-md mb-4 flex items-center justify-center">
              <img src={selectedQrTable.qrUrl} alt="QR" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-2">
              <Button
                size="md"
                className="w-full rounded-2xl bg-brand-900 text-white font-bold text-xs gap-2"
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
      )}
    </div>
  );
};
