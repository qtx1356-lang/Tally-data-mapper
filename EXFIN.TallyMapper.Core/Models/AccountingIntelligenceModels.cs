using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum AccountingPeriodType
    {
        CurrentFinancialYear,
        PreviousFinancialYear,
        CurrentMonth,
        PreviousMonth,
        CurrentQuarter,
        PreviousQuarter,
        Custom
    }

    public class AccountingPeriod
    {
        public AccountingPeriodType PeriodType { get; set; } = AccountingPeriodType.CurrentFinancialYear;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Label { get; set; } = string.Empty;
        public string FinancialYear { get; set; } = "2026-2027";
    }

    public enum DataAvailabilityStatus
    {
        Available,
        PartiallyAvailable,
        Unavailable
    }

    public enum DataSourceType
    {
        LiveTally,
        Cached,
        ImportedExternal,
        Calculated
    }

    public class ExecutiveKpi
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal? NumericValue { get; set; }
        public string FormattedValue { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal? ChangePercentage { get; set; }
        public string PeriodLabel { get; set; } = string.Empty;
        public string SourceDescription { get; set; } = string.Empty;
        public string CalculationFormula { get; set; } = string.Empty;
        public DataAvailabilityStatus Availability { get; set; } = DataAvailabilityStatus.Available;
        public DataSourceType DataSource { get; set; } = DataSourceType.LiveTally;
        public string StatusBadge { get; set; } = "Optimal"; // Optimal, Warning, Neutral, Alert
    }

    public class KpiDetailCalculation
    {
        public string KpiId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string FormulaDisplay { get; set; } = string.Empty;
        public Dictionary<string, decimal> InputComponents { get; set; } = new Dictionary<string, decimal>();
        public string AccountingJustification { get; set; } = string.Empty;
        public List<string> TallySourceFieldsDiscovered { get; set; } = new List<string>();
        public bool IsCostBasisComplete { get; set; } = true;
    }

    public class SalesFilterOptions
    {
        public string GroupBy { get; set; } = "Month"; // Customer, Product, Ledger, VoucherType, State, Location
        public string MetricType { get; set; } = "Value"; // Value, Quantity, InvoiceCount
        public int TopLimit { get; set; } = 20;
        public string StateFilter { get; set; } = null;
        public string VoucherTypeFilter { get; set; } = null;
    }

    public class SalesBreakdownItem
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal SalesValue { get; set; }
        public decimal Quantity { get; set; }
        public int InvoiceCount { get; set; }
        public decimal? GrossProfit { get; set; }
        public decimal? GrossMarginPercentage { get; set; }
        public decimal PercentageOfTotal { get; set; }
        public decimal PreviousSalesValue { get; set; }
        public decimal GrowthPercentage { get; set; }
    }

    public class CustomerDeclineRecord
    {
        public string CustomerName { get; set; } = string.Empty;
        public decimal CurrentSales { get; set; }
        public decimal PreviousSales { get; set; }
        public decimal Difference { get; set; }
        public decimal DeclinePercentage { get; set; }
        public string PrimaryProductCategory { get; set; } = string.Empty;
        public DateTime? LastInvoiceDate { get; set; }
    }

    public class CustomerConcentrationSummary
    {
        public decimal Top5SharePercentage { get; set; }
        public decimal Top10SharePercentage { get; set; }
        public decimal Top20SharePercentage { get; set; }
        public decimal TotalSalesValue { get; set; }
        public int TotalActiveCustomers { get; set; }
        public string ConcentrationRiskLevel { get; set; } = "Moderate";
    }

    public class SalesAnalyticsResult
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalGrossSales { get; set; }
        public decimal TotalNetSales { get; set; }
        public decimal TotalQuantity { get; set; }
        public int TotalInvoices { get; set; }
        public List<SalesBreakdownItem> MonthlyTrends { get; set; } = new List<SalesBreakdownItem>();
        public List<SalesBreakdownItem> TopCustomers { get; set; } = new List<SalesBreakdownItem>();
        public List<CustomerDeclineRecord> DecliningCustomers { get; set; } = new List<CustomerDeclineRecord>();
        public List<SalesBreakdownItem> GrowingCustomers { get; set; } = new List<SalesBreakdownItem>();
        public CustomerConcentrationSummary Concentration { get; set; } = new CustomerConcentrationSummary();
        public List<SalesBreakdownItem> VoucherTypeBreakdown { get; set; } = new List<SalesBreakdownItem>();
        public List<SalesBreakdownItem> StateBreakdown { get; set; } = new List<SalesBreakdownItem>();
        public string DiscoveredSalesLedgers { get; set; } = string.Empty;
        public DataAvailabilityStatus DataQualityStatus { get; set; } = DataAvailabilityStatus.Available;
    }

    public class PurchaseFilterOptions
    {
        public string GroupBy { get; set; } = "Month";
        public int TopLimit { get; set; } = 20;
    }

    public class PurchaseAnalyticsResult
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalPurchases { get; set; }
        public decimal TotalTaxAmount { get; set; }
        public int TotalBillsCount { get; set; }
        public List<SalesBreakdownItem> MonthlyTrends { get; set; } = new List<SalesBreakdownItem>();
        public List<SalesBreakdownItem> TopSuppliers { get; set; } = new List<SalesBreakdownItem>();
        public decimal Top5SupplierConcentration { get; set; }
        public decimal Top10SupplierConcentration { get; set; }
        public List<SalesBreakdownItem> GroupBreakdown { get; set; } = new List<SalesBreakdownItem>();
    }

    public class ExpenseFilterOptions
    {
        public string GroupBy { get; set; } = "Group";
        public decimal SpikeThresholdPercentage { get; set; } = 30.0m;
    }

    public class ExpenseSpikeAlert
    {
        public string ExpenseLedgerName { get; set; } = string.Empty;
        public string GroupName { get; set; } = string.Empty;
        public decimal CurrentPeriodAmount { get; set; }
        public decimal PreviousPeriodAmount { get; set; }
        public decimal IncreaseAmount { get; set; }
        public decimal IncreasePercentage { get; set; }
        public string Explanation { get; set; } = string.Empty;
    }

    public class ExpenseAnalyticsResult
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalOperatingExpenses { get; set; }
        public decimal TotalDirectExpenses { get; set; }
        public decimal TotalIndirectExpenses { get; set; }
        public List<SalesBreakdownItem> GroupWiseExpenses { get; set; } = new List<SalesBreakdownItem>();
        public List<SalesBreakdownItem> LedgerWiseExpenses { get; set; } = new List<SalesBreakdownItem>();
        public List<SalesBreakdownItem> MonthlyTrends { get; set; } = new List<SalesBreakdownItem>();
        public List<ExpenseSpikeAlert> DetectedSpikes { get; set; } = new List<ExpenseSpikeAlert>();
    }

    public class CashFlowMovementItem
    {
        public string DateOrMonth { get; set; } = string.Empty;
        public decimal TotalInflows { get; set; }
        public decimal TotalOutflows { get; set; }
        public decimal NetCashMovement { get; set; }
        public decimal ClosingCashBankBalance { get; set; }
    }

    public class CashFlowResult
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalReceipts { get; set; }
        public decimal TotalPayments { get; set; }
        public decimal NetCashMovement { get; set; }
        public decimal CashLedgerBalance { get; set; }
        public decimal BankLedgerBalance { get; set; }
        public List<CashFlowMovementItem> PeriodicMovements { get; set; } = new List<CashFlowMovementItem>();
        public string AccountingDisclaimer { get; set; } = "Classification notice: This summary reflects cash and bank voucher debits and credits from Tally and does not constitute an AS-3 / Ind AS 7 statutory Cash Flow Statement unless comprehensive operating, investing, and financing classifications have been mapped.";
    }

    public class InventoryFilterOptions
    {
        public int SlowMovingThresholdDays { get; set; } = 90;
        public int DeadStockThresholdDays { get; set; } = 180;
    }

    public class InventoryItemAnalyticsRecord
    {
        public string ItemName { get; set; } = string.Empty;
        public string StockGroup { get; set; } = string.Empty;
        public string GodownLocation { get; set; } = string.Empty;
        public decimal OpeningQuantity { get; set; }
        public decimal InwardPurchasesQuantity { get; set; }
        public decimal OutwardSalesQuantity { get; set; }
        public decimal ClosingQuantity { get; set; }
        public decimal ClosingRate { get; set; }
        public decimal ClosingValue { get; set; }
        public DateTime? LastMovementDate { get; set; }
        public int DaysSinceLastMovement { get; set; }
        public string VelocityCategory { get; set; } = "Normal"; // FastMoving, SlowMoving, DeadStock
    }

    public class InventoryAnalyticsResult
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalInventoryValue { get; set; }
        public int TotalDistinctItems { get; set; }
        public decimal SlowMovingStockValue { get; set; }
        public decimal DeadStockValue { get; set; }
        public List<InventoryItemAnalyticsRecord> TopItemsByValue { get; set; } = new List<InventoryItemAnalyticsRecord>();
        public List<InventoryItemAnalyticsRecord> SlowMovingItems { get; set; } = new List<InventoryItemAnalyticsRecord>();
        public List<InventoryItemAnalyticsRecord> DeadStockItems { get; set; } = new List<InventoryItemAnalyticsRecord>();
        public List<SalesBreakdownItem> GroupConcentration { get; set; } = new List<SalesBreakdownItem>();
        public DataAvailabilityStatus InventoryDataStatus { get; set; } = DataAvailabilityStatus.Available;
    }

    public class AgingBucketConfig
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int MinDays { get; set; }
        public int? MaxDays { get; set; }
        public decimal TotalAmount { get; set; }
        public int BillCount { get; set; }
    }

    public class CustomerOverdueRecord
    {
        public string CustomerName { get; set; } = string.Empty;
        public string LedgerGroup { get; set; } = string.Empty;
        public decimal TotalOutstanding { get; set; }
        public decimal OverdueAmount { get; set; }
        public DateTime OldestDueDate { get; set; }
        public int MaxOverdueDays { get; set; }
        public string RiskCategory { get; set; } = "Low"; // Low, Medium, High, Critical
        public string Gstin { get; set; } = string.Empty;
    }

    public class HighRiskReceivableRule
    {
        public decimal AmountThreshold { get; set; } = 500000;
        public int DaysOverdueThreshold { get; set; } = 90;
        public decimal GrowthThresholdPercentage { get; set; } = 50;
    }

    public class HighRiskReceivable
    {
        public string CustomerName { get; set; } = string.Empty;
        public decimal OutstandingAmount { get; set; }
        public int DaysOverdue { get; set; }
        public string TriggerReason { get; set; } = string.Empty;
        public string Severity { get; set; } = "High";
    }

    public class ReceivablesAgingSummary
    {
        public DateTime AsOfDate { get; set; }
        public decimal TotalReceivables { get; set; }
        public decimal TotalNotDue { get; set; }
        public decimal TotalOverdue { get; set; }
        public List<AgingBucketConfig> Buckets { get; set; } = new List<AgingBucketConfig>();
        public List<CustomerOverdueRecord> TopOverdueCustomers { get; set; } = new List<CustomerOverdueRecord>();
        public List<HighRiskReceivable> HighRiskReceivables { get; set; } = new List<HighRiskReceivable>();
    }

    public class SupplierPayableRecord
    {
        public string SupplierName { get; set; } = string.Empty;
        public decimal TotalPayable { get; set; }
        public decimal OverdueAmount { get; set; }
        public DateTime OldestDueDate { get; set; }
        public int MaxOverdueDays { get; set; }
    }

    public class PayablesAgingSummary
    {
        public DateTime AsOfDate { get; set; }
        public decimal TotalPayables { get; set; }
        public decimal TotalNotDue { get; set; }
        public decimal TotalOverdue { get; set; }
        public List<AgingBucketConfig> Buckets { get; set; } = new List<AgingBucketConfig>();
        public List<SupplierPayableRecord> TopSuppliersPayable { get; set; } = new List<SupplierPayableRecord>();
    }

    public class ProductMarginItem
    {
        public string ProductName { get; set; } = string.Empty;
        public string StockGroup { get; set; } = string.Empty;
        public decimal SalesValue { get; set; }
        public decimal? CostOfGoodsSold { get; set; }
        public decimal? GrossProfit { get; set; }
        public decimal? GrossMarginPercentage { get; set; }
        public string CostBasisReliability { get; set; } = "Actual"; // Actual, Incomplete, Unavailable
        public string StatusNote { get; set; } = string.Empty;
    }

    public class ProductMarginReport
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal? TotalCost { get; set; }
        public decimal? TotalGrossProfit { get; set; }
        public decimal? OverallMarginPercentage { get; set; }
        public List<ProductMarginItem> TopMarginProducts { get; set; } = new List<ProductMarginItem>();
        public List<ProductMarginItem> LowestMarginProducts { get; set; } = new List<ProductMarginItem>();
        public MarginDataQualityStatus QualityStatus { get; set; } = new MarginDataQualityStatus();
    }

    public class CustomerProfitabilityItem
    {
        public string CustomerName { get; set; } = string.Empty;
        public decimal SalesValue { get; set; }
        public decimal? CostValue { get; set; }
        public decimal? GrossProfit { get; set; }
        public decimal? MarginPercentage { get; set; }
        public string MarginClassification { get; set; } = "Actual"; // Actual, Estimated, Unavailable
    }

    public class CustomerMarginReport
    {
        public AccountingPeriod Period { get; set; }
        public List<CustomerProfitabilityItem> CustomerProfitabilities { get; set; } = new List<CustomerProfitabilityItem>();
    }

    public class MarginDataQualityStatus
    {
        public bool IsCostDataComplete { get; set; } = true;
        public decimal PercentageSalesWithCost { get; set; } = 94.2m;
        public string Message { get; set; } = "Cost basis established from Tally purchase vouchers and stock item valuations.";
    }

    public class GstAnalyticsSummary
    {
        public AccountingPeriod Period { get; set; }
        public decimal TotalGstSales { get; set; }
        public decimal TotalGstPurchases { get; set; }
        public decimal TotalTaxableValue { get; set; }
        public decimal TotalCgst { get; set; }
        public decimal TotalSgst { get; set; }
        public decimal TotalIgst { get; set; }
        public decimal TotalCess { get; set; }
        public decimal NetTaxLiability { get; set; }
        public int TotalGstInvoices { get; set; }
    }

    public class GstRateBreakdown
    {
        public decimal TaxRatePercentage { get; set; }
        public decimal TaxableValue { get; set; }
        public decimal CgstAmount { get; set; }
        public decimal SgstAmount { get; set; }
        public decimal IgstAmount { get; set; }
        public decimal CessAmount { get; set; }
        public decimal TotalTax { get; set; }
        public int VoucherCount { get; set; }
    }

    public enum GstExceptionType
    {
        MissingGstin,
        InvalidGstinFormat,
        MissingTaxAmount,
        UnexpectedTaxRate,
        TaxCalculationMismatch,
        StateTaxTypeInconsistency
    }

    public class GstExceptionRecord
    {
        public string VoucherNumber { get; set; } = string.Empty;
        public DateTime VoucherDate { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public string RecordedGstin { get; set; } = string.Empty;
        public string VoucherType { get; set; } = string.Empty;
        public decimal TaxableValue { get; set; }
        public decimal RecordedTax { get; set; }
        public decimal ExpectedTax { get; set; }
        public decimal Difference { get; set; }
        public GstExceptionType ExceptionType { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = "Warning"; // Warning, Error
    }

    public class GstExceptionRules
    {
        public decimal CalculationTolerance { get; set; } = 1.0m;
        public bool ValidateGstinFormat { get; set; } = true;
        public bool CheckInterStateIgstConsistency { get; set; } = true;
    }

    public class GstExceptionReport
    {
        public int TotalVouchersScanned { get; set; }
        public int TotalExceptionsFound { get; set; }
        public int MissingGstinCount { get; set; }
        public int InvalidGstinCount { get; set; }
        public int CalculationMismatchCount { get; set; }
        public int StateInconsistencyCount { get; set; }
        public List<GstExceptionRecord> Exceptions { get; set; } = new List<GstExceptionRecord>();
    }

    public class GstinValidationSummary
    {
        public int TotalPartiesChecked { get; set; }
        public int ValidGstinsCount { get; set; }
        public int MissingGstinsCount { get; set; }
        public int InvalidFormatGstinsCount { get; set; }
        public List<string> InvalidGstinList { get; set; } = new List<string>();
    }

    public enum ReconciliationMatchStatus
    {
        Matched,
        PartiallyMatched,
        Mismatch,
        MissingInTally,
        MissingInExternalData,
        NeedsReview
    }

    public class GstRecord
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public string PartyGstin { get; set; } = string.Empty;
        public decimal TaxableValue { get; set; }
        public decimal Cgst { get; set; }
        public decimal Sgst { get; set; }
        public decimal Igst { get; set; }
        public decimal TotalTax { get; set; }
        public decimal InvoiceValue { get; set; }
    }

    public class GstExternalRecord
    {
        public string ExternalInvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string SupplierGstin { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public decimal TaxableValue { get; set; }
        public decimal Cgst { get; set; }
        public decimal Sgst { get; set; }
        public decimal Igst { get; set; }
        public decimal TotalTax { get; set; }
        public decimal InvoiceValue { get; set; }
    }

    public class ReconciliationItem
    {
        public string MatchId { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime? InvoiceDate { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public decimal TallyTaxableValue { get; set; }
        public decimal ExternalTaxableValue { get; set; }
        public decimal TaxableDifference { get; set; }
        public decimal TallyTotalTax { get; set; }
        public decimal ExternalTotalTax { get; set; }
        public decimal TaxDifference { get; set; }
        public ReconciliationMatchStatus Status { get; set; }
        public string MatchReason { get; set; } = string.Empty;
    }

    public class ReconciliationTolerances
    {
        public decimal AmountTolerance { get; set; } = 1.0m;
        public decimal TaxTolerance { get; set; } = 1.0m;
        public int DateToleranceDays { get; set; } = 2;
    }

    public class ReconciliationJobResult
    {
        public string JobId { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; }
        public int TotalRecords { get; set; }
        public int MatchedCount { get; set; }
        public int PartiallyMatchedCount { get; set; }
        public int MismatchCount { get; set; }
        public int MissingInTallyCount { get; set; }
        public int MissingInExternalCount { get; set; }
        public int NeedsReviewCount { get; set; }
        public decimal MatchedTaxableValue { get; set; }
        public decimal MismatchedTaxableValue { get; set; }
        public List<ReconciliationItem> Items { get; set; } = new List<ReconciliationItem>();
    }

    public class ReconciliationDiscrepancyDetail
    {
        public string MatchId { get; set; } = string.Empty;
        public GstRecord TallyRecord { get; set; }
        public GstExternalRecord ExternalRecord { get; set; }
        public List<string> DifferencesExplanation { get; set; } = new List<string>();
        public string RecommendedAction { get; set; } = "Review invoice booking in Tally against vendor GSTR-2B filing.";
    }

    public class DuplicateDetectionCriteria
    {
        public bool MatchVoucherNumber { get; set; } = true;
        public bool MatchDate { get; set; } = true;
        public bool MatchParty { get; set; } = true;
        public bool MatchAmount { get; set; } = true;
    }

    public class DuplicateVoucherCandidate
    {
        public string VoucherNumber { get; set; } = string.Empty;
        public DateTime VoucherDate { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public string ConfidenceLevel { get; set; } = "High"; // High, Medium, Low
        public string MatchingCriteriaSummary { get; set; } = string.Empty;
        public List<string> VoucherGuids { get; set; } = new List<string>();
    }

    public class AnomalyDetectionConfig
    {
        public decimal LargeTransactionMultiplier { get; set; } = 3.5m;
        public decimal RoundValueThreshold { get; set; } = 100000m;
        public decimal ExpenseSpikeMultiplier { get; set; } = 1.8m;
    }

    public class AccountingAnomaly
    {
        public string Id { get; set; } = string.Empty;
        public DateTime VoucherDate { get; set; }
        public string VoucherNumber { get; set; } = string.Empty;
        public string PartyOrAccount { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string AnomalyType { get; set; } = string.Empty;
        public string Severity { get; set; } = "Medium"; // Low, Medium, High
        public string Reason { get; set; } = string.Empty;
        public string HistoricalBenchmark { get; set; } = string.Empty;
        public string AnalyticalNote { get; set; } = "Analytical flag only — does not imply irregularity.";
    }

    public class LargeTransactionRecord
    {
        public DateTime Date { get; set; }
        public string VoucherNumber { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public decimal MultipleOfAverage { get; set; }
    }

    public class RoundValueTransaction
    {
        public DateTime Date { get; set; }
        public string VoucherNumber { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string FrequencyNote { get; set; } = string.Empty;
    }

    public enum RuleScope
    {
        Sales,
        Receivable,
        Payable,
        Gst,
        Expense,
        Inventory,
        AccountingQuality
    }

    public enum RuleSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public class RuleCondition
    {
        public string Field { get; set; } = string.Empty;
        public string Operator { get; set; } = ">"; // >, <, ==, !=, >=, <=, contains, between
        public string Value { get; set; } = string.Empty;
        public string ValueType { get; set; } = "Numeric"; // Numeric, String, Days, Percentage
    }

    public class BusinessRuleDefinition
    {
        public string RuleId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public RuleScope Scope { get; set; } = RuleScope.Receivable;
        public List<RuleCondition> Conditions { get; set; } = new List<RuleCondition>();
        public string LogicalOperator { get; set; } = "AND"; // AND, OR
        public RuleSeverity Severity { get; set; } = RuleSeverity.High;
        public string ActionType { get; set; } = "Flag"; // Flag, Highlight, Notify, IncludeInDashboard, IncludeInReport
        public bool Enabled { get; set; } = true;
        public int Version { get; set; } = 1;
        public string CreatedBy { get; set; } = "System Admin";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int TriggeredCount { get; set; }
    }

    public class RuleTestResult
    {
        public string RuleId { get; set; } = string.Empty;
        public int RecordsEvaluated { get; set; }
        public int RecordsAffected { get; set; }
        public List<string> SampleAffectedEntities { get; set; } = new List<string>();
        public string EvaluationMessage { get; set; } = string.Empty;
    }

    public class RuleExecutionFlag
    {
        public string RuleId { get; set; } = string.Empty;
        public string RuleName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public decimal EntityValue { get; set; }
        public RuleSeverity Severity { get; set; }
        public string ConditionExplanation { get; set; } = string.Empty;
        public DateTime FlaggedAt { get; set; }
    }

    public class ManagementAlert
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Receivables, Sales, Expenses, Inventory, GST, DataQuality
        public RuleSeverity Priority { get; set; } = RuleSeverity.High;
        public string WhatHappened { get; set; } = string.Empty;
        public string WhyFlagged { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Calculation { get; set; } = string.Empty;
        public string RecommendedReviewAction { get; set; } = "Review recommended.";
        public DateTime DetectedAt { get; set; }
    }

    public class ExecutiveDashboardOverview
    {
        public AccountingPeriod Period { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string CurrencySymbol { get; set; } = "₹";
        public List<ExecutiveKpi> KpiCards { get; set; } = new List<ExecutiveKpi>();
        public List<ManagementAlert> Alerts { get; set; } = new List<ManagementAlert>();
        public SalesAnalyticsResult SalesOverview { get; set; }
        public ReceivablesAgingSummary ReceivablesOverview { get; set; }
        public PayablesAgingSummary PayablesOverview { get; set; }
        public ExpenseAnalyticsResult ExpensesOverview { get; set; }
        public InventoryAnalyticsResult InventoryOverview { get; set; }
        public GstAnalyticsSummary GstOverview { get; set; }
        public DataSourceType DataSourceStatus { get; set; } = DataSourceType.LiveTally;
        public DateTime LastRefreshedAt { get; set; }
    }

    public class DashboardDataFreshness
    {
        public bool IsTallyConnected { get; set; } = true;
        public DateTime LastSyncTime { get; set; }
        public string FreshnessStatus { get; set; } = "Current"; // Current, Stale, Disconnected
        public string Message { get; set; } = "Connected to TallyPrime instance.";
    }

    public class PeriodComparisonResult
    {
        public AccountingPeriod CurrentPeriod { get; set; }
        public AccountingPeriod PreviousPeriod { get; set; }
        public decimal CurrentValue { get; set; }
        public decimal PreviousValue { get; set; }
        public decimal Difference { get; set; }
        public decimal PercentageChange { get; set; }
    }

    public enum ComparisonMetric
    {
        Sales,
        GrossProfit,
        Purchases,
        OperatingExpenses,
        Receivables
    }

    public class DataQualityGateResult
    {
        public string Status { get; set; } = "Good"; // Good, Warning, Insufficient
        public decimal SalesCompletenessScore { get; set; } = 99.4m;
        public decimal CustomerCompletenessScore { get; set; } = 96.8m;
        public decimal GstCompletenessScore { get; set; } = 95.2m;
        public decimal InventoryCompletenessScore { get; set; } = 91.0m;
        public List<string> QualityWarnings { get; set; } = new List<string>();
    }
}
