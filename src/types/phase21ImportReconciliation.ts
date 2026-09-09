// Phase 21 - Universal Data Import & External Data Reconciliation Types

export type SupportedFileFormat = 'XLSX' | 'CSV' | 'TSV' | 'JSON' | 'XML' | 'PDF' | 'TXT';

export type ExternalSourceType =
  | 'Excel'
  | 'CSV'
  | 'Bank Statement'
  | 'GST Data'
  | 'Payroll'
  | 'Inventory'
  | 'Sales'
  | 'Purchase'
  | 'Customer'
  | 'Supplier'
  | 'Custom';

export type PdfClassification = 'Text PDF' | 'Scanned PDF' | 'Table PDF' | 'Image-only PDF';

export type SemanticFieldRole =
  | 'Date'
  | 'ValueDate'
  | 'Amount'
  | 'Debit'
  | 'Credit'
  | 'Balance'
  | 'Reference'
  | 'ChequeNumber'
  | 'UTR'
  | 'InvoiceNumber'
  | 'InvoiceDate'
  | 'PartyName'
  | 'Customer'
  | 'Supplier'
  | 'Ledger'
  | 'GSTIN'
  | 'TaxableValue'
  | 'TaxAmount'
  | 'CGST'
  | 'SGST'
  | 'IGST'
  | 'ItemCode'
  | 'ItemName'
  | 'Quantity'
  | 'Rate'
  | 'Unit'
  | 'EmployeeId'
  | 'EmployeeName'
  | 'GrossPay'
  | 'Deductions'
  | 'NetPay'
  | 'Description'
  | 'Custom';

export type DataType =
  | 'String'
  | 'Integer'
  | 'Decimal'
  | 'Date'
  | 'DateTime'
  | 'Boolean'
  | 'Currency'
  | 'Percentage';

export type MappingConfidence = 'High' | 'Medium' | 'Low' | 'Manual';

export type MatchCategory = 'Exact Match' | 'Strong Match' | 'Possible Match' | 'No Match' | 'Conflict';

export type MatchCardinality = 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';

export type MatchingStrategy =
  | 'Exact'
  | 'Reference'
  | 'Amount'
  | 'Date'
  | 'Party'
  | 'Combined'
  | 'Fuzzy';

export type DifferenceType =
  | 'Missing in Tally'
  | 'Missing External'
  | 'Amount Difference'
  | 'Date Difference'
  | 'Reference Difference'
  | 'Party Difference'
  | 'Duplicate'
  | 'Conflict'
  | 'Tax Difference'
  | 'GSTIN Difference'
  | 'Quantity Difference'
  | 'Unit Difference';

export type ReconciliationSessionStatus =
  | 'Draft'
  | 'Running'
  | 'Completed'
  | 'Partial'
  | 'Failed'
  | 'Archived';

export interface DataQualityMetrics {
  completeness: number; // 0-100%
  typeValidity: number; // 0-100%
  duplicateRate: number; // 0-100%
  mappingCoverage: number; // 0-100%
  overallScore?: number;
}

export interface ColumnProfile {
  columnName: string;
  detectedType: DataType;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: (string | number | boolean | null)[];
  suggestedSemanticRole?: SemanticFieldRole;
  suggestedConfidence?: MappingConfidence;
  minNumeric?: number;
  maxNumeric?: number;
  minDate?: string;
  maxDate?: string;
}

export interface DataProfileReport {
  rowCount: number;
  columnCount: number;
  fileFingerprintSha256: string;
  fileSizeBytes: number;
  columns: ColumnProfile[];
  qualityMetrics: DataQualityMetrics;
  duplicateCandidateCount: number;
  hasHeader: boolean;
  detectedHeaderRowIndex: number;
  detectedDelimiter?: string;
  detectedEncoding?: string;
  isAmbiguousDateDetected?: boolean;
  detectedDateFormat?: string;
  isAmbiguousNumberDetected?: boolean;
  detectedNumberLocale?: string;
}

export interface ColumnMappingDefinition {
  mappingId: string;
  externalColumn: string;
  targetSemanticField: SemanticFieldRole;
  targetDataType: DataType;
  confidence: MappingConfidence;
  isUserConfirmed: boolean;
  isCustomField?: boolean;
  transformationPipeline: string[]; // e.g., ['Trim', 'Uppercase', 'CurrencyINRToDecimal']
  fallbackValue?: any;
}

