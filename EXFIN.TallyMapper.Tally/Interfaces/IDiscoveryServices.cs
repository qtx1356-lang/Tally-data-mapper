using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface IOdbcSchemaDiscoveryService
    {
        Task<DiscoveryScan> PerformScanAsync(
            string companyId,
            string companyName,
            Action<DiscoveryProgress>? progressCallback = null,
            CancellationToken cancellationToken = default);

        Task<DiscoveryScan?> GetLatestScanAsync(string companyId);
        Task<List<DiscoveryCollection>> GetCollectionsAsync(string companyId, bool includeSystem = false);
        Task<List<DiscoveryField>> GetFieldsAsync(int collectionId);
    }

    public interface IDataExplorerService
    {
        Task<QueryResult> GetCollectionSampleAsync(string companyId, string collectionName, int limit = 100, string searchTerm = "");
        Task ToggleFavoriteAsync(string companyId, string collectionName);
        Task<List<string>> GetFavoritesAsync(string companyId);
        Task<List<string>> GetRecentCollectionsAsync(string companyId);
        Task RecordRecentCollectionAsync(string companyId, string collectionName);
    }

    public interface IFieldInspectorService
    {
        Task<List<string>> GetSampleValuesAsync(string companyId, string collectionName, string fieldName, int maxSamples = 5);
    }
}
