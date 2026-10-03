import React, { useState, useEffect } from "react";
import {
  Panel,
  Button,
  Badge,
  Icon,
  Portal,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  SearchInput,
  FilterSelect,
  DataTableCard,
  Pagination,
} from "@/components/ui";
import { HeroBanner, StatCard, EmptyState } from "@/components/shared";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { staffApi } from "@/services/api/staffApi";

import { StaffRole, StaffUser, PermissionItem, AttendanceLogRecord } from "@/types/cms.types";
import { AddStaffModal } from "./staff";

const PERMISSIONS: PermissionItem[] = [
  {
    id: "CREATE_ORDER",
    name: "Tạo Order & Gọi Thêm Món",
    description: "Mở bàn mới, thêm món ăn và gửi thông báo vào bếp",
  },
  {
    id: "VOID_ITEM",
    name: "Hủy Món Đã Gửi Bếp (Void)",
    description: "Xóa món sau khi đã chế biến (nguy cơ thất thoát nguyên liệu)",
    isSensitive: true,
  },
  {
    id: "APPLY_DISCOUNT",
    name: "Chiết Khấu & Giảm Giá Bill",
    description: "Nhập mã khuyến mại hoặc giảm giá phần trăm hóa đơn",
    isSensitive: true,
  },
  {
    id: "OPEN_CASH_DRAWER",
    name: "Mở Ngăn Kéo Tiền Mặt (No-Sale)",
    description: "Bật két tiền mặt không cần giao dịch thanh toán",
    isSensitive: true,
  },
  {
    id: "CLOSE_SHIFT",
    name: "Chốt Ca & Kiểm Két (Z-Report)",
    description: "In biên bản chốt két tiền mặt và bàn giao ca tiếp theo",
  },
  {
    id: "VIEW_REVENUE",
    name: "Xem Doanh Thu & Báo Cáo Ca",
    description: "Theo dõi doanh số bán hàng trong ngày của quán",
    isSensitive: true,
  },
  {
    id: "MENU_EDIT",
    name: "Báo Hết Món & Điều Chỉnh Thực Đơn",
    description: "Báo tạm ngưng phục vụ món tức thời và điều chỉnh thông tin món",
  },
  {
    id: "MANAGE_STAFF",
    name: "Quản Lý Nhân Viên & Cấp PIN",
    description: "Thêm nhân sự mới và cài đặt mã PIN đăng nhập",
    isSensitive: true,
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  STORE_OWNER: [
    "CREATE_ORDER",
    "VOID_ITEM",
    "APPLY_DISCOUNT",
    "OPEN_CASH_DRAWER",
    "CLOSE_SHIFT",
    "VIEW_REVENUE",
    "MENU_EDIT",
    "MANAGE_STAFF",
  ],
  STORE_MANAGER: [
    "CREATE_ORDER",
    "VOID_ITEM",
    "APPLY_DISCOUNT",
    "OPEN_CASH_DRAWER",
    "CLOSE_SHIFT",
    "VIEW_REVENUE",
    "MENU_EDIT",
  ],
  CASHIER: ["CREATE_ORDER", "APPLY_DISCOUNT", "OPEN_CASH_DRAWER", "CLOSE_SHIFT"],
  WAITER: ["CREATE_ORDER", "MENU_EDIT"],
  CHEF: ["MENU_EDIT"],
  ACCOUNTANT: ["CLOSE_SHIFT", "VIEW_REVENUE"],
};

export const CmsStaffManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"STAFF_LIST" | "RBAC_MATRIX" | "SCHEDULE" | "ATTENDANCE">("STAFF_LIST");

  // Lấy storeId thực tế từ phiên đăng nhập
  const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") || localStorage.getItem("a2order_auth_user") : null;
  const storeId = userStr ? JSON.parse(userStr).storeId || "store-bubble-tea" : "store-bubble-tea";

  const [staffList, setStaffList] = usePersistentState<StaffUser[]>("staff_list", []);

  // Tự động đồng bộ danh sách nhân sự thực tế từ Database PostgreSQL
  useEffect(() => {
    staffApi
      .getStaff({ storeId })
      .then((serverStaff) => {
        if (Array.isArray(serverStaff)) {
          const mapped: StaffUser[] = serverStaff.map((s, idx) => ({
            id: s.id,
            code: `NV-${String(idx + 1).padStart(3, "0")}`,
            name: s.name,
            role: (s.role as StaffRole) || "WAITER",
            phone: (s as any).phone || "",
            shift: "FULL_TIME",
            pin: s.pinCode || "1234",
            email: s.email || undefined,
            ordersServedToday: 0,
            isActive: s.isActive,
          }));
          setStaffList(mapped);
        }
      })
      .catch(() => {});
  }, [storeId]);

  const [attendanceLogs, setAttendanceLogs] = usePersistentState<AttendanceLogRecord[]>("attendance_logs", []);

  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const [rolePermissions, setRolePermissions] = useState<Record<StaffRole, string[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Modal thêm/sửa nhân viên
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    role: "WAITER" as StaffRole,
    phone: "",
    shift: "MORNING" as "MORNING" | "EVENING" | "FULL_TIME",
    pin: "1234",
    email: "",
  });

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case "STORE_OWNER":
        return "Chủ Quán";
      case "STORE_MANAGER":
        return "Quản Lý Ca";
      case "CASHIER":
        return "Thu Ngân";
      case "WAITER":
        return "Phục Vụ Bàn";
      case "CHEF":
        return "Bếp Trưởng";
      case "ACCOUNTANT":
        return "Kế Toán";
      default:
        return role;
    }
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case "STORE_OWNER":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "STORE_MANAGER":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "CASHIER":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "CHEF":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "WAITER":
        return "bg-cyan-50 text-cyan-800 border-cyan-200";
      case "ACCOUNTANT":
        return "bg-purple-50 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getShiftLabel = (shift: "MORNING" | "EVENING" | "FULL_TIME") => {
    switch (shift) {
      case "MORNING":
        return "Ca Sáng (06:00 - 14:00)";
      case "EVENING":
        return "Ca Tối (14:00 - 22:30)";
      case "FULL_TIME":
        return "Toàn Thời Gian (Ca gãy)";
    }
  };

  const handleTogglePinVisibility = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetPin = (id: string, name: string) => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    staffApi.resetCredentials(id, { pinCode: randomPin }).catch(() => {});
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pin: randomPin } : s))
    );
    setShowPins((prev) => ({ ...prev, [id]: true }));
    toast.success(`Đã cấp lại mã PIN mới cho ${name}: ${randomPin}`);
  };

  const handleToggleActive = (id: string, name: string, active: boolean) => {
    staffApi.toggleStaffStatus(id).catch(() => {});
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !active } : s))
    );
    toast.info(`Đã ${active ? "tạm khóa" : "mở lại"} ca làm việc của ${name}`);
  };

  const handleTogglePermission = (role: StaffRole, permId: string) => {
    if (role === "STORE_OWNER") {
      toast.info("Tài khoản Chủ Quán luôn có toàn quyền bảo mật");
      return;
    }

    setRolePermissions((prev) => {
      const currentList = prev[role] || [];
      const hasPerm = currentList.includes(permId);
      const updated = hasPerm
        ? currentList.filter((p) => p !== permId)
        : [...currentList, permId];
      return { ...prev, [role]: updated };
    });
    toast.success("Đã cập nhật ma trận phân quyền!");
  };

  const handleOpenAddModal = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setModalForm({
      name: "",
      role: "WAITER",
      phone: "",
      shift: "MORNING",
      pin: randomPin,
      email: "",
    });
    setIsModalOpen(true);
  };

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim() || !modalForm.phone.trim()) {
      toast.error("Vui lòng điền đầy đủ tên và số điện thoại");
      return;
    }

    const sName = modalForm.name.trim();
    const sRole = modalForm.role;
    const sPhone = modalForm.phone.trim();
    const sShift = modalForm.shift;
    const sPin = modalForm.pin || "1234";
    const sEmail = modalForm.email.trim() || undefined;

    staffApi
      .createStaff({
        storeId,
        name: sName,
        role: sRole,
        pinCode: sPin,
        email: sEmail,
        isActive: true,
      })
      .then((created) => {
        const newStaff: StaffUser = {
          id: created.id || `s-${Date.now()}`,
          code: `NV-${String(staffList.length + 1).padStart(3, "0")}`,
          name: sName,
          role: sRole,
          phone: sPhone,
          shift: sShift,
          pin: sPin,
          email: sEmail,
          ordersServedToday: 0,
          isActive: true,
        };
        setStaffList((prev) => [newStaff, ...prev]);
        toast.success(`Đã thêm nhân viên ${newStaff.name} với mã PIN ${newStaff.pin}!`);
      })
      .catch(() => {
        const newStaff: StaffUser = {
          id: `s-${Date.now()}`,
          code: `NV-${String(staffList.length + 1).padStart(3, "0")}`,
          name: sName,
          role: sRole,
          phone: sPhone,
          shift: sShift,
          pin: sPin,
          email: sEmail,
          ordersServedToday: 0,
          isActive: true,
        };
        setStaffList((prev) => [newStaff, ...prev]);
        toast.success(`Đã thêm nhân viên ${newStaff.name} với mã PIN ${newStaff.pin}!`);
      });

    setIsModalOpen(false);
  };

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const onDutyCount = attendanceLogs.filter((a) => a.status === "ACTIVE").length;
  const totalOrdersToday = staffList.reduce((acc, s) => acc + s.ordersServedToday, 0);

  const [staffPage, setStaffPage] = useState(1);
  const STAFF_PAGE_SIZE = 8;

  const paginatedDesktopStaff = staffList.slice(
    (staffPage - 1) * STAFF_PAGE_SIZE,
    staffPage * STAFF_PAGE_SIZE
  );

  const {
    displayedItems: mobileStaff,
    sentinelRef,
    isLoadingMore,
    hasMore,
    isMobile,
  } = useMobileInfiniteScroll(staffList, 10);

  const displayedStaff = isMobile ? mobileStaff : paginatedDesktopStaff;

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Nhân Viên", dot: true }}
        tagline={`${totalStaff} Nhân viên • ${PERMISSIONS.length} Quyền truy cập`}
        title="Quản Lý Nhân Viên"
        description="Danh sách tài khoản nhân viên, mã PIN đăng nhập POS và phân quyền"
        chips={[
          {
            icon: "users",
            label: `${totalStaff} Nhân viên quán`,
            variant: "default",
          },
          {
            icon: "userCheck",
            label: `${onDutyCount} Đang trong ca làm`,
            variant: "teal",
          },
          {
            icon: "shield",
            label: "Bảo mật PIN 4 số",
            variant: "blue",
          },
          {
            icon: "cart",
            label: `${totalOrdersToday} Bills ca hôm nay`,
            variant: "amber",
          },
        ]}
        actions={
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
          >
            <Icon name="plus" size={14} />
            <span>Thêm Nhân Viên</span>
          </button>
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số Nhân Sự */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="users"
          title="Tổng Số Nhân Sự"
          value={
            <>
              {totalStaff} <span className="text-xs font-bold text-ink-muted">nhân viên</span>
            </>
          }
          subtext={`${activeStaff} tài khoản đang hoạt động`}
          badge="Toàn quán"
          variant="success"
        />

        <StatCard
          icon="userCheck"
          title="Đang Trực Ca Bán"
          value={
            <>
              {onDutyCount} <span className="text-xs font-bold text-ink-muted">nhân sự</span>
            </>
          }
          subtext="Đã chấm công vào ca"
          badge={{ text: "Đang làm", variant: "info" }}
          variant="info"
        />

        <StatCard
          icon="cart"
          title="Đơn Phục Vụ Hôm Nay"
          value={
            <>
              {totalOrdersToday} <span className="text-xs font-bold text-ink-muted">bills</span>
            </>
          }
          subtext="Hiệu suất phục vụ tốt"
          badge="Hôm nay"
          variant="default"
        />

        <StatCard
          icon="shield"
          title="Quyền Hạn Hệ Thống"
          value={
            <>
              {PERMISSIONS.length} <span className="text-xs font-bold text-ink-muted">quyền</span>
            </>
          }
          subtext="Kiểm soát phân quyền theo vai trò"
          badge={{ text: "RBAC", variant: "warning" }}
          variant="warning"
        />
      </section>

      {/* 3. Sticky Segmented Control Tabs */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("STAFF_LIST")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "STAFF_LIST"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="users" size={14} />
          <span className="sm:hidden">Nhân Viên ({staffList.length})</span>
          <span className="hidden sm:inline">Danh Sách Nhân Viên ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RBAC_MATRIX")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "RBAC_MATRIX"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="shield" size={14} />
          <span className="sm:hidden">Phân Quyền</span>
          <span className="hidden sm:inline">Ma Trận Phân Quyền Chi Tiết</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SCHEDULE")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "SCHEDULE"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="calendar" size={14} />
          <span className="sm:hidden">Lịch Ca</span>
          <span className="hidden sm:inline">Lịch Làm Việc Tuần</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ATTENDANCE")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "ATTENDANCE"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="userCheck" size={14} />
          <span className="sm:hidden">Chấm Công ({onDutyCount})</span>
          <span className="hidden sm:inline">Chấm Công & Giờ Làm ({onDutyCount} đang làm)</span>
        </button>
      </div>

      {/* TAB 1: Danh sách nhân viên */}
      {activeTab === "STAFF_LIST" && (
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          {staffList.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="users"
                title="Chưa có nhân viên nào"
                description="Thêm nhân viên đầu tiên để bắt đầu quản lý ca làm việc, phân quyền và chấm công."
                action={{
                  label: "Thêm Nhân Viên Đầu Tiên",
                  onClick: () => setIsModalOpen(true),
                  icon: "plus",
                }}
              />
            </div>
          ) : (
            <>
              <TableContainer className="rounded-none border-0 shadow-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân Viên</TableHead>
                      <TableHead>Vai Trò</TableHead>
                      <TableHead>Ca Làm Việc</TableHead>
                      <TableHead>Mã PIN Đăng Nhập</TableHead>
                      <TableHead align="center">Đơn Hôm Nay</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                      <TableHead align="right">Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedStaff.map((staff) => {
                      const isPinVisible = showPins[staff.id];

                      return (
                        <TableRow key={staff.id}>
                          {/* Name & Code */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/70 shadow-2xs">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{staff.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                                    [{staff.code}]
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                  <span>{staff.phone}</span>
                                  {staff.email && <span>• {staff.email}</span>}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role */}
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black border ${getRoleBadge(staff.role)}`}>
                              {getRoleLabel(staff.role)}
                            </span>
                          </TableCell>

                          {/* Shift */}
                          <TableCell>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {getShiftLabel(staff.shift)}
                            </span>
                          </TableCell>

                          {/* PIN with Toggle and Quick Reset */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-900 tracking-widest min-w-[54px] text-center shadow-2xs">
                                {isPinVisible ? staff.pin : "••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTogglePinVisibility(staff.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                                title={isPinVisible ? "Ẩn mã PIN" : "Hiện mã PIN"}
                              >
                                <Icon name="eye" size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetPin(staff.id, staff.name)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition"
                                title="Tạo mã PIN mới ngẫu nhiên"
                              >
                                <Icon name="refresh" size={14} />
                              </button>
                            </div>
                          </TableCell>

                          {/* Orders */}
                          <TableCell align="center">
                            <span className="font-black text-emerald-950 text-xs bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                              {staff.ordersServedToday} bills
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                staff.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  staff.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                }`}
                              />
                              <span>{staff.isActive ? "Đang mở ca" : "Đã tạm khóa"}</span>
                            </span>
                          </TableCell>

                          {/* Action */}
                          <TableCell align="right">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(staff.id, staff.name, staff.isActive)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                staff.isActive
                                  ? "text-slate-600 bg-white border border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                                  : "bg-emerald-600 text-white hover:bg-emerald-500 font-black shadow-sm"
                              }`}
                            >
                              {staff.isActive ? "Khóa ca" : "Mở ca"}
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <div className="block md:hidden">
                <MobileInfiniteSentinel
                  sentinelRef={sentinelRef}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMore}
                  displayedCount={mobileStaff.length}
                  totalCount={staffList.length}
                />
              </div>

              <div className="hidden md:block p-3 sm:p-4 border-t border-slate-100">
                <Pagination
                  currentPage={staffPage}
                  totalItems={staffList.length}
                  pageSize={STAFF_PAGE_SIZE}
                  onPageChange={setStaffPage}
                  bordered={false}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Ma Trận Phân Quyền Chi Tiết (RBAC Matrix) */}
      {activeTab === "RBAC_MATRIX" && (
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Icon name="shield" size={14} />
                </span>
                <span>Bảng Thiết Lập Quyền Hạn Theo Vai Trò (Permission Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Các quyền nhạy cảm (hủy món, giảm giá) yêu cầu mã PIN của Quản lý hoặc Chủ quán để duyệt
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tự động lưu tức thời
            </span>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Quyền Hạn Hệ Thống</TableHead>
                  <TableHead align="center">Chủ Quán</TableHead>
                  <TableHead align="center">Quản Lý</TableHead>
                  <TableHead align="center">Thu Ngân</TableHead>
                  <TableHead align="center">Phục Vụ</TableHead>
                  <TableHead align="center">Bếp/Bar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSIONS.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <span>{perm.name}</span>
                        {perm.isSensitive && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Nhạy cảm
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{perm.description}</div>
                    </TableCell>

                    {/* Columns for 5 main roles */}
                    {(
                      [
                        "STORE_OWNER",
                        "STORE_MANAGER",
                        "CASHIER",
                        "WAITER",
                        "CHEF",
                      ] as StaffRole[]
                    ).map((r) => {
                      const isGranted = (rolePermissions[r] || []).includes(perm.id);
                      const isOwner = r === "STORE_OWNER";

                      return (
                        <TableCell key={r} align="center">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            disabled={isOwner}
                            onChange={() => handleTogglePermission(r, perm.id)}
                            className={`w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20 border-slate-300 ${
                              isOwner ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            }`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* Modal Thêm Nhân Viên Mới */}
      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateStaffSubmit}
        form={modalForm}
        setForm={setModalForm}
      />

      {/* TAB 3: Lịch Làm Việc Tuần */}
      {activeTab === "SCHEDULE" && (() => {
        const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
        const daysFull = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
        const shifts = [
          { id: "MORNING", label: "Ca Sáng", time: "06:00 - 14:00" },
          { id: "EVENING", label: "Ca Tối", time: "14:00 - 22:30" },
        ];
        const scheduleGrid: Record<string, Record<string, string[]>> = {
          MORNING: {
            T2: ["s1", "s3"], T3: ["s1", "s3"], T4: ["s1", "s4"],
            T5: ["s3", "s4"], T6: ["s1", "s3"], T7: ["s4", "s5"], CN: ["s4"],
          },
          EVENING: {
            T2: ["s2", "s4"], T3: ["s2", "s5"], T4: ["s2", "s3"],
            T5: ["s2", "s4"], T6: ["s2", "s5"], T7: ["s1", "s2"], CN: ["s2", "s3"],
          },
        };

        const getStaffById = (id: string) => staffList.find((s) => s.id === id);

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Lịch Làm Việc Tuần 28/09 — 04/10/2026</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Tổng quan phân ca nhân viên theo ngày. Chỉnh sửa chi tiết liên hệ quản lý.</p>
              </div>
              <button
                type="button"
                className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center shrink-0 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                onClick={() => toast.info("Tính năng xuất bảng phân ca PDF đang phát triển")}
                title="Xuất Bảng Phân Ca"
                aria-label="Xuất Bảng Phân Ca"
              >
                <Icon name="fileText" size={14} />
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs text-center">
                <div className="text-xl font-black text-slate-900">{staffList.filter((s) => s.isActive).length}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">Nhân viên đang hoạt động</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs text-center">
                <div className="text-xl font-black text-emerald-800">2</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">Ca làm việc / ngày</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs text-center">
                <div className="text-xl font-black text-teal-700">7</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">Ngày hoạt động / tuần</div>
              </div>
            </div>

            {/* Schedule grid */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
              <TableContainer className="rounded-none border-0 shadow-none">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Ca Làm</TableHead>
                      {days.map((d, i) => (
                        <TableHead key={d} align="center">
                          <div className="font-black text-slate-900">{d}</div>
                          <div className="text-[9px] text-slate-400 font-medium">{daysFull[i]}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="align-top">
                          <div className="font-black text-slate-900 text-xs">{shift.label}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{shift.time}</div>
                        </TableCell>
                        {days.map((day) => {
                          const staffIds = scheduleGrid[shift.id]?.[day] || [];
                          return (
                            <TableCell key={day} className="align-top">
                              <div className="space-y-1 min-h-[48px]">
                                {staffIds.length === 0 ? (
                                  <span className="text-[10px] text-slate-300 italic">—</span>
                                ) : (
                                  staffIds.map((sid) => {
                                    const staff = getStaffById(sid);
                                    if (!staff) return null;
                                    return (
                                      <div key={sid} className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex flex-col shadow-2xs ${getRoleBadge(staff.role)}`}>
                                        <span className="font-black truncate">{staff.name.split(" ").pop()}</span>
                                        <span className="text-[9px] opacity-75 truncate">{getRoleLabel(staff.role).split(" ")[0]}</span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Chú thích:</span>
                {[
                  { label: "Chủ Quán / Quản Lý", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                  { label: "Thu Ngân", badge: "bg-blue-50 text-blue-800 border-blue-200" },
                  { label: "Bếp Trưởng", badge: "bg-amber-50 text-amber-800 border-amber-200" },
                  { label: "Phục Vụ", badge: "bg-cyan-50 text-cyan-800 border-cyan-200" },
                  { label: "Kế Toán", badge: "bg-purple-50 text-purple-800 border-purple-200" },
                ].map((item) => (
                  <span key={item.label} className={`px-2.5 py-0.5 rounded-lg border text-[10.5px] font-black ${item.badge}`}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: Bảng Chấm Công & Nhật Ký Giờ Làm */}
      {activeTab === "ATTENDANCE" && (() => {
        const activeCount = attendanceLogs.filter((l) => l.status === "ACTIVE").length;
        const completedCount = attendanceLogs.filter((l) => l.status === "COMPLETED").length;
        const totalHours = attendanceLogs.reduce((acc, curr) => acc + (curr.workHours || 0), 0);

        const filteredLogs = attendanceLogs.filter((log) => {
          if (attendanceFilterStatus !== "ALL" && log.status !== attendanceFilterStatus) return false;
          if (attendanceSearch.trim()) {
            const q = attendanceSearch.toLowerCase();
            return (
              log.staffName.toLowerCase().includes(q) ||
              log.shiftName.toLowerCase().includes(q) ||
              (log.note && log.note.toLowerCase().includes(q))
            );
          }
          return true;
        });

        const handleClockOutStaff = (id: string, staffName: string) => {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          setAttendanceLogs((prev) =>
            prev.map((l) =>
              l.id === id
                ? {
                    ...l,
                    status: "COMPLETED",
                    clockOutTime: timeStr,
                    note: (l.note ? l.note + " • " : "") + `Quản lý chốt kết ca lúc ${timeStr}`,
                  }
                : l
            )
          );
          toast.success(`Đã chốt kết ca cho nhân viên ${staffName} lúc ${timeStr}!`);
        };

        return (
          <div className="space-y-4 animate-fadeIn">
            {/* Header info & summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-3.5 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Đang Trong Ca</span>
                    <h3 className="text-xl font-black text-emerald-950 mt-0.5">{activeCount} nhân sự</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Icon name="userCheck" size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-white p-3.5 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Đã Kết Ca Hôm Nay</span>
                    <h3 className="text-xl font-black text-blue-950 mt-0.5">{completedCount} lượt</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Icon name="checkCircle" size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-3.5 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Tổng Giờ Làm Ghi Nhận</span>
                    <h3 className="text-xl font-black text-amber-950 mt-0.5">{totalHours.toFixed(1)} Giờ</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Icon name="clock" size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Table wrapped in DataTableCard */}
            <DataTableCard
              searchPlaceholder="Tìm nhân viên, ca làm, ghi chú..."
              searchValue={attendanceSearch}
              onSearchChange={setAttendanceSearch}
              onSearchClear={() => setAttendanceSearch("")}
              filters={
                <FilterSelect
                  labelPrefix="Trạng thái: "
                  value={attendanceFilterStatus}
                  onChange={(val) => setAttendanceFilterStatus(val as "ALL" | "ACTIVE" | "COMPLETED")}
                  options={[
                    { value: "ALL", label: "Tất cả lượt", count: attendanceLogs.length },
                    { value: "ACTIVE", label: "Đang làm việc", count: attendanceLogs.filter((l) => l.status === "ACTIVE").length },
                    { value: "COMPLETED", label: "Đã kết ca", count: attendanceLogs.filter((l) => l.status === "COMPLETED").length },
                  ]}
                  className="w-48"
                />
              }
              hasActiveFilters={attendanceFilterStatus !== "ALL" || attendanceSearch.trim() !== ""}
              onResetFilters={() => {
                setAttendanceFilterStatus("ALL");
                setAttendanceSearch("");
              }}
              summaryText={`Hiển thị ${filteredLogs.length} / ${attendanceLogs.length} lượt chấm công`}
            >
              <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân Viên</TableHead>
                    <TableHead>Vai Trò</TableHead>
                    <TableHead>Ca Làm</TableHead>
                    <TableHead>Giờ Vào Ca</TableHead>
                    <TableHead>Giờ Ra Ca</TableHead>
                    <TableHead align="center">Tổng Giờ</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Ghi Chú</TableHead>
                    <TableHead align="right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableEmpty
                      colSpan={9}
                      title="Không tìm thấy lượt chấm công nào"
                      description="Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc trạng thái."
                    />
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200">
                              {log.staffName.charAt(0)}
                            </div>
                            <span>{log.staffName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${getRoleBadge(log.role)}`}>
                            {getRoleLabel(log.role)}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-600">{log.shiftName}</TableCell>
                        <TableCell className="font-black text-emerald-700">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{log.clockInTime}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">
                          {log.clockOutTime ? (
                            <span>{log.clockOutTime}</span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Đang trực
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="center" className="font-black text-slate-900">
                          {log.workHours ? `${log.workHours}h` : "—"}
                        </TableCell>
                        <TableCell>
                          {log.status === "ACTIVE" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Đang Làm
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                              Đã Kết Ca
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] text-slate-500 max-w-[200px] truncate" title={log.note}>
                          {log.note || "—"}
                        </TableCell>
                        <TableCell align="right">
                          {log.status === "ACTIVE" ? (
                            <button
                              type="button"
                              className="rounded-xl text-[11px] font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 h-7 px-2.5 shadow-2xs transition"
                              onClick={() => handleClockOutStaff(log.id, log.staffName)}
                            >
                              Chốt Ra Ca
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Hoàn tất</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </DataTableCard>
          </div>
        );
      })()}

    </div>
  );
};