export interface SourceLineage {
  fileName: string;
  fileSha256: string;
  sheetName?: string;
  pageNumber?: number;
  tableIndex?: number;
  rowIndex: number;
  columnName: string;
  rawSourceLocation: string; // e.g. "sales.xlsx -> Sheet: April -> Row: 152 -> Col: Invoice Amount"
  ocrConfidence?: number;
  isOcrDerived?: boolean;
}

export interface NormalizedDataRow {
  rowId: string;
  rawValues: Record<string, any>;
  normalizedValues: Record<string, any>;
  lineage: SourceLineage;
  isValid: boolean;
  validationErrors: string[];
}

export interface ExternalDataset {
  datasetId: string;
  datasetName: string;
  companyId: string;
  companyName: string;
  sourceType: ExternalSourceType;
  fileFormat: SupportedFileFormat;
  originalFileName: string;
  fileFingerprintSha256: string;
  fileSizeBytes: number;
  version: number;
  importedAt: string;
  importedBy: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  warningCount: number;
  columnMappings: ColumnMappingDefinition[];
  profile: DataProfileReport;
  rows: NormalizedDataRow[];
  dataClassification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  retentionStatus: 'Keep' | 'Archive' | 'Deleted';
}

export interface MatchingRuleConfig {
  ruleId: string;
  ruleName: string;
  strategy: MatchingStrategy;
  cardinality: MatchCardinality;
  amountTolerance: number; // e.g. 1.0 (INR)
  dateToleranceDays: number; // e.g. 2 days
  partyFuzzyThreshold: number; // 0.0 - 1.0 (e.g. 0.85 Jaro-Winkler)
  referenceExactMatch: boolean;
  requireSameSign: boolean;
  ignoreSpecialCharacters: boolean;
  customExpressions?: string[];
}

export interface FieldComparisonDetail {
  field: string;
  externalValue: any;
  tallyValue: any;
  rawExternalValue?: any;
  difference?: any;
  isMatched: boolean;
  statusComment?: string;
}

export interface ReconciliationPairResult {
  pairId: string;
  externalRowId: string;
  externalRow: NormalizedDataRow;
  tallyVoucherIds: string[];
  tallyVouchers: any[]; // Verified read-only records from Tally cache
  matchCategory: MatchCategory;
  matchScore: number; // 0-100
  differenceType?: DifferenceType;
  differenceAmount?: number;
  differenceDateDays?: number;
  reason: string;
  cardinality: MatchCardinality;
  fieldComparisons: FieldComparisonDetail[];
  isManualOverride: boolean;
  overrideBy?: string;
  overrideAt?: string;
  overrideReason?: string;
  originalAutoMatchCategory?: MatchCategory;
}

export interface ReconciliationSession {
  sessionId: string;
  sessionName: string;
  companyId: string;
  companyName: string;
  sourceType: ExternalSourceType;
  externalDatasetId: string;
  externalDatasetVersion: number;
  tallyDatasetVersion: string;
  tallySourceType: 'Live Tally' | 'Local Parquet Dataset';
  period: string;
  matchingRule: MatchingRuleConfig;
  status: ReconciliationSessionStatus;
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  totalExternalCount: number;
  totalTallyEvaluated: number;
  exactMatchCount: number;
  strongMatchCount: number;
  possibleMatchCount: number;
  unmatchedCount: number;
  conflictCount: number;
  manualOverrideCount: number;
  matchRatePercentage: number;
  results: ReconciliationPairResult[];
  snapshot: {
    datasetVersion: string;
    mappingVersion: string;
    ruleVersion: string;
    engineDeterministicSignature: string;
  };
}

export interface BankStatementBalanceValidation {
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  computedClosingBalance: number;
  statedClosingBalance: number;
  isBalanced: boolean;
  discrepancy: number;
}

export interface ReconciliationAuditLog {
  auditId: string;
  sessionId?: string;
  action: 'Import' | 'Mapping' | 'Transformation' | 'Reconcile' | 'ManualMatch' | 'Unmatch' | 'Override' | 'Export' | 'Delete';
  userId: string;
  userRole: string;
  timestamp: string;
  details: string;
  previousState?: any;
  newState?: any;
}
