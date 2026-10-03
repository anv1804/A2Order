import React, { useState } from "react";
import {
  Button,
  Icon,
  Pagination,
  Portal,
  DataTableCard,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  FilterSelect,
  Badge,
} from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { Reservation } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import {
  NewReservationModal,
  AssignTableModal,
  NoShowModal,
  DepositResolutionType,
} from "./reservations";

const AVAILABLE_TABLES = [
  "Bàn 01 (Tầng 1 - 4 người)",
  "Bàn 02 (Tầng 1 - 4 người)",
  "Bàn 03 (Tầng 1 - 6 người)",
  "Bàn 04 (Phòng VIP 1 - 8 người)",
  "Bàn 08 (Ban công tầng 2 - 6 người)",
  "Bàn 12 (Sân vườn - 12 người)",
];

const INITIAL_RESERVATIONS: Reservation[] = [
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
  {
    id: "r5",
    guestName: "Anh Minh Quân (Trễ Hẹn)",
    phone: "0934 888 999",
    guestCount: 5,
    reservationTime: "18:45 - Tối nay",
    dateCategory: "TODAY",
    tableAssigned: "Bàn 03 (Tầng 1 - 6 người)",
    occasion: "BUSINESS",
    depositAmount: 300000,
    depositStatus: "PAID",
    notes: "Báo kẹt xe trễ 15p, đang tính thời gian ân hạn giữ chỗ (Grace Period)",
    source: "PHONE_CALL",
    status: "LATE",
    extendedMinutes: 0,
    createdAt: "18:00 Hôm nay",
  },
];

