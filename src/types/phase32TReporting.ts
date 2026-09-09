/**
 * Phase 32T: Universal Report Engine & Drill-down Workspace
 */

export type ReportStatus =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'NEEDS_REVIEW'
  | 'UNSUPPORTED'
  | 'FAILED';

export type ReportCategory =
  | 'Accounting'
  | 'Sales'
  | 'Purchase'
  | 'Inventory'
  | 'Receivables'
  | 'Payables'
  | 'Banking'
  | 'Tax'
  | 'Payroll'
  | 'Manufacturing'
  | 'Orders'
  | 'Cost Centre'
  | 'Management'
  | 'Analysis'
  | 'Custom';

export interface ColumnModel {
  columnId: string;
  displayName: string;
  source: string;
  dataType: 'Amount' | 'Quantity' | 'Rate' | 'Percentage' | 'Date' | 'DateTime' | 'Currency' | 'Text' | 'Boolean';
  format: string;
  width?: number;
  alignment: 'left' | 'center' | 'right';
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'NONE';
  visibility: boolean;
}

export interface ReportDefinition {
  reportId: string;
  reportName: string;
  displayName: string;
  category: ReportCategory;
  description: string;
  sourceOutput: string;
  parameters: string[]; // Allowed parameters
  columns: ColumnModel[];
  grouping: string[];
  sorting: { columnId: string; direction: 'ASC' | 'DESC' }[];
  filters: { columnId: string; operator: string; value: any }[];
  calculations: { targetColumnId: string; formula: string; inputs: string[] }[];
  totals: { showSubtotals: boolean; showGrandTotal: boolean };
  drillDown: { targetReportId?: string; level: number };
  format: { precision: number; debitCreditFormat: 'DR_CR' | 'SIGN' | 'PARENTHESIS' };
  version: string;
  status: ReportStatus;
}

export interface ReportResult {
  columns: ColumnModel[];
  rows: any[];
  groups?: {
    groupKey: string;
    subtotals: Record<string, number>;
    rows: any[];
  }[];
  totals: Record<string, number>;
  metadata: {
    companyName: string;
    period: string;
    generatedAt: string;
    mappingVersion: string;
    definitionVersion: string;
    mode: 'LIVE' | 'CACHED' | 'SNAPSHOT';
    snapshotTimestamp?: string;
    watermark?: string;
  };
  warnings: string[];
  lineage: {
    reportId: string;
    queryPlan: string;
    dataset: string;
    fields: Record<string, string>; // columnId -> Tally Source Path
  };
  validation: {
    status: 'Validated' | 'Validated with Warnings' | 'Unvalidated' | 'Failed';
    sourceTotal?: number;
    reportTotal?: number;
    difference?: number;
  };
}

export interface ReportQueryPlan {
  source: string;
  fields: string[];
  relationships: string[];
  filters: { field: string; op: string; val: any }[];
  grouping: string[];
  aggregation: { field: string; fn: string; alias: string }[];
  sorting: { field: string; dir: 'ASC' | 'DESC' }[];
  pagination: { limit: number; offset: number };
  grain: string;
}

export interface ExportAuditLog {
  auditId: string;
  user: string;
  reportId: string;
  format: 'PDF' | 'XLSX' | 'CSV' | 'JSON' | 'PRINT';
  timestamp: string;
  parameters: Record<string, any>;
}
