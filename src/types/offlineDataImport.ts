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
  companyName: string;
  financialYearFrom: string;
  financialYearTo: string;
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
}

export interface RawParsedPreview {
  fileType: ImportFileFormat;
  fileName: string;
  fileSize: number;
  detectedCompany?: string;
  detectedFinancialYear?: { from: string; to: string };
  sheets?: string[];
  selectedSheet?: string;
  rawSampleData: Record<string, any[]>;
  detectedEntities: {
    name: string;
    count: number;
    fields: string[];
    sample: any[];
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

export interface CanonicalDatasetRecord {
  id: string;
  metadata: ImportedDatasetSummary;
  companies: any[];
  groups: any[];
  ledgers: any[];
  parties: any[];
  vouchers: any[];
  voucherLines: any[];
  stockItems: any[];
  costCentres: any[];
  taxRecords: any[];
  bankAccounts: any[];
  exceptions: any[];
  rawSourceSample?: any;
}
