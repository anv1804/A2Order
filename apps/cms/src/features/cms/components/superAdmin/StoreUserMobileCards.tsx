import React, { useState } from "react";
import { Icon, Checkbox } from "@/components/ui";
import { PlatformStoreUserRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface StoreUserMobileCardsProps {
  paginatedUsers: PlatformStoreUserRecord[];
  selectedUserIds: string[];
  onToggleSelectUser: (userId: string) => void;
  onEditUser: (user: PlatformStoreUserRecord) => void;
  onResetCredentials: (user: PlatformStoreUserRecord) => void;
  onToggleUserStatus: (user: PlatformStoreUserRecord) => void;
}

export const StoreUserMobileCards: React.FC<StoreUserMobileCardsProps> = ({
  paginatedUsers,
  selectedUserIds,
  onToggleSelectUser,
  onEditUser,
  onResetCredentials,
  onToggleUserStatus,
}) => {
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const toggleRevealPin = (userId: string) => {
    setRevealedPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success(`Đã sao chép email: ${email}`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STORE_OWNER":
        return { label: "Chủ Quán", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "STORE_MANAGER":
        return { label: "Quản Lý", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "CASHIER":
        return { label: "Thu Ngân", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "CHEF":
        return { label: "Đầu Bếp", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "WAITER":
        return { label: "Phục Vụ", bg: "bg-slate-100 text-slate-700 border-slate-200" };
      default:
        return { label: role, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="block lg:hidden w-full">
      {paginatedUsers.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-bold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="users" size={20} />
            </div>
            <span>Không tìm thấy tài khoản người dùng nào phù hợp</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {paginatedUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);
            const isPinRevealed = !!revealedPins[user.id];
            const roleBadge = getRoleBadge(user.role);

            return (
              <div
                key={user.id}
                className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                    : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* Row 1: Checkbox + Avatar + Tên + Role Badge + Status Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectUser(user.id)}
                      title={`Chọn ${user.name}`}
                      size="sm"
                    />
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[10px] shrink-0 border border-slate-200">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {user.name}
                      </span>
                      {user.role === "STORE_OWNER" && (
                        <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded shrink-0">
                          Chủ quán
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span>{user.isActive ? "Hoạt Động" : "Khóa"}</span>
                    </span>
                  </div>
                </div>

                {/* Row 2: Tên quán + Email / Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pl-6 gap-2">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <Icon name="store" size={11} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium truncate">{user.storeName}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-slate-500 truncate max-w-[55%]">
                    {user.email ? (
                      <>
                        <span className="truncate">{user.email}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyEmail(e, user.email)}
                          className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer shrink-0"
                          title="Sao chép email"
                        >
                          <Icon name="copy" size={10} />
                        </button>
                      </>
                    ) : (
                      <span className="italic text-slate-400 text-[10px]">Đăng nhập PIN</span>
                    )}
                  </div>
                </div>

                {/* Row 3: Mã PIN POS (Left) + Actions (Right) */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 pl-6 text-xs gap-1.5">
                  <div className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 shrink-0">
                    <span className="text-slate-400 font-sans text-[9px]">PIN:</span>
                    <span className="font-bold text-slate-700">{isPinRevealed ? (user.pinCode || "Chưa cấp") : "••••"}</span>
                    <button
                      type="button"
                      onClick={() => toggleRevealPin(user.id)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                      title={isPinRevealed ? "Ẩn mã PIN" : "Xem mã PIN"}
                    >
                      <Icon name={isPinRevealed ? "eyeOff" : "eye"} size={10} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditUser(user)}
                      className="h-6 px-2 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center gap-0.5"
                    >
                      <Icon name="edit" size={10} />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onResetCredentials(user)}
                      className="h-6 px-2 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer flex items-center gap-0.5"
                      title="Cấp lại mật khẩu hoặc mã PIN"
                    >
                      <Icon name="key" size={10} />
                      <span className="hidden xs:inline">MK/PIN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleUserStatus(user)}
                      className={`h-6 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 border ${
                        user.isActive
                          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <Icon name={user.isActive ? "lock" : "checkCircle"} size={10} />
                      <span>{user.isActive ? "Khóa" : "Mở"}</span>
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
