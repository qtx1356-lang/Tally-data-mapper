using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IAccountingAnalyticsEngine
    {
        Task<SalesAnalyticsResult> GetSalesAnalyticsAsync(AccountingPeriod period, SalesFilterOptions filters, string companyId);
        Task<PurchaseAnalyticsResult> GetPurchaseAnalyticsAsync(AccountingPeriod period, PurchaseFilterOptions filters, string companyId);
        Task<ExpenseAnalyticsResult> GetExpenseAnalyticsAsync(AccountingPeriod period, ExpenseFilterOptions filters, string companyId);
        Task<CashFlowResult> GetCashFlowAnalysisAsync(AccountingPeriod period, string companyId);
        Task<InventoryAnalyticsResult> GetInventoryAnalyticsAsync(AccountingPeriod period, InventoryFilterOptions filters, string companyId);
    }

    public interface IGstAnalyticsEngine
    {
        Task<GstAnalyticsSummary> GetGstSummaryAsync(AccountingPeriod period, string companyId);
        Task<List<GstRateBreakdown>> GetGstRateAnalysisAsync(AccountingPeriod period, string companyId);
        Task<GstExceptionReport> GetGstExceptionsAsync(AccountingPeriod period, GstExceptionRules rules, string companyId);
        Task<GstinValidationSummary> ValidateGstinsAsync(List<string> gstins);
    }

    public interface IFinancialAnalysisEngine
    {
        Task<PeriodComparisonResult> ComparePeriodsAsync(AccountingPeriod current, AccountingPeriod previous, ComparisonMetric metric, string companyId);
        Task<CustomerProfitabilityReport> GetCustomerProfitabilityAsync(AccountingPeriod period, string companyId);
        Task<DataQualityGateResult> EvaluateDataQualityAsync(AccountingPeriod period, string companyId);
    }

    public interface IReceivablesEngine
    {
        Task<ReceivablesAgingSummary> GetAgingSummaryAsync(AccountingPeriod asOfDate, List<AgingBucketConfig> buckets, string companyId);
        Task<List<CustomerOverdueRecord>> GetOverdueCustomersAsync(AccountingPeriod asOfDate, decimal minimumOverdue, int minimumDays, string companyId);
        Task<List<HighRiskReceivable>> GetHighRiskReceivablesAsync(AccountingPeriod asOfDate, HighRiskReceivableRule criteria, string companyId);
    }

    public interface IPayablesEngine
    {
        Task<PayablesAgingSummary> GetAgingSummaryAsync(AccountingPeriod asOfDate, List<AgingBucketConfig> buckets, string companyId);
        Task<List<SupplierPayableRecord>> GetSupplierPayablesAsync(AccountingPeriod asOfDate, string companyId);
        Task<List<SupplierPayableRecord>> GetOverduePayablesAsync(AccountingPeriod asOfDate, int minimumDays, string companyId);
    }

    public interface IMarginEngine
    {
        Task<ProductMarginReport> CalculateProductMarginsAsync(AccountingPeriod period, string companyId);
        Task<CustomerMarginReport> CalculateCustomerMarginsAsync(AccountingPeriod period, string companyId);
        Task<MarginDataQualityStatus> CheckMarginCostCompletenessAsync(AccountingPeriod period, string companyId);
    }

    public interface IAnomalyEngine
    {
        Task<List<AccountingAnomaly>> DetectAnomaliesAsync(AccountingPeriod period, AnomalyDetectionConfig config, string companyId);
        Task<List<DuplicateVoucherCandidate>> FindDuplicateVouchersAsync(AccountingPeriod period, DuplicateDetectionCriteria criteria, string companyId);
        Task<List<LargeTransactionRecord>> GetLargeTransactionsAsync(AccountingPeriod period, decimal thresholdAmount, string companyId);
        Task<List<RoundValueTransaction>> DetectRoundValueTransactionsAsync(AccountingPeriod period, decimal minAmount, string companyId);
    }

    public interface IReconciliationEngine
    {
        Task<ReconciliationJobResult> ReconcileGstRecordsAsync(List<GstRecord> tallyRecords, List<GstExternalRecord> externalRecords, ReconciliationTolerances tolerances);
        Task<ReconciliationDiscrepancyDetail> GetDiscrepancyDetailsAsync(string matchId);
    }

    public interface IBusinessRuleEngine
    {
        Task<List<BusinessRuleDefinition>> GetRulesAsync(string companyId);
        Task<BusinessRuleDefinition> SaveRuleAsync(BusinessRuleDefinition rule, string userId);
        Task<bool> DeleteRuleAsync(string ruleId, string userId);
        Task<RuleTestResult> TestRuleAsync(BusinessRuleDefinition rule, AccountingPeriod period, string companyId);
        Task<List<RuleExecutionFlag>> EvaluateRulesAsync(AccountingPeriod period, string companyId);
    }

    public interface IKpiEngine
    {
        Task<List<ExecutiveKpi>> CalculateKpisAsync(AccountingPeriod period, string companyId);
        Task<KpiDetailCalculation> GetKpiCalculationTransparencyAsync(string kpiId, AccountingPeriod period, string companyId);
    }

    public interface IExecutiveDashboardEngine
    {
        Task<ExecutiveDashboardOverview> GenerateOverviewAsync(AccountingPeriod period, string companyId);
        Task<List<ManagementAlert>> GetManagementAlertsAsync(AccountingPeriod period, string companyId);
        Task<DashboardDataFreshness> CheckDataFreshnessAsync(string companyId);
    }
}
