using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Services;
using Xunit;

namespace EXFIN.TallyMapper.Tests
{
    public class Phase20EnterpriseAutomationTests
    {
        private readonly EnterpriseAutomationService _service;

        public Phase20EnterpriseAutomationTests()
        {
            _service = new EnterpriseAutomationService();
        }

        [Fact]
        public async Task EvaluateRuleGroup_WithGreaterThanCondition_MatchesExpected()
        {
            // Arrange
            var group = new RuleGroup
            {
                Combinator = RuleCombinator.And,
                Conditions = new List<RuleCondition>
                {
                    new RuleCondition
                    {
                        Dataset = "SalesVoucherSummary",
                        Metric = "TotalSalesAmount",
                        Operator = RuleOperator.GreaterThan,
                        ThresholdValue = 2000000.0
                    }
                }
            };

            var contextValues = new Dictionary<string, object>
            {
                { "TotalSalesAmount", 2500000.0 }
            };

            // Act
            var result = await _service.EvaluateRuleGroupAsync(group, "COMP_EXFIN_01", contextValues);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task EvaluateRuleGroup_WithBetweenCondition_MatchesExpectedRange()
        {
            // Arrange
            var group = new RuleGroup
            {
                Combinator = RuleCombinator.And,
                Conditions = new List<RuleCondition>
                {
                    new RuleCondition
                    {
                        Dataset = "PnLSummary",
                        Metric = "GrossMarginPercentage",
                        Operator = RuleOperator.Between,
                        ThresholdValue = 15.0,
                        SecondaryThresholdValue = 25.0
                    }
                }
            };

            var inRangeContext = new Dictionary<string, object> { { "GrossMarginPercentage", 19.5 } };
            var outOfRangeContext = new Dictionary<string, object> { { "GrossMarginPercentage", 12.0 } };

            // Act & Assert
            Assert.True(await _service.EvaluateRuleGroupAsync(group, "COMP_EXFIN_01", inRangeContext));
            Assert.False(await _service.EvaluateRuleGroupAsync(group, "COMP_EXFIN_01", outOfRangeContext));
        }

        [Fact]
        public async Task SegregationOfDuties_CreatorCannotApproveOwnRequest()
        {
            // Arrange
            var auto = await _service.SaveAutomationAsync(new AutomationDefinition
            {
                Name = "Executive Digest",
                CompanyId = "COMP_EXFIN_01",
                Owner = "john.doe@exfin.internal"
            }, "john.doe@exfin.internal");

            var approvalReq = await _service.CreateApprovalRequestAsync(auto.AutomationId, "john.doe@exfin.internal", "FinanceManager", "Needs approval for distribution");

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _service.ApproveRequestAsync(approvalReq.ApprovalId, "john.doe@exfin.internal", "FinanceManager", "Self approval attempted");
            });
        }

        [Fact]
        public async Task ProcessMetricAlert_DeduplicatesAlertsInSamePeriod()
        {
            // Arrange
            var ruleId = "RULE_DEDUP_TEST_01";
            var companyId = "COMP_EXFIN_01";
            var metric = "OverdueAmount";
            var period = "2026-08";

            // Act: First trigger
            var alert1 = await _service.ProcessMetricAlertAsync(ruleId, "Overdue Rule", companyId, metric, 600000.0, 500000.0, AlertSeverity.High, period);

            // Act: Second trigger in same period
            var alert2 = await _service.ProcessMetricAlertAsync(ruleId, "Overdue Rule", companyId, metric, 650000.0, 500000.0, AlertSeverity.High, period);

            // Assert: Same alert ID returned, actual value updated
            Assert.Equal(alert1.AlertId, alert2.AlertId);
            Assert.Equal(650000.0, alert2.ActualValue);
        }

        [Fact]
        public async Task CreateDraftFromCopilot_AlwaysCreatesDraftStatus()
        {
            // Arrange
            var prompt = "Send me sales every evening at 6 PM";

            // Act
            var draft = await _service.CreateDraftFromCopilotAsync(prompt, "COMP_EXFIN_01", "user@exfin.internal");

            // Assert
            Assert.Equal(AutomationStatus.Draft, draft.Status);
            Assert.Contains("sales", draft.Name, StringComparison.OrdinalIgnoreCase);
            Assert.Equal(ScheduleFrequency.Daily, draft.Schedule.Frequency);
        }

        [Fact]
        public async Task ExecuteAutomationDryRun_DoesNotSendActualEmails()
        {
            // Arrange
            var auto = await _service.SaveAutomationAsync(new AutomationDefinition
            {
                Name = "Dry Run Test Automation",
                CompanyId = "COMP_EXFIN_01",
                Action = new ActionConfig
                {
                    ActionType = "GenerateAndEmailReport",
                    ReportName = "Test Sales",
                    Recipients = new List<RecipientConfig> { new RecipientConfig { Email = "test@exfin.internal" } }
                }
            }, "admin@exfin.internal");

            // Act
            var exec = await _service.ExecuteAutomationDryRunAsync(auto.AutomationId);

            // Assert
            Assert.Equal(0, exec.NotificationsSent);
            Assert.Contains("Simulation", exec.Status);
            Assert.NotEmpty(exec.DeliveryLog);
        }
    }
}
