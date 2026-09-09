using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    /// <summary>
    /// Phase 17: Local Analytical Data Engine Core Contract
    /// Manages analytical cache, columnar datasets, and batch ingestion.
    /// Strictly Read-Only against Tally source system.
    /// </summary>
    public interface ILocalDataEngine
    {
        Task<DatasetModel> CreateDatasetAsync(string companyId, DatasetType objectType, string source, string schemaVersion, string mappingVersion, CancellationToken cancellationToken = default);
        Task<bool> InsertBatchAsync(string datasetId, IReadOnlyList<NormalizedRecord> records, CancellationToken cancellationToken = default);
        Task<bool> UpdateBatchAsync(string datasetId, IReadOnlyList<NormalizedRecord> records, CancellationToken cancellationToken = default);
        Task<bool> DeleteLocalDatasetAsync(string datasetId, string companyId, CancellationToken cancellationToken = default);
        Task<AnalyticalQueryResult> QueryDatasetAsync(string datasetId, string companyId, string filterExpression, int limit = 100, int offset = 0, CancellationToken cancellationToken = default);
        Task<AggregationResult> AggregateDatasetAsync(string datasetId, string companyId, IReadOnlyList<string> dimensions, IReadOnlyList<MetricAggregateSpec> metrics, string? filterExpression = null, CancellationToken cancellationToken = default);
        Task<bool> IndexDatasetAsync(string datasetId, IReadOnlyList<string> indexColumns, CancellationToken cancellationToken = default);
        Task<DatasetModel?> GetDatasetStatisticsAsync(string datasetId, string companyId, CancellationToken cancellationToken = default);
        Task<DatabaseHealthMetrics> GetDatabaseHealthAsync(CancellationToken cancellationToken = default);
        Task<bool> OptimizeAndVacuumAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Abstraction layer over embedded analytical database (DuckDB / Columnar store)
    /// </summary>
    public interface IAnalyticsDatabase
    {
        string EngineName { get; }
        string Version { get; }
        Task InitializeAsync(string connectionString, CancellationToken cancellationToken = default);
        Task ExecuteNonQueryAsync(string sql, IDictionary<string, object>? parameters = null, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<IDictionary<string, object>>> QueryAsync(string sql, IDictionary<string, object>? parameters = null, CancellationToken cancellationToken = default);
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
        Task<long> GetStorageSizeBytesAsync(CancellationToken cancellationToken = default);
        Task VacuumAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Pipeline Ingestion Engine: Fetch -> Parse -> Validate -> Normalize -> Transform -> Insert -> Index -> Verify
    /// </summary>
    public interface IDataIngestionEngine
    {
        Task<IngestionJobRecord> QueueIngestionJobAsync(IngestionJobRequest request, CancellationToken cancellationToken = default);
        Task<IngestionJobRecord?> GetJobStatusAsync(string jobId, CancellationToken cancellationToken = default);
        Task<bool> PauseJobAsync(string jobId, CancellationToken cancellationToken = default);
        Task<bool> ResumeJobAsync(string jobId, CancellationToken cancellationToken = default);
        Task<bool> CancelJobAsync(string jobId, CancellationToken cancellationToken = default);
        Task<AccountingReconciliationResult> ValidateAccountingTotalsAsync(string datasetId, string companyId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Analytical Query Engine with AST parsing, query plan inspection, caching, and SQL safety
    /// </summary>
    public interface IAnalyticsQueryEngine
    {
        Task<AnalyticalQueryPlan> ExplainQueryAsync(string companyId, string datasetId, string safeSqlStatement);
        Task<AnalyticalQueryResult> ExecuteQueryAsync(string companyId, string datasetId, string safeSqlStatement, QueryRoutingPreference routing, CancellationToken cancellationToken = default);
        Task InvalidateQueryCacheAsync(string companyId, string? datasetId = null);
        Task<BenchmarkExecutionRecord> RunBenchmarkSuiteAsync(long targetRowCount, CancellationToken cancellationToken = default);
    }
}
