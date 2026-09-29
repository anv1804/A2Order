export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedVariant?: string;
  selectedOptions?: string[];
}

export interface CartDrawerProps {
  tableName: string;
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSubmitOrder: () => void;
}
