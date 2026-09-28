import React, { useState } from "react";
import { Button, Icon, Pagination, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { Reservation } from "@/types/cms.types";

const AVAILABLE_TABLES = [
  "Bàn 01 (Tầng 1 - 4 người)",
  "Bàn 02 (Tầng 1 - 4 người)",
  "Bàn 03 (Tầng 1 - 6 người)",
  "Bàn 04 (Phòng VIP 1 - 8 người)",
  "Bàn 08 (Ban công tầng 2 - 6 người)",
  "Bàn 12 (Sân vườn - 12 người)",
];

export const CmsReservationsManagement: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([
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
  const [filterDate, setFilterDate] = useState<"ALL" | "TODAY" | "TOMORROW" | "THIS_WEEK">("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
            Lịch Đặt Bàn & Giữ Chỗ
          </h2>
          <p className="text-xs text-ink-muted">
            Quản lý tiếp nhận đặt chỗ qua Hotline & Website
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white shadow-xs font-bold hover:bg-brand-950"
            onClick={() => openModal("PHONE_CALL")}
          >
            <Icon name="phone" className="w-3.5 h-3.5" />
            <span>+ Đặt Bàn Hotline</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs bg-white border-surface-border text-ink-primary hover:bg-surface-canvas font-bold"
            onClick={() => openModal("WALK_IN")}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>Khách Đến Ngay</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Tinh Gọn (Gọn, cùng tông màu, không rối mắt) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-surface-border flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-ink-muted block leading-none mb-1">Khách Hôm Nay</span>
            <span className="text-lg sm:text-xl font-black text-ink-primary tracking-tight">
              {totalGuestsToday} <span className="text-xs font-semibold text-ink-muted">khách</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-900 shrink-0">
            <Icon name="users" size={16} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-surface-border flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-ink-muted block leading-none mb-1">Chờ Xác Nhận</span>
            <span className="text-lg sm:text-xl font-black text-amber-700 tracking-tight">
              {pendingCount} <span className="text-xs font-semibold text-ink-muted">yêu cầu</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
            <Icon name="clock" size={16} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-surface-border flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-ink-muted block leading-none mb-1">Đã Giữ Chỗ</span>
            <span className="text-lg sm:text-xl font-black text-ink-primary tracking-tight">
              {confirmedCount} <span className="text-xs font-semibold text-ink-muted">bàn sẵn sàng</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <Icon name="calendarCheck" size={16} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-surface-border flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-ink-muted block leading-none mb-1">Tiền Cọc Đã Thu</span>
            <span className="text-lg sm:text-xl font-black text-brand-900 tracking-tight">
              {totalDeposits.toLocaleString("vi-VN")} <span className="text-xs font-semibold text-ink-muted">đ</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
            <Icon name="vietqr" size={16} />
          </div>
        </div>
      </div>

      {/* Thanh Công Cụ Hợp Nhất: Tìm Kiếm + Bộ Lọc Thời Gian & Trạng Thái */}
      <div className="bg-white rounded-2xl border border-surface-border p-3 space-y-3 shadow-xs">
        {/* Hàng 1: Ô Tìm Kiếm & Lọc Thời Gian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setReservationPage(1);
              }}
              placeholder="Tìm theo tên khách, số điện thoại, số bàn..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc ngày đơn giản */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "ALL", label: "Tất cả" },
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  filterDate === tab.id
                    ? "bg-brand-900 text-white shadow-2xs font-black"
                    : "text-ink-muted hover:text-ink-primary hover:bg-surface-canvas"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 2: Tab lọc trạng thái đơn giản, thanh thoát */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-surface-border/60">
          {[
            { id: "ALL", label: "Tất Cả", count: reservations.length },
            { id: "PENDING", label: "Chờ Duyệt", count: pendingCount },
            { id: "CONFIRMED", label: "Đã Giữ Bàn", count: confirmedCount },
            { id: "ARRIVED", label: "Đang Tại Quán", count: arrivedCount },
            { id: "NO_SHOW", label: "Vắng Mặt", count: reservations.filter((r) => r.status === "NO_SHOW").length },
            { id: "CANCELLED", label: "Đã Hủy", count: reservations.filter((r) => r.status === "CANCELLED").length },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setFilterStatus(st.id);
                setReservationPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                filterStatus === st.id
                  ? "bg-brand-900 text-white shadow-2xs font-black"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  filterStatus === st.id
                    ? "bg-white/20 text-white"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách thẻ đặt bàn thiết kế tinh giản, thoáng đãng */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white border border-surface-border">
            <div className="w-10 h-10 rounded-full bg-surface-canvas flex items-center justify-center mx-auto mb-2 text-ink-subtle">
              <Icon name="calendar" size={18} />
            </div>
            <h4 className="text-sm font-bold text-ink-primary">Không tìm thấy lịch đặt bàn nào</h4>
            <p className="text-xs text-ink-muted mt-0.5">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang khung thời gian khác
            </p>
          </div>
        ) : (
          paginatedReservations.map((res) => {
            const isPending = res.status === "PENDING";
            const isConfirmed = res.status === "CONFIRMED";
            const isArrived = res.status === "ARRIVED";
            const isNoShow = res.status === "NO_SHOW";
            const isCancelled = res.status === "CANCELLED";

            return (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-white border border-surface-border shadow-2xs hover:border-brand-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Khối Thông Tin Chính */}
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Hàng 1: Giờ hẹn • Tên Khách • SĐT • Trạng Thái Duy Nhất */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200/60 font-black text-brand-950 text-xs shrink-0">
                      <Icon name="clock" size={13} className="text-brand-800" />
                      <span>{res.reservationTime}</span>
                    </div>

                    <h4 className="font-black text-sm text-ink-primary">
                      {res.guestName}
                    </h4>

                    <span className="text-xs text-ink-muted font-bold">
                      ({res.guestCount} người)
                    </span>

                    <a
                      href={`tel:${res.phone}`}
                      className="text-xs font-semibold text-ink-muted hover:text-brand-900 flex items-center gap-1"
                    >
                      <Icon name="phone" size={12} className="text-ink-subtle" />
                      <span>{res.phone}</span>
                    </a>

                    {/* Huy hiệu trạng thái duy nhất */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ml-auto sm:ml-0 ${
                        isArrived
                          ? "bg-emerald-100 text-emerald-800"
                          : isConfirmed
                          ? "bg-brand-100 text-brand-900"
                          : isPending
                          ? "bg-amber-100 text-amber-800"
                          : isNoShow
                          ? "bg-slate-100 text-slate-700"
                          : "bg-surface-muted text-ink-muted"
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

                  {/* Hàng 2: Vị trí bàn & Tiền cọc & Nguồn đặt */}
                  <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-ink-subtle">Vị trí:</span>
                      <span className="font-bold text-ink-primary">
                        {res.tableAssigned || "Chưa gán bàn"}
                      </span>
                      {!isCancelled && !isNoShow && (
                        <button
                          onClick={() => handleOpenAssignTable(res)}
                          className="text-[11px] font-bold text-brand-800 hover:underline ml-1"
                        >
                          {res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? "[Đổi bàn]" : "[Xếp bàn]"}
                        </button>
                      )}
                    </div>

                    {(res.depositAmount ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleToggleDeposit(res)}
                        className={`flex items-center gap-1 font-bold ${
                          res.depositStatus === "PAID"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                        title="Bấm để đổi trạng thái cọc"
                      >
                        <span>•</span>
                        <span>
                          Cọc {(res.depositAmount ?? 0).toLocaleString("vi-VN")} đ (
                          {res.depositStatus === "PAID" ? "Đã cọc VietQR" : "Chưa cọc"})
                        </span>
                      </button>
                    )}

                    <span className="text-ink-subtle hidden sm:inline">
                      • Nguồn: {res.source === "LANDING_PAGE" ? "Website" : "Hotline"}
                    </span>
                  </div>

                  {/* Ghi chú dặn dò (nếu có) */}
                  {res.notes && (
                    <p className="text-xs text-ink-muted italic bg-surface-canvas/60 px-3 py-1.5 rounded-xl border border-surface-border/50">
                      Ghi chú: "{res.notes}"
                    </p>
                  )}
                </div>

                {/* Khối Nút Hành Động (Gọn, rõ ràng) */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-surface-border/60">
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-xl bg-brand-900 text-white text-xs gap-1.5 shadow-xs font-bold hover:bg-brand-950"
                        onClick={() => handleConfirmReservation(res)}
                      >
                        <Icon name="check" size={14} />
                        <span>Giữ Bàn</span>
                      </Button>

                      <button
                        onClick={() => handleRejectReservation(res)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Từ Chối
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-700 text-white text-xs gap-1.5 shadow-xs hover:bg-emerald-800 font-bold"
                        onClick={() => handleCustomerArrived(res)}
                      >
                        <Icon name="checkCircle" size={14} />
                        <span>Đón Khách</span>
                      </Button>

                      <button
                        onClick={() => handleNoShow(res)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Vắng Mặt
                      </button>
                    </>
                  )}

                  {isArrived && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                      <Icon name="checkCircle" size={14} className="text-emerald-600" />
                      <span>Đang dùng bữa</span>
                    </span>
                  )}

                  {(isNoShow || isCancelled) && (
                    <span className="text-xs text-ink-subtle italic px-2 py-1">
                      Đã kết thúc
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Phân trang */}
      <Pagination
        currentPage={reservationPage}
        totalItems={filteredReservations.length}
        pageSize={PAGE_SIZE}
        onPageChange={setReservationPage}
      />

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
