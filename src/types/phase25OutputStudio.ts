/**
 * Phase 25: Universal Output Studio & Report Builder Types
 * Complete specification for Output Discovery, Data/Field Catalog, Relationships & Joins,
 * Formula Engine, Pivot & Chart Engine, Report Designer, Templates, Import/Export, and Security.
 */

export type SourceAvailabilityStatus =
  | 'Available'
  | 'Unavailable'
  | 'Unsupported'
  | 'Not Tested'
  | 'Requires Configuration';

export type OutputFieldCategory =
  | 'Identity'
  | 'Date'
  | 'Amount'
  | 'Quantity'
  | 'Ledger'
  | 'Party'
  | 'Tax'
  | 'Inventory'
  | 'Voucher'
  | 'Reference'
  | 'Address'
  | 'Location'
  | 'Employee'
  | 'Custom';

export type OutputFieldType =
  | 'Text'
  | 'Integer'
  | 'Decimal'
  | 'Currency'
  | 'Percentage'
  | 'Date'
  | 'DateTime'
  | 'Boolean';

export type JoinType = 'One-to-One' | 'One-to-Many' | 'Many-to-One' | 'Many-to-Many';

export type AggregationType = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT DISTINCT';

export type ReportScope = 'Personal' | 'Team' | 'Company' | 'Global';

export type ReportStatus = 'Draft' | 'Published' | 'Archived' | 'Broken' | 'Unsupported';

export type ReportType =
  | 'Standard'
  | 'Custom'
  | 'Analytical'
  | 'Operational'
  | 'Management'
  | 'Reconciliation';

export type ChartType =
  | 'Bar'
  | 'Column'
  | 'Line'
  | 'Area'
  | 'Pie'
  | 'Donut'
  | 'Scatter'
  | 'Stacked Bar'
  | 'Stacked Column'
  | 'Combo';

export type ExecutionState = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

export type NumberFormatType = 'Indian' | 'International' | 'Plain' | 'Percentage';

export type CurrencySymbol = '₹' | '$' | '€' | '£' | 'None';

export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export interface OutputField {
  fieldId: string;
  displayName: string;
  sourceName: string;
  type: OutputFieldType;
  category: OutputFieldCategory;
  description: string;
  availability: SourceAvailabilityStatus;
  canonicalField?: string;
  sourceField: string;
  isFavorite?: boolean;
  exampleValue?: string;
  limitations?: string;
  isCustom?: boolean;
}

export interface OutputSource {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  description: string;
  companyId: string;
  connectionId: string;
  status: SourceAvailabilityStatus;
  recordCount: number;
  dimensionsCount: number;
  measuresCount: number;
  fields: OutputField[];
  lastDiscovered: string;
  adapterVersion: string;
  isTDL?: boolean;
}

export interface DiscoveryResult {
  companyId: string;
  companyName: string;
  connectionId: string;
  timestamp: string;
  adapterVersion: string;
  tallyVersion: string;
  sources: OutputSource[];
  totalAvailableSources: number;
  totalFieldsDiscovered: number;
  isLiveConnection: boolean;
  isCached: boolean;
}

export interface SourceRelationship {
  id: string;
  fromSource: string;
  fromKey: string;
  toSource: string;
  toKey: string;
  type: JoinType;
  isValidated: boolean;
  hasManyToManyRisk: boolean;
  sampleMatchesCount: number;
  description: string;
}

export interface JoinValidationResult {
  isValid: boolean;
  detectedType: JoinType;
  warning?: string;
  nullKeyCount: number;
  duplicateKeyCount: number;
  matchedRowsEstimate: number;
  samplePairs: { fromValue: string; toValue: string; matched: boolean }[];
}

export interface FormulaFunctionDoc {
  name: string;
  category: 'Math' | 'Logical' | 'Date' | 'Text' | 'Aggregation';
  syntax: string;
  description: string;
  example: string;
}

export interface CustomMetricDefinition {
  metricId: string;
  name: string;
  formula: string;
  sourceId: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isAccountingStandardVerified: boolean;
  userLabel: string;
  lineage: {
    metric: string;
    formula: string;
    fields: string[];
    dataset: string;
    source: string;
  };
}

export interface FormulaValidationResult {
  isValid: boolean;
  parsedTokens: string[];
  referencedFields: string[];
  inferredReturnType: OutputFieldType;
  sampleResult?: string | number;
  error?: string;
  isAccountingStandard: boolean;
  warning?: string;
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator:
    | '='
    | '≠'
    | '<'
    | '>'
    | '≤'
    | '≥'
    | 'Contains'
    | 'Starts With'
    | 'Ends With'
    | 'Between'
    | 'In'
    | 'Not In'
    | 'Is Empty'
    | 'Is Not Empty';
  value: string;
  valueTo?: string; // For Between
}

