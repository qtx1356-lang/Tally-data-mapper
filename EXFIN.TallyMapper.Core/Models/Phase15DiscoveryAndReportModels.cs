using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum OutputCategory
    {
        Accounting,
        Sales,
        Purchase,
        Inventory,
        GST,
        Receivables,
        Payables,
        Banking,
        Payroll,
        Statutory,
        Masters,
        Transactions,
        Custom,
        TDL,
        Unknown
    }

    public enum DiscoveredDataType
    {
        String,
        Integer,
        Decimal,
        Boolean,
        Date,
        DateTime,
        Currency,
        Quantity,
        Percentage,
        ObjectReference,
        Collection
    }

    public enum MappingConfidenceLevel
    {
        High,
        Medium,
        Low,
        Unmapped
    }

    public enum PerformanceEstimateTier
    {
        Small,
        Medium,
        Large
    }

    public enum ReportExportFormat
    {
        Excel,
        Csv,
        Pdf,
        Json
    }

    public class DiscoveryOptions
    {
        public string CompanyId { get; set; } = string.Empty;
        public string TallyHost { get; set; } = "localhost";
        public int TallyPort { get; set; } = 9000;
        public bool DiscoverTdlOutputs { get; set; } = true;
        public bool SampleFieldData { get; set; } = true;
        public int FieldSampleLimit { get; set; } = 25;
        public bool ForceRefresh { get; set; } = false;
    }

    public class DiscoveryExecutionReport
    {
        public string DiscoveryId { get; set; } = Guid.NewGuid().ToString();
        public string CompanyName { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = string.Empty;
        public string Status { get; set; } = "Complete"; // Complete, Partial, Failed
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public int ObjectsDiscovered { get; set; }
        public int CollectionsDiscovered { get; set; }
        public int FieldsDiscovered { get; set; }
        public int ReportsDiscovered { get; set; }
        public int CustomOutputsDiscovered { get; set; }
        public int MappedOutputsCount { get; set; }
        public int UnmappedOutputsCount { get; set; }
        public decimal MappingCoveragePercentage { get; set; }
        public List<string> Warnings { get; set; } = new List<string>();
        public List<string> DiscoveredCapabilities { get; set; } = new List<string>();
    }

    public class DiscoveredOutputItem
    {
        public string OutputId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public OutputCategory Category { get; set; }
        public string Source { get; set; } = "Standard Tally"; // Standard Tally, Custom TDL, Unknown
        public string ObjectType { get; set; } = string.Empty;
        public int FieldCount { get; set; }
        public string Availability { get; set; } = "Available";
        public string Company { get; set; } = string.Empty;
        public DateTime DiscoveryDate { get; set; }
        public string SchemaVersion { get; set; } = "1.0";
        public MappingConfidenceLevel MappingStatus { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class DiscoveredObjectDefinition
    {
        public string ObjectId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string CollectionName { get; set; } = string.Empty;
        public string PrimaryKeyField { get; set; } = string.Empty;
        public int TotalFields { get; set; }
        public bool IsCustomOrTdl { get; set; }
        public List<string> Relationships { get; set; } = new List<string>();
        public List<DiscoveredFieldDefinition> Fields { get; set; } = new List<DiscoveredFieldDefinition>();
    }

    public class DiscoveredFieldDefinition
    {
        public string FieldName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public DiscoveredDataType DataType { get; set; }
        public bool Nullable { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Object { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string Collection { get; set; } = string.Empty;
        public string ExampleValue { get; set; } = string.Empty;
        public string Availability { get; set; } = "Available";
        public string SemanticConcept { get; set; } = string.Empty;
        public MappingConfidenceLevel Confidence { get; set; } = MappingConfidenceLevel.High;
        public bool RequiresHumanConfirmation { get; set; }
    }

    public class FieldSampleResult
    {
        public string FieldName { get; set; } = string.Empty;
        public string ObjectName { get; set; } = string.Empty;
        public int RowCount { get; set; }
        public List<object?> SampleRows { get; set; } = new List<object?>();
        public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    }

    public class TdlOutputDescriptor
    {
        public string TdlIdentifier { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ExposedType { get; set; } = "Report"; // Field, Method, Collection, Report
        public string SafetyClassification { get; set; } = "Verified Read-Only";
        public string ParentObject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ObjectRelationshipGraph
    {
        public List<GraphNode> Nodes { get; set; } = new List<GraphNode>();
        public List<GraphEdge> Edges { get; set; } = new List<GraphEdge>();
    }

    public class GraphNode
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int FieldCount { get; set; }
        public bool IsCustom { get; set; }
    }

    public class GraphEdge
    {
        public string Source { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
        public string RelationshipType { get; set; } = "One-To-Many";
        public string JoinKey { get; set; } = string.Empty;
        public bool HasCartesianRisk { get; set; }
    }

    public class OutputAvailabilityMatrix
    {
        public List<MatrixRow> Rows { get; set; } = new List<MatrixRow>();
    }

    public class MatrixRow
    {
        public string ItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = "Standard Report"; // Standard Report, Collection, Object, Field, Custom Output
        public bool IsAvailable { get; set; }
        public bool IsMapped { get; set; }
        public bool IsQueryable { get; set; }
        public bool IsExportable { get; set; }
        public bool RequiresPermission { get; set; }
    }

    public class SchemaSnapshot
    {
        public string SnapshotId { get; set; } = Guid.NewGuid().ToString();
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string SchemaVersion { get; set; } = "1.0";
        public string SignatureHash { get; set; } = string.Empty;
        public int TotalObjects { get; set; }
        public int TotalFields { get; set; }
    }

    public class SchemaDiffResult
    {
        public string SnapshotIdA { get; set; } = string.Empty;
        public string SnapshotIdB { get; set; } = string.Empty;
        public List<string> AddedFields { get; set; } = new List<string>();
        public List<string> RemovedFields { get; set; } = new List<string>();
        public List<string> ChangedFields { get; set; } = new List<string>();
        public List<string> ImpactedReports { get; set; } = new List<string>();
        public string SummaryDescription { get; set; } = string.Empty;
    }

    public class VisualQueryDefinition
    {
        public string QueryId { get; set; } = Guid.NewGuid().ToString();
        public string QueryName { get; set; } = "New Custom Query";
        public string PrimaryObject { get; set; } = "Voucher";
        public List<string> SelectedFields { get; set; } = new List<string>();
        public List<QueryFilterCondition> Filters { get; set; } = new List<QueryFilterCondition>();
        public string FilterLogicalOperator { get; set; } = "AND";
        public List<string> GroupByFields { get; set; } = new List<string>();
        public List<QueryAggregationRule> Aggregations { get; set; } = new List<QueryAggregationRule>();
        public List<QuerySortRule> SortRules { get; set; } = new List<QuerySortRule>();
        public List<CalculatedFieldRule> CalculatedFields { get; set; } = new List<CalculatedFieldRule>();
        public int LimitRows { get; set; } = 100;
    }

    public class QueryFilterCondition
    {
        public string FieldName { get; set; } = string.Empty;
        public string Operator { get; set; } = "="; // =, !=, <, >, <=, >=, CONTAINS, STARTS WITH, ENDS WITH, IS EMPTY, IS NOT EMPTY, IN, BETWEEN
        public string Value { get; set; } = string.Empty;
        public string SecondValue { get; set; } = string.Empty; // for BETWEEN
    }

    public class QueryAggregationRule
    {
        public string FieldName { get; set; } = string.Empty;
        public string Function { get; set; } = "SUM"; // SUM, COUNT, MIN, MAX, AVERAGE
        public string OutputAlias { get; set; } = string.Empty;
    }

    public class QuerySortRule
    {
        public string FieldName { get; set; } = string.Empty;
        public string Direction { get; set; } = "ASC"; // ASC, DESC
    }

    public class CalculatedFieldRule
    {
        public string OutputFieldName { get; set; } = string.Empty;
        public string SafeExpression { get; set; } = string.Empty;
        public string OutputDataType { get; set; } = "Decimal";
    }

    public class QueryValidationResult
    {
        public bool IsValid { get; set; } = true;
        public List<string> ValidationErrors { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
    }

    public class QueryPerformanceEstimate
    {
        public PerformanceEstimateTier EstimatedTier { get; set; } = PerformanceEstimateTier.Small;
        public string Description { get; set; } = string.Empty;
        public int EstimatedRowCount { get; set; }
        public int EstimatedExecutionTimeMs { get; set; }
    }

    public class QueryExecutionResult
    {
        public string QueryId { get; set; } = string.Empty;
        public List<string> Columns { get; set; } = new List<string>();
        public List<Dictionary<string, object?>> Rows { get; set; } = new List<Dictionary<string, object?>>();
        public int TotalRowCount { get; set; }
        public int ExecutionDurationMs { get; set; }
        public string Explanation { get; set; } = string.Empty;
    }

    public class SavedQueryRecord
    {
        public string QueryId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Version { get; set; } = 1;
        public VisualQueryDefinition Definition { get; set; } = new VisualQueryDefinition();
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class NlToQueryTranslationResult
    {
        public string OriginalPrompt { get; set; } = string.Empty;
        public VisualQueryDefinition GeneratedQuery { get; set; } = new VisualQueryDefinition();
        public string ExplanationOfChoices { get; set; } = string.Empty;
        public List<string> SelectedConcepts { get; set; } = new List<string>();
        public string DiffVsPrevious { get; set; } = string.Empty;
    }

    public class ReportDefinitionRecord
    {
        public string ReportId { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = "Untitled Report";
        public string Description { get; set; } = string.Empty;
        public string SavedQueryId { get; set; } = string.Empty;
        public List<ReportSectionDefinition> Sections { get; set; } = new List<ReportSectionDefinition>();
        public List<ReportParameterDefinition> Parameters { get; set; } = new List<ReportParameterDefinition>();
        public int Version { get; set; } = 1;
    }

    public class ReportSectionDefinition
    {
        public string SectionType { get; set; } = "Table"; // Header, Filters, Summary, Table, Charts, Footer
        public string Title { get; set; } = string.Empty;
        public Dictionary<string, object> Properties { get; set; } = new Dictionary<string, object>();
    }

    public class ReportParameterDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string ParameterType { get; set; } = "Date"; // Date, Company, String, Number, MultiSelect
        public string DefaultValue { get; set; } = string.Empty;
    }

    public class TemplateExportBundle
    {
        public string FormatVersion { get; set; } = "1.0.0";
        public string FileType { get; set; } = ".exfinreport";
        public ReportDefinitionRecord Report { get; set; } = new ReportDefinitionRecord();
        public VisualQueryDefinition Query { get; set; } = new VisualQueryDefinition();
        public List<string> RequiredCapabilities { get; set; } = new List<string>();
        public List<string> RequiredFields { get; set; } = new List<string>();
        public DateTime ExportedAt { get; set; } = DateTime.UtcNow;
    }

    public class TemplateImportResult
    {
        public string CompatibilityStatus { get; set; } = "Compatible"; // Compatible, Partially Compatible, Incompatible
        public List<string> MissingFields { get; set; } = new List<string>();
        public Dictionary<string, List<string>> SuggestedRemappings { get; set; } = new Dictionary<string, List<string>>();
    }

    public class DataLineageTrace
    {
        public string OutputColumn { get; set; } = string.Empty;
        public string CalculatedFormula { get; set; } = string.Empty;
        public List<string> SemanticFields { get; set; } = new List<string>();
        public List<string> TallySourceFields { get; set; } = new List<string>();
        public string TallyObject { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
    }

    public class SemanticMappingProfile
    {
        public string ProfileId { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "Default Mapping Profile";
        public string Company { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = string.Empty;
        public string SchemaVersion { get; set; } = "1.0";
        public Dictionary<string, string> FieldMappings { get; set; } = new Dictionary<string, string>();
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SemanticMappingCandidate
    {
        public string SourceField { get; set; } = string.Empty;
        public string SuggestedConcept { get; set; } = string.Empty;
        public MappingConfidenceLevel Confidence { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class MappingValidationSummary
    {
        public int TotalMapped { get; set; }
        public int TotalMissing { get; set; }
        public int TotalChanged { get; set; }
        public int TotalAmbiguous { get; set; }
        public List<string> MissingSourceFields { get; set; } = new List<string>();
    }

    public class ReportExportJobResult
    {
        public string JobId { get; set; } = Guid.NewGuid().ToString();
        public string Status { get; set; } = "Completed";
        public int RowsProcessed { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
    }

    public class OutputCategoryFilter
    {
        public OutputCategory? Category { get; set; }
        public string? SearchTerm { get; set; }
        public bool? OnlyTdl { get; set; }
        public bool? OnlyUnmapped { get; set; }
    }
}
