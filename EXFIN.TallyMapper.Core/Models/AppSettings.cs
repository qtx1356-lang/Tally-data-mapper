namespace EXFIN.TallyMapper.Core.Models
{
    public class AppSettings
    {
        public string TallyHost { get; set; } = "localhost";
        public int TallyPort { get; set; } = 9000;
        public int ConnectionTimeoutSeconds { get; set; } = 10;
        public bool AutoConnect { get; set; } = true;
        public bool AutoDetectCompany { get; set; } = true;
        public string LastSelectedCompanyName { get; set; } = string.Empty;
        public string LastSelectedCompanyGuid { get; set; } = string.Empty;
        public string OdbcConnectionMethod { get; set; } = "Auto"; // Auto, DSN, ConnectionString
        public string OdbcDsn { get; set; } = "TallyODBC64_9000";
        public string OdbcConnectionString { get; set; } = "Driver={Tally ODBC Driver};Server=localhost;Port=9000;";
        public bool OdbcAutoConnect { get; set; } = true;
        public int PreviewRecordLimit { get; set; } = 100;
        public string DefaultExportDirectory { get; set; } = string.Empty;
        public string LogLevel { get; set; } = "Information";
        public string Theme { get; set; } = "Dark";
    }
}
