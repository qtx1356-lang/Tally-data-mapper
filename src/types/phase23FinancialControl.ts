// Phase 23 - Advanced Business Intelligence & Financial Control Center Types

export type DataLabel = 'ACTUAL' | 'FORECAST' | 'SCENARIO';

export type MetricAvailability = 'Available' | 'Partial' | 'Stale' | 'Unavailable';

export type ReportingPeriod = 'Today' | 'Week' | 'Month' | 'Quarter' | 'Financial Year' | 'Custom';

export type KPICategory =
  | 'Sales'
  | 'Profitability'
  | 'Cash'
  | 'Receivables'
  | 'Payables'
  | 'Inventory'
  | 'Tax'
  | 'Operations';

export type KPIStatus = 'On Target' | 'Warning' | 'Critical' | 'Unavailable';

export interface ManagementKPI {
  kpiId: string;
  name: string;
  category: KPICategory;
  definition: string;
  formulaDoc: string;
  dataset: string;
  currentActual: number;
  unit: string;
  period: string;
  target: number;
  warningThreshold: number;
  criticalThreshold: number;
  status: KPIStatus;
  dataAvailability: MetricAvailability;
  owner: string;
  lastUpdated: string;
  version: number;
  variancePercent?: number;
  isHigherFavorable: boolean;
}

export interface ExecutiveSummaryMetrics {
  fiscalYear: string;
  periodLabel: string;
  lastSyncTimestamp: string;
  datasetVersion: string;
  revenue: { value: number; label: DataLabel; growthRatePercent: number; availability: MetricAvailability };
  grossProfit: { value: number; label: DataLabel; marginPercent: number; availability: MetricAvailability };
  netProfit: { value: number; label: DataLabel; marginPercent: number; availability: MetricAvailability };
  receivables: { value: number; label: DataLabel; overduePercent: number; availability: MetricAvailability };
  payables: { value: number; label: DataLabel; overduePercent: number; availability: MetricAvailability };
  cashBankBalance: { value: number; label: DataLabel; liquidBalance: number; availability: MetricAvailability };
  inventoryValue: { value: number; label: DataLabel; availability: MetricAvailability };
  taxLiabilities: { value: number; label: DataLabel; availability: MetricAvailability };
  operatingExpenses: { value: number; label: DataLabel; variancePercent: number; availability: MetricAvailability };
}

export interface CashFlowHistoryItem {
  period: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
  validated: boolean;
  categories: {
    salesCollections: number;
    supplierPayments: number;
    payroll: number;
    taxes: number;
    operatingExpenses: number;
    capex: number;
    other: number;
  };
}

export interface CashFlowForecastItem {
  date: string;
  horizonDays: number;
  expectedInflows: number;
  expectedOutflows: number;
  projectedBalance: number;
  lowerConfidenceBound: number;
  upperConfidenceBound: number;
  confidencePercent: number;
  isShortfallRisk: boolean;
  keyDrivers: string[];
}

export interface CashFlowForecastSummary {
  methodUsed: string;
  horizonDays: number;
  forecastPeriod: string;
  startingLiquidBalance: number;
  totalProjectedInflows: number;
  totalProjectedOutflows: number;
  netProjectedChange: number;
  endingProjectedBalance: number;
  minProjectedBalance: number;
  shortfallThreshold: number;
  hasShortfallAlert: boolean;
  assumptions: string[];
  forecasts: CashFlowForecastItem[];
}

export interface AgeingBucket {
  bucketName: string; // "0-30 Days", "31-60 Days", etc.
  amount: number;
  percentage: number;
  count: number;
}

export interface ReceivablesCenterData {
  totalOutstanding: number;
  currentAmount: number;
  overdueAmount: number;
  dueSoonAmount: number;
  dsoDays: number;
  dsoFormula: string;
  ageing: AgeingBucket[];
  topDebtors: {
    partyName: string;
    outstandingAmount: number;
    overdueAmount: number;
    avgDaysToPay: number;
    paymentConsistency: 'High' | 'Medium' | 'Low';
    overdueFrequency: string;
  }[];
  collectionForecast30Days: number;
}

