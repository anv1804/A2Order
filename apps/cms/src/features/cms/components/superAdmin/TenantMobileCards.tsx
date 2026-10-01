import React, { useState } from "react";
import { Icon, Checkbox } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface TenantMobileCardsProps {
  paginatedStores: TenantStoreRecord[];
  selectedStoreIds: string[];
  onToggleSelectStore: (storeId: string) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantMobileCards: React.FC<TenantMobileCardsProps> = ({
  paginatedStores,
  selectedStoreIds,
  onToggleSelectStore,
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
    <div className="block lg:hidden w-full">
      {paginatedStores.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-bold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="store" size={20} />
            </div>
            <span>Không tìm thấy quán nào phù hợp</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {paginatedStores.map((s) => {
            const isOnline = s.activeDevices > 0;
            const isRevealed = !!revealedKeys[s.id];
            const isSelected = selectedStoreIds.includes(s.id);

            return (
              <div
                key={s.id}
                className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                    : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* Row 1: Checkbox + Avatar + Tên quán + Plan Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectStore(s.id)}
                      title={`Chọn ${s.name}`}
                      size="sm"
                    />
                    <div className="relative shrink-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                          isOnline
                            ? "bg-emerald-950 text-emerald-300 ring-1 ring-emerald-500"
                            : "bg-slate-800 text-slate-300 ring-1 ring-slate-400"
                        }`}
                      >
                        {s.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white ${
                          isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {s.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold shrink-0 ${
                      s.plan === "PRO"
                        ? "bg-purple-100 text-purple-900 border border-purple-200"
                        : s.plan === "GROWTH"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    Gói {s.plan}
                  </span>
                </div>

                {/* Row 2: Owner + Phone + Key */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pl-6">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-800 font-medium truncate">{s.owner}</span>
                    <span className="text-slate-400 truncate">• {s.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded">
                    <span>{formatKeyDisplay(s.licenseKey, isRevealed)}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, s.licenseKey)}
                      className="text-slate-400 hover:text-emerald-700 p-0.5"
                    >
                      <Icon name={copiedKey === s.licenseKey ? "check" : "copy"} size={10} className={copiedKey === s.licenseKey ? "text-emerald-600" : ""} />
                    </button>
                  </div>
                </div>

                {/* Row 3: Status + Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 pl-6 text-xs">
                  <div>
                    {s.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Hoạt Động
                      </span>
                    )}
                    {s.status === "EXPIRING_SOON" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Sắp Hạn
                      </span>
                    )}
                    {s.status === "SUSPENDED" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Tạm Khóa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingStoreDetails(s)}
                      className="h-6 px-2 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Hồ Sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => setLicenseTargetStore(s)}
                      className="h-6 px-2 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                    >
                      Gia Hạn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStoreStatus(s)}
                      className={`h-6 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        s.status === "SUSPENDED" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      {s.status === "SUSPENDED" ? "Mở" : "Khóa"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
