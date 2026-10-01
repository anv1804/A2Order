import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Portal } from "@/components/ui";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { toast, confirmDialog } from "@/stores/notificationStore";

import { StaffRole, StaffUser, PermissionItem, AttendanceLogRecord } from "@/types/cms.types";

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

  const [staffList, setStaffList] = useState<StaffUser[]>([
    {
      id: "s1",
      code: "NV-001",
      name: "Nguyễn Thành An",
      role: "STORE_OWNER",
      phone: "0912 345 678",
      shift: "FULL_TIME",
      pin: "1111",
      email: "an.owner@a2order.vn",
      ordersServedToday: 14,
      isActive: true,
    },
    {
      id: "s2",
      code: "NV-002",
      name: "Trần Mai Lan",
      role: "CASHIER",
      phone: "0988 234 567",
      shift: "MORNING",
      pin: "2222",
      ordersServedToday: 28,
      isActive: true,
    },
    {
      id: "s3",
      code: "NV-003",
      name: "Phạm Hùng Cường",
      role: "WAITER",
      phone: "0934 888 999",
      shift: "EVENING",
      pin: "3333",
      ordersServedToday: 19,
      isActive: true,
    },
    {
      id: "s4",
      code: "NV-004",
      name: "Bác Ba (Bếp trưởng)",
      role: "CHEF",
      phone: "0905 123 789",
      shift: "FULL_TIME",
      pin: "4444",
      ordersServedToday: 45,
      isActive: true,
    },
    {
      id: "s5",
      code: "NV-005",
      name: "Lê Thị Thu",
      role: "STORE_MANAGER",
      phone: "0977 654 321",
      shift: "FULL_TIME",
      pin: "6789",
      email: "thu.mgr@a2order.vn",
      ordersServedToday: 8,
      isActive: true,
    },
    {
      id: "s6",
      code: "NV-006",
      name: "Ngô Mỹ Linh",
      role: "ACCOUNTANT",
      phone: "0918 222 333",
      shift: "MORNING",
      pin: "5555",
      email: "linh.kt@a2order.vn",
      ordersServedToday: 0,
      isActive: false,
    },
  ]);

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLogRecord[]>([
    {
      id: "att-001",
      staffId: "s2",
      staffName: "Trần Mai Lan",
      role: "CASHIER",
      clockInTime: "06:28",
      shiftName: "Ca Sáng",
      date: "29/09/2026",
      status: "ACTIVE",
      workHours: 3.2,
      note: "Vào ca đúng giờ, kiểm két ban đầu 2.000.000đ",
    },
    {
      id: "att-002",
      staffId: "s4",
      staffName: "Bác Ba (Bếp trưởng)",
      role: "CHEF",
      clockInTime: "06:15",
      shiftName: "Ca Sáng",
      date: "29/09/2026",
      status: "ACTIVE",
      workHours: 3.4,
      note: "Chuẩn bị nước dùng phở bò buổi sáng",
    },
    {
      id: "att-003",
      staffId: "s3",
      staffName: "Phạm Hùng Cường",
      role: "WAITER",
      clockInTime: "06:45",
      shiftName: "Ca Sáng",
      date: "29/09/2026",
      status: "ACTIVE",
      workHours: 2.8,
      note: "Trực sảnh bàn T1 & VIP",
    },
    {
      id: "att-004",
      staffId: "s1",
      staffName: "Nguyễn Thành An",
      role: "STORE_OWNER",
      clockInTime: "08:00",
      shiftName: "Toàn Thời Gian",
      date: "29/09/2026",
      status: "ACTIVE",
      workHours: 1.5,
      note: "Giám sát vận hành & kiểm tra kho sáng",
    },
    {
      id: "att-005",
      staffId: "s5",
      staffName: "Lê Thị Thu",
      role: "STORE_MANAGER",
      clockInTime: "14:00",
      clockOutTime: "22:30",
      shiftName: "Ca Tối",
      date: "28/09/2026",
      status: "COMPLETED",
      workHours: 8.5,
      note: "Chốt két ca tối & bàn giao doanh thu Z-Report",
    },
  ]);

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
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pin: randomPin } : s))
    );
    setShowPins((prev) => ({ ...prev, [id]: true }));
    toast.success(`Đã cấp lại mã PIN mới cho ${name}: ${randomPin}`);
  };

  const handleToggleActive = (id: string, name: string, active: boolean) => {
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

    const newStaff: StaffUser = {
      id: `s-${Date.now()}`,
      code: `NV-${String(staffList.length + 1).padStart(3, "0")}`,
      name: modalForm.name.trim(),
      role: modalForm.role,
      phone: modalForm.phone.trim(),
      shift: modalForm.shift,
      pin: modalForm.pin || "1234",
      email: modalForm.email.trim() || undefined,
      ordersServedToday: 0,
      isActive: true,
    };

    setStaffList((prev) => [newStaff, ...prev]);
    setIsModalOpen(false);
    toast.success(`Đã thêm nhân viên ${newStaff.name} với mã PIN ${newStaff.pin}!`);
  };

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const onDutyCount = attendanceLogs.filter((a) => a.status === "ACTIVE").length;
  const totalOrdersToday = staffList.reduce((acc, s) => acc + s.ordersServedToday, 0);

  const {
    displayedItems: displayedStaff,
    sentinelRef,
    isLoadingMore,
    hasMore,
  } = useMobileInfiniteScroll(staffList, 10);

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Staff & Access Control
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {totalStaff} Nhân sự • {PERMISSIONS.length} Quyền bảo mật
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              Quản Trị Nhân Sự & Phân Quyền Vận Hành
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              Phân quyền tài khoản theo 6 vai trò chuẩn F&B, cấp mã PIN đăng nhập POS và kiểm soát chấm công ca.
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="users" size={12} className="text-emerald-300" />
                <span>{totalStaff} Nhân viên quán</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="userCheck" size={12} className="text-teal-300" />
                <span>{onDutyCount} Đang trong ca làm</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="shield" size={12} className="text-blue-300" />
                <span>Bảo mật PIN 4 số</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="cart" size={12} className="text-amber-300" />
                <span>{totalOrdersToday} Bills ca hôm nay</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 sm:px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-emerald-300 active:scale-95 shrink-0"
            >
              <Icon name="plus" size={14} />
              <span>Thêm Nhân Viên</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4 Thẻ Bento Chỉ Số Nhân Sự */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="users" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              Toàn quán
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Tổng Số Nhân Sự
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {totalStaff} <span className="text-xs font-bold text-slate-400">nhân viên</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              {activeStaff} tài khoản đang hoạt động
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Icon name="userCheck" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
              Đang làm
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Đang Trực Ca Bán
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {onDutyCount} <span className="text-xs font-bold text-slate-400">nhân sự</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-600 mt-1 truncate">
              Đã chấm công vào ca
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon name="cart" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              Hôm nay
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Đơn Phục Vụ Hôm Nay
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {totalOrdersToday} <span className="text-xs font-bold text-slate-400">bills</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              Hiệu suất phục vụ tốt
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Icon name="shield" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
              RBAC
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Quyền Hạn Hệ Thống
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {PERMISSIONS.length} <span className="text-xs font-bold text-slate-400">quyền</span>
            </p>
            <p className="text-[10px] font-semibold text-amber-600 mt-1 truncate">
              Kiểm soát phân quyền theo vai trò
            </p>
          </div>
        </article>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-4">Nhân Viên</th>
                  <th className="py-3 px-3">Vai Trò</th>
                  <th className="py-3 px-3">Ca Làm Việc</th>
                  <th className="py-3 px-3">Mã PIN Đăng Nhập</th>
                  <th className="py-3 px-3 text-center">Đơn Hôm Nay</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedStaff.map((staff) => {
                  const isPinVisible = showPins[staff.id];

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
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
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black border ${getRoleBadge(staff.role)}`}>
                          {getRoleLabel(staff.role)}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {getShiftLabel(staff.shift)}
                        </span>
                      </td>

                      {/* PIN with Toggle and Quick Reset */}
                      <td className="py-3.5 px-3">
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
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-black text-emerald-950 text-xs bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                          {staff.ordersServedToday} bills
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
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
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <MobileInfiniteSentinel
            sentinelRef={sentinelRef}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            displayedCount={displayedStaff.length}
            totalCount={staffList.length}
          />
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-3 px-3 w-1/3">Quyền Hạn Hệ Thống</th>
                  <th className="py-3 px-3 text-center">Chủ Quán</th>
                  <th className="py-3 px-3 text-center">Quản Lý</th>
                  <th className="py-3 px-3 text-center">Thu Ngân</th>
                  <th className="py-3 px-3 text-center">Phục Vụ</th>
                  <th className="py-3 px-3 text-center">Bếp/Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <span>{perm.name}</span>
                        {perm.isSensitive && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Nhạy cảm
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{perm.description}</div>
                    </td>

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
                        <td key={r} className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            disabled={isOwner}
                            onChange={() => handleTogglePermission(r, perm.id)}
                            className={`w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20 border-slate-300 ${
                              isOwner ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm Nhân Viên Mới */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-200/80 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                    <Icon name="users" size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Thêm Nhân Sự Mới</h3>
                    <p className="text-xs text-slate-500 font-medium">Cấp mã PIN đăng nhập POS và phân ca</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateStaffSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ Và Tên Nhân Viên *
                  </label>
                  <input
                    type="text"
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    required
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vai Trò (Role)
                    </label>
                    <select
                      value={modalForm.role}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, role: e.target.value as StaffRole })
                      }
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    >
                      <option value="WAITER">Phục Vụ Bàn</option>
                      <option value="CASHIER">Thu Ngân</option>
                      <option value="CHEF">Bếp / Bar</option>
                      <option value="STORE_MANAGER">Quản Lý Ca</option>
                      <option value="ACCOUNTANT">Kế Toán</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ca Làm Việc
                    </label>
                    <select
                      value={modalForm.shift}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          shift: e.target.value as "MORNING" | "EVENING" | "FULL_TIME",
                        })
                      }
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    >
                      <option value="MORNING">Ca Sáng (06h - 14h)</option>
                      <option value="EVENING">Ca Tối (14h - 22h30)</option>
                      <option value="FULL_TIME">Toàn Thời Gian</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Điện Thoại *
                    </label>
                    <input
                      type="tel"
                      value={modalForm.phone}
                      onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                      placeholder="09xx xxx xxx"
                      required
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã PIN 4 Số Vào Ca
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={modalForm.pin}
                      onChange={(e) => setModalForm({ ...modalForm, pin: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-black tracking-widest text-center text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    placeholder="nhanvien@a2order.vn"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black shadow-sm active:scale-95 transition"
                  >
                    Lưu Nhân Viên
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

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
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-3 pr-4 text-[10px] text-slate-400 uppercase tracking-wider font-black w-32">Ca Làm</th>
                      {days.map((d, i) => (
                        <th key={d} className="pb-3 px-2 text-center text-[10px] text-slate-400 uppercase tracking-wider font-black">
                          <div className="font-black text-slate-900">{d}</div>
                          <div className="text-[9px] text-slate-400 font-medium">{daysFull[i]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shifts.map((shift) => (
                      <tr key={shift.id}>
                        <td className="py-3 pr-4 align-top">
                          <div className="font-black text-slate-900 text-xs">{shift.label}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{shift.time}</div>
                        </td>
                        {days.map((day) => {
                          const staffIds = scheduleGrid[shift.id]?.[day] || [];
                          return (
                            <td key={day} className="py-3 px-2 align-top">
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
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Icon name="search" size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên, ca làm, ghi chú..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(["ALL", "ACTIVE", "COMPLETED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAttendanceFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-2xs ${
                      attendanceFilterStatus === st
                        ? "bg-slate-950 text-white font-black"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {st === "ALL" && "Tất Cả Lượt"}
                    {st === "ACTIVE" && "Đang Làm Việc"}
                    {st === "COMPLETED" && "Đã Kết Ca"}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                      <th className="py-3 px-4">Nhân Viên</th>
                      <th className="py-3 px-3">Vai Trò</th>
                      <th className="py-3 px-3">Ca Làm</th>
                      <th className="py-3 px-3">Giờ Vào Ca</th>
                      <th className="py-3 px-3">Giờ Ra Ca</th>
                      <th className="py-3 px-3 text-center">Tổng Giờ</th>
                      <th className="py-3 px-3">Trạng Thái</th>
                      <th className="py-3 px-3">Ghi Chú</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                          Không tìm thấy lượt chấm công nào phù hợp bộ lọc
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200">
                                {log.staffName.charAt(0)}
                              </div>
                              <span>{log.staffName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${getRoleBadge(log.role)}`}>
                              {getRoleLabel(log.role)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-600">{log.shiftName}</td>
                          <td className="py-3.5 px-3 font-black text-emerald-700">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{log.clockInTime}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-700">
                            {log.clockOutTime ? (
                              <span>{log.clockOutTime}</span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Đang trực
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-black text-slate-900">
                            {log.workHours ? `${log.workHours}h` : "—"}
                          </td>
                          <td className="py-3.5 px-3">
                            {log.status === "ACTIVE" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Đang Làm
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                                Đã Kết Ca
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={log.note}>
                            {log.note || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
