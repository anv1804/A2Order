import React, { useState } from "react";
import { CmsSidebar } from "./CmsSidebar";
import { CmsTopNav } from "./CmsTopNav";

interface CmsLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const CmsLayout: React.FC<CmsLayoutProps> = ({ children, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  return (
    <div className="min-h-screen bg-surface-canvas flex font-sans text-ink-primary">
      {/* Left Sidebar phong cách Donezo (ẩn trên màn hình nhỏ di động) */}
      <div className="hidden lg:block">
        <CmsSidebar
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <CmsTopNav
          userName="Nguyễn Thành An"
          userEmail="an.owner@a2order.vn"
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};
