import { Router } from 'express';
import { 
  BusinessRule, 
  ExceptionRecord, 
  IntelligenceSummary, 
  ReconciliationResult, 
  DataQualityScore 
} from '../types/phase32VIntelligence';

export const phase32vRouter = Router();

// Mock Rules
const mockRules: BusinessRule[] = [
  {
    ruleId: 'r_unbal_vch',
    name: 'Unbalanced Voucher Check',
    description: 'Detects vouchers where total debits do not equal total credits.',
    category: 'Accounting',
    scope: 'Vouchers',
    condition: 'SUM(Debit) != SUM(Credit)',
    severity: 'CRITICAL',
    confidence: 100,
    enabled: true,
    version: '1.0.0',
    createdBy: 'System',
    updatedAt: new Date().toISOString(),
    requiredConcepts: ['VoucherType', 'LedgerEntries.Debit', 'LedgerEntries.Credit']
  },
  {
    ruleId: 'r_neg_stock',
    name: 'Negative Stock Detection',
    description: 'Identifies inventory items ending the period with a negative closing balance.',
    category: 'Inventory',
    scope: 'Stock Items',
    condition: 'ClosingBalance < 0',
    severity: 'HIGH',
    confidence: 100,
    enabled: true,
    version: '1.0.1',
    createdBy: 'System',
    updatedAt: new Date().toISOString(),
    requiredConcepts: ['StockItem', 'ClosingBalance']
  },
  {
    ruleId: 'r_dup_sales',
    name: 'Potential Duplicate Sales',
    description: 'Flags sales invoices with identical party, amount, and date within a 1-day window.',
    category: 'Sales',
    scope: 'Vouchers',
    condition: 'MATCH(Party, Amount, Date, window=1d) > 1',
    severity: 'MEDIUM',
    confidence: 80,
    enabled: true,
    version: '1.1.0',
    createdBy: 'System',
    updatedAt: new Date().toISOString(),
    requiredConcepts: ['PartyLedgerName', 'Amount', 'Date', 'VoucherType=Sales']
  }
];

// Mock Exceptions
const mockExceptions: ExceptionRecord[] = [
  {
    exceptionId: 'exc_001',
    ruleId: 'r_unbal_vch',
    companyId: 'comp_exfin_corp_id',
    category: 'Accounting',
    severity: 'CRITICAL',
    confidence: 100,
    status: 'NEW',
    description: 'Journal voucher JRN-1042 has mismatched debit (500) and credit (400).',
    evidence: { voucherNumber: 'JRN-1042', totalDebit: 500, totalCredit: 400, diff: 100 },
    affectedAmount: 100,
    affectedCount: 1,
    firstDetected: new Date(Date.now() - 86400000).toISOString(),
    lastDetected: new Date().toISOString()
  },
  {
    exceptionId: 'exc_002',
    ruleId: 'r_neg_stock',
    companyId: 'comp_exfin_corp_id',
    category: 'Inventory',
    severity: 'HIGH',
    confidence: 100,
    status: 'UNDER_REVIEW',
    description: 'Stock Item "Widget A" has negative closing balance of -15 units.',
    evidence: { itemName: 'Widget A', closingBalance: -15, value: -1500 },
    affectedAmount: 1500,
    affectedCount: 1,
    firstDetected: new Date(Date.now() - 172800000).toISOString(),
    lastDetected: new Date().toISOString()
  }
];

const mockReconciliations: ReconciliationResult[] = [
  {
    reconId: 'rec_stock_01',
    type: 'Stock Movement vs Closing',
    category: 'Inventory',
    expected: 150,
    actual: 150,
    difference: 0,
    tolerance: 0,
    toleranceType: 'ABSOLUTE',
    status: 'PASS',
    explanation: 'Expected Closing = Opening (100) + Inward (200) - Outward (150) = 150. Matches Actual Closing.'
  },
  {
    reconId: 'rec_debtors_01',
    type: 'Sales vs Receivable',
    category: 'Receivables',
    expected: 50000,
    actual: 50500,
    difference: -500,
    tolerance: 100,
    toleranceType: 'ABSOLUTE',
    status: 'WARNING',
    explanation: 'Sales recorded (50000) differs from Debtor movement (50500) beyond tolerance (100). Possible manual journal entry in Debtor group.',
    drillDownContext: { group: 'Sundry Debtors' }
  }
];

// Routes
phase32vRouter.get('/api/v1/intelligence/rules', (req, res) => {
  res.json(mockRules);
});

phase32vRouter.get('/api/v1/intelligence/exceptions', (req, res) => {
  res.json(mockExceptions);
});

phase32vRouter.get('/api/v1/intelligence/reconciliation', (req, res) => {
  res.json(mockReconciliations);
});

phase32vRouter.get('/api/v1/intelligence/summary', (req, res) => {
  const summary: IntelligenceSummary = {
    totalChecks: 15420,
    passed: 15410,
    warnings: 5,
    reviewItems: 3,
    criticalItems: 2,
    reconciliationDifferences: 1,
    categories: {
      'Accounting': { count: 1, critical: 1 },
      'Sales': { count: 2, critical: 0 },
      'Purchase': { count: 0, critical: 0 },
      'Inventory': { count: 1, critical: 1 },
      'Receivables': { count: 1, critical: 0 },
      'Payables': { count: 0, critical: 0 },
      'Banking': { count: 0, critical: 0 },
      'Tax': { count: 0, critical: 0 },
      'Payroll': { count: 0, critical: 0 },
      'Manufacturing': { count: 0, critical: 0 },
      'Data Quality': { count: 5, critical: 0 },
      'Operational': { count: 0, critical: 0 }
    }
  };
  res.json(summary);
});

phase32vRouter.get('/api/v1/intelligence/quality', (req, res) => {
  const score: DataQualityScore = {
    overall: 96,
    completeness: 99,
    consistency: 94,
    validity: 98,
    uniqueness: 95,
    timeliness: 96,
    insufficientData: false
  };
  res.json(score);
});
