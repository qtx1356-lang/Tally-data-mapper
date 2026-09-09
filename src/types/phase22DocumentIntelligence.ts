// Phase 22 - Enterprise Document Intelligence & OCR Types

export type BusinessDocumentType =
  | 'Purchase Invoice'
  | 'Sales Invoice'
  | 'Purchase Order'
  | 'Sales Order'
  | 'Delivery Challan'
  | 'Goods Receipt'
  | 'Debit Note'
  | 'Credit Note'
  | 'Payment Advice'
  | 'Bank Advice'
  | 'Tax Document'
  | 'Other Business Document';

export type DocumentProcessingStatus =
  | 'Uploaded'
  | 'Queued'
  | 'Processing'
  | 'Extracted'
  | 'Needs Review'
  | 'Matched'
  | 'Exception'
  | 'Completed'
  | 'Failed';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'Not Detected';

export type SupportedDocFormat = 'PDF' | 'JPG' | 'JPEG' | 'PNG' | 'TIFF' | 'WEBP' | 'XLSX' | 'CSV';

export type ExtractionMethod = 'OCR' | 'Text Parser' | 'Pattern' | 'Table Parser' | 'Template' | 'User Correction';

export type TaxValidationStatus = 'Valid' | 'Warning' | 'Mismatch' | 'Insufficient Data';

export type DuplicateStatus = 'Unique' | 'Possible Duplicate' | 'Confirmed Duplicate';

export type MatchCategory = 'Exact' | 'Strong' | 'Possible' | 'Conflict' | 'No Match';

export type ExceptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type ExceptionStatus = 'Open' | 'Assigned' | 'Investigating' | 'Resolved' | 'Rejected' | 'Ignored' | 'Closed';

export type ExceptionType =
  | 'Missing Match'
  | 'Duplicate'
  | 'Amount Difference'
  | 'Date Difference'
  | 'Party Difference'
  | 'Tax Difference'
  | 'Missing Field'
  | 'OCR Problem'
  | 'Classification Problem'
  | 'PO Quantity Variance'
  | 'PO Price Variance';

export interface BoundingBox {
  pageNumber: number;
  x: number; // percentage or px
  y: number;
  width: number;
  height: number;
}

export interface ExtractedField {
  fieldKey: string;
  label: string;
  detectedRawValue: string;
  normalizedValue: any;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0 - 100
  sourceLocation: string; // e.g. "Page 1 [X:120, Y:450]"
  bbox?: BoundingBox;
  extractionMethod: ExtractionMethod;
  isUserCorrected: boolean;
  originalValue?: string;
  correctedBy?: string;
  correctedAt?: string;
  validationError?: string;
}

export interface DocumentLineItem {
  lineId: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discount?: number;
  taxableAmount: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalAmount: number;
  bbox?: BoundingBox;
  confidence: ConfidenceLevel;
  matchedTallyItemCode?: string;
}

export interface DocumentTable {
  tableId: string;
  tableType: 'Item Table' | 'Tax Table' | 'Summary Table';
  pageNumber: number;
  headers: string[];
  rows: Record<string, string>[];
  lineItems?: DocumentLineItem[];
  bbox?: BoundingBox;
  confidence: ConfidenceLevel;
}

export interface TaxValidationResult {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  computedGrandTotal: number;
  statedGrandTotal: number;
  discrepancy: number;
  status: TaxValidationStatus;
  calculationExplanation: string;
}

export interface DuplicateDetectionResult {
  status: DuplicateStatus;
  confidenceScore: number;
  matchingDocumentIds: string[];
  reasons: string[];
}

export interface DocumentMatchResult {
  documentId: string;
  matchCategory: MatchCategory;
  matchScore: number; // 0 - 100
  matchedTallyVoucherId?: string;
  matchedTallyVoucherNumber?: string;
  matchedTallyVoucherType?: string;
  matchedTallyDate?: string;
  matchedTallyAmount?: number;
  matchedTallyParty?: string;
  explanation: string;
  differences: {
    field: string;
    documentValue: any;
    tallyValue: any;
    differenceAmount?: number;
    isMatched: boolean;
  }[];
}

export interface ThreeWayMatchResult {
  poNumber: string;
  challanNumber?: string;
  invoiceNumber: string;
  supplier: string;
  orderedAmount: number;
  receivedAmount: number;
  invoicedAmount: number;
  orderedQuantity: number;
  receivedQuantity: number;
  invoicedQuantity: number;
  quantityVariance: number;
  priceVariance: number;
  amountVariance: number;
  isMatched: boolean;
  statusComment: string;
  exceptions: string[];
}

export interface DocumentRelationshipNode {
  id: string;
  type: BusinessDocumentType;
  label: string;
  documentId?: string;
  voucherNumber?: string;
  amount: number;
  date: string;
  status: string;
}

export interface DocumentRelationshipEdge {
  from: string;
  to: string;
  relationshipType: 'Fulfilled By' | 'Billed By' | 'Adjusted By' | 'Paid By' | 'References';
  confidence: ConfidenceLevel;
}

export interface DocumentRelationshipGraph {
  nodes: DocumentRelationshipNode[];
  edges: DocumentRelationshipEdge[];
}

export interface DocumentException {
  exceptionId: string;
  documentId: string;
  documentNumber: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string;
  owner: string;
  assignedRole: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionAudit?: {
    who: string;
    when: string;
    action: string;
    reason: string;
  };
}

export interface DocumentAuditRecord {
  auditId: string;
  documentId: string;
  action:
    | 'Upload'
    | 'Classify'
    | 'Extract'
    | 'Correction'
    | 'Match'
    | 'Unmatch'
    | 'Override'
    | 'Export'
    | 'Delete'
    | 'View'
    | 'Resolve';
  user: string;
  userRole: string;
  timestamp: string;
  details: string;
  previousState?: any;
  newState?: any;
}

export interface IntelligentDocument {
  documentId: string;
  companyId: string;
  companyName: string;
  fileName: string;
  fileFormat: SupportedDocFormat;
  fileSizeBytes: number;
  fileHashSha256: string;
  pageCount: number;
  documentType: BusinessDocumentType;
  classificationConfidence: ConfidenceLevel;
  classificationConfidenceScore: number;
  processingStatus: DocumentProcessingStatus;
  reviewPriority: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
  reviewReasons: string[];
  ocrProvider: 'Local OCR Engine' | 'Cloud OCR';
  ocrRawText: string;
  ocrModelVersion: string;
  createdAt: string;
  createdBy: string;
  version: number;
  fields: ExtractedField[];
  tables: DocumentTable[];
  taxValidation: TaxValidationResult;
  duplicateCheck: DuplicateDetectionResult;
  tallyMatch?: DocumentMatchResult;
  threeWayMatch?: ThreeWayMatchResult;
  relationshipGraph?: DocumentRelationshipGraph;
  tags: string[];
  notes: string[];
  dataClassification: 'Confidential' | 'Restricted' | 'Internal';
}

export interface DocumentProcessingReport {
  totalDocuments: number;
  extractedCount: number;
  needsReviewCount: number;
  matchedCount: number;
  exceptionsCount: number;
  duplicateCandidateCount: number;
  averageProcessingTimeMs: number;
  ocrPagesProcessed: number;
  threeWayMatchHealthPercent: number;
}
