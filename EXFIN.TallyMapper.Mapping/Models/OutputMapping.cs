using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Mapping.Models
{
    public class OutputMapping
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SourceCollection { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string Version { get; set; } = "1.0.0";
        public List<OutputMappingField> Fields { get; set; } = new();
        public List<string> Filters { get; set; } = new();
        public List<string> Transformations { get; set; } = new();
        public Dictionary<string, string> OutputConfiguration { get; set; } = new();
    }
}
