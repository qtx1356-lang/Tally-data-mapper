export type OutputCategory =
  | 'Accounting'
  | 'Sales'
  | 'Purchase'
  | 'Inventory'
  | 'GST'
  | 'Receivables'
  | 'Payables'
  | 'Banking'
  | 'Payroll'
  | 'Statutory'
  | 'Masters'
  | 'Transactions'
  | 'Custom'
  | 'TDL'
  | 'Unknown';

export type DiscoveredDataType =
  | 'String'
  | 'Integer'
  | 'Decimal'
  | 'Boolean'
  | 'Date'
  | 'DateTime'
  | 'Currency'
  | 'Quantity'
  | 'Percentage'
  | 'Object Reference'
  | 'Collection';

export type MappingConfidence = 'High' | 'Medium' | 'Low' | 'Unmapped';

export interface DiscoveredOutputItem {
  outputId: string;
  name: string;
  category: OutputCategory;
  source: 'Standard Tally' | 'Custom TDL' | 'Unknown';
  objectType: string;
  fieldCount: number;
  availability: 'Available' | 'Requires Licensing' | 'Unavailable';
  company: string;
  discoveryDate: string;
  schemaVersion: string;
  mappingStatus: MappingConfidence;
  description: string;
  isCustomTdl?: boolean;
}

export interface DiscoveredField {
  fieldName: string;
  displayName: string;
  dataType: DiscoveredDataType;
  nullable: boolean;
  source: string;
  object: string;
  method: string;
  collection: string;
  exampleValue: string;
  availability: string;
  semanticConcept?: string;
  confidence: MappingConfidence;
  requiresHumanConfirmation?: boolean;
}

export interface DiscoveredObject {
  objectId: string;
  name: string;
  collectionName: string;
  primaryKeyField: string;
  totalFields: number;
  isCustomOrTdl: boolean;
  relationships: string[];
  fields: DiscoveredField[];
  description?: string;
}

export interface DiscoveryExecutionSummary {
  discoveryId: string;
  companyName: string;
  tallyVersion: string;
  status: 'Complete' | 'Partial' | 'Failed';
  timestamp: string;
  objectsDiscovered: number;
  collectionsDiscovered: number;
  fieldsDiscovered: number;
  reportsDiscovered: number;
  customOutputsDiscovered: number;
  mappedOutputsCount: number;
  unmappedOutputsCount: number;
  mappingCoveragePercentage: number;
  discoveryCompletenessScore: number;
  dataQualityRating: 'High' | 'Adequate' | 'Review Recommended';
  warnings: string[];
  discoveredCapabilities: string[];
  isOfflineCache?: boolean;
}

export interface FieldSampleResult {
  fieldName: string;
  objectName: string;
  rowCount: number;
  sampleRows: any[];
  capturedAt: string;
}

export interface TdlOutputDescriptor {
  tdlIdentifier: string;
  name: string;
  exposedType: 'Report' | 'Field' | 'Method' | 'Collection';
  safetyClassification: string;
  parentObject: string;
  description: string;
}

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  fieldCount: number;
  isCustom: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationshipType: 'One-To-One' | 'One-To-Many' | 'Many-To-Many';
  joinKey: string;
  hasCartesianRisk: boolean;
}

export interface ObjectRelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface OutputAvailabilityMatrixRow {
  itemName: string;
  itemType: 'Standard Report' | 'Collection' | 'Object' | 'Field' | 'Custom Output';
  isAvailable: boolean;
  isMapped: boolean;
  isQueryable: boolean;
  isExportable: boolean;
  requiresPermission: boolean;
}

export interface SchemaSnapshot {
  snapshotId: string;
  companyId: string;
  companyName: string;
  tallyVersion: string;
  timestamp: string;
  schemaVersion: string;
  signatureHash: string;
  totalObjects: number;
  totalFields: number;
}

export interface SchemaDiffResult {
  snapshotIdA: string;
  snapshotIdB: string;
  addedFields: string[];
  removedFields: string[];
  changedFields: string[];
  impactedReports: string[];
  summaryDescription: string;
}

export type QueryOperator =
  | '='
  | '≠'
  | '<'
  | '>'
  | '≤'
  | '≥'
  | 'CONTAINS'
  | 'STARTS WITH'
  | 'ENDS WITH'
  | 'IS EMPTY'
  | 'IS NOT EMPTY'
  | 'IN'
  | 'BETWEEN';

export interface QueryFilterCondition {
  id: string;
  fieldName: string;
  operator: QueryOperator;
  value: string;
  secondValue?: string; // For BETWEEN
}

export interface QueryAggregationRule {
  id: string;
  fieldName: string;
  function: 'SUM' | 'COUNT' | 'MIN' | 'MAX' | 'AVERAGE';
  outputAlias: string;
}

export interface QuerySortRule {
  id: string;
  fieldName: string;
  direction: 'ASC' | 'DESC';
}

export interface CalculatedFieldRule {
  id: string;
  outputFieldName: string;
  safeExpression: string; // e.g. "[Sales] - [Cost]" or "([Gross Profit] / [Sales]) * 100"
  outputDataType: DiscoveredDataType;
}

export interface VisualQueryDefinition {
  queryId: string;
  queryName: string;
  primaryObject: string;
  selectedFields: string[];
  filters: QueryFilterCondition[];
  filterLogicalOperator: 'AND' | 'OR';
  groupByFields: string[];
  aggregations: QueryAggregationRule[];
  sortRules: QuerySortRule[];
  calculatedFields: CalculatedFieldRule[];
  limitRows: number;
}

export interface QueryPerformanceEstimate {
  estimatedTier: 'Small' | 'Medium' | 'Large';
  description: string;
  estimatedRowCount: number;
  estimatedExecutionTimeMs: number;
}

export interface QueryExecutionResult {
  queryId: string;
  columns: string[];
  rows: Record<string, any>[];
  totalRowCount: number;
  executionDurationMs: number;
  explanation: string;
  sourceCollection: string;
  truncated: boolean;
}

export interface SavedQueryRecord {
  queryId: string;
  name: string;
  version: number;
  definition: VisualQueryDefinition;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NlToQueryTranslationResult {
  originalPrompt: string;
  generatedQuery: VisualQueryDefinition;
  explanationOfChoices: string;
  selectedConcepts: string[];
  diffVsPrevious?: string;
}

export interface DataLineageTrace {
  outputColumn: string;
  calculatedFormula?: string;
  semanticFields: string[];
  tallySourceFields: string[];
  tallyObject: string;
  explanation: string;
}

export interface SemanticMappingProfile {
  profileId: string;
  name: string;
  company: string;
  tallyVersion: string;
  schemaVersion: string;
  fieldMappings: Record<string, string>; // Source Field -> Semantic Concept
  updatedAt: string;
}

export interface TemplateExportBundle {
  formatVersion: string;
  fileType: '.exfinreport';
  reportTitle: string;
  query: VisualQueryDefinition;
  columns: { name: string; alignment: 'left' | 'right' | 'center'; format?: string }[];
  charts: { type: 'Bar' | 'Line' | 'Pie' | 'Donut' | 'Area' | 'Column'; metricField: string; dimensionField: string }[];
  requiredCapabilities: string[];
  requiredFields: string[];
  exportedAt: string;
}

export interface TemplateImportResult {
  compatibilityStatus: 'Compatible' | 'Partially Compatible' | 'Incompatible';
  missingFields: string[];
  suggestedRemappings: Record<string, string[]>;
}
