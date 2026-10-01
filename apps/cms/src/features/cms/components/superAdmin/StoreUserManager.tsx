import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Panel, Icon, Pagination, SearchableSelect, SearchableSelectOption } from "@/components/ui";
import { PlatformStoreUserRecord, TenantStoreRecord } from "@/types/cms.types";
import { StoreUserDesktopTable } from "./StoreUserDesktopTable";
import { StoreUserMobileCards } from "./StoreUserMobileCards";
import { StoreUserModal } from "./modals/StoreUserModal";
import { ResetUserCredentialsModal } from "./modals/ResetUserCredentialsModal";
import { staffApi } from "@/services/api/staffApi";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { useScrollHideKpi } from "@/hooks/useScrollHideKpi";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

export interface StoreUserManagerProps {
  stores: TenantStoreRecord[];
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const StoreUserManager: React.FC<StoreUserManagerProps> = ({
  stores,
  downloadCsv,
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
}) => {
  const [users, setUsers] = useState<PlatformStoreUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Bộ lọc & Tìm kiếm
  const [userSearch, setUserSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Quản lý chọn hàng loạt
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Chế độ Phóng to / Thu nhỏ (Giữ nguyên Sidebar & Header)
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = propIsMaximized !== undefined ? propIsMaximized : internalMaximized;
  const setIsMaximized = propSetIsMaximized || setInternalMaximized;

  // Tự động thu gọn KPI thống kê khi cuộn danh sách (tối ưu không gian mobile)
  const { isScrolled, handleInnerScroll } = useScrollHideKpi(isMaximized);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformStoreUserRecord | null>(null);
  const [resetCredentialsUser, setResetCredentialsUser] = useState<PlatformStoreUserRecord | null>(null);

  // Lắng nghe phím ESC để thoát chế độ phóng to
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, setIsMaximized]);

