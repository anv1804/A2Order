import React, { useState } from "react";
import { Icon, Checkbox } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseMobileCardsProps {
  paginatedLicenses: LicenseKeyRecord[];
  selectedLicenseIds: string[];
  onToggleSelectLicense: (id: string) => void;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseMobileCards: React.FC<LicenseMobileCardsProps> = ({
  paginatedLicenses,
  selectedLicenseIds,
  onToggleSelectLicense,
  handleCopyKey,
  handleRevokeKey,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const onCopy = (key: string) => {
    handleCopyKey(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="block lg:hidden w-full">
      {paginatedLicenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-bold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="key" size={20} />
            </div>
            <span>Không tìm thấy mã License Key nào phù hợp</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {paginatedLicenses.map((lic) => {
            const isSelected = selectedLicenseIds.includes(lic.id);
            const isCopied = copiedKey === lic.keyCode;

            return (
              <div
                key={lic.id}
                className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                    : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* Row 1: Checkbox + Key Code + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectLicense(lic.id)}
                      title={`Chọn ${lic.keyCode}`}
                      size="sm"
                    />
                    <span className="font-mono text-xs font-black text-slate-900 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 truncate">
                      {lic.keyCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopy(lic.keyCode)}
                      className="p-0.5 text-slate-400 hover:text-emerald-700"
                      title="Sao chép"
                    >
                      <Icon name={isCopied ? "check" : "copy"} size={11} className={isCopied ? "text-emerald-600" : ""} />
                    </button>
                  </div>

                  <div>
                    {lic.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đang Dùng
                      </span>
                    )}
                    {lic.status === "UNASSIGNED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Chờ Gán
                      </span>
                    )}
                    {lic.status === "EXPIRING_SOON" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Sắp Hết
                      </span>
                    )}
                    {lic.status === "EXPIRED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Hết Hạn
                      </span>
                    )}
                    {lic.status === "REVOKED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 line-through">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Thu Hồi
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Store Name + Plan + Duration */}
                <div className="flex items-center justify-between text-[11px] pl-6">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {lic.storeName ? (
                      <span className="font-bold text-slate-900 truncate">{lic.storeName}</span>
                    ) : (
                      <span className="text-blue-700 italic truncate font-medium">Key dự phòng (Chưa gán)</span>
                    )}
                    <span className="text-slate-400 shrink-0">• Gói {lic.plan} • {lic.durationMonths}th</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">Hết: {lic.expiresAt}</span>
                </div>

                {/* Row 3: Devices + Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 pl-6 text-xs">
                  <span className="text-[10px] text-slate-500">
                    Tối đa: <strong className="text-slate-700">{lic.maxDevices}</strong> máy POS/KDS
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCopy(lic.keyCode)}
                      className="h-6 px-2 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Copy Key
                    </button>
                    {lic.status !== "REVOKED" && (
                      <button
                        type="button"
                        onClick={() => handleRevokeKey(lic)}
                        className="h-6 px-2 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                      >
                        Thu Hồi
                      </button>
                    )}
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
