export type NavSection =
  | 'members'
  | 'transactions'
  | 'reports'
  | 'compliance'
  | 'risk'
  | 'assets'
  | 'audit'
  | 'demo'
  | 'settings'
  | 'support'
  | 'profile';

export interface SaccoMember {
  id: string;
  fullName: string;
  faydaId: string;
  email: string;
  phone: string;
  membershipType: 'Full' | 'Associate' | 'Institutional';
  branch: string;
  savingsBalance: number;
  shareCapital: number;
  loanBalance: number;
  status: 'active' | 'pending' | 'suspended' | 'flagged';
  joinedDate: string;
  verifiedByFayda: boolean;
  occupation: string;
}

export type BadgeStatusType =
  | 'compliant'
  | 'non_compliant'
  | 'high_risk'
  | 'pending'
  | 'open'
  | 'in_review'
  | 'mitigated'
  | 'accepted'
  | 'active'
  | 'under_maintenance'
  | 'decommissioned'
  | 'success'
  | 'warning'
  | 'failed'
  | string;

export type SaccoStatusType = 'Compliant' | 'Non-Compliant' | 'Pending' | 'High Risk';

export type RiskLevelType = 'Low' | 'Medium' | 'High' | 'Unknown';

export interface Vendor {
  id: string;
  name: string;
  status: SaccoStatusType;
  lastAuditCost: number | null; // null if masked or unknown
  riskLevel: RiskLevelType;
  auditScore?: number;
  notes?: string;
  dateAdded: string;
}

export interface RiskItem {
  id: string;
  title: string;
  category: 'Infrastructure' | 'Data Privacy' | 'Access Control' | 'Third-Party' | 'Operational';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  likelihood: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Review' | 'Mitigated' | 'Accepted';
  owner: string;
  score: number;
}

export interface AssetItem {
  id: string;
  name: string;
  type: 'Server' | 'Database' | 'Cloud Resource' | 'Workstation' | 'API Gateway';
  classification: 'Confidential' | 'Restricted' | 'Internal' | 'Public';
  owner: string;
  status: 'Active' | 'Under Maintenance' | 'Decommissioned';
  lastScanDate: string;
  vulnerabilityCount: number;
  location: string;
}

export interface SaccoAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'Authentication' | 'Data Entry' | 'Compliance' | 'Risk Action' | 'Settings';
  details: string;
  status: 'Success' | 'Warning' | 'Failed';
  ipAddress: string;
}

export interface ComplianceFramework {
  id: string;
  code: string;
  name: string;
  score: number;
  totalControls: number;
  passedControls: number;
  pendingControls: number;
  failedControls: number;
  description: string;
  lastAuditDate: string;
}

export interface SaccoUserProfile {
  name: string;
  email: string;
  role: string;
  title: string;
  department: string;
  phone: string;
  location: string;
  mfaEnabled: boolean;
  clearance: string;
  avatarUrl: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

export interface FinancialMetric {
  id: string;
  label: string;
  amount: number;
  formattedAmount: string;
  type: 'budget' | 'fine' | 'saving';
  isMasked: boolean;
}
