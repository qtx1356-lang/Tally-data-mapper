export type CopilotMode =
  | 'Ask'
  | 'Analyze'
  | 'Build Report'
  | 'Explain'
  | 'Compare'
  | 'Investigate'
  | 'Find'
  | 'Summarize';

export type DataSourceIndicator = 'LIVE TALLY' | 'LOCAL DATASET' | 'IMPORTED DATA';

export interface AnswerProvenance {
  dataset: string;
  company: string;
  period: string;
  queryOrReport: string;
  generatedAt: string;
  sourceType: DataSourceIndicator;
  lastSynchronized?: string;
  traceId: string;
}

export interface AstSelectField {
  fieldName: string;
  alias?: string;
  aggregationFunction?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  isCalculated?: boolean;
  expression?: string;
}

export interface AstFilterNode {
  fieldName: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
  value: any;
  secondValue?: any;
  logicalConnector?: 'AND' | 'OR';
}

export interface AstJoinNode {
  targetTable: string;
  joinType: 'INNER' | 'LEFT';
  sourceField: string;
  targetField: string;
  isVerifiedRelationship: boolean;
}

export interface AstSortNode {
  fieldName: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryAst {
  astId: string;
  primaryTable: string;
  selectFields: AstSelectField[];
  joins: AstJoinNode[];
  filters: AstFilterNode[];
  groupByFields: string[];
  sortNodes: AstSortNode[];
  limit?: number;
  offset?: number;
  complexityScore: number;
  estimatedCost: string;
}

export interface QueryValidationResult {
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
  joinSafetyVerified: boolean;
  complexityWithinLimits: boolean;
  compiledSafeSql: string;
  estimatedCostScore: number;
}

export interface TraceabilityMetadata {
  querySql: string;
  queryAst: QueryAst;
  calculationFormula: string;
  calculationVariables: Record<string, any>;
  sourceCollectionPath: string;
  lineagePath: string;
}

export interface InsightItem {
  insightId: string;
  type: 'Trend' | 'Outlier' | 'Change' | 'Concentration' | 'Exception' | 'Anomaly';
  metric: string;
  period: string;
  evidence: string;
  calculationDescription: string;
  confidence: number;
  methodUsed: string;
  requiresAttention: boolean;
}

export interface AgeingBracketSummary {
  bracket: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
}
export type AgeingBucketSummary = AgeingBracketSummary;

export interface TaxReconciliationSummary {
  salesTaxComputed: number;
  gstOutputRecorded: number;
  difference: number;
  hasVariance: boolean;
  technicalCause: string;
}

export interface CopilotReportDraft {
  reportId: string;
  title: string;
  description: string;
  displayColumns: string[];
  totalColumns: string[];
  filters: string[];
  groupBy: string[];
  calculations: string[];
  period: string;
  recommendedChartType: 'Bar' | 'Line' | 'Pie' | 'Area' | 'Column';
  format: 'PDF' | 'Excel' | 'CSV';
  version: number;
  isSaved?: boolean;
}

export interface CopilotDashboardWidget {
  widgetId: string;
  title: string;
  type: 'KPI' | 'BarChart' | 'LineChart' | 'DonutChart' | 'Table';
  value?: string;
  unit?: string;
  chartData?: any[];
  tableData?: any[];
  sourceCollection: string;
}

export interface CopilotDashboardDraft {
  dashboardId: string;
  title: string;
  companyName: string;
  period: string;
  widgets: CopilotDashboardWidget[];
  isSaved?: boolean;
}

export interface DrilldownPayload {
  parentQueryId: string;
  filterDimension: string;
  filterValue: string;
  companyId: string;
  records: any[];
  lineage: {
    sourceCollection: string;
    objectPath: string;
    fields: string[];
  };
}

export interface CopilotToolCallRecord {
  toolName: string;
  arguments: Record<string, any>;
  timestamp: string;
  executionTimeMs: number;
  status: 'Success' | 'Failed' | 'Blocked';
  outputSummary?: string;
}

export interface CopilotAuditTrailItem {
  auditId: string;
  timestamp: string;
  user: string;
  question: string;
  intent: string;
  queryPlanId: string;
  dataset: string;
  queryCost: string;
  status: 'Completed' | 'Blocked' | 'ClarificationRequested';
  modelUsed: string;
  toolCalls: string[];
}

export interface VoiceCommandState {
  isListening: boolean;
  transcript: string;
  recognizedIntent: string;
  confidence: number;
  timestamp?: string;
}

export interface AiProviderConfigState {
  providerName: 'Gemini-3.8-Flash' | 'Local-Offline' | 'Enterprise-Cloud';
  isLocalMode: boolean;
  isOfflineFallbackAvailable: boolean;
  dataMinimizationEnabled: boolean;
  discloseDataTransmission: boolean;
  cloudDisclosureText: string;
}

export interface CopilotMessageV2 {
  messageId: string;
  sender: 'User' | 'Copilot' | 'System';
  content: string;
  timestamp: string;
  mode: CopilotMode;
  provenance?: AnswerProvenance;
  traceability?: TraceabilityMetadata;
  numericHeadline?: {
    label: string;
    value: string;
    currency: string;
    period: string;
    comparedWith?: string;
    percentageChange?: string;
    calculationFormula?: string;
  };
  tableData?: any[];
  chartData?: any[];
  chartType?: 'Bar' | 'Line' | 'Pie' | 'Area' | 'Column';
  insights?: InsightItem[];
  ageingBreakdown?: AgeingBucketSummary[];
  taxReconciliation?: TaxReconciliationSummary;
  reportDraft?: CopilotReportDraft;
  dashboardDraft?: CopilotDashboardDraft;
  executedToolCalls?: CopilotToolCallRecord[];
  clarificationPrompt?: {
    question: string;
    options: string[];
  };
  isMissingData?: boolean;
  missingDataReason?: string;
  confidence: {
    intentConfidence: number;
    fieldMappingConfidence: number;
    queryConfidence: number;
  };
  feedback?: 'Helpful' | 'NotHelpful' | null;
}
