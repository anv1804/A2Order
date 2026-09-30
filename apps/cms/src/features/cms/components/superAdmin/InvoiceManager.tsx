import React, { useMemo } from "react";
import { Panel, Icon, Pagination } from "@/components/ui";
import { SoftwareInvoiceRecord } from "@/types/cms.types";
import { formatCurrency } from "@/lib/formatters";

export interface InvoiceManagerProps {
  invoices: SoftwareInvoiceRecord[];
  invoiceSearch: string;
  setInvoiceSearch: (val: string) => void;
  invoiceStatusFilter: string;
  setInvoiceStatusFilter: (val: string) => void;
  invoicePage: number;
  setInvoicePage: (page: number) => void;
  filteredInvoices: SoftwareInvoiceRecord[];
  paginatedInvoices: SoftwareInvoiceRecord[];
  INVOICE_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  invoiceSearch,
  setInvoiceSearch,
  invoiceStatusFilter,
  setInvoiceStatusFilter,
  invoicePage,
  setInvoicePage,
  filteredInvoices,
  paginatedInvoices,
  INVOICE_PAGE_SIZE,
  downloadCsv,
  setViewingInvoice,
  handleConfirmInvoice,
  confirmingInvoiceId,
}) => {
  // Financial metrics
  const financialMetrics = useMemo(() => {
    return {
      collected: invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.finalAmount, 0),
      pending: invoices.filter(i => i.status === "PENDING").reduce((sum, i) => sum + i.finalAmount, 0),
      overdue: invoices.filter(i => i.status === "CANCELLED").reduce((sum, i) => sum + i.finalAmount, 0),
    };
  }, [invoices]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. KANBAN BÁO CÁO TÀI CHÍNH MỚI */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Đã thu (PAID)", val: financialMetrics.collected, icon: "checkCircle", tone: "emerald" },
          { label: "Đang chờ đối soát (PENDING)", val: financialMetrics.pending, icon: "clock", tone: "amber" },
          { label: "Nợ quá hạn (OVERDUE)", val: financialMetrics.overdue, icon: "alert", tone: "rose" },
        ].map((m, i) => (
          <article key={i} className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{m.label}</h4>
              <p className={`text-2xl font-black tracking-tight ${m.tone === "rose" ? "text-rose-600" : "text-slate-900"}`}>
                {formatCurrency(m.val)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-${m.tone}-50 text-${m.tone}-600`}>
              <Icon name={m.icon as any} size={24} />
            </div>
          </article>
        ))}
      </section>

      {/* 2. MAIN TABLE */}
      <Panel variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Icon name="fileText" className="w-5 h-5 text-indigo-700" />
              Theo Dõi Công Nợ & Thu Phí
            </h3>
            <p className="text-xs text-slate-500 mt-1">Danh sách hóa đơn yêu cầu xuất hóa đơn điện tử VAT và đối soát thanh toán.</p>
          </div>
          <button onClick={() => downloadCsv("a2order-hoa-don.csv", ["Mã", "Quán", "Kỳ cước", "Số tiền", "Trạng thái", "Ngày lập"], filteredInvoices.map(i => [i.id, i.storeName, `${i.durationMonths} tháng`, i.finalAmount, i.status, i.createdAt]))} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition">
            <Icon name="download" size={14} /> Xuất Dữ Liệu
          </button>
        </div>

        {/* BỘ LỌC */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="relative w-full sm:flex-1">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => { setInvoiceSearch(e.target.value); setInvoicePage(1); }}
              placeholder="Tìm theo Mã hóa đơn, tên quán..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "PENDING", label: "Đang chờ" },
              { id: "PAID", label: "Đã thu" },
              { id: "CANCELLED", label: "Quá hạn" },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => { setInvoiceStatusFilter(st.id); setInvoicePage(1); }}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0 transition-colors ${
                  invoiceStatusFilter === st.id ? "bg-indigo-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE CARDS (< lg) */}
        <div className="grid gap-3 lg:hidden">
          {paginatedInvoices.map((inv) => (
            <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{inv.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" : inv.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                  {inv.status}
                </span>
              </div>
              <div className="mb-2">
                <p className="text-xs font-black text-slate-900">{inv.storeName}</p>
                <p className="text-[10px] text-slate-500 font-medium">Kỳ: {`${inv.durationMonths} tháng`}</p>
              </div>
              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-50">
                <p className="text-lg font-black text-slate-900">{formatCurrency(inv.finalAmount)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setViewingInvoice(inv)} className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Icon name="eye" size={14} />
                  </button>
                  {inv.status === "PENDING" && (
                    <button onClick={() => handleConfirmInvoice(inv)} disabled={confirmingInvoiceId === inv.id} className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1">
                      {confirmingInvoiceId === inv.id ? <Icon name="refresh" size={14} className="animate-spin" /> : <Icon name="check" size={14} />} Duyệt
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {paginatedInvoices.length === 0 && <div className="text-center py-10 text-xs text-slate-500 font-bold">Không tìm thấy hóa đơn nào.</div>}
        </div>

        {/* DESKTOP TABLE (>= lg) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Mã HĐ</th>
                <th className="p-4">Quán / Đối Tác</th>
                <th className="p-4">Kỳ Cước</th>
                <th className="p-4 text-right">Tổng Tiền</th>
                <th className="p-4 text-center">Trạng Thái</th>
                <th className="p-4">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              {paginatedInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition group">
                  <td className="p-4"><span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded">{inv.id}</span></td>
                  <td className="p-4"><p className="text-sm font-black text-slate-900">{inv.storeName}</p></td>
                  <td className="p-4 text-slate-500">{`${inv.durationMonths} tháng`}</td>
                  <td className="p-4 text-right text-sm font-black text-slate-900">{formatCurrency(inv.finalAmount)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : inv.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingInvoice(inv)} className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition">
                        <Icon name="eye" size={14} />
                      </button>
                      {inv.status === "PENDING" && (
                        <button onClick={() => handleConfirmInvoice(inv)} disabled={confirmingInvoiceId === inv.id} className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-700 transition shadow-sm">
                          {confirmingInvoiceId === inv.id ? <Icon name="refresh" size={14} className="animate-spin" /> : "Xác nhận thu"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedInvoices.length === 0 && <div className="text-center py-16 text-sm text-slate-500 font-bold bg-white">Trống.</div>}
        </div>

        <div className="mt-4">
          <Pagination currentPage={invoicePage} totalItems={filteredInvoices.length} pageSize={INVOICE_PAGE_SIZE} onPageChange={setInvoicePage} />
        </div>
      </Panel>
    </div>
  );
};
