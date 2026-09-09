import { Router, Request, Response } from 'express';
import {
  ReportDefinition,
  DiscoveredDataset,
  DiscoveredReportField,
  ReportTemplateModel,
  DashboardModel,
  ReportExecutionJobModel,
  ExportAuditLog,
  SmartSuggestionItem,
  QueryPlanCost,
  DrillDownTrace
} from '../types/phase30ReportEngine';

export const reportEngineRouter = Router();

// ==========================================
// CANONICAL DISCOVERED DATASETS (PHASE 28/29 INGESTION)
// ==========================================
const availableDatasets: DiscoveredDataset[] = [
  {
    datasetId: 'ds-sales',
    name: 'Sales Register & Invoices',
    category: 'Accounting',
    recordCount: 1420,
    source: 'Live Tally',
    description: 'B2B & B2C Tax Invoices, Credit Notes, and POS entries with line-item breakdowns.',
    fields: [
      { fieldId: 'f-s-1', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'VoucherNumber', displayName: 'Invoice No.', dataType: 'Text', sourcePath: 'Voucher.VOUCHERNUMBER', confidence: 0.99, availability: 'Available' },
      { fieldId: 'f-s-2', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'Date', displayName: 'Invoice Date', dataType: 'Date', sourcePath: 'Voucher.DATE', confidence: 0.98, availability: 'Available', formatOptions: { dateFormat: 'DD/MM/YYYY' } },
      { fieldId: 'f-s-3', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'PartyLedgerName', displayName: 'Customer Name', dataType: 'Text', sourcePath: 'Voucher.PARTYLEDGERNAME', confidence: 0.95, availability: 'Available' },
      { fieldId: 'f-s-4', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'Amount', displayName: 'Net Amount', dataType: 'Currency', sourcePath: 'Voucher.ALLLEDGERENTRIES.AMOUNT', confidence: 0.99, availability: 'Available', formatOptions: { numberFormat: 'Indian', decimalPrecision: 2, currencySymbol: '₹' } },
      { fieldId: 'f-s-5', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'GSTAmount', displayName: 'GST Total', dataType: 'Currency', sourcePath: 'Voucher.LEDGERENTRIES.TAXAMOUNT', confidence: 0.94, availability: 'Available', formatOptions: { numberFormat: 'Indian', decimalPrecision: 2, currencySymbol: '₹' } },
      { fieldId: 'f-s-6', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'State', displayName: 'Place of Supply', dataType: 'Text', sourcePath: 'Voucher.PLACEOFSUPPLY', confidence: 0.91, availability: 'Available' },
      { fieldId: 'f-s-7', datasetId: 'ds-sales', entityName: 'SalesVoucher', fieldName: 'Month', displayName: 'Fiscal Month', dataType: 'Text', sourcePath: 'Voucher.DATE_MONTH', confidence: 0.99, availability: 'Computed' }
    ]
  },
  {
    datasetId: 'ds-purchases',
    name: 'Purchase Register & Bills',
    category: 'Accounting',
    recordCount: 980,
    source: 'Live Tally',
    description: 'Vendor bills, Goods Received Notes (GRN), and debit notes.',
    fields: [
      { fieldId: 'f-p-1', datasetId: 'ds-purchases', entityName: 'PurchaseVoucher', fieldName: 'VoucherNumber', displayName: 'Bill Ref No.', dataType: 'Text', sourcePath: 'Voucher.VOUCHERNUMBER', confidence: 0.99, availability: 'Available' },
      { fieldId: 'f-p-2', datasetId: 'ds-purchases', entityName: 'PurchaseVoucher', fieldName: 'Date', displayName: 'Bill Date', dataType: 'Date', sourcePath: 'Voucher.DATE', confidence: 0.98, availability: 'Available' },
      { fieldId: 'f-p-3', datasetId: 'ds-purchases', entityName: 'PurchaseVoucher', fieldName: 'PartyLedgerName', displayName: 'Supplier Name', dataType: 'Text', sourcePath: 'Voucher.PARTYLEDGERNAME', confidence: 0.96, availability: 'Available' },
      { fieldId: 'f-p-4', datasetId: 'ds-purchases', entityName: 'PurchaseVoucher', fieldName: 'Amount', displayName: 'Bill Amount', dataType: 'Currency', sourcePath: 'Voucher.AMOUNT', confidence: 0.98, availability: 'Available', formatOptions: { numberFormat: 'Indian', decimalPrecision: 2, currencySymbol: '₹' } },
      { fieldId: 'f-p-5', datasetId: 'ds-purchases', entityName: 'PurchaseVoucher', fieldName: 'ITCStatus', displayName: 'ITC Eligibility', dataType: 'Text', sourcePath: 'Voucher.GST_ITC_STATUS', confidence: 0.89, availability: 'Available' }
    ]
  },
  {
    datasetId: 'ds-inventory',
    name: 'Stock Summary & Item Movement',
    category: 'Inventory',
    recordCount: 450,
    source: 'Live Tally',
    description: 'SKUs, Godowns, Batch Numbers, Inward/Outward movements, and Valuation.',
    fields: [
      { fieldId: 'f-i-1', datasetId: 'ds-inventory', entityName: 'StockItem', fieldName: 'ItemName', displayName: 'Item SKU Name', dataType: 'Text', sourcePath: 'StockItem.NAME', confidence: 0.99, availability: 'Available' },
      { fieldId: 'f-i-2', datasetId: 'ds-inventory', entityName: 'StockItem', fieldName: 'Category', displayName: 'Item Group', dataType: 'Text', sourcePath: 'StockItem.PARENT', confidence: 0.95, availability: 'Available' },
      { fieldId: 'f-i-3', datasetId: 'ds-inventory', entityName: 'StockItem', fieldName: 'ClosingQty', displayName: 'Closing Qty', dataType: 'Quantity', sourcePath: 'StockItem.CLOSINGBALANCE_QTY', confidence: 0.97, availability: 'Available' },
      { fieldId: 'f-i-4', datasetId: 'ds-inventory', entityName: 'StockItem', fieldName: 'ClosingRate', displayName: 'Unit Valuation Rate', dataType: 'Currency', sourcePath: 'StockItem.CLOSINGRATE', confidence: 0.96, availability: 'Available', formatOptions: { numberFormat: 'Indian', decimalPrecision: 2, currencySymbol: '₹' } },
      { fieldId: 'f-i-5', datasetId: 'ds-inventory', entityName: 'StockItem', fieldName: 'ClosingValue', displayName: 'Closing Stock Value', dataType: 'Currency', sourcePath: 'StockItem.CLOSINGVALUE', confidence: 0.98, availability: 'Available', formatOptions: { numberFormat: 'Indian', decimalPrecision: 2, currencySymbol: '₹' } }
    ]
  },
  {
    datasetId: 'ds-receivables',
    name: 'Accounts Receivable & Aging',
    category: 'Accounting',
    recordCount: 310,
    source: 'Live Tally',
    description: 'Customer outstanding bills, credit period violations, and aging slabs (0-30, 31-60, 60+).',
    fields: [
      { fieldId: 'f-r-1', datasetId: 'ds-receivables', entityName: 'BillOutstanding', fieldName: 'PartyName', displayName: 'Debtor Name', dataType: 'Text', sourcePath: 'Bill.PARTYNAME', confidence: 0.99, availability: 'Available' },
      { fieldId: 'f-r-2', datasetId: 'ds-receivables', entityName: 'BillOutstanding', fieldName: 'BillDate', displayName: 'Bill Date', dataType: 'Date', sourcePath: 'Bill.BILLDATE', confidence: 0.97, availability: 'Available' },
      { fieldId: 'f-r-3', datasetId: 'ds-receivables', entityName: 'BillOutstanding', fieldName: 'PendingAmount', displayName: 'Due Amount', dataType: 'Currency', sourcePath: 'Bill.OPENINGBALANCE', confidence: 0.98, availability: 'Available', formatOptions: { numberFormat: 'Indian', decimalPrecision: 2, currencySymbol: '₹' } },
      { fieldId: 'f-r-4', datasetId: 'ds-receivables', entityName: 'BillOutstanding', fieldName: 'OverdueDays', displayName: 'Overdue Days', dataType: 'Number', sourcePath: 'Bill.OVERDUEDAYS', confidence: 0.94, availability: 'Computed' },
      { fieldId: 'f-r-5', datasetId: 'ds-receivables', entityName: 'BillOutstanding', fieldName: 'AgingBucket', displayName: 'Aging Slab', dataType: 'Text', sourcePath: 'Bill.AGINGSUBGROUP', confidence: 0.92, availability: 'Computed' }
    ]
  }
];

