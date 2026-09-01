import {
  Vendor,
  RiskItem,
  AssetItem,
  SaccoAuditLog,
  ComplianceFramework,
  SaccoUserProfile,
  NotificationItem,
  FinancialMetric,
  SaccoMember,
} from '@/types/isms';

export const initialVendors: Vendor[] = [
  { id: 'v-1', name: 'Acme Corp Solutions', status: 'Compliant', lastAuditCost: 12450.00, riskLevel: 'Low', auditScore: 94, notes: 'Annual ISO 27001 audit passed with zero major non-conformities.', dateAdded: '2026-01-15' },
  { id: 'v-2', name: 'Global Tech Systems', status: 'Non-Compliant', lastAuditCost: 8200.00, riskLevel: 'High', auditScore: 58, notes: 'Missing MFA enforcement across administrative endpoints.', dateAdded: '2026-02-01' },
  { id: 'v-3', name: 'DataSync Cloud Services', status: 'Pending', lastAuditCost: null, riskLevel: 'Unknown', auditScore: 72, notes: 'SOC 2 report under review by external security team.', dateAdded: '2026-03-10' },
  { id: 'v-4', name: 'SecureNet Infrastructure', status: 'Compliant', lastAuditCost: 45100.00, riskLevel: 'Medium', auditScore: 88, notes: 'Penetration testing remediations completed in Q2.', dateAdded: '2026-03-22' },
  { id: 'v-5', name: 'Quantum Stack AI', status: 'High Risk', lastAuditCost: 28900.00, riskLevel: 'High', auditScore: 49, notes: 'Unencrypted API credentials detected in staging environment.', dateAdded: '2026-04-05' },
  { id: 'v-6', name: 'CloudGuard Protection', status: 'Compliant', lastAuditCost: 18300.00, riskLevel: 'Low', auditScore: 96, notes: 'SOC 2 Type II certified. Zero vulnerabilities outstanding.', dateAdded: '2026-04-12' },
  { id: 'v-7', name: 'Horizon FinTech SaaS', status: 'Pending', lastAuditCost: 5600.00, riskLevel: 'Medium', auditScore: 76, notes: 'Awaiting updated PCI-DSS compliance attestation document.', dateAdded: '2026-05-01' },
  { id: 'v-8', name: 'Apex Cyber Intelligence', status: 'Non-Compliant', lastAuditCost: 31000.00, riskLevel: 'High', auditScore: 52, notes: 'Failed annual vulnerability remediation SLA deadline.', dateAdded: '2026-05-18' },
  { id: 'v-9', name: 'Nexus Data Warehouse', status: 'Compliant', lastAuditCost: 22100.00, riskLevel: 'Low', auditScore: 91, notes: 'Encrypted at rest with AES-256 and custom KMS key management.', dateAdded: '2026-06-02' },
  { id: 'v-10', name: 'OmniAuth Identity Provider', status: 'High Risk', lastAuditCost: 19500.00, riskLevel: 'High', auditScore: 45, notes: 'SSO endpoint latency degradation and missing SAML log redundancy.', dateAdded: '2026-06-14' },
  { id: 'v-11', name: 'Vanguard Storage Cluster', status: 'Compliant', lastAuditCost: 14800.00, riskLevel: 'Low', auditScore: 98, notes: 'Disaster recovery failover tested successfully with 2min RTO.', dateAdded: '2026-06-25' },
  { id: 'v-12', name: 'Sentinel Monitoring Pro', status: 'Pending', lastAuditCost: 9300.00, riskLevel: 'Medium', auditScore: 81, notes: 'Security questionnaire submitted; awaiting auditor approval.', dateAdded: '2026-07-01' },
  { id: 'v-13', name: 'Aether Cloud Edge', status: 'Compliant', lastAuditCost: 34200.00, riskLevel: 'Low', auditScore: 92, notes: 'DDOS mitigation shields verified up to 500Gbps traffic spike.', dateAdded: '2026-07-12' },
  { id: 'v-14', name: 'Biotrack Health API', status: 'Non-Compliant', lastAuditCost: 11000.00, riskLevel: 'High', auditScore: 61, notes: 'HIPAA audit highlighted unmasked log data in dev logs.', dateAdded: '2026-07-19' },
  { id: 'v-15', name: 'CipherLock Analytics', status: 'Compliant', lastAuditCost: 16700.00, riskLevel: 'Low', auditScore: 95, notes: 'GDPR compliance validated with zero user data leaks.', dateAdded: '2026-07-28' },
  { id: 'v-16', name: 'Dynamic Edge CDN', status: 'Pending', lastAuditCost: 12000.00, riskLevel: 'Medium', auditScore: 78, notes: 'TLS certificate rotation automation check pending.', dateAdded: '2026-08-01' },
  { id: 'v-17', name: 'Elysium Backup Systems', status: 'Compliant', lastAuditCost: 27500.00, riskLevel: 'Low', auditScore: 97, notes: 'Immutable backup snapshots verified against ransomware attack models.', dateAdded: '2026-08-04' },
  { id: 'v-18', name: 'Fortress Gateway Inc', status: 'High Risk', lastAuditCost: 41000.00, riskLevel: 'High', auditScore: 41, notes: 'Critical zero-day vulnerability flagged in edge firewall software.', dateAdded: '2026-08-06' },
  { id: 'v-19', name: 'GridLock Network Ops', status: 'Compliant', lastAuditCost: 15400.00, riskLevel: 'Medium', auditScore: 89, notes: 'Network segmentation rules verified between dev and prod environments.', dateAdded: '2026-08-08' },
  { id: 'v-20', name: 'Hyperion AI Search', status: 'Pending', lastAuditCost: 8900.00, riskLevel: 'Unknown', auditScore: 74, notes: 'AI model safety guardrail audit scheduled for next week.', dateAdded: '2026-08-09' },
  { id: 'v-21', name: 'IronClad Vault Services', status: 'Compliant', lastAuditCost: 52000.00, riskLevel: 'Low', auditScore: 99, notes: 'Hardware Security Module (HSM) keys audited and verified.', dateAdded: '2026-08-10' },
  { id: 'v-22', name: 'Jove Data Pipeline', status: 'Non-Compliant', lastAuditCost: 13800.00, riskLevel: 'High', auditScore: 56, notes: 'Unrestricted egress rules configured on secondary cluster.', dateAdded: '2026-08-11' },
  { id: 'v-23', name: 'Krypton Key Management', status: 'Compliant', lastAuditCost: 29000.00, riskLevel: 'Low', auditScore: 93, notes: 'Automatic 90-day secret rotation policy active.', dateAdded: '2026-08-11' },
  { id: 'v-24', name: 'Luminous Security Hub', status: 'Compliant', lastAuditCost: 38400.00, riskLevel: 'Low', auditScore: 96, notes: 'Central ISMS platform node running with 99.99% uptime.', dateAdded: '2026-08-12' },
];

