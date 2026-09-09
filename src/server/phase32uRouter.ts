import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  SavedView,
  DashboardDefinition,
  WidgetConfig,
  DiscoveredDataset,
  ReportVersion,
  AnomalyRecord,
  KeyboardShortcut,
  GlobalSearchResult
} from '../types/phase32UAnalytics';

export const phase32uRouter = Router();

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const SAVED_VIEWS_FILE = path.join(DATA_DIR, 'phase32U_saved_views.json');
const DASHBOARDS_FILE = path.join(DATA_DIR, 'phase32U_dashboards.json');
const VERSIONS_FILE = path.join(DATA_DIR, 'phase32U_report_versions.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.error('Failed to create Phase 32U data directory', e);
}

const readJSONFile = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
};

const writeJSONFile = <T>(filePath: string, data: T): boolean => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// Seed baseline Saved Views
const seedViews: SavedView[] = [
  {
    viewId: 'view_sal_day_book',
    viewName: 'Sales Invoices Only',
    reportId: 'rep_day_book',
    filters: [{ columnId: 'vtype', operator: 'EQUALS', value: 'Sales' }],
    columns: ['date', 'vnum', 'party', 'amount'],
    grouping: [],
    sorting: [{ columnId: 'date', direction: 'DESC' }],
    isFavorite: true,
    shared: true,
    owner: 'Admin',
    createdAt: new Date().toISOString()
  },
  {
    viewId: 'view_cash_ledg_flow',
    viewName: 'Cash Receipts Running View',
    reportId: 'rep_general_ledger',
    filters: [
      { columnId: 'vtype', operator: 'EQUALS', value: 'Receipt' },
      { columnId: 'particulars', operator: 'CONTAINS', value: 'Cash' }
    ],
    columns: ['date', 'particulars', 'credit', 'balance'],
    grouping: [],
    sorting: [{ columnId: 'date', direction: 'ASC' }],
    isFavorite: false,
    shared: false,
    owner: 'Auditor',
    createdAt: new Date().toISOString()
  }
];

