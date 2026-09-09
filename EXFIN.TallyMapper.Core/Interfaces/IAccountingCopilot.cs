using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IAIQueryPlanner
    {
        Task<QueryAst> PlanQueryAsync(string naturalLanguagePrompt, string companyContext, string periodContext);
        Task<QueryValidationResult> ValidateQueryAstAsync(QueryAst queryAst, string companyContext);
        string CompileToSafeSql(QueryAst queryAst);
    }

    public interface IExplanationEngine
    {
        Task<string> ExplainResultAsync(string prompt, object queryResult, AnswerProvenance provenance, TraceabilityMetadata trace);
        string CalculatePercentageChange(decimal current, decimal previous);
        string CalculateMargin(decimal profit, decimal revenue);
    }

    public interface IInsightEngine
    {
        Task<List<InsightItem>> GenerateInsightsAsync(string datasetName, object datasetRecords, string periodContext);
        Task<List<AgeingBucketSummary>> AnalyzeOutstandingAgeingAsync(string companyId);
        Task<TaxReconciliationResult> ReconcileTaxAsync(string companyId, string period);
        Task<List<InsightItem>> DetectAnomaliesAsync(string datasetName, object datasetRecords);
    }

    public interface IVoiceCommandAdapter
    {
        Task<VoiceCommandIntent> ProcessSpokenTranscriptAsync(string transcript, string companyContext);
    }

    public interface IAIProvider
    {
        string ProviderId { get; }
        bool SupportsOffline { get; }
        Task<string> GenerateCompletionAsync(string prompt, Dictionary<string, object> parameters);
    }

    public interface IAccountingCopilotService
    {
        Task<CopilotMessage> ProcessCopilotQueryAsync(string userMessage, string conversationId, string companyId, CopilotMode mode);
        Task<object> DrilldownAsync(string parentQueryId, string filterDimension, string filterValue, string companyId);
        Task<CopilotReportPlan> GenerateReportFromPromptAsync(string prompt, string companyId);
        Task<CopilotReportPlan> EditReportWithNaturalLanguageAsync(string reportId, string instruction);
    }
}
