/**
 * Phase 32P: Advanced Financial and Management Intelligence Types
 */

export type KPICategory = 
  | 'Revenue'
  | 'Profitability'
  | 'Liquidity'
  | 'Working Capital'
  | 'Receivables'
  | 'Payables'
  | 'Inventory'
  | 'Tax'
  | 'Sales'
  | 'Purchasing'
  | 'Operations'
  | 'Management';

export type KPIStatus = 
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'INSUFFICIENT_DATA'
  | 'STALE_DATA'
  | 'INVALID_DEFINITION';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface KPIDefinition {
  kpiId: string;
  name: string;
  description: string;
  category: KPICategory;
  formula: {
    operator: 'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX' | 'DIVIDE' | 'PERCENTAGE' | 'CHANGE' | 'RATIO';
    fields: string[];
    filters?: Record<string, any>;
  };
  requiredFields: string[];
  grain: 'Company' | 'Ledger' | 'Party' | 'Voucher' | 'Stock Item' | 'Employee';
  periodType: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Financial Year';
  unit: string;
  currency?: string;
  status: KPIStatus;
  version: number;
}

export interface KPIExecutionResult {
  kpiId: string;
  value: number | string; // Numeric or "NOT AVAILABLE"
  status: KPIStatus;
  period: string; // "FY 2026", "April 2026", etc.
  companyId: string;
  generatedAt: string;
  evidence: {
    sourceDataset: string;
    sourceFields: string[];
    formulaText: string;
    filtersText?: string;
    dataFreshness: string;
    snapshotId: string;
  };
}

export interface ForecastResult {
  metricName: string;
  historicalValues: { period: string; value: number }[];
  forecastValues: { period: string; value: number }[];
  method: 'Moving Average' | 'Weighted Moving Average' | 'Linear Trend';
  inputPeriodsCount: number;
  qualityIndicator: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT HISTORICAL DATA';
  disclaimer: string; // "FORECAST - NOT ACTUAL"
}

export interface BudgetTarget {
  metricId: string;
  name: string;
  targetValue: number;
  actualValue: number;
  variance: number;
  variancePercent: number; // percentage
  status: 'Above Target' | 'Below Target' | 'On Target';
}

export interface ManagementInsight {
  insightId: string;
  text: string;
  evidence: {
    metricName: string;
    currentValue: number | string;
    comparisonValue: number | string;
    formula: string;
    sourceDataset: string;
    period: string;
  };
}
