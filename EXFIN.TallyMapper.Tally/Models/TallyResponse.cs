namespace EXFIN.TallyMapper.Tally.Models
{
    public class TallyResponse
    {
        public bool Success { get; set; }
        public string Format { get; set; } = "XML"; // "XML", "JSON", "UNKNOWN"
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string RawPreview { get; set; } = string.Empty;
        public object? Data { get; set; }
    }
}
