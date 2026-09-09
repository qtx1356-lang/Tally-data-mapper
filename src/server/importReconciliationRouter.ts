import { Router } from "express";
import crypto from "crypto";
import {
  ExternalDataset,
  ReconciliationSession,
  DataProfileReport,
  ColumnProfile,
  ColumnMappingDefinition,
  NormalizedDataRow,
  MatchingRuleConfig,
  ReconciliationPairResult,
  FieldComparisonDetail,
  ReconciliationAuditLog,
  BankStatementBalanceValidation,
  SupportedFileFormat,
  ExternalSourceType,
  SemanticFieldRole,
  DataType,
  MappingConfidence,
  MatchCategory,
  MatchCardinality
} from "../types/phase21ImportReconciliation";

export const importReconciliationRouter = Router();

const companyId = "COMP_EXFIN_01";
const companyName = "EXFIN GLOBAL ENTERPRISES PVT LTD";

// ----------------------------------------------------------------------------
// Deterministic Normalization & Semantic Dictionary
// ----------------------------------------------------------------------------
const SEMANTIC_DICTIONARY: Record<string, { role: SemanticFieldRole; type: DataType; confidence: MappingConfidence }> = {
  date: { role: "Date", type: "Date", confidence: "High" },
  txn_date: { role: "Date", type: "Date", confidence: "High" },
  transaction_date: { role: "Date", type: "Date", confidence: "High" },
  value_date: { role: "ValueDate", type: "Date", confidence: "High" },
  invoice_date: { role: "InvoiceDate", type: "Date", confidence: "High" },
  amount: { role: "Amount", type: "Decimal", confidence: "High" },
  net_amount: { role: "Amount", type: "Decimal", confidence: "High" },
  total_amount: { role: "Amount", type: "Decimal", confidence: "High" },
  debit: { role: "Debit", type: "Decimal", confidence: "High" },
  dr: { role: "Debit", type: "Decimal", confidence: "High" },
  withdrawal: { role: "Debit", type: "Decimal", confidence: "High" },
  credit: { role: "Credit", type: "Decimal", confidence: "High" },
  cr: { role: "Credit", type: "Decimal", confidence: "High" },
  deposit: { role: "Credit", type: "Decimal", confidence: "High" },
  balance: { role: "Balance", type: "Decimal", confidence: "High" },
  closing_balance: { role: "Balance", type: "Decimal", confidence: "High" },
  cheque_no: { role: "ChequeNumber", type: "String", confidence: "High" },
  chq_no: { role: "ChequeNumber", type: "String", confidence: "High" },
  utr: { role: "UTR", type: "String", confidence: "High" },
  utr_no: { role: "UTR", type: "String", confidence: "High" },
  reference: { role: "Reference", type: "String", confidence: "High" },
  ref_no: { role: "Reference", type: "String", confidence: "High" },
  invoice_no: { role: "InvoiceNumber", type: "String", confidence: "High" },
  bill_no: { role: "InvoiceNumber", type: "String", confidence: "High" },
  party: { role: "PartyName", type: "String", confidence: "High" },
  party_name: { role: "PartyName", type: "String", confidence: "High" },
  customer: { role: "Customer", type: "String", confidence: "High" },
  customer_name: { role: "Customer", type: "String", confidence: "High" },
  supplier: { role: "Supplier", type: "String", confidence: "High" },
  vendor: { role: "Supplier", type: "String", confidence: "High" },
  ledger: { role: "Ledger", type: "String", confidence: "High" },
  gstin: { role: "GSTIN", type: "String", confidence: "High" },
  gstin_uin: { role: "GSTIN", type: "String", confidence: "High" },
  taxable_value: { role: "TaxableValue", type: "Decimal", confidence: "High" },
  tax_amount: { role: "TaxAmount", type: "Decimal", confidence: "High" },
  cgst: { role: "CGST", type: "Decimal", confidence: "High" },
  sgst: { role: "SGST", type: "Decimal", confidence: "High" },
  igst: { role: "IGST", type: "Decimal", confidence: "High" },
  item_code: { role: "ItemCode", type: "String", confidence: "High" },
  item_name: { role: "ItemName", type: "String", confidence: "High" },
  quantity: { role: "Quantity", type: "Decimal", confidence: "High" },
  qty: { role: "Quantity", type: "Decimal", confidence: "High" },
  rate: { role: "Rate", type: "Decimal", confidence: "High" },
  unit: { role: "Unit", type: "String", confidence: "High" },
  employee_id: { role: "EmployeeId", type: "String", confidence: "High" },
  emp_id: { role: "EmployeeId", type: "String", confidence: "High" },
  employee_name: { role: "EmployeeName", type: "String", confidence: "High" },
  gross_pay: { role: "GrossPay", type: "Decimal", confidence: "High" },
  deductions: { role: "Deductions", type: "Decimal", confidence: "High" },
  net_pay: { role: "NetPay", type: "Decimal", confidence: "High" },
  narration: { role: "Description", type: "String", confidence: "High" },
  particulars: { role: "Description", type: "String", confidence: "High" },
  description: { role: "Description", type: "String", confidence: "High" }
};

// Formula Injection sanitizer
function sanitizeFormulaInjection(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@") || str.startsWith("\t") || str.startsWith("\r")) {
    return `'${str}`;
  }
  return str;
}

