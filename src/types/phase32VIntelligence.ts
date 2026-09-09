/**
 * Phase 32V: Explainable Intelligence Engine Types
 */

export type AnalysisStatus = 'PASS' | 'WARNING' | 'REVIEW' | 'CRITICAL' | 'UNAVAILABLE' | 'INSUFFICIENT_DATA';

export type RuleCategory = 
  | 'Accounting' | 'Sales' | 'Purchase' | 'Inventory' | 'Receivables' 
  | 'Payables' | 'Banking' | 'Tax' | 'Payroll' | 'Manufacturing' 
  | 'Data Quality' | 'Operational';

export type RuleSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ExceptionStatus = 'NEW' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'RECURRING';

export interface BusinessRule {
  ruleId: string;
  name: string;
  description: string;
  category: RuleCategory;
  scope: string; // e.g., 'Vouchers', 'Ledgers', 'Stock'
  condition: string; // Declarative logic expression
  severity: RuleSeverity;
  confidence: number;
  enabled: boolean;
  version: string;
  createdBy: string;
  updatedAt: string;
  requiredConcepts: string[]; // e.g., ['Amount', 'Date', 'PartyLedgerName']
}

export interface IntelligenceResult {
  resultId: string;
  companyId: string;
  analysisType: string;
  status: AnalysisStatus;
  severity: RuleSeverity;
  confidence: number;
  evidence: Record<string, any>;
  affectedObjects: string[];
  affectedRecords: number;
  createdAt: string;
}

export interface ReconciliationResult {
  reconId: string;
  type: string; // e.g., 'Debit vs Credit', 'Opening + Movement vs Closing'
  category: RuleCategory;
  expected: number;
  actual: number;
  difference: number;
  tolerance: number; // Absolute or % threshold
  toleranceType: 'ABSOLUTE' | 'PERCENTAGE';
  status: AnalysisStatus;
  explanation: string;
  drillDownContext?: Record<string, any>;
}

export interface ExceptionRecord {
  exceptionId: string;
  ruleId: string;
  companyId: string;
  category: RuleCategory;
  severity: RuleSeverity;
  confidence: number;
  status: ExceptionStatus;
  description: string;
  evidence: Record<string, any>;
  affectedAmount: number | null;
  affectedCount: number;
  firstDetected: string;
  lastDetected: string;
}

export interface DataQualityScore {
  overall: number;
  completeness: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  timeliness: number;
  insufficientData: boolean;
}

export interface IntelligenceSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  reviewItems: number;
  criticalItems: number;
  reconciliationDifferences: number;
  categories: Record<RuleCategory, { count: number; critical: number }>;
}