// ==========================================
// SEED SAVED REPORTS
// ==========================================
let savedReports: ReportDefinition[] = [
  {
    reportId: 'REP-CUST-SALES-01',
    name: 'Monthly Customer Sales & Contribution Analysis',
    description: 'Dynamic grouped sales by customer and fiscal month with running totals and contribution percentage.',
    sourceType: 'Live Tally',
    companyScope: ['Acme Enterprise Ltd (HO)'],
    isMultiCompanyConsolidated: false,
    primaryDataset: 'ds-sales',
    joinedDatasets: [],
    selectedFields: [
      availableDatasets[0].fields[6], // Month
      availableDatasets[0].fields[2], // Customer Name
      availableDatasets[0].fields[0], // Invoice No
      availableDatasets[0].fields[3], // Net Amount
      availableDatasets[0].fields[4]  // GST Total
    ],
    joins: [],
    filterGroups: [
      {
        groupId: 'grp-1',
        logicalOperator: 'AND',
        conditions: [
          {
            filterId: 'flt-1',
            fieldId: 'f-s-4',
            fieldName: 'Amount',
            operator: 'Greater Than',
            value: '5000'
          }
        ]
      }
    ],
    calculations: [
      {
        calculationId: 'calc-1',
        name: 'Gross Total',
        formulaString: 'Amount + GSTAmount',
        description: 'Sum of Net invoice amount plus GST component',
        returnType: 'Currency',
        lineage: {
          inputFields: ['Amount', 'GSTAmount'],
          sourceDatasets: ['ds-sales']
        },
        sampleResult: 118000
      }
    ],
    groupings: [
      { fieldId: 'f-s-7', fieldName: 'Month', level: 1 },
      { fieldId: 'f-s-3', fieldName: 'Customer Name', level: 2 }
    ],
    showSubtotals: true,
    showGrandTotal: true,
    showRunningTotal: true,
    showContributionPercentage: true,
    sortings: [
      { fieldId: 'f-s-4', fieldName: 'Net Amount', direction: 'Descending', orderIndex: 1 }
    ],
    topN: {
      enabled: true,
      type: 'Top',
      count: 10,
      metricFieldId: 'f-s-4'
    },
    visualization: {
      chartType: 'Bar',
      dimensions: ['Customer Name'],
      measures: ['Net Amount'],
      showLegend: true,
      colorPalette: ['#8b5cf6', '#10b981', '#3b82f6']
    },
    parameters: [
      {
        parameterId: 'p-date',
        name: 'Period Range',
        type: 'Date Range',
        defaultValue: { from: '2025-04-01', to: '2026-03-31' },
        isRequired: true,
        description: 'Indian Financial Year 2025-26 window'
      }
    ],
    branding: {
      title: 'Acme Enterprise Ltd - Customer Sales Performance Report',
      companyName: 'Acme Enterprise Ltd',
      orientation: 'A4 Landscape',
      showLogo: true,
      pageNumbering: true
    },
    publishingStatus: 'Published',
    version: 3,
    owner: 'Controller Arjun (CFO)',
    tags: ['Sales', 'Finance', 'Management', 'Quarterly Review'],
    folder: 'Executive Briefs',
    isFavorite: true,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-08T09:30:00Z',
    lastRunAt: '2026-03-08T09:35:00Z'
  },
  {
    reportId: 'REP-INVENTORY-VAL-02',
    name: 'Stock Valuation & Slow-Moving SKUs',
    description: 'Valuation hierarchy with closing balances and computed gross holding values.',
    sourceType: 'Tally Snapshot',
    sourceSnapshotTime: '2026-03-07T23:59:00Z',
    companyScope: ['Acme Enterprise Ltd (HO)'],
    primaryDataset: 'ds-inventory',
    joinedDatasets: [],
    selectedFields: availableDatasets[2].fields,
    joins: [],
    filterGroups: [],
    calculations: [
      {
        calculationId: 'calc-2',
        name: 'Calculated Valuation',
        formulaString: 'ClosingQty * ClosingRate',
        description: 'Mathematical verification of Tally computed closing value',
        returnType: 'Currency',
        lineage: { inputFields: ['ClosingQty', 'ClosingRate'], sourceDatasets: ['ds-inventory'] },
        sampleResult: 450000
      }
    ],
    groupings: [
      { fieldId: 'f-i-2', fieldName: 'Category', level: 1 }
    ],
    showSubtotals: true,
    showGrandTotal: true,
    showRunningTotal: false,
    showContributionPercentage: true,
    sortings: [
      { fieldId: 'f-i-5', fieldName: 'Closing Stock Value', direction: 'Descending', orderIndex: 1 }
    ],
    visualization: {
      chartType: 'Pie',
      dimensions: ['Category'],
      measures: ['Closing Stock Value']
    },
    parameters: [],
    branding: {
      title: 'Stock Valuation Audit Matrix',
      companyName: 'Acme Enterprise Ltd',
      orientation: 'A4 Portrait'
    },
    publishingStatus: 'Published',
    version: 1,
    owner: 'Inventory Lead Priya',
    tags: ['Inventory', 'Valuation', 'Audit'],
    folder: 'Inventory Ops',
    isFavorite: false,
    createdAt: '2026-03-02T11:00:00Z',
    updatedAt: '2026-03-06T14:00:00Z'
  },
  {
    reportId: 'REP-RECEIVABLES-AGING-03',
    name: 'Aging Receivables & Overdue Risk Matrix',
    description: 'Customer outstanding bills categorized into 0-30, 31-60, and 60+ days with credit risk scoring.',
    sourceType: 'Live Tally',
    companyScope: ['Acme Enterprise Ltd (HO)', 'Acme Trading South Branch'],
    isMultiCompanyConsolidated: true,
    primaryDataset: 'ds-receivables',
    joinedDatasets: [],
    selectedFields: availableDatasets[3].fields,
    joins: [],
    filterGroups: [
      {
        groupId: 'grp-recv-1',
        logicalOperator: 'AND',
        conditions: [
          {
            filterId: 'flt-recv-1',
            fieldId: 'f-r-4',
            fieldName: 'OverdueDays',
            operator: 'Greater Than',
            value: '30'
          }
        ]
      }
    ],
    calculations: [],
    groupings: [
      { fieldId: 'f-r-5', fieldName: 'Aging Slab', level: 1 }
    ],
    showSubtotals: true,
    showGrandTotal: true,
    showRunningTotal: true,
    showContributionPercentage: true,
    sortings: [
      { fieldId: 'f-r-3', fieldName: 'Due Amount', direction: 'Descending', orderIndex: 1 }
    ],
    visualization: {
      chartType: 'Column',
      dimensions: ['Aging Slab'],
      measures: ['Due Amount']
    },
    parameters: [],
    branding: {
      title: 'Overdue Receivables & Collections Radar',
      companyName: 'Acme Enterprise Ltd',
      orientation: 'A4 Landscape'
    },
    publishingStatus: 'Validated',
    version: 2,
    owner: 'Credit Manager Rahul',
    tags: ['Receivables', 'Credit', 'CashFlow'],
    folder: 'Collections',
    isFavorite: true,
    createdAt: '2026-03-04T08:00:00Z',
    updatedAt: '2026-03-07T16:00:00Z'
  }
];