// Clean Currency Strings to Float
function parseAmount(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[₹$,\s]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Normalize Text for Party/Fuzzy Matching
function normalizeText(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// Simple Jaro-Winkler / Token Similarity approximation
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.88;

  let matches = 0;
  const minLen = Math.min(s1.length, s2.length);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  return matches / Math.max(s1.length, s2.length);
}

// ----------------------------------------------------------------------------
// Read-Only Mock Tally Analytical Cache
// (Simulating the Parquet Columnar store from Phase 16/17)
// ----------------------------------------------------------------------------
const TALLY_MOCK_CACHE = {
  bankVouchers: [
    {
      voucherId: "VCH_TALLY_101",
      voucherNumber: "REC/2026/08/001",
      date: "2026-08-15",
      type: "Receipt",
      ledgerName: "HDFC Bank A/c 5020001234",
      partyName: "Zenith Infotech Ltd",
      reference: "UTR/HDFC/9928172",
      amount: 145000.0,
      debit: 145000.0,
      credit: 0.0,
      narration: "Payment received towards Inv #INV-2026-042"
    },
    {
      voucherId: "VCH_TALLY_102",
      voucherNumber: "PAY/2026/08/014",
      date: "2026-08-18",
      type: "Payment",
      ledgerName: "HDFC Bank A/c 5020001234",
      partyName: "Apex Cloud Services Pvt Ltd",
      reference: "CHQ-881920",
      amount: 32500.0,
      debit: 0.0,
      credit: 32500.0,
      narration: "Cloud hosting fees for August 2026"
    },
    {
      voucherId: "VCH_TALLY_103",
      voucherNumber: "REC/2026/08/005",
      date: "2026-08-20",
      type: "Receipt",
      ledgerName: "HDFC Bank A/c 5020001234",
      partyName: "Quantum Dynamics India",
      reference: "NEFT-QD-19283",
      amount: 280000.0,
      debit: 280000.0,
      credit: 0.0,
      narration: "Quarterly advance for enterprise licensing"
    },
    {
      voucherId: "VCH_TALLY_104",
      voucherNumber: "PAY/2026/08/022",
      date: "2026-08-22",
      type: "Payment",
      ledgerName: "HDFC Bank A/c 5020001234",
      partyName: "Office Logistics Solutions",
      reference: "UPI/3920192847",
      amount: 14200.0,
      debit: 0.0,
      credit: 14200.0,
      narration: "Stationery and ergonomic equipment"
    }
  ],
  gstSalesVouchers: [
    {
      voucherId: "GST_VCH_01",
      invoiceNumber: "INV-2026-042",
      invoiceDate: "2026-08-14",
      partyName: "Zenith Infotech Ltd",
      gstin: "27AAACZ1234A1Z5",
      taxableValue: 122881.36,
      cgst: 11059.32,
      sgst: 11059.32,
      igst: 0.0,
      totalAmount: 145000.0
    },
    {
      voucherId: "GST_VCH_02",
      invoiceNumber: "INV-2026-043",
      invoiceDate: "2026-08-16",
      partyName: "Quantum Dynamics India",
      gstin: "29BBBCQ5678B2Z1",
      taxableValue: 237288.14,
      cgst: 0.0,
      sgst: 0.0,
      igst: 42711.86,
      totalAmount: 280000.0
    },
    {
      voucherId: "GST_VCH_03",
      invoiceNumber: "INV-2026-044",
      invoiceDate: "2026-08-19",
      partyName: "Global Tech Retails",
      gstin: "07CCCRG9012C3Z8",
      taxableValue: 85000.0,
      cgst: 7650.0,
      sgst: 7650.0,
      igst: 0.0,
      totalAmount: 100300.0
    }
  ],
  payrollVouchers: [
    {
      voucherId: "PAYROLL_TALLY_01",
      employeeId: "EMP-1001",
      employeeName: "Arun Sharma",
      period: "August 2026",
      grossPay: 185000.0,
      deductions: 25000.0,
      netPay: 160000.0
    },
    {
      voucherId: "PAYROLL_TALLY_02",
      employeeId: "EMP-1002",
      employeeName: "Pooja Verma",
      period: "August 2026",
      grossPay: 140000.0,
      deductions: 18000.0,
      netPay: 122000.0
    }
  ],
  inventoryItems: [
    {
      itemCode: "SKU-EX-SERVER-01",
      itemName: "Enterprise Server Unit - Rackmount",
      quantity: 24,
      unit: "Nos",
      rate: 125000.0
    },
    {
      itemCode: "SKU-EX-ROUTER-99",
      itemName: "Managed Gigabit Fiber Router",
      quantity: 58,
      unit: "Nos",
      rate: 18500.0
    }
  ]
};

// ----------------------------------------------------------------------------
// In-Memory Storage for Datasets & Sessions
// ----------------------------------------------------------------------------
let externalDatasetsStore: ExternalDataset[] = [
  {
    datasetId: "DS_BANK_HDFC_AUG26",
    datasetName: "HDFC Current Account Statement - Aug 2026",
    companyId: companyId,
    companyName: companyName,
    sourceType: "Bank Statement",
    fileFormat: "CSV",
    originalFileName: "HDFC_Statement_5020001234_Aug2026.csv",
    fileFingerprintSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    fileSizeBytes: 48200,
    version: 1,
    importedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    importedBy: "finance.ops@exfin.internal",
    totalRows: 4,
    importedRows: 4,
    rejectedRows: 0,
    warningCount: 0,
    columnMappings: [
      {
        mappingId: "m1",
        externalColumn: "Txn Date",
        targetSemanticField: "Date",
        targetDataType: "Date",
        confidence: "High",
        isUserConfirmed: true,
        transformationPipeline: ["Trim", "Date_DD/MM/YYYY_To_ISO"]
      },
      {
        mappingId: "m2",
        externalColumn: "Description / Narration",
        targetSemanticField: "Description",
        targetDataType: "String",
        confidence: "High",
        isUserConfirmed: true,
        transformationPipeline: ["Trim"]
      },
      {
        mappingId: "m3",
        externalColumn: "Ref / Chq / UTR",
        targetSemanticField: "Reference",
        targetDataType: "String",
        confidence: "High",
        isUserConfirmed: true,
        transformationPipeline: ["Trim", "Uppercase"]
      },
      {
        mappingId: "m4",
        externalColumn: "Deposit / Credit",
        targetSemanticField: "Credit",
        targetDataType: "Decimal",
        confidence: "High",
        isUserConfirmed: true,
        transformationPipeline: ["CurrencyINRToDecimal"]
      },
      {
        mappingId: "m5",
        externalColumn: "Withdrawal / Debit",
        targetSemanticField: "Debit",
        targetDataType: "Decimal",
        confidence: "High",
        isUserConfirmed: true,
        transformationPipeline: ["CurrencyINRToDecimal"]
      },
      {
        mappingId: "m6",
        externalColumn: "Closing Balance",
        targetSemanticField: "Balance",
        targetDataType: "Decimal",
        confidence: "High",
        isUserConfirmed: true,
        transformationPipeline: ["CurrencyINRToDecimal"]
      }
    ],
    profile: {
      rowCount: 4,
      columnCount: 6,
      fileFingerprintSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      fileSizeBytes: 48200,
      columns: [
        {
          columnName: "Txn Date",
          detectedType: "Date",
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 4,
          sampleValues: ["15/08/2026", "18/08/2026", "20/08/2026", "23/08/2026"],
          suggestedSemanticRole: "Date",
          suggestedConfidence: "High"
        },
        {
          columnName: "Description / Narration",
          detectedType: "String",
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 4,
          sampleValues: ["NEFT CR-ZENITH INFOTECH-INV42", "CHQ CLR APEX CLOUD", "RTGS CR QUANTUM DYN", "BANK CHARGES AUG"],
          suggestedSemanticRole: "Description",
          suggestedConfidence: "High"
        },
        {
          columnName: "Ref / Chq / UTR",
          detectedType: "String",
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 4,
          sampleValues: ["UTR/HDFC/9928172", "CHQ-881920", "NEFT-QD-19283", "CHG/AUG/001"],
          suggestedSemanticRole: "Reference",
          suggestedConfidence: "High"
        },
        {
          columnName: "Deposit / Credit",
          detectedType: "Decimal",
          nullCount: 2,
          nullPercentage: 50,
          uniqueCount: 3,
          sampleValues: [145000.0, null, 280000.0, null],
          suggestedSemanticRole: "Credit",
          suggestedConfidence: "High"
        },
        {
          columnName: "Withdrawal / Debit",
          detectedType: "Decimal",
          nullCount: 2,
          nullPercentage: 50,
          uniqueCount: 3,
          sampleValues: [null, 32500.0, null, 590.0],
          suggestedSemanticRole: "Debit",
          suggestedConfidence: "High"
        },
        {
          columnName: "Closing Balance",
          detectedType: "Decimal",
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 4,
          sampleValues: [645000.0, 612500.0, 892500.0, 891910.0],
          suggestedSemanticRole: "Balance",
          suggestedConfidence: "High"
        }
      ],
      qualityMetrics: {
        completeness: 100,
        typeValidity: 100,
        duplicateRate: 0,
        mappingCoverage: 100,
        overallScore: 100
      },
      duplicateCandidateCount: 0,
      hasHeader: true,
      detectedHeaderRowIndex: 0,
      detectedDelimiter: ",",
      detectedEncoding: "UTF-8"
    },
    rows: [
      {
        rowId: "ROW_BNK_01",
        rawValues: {
          "Txn Date": "15/08/2026",
          "Description / Narration": "NEFT CR-ZENITH INFOTECH-INV42",
          "Ref / Chq / UTR": "UTR/HDFC/9928172",
          "Deposit / Credit": "₹1,45,000.00",
          "Withdrawal / Debit": "",
          "Closing Balance": "₹6,45,000.00"
        },
        normalizedValues: {
          Date: "2026-08-15",
          Description: "NEFT CR-ZENITH INFOTECH-INV42",
          Reference: "UTR/HDFC/9928172",
          Credit: 145000.0,
          Debit: 0.0,
          Amount: 145000.0,
          Balance: 645000.0,
          PartyName: "Zenith Infotech"
        },
        lineage: {
          fileName: "HDFC_Statement_5020001234_Aug2026.csv",
          fileSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          rowIndex: 1,
          columnName: "All",
          rawSourceLocation: "HDFC_Statement_5020001234_Aug2026.csv -> Row: 1"
        },
        isValid: true,
        validationErrors: []
      },
      {
        rowId: "ROW_BNK_02",
        rawValues: {
          "Txn Date": "18/08/2026",
          "Description / Narration": "CHQ CLR APEX CLOUD",
          "Ref / Chq / UTR": "CHQ-881920",
          "Deposit / Credit": "",
          "Withdrawal / Debit": "₹32,500.00",
          "Closing Balance": "₹6,12,500.00"
        },
        normalizedValues: {
          Date: "2026-08-18",
          Description: "CHQ CLR APEX CLOUD",
          Reference: "CHQ-881920",
          Credit: 0.0,
          Debit: 32500.0,
          Amount: 32500.0,
          Balance: 612500.0,
          PartyName: "Apex Cloud Services"
        },
        lineage: {
          fileName: "HDFC_Statement_5020001234_Aug2026.csv",
          fileSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          rowIndex: 2,
          columnName: "All",
          rawSourceLocation: "HDFC_Statement_5020001234_Aug2026.csv -> Row: 2"
        },
        isValid: true,
        validationErrors: []
      },
      {
        rowId: "ROW_BNK_03",
        rawValues: {
          "Txn Date": "20/08/2026",
          "Description / Narration": "RTGS CR QUANTUM DYN",
          "Ref / Chq / UTR": "NEFT-QD-19283",
          "Deposit / Credit": "₹2,80,000.00",
          "Withdrawal / Debit": "",
          "Closing Balance": "₹8,92,500.00"
        },
        normalizedValues: {
          Date: "2026-08-20",
          Description: "RTGS CR QUANTUM DYN",
          Reference: "NEFT-QD-19283",
          Credit: 280000.0,
          Debit: 0.0,
          Amount: 280000.0,
          Balance: 892500.0,
          PartyName: "Quantum Dynamics India"
        },
        lineage: {
          fileName: "HDFC_Statement_5020001234_Aug2026.csv",
          fileSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          rowIndex: 3,
          columnName: "All",
          rawSourceLocation: "HDFC_Statement_5020001234_Aug2026.csv -> Row: 3"
        },
        isValid: true,
        validationErrors: []
      },
      {
        rowId: "ROW_BNK_04",
        rawValues: {
          "Txn Date": "23/08/2026",
          "Description / Narration": "BANK CHARGES / GST AUG26",
          "Ref / Chq / UTR": "CHG/AUG/001",
          "Deposit / Credit": "",
          "Withdrawal / Debit": "₹590.00",
          "Closing Balance": "₹8,91,910.00"
        },
        normalizedValues: {
          Date: "2026-08-23",
          Description: "BANK CHARGES / GST AUG26",
          Reference: "CHG/AUG/001",
          Credit: 0.0,
          Debit: 590.0,
          Amount: 590.0,
          Balance: 891910.0,
          PartyName: "HDFC Bank Charges"
        },
        lineage: {
          fileName: "HDFC_Statement_5020001234_Aug2026.csv",
          fileSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          rowIndex: 4,
          columnName: "All",
          rawSourceLocation: "HDFC_Statement_5020001234_Aug2026.csv -> Row: 4"
        },
        isValid: true,
        validationErrors: []
      }
    ],
    dataClassification: "Restricted",
    retentionStatus: "Keep"
  }
];

let reconciliationSessionsStore: ReconciliationSession[] = [
  {
    sessionId: "REC_SESS_BANK_AUG26_01",
    sessionName: "HDFC Bank Statement vs Tally Bank Ledger (Aug 2026)",
    companyId: companyId,
    companyName: companyName,
    sourceType: "Bank Statement",
    externalDatasetId: "DS_BANK_HDFC_AUG26",
    externalDatasetVersion: 1,
    tallyDatasetVersion: "v2.4.0-parquet",
    tallySourceType: "Local Parquet Dataset",
    period: "August 2026",
    matchingRule: {
      ruleId: "RUL_BANK_DEFAULT",
      ruleName: "Bank Strict Reference & Amount Match",
      strategy: "Combined",
      cardinality: "OneToOne",
      amountTolerance: 1.0,
      dateToleranceDays: 2,
      partyFuzzyThreshold: 0.8,
      referenceExactMatch: true,
      requireSameSign: true,
      ignoreSpecialCharacters: true
    },
    status: "Completed",
    startedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 3600000 + 1200).toISOString(),
    createdBy: "finance.ops@exfin.internal",
    totalExternalCount: 4,
    totalTallyEvaluated: 4,
    exactMatchCount: 3,
    strongMatchCount: 0,
    possibleMatchCount: 0,
    unmatchedCount: 1,
    conflictCount: 0,
    manualOverrideCount: 0,
    matchRatePercentage: 75.0,
    snapshot: {
      datasetVersion: "v1.0.0",
      mappingVersion: "v1.0.0",
      ruleVersion: "v1.0.0",
      engineDeterministicSignature: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    },
    results: [
      {
        pairId: "PAIR_01",
        externalRowId: "ROW_BNK_01",
        externalRow: externalDatasetsStore[0].rows[0],
        tallyVoucherIds: ["VCH_TALLY_101"],
        tallyVouchers: [TALLY_MOCK_CACHE.bankVouchers[0]],
        matchCategory: "Exact Match",
        matchScore: 100,
        differenceAmount: 0.0,
        differenceDateDays: 0,
        reason: "Reference (UTR/HDFC/9928172), Date (2026-08-15) and Amount (₹1,45,000.00) matched exactly.",
        cardinality: "OneToOne",
        fieldComparisons: [
          { field: "Reference", externalValue: "UTR/HDFC/9928172", tallyValue: "UTR/HDFC/9928172", isMatched: true },
          { field: "Amount", externalValue: 145000.0, tallyValue: 145000.0, difference: 0, isMatched: true },
          { field: "Date", externalValue: "2026-08-15", tallyValue: "2026-08-15", difference: 0, isMatched: true },
          { field: "Party", externalValue: "Zenith Infotech", tallyValue: "Zenith Infotech Ltd", isMatched: true }
        ],
        isManualOverride: false
      },
      {
        pairId: "PAIR_02",
        externalRowId: "ROW_BNK_02",
        externalRow: externalDatasetsStore[0].rows[1],
        tallyVoucherIds: ["VCH_TALLY_102"],
        tallyVouchers: [TALLY_MOCK_CACHE.bankVouchers[1]],
        matchCategory: "Exact Match",
        matchScore: 100,
        differenceAmount: 0.0,
        differenceDateDays: 0,
        reason: "Cheque reference (CHQ-881920) and payment amount (₹32,500.00) matched exactly.",
        cardinality: "OneToOne",
        fieldComparisons: [
          { field: "Reference", externalValue: "CHQ-881920", tallyValue: "CHQ-881920", isMatched: true },
          { field: "Amount", externalValue: 32500.0, tallyValue: 32500.0, difference: 0, isMatched: true },
          { field: "Date", externalValue: "2026-08-18", tallyValue: "2026-08-18", difference: 0, isMatched: true },
          { field: "Party", externalValue: "Apex Cloud Services", tallyValue: "Apex Cloud Services Pvt Ltd", isMatched: true }
        ],
        isManualOverride: false
      },
      {
        pairId: "PAIR_03",
        externalRowId: "ROW_BNK_03",
        externalRow: externalDatasetsStore[0].rows[2],
        tallyVoucherIds: ["VCH_TALLY_103"],
        tallyVouchers: [TALLY_MOCK_CACHE.bankVouchers[2]],
        matchCategory: "Exact Match",
        matchScore: 100,
        differenceAmount: 0.0,
        differenceDateDays: 0,
        reason: "Reference (NEFT-QD-19283) and receipt amount (₹2,80,000.00) matched exactly.",
        cardinality: "OneToOne",
        fieldComparisons: [
          { field: "Reference", externalValue: "NEFT-QD-19283", tallyValue: "NEFT-QD-19283", isMatched: true },
          { field: "Amount", externalValue: 280000.0, tallyValue: 280000.0, difference: 0, isMatched: true },
          { field: "Date", externalValue: "2026-08-20", tallyValue: "2026-08-20", difference: 0, isMatched: true },
          { field: "Party", externalValue: "Quantum Dynamics India", tallyValue: "Quantum Dynamics India", isMatched: true }
        ],
        isManualOverride: false
      },
      {
        pairId: "PAIR_04",
        externalRowId: "ROW_BNK_04",
        externalRow: externalDatasetsStore[0].rows[3],
        tallyVoucherIds: [],
        tallyVouchers: [],
        matchCategory: "No Match",
        matchScore: 0,
        differenceType: "Missing in Tally",
        differenceAmount: 590.0,
        reason: "External transaction ₹590.00 (Bank Charges) not found in Tally ledger for period August 2026.",
        cardinality: "OneToOne",
        fieldComparisons: [
          { field: "Reference", externalValue: "CHG/AUG/001", tallyValue: "N/A", isMatched: false },
          { field: "Amount", externalValue: 590.0, tallyValue: 0.0, difference: 590.0, isMatched: false },
          { field: "Date", externalValue: "2026-08-23", tallyValue: "N/A", isMatched: false }
        ],
        isManualOverride: false
      }
    ]
  }
];

