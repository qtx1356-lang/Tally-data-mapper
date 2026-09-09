/**
 * Phase 32U: Universal Tally Interactive Analytics Workspace & Visual Report Designer
 */

export interface SavedView {
  viewId: string;
  viewName: string;
  reportId: string;
  filters: { columnId: string; operator: string; value: any }[];
  columns: string[]; // Visible columnIds
  grouping: string[];
  sorting: { columnId: string; direction: 'ASC' | 'DESC' }[];
  isFavorite?: boolean;
  shared?: boolean;
  owner?: string;
  createdAt: string;
}

export type WidgetType = 'KPI' | 'TABLE' | 'BAR_CHART' | 'LINE_CHART' | 'AREA_CHART' | 'PIE_CHART' | 'DONUT_CHART' | 'RANKING_LIST' | 'EXCEPTION_LIST';

export interface WidgetConfig {
  widgetId: string;
  title: string;
  type: WidgetType;
  source: string; // Dataset/Report Id
  x: number;
  y: number;
  w: number;
  h: number;
  filters: { field: string; op: string; val: any }[];
  calculation?: string; // Formula
  visualization: Record<string, any>;
  refreshPolicy: 'LIVE' | 'MANUAL' | 'SCHEDULED';
  status: 'LIVE' | 'CACHED' | 'SNAPSHOT' | 'UNAVAILABLE' | 'WARNING';
  explanation?: string;
}

export interface DashboardDefinition {
  dashboardId: string;
  name: string;
  description: string;
  widgets: WidgetConfig[];
  version: string;
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

export interface DiscoveredDataset {
  datasetId: string;
  name: string;
  displayName: string;
  description: string;
  recordCount: number | null; // Null representing missing/unavailable rather than 0
  category: 'Masters' | 'Transactions' | 'Configuration' | 'System';
  usedBy: string[];
  securityStatus: 'MASKED' | 'RESTRICTED' | 'PUBLIC';
  relationships: {
    targetDataset: string;
    sourceKey: string;
    targetKey: string;
    relationshipType: 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'ONE_TO_ONE';
  }[];
  fields: {
    fieldName: string;
    dataType: string;
    semanticRole: string;
    sourcePath: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    isSensitive: boolean;
  }[];
}

export interface ReportVersion {
  versionId: string;
  reportId: string;
  version: string;
  modifiedBy: string;
  timestamp: string;
  changeSummary: string;
  definitionSnapshot: string; // JSON snapshot of the ReportDefinition
}

export interface AnomalyRecord {
  anomalyId: string;
  sourceType: 'Voucher' | 'Ledger' | 'StockItem' | 'Tax';
  sourceReference: string; // ID or Doc number
  metric: string;
  value: number | string;
  expectedRange: string;
  flaggedAt: string;
  confidence: number;
  reason: string;
  status: 'PENDING_REVIEW' | 'APPROVED_VALID' | 'DISMISSED';
}

export interface KeyboardShortcut {
  keyCombo: string;
  description: string;
  actionId: string;
}

export interface GlobalSearchResult {
  id: string;
  type: 'Report' | 'Dataset' | 'Ledger' | 'Party' | 'StockItem' | 'Voucher';
  title: string;
  subtitle: string;
  url?: string;
  companyId: string;
}
