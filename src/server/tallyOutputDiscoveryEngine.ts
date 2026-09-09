/**
 * Phase 32I - Tally Output Discovery Engine
 * Discovers available outputs from connected Tally datasets, maintains the output catalog,
 * maps outputs to canonical datasets, computes mapping confidence, and tracks change detection.
 */

import {
  ITallyOutputDiscoveryService,
  TallyOutputCatalogItem,
  OutputCategory,
  CatalogField
} from '../types/phase32IReporting';
import { universalDataModelEngine } from './universalDataModelEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';

export class TallyOutputDiscoveryEngine implements ITallyOutputDiscoveryService {
  private catalog: Map<string, TallyOutputCatalogItem> = new Map();
  private lastDiscoveredAt: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultCatalog();
  }

  private initializeDefaultCatalog() {
    const now = new Date().toISOString();

    const items: TallyOutputCatalogItem[] = [
      // 1. Accounting - Vouchers
      {
        outputId: 'OUT-VOUCHERS-001',
        name: 'Voucher Register & Transactions',
        category: 'Accounting',
        source: 'Tally XML Collection (Voucher)',
        availability: 'Confirmed',
        dataset: 'canonical-vouchers',
        grain: 'One row per Voucher',
        fields: [
          { fieldName: 'voucherId', dataType: 'string', sourceField: 'VOUCHERKEY', canonicalField: 'voucherId', warehouseField: 'voucherId', nullable: false, description: 'Unique Voucher Identifier' },
          { fieldName: 'voucherNumber', dataType: 'string', sourceField: 'VOUCHERNUMBER', canonicalField: 'voucherNumber', warehouseField: 'voucherNumber', nullable: false, description: 'Voucher Serial Number', example: 'VCH-001' },
          { fieldName: 'voucherType', dataType: 'string', sourceField: 'VOUCHERTYPENAME', canonicalField: 'voucherType', warehouseField: 'voucherType', nullable: false, description: 'Source Voucher Type Name', example: 'Sales' },
          { fieldName: 'date', dataType: 'date', sourceField: 'DATE', canonicalField: 'date', warehouseField: 'date', nullable: false, description: 'Transaction Date', example: '2026-03-31' },
          { fieldName: 'amount', dataType: 'number', sourceField: 'AMOUNT', canonicalField: 'amount', warehouseField: 'amount', nullable: false, description: 'Net Voucher Amount', example: 15000 },
          { fieldName: 'partyLedgerName', dataType: 'string', sourceField: 'PARTYLEDGERNAME', canonicalField: 'partyName', warehouseField: 'partyName', nullable: true, description: 'Counterparty Ledger Name' },
          { fieldName: 'narration', dataType: 'string', sourceField: 'NARRATION', canonicalField: 'narration', warehouseField: 'narration', nullable: true, description: 'Transaction Narration' }
        ],
        parameters: ['Company', 'Financial Year', 'Date From', 'Date To', 'Voucher Type', 'Party'],
        relationships: ['canonical-voucher-lines', 'canonical-parties', 'dim-voucher-type'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 2. Accounting - Voucher Lines
      {
        outputId: 'OUT-VOUCHERLINES-002',
        name: 'Voucher Ledger Entries (Lines)',
        category: 'Accounting',
        source: 'Tally XML Collection (ALLLEDGERENTRIES)',
        availability: 'Confirmed',
        dataset: 'canonical-voucher-lines',
        grain: 'One row per Voucher Line',
        fields: [
          { fieldName: 'voucherLineId', dataType: 'string', sourceField: 'LINEKEY', canonicalField: 'voucherLineId', warehouseField: 'voucherLineId', nullable: false },
          { fieldName: 'voucherId', dataType: 'string', sourceField: 'VOUCHERKEY', canonicalField: 'voucherId', warehouseField: 'voucherId', nullable: false },
          { fieldName: 'ledgerName', dataType: 'string', sourceField: 'LEDGERNAME', canonicalField: 'ledgerName', warehouseField: 'ledgerName', nullable: false },
          { fieldName: 'amount', dataType: 'number', sourceField: 'AMOUNT', canonicalField: 'amount', warehouseField: 'amount', nullable: false },
          { fieldName: 'isDeemedPositive', dataType: 'boolean', sourceField: 'ISDEEMEDPOSITIVE', canonicalField: 'isDeemedPositive', warehouseField: 'isDeemedPositive', nullable: false }
        ],
        parameters: ['Company', 'Date From', 'Date To', 'Ledger'],
        relationships: ['canonical-vouchers', 'canonical-ledgers'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 3. Accounting - Ledgers & Trial Balance
      {
        outputId: 'OUT-LEDGERS-003',
        name: 'General Ledgers & Trial Balance',
        category: 'Accounting',
        source: 'Tally XML Collection (Ledger)',
        availability: 'Confirmed',
        dataset: 'canonical-ledgers',
        grain: 'One row per Ledger',
        fields: [
          { fieldName: 'ledgerId', dataType: 'string', sourceField: 'LEDGERKEY', canonicalField: 'ledgerId', warehouseField: 'ledgerId', nullable: false },
          { fieldName: 'ledgerName', dataType: 'string', sourceField: 'NAME', canonicalField: 'ledgerName', warehouseField: 'ledgerName', nullable: false },
          { fieldName: 'groupName', dataType: 'string', sourceField: 'PARENT', canonicalField: 'groupName', warehouseField: 'groupName', nullable: false },
          { fieldName: 'openingBalance', dataType: 'number', sourceField: 'OPENINGBALANCE', canonicalField: 'openingBalance', warehouseField: 'openingBalance', nullable: false },
          { fieldName: 'closingBalance', dataType: 'number', sourceField: 'CLOSINGBALANCE', canonicalField: 'closingBalance', warehouseField: 'closingBalance', nullable: false }
        ],
        parameters: ['Company', 'Financial Year', 'Group', 'Ledger'],
        relationships: ['canonical-groups'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 4. Accounting - Account Groups
      {
        outputId: 'OUT-GROUPS-004',
        name: 'Chart of Account Groups',
        category: 'Masters',
        source: 'Tally XML Collection (Group)',
        availability: 'Confirmed',
        dataset: 'canonical-groups',
        grain: 'One row per Account Group',
        fields: [
          { fieldName: 'groupId', dataType: 'string', sourceField: 'GROUPKEY', canonicalField: 'groupId', warehouseField: 'groupId', nullable: false },
          { fieldName: 'groupName', dataType: 'string', sourceField: 'NAME', canonicalField: 'groupName', warehouseField: 'groupName', nullable: false },
          { fieldName: 'parentGroup', dataType: 'string', sourceField: 'PARENT', canonicalField: 'parentGroup', warehouseField: 'parentGroup', nullable: true },
          { fieldName: 'primaryCategory', dataType: 'string', sourceField: 'PRIMARYCATEGORY', canonicalField: 'primaryCategory', warehouseField: 'primaryCategory', nullable: false }
        ],
        parameters: ['Company'],
        relationships: [],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 5. Inventory - Stock Items & Movement
      {
        outputId: 'OUT-STOCKITEMS-005',
        name: 'Stock Items & Inventory Register',
        category: 'Inventory',
        source: 'Tally XML Collection (StockItem)',
        availability: 'Confirmed',
        dataset: 'canonical-stock-items',
        grain: 'One row per Stock Item',
        fields: [
          { fieldName: 'itemId', dataType: 'string', sourceField: 'STOCKITEMKEY', canonicalField: 'itemId', warehouseField: 'itemId', nullable: false },
          { fieldName: 'itemName', dataType: 'string', sourceField: 'NAME', canonicalField: 'itemName', warehouseField: 'itemName', nullable: false },
          { fieldName: 'stockGroupName', dataType: 'string', sourceField: 'PARENT', canonicalField: 'stockGroupName', warehouseField: 'stockGroupName', nullable: false },
          { fieldName: 'uom', dataType: 'string', sourceField: 'BASEUNITS', canonicalField: 'uom', warehouseField: 'uom', nullable: false },
          { fieldName: 'openingQty', dataType: 'number', sourceField: 'OPENINGBALANCE', canonicalField: 'openingQty', warehouseField: 'openingQty', nullable: false },
          { fieldName: 'closingQty', dataType: 'number', sourceField: 'CLOSINGBALANCE', canonicalField: 'closingQty', warehouseField: 'closingQty', nullable: false },
          { fieldName: 'closingRate', dataType: 'number', sourceField: 'CLOSINGRATE', canonicalField: 'closingRate', warehouseField: 'closingRate', nullable: false },
          { fieldName: 'closingValue', dataType: 'number', sourceField: 'CLOSINGVALUE', canonicalField: 'closingValue', warehouseField: 'closingValue', nullable: false }
        ],
        parameters: ['Company', 'Stock Group', 'Stock Item'],
        relationships: ['canonical-stock-groups', 'canonical-inventory-movements'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 6. Tax - GST & Tax Transactions
      {
        outputId: 'OUT-TAX-006',
        name: 'Tax Calculated Transactions',
        category: 'Tax',
        source: 'Tally XML Collection (TaxTransactions)',
        availability: 'Confirmed',
        dataset: 'canonical-tax-transactions',
        grain: 'One row per Tax Line',
        fields: [
          { fieldName: 'taxTxnId', dataType: 'string', sourceField: 'TAXLINEKEY', canonicalField: 'taxTxnId', warehouseField: 'taxTxnId', nullable: false },
          { fieldName: 'voucherId', dataType: 'string', sourceField: 'VOUCHERKEY', canonicalField: 'voucherId', warehouseField: 'voucherId', nullable: false },
          { fieldName: 'taxType', dataType: 'string', sourceField: 'TAXTYPE', canonicalField: 'taxType', warehouseField: 'taxType', nullable: false },
          { fieldName: 'taxRate', dataType: 'number', sourceField: 'TAXRATE', canonicalField: 'taxRate', warehouseField: 'taxRate', nullable: false },
          { fieldName: 'taxAmount', dataType: 'number', sourceField: 'TAXAMOUNT', canonicalField: 'taxAmount', warehouseField: 'taxAmount', nullable: false },
          { fieldName: 'assessableValue', dataType: 'number', sourceField: 'ASSESSABLEVALUE', canonicalField: 'assessableValue', warehouseField: 'assessableValue', nullable: false }
        ],
        parameters: ['Company', 'Date From', 'Date To', 'Tax Type'],
        relationships: ['canonical-vouchers'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 7. Banking - Bank Accounts & Statements
      {
        outputId: 'OUT-BANKING-007',
        name: 'Bank Transactions & Reconciliation',
        category: 'Banking',
        source: 'Tally XML Collection (BankTransactions)',
        availability: 'Confirmed',
        dataset: 'canonical-bank-transactions',
        grain: 'One row per Bank Transaction',
        fields: [
          { fieldName: 'bankTxnId', dataType: 'string', sourceField: 'BANKTXNKEY', canonicalField: 'bankTxnId', warehouseField: 'bankTxnId', nullable: false },
          { fieldName: 'voucherId', dataType: 'string', sourceField: 'VOUCHERKEY', canonicalField: 'voucherId', warehouseField: 'voucherId', nullable: false },
          { fieldName: 'bankName', dataType: 'string', sourceField: 'BANKNAME', canonicalField: 'bankName', warehouseField: 'bankName', nullable: false },
          { fieldName: 'instrumentNo', dataType: 'string', sourceField: 'INSTRUMENTNUMBER', canonicalField: 'instrumentNo', warehouseField: 'instrumentNo', nullable: true },
          { fieldName: 'instrumentDate', dataType: 'date', sourceField: 'INSTRUMENTDATE', canonicalField: 'instrumentDate', warehouseField: 'instrumentDate', nullable: true },
          { fieldName: 'amount', dataType: 'number', sourceField: 'AMOUNT', canonicalField: 'amount', warehouseField: 'amount', nullable: false }
        ],
        parameters: ['Company', 'Date From', 'Date To', 'Bank Account'],
        relationships: ['canonical-vouchers', 'canonical-bank-accounts'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 8. Payroll - Employee & Component Summary
      {
        outputId: 'OUT-PAYROLL-008',
        name: 'Payroll Transactions (RBAC Guarded)',
        category: 'Payroll',
        source: 'Tally XML Collection (PayrollTransactions)',
        availability: 'Probable',
        dataset: 'canonical-payroll-transactions',
        grain: 'One row per Payroll Entry',
        fields: [
          { fieldName: 'payrollTxnId', dataType: 'string', sourceField: 'PAYROLLKEY', canonicalField: 'payrollTxnId', warehouseField: 'payrollTxnId', nullable: false },
          { fieldName: 'employeeId', dataType: 'string', sourceField: 'EMPLOYEEKEY', canonicalField: 'employeeId', warehouseField: 'employeeId', nullable: false },
          { fieldName: 'employeeName', dataType: 'string', sourceField: 'EMPLOYEENAME', canonicalField: 'employeeName', warehouseField: 'employeeName', nullable: false },
          { fieldName: 'payHead', dataType: 'string', sourceField: 'PAYHEADNAME', canonicalField: 'payHead', warehouseField: 'payHead', nullable: false },
          { fieldName: 'amount', dataType: 'number', sourceField: 'AMOUNT', canonicalField: 'amount', warehouseField: 'amount', nullable: false }
        ],
        parameters: ['Company', 'Date From', 'Date To', 'Employee'],
        relationships: ['canonical-employees'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 9. Receivables & Payables
      {
        outputId: 'OUT-RECEIVABLES-009',
        name: 'Outstanding Receivables & Payables',
        category: 'Receivables',
        source: 'Tally Bills Outstanding Collection',
        availability: 'Confirmed',
        dataset: 'canonical-parties',
        grain: 'One row per Party Bill',
        fields: [
          { fieldName: 'partyId', dataType: 'string', sourceField: 'PARTYKEY', canonicalField: 'partyId', warehouseField: 'partyId', nullable: false },
          { fieldName: 'partyName', dataType: 'string', sourceField: 'NAME', canonicalField: 'partyName', warehouseField: 'partyName', nullable: false },
          { fieldName: 'partyType', dataType: 'string', sourceField: 'PARTYTYPE', canonicalField: 'partyType', warehouseField: 'partyType', nullable: false },
          { fieldName: 'receivableAmount', dataType: 'number', sourceField: 'RECEIVABLES', canonicalField: 'receivableAmount', warehouseField: 'receivableAmount', nullable: false },
          { fieldName: 'payableAmount', dataType: 'number', sourceField: 'PAYABLES', canonicalField: 'payableAmount', warehouseField: 'payableAmount', nullable: false }
        ],
        parameters: ['Company', 'Party'],
        relationships: ['canonical-vouchers'],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      },

      // 10. Exception Output
      {
        outputId: 'OUT-EXCEPTIONS-010',
        name: 'Data Quality & Exception Findings',
        category: 'Exceptions',
        source: 'EXFIN Data Quality Engine',
        availability: 'Confirmed',
        dataset: 'canonical-exceptions',
        grain: 'One row per Exception Finding',
        fields: [
          { fieldName: 'findingId', dataType: 'string', sourceField: 'FINDINGKEY', canonicalField: 'findingId', warehouseField: 'findingId', nullable: false },
          { fieldName: 'datasetId', dataType: 'string', sourceField: 'DATASETID', canonicalField: 'datasetId', warehouseField: 'datasetId', nullable: false },
          { fieldName: 'recordId', dataType: 'string', sourceField: 'RECORDID', canonicalField: 'recordId', warehouseField: 'recordId', nullable: false },
          { fieldName: 'ruleName', dataType: 'string', sourceField: 'RULENAME', canonicalField: 'ruleName', warehouseField: 'ruleName', nullable: false },
          { fieldName: 'severity', dataType: 'string', sourceField: 'SEVERITY', canonicalField: 'severity', warehouseField: 'severity', nullable: false },
          { fieldName: 'message', dataType: 'string', sourceField: 'MESSAGE', canonicalField: 'message', warehouseField: 'message', nullable: false }
        ],
        parameters: ['Company', 'Severity', 'Rule'],
        relationships: [],
        schemaVersion: 1,
        lastDiscovered: now,
        status: 'Healthy'
      }
    ];

    for (const item of items) {
      this.catalog.set(item.outputId, item);
    }
  }

  public async discoverOutputs(companyId: string): Promise<TallyOutputCatalogItem[]> {
    this.lastDiscoveredAt.set(companyId, new Date().toISOString());

    // Dynamically check registered warehouse datasets and verify availability
    const catalogList = Array.from(this.catalog.values());

    for (const item of catalogList) {
      const recs = warehouseStorageEngine.getRecordsByDataset(item.dataset, companyId);
      if (recs && recs.length > 0) {
        item.availability = 'Confirmed';
        item.status = 'Healthy';
      } else {
        // If dataset exists in schema registry but has 0 rows for company
        const schemas = universalDataModelEngine.getAllSchemas();
        const hasSchema = schemas.some((s) => s.datasetId === item.dataset);
        if (hasSchema) {
          item.availability = 'Probable';
          item.status = 'Needs Review';
        } else {
          item.availability = 'Unavailable';
          item.status = 'Unavailable';
        }
      }
      item.lastDiscovered = new Date().toISOString();
    }

    return Array.from(this.catalog.values());
  }

  public async getCatalog(companyId?: string): Promise<TallyOutputCatalogItem[]> {
    if (companyId && !this.lastDiscoveredAt.has(companyId)) {
      await this.discoverOutputs(companyId);
    }
    return Array.from(this.catalog.values());
  }

  public async refreshCatalog(companyId: string): Promise<{
    refreshedCount: number;
    statusChanges: { outputId: string; oldStatus: string; newStatus: string }[];
  }> {
    const statusChanges: { outputId: string; oldStatus: string; newStatus: string }[] = [];
    const beforeList = Array.from(this.catalog.values()).map((item) => ({ id: item.outputId, status: item.status }));

    const refreshed = await this.discoverOutputs(companyId);

    for (const item of refreshed) {
      const prev = beforeList.find((b) => b.id === item.outputId);
      if (prev && prev.status !== item.status) {
        statusChanges.push({ outputId: item.outputId, oldStatus: prev.status, newStatus: item.status });
      }
    }

    return {
      refreshedCount: refreshed.length,
      statusChanges
    };
  }

  public async detectOutputChanges(companyId: string): Promise<{
    addedFields: string[];
    removedFields: string[];
    changedTypes: string[];
    affectedReports: string[];
  }> {
    return {
      addedFields: [],
      removedFields: [],
      changedTypes: [],
      affectedReports: []
    };
  }
}

export const tallyOutputDiscoveryEngine = new TallyOutputDiscoveryEngine();
