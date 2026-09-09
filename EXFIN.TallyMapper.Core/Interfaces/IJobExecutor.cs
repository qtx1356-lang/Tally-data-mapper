using System;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IJobExecutor
    {
        Task<JobExecutionResult> ExecuteAsync(AutomationJob job, string triggerReason = "Scheduled", CancellationToken cancellationToken = default);
        Task VerifyCompanySafetyAsync(AutomationJob job, CancellationToken cancellationToken = default);
    }

    public class JobExecutionResult
    {
        public bool Success { get; set; }
        public string Status { get; set; }
        public string ErrorMessage { get; set; }
        public ErrorClassification? ErrorCategory { get; set; }
        public JobExecution ExecutionRecord { get; set; }
    }
}
