import React, { useState } from "react";
import {
  Icon,
  Checkbox,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import { SoftwareInvoiceRecord } from "@/types/cms.types";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/stores/notificationStore";

export interface InvoiceDesktopTableProps {
  paginatedInvoices: SoftwareInvoiceRecord[];
  selectedInvoiceIds: string[];
  onToggleSelectInvoice: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
}

export const InvoiceDesktopTable: React.FC<InvoiceDesktopTableProps> = ({
  paginatedInvoices,
  selectedInvoiceIds,
  onToggleSelectInvoice,
  onToggleSelectAll,
  isAllSelected,
  isIndeterminate,
  setViewingInvoice,
  handleConfirmInvoice,
  confirmingInvoiceId,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã hóa đơn: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="hidden lg:block w-full">
      <TableContainer className="rounded-none border-0 shadow-none">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs shadow-2xs">
            <TableRow>
              <TableHead className="py-3 pl-3.5 pr-1 w-10">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={onToggleSelectAll}
                  title="Chọn tất cả hóa đơn trên trang này"
                />
              </TableHead>
              <TableHead>Mã Hóa Đơn</TableHead>
              <TableHead>Cửa Hàng & Gói Thuê</TableHead>
              <TableHead>Kỳ Hạn</TableHead>
              <TableHead>Số Tiền (VND)</TableHead>
              <TableHead>Phương Thức</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead align="right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableEmpty
                colSpan={8}
                icon="fileText"
                title="Không tìm thấy hóa đơn"
                description="Không tìm thấy hóa đơn phần mềm nào phù hợp."
              />
            ) : (
              paginatedInvoices.map((inv) => {
              const isSelected = selectedInvoiceIds.includes(inv.id);
              const codeDisplay = inv.invoiceCode || inv.id;
              const isCopied = copiedCode === codeDisplay;
              const isConfirming = confirmingInvoiceId === inv.id;

              return (
                <tr
                  key={inv.id}
                  className={`transition-colors group ${
                    isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Checkbox tùy biến chọn từng hóa đơn */}
                  <td className="py-3.5 pl-3.5 pr-1 w-10">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectInvoice(inv.id)}
                      title={`Chọn ${codeDisplay}`}
                    />
                  </td>

                  {/* Mã hóa đơn */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Icon name="fileText" size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 hover:border-emerald-500 hover:text-emerald-800 transition cursor-pointer"
                            title="Xem chi tiết hóa đơn & mã VietQR"
                          >
                            {codeDisplay}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, codeDisplay)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-md transition cursor-pointer"
                            title="Sao chép mã"
                          >
                            <Icon name={isCopied ? "check" : "copy"} size={13} className={isCopied ? "text-emerald-600" : ""} />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Ngày lập: {inv.createdAt}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cửa hàng & Gói thuê */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Icon name="store" size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900 truncate max-w-[170px]" title={inv.storeName}>
                          {inv.storeName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[170px]">
                          {inv.plan}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Kỳ hạn */}
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                      <Icon name="calendar" size={12} className="text-slate-500" />
                      {inv.durationMonths} tháng
                    </span>
                  </td>

                  {/* Số tiền */}
                  <td className="py-3.5 px-3">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        {formatCurrency(inv.finalAmount)}
                      </span>
                      {inv.discountAmount > 0 && (
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Đã giảm: -{formatCurrency(inv.discountAmount)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Phương thức */}
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Icon name="creditCard" size={12} />
                      {inv.paymentMethod || "VietQR"}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-3">
                    {inv.status === "PAID" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đã Thu
                      </span>
                    )}
                    {inv.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Chờ Đối Soát
                      </span>
                    )}
                    {inv.status === "CANCELLED" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Quá Hạn / Hủy
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(inv)}
                        className="inline-flex h-8 items-center gap-1 px-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent transition cursor-pointer"
                        title="Xem hóa đơn và mã QR"
                      >
                        <Icon name="eye" size={13} />
                        <span>Xem QR</span>
                      </button>

                      {inv.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleConfirmInvoice(inv)}
                          disabled={isConfirming}
                          className="inline-flex h-8 items-center gap-1 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                          title="Xác nhận thanh toán thủ công"
                        >
                          {isConfirming ? (
                            <Icon name="refresh" size={13} className="animate-spin" />
                          ) : (
                            <Icon name="check" size={13} />
                          )}
                          <span>Duyệt Thu</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
  );
};
