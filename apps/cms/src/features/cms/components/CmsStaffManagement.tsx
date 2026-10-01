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

  const {
    displayedItems: displayedStaff,
    sentinelRef,
    isLoadingMore,
    hasMore,
  } = useMobileInfiniteScroll(staffList, 10);

  return (
    <div className="space-y-6 animate-fadeIn pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Quản Trị Nhân Sự & Phân Quyền
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Bảo Mật Két & Ca Làm
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Phân bổ ca làm việc, mã PIN đăng nhập POS/KDS và phân quyền hạn
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-brand-950 text-white hover:bg-black font-bold shadow-sm transition-all shrink-0"
            onClick={handleOpenAddModal}
            title="Thêm Nhân Viên Mới"
            aria-label="Thêm Nhân Viên Mới"
          >
            <Icon name="plus" className="w-4 h-4 text-brand-400" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-surface-border pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("STAFF_LIST")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "STAFF_LIST"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="users" className="w-4 h-4" />
          <span className="sm:hidden">Nhân Viên ({staffList.length})</span>
          <span className="hidden sm:inline">Danh Sách Nhân Viên ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RBAC_MATRIX")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "RBAC_MATRIX"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="shield" className="w-4 h-4" />
          <span className="sm:hidden">Phân Quyền</span>
          <span className="hidden sm:inline">Ma Trận Phân Quyền Chi Tiết</span>
        </button>

        <button
          onClick={() => setActiveTab("SCHEDULE")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "SCHEDULE"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="calendar" className="w-4 h-4" />
          <span className="sm:hidden">Lịch Ca</span>
          <span className="hidden sm:inline">Lịch Làm Việc Tuần</span>
        </button>

        <button
          onClick={() => setActiveTab("ATTENDANCE")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "ATTENDANCE"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="userCheck" className="w-4 h-4" />
          <span className="sm:hidden">Chấm Công ({attendanceLogs.filter(a => a.status === 'ACTIVE').length})</span>
          <span className="hidden sm:inline">Chấm Công & Giờ Làm ({attendanceLogs.filter(a => a.status === 'ACTIVE').length} đang làm)</span>
        </button>
      </div>

      {/* TAB 1: Danh sách nhân viên */}
      {activeTab === "STAFF_LIST" && (
        <Panel variant="default" padding="lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                  <th className="pb-3 px-3">Nhân Viên</th>
                  <th className="pb-3 px-3">Vai Trò</th>
                  <th className="pb-3 px-3">Ca Làm Việc</th>
                  <th className="pb-3 px-3">Mã PIN Đăng Nhập</th>
                  <th className="pb-3 px-3 text-center">Đơn Hôm Nay</th>
                  <th className="pb-3 px-3">Trạng Thái</th>
                  <th className="pb-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-medium">
                {displayedStaff.map((staff) => {
                  const isPinVisible = showPins[staff.id];

                  return (
                    <tr key={staff.id} className="hover:bg-surface-canvas transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 font-black text-xs flex items-center justify-center shrink-0">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-ink-primary text-xs flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              <span className="font-mono text-[10px] text-ink-subtle">
                                [{staff.code}]
                              </span>
                            </div>
                            <div className="text-[10px] text-ink-muted flex items-center gap-2">
                              <span>{staff.phone}</span>
                              {staff.email && <span>• {staff.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-900 border border-brand-200">
                          {getRoleLabel(staff.role)}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-ink-secondary">
                          {getShiftLabel(staff.shift)}
                        </span>
                      </td>

                      {/* PIN with Toggle and Quick Reset */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs bg-surface-muted px-2.5 py-1 rounded-lg text-ink-primary tracking-widest min-w-[54px] text-center">
                            {isPinVisible ? staff.pin : "••••"}
                          </span>
                          <button
                            onClick={() => handleTogglePinVisibility(staff.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
                            title={isPinVisible ? "Ẩn mã PIN" : "Hiện mã PIN"}
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResetPin(staff.id, staff.name)}
                            className="w-6 h-6 rounded flex items-center justify-center text-ink-subtle hover:text-brand-900 hover:bg-surface-muted"
                            title="Tạo mã PIN mới ngẫu nhiên"
                          >
                            <Icon name="refresh" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-brand-900 text-xs bg-brand-50 px-2 py-0.5 rounded-full">
                          {staff.ordersServedToday} bills
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-bold flex items-center gap-1.5 ${
                            staff.isActive ? "text-emerald-700" : "text-ink-subtle"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              staff.isActive ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <span>{staff.isActive ? "Đang mở ca" : "Đã tạm khóa"}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleActive(staff.id, staff.name, staff.isActive)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            staff.isActive
                              ? "text-ink-muted hover:text-rose-600 hover:bg-rose-50"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
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
        </Panel>
      )}

      {/* TAB 2: Ma Trận Phân Quyền Chi Tiết (RBAC Matrix) */}
      {activeTab === "RBAC_MATRIX" && (
        <Panel variant="default" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="font-black text-sm text-ink-primary flex items-center gap-2">
                <Icon name="shield" className="w-4 h-4 text-brand-900" />
                <span>Bảng Thiết Lập Quyền Hạn Theo Vai Trò (Permission Matrix)</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Các quyền nhạy cảm (hủy món, giảm giá) yêu cầu mã PIN của Quản lý hoặc Chủ quán để duyệt
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Tự động lưu tức thời
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted text-[10px] uppercase font-extrabold">
                  <th className="pb-3 px-3 w-1/3">Quyền Hạn Hệ Thống</th>
                  <th className="pb-3 px-3 text-center">Chủ Quán</th>
                  <th className="pb-3 px-3 text-center">Quản Lý</th>
                  <th className="pb-3 px-3 text-center">Thu Ngân</th>
                  <th className="pb-3 px-3 text-center">Phục Vụ</th>
                  <th className="pb-3 px-3 text-center">Bếp/Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="hover:bg-surface-canvas transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-ink-primary flex items-center gap-1.5">
                        <span>{perm.name}</span>
                        {perm.isSensitive && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            Nhạy cảm
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-ink-muted mt-0.5">{perm.description}</div>
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
                        <td key={r} className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            disabled={isOwner}
                            onChange={() => handleTogglePermission(r, perm.id)}
                            className={`w-4 h-4 rounded text-brand-900 focus:ring-brand-800 ${
                              isOwner ? "cursor-not-allowed opacity-70" : "cursor-pointer"
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
        </Panel>
      )}

      {/* Modal Thêm Nhân Viên Mới */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="users" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Thêm Nhân Sự Mới</h3>
                  <p className="text-xs text-ink-muted">Cấp mã PIN đăng nhập POS và phân ca</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Họ Và Tên Nhân Viên *
                </label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Vai Trò (Role)
                  </label>
                  <select
                    value={modalForm.role}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, role: e.target.value as StaffRole })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value="WAITER">Phục Vụ Bàn</option>
                    <option value="CASHIER">Thu Ngân</option>
                    <option value="CHEF">Bếp / Bar</option>
                    <option value="STORE_MANAGER">Quản Lý Ca</option>
                    <option value="ACCOUNTANT">Kế Toán</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
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
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value="MORNING">Ca Sáng (06h - 14h)</option>
                    <option value="EVENING">Ca Tối (14h - 22h30)</option>
                    <option value="FULL_TIME">Toàn Thời Gian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Số Điện Thoại *
                  </label>
                  <input
                    type="tel"
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Mã PIN 4 Số Vào Ca
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={modalForm.pin}
                    onChange={(e) => setModalForm({ ...modalForm, pin: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-mono font-bold tracking-widest text-center focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Email (Tùy chọn)
                </label>
                <input
                  type="email"
                  value={modalForm.email}
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  placeholder="nhanvien@a2order.vn"
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-5"
                >
                  Lưu Nhân Viên
                </Button>
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
        // Mock schedule grid: staffId mapped per day+shift
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
        const getRoleColor = (role: StaffRole) => {
          if (role === "STORE_OWNER" || role === "STORE_MANAGER") return "bg-brand-100 text-brand-900 border-brand-200";
          if (role === "CASHIER") return "bg-blue-100 text-blue-800 border-blue-200";
          if (role === "CHEF") return "bg-orange-100 text-orange-800 border-orange-200";
          if (role === "ACCOUNTANT") return "bg-purple-100 text-purple-800 border-purple-200";
          return "bg-surface-muted text-ink-muted border-surface-border";
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-ink-primary">Lịch Làm Việc Tuần 28/09 — 04/10/2026</h3>
                <p className="text-xs text-ink-muted mt-0.5">Tổng quan phân ca nhân viên theo ngày. Chỉnh sửa chi tiết liên hệ quản lý.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center shrink-0"
                onClick={() => toast.info("Tính năng xuất bảng phân ca PDF đang phát triển")}
                title="Xuất Bảng Phân Ca"
                aria-label="Xuất Bảng Phân Ca"
              >
                <Icon name="fileText" className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <Panel variant="default" padding="sm" className="text-center">
                <div className="text-xl font-black text-ink-primary">{staffList.filter((s) => s.isActive).length}</div>
                <div className="text-[10px] text-ink-muted font-bold mt-0.5">Nhân viên đang hoạt động</div>
              </Panel>
              <Panel variant="default" padding="sm" className="text-center">
                <div className="text-xl font-black text-brand-900">2</div>
                <div className="text-[10px] text-ink-muted font-bold mt-0.5">Ca làm việc / ngày</div>
              </Panel>
              <Panel variant="default" padding="sm" className="text-center">
                <div className="text-xl font-black text-emerald-700">7</div>
                <div className="text-[10px] text-ink-muted font-bold mt-0.5">Ngày hoạt động / tuần</div>
              </Panel>
            </div>

            {/* Schedule grid */}
            <Panel variant="default" padding="lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="text-left pb-3 pr-4 text-[10px] text-ink-muted uppercase tracking-wider font-extrabold w-32">Ca Làm</th>
                      {days.map((d, i) => (
                        <th key={d} className="pb-3 px-2 text-center text-[10px] text-ink-muted uppercase tracking-wider font-extrabold">
                          <div className="font-black text-ink-primary">{d}</div>
                          <div className="text-[9px] text-ink-subtle">{daysFull[i]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="border-t border-surface-border">
                        <td className="py-3 pr-4 align-top">
                          <div className="font-black text-ink-primary text-xs">{shift.label}</div>
                          <div className="text-[10px] text-ink-muted">{shift.time}</div>
                        </td>
                        {days.map((day) => {
                          const staffIds = scheduleGrid[shift.id]?.[day] || [];
                          return (
                            <td key={day} className="py-3 px-2 align-top">
                              <div className="space-y-1 min-h-[48px]">
                                {staffIds.length === 0 ? (
                                  <span className="text-[10px] text-ink-subtle italic">—</span>
                                ) : (
                                  staffIds.map((sid) => {
                                    const staff = getStaffById(sid);
                                    if (!staff) return null;
                                    return (
                                      <div key={sid} className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-bold flex flex-col ${getRoleColor(staff.role)}`}>
                                        <span className="font-black">{staff.name.split(" ").pop()}</span>
                                        <span className="text-[9px] opacity-75">{getRoleLabel(staff.role).split(" ")[0]}</span>
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
              <div className="mt-4 pt-3 border-t border-surface-border flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-ink-muted mr-2">Chú thích:</span>
                {[
                  { label: "Chủ Quán / Quản Lý", color: "bg-brand-100 text-brand-900 border-brand-200" },
                  { label: "Thu Ngân", color: "bg-blue-100 text-blue-800 border-blue-200" },
                  { label: "Bếp Trưởng", color: "bg-orange-100 text-orange-800 border-orange-200" },
                  { label: "Phục Vụ", color: "bg-surface-muted text-ink-muted border-surface-border" },
                ].map((item) => (
                  <span key={item.label} className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${item.color}`}>{item.label}</span>
                ))}
              </div>
            </Panel>
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
              <Panel variant="default" padding="sm" className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Đang Trong Ca</span>
                    <h3 className="text-xl font-black text-emerald-950 mt-0.5">{activeCount} nhân sự</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Icon name="userCheck" className="w-5 h-5" />
                  </div>
                </div>
              </Panel>

              <Panel variant="default" padding="sm" className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Đã Kết Ca Hôm Nay</span>
                    <h3 className="text-xl font-black text-blue-950 mt-0.5">{completedCount} lượt</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                    <Icon name="checkCircle" className="w-5 h-5" />
                  </div>
                </div>
              </Panel>

              <Panel variant="default" padding="sm" className="bg-gradient-to-br from-brand-50 to-white border-brand-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider">Tổng Giờ Làm Ghi Nhận</span>
                    <h3 className="text-xl font-black text-brand-950 mt-0.5">{totalHours.toFixed(1)} Giờ</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-brand-900 text-white flex items-center justify-center shadow-sm">
                    <Icon name="clock" className="w-5 h-5" />
                  </div>
                </div>
              </Panel>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Icon name="search" className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên, ca làm, ghi chú..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-surface-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(["ALL", "ACTIVE", "COMPLETED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setAttendanceFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      attendanceFilterStatus === st
                        ? "bg-brand-900 text-white shadow-sm"
                        : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
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
            <Panel variant="default" padding="lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                      <th className="pb-3 px-3">Nhân Viên</th>
                      <th className="pb-3 px-3">Vai Trò</th>
                      <th className="pb-3 px-3">Ca Làm</th>
                      <th className="pb-3 px-3">Giờ Vào Ca</th>
                      <th className="pb-3 px-3">Giờ Ra Ca</th>
                      <th className="pb-3 px-3 text-center">Tổng Giờ</th>
                      <th className="pb-3 px-3">Trạng Thái</th>
                      <th className="pb-3 px-3">Ghi Chú</th>
                      <th className="pb-3 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-ink-muted">
                          Không tìm thấy lượt chấm công nào phù hợp bộ lọc
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-surface-canvas/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-ink-primary">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-900 flex items-center justify-center font-black text-xs shrink-0">
                                {log.staffName.charAt(0)}
                              </div>
                              <span>{log.staffName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-bold text-ink-secondary">
                              {getRoleLabel(log.role)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-ink-muted">{log.shiftName}</td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{log.clockInTime}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-ink-muted">
                            {log.clockOutTime ? (
                              <span>{log.clockOutTime}</span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Đang trực
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-brand-900">
                            {log.workHours ? `${log.workHours}h` : "—"}
                          </td>
                          <td className="py-3 px-3">
                            {log.status === "ACTIVE" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đang Làm
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-muted text-ink-muted border border-surface-border">
                                Đã Kết Ca
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-ink-muted max-w-[200px] truncate" title={log.note}>
                            {log.note || "—"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {log.status === "ACTIVE" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50 h-7 px-2.5"
                                onClick={() => handleClockOutStaff(log.id, log.staffName)}
                              >
                                Chốt Ra Ca
                              </Button>
                            ) : (
                              <span className="text-[11px] text-ink-subtle italic">Hoàn tất</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        );
      })()}

    </div>
  );
};