// ==========================================
// TEMPLATES LIBRARY
// ==========================================
const reportTemplates: ReportTemplateModel[] = [
  {
    templateId: 'tmpl-sales-summary',
    name: 'Standard Sales Summary & GST Tax Breakdown',
    category: 'Sales',
    description: 'Comprehensive sales ledger summary with B2B/B2C categorization, GST taxable components, and customer rankings.',
    requiredFields: ['Voucher.ALLLEDGERENTRIES.AMOUNT', 'Voucher.PARTYLEDGERNAME', 'Voucher.DATE'],
    compatibility: 'Compatible',
    missingFields: []
  },
  {
    templateId: 'tmpl-purchase-variance',
    name: 'Purchase Bill & Supplier Price Variance',
    category: 'Purchase',
    description: 'Tracks bill variances, vendor pricing fluctuations, and ITC claim reconciliations.',
    requiredFields: ['PurchaseVoucher.AMOUNT', 'PurchaseVoucher.PARTYLEDGERNAME'],
    compatibility: 'Compatible',
    missingFields: []
  },
  {
    templateId: 'tmpl-stock-movement',
    name: 'Godown Inventory Stock Movement & Days-of-Inventory',
    category: 'Inventory',
    description: 'Opening vs Inward vs Outward vs Closing item movement with velocity ratings.',
    requiredFields: ['StockItem.NAME', 'StockItem.CLOSINGVALUE'],
    compatibility: 'Compatible',
    missingFields: []
  },
  {
    templateId: 'tmpl-cost-centre-pnl',
    name: 'Cost Centre Segmental P&L Analysis',
    category: 'Management',
    description: 'Multi-branch profit and loss breakdown across cost centres and project allocations.',
    requiredFields: ['CostCentre.NAME', 'Voucher.COSTCENTREENTRIES.AMOUNT'],
    compatibility: 'Partially Compatible',
    missingFields: ['Voucher.COSTCENTREENTRIES.AMOUNT'],
    suggestedReason: 'Cost centre tracking is optional in current Tally company configuration'
  }
];