export const CmsReservationsManagement: React.FC = () => {
  const [reservations, setReservations] = usePersistentState<Reservation[]>("reservations_data", INITIAL_RESERVATIONS);

  // Bộ lọc & Phân trang
  const [filterDate, setFilterDate] = usePersistentState<"ALL" | "TODAY" | "TOMORROW" | "THIS_WEEK">("reservations_filter_date", "ALL");
  const [filterStatus, setFilterStatus] = usePersistentState<string>("reservations_filter_status", "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reservationPage, setReservationPage] = useState(1);
  const PAGE_SIZE = 6;

  // Modal xếp bàn an toàn
  const [tableAssignTarget, setTableAssignTarget] = useState<Reservation | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Modal xử lý No-Show & Tiền cọc (Loss Prevention & Customer Retention SOP)
  const [noShowModalTarget, setNoShowModalTarget] = useState<Reservation | null>(null);
  const [depositResolution, setDepositResolution] = useState<"FORFEIT_PENALTY" | "VOUCHER_CREDIT" | "REFUNDED">("FORFEIT_PENALTY");

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

  // Gia hạn giữ bàn +15 phút (Extend Hold Time SOP)
  const handleExtendReservation = (res: Reservation) => {
    const currentExt = res.extendedMinutes || 0;
    const newExt = currentExt + 15;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === res.id
          ? {
              ...r,
              extendedMinutes: newExt,
              status: "CONFIRMED",
            }
          : r
      )
    );
    toast.success(`Đã gia hạn giữ bàn thêm +15 phút cho khách ${res.guestName}! (Đã gia hạn: +${newExt} phút)`);
  };

  // Đánh dấu khách báo trễ giờ (Grace Period 15p)
  const handleMarkLate = (res: Reservation) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === res.id
          ? {
              ...r,
              status: "LATE",
              lateNotifiedAt: "Quá 15p quy định",
            }
          : r
      )
    );
    toast.warning(`Đã chuyển khách ${res.guestName} sang trạng thái TRỄ GIỜ. Đang tính thời gian ân hạn giữ chỗ 15p.`);
  };

  // Mở modal xử lý nhả bàn & xử lý cọc No-Show
  const handleOpenNoShow = (res: Reservation) => {
    setNoShowModalTarget(res);
    setDepositResolution("FORFEIT_PENALTY");
  };

  // Xác nhận nhả bàn & xử lý cọc No-Show
  const handleConfirmNoShow = () => {
    if (!noShowModalTarget) return;
    const target = noShowModalTarget;
    const hasDeposit = (target.depositAmount || 0) > 0 && target.depositStatus === "PAID";
    const assignedTable = target.tableAssigned || "Bàn";

    setReservations((prev) =>
      prev.map((r) =>
        r.id === target.id
          ? {
              ...r,
              status: "NO_SHOW",
              tableAssigned: "Chưa gán bàn",
              depositResolution: hasDeposit ? depositResolution : undefined,
              notes: (r.notes ? r.notes + " | " : "") +
                (hasDeposit
                  ? depositResolution === "FORFEIT_PENALTY"
                    ? "Thu tiền cọc do vi phạm quá hạn giữ bàn (No-Show)"
                    : depositResolution === "VOUCHER_CREDIT"
                    ? `Đã tạo voucher bảo lưu cọc ${(target.depositAmount || 0).toLocaleString("vi-VN")}đ hạn 30 ngày`
                    : "Đã hoàn trả tiền cọc cho khách"
                  : "Khách không đến, đã nhả bàn đón khách khác"),
            }
          : r
      )
    );

    if (hasDeposit) {
      if (depositResolution === "FORFEIT_PENALTY") {
        toast.warning(`Đã nhả ${assignedTable}! Ghi nhận thu cọc ${(target.depositAmount || 0).toLocaleString("vi-VN")} đ vi phạm No-Show.`);
      } else if (depositResolution === "VOUCHER_CREDIT") {
        toast.success(`Đã nhả ${assignedTable}! Đã cấp Voucher cọc ${(target.depositAmount || 0).toLocaleString("vi-VN")} đ bảo lưu 30 ngày cho khách ${target.guestName}.`);
      } else {
        toast.info(`Đã nhả ${assignedTable} và xác nhận hoàn cọc ${(target.depositAmount || 0).toLocaleString("vi-VN")} đ cho khách ${target.guestName}.`);
      }
    } else {
      toast.info(`Đã giải phóng ${assignedTable} về trạng thái trống để đón tiếp khách khác.`);
    }

    setNoShowModalTarget(null);
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
  const lateCount = reservations.filter((r) => r.status === "LATE").length;
  const arrivedCount = reservations.filter((r) => r.status === "ARRIVED").length;
  const totalDeposits = reservations
    .filter((r) => r.depositStatus === "PAID")
    .reduce((sum, r) => sum + (r.depositAmount || 0), 0);

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Đặt Chỗ", dot: true }}
        tagline={`${reservations.length} lượt đặt • ${totalGuestsToday} khách hôm nay`}
        title="Lịch Đặt Bàn"
        description="Quản lý khách đặt trước, giờ nhận bàn, xếp bàn ăn và tiền đặt cọc giữ chỗ"
        chips={[
          { icon: "users", label: `${totalGuestsToday} Khách hôm nay`, variant: "default" },
          { icon: "clock", label: `${pendingCount} Chờ duyệt`, variant: pendingCount > 0 ? "amber" : "teal", highlight: pendingCount > 0 },
          { icon: "calendarCheck", label: `${confirmedCount} Bàn đã giữ`, variant: "teal" },
          { icon: "vietqr", label: `Tiền cọc: ${totalDeposits.toLocaleString("vi-VN")} đ`, variant: "blue" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openModal("PHONE_CALL")}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
            >
              <Icon name="phone" size={14} />
              <span>+ Đặt Bàn Hotline</span>
            </button>
            <button
              type="button"
              onClick={() => openModal("WALK_IN")}
              className="inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 shrink-0"
              title="Tiếp nhận khách đến ngay"
              aria-label="Tiếp nhận khách đến ngay"
            >
              <Icon name="plus" size={15} />
            </button>
          </div>
        }
      />

      {/* 2. 4 Thẻ Thống Kê Chỉ Số Đặt Bàn */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="users"
          variant="default"
          title="Khách Hôm Nay"
          value={totalGuestsToday}
          unit="khách"
          subtext="khách đã ghi nhận"
          badge="Hôm nay"
        />
        <StatCard
          icon="clock"
          variant="warning"
          title="Chờ Xác Nhận"
          value={pendingCount}
          unit="yêu cầu"
          subtext="cần xác nhận tiếp đón"
          badge={pendingCount > 0 ? "Cần duyệt" : "0 chờ"}
        />
        <StatCard
          icon="calendarCheck"
          variant="success"
          title="Bàn Đã Giữ"
          value={confirmedCount}
          unit="bàn"
          subtext="sẵn sàng tiếp đón"
          badge="Đã chốt"
        />
        <StatCard
          icon="vietqr"
          variant="info"
          title="Tiền Cọc Đã Thu"
          value={totalDeposits.toLocaleString("vi-VN")}
          unit="đ"
          subtext="hoàn tất thu cọc"
          badge="Đã cọc"
        />
      </section>

      {/* DataTableCard: Filter Toolbar + Card List + Pagination */}
      <DataTableCard
        searchPlaceholder="Tìm theo tên khách, số điện thoại, số bàn..."
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setReservationPage(1); }}
        filters={
          <>
            <FilterSelect
              labelPrefix="Ngày: "
              value={filterDate}
              onChange={(val) => { setFilterDate(val as typeof filterDate); setReservationPage(1); }}
              options={[
                { value: "ALL", label: "Tất cả ngày" },
                { value: "TODAY", label: "Hôm nay" },
                { value: "TOMORROW", label: "Ngày mai" },
                { value: "THIS_WEEK", label: "Tuần này" },
              ]}
              className="w-full sm:w-40 shrink-0"
            />
            <FilterSelect
              labelPrefix="Trạng thái: "
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setReservationPage(1); }}
              options={[
                { value: "ALL", label: "Tất cả", count: reservations.length },
                { value: "PENDING", label: "Chờ Duyệt", count: pendingCount },
                { value: "CONFIRMED", label: "Đã Giữ Bàn", count: confirmedCount },
                { value: "LATE", label: "Trễ Giờ (Grace)", count: lateCount },
                { value: "ARRIVED", label: "Đang Tại Quán", count: arrivedCount },
                { value: "NO_SHOW", label: "Vắng Mặt", count: reservations.filter((r) => r.status === "NO_SHOW").length },
                { value: "CANCELLED", label: "Đã Hủy", count: reservations.filter((r) => r.status === "CANCELLED").length },
              ]}
              className="w-full sm:w-44 shrink-0"
            />
          </>
        }
        hasActiveFilters={filterDate !== "ALL" || filterStatus !== "ALL" || searchQuery.trim() !== ""}
        onResetFilters={() => { setFilterDate("ALL"); setFilterStatus("ALL"); setSearchQuery(""); setReservationPage(1); }}
        pagination={{
          currentPage: reservationPage,
          totalItems: filteredReservations.length,
          pageSize: PAGE_SIZE,
          onPageChange: setReservationPage,
        }}
        footer={
          <div className="block md:hidden">
            <MobileInfiniteSentinel
              hasMore={hasMoreReservations}
              totalCount={filteredReservations.length}
              visibleCount={visibleReservationCount}
              sentinelRef={reservationSentinelRef}
            />
          </div>
        }
        scrollable={false}
      >
        {/* Danh Sách Thẻ Đặt Bàn Kiểu Dáng Cao Cấp (Luxury Timeline Cards) */}
        <div className="p-3 sm:p-4 space-y-3">
        {reservations.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-surface-border">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto mb-3 text-brand-900">
              <Icon name="calendarCheck" size={24} />
            </div>
            <h4 className="text-base font-black text-ink-primary">Chưa có lịch đặt bàn nào</h4>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              Tiếp nhận lịch đặt bàn từ hotline hoặc khách vãng lai để giữ chỗ và sắp xếp sơ đồ bàn hiệu quả.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                size="sm"
                className="rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold"
                onClick={() => openModal("PHONE_CALL")}
              >
                <Icon name="phone" className="w-3.5 h-3.5 text-brand-400" />
                <span>Tiếp Nhận Đặt Bàn</span>
              </Button>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-surface-border">
            <div className="w-12 h-12 rounded-2xl bg-surface-canvas flex items-center justify-center mx-auto mb-3 text-ink-muted">
              <Icon name="calendar" size={20} />
            </div>
            <h4 className="text-sm font-bold text-ink-primary">Không tìm thấy lịch đặt bàn nào</h4>
            <p className="text-xs text-ink-muted mt-1">
              Không có lịch đặt bàn nào khớp với bộ lọc hiện tại. Thử đổi bộ lọc hoặc xóa lọc để xem toàn bộ danh sách.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 text-xs font-bold border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                onClick={() => {
                  setFilterDate("ALL");
                  setFilterStatus("ALL");
                  setSearchQuery("");
                  setReservationPage(1);
                }}
              >
                <Icon name="refresh" size={13} />
                <span>Xóa Bộ Lọc</span>
              </Button>
            </div>
          </div>
        ) : (
          displayedReservations.map((res) => {
            const isPending = res.status === "PENDING";
            const isConfirmed = res.status === "CONFIRMED";
            const isArrived = res.status === "ARRIVED";
            const isLate = res.status === "LATE";
            const isNoShow = res.status === "NO_SHOW";
            const isCancelled = res.status === "CANCELLED";

            return (
              <div
                key={res.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all relative overflow-hidden shadow-2xs hover:shadow-md ${
                  isArrived
                    ? "border-emerald-200/80 bg-linear-to-r from-emerald-50/20 to-white"
                    : isLate
                    ? "border-amber-300 bg-amber-50/20 hover:border-amber-500"
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
                      : isLate
                      ? "bg-amber-500 animate-pulse"
                      : isPending
                      ? "bg-amber-400"
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
                          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                            isArrived
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                              : isConfirmed
                              ? "bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs"
                              : isLate
                              ? "bg-amber-50 text-amber-900 border border-amber-400 shadow-2xs animate-pulse"
                              : isPending
                              ? "bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
                              : isNoShow
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isLate && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping inline-block" />}
                          {isArrived
                            ? "Đang tại quán"
                            : isConfirmed
                            ? "Đã giữ bàn"
                            : isLate
                            ? "Trễ giờ (>15p Grace)"
                            : isPending
                            ? "Chờ xác nhận"
                            : isNoShow
                            ? "Vắng mặt"
                            : "Đã hủy"}
                        </span>

                        {Boolean(res.extendedMinutes && res.extendedMinutes > 0) && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                            +{res.extendedMinutes}p gia hạn
                          </span>
                        )}

                        {res.depositResolution && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                            {res.depositResolution === "FORFEIT_PENALTY"
                              ? "Thu cọc vi phạm"
                              : res.depositResolution === "VOUCHER_CREDIT"
                              ? "Voucher cọc 30 ngày"
                              : "Đã hoàn cọc"}
                          </span>
                        )}
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
                  <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-surface-border/50 justify-end flex-wrap">
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

                    {(isConfirmed || isLate) && (
                      <>
                        <button
                          type="button"
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black shadow-xs hover:bg-emerald-800 active:scale-95 transition-all flex items-center gap-1.5"
                          onClick={() => handleCustomerArrived(res)}
                        >
                          <Icon name="checkCircle" size={14} />
                          <span>Đón Khách</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExtendReservation(res)}
                          className="px-2.5 py-2 rounded-xl text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 active:scale-95 transition-all flex items-center gap-1"
                          title="Gia hạn giữ bàn thêm +15 phút"
                        >
                          <Icon name="clock" size={13} />
                          <span>+15p Gia Hạn</span>
                        </button>

                        {isConfirmed && !isLate && (
                          <button
                            type="button"
                            onClick={() => handleMarkLate(res)}
                            className="px-2.5 py-2 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 active:scale-95 transition-all"
                            title="Quá giờ hẹn: Đánh dấu trễ giờ"
                          >
                            Báo Trễ
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenNoShow(res)}
                          className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-95 transition-all flex items-center gap-1"
                          title="Khách không đến: Giải phóng bàn & xử lý cọc"
                        >
                          <Icon name="alert" size={13} />
                          <span>Nhả Bàn (No-Show)</span>
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
      </DataTableCard>

      {/* Modal Tiếp Nhận Đặt Bàn Mới (Hotline/Walk-in) */}
      <NewReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubmit}
        formData={formData}
        setFormData={setFormData}
        availableTables={AVAILABLE_TABLES}
      />

      {/* Modal Xếp / Đổi Bàn Nhanh */}
      <AssignTableModal
        target={tableAssignTarget}
        onClose={() => setTableAssignTarget(null)}
        onConfirm={handleSaveTableAssignment}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        availableTables={AVAILABLE_TABLES}
      />

      {/* MODAL XỬ LÝ NHẢ BÀN & TIỀN CỌC (NO-SHOW SOP) */}
      <NoShowModal
        target={noShowModalTarget}
        onClose={() => setNoShowModalTarget(null)}
        onConfirm={handleConfirmNoShow}
        depositResolution={depositResolution}
        setDepositResolution={setDepositResolution}
      />
    </div>
  );
};
