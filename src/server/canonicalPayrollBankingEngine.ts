/**
 * Phase 32C: Canonical Payroll and Banking Engine
 * Handles:
 * - Dynamic Discovery Activation (Mark "Not Available" if no payroll/banking found in source)
 * - CanonicalEmployee & CanonicalPayrollTransaction (Strict RBAC Privacy Controls, Masking)
 * - CanonicalPayrollPeriod
 * - CanonicalBankAccount & CanonicalBankTransaction (Account Masking, Reconciled Voucher Links)
 * - Phase 31 Graph integration & Phase 32A Schema Registry registration
 */

import {
  CanonicalEmployee,
  CanonicalPayrollPeriod,
  CanonicalPayrollTransaction,
  CanonicalBankAccount,
  CanonicalBankTransaction,
  EmployeeStatus,
  PreservedMonetaryValue,
  PreservedDateValue,
  ExtensionField,
  DatasetMetadata,
  SchemaRegistryItem
} from '../types/phase32UniversalModel';
import { universalDataModelEngine } from './universalDataModelEngine';
import { GraphNode, GraphEdge } from '../types/phase31ObjectGraph';

export class CanonicalPayrollBankingEngine {
  private employees: Map<string, CanonicalEmployee> = new Map();
  private payrollPeriods: Map<string, CanonicalPayrollPeriod> = new Map();
  private payrollTransactions: Map<string, CanonicalPayrollTransaction> = new Map();
  private bankAccounts: Map<string, CanonicalBankAccount> = new Map();
  private bankTransactions: Map<string, CanonicalBankTransaction> = new Map();

  // Availability state per company
  private payrollDiscoveredCompanies: Set<string> = new Set(['CMP-001']);
  private bankingDiscoveredCompanies: Set<string> = new Set(['CMP-001']);

  constructor() {
    this.registerPayrollAndBankingDatasets();
    this.seedInitialPayrollAndBanking();
  }

  // =========================================================================
  // 1. DATA CATALOG & SCHEMA REGISTRY INITIALIZATION (Phase 32A Integration)
  // =========================================================================