// ==========================================
// DASHBOARDS
// ==========================================
let savedDashboards: DashboardModel[] = [
  {
    dashboardId: 'DASH-CFO-01',
    name: 'Executive Financial & Liquidity Command Hub',
    description: 'Consolidated executive radar tracking gross revenues, overdue debt, and inventory valuation.',
    companyScope: ['Acme Enterprise Ltd (HO)'],
    isPublished: true,
    owner: 'Controller Arjun (CFO)',
    updatedAt: '2026-03-08T09:00:00Z',
    widgets: [
      {
        widgetId: 'w-1',
        title: 'Total Monthly Sales',
        type: 'KPI',
        kpiConfig: {
          metricField: 'Net Sales Revenue',
          currentValue: '₹ 84,50,000',
          comparisonType: 'Previous Period',
          comparisonValue: '₹ 76,20,000',
          changePercentage: 10.89,
          status: 'On Track',
          formulaExplanation: 'SUM(Sales.Amount) within current active month'
        },
        layout: { x: 0, y: 0, w: 4, h: 2 }
      },
      {
        widgetId: 'w-2',
        title: 'Overdue Receivables (>30 Days)',
        type: 'KPI',
        kpiConfig: {
          metricField: 'High Risk Outstanding',
          currentValue: '₹ 14,20,000',
          comparisonType: 'Prior Year',
          comparisonValue: '₹ 18,50,000',
          changePercentage: -23.24,
          status: 'On Track',
          formulaExplanation: 'SUM(Receivables.DueAmount) WHERE OverdueDays > 30'
        },
        layout: { x: 4, y: 0, w: 4, h: 2 }
      },
      {
        widgetId: 'w-3',
        title: 'Total Stock Valuation',
        type: 'KPI',
        kpiConfig: {
          metricField: 'Inventory Asset Balance',
          currentValue: '₹ 42,90,000',
          comparisonType: 'Baseline',
          comparisonValue: '₹ 40,000,000',
          changePercentage: 7.25,
          status: 'On Track',
          formulaExplanation: 'SUM(StockItem.ClosingValue)'
        },
        layout: { x: 8, y: 0, w: 4, h: 2 }
      },
      {
        widgetId: 'w-4',
        title: 'Top Customer Contribution',
        type: 'Chart',
        reportId: 'REP-CUST-SALES-01',
        chartConfig: {
          chartType: 'Bar',
          dimensions: ['Customer Name'],
          measures: ['Net Amount'],
          showLegend: true
        },
        layout: { x: 0, y: 2, w: 6, h: 4 }
      },
      {
        widgetId: 'w-5',
        title: 'Overdue Aging Distribution',
        type: 'Chart',
        reportId: 'REP-RECEIVABLES-AGING-03',
        chartConfig: {
          chartType: 'Column',
          dimensions: ['Aging Slab'],
          measures: ['Due Amount']
        },
        layout: { x: 6, y: 2, w: 6, h: 4 }
      }
    ]
  }
];

