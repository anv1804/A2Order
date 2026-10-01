import React, { useState } from "react";
import { Button, Icon, Pagination, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { Reservation } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

const AVAILABLE_TABLES = [
  "Bàn 01 (Tầng 1 - 4 người)",
  "Bàn 02 (Tầng 1 - 4 người)",
  "Bàn 03 (Tầng 1 - 6 người)",
  "Bàn 04 (Phòng VIP 1 - 8 người)",
  "Bàn 08 (Ban công tầng 2 - 6 người)",
  "Bàn 12 (Sân vườn - 12 người)",
];

export const CmsReservationsManagement: React.FC = () => {
  const [reservations, setReservations] = usePersistentState<Reservation[]>("reservations_data", [
    {
      id: "r1",
      guestName: "Anh Hoàng Tuấn",
      phone: "0903 111 222",
      guestCount: 6,
      reservationTime: "19:00 - Tối nay",
      dateCategory: "TODAY",
      tableAssigned: "Bàn 04 (Phòng VIP 1)",
      occasion: "BUSINESS",
      depositAmount: 500000,
      depositStatus: "PAID",
      notes: "Cần không gian yên tĩnh ký hợp đồng, chuẩn bị trước 1 lẩu đuôi bò hầm vang",
      source: "LANDING_PAGE",
      status: "CONFIRMED",
      createdAt: "10:30 Hôm nay",
    },
    {
      id: "r2",
      guestName: "Chị Thảo Mai",
      phone: "0982 333 444",
      guestCount: 4,
      reservationTime: "12:15 - Trưa nay",
      dateCategory: "TODAY",
      tableAssigned: "Bàn 08 (Ban công tầng 2)",
      occasion: "BIRTHDAY",
      depositAmount: 200000,
      depositStatus: "PAID",
      notes: "Sinh nhật bạn, chuẩn bị đĩa hoa quả có nến thắp sẵn",
      source: "LANDING_PAGE",
      status: "ARRIVED",
      createdAt: "09:00 Hôm nay",
    },
    {
      id: "r3",
      guestName: "Bác Hùng - BQL",
      phone: "0915 777 888",
      guestCount: 10,
      reservationTime: "18:30 - Ngày mai",
      dateCategory: "TOMORROW",
      tableAssigned: "Chưa gán bàn",
      occasion: "FAMILY",
      depositAmount: 0,
      depositStatus: "UNPAID",
      notes: "Liên hoan gia đình 3 thế hệ có 2 ghế trẻ em",
      source: "PHONE_CALL",
      status: "PENDING",
      createdAt: "11:15 Hôm nay",
    },
    {
      id: "r4",
      guestName: "Cô Hương Lan",
      phone: "0977 456 789",
      guestCount: 2,
      reservationTime: "20:00 - Tối nay",
      dateCategory: "TODAY",
      tableAssigned: "Chưa gán bàn",
      occasion: "ANNIVERSARY",
      depositAmount: 0,
      depositStatus: "UNPAID",
      notes: "Kỷ niệm ngày cưới, hoa hồng trang trí bàn",
      source: "LANDING_PAGE",
      status: "PENDING",
      createdAt: "14:20 Hôm nay",
    },
  ]);

  // Bộ lọc & Phân trang
  const [filterDate, setFilterDate] = usePersistentState<"ALL" | "TODAY" | "TOMORROW" | "THIS_WEEK">("reservations_filter_date", "ALL");
  const [filterStatus, setFilterStatus] = usePersistentState<string>("reservations_filter_status", "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reservationPage, setReservationPage] = useState(1);
  const PAGE_SIZE = 6;

  // Modal xếp bàn an toàn
  const [tableAssignTarget, setTableAssignTarget] = useState<Reservation | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Modal tạo mới đặt bàn (Walk-in / Hotline)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    guestCount: 4,
    reservationTime: "19:00 - Tối nay",
    dateCategory: "TODAY" as "TODAY" | "TOMORROW" | "THIS_WEEK",
    tableAssigned: AVAILABLE_TABLES[0],
    occasion: "GENERAL" as "BIRTHDAY" | "BUSINESS" | "ANNIVERSARY" | "FAMILY" | "GENERAL",
    depositAmount: 0,
    depositStatus: "UNPAID" as "UNPAID" | "PAID",
    notes: "",
    source: "PHONE_CALL" as "LANDING_PAGE" | "PHONE_CALL" | "WALK_IN",
  });

  const openModal = (source: "PHONE_CALL" | "WALK_IN") => {
    setFormData((prev) => ({ ...prev, source }));
    setIsModalOpen(true);
  };

  // Xử lý xác nhận & gán bàn an toàn
  const handleConfirmReservation = async (res: Reservation) => {
    const ok = await confirmDialog({
      title: "Xác Nhận Giữ Chỗ?",
      message: `Xác nhận giữ bàn cho khách ${res.guestName} (${res.guestCount} người) vào lúc ${res.reservationTime}?`,
      confirmText: "Xác Nhận Giữ Bàn",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) =>
        r.id === res.id
          ? {
              ...r,
              status: "CONFIRMED",
              tableAssigned:
                r.tableAssigned === "Chưa gán bàn" ? AVAILABLE_TABLES[0] : r.tableAssigned,
            }
          : r
      )
    );
    toast.success(`Đã xác nhận và giữ bàn cho khách ${res.guestName}!`);
  };

  // Khách đã đến quán an toàn
  const handleCustomerArrived = async (res: Reservation) => {
    const ok = await confirmDialog({
      title: "Xác Nhận Khách Đã Đến?",
      message: `Khách ${res.guestName} (${res.guestCount} khách) đã đến quán. Bạn muốn kích hoạt đón tiếp tại ${res.tableAssigned}?`,
      confirmText: "Đón Tiếp Khách",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, status: "ARRIVED" } : r))
    );
    toast.success(`Khách ${res.guestName} đã đến! Đã chuyển trạng thái bàn ${res.tableAssigned}`);
  };

  // Báo vắng mặt / Bùng bàn an toàn
  const handleNoShow = async (res: Reservation) => {
    const ok = await confirmDialog({
      title: "Xác Nhận Khách Vắng Mặt?",
      message: `Khách ${res.guestName} quá giờ hẹn. Giải phóng bàn ${res.tableAssigned} để tiếp đón khách vãng lai?`,
      confirmText: "Giải Phóng Bàn",
      cancelText: "Giữ Chỗ Thêm",
      variant: "danger",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, status: "NO_SHOW" } : r))
    );
    toast.info(`Đã đánh dấu vắng mặt cho ${res.guestName} và mở lại bàn đón khách khác.`);
  };

  // Từ chối yêu cầu đặt bàn an toàn
  const handleRejectReservation = async (res: Reservation) => {
    const ok = await confirmDialog({
      title: "Từ Chối Yêu Cầu Đặt Bàn?",
      message: `Từ chối yêu cầu đặt bàn của khách ${res.guestName} (${res.phone})?`,
      confirmText: "Từ Chối",
      cancelText: "Giữ Lại",
      variant: "danger",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, status: "CANCELLED" } : r))
    );
    toast.warning(`Đã từ chối lịch đặt bàn của khách ${res.guestName}.`);
  };

  // Mở modal gán bàn
  const handleOpenAssignTable = (res: Reservation) => {
    setTableAssignTarget(res);
    setSelectedTable(
      res.tableAssigned && res.tableAssigned !== "Chưa gán bàn"
        ? res.tableAssigned
        : AVAILABLE_TABLES[0]
    );
  };

  // Lưu gán bàn an toàn
  const handleSaveTableAssignment = () => {
    if (!tableAssignTarget) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === tableAssignTarget.id
          ? {
              ...r,
              tableAssigned: selectedTable,
              status: r.status === "PENDING" ? "CONFIRMED" : r.status,
            }
          : r
      )
    );
    toast.success(`Đã gán bàn ${selectedTable} cho khách ${tableAssignTarget.guestName}`);
    setTableAssignTarget(null);
  };

  // Đổi trạng thái tiền cọc
  const handleToggleDeposit = async (res: Reservation) => {
    const nextStatus = res.depositStatus === "PAID" ? "UNPAID" : "PAID";
    const ok = await confirmDialog({
      title: "Cập Nhật Tiền Cọc?",
      message: `Chuyển trạng thái cọc của khách ${res.guestName} thành "${nextStatus === "PAID" ? "Đã Thu Cọc" : "Chưa Thu Cọc"}"?`,
      confirmText: "Cập Nhật",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) =>
        r.id === res.id ? { ...r, depositStatus: nextStatus } : r
      )
    );
    toast.success(`Đã cập nhật tiền cọc khách ${res.guestName} thành công!`);
  };

  // Thêm mới đặt bàn
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName.trim() || !formData.phone.trim()) {
      toast.error("Vui lòng điền tên và số điện thoại khách hàng");
      return;
    }

    const newRes: Reservation = {
      id: "r_" + Date.now(),
      guestName: formData.guestName.trim(),
      phone: formData.phone.trim(),
      guestCount: Number(formData.guestCount),
      reservationTime: formData.reservationTime,
      dateCategory: formData.dateCategory,
      tableAssigned: formData.tableAssigned,
      occasion: formData.occasion,
      depositAmount: Number(formData.depositAmount) || 0,
      depositStatus: formData.depositStatus,
      notes: formData.notes.trim(),
      source: formData.source,
      status: formData.source === "WALK_IN" ? "CONFIRMED" : "PENDING",
      createdAt: "Vừa xong",
    };

    setReservations([newRes, ...reservations]);
    setIsModalOpen(false);
    toast.success(`Đã tạo lịch đặt bàn mới cho ${newRes.guestName} thành công!`);
    setFormData({
      guestName: "",
      phone: "",
      guestCount: 4,
      reservationTime: "19:00 - Tối nay",
      dateCategory: "TODAY",
      tableAssigned: AVAILABLE_TABLES[0],
      occasion: "GENERAL",
      depositAmount: 0,
      depositStatus: "UNPAID",
      notes: "",
      source: "PHONE_CALL",
    });
  };

  // Lọc danh sách
  const filteredReservations = reservations.filter((r) => {
    const matchDate = filterDate === "ALL" || r.dateCategory === filterDate;
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.guestName.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      (r.tableAssigned || "").toLowerCase().includes(q);
    return matchDate && matchStatus && matchSearch;
  });

  // Phân trang
  const paginatedReservations = filteredReservations.slice(
    (reservationPage - 1) * PAGE_SIZE,
    reservationPage * PAGE_SIZE
  );

  const {
    visibleItems: mobileReservations,
    visibleCount: visibleReservationCount,
    hasMore: hasMoreReservations,
    sentinelRef: reservationSentinelRef,
    isMobile,
  } = useMobileInfiniteScroll({
    items: filteredReservations,
    pageSize: 10,
    mobileBreakpoint: 768,
  });

  const displayedReservations = isMobile ? mobileReservations : paginatedReservations;

  // Thống kê nhanh
  const totalGuestsToday = reservations
    .filter((r) => r.dateCategory === "TODAY" && r.status !== "CANCELLED" && r.status !== "NO_SHOW")
    .reduce((sum, r) => sum + r.guestCount, 0);
  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const confirmedCount = reservations.filter((r) => r.status === "CONFIRMED").length;
  const arrivedCount = reservations.filter((r) => r.status === "ARRIVED").length;
  const totalDeposits = reservations
    .filter((r) => r.depositStatus === "PAID")
    .reduce((sum, r) => sum + (r.depositAmount || 0), 0);

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Tiêu đề gọn gàng & Nút tạo mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Lịch Đặt Bàn & Giữ Chỗ
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200">
              Hotline & Web
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Điều phối chỗ ngồi đón tiếp khách tự động, quản lý tiền cọc và xác nhận khách đến
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            className="rounded-xl gap-2 text-xs bg-brand-950 text-white shadow-sm font-bold hover:bg-black transition-all px-3.5 py-2"
            onClick={() => openModal("PHONE_CALL")}
          >
            <Icon name="phone" className="w-3.5 h-3.5 text-brand-400" />
            <span>+ Đặt Bàn Hotline</span>
          </Button>

          {/* Nút Khách Đến Ngay / Thêm Lịch (Icon-only) */}
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-white border-surface-border text-ink-primary hover:bg-surface-canvas font-bold shadow-2xs shrink-0"
            onClick={() => openModal("WALK_IN")}
            title="Tiếp nhận khách đến ngay"
            aria-label="Tiếp nhận khách đến ngay"
          >
            <Icon name="plus" className="w-4 h-4 text-ink-muted" />
          </Button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Thiết Kế Tối Giản Cao Cấp */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-brand-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Khách Hôm Nay</span>
            <div className="w-8 h-8 rounded-xl bg-surface-canvas flex items-center justify-center text-ink-muted group-hover:text-brand-900 group-hover:bg-brand-50 transition-colors">
              <Icon name="users" size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-ink-primary tracking-tight">{totalGuestsToday}</span>
            <span className="text-xs font-medium text-ink-muted">khách đã ghi nhận</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Chờ Xác Nhận</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50/70 flex items-center justify-center text-amber-700 group-hover:bg-amber-100 transition-colors">
              <Icon name="clock" size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700 tracking-tight">{pendingCount}</span>
            <span className="text-xs font-medium text-amber-700/80">yêu cầu cần duyệt</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Bàn Đã Giữ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50/70 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
              <Icon name="calendarCheck" size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">{confirmedCount}</span>
            <span className="text-xs font-medium text-ink-muted">bàn sẵn sàng đón</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-brand-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Tiền Cọc Đã Thu</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50/70 flex items-center justify-center text-blue-700 group-hover:bg-blue-100 transition-colors">
              <Icon name="vietqr" size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-brand-950 tracking-tight">
              {totalDeposits.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-ink-muted">đ</span>
          </div>
        </div>
      </div>

      {/* Thanh Bộ Lọc & Tìm Kiếm Hợp Nhất Một Hộp Sang Trọng Chuẩn SaaS */}
      <div className="bg-white rounded-2xl border border-surface-border p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Ô Tìm Kiếm Thanh Thoát */}
          <div className="relative w-full min-w-0 max-w-md lg:flex-1">
            <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setReservationPage(1);
              }}
              placeholder="Tìm theo tên khách, số điện thoại, số bàn..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-surface-canvas/40 focus:bg-white focus:outline-none focus:border-brand-700 transition-all placeholder:text-ink-muted/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nhóm Bộ Lọc Thời Gian */}
          <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-surface-border/60 bg-surface-canvas p-1 no-scrollbar sm:w-auto">
            {(
              [
                { id: "ALL", label: "Tất cả ngày" },
                { id: "TODAY", label: "Hôm nay" },
                { id: "TOMORROW", label: "Ngày mai" },
                { id: "THIS_WEEK", label: "Tuần này" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterDate(tab.id);
                  setReservationPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterDate === tab.id
                    ? "bg-white text-ink-primary shadow-xs font-black"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng Tab Trạng Thái Thanh Thoát */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5 border-t border-surface-border/50 text-xs">
          {[
            { id: "ALL", label: "Tất Cả", count: reservations.length },
            { id: "PENDING", label: "Chờ Duyệt", count: pendingCount, highlight: pendingCount > 0 ? "text-amber-700 bg-amber-50" : "" },
            { id: "CONFIRMED", label: "Đã Giữ Bàn", count: confirmedCount },
            { id: "ARRIVED", label: "Đang Tại Quán", count: arrivedCount },
            { id: "NO_SHOW", label: "Vắng Mặt", count: reservations.filter((r) => r.status === "NO_SHOW").length },
            { id: "CANCELLED", label: "Đã Hủy", count: reservations.filter((r) => r.status === "CANCELLED").length },
          ].map((st) => {
            const isActive = filterStatus === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setFilterStatus(st.id);
                  setReservationPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border ${
                  isActive
                    ? "bg-brand-950 text-white border-brand-950 shadow-xs"
                    : "bg-white border-surface-border text-ink-muted hover:text-ink-primary hover:border-slate-300"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : st.highlight || "bg-surface-canvas text-ink-muted"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh Sách Thẻ Đặt Bàn Kiểu Dáng Cao Cấp (Luxury Timeline Cards) */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-surface-border">
            <div className="w-12 h-12 rounded-2xl bg-surface-canvas flex items-center justify-center mx-auto mb-3 text-ink-muted">
              <Icon name="calendar" size={20} />
            </div>
            <h4 className="text-sm font-bold text-ink-primary">Không tìm thấy lịch đặt bàn nào</h4>
            <p className="text-xs text-ink-muted mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang khung thời gian khác
            </p>
          </div>
        ) : (
          displayedReservations.map((res) => {
            const isPending = res.status === "PENDING";
            const isConfirmed = res.status === "CONFIRMED";
            const isArrived = res.status === "ARRIVED";
            const isNoShow = res.status === "NO_SHOW";
            const isCancelled = res.status === "CANCELLED";

            return (
              <div
                key={res.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all relative overflow-hidden shadow-2xs hover:shadow-md ${
                  isArrived
                    ? "border-emerald-200/80 bg-linear-to-r from-emerald-50/20 to-white"
                    : isPending
                    ? "border-amber-200/80 hover:border-amber-400"
                    : "border-surface-border hover:border-brand-400"
                }`}
              >
                {/* Viền trạng thái bên trái thanh lịch */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    isArrived
                      ? "bg-emerald-500"
                      : isConfirmed
                      ? "bg-brand-800"
                      : isPending
                      ? "bg-amber-500"
                      : isNoShow
                      ? "bg-slate-400"
                      : "bg-rose-400"
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
                  {/* Cột 1: Thời gian & Thông tin khách */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    {/* Badge Giờ Hẹn Sang Trọng Chuẩn Khách Sạn / Luxury Dining */}
                    <div className="shrink-0 w-28 sm:w-32 py-2.5 px-3 rounded-2xl bg-surface-canvas/90 border border-surface-border flex flex-col items-center justify-center text-center shadow-2xs">
                      <span className="text-[10px] font-black tracking-widest text-ink-muted uppercase">
                        {res.reservationTime.includes("-") ? res.reservationTime.split("-")[1].trim() : "Hẹn Giờ"}
                      </span>
                      <span className="text-base sm:text-lg font-black text-brand-950 tracking-tight mt-0.5">
                        {res.reservationTime.includes("-") ? res.reservationTime.split("-")[0].trim() : res.reservationTime}
                      </span>
                    </div>

                    {/* Chi tiết khách hàng & Bàn gán */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-black text-base text-ink-primary tracking-tight">
                          {res.guestName}
                        </h4>

                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-surface-canvas text-ink-primary border border-surface-border/70">
                          {res.guestCount} khách
                        </span>

                        <a
                          href={`tel:${res.phone}`}
                          className="text-xs font-semibold text-ink-muted hover:text-brand-900 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Icon name="phone" size={13} className="text-ink-muted/80" />
                          <span>{res.phone}</span>
                        </a>

                        {/* Tag trạng thái chuẩn cao cấp */}
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                            isArrived
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                              : isConfirmed
                              ? "bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs"
                              : isPending
                              ? "bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
                              : isNoShow
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isArrived
                            ? "Đang tại quán"
                            : isConfirmed
                            ? "Đã giữ bàn"
                            : isPending
                            ? "Chờ xác nhận"
                            : isNoShow
                            ? "Vắng mặt"
                            : "Đã hủy"}
                        </span>
                      </div>

                      {/* Chi tiết vị trí bàn, tiền cọc & nguồn */}
                      <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Icon name="table" size={13} className="text-ink-muted/70" />
                          <span className="text-ink-subtle">Bàn:</span>
                          <span className={`font-bold ${res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? "text-ink-primary" : "text-amber-700 font-extrabold"}`}>
                            {res.tableAssigned || "Chưa gán bàn"}
                          </span>
                          {!isCancelled && !isNoShow && (
                            <button
                              onClick={() => handleOpenAssignTable(res)}
                              className="text-[11px] font-bold text-brand-800 hover:text-brand-950 underline underline-offset-2 ml-0.5"
                            >
                              {res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? "Đổi" : "Gán ngay"}
                            </button>
                          )}
                        </div>

                        {(res.depositAmount ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-ink-muted/40">•</span>
                            <button
                              type="button"
                              onClick={() => handleToggleDeposit(res)}
                              className={`flex items-center gap-1 font-bold ${
                                res.depositStatus === "PAID" ? "text-emerald-700" : "text-amber-700"
                              }`}
                              title="Bấm để đổi trạng thái cọc"
                            >
                              <Icon name="checkCircle" size={13} className={res.depositStatus === "PAID" ? "text-emerald-600" : "text-amber-600"} />
                              <span>
                                Cọc {(res.depositAmount ?? 0).toLocaleString("vi-VN")} đ
                              </span>
                              <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-surface-canvas border border-surface-border">
                                {res.depositStatus === "PAID" ? "Đã cọc" : "Chưa cọc"}
                              </span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-ink-muted">
                          <span className="text-ink-muted/40">•</span>
                          <span>{res.source === "LANDING_PAGE" ? "Website" : "Hotline"}</span>
                        </div>
                      </div>

                      {/* Ghi chú: Hiển thị thanh thoát, không phải một input xám to đùng */}
                      {res.notes && (
                        <div className="flex items-start gap-1.5 mt-1 text-xs text-ink-muted bg-amber-50/50 border border-amber-200/50 px-2.5 py-1 rounded-lg">
                          <Icon name="info" size={13} className="text-amber-700 mt-0.5 shrink-0" />
                          <span className="font-medium text-amber-900">
                            {res.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cột 2: Cụm Nút Thao Tác Chuyên Nghiệp */}
                  <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-surface-border/50 justify-end">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-brand-950 text-white text-xs font-black shadow-xs hover:bg-black active:scale-95 transition-all flex items-center gap-1.5"
                          onClick={() => handleConfirmReservation(res)}
                        >
                          <Icon name="check" size={13} className="text-emerald-400" />
                          <span>Giữ Bàn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectReservation(res)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                        >
                          Từ Chối
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black shadow-xs hover:bg-emerald-800 active:scale-95 transition-all flex items-center gap-1.5"
                          onClick={() => handleCustomerArrived(res)}
                        >
                          <Icon name="checkCircle" size={14} />
                          <span>Đón Khách</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNoShow(res)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                        >
                          Vắng Mặt
                        </button>
                      </>
                    )}

                    {isArrived && (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                        <Icon name="checkCircle" size={14} className="text-emerald-600" />
                        <span>Đang dùng bữa tại bàn</span>
                      </div>
                    )}

                    {(isNoShow || isCancelled) && (
                      <span className="text-xs font-bold text-ink-muted px-3 py-1 bg-surface-canvas rounded-lg border border-surface-border">
                        {isNoShow ? "Đã ghi nhận vắng mặt" : "Đã hủy giữ chỗ"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Infinite Scroll Sentinel */}
      <div className="block md:hidden">
        <MobileInfiniteSentinel
          hasMore={hasMoreReservations}
          totalCount={filteredReservations.length}
          visibleCount={visibleReservationCount}
          sentinelRef={reservationSentinelRef}
        />
      </div>

      {/* Phân trang trên Desktop (>= md) */}
      <div className="hidden md:block">
        <Pagination
          currentPage={reservationPage}
          totalItems={filteredReservations.length}
          pageSize={PAGE_SIZE}
          onPageChange={setReservationPage}
        />
      </div>

      {/* Modal Tiếp Nhận Đặt Bàn Mới (Hotline/Walk-in) */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden">
              {/* Header modal */}
              <div className="p-6 border-b border-surface-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-ink-primary">
                    {formData.source === "PHONE_CALL" ? "Tiếp Nhận Đặt Bàn Hotline" : "Đặt Bàn Khách Đến Ngay"}
                  </h3>
                  <p className="text-xs text-ink-muted">Ghi nhận thông tin khách và giữ chỗ</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-canvas hover:text-ink-primary"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Tên Khách Hàng *
                  </label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    placeholder="Ví dụ: Anh Nam"
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Số Điện Thoại *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Số Lượng Khách
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Thời Gian Hẹn
                  </label>
                  <input
                    type="text"
                    value={formData.reservationTime}
                    onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                    placeholder="19:00 - Tối nay"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Xếp Bàn Sẵn
                  </label>
                  <select
                    value={formData.tableAssigned}
                    onChange={(e) => setFormData({ ...formData, tableAssigned: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                  >
                    {AVAILABLE_TABLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Tiền Cọc (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={50000}
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                    placeholder="0 đ"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Ghi Chú Khách Dặn
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú món ăn trước, trang trí, ghế trẻ em..."
                  className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs font-bold px-4 shadow-xs"
                >
                  Xác Nhận Giữ Chỗ
                </Button>
              </div>
            </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Xếp / Đổi Bàn Nhanh */}
      {tableAssignTarget && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated border border-surface-border p-5 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-sm font-black text-ink-primary">Xếp Bàn Cho Khách</h3>
                  <span className="text-[11px] text-ink-muted font-bold">
                    {tableAssignTarget.guestName} ({tableAssignTarget.guestCount} người)
                  </span>
                </div>
                <button
                  onClick={() => setTableAssignTarget(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-canvas"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-secondary">
                  Chọn Bàn Trống Sẵn Sàng
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {AVAILABLE_TABLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTable(t)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        selectedTable === t
                          ? "bg-brand-50 border border-brand-800 text-brand-950 font-black shadow-2xs"
                          : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                      }`}
                    >
                      <span>{t}</span>
                      {selectedTable === t && <Icon name="check" size={14} className="text-brand-900" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setTableAssignTarget(null)}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs font-bold px-4"
                  onClick={handleSaveTableAssignment}
                >
                  Xác Nhận Xếp Bàn
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
