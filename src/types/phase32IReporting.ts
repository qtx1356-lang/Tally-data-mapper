/**
 * Phase 32I - Universal Tally Reporting System Data Models & Interfaces
 */

export type ReportType =
  | 'Tabular'
  | 'Summary'
  | 'Grouped'
  | 'Matrix'
  | 'Trend'
  | 'Detail'
  | 'Master'
  | 'Transaction'
  | 'Exception'
  | 'Dashboard-ready';

export type OutputCategory =
  | 'Accounting'
  | 'Inventory'
  | 'Sales'
  | 'Purchase'
  | 'Receivables'
  | 'Payables'
  | 'Banking'
  | 'Tax'
  | 'Payroll'
  | 'Masters'
  | 'Exceptions'
  | 'Other';

export type OutputConfidence = 'Confirmed' | 'Probable' | 'Partial' | 'Unavailable';

export interface CatalogField {
  fieldName: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object';
  sourceField: string;
  canonicalField: string;
  warehouseField: string;
  nullable: boolean;
  description?: string;
  example?: any;
}

export interface TallyOutputCatalogItem {
  outputId: string;
  name: string;
  category: OutputCategory;
  source: string; // e.g. 'Tally Report API', 'Collection XML', 'ODBC/Direct'
  availability: OutputConfidence;
  dataset: string; // canonical/warehouse dataset ID (e.g. 'canonical-vouchers')
  grain: string; // e.g. 'One row per Voucher'
  fields: CatalogField[];
  parameters: string[];
  relationships: string[];
  schemaVersion: number;
  lastDiscovered: string;
  status: 'Healthy' | 'Needs Review' | 'Broken' | 'Unavailable';
}

export interface ITallyOutputDiscoveryService {
  discoverOutputs(companyId: string): Promise<TallyOutputCatalogItem[]>;
  getCatalog(companyId?: string): Promise<TallyOutputCatalogItem[]>;
  refreshCatalog(companyId: string): Promise<{ refreshedCount: number; statusChanges: { outputId: string; oldStatus: string; newStatus: string }[] }>;
  detectOutputChanges(companyId: string): Promise<{ addedFields: string[]; removedFields: string[]; changedTypes: string[]; affectedReports: string[] }>;
}

export interface ReportFormattingOption {
  numberFormat?: 'Standard' | 'Compact' | 'IndianWords';
  currencySymbol?: string;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  decimalPlaces?: number;
  negativeFormat?: 'Minus' | 'Parentheses' | 'RedText';
  isPercentage?: boolean;
  columnWidth?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface ReportField {
  outputField: string;
  sourceField: string;
  canonicalField: string;
  warehouseField: string;
  alias?: string;
  dataType: string;
  formatting?: ReportFormattingOption;
}

export interface ReportFilter {
  field: string;
  operator:
    | 'EQ'
    | 'NEQ'
    | 'CONTAINS'
    | 'STARTS_WITH'
    | 'ENDS_WITH'
    | 'GT'
    | 'GTE'
    | 'LT'
    | 'LTE'
    | 'BETWEEN'
    | 'IN'
    | 'NOT_IN'
    | 'IS_NULL'
    | 'IS_NOT_NULL';
  value: any;
}

export interface ReportDefinition {
  reportId: string;
  name: string;
  description: string;
  companyScope: string | string[]; // Single company ID or array for multi-company
  dataset: string;
  fields: ReportField[];
  filters: ReportFilter[];
  grouping: string[];
  sorting: { field: string; order: 'ASC' | 'DESC' }[];
  aggregations: { field: string; function: 'SUM' | 'COUNT' | 'MIN' | 'MAX' | 'AVG'; alias: string }[];
  calculatedFields: { name: string; expression: string }[];
  joins?: {
    targetDataset: string;
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    sourceField: string;
    targetField: string;
    cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
  }[];
  parameters: Record<string, any>;
  sourcePreference: 'WAREHOUSE' | 'SNAPSHOT' | 'LIVE_TALLY';
  snapshotPreference?: string;
  layout: ReportType;
  formatting?: Record<string, ReportFormattingOption>;
  permissions: {
    visibility: 'Private' | 'Shared' | 'Role-based' | 'Company-scoped';
    allowedRoles?: string[];
  };
  version: number;
  status: 'Healthy' | 'Needs Review' | 'Broken';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  grain: string;
  tags: string[];
  isFavorite?: boolean;
  templateId?: string;
}

export interface ReportTemplate {
  templateId: string;
  name: string;
  category: OutputCategory;
  description: string;
  requiredDatasets: string[];
  requiredFields: string[];
  version: number;
  compatibility: 'Compatible' | 'Partially Compatible' | 'Not Compatible';
  definition: Partial<ReportDefinition>;
}

export interface GrainValidationResult {
  isSafe: boolean;
  warning?: string;
  effectiveGrain: string;
}

export interface RecordDetailResult {
  canonicalRecord: any;
  sourceRecord: any;
  lineage: any;
  qualityFindings: any[];
  snapshot?: any;
  syncHistory: any[];
}

export interface ReportExecutionResult {
  reportId: string;
  definition: ReportDefinition;
  rows: Record<string, any>[];
  totalCount: number;
  totals?: Record<string, number>;
  subtotals?: Record<string, Record<string, number>>;
  grain: string;
  grainSafetyWarning?: string;
  qualityWarning?: string;
  sourceUsed: 'WAREHOUSE' | 'SNAPSHOT' | 'LIVE_TALLY';
  freshness: {
    lastSyncAt?: string;
    snapshotDate?: string;
    warning?: string;
  };
  lineage: {
    queryId: string;
    dataset: string;
    snapshotId?: string;
    syncJobId?: string;
    sourceSystem: string;
    schemaVersion: number;
  };
  executionDurationMs: number;
}

export interface IUniversalReportEngine {
  getOutputCatalog(companyId?: string): Promise<TallyOutputCatalogItem[]>;
  discoverOutputs(companyId: string): Promise<TallyOutputCatalogItem[]>;
  createReportDefinition(def: Omit<ReportDefinition, 'reportId' | 'createdAt' | 'updatedAt' | 'version' | 'status'>): Promise<ReportDefinition>;
  updateReportDefinition(reportId: string, updates: Partial<ReportDefinition>): Promise<ReportDefinition>;
  getReportDefinition(reportId: string): Promise<ReportDefinition | undefined>;
  listReports(companyId?: string, userRole?: string): Promise<ReportDefinition[]>;
  executeReport(reportOrId: string | ReportDefinition, params?: Record<string, any>, userRole?: string): Promise<ReportExecutionResult>;
  previewReport(def: Partial<ReportDefinition>, limit?: number): Promise<ReportExecutionResult>;
  validateReportGrain(def: Partial<ReportDefinition>): Promise<GrainValidationResult>;
  drillDown(level: string, filterKey: string, filterValue: any, companyId: string): Promise<Record<string, any>[]>;
  drillUp(level: string, currentKey: string, companyId: string): Promise<Record<string, any>[]>;
  getRecordDetail(datasetId: string, recordId: string, companyId: string): Promise<RecordDetailResult>;
  getTemplates(companyId?: string): Promise<ReportTemplate[]>;
  exportReport(reportId: string, format: 'CSV' | 'Excel' | 'PDF', userRole?: string): Promise<{ fileName: string; content: string; mimeType: string }>;
  toggleFavorite(reportId: string): Promise<boolean>;
}
