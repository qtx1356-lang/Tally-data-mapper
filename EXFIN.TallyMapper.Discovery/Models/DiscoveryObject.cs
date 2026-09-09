using System.Collections.Generic;

namespace EXFIN.TallyMapper.Discovery.Models
{
    public class DiscoveryObject
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ObjectType { get; set; } = string.Empty;
        public List<string> Methods { get; set; } = new();
        public List<DiscoveryField> Fields { get; set; } = new();
    }
}
