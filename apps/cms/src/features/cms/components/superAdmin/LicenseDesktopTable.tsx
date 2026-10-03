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
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseDesktopTableProps {
  paginatedLicenses: LicenseKeyRecord[];
  selectedLicenseIds: string[];
  onToggleSelectLicense: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseDesktopTable: React.FC<LicenseDesktopTableProps> = ({
  paginatedLicenses,
  selectedLicenseIds,
  onToggleSelectLicense,
  onToggleSelectAll,
  isAllSelected,
  isIndeterminate,
  handleCopyKey,
  handleRevokeKey,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const onCopy = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    handleCopyKey(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatKeyDisplay = (key: string, isRevealed: boolean) => {
    if (!key) return "---";
    if (isRevealed) return key;
    if (key.length <= 10) return "••••••••";
    const start = key.slice(0, 6);
    const end = key.slice(-4);
    return `${start}••••${end}`;
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
                  title="Chọn tất cả License trên trang này"
                />
              </TableHead>
              <TableHead>Mã License Key</TableHead>
              <TableHead>Gói Thuê & Thiết Bị</TableHead>
              <TableHead>Quán Sở Hữu</TableHead>
              <TableHead>Thời Hạn & Hết Hạn</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead align="right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLicenses.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon="key"
                title="Không tìm thấy License"
                description="Không tìm thấy mã License Key nào phù hợp với bộ lọc."
              />
            ) : (
            paginatedLicenses.map((lic) => {
              const isSelected = selectedLicenseIds.includes(lic.id);
              const isRevealed = !!revealedKeys[lic.id];
              const isCopied = copiedKey === lic.keyCode;

              return (
                <tr
                  key={lic.id}
                  className={`transition-colors group ${
                    isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Checkbox tùy biến chọn từng key */}
                  <td className="py-3.5 pl-3.5 pr-1 w-10">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectLicense(lic.id)}
                      title={`Chọn ${lic.keyCode}`}
                    />
                  </td>

                  {/* Mã License Key */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Icon name="key" size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {formatKeyDisplay(lic.keyCode, isRevealed)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(lic.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
                            title={isRevealed ? "Ẩn bớt ký tự" : "Xem toàn bộ mã"}
                          >
                            <Icon name={isRevealed ? "eyeOff" : "eye"} size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => onCopy(e, lic.keyCode)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-md transition"
                            title="Sao chép License Key"
                          >
                            <Icon name={isCopied ? "check" : "copy"} size={13} className={isCopied ? "text-emerald-600" : ""} />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Cấp ngày: {lic.issuedAt}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Gói thuê & Thiết bị */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          lic.plan === "PRO"
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : lic.plan === "GROWTH"
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                        }`}
                      >
                        Gói {lic.plan}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Tối đa: <strong className="text-slate-800">{lic.maxDevices}</strong> máy POS/KDS
                      </span>
                    </div>
                  </td>

                  {/* Quán sở hữu */}
                  <td className="py-3.5 px-3">
                    {lic.storeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Icon name="store" size={13} />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-bold text-slate-900 truncate max-w-[170px]" title={lic.storeName}>
                            {lic.storeName}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">Đã liên kết quán</span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100 font-medium">
                        <Icon name="info" size={12} />
                        Key dự phòng (Chưa gán)
                      </span>
                    )}
                  </td>

                  {/* Thời hạn & Hết hạn */}
                  <td className="py-3.5 px-3">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {lic.durationMonths} tháng
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        Hết hạn: <strong className="text-slate-700">{lic.expiresAt}</strong>
                      </span>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-3">
                    {lic.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đang Dùng
                      </span>
                    )}
                    {lic.status === "UNASSIGNED" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Chờ Gán
                      </span>
                    )}
                    {lic.status === "EXPIRING_SOON" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Sắp Hết Hạn
                      </span>
                    )}
                    {lic.status === "EXPIRED" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Đã Hết Hạn
                      </span>
                    )}
                    {lic.status === "REVOKED" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 line-through">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Đã Thu Hồi
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => onCopy(e, lic.keyCode)}
                        className="inline-flex h-8 items-center gap-1 px-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent transition cursor-pointer"
                        title="Sao chép License Key"
                      >
                        <Icon name="copy" size={13} />
                        <span>Sao Chép</span>
                      </button>

                      {lic.status !== "REVOKED" && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(lic)}
                          className="inline-flex h-8 items-center gap-1 px-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 transition cursor-pointer"
                          title="Thu hồi / Khóa License Key này"
                        >
                          <Icon name="ban" size={13} />
                          <span>Thu Hồi</span>
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
