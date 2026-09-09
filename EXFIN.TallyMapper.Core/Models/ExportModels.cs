using System;
using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum ExportFormat
    {
        Excel,
        Csv,
        Json,
        Xml,
        Sqlite
    }

    public enum ExportJobStatus
    {
        Preparing,
        ValidatingMapping,
        ConnectingToTally,
        ExecutingQuery,
        TransformingRecords,
        WritingOutput,
        Finalizing,
        Completed,
        CompletedWithWarnings,
        Failed,
        Cancelled,
        Incomplete
    }

    public class ExportCapabilities
    {
        public bool SupportsStreaming { get; set; } = true;
        public bool SupportsMultipleSheets { get; set; } = false;
        public bool SupportsHierarchicalData { get; set; } = false;
        public bool RequiresSchema { get; set; } = false;
        public bool SupportsAppend { get; set; } = false;
        public bool SupportsOverwrite { get; set; } = true;
    }

    public class ExcelExportOptions
    {
        public string WorksheetName { get; set; } = "Data";
        public bool IncludeHeaders { get; set; } = true;
        public bool FreezeHeader { get; set; } = true;
        public bool AutoSizeColumns { get; set; } = true;
        public string DateFormat { get; set; } = "yyyy-MM-dd";
        public int DecimalPlaces { get; set; } = 2;
        public string NullRepresentation { get; set; } = string.Empty;
        public int SplitRowsLimit { get; set; } = 1000000;
        public bool MultiSheetChildSupport { get; set; } = false;
    }

    public class CsvExportOptions
    {
        public string Delimiter { get; set; } = ","; // ",", ";", "\t"
        public bool UseUtf8Bom { get; set; } = false;
        public bool IncludeHeaders { get; set; } = true;
        public string QuoteHandling { get; set; } = "Auto"; // "Auto", "AlwaysQuote", "Minimal"
        public string NullRepresentation { get; set; } = string.Empty;
        public string NewlineStyle { get; set; } = "\r\n";
    }

    public class JsonExportOptions
    {
        public string FormatStyle { get; set; } = "MetadataAndData"; // "MetadataAndData", "DataOnly"
        public bool Indented { get; set; } = true;
    }

    public class XmlExportOptions
    {
        public string RootElementName { get; set; } = "ExportData";
        public string RowElementName { get; set; } = "Row";
        public bool IncludeMetadata { get; set; } = true;
        public string NullRepresentation { get; set; } = string.Empty;
    }

    public class SqliteExportOptions
    {
        public string DatabasePath { get; set; } = string.Empty;
        public string TableName { get; set; } = "ExportTable";
        public string OverwriteMode { get; set; } = "Replace"; // "Replace", "Overwrite", "Append"
        public bool CreateDirectoryIfMissing { get; set; } = true;
    }

    public class ExportOptions
    {
        public ExcelExportOptions Excel { get; set; } = new ExcelExportOptions();
        public CsvExportOptions Csv { get; set; } = new CsvExportOptions();
        public JsonExportOptions Json { get; set; } = new JsonExportOptions();
        public XmlExportOptions Xml { get; set; } = new XmlExportOptions();
        public SqliteExportOptions Sqlite { get; set; } = new SqliteExportOptions();

        public string NullRepresentation { get; set; } = string.Empty;
        public string DateFormat { get; set; } = "yyyy-MM-dd";
        public int DecimalPlaces { get; set; } = 2;
        public bool StopOnRowError { get; set; } = false;
        public bool GenerateErrorCsv { get; set; } = true;
        public bool CalculateSha256Hash { get; set; } = true;
        public string OverwritePolicy { get; set; } = "Overwrite"; // "Overwrite", "CreateNewName", "Cancel"
    }

    public class ExportProgressUpdate
    {
        public ExportJobStatus Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public int RecordsProcessed { get; set; }
        public int TotalRecords { get; set; }
        public double Percentage => TotalRecords > 0 ? (double)RecordsProcessed / TotalRecords * 100 : 0;
    }

    public class ExportRequest
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string? ProfileId { get; set; }
        public string MappingId { get; set; } = string.Empty;
        public OutputMapping? Mapping { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public ExportFormat Format { get; set; } = ExportFormat.Excel;
        public string DestinationPath { get; set; } = string.Empty;
        public ExportOptions Options { get; set; } = new ExportOptions();
    }

    public class ExportStatistics
    {
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public long DurationMs { get; set; }
        public int RecordsRead { get; set; }
        public int RecordsWritten { get; set; }
        public int RecordsSkipped { get; set; }
        public int ErrorCount { get; set; }
        public int WarningCount { get; set; }
        public long BytesWritten { get; set; }
        public ExportFormat Format { get; set; }
        public string? FileHash { get; set; }
    }

    public class ExportResult
    {
        public bool Success { get; set; }
        public ExportJobStatus Status { get; set; }
        public string DestinationPath { get; set; } = string.Empty;
        public ExportStatistics Statistics { get; set; } = new ExportStatistics();
        public List<string> Warnings { get; set; } = new List<string>();
        public List<string> Errors { get; set; } = new List<string>();
        public string? ErrorCsvPath { get; set; }
        public MappingValidationResult Validation { get; set; } = new MappingValidationResult();
    }

    public class ExportProfile
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string MappingId { get; set; } = string.Empty;
        public string MappingName { get; set; } = string.Empty;
        public string? CompanyId { get; set; }
        public ExportFormat Format { get; set; } = ExportFormat.Excel;
        public string DestinationPath { get; set; } = string.Empty;
        public ExportOptions Options { get; set; } = new ExportOptions();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsEnabled { get; set; } = true;
        public DateTime? LastExportAt { get; set; }
        public ExportJobStatus? LastStatus { get; set; }
        public int MappingVersion { get; set; } = 1;
    }

    public class ExportHistory
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string? ProfileId { get; set; }
        public string MappingId { get; set; } = string.Empty;
        public string MappingName { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
        public ExportJobStatus Status { get; set; } = ExportJobStatus.Completed;
        public ExportFormat Format { get; set; } = ExportFormat.Excel;
        public string DestinationPath { get; set; } = string.Empty;
        public int RecordsRead { get; set; }
        public int RecordsWritten { get; set; }
        public int ErrorCount { get; set; }
        public int WarningCount { get; set; }
        public long FileSize { get; set; }
        public string? FileHash { get; set; }
        public long DurationMs { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ExportJob
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string? ProfileId { get; set; }
        public string MappingId { get; set; } = string.Empty;
        public ExportJobStatus Status { get; set; } = ExportJobStatus.Preparing;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public bool CancellationRequested { get; set; }
        public string ProgressMessage { get; set; } = string.Empty;
        public int RecordsProcessed { get; set; }
        public int TotalRecords { get; set; }
        public ExportStatistics Statistics { get; set; } = new ExportStatistics();
    }
}
