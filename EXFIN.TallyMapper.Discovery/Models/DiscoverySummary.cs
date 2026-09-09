using System;

namespace EXFIN.TallyMapper.Discovery.Models
{
    public class DiscoverySummary
    {
        public int CollectionsDiscovered { get; set; }
        public int FieldsDiscovered { get; set; }
        public int ObjectsDiscovered { get; set; }
        public DateTime? LastScanTime { get; set; }
        public string ActiveCompany { get; set; } = string.Empty;
    }
}
