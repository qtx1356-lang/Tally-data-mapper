using System;
using System.ComponentModel.DataAnnotations;

namespace EXFIN.TallyMapper.Database.Entities
{
    public class MappingEntity
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SourceCollection { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string Version { get; set; } = "1.0";
        public string JsonData { get; set; } = "{}";
    }
}
