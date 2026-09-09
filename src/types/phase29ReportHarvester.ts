/**
 * Phase 29: Universal Report Harvester, Automatic Report Enumeration, Schema Mining & Semantic Auto-Mapping Types
 */

export type DiscoveryStatus =
  | 'Queued'
  | 'Connecting'
  | 'Discovering'
  | 'Sampling'
  | 'Analyzing'
  | 'Mapping'
  | 'Completed'
  | 'Partial'
  | 'Failed'
  | 'Cancelled';

export type DiscoveryDepth = 'Quick' | 'Standard' | 'Deep';
export type DiscoveryScope = 'Entire Company' | 'Selected Domains' | 'Selected Reports' | 'Selected Objects';

export interface DiscoverySessionModel {
  sessionId: string;
  connectionId: string;
  companyId: string;
  tallyVersion: string;
  scope: DiscoveryScope;
  depth: DiscoveryDepth;
  status: DiscoveryStatus;
  startedAt: string;
  completedAt?: string;
  adapterVersion: string;
  reportsDiscovered: number;
  collectionsDiscovered: number;
  objectsDiscovered: number;
  fieldsDiscovered: number;
  mappingsGenerated: number;
}

export type ReportCategory =
  | 'Accounting'
  | 'Inventory'
  | 'Receivables'
  | 'Payables'
  | 'GST'
  | 'Tax'
  | 'Payroll'
  | 'Banking'
  | 'Cost Centre'
  | 'Manufacturing'
  | 'Management'
  | 'Analysis'
  | 'Other';

export interface ReportParameterModel {
  parameterId: string;
  name: string;
  type: 'Text' | 'Number' | 'Date' | 'Boolean' | 'Enum' | 'Company' | 'Ledger' | 'Group' | 'Period' | 'Currency' | 'Unknown';
  defaultValue?: any;
  isRequired: boolean;
  allowedValues?: string[];
  description: string;
  source: string;
}

export interface DiscoveredFieldModel {
  fieldId: string;
  name: string;
  path: string; // e.g. "Voucher.LedgerEntries.Amount"
  type: 'String' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean' | 'Object' | 'Array' | 'Unknown';
  nullable: 'Required' | 'Optional' | 'Nullable' | 'Unknown';
  sampleValues: any[];
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  nullPct: number;
  uniquePct: number;
}

export interface ReportCatalogItem {
  reportId: string;
  name: string;
  tallyIdentifier: string;
  source: string;
  type: 'Standard' | 'Custom' | 'Unknown';
  category: ReportCategory;
  availability: 'Available' | 'Unavailable' | 'Unknown' | 'Requires Parameters';
  description: string;
  parameters: ReportParameterModel[];
  fields: DiscoveredFieldModel[];
  lastDiscovered: string;
  version: string;
  sampleRows: Record<string, any>[];
}

export interface DiscoveredObjectModel {
  objectId: string;
  name: string;
  category: string;
  identifier: string;
  fieldCount: number;
  relationships: {
    targetObject: string;
    type: 'One-to-one' | 'One-to-many' | 'Many-to-many';
    confidence: 'High' | 'Medium' | 'Low';
  }[];
  sampleRecord: Record<string, any>;
}

export interface DiscoveredCollectionModel {
  collectionId: string;
  name: string;
  type: string;
  source: string;
  availability: 'Available' | 'Unavailable';
  fields: string[];
  sampleCount: number;
}

export type SemanticType =
  | 'Name'
  | 'Date'
  | 'Amount'
  | 'Quantity'
  | 'Rate'
  | 'Percentage'
  | 'Currency'
  | 'Reference'
  | 'Address'
  | 'Tax'
  | 'Account'
  | 'Party'
  | 'Item'
  | 'Description'
  | 'Status';

export interface SemanticMappingModel {
  mappingId: string;
  sourceReport: string;
  sourceField: string;
  sourcePath: string;
  canonicalField: string;
  semanticType: SemanticType;
  confidence: 'High' | 'Medium' | 'Low';
  method: 'Exact Match' | 'Alias Match' | 'Dictionary Match' | 'Type Match' | 'Context Match' | 'Pattern Match' | 'User Mapping';
  reason: string;
  status: 'Proposed' | 'Approved' | 'Rejected' | 'Ambiguous';
  approvedBy?: string;
  approvedAt?: string;
}

export interface ExtractionTemplateModel {
  templateId: string;
  name: string;
  companyScope: string;
  reportId: string;
  parameters: Record<string, any>;
  schedule?: string;
  status: 'Active' | 'Requires Review';
  lastRunAt?: string;
}

export interface ExtractionJobModel {
  jobId: string;
  reportId: string;
  reportName: string;
  companyId: string;
  parameters: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  recordCount: number;
  errorCount: number;
}

export interface QueryLabResultModel {
  queryId: string;
  companyId: string;
  reportId: string;
  parameters: Record<string, any>;
  durationMs: number;
  rawPayload: string;
  parsedJson: any;
  totalRecords: number;
  totalFields: number;
  payloadSizeBytes: number;
}

export interface SchemaDiffModel {
  sessionA: string;
  sessionB: string;
  addedReports: string[];
  removedReports: string[];
  addedFields: string[];
  removedFields: string[];
  breakingChanges: string[];
}
