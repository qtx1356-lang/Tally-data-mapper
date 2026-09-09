/**
 * Phase 32Q: Universal Tally Output Compatibility Types
 */

export type OutputStatus =
  | 'DISCOVERED'
  | 'MAPPED'
  | 'RECONSTRUCTABLE'
  | 'PARTIALLY_RECONSTRUCTABLE'
  | 'UNSUPPORTED'
  | 'BLOCKED'
  | 'UNKNOWN';

export type OutputAvailability = {
  outputExists: boolean;
  dataExists: boolean;
  mappingExists: boolean;
  reconstructionPossible: boolean;
};

export type MappingConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type FieldOrigin = 'STANDARD' | 'CUSTOM' | 'UNKNOWN';

export interface TallyOutputDefinition {
  outputId: string;
  outputName: string;
  displayName: string;
  category: string;
  description: string;
  sourceCollection: string;
  requiredFields: string[];
  requiredRelationships: string[];
  parameters: string[];
  grain: string;
  formula?: string;
  status: OutputStatus;
  availability: OutputAvailability;
  confidence: MappingConfidence;
  evidence: string[];
  version: number;
  companyScope: string;
}

export interface CollectionInventoryItem {
  collectionName: string;
  objectType: string;
  fields: {
    name: string;
    type: string;
    origin: FieldOrigin;
    nullable: boolean;
    semanticRole?: string;
  }[];
  recordCount: number;
  availability: boolean;
  lastTested: string;
}

export interface CustomTDLDefinition {
  tdlId: string;
  reportName: string;
  collectionName: string;
  fieldName: string;
  objectType: string;
  formulaExpression?: string;
  definitionSource: string;
  detectedAt: string;
}

export interface OutputDependencyNode {
  id: string;
  label: string;
  type: 'output' | 'dataset' | 'field' | 'relationship' | 'calculation';
}

export interface OutputDependencyLink {
  source: string;
  target: string;
}

export interface OutputDependencyGraph {
  nodes: OutputDependencyNode[];
  links: OutputDependencyLink[];
}

export interface XMLAnalysisResult {
  tagsCount: Record<string, number>;
  detectedCollections: string[];
  detectedFields: { name: string; estimatedType: string }[];
  xmlStructureType: string; // e.g. "Voucher Payload", "Master Export"
  schemaDifferences?: string[];
}

export interface UnknownOutputRecord {
  recordId: string;
  name: string;
  evidenceText: string;
  sourceContext: string;
  missingFields: string[];
  possibleDependencies: string[];
  suggestedInvestigation: string;
  detectedAt: string;
}
