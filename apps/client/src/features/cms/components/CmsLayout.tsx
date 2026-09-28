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
    <div className="h-screen w-screen overflow-hidden bg-surface-canvas flex font-sans text-ink-primary">
      {/* 1. Fixed Left Sidebar (Cố định 100% chiều cao màn hình, không bao giờ bị cuộn theo nội dung) */}
      <div className="hidden lg:block h-full shrink-0 z-30">
        <CmsSidebar
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          onLogout={onLogout}
        />
      </div>

      {/* 2. Main Work Area (Chứa Header cố định + Content cuộn độc lập) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Sticky/Fixed Header */}
        <div className="sticky top-0 z-20 shrink-0 bg-surface-canvas/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 pt-4 pb-2 border-b border-surface-border/60">
          <div className="max-w-7xl mx-auto w-full">
            <CmsTopNav
              userName="Nguyễn Thành An"
              userEmail="an.owner@a2order.vn"
            />
          </div>
        </div>

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
