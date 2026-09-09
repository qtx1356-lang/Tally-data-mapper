using System;

namespace EXFIN.TallyMapper.Core.Models
{
    public class TallyConnectionOptions
    {
        public string Host { get; set; } = "localhost";
        public int Port { get; set; } = 9000;
        public int TimeoutSeconds { get; set; } = 10;
        public bool AutoConnect { get; set; } = true;
        public bool AutoDetectCompany { get; set; } = true;

        public string BaseUrl => $"http://{Host}:{Port}";

        public bool IsValidPort => Port >= 1 && Port <= 65535;
        public bool IsValidHost => !string.IsNullOrWhiteSpace(Host);
    }
}