let auditLogsStore: ReconciliationAuditLog[] = [
  {
    auditId: "AUD_001",
    sessionId: "REC_SESS_BANK_AUG26_01",
    action: "Import",
    userId: "finance.ops@exfin.internal",
    userRole: "FinanceOps",
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    details: "Imported HDFC_Statement_5020001234_Aug2026.csv with 4 rows. SHA-256 fingerprint verified."
  },
  {
    auditId: "AUD_002",
    sessionId: "REC_SESS_BANK_AUG26_01",
    action: "Reconcile",
    userId: "finance.ops@exfin.internal",
    userRole: "FinanceOps",
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    details: "Ran deterministic bank reconciliation. Result: 3 Matched, 1 Unmatched (Bank Charges ₹590)."
  }
];

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

// 1. Overview Dashboard Summary
importReconciliationRouter.get("/dashboard", (req, res) => {
  const totalDatasets = externalDatasetsStore.length;
  const totalSessions = reconciliationSessionsStore.length;
  const latestSession = reconciliationSessionsStore[0];

  const totalExternalRecords = externalDatasetsStore.reduce((acc, d) => acc + d.importedRows, 0);
  const matchedRecords = reconciliationSessionsStore.reduce(
    (acc, s) => acc + (s.exactMatchCount + s.strongMatchCount),
    0
  );
  const unmatchedRecords = reconciliationSessionsStore.reduce((acc, s) => acc + s.unmatchedCount, 0);
  const conflictRecords = reconciliationSessionsStore.reduce((acc, s) => acc + s.conflictCount, 0);

  res.json({
    companyId,
    companyName,
    totalDatasets,
    totalSessions,
    totalExternalRecords,
    matchedRecords,
    unmatchedRecords,
    conflictRecords,
    latestSession,
    recentDatasets: externalDatasetsStore.slice(0, 5),
    recentSessions: reconciliationSessionsStore.slice(0, 5),
    tallyStatus: {
      isReadOnly: true,
      connected: true,
      cacheFreshness: "4m ago",
      datasetVersion: "v2.4.0-parquet"
    }
  });
});

