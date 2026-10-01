import React, { useState, useEffect } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { FnbCategoryTemplate, FnbMajorCategory, FNB_MAJOR_CONFIG } from "@a2order/shared";
import { useUnsavedEditor } from "@/hooks/useUnsavedEditor";

export interface AddCategoryModalProps {
  isOpen: boolean;
  initialMajorType?: FnbMajorCategory;
  onClose: () => void;
  onSave: (category: Omit<FnbCategoryTemplate, "id">) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  initialMajorType = "FOOD",
  onClose,
  onSave,
}) => {
  const [majorType, setMajorType] = useState<FnbMajorCategory>(initialMajorType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const { requestClose } = useUnsavedEditor("category_modal", isOpen, JSON.stringify({ majorType, name, description }), onClose);

  useEffect(() => {
    if (isOpen) {
      setMajorType(initialMajorType);
      setName("");
      setDescription("");
      setError("");
    }
  }, [isOpen, initialMajorType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }

    onSave({
      name: name.trim(),
      majorType,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const currentCfg = FNB_MAJOR_CONFIG[majorType];

  return (
    <Portal>
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={requestClose}
        />

        {/* Modal Dialog */}
        <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-elevated border border-surface-border p-4 sm:p-6 z-10 animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 shrink-0">
                <Icon name={currentCfg.icon as any} className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-ink-primary truncate">Thêm Danh Mục Mới</h3>
                <p className="text-[11px] sm:text-xs text-ink-muted truncate">Tạo nhóm thực đơn con vào kho mẫu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="p-1.5 rounded-xl text-ink-muted hover:text-ink-primary hover:bg-surface-canvas transition-colors shrink-0"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3.5 sm:space-y-4">
            {/* 1. Chọn Trụ Cột Chính */}
            <div>
              <label className="block text-[11px] sm:text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5 sm:mb-2">
                Trụ Cột Thực Đơn <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
                  ([key, cfg]) => {
                    const isSelected = majorType === key;
                    const label = key === "DESSERT" ? "Tráng Miệng" : cfg.label;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMajorType(key)}
                        className={`h-9 sm:h-10 rounded-xl border text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 text-[10px] sm:text-xs font-bold shadow-2xs ${
                          isSelected
                            ? "border-brand-900 bg-brand-900 text-white shadow-sm"
                            : "border-surface-border bg-surface-canvas hover:bg-white text-ink-secondary hover:text-ink-primary hover:border-brand-200"
                        }`}
                      >
                        <Icon
                          name={cfg.icon as any}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? "text-white" : "text-brand-800"}`}
                        />
                        <span className="whitespace-nowrap">{label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 2. Tên danh mục */}
            <div>
              <label className="block text-[11px] sm:text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                Tên Danh Mục Chi Tiết <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="VD: Cơm & Món Mặn, Trà Sữa..."
                className={`w-full h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800 ${
                  error ? "border-rose-500 bg-rose-50/30" : "border-surface-border"
                }`}
                autoFocus
              />
              {error && <p className="text-[11px] text-rose-600 font-bold mt-1">{error}</p>}
            </div>

            {/* 3. Mô tả ngắn */}
            <div>
              <label className="block text-[11px] sm:text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                Mô Tả Gợi Ý (Tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Gợi ý đặc trưng của nhóm này..."
                className="w-full p-2.5 sm:p-3 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 resize-none"
              />
            </div>

            {/* Footer Buttons: Cân đối 50-50 trên mobile, whitespace-nowrap chống xuống dòng */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-border sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-4 rounded-xl font-bold text-xs border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas justify-center whitespace-nowrap"
                onClick={requestClose}
              >
                Hủy Bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-5 rounded-xl font-bold text-xs bg-brand-900 hover:bg-brand-950 text-white justify-center shadow-xs whitespace-nowrap"
              >
                Lưu Danh Mục
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