export interface PayablesCenterData {
  totalPayable: number;
  currentAmount: number;
  overdueAmount: number;
  dueSoonAmount: number;
  dpoDays: number;
  dpoFormula: string;
  ageing: AgeingBucket[];
  topSuppliers: {
    supplierName: string;
    payableAmount: number;
    overdueAmount: number;
    avgPaymentDelayDays: number;
    paymentConsistency: 'High' | 'Medium' | 'Low';
  }[];
  paymentForecast30Days: number;
}

export interface WorkingCapitalMetrics {
  receivables: number;
  inventory: number;
  payables: number;
  workingCapital: number;
  formula: string;
  previousWorkingCapital: number;
  changeAmount: number;
  changePercent: number;
  dsoDays: number;
  inventoryDays: number;
  dpoDays: number;
  cashConversionCycleDays: number;
  cccFormula: string;
}

export interface BudgetRecord {
  budgetId: string;
  category: string;
  dimension: string; // "Account", "Department", "Region"
  dimensionValue: string;
  period: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number; // Actual - Budget
  variancePercent: number;
  isFavorable: boolean;
  forecastToYearEnd: number;
  expectedYearEndVariance: number;
  status: 'Draft' | 'Approved' | 'Active' | 'Archived';
  version: number;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ManagementScorecardComponent {
  componentId: string;
  name: string;
  category: KPICategory;
  metric: string;
  target: number;
  actual: number;
  score: number; // 0 - 100
  weightPercent: number;
  weightedContribution: number;
  status: KPIStatus;
  scoringFormula: string;
}

export interface ManagementScorecard {
  scorecardId: string;
  companyName: string;
  period: string;
  overallScore: number; // 0 - 100
  rating: 'Outstanding' | 'Satisfactory' | 'Needs Attention' | 'Critical';
  formulaVersion: string;
  components: ManagementScorecardComponent[];
}

export interface ScenarioAssumption {
  salesChangePercent: number;
  collectionDelayDays: number;
  supplierPaymentDelayDays: number;
  opexChangePercent: number;
  priceChangePercent: number;
  volumeChangePercent: number;
}

export interface ScenarioResult {
  scenarioId: string;
  name: string;
  basePeriod: string;
  assumptions: ScenarioAssumption;
  baseRevenue: number;
  scenarioRevenue: number;
  baseNetProfit: number;
  scenarioNetProfit: number;
  baseEndingCash: number;
  scenarioEndingCash: number;
  baseDso: number;
  scenarioDso: number;
  varianceSummary: string[];
  sensitivityTable: {
    salesDeltaPercent: number;
    projectedRevenue: number;
    projectedProfit: number;
    projectedCash: number;
  }[];
  createdAt: string;
  createdBy: string;
}

export interface ForecastModelInfo {
  modelId: string;
  name: string;
  metricTarget: string;
  method: string;
  parameters: Record<string, any>;
  trainingHistoryMonths: number;
  backtestMae: number;
  backtestMapePercent: number;
  qualityRating: 'High' | 'Good' | 'Moderate' | 'Low';
  version: string;
  lastTrainedDate: string;
}

export interface FinancialControlCheck {
  controlId: string;
  name: string;
  category: 'Bank Reconciliation' | 'GST Integrity' | 'Invoice Matching' | 'Duplicate Detection' | 'Budget Variance' | 'Outstanding Review';
  status: 'Passed' | 'Warning' | 'Failed' | 'Not Configured' | 'Insufficient Data';
  owner: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Manual';
  lastExecuted: string;
  executionId: string;
  evidenceSummary: string;
  discrepancyAmount?: number;
  linkedExceptionId?: string;
}

export interface FinancialAuditLog {
  auditId: string;
  action: 'KPI Target Update' | 'Budget Approved' | 'Forecast Executed' | 'Scenario Run' | 'Control Executed' | 'Report Exported';
  user: string;
  userRole: string;
  timestamp: string;
  details: string;
}
