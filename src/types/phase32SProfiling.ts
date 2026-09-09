/**
 * Phase 32S: Universal Tally Company Profiling, Semantic Mapping & Cross-Company Templates
 */

export type ProfileStatus =
  | 'DISCOVERING'
  | 'PROFILED'
  | 'PARTIAL'
  | 'NEEDS_REVIEW'
  | 'FAILED';

export type SemanticConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNKNOWN';

export type TemplateScoreType =
  | 'Exact Match'
  | 'Strong Match'
  | 'Partial Match'
  | 'Weak Match'
  | 'No Match';

export interface CompanyProfile {
  profileId: string;
  companyId: string;
  companyName: string;
  tallyVersion: string;
  financialYear: string;
  baseCurrency: string;
  countryRegion: string;
  booksFrom: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  profileStatus: ProfileStatus;
  confidence: number; // 0 to 100
}

export interface CompanyFeatureItem {
  feature: string;
  available: boolean;
  recordCount: number;
  source: string;
  confidence: SemanticConfidence;
  lastChecked: string;
}

export interface IndustryClassification {
  classification: 'Trading' | 'Manufacturing' | 'Services' | 'Distribution' | 'Retail' | 'Mixed';
  evidence: string[];
  confidence: number; // percentage
}

export interface StructuralPattern {
  pattern: 'Inventory Heavy' | 'Accounting Heavy' | 'Order Driven' | 'Cost Centre Driven' | 'Payroll Enabled' | 'Tax Enabled' | 'Multi-Location';
  detected: boolean;
  evidence: string;
}

export interface SemanticMappingItem {
  mappingId: string;
  canonicalConcept: string;
  sourceField: string;
  role: string;
  confidence: SemanticConfidence;
  evidence: string[];
  version: string;
  companyId: string;
  status: 'SUGGESTED' | 'APPROVED' | 'REJECTED' | 'CONFLICT';
}

export interface CompanyTemplate {
  templateId: string;
  name: string;
  type: 'Global' | 'Industry' | 'Tally Version' | 'Workspace' | 'Company';
  priority: number;
  conceptsCount: number;
  matchScore: TemplateScoreType;
}

export interface UnknownConceptRecord {
  conceptName: string;
  sourceField: string;
  evidence: string;
  companyId: string;
}

export interface CustomConceptDefinition {
  conceptId: string;
  name: string;
  description: string;
  mappedField: string;
}
