export type AccountingPeriodType =
  | 'CurrentFinancialYear'
  | 'PreviousFinancialYear'
  | 'CurrentMonth'
  | 'PreviousMonth'
  | 'CurrentQuarter'
  | 'PreviousQuarter'
  | 'Custom';

export interface AccountingPeriod {
  periodType: AccountingPeriodType;
  startDate: string;
  endDate: string;
  label: string;
  financialYear: string;
}

export type DataAvailabilityStatus = 'Available' | 'PartiallyAvailable' | 'Unavailable';
export type DataSourceType = 'Live' | 'Cached' | 'Imported' | 'Calculated';
export type RuleSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReconciliationMatchStatus =
  | 'Matched'
  | 'Partially Matched'
  | 'Mismatch'
  | 'Missing in Tally'
  | 'Missing in External Data'
  | 'Needs Review';

export interface ExecutiveKpi {
  id: string;
  title: string;
  numericValue: number | null;
  formattedValue: string;
  unit: string;
  changePercentage: number | null;
  periodLabel: string;
  sourceDescription: string;
  calculationFormula: string;
  availability: DataAvailabilityStatus;
  dataSource: DataSourceType;
  statusBadge: 'Optimal' | 'Warning' | 'Alert' | 'Neutral';
}

export interface KpiDetailCalculation {
  kpiId: string;
  title: string;
  formulaDisplay: string;
  inputComponents: { [key: string]: number };
  accountingJustification: string;
  tallySourceFieldsDiscovered: string[];
  isCostBasisComplete: boolean;
}

export interface SalesBreakdownItem {
  name: string;
  code?: string;
  salesValue: number;
  quantity: number;
  invoiceCount: number;
  grossProfit?: number | null;
  grossMarginPercentage?: number | null;
  percentageOfTotal: number;
  previousSalesValue: number;
  growthPercentage: number;
}

export interface CustomerDeclineRecord {
  customerName: string;
  currentSales: number;
  previousSales: number;
  difference: number;
  growthPercentage: number;
  primaryCategory?: string;
  lastInvoiceDate?: string;
}

export interface CustomerConcentrationSummary {
  top5SharePercentage: number;
  top10SharePercentage: number;
  top20SharePercentage: number;
  totalSalesValue: number;
  totalActiveCustomers: number;
  concentrationRiskLevel: 'Low' | 'Moderate' | 'High';
}

export interface SalesAnalyticsResult {
  period: AccountingPeriod;
  totalGrossSales: number;
  totalNetSales: number;
  totalQuantity: number;
  totalInvoices: number;
  monthlyTrends: SalesBreakdownItem[];
  topCustomers: SalesBreakdownItem[];
  decliningCustomers: CustomerDeclineRecord[];
  growingCustomers: SalesBreakdownItem[];
  concentration: CustomerConcentrationSummary;
  voucherTypeBreakdown: SalesBreakdownItem[];
  stateBreakdown: SalesBreakdownItem[];
  discoveredSalesLedgers: string;
  dataQualityStatus: DataAvailabilityStatus;
}

export interface PurchaseAnalyticsResult {
  period: AccountingPeriod;
  totalPurchases: number;
  totalTaxAmount: number;
  totalBillsCount: number;
  monthlyTrends: SalesBreakdownItem[];
  topSuppliers: SalesBreakdownItem[];
  top5SupplierConcentration: number;
  top10SupplierConcentration: number;
  groupBreakdown: SalesBreakdownItem[];
}

export interface ExpenseSpikeAlert {
  expenseLedgerName: string;
  groupName: string;
  currentPeriodAmount: number;
  previousPeriodAmount: number;
  increaseAmount: number;
  increasePercentage: number;
  explanation: string;
}

export interface ExpenseAnalyticsResult {
  period: AccountingPeriod;
  totalOperatingExpenses: number;
  totalDirectExpenses: number;
  totalIndirectExpenses: number;
  groupWiseExpenses: SalesBreakdownItem[];
  ledgerWiseExpenses: SalesBreakdownItem[];
  monthlyTrends: SalesBreakdownItem[];
  detectedSpikes: ExpenseSpikeAlert[];
}

export interface CashFlowMovementItem {
  dateOrMonth: string;
  totalInflows: number;
  totalOutflows: number;
  netCashMovement: number;
  closingCashBankBalance: number;
}