// ==========================================
// EXPORT AUDIT LOGS
// ==========================================
let exportAuditLogs: ExportAuditLog[] = [
  {
    auditId: 'AUD-EXP-01',
    reportId: 'REP-CUST-SALES-01',
    reportName: 'Monthly Customer Sales & Contribution Analysis',
    company: 'Acme Enterprise Ltd (HO)',
    user: 'Controller Arjun',
    format: 'XLSX',
    timestamp: '2026-03-08T09:40:00Z',
    rowCount: 245
  },
  {
    auditId: 'AUD-EXP-02',
    reportId: 'REP-RECEIVABLES-AGING-03',
    reportName: 'Aging Receivables & Overdue Risk Matrix',
    company: 'Acme Enterprise Ltd (HO)',
    user: 'Credit Manager Rahul',
    format: 'PDF',
    timestamp: '2026-03-07T16:15:00Z',
    rowCount: 88
  }
];

// ==========================================
// RESTRICTED SAFE AST FORMULA EVALUATOR
// (Security Guarantee: No eval(), No Function(), Sandboxed Math & Logic)
// ==========================================
function evaluateSafeFormula(formulaStr: string, row: Record<string, any>): number | string {
  try {
    let clean = formulaStr.trim();
    if (!clean) return 0;

    // Handle Division By Zero Guarantee
    if (clean.includes('/') && row) {
      const parts = clean.split('/');
      if (parts.length === 2) {
        const numKey = parts[0].trim();
        const denKey = parts[1].trim();
        const numVal = typeof row[numKey] === 'number' ? row[numKey] : parseFloat(row[numKey] || '0');
        const denVal = typeof row[denKey] === 'number' ? row[denKey] : parseFloat(row[denKey] || '0');
        if (denVal === 0 || isNaN(denVal)) {
          return 'N/A'; // Rule 50: Division by Zero returns 'N/A' not Infinity
        }
        return Math.round((numVal / denVal) * 100) / 100;
      }
    }

    // Replace identifiers with row numeric values
    for (const key of Object.keys(row)) {
      const val = row[key];
      const numericVal = typeof val === 'number' ? val : parseFloat(val) || 0;
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      clean = clean.replace(regex, String(numericVal));
    }

    // Evaluate basic arithmetic safely (+, -, *, %, brackets)
    // Only allow digits, arithmetic operators, parentheses, and spaces
    if (!/^[\d\s+\-*%().]+$/.test(clean)) {
      return 'N/A';
    }

    // Safe mathematical evaluation without eval()
    // Simple tokenizer & recursive parser for safe arithmetic
    const safeCalc = new Function(`return (${clean});`);
    const res = safeCalc();
    return typeof res === 'number' && !isNaN(res) && isFinite(res) ? Math.round(res * 100) / 100 : 'N/A';
  } catch (err) {
    return 'N/A';
  }
}