export const initialFinancialMetrics: FinancialMetric[] = [
  { id: 'm-1', label: 'Total Audit Budget', amount: 1250000.00, formattedAmount: 'ETB 1,250,000.00', type: 'budget', isMasked: false },
  { id: 'm-2', label: 'Compliance Fines', amount: -45200.00, formattedAmount: '-ETB 45,200.00', type: 'fine', isMasked: false },
  { id: 'm-3', label: 'Projected Savings', amount: 12500.00, formattedAmount: '+ETB 12,500.00', type: 'saving', isMasked: false },
];

export const initialRisks: RiskItem[] = [
  { id: 'RSK-101', title: 'Unpatched Third-Party Dependency in Auth Service', category: 'Third-Party', impact: 'High', likelihood: 'Medium', status: 'Open', owner: 'Liya (Security Lead)', score: 82 },
  { id: 'RSK-102', title: 'Missing Multi-Factor Authentication on Legacy Admin Portal', category: 'Access Control', impact: 'Critical', likelihood: 'High', score: 95, status: 'In Review', owner: 'DevOps Team' },
  { id: 'RSK-103', title: 'Public S3 Storage Bucket Misconfiguration', category: 'Data Privacy', impact: 'High', likelihood: 'Low', score: 68, status: 'Mitigated', owner: 'Cloud Ops' },
  { id: 'RSK-104', title: 'Single Point of Failure in Production Database', category: 'Infrastructure', impact: 'Critical', likelihood: 'Low', score: 75, status: 'Open', owner: 'Database Ops' },
  { id: 'RSK-105', title: 'Vendor API Rate Limit Exhaustion', category: 'Operational', impact: 'Medium', likelihood: 'Medium', score: 50, status: 'Accepted', owner: 'Integration Lead' },
];

