export interface CmsMetric {
  id: string;
  title: string;
  value: string | number;
  changeText: string;
  isFeatured?: boolean;
}

export interface CmsStaffShift {
  id: string;
  name: string;
  role: string;
  task: string;
  avatar: string;
  status: "Completed" | "In Progress" | "Pending";
}

export interface CmsProjectItem {
  id: string;
  name: string;
  time: string;
  color: string;
}

export interface CmsAnalyticsBar {
  label: string;
  heightPercent: number;
  isPeak?: boolean;
  isHatched?: boolean;
  peakLabel?: string;
}