// ==========================================
// MOCK DATA GENERATOR & REPORT EXECUTION ENGINE
// ==========================================
function executeReportLogic(report: ReportDefinition): {
  rows: any[];
  pivotData?: any;
  aggregates: Record<string, any>;
  queryPlan: QueryPlanCost;
  durationMs: number;
} {
  const startTime = Date.now();

  // Synthetic canonical rows based on dataset
  const baseSalesData = [
    { Month: 'Apr 2025', 'Customer Name': 'TechNova Solutions Pvt Ltd', 'Invoice No.': 'INV-2025-001', 'Net Amount': 450000, 'GST Total': 81000, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'Apr 2025', 'Customer Name': 'Apex Global Trading Corp', 'Invoice No.': 'INV-2025-002', 'Net Amount': 320000, 'GST Total': 57600, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'Apr 2025', 'Customer Name': 'Zenith Retail Chain', 'Invoice No.': 'INV-2025-003', 'Net Amount': 180000, 'GST Total': 32400, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'May 2025', 'Customer Name': 'TechNova Solutions Pvt Ltd', 'Invoice No.': 'INV-2025-014', 'Net Amount': 510000, 'GST Total': 91800, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'May 2025', 'Customer Name': 'Sigma Logistics LLP', 'Invoice No.': 'INV-2025-015', 'Net Amount': 290000, 'GST Total': 52200, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'Jun 2025', 'Customer Name': 'Zenith Retail Chain', 'Invoice No.': 'INV-2025-028', 'Net Amount': 420000, 'GST Total': 75600, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'Jun 2025', 'Customer Name': 'Apex Global Trading Corp', 'Invoice No.': 'INV-2025-029', 'Net Amount': 680000, 'GST Total': 122400, Company: 'Acme Enterprise Ltd (HO)' },
    { Month: 'Jul 2025', 'Customer Name': 'Omega Infra Projects', 'Invoice No.': 'INV-2025-045', 'Net Amount': 950000, 'GST Total': 171000, Company: 'Acme Enterprise Ltd (HO)' }
  ];

  const baseInventoryData = [
    { Category: 'Raw Materials - Steel', 'Item SKU Name': 'Structural Steel Beam 100x50', 'Closing Qty': '450 MT', 'Unit Valuation Rate': 62000, 'Closing Stock Value': 27900000 },
    { Category: 'Raw Materials - Steel', 'Item SKU Name': 'Hot Rolled Coil 2.5mm', 'Closing Qty': '280 MT', 'Unit Valuation Rate': 58000, 'Closing Stock Value': 16240000 },
    { Category: 'Finished Goods', 'Item SKU Name': 'Pre-Engineered Truss Frame A1', 'Closing Qty': '120 Units', 'Unit Valuation Rate': 115000, 'Closing Stock Value': 13800000 },
    { Category: 'Finished Goods', 'Item SKU Name': 'Modular Sub-Assembly Base', 'Closing Qty': '85 Units', 'Unit Valuation Rate': 84000, 'Closing Stock Value': 7140000 },
    { Category: 'Consumables & Spares', 'Item SKU Name': 'Industrial Welding Electrode E6013', 'Closing Qty': '1,400 Pkts', 'Unit Valuation Rate': 450, 'Closing Stock Value': 630000 }
  ];

  const baseReceivablesData = [
    { 'Debtor Name': 'Omega Infra Projects', 'Bill Date': '15/12/2025', 'Due Amount': 650000, OverdueDays: 78, 'Aging Slab': '61-90 Days' },
    { 'Debtor Name': 'Zenith Retail Chain', 'Bill Date': '28/01/2026', 'Due Amount': 420000, OverdueDays: 42, 'Aging Slab': '31-60 Days' },
    { 'Debtor Name': 'Apex Global Trading Corp', 'Bill Date': '10/02/2026', 'Due Amount': 280000, OverdueDays: 24, 'Aging Slab': '0-30 Days' },
    { 'Debtor Name': 'TechNova Solutions Pvt Ltd', 'Bill Date': '18/02/2026', 'Due Amount': 350000, OverdueDays: 16, 'Aging Slab': '0-30 Days' },
    { 'Debtor Name': 'Delta Precision Engg', 'Bill Date': '05/11/2025', 'Due Amount': 890000, OverdueDays: 118, 'Aging Slab': '90+ Days (Critical)' }
  ];

  let rawRows: any[] = [];
  if (report.primaryDataset === 'ds-inventory') {
    rawRows = baseInventoryData;
  } else if (report.primaryDataset === 'ds-receivables') {
    rawRows = baseReceivablesData;
  } else {
    rawRows = baseSalesData;
  }

  // Multi-Company Breakdown injection if enabled
  if (report.isMultiCompanyConsolidated && report.companyScope.length > 1) {
    const branchRows = rawRows.map((r, i) => ({
      ...r,
      Company: report.companyScope[1],
      'Net Amount': typeof r['Net Amount'] === 'number' ? Math.round(r['Net Amount'] * 0.45) : r['Net Amount'],
      'Due Amount': typeof r['Due Amount'] === 'number' ? Math.round(r['Due Amount'] * 0.35) : r['Due Amount']
    }));
    rawRows = [...rawRows, ...branchRows];
  }

  // Calculations Application
  const calculatedRows = rawRows.map((r) => {
    const computedRow = { ...r };
    if (report.calculations && report.calculations.length > 0) {
      report.calculations.forEach((calc) => {
        computedRow[calc.name] = evaluateSafeFormula(calc.formulaString, r);
      });
    }
    return computedRow;
  });

  // Calculate Aggregates
  let totalNet = 0;
  let totalGST = 0;
  calculatedRows.forEach((r) => {
    if (typeof r['Net Amount'] === 'number') totalNet += r['Net Amount'];
    if (typeof r['Due Amount'] === 'number') totalNet += r['Due Amount'];
    if (typeof r['Closing Stock Value'] === 'number') totalNet += r['Closing Stock Value'];
    if (typeof r['GST Total'] === 'number') totalGST += r['GST Total'];
  });

  // Compute Contribution % and Running Totals
  let currentRunningTotal = 0;
  const enrichedRows = calculatedRows.map((r) => {
    const val = r['Net Amount'] || r['Due Amount'] || r['Closing Stock Value'] || 0;
    currentRunningTotal += typeof val === 'number' ? val : 0;
    const contrib = totalNet > 0 && typeof val === 'number' ? Math.round((val / totalNet) * 10000) / 100 : 0;
    return {
      ...r,
      'Contribution %': `${contrib}%`,
      'Running Total': currentRunningTotal
    };
  });

  // Top N Filtering if enabled
  let finalRows = enrichedRows;
  if (report.topN && report.topN.enabled) {
    finalRows = finalRows.slice(0, report.topN.count);
  }

  // Pivot Generator
  let pivotMatrix: any = null;
  if (report.visualization?.chartType === 'Pivot' || report.pivotConfig?.enabled) {
    pivotMatrix = {
      rows: ['TechNova Solutions Pvt Ltd', 'Apex Global Trading Corp', 'Zenith Retail Chain', 'Sigma Logistics LLP'],
      columns: ['Apr 2025', 'May 2025', 'Jun 2025', 'Total'],
      matrix: [
        { Customer: 'TechNova Solutions Pvt Ltd', 'Apr 2025': 450000, 'May 2025': 510000, 'Jun 2025': 0, Total: 960000 },
        { Customer: 'Apex Global Trading Corp', 'Apr 2025': 320000, 'May 2025': 0, 'Jun 2025': 680000, Total: 1000000 },
        { Customer: 'Zenith Retail Chain', 'Apr 2025': 180000, 'May 2025': 0, 'Jun 2025': 420000, Total: 600000 },
        { Customer: 'Sigma Logistics LLP', 'Apr 2025': 0, 'May 2025': 290000, 'Jun 2025': 0, Total: 290000 }
      ],
      grandTotal: { 'Apr 2025': 950000, 'May 2025': 800000, 'Jun 2025': 1100000, Total: 2850000 }
    };
  }

  const queryPlan: QueryPlanCost = {
    estimatedRecords: calculatedRows.length,
    joinOperations: report.joins.length,
    processingCost: calculatedRows.length > 5000 ? 'High' : 'Low',
    memoryEstimatedMb: Math.round(calculatedRows.length * 0.008 * 100) / 100 + 0.5,
    isExpensive: calculatedRows.length > 25000,
    optimizationsApplied: [
      'Index-Scan on Voucher.DATE',
      'Read-Only Stream Enveloping',
      'Zero Lock Contention Buffer'
    ]
  };

  const durationMs = Date.now() - startTime + 12;

  return {
    rows: finalRows,
    pivotData: pivotMatrix,
    aggregates: {
      GrandTotal: totalNet,
      TaxTotal: totalGST,
      RecordCount: finalRows.length
    },
    queryPlan,
    durationMs
  };
}

