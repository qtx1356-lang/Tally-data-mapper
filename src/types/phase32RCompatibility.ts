/**
 * Phase 32R: Tally Version Compatibility, Advanced XML/TDL Parser & Schema Evolution Types
 */

export type CompatibilityState =
  | 'FULL'
  | 'PARTIALLY_COMPATIBLE'
  | 'UNKNOWN'
  | 'INCOMPATIBLE'
  | 'NEEDS_TESTING';

export type MigrationState =
  | 'NO_CHANGE'
  | 'AUTO_MIGRATABLE'
  | 'REVIEW_REQUIRED'
  | 'BROKEN';

export interface TallyVersionProfile {
  versionId: string;
  product: string;
  major: number;
  minor: number;
  build: string;
  detectedAt: string;
  detectionMethod: 'Protocol characteristic' | 'XML Metadata' | 'Connection metadata' | 'User configuration' | 'Unknown';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  compatibilityStatus: CompatibilityState;
}

export interface CapabilityProfileItem {
  capability: string;
  supported: boolean;
  evidence: string;
  testedAt: string;
  version: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TDLDefinitionNode {
  id: string;
  name: string;
  type: 'Report' | 'Form' | 'Part' | 'Line' | 'Field' | 'Collection' | 'Formula';
  formulaExpression?: string;
  children: string[]; // references child node ids
  isUnsupported?: boolean;
}

export interface SchemaChangeItem {
  type: 'Added Field' | 'Removed Field' | 'Renamed Field' | 'Type Changed' | 'Collection Added' | 'Collection Removed' | 'Hierarchy Changed' | 'Parameter Changed';
  collection: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  suggestedAction?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SchemaVersion {
  schemaId: string;
  company: string;
  tallyVersion: string;
  detectedAt: string;
  hash: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  changesCount: number;
  changes: SchemaChangeItem[];
}

export interface MigrationMappingProposal {
  outputId: string;
  oldField: string;
  newFieldCandidate: string;
  reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  state: MigrationState;
}
