using System.Collections.Generic;

namespace EXFIN.TallyMapper.Discovery.Models
{
    public class DiscoveryCollection
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Source { get; set; } = "Tally ODBC"; // Discovered, Inferred, Application-Defined
        public string Description { get; set; } = string.Empty;
        public string ObjectType { get; set; } = string.Empty;
        public List<DiscoveryField> Fields { get; set; } = new();
        public List<string> Methods { get; set; } = new();
        public bool IsQueryable { get; set; } = true;
        public bool IsExportable { get; set; } = true;
    }
}
