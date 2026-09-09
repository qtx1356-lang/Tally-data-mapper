/**
 * Phase 32F: Data Quality, Validation, Duplicate Detection, Type Analysis & Controlled Transformation
 *
 * Provides type contracts for:
 * - Data Quality Engine & Dataset/Field Metrics
 * - Validation Rule Engine with Severities and Exceptions
 * - Duplicate Detection Engine (Exact and Probabilistic/Fuzzy)
 * - Controlled Transformation Engine (Rules, Preview, Source Preservation, Lineage)
 */

export type QualityStatus = 'Healthy' | 'Warning' | 'Error' | 'Unknown';

export type QualitySeverity = 'Info' | 'Warning' | 'Error' | 'Critical';

export type ExceptionAction = 'Reviewed' | 'Accepted' | 'Ignored';

export type NullCategory = 'Null' | 'EmptyString' | 'Whitespace' | 'MissingProperty';

export type TypeAnomalyCategory =
  | 'TextWhereNumberExpected'
  | 'TextWhereDateExpected'
  | 'InvalidNumber'
  | 'InvalidDate'
  | 'MixedTypes'
  | 'UnexpectedBoolean'
  | 'UnexpectedObject'
  | 'PrecisionAnomaly';

export type RelationshipErrorCategory =
  | 'MissingParent'
  | 'MissingLedger'
  | 'MissingVoucher'
  | 'MissingStockItem'
  | 'MissingParty'
  | 'MissingCostCentre'
  | 'MissingTaxEntity'
  | 'MissingBankAccount'
  | 'CircularHierarchy';

export type DuplicateType = 'Exact' | 'Possible';

export type TransformationOperation =
  | 'Rename'
  | 'TypeConversion'
  | 'WhitespaceCleanup'
  | 'NullNormalization'
  | 'DateNormalization'
  | 'AliasMapping'
  | 'UnitNormalization';

export type TransformationRuleStatus = 'Draft' | 'Active' | 'Disabled' | 'Deprecated';

/**
 * Quality Finding detail
 */
export interface QualityFinding {
  findingId: string;
  datasetId: string;
  recordId: string;
  field?: string;
  ruleId: string;
  ruleName: string;
  severity: QualitySeverity;
  category: 'RequiredField' | 'Type' | 'Date' | 'Monetary' | 'Quantity' | 'Relationship' | 'Duplicate' | 'Transformation' | 'Custom';
  message: string;
  sourceValue?: any;
  normalizedValue?: any;
  remediationSuggestion: string;
  detectedAt: string;
  companyId: string;
  schemaVersion?: number;
  syncJobId?: string;
  snapshotId?: string;
  exception?: QualityException;
}

/**
 * Exception marked by an authorized user
 */
export interface QualityException {
  exceptionId: string;
  findingId: string;
  recordId: string;
  ruleId: string;
  action: ExceptionAction;
  reason: string;
  user: string;
  timestamp: string;
}

/**
 * Field Quality Metrics
 */
export interface FieldQualityMetrics {
  fieldName: string;
  recordCount: number;
  nullCount: number;
  emptyCount: number;
  whitespaceCount: number;
  missingCount: number;
  nullRate: number; // 0.0 to 1.0
  distinctCount: number;
  invalidCount: number;
  sourceCoverage: number; // Percentage of records having valid source values
  typeDistribution: Record<string, number>;
  anomaliesDetected: TypeAnomalyCategory[];
  hasTransformation: boolean;
  sampleValues: any[];
}

/**
 * Dataset Quality Summary
 */
export interface DatasetQualitySummary {
  datasetId: string;
  datasetName: string;
  companyId: string;
  status: QualityStatus;
  qualityScore: number; // 0 to 100 technical data completeness score
  totalRecords: number;
  validRecords: number;
  warningRecords: number;
  errorRecords: number;
  unknownRecords: number;
  duplicateRecords: number;
  missingRequiredFieldsCount: number;
  relationshipErrorsCount: number;
  typeErrorsCount: number;
  orphansCount: number;
  cyclesCount: number;
  fieldMetrics: Record<string, FieldQualityMetrics>;
  findings: QualityFinding[];
  evaluatedAt: string;
  schemaVersion: number;
  hasBlockingCriticalFailure: boolean;
}

/**
 * Duplicate Record Match
 */
export interface DuplicateMatch {
  matchId: string;
  companyId: string;
  datasetId: string;
  type: DuplicateType;
  recordA: {
    recordId: string;
    sourceId: string;
    fingerprint?: string;
    payload: Record<string, any>;
    validFrom?: string;
  };
  recordB: {
    recordId: string;
    sourceId: string;
    fingerprint?: string;
    payload: Record<string, any>;
    validFrom?: string;
  };
  similarity: number; // 0.0 to 1.0 (1.0 for Exact)
  matchingFields: string[];
  reason: string;
  detectedAt: string;
  status: 'PendingReview' | 'Dismissed' | 'ConfirmedDuplicate';
}

/**
 * Transformation Rule Definition
 */
