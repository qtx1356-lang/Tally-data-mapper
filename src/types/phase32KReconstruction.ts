/**
 * Phase 32K - Output Reconstruction & Equivalence Types
 * Intelligence layer reconstructing semantic meaning of Tally outputs and testing reproduction equivalence.
 */

export type SemanticRole =
  | 'Identifier'
  | 'Name'
  | 'Description'
  | 'Date'
  | 'Quantity'
  | 'Rate'
  | 'Amount'
  | 'Debit'
  | 'Credit'
  | 'Balance'
  | 'Tax'
  | 'Party'
  | 'Ledger'
  | 'Group'
  | 'Voucher'
  | 'Stock'
  | 'Godown'
  | 'Employee'
  | 'Bank'
  | 'Reference'
  | 'Narration'
  | 'Status'
  | 'Other';

export type ConfidenceLevel = 'Confirmed' | 'Probable' | 'Unknown';

export type ReportGrain =
  | 'Company'
  | 'Group'
  | 'Ledger'
  | 'Voucher'
  | 'Voucher Line'
  | 'Stock Item'
  | 'Inventory Movement'
  | 'Party'
  | 'Tax Entry'
  | 'Employee'
  | 'Other';

export type OutputCategory =
  | 'Accounting'
  | 'Inventory'
  | 'Sales'
  | 'Purchase'
  | 'Tax'
  | 'Banking'
  | 'Payroll'
  | 'Master'
  | 'Other';

export type OutputPurpose =
  | 'Master'
  | 'Register'
  | 'Statement'
  | 'Summary'
  | 'Analysis'
  | 'Exception'
  | 'Dashboard'
  | 'Transaction';

export type ReconstructionStatus =
  | 'CONFIRMED'
  | 'HIGH_CONFIDENCE'
  | 'PARTIAL'
  | 'LOW_CONFIDENCE'
  | 'UNAVAILABLE'
  | 'NOT_RECONSTRUCTABLE';

export type EquivalenceLevel =
  | 'EXACT'
  | 'FUNCTIONALLY_EQUIVALENT'
  | 'PARTIALLY_EQUIVALENT'
  | 'APPROXIMATE'
  | 'NOT_EQUIVALENT';

export type DifferenceClassification =
  | 'Missing Field'
  | 'Extra Field'
  | 'Value Difference'
  | 'Rounding'
  | 'Filtering'
  | 'Grouping'
  | 'Ordering'
  | 'Unavailable Source'
  | 'Unknown';

export interface FieldSemanticClassification {
  fieldName: string;
  displayName: string;
  semanticRole: SemanticRole;
  confidence: ConfidenceLevel;
  evidence: string[];
  canonicalFieldMapping?: string;
  dataType?: string;
  sampleValue?: any;
}

export interface DiscoveredCalculation {
  calculationId: string;
  name: string;
  expression: string;
  inputFields: string[];
  outputField: string;
  confidence: ConfidenceLevel;
  evidence: string[];
}

export interface RelationshipSemantic {
  relationshipId: string;
  sourceObject: string;
  targetObject: string;
  type: 'Parent' | 'Child' | 'Reference' | 'Aggregation' | 'Lookup';
  confidence: ConfidenceLevel;
  evidence: string[];
}

export interface OutputParameter {
  parameterId: string;
  name: string;
  targetField: string;
  dataType: string;
  isRequired: boolean;
  supported: boolean;
}

export interface OutputSemanticDefinition {
  outputId: string;
  outputName: string;
  category: OutputCategory;
  categoryConfidence: ConfidenceLevel;
  purpose: OutputPurpose;
  grain: ReportGrain;
  grainConfidence: ConfidenceLevel;
  requiredDatasets: { datasetId: string; status: 'Required' | 'Optional' | 'Unavailable' }[];
  requiredFields: FieldSemanticClassification[];
  relationships: RelationshipSemantic[];
  calculations: DiscoveredCalculation[];
  filters: string[];
  parameters: OutputParameter[];
  grouping: string[];
  sorting: string[];
  formatting: Record<string, string>;
  confidence: number; // 0 - 100
  evidence: string[];
}

export interface ReconstructionDefinition {
  outputId: string;
  version: number;
  grain: ReportGrain;
  datasets: string[];
  fields: FieldSemanticClassification[];
  relationships: RelationshipSemantic[];
  calculations: DiscoveredCalculation[];
  filters: string[];
  parameters: OutputParameter[];
  confidence: number;
  evidence: string[];
  status: ReconstructionStatus;
  missingComponents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NumericToleranceConfig {
  currencyTolerance: number; // e.g., 0.01
  quantityTolerance: number; // e.g., 0.001
  percentageTolerance: number; // e.g., 0.0001
  roundPrecision: number;
}

export interface DifferenceDetail {
  fieldOrItem: string;
  classification: DifferenceClassification;
  tallyValue: any;
  exfinValue: any;
  tolerated: boolean;
  message: string;
}

export interface EquivalenceTestResult {
  outputId: string;
  equivalenceLevel: EquivalenceLevel;
  overallScore: number; // 0 - 100
  fieldMatchScore: number;
  grainMatchScore: number;
  filterMatchScore: number;
  calculationMatchScore: number;
  relationshipMatchScore: number;
  valueMatchScore: number;
  differences: DifferenceDetail[];
  evidence: string[];
  testedAt: string;
}

export interface HumanReviewOverride {
  overrideId: string;
  outputId: string;
  fieldName?: string;
  overrideType: 'FIELD_ROLE' | 'GRAIN' | 'CALCULATION' | 'RELATIONSHIP' | 'MARK_UNAVAILABLE';
  previousValue: any;
  newValue: any;
  user: string;
  timestamp: string;
  reason: string;
  approved: boolean;
}

export interface MappingVersion {
  version: number;
  outputId: string;
  reconstruction: ReconstructionDefinition;
  overrides: HumanReviewOverride[];
  user: string;
  timestamp: string;
  reason: string;
}

export interface ImpactAnalysisResult {
  outputId: string;
  affectedReports: string[];
  affectedQueries: string[];
  affectedTemplates: string[];
  affectedExports: string[];
  affectedDashboards: string[];
  breakingChangesCount: number;
  warnings: string[];
}

export interface AiSuggestionAuditLog {
  auditId: string;
  outputId: string;
  suggestionType: string;
  suggestion: any;
  evidenceUsed: string[];
  confidence: ConfidenceLevel;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
}

export interface ReconstructionCatalogEntry {
  outputId: string;
  outputName: string;
  category: OutputCategory;
  purpose: OutputPurpose;
  status: ReconstructionStatus;
  equivalenceLevel: EquivalenceLevel;
  confidence: number;
  version: number;
  lastTested: string;
  evidenceCount: number;
  affectedReportsCount: number;
}