  private registerPayrollAndBankingDatasets() {
    const now = '2026-03-08T08:00:00Z';
    const companies = ['CMP-001', 'CMP-002'];

    for (const companyId of companies) {
      const isPayrollDiscovered = this.payrollDiscoveredCompanies.has(companyId);
      const isBankingDiscovered = this.bankingDiscoveredCompanies.has(companyId);

      // 1. Employee Master Dataset
      const dsEmp: DatasetMetadata = {
        datasetId: `ds-canonical-employees-${companyId}`,
        name: `Employees Master (${companyId})`,
        displayName: `Payroll - Employee Registry`,
        category: 'Payroll',
        companyId,
        source: 'Tally Payroll / Attendance Master',
        sourceObject: 'EMPLOYEE',
        schemaVersion: 1,
        grain: 'Employee (One row per source employee identity)',
        status: isPayrollDiscovered ? 'Active' : 'Inactive',
        description: isPayrollDiscovered
          ? 'Canonical employee records with RBAC restricted privacy safeguards.'
          : 'Payroll Dataset: Not Available (No payroll source evidence discovered).',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsEmp);

      // 2. Payroll Transactions Dataset
      const dsPayTrx: DatasetMetadata = {
        datasetId: `ds-canonical-payrolltransactions-${companyId}`,
        name: `Payroll Transactions (${companyId})`,
        displayName: `Payroll - Earnings, Deductions & Pay slips`,
        category: 'Payroll',
        companyId,
        source: 'Tally Payroll Vouchers',
        sourceObject: 'PAYSLIPENTRY',
        schemaVersion: 1,
        grain: 'PayrollTransaction (One row per employee pay component)',
        status: isPayrollDiscovered ? 'Active' : 'Inactive',
        description: isPayrollDiscovered
          ? 'Earnings and statutory deduction transactions.'
          : 'Payroll Dataset: Not Available.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsPayTrx);

      // 3. Bank Accounts Dataset
      const dsBankAcc: DatasetMetadata = {
        datasetId: `ds-canonical-bankaccounts-${companyId}`,
        name: `Bank Accounts Registry (${companyId})`,
        displayName: `Banking - Bank & Cash Accounts`,
        category: 'Banking',
        companyId,
        source: 'Tally Banking Master Gateway',
        sourceObject: 'BANKLEDGER',
        schemaVersion: 1,
        grain: 'BankAccount',
        status: isBankingDiscovered ? 'Active' : 'Inactive',
        description: 'Normalized bank accounts, IFSC routing codes, and ledger links.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsBankAcc);

      // 4. Bank Transactions Dataset
      const dsBankTrx: DatasetMetadata = {
        datasetId: `ds-canonical-banktransactions-${companyId}`,
        name: `Bank Transactions Register (${companyId})`,
        displayName: `Banking - Bank Statement & Cheque Transactions`,
        category: 'Banking',
        companyId,
        source: 'Tally Bank Reconciliation Gateway',
        sourceObject: 'BANKTRANSACTION',
        schemaVersion: 1,
        grain: 'BankTransaction (One row per source bank transaction)',
        status: isBankingDiscovered ? 'Active' : 'Inactive',
        description: 'Cheques, electronic transfers, deposits, and statement clearances.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsBankTrx);
    }
  }

  // =========================================================================
  // 2. NORMALIZERS
  // =========================================================================

  public normalizeEmployee(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalEmployee {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    this.payrollDiscoveredCompanies.add(companyId);
    const now = new Date().toISOString();
    const sourceId = String(raw.employeeId || raw.guid || raw.sourceId || raw.name || `EMP-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();

    // Map status safely
    const rawStatus = String(raw.status || 'Active').trim().toLowerCase();
    let status: EmployeeStatus = 'Active';
    if (rawStatus.includes('inact')) status = 'Inactive';
    else if (rawStatus.includes('leave')) status = 'OnLeave';
    else if (rawStatus.includes('term')) status = 'Terminated';
    else if (rawStatus === 'unknown') status = 'Unknown';

    // Privacy Masking
    const panRaw = raw.pan || raw.panNumber || '';
    const panMasked = panRaw ? `${panRaw.substring(0, 2)}XXXXX${panRaw.substring(7)}` : undefined;

    const bankAccRaw = raw.bankAccountNumber || raw.accountNumber || '';
    const bankAccountNumberMasked = bankAccRaw ? `XXXX-XXXX-${bankAccRaw.slice(-4)}` : undefined;

    const employeeId = `emp-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['employeeid', 'guid', 'sourceid', 'name', 'employeegroup', 'group', 'department', 'designation', 'status', 'joiningdate', 'pan', 'pannumber', 'bankaccountnumber', 'accountnumber', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `EMPLOYEE.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Employee Master XML',
          confidence: 'High',
          semanticMeaning: 'Preserved employee attribute',
          discoveredAt: now
        });
      }
    }

    const employee: CanonicalEmployee = {
      employeeId,
      sourceId,
      name,
      employeeGroup: raw.employeeGroup || raw.group || undefined,
      department: raw.department || undefined,
      designation: raw.designation || undefined,
      status,
      joiningDate: raw.joiningDate ? this.normalizeDateString(raw.joiningDate) : undefined,
      panMasked,
      bankAccountNumberMasked,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Employee Master XML',
      schemaVersion: 1,
      isCurrent: true,
      isRestricted: true, // RBAC privacy protection flag
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-employees-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.employees.set(employeeId, employee);
    return employee;
  }

  public normalizePayrollPeriod(
    raw: Record<string, any>,
    companyId: string
  ): CanonicalPayrollPeriod {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const sourceId = String(raw.periodId || raw.name || `PRD-${Date.now()}`).trim();
    const periodId = `prd-${companyId}-${this.slugify(sourceId)}`;

    const period: CanonicalPayrollPeriod = {
      periodId,
      sourceId,
      name: String(raw.name || sourceId).trim(),
      startDate: this.normalizeDateString(raw.startDate || '2026-03-01'),
      endDate: this.normalizeDateString(raw.endDate || '2026-03-31'),
      financialYear: raw.financialYear || '2025-2026',
      companyId,
      source: raw.source || 'Tally Payroll Period',
      schemaVersion: 1,
      isClosed: Boolean(raw.isClosed)
    };

    this.payrollPeriods.set(periodId, period);
    return period;
  }

  public normalizePayrollTransaction(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalPayrollTransaction {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    this.payrollDiscoveredCompanies.add(companyId);
    const now = new Date().toISOString();
    const sourceId = String(raw.payrollTransactionId || raw.guid || raw.sourceId || `PAYTRX-${Date.now()}`).trim();
    const employeeId = String(raw.employeeId || '').trim();
    const employeeName = String(raw.employeeName || employeeId).trim();
    const periodId = String(raw.periodId || 'prd-cmp-001-mar-2026').trim();

    const rawType = String(raw.componentType || 'Earning').trim();
    let componentType: 'Earning' | 'Deduction' | 'Statutory' | 'Reimbursement' | 'Other' = 'Earning';
    if (rawType.includes('Deduct')) componentType = 'Deduction';
    else if (rawType.includes('Statut')) componentType = 'Statutory';
    else if (rawType.includes('Reimb')) componentType = 'Reimbursement';
    else if (rawType.includes('Earn')) componentType = 'Earning';
    else componentType = 'Other';

    const amt = this.parseAmount(raw.amount);
    const amount: PreservedMonetaryValue = {
      originalValue: raw.amount,
      normalizedValue: amt,
      originalCurrency: raw.currency || 'INR'
    };

    const rawDate = String(raw.date || '2026-03-31').trim();
    const date: PreservedDateValue = {
      originalSourceDate: rawDate,
      normalizedDate: this.normalizeDateString(rawDate)
    };

    const payrollTransactionId = `paytrx-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['payrolltransactionid', 'guid', 'sourceid', 'employeeid', 'employeename', 'periodid', 'periodname', 'component', 'componenttype', 'amount', 'date', 'voucherid', 'companyid', 'source', 'currency']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `PAYSLIPENTRY.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Payroll Voucher XML',
          confidence: 'High',
          semanticMeaning: 'Preserved payroll transaction attribute',
          discoveredAt: now
        });
      }
    }

    const transaction: CanonicalPayrollTransaction = {
      payrollTransactionId,
      employeeId,
      employeeName,
      periodId,
      periodName: raw.periodName || undefined,
      component: String(raw.component || 'Basic Salary').trim(),
      componentType,
      amount,
      date,
      voucherId: raw.voucherId ? String(raw.voucherId).trim() : undefined,
      companyId,
      sourceId,
      source: raw.source || options.sourceReport || 'Tally Payroll Voucher XML',
      schemaVersion: 1,
      isRestricted: true,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-payrolltransactions-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.payrollTransactions.set(payrollTransactionId, transaction);
    return transaction;
  }

  public normalizeBankAccount(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalBankAccount {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    this.bankingDiscoveredCompanies.add(companyId);
    const now = new Date().toISOString();
    const sourceId = String(raw.bankAccountId || raw.guid || raw.sourceId || raw.name || `BANKACC-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();

    const rawAccNum = String(raw.accountNumber || raw.accountReference || '').trim();
    const accountNumberMasked = rawAccNum ? `XXXX-XXXX-${rawAccNum.slice(-4)}` : undefined;

    const openingBalance: PreservedMonetaryValue | undefined = raw.openingBalance !== undefined
      ? { originalValue: raw.openingBalance, normalizedValue: this.parseAmount(raw.openingBalance), originalCurrency: raw.currency || 'INR' }
      : undefined;

    const closingBalance: PreservedMonetaryValue | undefined = raw.closingBalance !== undefined
      ? { originalValue: raw.closingBalance, normalizedValue: this.parseAmount(raw.closingBalance), originalCurrency: raw.currency || 'INR' }
      : undefined;

    const bankAccountId = `bankacc-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['bankaccountid', 'guid', 'sourceid', 'name', 'ledgerid', 'ledgername', 'bankname', 'accountnumber', 'accountreference', 'accounttype', 'ifsccode', 'branch', 'currency', 'openingbalance', 'closingbalance', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `BANKLEDGER.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Banking Master XML',
          confidence: 'High',
          semanticMeaning: 'Preserved bank account attribute',
          discoveredAt: now
        });
      }
    }

    const account: CanonicalBankAccount = {
      bankAccountId,
      sourceId,
      name,
      ledgerId: raw.ledgerId ? String(raw.ledgerId).trim() : undefined,
      ledgerName: raw.ledgerName || undefined,
      bankName: raw.bankName || undefined,
      accountNumberMasked,
      accountType: raw.accountType || 'Current Account',
      ifscCode: raw.ifscCode || undefined,
      branch: raw.branch || undefined,
      currency: raw.currency || 'INR',
      openingBalance,
      closingBalance,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Banking Master XML',
      schemaVersion: 1,
      isCurrent: true,
      isRestricted: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-bankaccounts-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.bankAccounts.set(bankAccountId, account);
    return account;
  }

  public normalizeBankTransaction(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalBankTransaction {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    this.bankingDiscoveredCompanies.add(companyId);
    const now = new Date().toISOString();
    const sourceId = String(raw.bankTransactionId || raw.guid || raw.sourceId || `BANKTRX-${Date.now()}`).trim();
    const bankAccountId = String(raw.bankAccountId || '').trim();
    const bankAccountName = String(raw.bankAccountName || bankAccountId).trim();

    const rawType = String(raw.transactionType || raw.type || 'Deposit').trim();
    let transactionType: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Charges' | 'Interest' | 'Other' = 'Deposit';
    if (rawType.includes('Withdr') || rawType.includes('Payment')) transactionType = 'Withdrawal';
    else if (rawType.includes('Transf')) transactionType = 'Transfer';
    else if (rawType.includes('Charge')) transactionType = 'Charges';
    else if (rawType.includes('Interest')) transactionType = 'Interest';
    else if (rawType.includes('Deposit') || rawType.includes('Receipt')) transactionType = 'Deposit';
    else transactionType = 'Other';

    const amt = this.parseAmount(raw.amount);
    const amount: PreservedMonetaryValue = {
      originalValue: raw.amount,
      normalizedValue: amt,
      originalCurrency: raw.currency || 'INR'
    };

    const rawDate = String(raw.date || '2026-03-01').trim();
    const date: PreservedDateValue = {
      originalSourceDate: rawDate,
      normalizedDate: this.normalizeDateString(rawDate)
    };

    const bankTransactionId = `banktrx-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['banktransactionid', 'guid', 'sourceid', 'voucherid', 'voucherlineid', 'bankaccountid', 'bankaccountname', 'date', 'reference', 'instrumentnumber', 'instrumentdate', 'amount', 'partyid', 'partyname', 'transactiontype', 'type', 'reconciliationdate', 'companyid', 'source', 'currency']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `BANKTRANSACTION.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Bank Reconciliation XML',
          confidence: 'High',
          semanticMeaning: 'Preserved bank transaction attribute',
          discoveredAt: now
        });
      }
    }

    const transaction: CanonicalBankTransaction = {
      bankTransactionId,
      voucherId: raw.voucherId ? String(raw.voucherId).trim() : undefined,
      voucherLineId: raw.voucherLineId ? String(raw.voucherLineId).trim() : undefined,
      bankAccountId,
      bankAccountName,
      date,
      reference: raw.reference || undefined,
      instrumentNumber: raw.instrumentNumber || undefined,
      instrumentDate: raw.instrumentDate ? this.normalizeDateString(raw.instrumentDate) : undefined,
      amount,
      partyId: raw.partyId ? String(raw.partyId).trim() : undefined,
      partyName: raw.partyName || undefined,
      transactionType,
      reconciliationDate: raw.reconciliationDate ? this.normalizeDateString(raw.reconciliationDate) : undefined,
      companyId,
      sourceId,
      source: raw.source || options.sourceReport || 'Tally Bank Reconciliation XML',
      schemaVersion: 1,
      isRestricted: true,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-banktransactions-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.bankTransactions.set(bankTransactionId, transaction);
    return transaction;
  }

  // =========================================================================
  // 3. PRIVACY & SECURITY ACCESSORS (WITH ROLE CHECK & COMPANY ISOLATION)
  // =========================================================================

  public isPayrollAvailable(companyId: string): boolean {
    return this.payrollDiscoveredCompanies.has(companyId);
  }

  public isBankingAvailable(companyId: string): boolean {
    return this.bankingDiscoveredCompanies.has(companyId);
  }

  public getEmployees(companyId: string, options: { userRole?: string } = {}): CanonicalEmployee[] {
    if (!this.isPayrollAvailable(companyId)) return [];
    const isAuthorized = options.userRole === 'HR_ADMIN' || options.userRole === 'CFO' || options.userRole === 'SUPER_ADMIN';

    return Array.from(this.employees.values())
      .filter((e) => e.companyId === companyId && e.isCurrent)
      .map((e) => {
        if (!isAuthorized) {
          // Mask sensitive employee credentials for general view
          return {
            ...e,
            panMasked: 'XXXX-RESTRICTED',
            bankAccountNumberMasked: 'XXXX-RESTRICTED'
          };
        }
        return e;
      });
  }

  public getPayrollPeriods(companyId: string): CanonicalPayrollPeriod[] {
    if (!this.isPayrollAvailable(companyId)) return [];
    return Array.from(this.payrollPeriods.values()).filter((p) => p.companyId === companyId);
  }

  public getPayrollTransactions(companyId: string, options: { userRole?: string; employeeId?: string } = {}): CanonicalPayrollTransaction[] {
    if (!this.isPayrollAvailable(companyId)) return [];
    const isAuthorized = options.userRole === 'HR_ADMIN' || options.userRole === 'CFO' || options.userRole === 'SUPER_ADMIN';

    let list = Array.from(this.payrollTransactions.values()).filter((t) => t.companyId === companyId);
    if (options.employeeId) list = list.filter((t) => t.employeeId === options.employeeId);

    return list.map((t) => {
      if (!isAuthorized) {
        return {
          ...t,
          amount: {
            originalValue: '[RESTRICTED]',
            normalizedValue: 0,
            originalCurrency: 'INR'
          }
        };
      }
      return t;
    });
  }

  public getBankAccounts(companyId: string, options: { userRole?: string } = {}): CanonicalBankAccount[] {
    if (!this.isBankingAvailable(companyId)) return [];
    const isAuthorized = options.userRole === 'FINANCE_ADMIN' || options.userRole === 'CFO' || options.userRole === 'AUDITOR' || options.userRole === 'SUPER_ADMIN';

    return Array.from(this.bankAccounts.values())
      .filter((b) => b.companyId === companyId && b.isCurrent)
      .map((b) => {
        if (!isAuthorized) {
          return {
            ...b,
            accountNumberMasked: 'XXXX-RESTRICTED'
          };
        }
        return b;
      });
  }

  public getBankTransactions(companyId: string, options: { bankAccountId?: string } = {}): CanonicalBankTransaction[] {
    if (!this.isBankingAvailable(companyId)) return [];
    let list = Array.from(this.bankTransactions.values()).filter((t) => t.companyId === companyId);
    if (options.bankAccountId) list = list.filter((t) => t.bankAccountId === options.bankAccountId);
    return list;
  }

  // =========================================================================
  // 4. PHASE 31 GRAPH INTEGRATION
  // =========================================================================

  public syncPayrollAndBankingWithGraph(companyId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const now = new Date().toISOString();

    if (this.isPayrollAvailable(companyId)) {
      // 1. Employees
      const emps = this.getEmployees(companyId, { userRole: 'HR_ADMIN' });
      for (const e of emps) {
        nodes.push({
          nodeId: `node-emp-${e.employeeId}`,
          nodeType: 'Employee' as any,
          sourceId: e.sourceId,
          companyId,
          name: e.name,
          displayName: `${e.name} (${e.department || 'Staff'})`,
          status: 'Active',
          source: e.source,
          snapshotId: `snap-${companyId}-v32c`,
          firstSeen: e.validFrom,
          lastSeen: now,
          metadata: { designation: e.designation, status: e.status }
        });
      }

      // 2. Payroll Transactions
      const payTrxs = this.getPayrollTransactions(companyId, { userRole: 'HR_ADMIN' });
      for (const pt of payTrxs) {
        const trxNodeId = `node-paytrx-${pt.payrollTransactionId}`;
        nodes.push({
          nodeId: trxNodeId,
          nodeType: 'PayrollTransaction' as any,
          sourceId: pt.sourceId,
          companyId,
          name: `${pt.component} (${pt.employeeName})`,
          displayName: `${pt.component}: ₹${pt.amount.normalizedValue}`,
          status: 'Active',
          source: pt.source,
          snapshotId: `snap-${companyId}-v32c`,
          firstSeen: pt.date.normalizedDate,
          lastSeen: now,
          metadata: { componentType: pt.componentType, amount: pt.amount.normalizedValue }
        });

        // Link Employee -> Payroll Transaction
        const targetEmp = emps.find((e) => e.employeeId === pt.employeeId || e.sourceId === pt.employeeId || e.name.toLowerCase() === pt.employeeName.toLowerCase());
        if (targetEmp) {
          edges.push({
            edgeId: `edge-emp-paytrx-${pt.payrollTransactionId}`,
            fromNode: `node-emp-${targetEmp.employeeId}`,
            toNode: trxNodeId,
            relationshipType: 'COMPENSATED_BY' as any,
            origin: 'Direct',
            confidence: 'High',
            confidenceScore: 1.0,
            source: 'Payroll Compensation',
            evidence: { sourceField: 'PAYSLIPENTRY.EMPLOYEENAME', sourceRecord: pt.sourceId, sourceReport: 'PayrollMaster', extraction: 'Phase 32C', reason: 'Employee compensated via payroll line' },
            createdAt: now
          });
        }
      }
    }

    if (this.isBankingAvailable(companyId)) {
      // 3. Bank Accounts
      const bankAccs = this.getBankAccounts(companyId, { userRole: 'FINANCE_ADMIN' });
      for (const b of bankAccs) {
        nodes.push({
          nodeId: `node-bankacc-${b.bankAccountId}`,
          nodeType: 'BankAccount' as any,
          sourceId: b.sourceId,
          companyId,
          name: b.name,
          displayName: `${b.name} (${b.accountType || 'Bank'})`,
          status: 'Active',
          source: b.source,
          snapshotId: `snap-${companyId}-v32c`,
          firstSeen: b.validFrom,
          lastSeen: now,
          metadata: { ifscCode: b.ifscCode, branch: b.branch }
        });
      }

      // 4. Bank Transactions
      const bankTrxs = this.getBankTransactions(companyId);
      for (const bt of bankTrxs) {
        const trxNodeId = `node-banktrx-${bt.bankTransactionId}`;
        nodes.push({
          nodeId: trxNodeId,
          nodeType: 'BankTransaction' as any,
          sourceId: bt.sourceId,
          companyId,
          name: `${bt.transactionType} ${bt.bankAccountName}`,
          displayName: `${bt.transactionType}: ₹${bt.amount.normalizedValue} (Ref: ${bt.reference || 'N/A'})`,
          status: 'Active',
          source: bt.source,
          snapshotId: `snap-${companyId}-v32c`,
          firstSeen: bt.date.normalizedDate,
          lastSeen: now,
          metadata: { transactionType: bt.transactionType, amount: bt.amount.normalizedValue }
        });

        // Link Bank Account -> Bank Transaction
        const targetAcc = bankAccs.find((b) => b.bankAccountId === bt.bankAccountId || b.name.toLowerCase() === bt.bankAccountName.toLowerCase());
        if (targetAcc) {
          edges.push({
            edgeId: `edge-bankacc-trx-${bt.bankTransactionId}`,
            fromNode: `node-bankacc-${targetAcc.bankAccountId}`,
            toNode: trxNodeId,
            relationshipType: 'TRANSACTED_THROUGH' as any,
            origin: 'Direct',
            confidence: 'High',
            confidenceScore: 1.0,
            source: 'Bank Statement Flow',
            evidence: { sourceField: 'BANKTRANSACTION.BANKACCOUNT', sourceRecord: bt.sourceId, sourceReport: 'BankingMaster', extraction: 'Phase 32C', reason: 'Transaction logged through bank account' },
            createdAt: now
          });
        }
      }
    }

    return { nodes, edges };
  }

  // =========================================================================
  // 5. SEED DATA
  // =========================================================================

  private seedInitialPayrollAndBanking() {
    const companyId = 'CMP-001';

    // Payroll Period
    this.normalizePayrollPeriod(
      {
        periodId: 'PRD-MAR-2026',
        name: 'March 2026 Monthly Payroll',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        financialYear: '2025-2026'
      },
      companyId
    );

    // Employees
    const rawEmps = [
      {
        employeeId: 'EMP-1001',
        name: 'Aditya K. Verma',
        employeeGroup: 'Software Engineering',
        department: 'Engineering',
        designation: 'Principal Systems Architect',
        status: 'Active',
        joiningDate: '2022-04-01',
        pan: 'ABCDE1234F',
        bankAccountNumber: '918020003412'
      },
      {
        employeeId: 'EMP-1002',
        name: 'Sneha R. Patil',
        employeeGroup: 'Finance & Compliance',
        department: 'Accounts',
        designation: 'Senior Financial Controller',
        status: 'Active',
        joiningDate: '2023-01-10',
        pan: 'PQRSX9876T',
        bankAccountNumber: '501000889922'
      }
    ];
    for (const e of rawEmps) this.normalizeEmployee(e, companyId);

    // Payroll Transactions
    const rawPayTrxs = [
      {
        payrollTransactionId: 'PAYTRX-2026-03-01',
        employeeId: 'emp-cmp-001-emp-1001',
        employeeName: 'Aditya K. Verma',
        periodId: 'prd-cmp-001-prd-mar-2026',
        component: 'Basic Salary',
        componentType: 'Earning',
        amount: 250000,
        date: '2026-03-31'
      },
      {
        payrollTransactionId: 'PAYTRX-2026-03-02',
        employeeId: 'emp-cmp-001-emp-1001',
        employeeName: 'Aditya K. Verma',
        periodId: 'prd-cmp-001-prd-mar-2026',
        component: 'Provident Fund (Employee)',
        componentType: 'Statutory',
        amount: 1800,
        date: '2026-03-31'
      }
    ];
    for (const pt of rawPayTrxs) this.normalizePayrollTransaction(pt, companyId);

    // Bank Accounts
    const rawBankAccs = [
      {
        bankAccountId: 'BANK-HDFC-MAIN',
        name: 'HDFC Bank Ltd - Mumbai BKC Branch',
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        accountType: 'Current Account',
        ifscCode: 'HDFC0000123',
        branch: 'BKC, Mumbai',
        openingBalance: 5200000,
        closingBalance: 6180000
      }
    ];
    for (const ba of rawBankAccs) this.normalizeBankAccount(ba, companyId);

    // Bank Transactions
    const rawBankTrxs = [
      {
        bankTransactionId: 'BANKTRX-2026-001',
        bankAccountId: 'bankacc-cmp-001-bank-hdfc-main',
        bankAccountName: 'HDFC Bank Ltd - Mumbai BKC Branch',
        voucherId: 'VCH-INV-2026-001',
        date: '2026-03-02',
        reference: 'NEFT/N38192019/AcmeTech',
        instrumentNumber: 'NEFT-88912',
        amount: 354000,
        partyName: 'Acme Tech Corp',
        transactionType: 'Deposit',
        reconciliationDate: '2026-03-02'
      }
    ];
    for (const bt of rawBankTrxs) this.normalizeBankTransaction(bt, companyId);
  }

  private parseAmount(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const clean = val.replace(/,/g, '').replace(/[₹$]/g, '').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private normalizeDateString(dateStr: string): string {
    if (!dateStr) return '2026-03-01';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const dmy = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return dateStr.substring(0, 10);
  }

  private inferValueType(val: any): 'String' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean' | 'Object' | 'Array' | 'Unknown' {
    if (val === null || val === undefined) return 'Unknown';
    if (typeof val === 'boolean') return 'Boolean';
    if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Decimal';
    if (Array.isArray(val)) return 'Array';
    if (typeof val === 'object') return 'Object';
    if (typeof val === 'string') return 'String';
    return 'Unknown';
  }

  private slugify(str: string): string {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 40);
  }
}

export const canonicalPayrollBankingEngine = new CanonicalPayrollBankingEngine();
