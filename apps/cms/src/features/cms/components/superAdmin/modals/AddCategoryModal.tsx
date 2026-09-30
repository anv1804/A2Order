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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={requestClose}
        />

        {/* Modal Dialog */}
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated border border-surface-border p-6 z-10 animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900">
                <Icon name={currentCfg.icon as any} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">Thêm Danh Mục Mới</h3>
                <p className="text-xs text-ink-muted">Tạo nhóm thực đơn con vào kho mẫu nền tảng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="p-1.5 rounded-xl text-ink-muted hover:text-ink-primary hover:bg-surface-canvas transition-colors"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 1. Chọn Trụ Cột Chính */}
            <div>
              <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-2">
                Trụ Cột Thực Đơn <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
                  ([key, cfg]) => {
                    const isSelected = majorType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMajorType(key)}
                        className={`p-2.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "border-brand-900 bg-brand-50 shadow-xs text-brand-950 font-black"
                            : "border-surface-border bg-white hover:border-brand-300 text-ink-secondary"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-brand-900 text-white" : "bg-surface-canvas text-ink-muted"
                          }`}
                        >
                          <Icon name={cfg.icon as any} className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">{cfg.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 2. Tên danh mục */}
            <div>
              <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                Tên Danh Mục Chi Tiết <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="VD: Cơm Thố Xèo Xèo, Món Nướng Hàn Quốc..."
                className={`w-full h-10 px-3.5 rounded-xl border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800 ${
                  error ? "border-rose-500 bg-rose-50/30" : "border-surface-border"
                }`}
                autoFocus
              />
              {error && <p className="text-[11px] text-rose-600 font-bold mt-1">{error}</p>}
            </div>

            {/* 3. Mô tả ngắn */}
            <div>
              <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                Mô Tả Gợi Ý (Tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Gợi ý đặc trưng của nhóm này..."
                className="w-full p-3 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold text-xs" onClick={requestClose}>
                Hủy Bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-brand-900 text-white font-black text-xs px-5 shadow-sm"
              >
                + Lưu Danh Mục
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