export interface CashFlowResult {
  period: AccountingPeriod;
  totalReceipts: number;
  totalPayments: number;
  netCashMovement: number;
  cashLedgerBalance: number;
  bankLedgerBalance: number;
  periodicMovements: CashFlowMovementItem[];
  accountingDisclaimer: string;
}

export interface InventoryItemAnalyticsRecord {
  itemName: string;
  stockGroup: string;
  godownLocation: string;
  openingQuantity: number;
  inwardPurchasesQuantity: number;
  outwardSalesQuantity: number;
  closingQuantity: number;
  closingRate: number;
  closingValue: number;
  lastMovementDate?: string;
  daysSinceLastMovement: number;
  velocityCategory: 'FastMoving' | 'SlowMoving' | 'DeadStock';
}

export interface InventoryAnalyticsResult {
  period: AccountingPeriod;
  totalInventoryValue: number;
  totalDistinctItems: number;
  slowMovingStockValue: number;
  deadStockValue: number;
  topItemsByValue: InventoryItemAnalyticsRecord[];
  slowMovingItems: InventoryItemAnalyticsRecord[];
  deadStockItems: InventoryItemAnalyticsRecord[];
  groupConcentration: SalesBreakdownItem[];
  inventoryDataStatus: DataAvailabilityStatus;
}

export interface AgingBucketConfig {
  id: string;
  label: string;
  minDays: number;
  maxDays: number | null;
  totalAmount: number;
  billCount: number;
}

export interface CustomerOverdueRecord {
  customerName: string;
  ledgerGroup: string;
  totalOutstanding: number;
  overdueAmount: number;
  oldestDueDate: string;
  maxOverdueDays: number;
  riskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
  gstin?: string;
}

export interface HighRiskReceivable {
  customerName: string;
  outstandingAmount: number;
  daysOverdue: number;
  triggerReason: string;
  severity: RuleSeverity;
}

export interface ReceivablesAgingSummary {
  asOfDate: string;
  totalReceivables: number;
  totalNotDue: number;
  totalOverdue: number;
  buckets: AgingBucketConfig[];
  topOverdueCustomers: CustomerOverdueRecord[];
  highRiskReceivables: HighRiskReceivable[];
}

export interface SupplierPayableRecord {
  supplierName: string;
  totalPayable: number;
  overdueAmount: number;
  oldestDueDate: string;
  maxOverdueDays: number;
}

export interface PayablesAgingSummary {
  asOfDate: string;
  totalPayables: number;
  totalNotDue: number;
  totalOverdue: number;
  buckets: AgingBucketConfig[];
  topSuppliersPayable: SupplierPayableRecord[];
}

export interface ProductMarginItem {
  productName: string;
  stockGroup: string;
  salesValue: number;
  costOfGoodsSold: number | null;
  grossProfit: number | null;
  grossMarginPercentage: number | null;
  costBasisReliability: 'Actual' | 'Incomplete' | 'Unavailable';
  statusNote: string;
}

export interface ProductMarginReport {
  period: AccountingPeriod;
  totalRevenue: number;
  totalCost: number | null;
  totalGrossProfit: number | null;
  overallMarginPercentage: number | null;
  topMarginProducts: ProductMarginItem[];
  lowestMarginProducts: ProductMarginItem[];
  qualityStatus: {
    isCostDataComplete: boolean;
    percentageSalesWithCost: number;
    message: string;
  };
}

export interface CustomerProfitabilityItem {
  customerName: string;
  salesValue: number;
  costValue: number | null;
  grossProfit: number | null;
  marginPercentage: number | null;
  marginClassification: 'Actual' | 'Estimated' | 'Unavailable';
}

export interface GstAnalyticsSummary {
  period: AccountingPeriod;
  totalGstSales: number;
  totalGstPurchases: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  netTaxLiability: number;
  totalGstInvoices: number;
}

export interface GstRateBreakdown {
  taxRatePercentage: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  voucherCount: number;
}

export interface GstExceptionRecord {
  voucherNumber: string;
  voucherDate: string;
  partyName: string;
  recordedGstin: string;
  voucherType: string;
  taxableValue: number;
  recordedTax: number;
  expectedTax: number;
  difference: number;
  exceptionType:
    | 'Missing GSTIN'
    | 'Invalid GSTIN Format'
    | 'Missing Tax Amount'
    | 'Unexpected Tax Rate'
    | 'Tax Calculation Mismatch'
    | 'State/Tax-Type Inconsistency';
  description: string;
  severity: 'Warning' | 'Error';
}

