/**
 * Phase 32L - Advanced User-Facing Exploration & Analytics Layer Types
 */

import { QueryDefinition, QueryResult, QueryFilter, QueryOrderBy, QueryAggregation, QueryJoin } from './phase32GQuery';
import { ReconstructionDefinition } from './phase32KReconstruction';

export interface DatasetSummary {
  datasetId: string;
  name: string;
  displayName: string;
  category: string;
  recordCount: number;
  lastSync: string;
  freshness: string; // "Fresh", "Stale", "Syncing"
  source: 'Warehouse' | 'Snapshot' | 'Live Tally' | 'Mixed';
  qualityStatus: 'Good' | 'Warnings' | 'Critical';
  schemaVersion: number;
}

export interface DatasetDetails extends DatasetSummary {
  description: string;
  companyId: string;
  lastUpdated: string;
  grain: string;
  fields: DatasetFieldSemantics[];
  relationships: DatasetRelationshipSemantics[];
}

export interface DatasetFieldSemantics {
  field: string;
  label: string;
  type: string;
  nullable: boolean;
  description: string;
  semanticRole: string; // "Voucher", "Debit", "Credit", "Tax", etc.
  sourceField?: string;
  canonicalField?: string;
  confidence: 'Confirmed' | 'Inferred' | 'Low';
}

export interface DatasetRelationshipSemantics {
  relationshipId: string;
  name: string;
  sourceDataset: string;
  sourceKey: string;
  targetDataset: string;
  targetKey: string;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
}

export interface ExplorerRecord {
  id: string;
  companyId: string;
  canonicalValues: Record<string, any>;
  sourceValues: Record<string, any>;
  relationships: Array<{
    targetDataset: string;
    relationshipId: string;
    count: number;
  }>;
  lineage: {
    source: string;
    dataset: string;
    snapshotId?: string;
    syncId?: string;
    transformationApplied?: string;
  };
  qualityFindings: Array<{
    severity: 'Warning' | 'Error';
    ruleId: string;
    message: string;
  }>;
}

export interface QueryValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  hasOneToManyFanout?: boolean;
}

export interface NLReportRequest {
  requestText: string;
  companyId: string;
}

export interface NLReportResponse {
  interpretedRequest: {
    dataset: string;
    fields: string[];
    filters: QueryFilter[];
    groupBy: string[];
    aggregations: QueryAggregation[];
    orderBy: QueryOrderBy[];
    dateRange?: {
      start: string;
      end: string;
    };
    source: string;
  };
  confidence: 'High' | 'Medium' | 'Low';
  availability: {
    isAvailable: boolean;
    missingFields: string[];
    missingDatasets: string[];
  };
  clarificationRequired?: boolean;
  clarifications?: string[];
  reportDefinition?: any; // Phase 32I ReportDefinition
  explanation: string;
}

export type ChartType = 'Bar' | 'Column' | 'Line' | 'Area' | 'Pie' | 'Donut' | 'Stacked Bar' | 'Table' | 'KPI';

export interface ChartConfig {
  chartId: string;
  title: string;
  chartType: ChartType;
  dimension: string;
  measure: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  sortBy?: string;
  limit?: number;
}

export interface DashboardWidget {
  widgetId: string;
  title: string;
  type: 'Chart' | 'Table' | 'KPI' | 'Report';
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: {
    dataset?: string;
    chartConfig?: ChartConfig;
    kpiMetric?: 'Total Sales' | 'Outstanding' | 'Stock Quantity' | 'Voucher Count' | 'Tax Amount';
    reportId?: string;
    queryDef?: QueryDefinition;
  };
  freshness: {
    source: string;
    lastSync: string;
    snapshotId?: string;
  };
}

export interface DashboardDefinition {
  dashboardId: string;
  title: string;
  widgets: DashboardWidget[];
  sharedFilters?: {
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
    ledger?: string;
    party?: string;
  };
  permissions?: {
    owner: string;
    scope: 'Private' | 'Shared' | 'Role-based' | 'Company-scoped';
    allowedRoles?: string[];
    allowedCompanies?: string[];
  };
  isFavorite?: boolean;
}

export interface AnalysisHistoryItem {
  historyId: string;
  timestamp: string;
  requestText: string;
  interpretation: NLReportResponse['interpretedRequest'];
  queryId?: string;
}
