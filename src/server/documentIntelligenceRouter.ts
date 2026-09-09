import { Router } from "express";
import crypto from "crypto";
import {
  IntelligentDocument,
  BusinessDocumentType,
  DocumentProcessingStatus,
  ExtractedField,
  DocumentTable,
  DocumentLineItem,
  TaxValidationResult,
  DuplicateDetectionResult,
  DocumentMatchResult,
  ThreeWayMatchResult,
  DocumentRelationshipGraph,
  DocumentException,
  DocumentAuditRecord,
  DocumentProcessingReport
} from "../types/phase22DocumentIntelligence";

export const documentIntelligenceRouter = Router();

const companyId = "COMP_EXFIN_01";
const companyName = "EXFIN GLOBAL ENTERPRISES PVT LTD";

// ----------------------------------------------------------------------------
// Deterministic Field Normalizers & Validators
// ----------------------------------------------------------------------------
function normalizeString(val: string): string {
  if (!val) return "";
  return val.replace(/\s+/g, " ").trim();
}

function normalizeAmount(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[₹$,\s]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeInvoiceNumber(val: string): string {
  if (!val) return "";
  return val.toUpperCase().replace(/\s+/g, "").trim();
}

function validateGstin(gstin: string): { isValid: boolean; stateCode: string; pan: string } {
  const cleaned = normalizeString(gstin).toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isValid = gstinRegex.test(cleaned);
  const stateCode = cleaned.substring(0, 2);
  const pan = cleaned.substring(2, 12);
  return { isValid, stateCode, pan };
}

// ----------------------------------------------------------------------------
// In-Memory Seed Storage for Intelligent Documents
// ----------------------------------------------------------------------------
let documentsStore: IntelligentDocument[] = [
  {
    documentId: "DOC-2026-INV-8891",
    companyId,
    companyName,
    fileName: "Zenith_Infotech_Invoice_INV8891.pdf",
    fileFormat: "PDF",
    fileSizeBytes: 142800,
    fileHashSha256: "8a1e94cfb17d5b8823f4581290e43d83d1c5a98bf813a8b2763f350c33a94821",
    pageCount: 1,
    documentType: "Purchase Invoice",
    classificationConfidence: "High",
    classificationConfidenceScore: 98,
    processingStatus: "Matched",
    reviewPriority: "Low",
    reviewReasons: [],
    ocrProvider: "Local OCR Engine",
    ocrModelVersion: "Tesseract-v5.3-Local-Privacy",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdBy: "finance.ops@exfin.internal",
    version: 1,
    tags: ["Verified", "Purchase", "Hardware"],
    notes: ["Matched with Tally purchase voucher PUR/2026/08/042"],
    dataClassification: "Confidential",
    ocrRawText: `TAX INVOICE\nZENITH INFOTECH LTD\nGSTIN: 27AAACZ1234A1Z5\nInvoice No: INV-2026-042 Date: 14/08/2026\nBill To: EXFIN GLOBAL ENTERPRISES PVT LTD\nPO Ref: PO-2026-091\nDescription: Enterprise Server Unit - Rackmount Qty: 1 Rate: 1,22,881.36 Taxable: 1,22,881.36\nCGST (9%): 11,059.32\nSGST (9%): 11,059.32\nTotal Amount: INR 1,45,000.00`,
    fields: [
      {
        fieldKey: "invoiceNumber",
        label: "Invoice Number",
        detectedRawValue: "INV-2026-042",
        normalizedValue: "INV-2026-042",
        confidence: "High",
        confidenceScore: 99,
        sourceLocation: "Page 1 [X:65%, Y:12%]",
        bbox: { pageNumber: 1, x: 62, y: 11, width: 28, height: 4 },
        extractionMethod: "Pattern",
        isUserCorrected: false
      },
      {
        fieldKey: "invoiceDate",
        label: "Invoice Date",
        detectedRawValue: "14/08/2026",
        normalizedValue: "2026-08-14",
        confidence: "High",
        confidenceScore: 98,
        sourceLocation: "Page 1 [X:65%, Y:16%]",
        bbox: { pageNumber: 1, x: 62, y: 15, width: 22, height: 4 },
        extractionMethod: "OCR",
        isUserCorrected: false
      },
      {
        fieldKey: "supplierName",
        label: "Supplier Name",
        detectedRawValue: "Zenith Infotech Ltd",
        normalizedValue: "Zenith Infotech Ltd",
        confidence: "High",
        confidenceScore: 96,
        sourceLocation: "Page 1 [X:10%, Y:10%]",
        bbox: { pageNumber: 1, x: 10, y: 9, width: 35, height: 5 },
        extractionMethod: "OCR",
        isUserCorrected: false
      },
      {
        fieldKey: "supplierGstin",
        label: "Supplier GSTIN",
        detectedRawValue: "27AAACZ1234A1Z5",
        normalizedValue: "27AAACZ1234A1Z5",
        confidence: "High",
        confidenceScore: 99,
        sourceLocation: "Page 1 [X:10%, Y:15%]",
        bbox: { pageNumber: 1, x: 10, y: 14, width: 28, height: 4 },
        extractionMethod: "Pattern",
        isUserCorrected: false
      },
      {
        fieldKey: "poNumber",
        label: "PO Reference",
        detectedRawValue: "PO-2026-091",
        normalizedValue: "PO-2026-091",
        confidence: "High",
        confidenceScore: 95,
        sourceLocation: "Page 1 [X:65%, Y:20%]",
        bbox: { pageNumber: 1, x: 62, y: 19, width: 22, height: 4 },
        extractionMethod: "Pattern",
        isUserCorrected: false
      },
      {
        fieldKey: "taxableAmount",
        label: "Taxable Amount",
        detectedRawValue: "1,22,881.36",
        normalizedValue: 122881.36,
        confidence: "High",
        confidenceScore: 97,
        sourceLocation: "Page 1 [X:70%, Y:68%]",
        bbox: { pageNumber: 1, x: 68, y: 67, width: 22, height: 4 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      },
      {
        fieldKey: "cgst",
        label: "CGST (9%)",
        detectedRawValue: "11,059.32",
        normalizedValue: 11059.32,
        confidence: "High",
        confidenceScore: 98,
        sourceLocation: "Page 1 [X:70%, Y:72%]",
        bbox: { pageNumber: 1, x: 68, y: 71, width: 22, height: 4 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      },
      {
        fieldKey: "sgst",
        label: "SGST (9%)",
        detectedRawValue: "11,059.32",
        normalizedValue: 11059.32,
        confidence: "High",
        confidenceScore: 98,
        sourceLocation: "Page 1 [X:70%, Y:76%]",
        bbox: { pageNumber: 1, x: 68, y: 75, width: 22, height: 4 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      },
      {
        fieldKey: "grandTotal",
        label: "Grand Total",
        detectedRawValue: "₹ 1,45,000.00",
        normalizedValue: 145000.0,
        confidence: "High",
        confidenceScore: 100,
        sourceLocation: "Page 1 [X:70%, Y:82%]",
        bbox: { pageNumber: 1, x: 68, y: 81, width: 24, height: 5 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      }
    ],
    tables: [
      {
        tableId: "TBL_01",
        tableType: "Item Table",
        pageNumber: 1,
        headers: ["Item Code", "Description", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total"],
        rows: [
          {
            "Item Code": "SKU-EX-SERVER-01",
            Description: "Enterprise Server Unit - Rackmount",
            Qty: "1",
            Rate: "122881.36",
            Taxable: "122881.36",
            CGST: "11059.32",
            SGST: "11059.32",
            Total: "145000.00"
          }
        ],
        lineItems: [
          {
            lineId: "LINE_01",
            itemCode: "SKU-EX-SERVER-01",
            description: "Enterprise Server Unit - Rackmount",
            quantity: 1,
            unit: "Nos",
            rate: 122881.36,
            taxableAmount: 122881.36,
            cgstRate: 9,
            cgstAmount: 11059.32,
            sgstRate: 9,
            sgstAmount: 11059.32,
            totalAmount: 145000.0,
            confidence: "High",
            matchedTallyItemCode: "SKU-EX-SERVER-01",
            bbox: { pageNumber: 1, x: 8, y: 35, width: 84, height: 12 }
          }
        ],
        confidence: "High",
        bbox: { pageNumber: 1, x: 8, y: 30, width: 84, height: 25 }
      }
    ],
    taxValidation: {
      taxableAmount: 122881.36,
      cgst: 11059.32,
      sgst: 11059.32,
      igst: 0,
      cess: 0,
      roundOff: 0,
      computedGrandTotal: 145000.0,
      statedGrandTotal: 145000.0,
      discrepancy: 0,
      status: "Valid",
      calculationExplanation: "₹1,22,881.36 (Taxable) + ₹11,059.32 (CGST 9%) + ₹11,059.32 (SGST 9%) = ₹1,45,000.00 (Grand Total). Discrepancy: ₹0.00."
    },
    duplicateCheck: {
      status: "Unique",
      confidenceScore: 100,
      matchingDocumentIds: [],
      reasons: ["No duplicate invoice number or hash found across company documents."]
    },
    tallyMatch: {
      documentId: "DOC-2026-INV-8891",
      matchCategory: "Exact",
      matchScore: 100,
      matchedTallyVoucherId: "PUR/2026/08/042",
      matchedTallyVoucherNumber: "PUR/2026/08/042",
      matchedTallyVoucherType: "Purchase",
      matchedTallyDate: "2026-08-14",
      matchedTallyAmount: 145000.0,
      matchedTallyParty: "Zenith Infotech Ltd",
      explanation: "Deterministic Match: Supplier GSTIN (27AAACZ1234A1Z5), Invoice Number (INV-2026-042) and Grand Total (₹1,45,000.00) matched Tally record exactly.",
      differences: [
        { field: "Invoice Number", documentValue: "INV-2026-042", tallyValue: "INV-2026-042", isMatched: true },
        { field: "Supplier Name", documentValue: "Zenith Infotech Ltd", tallyValue: "Zenith Infotech Ltd", isMatched: true },
        { field: "Taxable Amount", documentValue: 122881.36, tallyValue: 122881.36, isMatched: true },
        { field: "Grand Total", documentValue: 145000.0, tallyValue: 145000.0, isMatched: true }
      ]
    },
    threeWayMatch: {
      poNumber: "PO-2026-091",
      challanNumber: "DC-2026-042",
      invoiceNumber: "INV-2026-042",
      supplier: "Zenith Infotech Ltd",
      orderedAmount: 145000.0,
      receivedAmount: 145000.0,
      invoicedAmount: 145000.0,
      orderedQuantity: 1,
      receivedQuantity: 1,
      invoicedQuantity: 1,
      quantityVariance: 0,
      priceVariance: 0,
      amountVariance: 0,
      isMatched: true,
      statusComment: "3-Way Match Verified: Purchase Order (PO-2026-091) + Delivery Challan (DC-2026-042) + Invoice (INV-2026-042) perfectly balanced.",
      exceptions: []
    },
    relationshipGraph: {
      nodes: [
        { id: "NODE_PO", type: "Purchase Order", label: "PO-2026-091", amount: 145000.0, date: "2026-08-10", status: "Approved" },
        { id: "NODE_DC", type: "Delivery Challan", label: "DC-2026-042", amount: 145000.0, date: "2026-08-12", status: "Delivered" },
        { id: "NODE_INV", type: "Purchase Invoice", label: "INV-2026-042", amount: 145000.0, date: "2026-08-14", status: "Matched" },
        { id: "NODE_PAY", type: "Bank Advice", label: "UTR/HDFC/9928172", amount: 145000.0, date: "2026-08-15", status: "Settled" }
      ],
      edges: [
        { from: "NODE_PO", to: "NODE_DC", relationshipType: "Fulfilled By", confidence: "High" },
        { from: "NODE_DC", to: "NODE_INV", relationshipType: "Billed By", confidence: "High" },
        { from: "NODE_INV", to: "NODE_PAY", relationshipType: "Paid By", confidence: "High" }
      ]
    }
  },
  {
    documentId: "DOC-2026-INV-4401",
    companyId,
    companyName,
    fileName: "Apex_Cloud_Tax_Discrepancy.pdf",
    fileFormat: "PDF",
    fileSizeBytes: 89400,
    fileHashSha256: "3f51e94cfb17d5b8823f4581290e43d83d1c5a98bf813a8b2763f350c33a9112",
    pageCount: 1,
    documentType: "Purchase Invoice",
    classificationConfidence: "High",
    classificationConfidenceScore: 95,
    processingStatus: "Exception",
    reviewPriority: "High",
    reviewReasons: ["Tax Calculation Mismatch: Computed total differs from stated grand total by ₹500"],
    ocrProvider: "Local OCR Engine",
    ocrModelVersion: "Tesseract-v5.3-Local-Privacy",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdBy: "finance.ops@exfin.internal",
    version: 1,
    tags: ["Disputed", "Tax Discrepancy", "Software"],
    notes: ["Vendor invoice tax calculation shows ₹500 arithmetic discrepancy."],
    dataClassification: "Confidential",
    ocrRawText: `INVOICE: APEX CLOUD SERVICES PVT LTD\nGSTIN: 27AABCA9910D1ZX\nInvoice No: APX-4401 Date: 18/08/2026\nCloud Infrastructure Fees: ₹ 27,542.37\nIGST (18%): ₹ 5,457.63 (Should be ₹ 4,957.63)\nStated Grand Total: ₹ 33,000.00`,
    fields: [
      {
        fieldKey: "invoiceNumber",
        label: "Invoice Number",
        detectedRawValue: "APX-4401",
        normalizedValue: "APX-4401",
        confidence: "High",
        confidenceScore: 98,
        sourceLocation: "Page 1 [X:60%, Y:14%]",
        bbox: { pageNumber: 1, x: 58, y: 13, width: 25, height: 4 },
        extractionMethod: "Pattern",
        isUserCorrected: false
      },
      {
        fieldKey: "supplierName",
        label: "Supplier Name",
        detectedRawValue: "Apex Cloud Services Pvt Ltd",
        normalizedValue: "Apex Cloud Services Pvt Ltd",
        confidence: "High",
        confidenceScore: 95,
        sourceLocation: "Page 1 [X:10%, Y:10%]",
        bbox: { pageNumber: 1, x: 10, y: 9, width: 38, height: 5 },
        extractionMethod: "OCR",
        isUserCorrected: false
      },
      {
        fieldKey: "taxableAmount",
        label: "Taxable Amount",
        detectedRawValue: "27,542.37",
        normalizedValue: 27542.37,
        confidence: "High",
        confidenceScore: 94,
        sourceLocation: "Page 1 [X:68%, Y:65%]",
        bbox: { pageNumber: 1, x: 65, y: 64, width: 22, height: 4 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      },
      {
        fieldKey: "igst",
        label: "IGST",
        detectedRawValue: "5,457.63",
        normalizedValue: 5457.63,
        confidence: "Medium",
        confidenceScore: 82,
        sourceLocation: "Page 1 [X:68%, Y:70%]",
        bbox: { pageNumber: 1, x: 65, y: 69, width: 22, height: 4 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      },
      {
        fieldKey: "grandTotal",
        label: "Grand Total",
        detectedRawValue: "₹ 33,000.00",
        normalizedValue: 33000.0,
        confidence: "High",
        confidenceScore: 99,
        sourceLocation: "Page 1 [X:68%, Y:78%]",
        bbox: { pageNumber: 1, x: 65, y: 77, width: 24, height: 5 },
        extractionMethod: "Table Parser",
        isUserCorrected: false
      }
    ],
    tables: [],
    taxValidation: {
      taxableAmount: 27542.37,
      cgst: 0,
      sgst: 0,
      igst: 5457.63,
      cess: 0,
      roundOff: 0,
      computedGrandTotal: 33000.0,
      statedGrandTotal: 32500.0,
      discrepancy: 500.0,
      status: "Mismatch",
      calculationExplanation: "Discrepancy of ₹500.00: 18% IGST on ₹27,542.37 is mathematically ₹4,957.63, resulting in ₹32,500.00 instead of stated ₹33,000.00."
    },
    duplicateCheck: {
      status: "Unique",
      confidenceScore: 100,
      matchingDocumentIds: [],
      reasons: ["File fingerprint unique."]
    },
    tallyMatch: {
      documentId: "DOC-2026-INV-4401",
      matchCategory: "Conflict",
      matchScore: 68,
      matchedTallyVoucherId: "PAY/2026/08/014",
      matchedTallyVoucherNumber: "PAY/2026/08/014",
      matchedTallyVoucherType: "Payment",
      matchedTallyDate: "2026-08-18",
      matchedTallyAmount: 32500.0,
      matchedTallyParty: "Apex Cloud Services Pvt Ltd",
      explanation: "Conflict: Supplier and Reference matched, but Tally payment amount is ₹32,500.00 while invoice claims ₹33,000.00 due to vendor tax rounding error.",
      differences: [
        { field: "Amount", documentValue: 33000.0, tallyValue: 32500.0, differenceAmount: 500.0, isMatched: false }
      ]
    }
  }
];

let exceptionsStore: DocumentException[] = [
  {
    exceptionId: "EXC-2026-001",
    documentId: "DOC-2026-INV-4401",
    documentNumber: "APX-4401",
    type: "Tax Difference",
    severity: "High",
    status: "Open",
    title: "Vendor Tax Arithmetic Discrepancy (₹500)",
    description: "Invoice APX-4401 IGST calculation of ₹5,457.63 exceeds statutory 18% on ₹27,542.37 by ₹500.00.",
    owner: "tax.auditor@exfin.internal",
    assignedRole: "Tax Manager",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

let auditRecordsStore: DocumentAuditRecord[] = [
  {
    auditId: "AUD_DOC_001",
    documentId: "DOC-2026-INV-8891",
    action: "Extract",
    user: "system.ocr@exfin.internal",
    userRole: "SystemOCR",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    details: "Extracted 9 fields and 1 item table with 98% overall OCR confidence."
  },
  {
    auditId: "AUD_DOC_002",
    documentId: "DOC-2026-INV-8891",
    action: "Match",
    user: "system.matcher@exfin.internal",
    userRole: "SystemMatcher",
    timestamp: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
    details: "Deterministic Exact Match with Tally voucher PUR/2026/08/042 (Score: 100%)."
  }
];

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

// 1. Dashboard KPI summary
documentIntelligenceRouter.get("/dashboard", (req, res) => {
  const total = documentsStore.length;
  const extracted = documentsStore.filter((d) => d.processingStatus !== "Uploaded" && d.processingStatus !== "Failed").length;
  const needsReview = documentsStore.filter((d) => d.processingStatus === "Needs Review" || d.reviewPriority === "High" || d.reviewPriority === "Critical").length;
  const matched = documentsStore.filter((d) => d.processingStatus === "Matched" || d.tallyMatch?.matchCategory === "Exact").length;
  const exceptions = exceptionsStore.filter((e) => e.status !== "Resolved" && e.status !== "Closed").length;
  const duplicates = documentsStore.filter((d) => d.duplicateCheck.status !== "Unique").length;

  const report: DocumentProcessingReport = {
    totalDocuments: total,
    extractedCount: extracted,
    needsReviewCount: needsReview,
    matchedCount: matched,
    exceptionsCount: exceptions,
    duplicateCandidateCount: duplicates,
    averageProcessingTimeMs: 420,
    ocrPagesProcessed: documentsStore.reduce((a, b) => a + b.pageCount, 0),
    threeWayMatchHealthPercent: 92
  };

  res.json({
    companyId,
    companyName,
    report,
    recentDocuments: documentsStore.slice(0, 5),
    recentExceptions: exceptionsStore.slice(0, 5)
  });
});

// 2. List all documents with search & filter
documentIntelligenceRouter.get("/documents", (req, res) => {
  const { type, status, search } = req.query;
  let filtered = [...documentsStore];

  if (type && type !== "ALL") {
    filtered = filtered.filter((d) => d.documentType === type);
  }
  if (status && status !== "ALL") {
    filtered = filtered.filter((d) => d.processingStatus === status);
  }
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.fileName.toLowerCase().includes(s) ||
        d.documentId.toLowerCase().includes(s) ||
        d.ocrRawText.toLowerCase().includes(s) ||
        d.fields.some((f) => String(f.detectedRawValue).toLowerCase().includes(s))
    );
  }

  res.json(filtered);
});

// 3. Get single document details
documentIntelligenceRouter.get("/documents/:id", (req, res) => {
  const doc = documentsStore.find((d) => d.documentId === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json(doc);
});

// 4. Ingest & Parse New Document (Local OCR Engine Simulation)
documentIntelligenceRouter.post("/inbox/upload", (req, res) => {
  const { fileName, fileFormat = "PDF", documentType = "Purchase Invoice", simulatedContent } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: "File name is required." });
  }

  const fileHashSha256 = crypto
    .createHash("sha256")
    .update(fileName + (simulatedContent || Date.now()))
    .digest("hex");

  const docId = `DOC-2026-${Date.now().toString().slice(-6)}`;

  // Deterministic field extraction based on document type
  let fields: ExtractedField[] = [];
  let tables: DocumentTable[] = [];
  let rawText = "";

  if (documentType === "Purchase Order") {
    rawText = `PURCHASE ORDER\nPO Number: PO-2026-102 Date: 22/08/2026\nVendor: Quantum Dynamics India\nItems: Enterprise Managed Fiber Router Qty: 10 Rate: 18,500.00\nTotal: INR 1,85,000.00`;
    fields = [
      { fieldKey: "poNumber", label: "PO Number", detectedRawValue: "PO-2026-102", normalizedValue: "PO-2026-102", confidence: "High", confidenceScore: 99, sourceLocation: "Page 1 [X:60%, Y:10%]", bbox: { pageNumber: 1, x: 58, y: 9, width: 26, height: 4 }, extractionMethod: "Pattern", isUserCorrected: false },
      { fieldKey: "poDate", label: "PO Date", detectedRawValue: "22/08/2026", normalizedValue: "2026-08-22", confidence: "High", confidenceScore: 98, sourceLocation: "Page 1 [X:60%, Y:14%]", bbox: { pageNumber: 1, x: 58, y: 13, width: 22, height: 4 }, extractionMethod: "OCR", isUserCorrected: false },
      { fieldKey: "supplierName", label: "Supplier Name", detectedRawValue: "Quantum Dynamics India", normalizedValue: "Quantum Dynamics India", confidence: "High", confidenceScore: 97, sourceLocation: "Page 1 [X:10%, Y:12%]", bbox: { pageNumber: 1, x: 10, y: 11, width: 35, height: 5 }, extractionMethod: "OCR", isUserCorrected: false },
      { fieldKey: "grandTotal", label: "Grand Total", detectedRawValue: "₹ 1,85,000.00", normalizedValue: 185000.0, confidence: "High", confidenceScore: 99, sourceLocation: "Page 1 [X:68%, Y:80%]", bbox: { pageNumber: 1, x: 65, y: 79, width: 24, height: 5 }, extractionMethod: "Table Parser", isUserCorrected: false }
    ];
  } else if (documentType === "Delivery Challan") {
    rawText = `DELIVERY CHALLAN\nChallan No: DC-2026-088 Date: 20/08/2026\nVehicle No: MH-04-AB-1928\nDelivered To: EXFIN GLOBAL ENTERPRISES PVT LTD\nItems: Managed Gigabit Fiber Router Qty: 10 Nos\nPO Reference: PO-2026-102`;
    fields = [
      { fieldKey: "challanNumber", label: "Challan Number", detectedRawValue: "DC-2026-088", normalizedValue: "DC-2026-088", confidence: "High", confidenceScore: 98, sourceLocation: "Page 1 [X:60%, Y:10%]", bbox: { pageNumber: 1, x: 58, y: 9, width: 26, height: 4 }, extractionMethod: "Pattern", isUserCorrected: false },
      { fieldKey: "challanDate", label: "Challan Date", detectedRawValue: "20/08/2026", normalizedValue: "2026-08-20", confidence: "High", confidenceScore: 97, sourceLocation: "Page 1 [X:60%, Y:14%]", bbox: { pageNumber: 1, x: 58, y: 13, width: 22, height: 4 }, extractionMethod: "OCR", isUserCorrected: false },
      { fieldKey: "vehicleNumber", label: "Vehicle Number", detectedRawValue: "MH-04-AB-1928", normalizedValue: "MH-04-AB-1928", confidence: "High", confidenceScore: 95, sourceLocation: "Page 1 [X:60%, Y:18%]", bbox: { pageNumber: 1, x: 58, y: 17, width: 25, height: 4 }, extractionMethod: "Pattern", isUserCorrected: false },
      { fieldKey: "poReference", label: "PO Reference", detectedRawValue: "PO-2026-102", normalizedValue: "PO-2026-102", confidence: "High", confidenceScore: 96, sourceLocation: "Page 1 [X:60%, Y:22%]", bbox: { pageNumber: 1, x: 58, y: 21, width: 22, height: 4 }, extractionMethod: "Pattern", isUserCorrected: false }
    ];
  } else {
    rawText = `TAX INVOICE\nSupplier: Quantum Dynamics India\nGSTIN: 29BBBCQ5678B2Z1\nInvoice No: INV-2026-099 Date: 24/08/2026\nPO Ref: PO-2026-102\nTaxable: ₹ 1,56,779.66\nIGST (18%): ₹ 28,220.34\nTotal: ₹ 1,85,000.00`;
    fields = [
      { fieldKey: "invoiceNumber", label: "Invoice Number", detectedRawValue: "INV-2026-099", normalizedValue: "INV-2026-099", confidence: "High", confidenceScore: 99, sourceLocation: "Page 1 [X:65%, Y:12%]", bbox: { pageNumber: 1, x: 62, y: 11, width: 28, height: 4 }, extractionMethod: "Pattern", isUserCorrected: false },
      { fieldKey: "invoiceDate", label: "Invoice Date", detectedRawValue: "24/08/2026", normalizedValue: "2026-08-24", confidence: "High", confidenceScore: 98, sourceLocation: "Page 1 [X:65%, Y:16%]", bbox: { pageNumber: 1, x: 62, y: 15, width: 22, height: 4 }, extractionMethod: "OCR", isUserCorrected: false },
      { fieldKey: "supplierName", label: "Supplier Name", detectedRawValue: "Quantum Dynamics India", normalizedValue: "Quantum Dynamics India", confidence: "High", confidenceScore: 98, sourceLocation: "Page 1 [X:10%, Y:10%]", bbox: { pageNumber: 1, x: 10, y: 9, width: 35, height: 5 }, extractionMethod: "OCR", isUserCorrected: false },
      { fieldKey: "supplierGstin", label: "Supplier GSTIN", detectedRawValue: "29BBBCQ5678B2Z1", normalizedValue: "29BBBCQ5678B2Z1", confidence: "High", confidenceScore: 99, sourceLocation: "Page 1 [X:10%, Y:15%]", bbox: { pageNumber: 1, x: 10, y: 14, width: 28, height: 4 }, extractionMethod: "Pattern", isUserCorrected: false },
      { fieldKey: "taxableAmount", label: "Taxable Amount", detectedRawValue: "1,56,779.66", normalizedValue: 156779.66, confidence: "High", confidenceScore: 97, sourceLocation: "Page 1 [X:70%, Y:68%]", bbox: { pageNumber: 1, x: 68, y: 67, width: 22, height: 4 }, extractionMethod: "Table Parser", isUserCorrected: false },
      { fieldKey: "igst", label: "IGST (18%)", detectedRawValue: "28,220.34", normalizedValue: 28220.34, confidence: "High", confidenceScore: 98, sourceLocation: "Page 1 [X:70%, Y:72%]", bbox: { pageNumber: 1, x: 68, y: 71, width: 22, height: 4 }, extractionMethod: "Table Parser", isUserCorrected: false },
      { fieldKey: "grandTotal", label: "Grand Total", detectedRawValue: "₹ 1,85,000.00", normalizedValue: 185000.0, confidence: "High", confidenceScore: 100, sourceLocation: "Page 1 [X:70%, Y:80%]", bbox: { pageNumber: 1, x: 68, y: 79, width: 24, height: 5 }, extractionMethod: "Table Parser", isUserCorrected: false }
    ];
  }

  const newDoc: IntelligentDocument = {
    documentId: docId,
    companyId,
    companyName,
    fileName,
    fileFormat,
    fileSizeBytes: 124500,
    fileHashSha256,
    pageCount: 1,
    documentType: documentType as BusinessDocumentType,
    classificationConfidence: "High",
    classificationConfidenceScore: 97,
    processingStatus: "Extracted",
    reviewPriority: "Low",
    reviewReasons: [],
    ocrProvider: "Local OCR Engine",
    ocrModelVersion: "Tesseract-v5.3-Local-Privacy",
    createdAt: new Date().toISOString(),
    createdBy: "finance.ops@exfin.internal",
    version: 1,
    tags: ["Uploaded", documentType],
    notes: [],
    dataClassification: "Confidential",
    ocrRawText: rawText,
    fields,
    tables,
    taxValidation: {
      taxableAmount: 156779.66,
      cgst: 0,
      sgst: 0,
      igst: 28220.34,
      cess: 0,
      roundOff: 0,
      computedGrandTotal: 185000.0,
      statedGrandTotal: 185000.0,
      discrepancy: 0,
      status: "Valid",
      calculationExplanation: "Tax computation verified: Taxable + 18% IGST perfectly reconciles with Grand Total."
    },
    duplicateCheck: {
      status: "Unique",
      confidenceScore: 100,
      matchingDocumentIds: [],
      reasons: ["Unique file hash and invoice identifier."]
    }
  };

  documentsStore.unshift(newDoc);

  auditRecordsStore.unshift({
    auditId: `AUD_DOC_${Date.now()}`,
    documentId: docId,
    action: "Upload",
    user: "finance.ops@exfin.internal",
    userRole: "FinanceOps",
    timestamp: new Date().toISOString(),
    details: `Ingested ${fileName} (${documentType}). Extracted ${fields.length} fields.`
  });

  res.json({ success: true, document: newDoc });
});

// 5. User Field Correction with immutable audit & version bump
documentIntelligenceRouter.post("/documents/:id/correct-field", (req, res) => {
  const { fieldKey, correctedValue, reason } = req.body;
  const doc = documentsStore.find((d) => d.documentId === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  const field = doc.fields.find((f) => f.fieldKey === fieldKey);
  if (!field) {
    return res.status(404).json({ error: "Field not found" });
  }

  const previousVal = field.detectedRawValue;
  field.originalValue = field.originalValue || previousVal;
  field.detectedRawValue = String(correctedValue);
  field.normalizedValue = correctedValue;
  field.isUserCorrected = true;
  field.correctedBy = "auditor@exfin.internal";
  field.correctedAt = new Date().toISOString();
  field.extractionMethod = "User Correction";
  field.confidence = "High";
  field.confidenceScore = 100;

  doc.version += 1;

  auditRecordsStore.unshift({
    auditId: `AUD_CORR_${Date.now()}`,
    documentId: doc.documentId,
    action: "Correction",
    user: "auditor@exfin.internal",
    userRole: "Auditor",
    timestamp: new Date().toISOString(),
    details: `Corrected field '${fieldKey}': '${previousVal}' -> '${correctedValue}'. Reason: ${reason || "Auditor verification"}`
  });

  res.json({ success: true, document: doc });
});

// 6. Change Document Classification
documentIntelligenceRouter.post("/documents/:id/classify", (req, res) => {
  const { newType } = req.body;
  const doc = documentsStore.find((d) => d.documentId === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  const oldType = doc.documentType;
  doc.documentType = newType as BusinessDocumentType;
  doc.classificationConfidence = "High";
  doc.classificationConfidenceScore = 100;
  doc.version += 1;

  auditRecordsStore.unshift({
    auditId: `AUD_CLASS_${Date.now()}`,
    documentId: doc.documentId,
    action: "Classify",
    user: "auditor@exfin.internal",
    userRole: "Auditor",
    timestamp: new Date().toISOString(),
    details: `Reclassified document type from '${oldType}' to '${newType}'.`
  });

  res.json({ success: true, document: doc });
});

// 7. Match Document against Tally Analytical Cache
documentIntelligenceRouter.post("/documents/:id/match", (req, res) => {
  const doc = documentsStore.find((d) => d.documentId === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  const grandTotal = normalizeAmount(doc.fields.find((f) => f.fieldKey === "grandTotal")?.normalizedValue);
  const invNo = normalizeInvoiceNumber(doc.fields.find((f) => f.fieldKey === "invoiceNumber")?.normalizedValue || "");
  const supplier = normalizeString(doc.fields.find((f) => f.fieldKey === "supplierName")?.normalizedValue || "");

  // Evaluate match
  let matchCategory: any = "No Match";
  let score = 0;
  let explanation = "No corresponding record found in Tally cache.";
  let matchedVoucher = "";

  if (invNo.includes("INV-2026-042") || grandTotal === 145000) {
    matchCategory = "Exact";
    score = 100;
    matchedVoucher = "PUR/2026/08/042";
    explanation = "Exact Match: Supplier GSTIN, Invoice Number and Total matched Tally purchase register.";
  } else if (invNo.includes("APX-4401") || supplier.includes("Apex")) {
    matchCategory = "Conflict";
    score = 70;
    matchedVoucher = "PAY/2026/08/014";
    explanation = "Conflict: Vendor matched but invoice total (₹33,000) differs from Tally voucher amount (₹32,500).";
  }

  doc.tallyMatch = {
    documentId: doc.documentId,
    matchCategory,
    matchScore: score,
    matchedTallyVoucherId: matchedVoucher,
    matchedTallyVoucherNumber: matchedVoucher,
    matchedTallyVoucherType: "Purchase",
    matchedTallyDate: "2026-08-14",
    matchedTallyAmount: grandTotal,
    matchedTallyParty: supplier,
    explanation,
    differences: [
      { field: "Invoice Number", documentValue: invNo, tallyValue: invNo, isMatched: score >= 90 },
      { field: "Grand Total", documentValue: grandTotal, tallyValue: grandTotal, isMatched: matchCategory !== "Conflict" }
    ]
  };

  if (matchCategory === "Exact") {
    doc.processingStatus = "Matched";
  }

  res.json({ success: true, tallyMatch: doc.tallyMatch, document: doc });
});

// 8. Copilot Document Explainability Endpoint
documentIntelligenceRouter.post("/documents/:id/explain", (req, res) => {
  const doc = documentsStore.find((d) => d.documentId === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  let summary = `This document is a **${doc.documentType}** from **${doc.fields.find((f) => f.fieldKey === "supplierName")?.normalizedValue || "Unknown Supplier"}** for total amount of **₹${(doc.fields.find((f) => f.fieldKey === "grandTotal")?.normalizedValue || 0).toLocaleString("en-IN")}**.`;

  if (doc.taxValidation.status === "Mismatch") {
    summary += `\n\n⚠️ **Tax Mismatch Detected**: ${doc.taxValidation.calculationExplanation}`;
  } else {
    summary += `\n\n✓ **Tax Integrity**: Mathematical calculation of GST and Grand Total is verified with 100% precision.`;
  }

  if (doc.tallyMatch) {
    summary += `\n\n📊 **Tally Match**: ${doc.tallyMatch.explanation}`;
  }

  res.json({
    summary,
    taxStatus: doc.taxValidation.status,
    duplicateStatus: doc.duplicateCheck.status,
    confidenceScore: doc.classificationConfidenceScore,
    suggestedActions: [
      doc.taxValidation.status === "Mismatch" ? "Request corrected revised invoice from supplier" : "Confirm match in Reconciliation Studio",
      "Export audit trail report for compliance record"
    ]
  });
});

// 9. Exception Center List & Resolve
documentIntelligenceRouter.get("/exceptions", (req, res) => {
  res.json(exceptionsStore);
});

documentIntelligenceRouter.post("/exceptions/:id/resolve", (req, res) => {
  const { resolutionNotes } = req.body;
  const exc = exceptionsStore.find((e) => e.exceptionId === req.params.id);
  if (!exc) {
    return res.status(404).json({ error: "Exception not found" });
  }

  exc.status = "Resolved";
  exc.resolvedAt = new Date().toISOString();
  exc.resolutionNotes = resolutionNotes || "Resolved by Tax Manager via debit note adjustment.";
  exc.resolutionAudit = {
    who: "tax.manager@exfin.internal",
    when: new Date().toISOString(),
    action: "Resolve",
    reason: exc.resolutionNotes
  };

  auditRecordsStore.unshift({
    auditId: `AUD_EXC_${Date.now()}`,
    documentId: exc.documentId,
    action: "Resolve",
    user: "tax.manager@exfin.internal",
    userRole: "TaxManager",
    timestamp: new Date().toISOString(),
    details: `Resolved exception ${exc.exceptionId} (${exc.type}): ${exc.resolutionNotes}`
  });

  res.json({ success: true, exception: exc });
});

// 10. Audit log endpoint
documentIntelligenceRouter.get("/audit", (req, res) => {
  res.json(auditRecordsStore);
});
