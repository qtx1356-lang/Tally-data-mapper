using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IAutomationEngine
    {
        bool IsRunning { get; }
        Task StartAsync(CancellationToken cancellationToken = default);
        Task StopAsync(CancellationToken cancellationToken = default);
        Task<JobExecutionResult> TriggerJobNowAsync(string jobId, string triggerReason = "Manual");
        Task<SystemAutomationStatus> GetSystemStatusAsync();
        event EventHandler<JobExecutionEventArgs> JobExecuted;
    }

    public class SystemAutomationStatus
    {
        public bool SchedulerRunning { get; set; }
        public bool TaskSchedulerInstalled { get; set; }
        public int ActiveJobsCount { get; set; }
        public int RunningJobsCount { get; set; }
        public int FailedJobsCount { get; set; }
        public string LastJobStatus { get; set; }
        public DateTime? LastJobTime { get; set; }
        public string NextJobName { get; set; }
        public DateTime? NextJobTime { get; set; }
    }

    public class JobExecutionEventArgs : EventArgs
    {
        public string JobId { get; set; }
        public string JobName { get; set; }
        public string Status { get; set; }
        public DateTime ExecutedAt { get; set; }
    }
}
