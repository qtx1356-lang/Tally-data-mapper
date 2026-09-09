using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public class CopilotQueryFilter
    {
        public string Field { get; set; }
        public string Operator { get; set; } // EQUALS, CONTAINS, GREATER_THAN, LESS_THAN, BETWEEN, IN
        public string Value { get; set; }
        public string SecondValue { get; set; } // For BETWEEN
        public string RawExpression { get; set; }
    }

    public class CopilotQueryPlan
    {
        public string PlanId { get; set; } = Guid.NewGuid().ToString("N");
        public string Intent { get; set; } // SalesByCustomer, TopProducts, UnpaidBalances, MonthlySales, Comparison, Custom
        public string HumanDescription { get; set; }
        public string TargetCollection { get; set; }
        public List<string> SelectFields { get; set; } = new List<string>();
        public List<CopilotQueryFilter> Filters { get; set; } = new List<CopilotQueryFilter>();
        public List<string> GroupByFields { get; set; } = new List<string>();
        public string SortByField { get; set; }
        public string SortOrder { get; set; } = "DESC"; // ASC, DESC
        public string AggregationType { get; set; } = "SUM"; // SUM, COUNT, AVG, MIN, MAX
        public string AggregationField { get; set; }
        public int RowLimit { get; set; } = 100;
        public string PeriodLabel { get; set; } // e.g. "This Financial Year", "01-Apr-2026 to 31-Mar-2027"
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string CompanyId { get; set; }
        public string CompanyName { get; set; }
        public string SchemaSnapshotId { get; set; }
        public string ConfidenceLevel { get; set; } = "High"; // High, Medium, Low
        public bool IsComparison { get; set; } = false;
        public CopilotQueryPlan SecondaryPeriodPlan { get; set; } // For comparative queries
    }

    public class CopilotReportPlan
    {
        public string ReportId { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; }
        public string Description { get; set; }
        public CopilotQueryPlan PrimaryQueryPlan { get; set; }
        public List<string> DisplayColumns { get; set; } = new List<string>();
        public List<string> TotalColumns { get; set; } = new List<string>();
        public string RecommendedChartType { get; set; } // Bar, Line, Donut, KPI, None
        public string RecommendedChartXAxis { get; set; }
        public string RecommendedChartYAxis { get; set; }
        public string Format { get; set; } = "PDF"; // PDF, Excel, CSV
    }

    public class CopilotDashboardComponentPlan
    {
        public string ComponentId { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; }
        public string ComponentType { get; set; } // KPI, BarChart, LineChart, DonutChart, Table
        public CopilotQueryPlan QueryPlan { get; set; }
    }

    public class CopilotDashboardPlan
    {
        public string DashboardId { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; }
        public string CompanyName { get; set; }
        public List<CopilotDashboardComponentPlan> Components { get; set; } = new List<CopilotDashboardComponentPlan>();
    }

    public class CopilotToolCall
    {
        public string ToolName { get; set; } // DiscoverCollections, DiscoverFields, FindFields, InspectSample, BuildQuery, ValidateQuery, ExecuteQuery, BuildReport, ValidateReport, ExecuteReport, ExportReport, ReconcileReport
        public Dictionary<string, object> Arguments { get; set; } = new Dictionary<string, object>();
    }

    public class CopilotToolResult
    {
        public string ToolName { get; set; }
        public bool Success { get; set; }
        public string Output { get; set; }
        public object StructuredData { get; set; }
    }

    public class CopilotAmbiguityOption
    {
        public string OptionId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public CopilotQueryPlan AssociatedPlan { get; set; }
    }

    public class CopilotAmbiguityPrompt
    {
        public string Question { get; set; }
        public List<CopilotAmbiguityOption> Options { get; set; } = new List<CopilotAmbiguityOption>();
    }

    public class CopilotMessage
    {
        public string MessageId { get; set; } = Guid.NewGuid().ToString("N");
        public string Sender { get; set; } // User, Copilot, System
        public string Content { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public CopilotQueryPlan ProposedQueryPlan { get; set; }
        public CopilotReportPlan ProposedReportPlan { get; set; }
        public CopilotDashboardPlan ProposedDashboardPlan { get; set; }
        public CopilotAmbiguityPrompt AmbiguityPrompt { get; set; }
        public List<CopilotToolCall> ExecutedToolCalls { get; set; } = new List<CopilotToolCall>();
        public object QueryResultData { get; set; }
        public string Explanation { get; set; }
        public string Confidence { get; set; } = "High"; // High, Medium, Low
        public bool RequiresConfirmation { get; set; } = false;
        public string ActionType { get; set; } // None, QueryPreview, ReportCreated, DashboardCreated, ExportTriggered, EmailAutomationProposed, RepairProposed
    }

    public class CopilotConversation
    {
        public string ConversationId { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; } = "New Conversation";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string ActiveCompanyId { get; set; }
        public string ActiveCompanyName { get; set; } = "EXFIN GLOBAL ENTERPRISES PVT LTD";
        public List<CopilotMessage> Messages { get; set; } = new List<CopilotMessage>();
    }

    public class CopilotPermissionConfig
    {
        public bool CanReadSchema { get; set; } = true;
        public bool CanPreviewQuery { get; set; } = true;
        public bool CanExecuteQuery { get; set; } = true;
        public bool CanCreateReport { get; set; } = true;
        public bool CanExport { get; set; } = true;
        public bool CanCreateAutomation { get; set; } = false; // Requires explicit confirmation
        public bool CanSendEmail { get; set; } = false; // Requires explicit confirmation
    }

    public class AiDataPrivacyConfig
    {
        public string Mode { get; set; } = "SchemaOnly"; // SchemaOnly, SchemaAndSamples, QueryResults, OfflineNoAi
        public bool AllowExternalAiSharing { get; set; } = true;
        public bool MaskSensitiveFieldsBeforeAi { get; set; } = true;
    }
}
