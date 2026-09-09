using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IIntentParser
    {
        Task<CopilotMessage> ParseUserIntentAsync(string userRequest, string companyName, SchemaSnapshot currentSchema, List<CopilotMessage> conversationHistory);
    }

    public interface ISchemaContextProvider
    {
        Task<SchemaSnapshot> GetCurrentSchemaContextAsync(string companyId);
        Task<List<DiscoveredField>> SearchFieldsSemanticAsync(string searchQuery, SchemaSnapshot schema);
        Task InvalidateCompanyContextAsync(string oldCompanyId, string newCompanyId);
    }

    public interface IQueryPlannerCopilot
    {
        Task<CopilotQueryPlan> BuildQueryPlanAsync(string intent, string userRequest, SchemaSnapshot schema, string startDate = null, string endDate = null);
        Task<CopilotQueryPlan> ApplyFollowUpFilterAsync(CopilotQueryPlan existingPlan, string followUpInstruction, SchemaSnapshot schema);
    }

    public interface IReportPlanner
    {
        Task<CopilotReportPlan> BuildReportPlanAsync(CopilotQueryPlan queryPlan, string reportType = "Standard");
        Task<CopilotDashboardPlan> BuildDashboardPlanAsync(string companyName, SchemaSnapshot schema);
    }

    public interface IQueryValidator
    {
        Task<(bool IsValid, List<string> ValidationErrors)> ValidateQueryPlanAsync(CopilotQueryPlan plan, SchemaSnapshot schema);
        Task<bool> ValidateCompanyIsolationAsync(CopilotQueryPlan plan, string currentActiveCompanyId);
    }

    public interface ICopilotExecutionGuard
    {
        Task<bool> CheckPermissionAsync(string action, CopilotPermissionConfig permissions);
        Task<bool> EnforceSafetyLimitsAsync(CopilotQueryPlan plan);
        Task BlockArbitraryCodeExecutionAsync(string codeSnippet);
    }

    public interface IAnswerFormatter
    {
        string FormatSummaryHeader(CopilotQueryPlan plan, object queryResult);
        string ExplainQueryResultTraceability(CopilotQueryPlan plan);
    }

    public interface IConversationRepository
    {
        Task<CopilotConversation> GetConversationByIdAsync(string conversationId);
        Task<List<CopilotConversation>> ListConversationsAsync();
        Task SaveConversationAsync(CopilotConversation conversation);
        Task DeleteConversationAsync(string conversationId);
    }

    public interface IAiProvider
    {
        string ProviderName { get; }
        Task<string> GenerateResponseAsync(string systemPrompt, string userPrompt, AiDataPrivacyConfig privacyConfig);
    }

    public interface ICopilotService
    {
        Task<CopilotMessage> ProcessMessageAsync(string conversationId, string userMessage, string companyId, string companyName);
        Task<object> ExecuteApprovedPlanAsync(string conversationId, string planId, string companyId);
        Task<CopilotConversation> ClearOrSwitchCompanyContextAsync(string conversationId, string newCompanyId, string newCompanyName);
    }
}
