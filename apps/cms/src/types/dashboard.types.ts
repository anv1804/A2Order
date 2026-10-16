export interface CmsLiveStats {
  totalRevenue: number;
  totalOrders: number;
  discountTotal: number;
  vietqrPct: number;
  cashTotal: number;
  vietqrTotal: number;
  occupiedTables: number;
  totalTables: number;
  activeStaff: number;
  lowStockCount: number;
  pendingTickets: number;
}

export interface CmsDashboardHeroBannerProps {
  currentRole: string;
  isAccountant: boolean;
  isCashier: boolean;
  liveStats: CmsLiveStats;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}

export interface CmsBentoKpiGridProps {
  isAccountant: boolean;
  isCashier: boolean;
  liveStats: CmsLiveStats;
  onNavigateTab?: (tab: string) => void;
}

export interface CmsUrgentAlertsAndStationsProps {
  liveStats: CmsLiveStats;
  onNavigateTab?: (tab: string) => void;
}

export interface CmsShiftStaffCarouselProps {
  staffList: any[];
  onNavigateTab?: (tab: string) => void;
}

export interface CmsHourlyRevenueChartProps {
  bills: any[];
  liveStats: CmsLiveStats;
}

export interface CmsTopDishesSectionProps {
  bills: any[];
  onNavigateTab?: (tab: string) => void;
}

export interface CmsRecentOrdersSectionProps {
  bills: any[];
}
