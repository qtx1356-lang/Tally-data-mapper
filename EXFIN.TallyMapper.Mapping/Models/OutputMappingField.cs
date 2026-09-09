namespace EXFIN.TallyMapper.Mapping.Models
{
    public class OutputMappingField
    {
        public string Id { get; set; } = System.Guid.NewGuid().ToString();
        public string MappingId { get; set; } = string.Empty;
        public string SourcePath { get; set; } = string.Empty;
        public string OutputName { get; set; } = string.Empty;
        public string OutputDataType { get; set; } = "String";
        public string Expression { get; set; } = string.Empty; // Transformations e.g., TRIM, UPPER
        public int SortOrder { get; set; }
        public bool IsRequired { get; set; } = false;
        public string DefaultValue { get; set; } = string.Empty;
    }
}
