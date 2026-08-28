export type StatusType =
  | "Pending"
  | "Active / Verified"
  | "In Review"
  | "Approved"
  | "Rejected"
  | "Inactive"
  | "In Progress"
  | "Complete";

export interface MemberRecord {
  id: string;
  name: string;
  avatar: string;
  memberId: string;
  savingAmount: number;
  status: StatusType;
  phone?: string;
  idType?: string;
  idNumber?: string;
  createdAt?: string;
}

export interface StatMetric {
  id: string;
  title: string;
  value: string;
  numericValue?: number;
  currency?: string;
  variant: "gradient-blue" | "dark-slate";
  trend: "up" | "down";
  trendPercentage?: string;
}

export interface ChartDataPoint {
  month: string;
  savings: number;
  loans: number;
  members: number;
  highlight?: boolean;
}
