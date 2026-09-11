export type DataSourceMode = 'LIVE_TALLY' | 'OFFLINE_DATASET';

export type ImportFileFormat = 'XML' | 'JSON' | 'EXCEL';

export type FieldMappingConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type FieldMappingStatus = 'MAPPED' | 'REVIEW_REQUIRED' | 'UNMAPPED';

export type CanonicalEntityName =
  | 'Company'
  | 'Ledger'
  | 'Group'
  | 'Voucher'
  | 'VoucherLine'
  | 'Party'
  | 'Customer'
  | 'Supplier'
  | 'StockItem'
  | 'StockGroup'
  | 'CostCentre'
  | 'BankAccount'
  | 'TaxRecord'
  | 'GSTRecord'
  | 'Payment'
  | 'Receipt'
  | 'SalesTransaction'
  | 'PurchaseTransaction'
  | 'JournalTransaction'
  | 'ExpenseTransaction';

export interface SourceTraceability {
  sourceFileType: ImportFileFormat;
  sourceFile: string;
  sourcePath?: string;      // XML Path e.g. TALLYMESSAGE/VOUCHER[14]
  jsonPath?: string;        // JSON Path e.g. $.vouchers[2].amount
  worksheet?: string;       // Excel Worksheet name
  rowNumber?: number;       // Excel 1-based Row Number
  columnName?: string;      // Excel Column Name
  sourceField?: string;     // Source Field Name
  rawSourceValue?: any;     // Exact raw unparsed value
}

export interface FieldMappingItem {
  id: string;
  sourceField: string;
  sourcePath: string;
  sourceEntity: string;
  canonicalEntity: CanonicalEntityName;
  canonicalField: string;
  confidence: FieldMappingConfidence;
  confidenceScore: number; // 0 to 100
  status: FieldMappingStatus;
  sampleValues: any[];
  detectedDataType: string;
  isUserOverridden?: boolean;
  notes?: string;
  transformationRule?: string;
  traceability?: SourceTraceability;
}

export interface MasterCounts {
  ledgers: number;
  groups: number;
  parties: number;
  stockItems: number;
  costCentres: number;
  bankAccounts: number;
}

export interface VoucherCounts {
  total: number;
  sales: number;
  purchase: number;
  payment: number;
  receipt: number;
  journal: number;
  contra: number;
  other: number;
}

export interface DataQualityReport {
  score: number; // 0 - 100
  totalRecordsChecked: number;
  passedRecords: number;
  duplicateVouchers: number;
  missingDates: number;
  invalidAmounts: number;
  unbalancedVouchers: number;
  orphanLedgers: number;
  unmappedFieldsCount: number;
  reviewRequiredFieldsCount: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface ImportedDatasetSummary {
  id: string;
  name: string;
  description?: string;
  sourceFileName: string;
  sourceFileType: ImportFileFormat;
  sourceFileSize: number;
  companyName: string | null;
  financialYearFrom: string | null;
  financialYearTo: string | null;
  isFinancialYearDetected: boolean;
  financialYearDetectionSource?: string;
  importedAt: string;
  totalRecords: number;
  masterCounts: MasterCounts;
  voucherCounts: VoucherCounts;
  dataQualityScore: number;
  dataQualityReport: DataQualityReport;
  status: 'Ready' | 'In Progress' | 'Failed' | 'Draft';
  mappingsCount: {
    total: number;
    mapped: number;
    reviewRequired: number;
    unmapped: number;
  };
  isActive?: boolean;
  isDemoData?: boolean;
}

export interface RawParsedPreview {
  fileType: ImportFileFormat;
  fileName: string;
  fileSize: number;
  detectedCompany: string | null;
  detectedFinancialYear: {
    from: string | null;
    to: string | null;
    isDetected: boolean;
    detectionSource: string;
  };
  sheets?: string[];
  selectedSheet?: string;
  rawSampleData: Record<string, any[]>;
  detectedEntities: {
    name: string;
    count: number;
    fields: string[];
    sample: any[];
    classifiedAs?: string;
  }[];
}

export interface ImportSessionState {
  sessionId: string;
  currentStep: number;
  fileInfo: {
    name: string;
    size: number;
    type: ImportFileFormat;
    lastModified: number;
  };
  preview?: RawParsedPreview;
  mappings: FieldMappingItem[];
  qualityReport?: DataQualityReport;
  dataset?: ImportedDatasetSummary;
  isProcessing: boolean;
  progressPercent: number;
  progressMessage: string;
  errorMessage?: string;
}

export interface CanonicalVoucherLine {
  id: string;
  ledgerName: string | null;
  amount: number | null;
  isDebit: boolean | null;
  isDeemedPositive?: boolean | null;
  rawAmount?: any;
  reviewRequired?: boolean;
  reviewReason?: string;
  traceability?: SourceTraceability;
}

export interface CanonicalVoucher {
  id: string;
  voucherNumber: string | null;
  voucherType: string | null;
  date: string | null;
  partyLedger: string | null;
  amount: number | null;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
  narration: string | null;
  entries: CanonicalVoucherLine[];
  reviewRequired?: boolean;
  reviewReasons?: string[];
  sourceFile: string;
  datasetId: string;
  traceability?: SourceTraceability;
}

export interface CanonicalAuditException {
  id: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  date: string | null;
  voucherNo: string | null;
  voucherType: string | null;
  ledger: string | null;
  party: string | null;
  amount: number | null;
  exceptionType: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
  traceability?: SourceTraceability;
}

export interface CanonicalDatasetRecord {
  id: string;
  metadata: ImportedDatasetSummary;
  companies: any[];
  groups: any[];
  ledgers: any[];
  parties: any[];
  vouchers: CanonicalVoucher[];
  voucherLines: CanonicalVoucherLine[];
  stockItems: any[];
  costCentres: any[];
  taxRecords: any[];
  bankAccounts: any[];
  exceptions: CanonicalAuditException[];
  mappings: FieldMappingItem[];
  rawSourceSample?: any;
}
