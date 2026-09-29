import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
    } else if (isVisible) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-ink-primary/40 backdrop-blur-sm transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`} 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div 
        className={`relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isAnimatingOut ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-ink-primary text-lg">Thông Báo</h2>
            <Badge variant="danger" className="text-[10px]">2 Mới</Badge>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-canvas hover:bg-surface-border text-ink-muted hover:text-ink-primary transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-canvas/50">
          {/* Notification Items */}
          <div className="bg-white p-3 rounded-2xl border border-surface-border shadow-2xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"></div>
            <div className="pl-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <Icon name="bell" className="w-3.5 h-3.5" /> Gọi Phục Vụ
                </span>
                <span className="text-[10px] text-ink-muted font-medium">1 phút trước</span>
              </div>
              <p className="text-sm font-semibold text-ink-primary mb-0.5">Bàn 04 đang gọi</p>
              <p className="text-xs text-ink-muted">Khách yêu cầu lấy thêm đá và giấy ăn.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-surface-border shadow-2xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-500"></div>
            <div className="pl-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                  <Icon name="checkCircle" className="w-3.5 h-3.5" /> Bếp Báo Xong
                </span>
                <span className="text-[10px] text-ink-muted font-medium">5 phút trước</span>
              </div>
              <p className="text-sm font-semibold text-ink-primary mb-0.5">Bàn 01 - Đã xong 2 món</p>
              <p className="text-xs text-ink-muted">1x Phở Tái Nạm, 1x Bún Chả. Đang chờ tại quầy lấy đồ.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-surface-border shadow-2xs opacity-60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-ink-muted flex items-center gap-1">
                <Icon name="info" className="w-3.5 h-3.5" /> Hệ Thống
              </span>
              <span className="text-[10px] text-ink-muted font-medium">1 giờ trước</span>
            </div>
            <p className="text-sm font-semibold text-ink-primary mb-0.5">Đã chốt ca sáng</p>
            <p className="text-xs text-ink-muted">Quản lý [Chị Mai] đã chốt ca và bàn giao.</p>
          </div>
        </div>

        <div className="p-4 border-t border-surface-border bg-white">
          <Button variant="outline" className="w-full text-xs font-bold">
            Đánh dấu đã đọc tất cả
          </Button>
        </div>
      </div>
    </div>
  );
};
