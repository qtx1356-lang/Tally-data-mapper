using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    /// <summary>
    /// Phase 15: Universal Tally Output Discovery, Visual Query Builder & Custom Report Engine.
    /// Strictly Read-Only against Tally instances.
    /// </summary>
    public interface IUniversalOutputDiscoveryEngine
    {
        Task<DiscoveryExecutionReport> RunUniversalDiscoveryAsync(DiscoveryOptions options, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveredOutputItem>> GetOutputCatalogAsync(string companyId, OutputCategoryFilter filter, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveredObjectDefinition>> GetObjectCatalogAsync(string companyId, CancellationToken cancellationToken = default);
        Task<DiscoveredObjectDefinition?> GetObjectDetailsAsync(string companyId, string objectId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveredFieldDefinition>> GetFieldCatalogAsync(string companyId, string? objectId = null, CancellationToken cancellationToken = default);
        Task<FieldSampleResult> GetFieldSamplePreviewAsync(string companyId, string fieldName, string objectId, int sampleLimit = 25, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<TdlOutputDescriptor>> GetTdlOutputsAsync(string companyId, CancellationToken cancellationToken = default);
        Task<ObjectRelationshipGraph> GetRelationshipGraphAsync(string companyId, CancellationToken cancellationToken = default);
        Task<OutputAvailabilityMatrix> GetAvailabilityMatrixAsync(string companyId, CancellationToken cancellationToken = default);
        Task<SchemaSnapshot> CaptureSchemaSnapshotAsync(string companyId, string description, CancellationToken cancellationToken = default);
        Task<SchemaDiffResult> CompareSnapshotsAsync(string snapshotIdA, string snapshotIdB, CancellationToken cancellationToken = default);
    }

    public interface IVisualQueryBuilderEngine
    {
        Task<QueryValidationResult> ValidateQueryAsync(VisualQueryDefinition query);
        Task<QueryPerformanceEstimate> EstimatePerformanceAsync(VisualQueryDefinition query);
        Task<QueryExecutionResult> ExecuteQueryPreviewAsync(VisualQueryDefinition query, int maxRows = 25, CancellationToken cancellationToken = default);
        Task<SavedQueryRecord> SaveQueryAsync(VisualQueryDefinition query, string userId, string companyId);
        Task<IReadOnlyList<SavedQueryRecord>> GetSavedQueriesAsync(string companyId);
        Task<VisualQueryDefinition?> GetQueryVersionAsync(string queryId, int version);
        Task<NlToQueryTranslationResult> TranslateNaturalLanguageToQueryAsync(string nlPrompt, string companyId);
    }

    public interface ICustomReportDesignerEngine
    {
        Task<ReportDefinitionRecord> SaveReportDefinitionAsync(ReportDefinitionRecord report, string userId);
        Task<ReportDefinitionRecord?> GetReportDefinitionAsync(string reportId);
        Task<ReportExportJobResult> ExecuteReportExportAsync(string reportId, ReportExportFormat format, CancellationToken cancellationToken = default);
        Task<TemplateExportBundle> ExportTemplateAsync(string reportId, string exportVersion);
        Task<TemplateImportResult> ImportTemplateAsync(TemplateExportBundle bundle, string targetCompanyId);
        Task<DataLineageTrace> TraceDataLineageAsync(string reportId, string outputColumnId);
    }

    public interface ISemanticOutputMappingEngine
    {
        Task<IReadOnlyList<SemanticMappingCandidate>> SuggestFieldMappingsAsync(string companyId, string objectId);
        Task<SemanticMappingProfile> SaveMappingProfileAsync(SemanticMappingProfile profile);
        Task<MappingValidationSummary> ValidateMappingProfileAsync(string profileId, string targetCompanyId);
        Task<bool> ConfirmSemanticMappingAsync(string sourceField, string targetSemanticConcept, MappingConfidenceLevel confidence);
    }
}
