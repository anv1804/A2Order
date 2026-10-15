import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { NotificationModalProps } from "@/types";

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

  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: "CALL" | "KDS" | "SYSTEM";
    title: string;
    description: string;
    time: string;
    unread: boolean;
  }>>([]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

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
            {unreadCount > 0 && (
              <Badge variant="danger" className="text-[10px]">
                {unreadCount} Mới
              </Badge>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-canvas hover:bg-surface-border text-ink-muted hover:text-ink-primary transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-canvas/50">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-800 mb-3">
                <Icon name="bell" className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-ink-primary">Không có thông báo mới</p>
              <p className="text-xs text-ink-muted mt-1 max-w-[220px]">
                Thông báo gọi phục vụ, bếp hoàn tất món và cập nhật ca làm việc sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white p-3 rounded-2xl border border-surface-border shadow-2xs relative overflow-hidden group ${!item.unread ? 'opacity-60' : ''}`}
              >
                <div 
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    item.type === 'CALL' ? 'bg-red-500' : item.type === 'KDS' ? 'bg-brand-500' : 'bg-slate-400'
                  }`}
                />
                <div className="pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      item.type === 'CALL' ? 'text-red-600' : item.type === 'KDS' ? 'text-brand-700' : 'text-ink-muted'
                    }`}>
                      <Icon name={item.type === 'CALL' ? 'bell' : item.type === 'KDS' ? 'checkCircle' : 'info'} className="w-3.5 h-3.5" />
                      {item.type === 'CALL' ? 'Gọi Phục Vụ' : item.type === 'KDS' ? 'Bếp Báo Xong' : 'Hệ Thống'}
                    </span>
                    <span className="text-[10px] text-ink-muted font-medium">{item.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-ink-primary mb-0.5">{item.title}</p>
                  <p className="text-xs text-ink-muted">{item.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-surface-border bg-white">
            <Button variant="outline" className="w-full text-xs font-bold" onClick={handleMarkAllRead}>
              Đánh dấu đã đọc tất cả
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
