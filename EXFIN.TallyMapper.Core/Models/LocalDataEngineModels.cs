using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    /// <summary>
    /// Phase 17: Supported Local Analytical Dataset Types
    /// </summary>
    public enum DatasetType
    {
        Voucher,
        Ledger,
        Inventory,
        Party,
        GST,
        Outstanding,
        Custom
    }

    /// <summary>
    /// Dataset health and synchronization status
    /// </summary>
    public enum DatasetStatus
    {
        Live,
        Fresh,
        Stale,
        Partial,
        Failed,
        Unavailable
    }

    /// <summary>
    /// Refresh and synchronization strategies for datasets
    /// </summary>
    public enum SyncStrategy
    {
        FullRefresh,
        Incremental,
        PeriodRefresh,
        ManualRefresh
    }

    /// <summary>
    /// State machine for batch ingestion jobs
    /// </summary>
    public enum IngestionJobState
    {
        Queued,
        Running,
        Paused,
        Completed,
        Partial,
        Failed,
        Cancelled
    }

    /// <summary>
    /// Phase of the ingestion pipeline
    /// Pipeline: Fetch -> Parse -> Validate -> Normalize -> Transform -> Insert -> Index -> Verify
    /// </summary>
    public enum IngestionPipelinePhase
    {
        Fetch,
        Parse,
        Validate,
        Normalize,
        Transform,
        Insert,
        Index,
        Verify,
        Finalized
    }

    /// <summary>
    /// Routing mode for analytical queries
    /// </summary>
    public enum QueryRoutingPreference
    {
        AlwaysUseLive,
        PreferLocal,
        OfflineOnly
    }

    /// <summary>
    /// High-performance local analytical dataset metadata
    /// </summary>
    public class DatasetModel
    {
        public string DatasetId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DatasetType ObjectType { get; set; }
        public string Source { get; set; } = "TallyPrime XML/ODBC";
        public string SchemaVersion { get; set; } = "1.0.0";
        public string MappingVersion { get; set; } = "1.0.0";
        public string CalculationVersion { get; set; } = "1.0.0";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public long RowCount { get; set; }
        public DatasetStatus Status { get; set; } = DatasetStatus.Fresh;
        public SyncStrategy RefreshStrategy { get; set; } = SyncStrategy.PeriodRefresh;
        public string FinancialYearPartition { get; set; } = "FY2025-26";
        public long DiskSizeBytes { get; set; }
        public string CheckpointToken { get; set; } = string.Empty;
        public bool IsTestDataset { get; set; } = false;
        public string DeterministicSignature { get; set; } = string.Empty;
        public IReadOnlyList<string> IndexedColumns { get; set; } = new List<string>();
        public IDictionary<string, string> LineageMetadata { get; set; } = new Dictionary<string, string>();
    }

    /// <summary>
    /// Lineage metadata for normalized records
    /// </summary>
    public class DataLineageMetadata
    {
        public string Source { get; set; } = "TallyPrime";
        public string Object { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;
        public string SchemaVersion { get; set; } = "1.0";
        public string MappingVersion { get; set; } = "1.0";
        public string CalculationVersion { get; set; } = "1.0";
        public DateTime IngestedAt { get; set; } = DateTime.UtcNow;
        public string CheckpointHash { get; set; } = string.Empty;
    }

    /// <summary>
    /// Normalized record stored in the analytical columnar engine
    /// </summary>
    public class NormalizedRecord
    {
        public string RecordId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string FinancialYear { get; set; } = "FY2025-26";
        public DateTime RecordDate { get; set; } = DateTime.UtcNow;
        public string RecordHash { get; set; } = string.Empty;
        public IDictionary<string, object> Fields { get; set; } = new Dictionary<string, object>();
        public DataLineageMetadata Lineage { get; set; } = new DataLineageMetadata();
    }

    /// <summary>
    /// Ingestion Job details tracking execution across pipeline phases
    /// </summary>
    public class IngestionJobRecord
    {
        public string JobId { get; set; } = string.Empty;
        public string DatasetId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public IngestionJobState State { get; set; } = IngestionJobState.Queued;
        public IngestionPipelinePhase Phase { get; set; } = IngestionPipelinePhase.Fetch;
        public long RecordsDiscovered { get; set; }
        public long RecordsProcessed { get; set; }
        public long RecordsInserted { get; set; }
        public long RecordsRejected { get; set; }
        public long ElapsedMilliseconds { get; set; }
        public int LastSuccessfulBatch { get; set; }
        public string SourcePositionCheckpoint { get; set; } = string.Empty;
        public string SchemaVersion { get; set; } = "1.0.0";
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string ErrorSummary { get; set; } = string.Empty;
        public IReadOnlyList<string> ValidationWarnings { get; set; } = new List<string>();
    }

    /// <summary>
    /// Request specification for launching a new ingestion job
    /// </summary>
    public class IngestionJobRequest
    {
        public string CompanyId { get; set; } = string.Empty;
        public DatasetType DataType { get; set; }
        public SyncStrategy Strategy { get; set; } = SyncStrategy.PeriodRefresh;
        public string FinancialYear { get; set; } = "FY2025-26";
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public int BatchSize { get; set; } = 5000;
        public bool EnableRawRetention { get; set; } = false;
        public bool ValidateAccountingTotals { get; set; } = true;
    }

    /// <summary>
    /// Accounting total reconciliation validation
    /// </summary>
    public class AccountingReconciliationResult
    {
        public string DatasetId { get; set; } = string.Empty;
        public string MetricName { get; set; } = string.Empty;
        public decimal TallySourceTotal { get; set; }
        public decimal LocalDatasetTotal { get; set; }
        public decimal Variance { get; set; }
        public bool IsMatched { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
        public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Query Plan inspection for analytical queries
    /// </summary>
    public class AnalyticalQueryPlan
    {
        public string QueryId { get; set; } = string.Empty;
        public string DatasetId { get; set; } = string.Empty;
        public IReadOnlyList<string> AppliedFilters { get; set; } = new List<string>();
        public IReadOnlyList<string> IndexesUsed { get; set; } = new List<string>();
        public long EstimatedRows { get; set; }
        public double ExecutionTimeMs { get; set; }
        public bool CacheHit { get; set; }
        public string SqlRepresentation { get; set; } = string.Empty;
    }

    /// <summary>
    /// Query execution result from local analytical engine
    /// </summary>
    public class AnalyticalQueryResult
    {
        public string QueryId { get; set; } = string.Empty;
        public long TotalRows { get; set; }
        public IReadOnlyList<string> Columns { get; set; } = new List<string>();
        public IReadOnlyList<IDictionary<string, object>> Rows { get; set; } = new List<IDictionary<string, object>>();
        public AnalyticalQueryPlan Plan { get; set; } = new AnalyticalQueryPlan();
        public bool IsOfflineCache { get; set; }
        public DateTime SnapshotTimestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Aggregation specification
    /// </summary>
    public class MetricAggregateSpec
    {
        public string FieldName { get; set; } = string.Empty;
        public string Function { get; set; } = "SUM"; // SUM, AVG, COUNT, MIN, MAX
        public string Alias { get; set; } = string.Empty;
    }

    /// <summary>
    /// Aggregation result
    /// </summary>
    public class AggregationResult
    {
        public string DatasetId { get; set; } = string.Empty;
        public IReadOnlyList<string> DimensionHeaders { get; set; } = new List<string>();
        public IReadOnlyList<string> MetricHeaders { get; set; } = new List<string>();
        public IReadOnlyList<IDictionary<string, object>> AggregatedRows { get; set; } = new List<IDictionary<string, object>>();
        public double CalculationDurationMs { get; set; }
    }

    /// <summary>
    /// Database health and storage metrics
    /// </summary>
    public class DatabaseHealthMetrics
    {
        public string EngineName { get; set; } = "DuckDB Embedded Analytics";
        public string EngineVersion { get; set; } = "1.0.0-embedded";
        public long DatabaseSizeBytes { get; set; }
        public int DatasetCount { get; set; }
        public long TotalRowCount { get; set; }
        public DateTime? LastSyncTimestamp { get; set; }
        public int FailedJobCount { get; set; }
        public long StorageLimitBytes { get; set; } = 10L * 1024 * 1024 * 1024; // 10 GB
        public double StorageUsedPercentage { get; set; }
        public string StorageLocation { get; set; } = "C:\\EXFIN\\Data\\Analytics.duckdb";
        public bool EncryptionActive { get; set; } = false;
        public string LastVacuumCompleted { get; set; } = string.Empty;
    }

    /// <summary>
    /// Benchmark results across massive row volumes
    /// </summary>
    public class BenchmarkExecutionRecord
    {
        public string RowVolumeLabel { get; set; } = "1M";
        public long RowCount { get; set; } = 1_000_000;
        public double IngestionSeconds { get; set; }
        public double MonthlyAggregationSeconds { get; set; }
        public double FilteredQuerySeconds { get; set; }
        public double ExportSeconds { get; set; }
        public double PeakMemoryMb { get; set; }
        public double StartupTimeMs { get; set; }
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    }
}
