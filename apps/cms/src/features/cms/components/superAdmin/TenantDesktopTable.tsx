import React, { useState } from "react";
import { Icon, Checkbox } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";
import { BUSINESS_TYPE_ICONS } from "./modals/StoreOnboardingModal";
import { toast } from "@/stores/notificationStore";

export interface TenantDesktopTableProps {
  paginatedStores: TenantStoreRecord[];
  selectedStoreIds: string[];
  onToggleSelectStore: (storeId: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantDesktopTable: React.FC<TenantDesktopTableProps> = ({
  paginatedStores,
  selectedStoreIds,
  onToggleSelectStore,
  onToggleSelectAll,
  isAllSelected,
  isIndeterminate,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const handleCopy = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (!key || key === "Chưa cấp") return;
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(`Đã sao chép License Key: ${key}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatKeyDisplay = (key: string, isRevealed: boolean) => {
    if (!key || key === "Chưa cấp") return "Chưa cấp";
    if (isRevealed) return key;
    if (key.length <= 10) return "••••••••";
    const start = key.slice(0, 6);
    const end = key.slice(-4);
    return `${start}•••${end}`;
  };

  return (
    <div className="hidden lg:block w-full">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs shadow-2xs">
          <tr className="border-b border-surface-border text-slate-500 uppercase tracking-wider text-[10px] font-black">
            <th className="py-3 pl-3.5 pr-1 w-10 bg-slate-50/95">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={onToggleSelectAll}
                title="Chọn tất cả quán trên trang này"
              />
            </th>
            <th className="py-3 px-3 bg-slate-50/95">Cửa Hàng & Chủ Quán</th>
            <th className="py-3 px-3 bg-slate-50/95">Gói Dịch Vụ</th>
            <th className="py-3 px-3 bg-slate-50/95">Hợp Đồng / Key</th>
            <th className="py-3 px-3 bg-slate-50/95">Hạn Dùng & Trạng Thái</th>
            <th className="py-3 px-3.5 text-right bg-slate-50/95">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {paginatedStores.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-bold">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Icon name="store" size={24} />
                  </div>
                  <span>Không tìm thấy quán nào phù hợp bộ lọc</span>
                </div>
              </td>
            </tr>
          ) : (
            paginatedStores.map((s) => {
              const isSelected = selectedStoreIds.includes(s.id);
              const bConfig = s.businessType ? BUSINESS_TYPE_CONFIG[s.businessType] : null;
              const isOnline = s.activeDevices > 0;
              const isKeyRevealed = !!revealedKeys[s.id];

              return (
                <tr
                  key={s.id}
                  className={`transition-colors group ${
                    isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Checkbox tùy biến chọn từng quán */}
                  <td className="py-3.5 pl-3.5 pr-1 w-10">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectStore(s.id)}
                      title={`Chọn ${s.name}`}
                    />
                  </td>

                  {/* Cửa hàng & Chủ quán (Online/Offline biểu thị qua viền Avatar) */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar viền Xanh (Online) hoặc Xám (Offline) */}
                      <div
                        className={`relative w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all ${
                          isOnline
                            ? "bg-emerald-950 text-emerald-300 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white shadow-xs shadow-emerald-500/20"
                            : "bg-slate-800 text-slate-300 ring-2 ring-slate-300 ring-offset-2 ring-offset-white"
                        }`}
                        title={
                          isOnline
                            ? `Online: ${s.activeDevices} thiết bị POS/KDS đang kết nối (v${s.configVer || "1.0.0"})`
                            : `Offline: Chưa có thiết bị POS kết nối (v${s.configVer || "1.0.0"})`
                        }
                      >
                        <Icon
                          name={s.businessType ? BUSINESS_TYPE_ICONS[s.businessType] || "store" : "store"}
                          size={16}
                          className="shrink-0"
                        />

                        {/* Chấm trạng thái nhỏ góc avatar */}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div
                          onClick={() => setViewingStoreDetails(s)}
                          className="font-black text-slate-900 text-sm hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Nhấp để xem hồ sơ chi tiết và quản lý users"
                        >
                          <span className="truncate max-w-[200px] xl:max-w-[260px]">{s.name}</span>
                          <Icon
                            name="arrowUpRight"
                            size={12}
                            className="opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity shrink-0"
                          />
                        </div>

                        {/* Thông tin Chủ sở hữu */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-700 flex items-center gap-1 truncate max-w-[170px]">
                            <Icon name="userCheck" size={11} className="text-emerald-600 shrink-0" />
                            {s.owner}
                          </span>
                          {s.phone && <span className="text-slate-400 shrink-0">• {s.phone}</span>}
                        </div>

                        {/* Địa chỉ & Badge ngành */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {bConfig && (
                            <span className="text-[9.5px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100 shrink-0">
                              {bConfig.label}
                            </span>
                          )}
                          {s.address && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[180px] xl:max-w-[240px]" title={s.address}>
                              {s.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Gói thuê dịch vụ */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black whitespace-nowrap ${
                        s.plan === "PRO"
                          ? "bg-purple-100 text-purple-900 border border-purple-200"
                          : s.plan === "GROWTH"
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      }`}
                    >
                      {s.plan === "PRO" ? "Pro (299k)" : s.plan === "GROWTH" ? "Vừa (199k)" : "Nhỏ (119k)"}
                    </span>
                  </td>

                  {/* Hợp đồng / License Key (Dạng ẩn/rút gọn không xuống dòng, nhấp để xem hết + copy) */}
                  <td className="py-3.5 px-3">
                    <div
                      onClick={() => s.licenseKey !== "Chưa cấp" && toggleReveal(s.id)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/90 border border-slate-200 font-mono text-[11px] font-bold text-slate-800 transition-all cursor-pointer hover:border-slate-300 hover:bg-slate-200/60 whitespace-nowrap shrink-0 ${
                        isKeyRevealed ? "ring-2 ring-emerald-500/20 bg-emerald-50/50 border-emerald-300" : ""
                      }`}
                      title={isKeyRevealed ? "Nhấp để ẩn bớt mã key" : "Nhấp để hiện đầy đủ License Key"}
                    >
                      <Icon
                        name={isKeyRevealed ? "eye" : "lock"}
                        size={11}
                        className={isKeyRevealed ? "text-emerald-600 shrink-0" : "text-slate-400 shrink-0"}
                      />
                      <span className="select-all tracking-tight whitespace-nowrap">
                        {formatKeyDisplay(s.licenseKey, isKeyRevealed)}
                      </span>

                      {s.licenseKey !== "Chưa cấp" && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, s.licenseKey)}
                          className="text-slate-400 hover:text-emerald-700 hover:bg-white p-0.5 rounded transition-colors shrink-0 ml-0.5"
                          title="Sao chép License Key đầy đủ"
                        >
                          <Icon name={copiedKey === s.licenseKey ? "check" : "clipboard"} size={12} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Hạn dùng & Trạng thái */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {s.status === "ACTIVE" && (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Còn {s.daysLeft} ngày</span>
                      </div>
                    )}
                    {s.status === "EXPIRING_SOON" && (
                      <div className="flex items-center gap-1.5 text-amber-600 font-black text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Sắp hết ({s.daysLeft} ngày)</span>
                      </div>
                    )}
                    {s.status === "EXPIRED" && (
                      <div className="flex items-center gap-1.5 text-rose-600 font-black text-xs">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Đã hết hạn</span>
                      </div>
                    )}
                    {s.status === "SUSPENDED" && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-black text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Tạm khóa</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Hạn: {s.expiresAt || "Vô thời hạn"}
                    </span>
                  </td>

                  {/* Cột Thao tác: Ưu tiên Icon buttons tinh gọn, chuẩn mực */}
                  <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* Nút xem Hồ sơ & Users */}
                      <button
                        type="button"
                        onClick={() => setViewingStoreDetails(s)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs shrink-0"
                        title="Xem hồ sơ chi tiết & danh sách nhân sự"
                      >
                        <Icon name="fileText" size={13} />
                      </button>

                      {/* Nút Gia hạn */}
                      <button
                        type="button"
                        onClick={() => setLicenseTargetStore(s)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-indigo-700 bg-indigo-50 border border-indigo-200/70 hover:bg-indigo-100 transition-colors shadow-2xs shrink-0"
                        title="Gia hạn hợp đồng License Key"
                      >
                        <Icon name="clock" size={13} />
                      </button>

                      {/* Nút Khóa / Mở khóa (Mở modal cảnh báo & xác nhận mã) */}
                      <button
                        type="button"
                        onClick={() => handleToggleStoreStatus(s)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-2xs shrink-0 ${
                          s.status === "SUSPENDED"
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100"
                            : "text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100"
                        }`}
                        title={
                          s.status === "SUSPENDED"
                            ? "Mở khóa hoạt động quán"
                            : "Khóa hoạt động quán (Cần xác nhận mã hợp đồng)"
                        }
                      >
                        <Icon name={s.status === "SUSPENDED" ? "checkCircle" : "lock"} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
