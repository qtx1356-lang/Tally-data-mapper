using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum AutomationStatus
    {
        Draft,
        Active,
        Paused,
        Disabled,
        Failed,
        Archived
    }

    public enum TriggerType
    {
        Scheduled,
        DataRefreshCompleted,
        Threshold,
        ChangeDetected,
        ReportGenerated,
        Manual,
        ApplicationEvent
    }

    public enum ScheduleFrequency
    {
        Hourly,
        Daily,
        Weekly,
        Monthly,
        Custom
    }

    public enum StaleDataPolicy
    {
        SendAnyway,
        Warn,
        Skip,
        RequireApproval
    }

    public enum DeliveryChannel
    {
        Email,
        DesktopNotification,
        InAppNotification,
        FileExport,
        Webhook
    }

    public enum AlertSeverity
    {
        Info,
        Low,
        Medium,
        High,
        Critical
    }

    public enum AlertLifecycleStatus
    {
        Triggered,
        Acknowledged,
        Investigating,
        Resolved,
        Closed
    }

    public enum ApprovalStatus
    {
        Pending,
        Approved,
        Rejected,
        Expired,
        Cancelled
    }

    public enum DataClassification
    {
        Public,
        Internal,
        Confidential,
        Restricted
    }

    public enum RuleOperator
    {
        Equals,
        NotEquals,
        GreaterThan,
        GreaterThanOrEqual,
        LessThan,
        LessThanOrEqual,
        In,
        NotIn,
        Contains,
        Between
    }

    public enum RuleCombinator
    {
        And,
        Or,
        Not
    }

    public enum HolidayHandlingPolicy
    {
        Run,
        Skip,
        NextBusinessDay
    }

    public class ScheduleConfig
    {
        public ScheduleFrequency Frequency { get; set; } = ScheduleFrequency.Daily;
        public string CronExpression { get; set; } = "0 18 * * *"; // 6:00 PM
        public string Timezone { get; set; } = "Asia/Kolkata";
        public TimeSpan RunTime { get; set; } = new TimeSpan(18, 0, 0);
        public List<DayOfWeek> RunDays { get; set; } = new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        public int DayOfMonth { get; set; } = 1;
        public HolidayHandlingPolicy HolidayPolicy { get; set; } = HolidayHandlingPolicy.NextBusinessDay;
        public bool RespectQuietHours { get; set; } = true;
        public TimeSpan QuietHoursStart { get; set; } = new TimeSpan(22, 0, 0);
        public TimeSpan QuietHoursEnd { get; set; } = new TimeSpan(7, 0, 0);
        public bool CriticalOverrideQuietHours { get; set; } = true;
    }

    public class RuleCondition
    {
        public string ConditionId { get; set; } = Guid.NewGuid().ToString("N");
        public string Dataset { get; set; } = "SalesVoucherSummary";
        public string Metric { get; set; } = "TotalSalesAmount";
        public RuleOperator Operator { get; set; } = RuleOperator.LessThan;
        public object ThresholdValue { get; set; } = 100000.0;
        public object SecondaryThresholdValue { get; set; } // for Between
        public string Unit { get; set; } = "INR";
        public string Period { get; set; } = "CurrentMonth";
        public string ComparisonPeriod { get; set; } = "PreviousMonth";
        public bool IsPercentageChange { get; set; } = false;
        public double? PercentageThreshold { get; set; }
    }

    public class RuleGroup
    {
        public RuleCombinator Combinator { get; set; } = RuleCombinator.And;
        public List<RuleCondition> Conditions { get; set; } = new List<RuleCondition>();
        public List<RuleGroup> SubGroups { get; set; } = new List<RuleGroup>();
    }

    public class RecipientConfig
    {
        public string RecipientId { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "FinanceManager"; // e.g., All Managers, CEO
        public DeliveryChannel Channel { get; set; } = DeliveryChannel.Email;
        public bool IsGroupOrRole { get; set; } = false;
    }

    public class ActionConfig
    {
        public string ActionType { get; set; } = "GenerateAndEmailReport"; // GenerateAndEmailReport, TriggerAlert, ExportFile
        public string ReportId { get; set; } = "RPT_MONTHLY_SALES";
        public string ReportName { get; set; } = "Monthly Sales Analysis Report";
        public string ExportFormat { get; set; } = "PDF"; // PDF, XLSX, CSV
        public bool IncludeAiExecutiveSummary { get; set; } = true;
        public bool RequireWatermark { get; set; } = true;
        public string WatermarkText { get; set; } = "CONFIDENTIAL - EXFIN AUTO GENERATED";
        public DataClassification Classification { get; set; } = DataClassification.Confidential;
        public string EmailSubjectTemplate { get; set; } = "[EXFIN Alert] {{report}} - {{company}} ({{period}})";
        public string EmailBodyTemplate { get; set; } = "Attached is the automated {{report}} for {{company}} for {{period}}. Key metric {{metric}}: {{value}} (Change: {{change}}).";
        public List<RecipientConfig> Recipients { get; set; } = new List<RecipientConfig>();
    }

    public class ApprovalConfig
    {
        public bool RequiresApproval { get; set; } = false;
        public bool SegregationOfDuties { get; set; } = true; // Creator cannot approve
        public string RequiredApproverRole { get; set; } = "FinancialController";
        public List<string> DesignatedApprovers { get; set; } = new List<string>();
        public TimeSpan ExpirationTimeSpan { get; set; } = TimeSpan.FromHours(24);
        public bool IsSequentialMultiLevel { get; set; } = false;
        public List<string> MultiLevelRoles { get; set; } = new List<string> { "FinanceManager", "CFO" };
    }

    public class AutomationDefinition
    {
        public string AutomationId { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "COMP_EXFIN_01";
        public string CompanyName { get; set; } = "EXFIN GLOBAL ENTERPRISES PVT LTD";
        public TriggerType Trigger { get; set; } = TriggerType.Scheduled;
        public ScheduleConfig Schedule { get; set; } = new ScheduleConfig();
        public RuleGroup ConditionGroup { get; set; } = new RuleGroup();
        public ActionConfig Action { get; set; } = new ActionConfig();
        public ApprovalConfig Approval { get; set; } = new ApprovalConfig();
        public StaleDataPolicy StalePolicy { get; set; } = StaleDataPolicy.Warn;
        public AutomationStatus Status { get; set; } = AutomationStatus.Active;
        public string Owner { get; set; } = "admin@exfin.internal";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int Version { get; set; } = 1;
        public int MaxTriggersPerDay { get; set; } = 10;
        public string DeduplicationKeyTemplate { get; set; } = "{{automationId}}_{{period}}";
    }

    public class AutomationSnapshotMetadata
    {
        public string CompanyId { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public string DatasetVersion { get; set; } = "v2.4.0-parquet";
        public string ReportVersion { get; set; } = "v1.2.0";
        public string MappingVersion { get; set; } = "v3.1.0";
        public string CalculationVersion { get; set; } = "v1.0.0-deterministic";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class AutomationExecutionRecord
    {
        public string ExecutionId { get; set; } = Guid.NewGuid().ToString("N");
        public string AutomationId { get; set; } = string.Empty;
        public string AutomationName { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public double DurationMs { get; set; }
        public TriggerType TriggerType { get; set; }
        public string TriggerReason { get; set; } = string.Empty;
        public string Status { get; set; } = "Success"; // Success, Failed, Blocked, Skipped, PendingApproval
        public int RecordsEvaluated { get; set; }
        public bool ConditionMatched { get; set; }
        public string ConditionSummary { get; set; } = string.Empty;
        public int NotificationsSent { get; set; }
        public string ErrorCategory { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public bool CanRetry { get; set; } = false;
        public AutomationSnapshotMetadata Snapshot { get; set; } = new AutomationSnapshotMetadata();
        public List<string> DeliveryLog { get; set; } = new List<string>();
        public string LineageTrace { get; set; } = string.Empty;
    }

    public class ApprovalRequestRecord
    {
        public string ApprovalId { get; set; } = Guid.NewGuid().ToString("N");
        public string AutomationId { get; set; } = string.Empty;
        public string AutomationName { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string RequestedBy { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public string ApproverRole { get; set; } = "FinanceManager";
        public string AssignedApprover { get; set; } = string.Empty;
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public string Decision { get; set; } = string.Empty;
        public DateTime? DecisionAt { get; set; }
        public string Comments { get; set; } = string.Empty;
        public string ReportSummary { get; set; } = string.Empty;
        public string RecipientsSummary { get; set; } = string.Empty;
        public string PotentialImpact { get; set; } = "Distribution of confidential monthly executive sales digest to 4 recipients.";
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
    }

    public class AlertRecord
    {
        public string AlertId { get; set; } = Guid.NewGuid().ToString("N");
        public string RuleId { get; set; } = string.Empty;
        public string RuleName { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public AlertSeverity Severity { get; set; } = AlertSeverity.Medium;
        public AlertLifecycleStatus LifecycleStatus { get; set; } = AlertLifecycleStatus.Triggered;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string MetricName { get; set; } = string.Empty;
        public double ActualValue { get; set; }
        public double ThresholdValue { get; set; }
        public string Unit { get; set; } = "INR";
        public string Period { get; set; } = string.Empty;
        public string DeduplicationKey { get; set; } = string.Empty;
        public int EscalationLevel { get; set; } = 1; // 1, 2, 3
        public string AssignedTo { get; set; } = "Finance Team";
        public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
        public DateTime? AcknowledgedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? MutedUntil { get; set; }
        public string ResolutionComment { get; set; } = string.Empty;
        public bool IsMuted => MutedUntil.HasValue && MutedUntil.Value > DateTime.UtcNow;
    }

    public class InAppNotificationRecord
    {
        public string NotificationId { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public AlertSeverity Severity { get; set; } = AlertSeverity.Info;
        public string Source { get; set; } = "AutomationEngine";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
        public bool IsRead => ReadAt.HasValue;
        public string ActionUrl { get; set; } = string.Empty;
    }

    public class KpiTargetModel
    {
        public string KpiId { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } = string.Empty;
        public string Metric { get; set; } = string.Empty;
        public string Dataset { get; set; } = string.Empty;
        public string Period { get; set; } = "Monthly";
        public double TargetValue { get; set; }
        public double WarningThreshold { get; set; }
        public double CriticalThreshold { get; set; }
        public double CurrentValue { get; set; }
        public double PreviousValue { get; set; }
        public string Status { get; set; } = "On Target"; // On Target, Warning, Critical, Unavailable
        public double VariancePercentage => PreviousValue != 0 ? ((CurrentValue - PreviousValue) / Math.Abs(PreviousValue)) * 100.0 : 0.0;
    }

    public class BusinessMonitoringDashboardData
    {
        public int ActiveAutomationsCount { get; set; }
        public int SuccessfulRunsCount { get; set; }
        public int FailedRunsCount { get; set; }
        public int PendingApprovalsCount { get; set; }
        public int ActiveAlertsCount { get; set; }
        public int ScheduledReportsCount { get; set; }
        public DateTime? LastExecutionTime { get; set; }
        public bool IsTallyConnected { get; set; } = true;
        public DateTime LastTallySync { get; set; } = DateTime.UtcNow.AddMinutes(-12);
        public int SyncErrorsCount { get; set; } = 0;
        public int ParityErrorsCount { get; set; } = 0;
        public List<KpiTargetModel> Kpis { get; set; } = new List<KpiTargetModel>();
        public List<AlertRecord> RecentAlerts { get; set; } = new List<AlertRecord>();
        public List<AutomationExecutionRecord> RecentExecutions { get; set; } = new List<AutomationExecutionRecord>();
    }
}
