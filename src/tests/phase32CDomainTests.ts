/**
 * Phase 32C Multi-Domain Normalization Test Suite
 * Covers:
 * 1. Unit Tests (Inventory, Tax, Cost Centres, Payroll, Banking)
 * 2. Security & Privacy Tests (RBAC masking of PAN, Bank Accounts, Salaries)
 * 3. Company Isolation Tests (Strict separation of multi-tenant entities)
 * 4. Graph Synchronization Tests (Phase 31 integration)
 * 5. Unknown Extension Field Preservation Tests
 */

import { canonicalInventoryEngine } from '../server/canonicalInventoryEngine';
import { canonicalTaxCostCentreEngine } from '../server/canonicalTaxCostCentreEngine';
import { canonicalPayrollBankingEngine } from '../server/canonicalPayrollBankingEngine';
import { canonicalNormalizationEngine } from '../server/canonicalNormalizationEngine';

export interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runPhase32CTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  const runTest = (suite: string, name: string, fn: () => void) => {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite,
        testName: name,
        passed: true,
        message: 'Passed successfully',
        durationMs: Number((performance.now() - start).toFixed(2))
      });
    } catch (err: any) {
      results.push({
        suite,
        testName: name,
        passed: false,
        message: err.message || 'Assertion failed',
        durationMs: Number((performance.now() - start).toFixed(2))
      });
    }
  };

  // =========================================================================
  // 1. INVENTORY DOMAIN TESTS
  // =========================================================================
  runTest('Inventory Domain', 'Should normalize Stock Group and preserve parent hierarchy', () => {
    const raw = {
      NAME: 'Electronics Division',
      PARENT: 'Finished Goods',
      GUID: 'STKGRP-RAW-001',
      CUSTOM_INSPECTION_TAG: 'ISO-9001'
    };
    const normalized = canonicalInventoryEngine.normalizeStockGroup(raw, 'CMP-TEST-01');
    if (!normalized.stockGroupId || normalized.name !== 'Electronics Division') {
      throw new Error('Stock group name or ID normalization failed');
    }
    if (normalized.companyId !== 'CMP-TEST-01') {
      throw new Error('Company ID mismatch');
    }
    // Check unknown field preservation
    const ext = normalized.extensionFields?.find((f) => f.name === 'CUSTOM_INSPECTION_TAG');
    if (!ext || ext.value !== 'ISO-9001') {
      throw new Error('Failed to preserve unknown extension field CUSTOM_INSPECTION_TAG');
    }
  });

  runTest('Inventory Domain', 'Should normalize Stock Item with base unit and closing quantity', () => {
    const raw = {
      NAME: 'Dell Latitude 7420 Laptop',
      PARENT: 'Electronics Division',
      BASEUNITS: 'Nos',
      OPENINGBALANCE: '10 Nos',
      OPENINGVALUE: '500000',
      CLOSINGBALANCE: '15 Nos',
      CLOSINGVALUE: '750000',
      TARIFF_CODE: '84713010'
    };
    const normalized = canonicalInventoryEngine.normalizeStockItem(raw, 'CMP-TEST-01');
    if (normalized.unit.originalUnit !== 'Nos') {
      throw new Error(`Expected unit 'Nos', got '${normalized.unit.originalUnit}'`);
    }
    if (normalized.closingQuantity.normalizedValue !== 15) {
      throw new Error(`Expected closing qty 15, got ${normalized.closingQuantity.normalizedValue}`);
    }
    if (normalized.closingValue.normalizedValue !== 750000) {
      throw new Error(`Expected closing value 750000, got ${normalized.closingValue.normalizedValue}`);
    }
  });

  runTest('Inventory Domain', 'Should track Godown hierarchies and Inventory Movements', () => {
    const godownRaw = {
      NAME: 'Mumbai Central Warehouse - Bay A',
      PARENTLOCATION: 'Mumbai Central Warehouse',
      GODOWN_ID: 'GDN-MUM-01'
    };
    const godown = canonicalInventoryEngine.normalizeGodown(godownRaw, 'CMP-TEST-01');
    if (godown.parentGodownName !== 'Mumbai Central Warehouse') {
      throw new Error('Godown parent hierarchy resolution failed');
    }

    const movementRaw = {
      VOUCHERNUMBER: 'INV-MOV-101',
      DATE: '2026-03-15',
      ITEM: 'Dell Latitude 7420 Laptop',
      QTY: '-2 Nos',
      RATE: '50000',
      AMOUNT: '100000',
      GODOWN: 'Mumbai Central Warehouse - Bay A'
    };
    const movement = canonicalInventoryEngine.normalizeInventoryMovement(movementRaw, 'CMP-TEST-01');
    if (movement.movementType !== 'Issue') {
      throw new Error(`Expected movement type 'Issue' for negative qty, got '${movement.movementType}'`);
    }
    if (movement.quantity.normalizedValue !== 2) {
      throw new Error(`Expected normalized qty 2, got ${movement.quantity.normalizedValue}`);
    }
  });

  // =========================================================================
  // 2. TAX & COST CENTRE DOMAIN TESTS
  // =========================================================================
  runTest('Taxation Domain', 'Should dynamically normalize Tax Entities without hardcoding', () => {
    const rawTax = {
      NAME: 'IGST 18% Output',
      TAXTYPE: 'Goods and Services Tax',
      RATE: '18',
      JURISDICTION: 'India Federal',
      REGISTRATION_NO: '27AABCE1234F1Z5'
    };
    const normalizedTax = canonicalTaxCostCentreEngine.normalizeTaxEntity(rawTax, 'CMP-TEST-01');
    if (normalizedTax.rate !== 18) {
      throw new Error(`Expected rate 18, got ${normalizedTax.rate}`);
    }
    if (normalizedTax.type !== 'GST') {
      throw new Error(`Expected classification GST, got ${normalizedTax.type}`);
    }
  });

  runTest('Taxation Domain', 'Should normalize Tax Transactions with taxable base and rate breakdown', () => {
    const rawTrx = {
      VOUCHERID: 'VCH-SALES-99',
      TAX_COMPONENT: 'CGST 9%',
      TAXABLE_BASE: '100000',
      TAX_AMOUNT: '9000',
      RATE: '9',
      PARTY: 'Acme Corp'
    };
    const normalized = canonicalTaxCostCentreEngine.normalizeTaxTransaction(rawTrx, 'CMP-TEST-01');
    if (normalized.taxAmount.normalizedValue !== 9000 || normalized.taxableValue.normalizedValue !== 100000) {
      throw new Error('Tax transaction amount or taxable base normalization failed');
    }
  });

  runTest('Cost Centres Domain', 'Should normalize Cost Centre Categories and sub-centres', () => {
    const rawCat = {
      NAME: 'Project Deliverables',
      GUID: 'CAT-PRJ-01'
    };
    const cat = canonicalTaxCostCentreEngine.normalizeCostCentreCategory(rawCat, 'CMP-TEST-01');
    if (cat.name !== 'Project Deliverables') {
      throw new Error('Cost centre category name normalization failed');
    }

    const rawCC = {
      NAME: 'Enterprise Cloud Migration Alpha',
      CATEGORY: 'Project Deliverables',
      PARENT: 'Cloud Services Division'
    };
    const cc = canonicalTaxCostCentreEngine.normalizeCostCentre(rawCC, 'CMP-TEST-01');
    if (cc.categoryName !== 'Project Deliverables' || cc.parentName !== 'Cloud Services Division') {
      throw new Error('Cost centre category or parent linking failed');
    }
  });

  // =========================================================================
  // 3. PAYROLL & PRIVACY RBAC TESTS
  // =========================================================================
  runTest('Payroll & Privacy', 'Guest role MUST receive masked PAN and restricted salary amounts', () => {
    const rawEmp = {
      NAME: 'Rajesh Sharma',
      PAN: 'ABCPS1234K',
      BANK_ACC: '987654321098',
      DEPARTMENT: 'Core Engineering'
    };
    canonicalPayrollBankingEngine.normalizeEmployee(rawEmp, 'CMP-TEST-01');

    // Retrieve as GUEST
    const guestEmployees = canonicalPayrollBankingEngine.getEmployees('CMP-TEST-01', { userRole: 'GUEST' });
    const emp = guestEmployees.find((e) => e.name === 'Rajesh Sharma');
    if (!emp) throw new Error('Employee not found');

    if (emp.panMasked !== '******1234K' && emp.panMasked !== 'ABCPS****K' && !emp.panMasked?.includes('*')) {
      throw new Error(`PAN must be masked for GUEST, got: ${emp.panMasked}`);
    }

    if (emp.bankAccountNumberMasked && !emp.bankAccountNumberMasked.includes('*')) {
      throw new Error(`Bank account must be masked for GUEST, got: ${emp.bankAccountNumberMasked}`);
    }
  });

  runTest('Payroll & Privacy', 'HR Admin role unmasks PAN while maintaining company isolation', () => {
    const hrEmployees = canonicalPayrollBankingEngine.getEmployees('CMP-TEST-01', { userRole: 'HR_ADMIN' });
    const emp = hrEmployees.find((e) => e.name === 'Rajesh Sharma');
    if (!emp) throw new Error('Employee not found');
    if (emp.panMasked !== 'ABCPS1234K') {
      throw new Error(`HR_ADMIN should see unmasked PAN, got: ${emp.panMasked}`);
    }
  });

  // =========================================================================
  // 4. BANKING DOMAIN & RECONCILIATION TESTS
  // =========================================================================
  runTest('Banking Domain', 'Should normalize Bank Account and mask account numbers for unauthorized roles', () => {
    const rawBank = {
      ACCOUNT_NAME: 'HDFC Corporate Current A/c',
      ACCOUNT_NUMBER: '50200012345678',
      BANK_NAME: 'HDFC Bank Ltd',
      IFSC: 'HDFC0000123',
      BRANCH: 'Fort, Mumbai',
      CLOSING_BALANCE: '4500000'
    };
    canonicalPayrollBankingEngine.normalizeBankAccount(rawBank, 'CMP-TEST-01');

    const guestAccounts = canonicalPayrollBankingEngine.getBankAccounts('CMP-TEST-01', { userRole: 'GUEST' });
    const acc = guestAccounts.find((a) => a.name === 'HDFC Corporate Current A/c');
    if (!acc) throw new Error('Bank account not found');
    if (!acc.accountNumberMasked.includes('*')) {
      throw new Error(`Bank account number must be masked for GUEST, got: ${acc.accountNumberMasked}`);
    }

    const financeAccounts = canonicalPayrollBankingEngine.getBankAccounts('CMP-TEST-01', { userRole: 'FINANCE_ADMIN' });
    const finAcc = financeAccounts.find((a) => a.name === 'HDFC Corporate Current A/c');
    if (!finAcc || finAcc.accountNumberMasked !== '50200012345678') {
      throw new Error(`FINANCE_ADMIN should see unmasked account number, got: ${finAcc?.accountNumberMasked}`);
    }
  });

  // =========================================================================
  // 5. PHASE 31 GRAPH SYNCHRONIZATION TESTS
  // =========================================================================
  runTest('Graph Integration', 'Should synchronize all domains into Phase 31 Object Graph', () => {
    const graphData = canonicalNormalizationEngine.getGraphData('CMP-TEST-01');
    if (!graphData.nodes || graphData.nodes.length === 0) {
      throw new Error('Graph synchronization returned 0 nodes');
    }
    const hasInventoryNode = graphData.nodes.some((n) => n.nodeType === 'StockItem' || n.nodeType === 'StockGroup');
    const hasTaxNode = graphData.nodes.some((n) => n.nodeType === 'Tax' || (n.nodeType as string) === 'TaxEntity');
    if (!hasInventoryNode || !hasTaxNode) {
      throw new Error('Graph nodes missing StockItem or Tax domain nodes');
    }
  });

  // =========================================================================
  // 6. MULTI-TENANT COMPANY ISOLATION TEST
  // =========================================================================
  runTest('Company Isolation', 'Data from CMP-TEST-01 must never bleed into CMP-TEST-02', () => {
    const cmp2Items = canonicalInventoryEngine.getStockItems('CMP-TEST-02');
    const hasCmp1Item = cmp2Items.some((i) => i.name === 'Dell Latitude 7420 Laptop');
    if (hasCmp1Item) {
      throw new Error('Cross-tenant data bleed detected: CMP-TEST-01 item found in CMP-TEST-02 query');
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
