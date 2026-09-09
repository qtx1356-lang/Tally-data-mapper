namespace EXFIN.TallyMapper.Tally.Models
{
    public class TallyCapabilities
    {
        public bool IsTallyDetected { get; set; }
        public bool SupportsHttp { get; set; }
        public bool? SupportsXml { get; set; }
        public bool? SupportsJson { get; set; }
        public bool? SupportsOdbc { get; set; }
        public bool? SupportsTdl { get; set; }
        public string TallyVersion { get; set; } = string.Empty;
        public string ServerName { get; set; } = string.Empty;
        public int Port { get; set; } = 9000;
    }
}
