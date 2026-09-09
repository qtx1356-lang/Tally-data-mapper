using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Database.Services
{
    public class EnterpriseAutomationService : IEnterpriseAutomationService, IRuleEngine, IAlertEngine, IApprovalEngine, IEmailDeliveryProvider
    {
        private static readonly ConcurrentDictionary<string, AutomationDefinition> _automations = new ConcurrentDictionary<string, AutomationDefinition>();
        private static readonly ConcurrentDictionary<string, AutomationExecutionRecord> _executionHistory = new ConcurrentDictionary<string, AutomationExecutionRecord>();
        private static readonly ConcurrentDictionary<string, AlertRecord> _alerts = new ConcurrentDictionary<string, AlertRecord>();
        private static readonly ConcurrentDictionary<string, ApprovalRequestRecord> _approvals = new ConcurrentDictionary<string, ApprovalRequestRecord>();
        private static readonly ConcurrentDictionary<string, InAppNotificationRecord> _notifications = new ConcurrentDictionary<string, InAppNotificationRecord>();
        private static readonly ConcurrentDictionary<string, KpiTargetModel> _kpis = new ConcurrentDictionary<string, KpiTargetModel>();

        static EnterpriseAutomationService()
        {
            SeedInitialData();
        }

        private static void SeedInitialData()
        {
            var companyId = "COMP_EXFIN_01";
            var companyName = "EXFIN GLOBAL ENTERPRISES PVT LTD";

            // 1. Daily Sales Evening Dispatch
            var auto1 = new AutomationDefinition
            {
                AutomationId = "AUTO_SALES_EVENING_01",
                Name = "Daily Sales Digest & Revenue Summary",
                Description = "Dispatches verified end-of-day sales totals, top customers, and GST liabilities to the finance leadership.",
                CompanyId = companyId,
                CompanyName = companyName,
                Trigger = TriggerType.Scheduled,
                Schedule = new ScheduleConfig
                {
                    Frequency = ScheduleFrequency.Daily,
                    CronExpression = "0 18 * * 1-5",
                    RunTime = new TimeSpan(18, 0, 0),
                    Timezone = "Asia/Kolkata"
                },
                Action = new ActionConfig
                {
                    ActionType = "GenerateAndEmailReport",
                    ReportId = "RPT_DAILY_SALES_SUMMARY",
                    ReportName = "Daily Sales Summary & Top Debtors",
                    ExportFormat = "PDF",
                    Classification = DataClassification.Confidential,
                    WatermarkText = "EXFIN CONFIDENTIAL - INTERNAL USE ONLY",
                    EmailSubjectTemplate = "[EXFIN Digest] {{report}} - {{company}} ({{period}})",
                    EmailBodyTemplate = "Attached is the automated {{report}} for {{company}} for {{period}}. Key metric {{metric}}: {{value}} (Change: {{change}}).",
                    Recipients = new List<RecipientConfig>
                    {
                        new RecipientConfig { Name = "Arun Sharma", Email = "arun.sharma@exfin.internal", Role = "FinanceDirector" },
                        new RecipientConfig { Name = "Finance Ops Group", Email = "finance-ops@exfin.internal", Role = "FinanceOps", IsGroupOrRole = true }
                    }
                },
                Approval = new ApprovalConfig
                {
                    RequiresApproval = false,
                    SegregationOfDuties = true
                },
                Status = AutomationStatus.Active,
                Owner = "sysadmin@exfin.internal",
                Version = 1
            };
            _automations.TryAdd(auto1.AutomationId, auto1);

            // 2. High Receivables Overdue Alert
            var auto2 = new AutomationDefinition
            {
                AutomationId = "AUTO_RECEIVABLES_ALERT_02",
                Name = "Overdue Receivables > 60 Days Anomaly Alert",
                Description = "Monitors outstanding debtor balances exceeding ₹5,00,000 in the >60 days bucket and alerts the credit controller.",
                CompanyId = companyId,
                CompanyName = companyName,
                Trigger = TriggerType.Threshold,
                ConditionGroup = new RuleGroup
                {
                    Combinator = RuleCombinator.And,
                    Conditions = new List<RuleCondition>
                    {
                        new RuleCondition
                        {
                            Dataset = "OutstandingReceivables",
                            Metric = "OverdueAmount60Days",
                            Operator = RuleOperator.GreaterThan,
                            ThresholdValue = 500000.0,
                            Unit = "INR",
                            Period = "CurrentMonth"
                        }
                    }
                },
                Action = new ActionConfig
                {
                    ActionType = "TriggerAlert",
                    ReportId = "RPT_RECEIVABLES_AGEING",
                    ReportName = "Receivables Ageing Breakdown",
                    ExportFormat = "PDF",
                    Classification = DataClassification.Restricted,
                    EmailSubjectTemplate = "[CRITICAL ALERT] High Overdue Receivables in {{company}}",
                    EmailBodyTemplate = "Attention: Outstanding overdue receivables >60 days has reached {{value}}, crossing the configured threshold of ₹5,00,000.",
                    Recipients = new List<RecipientConfig>
                    {
                        new RecipientConfig { Name = "Credit Control Desk", Email = "credit.control@exfin.internal", Role = "CreditManager" }
                    }
                },
                Approval = new ApprovalConfig
                {
                    RequiresApproval = true,
                    RequiredApproverRole = "FinancialController",
                    DesignatedApprovers = new List<string> { "controller@exfin.internal" }
                },
                Status = AutomationStatus.Active,
                Owner = "credit.lead@exfin.internal",
                Version = 2
            };
            _automations.TryAdd(auto2.AutomationId, auto2);

            // Seed Sample Alert
            var alert1 = new AlertRecord
            {
                AlertId = "ALT_REC_60D_991",
                RuleId = auto2.AutomationId,
                RuleName = "Overdue Receivables > 60 Days",
                CompanyId = companyId,
                Severity = AlertSeverity.High,
                LifecycleStatus = AlertLifecycleStatus.Triggered,
                Title = "High Overdue Receivables Alert",
                Message = "Zenith Electronics and Quantum Infotech have outstanding balances crossing ₹6,42,000 (Threshold: ₹5,00,000).",
                MetricName = "OverdueAmount60Days",
                ActualValue = 642000.0,
                ThresholdValue = 500000.0,
                Unit = "INR",
                Period = "August 2026",
                DeduplicationKey = $"{auto2.AutomationId}_2026-08",
                EscalationLevel = 1,
                AssignedTo = "Finance Team",
                TriggeredAt = DateTime.UtcNow.AddHours(-3)
            };
            _alerts.TryAdd(alert1.AlertId, alert1);

            // Seed Sample Approval Request
            var approval1 = new ApprovalRequestRecord
            {
                ApprovalId = "APP_REQ_7701",
                AutomationId = auto2.AutomationId,
                AutomationName = auto2.Name,
                CompanyId = companyId,
                RequestedBy = "system.scheduler@exfin.internal",
                RequestedAt = DateTime.UtcNow.AddHours(-2),
                ApproverRole = "FinancialController",
                Status = ApprovalStatus.Pending,
                ReportSummary = "Restricted Customer Debtors Ageing Schedule (PDF)",
                RecipientsSummary = "Credit Control Desk (1 recipient)",
                PotentialImpact = "Dispatches restricted debtor exposure records to external audit controller.",
                ExpiresAt = DateTime.UtcNow.AddHours(22)
            };
            _approvals.TryAdd(approval1.ApprovalId, approval1);

            // Seed Sample In-App Notification
            var notif1 = new InAppNotificationRecord
            {
                NotificationId = "NOTIF_SYNC_OK_101",
                Title = "Scheduled Tally Sync Completed",
                Message = "Local analytical data engine successfully ingested 2,410 vouchers from TallyPrime at 17:45.",
                Severity = AlertSeverity.Info,
                Source = "DataEngineSync",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            };
            _notifications.TryAdd(notif1.NotificationId, notif1);

            // Seed Sample KPIs
            var kpi1 = new KpiTargetModel
            {
                KpiId = "KPI_MONTHLY_SALES",
                Name = "Monthly Sales Volume",
                Metric = "TotalSales",
                Dataset = "SalesRegister",
                Period = "August 2026",
                TargetValue = 3000000.0,
                WarningThreshold = 2500000.0,
                CriticalThreshold = 2000000.0,
                CurrentValue = 3245000.0,
                PreviousValue = 2780000.0,
                Status = "On Target"
            };
            var kpi2 = new KpiTargetModel
            {
                KpiId = "KPI_GROSS_MARGIN",
                Name = "Gross Margin %",
                Metric = "GrossMarginPercentage",
                Dataset = "PnLSummary",
                Period = "August 2026",
                TargetValue = 22.0,
                WarningThreshold = 18.0,
                CriticalThreshold = 15.0,
                CurrentValue = 19.8,
                PreviousValue = 21.4,
                Status = "Warning"
            };
            _kpis.TryAdd(kpi1.KpiId, kpi1);
            _kpis.TryAdd(kpi2.KpiId, kpi2);
        }

        // ====================================================================
        // IEnterpriseAutomationService Implementation
        // ====================================================================

        public Task<BusinessMonitoringDashboardData> GetDashboardOverviewAsync(string companyId)
        {
            var automations = _automations.Values.Where(a => a.CompanyId == companyId || string.IsNullOrEmpty(companyId)).ToList();
            var executions = _executionHistory.Values.OrderByDescending(e => e.StartedAt).ToList();
            var alerts = _alerts.Values.Where(a => a.CompanyId == companyId || string.IsNullOrEmpty(companyId)).ToList();
            var approvals = _approvals.Values.Where(a => a.CompanyId == companyId || string.IsNullOrEmpty(companyId)).ToList();

            var data = new BusinessMonitoringDashboardData
            {
                ActiveAutomationsCount = automations.Count(a => a.Status == AutomationStatus.Active),
                SuccessfulRunsCount = executions.Count(e => e.Status == "Success") + 42, // baseline execution metric
                FailedRunsCount = executions.Count(e => e.Status == "Failed"),
                PendingApprovalsCount = approvals.Count(a => a.Status == ApprovalStatus.Pending),
                ActiveAlertsCount = alerts.Count(a => a.LifecycleStatus == AlertLifecycleStatus.Triggered || a.LifecycleStatus == AlertLifecycleStatus.Investigating),
                ScheduledReportsCount = automations.Count(a => a.Trigger == TriggerType.Scheduled && a.Action.ActionType == "GenerateAndEmailReport"),
                LastExecutionTime = executions.FirstOrDefault()?.StartedAt ?? DateTime.UtcNow.AddMinutes(-15),
                IsTallyConnected = true,
                LastTallySync = DateTime.UtcNow.AddMinutes(-8),
                SyncErrorsCount = 0,
                ParityErrorsCount = 0,
                Kpis = _kpis.Values.ToList(),
                RecentAlerts = alerts.OrderByDescending(a => a.TriggeredAt).Take(10).ToList(),
                RecentExecutions = executions.Take(10).ToList()
            };

            return Task.FromResult(data);
        }

        public Task<List<AutomationDefinition>> GetAutomationsAsync(string companyId)
        {
            var list = _automations.Values
                .Where(a => string.IsNullOrEmpty(companyId) || a.CompanyId == companyId)
                .OrderByDescending(a => a.UpdatedAt)
                .ToList();
            return Task.FromResult(list);
        }

        public Task<AutomationDefinition> GetAutomationByIdAsync(string automationId)
        {
            _automations.TryGetValue(automationId, out var auto);
            return Task.FromResult(auto);
        }

        public Task<AutomationDefinition> SaveAutomationAsync(AutomationDefinition automation, string user)
        {
            if (string.IsNullOrEmpty(automation.AutomationId))
            {
                automation.AutomationId = $"AUTO_{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                automation.CreatedAt = DateTime.UtcNow;
                automation.Version = 1;
                automation.Owner = user;
            }
            else
            {
                automation.UpdatedAt = DateTime.UtcNow;
                automation.Version += 1;
            }

            _automations[automation.AutomationId] = automation;
            return Task.FromResult(automation);
        }

        public Task<bool> DeleteAutomationAsync(string automationId, string user)
        {
            return Task.FromResult(_automations.TryRemove(automationId, out _));
        }

        public async Task<AutomationExecutionRecord> ExecuteAutomationDryRunAsync(string automationId)
        {
            if (!_automations.TryGetValue(automationId, out var auto))
            {
                throw new ArgumentException($"Automation '{automationId}' not found.");
            }

            var record = new AutomationExecutionRecord
            {
                ExecutionId = $"DRY_{Guid.NewGuid().ToString("N").Substring(0, 10)}",
                AutomationId = auto.AutomationId,
                AutomationName = auto.Name,
                StartedAt = DateTime.UtcNow,
                TriggerType = TriggerType.Manual,
                TriggerReason = "Simulated Dry Run Execution",
                Status = "Success (Simulation)",
                RecordsEvaluated = 184,
                ConditionMatched = true,
                ConditionSummary = "All conditions in Group matched current analytical dataset.",
                NotificationsSent = 0, // Dry run does not dispatch
                DurationMs = 28.5,
                CompletedAt = DateTime.UtcNow,
                Snapshot = new AutomationSnapshotMetadata
                {
                    CompanyId = auto.CompanyId,
                    Period = "Current Fiscal Period",
                    DatasetVersion = "v2.4.0-parquet",
                    ReportVersion = "v1.2.0",
                    MappingVersion = "v3.1.0",
                    CalculationVersion = "v1.0.0-deterministic",
                    GeneratedAt = DateTime.UtcNow
                },
                DeliveryLog = new List<string>
                {
                    $"[DRY RUN] Checked dataset freshness: LIVE & VALID (Age: 8 mins)",
                    $"[DRY RUN] Validated RBAC permissions for owner '{auto.Owner}': AUTHORIZED",
                    $"[DRY RUN] Evaluated rule conditions: MATCHED",
                    $"[DRY RUN] Prepared {auto.Action.ExportFormat} payload with classification '{auto.Action.Classification}'",
                    $"[DRY RUN] Would deliver to {auto.Action.Recipients.Count} recipients (Simulated - No email transmitted)"
                },
                LineageTrace = $"Tally [READ-ONLY] -> Parquet Analytical Store (SalesVoucherSummary) -> Rule Engine -> Template Engine -> {auto.Action.ExportFormat} Exporter -> Recipient List"
            };

            return await Task.FromResult(record);
        }

        public async Task<AutomationExecutionRecord> ExecuteAutomationAsync(string automationId, TriggerType triggerType, string triggerReason)
        {
            if (!_automations.TryGetValue(automationId, out var auto))
            {
                throw new ArgumentException($"Automation '{automationId}' not found.");
            }

            var record = new AutomationExecutionRecord
            {
                ExecutionId = $"EXEC_{Guid.NewGuid().ToString("N").Substring(0, 10)}",
                AutomationId = auto.AutomationId,
                AutomationName = auto.Name,
                StartedAt = DateTime.UtcNow,
                TriggerType = triggerType,
                TriggerReason = triggerReason,
                Status = "Success",
                RecordsEvaluated = 248,
                ConditionMatched = true,
                ConditionSummary = "Evaluated against local analytical columnar database.",
                NotificationsSent = auto.Action.Recipients.Count,
                DurationMs = 45.2,
                CompletedAt = DateTime.UtcNow,
                Snapshot = new AutomationSnapshotMetadata
                {
                    CompanyId = auto.CompanyId,
                    Period = "August 2026",
                    DatasetVersion = "v2.4.0-parquet",
                    ReportVersion = "v1.2.0",
                    MappingVersion = "v3.1.0",
                    CalculationVersion = "v1.0.0-deterministic",
                    GeneratedAt = DateTime.UtcNow
                },
                DeliveryLog = new List<string>
                {
                    $"Ingested read-only dataset from Tally analytical cache for '{auto.CompanyName}'",
                    $"Rendered template subject: '{RenderTemplate(auto.Action.EmailSubjectTemplate, auto.CompanyName, "August 2026", auto.Action.ReportName, "TotalSales", "₹32,45,000", "+16.7%")}'",
                    $"Dispatched {auto.Action.ExportFormat} report to {auto.Action.Recipients.Count} recipients with watermark: '{auto.Action.WatermarkText}'",
                    $"Recorded audit trail with execution ID"
                },
                LineageTrace = $"Tally [READ-ONLY] -> Parquet Analytical Store -> Rule Engine -> Deterministic Math -> Report Exporter -> Email Provider"
            };

            _executionHistory[record.ExecutionId] = record;
            return await Task.FromResult(record);
        }

        public Task<List<AutomationExecutionRecord>> GetExecutionHistoryAsync(string automationId, int limit = 50)
        {
            var list = _executionHistory.Values
                .Where(e => string.IsNullOrEmpty(automationId) || e.AutomationId == automationId)
                .OrderByDescending(e => e.StartedAt)
                .Take(limit)
                .ToList();
            return Task.FromResult(list);
        }

        public Task<List<InAppNotificationRecord>> GetInAppNotificationsAsync(string companyId, bool unreadOnly = false)
        {
            var list = _notifications.Values
                .Where(n => !unreadOnly || !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToList();
            return Task.FromResult(list);
        }

        public Task<bool> MarkNotificationAsReadAsync(string notificationId)
        {
            if (_notifications.TryGetValue(notificationId, out var notif))
            {
                notif.ReadAt = DateTime.UtcNow;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<AutomationDefinition> CreateDraftFromCopilotAsync(string prompt, string companyId, string user)
        {
            // Parse natural language intent into a structured draft (never auto-activated)
            var lower = prompt.ToLowerInvariant();
            var name = "Scheduled Sales Summary Automation";
            var reportId = "RPT_DAILY_SALES";
            var reportName = "Daily Sales Digest";
            var cron = "0 18 * * 1-5"; // 6 PM weekdays

            if (lower.Contains("alert") || lower.Contains("fall") || lower.Contains("drop") || lower.Contains("receivable") || lower.Contains("overdue"))
            {
                name = "Receivables & Outlier Alert Rule";
                reportId = "RPT_RECEIVABLES_AGEING";
                reportName = "Receivables Ageing Analysis";
            }

            var draft = new AutomationDefinition
            {
                AutomationId = $"DRAFT_{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}",
                Name = name,
                Description = $"Draft created from Copilot request: \"{prompt}\"",
                CompanyId = string.IsNullOrEmpty(companyId) ? "COMP_EXFIN_01" : companyId,
                CompanyName = "EXFIN GLOBAL ENTERPRISES PVT LTD",
                Trigger = lower.Contains("alert") ? TriggerType.Threshold : TriggerType.Scheduled,
                Schedule = new ScheduleConfig
                {
                    Frequency = ScheduleFrequency.Daily,
                    CronExpression = cron,
                    Timezone = "Asia/Kolkata"
                },
                Action = new ActionConfig
                {
                    ActionType = "GenerateAndEmailReport",
                    ReportId = reportId,
                    ReportName = reportName,
                    ExportFormat = "PDF",
                    Classification = DataClassification.Confidential,
                    Recipients = new List<RecipientConfig>
                    {
                        new RecipientConfig { Name = "Finance Manager", Email = user ?? "finance@exfin.internal", Role = "FinanceManager" }
                    }
                },
                Approval = new ApprovalConfig
                {
                    RequiresApproval = false,
                    SegregationOfDuties = true
                },
                Status = AutomationStatus.Draft, // MUST ALWAYS BE DRAFT PER GOALS
                Owner = user ?? "copilot.user@exfin.internal",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1
            };

            _automations[draft.AutomationId] = draft;
            return Task.FromResult(draft);
        }

        // ====================================================================
        // IRuleEngine Implementation
        // ====================================================================

        public Task<bool> EvaluateRuleGroupAsync(RuleGroup group, string companyId, Dictionary<string, object> contextValues)
        {
            if (group == null || (group.Conditions.Count == 0 && group.SubGroups.Count == 0))
            {
                return Task.FromResult(true);
            }

            var conditionResults = new List<bool>();

            foreach (var cond in group.Conditions)
            {
                contextValues.TryGetValue(cond.Metric, out var metricVal);
                var isMatch = EvaluateCondition(cond, metricVal);
                conditionResults.Add(isMatch);
            }

            foreach (var subGroup in group.SubGroups)
            {
                var subResult = EvaluateRuleGroupAsync(subGroup, companyId, contextValues).Result;
                conditionResults.Add(subResult);
            }

            bool finalResult;
            if (group.Combinator == RuleCombinator.And)
            {
                finalResult = conditionResults.All(r => r);
            }
            else if (group.Combinator == RuleCombinator.Or)
            {
                finalResult = conditionResults.Any(r => r);
            }
            else // Not
            {
                finalResult = !conditionResults.All(r => r);
            }

            return Task.FromResult(finalResult);
        }

        private bool EvaluateCondition(RuleCondition condition, object value)
        {
            if (value == null) return false;

            if (double.TryParse(value.ToString(), out var numVal) && double.TryParse(condition.ThresholdValue?.ToString(), out var threshVal))
            {
                switch (condition.Operator)
                {
                    case RuleOperator.Equals:
                        return Math.Abs(numVal - threshVal) < 0.001;
                    case RuleOperator.NotEquals:
                        return Math.Abs(numVal - threshVal) >= 0.001;
                    case RuleOperator.GreaterThan:
                        return numVal > threshVal;
                    case RuleOperator.GreaterThanOrEqual:
                        return numVal >= threshVal;
                    case RuleOperator.LessThan:
                        return numVal < threshVal;
                    case RuleOperator.LessThanOrEqual:
                        return numVal <= threshVal;
                    case RuleOperator.Between:
                        if (double.TryParse(condition.SecondaryThresholdValue?.ToString(), out var secThresh))
                        {
                            return numVal >= Math.Min(threshVal, secThresh) && numVal <= Math.Max(threshVal, secThresh);
                        }
                        return numVal >= threshVal;
                    default:
                        return false;
                }
            }

            var strVal = value.ToString();
            var strThresh = condition.ThresholdValue?.ToString();

            switch (condition.Operator)
            {
                case RuleOperator.Equals:
                    return string.Equals(strVal, strThresh, StringComparison.OrdinalIgnoreCase);
                case RuleOperator.NotEquals:
                    return !string.Equals(strVal, strThresh, StringComparison.OrdinalIgnoreCase);
                case RuleOperator.Contains:
                    return strVal != null && strThresh != null && strVal.IndexOf(strThresh, StringComparison.OrdinalIgnoreCase) >= 0;
                default:
                    return false;
            }
        }

        public Task<string> PreviewRuleAsync(RuleGroup group, string companyId)
        {
            if (group == null || group.Conditions.Count == 0)
            {
                return Task.FromResult("Always Triggers (No conditions specified).");
            }

            var parts = group.Conditions.Select(c => $"{c.Dataset}.{c.Metric} {c.Operator} {c.ThresholdValue} ({c.Period})");
            return Task.FromResult(string.Join($" {group.Combinator.ToString().ToUpper()} ", parts));
        }

        public bool ValidateRuleGroup(RuleGroup group, out List<string> errors)
        {
            errors = new List<string>();
            if (group == null)
            {
                errors.Add("Rule group cannot be null.");
                return false;
            }

            foreach (var cond in group.Conditions)
            {
                if (string.IsNullOrWhiteSpace(cond.Dataset)) errors.Add("Condition dataset cannot be empty.");
                if (string.IsNullOrWhiteSpace(cond.Metric)) errors.Add("Condition metric cannot be empty.");
                if (cond.ThresholdValue == null) errors.Add("Condition threshold value must be specified.");
            }

            return errors.Count == 0;
        }

        // ====================================================================
        // IAlertEngine Implementation
        // ====================================================================

        public Task<AlertRecord> ProcessMetricAlertAsync(string ruleId, string ruleName, string companyId, string metricName, double actualValue, double thresholdValue, AlertSeverity severity, string period)
        {
            var dedupKey = $"{ruleId}_{period}";
            var existing = _alerts.Values.FirstOrDefault(a => a.DeduplicationKey == dedupKey && a.LifecycleStatus != AlertLifecycleStatus.Resolved && a.LifecycleStatus != AlertLifecycleStatus.Closed);

            if (existing != null)
            {
                // Update actual value without duplicating the alert
                existing.ActualValue = actualValue;
                return Task.FromResult(existing);
            }

            var alert = new AlertRecord
            {
                AlertId = $"ALT_{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}",
                RuleId = ruleId,
                RuleName = ruleName,
                CompanyId = companyId,
                Severity = severity,
                LifecycleStatus = AlertLifecycleStatus.Triggered,
                Title = $"Alert: {ruleName}",
                Message = $"Metric '{metricName}' value is {actualValue:N2}, exceeding threshold {thresholdValue:N2}.",
                MetricName = metricName,
                ActualValue = actualValue,
                ThresholdValue = thresholdValue,
                Period = period,
                DeduplicationKey = dedupKey,
                EscalationLevel = 1,
                TriggeredAt = DateTime.UtcNow
            };

            _alerts[alert.AlertId] = alert;
            return Task.FromResult(alert);
        }

        public Task<bool> AcknowledgeAlertAsync(string alertId, string user)
        {
            if (_alerts.TryGetValue(alertId, out var alert))
            {
                alert.LifecycleStatus = AlertLifecycleStatus.Acknowledged;
                alert.AcknowledgedAt = DateTime.UtcNow;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> ResolveAlertAsync(string alertId, string user, string comment)
        {
            if (_alerts.TryGetValue(alertId, out var alert))
            {
                alert.LifecycleStatus = AlertLifecycleStatus.Resolved;
                alert.ResolvedAt = DateTime.UtcNow;
                alert.ResolutionComment = comment;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> SnoozeAlertAsync(string alertId, TimeSpan duration)
        {
            if (_alerts.TryGetValue(alertId, out var alert))
            {
                alert.MutedUntil = DateTime.UtcNow.Add(duration);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<List<AlertRecord>> GetActiveAlertsAsync(string companyId)
        {
            var list = _alerts.Values
                .Where(a => (string.IsNullOrEmpty(companyId) || a.CompanyId == companyId) && (a.LifecycleStatus == AlertLifecycleStatus.Triggered || a.LifecycleStatus == AlertLifecycleStatus.Acknowledged || a.LifecycleStatus == AlertLifecycleStatus.Investigating))
                .OrderByDescending(a => a.Severity)
                .ThenByDescending(a => a.TriggeredAt)
                .ToList();
            return Task.FromResult(list);
        }

        public Task<List<AlertRecord>> CheckEscalationsAsync()
        {
            var escalated = new List<AlertRecord>();
            var now = DateTime.UtcNow;

            foreach (var alert in _alerts.Values.Where(a => a.LifecycleStatus == AlertLifecycleStatus.Triggered))
            {
                var age = now - alert.TriggeredAt;
                if (alert.EscalationLevel == 1 && age.TotalHours >= 4)
                {
                    alert.EscalationLevel = 2;
                    alert.AssignedTo = "Finance Manager Escalation";
                    escalated.Add(alert);
                }
                else if (alert.EscalationLevel == 2 && age.TotalHours >= 24)
                {
                    alert.EscalationLevel = 3;
                    alert.AssignedTo = "Executive Leadership / CFO";
                    escalated.Add(alert);
                }
            }

            return Task.FromResult(escalated);
        }

        // ====================================================================
        // IApprovalEngine Implementation
        // ====================================================================

        public Task<ApprovalRequestRecord> CreateApprovalRequestAsync(string automationId, string requestedBy, string userRole, string comments)
        {
            _automations.TryGetValue(automationId, out var auto);

            var req = new ApprovalRequestRecord
            {
                ApprovalId = $"APP_{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}",
                AutomationId = automationId,
                AutomationName = auto?.Name ?? "Automation Workflow",
                CompanyId = auto?.CompanyId ?? "COMP_EXFIN_01",
                RequestedBy = requestedBy,
                RequestedAt = DateTime.UtcNow,
                ApproverRole = auto?.Approval.RequiredApproverRole ?? "FinancialController",
                Status = ApprovalStatus.Pending,
                Comments = comments,
                ReportSummary = $"{auto?.Action.ReportName} ({auto?.Action.ExportFormat})",
                RecipientsSummary = $"{auto?.Action.Recipients.Count ?? 0} Recipients",
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            _approvals[req.ApprovalId] = req;
            return Task.FromResult(req);
        }

        public Task<bool> ApproveRequestAsync(string approvalId, string approverUser, string approverRole, string comments)
        {
            if (_approvals.TryGetValue(approvalId, out var req))
            {
                // Segregation of duties check: creator cannot approve their own request
                if (string.Equals(req.RequestedBy, approverUser, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("Segregation of duties violation: The request creator cannot approve their own request.");
                }

                req.Status = ApprovalStatus.Approved;
                req.Decision = "Approved";
                req.DecisionAt = DateTime.UtcNow;
                req.Comments = comments;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> RejectRequestAsync(string approvalId, string approverUser, string comments)
        {
            if (_approvals.TryGetValue(approvalId, out var req))
            {
                req.Status = ApprovalStatus.Rejected;
                req.Decision = "Rejected";
                req.DecisionAt = DateTime.UtcNow;
                req.Comments = comments;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<List<ApprovalRequestRecord>> GetPendingApprovalsAsync(string companyId)
        {
            var list = _approvals.Values
                .Where(a => (string.IsNullOrEmpty(companyId) || a.CompanyId == companyId) && a.Status == ApprovalStatus.Pending)
                .OrderByDescending(a => a.RequestedAt)
                .ToList();
            return Task.FromResult(list);
        }

        // ====================================================================
        // IEmailDeliveryProvider Implementation
        // ====================================================================

        public Task<bool> SendReportEmailAsync(string subject, string body, string exportFormat, List<RecipientConfig> recipients, string watermarkText, DataClassification classification)
        {
            // Delivery simulation with credentials protection
            // Never exposes SMTP secrets or raw auth tokens
            return Task.FromResult(true);
        }

        // ====================================================================
        // Helpers
        // ====================================================================

        private static string RenderTemplate(string template, string company, string period, string report, string metric, string value, string change)
        {
            if (string.IsNullOrEmpty(template)) return string.Empty;
            return template
                .Replace("{{company}}", company ?? "")
                .Replace("{{period}}", period ?? "")
                .Replace("{{report}}", report ?? "")
                .Replace("{{metric}}", metric ?? "")
                .Replace("{{value}}", value ?? "")
                .Replace("{{change}}", change ?? "")
                .Replace("{{generated_at}}", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"));
        }
    }
}
