using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Tally.Models
{
    public enum ConnectionState
    {
        Disconnected,
        Connecting,
        Connected,
        Busy,
        Degraded,
        Error
    }

    public class TallyConnectionProfile
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "Office Tally";
        public string Host { get; set; } = "localhost";
        public int Port { get; set; } = 9000;
        public string Protocol { get; set; } = "HTTP"; // HTTP, HTTPS, ODBC, MOCK
        public string Company { get; set; } = string.Empty;
        public string CompanyContextId { get; set; } = string.Empty;
        public DateTime? LastSuccessfulConnection { get; set; }
        public string DetectedVersion { get; set; } = "Unknown";
        public ConnectionState Status { get; set; } = ConnectionState.Disconnected;
        public bool IsDefault { get; set; } = false;
        public bool AutoConnect { get; set; } = false;
        public int ConnectionTimeoutSeconds { get; set; } = 5;
        public int RequestTimeoutSeconds { get; set; } = 15;
        public int DiscoveryTimeoutSeconds { get; set; } = 60;
        public int ExportTimeoutSeconds { get; set; } = 120;
        public int MaxRetries { get; set; } = 3;
    }

    public class TallyVersionInfo
    {
        public string Product { get; set; } = "TallyPrime";
        public string Version { get; set; } = "4.1";
        public string Build { get; set; } = "Release 4.1 (64-Bit)";
        public string ProtocolCharacteristics { get; set; } = "XML/HTTP port 9000, UTF-8, Read-Only";
        public List<string> DetectedCapabilities { get; set; } = new List<string>();
    }

    public class TallyHealthStatus
    {
        public bool IsConnected { get; set; }
        public long ResponseTimeMs { get; set; }
        public DateTime? LastSuccessfulRequest { get; set; }
        public string StatusMessage { get; set; } = "Healthy";
        public ConnectionState State { get; set; } = ConnectionState.Connected;
    }

    public class TallyReadRequest
    {
        public string RequestId { get; set; } = Guid.NewGuid().ToString();
        public string CorrelationId { get; set; } = Guid.NewGuid().ToString();
        public string TargetObjectOrCollection { get; set; } = string.Empty;
        public string Payload { get; set; } = string.Empty;
        public string CompanyContextId { get; set; } = string.Empty;
        public bool ReadOnlyVerified { get; set; } = true;
    }

    public class NormalizedTallyResponse
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "OK";
        public string CorrelationId { get; set; } = string.Empty;
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
        public List<NormalizedObject> Objects { get; set; } = new List<NormalizedObject>();
        public List<string> Errors { get; set; } = new List<string>();
        public string RawReference { get; set; } = string.Empty;
    }

    public class NormalizedObject
    {
        public string ObjectId { get; set; } = string.Empty;
        public string ObjectType { get; set; } = string.Empty; // Ledger, Voucher, StockItem, etc.
        public string SourcePath { get; set; } = string.Empty;
        public Dictionary<string, NormalizedField> Fields { get; set; } = new Dictionary<string, NormalizedField>();
        public List<NormalizedObject> NestedObjects { get; set; } = new List<NormalizedObject>();
    }

    public class NormalizedField
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Type { get; set; } = "String";
        public object? Value { get; set; }
        public string SourcePath { get; set; } = string.Empty;
        public string ObjectType { get; set; } = string.Empty;
        public string Availability { get; set; } = "Available";
    }

    public class InferredSchema
    {
        public string SchemaVersion { get; set; } = "1.0.0";
        public string SchemaSignature { get; set; } = string.Empty;
        public string CompanyIdentifier { get; set; } = string.Empty;
        public DateTime InferredAt { get; set; } = DateTime.UtcNow;
        public List<InferredFieldDefinition> Fields { get; set; } = new List<InferredFieldDefinition>();
        public List<InferredRelationshipDefinition> Relationships { get; set; } = new List<InferredRelationshipDefinition>();
    }

    public class InferredFieldDefinition
    {
        public string FieldName { get; set; } = string.Empty;
        public string ObjectType { get; set; } = string.Empty;
        public string InferredType { get; set; } = "String";
        public bool IsVariantType { get; set; }
        public double PresencePercentage { get; set; }
        public bool IsSensitive { get; set; }
        public bool IsFinancial { get; set; }
        public bool IsDate { get; set; }
    }

    public class InferredRelationshipDefinition
    {
        public string SourceObject { get; set; } = string.Empty;
        public string SourceField { get; set; } = string.Empty;
        public string TargetObject { get; set; } = string.Empty;
        public string TargetField { get; set; } = string.Empty;
        public string Confidence { get; set; } = "High"; // Confirmed, High, Medium, Low
        public string Cardinality { get; set; } = "ManyToOne";
    }
}
