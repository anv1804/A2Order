import React, { useState } from "react";
import { CmsSidebar } from "./CmsSidebar";
import { CmsTopNav } from "./CmsTopNav";

import { CmsLayoutProps } from "@/types/cms.types";

export const CmsLayout: React.FC<CmsLayoutProps> = ({
  children,
  onLogout,
  activeMenu,
  onSelectMenu,
  currentRole,
  onChangeRole,
  enabledModules = [],
}) => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-canvas flex font-sans text-ink-primary">
      {/* 1. Fixed Left Sidebar */}
      <div className="hidden lg:block h-full shrink-0 z-30">
        <CmsSidebar
          activeMenu={activeMenu}
          onSelectMenu={onSelectMenu}
          onLogout={onLogout}
          currentRole={currentRole}
          onChangeRole={onChangeRole}
          enabledModules={enabledModules}
        />
      </div>

      {/* 2. Main Work Area (Chứa Header cố định + Content cuộn độc lập) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Fixed Header: Solid background to avoid stacking context glitches */}
        <header className="sticky top-0 z-10 shrink-0 bg-surface-canvas px-6 lg:px-8 pt-3.5 pb-2.5 border-b border-surface-border">
          <div className="w-full">
            <CmsTopNav
              userName={currentRole === "SUPER_ADMIN" ? "Quản Trị Viên A2Order" : "Nguyễn Thành An"}
              userEmail={currentRole === "SUPER_ADMIN" ? "superadmin@a2order.vn" : "an.owner@a2order.vn"}
            />
          </div>
        </header>

        {/* Scrollable Main Content Container with generous padding */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