// 2. List External Datasets
importReconciliationRouter.get("/datasets", (req, res) => {
  res.json(externalDatasetsStore);
});

// 3. Get Single Dataset by ID
importReconciliationRouter.get("/datasets/:id", (req, res) => {
  const ds = externalDatasetsStore.find((d) => d.datasetId === req.params.id);
  if (!ds) {
    return res.status(404).json({ error: "External dataset not found" });
  }
  res.json(ds);
});

// 4. Delete External Dataset (CRITICAL: Never touches Tally or original files)
importReconciliationRouter.delete("/datasets/:id", (req, res) => {
  externalDatasetsStore = externalDatasetsStore.filter((d) => d.datasetId !== req.params.id);
  auditLogsStore.unshift({
    auditId: `AUD_${Date.now()}`,
    action: "Delete",
    userId: "admin@exfin.internal",
    userRole: "Administrator",
    timestamp: new Date().toISOString(),
    details: `Deleted external dataset ${req.params.id}. Tally data unaffected.`
  });
  res.json({ success: true, message: "External dataset deleted successfully. Tally remains untouched." });
});

// 5. Profiler & Upload Preview Endpoint
importReconciliationRouter.post("/profile-and-preview", (req, res) => {
  const { fileName, fileContent, sourceType = "Excel", fileFormat = "CSV" } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: "File name is required." });
  }

  const sha256 = crypto.createHash("sha256").update(fileContent || fileName + Date.now()).digest("hex");
  const isDuplicate = externalDatasetsStore.some((d) => d.fileFingerprintSha256 === sha256);

  // Parse sample rows or synthetic sample based on sourceType
  let headers: string[] = [];
  let sampleRows: any[] = [];

  if (sourceType === "Bank Statement") {
    headers = ["Txn Date", "Description / Narration", "Ref / Chq / UTR", "Withdrawal / Debit", "Deposit / Credit", "Closing Balance"];
    sampleRows = [
      { "Txn Date": "01/08/2026", "Description / Narration": "NEFT CR-ACME CORP", "Ref / Chq / UTR": "UTR-ACME-8819", "Withdrawal / Debit": "", "Deposit / Credit": "₹2,50,000.00", "Closing Balance": "₹7,50,000.00" },
      { "Txn Date": "04/08/2026", "Description / Narration": "OFFICE RENT AUG26", "Ref / Chq / UTR": "CHQ-100293", "Withdrawal / Debit": "₹85,000.00", "Deposit / Credit": "", "Closing Balance": "₹6,65,000.00" }
    ];
  } else if (sourceType === "GST Data") {
    headers = ["GSTIN of Supplier", "Invoice Number", "Invoice Date", "Invoice Value", "Taxable Value", "Integrated Tax", "Central Tax", "State/UT Tax"];
    sampleRows = [
      { "GSTIN of Supplier": "27AAACZ1234A1Z5", "Invoice Number": "INV-2026-042", "Invoice Date": "14/08/2026", "Invoice Value": "₹1,45,000.00", "Taxable Value": "₹1,22,881.36", "Integrated Tax": "0.00", "Central Tax": "₹11,059.32", "State/UT Tax": "₹11,059.32" }
    ];
  } else if (sourceType === "Payroll") {
    headers = ["Employee ID", "Employee Name", "Department", "Gross Pay", "EPF Deduction", "TDS Deduction", "Net Pay"];
    sampleRows = [
      { "Employee ID": "EMP-1001", "Employee Name": "Arun Sharma", "Department": "Finance", "Gross Pay": "₹1,85,000.00", "EPF Deduction": "₹15,000.00", "TDS Deduction": "₹10,000.00", "Net Pay": "₹1,60,000.00" }
    ];
  } else if (sourceType === "Inventory") {
    headers = ["Item Code", "Item Description", "Physical Quantity", "UOM", "Unit Cost"];
    sampleRows = [
      { "Item Code": "SKU-EX-SERVER-01", "Item Description": "Enterprise Server Unit - Rackmount", "Physical Quantity": 24, "UOM": "Nos", "Unit Cost": "₹1,25,000.00" }
    ];
  } else {
    headers = ["Date", "Customer Name", "Invoice No", "Reference", "Gross Amount", "Tax Amount", "Net Total"];
    sampleRows = [
      { "Date": "2026-08-01", "Customer Name": "Zenith Infotech Ltd", "Invoice No": "INV-2026-001", "Reference": "PO-9912", "Gross Amount": "₹1,00,000.00", "Tax Amount": "₹18,000.00", "Net Total": "₹1,18,000.00" }
    ];
  }

  // Generate Column Profiles & Semantic Mappings
  const columnProfiles: ColumnProfile[] = headers.map((col) => {
    const key = col.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const matched = Object.entries(SEMANTIC_DICTIONARY).find(([dictKey]) => key.includes(dictKey));
    const semanticRole = matched ? matched[1].role : "Custom";
    const detectedType = matched ? matched[1].type : "String";
    const confidence = matched ? matched[1].confidence : "Low";

    return {
      columnName: col,
      detectedType: detectedType,
      nullCount: 0,
      nullPercentage: 0,
      uniqueCount: sampleRows.length,
      sampleValues: sampleRows.map((r) => r[col]),
      suggestedSemanticRole: semanticRole,
      suggestedConfidence: confidence
    };
  });

  const mappings: ColumnMappingDefinition[] = columnProfiles.map((cp, idx) => ({
    mappingId: `map_${idx + 1}`,
    externalColumn: cp.columnName,
    targetSemanticField: cp.suggestedSemanticRole || "Custom",
    targetDataType: cp.detectedType,
    confidence: cp.suggestedConfidence || "Medium",
    isUserConfirmed: cp.suggestedConfidence === "High",
    transformationPipeline: ["Trim", cp.detectedType === "Decimal" ? "CurrencyINRToDecimal" : "Identity"]
  }));

  const profile: DataProfileReport = {
    rowCount: sampleRows.length,
    columnCount: headers.length,
    fileFingerprintSha256: sha256,
    fileSizeBytes: (fileContent?.length || 1024) * 2,
    columns: columnProfiles,
    qualityMetrics: {
      completeness: 100,
      typeValidity: 100,
      duplicateRate: 0,
      mappingCoverage: Math.round((mappings.filter((m) => m.confidence === "High").length / mappings.length) * 100)
    },
    duplicateCandidateCount: 0,
    hasHeader: true,
    detectedHeaderRowIndex: 0,
    detectedDelimiter: ",",
    detectedEncoding: "UTF-8",
    isAmbiguousDateDetected: false,
    detectedDateFormat: "DD/MM/YYYY"
  };

  res.json({
    isDuplicateWarning: isDuplicate,
    sha256,
    profile,
    suggestedMappings: mappings,
    previewRows: sampleRows
  });
});

