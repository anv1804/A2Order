import React from "react";
import { Icon } from "@/components/ui";
import { AuthUser } from "@/types";

interface CmsProfileViewProps {
  user: AuthUser;
  currentRole: "STORE_OWNER" | "SUPER_ADMIN";
  onLogout: () => void;
}

export const CmsProfileView: React.FC<CmsProfileViewProps> = ({ user, currentRole, onLogout }) => {
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const roleLabel = isSuperAdmin ? "Super Admin" : "Chủ quán / Quản lý";

  const details = [
    { label: "Email đăng nhập", value: user.email || "Chưa cập nhật", icon: "mail" as const },
    { label: "Vai trò", value: roleLabel, icon: "shield" as const },
    { label: isSuperAdmin ? "Không gian quản trị" : "Cửa hàng", value: isSuperAdmin ? "Nền tảng A2Order" : user.storeName || "Chưa gán cửa hàng", icon: "store" as const },
    ...(!isSuperAdmin && user.storeId ? [{ label: "Mã cửa hàng", value: user.storeId, icon: "building" as const }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d3428] via-[#124937] to-[#176247] p-5 text-white shadow-[0_16px_40px_rgba(13,52,40,.16)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black shadow-inner sm:h-20 sm:w-20 sm:text-3xl">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Hồ sơ tài khoản
              </span>
              <h1 className="mt-2 truncate text-xl font-black tracking-tight sm:text-2xl">{user.name || "Tài khoản quản trị"}</h1>
              <p className="mt-1 truncate text-xs text-emerald-50/75 sm:text-sm">{user.email || "Chưa có email đăng nhập"}</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-emerald-50">
            <Icon name="shield" size={15} /> {roleLabel}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,.8fr)]">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,.035)] sm:p-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">Thông tin tài khoản</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Thông tin đang được sử dụng trong phiên quản trị của bạn.</p>
          </div>
          <dl className="divide-y divide-slate-100">
            {details.map((detail) => (
              <div key={detail.label} className="flex min-w-0 items-start gap-3 py-4 first:pt-4 last:pb-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon name={detail.icon} size={16} /></span>
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] font-medium text-slate-500">{detail.label}</dt>
                  <dd className="mt-1 break-words text-sm font-bold text-slate-900">{detail.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,.035)] sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon name="shield" size={18} /></span>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Phiên bảo mật</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Tài khoản đang đăng nhập và có quyền truy cập vào khu vực quản trị.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Đang hoạt động
            </div>
          </section>
          <section className="rounded-3xl border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
            <h2 className="text-sm font-extrabold text-slate-900">Kết thúc phiên</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Đăng xuất khỏi tài khoản quản trị trên thiết bị này.</p>
            <button type="button" onClick={onLogout} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
              <Icon name="logout" size={15} /> Đăng xuất
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default CmsProfileView;