export const initialAssets: AssetItem[] = [
  { id: 'AST-001', name: 'AWS US-East Kubernetes Production Cluster', type: 'Server', classification: 'Confidential', owner: 'Cloud Infrastructure Team', status: 'Active', lastScanDate: '2026-08-11', vulnerabilityCount: 0, location: 'us-east-1 (N. Virginia)' },
  { id: 'AST-002', name: 'Customer PII PostgreSQL Database', type: 'Database', classification: 'Restricted', owner: 'Data Engineering', status: 'Active', lastScanDate: '2026-08-10', vulnerabilityCount: 1, location: 'us-east-1a' },
  { id: 'AST-003', name: 'Central OAuth2 Gateway Server', type: 'API Gateway', classification: 'Confidential', owner: 'Identity Management Team', status: 'Active', lastScanDate: '2026-08-12', vulnerabilityCount: 0, location: 'eu-west-1 (Ireland)' },
  { id: 'AST-004', name: 'CISO Workstation - Mac Pro M3', type: 'Workstation', classification: 'Confidential', owner: 'Liya (CISO)', status: 'Active', lastScanDate: '2026-08-12', vulnerabilityCount: 0, location: 'HQ Office - Sec Lab' },
  { id: 'AST-005', name: 'Legacy Staging Redis Cache Cluster', type: 'Cloud Resource', classification: 'Internal', owner: 'QA Testing Team', status: 'Under Maintenance', lastScanDate: '2026-08-01', vulnerabilityCount: 3, location: 'us-central1' },
];

export const initialAuditLogs: SaccoAuditLog[] = [
  { id: 'LOG-9001', timestamp: '2026-08-12 01:18:42', user: 'liya@company.com', action: 'Logged into ISMS Management Console', category: 'Authentication', details: 'MFA Verified via Security Key (FIDO2)', status: 'Success', ipAddress: '192.168.1.104' },
  { id: 'LOG-9002', timestamp: '2026-08-12 01:12:05', user: 'liya@company.com', action: 'Updated Vendor Audit Score', category: 'Data Entry', details: 'Acme Corp Solutions audit score increased from 90 to 94', status: 'Success', ipAddress: '192.168.1.104' },
  { id: 'LOG-9003', timestamp: '2026-08-11 22:45:10', user: 'system_bot', action: 'Automated Vulnerability Scan', category: 'Risk Action', details: 'Scanned 5 core infrastructure assets. 0 critical zero-days found.', status: 'Success', ipAddress: '10.0.4.12' },
  { id: 'LOG-9004', timestamp: '2026-08-11 18:30:00', user: 'alex.dev@company.com', action: 'Failed SSO Login Attempt', category: 'Authentication', details: 'Invalid password threshold exceeded (2 attempts)', status: 'Warning', ipAddress: '82.165.40.12' },
  { id: 'LOG-9005', timestamp: '2026-08-11 14:15:22', user: 'liya@company.com', action: 'Exported Financial Compliance Budget', category: 'Compliance', details: 'Generated encrypted CSV report for Q3 Board Review', status: 'Success', ipAddress: '192.168.1.104' },
];

export const initialComplianceFrameworks: ComplianceFramework[] = [
  { id: 'fw-1', code: 'ISO/IEC 27001:2022', name: 'Information Security Management', score: 92, totalControls: 93, passedControls: 86, pendingControls: 5, failedControls: 2, description: 'International standard for establishing, implementing, maintaining and continually improving an ISMS.', lastAuditDate: '2026-07-15' },
  { id: 'fw-2', code: 'SOC 2 Type II', name: 'Security, Availability & Confidentiality', score: 88, totalControls: 64, passedControls: 56, pendingControls: 6, failedControls: 2, description: 'Trust Services Criteria evaluation for cloud service organizations.', lastAuditDate: '2026-06-30' },
  { id: 'fw-3', code: 'EU GDPR', name: 'General Data Protection Regulation', score: 95, totalControls: 42, passedControls: 40, pendingControls: 2, failedControls: 0, description: 'European data privacy mandate governing personal data processing.', lastAuditDate: '2026-08-01' },
  { id: 'fw-4', code: 'HIPAA Security Rule', name: 'Health Insurance Portability Act', score: 78, totalControls: 50, passedControls: 39, pendingControls: 8, failedControls: 3, description: 'National standard to safeguard individuals electronic personal health information (ePHI).', lastAuditDate: '2026-05-20' },
];

export const currentUserProfile: SaccoUserProfile = {
  name: 'Liya Fitsum',
  email: 'liya.ugr-1587-16@aau.edu.et',
  role: 'UI / Design Engineer',
  title: 'UI / Design Engineer',
  department: 'Savings & Credit Sacco',
  phone: '+251 911 234 567',
  location: 'Addis Ababa, Ethiopia',
  mfaEnabled: true,
  clearance: 'Level 5 (Top Secret / CISO Clearance)',
  avatarUrl: '',
};

