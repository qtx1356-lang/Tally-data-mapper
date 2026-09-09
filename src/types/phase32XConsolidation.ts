/**
 * Phase 32X: Multi-Company Consolidation & Group Reporting Types
 */

export type CompanyStatus = 'CONNECTED' | 'DISCONNECTED' | 'AVAILABLE' | 'UNAVAILABLE' | 'MAPPING_REQUIRED' | 'SCHEMA_CHANGED' | 'ERROR';

export interface RegisteredCompany {
  companyId: string;
  companyName: string;
  tallyVersion: string;
  connection: string;
  mappingVersion: string;
  schemaVersion: string;
  status: CompanyStatus;
  baseCurrency: string;
  fiscalYearStart: string;
  lastRefresh: string;
  createdAt: string;
}

export type GroupType = 'Management Group' | 'Legal Group' | 'Branch Group' | 'Region' | 'Custom';

export interface CompanyGroup {
  groupId: string;
  name: string;
  description: string;
  companies: string[]; // array of companyIds
  baseCurrency: string;
  fiscalYear: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  version: string;
}

export interface ConsolidationProfile {
  profileId: string;
  groupId: string;
  currency: string;
  exchangeMethod: 'HISTORICAL' | 'CLOSING_RATE' | 'AVERAGE_RATE';
  fiscalCalendar: string;
  mappingPolicy: 'STRICT' | 'FLEXIBLE';
  eliminationPolicy: 'AUTO' | 'MANUAL_REVIEW';
  roundingPolicy: 'NONE' | 'NEAREST_INTEGER' | 'DECIMAL_2';
  version: string;
}

export interface AccountMapping {
  mappingId: string;
  companyId: string;
  sourceLedger: string;
  groupConcept: string; // e.g. GROUP_REVENUE
  confidence: number;
  mappingVersion: string;
  reviewer: string | null;
  status: 'PROPOSED' | 'APPROVED' | 'CONFLICT';
}

export interface EliminationEntry {
  eliminationId: string;
  groupId: string;
  type: 'Inter-company Sales' | 'Inter-company Purchases' | 'Inter-company Receivables' | 'Inter-company Payables' | 'Inter-company Loans';
  sourceCompanyId: string;
  sourceTransaction: string;
  targetCompanyId: string;
  targetTransaction: string | null;
  ruleId: string | null;
  eliminatedAmount: number;
  status: 'PROPOSED' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'APPLIED_TO_CONSOLIDATION';
  matchConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ConsolidationAdjustment {
  adjustmentId: string;
  groupId: string;
  reason: string;
  amount: number;
  affectedCompanies: string[];
  date: string;
  version: string;
  createdBy: string;
}

export interface GroupKpi {
  id: string;
  name: string;
  value: number | null;
  currency: string;
  companiesIncluded: number;
  companiesExcluded: number;
  dataStatus: 'COMPLETE' | 'INCOMPLETE' | 'UNAVAILABLE';
}

export interface ConsolidatedReportLine {
  groupAccount: string;
  companyId: string;
  companyName: string;
  originalCurrency: string;
  exchangeRate: number | null;
  debit: number;
  credit: number;
  adjustedDebit: number;
  adjustedCredit: number;
  isEliminated: boolean;
}
