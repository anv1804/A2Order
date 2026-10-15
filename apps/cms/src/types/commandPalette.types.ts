import { IconName } from "./icon.types.js";
import { CmsAppRole } from "./cms.types.js";

export interface SubAction {
  id: string;
  label: string;
  desc: string;
  icon: IconName;
  shortcut?: string;
}

export interface ModuleItem {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  category: "core" | "operations" | "menu" | "finance" | "settings";
  categoryLabel: string;
  color: string;
  bg: string;
  badgeColor: string;
  subActions: SubAction[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingNavigation?: any[];
  onSelect: (menuId: string) => void;
  currentRole?: CmsAppRole;
}
