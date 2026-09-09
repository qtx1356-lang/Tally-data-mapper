export type ReportClassification = 'Standard' | 'Custom' | 'TDL' | 'Derived' | 'Unknown';

export type ReportReconstructionStatus =
  | 'Discovered'
  | 'Partially Discovered'
  | 'Mapped'
  | 'Reconstructed'
  | 'Partially Reconstructed'
  | 'Unavailable'
  | 'Requires Manual Mapping';

export type ReportLineageConfidence = 'Confirmed' | 'High' | 'Medium' | 'Low';

export type ParityLevel = 'Exact' | 'Near Exact' | 'Structural Match' | 'Data Match' | 'Partial' | 'Unknown';

export type CalculationStatus =
  | 'Formula Discovered'
  | 'FormulaDiscovered'
  | 'Formula Inferred'
  | 'FormulaInferred'
  | 'Value Only'
  | 'ValueOnly'
  | 'Unknown';

export type ParameterType =
  | 'Text'
  | 'Number'
  | 'Date'
  | 'Date Range'
  | 'Boolean'
  | 'Single Select'
  | 'Multi Select'
  | 'Object Reference';

export type ReportRowType =
  | 'Data Row'
  | 'Subtotal'
  | 'Grand Total'
  | 'Header'
  | 'Footer'
  | 'Separator'
  | 'Calculated Row'
  | 'Group Row';

export type DifferenceClassification =
  | 'Source Difference'
  | 'Mapping Difference'
  | 'Calculation Difference'
  | 'Rounding Difference'
  | 'Formatting Difference'
  | 'FormattingDifference'
  | 'Missing Column'
  | 'Extra Column'
  | 'Row Difference'
  | 'Ordering Difference'
  | 'Grouping Difference'
  | 'Unknown';

export interface ReportParameterDefinition {
  parameterName: string;
  displayName: string;
  type: ParameterType;
  isRequired: boolean;
  defaultValue?: any;
  allowedValues: string[];
  validationRules?: string;
  targetQueryField?: string;
  mappingConfidence: ReportLineageConfidence;
}

export interface ReportColumnDefinition {
  columnName: string;
  displayName: string;
  sourceField: string;
  sourceObject: string;
  sourceCollection: string;
  dataType: string;
  width: number;
  format?: string;
  isVisible: boolean;
  displayOrder: number;
  columnGroup?: string;
  calculationStatus: CalculationStatus;
  calculationFormula?: string;
  lineageConfidence: ReportLineageConfidence;
}

export interface ReportCoverageMetric {
  structureCoveragePct: number;
  fieldCoveragePct: number;
  dataCoveragePct: number;
  calculationCoveragePct: number;
  summaryNotes: string;
}

export interface ReconstructedReportDefinition {
  reportId: string;
  name: string;
  displayName: string;
  category: string;
  source: string;
  type: ReportClassification;
  status: ReportReconstructionStatus;
  companyId: string;
  tallyVersion: string;
  schemaVersion: string;
  discoveryVersion: string;
  reconstructionVersion: string;
  discoveredAt: string;
  lastReconstructedAt: string;
  parameters: ReportParameterDefinition[];
  columns: ReportColumnDefinition[];
  underlyingCollections: string[];
  underlyingObjects: string[];
  coverage: ReportCoverageMetric;
  reconstructionLimitations: string[];
  isCloned?: boolean;
  sourceTallyReportId?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
}

export interface ParityDimensionCheck {
  dimension: string;
  tallyValue: string | number;
  exfinValue: string | number;
  isMatched: boolean;
  differenceType?: DifferenceClassification;
  notes?: string;
}

export interface ParityTestResult {
  testId: string;
  reportId: string;
  reportName: string;
  companyId: string;
  executedAt: string;
  overallParity: ParityLevel;
  numericToleranceAllowed: number;
  controlTotalsMatched: boolean;
  tallyControlTotal: number;
  exfinControlTotal: number;
  varianceAmount: number;
  dimensionChecks: ParityDimensionCheck[];
  identifiedDifferences: string[];
  verificationSummary: string;
}

export interface TdlStaticAnalysisResult {
  analysisId: string;
  fileName: string;
  totalLinesOfCode: number;
  discoveredReports: string[];
  discoveredCollections: string[];
  discoveredForms: string[];
  discoveredParts: string[];
  discoveredLines: string[];
  discoveredFields: string[];
  discoveredVariables: string[];
  discoveredMethods: string[];
  containsExecutableRisk: boolean;
  securityAuditStatus: string;
}

export interface ReportObjectGraphNode {
  id: string;
  label: string;
  type: 'Report' | 'Collection' | 'Object' | 'Field' | 'Calculation';
  details: string;
  confidence: ReportLineageConfidence;
}

export interface ReportObjectGraphEdge {
  from: string;
  to: string;
  relation: string;
}

export interface MultiCompanyCompatibilityResult {
  targetCompanyId: string;
  targetCompanyName: string;
  compatibilityLevel: 'Compatible' | 'Partially Compatible' | 'Needs Remapping' | 'Incompatible';
  supportedFields: string[];
  missingFields: string[];
  unsupportedParameters: string[];
  recommendation: string;
}
