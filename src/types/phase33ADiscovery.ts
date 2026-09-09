/**
 * Phase 33A: Universal Tally Adaptive Discovery & Semantic Mapping Types
 */

export interface DiscoverySnapshot {
  snapshotId: string;
  companyName: string;
  companyIdentifier: string;
  financialYear: string;
  tallyVersion: string;
  discoveryTime: string;
  masters: string[];
  vouchers: string[];
  collections: Array<{
    name: string;
    purpose: string;
    status: 'AVAILABLE' | 'PARTIAL' | 'ERROR';
    fields: Array<{
      fieldName: string;
      type: string;
      availability: 'AVAILABLE' | 'NULL_HEAVY' | 'MISSING';
    }>;
  }>;
  warnings: string[];
  errors: string[];
}

export interface SemanticMapping {
  mappingId: string;
  sourceCollection: string;
  sourceField: string;
  targetConcept: string;
  confidence: number;
  reason: string;
  status: 'MAPPED' | 'UNMAPPED' | 'REQUIRES_REVIEW' | 'OVERRIDDEN';
  mappingVersion: string;
  isLocked: boolean;
  sampleValues: string[];
}

export interface OutputCapability {
  outputId: string;
  name: string;
  category: string;
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'REQUIRES_MAPPING' | 'REQUIRES_REVIEW';
  reason: string;
  sourceType: 'TALLY NATIVE' | 'APPLICATION GENERATED' | 'CONSOLIDATED' | 'ANALYTICAL';
  dependencies: {
    requiredDatasets: string[];
    requiredFields: string[];
    requiredMappings: string[];
  };
}

export interface DataQualityScore {
  datasetName: string;
  completeness: number; // 0-100
  validity: number; // 0-100
  consistency: number; // 0-100
  mappingConfidence: number; // 0-100
  overallScore: number;
}

export interface CompanyCompatibility {
  companyName: string;
  connectionScore: number;
  discoveryScore: number;
  schemaScore: number;
  mappingScore: number;
  dataQualityScore: number;
  outputCoverage: {
    available: number;
    partial: number;
    unavailable: number;
  };
  overallScore: number;
}
