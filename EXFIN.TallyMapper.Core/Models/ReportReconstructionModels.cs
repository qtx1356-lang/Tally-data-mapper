using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum ReportClassification
    {
        Standard,
        Custom,
        TDL,
        Derived,
        Unknown
    }

    public enum ReportReconstructionStatus
    {
        Discovered,
        PartiallyDiscovered,
        Mapped,
        Reconstructed,
        PartiallyReconstructed,
        Unavailable,
        RequiresManualMapping
    }

    public enum ReportLineageConfidence
    {
        Confirmed,
        High,
        Medium,
        Low
    }

    public enum ParityLevel
    {
        Exact,
        NearExact,
        StructuralMatch,
        DataMatch,
        Partial,
        Unknown
    }

    public enum CalculationStatus
    {
        FormulaDiscovered,
        FormulaInferred,
        ValueOnly,
        Unknown
    }

    public enum ParameterType
    {
        Text,
        Number,
        Date,
        DateRange,
        Boolean,
        SingleSelect,
        MultiSelect,
        ObjectReference
    }

    public enum ReportRowType
    {
        DataRow,
        Subtotal,
        GrandTotal,
        Header,
        Footer,
        Separator,
        CalculatedRow,
        GroupRow
    }

    public enum DifferenceClassification
    {
        SourceDifference,
        MappingDifference,
        CalculationDifference,
        RoundingDifference,
        FormattingDifference,
        MissingColumn,
        ExtraColumn,
        RowDifference,
        OrderingDifference,
        GroupingDifference,
        Unknown
    }

    public class ReportParameterDefinition
    {
        public string ParameterName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public ParameterType Type { get; set; }
        public bool IsRequired { get; set; }
        public object? DefaultValue { get; set; }
        public List<string> AllowedValues { get; set; } = new();
        public string ValidationRules { get; set; } = string.Empty;
        public string TargetQueryField { get; set; } = string.Empty;
        public ReportLineageConfidence MappingConfidence { get; set; }
    }

    public class ReportColumnDefinition
    {
        public string ColumnName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string SourceField { get; set; } = string.Empty;
        public string SourceObject { get; set; } = string.Empty;
        public string SourceCollection { get; set; } = string.Empty;
        public string DataType { get; set; } = "string";
        public int Width { get; set; } = 120;
        public string Format { get; set; } = string.Empty;
        public bool IsVisible { get; set; } = true;
        public int DisplayOrder { get; set; }
        public string? ColumnGroup { get; set; }
        public CalculationStatus CalculationStatus { get; set; } = CalculationStatus.ValueOnly;
        public string? CalculationFormula { get; set; }
        public ReportLineageConfidence LineageConfidence { get; set; } = ReportLineageConfidence.Confirmed;
    }

    public class ReportCoverageMetric
    {
        public double StructureCoveragePct { get; set; }
        public double FieldCoveragePct { get; set; }
        public double DataCoveragePct { get; set; }
        public double CalculationCoveragePct { get; set; }
        public string SummaryNotes { get; set; } = string.Empty;
    }

    public class ReconstructedReportDefinition
    {
        public string ReportId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = "Accounting";
        public string Source { get; set; } = "TallyPrime 4.1 Native Discovery";
        public ReportClassification Type { get; set; } = ReportClassification.Standard;
        public ReportReconstructionStatus Status { get; set; } = ReportReconstructionStatus.Reconstructed;
        public string CompanyId { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = "TallyPrime 4.1";
        public string SchemaVersion { get; set; } = "1.0.0";
        public string DiscoveryVersion { get; set; } = "1.0.0";
        public string ReconstructionVersion { get; set; } = "1.0.0";
        public DateTime DiscoveredAt { get; set; } = DateTime.UtcNow;
        public DateTime LastReconstructedAt { get; set; } = DateTime.UtcNow;

        public List<ReportParameterDefinition> Parameters { get; set; } = new();
        public List<ReportColumnDefinition> Columns { get; set; } = new();
        public List<string> UnderlyingCollections { get; set; } = new();
        public List<string> UnderlyingObjects { get; set; } = new();
        public ReportCoverageMetric Coverage { get; set; } = new();
        public List<string> ReconstructionLimitations { get; set; } = new();
        public bool IsCloned { get; set; }
        public string? SourceTallyReportId { get; set; }
        public bool IsFavorite { get; set; }
        public bool IsPinned { get; set; }
    }

    public class ParityDimensionCheck
    {
        public string Dimension { get; set; } = string.Empty;
        public object TallyValue { get; set; } = string.Empty;
        public object ExfinValue { get; set; } = string.Empty;
        public bool IsMatched { get; set; }
        public DifferenceClassification DifferenceType { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class ParityTestResult
    {
        public string TestId { get; set; } = string.Empty;
        public string ReportId { get; set; } = string.Empty;
        public string ReportName { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
        public ParityLevel OverallParity { get; set; }
        public double NumericToleranceAllowed { get; set; } = 0.01;
        public bool ControlTotalsMatched { get; set; }
        public decimal TallyControlTotal { get; set; }
        public decimal ExfinControlTotal { get; set; }
        public decimal VarianceAmount { get; set; }
        public List<ParityDimensionCheck> DimensionChecks { get; set; } = new();
        public List<string> IdentifiedDifferences { get; set; } = new();
        public string VerificationSummary { get; set; } = string.Empty;
    }

    public class TdlStaticAnalysisResult
    {
        public string AnalysisId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public int TotalLinesOfCode { get; set; }
        public List<string> DiscoveredReports { get; set; } = new();
        public List<string> DiscoveredCollections { get; set; } = new();
        public List<string> DiscoveredForms { get; set; } = new();
        public List<string> DiscoveredParts { get; set; } = new();
        public List<string> DiscoveredLines { get; set; } = new();
        public List<string> DiscoveredFields { get; set; } = new();
        public List<string> DiscoveredVariables { get; set; } = new();
        public List<string> DiscoveredMethods { get; set; } = new();
        public bool ContainsExecutableRisk { get; set; }
        public string SecurityAuditStatus { get; set; } = "Sandboxed: No Executable Payload Allowed";
    }
}
