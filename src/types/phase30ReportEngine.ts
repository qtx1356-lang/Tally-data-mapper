export type SourceType = 'Live Tally' | 'Tally Snapshot' | 'Imported Dataset' | 'Multiple Sources';

export type ReportPublishStatus = 'Draft' | 'Validated' | 'Published' | 'Archived';

export type FieldDataType = 'Text' | 'Number' | 'Currency' | 'Percentage' | 'Date' | 'DateTime' | 'Quantity';

export type NumberFormatType = 'Indian' | 'International';

export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'Custom';

export type JoinType = 'Inner Join' | 'Left Join' | 'Right Join';

export type FilterOperator =
  | 'Equals'
  | 'Not Equals'
  | 'Contains'
  | 'Starts With'
  | 'Ends With'
  | 'Greater Than'
  | 'Less Than'
  | 'Between'
  | 'In'
  | 'Not In'
  | 'Is Empty'
  | 'Is Not Empty';

export type DatePreset =
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'This Month'
  | 'Previous Month'
  | 'This Quarter'
  | 'This Year'
  | 'Financial Year'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'Last 90 Days'
  | 'Custom Range';

export type AggregationFunction = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'COUNT_DISTINCT';

export type ChartType =
  | 'Table'
  | 'Bar'
  | 'Column'
  | 'Line'
  | 'Area'
  | 'Pie'
  | 'Donut'
  | 'Scatter'
  | 'Stacked Bar'
  | 'Stacked Column'
  | 'Pivot'
  | 'KPI';

export interface FieldFormatOptions {
  numberFormat?: NumberFormatType;
  decimalPrecision?: number;
  currencySymbol?: string;
  dateFormat?: DateFormatType;
  showNegativeInParentheses?: boolean;
}

export interface DiscoveredReportField {
  fieldId: string;
  datasetId: string;
  entityName: string;
  fieldName: string;
  displayName: string;
  dataType: FieldDataType;
  sourcePath: string;
  confidence: number;
  availability: 'Available' | 'Computed' | 'Conditional';
  description?: string;
  formatOptions?: FieldFormatOptions;
}

export interface DiscoveredDataset {
  datasetId: string;
  name: string;
  category: 'Accounting' | 'Inventory' | 'Taxation' | 'Master' | 'Statutory';
  recordCount: number;
  source: SourceType;
  description: string;
  fields: DiscoveredReportField[];
}

export interface RelationshipJoin {
  joinId: string;
  sourceDataset: string;
  sourceField: string;
  targetDataset: string;
  targetField: string;
  joinType: JoinType;
  relationshipConfidence: number;
  estimatedRows: number;
  isCrossCompany?: boolean;
  status: 'Safe' | 'Ambiguous' | 'Cartesian Warning';
}

export interface FilterCondition {
  filterId: string;
  fieldId: string;
  fieldName: string;
  operator: FilterOperator;
  value: string;
  secondValue?: string;
  datePreset?: DatePreset;
}

export interface FilterGroup {
  groupId: string;
  logicalOperator: 'AND' | 'OR';
  conditions: FilterCondition[];
  nestedGroups?: FilterGroup[];
}

export interface CalculatedFormula {
  calculationId: string;
  name: string;
  formulaString: string;
  description: string;
  returnType: FieldDataType;
  lineage: {
    inputFields: string[];
    sourceDatasets: string[];
  };
  sampleResult?: string | number;
}

export interface GroupingHierarchy {
  fieldId: string;
  fieldName: string;
  level: number;
}

export interface SortConfiguration {
  fieldId: string;
  fieldName: string;
  direction: 'Ascending' | 'Descending';
  orderIndex: number;
}

export interface TopNConfiguration {
  enabled: boolean;
  type: 'Top' | 'Bottom';
  count: number;
  metricFieldId: string;
}

export interface PivotValueConfiguration {
  fieldId: string;
  fieldName: string;
  aggregation: AggregationFunction;
}

export interface PivotConfiguration {
  enabled: boolean;
  rowFields: string[];
  columnFields: string[];
  values: PivotValueConfiguration[];
  showSubtotals: boolean;
  showGrandTotals: boolean;
}

export interface VisualizationConfig {
  chartType: ChartType;
  dimensions: string[];
  measures: string[];
  stacked?: boolean;
  showLegend?: boolean;
  colorPalette?: string[];
  suggestedReason?: string;
  warnings?: string[];
}

