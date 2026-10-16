import React, { useState, useMemo } from "react";
import { Button, Icon, Pagination } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useResource } from "@a2order/shared/react";
import { getAuthUser } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { useAntiSpamAction } from "@/hooks/useAntiSpamAction";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import type { Reservation, ReservationDateFilter, ReservationFormData } from "@/types";
import {
  ReservationKpiCards,
  ReservationFilterBar,
  ReservationCardItem,
} from "./components/index.js";
import {
  CreateReservationModal,
  AssignTableModal,
  NoShowResolutionModal,
} from "./modals/index.js";

export const CmsReservationsManagement: React.FC = () => {
  const [reservations, setReservations] = usePersistentState<Reservation[]>("reservations_data", []);
  const storeId = getAuthUser()?.storeId;
  const [zonesData] = useResource<any[]>(storeId ? "/tables/" + storeId : null, []);
  const arrival = useAntiSpamAction("reservation-arrive", (payload: unknown, key) =>
    requestApi("/workforce/reservation-arrive", {
      method: "POST",
      headers: { "x-idempotency-key": key },
      body: JSON.stringify(payload),
    })
  );

  const availableTables = useMemo(() => {
    if (!zonesData || zonesData.length === 0) return [];
    return zonesData.flatMap((z) => (z.tables || []).map((t: any) => `${t.name} (${z.name || "Khu vực"} - ${t.capacity || 4} chỗ)`));
  }, [zonesData]);

  // Bộ lọc & Phân trang
  const [filterDate, setFilterDate] = usePersistentState<ReservationDateFilter>("reservations_filter_date", "ALL");
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
  const [formData, setFormData] = useState<ReservationFormData>({
    guestName: "",
    phone: "",
    guestCount: 4,
    reservationTime: "19:00 - Tối nay",
    dateCategory: "TODAY",
    tableAssigned: availableTables[0] || "Chưa gán bàn",
    occasion: "GENERAL",
    depositAmount: 0,
    depositStatus: "UNPAID",
    notes: "",
    source: "PHONE_CALL",
  });

  const openModal = (source: "PHONE_CALL" | "WALK_IN") => {
    setFormData((prev) => ({ ...prev, source, tableAssigned: availableTables[0] || "Chưa gán bàn" }));
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

    if (
      !(await setReservations((prev) =>
        prev.map((r) =>
          r.id === res.id
            ? {
                ...r,
                status: "CONFIRMED",
                tableAssigned:
                  r.tableAssigned === "Chưa gán bàn" ? (availableTables[0] || "Chưa gán bàn") : r.tableAssigned,
              }
            : r
        )
      ))
    )
      return;
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

    const table = zonesData.flatMap((z) => z.tables || []).find((t: any) => res.tableAssigned === t.name || res.tableAssigned?.startsWith(t.name + " ("));
    if (!table) {
      toast.warning("Vui lòng gán một bàn hợp lệ trước khi đón khách");
      return;
    }
    try {
      if (await arrival.execute({ reservationId: res.id, tableId: table.id })) toast.success(`Đã mở bàn đón khách ${res.guestName}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Gia hạn giữ bàn +15 phút
  const handleExtendReservation = async (res: Reservation) => {
    const currentExt = res.extendedMinutes || 0;
    const newExt = currentExt + 15;
    if (
      !(await setReservations((prev) =>
        prev.map((r) =>
          r.id === res.id
            ? {
                ...r,
                extendedMinutes: newExt,
                status: "CONFIRMED",
              }
            : r
        )
      ))
    )
      return;
    toast.success(`Đã gia hạn giữ bàn thêm +15 phút cho khách ${res.guestName}! (Đã gia hạn: +${newExt} phút)`);
  };

  // Đánh dấu khách báo trễ giờ (Grace Period 15p)
  const handleMarkLate = async (res: Reservation) => {
    if (
      !(await setReservations((prev) =>
        prev.map((r) =>
          r.id === res.id
            ? {
                ...r,
                status: "LATE",
                lateNotifiedAt: "Quá 15p quy định",
              }
            : r
        )
      ))
    )
      return;
    toast.warning(`Đã chuyển khách ${res.guestName} sang trạng thái TRỄ GIỜ. Đang tính thời gian ân hạn giữ chỗ 15p.`);
  };

  // Mở modal xử lý nhả bàn & xử lý cọc No-Show
  const handleOpenNoShow = (res: Reservation) => {
    setNoShowModalTarget(res);
    setDepositResolution("FORFEIT_PENALTY");
  };

  // Xác nhận nhả bàn & xử lý cọc No-Show
  const handleConfirmNoShow = async () => {
    if (!noShowModalTarget) return;
    const target = noShowModalTarget;
    const hasDeposit = (target.depositAmount || 0) > 0 && target.depositStatus === "PAID";
    if (hasDeposit && depositResolution === "VOUCHER_CREDIT") {
      toast.info("Chưa hỗ trợ bảo lưu cọc tự động thành voucher");
      return;
    }
    const assignedTable = target.tableAssigned || "Bàn";

    if (
      !(await setReservations((prev) =>
        prev.map((r) =>
          r.id === target.id
            ? {
                ...r,
                status: "NO_SHOW",
                tableAssigned: "Chưa gán bàn",
                depositResolution: hasDeposit ? depositResolution : undefined,
                notes:
                  (r.notes ? r.notes + " | " : "") +
                  (hasDeposit
                    ? depositResolution === "FORFEIT_PENALTY"
                      ? "Thu tiền cọc do vi phạm quá hạn giữ bàn (No-Show)"
                      : depositResolution === "VOUCHER_CREDIT"
                      ? `Đã tạo voucher bảo lưu cọc ${(target.depositAmount || 0).toLocaleString("vi-VN")}đ hạn 30 ngày`
                      : "Quán ghi nhận đã hoàn cọc thủ công cho khách"
                    : "Khách không đến, đã nhả bàn đón khách khác"),
              }
            : r
        )
      ))
    )
      return;

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

    if (!(await setReservations((prev) => prev.map((r) => (r.id === res.id ? { ...r, status: "CANCELLED" } : r))))) return;
    toast.warning(`Đã từ chối lịch đặt bàn của khách ${res.guestName}.`);
  };

  // Mở modal gán bàn
  const handleOpenAssignTable = (res: Reservation) => {
    setTableAssignTarget(res);
    setSelectedTable(res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? res.tableAssigned : availableTables[0] || "Chưa gán bàn");
  };

  // Lưu gán bàn an toàn
  const handleSaveTableAssignment = async () => {
    if (!tableAssignTarget) return;
    if (
      !(await setReservations((prev) =>
        prev.map((r) =>
          r.id === tableAssignTarget.id
            ? {
                ...r,
                tableAssigned: selectedTable,
                status: r.status === "PENDING" ? "CONFIRMED" : r.status,
              }
            : r
        )
      ))
    )
      return;
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

    if (!(await setReservations((prev) => prev.map((r) => (r.id === res.id ? { ...r, depositStatus: nextStatus } : r))))) return;
    toast.success(`Đã cập nhật tiền cọc khách ${res.guestName} thành công!`);
  };

  // Thêm mới đặt bàn
  const handleCreateSubmit = async (e: React.FormEvent) => {
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

    if (!(await setReservations([newRes, ...reservations]))) return;
    setIsModalOpen(false);
    toast.success(`Đã tạo lịch đặt bàn mới cho ${newRes.guestName} thành công!`);
    setFormData({
      guestName: "",
      phone: "",
      guestCount: 4,
      reservationTime: "19:00 - Tối nay",
      dateCategory: "TODAY",
      tableAssigned: availableTables[0] || "Chưa gán bàn",
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
      !q || r.guestName.toLowerCase().includes(q) || r.phone.includes(q) || (r.tableAssigned || "").toLowerCase().includes(q);
    return matchDate && matchStatus && matchSearch;
  });

  // Phân trang
  const paginatedReservations = filteredReservations.slice((reservationPage - 1) * PAGE_SIZE, reservationPage * PAGE_SIZE);

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
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Tiêu đề & Nút tạo mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Lịch Đặt Bàn
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200">
              Đặt Chỗ
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Quản lý khách đặt trước, giờ nhận bàn và tiền cọc
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

      {/* 4 Thẻ Thống Kê */}
      <ReservationKpiCards
        totalGuestsToday={totalGuestsToday}
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        totalDeposits={totalDeposits}
      />

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <ReservationFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setReservationPage(1);
        }}
        filterDate={filterDate}
        onFilterDateChange={(date) => {
          setFilterDate(date);
          setReservationPage(1);
        }}
        filterStatus={filterStatus}
        onFilterStatusChange={(status) => {
          setFilterStatus(status);
          setReservationPage(1);
        }}
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        lateCount={lateCount}
        arrivedCount={arrivedCount}
        totalCount={reservations.length}
      />

      {/* Danh Sách Thẻ Đặt Bàn */}
      <div className="space-y-3">
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
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang khung thời gian khác
            </p>
          </div>
        ) : (
          displayedReservations.map((res) => (
            <ReservationCardItem
              key={res.id}
              reservation={res}
              onConfirm={handleConfirmReservation}
              onArrive={handleCustomerArrived}
              onExtend={handleExtendReservation}
              onMarkLate={handleMarkLate}
              onOpenNoShow={handleOpenNoShow}
              onOpenAssignTable={handleOpenAssignTable}
              onToggleDeposit={handleToggleDeposit}
              onReject={handleRejectReservation}
            />
          ))
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

      {/* Modals */}
      <CreateReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        availableTables={availableTables}
        onSubmit={handleCreateSubmit}
      />

      <AssignTableModal
        target={tableAssignTarget}
        onClose={() => setTableAssignTarget(null)}
        availableTables={availableTables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        onSave={handleSaveTableAssignment}
      />

      <NoShowResolutionModal
        target={noShowModalTarget}
        onClose={() => setNoShowModalTarget(null)}
        depositResolution={depositResolution}
        onSelectResolution={setDepositResolution}
        onConfirm={handleConfirmNoShow}
      />
    </div>
  );
};
