export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AuditStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed';

export type FindingStatus = 'Pending' | 'Under Review' | 'Genuine' | 'Requires Clarification' | 'Adjustment Required' | 'Closed';

export interface AuditException {
  id: string;
  risk: RiskLevel;
  riskScore: number;
  date: string;
  voucherNo: string;
  voucherType: string;
  ledger: string;
  party: string;
  amount: number;
  exceptionType: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Finding';
  details?: any;
}

export interface AuditFinding {
  id: string;
  risk: RiskLevel;
  category: string;
  transactionDetails: string;
  reasonDetected: string;
  auditorNotes: string;
  attachments: string[];
  status: FindingStatus;
  conclusion: string;
  exceptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditSummary {
  companyName: string;
  financialYear: string;
  dataConnectionStatus: string;
  lastScanDate: string;
  totalVouchersAnalysed: number;
  totalLedgersAnalysed: number;
  totalExceptions: number;
  highRiskExceptions: number;
  mediumRiskExceptions: number;
  lowRiskExceptions: number;
  progress: number;
}

export interface AuditRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: RiskLevel;
  enabled: boolean;
}