  // Tải danh sách nhân sự từ Server API (với fallback từ danh sách stores)
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.getStaff();
      if (Array.isArray(res)) {
        setUsers(res);
        return;
      }
    } catch {
      // Fallback: gom staff từ stores prop
      const aggregated: PlatformStoreUserRecord[] = [];
      stores.forEach((s) => {
        if (s.staffList && s.staffList.length > 0) {
          s.staffList.forEach((st) => {
            aggregated.push({
              id: st.id,
              name: st.name,
              email: st.email || "",
              pinCode: "1111",
              role: st.role,
              isActive: st.isActive,
              createdAt: s.activatedAt || new Date().toISOString(),
              storeId: s.id,
              storeName: s.name,
              storePlan: s.plan,
              storeStatus: s.status,
            });
          });
        } else if (s.owner) {
          // Tự sinh chủ quán nếu danh sách trống
          aggregated.push({
            id: `owner-${s.id}`,
            name: s.owner,
            email: s.ownerEmail || "",
            pinCode: "1111",
            role: "STORE_OWNER",
            isActive: s.status === "ACTIVE",
            createdAt: s.activatedAt || new Date().toISOString(),
            storeId: s.id,
            storeName: s.name,
            storePlan: s.plan,
            storeStatus: s.status,
          });
        }
      });
      setUsers(aggregated);
    } finally {
      setIsLoading(false);
    }
  }, [stores]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Bộ lọc Options
  const storeOptions: SearchableSelectOption[] = useMemo(() => {
    const base = [{ value: "ALL", label: "Tất Cả Cửa Hàng", badge: users.length }];
    const storeMap = new Map<string, { name: string; count: number }>();
    users.forEach((u) => {
      const existing = storeMap.get(u.storeId) || { name: u.storeName, count: 0 };
      existing.count += 1;
      storeMap.set(u.storeId, existing);
    });
    // Thêm các quán chưa có user
    stores.forEach((s) => {
      if (!storeMap.has(s.id)) {
        storeMap.set(s.id, { name: s.name, count: 0 });
      }
    });
    const dynamic = Array.from(storeMap.entries()).map(([id, info]) => ({
      value: id,
      label: info.name,
      badge: info.count,
    }));
    return [...base, ...dynamic];
  }, [users, stores]);

  const roleOptions: SearchableSelectOption[] = useMemo(() => [
    { value: "ALL", label: "Tất Cả Vai Trò", badge: users.length },
    { value: "STORE_OWNER", label: "Chủ Quán", badge: users.filter((u) => u.role === "STORE_OWNER").length },
    { value: "STORE_MANAGER", label: "Quản Lý", badge: users.filter((u) => u.role === "STORE_MANAGER").length },
    { value: "CASHIER", label: "Thu Ngân", badge: users.filter((u) => u.role === "CASHIER").length },
    { value: "CHEF", label: "Đầu Bếp KDS", badge: users.filter((u) => u.role === "CHEF").length },
    { value: "WAITER", label: "Nhân Viên Phục Vụ", badge: users.filter((u) => u.role === "WAITER").length },
  ], [users]);

  const statusOptions: SearchableSelectOption[] = useMemo(() => [
    { value: "ALL", label: "Tất Cả Trạng Thái", badge: users.length },
    { value: "ACTIVE", label: "Đang Hoạt Động", badge: users.filter((u) => u.isActive).length },
    { value: "INACTIVE", label: "Đang Tạm Khóa", badge: users.filter((u) => !u.isActive).length },
  ], [users]);

  // Lọc dữ liệu
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userSearch.trim()) {
        const q = userSearch.trim().toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email ? u.email.toLowerCase().includes(q) : false;
        const matchStore = u.storeName.toLowerCase().includes(q);
        const matchPin = u.pinCode ? u.pinCode.includes(q) : false;
        if (!matchName && !matchEmail && !matchStore && !matchPin) return false;
      }
      if (storeFilter !== "ALL" && u.storeId !== storeFilter) return false;
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "INACTIVE" && u.isActive) return false;
      return true;
    });
  }, [users, userSearch, storeFilter, roleFilter, statusFilter]);

  // Phân trang
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const {
    visibleItems: mobileUsers,
    visibleCount: visibleUserCount,
    hasMore: hasMoreUsers,
    sentinelRef: userSentinelRef,
  } = useMobileInfiniteScroll({
    items: filteredUsers,
    pageSize: 10,
  });

  // Quản lý Checkbox
  const currentPageUserIds = useMemo(() => paginatedUsers.map((u) => u.id), [paginatedUsers]);

  const isAllSelected = useMemo(
    () => currentPageUserIds.length > 0 && currentPageUserIds.every((id) => selectedUserIds.includes(id)),
    [currentPageUserIds, selectedUserIds]
  );

  const isIndeterminate = useMemo(
    () => currentPageUserIds.some((id) => selectedUserIds.includes(id)) && !isAllSelected,
    [currentPageUserIds, selectedUserIds, isAllSelected]
  );

  const handleToggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !currentPageUserIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...currentPageUserIds])));
    }
  };

  const hasActiveFilters =
    userSearch.trim().length > 0 ||
    storeFilter !== "ALL" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL";

  const handleResetFilters = () => {
    setUserSearch("");
    setStoreFilter("ALL");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  // Thao tác với User
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: PlatformStoreUserRecord) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<PlatformStoreUserRecord>, password?: string) => {
    if (userData.id) {
      // Cập nhật
      try {
        await staffApi.updateStaff(userData.id, {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          pinCode: userData.pinCode,
          isActive: userData.isActive,
          storeId: userData.storeId,
        });
      } catch {
        // Fallback local
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userData.id
            ? { ...u, ...userData, storeName: stores.find((s) => s.id === userData.storeId)?.name || u.storeName }
            : u
        )
      );
    } else {
      // Tạo mới
      try {
        const created = await staffApi.createStaff({
          storeId: userData.storeId!,
          name: userData.name!,
          email: userData.email,
          password,
          pinCode: userData.pinCode,
          role: userData.role!,
          isActive: userData.isActive !== false,
        });
        setUsers((prev) => [created, ...prev]);
      } catch {
        // Fallback local
        const newRecord: PlatformStoreUserRecord = {
          id: `staff-${Date.now()}`,
          name: userData.name!,
          email: userData.email || "",
          pinCode: userData.pinCode || "1111",
          role: userData.role!,
          isActive: userData.isActive !== false,
          createdAt: new Date().toISOString(),
          storeId: userData.storeId!,
          storeName: stores.find((s) => s.id === userData.storeId)?.name || "Cửa hàng",
          storePlan: stores.find((s) => s.id === userData.storeId)?.plan || "STARTER",
        };
        setUsers((prev) => [newRecord, ...prev]);
      }
    }
  };

  const handleToggleUserStatus = async (user: PlatformStoreUserRecord) => {
    const actionText = user.isActive ? "khóa tài khoản" : "mở khóa tài khoản";
    if (
      !(await confirmDialog({
        title: user.isActive ? "Khóa Tài Khoản Nhân Sự?" : "Mở Khóa Tài Khoản?",
        message: `Bạn có chắc muốn ${actionText} của "${user.name}" (${user.storeName})?`,
        confirmText: user.isActive ? "Khóa Tài Khoản" : "Mở Khóa",
        variant: user.isActive ? "danger" : "primary",
      }))
    ) {
      return;
    }

    try {
      await staffApi.toggleStaffStatus(user.id);
    } catch {
      // Fallback local
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    );
    toast.success(
      user.isActive
        ? `Đã khóa tài khoản "${user.name}".`
        : `Đã mở khóa tài khoản "${user.name}".`
    );
  };

  const handleResetCredentials = async (userId: string, payload: { password?: string; pinCode?: string }) => {
    try {
      await staffApi.resetCredentials(userId, payload);
    } catch {
      // Fallback local
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              ...(payload.pinCode ? { pinCode: payload.pinCode } : {}),
            }
          : u
      )
    );
  };

  // Thống kê Mini Dashboard
  const ownerCount = useMemo(() => users.filter((u) => u.role === "STORE_OWNER").length, [users]);
  const managerStaffCount = useMemo(
    () => users.filter((u) => u.role !== "STORE_OWNER" && u.isActive).length,
    [users]
  );
  const lockedCount = useMemo(() => users.filter((u) => !u.isActive).length, [users]);

  const kpiCards = [
    {
      label: "Tổng Tài Khoản Quán",
      val: users.length,
      sub: `${stores.length} cửa hàng đang quản lý`,
      icon: "users" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Chủ Quán (Store Owners)",
      val: ownerCount,
      sub: "Quyền quản trị cao nhất của quán",
      icon: "userCheck" as const,
      wrapBg: "bg-blue-50/50 border-blue-100/80",
      iconBg: "bg-blue-600 text-white shadow-blue-500/20",
      textColor: "text-blue-950",
    },
    {
      label: "Nhân Sự Vận Hành (POS/KDS)",
      val: managerStaffCount,
      sub: "Quản lý, thu ngân, bếp và phục vụ",
      icon: "monitor" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
    {
      label: "Tài Khoản Đang Bị Khóa",
      val: lockedCount,
      sub: lockedCount > 0 ? "Nhân sự nghỉ việc hoặc vi phạm" : "Không có tài khoản bị khóa",
      icon: "shield" as const,
      wrapBg: lockedCount > 0 ? "bg-rose-50/70 border-rose-200" : "bg-slate-50/50 border-slate-200/80",
      iconBg: lockedCount > 0 ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-300 text-slate-700",
      textColor: lockedCount > 0 ? "text-rose-700" : "text-slate-800",
    },
  ];

  return (
    <div className={`flex-1 min-h-0 flex flex-col space-y-3.5 ${isMaximized ? "h-full" : ""}`}>
      {/* 1. KHỐI THỐNG KÊ (MINI DASHBOARD) - ẨN KHI BẬT PHÓNG TO HOẶC CUỘN */}
      {!isMaximized && !isScrolled && (
        <section className="shrink-0 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
          {kpiCards.map((m, i) => (
            <article
              key={i}
              className={`rounded-2xl border p-2.5 sm:p-4 shadow-[0_4px_20px_rgba(15,23,42,.03)] flex items-center justify-between transition-all hover:shadow-md ${m.wrapBg}`}
            >
              <div>
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
                  {m.label}
                </h4>
                <p className={`text-base sm:text-2xl font-black tracking-tight ${m.textColor}`}>
                  {m.val}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[160px] hidden sm:block">
                  {m.sub}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.iconBg}`}>
                <Icon name={m.icon} size={16} className="sm:w-5 sm:h-5" />
              </div>
            </article>
          ))}
        </section>
      )}

      {/* 2. PANEL DANH SÁCH USER QUÁN & BỘ LỌC (GIỮ NGUYÊN HEADER & SIDEBAR) */}
      <Panel
        variant="default"
        padding="none"
        className={`transition-all duration-200 flex flex-col p-2.5 sm:p-5 lg:p-6 ${
          isMaximized
            ? "flex-1 min-h-0 h-full shadow-sm border border-slate-200"
            : "flex-1 min-h-[calc(100dvh-5.5rem)] sm:min-h-[calc(100vh-6rem)] lg:min-h-[480px] lg:h-[calc(100vh-230px)] sticky top-2 z-10 shadow-sm"
        }`}
      >
        {/* Header Toolbar */}
        <div className="shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="sm:hidden">User Quán</span>
              <span className="hidden sm:inline">Tài Khoản & User Quán</span>
            </h3>
            <span className="h-6 inline-flex items-center text-[10px] sm:text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-2 rounded-lg">
              {filteredUsers.length} <span className="hidden sm:inline">/ {users.length}</span> user
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Nút Thêm User Quán (Icon-only) */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              title="Thêm User quán mới"
              aria-label="Thêm User quán mới"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-brand-900 text-xs font-bold text-white shadow-xs transition hover:bg-brand-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="plus" size={14} className="text-white" />
            </button>

            {/* Nút Xuất CSV (Icon-only) */}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "a2order-danh-sach-user-quan.csv",
                  ["Họ tên", "Email", "Cửa hàng", "Vai trò", "Mã PIN", "Trạng thái", "Ngày tạo"],
                  filteredUsers.map((u) => [
                    u.name,
                    u.email || "",
                    u.storeName,
                    u.role,
                    u.pinCode || "",
                    u.isActive ? "Hoạt động" : "Đang khóa",
                    u.createdAt,
                  ])
                )
              }
              title="Xuất danh sách User quán ra CSV"
              aria-label="Xuất CSV"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="download" size={14} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Phóng to / Thu nhỏ */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className={`inline-flex h-8 sm:h-9 w-8 sm:w-auto items-center justify-center gap-1.5 rounded-xl border text-xs font-bold shadow-xs transition cursor-pointer px-0 sm:px-3 active:scale-95 ${
                isMaximized
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
              title={isMaximized ? "Thu nhỏ lại (Phím Esc)" : "Phóng to toàn khung làm việc"}
            >
              <Icon name={isMaximized ? "minimize" : "maximize"} size={14} className="shrink-0" />
              <span className="hidden sm:inline">{isMaximized ? "Thu nhỏ" : "Phóng to"}</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc (Select Dropdown có Search, Quán, Vai trò, Trạng thái) */}
        <div className="shrink-0 space-y-2 sm:space-y-3 mb-2.5 sm:mb-3 p-2 sm:p-3 bg-slate-50/75 rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2.5 items-center">
            {/* Search Input - 4 cols on lg */}
            <div className="relative col-span-2 sm:col-span-2 lg:col-span-4">
              <Icon name="search" className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm tên nhân viên, email, mã PIN, tên quán..."
                className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-7 sm:pr-8 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>

            {/* Filter Cửa Hàng - 3 cols on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-3">
              <SearchableSelect
                options={storeOptions}
                value={storeFilter}
                onChange={(val) => {
                  setStoreFilter(val);
                  setPage(1);
                }}
                placeholder="Cửa hàng..."
                searchPlaceholder="Tìm cửa hàng..."
                showSearch={true}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Filter Vai Trò - 2 cols on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={roleOptions}
                value={roleFilter}
                onChange={(val) => {
                  setRoleFilter(val);
                  setPage(1);
                }}
                placeholder="Vai trò..."
                showSearch={false}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Filter Trạng Thái - 2 cols on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
                placeholder="Trạng thái..."
                showSearch={false}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Nút Reset Filter - 1 col on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1">
              <button
                type="button"
                onClick={handleResetFilters}
                title="Đặt lại toàn bộ bộ lọc về mặc định"
                className={`w-full h-8 sm:h-10 px-2 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs cursor-pointer ${
                  hasActiveFilters
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon name="refresh" size={12} className={hasActiveFilters ? "text-emerald-700" : "text-slate-400"} />
                <span className="truncate">Đặt lại</span>
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Đang lọc:
              </span>
              {userSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                  <span>"{userSearch}"</span>
                  <button type="button" onClick={() => setUserSearch("")} className="hover:text-emerald-950 cursor-pointer">
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              {storeFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                  <span>{storeOptions.find((o) => o.value === storeFilter)?.label}</span>
                  <button type="button" onClick={() => setStoreFilter("ALL")} className="hover:text-blue-950 cursor-pointer">
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              {roleFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-[11px]">
                  <span>{roleOptions.find((o) => o.value === roleFilter)?.label}</span>
                  <button type="button" onClick={() => setRoleFilter("ALL")} className="hover:text-purple-950 cursor-pointer">
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              {statusFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                  <span>{statusOptions.find((o) => o.value === statusFilter)?.label}</span>
                  <button type="button" onClick={() => setStatusFilter("ALL")} className="hover:text-amber-950 cursor-pointer">
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-[11px] font-bold text-slate-500 hover:text-rose-600 transition flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-rose-50 cursor-pointer"
              >
                <Icon name="trash" size={12} />
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* Khối Bảng & Phân Trang (Cuộn nội bộ) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          {/* Vùng cuộn nội bộ cho Bảng / Thẻ */}
          <div
            onScroll={handleInnerScroll}
            className="flex-1 min-h-[280px] lg:min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin rounded-none sm:rounded-2xl border-0 sm:border border-slate-200/70 bg-transparent sm:bg-white shadow-none sm:shadow-2xs"
          >
            {/* Desktop Table View (>= lg) */}
            <StoreUserDesktopTable
              paginatedUsers={paginatedUsers}
              selectedUserIds={selectedUserIds}
              onToggleSelectUser={handleToggleSelectUser}
              onToggleSelectAll={handleToggleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              onEditUser={handleOpenEditModal}
              onResetCredentials={(u) => setResetCredentialsUser(u)}
              onToggleUserStatus={handleToggleUserStatus}
            />

            {/* Mobile / Tablet Cards View (< lg) với Cuộn Tải Thêm (Infinite Scroll) */}
            <div className="block lg:hidden">
              <StoreUserMobileCards
                paginatedUsers={mobileUsers}
                selectedUserIds={selectedUserIds}
                onToggleSelectUser={handleToggleSelectUser}
                onEditUser={handleOpenEditModal}
                onResetCredentials={(u) => setResetCredentialsUser(u)}
                onToggleUserStatus={handleToggleUserStatus}
              />
              <MobileInfiniteSentinel
                hasMore={hasMoreUsers}
                totalCount={filteredUsers.length}
                visibleCount={visibleUserCount}
                sentinelRef={userSentinelRef}
              />
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedUserIds.length > 0 && (
            <>
              {/* 1. Desktop: Nằm gọn gàng bên trong Panel */}
              <div className="hidden lg:flex shrink-0 mt-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-950 text-white flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold pl-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Đã chọn <strong className="text-emerald-300 font-black">{selectedUserIds.length}</strong> tài khoản
                  </span>
                  {selectedUserIds.length < filteredUsers.length && (
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(filteredUsers.map((u) => u.id))}
                      className="text-xs font-semibold text-emerald-300 hover:text-white underline underline-offset-2 ml-2 cursor-pointer transition"
                    >
                      Chọn tất cả {filteredUsers.length} tài khoản
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
                      downloadCsv(
                        `a2order-da-chon-${selectedUserIds.length}-user.csv`,
                        ["Họ tên", "Email", "Cửa hàng", "Vai trò", "Mã PIN", "Trạng thái", "Ngày tạo"],
                        selectedUsers.map((u) => [
                          u.name,
                          u.email || "",
                          u.storeName,
                          u.role,
                          u.pinCode || "",
                          u.isActive ? "Hoạt động" : "Đang khóa",
                          u.createdAt,
                        ])
                      );
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Icon name="download" size={12} />
                    <span>Xuất CSV ({selectedUserIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* 2. Mobile: Nổi đè lên che phủ trọn vẹn Bottom Navigation Bar */}
              <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pointer-events-none lg:hidden animate-slideUp">
                <div className="pointer-events-auto mx-auto flex h-[58px] w-full max-w-[330px] items-center justify-between rounded-full border border-emerald-400/30 bg-[#0e2720]/98 backdrop-blur-2xl p-1.5 px-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] ring-1 ring-black/20">
                  <div className="flex items-center gap-2 pl-1 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-[#0e2720] shadow-xs shrink-0">
                      {selectedUserIds.length}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-white leading-tight truncate">
                        Đã chọn {selectedUserIds.length} user
                      </span>
                      {selectedUserIds.length < filteredUsers.length ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds(filteredUsers.map((u) => u.id))}
                          className="text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 text-left leading-tight cursor-pointer active:underline"
                        >
                          Chọn hết ({filteredUsers.length})
                        </button>
                      ) : (
                        <span className="text-[9.5px] font-medium text-emerald-400/80 leading-tight">
                          Toàn bộ user
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pr-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
                        downloadCsv(
                          `a2order-da-chon-${selectedUserIds.length}-user.csv`,
                          ["Họ tên", "Email", "Cửa hàng", "Vai trò", "Mã PIN", "Trạng thái", "Ngày tạo"],
                          selectedUsers.map((u) => [
                            u.name,
                            u.email || "",
                            u.storeName,
                            u.role,
                            u.pinCode || "",
                            u.isActive ? "Hoạt động" : "Đang khóa",
                            u.createdAt,
                          ])
                        );
                      }}
                      className="inline-flex h-8 items-center gap-1 px-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      title="Xuất file CSV các user đã chọn"
                    >
                      <Icon name="download" size={12} />
                      <span>Xuất</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds([])}
                      className="inline-flex h-8 items-center px-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 hover:text-white text-xs font-semibold transition cursor-pointer"
                      title="Bỏ chọn tất cả"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Phân Trang Chuẩn Đồng Bộ - Ẩn trên Mobile (< lg) */}
          <div className="shrink-0 mt-3 pt-2 sm:pt-3 border-t border-slate-100 hidden lg:block">
            <Pagination
              currentPage={page}
              totalItems={filteredUsers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      </Panel>

      {/* Modal 1: Tạo / Sửa User Quán */}
      <StoreUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        editingUser={editingUser}
        stores={stores}
      />

      {/* Modal 2: Đổi Mật Khẩu & PIN Fast-Login */}
      <ResetUserCredentialsModal
        user={resetCredentialsUser}
        onClose={() => setResetCredentialsUser(null)}
        onReset={handleResetCredentials}
      />
    </div>
  );
};
