import React, { useState } from "react";
import { Icon, Checkbox } from "@/components/ui";
import { PlatformStoreUserRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface StoreUserDesktopTableProps {
  paginatedUsers: PlatformStoreUserRecord[];
  selectedUserIds: string[];
  onToggleSelectUser: (userId: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onEditUser: (user: PlatformStoreUserRecord) => void;
  onResetCredentials: (user: PlatformStoreUserRecord) => void;
  onToggleUserStatus: (user: PlatformStoreUserRecord) => void;
}

export const StoreUserDesktopTable: React.FC<StoreUserDesktopTableProps> = ({
  paginatedUsers,
  selectedUserIds,
  onToggleSelectUser,
  onToggleSelectAll,
  isAllSelected,
  isIndeterminate,
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
        return { label: "Đầu Bếp KDS", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "WAITER":
        return { label: "Phục Vụ", bg: "bg-slate-100 text-slate-700 border-slate-200" };
      default:
        return { label: role, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
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
                title="Chọn tất cả người dùng trên trang này"
              />
            </th>
            <th className="py-3 px-3 bg-slate-50/95">Tài Khoản & Người Dùng</th>
            <th className="py-3 px-3 bg-slate-50/95">Cửa Hàng Trực Thuộc</th>
            <th className="py-3 px-3 bg-slate-50/95">Vai Trò</th>
            <th className="py-3 px-3 bg-slate-50/95">Mã PIN POS</th>
            <th className="py-3 px-3 bg-slate-50/95">Trạng Thái</th>
            <th className="py-3 px-3.5 text-right bg-slate-50/95">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-bold">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Icon name="users" size={24} />
                  </div>
                  <span>Không tìm thấy tài khoản người dùng nào phù hợp</span>
                </div>
              </td>
            </tr>
          ) : (
            paginatedUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              const isPinRevealed = !!revealedPins[user.id];
              const roleBadge = getRoleBadge(user.role);

              return (
                <tr
                  key={user.id}
                  className={`transition-colors group ${
                    isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 pl-3.5 pr-1 w-10">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectUser(user.id)}
                      title={`Chọn ${user.name}`}
                    />
                  </td>

                  {/* Người dùng & Email */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.role === "STORE_OWNER" && (
                            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              Chủ quán
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {user.email ? (
                            <>
                              <span className="truncate">{user.email}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyEmail(e, user.email)}
                                className="text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                                title="Sao chép email"
                              >
                                <Icon name="copy" size={11} />
                              </button>
                            </>
                          ) : (
                            <span className="italic text-slate-400">Đăng nhập bằng mã PIN</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cửa hàng trực thuộc */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 truncate">{user.storeName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 rounded">
                          {user.storePlan || "STARTER"}
                        </span>
                        {user.storeStatus && (
                          <span className="text-[10px] text-slate-400">
                            • {user.storeStatus === "ACTIVE" ? "Quán hoạt động" : "Quán tạm khóa"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Vai trò */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </td>

                  {/* Mã PIN POS */}
                  <td className="py-3.5 px-3">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      <span>{isPinRevealed ? (user.pinCode || "Chưa cấp") : "••••"}</span>
                      <button
                        type="button"
                        onClick={() => toggleRevealPin(user.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={isPinRevealed ? "Ẩn mã PIN" : "Xem mã PIN"}
                      >
                        <Icon name={isPinRevealed ? "eyeOff" : "eye"} size={12} />
                      </button>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span>{user.isActive ? "Hoạt Động" : "Đang Khóa"}</span>
                    </span>
                  </td>

                  {/* Thao tác (3 icon buttons 32x32px) */}
                  <td className="py-3.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Sửa thông tin */}
                      <button
                        type="button"
                        onClick={() => onEditUser(user)}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center shadow-2xs cursor-pointer"
                        title={`Chỉnh sửa thông tin ${user.name}`}
                      >
                        <Icon name="edit" size={13} />
                      </button>

                      {/* Đổi mật khẩu / PIN */}
                      <button
                        type="button"
                        onClick={() => onResetCredentials(user)}
                        className="w-8 h-8 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center justify-center shadow-2xs cursor-pointer"
                        title={`Cấp lại mật khẩu hoặc PIN cho ${user.name}`}
                      >
                        <Icon name="key" size={13} />
                      </button>

                      {/* Khóa / Mở khóa tài khoản */}
                      <button
                        type="button"
                        onClick={() => onToggleUserStatus(user)}
                        className={`w-8 h-8 rounded-xl border transition flex items-center justify-center shadow-2xs cursor-pointer ${
                          user.isActive
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title={user.isActive ? `Khóa tài khoản ${user.name}` : `Mở khóa tài khoản ${user.name}`}
                      >
                        <Icon name={user.isActive ? "lock" : "checkCircle"} size={13} />
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
