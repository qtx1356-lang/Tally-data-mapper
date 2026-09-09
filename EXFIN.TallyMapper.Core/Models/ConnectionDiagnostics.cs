using System;

namespace EXFIN.TallyMapper.Core.Models
{
    public class ConnectionDiagnostics
    {
        public string Host { get; set; } = "localhost";
        public int Port { get; set; } = 9000;
        public bool DnsResolved { get; set; }
        public string ResolvedIp { get; set; } = string.Empty;
        public bool HttpAvailable { get; set; }
        public int HttpStatusCode { get; set; }
        public long ResponseTimeMs { get; set; }
        public bool TallyDetected { get; set; }
        public string DetectedVersion { get; set; } = string.Empty;
        public bool CompanyDetected { get; set; }
        public string CurrentCompany { get; set; } = string.Empty;

        // Capability statuses ("✓ Tested & Available", "? Not tested", "? Not detected")
        public string OdbcCapabilityStatus { get; set; } = "? Not tested";
        public string XmlCapabilityStatus { get; set; } = "? Not tested";
        public string JsonCapabilityStatus { get; set; } = "? Not detected";
        public string TdlCapabilityStatus { get; set; } = "? Not tested";

        public string TechnicalDetails { get; set; } = string.Empty;
        public string LastError { get; set; } = string.Empty;
        public DateTime CheckedAt { get; set; } = DateTime.Now;

        public string ToSafeDiagnosticReport()
        {
            return $@"=== EXFIN TALLY DATA MAPPER DIAGNOSTICS ===
Checked At: {CheckedAt:yyyy-MM-dd HH:mm:ss}
Target: {Host}:{Port}
DNS Resolved: {DnsResolved} (IP: {ResolvedIp})
Tally Detected: {TallyDetected}
Detected Version: {(string.IsNullOrEmpty(DetectedVersion) ? "N/A" : DetectedVersion)}
HTTP Connection: {(HttpAvailable ? $"✓ Connected ({ResponseTimeMs} ms)" : "✗ Failed")}
Company Detected: {(CompanyDetected ? $"✓ {CurrentCompany}" : "✗ None")}
ODBC Capability: {OdbcCapabilityStatus}
XML Capability: {XmlCapabilityStatus}
JSON Capability: {JsonCapabilityStatus}
TDL Capability: {TdlCapabilityStatus}
Technical Details: {TechnicalDetails}
Last Error: {(string.IsNullOrEmpty(LastError) ? "None" : LastError)}
=========================================";
        }
    }
}
