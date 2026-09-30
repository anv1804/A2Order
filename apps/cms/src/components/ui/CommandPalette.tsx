import React, { useEffect, useRef } from "react";
import { Icon } from "./Icon";

export const CommandPalette = ({ isOpen, onClose, searchQuery, setSearchQuery, matchingNavigation, onSelect }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 animate-fadeIn" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-[24px] shadow-2xl overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 sm:p-5 border-b border-slate-100">
          <Icon name="search" size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-1 text-sm sm:text-base text-slate-900 bg-transparent outline-none placeholder:text-slate-400 font-medium"
            placeholder="Tìm kiếm phân hệ, tính năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
            ESC
          </kbd>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {matchingNavigation.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 font-medium">
              Không tìm thấy kết quả nào cho "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Kết quả tìm kiếm
              </div>
              {matchingNavigation.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 text-left group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-emerald-600 shadow-sm transition">
                      <Icon name="activity" size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{item.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.hint}</p>
                    </div>
                  </div>
                  <Icon name="arrowRight" size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-emerald-500 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
