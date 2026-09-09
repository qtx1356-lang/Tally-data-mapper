using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IUniversalDiscoveryEngine
    {
        Task<SchemaSnapshot> DiscoverFullSchemaAsync(string companyId);
        Task<CompanyProfile> GetCompanyProfileAsync(string companyId);
        Task<List<DiscoveredCollection>> GetCollectionsAsync(string companyId, string category = null);
        Task<DiscoveredObject> GetObjectDetailsAsync(string companyId, string objectName);
        Task<List<DiscoveredField>> InferFieldsAsync(string collectionName, List<Dictionary<string, object>> sampleData);
        Task<List<DiscoveredRelationship>> DiscoverRelationshipsAsync(string companyId);
        Task<SchemaDiffResult> CompareSchemasAsync(string snapshotId1, string snapshotId2);
    }

    public interface ITallySchemaExplorer
    {
        Task<SchemaSnapshot> GetCurrentSnapshotAsync(string companyId);
        Task<List<SchemaSnapshot>> GetSnapshotHistoryAsync(string companyId);
        Task<SchemaSnapshot> CreateSnapshotAsync(string companyId);
    }

    public interface IReconciliationEngine
    {
        Task<ReconciliationResult> ReconcileTotalsAsync(string companyId, string reportId, string mappingId);
        Task<List<ReconciliationGroupBreakdown>> GetGroupBreakdownAsync(string reconciliationId);
    }

    public interface IDataQualityEngine
    {
        Task<DataQualityReport> EvaluateQualityAsync(string collectionName, List<Dictionary<string, object>> records);
        Task<List<FieldProfilingResult>> ProfileFieldsAsync(string collectionName, int sampleLimit = 100);
    }
}
