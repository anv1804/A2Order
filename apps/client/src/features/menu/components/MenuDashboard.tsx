import React, { useMemo, useState } from "react";
import { MenuItemCard } from "@/features/menu/components/MenuItemCard";
import { MenuItemData } from "@/types";
import { toast } from "@/stores/notificationStore";
import { Icon } from "@/components/ui/Icon";

interface MenuDashboardProps {
  menuItems: (MenuItemData & { category: string })[];
  onToggleStock: (id: string, available: boolean) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  PHO: "Phở & Bún",
  COM: "Cơm & Đồ Ăn Kèm",
  DRINK: "Đồ Uống",
  LAU: "Lẩu & Nướng",
  KHAI_VI: "Khai Vị",
  OTHER: "Khác",
};

export const MenuDashboard: React.FC<MenuDashboardProps> = ({ menuItems, onToggleStock }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const cat = item.category || "OTHER";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof menuItems>);
  }, [filteredItems]);

  const categories = ["ALL", ...Array.from(new Set(menuItems.map(m => m.category || "OTHER")))];

  return (
    <div className="w-full max-w-3xl mx-auto pb-12 animate-fadeIn">
      {/* Tiêu đề & Hướng dẫn */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">Kiểm Soát Món Ăn</h2>
        <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5">Gạt công tắc để tạm ngưng nhận món (Báo Hết 86)</p>
      </div>

      {/* Sticky Thanh Công Cụ Lọc */}
      <div className="sticky top-16 z-30 bg-surface-canvas/95 backdrop-blur-xl py-3 border-b border-surface-border shadow-sm -mx-3 px-3 sm:mx-0 sm:px-0 sm:rounded-b-2xl mb-4">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm món ăn..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-500 transition-colors shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategory === cat
                    ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                    : "bg-white text-ink-muted border-surface-border hover:text-ink-primary hover:bg-surface-hover"
                }`}
              >
                {cat === "ALL" ? "Tất cả" : (CATEGORY_NAMES[cat] || cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách món ăn */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([catKey, items]) => (
          <div key={catKey} className="space-y-3">
            <h3 className="text-sm font-black text-ink-primary uppercase tracking-widest flex items-center gap-2 opacity-90">
              {CATEGORY_NAMES[catKey] || catKey}
              <span className="text-ink-muted text-[10px] font-bold bg-surface-border/50 px-2 py-0.5 rounded-md normal-case">
                {items.length} món
              </span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  showAdminControls
                  onToggleStock={(id, avail) => {
                    onToggleStock(id, avail);
                    toast.warning(`Đã đổi trạng thái "${item.name}": ${avail ? "Đang bán" : "Đã hết"}`);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedItems).length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-surface-border border-dashed">
            <Icon name="search" className="w-8 h-8 text-ink-subtle mb-2" />
            <span className="text-ink-muted text-sm font-bold">Không tìm thấy món ăn nào</span>
          </div>
        )}
      </div>
    </div>
  );
};
