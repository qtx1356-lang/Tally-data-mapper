using System;
using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Models
{
    public class OutputMappingField
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string MappingId { get; set; } = string.Empty;
        public string SourcePath { get; set; } = string.Empty; // e.g. Voucher.Party.Name or Voucher.Date
        public string SourceEntity { get; set; } = string.Empty; // e.g. Voucher
        public string OutputName { get; set; } = string.Empty; // e.g. Customer Name
        public FieldDataType OutputDataType { get; set; } = FieldDataType.String;
        public int Ordinal { get; set; }
        public string? Expression { get; set; }
        public TransformationType Transformation { get; set; } = TransformationType.None;
        public string? TransformationParameter { get; set; } // Format string, substring indices, concat template, etc.
        public string? DefaultValue { get; set; }
        public bool IsRequired { get; set; }
        public bool IsVisible { get; set; } = true;
        public OneToManyHandling OneToManyStrategy { get; set; } = OneToManyHandling.ExpandRows;
        public AggregationType Aggregation { get; set; } = AggregationType.None;
        public string? ConcatSeparator { get; set; } = ", ";
    }

    public class FilterRule
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string FieldPath { get; set; } = string.Empty;
        public FilterOperator Operator { get; set; } = FilterOperator.Equals;
        public string Value { get; set; } = string.Empty;
        public string? SecondValue { get; set; } // For BETWEEN
        public List<string> InValues { get; set; } = new List<string>(); // For IN operator
        public bool IsParameter { get; set; }
        public string? ParameterName { get; set; }
    }

    public class FilterGroup
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public FilterLogicalGroup LogicalOperator { get; set; } = FilterLogicalGroup.AND;
        public List<FilterRule> Rules { get; set; } = new List<FilterRule>();
        public List<FilterGroup> SubGroups { get; set; } = new List<FilterGroup>();
    }

    public class MappingParameter
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public FieldDataType DataType { get; set; } = FieldDataType.String;
        public string? DefaultValue { get; set; }
        public string? CurrentValue { get; set; }
    }

    public class OutputConfiguration
    {
        public OneToManyHandling DefaultOneToManyHandling { get; set; } = OneToManyHandling.ExpandRows;
        public ErrorRowHandling ErrorStrategy { get; set; } = ErrorRowHandling.ContinueAndReport;
        public bool IsPortableTemplate { get; set; } = true;
        public int MaxPreviewRows { get; set; } = 100;
        public string? TargetCompanyId { get; set; }
    }

    public class OutputMapping
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public string SourceEntity { get; set; } = string.Empty;
        public string? SourceCollection { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int Version { get; set; } = 1;
        public MappingStatus Status { get; set; } = MappingStatus.Draft;
        public List<OutputMappingField> Fields { get; set; } = new List<OutputMappingField>();
        public FilterGroup RootFilter { get; set; } = new FilterGroup();
        public List<MappingParameter> Parameters { get; set; } = new List<MappingParameter>();
        public OutputConfiguration Configuration { get; set; } = new OutputConfiguration();
    }

    public class OutputSchemaColumn
    {
        public string Name { get; set; } = string.Empty;
        public FieldDataType DataType { get; set; } = FieldDataType.String;
        public int Ordinal { get; set; }
        public string SourcePath { get; set; } = string.Empty;
        public TransformationType Transformation { get; set; } = TransformationType.None;
    }

    public class OutputSchema
    {
        public List<OutputSchemaColumn> Columns { get; set; } = new List<OutputSchemaColumn>();
    }

    public class MappingValidationMessage
    {
        public string Level { get; set; } = "Error"; // "Error", "Warning", "Info"
        public string FieldPath { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? SuggestedFix { get; set; }
    }

    public class MappingValidationResult
    {
        public bool IsValid { get; set; } = true;
        public List<MappingValidationMessage> Messages { get; set; } = new List<MappingValidationMessage>();
        public int ErrorCount { get; set; }
        public int WarningCount { get; set; }
        public int InfoCount { get; set; }
    }

    public class RowProcessingError
    {
        public int RowNumber { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string SourcePath { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public string? OriginalValue { get; set; }
    }

    public class MappedDataResult
    {
        public OutputSchema Schema { get; set; } = new OutputSchema();
        public List<Dictionary<string, object?>> Rows { get; set; } = new List<Dictionary<string, object?>>();
        public int TotalRows { get; set; }
        public int SuccessfulRows { get; set; }
        public int ErrorRows { get; set; }
        public List<string> Warnings { get; set; } = new List<string>();
        public List<RowProcessingError> Errors { get; set; } = new List<RowProcessingError>();
        public long ExecutionTimeMs { get; set; }
        public MappingValidationResult Validation { get; set; } = new MappingValidationResult();
    }
}
