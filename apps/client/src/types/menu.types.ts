export interface MenuItemData {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  categoryName?: string;
}

export interface DishOption {
  id: string;
  name: string;
  priceModifier?: number;
}

export interface DishOptionGroup {
  id: string;
  name: string;
  type?: "SINGLE" | "MULTIPLE";
  required?: boolean;
  options: DishOption[];
}


export interface DishVariantItem {
  id: string;
  name: string;
  price: number;
}

export interface MenuDishItem {
  id: string;
  name: string;
  category: "PHO_BUN" | "NUONG_LAU" | "KHAI_VI" | "DOUONG";
  categoryLabel: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  variants?: DishVariantItem[];
  optionGroups?: DishOptionGroup[];
}

export interface MenuItemCardProps {
  item: MenuItemData;
  onAddToCart?: (item: MenuItemData) => void;
  onToggleStock?: (itemId: string, available: boolean) => void;
  showAdminControls?: boolean;
}

export interface MenuDashboardProps {
  menuItems: (MenuItemData & { category: string })[];
  onToggleStock: (id: string, available: boolean) => void;
}


