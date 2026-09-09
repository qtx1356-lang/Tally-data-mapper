using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public class DocumentPrintSettings
    {
        public string PaperSize { get; set; } = "A4"; // A4, Letter, Legal
        public string Orientation { get; set; } = "Landscape"; // Portrait, Landscape
        public string MarginPreset { get; set; } = "Normal"; // Normal, Narrow, Wide
        public bool ShowHeader { get; set; } = true;
        public bool ShowFooter { get; set; } = true;
        public string HeaderText { get; set; } = "EXFIN Financial Intelligence Report";
        public string FooterText { get; set; } = "Confidential - For Internal Use Only";
        public bool IncludePageNumbers { get; set; } = true;
        public string CompanyLogoUrl { get; set; }
        public string WatermarkText { get; set; }
        public string PrimaryColorHex { get; set; } = "#0284c7";
    }

    public class ReportSchedule
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string ReportOrPackageId { get; set; }
        public bool IsPackage { get; set; }
        public string TargetName { get; set; }
        public string ScheduleType { get; set; } = "Daily"; // Daily, Weekly, Monthly, Cron
        public string CronExpression { get; set; } = "0 9 * * *";
        public string TimeOfDay { get; set; } = "09:00";
        public List<string> DaysOfWeek { get; set; } = new List<string> { "Monday" };
        public int DayOfMonth { get; set; } = 1;
        public bool Enabled { get; set; } = true;
        public List<string> RecipientEmails { get; set; } = new List<string>();
        public string ExportFormat { get; set; } = "PDF"; // PDF, Excel, CSV, PackageBundle
        public string EmailSubject { get; set; }
        public string EmailBody { get; set; }
        public DateTime? LastRunAt { get; set; }
        public DateTime? NextRunAt { get; set; }
        public string LastStatus { get; set; } = "Pending";
    }

    public class ScheduleDeliveryLog
    {
        public string Id { get; set; }
        public string ScheduleId { get; set; }
        public string ScheduleName { get; set; }
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Success"; // Success, Failed, Retrying
        public int RecipientCount { get; set; }
        public string AttachmentFormat { get; set; }
        public string Details { get; set; }
        public int ExecutionTimeMs { get; set; }
    }

    public class ScheduleExecutionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public ScheduleDeliveryLog Log { get; set; }
    }

    public class ReportPackageSection
    {
        public string Id { get; set; }
        public string ReportId { get; set; }
        public string ReportTitle { get; set; }
        public string CustomTitle { get; set; }
        public string ExecutiveNotes { get; set; }
        public int Order { get; set; }
        public bool IncludeCoverPageBreak { get; set; } = true;
    }

    public class ReportPackageDefinition
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public string Description { get; set; }
        public string CompanyName { get; set; }
        public string PreparedBy { get; set; }
        public string PeriodLabel { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string CoverLogoUrl { get; set; }
        public DocumentPrintSettings PrintSettings { get; set; } = new DocumentPrintSettings();
        public List<ReportPackageSection> Sections { get; set; } = new List<ReportPackageSection>();
    }
}
