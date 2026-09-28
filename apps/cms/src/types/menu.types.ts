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
