import React, { useState, useEffect, useMemo } from "react";
import { Button, Icon, Portal, SearchableSelect, SearchableSelectOption } from "@/components/ui";
import {
  TenantStoreRecord,
  SoftwareInvoiceRecord,
  BUSINESS_TYPE_CONFIG,
  AppModule,
  PlatformStoreUserRecord,
} from "@/types/cms.types";
import { APP_MODULE_CATALOG } from "@a2order/shared";
import { staffApi } from "@/services/api/staffApi";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { StoreUserModal } from "./StoreUserModal";
import { BUSINESS_TYPE_ICONS } from "./StoreOnboardingModal";

export interface StoreDossierModalProps {
  store: TenantStoreRecord | null;
  invoices: SoftwareInvoiceRecord[];
  stores?: TenantStoreRecord[];
  onClose: () => void;
  onCopyKey: (key: string) => void;
  onOpenRenewModal: (store: TenantStoreRecord) => void;
  onToggleModule: (storeId: string, moduleId: AppModule) => void;
  onToggleStoreStatus: (store: TenantStoreRecord) => void;
  onDeleteStore?: (store: TenantStoreRecord) => void;
  onViewInvoice: (invoice: SoftwareInvoiceRecord) => void;
  onUpdateStore?: (store: TenantStoreRecord) => void;
}

