import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Drawer, Icon } from "@/components/ui";
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
        <span className="text-xs text-ink-muted">Tạm tính:</span>
        <div className="text-xl font-black text-brand-950">{formatCurrency(totalAmount)}</div>
      </div>
      <Button
        size="lg"
        onClick={onSubmitOrder}
        disabled={items.length === 0}
        className="flex-1 gap-2 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-black"
      >
        <Icon name="send" className="w-4 h-4 text-white" size={16} />
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
          <div key={item.id} className="flex items-center justify-between bg-surface-canvas p-3 rounded-2xl border border-surface-border">
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-ink-primary truncate">{item.name}</h4>
              <p className="text-xs font-bold text-brand-800">{formatCurrency(item.price)}</p>
              {item.notes && <p className="text-[11px] text-amber-700 italic">"{item.notes}"</p>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="w-8 h-8 rounded-xl bg-white border border-surface-border text-ink-primary flex items-center justify-center font-bold active:scale-95 shadow-sm"
              >
                {item.quantity === 1 ? <Icon name="trash" className="w-3.5 h-3.5 text-rose-500" size={14} /> : "-"}
              </button>
              <span className="w-6 text-center font-black text-sm text-ink-primary">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="w-8 h-8 rounded-xl bg-brand-900 text-white flex items-center justify-center font-bold active:scale-95 shadow-sm"
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