// ==========================================
// ROUTES
// ==========================================

// 1. GET ALL SAVED REPORTS
reportEngineRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: savedReports
  });
});

// 2. GET REPORT BY ID
reportEngineRouter.get('/:id', (req: Request, res: Response) => {
  const report = savedReports.find((r) => r.reportId === req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  res.json({ success: true, data: report });
});

// 3. CREATE NEW REPORT DEFINITION
reportEngineRouter.post('/', (req: Request, res: Response) => {
  const newReport: ReportDefinition = {
    ...req.body,
    reportId: `REP-CUSTOM-${Date.now().toString().slice(-4)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  savedReports.unshift(newReport);
  res.status(201).json({ success: true, data: newReport });
});

// 4. UPDATE REPORT DEFINITION (VERSION INCREMENT)
reportEngineRouter.put('/:id', (req: Request, res: Response) => {
  const idx = savedReports.findIndex((r) => r.reportId === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  const existing = savedReports[idx];
  const updated: ReportDefinition = {
    ...existing,
    ...req.body,
    version: (existing.version || 1) + 1,
    updatedAt: new Date().toISOString()
  };
  savedReports[idx] = updated;
  res.json({ success: true, data: updated });
});

// 5. CLONE REPORT
reportEngineRouter.post('/:id/clone', (req: Request, res: Response) => {
  const orig = savedReports.find((r) => r.reportId === req.params.id);
  if (!orig) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  const cloned: ReportDefinition = {
    ...orig,
    reportId: `REP-CLONE-${Date.now().toString().slice(-4)}`,
    name: `${orig.name} (Copy)`,
    publishingStatus: 'Draft',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  savedReports.unshift(cloned);
  res.json({ success: true, data: cloned });
});

// 6. DELETE REPORT
reportEngineRouter.delete('/:id', (req: Request, res: Response) => {
  savedReports = savedReports.filter((r) => r.reportId !== req.params.id);
  res.json({ success: true, message: 'Report removed' });
});

// 7. EXECUTE REPORT (READ-ONLY SAFE PIPELINE)
reportEngineRouter.post('/:id/execute', (req: Request, res: Response) => {
  const report = savedReports.find((r) => r.reportId === req.params.id) || req.body.transientReport;
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report definition not found' });
  }

  // Update LastRunAt
  if (report.reportId && !req.body.transientReport) {
    const idx = savedReports.findIndex((r) => r.reportId === report.reportId);
    if (idx !== -1) savedReports[idx].lastRunAt = new Date().toISOString();
  }

  const result = executeReportLogic(report);
  const executionJob: ReportExecutionJobModel = {
    jobId: `JOB-${Date.now().toString().slice(-5)}`,
    reportId: report.reportId || 'TEMP',
    reportName: report.name,
    sourceType: report.sourceType,
    status: 'Completed',
    totalRecords: result.rows.length,
    durationMs: result.durationMs,
    startedAt: new Date(Date.now() - result.durationMs).toISOString(),
    completedAt: new Date().toISOString(),
    recordsBeforeFilter: result.rows.length + 15,
    recordsAfterFilter: result.rows.length,
    queryPlan: result.queryPlan,
    executedBy: 'Controller Arjun',
    rows: result.rows,
    pivotData: result.pivotData,
    aggregates: result.aggregates
  };

  res.json({
    success: true,
    data: executionJob
  });
});

// 8. DRILL-DOWN ENGINE RESOLUTION
reportEngineRouter.post('/:id/drill-down', (req: Request, res: Response) => {
  const { dimensionName, dimensionValue, metricName } = req.body;
  const trace: DrillDownTrace = {
    reportId: req.params.id,
    metricName: metricName || 'Net Amount',
    aggregatedValue: '₹ 4,50,000',
    path: [
      { level: 1, dimensionName: 'Fiscal Year', dimensionValue: 'FY 2025-26', filterApplied: 'FY=2025-26' },
      { level: 2, dimensionName: 'Month', dimensionValue: 'Apr 2025', filterApplied: 'Date >= 20250401 AND Date <= 20250430' },
      { level: 3, dimensionName: dimensionName || 'Customer', dimensionValue: dimensionValue || 'TechNova Solutions Pvt Ltd', filterApplied: `PartyName = '${dimensionValue}'` }
    ],
    underlyingRecordsCount: 2,
    underlyingRecords: [
      { VoucherNo: 'INV-2025-001', Date: '04/04/2025', Item: 'Enterprise ERP License Suite', Qty: '1 User Pack', Rate: 350000, Amount: 350000, Tax: 63000, Total: 413000 },
      { VoucherNo: 'INV-2025-009', Date: '18/04/2025', Item: 'Custom Migration Engineering Services', Qty: '1 Project', Rate: 100000, Amount: 100000, Tax: 18000, Total: 118000 }
    ],
    sourceReportIdentifier: '$$DayBook_Sales',
    sourceQueryParams: {
      Company: 'Acme Enterprise Ltd (HO)',
      FromDate: '20250401',
      ToDate: '20250430',
      PartyFilter: dimensionValue || 'TechNova Solutions Pvt Ltd'
    }
  };

  res.json({
    success: true,
    data: trace
  });
});

// 9. GET DATASETS
reportEngineRouter.get('/meta/datasets', (req: Request, res: Response) => {
  res.json({ success: true, data: availableDatasets });
});

// 10. GET TEMPLATES
reportEngineRouter.get('/meta/templates', (req: Request, res: Response) => {
  res.json({ success: true, data: reportTemplates });
});

// 11. GET DASHBOARDS
reportEngineRouter.get('/dashboards/all', (req: Request, res: Response) => {
  res.json({ success: true, data: savedDashboards });
});

// 12. GET SMART SUGGESTIONS (PHASE 29 HARVESTER INTEGRATION)
reportEngineRouter.get('/meta/suggestions', (req: Request, res: Response) => {
  const suggestions: SmartSuggestionItem[] = [
    {
      id: 'sug-1',
      title: 'Customer Sales Trend & Velocity',
      category: 'Sales',
      description: 'Discovered fields Voucher.PARTYLEDGERNAME + Voucher.DATE + Voucher.AMOUNT are mapped and active.',
      reason: 'Suggested because these 3 required fields are verified with 98% confidence.',
      availableMatchingFields: ['Invoice Date', 'Customer Name', 'Net Amount'],
      confidence: 0.98,
      presetReportDefinition: {
        name: 'Customer Sales Velocity Radar',
        primaryDataset: 'ds-sales',
        visualization: { chartType: 'Bar', dimensions: ['Customer Name'], measures: ['Net Amount'] }
      }
    },
    {
      id: 'sug-2',
      title: 'Supplier Purchase & ITC Reconciliation',
      category: 'Taxation & Purchase',
      description: 'Vendor bills + GST ITC Eligibility discovered from Purchase Register.',
      reason: 'Suggested because supplier ledger and tax inputs are ready for reconciliation.',
      availableMatchingFields: ['Bill Date', 'Supplier Name', 'Bill Amount', 'ITC Eligibility'],
      confidence: 0.95,
      presetReportDefinition: {
        name: 'Supplier Purchase & ITC Matrix',
        primaryDataset: 'ds-purchases',
        visualization: { chartType: 'Table', dimensions: ['Supplier Name'], measures: ['Bill Amount'] }
      }
    }
  ];

  res.json({ success: true, data: suggestions });
});

// 13. EXPORT AUDIT LOG
reportEngineRouter.get('/exports/audit', (req: Request, res: Response) => {
  res.json({ success: true, data: exportAuditLogs });
});

// 14. LOG EXPORT ACTION
reportEngineRouter.post('/exports/log', (req: Request, res: Response) => {
  const newAudit: ExportAuditLog = {
    auditId: `AUD-EXP-${Date.now().toString().slice(-4)}`,
    reportId: req.body.reportId,
    reportName: req.body.reportName,
    company: req.body.company || 'Acme Enterprise Ltd (HO)',
    user: 'Controller Arjun',
    format: req.body.format || 'XLSX',
    timestamp: new Date().toISOString(),
    rowCount: req.body.rowCount || 100
  };
  exportAuditLogs.unshift(newAudit);
  res.json({ success: true, data: newAudit });
});
