using System;
using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Models
{
    public class DiscoveryScan
    {
        public int Id { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = "TallyPrime 3.0+";
        public string Build { get; set; } = "Release 3.0.1";
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = "In Progress"; // Started, Running, Completed, CompletedWithWarnings, Failed, Cancelled
        public int CollectionCount { get; set; }
        public int FieldCount { get; set; }
        public int RelationshipCount { get; set; }
        public int ErrorCount { get; set; }
        public string TechnicalDetails { get; set; } = string.Empty;
        public List<string> ScanLogs { get; set; } = new List<string>();
    }

    public class DiscoveryCollection
    {
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty; // Actual ODBC Table/Collection name
        public string DisplayName { get; set; } = string.Empty;
        public SourceType Source { get; set; } = SourceType.ODBC;
        public string ObjectType { get; set; } = "Tally-related"; // Tally-related, System, Unknown
        public CollectionCategory Category { get; set; } = CollectionCategory.Other;
        public CategoryClassification CategoryClassification { get; set; } = CategoryClassification.Inferred;
        public DiscoveryConfidence Confidence { get; set; } = DiscoveryConfidence.Verified;
        public CustomType CustomType { get; set; } = CustomType.Standard;
        public bool IsQueryable { get; set; } = true;
        public bool IsReadable { get; set; } = true;
        public bool IsExpandable { get; set; } = true;
        public int? RecordCount { get; set; }
        public string? Description { get; set; }
        public bool IsFavorite { get; set; }
        public List<DiscoveryField> Fields { get; set; } = new List<DiscoveryField>();
        public List<TallyRelationship> Relationships { get; set; } = new List<TallyRelationship>();
    }

    public class DiscoveryField
    {
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public string Name { get; set; } = string.Empty; // Actual ODBC column name
        public string DisplayName { get; set; } = string.Empty;
        public FieldDataType DataType { get; set; } = FieldDataType.String;
        public bool Nullable { get; set; } = true;
        public int Ordinal { get; set; }
        public SourceType Source { get; set; } = SourceType.ODBC;
        public DiscoveryConfidence Confidence { get; set; } = DiscoveryConfidence.Verified;
        public CustomType CustomType { get; set; } = CustomType.Standard;
        public bool IsOdbcExposed { get; set; } = true;
        public string? Description { get; set; }
        public List<string> SampleValues { get; set; } = new List<string>();
        public List<string> UsageContexts { get; set; } = new List<string>();
    }

    public class TallyMethodDefinition
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ReturnType { get; set; } = "String";
        public SourceType Source { get; set; } = SourceType.TDL;
        public List<string> Parameters { get; set; } = new List<string>();
    }

    public class TallyObjectDefinition
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string ObjectType { get; set; } = "Master";
        public SourceType SourceType { get; set; } = SourceType.TDL;
        public DiscoveryConfidence Confidence { get; set; } = DiscoveryConfidence.Verified;
        public CustomType CustomType { get; set; } = CustomType.Standard;
        public RecognitionStatus RecognitionStatus { get; set; } = RecognitionStatus.Recognized;
        public string? ParentObject { get; set; }
        public List<string> ChildObjects { get; set; } = new List<string>();
        public List<DiscoveryField> Fields { get; set; } = new List<DiscoveryField>();
        public List<TallyMethodDefinition> Methods { get; set; } = new List<TallyMethodDefinition>();
    }

    public class CanonicalFieldPath
    {
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string PathString { get; set; } = string.Empty; // e.g. Voucher.AllInventoryEntries.StockItemName
        public string EntityName { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public FieldDataType DataType { get; set; } = FieldDataType.String;
        public bool IsValid { get; set; } = true;
        public DiscoveryConfidence Confidence { get; set; } = DiscoveryConfidence.Verified;
        public SourceType SourceType { get; set; } = SourceType.TDL;
        public bool IsFavorite { get; set; }
        public List<string> UsageContexts { get; set; } = new List<string>();
    }

    public class TallyRelationship
    {
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string FromEntityId { get; set; } = string.Empty;
        public string ToEntityId { get; set; } = string.Empty;
        public string FromField { get; set; } = string.Empty;
        public string ToField { get; set; } = string.Empty;
        public TallyRelationshipType RelationshipType { get; set; } = TallyRelationshipType.References;
        public CardinalityType Cardinality { get; set; } = CardinalityType.ManyToOne;
        public SourceType SourceType { get; set; } = SourceType.ODBC;
        public DiscoveryConfidence Confidence { get; set; } = DiscoveryConfidence.Verified;
        public string Description { get; set; } = string.Empty;
    }

    public class UnifiedDiscoveryModel
    {
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = "TallyPrime 3.0+";
        public string Build { get; set; } = "Release 3.0.1";
        public DateTime ScanDate { get; set; } = DateTime.UtcNow;
        public int ScanId { get; set; }
        public List<DiscoveryCollection> Collections { get; set; } = new List<DiscoveryCollection>();
        public List<TallyObjectDefinition> Objects { get; set; } = new List<TallyObjectDefinition>();
        public List<TallyRelationship> Relationships { get; set; } = new List<TallyRelationship>();
        public List<CanonicalFieldPath> CanonicalPaths { get; set; } = new List<CanonicalFieldPath>();
        public List<TallyMethodDefinition> Methods { get; set; } = new List<TallyMethodDefinition>();
        public Dictionary<string, int> ConfidenceSummary { get; set; } = new Dictionary<string, int>();
        public List<string> Capabilities { get; set; } = new List<string> { "ODBC", "HTTP", "XML", "TDL" };
    }

    public class ScanDiffResult
    {
        public int ScanAId { get; set; }
        public int ScanBId { get; set; }
        public DateTime? ScanADate { get; set; }
        public DateTime? ScanBDate { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public List<string> AddedCollections { get; set; } = new List<string>();
        public List<string> RemovedCollections { get; set; } = new List<string>();
        public List<string> AddedFields { get; set; } = new List<string>();
        public List<string> RemovedFields { get; set; } = new List<string>();
        public List<string> ChangedTypes { get; set; } = new List<string>();
        public List<string> ChangedRelationships { get; set; } = new List<string>();
    }

    public class UnifiedQueryDefinition
    {
        public string SourceEntity { get; set; } = string.Empty;
        public List<string> Fields { get; set; } = new List<string>();
        public List<string> Joins { get; set; } = new List<string>();
        public List<string> Filters { get; set; } = new List<string>();
        public List<string> Sorts { get; set; } = new List<string>();
        public int Limit { get; set; } = 100;
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
    }

    public class QueryPlan
    {
        public string PlanId { get; set; } = Guid.NewGuid().ToString("N");
        public string TargetConnector { get; set; } = "ODBC";
        public List<string> Operations { get; set; } = new List<string>();
        public bool PostProcessingRequired { get; set; }
        public string TechnicalDetails { get; set; } = string.Empty;
        public bool IsUnsupported { get; set; }
        public string UnsupportedReason { get; set; } = string.Empty;
    }

    public class DiscoveryRelationship : TallyRelationship
    {
        // Legacy alias compatibility
        public string PrimaryCollection { get => FromEntityId; set => FromEntityId = value; }
        public string ForeignCollection { get => ToEntityId; set => ToEntityId = value; }
        public string PrimaryKeyField { get => FromField; set => FromField = value; }
        public string ForeignKeyField { get => ToField; set => ToField = value; }
    }

    public class DiscoveryProgress
    {
        public string Stage { get; set; } = "Initializing";
        public int CollectionsDiscovered { get; set; }
        public int FieldsDiscovered { get; set; }
        public int ErrorCount { get; set; }
        public string CurrentItem { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public bool IsCancelled { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
    }
}