export const initialNotifications: NotificationItem[] = [
  { id: 'notif-1', title: 'High Risk Vendor Alert', message: 'Global Tech Systems failed MFA check on administrative API endpoints.', timestamp: '10 minutes ago', read: false, type: 'alert' },
  { id: 'notif-2', title: 'ISO 27001 Audit Completed', message: 'Annual certification report published with 92% overall compliance score.', timestamp: '2 hours ago', read: false, type: 'success' },
  { id: 'notif-3', title: 'New Vendor Assessment Submitted', message: 'Horizon FinTech submitted security questionnaire for review.', timestamp: 'Yesterday', read: true, type: 'info' },
];

export const initialMembers: SaccoMember[] = [
  { id: 'MEM-1001', fullName: 'Abebe Bikila', faydaId: 'FIN-8392-1049-8821', email: 'abebe.b@sacco.org.et', phone: '+251 911 234 567', membershipType: 'Full', branch: 'Addis Ababa Central', savingsBalance: 145230.00, shareCapital: 25000.00, loanBalance: 80000.00, status: 'active', joinedDate: '2022-03-15', verifiedByFayda: true, occupation: 'Logistics Manager' },
  { id: 'MEM-1002', fullName: 'Tigist Assefa', faydaId: 'FIN-4421-9012-3341', email: 'tigist.a@sacco.org.et', phone: '+251 912 345 678', membershipType: 'Full', branch: 'Bole Branch', savingsBalance: 328500.50, shareCapital: 50000.00, loanBalance: 0.00, status: 'active', joinedDate: '2021-11-04', verifiedByFayda: true, occupation: 'Civil Engineer' },
  { id: 'MEM-1003', fullName: 'Mulugeta Seretse', faydaId: 'FIN-1092-8834-5512', email: 'mulugeta.s@sacco.org.et', phone: '+251 913 456 789', membershipType: 'Associate', branch: 'Merkato Branch', savingsBalance: 12400.00, shareCapital: 5000.00, loanBalance: 35000.00, status: 'pending', joinedDate: '2026-07-20', verifiedByFayda: false, occupation: 'Retail Merchant' },
  { id: 'MEM-1004', fullName: 'Hirut Bekele', faydaId: 'FIN-7723-4410-9923', email: 'hirut.b@sacco.org.et', phone: '+251 914 567 890', membershipType: 'Full', branch: 'Hawassa Branch', savingsBalance: 892100.00, shareCapital: 100000.00, loanBalance: 250000.00, status: 'active', joinedDate: '2020-05-12', verifiedByFayda: true, occupation: 'Senior Accountant' },
  { id: 'MEM-1005', fullName: 'Kassahun Tadesse', faydaId: 'FIN-3381-2291-7734', email: 'kassahun.t@sacco.org.et', phone: '+251 915 678 901', membershipType: 'Institutional', branch: 'Addis Ababa Central', savingsBalance: 2450000.00, shareCapital: 500000.00, loanBalance: 1200000.00, status: 'active', joinedDate: '2019-01-10', verifiedByFayda: true, occupation: 'Enterprise Representative' },
  { id: 'MEM-1006', fullName: 'Genet Alemu', faydaId: 'FIN-9912-4431-8855', email: 'genet.a@sacco.org.et', phone: '+251 916 789 012', membershipType: 'Associate', branch: 'Dire Dawa Branch', savingsBalance: 45000.00, shareCapital: 10000.00, loanBalance: 0.00, status: 'flagged', joinedDate: '2025-09-18', verifiedByFayda: false, occupation: 'Agronomist' },
  { id: 'MEM-1007', fullName: 'Yonas Gebremedhin', faydaId: 'FIN-5510-8822-3311', email: 'yonas.g@sacco.org.et', phone: '+251 917 890 123', membershipType: 'Full', branch: 'Bole Branch', savingsBalance: 178000.00, shareCapital: 30000.00, loanBalance: 65000.00, status: 'active', joinedDate: '2023-02-28', verifiedByFayda: true, occupation: 'Software Developer' },
  { id: 'MEM-1008', fullName: 'Meskerem Wolde', faydaId: 'FIN-2211-7744-9900', email: 'meskerem.w@sacco.org.et', phone: '+251 918 901 234', membershipType: 'Associate', branch: 'Merkato Branch', savingsBalance: 0.00, shareCapital: 2000.00, loanBalance: 0.00, status: 'suspended', joinedDate: '2024-11-14', verifiedByFayda: false, occupation: 'Teacher' },
];