export interface GstExceptionReport {
  totalVouchersScanned: number;
  totalExceptionsFound: number;
  missingGstinCount: number;
  invalidGstinCount: number;
  calculationMismatchCount: number;
  stateInconsistencyCount: number;
  exceptions: GstExceptionRecord[];
}

export interface GstinValidationSummary {
  totalPartiesChecked: number;
  validGstinsCount: number;
  missingGstinsCount: number;
  invalidFormatGstinsCount: number;
  invalidGstinList: string[];
}

export interface ReconciliationItem {
  matchId: string;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  tallyTaxableValue: number;
  externalTaxableValue: number;
  taxableDifference: number;
  tallyTotalTax: number;
  externalTotalTax: number;
  taxDifference: number;
  status: ReconciliationMatchStatus;
  matchReason: string;
}

export interface ReconciliationJobResult {
  jobId: string;
  executedAt: string;
  totalRecords: number;
  matchedCount: number;
  partiallyMatchedCount: number;
  mismatchCount: number;
  missingInTallyCount: number;
  missingInExternalCount: number;
  needsReviewCount: number;
  matchedTaxableValue: number;
  mismatchedTaxableValue: number;
  items: ReconciliationItem[];
}

export interface DuplicateVoucherCandidate {
  voucherNumber: string;
  voucherDate: string;
  partyName: string;
  amount: number;
  voucherType: string;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  matchingCriteriaSummary: string;
  voucherGuids: string[];
}

export interface AccountingAnomaly {
  id: string;
  voucherDate: string;
  voucherNumber: string;
  partyOrAccount: string;
  amount: number;
  anomalyType: string;
  severity: RuleSeverity;
  reason: string;
  historicalBenchmark: string;
  analyticalNote: string;
}

export interface RuleCondition {
  field: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=' | 'contains' | 'between';
  value: string;
  valueType: 'Numeric' | 'String' | 'Days' | 'Percentage';
}

export interface BusinessRuleDefinition {
  ruleId: string;
  name: string;
  description: string;
  scope: 'Sales' | 'Receivable' | 'Payable' | 'GST' | 'Expense' | 'Inventory' | 'Data Quality';
  conditions: RuleCondition[];
  logicalOperator: 'AND' | 'OR';
  severity: RuleSeverity;
  actionType: 'Flag' | 'Highlight' | 'Notify' | 'Include in Dashboard' | 'Include in Report';
  enabled: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  triggeredCount: number;
}

export interface RuleTestResult {
  ruleId: string;
  recordsEvaluated: number;
  recordsAffected: number;
  sampleAffectedEntities: string[];
  evaluationMessage: string;
}

export interface ManagementAlert {
  id: string;
  title: string;
  category: 'Receivables' | 'Sales' | 'Expenses' | 'Inventory' | 'GST' | 'Data Quality';
  priority: RuleSeverity;
  whatHappened: string;
  whyFlagged: string;
  source: string;
  calculation: string;
  recommendedReviewAction: string;
  detectedAt: string;
}

export interface ExecutiveDashboardOverview {
  period: AccountingPeriod;
  companyName: string;
  currencySymbol: string;
  kpiCards: ExecutiveKpi[];
  alerts: ManagementAlert[];
  salesOverview: SalesAnalyticsResult;
  receivablesOverview: ReceivablesAgingSummary;
  payablesOverview: PayablesAgingSummary;
  expensesOverview: ExpenseAnalyticsResult;
  inventoryOverview: InventoryAnalyticsResult;
  gstOverview: GstAnalyticsSummary;
  dataSourceStatus: DataSourceType;
  lastRefreshedAt: string;
  dataQualityStatus: {
    overallStatus: 'Good' | 'Warning' | 'Insufficient';
    salesCompleteness: number;
    customerCompleteness: number;
    gstCompleteness: number;
    inventoryCompleteness: number;
    notes: string[];
  };
}

export interface SemanticFieldDiscovery {
  semanticConcept: string;
  discoveredTallyField: string | null;
  tallyTableOrObject: string;
  status: 'Discovered' | 'Mapped' | 'Missing';
  aliasUsed?: string;
}