// 6. Complete Import into EXFIN Local External Dataset
importReconciliationRouter.post("/import-commit", (req, res) => {
  const {
    datasetName,
    sourceType,
    fileFormat,
    originalFileName,
    fileFingerprintSha256,
    columnMappings,
    previewRows,
    dataClassification = "Confidential"
  } = req.body;

  const datasetId = `DS_${sourceType.toUpperCase().replace(/\s+/g, "_")}_${Date.now()}`;

  const normalizedRows: NormalizedDataRow[] = (previewRows || []).map((raw: any, idx: number) => {
    const normalized: Record<string, any> = {};

    (columnMappings || []).forEach((m: ColumnMappingDefinition) => {
      const rawVal = raw[m.externalColumn];
      if (m.targetDataType === "Decimal") {
        normalized[m.targetSemanticField] = parseAmount(rawVal);
      } else if (m.targetDataType === "Date") {
        normalized[m.targetSemanticField] = rawVal;
      } else {
        normalized[m.targetSemanticField] = rawVal ? String(rawVal).trim() : "";
      }
    });

    return {
      rowId: `ROW_${datasetId}_${idx + 1}`,
      rawValues: raw,
      normalizedValues: normalized,
      lineage: {
        fileName: originalFileName || "imported_file.csv",
        fileSha256: fileFingerprintSha256 || "SHA256_HASH",
        rowIndex: idx + 1,
        columnName: "All",
        rawSourceLocation: `${originalFileName} -> Row ${idx + 1}`
      },
      isValid: true,
      validationErrors: []
    };
  });

  const dataset: ExternalDataset = {
    datasetId,
    datasetName: datasetName || `${sourceType} Import (${new Date().toLocaleDateString()})`,
    companyId,
    companyName,
    sourceType: sourceType as ExternalSourceType,
    fileFormat: fileFormat as SupportedFileFormat,
    originalFileName: originalFileName || "file.csv",
    fileFingerprintSha256: fileFingerprintSha256 || `sha256_${Date.now()}`,
    fileSizeBytes: 24500,
    version: 1,
    importedAt: new Date().toISOString(),
    importedBy: "finance.lead@exfin.internal",
    totalRows: normalizedRows.length,
    importedRows: normalizedRows.length,
    rejectedRows: 0,
    warningCount: 0,
    columnMappings: columnMappings || [],
    profile: {
      rowCount: normalizedRows.length,
      columnCount: (columnMappings || []).length,
      fileFingerprintSha256: fileFingerprintSha256 || "sha256",
      fileSizeBytes: 24500,
      columns: [],
      qualityMetrics: { completeness: 100, typeValidity: 100, duplicateRate: 0, mappingCoverage: 100 },
      duplicateCandidateCount: 0,
      hasHeader: true,
      detectedHeaderRowIndex: 0
    },
    rows: normalizedRows,
    dataClassification,
    retentionStatus: "Keep"
  };

  externalDatasetsStore.unshift(dataset);

  auditLogsStore.unshift({
    auditId: `AUD_${Date.now()}`,
    action: "Import",
    userId: "finance.lead@exfin.internal",
    userRole: "FinanceLead",
    timestamp: new Date().toISOString(),
    details: `Created external dataset '${dataset.datasetName}' with ${dataset.importedRows} rows. Tally data remains strictly read-only.`
  });

  res.json({ success: true, dataset });
});