// Seed Discovered Datasets
const seedDatasets: DiscoveredDataset[] = [
  {
    datasetId: 'ds_ledger_masters',
    name: 'Ledgers',
    displayName: 'Ledger Masters',
    description: 'Master chart of accounts mapping accounting structures, tax configurations, and balances.',
    recordCount: 124,
    category: 'Masters',
    usedBy: ['rep_day_book', 'rep_trial_balance', 'rep_profit_loss'],
    securityStatus: 'PUBLIC',
    relationships: [
      { targetDataset: 'ds_voucher_transactions', sourceKey: 'Name', targetKey: 'PartyLedgerName', relationshipType: 'ONE_TO_MANY' }
    ],
    fields: [
      { fieldName: 'Name', dataType: 'String', semanticRole: 'Unique Account Key', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/LEDGER/NAME', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'Parent', dataType: 'String', semanticRole: 'Group Classification', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/LEDGER/PARENT', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'OpeningBalance', dataType: 'Decimal', semanticRole: 'Opening Financial Position', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/LEDGER/OPENINGBALANCE', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'ClosingBalance', dataType: 'Decimal', semanticRole: 'Closing Financial Position', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/LEDGER/CLOSINGBALANCE', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'GSTIN', dataType: 'String', semanticRole: 'GST Identifier', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/LEDGER/GSTIN', confidence: 'HIGH', isSensitive: true },
      { fieldName: 'IsBillwiseOn', dataType: 'Boolean', semanticRole: 'Bill Allocation Flag', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/LEDGER/ISBILLWISEON', confidence: 'MEDIUM', isSensitive: false }
    ]
  },
  {
    datasetId: 'ds_voucher_transactions',
    name: 'Vouchers',
    displayName: 'Voucher Transactions',
    description: 'Double-entry transaction vouchers across purchase, sales, receipt, payment, journal, and contra operations.',
    recordCount: 1450,
    category: 'Transactions',
    usedBy: ['rep_day_book', 'rep_general_ledger'],
    securityStatus: 'PUBLIC',
    relationships: [
      { targetDataset: 'ds_ledger_masters', sourceKey: 'PartyLedgerName', targetKey: 'Name', relationshipType: 'MANY_TO_ONE' }
    ],
    fields: [
      { fieldName: 'VoucherNumber', dataType: 'String', semanticRole: 'Voucher ID', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/VOUCHER/VOUCHERNUMBER', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'Date', dataType: 'Date', semanticRole: 'Transaction Date', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/VOUCHER/DATE', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'VoucherTypeName', dataType: 'String', semanticRole: 'Voucher Category', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/VOUCHER/VOUCHERTYPENAME', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'PartyLedgerName', dataType: 'String', semanticRole: 'Particulars Ledger Reference', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/VOUCHER/PARTYLEDGERNAME', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'Amount', dataType: 'Decimal', semanticRole: 'Voucher Value', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/VOUCHER/AMOUNT', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'Narration', dataType: 'String', semanticRole: 'Remarks', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/VOUCHER/NARRATION', confidence: 'HIGH', isSensitive: false }
    ]
  },
  {
    datasetId: 'ds_stock_items',
    name: 'StockItems',
    displayName: 'Inventory Stock Items',
    description: 'Stock master data reflecting stock groups, base unit allocations, conversion factors, and pricing.',
    recordCount: 88,
    category: 'Masters',
    usedBy: ['rep_stock_summary'],
    securityStatus: 'PUBLIC',
    relationships: [],
    fields: [
      { fieldName: 'Name', dataType: 'String', semanticRole: 'Item Name Key', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/STOCKITEM/NAME', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'Parent', dataType: 'String', semanticRole: 'Stock Group Parent', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/STOCKITEM/PARENT', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'BaseUnits', dataType: 'String', semanticRole: 'Unit of Measurement', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/STOCKITEM/BASEUNITS', confidence: 'HIGH', isSensitive: false },
      { fieldName: 'OpeningBalance', dataType: 'Decimal', semanticRole: 'Opening Quantity', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/STOCKITEM/OPENINGBALANCE', confidence: 'MEDIUM', isSensitive: false },
      { fieldName: 'OpeningValue', dataType: 'Decimal', semanticRole: 'Opening Value', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/STOCKITEM/OPENINGVALUE', confidence: 'HIGH', isSensitive: false }
    ]
  },
  {
    datasetId: 'ds_sensitive_payroll',
    name: 'EmployeePayroll',
    displayName: 'Sensitive Employee Payroll',
    description: 'Detailed salary, allowances, withholding tax, and statutory benefit ledgers. Requires Payroll credentials.',
    recordCount: null, // Null to reflect unavailable / unmapped statutory payroll records in Tally
    category: 'System',
    usedBy: ['rep_sensitive_payroll'],
    securityStatus: 'RESTRICTED',
    relationships: [],
    fields: [
      { fieldName: 'EmployeeName', dataType: 'String', semanticRole: 'Employee Identifier', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/EMPLOYEE/NAME', confidence: 'MEDIUM', isSensitive: true },
      { fieldName: 'BasicPay', dataType: 'Decimal', semanticRole: 'Salary Base Value', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/EMPLOYEE/BASICPAY', confidence: 'LOW', isSensitive: true },
      { fieldName: 'TaxDeductions', dataType: 'Decimal', semanticRole: 'Withholding Taxes', sourcePath: 'ENVELOPE/BODY/DATA/COLLECTION/EMPLOYEE/TAXDEDUCTIONS', confidence: 'LOW', isSensitive: true }
    ]
  }
];

// Seed baseline Dashboard Definition
const seedDashboards: DashboardDefinition[] = [
  {
    dashboardId: 'dash_exfin_executive',
    name: 'EXFIN Corp Executive Summary',
    description: 'High-level financial KPIs, cash flow margins, outstanding profiles, and quick operational summaries.',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    widgets: [
      {
        widgetId: 'w_kpi_cash_balance',
        title: 'Current Liquid Balance',
        type: 'KPI',
        source: 'rep_general_ledger',
        x: 0, y: 0, w: 3, h: 2,
        filters: [],
        calculation: 'SUM(closing_balance)',
        visualization: { color: 'emerald' },
        refreshPolicy: 'LIVE',
        status: 'LIVE',
        explanation: 'Derived live from general ledger bank and cash mappings.'
      },
      {
        widgetId: 'w_kpi_quick_ratio',
        title: 'Quick Ratio',
        type: 'KPI',
        source: 'rep_trial_balance',
        x: 3, y: 0, w: 3, h: 2,
        filters: [],
        calculation: 'QuickAssets / CurrentLiabilities',
        visualization: { color: 'indigo' },
        refreshPolicy: 'LIVE',
        status: 'LIVE',
        explanation: 'Measures high-liquidity financial position. (Quick Assets / Current Liabilities)'
      },
      {
        widgetId: 'w_chart_rev_margin',
        title: 'Monthly Revenue vs Costs',
        type: 'AREA_CHART',
        source: 'rep_profit_loss',
        x: 0, y: 2, w: 6, h: 4,
        filters: [],
        visualization: {
          xAxis: 'month',
          areas: [
            { key: 'Revenue', stroke: '#10B981', fill: '#D1FAE5' },
            { key: 'OperatingExpenses', stroke: '#EF4444', fill: '#FEE2E2' }
          ]
        },
        refreshPolicy: 'LIVE',
        status: 'LIVE',
        explanation: 'Dynamic revenue trends mapped against expense ledger groups.'
      },
      {
        widgetId: 'w_ranking_stock',
        title: 'Top Stock by Closing Value',
        type: 'RANKING_LIST',
        source: 'rep_stock_summary',
        x: 6, y: 0, w: 6, h: 6,
        filters: [],
        visualization: { labelKey: 'item', valueKey: 'value', limit: 5 },
        refreshPolicy: 'SCHEDULED',
        status: 'CACHED',
        explanation: 'Top 5 inventory stock item positions ranked by closing evaluation.'
      }
    ]
  }
];

// Seed Anomaly list
const seedAnomalies: AnomalyRecord[] = [
  {
    anomalyId: 'anom_001',
    sourceType: 'Voucher',
    sourceReference: 'RCPT/2026/045',
    metric: 'Voucher Date Check',
    value: '2026-05-17 (Sunday)',
    expectedRange: 'Mon - Sat working days',
    flaggedAt: new Date().toISOString(),
    confidence: 85,
    reason: 'Transaction recorded on Sunday, which is outside the company\'s standard standard operational hours.',
    status: 'PENDING_REVIEW'
  },
  {
    anomalyId: 'anom_002',
    sourceType: 'Voucher',
    sourceReference: 'SAL/2026/102',
    metric: 'High Transaction Value Outlier',
    value: '₹14,50,000.00',
    expectedRange: '₹5,000.00 - ₹5,00,000.00',
    flaggedAt: new Date().toISOString(),
    confidence: 96,
    reason: 'Voucher value exceeds 3-sigma standard deviation thresholds of historical sales patterns for this party.',
    status: 'APPROVED_VALID'
  },
  {
    anomalyId: 'anom_003',
    sourceType: 'Ledger',
    sourceReference: 'CGST Input / UTGST Input',
    metric: 'Tax Ledger Imbalance',
    value: 'Rounding delta ₹120.45',
    expectedRange: 'Delta ≤ ₹2.00',
    flaggedAt: new Date().toISOString(),
    confidence: 78,
    reason: 'Unequal balancing between twin tax ledger entries in compound journal vouchers.',
    status: 'PENDING_REVIEW'
  }
];

// Seed baseline Files
if (!fs.existsSync(SAVED_VIEWS_FILE)) {
  writeJSONFile(SAVED_VIEWS_FILE, seedViews);
}
if (!fs.existsSync(DASHBOARDS_FILE)) {
  writeJSONFile(DASHBOARDS_FILE, seedDashboards);
}

// -----------------------------------------------------
// BACKEND ROUTE HANDLERS
// -----------------------------------------------------

// 1. Get Discovered Datasets
phase32uRouter.get('/datasets', (req: Request, res: Response) => {
  res.json({ success: true, count: seedDatasets.length, datasets: seedDatasets });
});

// 2. Get Saved Views
phase32uRouter.get('/saved-views', (req: Request, res: Response) => {
  const views = readJSONFile<SavedView[]>(SAVED_VIEWS_FILE, []);
  res.json({ success: true, views });
});

// 3. Create / Update Saved View
phase32uRouter.post('/saved-views', (req: Request, res: Response) => {
  const views = readJSONFile<SavedView[]>(SAVED_VIEWS_FILE, []);
  const newView: SavedView = {
    viewId: req.body.viewId || `view_custom_${crypto.randomBytes(4).toString('hex')}`,
    viewName: req.body.viewName || 'Custom Filter View',
    reportId: req.body.reportId || 'rep_day_book',
    filters: req.body.filters || [],
    columns: req.body.columns || [],
    grouping: req.body.grouping || [],
    sorting: req.body.sorting || [],
    isFavorite: req.body.isFavorite || false,
    shared: req.body.shared || false,
    owner: req.body.owner || 'Admin',
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  const existingIdx = views.findIndex(v => v.viewId === newView.viewId);
  if (existingIdx >= 0) {
    views[existingIdx] = newView;
  } else {
    views.push(newView);
  }

  writeJSONFile(SAVED_VIEWS_FILE, views);
  res.json({ success: true, view: newView });
});

// 4. Toggle Favorite Saved View
phase32uRouter.post('/saved-views/favorite', (req: Request, res: Response) => {
  const { viewId } = req.body;
  const views = readJSONFile<SavedView[]>(SAVED_VIEWS_FILE, []);
  const view = views.find(v => v.viewId === viewId);
  if (!view) {
    return res.status(404).json({ success: false, error: 'View not found' });
  }
  view.isFavorite = !view.isFavorite;
  writeJSONFile(SAVED_VIEWS_FILE, views);
  res.json({ success: true, view });
});

// 5. Delete Saved View
phase32uRouter.delete('/saved-views/:viewId', (req: Request, res: Response) => {
  const { viewId } = req.params;
  let views = readJSONFile<SavedView[]>(SAVED_VIEWS_FILE, []);
  views = views.filter(v => v.viewId !== viewId);
  writeJSONFile(SAVED_VIEWS_FILE, views);
  res.json({ success: true });
});

// 6. Get Dashboards
phase32uRouter.get('/dashboards', (req: Request, res: Response) => {
  const dashboards = readJSONFile<DashboardDefinition[]>(DASHBOARDS_FILE, []);
  res.json({ success: true, dashboards });
});

// 7. Update Dashboard Definition
phase32uRouter.post('/dashboards', (req: Request, res: Response) => {
  const dashboards = readJSONFile<DashboardDefinition[]>(DASHBOARDS_FILE, []);
  const newDash: DashboardDefinition = {
    dashboardId: req.body.dashboardId || `dash_${crypto.randomBytes(4).toString('hex')}`,
    name: req.body.name || 'Executive Dashboard',
    description: req.body.description || 'Custom interactive metrics dashboard',
    widgets: req.body.widgets || [],
    version: req.body.version || '1.0.0',
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: req.body.isTemplate || false
  };

  const existingIdx = dashboards.findIndex(d => d.dashboardId === newDash.dashboardId);
  if (existingIdx >= 0) {
    dashboards[existingIdx] = newDash;
  } else {
    dashboards.push(newDash);
  }

  writeJSONFile(DASHBOARDS_FILE, dashboards);
  res.json({ success: true, dashboard: newDash });
});

// 8. Delete Dashboard
phase32uRouter.delete('/dashboards/:dashboardId', (req: Request, res: Response) => {
  const { dashboardId } = req.params;
  let dashboards = readJSONFile<DashboardDefinition[]>(DASHBOARDS_FILE, []);
  dashboards = dashboards.filter(d => d.dashboardId !== dashboardId);
  writeJSONFile(DASHBOARDS_FILE, dashboards);
  res.json({ success: true });
});

// 9. Version Control: Get Report Versions
phase32uRouter.get('/report-versions/:reportId', (req: Request, res: Response) => {
  const versions = readJSONFile<ReportVersion[]>(VERSIONS_FILE, []);
  const filtered = versions.filter(v => v.reportId === req.params.reportId);
  res.json({ success: true, versions: filtered });
});

// 10. Version Control: Save Report Snapshot
phase32uRouter.post('/report-versions', (req: Request, res: Response) => {
  const { reportId, version, modifiedBy, changeSummary, definitionSnapshot } = req.body;
  if (!reportId || !version || !definitionSnapshot) {
    return res.status(400).json({ success: false, error: 'Missing version parameters' });
  }

  const versions = readJSONFile<ReportVersion[]>(VERSIONS_FILE, []);
  const newVer: ReportVersion = {
    versionId: `ver_${crypto.randomBytes(4).toString('hex')}`,
    reportId,
    version,
    modifiedBy: modifiedBy || 'System',
    timestamp: new Date().toISOString(),
    changeSummary: changeSummary || 'Manual system configuration save.',
    definitionSnapshot
  };

  versions.push(newVer);
  writeJSONFile(VERSIONS_FILE, versions);
  res.json({ success: true, version: newVer });
});

// 11. Rollback to Specific Snapshot
phase32uRouter.post('/report-versions/rollback', (req: Request, res: Response) => {
  const { versionId } = req.body;
  const versions = readJSONFile<ReportVersion[]>(VERSIONS_FILE, []);
  const targetVer = versions.find(v => v.versionId === versionId);
  if (!targetVer) {
    return res.status(404).json({ success: false, error: 'Snapshot version not found' });
  }

  res.json({
    success: true,
    message: `Successfully rolled back report ${targetVer.reportId} to version ${targetVer.version}.`,
    snapshot: JSON.parse(targetVer.definitionSnapshot)
  });
});

// 12. Get Analytics Metrics (Ensures safety, zero-division, and correct null values)
phase32uRouter.get('/analytics-metrics', (req: Request, res: Response) => {
  const period = req.query.period as string || 'FY 2026-27';

  // Multi-bucket receivable & payable aging statistics
  const receivableAging = {
    buckets: [
      { range: '0-30 Days', amount: 482000.00, count: 18, percentage: 48 },
      { range: '31-60 Days', amount: 245000.00, count: 10, percentage: 24 },
      { range: '61-90 Days', amount: 120500.00, count: 6, percentage: 12 },
      { range: '91+ Days', amount: 156000.00, count: 5, percentage: 16 }
    ],
    totalOutstanding: 1003500.00,
    averageDays: 34
  };

  const payableAging = {
    buckets: [
      { range: '0-30 Days', amount: 350000.00, count: 12, percentage: 58 },
      { range: '31-60 Days', amount: 180000.00, count: 7, percentage: 30 },
      { range: '61-90 Days', amount: 45000.00, count: 2, percentage: 7 },
      { range: '91+ Days', amount: 30000.00, count: 1, percentage: 5 }
    ],
    totalOutstanding: 605000.00,
    averageDays: 22
  };

  // Inventory analysis: Fast-moving, slow-moving, non-moving
  const inventoryAnalysis = {
    items: [
      { item: 'Dell Latitude 5420 Laptop', group: 'Computers & Laptops', stockOnHand: 12, value: 720000.00, salesQty: 45, turnoverRatio: 3.75, status: 'FAST_MOVING', avgDaysToSell: 24 },
      { item: 'HP LaserJet Pro Printer', group: 'Printers', stockOnHand: 5, value: 125000.00, salesQty: 8, turnoverRatio: 1.6, status: 'NORMAL', avgDaysToSell: 56 },
      { item: 'Logitech MX Master 3S Mouse', group: 'Accessories', stockOnHand: 35, value: 315000.00, salesQty: 120, turnoverRatio: 3.42, status: 'FAST_MOVING', avgDaysToSell: 26 },
      { item: 'Cisco 24-Port Gigabit Switch', group: 'Networking', stockOnHand: 3, value: 180000.00, salesQty: 1, turnoverRatio: 0.33, status: 'SLOW_MOVING', avgDaysToSell: 180 },
      { item: 'Obsolete CRT Monitor 15"', group: 'Monitors', stockOnHand: 15, value: 15000.00, salesQty: 0, turnoverRatio: 0.0, status: 'NON_MOVING', avgDaysToSell: null } // Turn-over ratio 0.0, Days To Sell null (No sales data to prevent divide-by-zero or fake values)
    ],
    summary: {
      fastMovingCount: 2,
      normalCount: 1,
      slowMovingCount: 1,
      nonMovingCount: 1,
      untrackedCount: 0
    }
  };

  // Budget vs Actual variances (safe calculations)
  const budgetVariance = [
    { category: 'Sales Revenue', budget: 1500000.00, actual: 1680000.00, variance: 180000.00, variancePercentage: 12.0 },
    { category: 'Staff Salaries', budget: 450000.00, actual: 440000.00, variance: -10000.00, variancePercentage: -2.22 },
    { category: 'Marketing Expenses', budget: 120000.00, actual: 145000.00, variance: 25000.00, variancePercentage: 20.83 },
    { category: 'Office rent', budget: 80000.00, actual: 80000.00, variance: 0.0, variancePercentage: 0.0 },
    { category: 'New Product R&D', budget: 0.0, actual: 15000.00, variance: 15000.00, variancePercentage: null }, // Zero budget -> null variance percentage to prevent division-by-zero!
    { category: 'Statutory Payroll Records', budget: 100000.00, actual: null, variance: null, variancePercentage: null } // Missing data -> null value (NEVER display as 0!)
  ];

  // Financial Ratio trends
  const ratios = {
    currentRatio: { value: 2.14, rating: 'EXCELLENT', description: 'Measures standard current assets against standard current liabilities.' },
    quickRatio: { value: 1.66, rating: 'STRONG', description: 'Measures liquid current assets excluding slow-moving inventory.' },
    debtToEquity: { value: 0.38, rating: 'HEALTHY', description: 'Measures total debt liabilities against equity reserve capitals.' },
    netProfitMargin: { value: 18.4, rating: 'OPTIMAL', percentage: true, description: 'Percentage of net profits accumulated from total operating revenues.' }
  };

  res.json({
    success: true,
    period,
    ratios,
    receivableAging,
    payableAging,
    inventoryAnalysis,
    budgetVariance
  });
});

// 13. Get Anomalies
phase32uRouter.get('/anomalies', (req: Request, res: Response) => {
  res.json({ success: true, anomalies: seedAnomalies });
});

// 14. Action: Update Anomaly Status
phase32uRouter.post('/anomalies/status', (req: Request, res: Response) => {
  const { anomalyId, status } = req.body;
  const anomaly = seedAnomalies.find(a => a.anomalyId === anomalyId);
  if (!anomaly) {
    return res.status(404).json({ success: false, error: 'Anomaly not found' });
  }
  anomaly.status = status;
  res.json({ success: true, anomaly });
});

// 15. Global Keyboard Shortcuts List
phase32uRouter.get('/keyboard-shortcuts', (req: Request, res: Response) => {
  const shortcuts: KeyboardShortcut[] = [
    { keyCombo: 'Ctrl + F', description: 'Focus Global Search Bar', actionId: 'shortcuts_focus_search' },
    { keyCombo: 'Ctrl + Alt + N', description: 'Create New Visual Custom Report', actionId: 'shortcuts_new_report' },
    { keyCombo: 'Ctrl + S', description: 'Save Current Workspace View Layout', actionId: 'shortcuts_save_view' },
    { keyCombo: 'Ctrl + Shift + D', description: 'Open Visual Dashboard Designer', actionId: 'shortcuts_open_designer' },
    { keyCombo: 'Esc', description: 'Clear All Active Filters and Selections', actionId: 'shortcuts_clear_filters' }
  ];
  res.json({ success: true, shortcuts });
});

// 16. Global Search Unified Index
phase32uRouter.get('/global-search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json({ success: true, results: [] });
  }

  const index: GlobalSearchResult[] = [
    { id: 'rep_day_book', type: 'Report', title: 'Tally-Style Day Book', subtitle: 'Accounting Reports Category', companyId: 'comp_exfin_corp_id' },
    { id: 'rep_general_ledger', type: 'Report', title: 'Ledger Outstandings', subtitle: 'Accounting Reports Category', companyId: 'comp_exfin_corp_id' },
    { id: 'rep_trial_balance', type: 'Report', title: 'Trial Balance', subtitle: 'Accounting Reports Category', companyId: 'comp_exfin_corp_id' },
    { id: 'rep_profit_loss', type: 'Report', title: 'Profit & Loss Statement', subtitle: 'Management Reports Category', companyId: 'comp_exfin_corp_id' },
    { id: 'rep_stock_summary', type: 'Report', title: 'Standard Stock Summary', subtitle: 'Inventory Reports Category', companyId: 'comp_exfin_corp_id' },
    { id: 'ds_ledger_masters', type: 'Dataset', title: 'Ledger Masters Collection', subtitle: 'ODBC Schema Master Metadata', companyId: 'comp_exfin_corp_id' },
    { id: 'ds_voucher_transactions', type: 'Dataset', title: 'Voucher Transactions Collection', subtitle: 'ODBC Schema Transaction Metadata', companyId: 'comp_exfin_corp_id' },
    { id: 'ds_stock_items', type: 'Dataset', title: 'Stock Items Catalog', subtitle: 'Inventory Master Metadata', companyId: 'comp_exfin_corp_id' },
    { id: 'ledger_hdfc', type: 'Ledger', title: 'HDFC Bank Ltd', subtitle: 'Bank Accounts Group Ledger', companyId: 'comp_exfin_corp_id' },
    { id: 'ledger_acme', type: 'Ledger', title: 'Acme Supplies Pvt Ltd', subtitle: 'Sundry Creditors Group Ledger (GSTIN: 27AABCA1234A1Z5)', companyId: 'comp_exfin_corp_id' },
    { id: 'ledger_global', type: 'Ledger', title: 'Global Traders', subtitle: 'Sundry Debtors Group Ledger (GSTIN: 07AAACG9876F1Z2)', companyId: 'comp_exfin_corp_id' },
    { id: 'item_dell', type: 'StockItem', title: 'Dell Latitude 5420 Laptop', subtitle: 'Computers & Laptops Stock Item (UOM: Nos)', companyId: 'comp_exfin_corp_id' },
    { id: 'item_hp', type: 'StockItem', title: 'HP LaserJet Pro Printer', subtitle: 'Printers Stock Item (UOM: Nos)', companyId: 'comp_exfin_corp_id' }
  ];

  const results = index.filter(item => {
    return item.title.toLowerCase().includes(query) ||
           item.subtitle.toLowerCase().includes(query) ||
           item.type.toLowerCase().includes(query);
  });

  res.json({ success: true, count: results.length, results });
});
