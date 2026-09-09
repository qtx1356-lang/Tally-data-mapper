namespace EXFIN.TallyMapper.Discovery.Models
{
    public class DiscoveryRelationship
    {
        public string Id { get; set; } = string.Empty;
        public string FromCollection { get; set; } = string.Empty;
        public string FromField { get; set; } = string.Empty;
        public string ToCollection { get; set; } = string.Empty;
        public string ToField { get; set; } = string.Empty;
        public string RelationshipType { get; set; } = "Discovered"; // Discovered vs Inferred
    }
}
