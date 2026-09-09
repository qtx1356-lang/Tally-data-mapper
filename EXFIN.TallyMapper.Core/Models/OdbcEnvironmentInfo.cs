using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public class OdbcEnvironmentInfo
    {
        public bool IsDriverDetected { get; set; }
        public bool IsDsnDetected { get; set; }
        public string SelectedMethod { get; set; } = "Auto";
        public string ActiveConnectionString { get; set; } = string.Empty;
        public string ActiveDsn { get; set; } = string.Empty;
        public string StatusMessage { get; set; } = "An appropriate Tally ODBC interface was not detected.";
        public List<string> InstalledDrivers { get; set; } = new List<string>();
        public List<string> UserDsns { get; set; } = new List<string>();
        public List<string> SystemDsns { get; set; } = new List<string>();
    }
}
