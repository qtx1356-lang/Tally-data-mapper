using System;
using System.ComponentModel.DataAnnotations;

namespace EXFIN.TallyMapper.Database.Entities
{
    public class ExportProfileEntity
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string MappingId { get; set; } = string.Empty;
        public string MappingName { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string Format { get; set; } = "Excel";
        public string DestinationPath { get; set; } = string.Empty;
        public string OptionsJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsEnabled { get; set; } = true;
        public DateTime? LastExportAt { get; set; }
        public string? LastStatus { get; set; }
        public int MappingVersion { get; set; } = 1;
    }
}
