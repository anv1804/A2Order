import { FnbDishItem, ModifierOption, DishVariantOption, BusinessType } from "@a2order/shared";

export interface MenuItemData {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  categoryName?: string;
}

export interface MenuItemCardProps {
  item: MenuItemData;
  onAddToCart?: (item: MenuItemData) => void;
  onToggleStock?: (itemId: string, available: boolean) => void;
  showAdminControls?: boolean;
}

export interface StockEditModalProps {
  dish: FnbDishItem | null;
  onClose: () => void;
  onSave: (dishId: string, newStock: number) => void;
}

export interface EditDishModalProps {
  dish: FnbDishItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (updatedDish: FnbDishItem) => void;
}

export interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSubmit: (dishData: {
    name: string;
    category: string;
    price: number;
    costPrice: number;
    station: "KITCHEN" | "BAR" | "DESSERT";
    image: string;
    description: string;
    isBestSeller: boolean;
    stockCount: number;
    modifiers: ModifierOption[];
    variants: DishVariantOption[];
  }) => void;
}