export interface RuntimeParameterDefinition {
  parameterId: string;
  name: string;
  type: 'Date' | 'Date Range' | 'Company' | 'Ledger' | 'Group' | 'Customer' | 'Supplier' | 'Product' | 'Voucher Type' | 'Text' | 'Number' | 'Boolean' | 'Enum';
  defaultValue?: any;
  options?: string[];
  isRequired: boolean;
  description?: string;
}

export interface ReportBranding {
  title: string;
  subtitle?: string;
  companyName: string;
  showLogo?: boolean;
  headerText?: string;
  footerText?: string;
  pageNumbering?: boolean;
  orientation?: 'A4 Portrait' | 'A4 Landscape' | 'Letter';
}

export interface ReportDefinition {
  reportId: string;
  name: string;
  description: string;
  sourceType: SourceType;
  sourceSnapshotTime?: string;
  companyScope: string[];
  isMultiCompanyConsolidated?: boolean;
  primaryDataset: string;
  joinedDatasets: string[];
  selectedFields: DiscoveredReportField[];
  joins: RelationshipJoin[];
  filterGroups: FilterGroup[];
  calculations: CalculatedFormula[];
  groupings: GroupingHierarchy[];
  showSubtotals: boolean;
  showGrandTotal: boolean;
  showRunningTotal: boolean;
  showContributionPercentage: boolean;
  sortings: SortConfiguration[];
  topN?: TopNConfiguration;
  pivotConfig?: PivotConfiguration;
  visualization: VisualizationConfig;
  parameters: RuntimeParameterDefinition[];
  branding: ReportBranding;
  publishingStatus: ReportPublishStatus;
  version: number;
  owner: string;
  tags: string[];
  folder?: string;
  isFavorite?: boolean;
  sharedWith?: { entity: string; type: 'User' | 'Role' | 'Company'; access: 'Read' | 'Run' | 'Edit' | 'Share' | 'Export' }[];
  requiresReview?: boolean;
  brokenReason?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

export interface QueryPlanCost {
  estimatedRecords: number;
  joinOperations: number;
  processingCost: 'Low' | 'Medium' | 'High' | 'Heavy';
  memoryEstimatedMb: number;
  isExpensive: boolean;
  optimizationsApplied: string[];
}

export interface DrillDownStep {
  level: number;
  dimensionName: string;
  dimensionValue: string;
  filterApplied: string;
}

export interface DrillDownTrace {
  reportId: string;
  metricName: string;
  aggregatedValue: number | string;
  path: DrillDownStep[];
  underlyingRecordsCount: number;
  underlyingRecords: any[];
  sourceReportIdentifier: string;
  sourceQueryParams: Record<string, any>;
}

export interface ReportTemplateModel {
  templateId: string;
  name: string;
  category: 'Finance' | 'Sales' | 'Purchase' | 'Inventory' | 'Tax' | 'Management';
  description: string;
  requiredFields: string[];
  compatibility: 'Compatible' | 'Partially Compatible' | 'Not Compatible';
  missingFields: string[];
  suggestedReason?: string;
}

export interface DashboardWidgetModel {
  widgetId: string;
  title: string;
  type: 'Table' | 'Chart' | 'KPI' | 'Pivot' | 'Insight' | 'Exception' | 'Text';
  reportId?: string;
  chartConfig?: VisualizationConfig;
  kpiConfig?: {
    metricField: string;
    currentValue: string | number;
    comparisonType: 'Previous Period' | 'Prior Year' | 'Baseline';
    comparisonValue: string | number;
    changePercentage: number;
    status: 'On Track' | 'Warning' | 'Critical';
    formulaExplanation?: string;
  };
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardModel {
  dashboardId: string;
  name: string;
  description: string;
  companyScope: string[];
  widgets: DashboardWidgetModel[];
  isPublished: boolean;
  owner: string;
  updatedAt: string;
}

export interface ReportExecutionJobModel {
  jobId: string;
  reportId: string;
  reportName: string;
  sourceType: SourceType;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  totalRecords: number;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  recordsBeforeFilter: number;
  recordsAfterFilter: number;
  queryPlan: QueryPlanCost;
  executedBy: string;
  rows?: any[];
  pivotData?: any;
  aggregates?: Record<string, any>;
}

export interface ExportAuditLog {
  auditId: string;
  reportId: string;
  reportName: string;
  company: string;
  user: string;
  format: 'PDF' | 'XLSX' | 'CSV' | 'JSON';
  timestamp: string;
  rowCount: number;
}

export interface SmartSuggestionItem {
  id: string;
  title: string;
  category: string;
  description: string;
  reason: string;
  availableMatchingFields: string[];
  confidence: number;
  presetReportDefinition: Partial<ReportDefinition>;
}
