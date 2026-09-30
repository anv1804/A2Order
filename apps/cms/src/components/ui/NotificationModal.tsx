import React, { useEffect } from "react";
import { Icon } from "./Icon";

export const NotificationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const notifications = [
    { id: 1, type: "alert", title: "Cảnh báo tải CPU", desc: "Tải CPU của Node.js Gateway vượt quá 85%.", time: "2 phút trước", icon: "server", color: "text-amber-500", bg: "bg-amber-50" },
    { id: 2, type: "payment", title: "Thanh toán thành công", desc: "Quán The Coffee House vừa thanh toán hóa đơn 5,990,000đ.", time: "1 giờ trước", icon: "dollar", color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: 3, type: "expire", title: "Sắp hết hạn", desc: "Phở Lý Quốc Sư còn 3 ngày sử dụng.", time: "2 giờ trước", icon: "clock", color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end sm:p-4 animate-fadeIn" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm sm:hidden" />
      <div 
        className="relative bg-white w-full h-full sm:h-auto sm:w-[400px] sm:rounded-[24px] shadow-2xl flex flex-col overflow-hidden sm:mt-14 sm:mr-4 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">Thông báo</h3>
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3 mới</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition">
            <Icon name="x" size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {notifications.map(n => (
            <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.bg} ${n.color}`}>
                <Icon name={n.icon as any} size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2">{n.time}</p>
              </div>
            </div>
          ))}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
              <Icon name="check" size={24} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-500">Đó là tất cả thông báo</p>
          </div>
        </div>
      </div>
    </div>
  );
};
