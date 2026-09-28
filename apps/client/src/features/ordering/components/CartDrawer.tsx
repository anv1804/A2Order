import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Trash2, Send } from "lucide-react";
import { Button, Drawer } from "@/components/ui";
import { CartDrawerProps } from "@/types";

export const CartDrawer: React.FC<CartDrawerProps> = ({
  tableName,
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onSubmitOrder,
}) => {
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="text-xs text-slate-500">Tạm tính:</span>
        <div className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</div>
      </div>
      <Button
        size="lg"
        onClick={onSubmitOrder}
        disabled={items.length === 0}
        className="flex-1 gap-2"
      >
        <Send className="w-4 h-4" />
        GỬI BẾP
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Đơn gọi món: ${tableName}`}
      subtitle={`${items.length} món trong giỏ`}
      footer={footer}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
              <p className="text-xs font-semibold text-blue-600">{formatCurrency(item.price)}</p>
              {item.notes && <p className="text-[11px] text-amber-600 italic">"{item.notes}"</p>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95"
              >
                {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : "-"}
              </button>
              <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
};
