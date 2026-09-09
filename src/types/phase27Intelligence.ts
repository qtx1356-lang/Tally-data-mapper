/**
 * Phase 27: Advanced Tally Intelligence, Anomaly Detection & Financial Pattern Analysis Types
 */

export type InsightType =
  | 'Trend'
  | 'Anomaly'
  | 'Variance'
  | 'Concentration'
  | 'Growth'
  | 'Decline'
  | 'Pattern'
  | 'Data Quality'
  | 'Reconciliation'
  | 'Risk Signal'
  | 'Operational';

export type InsightSeverity = 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';
export type InsightConfidence = 'High' | 'Medium' | 'Low';
export type InsightStatus =
  | 'New'
  | 'Viewed'
  | 'Investigating'
  | 'Accepted'
  | 'Rejected'
  | 'Converted to Task'
  | 'Converted to Exception'
  | 'Resolved';

export interface InsightModel {
  insightId: string;
  companyId: string;
  period: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  fact: string; // FACT: Unambiguous observed accounting data
  interpretation: string; // INTERPRETATION: Statistical/analytical inference
  recommendation: string; // RECOMMENDATION: Suggested action for review
  whyDetected: string;
  dataUsed: string;
  calculation: string;
  thresholdOrModel: string;
  limitations: string;
  evidenceRefs: string[];
  confidence: InsightConfidence;
  status: InsightStatus;
  modelVersion: string;
  ruleVersion: number;
  createdAt: string;
}

export interface DataQualityFactor {
  name: string;
  metric: string;
  status: 'Good' | 'Warning' | 'Issue';
  impactDescription: string;
}

export interface DataQualityReport {
  overallScore: number; // 0 - 100
  missingValuesCount: number;
  duplicateRecordsCount: number;
  invalidDatesCount: number;
  impossibleAmountsCount: number;
  brokenRelationshipsCount: number;
  factors: DataQualityFactor[];
  impactNotice?: string;
  analyzedRecordsCount: number;
}

export interface AnomalyItem {
  anomalyId: string;
  type:
    | 'Amount Anomaly'
    | 'Frequency Anomaly'
    | 'Timing Anomaly'
    | 'Concentration Anomaly'
    | 'Growth Anomaly'
    | 'Margin Anomaly'
    | 'Quantity Anomaly'
    | 'Price Anomaly'
    | 'Ledger Activity Anomaly';
  severity: InsightSeverity;
  score: number; // Numerical anomaly deviation score
  method: 'Z-Score' | 'MAD (Median Absolute Deviation)' | 'IQR' | 'Seasonal Baseline';
  entity: string;
  source: string;
  actualValue: number | string;
  expectedBaseline: number | string;
  deviation: string;
  sampleSize: number;
  isLowSampleSize: boolean;
  isRecurring: boolean;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  status: 'New' | 'Reviewed' | 'Explained' | 'False Positive' | 'Accepted' | 'Escalated' | 'Resolved';
  disclaimer: string;
  evidenceRefs: string[];
}

export interface PatternInsight {
  patternId: string;
  type:
    | 'Recurring Transactions'
    | 'Month-End Spike'
    | 'Year-End Spike'
    | 'Customer Concentration'
    | 'Supplier Concentration'
    | 'Round-Number Clustering'
    | 'Duplicate-Like Match';
  title: string;
  description: string;
  score: number;
  occurrences: number;
  metrics: {
    topContributor?: string;
    concentrationPct?: number;
    amount?: number;
    similarityScore?: number;
  };
  evidenceRefs: string[];
}

export interface TrendAnalysisItem {
  metric: string;
  category: 'Sales' | 'Purchases' | 'Expenses' | 'Receivables' | 'Payables' | 'Inventory' | 'Cash';
  trendType: 'Increasing' | 'Decreasing' | 'Stable' | 'Volatile' | 'Seasonal' | 'Structural Change';
  currentValue: number;
  previousValue: number;
  variancePct: number;
  contributionTopEntities: { name: string; amount: number; pct: number }[];
  historicalPoints: { period: string; value: number; baseline: number }[];
}

export interface FinancialRatioItem {
  name: string;
  category: 'Liquidity' | 'Profitability' | 'Efficiency' | 'Solvency';
  currentValue: number | string;
  unit: string;
  previousValue: number | string;
  formula: string;
  inputsUsed: Record<string, number | string>;
  status: 'Healthy' | 'Caution' | 'Action Required' | 'Cannot Calculate';
  benchmark: string;
  explanation: string;
}

export interface RootCauseContributor {
  rank: number;
  entity: string;
  delta: number;
  deltaPct: number;
  reason: string;
}

export interface RootCauseTreeItem {
  rootCauseId: string;
  targetAnomaly: string;
  metric: string;
  confidence: InsightConfidence;
  contributorPath: string; // e.g. Total Expenses -> Legal Expenses -> Apex Ltd -> Voucher #901
  likelyContributors: RootCauseContributor[];
  evidenceRefs: string[];
}

export interface WatchlistItem {
  watchlistId: string;
  targetType: 'Ledger' | 'Customer' | 'Supplier' | 'Product' | 'Metric';
  targetName: string;
  condition: string;
  threshold: number | string;
  currentValue: number | string;
  status: 'Normal' | 'Triggered' | 'Muted';
  lastTriggeredAt?: string;
}

export interface ModelRegistryItem {
  modelId: string;
  name: string;
  version: string;
  type: 'Statistical' | 'Rule-Based' | 'AI' | 'Hybrid';
  status: 'Approved (Production)' | 'Sandbox' | 'Archived';
  accuracyScore: number;
  executionsCount: number;
  falsePositiveRate: string;
  approvedBy: string;
  lastUpdated: string;
}

export interface IntelligenceOverview {
  totalInsights: number;
  highPriorityInsights: number;
  newAnomalies: number;
  recurringAnomalies: number;
  trendAlerts: number;
  dataQualityScore: number;
  openExceptions: number;
}