export const StoreDossierModal: React.FC<StoreDossierModalProps> = ({
  store,
  invoices,
  stores,
  onClose,
  onCopyKey,
  onOpenRenewModal,
  onToggleModule,
  onToggleStoreStatus,
  onDeleteStore,
  onViewInvoice,
  onUpdateStore,
}) => {
  if (!store) return null;

  const storeInvoices = invoices.filter((i) => i.storeId === store.id);

  // Danh sách nhân sự & chủ quán của quán này
  const [staffList, setStaffList] = useState<
    Array<{
      id: string;
      name: string;
      email: string | null;
      role: string;
      isActive: boolean;
    }>
  >([]);

  const [allPlatformUsers, setAllPlatformUsers] = useState<PlatformStoreUserRecord[]>([]);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // Đồng bộ danh sách nhân sự khi modal mở hoặc store thay đổi
  useEffect(() => {
    if (store) {
      if (store.staffList && store.staffList.length > 0) {
        setStaffList(store.staffList);
      } else if (store.owner) {
        setStaffList([
          {
            id: `owner-${store.id}`,
            name: store.owner,
            email: store.ownerEmail || null,
            role: "STORE_OWNER",
            isActive: store.status === "ACTIVE",
          },
        ]);
      } else {
        setStaffList([]);
      }
      setSelectedUserToAssign("");
    }
  }, [store]);

  // Tải danh sách tất cả người dùng nền tảng để cho phép gán vào quán
  useEffect(() => {
    staffApi
      .getStaff()
      .then((res) => {
        if (Array.isArray(res)) {
          setAllPlatformUsers(res);
        }
      })
      .catch(() => {});
  }, [store?.id]);

  // Danh sách người dùng có thể gán (chưa thuộc quán này)
  const assignableUsers = useMemo(() => {
    const currentIds = new Set(staffList.map((s) => s.id));
    const currentEmails = new Set(staffList.map((s) => (s.email || "").toLowerCase()).filter(Boolean));

    const pool: PlatformStoreUserRecord[] = [...allPlatformUsers];

    // Fallback: gom từ stores nếu danh sách rỗng
    if (pool.length === 0 && stores) {
      stores.forEach((s) => {
        if (s.staffList) {
          s.staffList.forEach((st) => {
            if (!pool.some((p) => p.id === st.id)) {
              pool.push({
                id: st.id,
                name: st.name,
                email: st.email || "",
                role: st.role,
                isActive: st.isActive,
                pinCode: "1111",
                createdAt: s.activatedAt || "",
                storeId: s.id,
                storeName: s.name,
              });
            }
          });
        } else if (s.owner && !pool.some((p) => p.name === s.owner)) {
          pool.push({
            id: `owner-${s.id}`,
            name: s.owner,
            email: s.ownerEmail || "",
            role: "STORE_OWNER",
            isActive: s.status === "ACTIVE",
            pinCode: "1111",
            createdAt: s.activatedAt || "",
            storeId: s.id,
            storeName: s.name,
          });
        }
      });
    }

    return pool.filter((u) => {
      if (currentIds.has(u.id)) return false;
      if (u.email && currentEmails.has(u.email.toLowerCase())) return false;
      return true;
    });
  }, [allPlatformUsers, staffList, stores]);

  const assignableUserOptions: SearchableSelectOption[] = useMemo(() => {
    return assignableUsers.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.email || u.role})`,
      badge: u.storeName ? u.storeName : u.role,
    }));
  }, [assignableUsers]);

  const handleAssignUser = async () => {
    if (!selectedUserToAssign || !store) return;
    const targetUser = assignableUsers.find((u) => u.id === selectedUserToAssign);
    if (!targetUser) return;

    setIsAssigning(true);
    try {
      try {
        await staffApi.updateStaff(targetUser.id, { storeId: store.id });
      } catch {
        // Fallback
      }

      const newStaffItem = {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email || null,
        role: targetUser.role,
        isActive: targetUser.isActive,
      };
      const updatedList = [...staffList, newStaffItem];
      setStaffList(updatedList);
      if (onUpdateStore) {
        onUpdateStore({ ...store, staffList: updatedList });
      }
      setSelectedUserToAssign("");
      toast.success(`Đã gán thành công "${targetUser.name}" vào ${store.name}!`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveNewUser = async (userData: Partial<PlatformStoreUserRecord>, password?: string) => {
    if (!store) return;
    try {
      let createdId = `st-${Date.now()}`;
      try {
        const res = await staffApi.createStaff({
          storeId: store.id,
          name: userData.name || "",
          email: userData.email,
          role: userData.role || "STORE_MANAGER",
          pinCode: userData.pinCode || "1111",
          password: password,
          isActive: userData.isActive !== false,
        });
        if (res?.id) createdId = res.id;
      } catch {
        // Fallback
      }

      const newStaffItem = {
        id: createdId,
        name: userData.name || "Nhân sự mới",
        email: userData.email || null,
        role: userData.role || "STORE_MANAGER",
        isActive: userData.isActive !== false,
      };
      const updatedList = [...staffList, newStaffItem];
      setStaffList(updatedList);
      if (onUpdateStore) {
        onUpdateStore({ ...store, staffList: updatedList });
      }
      setIsCreateUserModalOpen(false);
      toast.success(`Đã tạo và gán tài khoản "${userData.name}" vào ${store.name}!`);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tạo tài khoản.");
    }
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!store) return;
    const isOwner = staffList.find((s) => s.id === staffId)?.role === "STORE_OWNER";
    const ownerCount = staffList.filter((s) => s.role === "STORE_OWNER").length;
    if (isOwner && ownerCount <= 1) {
      toast.error("Không thể gỡ Chủ Quán duy nhất. Cửa hàng cần ít nhất 1 tài khoản quản trị.");
      return;
    }

    if (
      !(await confirmDialog({
        title: "Gỡ Tài Khoản Khỏi Quán?",
        message: `Bạn có chắc muốn gỡ tài khoản "${staffName}" khỏi quán "${store.name}"?`,
        confirmText: "Gỡ Khỏi Quán",
        variant: "danger",
      }))
    ) {
      return;
    }

    try {
      await staffApi.updateStaff(staffId, { storeId: "" });
    } catch {
      // Fallback
    }

    const updatedList = staffList.filter((s) => s.id !== staffId);
    setStaffList(updatedList);
    if (onUpdateStore) {
      onUpdateStore({ ...store, staffList: updatedList });
    }
    toast.info(`Đã gỡ "${staffName}" khỏi quán.`);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-primary/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[96dvh] sm:max-h-[92dvh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-surface-border bg-surface-canvas shrink-0 gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 shadow-2xs shrink-0">
                <Icon
                  name={store.businessType ? BUSINESS_TYPE_ICONS[store.businessType] || "store" : "store"}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-ink-primary tracking-tight truncate max-w-[160px] xs:max-w-[210px] sm:max-w-none">
                    {store.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      store.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : store.status === "EXPIRING_SOON"
                        ? `bg-amber-100 text-amber-800 border border-amber-200`
                        : store.status === "EXPIRED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {store.status === "ACTIVE"
                      ? "Đang hoạt động"
                      : store.status === "EXPIRING_SOON"
                      ? `Sắp hết hạn (${store.daysLeft} ngày)`
                      : store.status === "EXPIRED"
                      ? "Hết hạn"
                      : "Tạm khóa"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5 truncate">
                  Mã: <span className="font-mono font-bold text-ink-primary">{store.id}</span> • Loại hình:{" "}
                  <span className="font-bold text-brand-900">
                    {store.businessType && BUSINESS_TYPE_CONFIG[store.businessType]?.label
                      ? BUSINESS_TYPE_CONFIG[store.businessType].label
                      : "Nhà hàng & F&B"}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition shrink-0 cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Dossier Body */}
          <div className="overflow-y-auto flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain">
            {/* Card 1: Bản quyền & Gói thuê */}
            <div className="p-3 sm:p-4 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-brand-200/60 pb-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-brand-900 uppercase tracking-wider block">
                    Bản Quyền Phần Mềm
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                    <span className="font-mono text-xs sm:text-sm font-black text-brand-950 bg-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-brand-200 shadow-2xs truncate">
                      {store.licenseKey}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopyKey(store.licenseKey)}
                      className="p-1 sm:p-1.5 text-brand-800 hover:text-brand-950 hover:bg-white rounded-lg transition border border-transparent hover:border-brand-200 cursor-pointer shrink-0"
                      title="Sao chép License Key"
                    >
                      <Icon name="clipboard" size={14} />
                    </button>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-black shadow-2xs ${
                    store.plan === "PRO" ? "bg-purple-100 text-purple-900 border border-purple-200" :
                    store.plan === "GROWTH" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                    "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  }`}>
                    Gói {store.plan}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-ink-muted text-[10px] block">Kích hoạt:</span>
                  <span className="font-bold text-ink-primary text-[11px] sm:text-xs">{store.activatedAt}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Hết hạn:</span>
                  <span className="font-bold text-ink-primary text-[11px] sm:text-xs">{store.expiresAt}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[10px] block">Còn lại:</span>
                  <span className={`font-black text-[11px] sm:text-xs ${store.daysLeft <= 3 ? "text-rose-600" : "text-emerald-700"}`}>
                    {store.daysLeft} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Thông tin liên hệ & Hạ tầng POS (Tối giản icon trực tiếp, không chú thích rườm rà) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2.5">
                <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block">
                  Đại Diện Quán
                </span>
                <div className="space-y-2 font-medium">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon name="userCheck" size={14} />
                    </div>
                    <span className="font-bold text-ink-primary text-xs truncate">{store.owner}</span>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center shrink-0">
                      <Icon name="phone" size={14} />
                    </div>
                    <a href={`tel:${store.phone}`} className="font-bold text-xs text-brand-900 hover:underline truncate">
                      {store.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Icon name="building" size={14} />
                    </div>
                    <span className="text-xs text-ink-primary truncate" title={store.address}>{store.address}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2.5">
                <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block">
                  Hạ Tầng Kết Nối & Thiết Bị POS
                </span>
                <div className="space-y-2 font-medium">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center shrink-0">
                      <Icon name="monitor" size={14} />
                    </div>
                    <span className="font-bold text-xs text-ink-primary truncate">
                      {store.activeDevices} / {store.plan === "PRO" ? 10 : store.plan === "GROWTH" ? 4 : 2} thiết bị POS & KDS
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon name="clock" size={14} />
                    </div>
                    <span className="font-bold text-xs text-emerald-700 flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>{store.lastSync ? `Đồng bộ: ${store.lastSync}` : "Chưa ghi nhận đồng bộ thiết bị"}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-700 flex items-center justify-center shrink-0">
                      <Icon name="server" size={14} />
                    </div>
                    <span className="font-mono text-xs font-bold text-ink-primary bg-slate-100 px-2 py-0.5 rounded-md truncate">
                      POS {store.configVer.startsWith("v") ? store.configVer : `v${store.configVer}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Tài Khoản & Nhân Sự Quán (Users & Staff - Hỗ trợ gán user có sẵn hoặc tạo mới) */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                    Tài Khoản & Nhân Sự (Store Users & Staff)
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Danh sách tài khoản Chủ quán và nhân sự có quyền truy cập hệ thống của quán này.
                  </p>
                </div>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full shrink-0">
                  {staffList.length} tài khoản
                </span>
              </div>

              {/* Thanh Gán User Có Sẵn hoặc Tạo User Mới */}
              <div className="p-2.5 rounded-2xl bg-white border border-surface-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    options={assignableUserOptions}
                    value={selectedUserToAssign}
                    onChange={setSelectedUserToAssign}
                    placeholder="Chọn tài khoản có sẵn để gán vào quán..."
                    searchPlaceholder="Tìm theo tên hoặc email nhân sự..."
                    showSearch={true}
                    triggerClassName="h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleAssignUser}
                    disabled={!selectedUserToAssign || isAssigning}
                    className="inline-flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Gán tài khoản đã chọn vào quán này"
                  >
                    <Icon name="userCheck" size={13} />
                    <span>Gán Vào Quán</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(true)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-900 text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Tạo mới một tài khoản và gán trực tiếp vào quán này"
                  >
                    <Icon name="plus" size={13} />
                    <span>Tạo Thêm</span>
                  </button>
                </div>
              </div>

              {staffList.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border border-surface-border text-center text-xs text-ink-muted italic">
                  Chưa ghi nhận tài khoản nhân sự nào cho quán này. Hãy gán tài khoản có sẵn hoặc tạo mới ở trên.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {staffList.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-2xl bg-white border border-surface-border flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-ink-primary truncate">{st.name}</div>
                          <div className="text-[10px] text-ink-muted truncate">{st.email || "Đăng nhập bằng mã PIN"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.role === "STORE_OWNER"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : st.role === "STORE_MANAGER"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : st.role === "CASHIER"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {st.role === "STORE_OWNER"
                            ? "Chủ Quán"
                            : st.role === "STORE_MANAGER"
                            ? "Quản Lý"
                            : st.role === "CASHIER"
                            ? "Thu Ngân"
                            : st.role === "CHEF"
                            ? "Bếp KDS"
                            : "Nhân Viên"}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            st.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          title={st.isActive ? "Đang hoạt động" : "Đã khóa"}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(st.id, st.name)}
                          className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                          title="Gỡ tài khoản khỏi quán"
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Cấu hình Module Tính Năng (Feature Flags - Dynamic Toggle) */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                    Cấp Quyền Module Tính Năng (Feature Flags)
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Admin có thể bật/tắt tức thì các module cho quán. Quyền sẽ đồng bộ tự động tới máy POS/KDS.
                  </p>
                </div>
                <span className="text-[10px] text-brand-900 font-bold bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full shrink-0">
                  Đang bật {store.modules.length}/{APP_MODULE_CATALOG.length} modules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {APP_MODULE_CATALOG.map((mod) => {
                  const isEnabled = store.modules.includes(mod.id);
                  const isCore = mod.id === AppModule.CORE_POS;

                  return (
                    <div
                      key={mod.id}
                      className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-white border-brand-200 shadow-xs"
                          : "bg-surface-muted/40 border-surface-border opacity-75"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-ink-primary truncate">
                            {mod.name}
                          </span>
                          {isCore && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Bắt buộc
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink-muted line-clamp-2 leading-relaxed">
                          {mod.description}
                        </p>
                        <div className="text-[10px] font-bold text-brand-900">
                          {mod.monthlyPrice.toLocaleString("vi-VN")} đ/tháng
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {isCore ? (
                          <span className="px-2 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Icon name="checkCircle" className="w-3 h-3 text-emerald-600" />
                            Khóa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleModule(store.id, mod.id)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-150 shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer select-none ${
                              isEnabled
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-800"
                            }`}
                          >
                            <Icon
                              name={isEnabled ? "check" : "power"}
                              className="w-3.5 h-3.5"
                            />
                            <span>{isEnabled ? "Đang Bật" : "Tắt"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 4: Quản lý Thiết Bị POS & KDS Đang Đăng Nhập */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                    Thiết Bị Đang Đăng Nhập (Hardware Access Control)
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Danh sách thiết bị đã nhận diện. Thao tác thu hồi cần dịch vụ quản lý thiết bị trên máy chủ.
                  </p>
                </div>
                <span className="text-[10px] text-ink-secondary font-bold bg-white border border-surface-border px-2.5 py-0.5 rounded-full shrink-0">
                  {(store.terminals || []).length} máy kết nối
                </span>
              </div>

              {(!store.terminals || store.terminals.length === 0) ? (
                <div className="p-4 rounded-xl bg-white border border-surface-border text-center text-xs text-ink-muted italic">
                  Chưa ghi nhận thiết bị nào đăng nhập bằng License Key này.
                </div>
              ) : (
                <div className="space-y-2">
                  {store.terminals.map((term) => (
                    <div
                      key={term.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-white border border-surface-border text-xs gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          term.role === "POS_CASHIER"
                            ? "bg-brand-50 text-brand-900 border border-brand-200"
                            : term.role === "KITCHEN_KDS"
                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                            : term.role === "BAR_KDS"
                            ? "bg-purple-50 text-purple-900 border border-purple-200"
                            : "bg-blue-50 text-blue-900 border border-blue-200"
                        }`}>
                          <Icon
                            name={
                              term.role === "POS_CASHIER"
                                ? "cashier"
                                : term.role === "KITCHEN_KDS"
                                ? "kitchen"
                                : term.role === "BAR_KDS"
                                ? "store"
                                : "smartphone"
                            }
                            className="w-4 h-4"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-ink-primary truncate">
                              {term.name}
                            </span>
                            <span className="text-[10px] font-bold text-ink-secondary px-1.5 py-0.2 rounded bg-surface-muted">
                              {term.role === "POS_CASHIER"
                                ? "Thu Ngân"
                                : term.role === "KITCHEN_KDS"
                                ? "Bếp KDS"
                                : term.role === "BAR_KDS"
                                ? "Pha Chế"
                                : "Tablet Phục Vụ"}
                            </span>
                          </div>
                          <div className="text-[10px] text-ink-muted mt-0.5">
                            IP: <span className="font-mono text-ink-primary">{term.ipAddress}</span> • App: {term.appVersion} • Đồng bộ: {term.lastSync}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          term.status === "ONLINE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${term.status === "ONLINE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          {term.status === "ONLINE" ? "Online" : "Offline"}
                        </span>

                        <button
                          type="button"
                          disabled
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed"
                          title="Máy chủ chưa hỗ trợ thu hồi thiết bị"
                        >
                          Chưa hỗ trợ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 5: Lịch sử hóa đơn thuê phần mềm của quán */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-ink-primary uppercase tracking-wider block">
                Hóa Đơn Cước Thuê Của Quán
              </span>
              {storeInvoices.length === 0 ? (
                <p className="text-xs text-ink-muted italic">Chưa có hóa đơn cước phần mềm nào cho quán này.</p>
              ) : (
                <div className="space-y-2">
                  {storeInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink-primary">{inv.invoiceCode}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inv.status === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
                          </span>
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {inv.plan} • {inv.durationMonths} tháng • {inv.createdAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-brand-900">{inv.finalAmount.toLocaleString("vi-VN")} đ</span>
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white border border-surface-border text-ink-primary hover:border-brand-300 hover:text-brand-900 shadow-xs transition-colors"
                        >
                          Xem VietQR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-surface-border bg-surface-canvas shrink-0">
            {/* Mobile layout: Primary button full-width on row 1, secondary buttons side-by-side on row 2 */}
            <div className="flex flex-col sm:hidden gap-2">
              <Button
                type="button"
                size="sm"
                className="w-full h-10 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
                onClick={() => onOpenRenewModal(store)}
              >
                <Icon name="creditCard" size={14} />
                <span>Gia Hạn Hợp Đồng Key</span>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`h-9 rounded-xl text-xs font-bold truncate ${
                    store.status === "SUSPENDED"
                      ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      : "text-amber-700 border-amber-300 hover:bg-amber-50"
                  }`}
                  onClick={() => onToggleStoreStatus(store)}
                >
                  {store.status === "SUSPENDED" ? "Mở Khóa Quán" : "Tạm Khóa Quán"}
                </Button>
                {onDeleteStore && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 truncate flex items-center justify-center gap-1"
                    onClick={() => onDeleteStore(store)}
                  >
                    <Icon name="trash" size={13} />
                    <span>Xóa Quán</span>
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={onClose}
              >
                Đóng Hồ Sơ
              </Button>
            </div>

            {/* Desktop layout: standard 1-row layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`rounded-xl text-xs font-bold ${
                    store.status === "SUSPENDED"
                      ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      : "text-amber-700 border-amber-300 hover:bg-amber-50"
                  }`}
                  onClick={() => onToggleStoreStatus(store)}
                >
                  {store.status === "SUSPENDED" ? "Mở Khóa Quán" : "Tạm Khóa Quán Này"}
                </Button>

                {onDeleteStore && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 flex items-center gap-1.5"
                    onClick={() => onDeleteStore(store)}
                  >
                    <Icon name="trash" size={13} />
                    <span>Xóa Hồ Sơ Quán</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                  onClick={onClose}
                >
                  Đóng Hồ Sơ
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold hover:bg-brand-800"
                  onClick={() => onOpenRenewModal(store)}
                >
                  Gia Hạn Hợp Đồng Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tạo Mới User Cho Quán Này */}
      <StoreUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSave={handleSaveNewUser}
        editingUser={null}
        stores={stores && stores.length > 0 ? stores : [store]}
        defaultStoreId={store.id}
      />
    </Portal>
  );
};
