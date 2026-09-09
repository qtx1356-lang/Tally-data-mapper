using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IRuleEngine
    {
        Task<bool> EvaluateRuleGroupAsync(RuleGroup group, string companyId, Dictionary<string, object> contextValues);
        Task<string> PreviewRuleAsync(RuleGroup group, string companyId);
        bool ValidateRuleGroup(RuleGroup group, out List<string> errors);
    }

    public interface IAlertEngine
    {
        Task<AlertRecord> ProcessMetricAlertAsync(string ruleId, string ruleName, string companyId, string metricName, double actualValue, double thresholdValue, AlertSeverity severity, string period);
        Task<bool> AcknowledgeAlertAsync(string alertId, string user);
        Task<bool> ResolveAlertAsync(string alertId, string user, string comment);
        Task<bool> SnoozeAlertAsync(string alertId, TimeSpan duration);
        Task<List<AlertRecord>> GetActiveAlertsAsync(string companyId);
        Task<List<AlertRecord>> CheckEscalationsAsync();
    }

    public interface IApprovalEngine
    {
        Task<ApprovalRequestRecord> CreateApprovalRequestAsync(string automationId, string requestedBy, string userRole, string comments);
        Task<bool> ApproveRequestAsync(string approvalId, string approverUser, string approverRole, string comments);
        Task<bool> RejectRequestAsync(string approvalId, string approverUser, string comments);
        Task<List<ApprovalRequestRecord>> GetPendingApprovalsAsync(string companyId);
    }

    public interface IEmailDeliveryProvider
    {
        Task<bool> SendReportEmailAsync(string subject, string body, string exportFormat, List<RecipientConfig> recipients, string watermarkText, DataClassification classification);
    }

    public interface IEnterpriseAutomationService
    {
        Task<BusinessMonitoringDashboardData> GetDashboardOverviewAsync(string companyId);
        Task<List<AutomationDefinition>> GetAutomationsAsync(string companyId);
        Task<AutomationDefinition> GetAutomationByIdAsync(string automationId);
        Task<AutomationDefinition> SaveAutomationAsync(AutomationDefinition automation, string user);
        Task<bool> DeleteAutomationAsync(string automationId, string user);
        Task<AutomationExecutionRecord> ExecuteAutomationDryRunAsync(string automationId);
        Task<AutomationExecutionRecord> ExecuteAutomationAsync(string automationId, TriggerType triggerType, string triggerReason);
        Task<List<AutomationExecutionRecord>> GetExecutionHistoryAsync(string automationId, int limit = 50);
        Task<List<InAppNotificationRecord>> GetInAppNotificationsAsync(string companyId, bool unreadOnly = false);
        Task<bool> MarkNotificationAsReadAsync(string notificationId);
        Task<AutomationDefinition> CreateDraftFromCopilotAsync(string prompt, string companyId, string user);
    }
}
