using System.Collections.Generic;

namespace EXFIN.TallyMapper.Discovery.Models
{
    public class DiscoveryField
    {
        public string Id { get; set; } = string.Empty;
        public string CollectionId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string DataType { get; set; } = "String"; // String, Integer, Decimal, Boolean, Date, DateTime, Null, Unknown
        public bool IsNullable { get; set; } = true;
        public List<string> SampleValues { get; set; } = new();
        public string Description { get; set; } = "Description unavailable.";
        public string Source { get; set; } = "Tally ODBC";
        public bool IsCalculated { get; set; } = false;
    }
}