export interface FilterGroup {
  id: string;
  logicalOperator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface ParameterDefinition {
  id: string;
  key: string;
  label: string;
  type: 'Date' | 'Text' | 'Number' | 'Select' | 'MultiSelect';
  defaultValue?: string;
  options?: { label: string; value: string }[];
  isRequired: boolean;
}

export interface ColumnConfig {
  fieldId: string;
  label: string;
  width?: number;
  alignment: 'left' | 'center' | 'right';
  format: NumberFormatType;
  currencySymbol?: CurrencySymbol;
  dateFormat?: DateFormatType;
  decimals?: number;
  sort?: 'asc' | 'desc' | 'none';
  sortPriority?: number;
  isVisible: boolean;
  aggregation?: AggregationType;
  conditionalFormatting?: {
    condition: '>' | '<' | '=' | 'Between' | 'Contains';
    value: string;
    valueTo?: string;
    action: 'Highlight' | 'Bold' | 'Icon' | 'Warning';
    colorTag?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
  }[];
}

export interface GroupingConfig {
  fieldId: string;
  granularity?: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';
  showSubtotals: boolean;
}

export interface PivotConfig {
  rowFields: string[];
  columnFields: string[];
  valueFields: { fieldId: string; aggregation: AggregationType; label: string }[];
  showSubtotals: boolean;
  showGrandTotals: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  topN?: number;
  bottomN?: number;
}

export interface ChartConfig {
  chartType: ChartType;
  title: string;
  xAxisField: string;
  yAxisFields: string[];
  seriesField?: string;
  aggregation: AggregationType;
  showLegend: boolean;
  stacked?: boolean;
}

export interface ReportWidget {
  id: string;
  title: string;
  type: 'KPI' | 'Table' | 'Pivot' | 'Chart';
  sourceId: string;
  columns: ColumnConfig[];
  pivotConfig?: PivotConfig;
  chartConfig?: ChartConfig;
  filters: FilterGroup[];
  kpiMetricField?: string;
  gridPosition: { x: number; y: number; w: number; h: number };
}

export interface ReportPage {
  id: string;
  title: string;
  order: number;
  widgets: ReportWidget[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  owner: string;
  createdBy: string;
  scope: ReportScope;
  status: ReportStatus;
  version: number;
  companyScope: string[]; // ['ALL'] or specific company IDs
  tags: string[];
  primarySourceId: string;
  joinedSources?: { sourceId: string; joinKeyFrom: string; joinKeyTo: string; joinType: JoinType }[];
  parameters: ParameterDefinition[];
  globalFilters: FilterGroup[];
  groupings: GroupingConfig[];
  columns: ColumnConfig[];
  calculatedColumns: { id: string; name: string; formula: string; type: OutputFieldType }[];
  pivotConfig?: PivotConfig;
  chartConfig?: ChartConfig;
  showGrandTotal: boolean;
  pages: ReportPage[];
  isAdvancedMode?: boolean;
  schedule?: {
    frequency: 'Daily' | 'Weekly' | 'Monthly';
    recipients: string[];
    format: 'PDF' | 'XLSX' | 'CSV';
    enabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate {
  templateId: string;
  name: string;
  category: 'Sales' | 'Finance' | 'Inventory' | 'GST' | 'Management' | 'Reconciliation';
  description: string;
  requiredSources: string[];
  requiredFields: string[];
  isSupported: boolean;
  version: string;
  definition: Partial<ReportDefinition>;
}

export interface SemanticOutputMapping {
  id: string;
  sourceId: string;
  sourceField: string;
  canonicalField: string;
  dataType: OutputFieldType;
  confidence: 'High' | 'Medium' | 'Low';
  status: 'Mapped' | 'Unmapped' | 'Partial' | 'Conflict' | 'Unsupported';
  transformFunction?: string;
  version: number;
  dependentReportsCount: number;
}

export interface ReportHealthItem {
  reportId: string;
  reportName: string;
  status: 'Healthy' | 'Warning' | 'Broken' | 'Unsupported';
  issues: string[];
  missingFields: string[];
  impactedWidgets: string[];
  lastChecked: string;
}

export interface ReportExecutionLog {
  id: string;
  reportId: string;
  reportName: string;
  companyId: string;
  companyName: string;
  executionTimeMs: number;
  rowsCount: number;
  state: ExecutionState;
  executedBy: string;
  timestamp: string;
  isCached: boolean;
  errorMessage?: string;
}

export interface CopilotReportPlan {
  prompt: string;
  interpretedIntent: string;
  recommendedDataSource: string;
  recommendedFields: string[];
  suggestedFilters: { field: string; operator: string; value: string }[];
  suggestedGrouping: string[];
  suggestedCalculations: { name: string; formula: string }[];
  suggestedChartType?: ChartType;
  confidence: number;
  readyToGenerate: boolean;
}
