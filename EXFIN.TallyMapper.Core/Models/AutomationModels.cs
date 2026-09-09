using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum JobStatus
    {
        Enabled,
        Disabled,
        Running,
        Completed,
        CompletedWithWarnings,
        Failed,
        WaitingForRetry,
        Cancelled,
        CompanyMismatch,
        ConfigurationError,
        Interrupted
    }

    public enum ScheduleType
    {
        Once,
        Daily,
        Weekly,
        Monthly,
        SpecificDate,
        Interval
    }

    public enum MonthlyScheduleType
    {
        Day1,
        Day15,
        LastDay,
        CustomDay
    }

    public enum BackoffStrategy
    {
        Fixed,
        Linear,
        Exponential
    }

    public enum ErrorClassification
    {
        Transient,
        Permanent,
        Configuration,
        Authentication,
        CompanyMismatch,
        Data,
        Filesystem,
        Unknown
    }

    public enum AttachmentPolicy
    {
        NoAttachment,
        AttachIfSmall,
        AlwaysAttach
    }

    public enum MissedJobPolicy
    {
        RunOnStartup,
        Skip
    }

    public class JobSchedule
    {
        public string Id { get; set; }
        public ScheduleType Type { get; set; } = ScheduleType.Daily;
        public string Time { get; set; } = "19:00";
        public List<int> DaysOfWeek { get; set; } = new List<int> { 1, 2, 3, 4, 5 };
        public MonthlyScheduleType MonthlyType { get; set; } = MonthlyScheduleType.Day1;
        public int MonthlyDay { get; set; } = 1;
        public string SpecificDate { get; set; }
        public int IntervalMinutes { get; set; } = 60;
        public string TimeZone { get; set; } = "India Standard Time";
    }

    public class RetryPolicy
    {
        public string Id { get; set; }
        public int MaxAttempts { get; set; } = 3;
        public int InitialDelaySeconds { get; set; } = 60;
        public BackoffStrategy BackoffStrategy { get; set; } = BackoffStrategy.Exponential;
    }

    public class NotificationConfiguration
    {
        public string Id { get; set; }
        public bool EnableInApp { get; set; } = true;
        public bool EnableEmail { get; set; }
        public List<string> EmailRecipients { get; set; } = new List<string>();
        public bool NotifyOnSuccess { get; set; } = true;
        public bool NotifyOnWarning { get; set; } = true;
        public bool NotifyOnFailure { get; set; } = true;
        public AttachmentPolicy AttachmentPolicy { get; set; } = AttachmentPolicy.NoAttachment;
        public int MaxAttachmentMb { get; set; } = 10;
    }

    public class AutomationJob
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string MappingId { get; set; }
        public string MappingName { get; set; }
        public string ExportProfileId { get; set; }
        public string ExportProfileName { get; set; }
        public string CompanyId { get; set; }
        public string CompanyName { get; set; }
        public string ScheduleId { get; set; }
        public JobSchedule Schedule { get; set; } = new JobSchedule();
        public bool IsEnabled { get; set; } = true;
        public JobStatus Status { get; set; } = JobStatus.Enabled;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastRunAt { get; set; }
        public DateTime? NextRunAt { get; set; }
        public string RetryPolicyId { get; set; }
        public RetryPolicy RetryPolicy { get; set; } = new RetryPolicy();
        public string NotificationConfigurationId { get; set; }
        public NotificationConfiguration NotificationConfiguration { get; set; } = new NotificationConfiguration();
        public MissedJobPolicy MissedJobPolicy { get; set; } = MissedJobPolicy.Skip;
        public int MappingVersion { get; set; } = 1;
        public int ExportProfileVersion { get; set; } = 1;
        public bool TaskSchedulerInstalled { get; set; }
    }

    public class JobExecution
    {
        public string Id { get; set; }
        public string JobId { get; set; }
        public string JobName { get; set; }
        public string CompanyId { get; set; }
        public string CompanyName { get; set; }
        public string MappingId { get; set; }
        public string MappingName { get; set; }
        public string ExportProfileId { get; set; }
        public string ExportProfileName { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public JobStatus Status { get; set; }
        public long RecordsRead { get; set; }
        public long RecordsWritten { get; set; }
        public int Warnings { get; set; }
        public int Errors { get; set; }
        public long DurationMs { get; set; }
        public string DestinationPath { get; set; }
        public string ErrorMessage { get; set; }
        public ErrorClassification? ErrorCategory { get; set; }
        public int Attempts { get; set; } = 1;
        public int MappingVersion { get; set; } = 1;
        public int ExportProfileVersion { get; set; } = 1;
        public List<string> Logs { get; set; } = new List<string>();
    }
}
