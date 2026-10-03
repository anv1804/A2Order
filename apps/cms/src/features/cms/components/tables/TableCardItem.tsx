import React from "react";
import { Icon } from "@/components/ui";
import { CmsTableItem } from "@/types/cms.types";
import { SelectedQrTableData } from "./TableQrModal";

export interface TableCardItemProps {
  table: CmsTableItem;
  zoneId: string;
  storeId: string;
  isClosing: boolean;
  onOpenTable: (table: CmsTableItem, zoneId: string) => void;
  onCloseTable: (table: CmsTableItem) => void;
  onGoToOrder: (tableId: string) => void;
  onSelectQr: (qrData: SelectedQrTableData) => void;
  onEdit: (zoneId: string, table: CmsTableItem) => void;
  onDelete: (zoneId: string, tableId: string, tableName: string) => void;
  generateDefaultTableCode: (name: string, id?: string) => string;
  buildTableOrderQr: (storeId: string, tableCode: string, tableId?: string) => { orderUrl: string; qrCodeUrl: string };
}

export const TableCardItem: React.FC<TableCardItemProps> = ({
  table,
  zoneId,
  storeId,
  isClosing,
  onOpenTable,
  onCloseTable,
  onGoToOrder,
  onSelectQr,
  onEdit,
  onDelete,
  generateDefaultTableCode,
  buildTableOrderQr,
}) => {
  const isOccupied = table.status !== "EMPTY";

  let statusCardStyle = "bg-surface-card border-surface-border hover:border-brand-500/40";
  let statusBadgeStyle = "bg-surface-muted text-ink-muted border-surface-border";
  let statusBadgeLabel = "Bàn trống";

  if (table.status === "PAYMENT_PENDING") {
    statusCardStyle = "bg-status-billing-bg/40 border-status-billing-border hover:border-status-billing-text/50";
    statusBadgeStyle = "bg-status-billing-bg text-status-billing-text border-status-billing-border animate-pulse";
    statusBadgeLabel = "Chờ bill";
  } else if (isOccupied) {
    statusCardStyle = "bg-brand-50/40 border-brand-400/50 shadow-xs hover:border-brand-600";
    statusBadgeStyle = "bg-status-selecting-bg text-status-selecting-text border-status-selecting-border";
    statusBadgeLabel = "Có khách";
  }

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-card min-h-[155px] ${statusCardStyle}`}
    >
      {/* Table Card Header */}
      <div
        className={isOccupied ? "cursor-pointer" : undefined}
        onClick={() => {
          if (isOccupied) onGoToOrder(table.id);
        }}
        title={isOccupied ? "Bấm để sang Gọi Món" : undefined}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-sm sm:text-base text-ink-primary truncate flex items-center gap-1.5">
              <span>{table.name}</span>
              {isOccupied && (
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              )}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-muted text-ink-primary border border-surface-border">
                {table.code || generateDefaultTableCode(table.name, table.id)}
              </span>
              {table.pin && (
                <span
                  className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-status-selecting-bg text-status-selecting-text border border-status-selecting-border flex items-center gap-0.5"
                  title="Mã PIN mở bàn bảo mật"
                >
                  <Icon name="key" size={10} /> PIN: {table.pin}
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted">
                ~{table.capacity} chỗ
              </span>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap shrink-0 border ${statusBadgeStyle}`}
          >
            {statusBadgeLabel}
          </span>
        </div>
      </div>

      {/* Main Actions: Open / Close / Order */}
      <div className="pt-2.5 mt-2 border-t border-surface-border flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          {table.status === "EMPTY" ? (
            <button
              type="button"
              onClick={() => onOpenTable(table, zoneId)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-card transition active:scale-95"
            >
              <Icon name="plus" size={13} />
              <span>Mở Bàn</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onGoToOrder(table.id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-card transition active:scale-95"
                title="Nhảy sang màn hình Gọi Món với bàn này"
              >
                <Icon name="cart" size={13} />
                <span>Gọi Món ↗</span>
              </button>
              <button
                type="button"
                disabled={isClosing}
                onClick={() => onCloseTable(table)}
                className="py-1.5 px-2.5 rounded-xl bg-status-danger-bg hover:bg-status-danger-bg/80 border border-status-danger-border text-status-danger-text text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shrink-0 disabled:opacity-50"
                title="Đóng phiên bàn và dọn bàn về trạng thái trống"
              >
                <Icon name="x" size={12} />
                <span>Đóng Bàn</span>
              </button>
            </>
          )}
        </div>

        {/* Submenu: QR, Edit, Delete */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border">
          <button
            type="button"
            onClick={() => {
              const code = table.code || generateDefaultTableCode(table.name, table.id);
              const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, code, table.id);
              onSelectQr({
                id: table.id,
                name: table.name,
                code,
                pin: table.pin,
                orderUrl: table.orderUrl || orderUrl,
                qrUrl: table.qrCodeUrl || qrCodeUrl,
              });
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-ink-muted hover:text-brand-800 transition truncate"
          >
            <Icon name="vietqr" size={12} />
            <span>Mã QR</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(zoneId, table)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-ink-muted hover:text-brand-700 hover:bg-brand-50 transition"
              title="Sửa thông tin bàn"
            >
              <Icon name="edit" size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(zoneId, table.id, table.name)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-ink-muted hover:text-status-danger-text hover:bg-status-danger-bg transition"
              title="Xóa bàn này"
            >
              <Icon name="trash" size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
