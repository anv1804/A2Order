import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
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
      tableAssigned: "Bàn 04 (Phòng VIP 1 - 8 người)",
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
      tableAssigned: "Bàn 08 (Ban công tầng 2 - 6 người)",
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
  const PAGE_SIZE = 5;

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
      message: `Khách ${res.guestName} quá giờ hẹn 30 phút. Giải phóng bàn ${res.tableAssigned} để tiếp đón khách vãng lai?`,
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
      cancelText: "Quay Lại",
      variant: "danger",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, status: "CANCELLED" } : r))
    );
    toast.info(`Đã từ chối yêu cầu đặt bàn của ${res.guestName}`);
  };

  // Mở modal xếp bàn
  const handleOpenAssignTable = (res: Reservation) => {
    setTableAssignTarget(res);
    setSelectedTable(res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? res.tableAssigned : AVAILABLE_TABLES[0]);
  };

  // Lưu đổi bàn từ Modal
  const handleSaveTableAssignment = () => {
    if (!tableAssignTarget || !selectedTable) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === tableAssignTarget.id ? { ...r, tableAssigned: selectedTable } : r
      )
    );
    toast.success(`Đã xếp khách ${tableAssignTarget.guestName} vào ${selectedTable}!`);
    setTableAssignTarget(null);
  };

  // Xác nhận đã nhận tiền cọc an toàn
  const handleToggleDeposit = async (res: Reservation) => {
    const isPaying = res.depositStatus !== "PAID";
    const depositVal = res.depositAmount ?? 0;
    const ok = await confirmDialog({
      title: isPaying ? "Xác Nhận Đã Nhận Tiền Cọc?" : "Hủy Trạng Thái Cọc?",
      message: isPaying
        ? `Xác nhận đã nhận đủ ${depositVal.toLocaleString("vi-VN")} đ tiền cọc của khách ${res.guestName} qua VietQR?`
        : `Chuyển tiền cọc của khách ${res.guestName} về trạng thái Chưa thanh toán?`,
      confirmText: isPaying ? "Xác Nhận Đã Nhận" : "Chuyển Chưa Cọc",
      cancelText: "Hủy",
      variant: isPaying ? "primary" : "danger",
    });
    if (!ok) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, depositStatus: isPaying ? "PAID" : "UNPAID" } : r))
    );
    toast.success(
      isPaying
        ? "Đã xác nhận nhận tiền cọc giữ chỗ VietQR!"
        : "Đã chuyển tiền cọc sang Chưa thanh toán"
    );
  };

  // Submit tạo mới
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.phone) {
      toast.error("Vui lòng nhập tên và số điện thoại của khách");
      return;
    }

    const newRes: Reservation = {
      id: `r-${Date.now()}`,
      ...formData,
      status: "CONFIRMED",
      createdAt: "Vừa xong",
    };

    setReservations((prev) => [newRes, ...prev]);
    setIsModalOpen(false);
    toast.success(`Đã thêm lịch đặt bàn cho ${formData.guestName}!`);
  };

  // Lọc danh sách
  const filteredReservations = reservations.filter((r) => {
    if (filterDate !== "ALL" && r.dateCategory !== filterDate) return false;
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.guestName.toLowerCase().includes(q) || r.phone.includes(q);
    }
    return true;
  });

  const paginatedReservations = filteredReservations.slice(
    (reservationPage - 1) * PAGE_SIZE,
    reservationPage * PAGE_SIZE
  );

  // Tóm tắt số liệu
  const totalGuestsToday = reservations
    .filter((r) => r.dateCategory === "TODAY" && r.status !== "CANCELLED" && r.status !== "NO_SHOW")
    .reduce((acc, curr) => acc + curr.guestCount, 0);

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const confirmedCount = reservations.filter((r) => r.status === "CONFIRMED").length;
  const totalDeposits = reservations
    .filter((r) => r.depositStatus === "PAID")
    .reduce((acc, curr) => acc + (curr.depositAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Quản Lý Lịch Đặt Bàn & Giữ Chỗ
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Đồng bộ Website & POS
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Tiếp nhận đặt bàn trực tuyến từ Landing Page hoặc cuộc gọi Hotline, gán bàn trước và quản lý tiền cọc.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Hotline nổi bật — dành cho nhân viên tiếp nhận điện thoại */}
          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md font-black"
            onClick={() => openModal("PHONE_CALL")}
          >
            <Icon name="phone" className="w-3.5 h-3.5" />
            <span>Đặt Bàn Hotline</span>
          </Button>
          {/* Nút Walk-in cho khách đến trực tiếp */}
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-2 text-xs bg-white"
            onClick={() => openModal("WALK_IN")}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>Walk-in</span>
          </Button>
        </div>
      </div>

      {/* Ô tìm kiếm nhanh tên/SĐT khách */}
      <div className="relative">
        <Icon name="search" className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setReservationPage(1); }}
          placeholder="Tìm tên khách hoặc số điện thoại để kiểm tra trước khi tạo mới..."
          className="w-full h-10 pl-10 pr-4 rounded-2xl border border-surface-border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary"
          >
            <Icon name="x" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>


      {/* Row 1: Thẻ tóm tắt chỉ số */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Panel variant="featured" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-200">Khách Đến Hôm Nay</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Icon name="users" className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="my-1.5">
            <span className="text-3xl font-black tracking-tight">{totalGuestsToday}</span>
            <span className="text-xs text-brand-200 ml-1">thực khách</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-300">
            {reservations.filter((r) => r.dateCategory === "TODAY").length} bàn đã đặt
          </span>
        </Panel>

        <Panel variant="default" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Chờ Duyệt Gấp</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Icon name="clock" className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="my-1.5">
            <span className="text-3xl font-black text-amber-600 tracking-tight">{pendingCount}</span>
            <span className="text-xs text-ink-muted ml-1">yêu cầu</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700">Cần liên hệ xác nhận</span>
        </Panel>

        <Panel variant="default" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Đã Giữ Bàn</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Icon name="calendarCheck" className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="my-1.5">
            <span className="text-3xl font-black text-ink-primary tracking-tight">{confirmedCount}</span>
            <span className="text-xs text-ink-muted ml-1">bàn sẵn sàng</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">Đã gán chỗ ngồi</span>
        </Panel>

        <Panel variant="default" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Tiền Cọc Đã Thu</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Icon name="vietqr" className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="my-1.5">
            <span className="text-2xl font-black text-brand-900 tracking-tight">
              {totalDeposits.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-ink-muted ml-1">đ</span>
          </div>
          <span className="text-[11px] font-bold text-blue-700">Đảm bảo chống hủy bàn</span>
        </Panel>
      </div>

      {/* Row 2: Bộ lọc nhanh */}
      <div className="space-y-2.5 p-3 bg-white rounded-2xl border border-surface-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lọc ngày */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-extrabold text-ink-muted px-2">Thời gian:</span>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterDate === tab.id
                    ? "bg-brand-900 text-white shadow-sm"
                    : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-bold text-ink-muted px-2">
            Tìm thấy {filteredReservations.length} lịch đặt bàn
          </span>
        </div>

        {/* Lọc trạng thái bằng nút badge trực quan */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-surface-border/50 pt-2.5">
          <span className="text-xs font-extrabold text-ink-muted px-2">Trạng thái:</span>
          {[
            { id: "ALL", label: "Tất Cả", count: reservations.length },
            { id: "PENDING", label: "⏳ Chờ Duyệt", count: pendingCount },
            { id: "CONFIRMED", label: "✓ Đã Giữ Bàn", count: confirmedCount },
            { id: "ARRIVED", label: "● Đang Tại Quán", count: reservations.filter((r) => r.status === "ARRIVED").length },
            { id: "NO_SHOW", label: "✕ Vắng Mặt", count: reservations.filter((r) => r.status === "NO_SHOW").length },
            { id: "CANCELLED", label: "Đã Hủy", count: reservations.filter((r) => r.status === "CANCELLED").length },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setFilterStatus(st.id);
                setReservationPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterStatus === st.id
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === st.id ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"}`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách thẻ đặt bàn */}
      <div className="space-y-3.5">
        {filteredReservations.length === 0 ? (
          <Panel variant="default" padding="lg" className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-3 text-ink-subtle">
              <Icon name="calendar" className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-ink-primary">Không có lịch đặt bàn phù hợp</h4>
            <p className="text-xs text-ink-muted mt-1">
              Thử chuyển đổi bộ lọc thời gian hoặc kiểm tra yêu cầu mới
            </p>
          </Panel>
        ) : (
          paginatedReservations.map((res) => {
            const isPending = res.status === "PENDING";
            const isConfirmed = res.status === "CONFIRMED";
            const isArrived = res.status === "ARRIVED";
            const isNoShow = res.status === "NO_SHOW";
            const isCancelled = res.status === "CANCELLED";

            return (
              <Panel
                key={res.id}
                variant="default"
                padding="md"
                className={`transition-all border-l-4 ${
                  isPending
                    ? "border-l-amber-500 bg-amber-50/15"
                    : isConfirmed
                    ? "border-l-brand-800"
                    : isArrived
                    ? "border-l-emerald-600 bg-emerald-50/15"
                    : "border-l-slate-400 opacity-75"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Guest Info & Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-sm text-ink-primary">{res.guestName}</h4>

                      <a
                        href={`tel:${res.phone}`}
                        className="text-xs font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-md flex items-center gap-1 hover:underline"
                      >
                        <Icon name="phone" className="w-3 h-3" />
                        {res.phone}
                      </a>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isArrived
                            ? "bg-emerald-100 text-emerald-800"
                            : isConfirmed
                            ? "bg-brand-100 text-brand-900"
                            : isPending
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : isNoShow
                            ? "bg-rose-100 text-rose-800"
                            : "bg-surface-muted text-ink-muted"
                        }`}
                      >
                        {isArrived
                          ? "● Đang tại quán"
                          : isConfirmed
                          ? "✓ Đã giữ bàn"
                          : isPending
                          ? "⏳ Chờ xác nhận"
                          : isNoShow
                          ? "✕ Vắng mặt (Bùng)"
                          : "Đã hủy"}
                      </span>

                      {/* Nguồn đặt */}
                      <span className="text-[10px] text-ink-muted bg-surface-canvas border border-surface-border px-2 py-0.5 rounded-md">
                        {res.source === "LANDING_PAGE" ? "Website Landing" : "Hotline điện thoại"}
                      </span>

                      {res.occasion && res.occasion !== "GENERAL" && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {res.occasion === "BIRTHDAY"
                            ? "🎂 Tiệc Sinh Nhật"
                            : res.occasion === "BUSINESS"
                            ? "💼 Tiếp Đối Tác"
                            : res.occasion === "ANNIVERSARY"
                            ? "🌹 Kỷ Niệm"
                            : "👨‍👩‍👧‍👦 Gia Đình"}
                        </span>
                      )}
                    </div>

                    {/* Metadata: Time, Guests, Table Allocation, Deposit */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
                      <span className="flex items-center gap-1.5 font-bold text-brand-900">
                        <Icon name="clock" className="w-3.5 h-3.5" />
                        {res.reservationTime}
                      </span>

                      <span className="flex items-center gap-1.5 font-bold text-ink-primary">
                        <Icon name="users" className="w-3.5 h-3.5 text-ink-subtle" />
                        {res.guestCount} người
                      </span>

                      {/* Vị trí bàn kèm nút đổi an toàn */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink-subtle">Vị trí:</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          res.tableAssigned && res.tableAssigned !== "Chưa gán bàn"
                            ? "bg-brand-50 text-brand-950 border border-brand-200"
                            : "bg-surface-canvas text-ink-subtle border border-surface-border"
                        }`}>
                          {res.tableAssigned || "Chưa gán bàn"}
                        </span>
                        {!isCancelled && !isNoShow && (
                          <button
                            onClick={() => handleOpenAssignTable(res)}
                            className="text-[11px] font-bold text-brand-900 hover:text-brand-800 underline underline-offset-2 ml-1"
                          >
                            {res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? "Đổi bàn" : "Xếp bàn"}
                          </button>
                        )}
                      </div>

                      {/* Tiền cọc an toàn có bảo vệ confirm */}
                      {(res.depositAmount ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleToggleDeposit(res)}
                          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all border ${
                            res.depositStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          }`}
                          title="Bấm để cập nhật trạng thái cọc (có xác nhận)"
                        >
                          <Icon name="vietqr" className="w-3 h-3" />
                          <span>
                            Cọc: {(res.depositAmount ?? 0).toLocaleString("vi-VN")} đ (
                            {res.depositStatus === "PAID" ? "Đã cọc VietQR" : "Chưa cọc"})
                          </span>
                        </button>
                      )}
                    </div>

                    {res.notes && (
                      <p className="text-xs text-ink-secondary bg-surface-canvas p-2.5 rounded-xl border border-surface-border/60">
                        <span className="font-bold text-brand-900">Yêu cầu đặc biệt:</span> "
                        {res.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right Column: Safe Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-xl bg-brand-900 text-white text-xs gap-1.5 shadow-sm"
                          onClick={() => handleConfirmReservation(res)}
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                          <span>Xác Nhận Giữ Bàn</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                          onClick={() => handleRejectReservation(res)}
                        >
                          <Icon name="x" className="w-3.5 h-3.5" />
                          <span>Từ Chối</span>
                        </Button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-xl bg-emerald-700 text-white text-xs gap-1.5 shadow-sm hover:bg-emerald-800"
                          onClick={() => handleCustomerArrived(res)}
                        >
                          <Icon name="checkCircle" className="w-3.5 h-3.5" />
                          <span>Đón Khách Vào Bàn</span>
                        </Button>

                        <button
                          onClick={() => handleNoShow(res)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Báo Vắng Mặt
                        </button>
                      </>
                    )}

                    {isArrived && (
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                        <Icon name="checkCircle" className="w-4 h-4 text-emerald-600" />
                        <span>Đang dùng bữa tại bàn</span>
                      </span>
                    )}

                    {(isNoShow || isCancelled) && (
                      <span className="text-xs text-ink-subtle italic px-2 py-1">
                        Lịch hẹn đã kết thúc
                      </span>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })
        )}
      </div>

      {/* Phân trang đặt bàn */}
      <Pagination
        currentPage={reservationPage}
        totalItems={filteredReservations.length}
        pageSize={PAGE_SIZE}
        onPageChange={setReservationPage}
      />

      {/* Modal Tiếp Nhận Đặt Bàn Mới (Hotline/Walk-in) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden">
            {/* Banner context hotline */}
            {formData.source === "PHONE_CALL" && (
              <div className="bg-amber-500 px-5 py-2.5 flex items-center gap-2.5">
                <Icon name="phone" className="w-4 h-4 text-white shrink-0" />
                <span className="text-xs font-black text-white">
                  📞 Đang tiếp nhận cuộc gọi — Điền nhanh thông tin và nhấn Xác Nhận Giữ Chỗ
                </span>
              </div>
            )}
            {formData.source === "WALK_IN" && (
              <div className="bg-brand-900 px-5 py-2.5 flex items-center gap-2.5">
                <Icon name="users" className="w-4 h-4 text-white shrink-0" />
                <span className="text-xs font-black text-white">
                  🚶 Khách Walk-in — Ghi nhận thông tin và gán bàn ngay
                </span>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-ink-primary">
                    {formData.source === "PHONE_CALL" ? "Đặt Bàn Qua Hotline" : "Đặt Bàn Walk-in"}
                  </h3>
                  <p className="text-xs text-ink-muted">Ghi nhận thông tin khách và giữ chỗ</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
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
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
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
                    placeholder="0912 xxx xxx"
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Số Khách</label>
                  <input
                    type="number"
                    value={formData.guestCount}
                    onChange={(e) =>
                      setFormData({ ...formData, guestCount: Number(e.target.value) })
                    }
                    min={1}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Thời Gian Đến</label>
                  <input
                    type="text"
                    value={formData.reservationTime}
                    onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                    placeholder="19:00 - Tối nay"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Dịp Tiệc</label>
                  <select
                    value={formData.occasion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        occasion: e.target.value as "BIRTHDAY" | "BUSINESS" | "ANNIVERSARY" | "FAMILY" | "GENERAL",
                      })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value="GENERAL">Ăn uống thông thường</option>
                    <option value="BIRTHDAY">Sinh nhật</option>
                    <option value="BUSINESS">Tiếp đối tác</option>
                    <option value="ANNIVERSARY">Kỷ niệm</option>
                    <option value="FAMILY">Gia đình</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Gán Trước Bàn</label>
                  <select
                    value={formData.tableAssigned}
                    onChange={(e) => setFormData({ ...formData, tableAssigned: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    {AVAILABLE_TABLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Tiền Đặt Cọc (VND)</label>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, depositAmount: Number(e.target.value) })
                    }
                    step={50000}
                    placeholder="0 đ"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Ghi Chú Yêu Cầu / Món Gọi Trước
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ví dụ: Cần chuẩn bị 1 ghế em bé, 1 đĩa hoa quả..."
                  className="w-full p-2.5 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
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
                  className={`rounded-full text-white text-xs px-5 ${formData.source === "PHONE_CALL" ? "bg-amber-500 hover:bg-amber-600" : "bg-brand-900"}`}
                >
                  {formData.source === "PHONE_CALL" ? "📞 Xác Nhận Giữ Chỗ" : "Lưu & Giữ Chỗ Ngay"}
                </Button>
              </div>
            </form>
            </div>{/* end p-6 */}
          </div>
        </div>
      )}


      {/* Modal Xếp / Đổi Bàn An Toàn */}
      {tableAssignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="table" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Xếp Chỗ / Đổi Bàn</h3>
                  <p className="text-xs text-ink-muted">
                    Khách: <span className="font-bold text-ink-primary">{tableAssignTarget.guestName}</span> ({tableAssignTarget.guestCount} người)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTableAssignTarget(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-ink-secondary">
                Chọn Bàn Phục Vụ Phù Hợp:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {AVAILABLE_TABLES.map((tbl) => {
                  const isSelected = selectedTable === tbl;
                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => setSelectedTable(tbl)}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-brand-900 bg-brand-50/60 shadow-sm"
                          : "border-surface-border bg-surface-canvas hover:border-brand-200"
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-black ${isSelected ? "text-brand-950" : "text-ink-primary"}`}>
                          {tbl}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {tbl.includes("VIP") ? "Phòng tiệc riêng" : tbl.includes("Sân") ? "Khu ngoài trời" : "Khu trong nhà"}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-900 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setTableAssignTarget(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm"
                onClick={handleSaveTableAssignment}
              >
                Xác Nhận Xếp Vào {selectedTable}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
