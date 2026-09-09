using System;
using System.ComponentModel.DataAnnotations;

namespace EXFIN.TallyMapper.Database.Entities
{
    public class ExportHistoryEntity
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string? ProfileId { get; set; }
        public string MappingId { get; set; } = string.Empty;
        public string MappingName { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExportedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Completed";
        public string OutputFormat { get; set; } = "Excel";
        public string FilePath { get; set; } = string.Empty;
        public int RecordsRead { get; set; }
        public int RecordsWritten { get; set; }
        public int RecordCount { get; set; }
        public int ErrorCount { get; set; }
        public int WarningCount { get; set; }
        public long FileSize { get; set; }
        public string? FileHash { get; set; }
        public double DurationSeconds { get; set; }
        public long DurationMs { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