export interface TransformationRule {
  ruleId: string;
  name: string;
  datasetId: string;
  field: string;
  operation: TransformationOperation;
  configuration: {
    targetType?: 'number' | 'string' | 'date' | 'boolean';
    whitespaceMode?: 'trim' | 'collapse' | 'both';
    nullReplacements?: string[]; // e.g. ["NA", "N/A", "-"]
    targetNullValue?: any;
    targetDateFormat?: string;
    aliasMap?: Record<string, string>; // "Old" -> "New"
    unitMap?: Record<string, string>; // "NOS" -> "Pcs"
    caseConversion?: 'upper' | 'lower' | 'title';
  };
  version: number;
  status: TransformationRuleStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transformation Preview Result
 */
export interface TransformationPreviewResult {
  ruleId: string;
  datasetId: string;
  field: string;
  recordsAffected: number;
  examples: Array<{
    recordId: string;
    originalValue: any;
    transformedValue: any;
    status: 'Success' | 'ConversionError';
    error?: string;
  }>;
  warnings: string[];
  errors: string[];
  dependentImpact: {
    reports: string[];
    queries: string[];
    dashboards: string[];
    graphNodes: string[];
  };
}

/**
 * Transformed Value with Source Lineage Preservation
 */
export interface TransformedValuePreservation {
  originalValue: any;
  transformedValue: any;
  ruleId: string;
  ruleVersion: number;
  operation: TransformationOperation;
  appliedAt: string;
}

/**
 * Validation Rule Configuration
 */
export interface ValidationRule {
  ruleId: string;
  name: string;
  datasetId: string;
  field?: string;
  condition:
    | 'RequiredField'
    | 'NumericType'
    | 'DateFormat'
    | 'PositiveOrZero'
    | 'ReferenceExists'
    | 'UniqueSourceId'
    | 'NoCircularDependency'
    | 'ValidCurrency'
    | 'CustomRegex';
  conditionConfig?: Record<string, any>;
  severity: QualitySeverity;
  message: string;
  remediationTemplate: string;
  isCriticalBlocking: boolean; // If true and fails, dataset cannot be marked current
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quality Score Trend Entry
 */
export interface QualityTrendPoint {
  timestamp: string;
  syncJobId?: string;
  companyId: string;
  datasetId: string;
  score: number;
  validPercentage: number;
  errorCount: number;
  warningCount: number;
}

/**
 * Overall Company Quality Center Dashboard Model
 */
export interface CompanyQualityDashboard {
  companyId: string;
  overallScore: number;
  status: QualityStatus;
  totalRecordsAnalyzed: number;
  totalErrors: number;
  totalWarnings: number;
  totalDuplicates: number;
  totalOrphans: number;
  totalCycles: number;
  datasetSummaries: DatasetQualitySummary[];
  recentFindings: QualityFinding[];
  remediationSuggestions: Array<{
    id: string;
    datasetId: string;
    type: string;
    priority: 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    actionLabel: string;
    affectedCount: number;
  }>;
  trend: {
    previousScore: number;
    currentScore: number;
    change: number;
    history: QualityTrendPoint[];
  };
  lastEvaluatedAt: string;
}

/**
 * Interfaces for Engine Contracts
 */
export interface IDataQualityEngine {
  evaluateDatasetQuality(datasetId: string, companyId: string): Promise<DatasetQualitySummary>;
  evaluateCompanyQuality(companyId: string, financialYear?: string): Promise<CompanyQualityDashboard>;
  getFindings(companyId: string, datasetId?: string, severity?: QualitySeverity): QualityFinding[];
  addException(findingId: string, action: ExceptionAction, reason: string, user: string): QualityException;
  getExceptions(companyId: string): QualityException[];
  getTrend(companyId: string, datasetId?: string): QualityTrendPoint[];
}

export interface IDuplicateDetectionEngine {
  findExactDuplicates(datasetId: string, companyId: string): DuplicateMatch[];
  findPossibleDuplicates(datasetId: string, companyId: string, threshold?: number): DuplicateMatch[];
  reviewDuplicate(matchId: string, status: 'ConfirmedDuplicate' | 'Dismissed', user: string): void;
}

export interface ITransformationEngine {
  createRule(rule: Omit<TransformationRule, 'ruleId' | 'version' | 'createdAt' | 'updatedAt'>): TransformationRule;
  updateRule(ruleId: string, updates: Partial<TransformationRule>): TransformationRule;
  approveRule(ruleId: string, approvedBy: string): TransformationRule;
  previewTransformation(ruleId: string, companyId: string, sampleSize?: number): Promise<TransformationPreviewResult>;
  applyTransformations(datasetId: string, companyId: string): Promise<{ recordsProcessed: number; transformationsApplied: number; errors: number }>;
  getTransformationRules(datasetId?: string): TransformationRule[];
}

export interface IValidationRuleEngine {
  registerRule(rule: Omit<ValidationRule, 'ruleId' | 'createdAt' | 'updatedAt'>): ValidationRule;
  getValidationRules(datasetId?: string): ValidationRule[];
  validateRecord(record: Record<string, any>, datasetId: string, companyId: string): QualityFinding[];
}