// 7. Execute Reconciliation Matching (Live Tally or Local Parquet)
importReconciliationRouter.post("/reconcile/run", (req, res) => {
  const { datasetId, ruleConfig, isDryRun = false } = req.body;

  const dataset = externalDatasetsStore.find((d) => d.datasetId === datasetId);
  if (!dataset) {
    return res.status(404).json({ error: "External dataset not found" });
  }

  const rule: MatchingRuleConfig = ruleConfig || {
    ruleId: "RUL_DEFAULT",
    ruleName: "Standard Strict Matching",
    strategy: "Combined",
    cardinality: "OneToOne",
    amountTolerance: 1.0,
    dateToleranceDays: 2,
    partyFuzzyThreshold: 0.8,
    referenceExactMatch: true,
    requireSameSign: true,
    ignoreSpecialCharacters: true
  };

  const results: ReconciliationPairResult[] = [];
  let exact = 0;
  let strong = 0;
  let possible = 0;
  let unmatched = 0;
  let conflict = 0;

  // Evaluate against Tally cache based on source type
  let tallyPool: any[] = [];
  if (dataset.sourceType === "Bank Statement") tallyPool = [...TALLY_MOCK_CACHE.bankVouchers];
  else if (dataset.sourceType === "GST Data") tallyPool = [...TALLY_MOCK_CACHE.gstSalesVouchers];
  else if (dataset.sourceType === "Payroll") tallyPool = [...TALLY_MOCK_CACHE.payrollVouchers];
  else if (dataset.sourceType === "Inventory") tallyPool = [...TALLY_MOCK_CACHE.inventoryItems];
  else tallyPool = [...TALLY_MOCK_CACHE.bankVouchers];

  dataset.rows.forEach((row, idx) => {
    const extAmt = parseAmount(row.normalizedValues.Amount || row.normalizedValues.TotalAmount || row.normalizedValues.Credit || row.normalizedValues.Debit || row.normalizedValues.GrossPay);
    const extRef = row.normalizedValues.Reference || row.normalizedValues.InvoiceNumber || row.normalizedValues.ChequeNumber || row.normalizedValues.UTR || row.normalizedValues.EmployeeId || row.normalizedValues.ItemCode || "";
    const extParty = row.normalizedValues.PartyName || row.normalizedValues.Customer || row.normalizedValues.Supplier || row.normalizedValues.EmployeeName || row.normalizedValues.ItemName || "";
    const extDate = row.normalizedValues.Date || row.normalizedValues.InvoiceDate || "2026-08-15";

    // Find best match in Tally pool
    let bestMatch: any = null;
    let bestScore = 0;
    let matchCategory: MatchCategory = "No Match";
    let reason = "No corresponding Tally entry found.";

    for (const tallyItem of tallyPool) {
      const tAmt = tallyItem.amount || tallyItem.totalAmount || tallyItem.netPay || (tallyItem.quantity * tallyItem.rate) || 0;
      const tRef = tallyItem.reference || tallyItem.voucherNumber || tallyItem.invoiceNumber || tallyItem.employeeId || tallyItem.itemCode || "";
      const tParty = tallyItem.partyName || tallyItem.ledgerName || tallyItem.employeeName || tallyItem.itemName || "";

      const refMatch = extRef && tRef && (normalizeText(extRef) === normalizeText(tRef) || tRef.includes(extRef) || extRef.includes(tRef));
      const amtDiff = Math.abs(extAmt - tAmt);
      const amtMatch = amtDiff <= rule.amountTolerance;
      const partySim = calculateSimilarity(extParty, tParty);

      if (refMatch && amtMatch) {
        bestMatch = tallyItem;
        bestScore = 100;
        matchCategory = "Exact Match";
        reason = `Reference (${tRef}) and Amount (₹${tAmt.toLocaleString("en-IN")}) matched exactly.`;
        break;
      } else if (refMatch && !amtMatch) {
        bestMatch = tallyItem;
        bestScore = 70;
        matchCategory = "Conflict";
        reason = `Reference matched (${tRef}) but amount differs by ₹${amtDiff.toLocaleString("en-IN")} (External: ₹${extAmt}, Tally: ₹${tAmt}).`;
      } else if (amtMatch && partySim >= rule.partyFuzzyThreshold) {
        if (bestScore < 90) {
          bestMatch = tallyItem;
          bestScore = 88;
          matchCategory = "Strong Match";
          reason = `Amount matched and party similarity is ${Math.round(partySim * 100)}% (${extParty} ≈ ${tParty}).`;
        }
      } else if (amtMatch) {
        if (bestScore < 70) {
          bestMatch = tallyItem;
          bestScore = 68;
          matchCategory = "Possible Match";
          reason = `Amount matched (₹${extAmt.toLocaleString("en-IN")}) but references or parties require manual verification.`;
        }
      }
    }

    if (matchCategory === "Exact Match") exact++;
    else if (matchCategory === "Strong Match") strong++;
    else if (matchCategory === "Possible Match") possible++;
    else if (matchCategory === "Conflict") conflict++;
    else unmatched++;

    const fieldComparisons: FieldComparisonDetail[] = [
      {
        field: "Reference / Identifier",
        externalValue: extRef || "N/A",
        tallyValue: bestMatch?.reference || bestMatch?.voucherNumber || bestMatch?.invoiceNumber || "N/A",
        isMatched: bestScore >= 70
      },
      {
        field: "Amount",
        externalValue: extAmt,
        tallyValue: bestMatch?.amount || bestMatch?.totalAmount || bestMatch?.netPay || 0,
        difference: bestMatch ? Math.abs(extAmt - (bestMatch.amount || bestMatch.totalAmount || bestMatch.netPay || 0)) : extAmt,
        isMatched: bestMatch ? Math.abs(extAmt - (bestMatch.amount || bestMatch.totalAmount || bestMatch.netPay || 0)) <= rule.amountTolerance : false
      },
      {
        field: "Party / Ledger",
        externalValue: extParty || "N/A",
        tallyValue: bestMatch?.partyName || bestMatch?.ledgerName || bestMatch?.employeeName || "N/A",
        isMatched: bestMatch ? calculateSimilarity(extParty, bestMatch?.partyName || bestMatch?.ledgerName || "") >= 0.7 : false
      }
    ];

    results.push({
      pairId: `PAIR_${idx + 1}`,
      externalRowId: row.rowId,
      externalRow: row,
      tallyVoucherIds: bestMatch ? [bestMatch.voucherId] : [],
      tallyVouchers: bestMatch ? [bestMatch] : [],
      matchCategory,
      matchScore: bestScore,
      differenceAmount: bestMatch ? Math.abs(extAmt - (bestMatch.amount || bestMatch.totalAmount || bestMatch.netPay || 0)) : extAmt,
      reason,
      cardinality: "OneToOne",
      fieldComparisons,
      isManualOverride: false
    });
  });

  const session: ReconciliationSession = {
    sessionId: `REC_SESS_${Date.now()}`,
    sessionName: `${dataset.datasetName} vs Tally Reconciler`,
    companyId,
    companyName,
    sourceType: dataset.sourceType,
    externalDatasetId: dataset.datasetId,
    externalDatasetVersion: dataset.version,
    tallyDatasetVersion: "v2.4.0-parquet",
    tallySourceType: "Local Parquet Dataset",
    period: "August 2026",
    matchingRule: rule,
    status: "Completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdBy: "finance.ops@exfin.internal",
    totalExternalCount: dataset.rows.length,
    totalTallyEvaluated: tallyPool.length,
    exactMatchCount: exact,
    strongMatchCount: strong,
    possibleMatchCount: possible,
    unmatchedCount: unmatched,
    conflictCount: conflict,
    manualOverrideCount: 0,
    matchRatePercentage: dataset.rows.length > 0 ? Math.round(((exact + strong) / dataset.rows.length) * 100) : 0,
    snapshot: {
      datasetVersion: `v${dataset.version}.0`,
      mappingVersion: "v1.0.0",
      ruleVersion: "v1.0.0",
      engineDeterministicSignature: `SHA256:${crypto.createHash("sha256").update(JSON.stringify(results)).digest("hex")}`
    },
    results
  };

  if (!isDryRun) {
    reconciliationSessionsStore.unshift(session);
    auditLogsStore.unshift({
      auditId: `AUD_${Date.now()}`,
      sessionId: session.sessionId,
      action: "Reconcile",
      userId: "finance.ops@exfin.internal",
      userRole: "FinanceOps",
      timestamp: new Date().toISOString(),
      details: `Reconciled session '${session.sessionName}'. Matched: ${exact + strong}, Unmatched: ${unmatched}, Conflicts: ${conflict}.`
    });
  }

  res.json({
    isDryRun,
    session
  });
});

