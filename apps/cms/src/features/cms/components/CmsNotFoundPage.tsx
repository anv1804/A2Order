import React from "react";
import { Button, Icon, Panel } from "@/components/ui";
import { CmsAppRole } from "@/types/cms.types";
import { AuthUser } from "@/types";

interface CmsNotFoundPageProps {
  currentRole: CmsAppRole;
  attemptedMenu?: string;
  currentUser?: AuthUser | null;
  onGoHome: () => void;
  onLogout?: () => void;
}

const ROLE_LABELS: Record<CmsAppRole, string> = {
  SUPER_ADMIN: "Quản Trị Viên Nền Tảng (Super Admin)",
  STORE_OWNER: "Chủ Nhà Hàng / Cửa Hàng",
  ACCOUNTANT: "Kế Toán Quán",
  CASHIER: "Thu Ngân Bán Hàng",
  CHEF: "Bếp Trưởng / Pha Chế",
  WAITER: "Nhân Viên Phục Vụ",
};

export const CmsNotFoundPage: React.FC<CmsNotFoundPageProps> = ({
  currentRole,
  attemptedMenu,
  currentUser,
  onGoHome,
  onLogout,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-4 animate-fadeIn">
      <Panel className="max-w-lg w-full p-8 sm:p-10 text-center bg-white border border-slate-200/90 rounded-3xl shadow-lg shadow-emerald-950/5 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-100 rounded-full blur-3xl pointer-events-none opacity-60" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-100 rounded-full blur-3xl pointer-events-none opacity-60" />

        {/* 404 Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200/80 mb-6 text-slate-800 shadow-inner">
          <Icon name="alertCircle" size={40} className="text-amber-500" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200">
            Lỗi 404 • Không Tìm Thấy Trang
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Trang Không Tồn Tại Hoặc Không Có Quyền
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed pt-1">
            Phân hệ <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">/{attemptedMenu || "trang"}</span> không nằm trong danh mục quyền hạn của tài khoản của bạn hoặc đường dẫn đã thay đổi.
          </p>
        </div>

        {/* User context card */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
          <div className="flex justify-between text-slate-500">
            <span>Tài khoản:</span>
            <span className="font-bold text-slate-900">{currentUser?.name || "Người dùng"}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Vai trò đăng nhập:</span>
            <span className="font-semibold text-emerald-800">{ROLE_LABELS[currentRole] || currentRole}</span>
          </div>
          {currentUser?.storeName && (
            <div className="flex justify-between text-slate-500">
              <span>Cửa hàng:</span>
              <span className="font-semibold text-slate-800">{currentUser.storeName}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onGoHome}
            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 shadow-sm"
          >
            <Icon name="home" size={16} className="mr-2" />
            Về Trang Làm Việc Chính
          </Button>

          {onLogout && (
            <Button
              variant="outline"
              size="md"
              onClick={onLogout}
              className="w-full sm:w-auto text-slate-600 border-slate-300 hover:bg-slate-50 font-semibold"
            >
              <Icon name="logout" size={16} className="mr-2" />
              Đăng Nhập Tài Khoản Khác
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
};