// 8. List Reconciliation Sessions
importReconciliationRouter.get("/reconcile/sessions", (req, res) => {
  res.json(reconciliationSessionsStore);
});

// 9. Get Single Session by ID
importReconciliationRouter.get("/reconcile/sessions/:id", (req, res) => {
  const session = reconciliationSessionsStore.find((s) => s.sessionId === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Reconciliation session not found" });
  }
  res.json(session);
});

// 10. Manual Match Override Endpoint
importReconciliationRouter.post("/reconcile/sessions/:id/override", (req, res) => {
  const { pairId, newCategory, overrideReason, selectedTallyVoucherId } = req.body;
  const session = reconciliationSessionsStore.find((s) => s.sessionId === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const pair = session.results.find((p) => p.pairId === pairId);
  if (!pair) {
    return res.status(404).json({ error: "Pair not found" });
  }

  const oldCat = pair.matchCategory;
  pair.originalAutoMatchCategory = pair.originalAutoMatchCategory || oldCat;
  pair.matchCategory = newCategory as MatchCategory;
  pair.isManualOverride = true;
  pair.overrideBy = "finance.manager@exfin.internal";
  pair.overrideAt = new Date().toISOString();
  pair.overrideReason = overrideReason || "Manual auditor override verified via invoice copy.";

  session.manualOverrideCount = session.results.filter((r) => r.isManualOverride).length;

  auditLogsStore.unshift({
    auditId: `AUD_${Date.now()}`,
    sessionId: session.sessionId,
    action: "Override",
    userId: "finance.manager@exfin.internal",
    userRole: "FinanceManager",
    timestamp: new Date().toISOString(),
    details: `Manual match override on Pair ${pairId}: '${oldCat}' -> '${newCategory}'. Reason: ${pair.overrideReason}`
  });

  res.json({ success: true, pair, session });
});

// 11. Bank Balance Integrity Validation Endpoint
importReconciliationRouter.get("/bank-balance-check/:datasetId", (req, res) => {
  const ds = externalDatasetsStore.find((d) => d.datasetId === req.params.datasetId);
  const opening = 500000.0;
  let credits = 0;
  let debits = 0;
  let statedClosing = 891910.0;

  if (ds) {
    ds.rows.forEach((r) => {
      credits += parseAmount(r.normalizedValues.Credit || 0);
      debits += parseAmount(r.normalizedValues.Debit || 0);
    });
  } else {
    credits = 425000.0;
    debits = 33090.0;
  }

  const computedClosing = opening + credits - debits;
  const discrepancy = Math.abs(computedClosing - statedClosing);

  const val: BankStatementBalanceValidation = {
    openingBalance: opening,
    totalCredits: credits,
    totalDebits: debits,
    computedClosingBalance: computedClosing,
    statedClosingBalance: statedClosing,
    isBalanced: discrepancy < 0.01,
    discrepancy
  };

  res.json(val);
});

// 12. Audit Logs
importReconciliationRouter.get("/audit/list", (req, res) => {
  res.json(auditLogsStore);
});

// 13. Copilot Reconciliation Explanations
importReconciliationRouter.post("/copilot/explain", (req, res) => {
  const { pairId, sessionId } = req.body;
  const session = reconciliationSessionsStore.find((s) => s.sessionId === sessionId) || reconciliationSessionsStore[0];
  const pair = session?.results.find((p) => p.pairId === pairId) || session?.results[session.results.length - 1];

  if (!pair) {
    return res.json({
      explanation: "No pair found. Please select a specific reconciliation row to explain.",
      potentialActions: ["Check date filters", "Verify reference numbers"]
    });
  }

  let explanation = "";
  const actions: string[] = [];

  if (pair.matchCategory === "Exact Match") {
    explanation = `This transaction matched deterministically. The reference '${pair.fieldComparisons[0]?.externalValue}' and the amount ₹${pair.fieldComparisons[1]?.externalValue?.toLocaleString("en-IN")} matched the Tally voucher with 100% confidence.`;
  } else if (pair.matchCategory === "Conflict") {
    explanation = `Conflict detected: The external reference matches a Tally voucher, but the amounts differ by ₹${pair.differenceAmount?.toLocaleString("en-IN")}. This usually indicates a partial payment, deduction (TDS), or bank fee difference.`;
    actions.push("Check if a TDS voucher or bank charge was booked separately in Tally");
    actions.push("Apply manual match override if confirmed as partial settlement");
  } else if (pair.matchCategory === "No Match") {
    explanation = `Unmatched record: External transaction of ₹${pair.fieldComparisons[1]?.externalValue?.toLocaleString("en-IN")} dated ${pair.externalRow.normalizedValues.Date || "N/A"} has no matching reference or amount in the Tally ledger for this period.`;
    actions.push("Check if the voucher is entered in a different bank account in Tally");
    actions.push("Confirm if this is a pending bank charge or direct debit not yet passed in Tally");
  } else {
    explanation = `Fuzzy/Strong match: The amount matches, and the party name similarity is high (${pair.reason}).`;
    actions.push("Review and click [Confirm Match] to mark as verified");
  }

  res.json({
    explanation,
    matchCategory: pair.matchCategory,
    score: pair.matchScore,
    potentialActions: actions,
    lineageTrace: pair.externalRow.lineage.rawSourceLocation
  });
});

// 14. Export Reconciliation Report (with formula-injection prevention)
importReconciliationRouter.get("/reconcile/sessions/:id/export", (req, res) => {
  const session = reconciliationSessionsStore.find((s) => s.sessionId === req.params.id);
  if (!session) {
    return res.status(404).send("Session not found");
  }

  const format = (req.query.format as string) || "CSV";

  if (format.toUpperCase() === "CSV") {
    const headers = ["Pair ID", "Match Status", "Score", "External Date", "External Ref", "External Amount", "Tally Ref", "Tally Amount", "Difference", "Lineage"];
    const rows = session.results.map((r) => [
      sanitizeFormulaInjection(r.pairId),
      sanitizeFormulaInjection(r.matchCategory),
      sanitizeFormulaInjection(r.matchScore),
      sanitizeFormulaInjection(r.externalRow.normalizedValues.Date || ""),
      sanitizeFormulaInjection(r.externalRow.normalizedValues.Reference || ""),
      sanitizeFormulaInjection(r.fieldComparisons[1]?.externalValue || 0),
      sanitizeFormulaInjection(r.fieldComparisons[0]?.tallyValue || ""),
      sanitizeFormulaInjection(r.fieldComparisons[1]?.tallyValue || 0),
      sanitizeFormulaInjection(r.differenceAmount || 0),
      sanitizeFormulaInjection(r.externalRow.lineage.rawSourceLocation)
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=Reconciliation_${session.sessionId}.csv`);
    return res.send(csvContent);
  }

  res.json({ success: true, message: `Report generated for format ${format}` });
});
