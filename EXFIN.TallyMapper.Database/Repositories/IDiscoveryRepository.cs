using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Database.Repositories
{
    public interface IDiscoveryRepository
    {
        Task<int> SaveScanAsync(DiscoveryScan scan);
        Task UpdateScanStatusAsync(int scanId, string status, int collectionCount, int fieldCount, int errorCount, string technicalDetails);
        Task SaveCollectionsAndFieldsAsync(int scanId, List<DiscoveryCollection> collections);
        Task SaveRelationshipsAsync(int scanId, List<TallyRelationship> relationships);
        Task SaveCanonicalFieldPathsAsync(int scanId, List<CanonicalFieldPath> paths);
        Task SaveTallyObjectsAsync(int scanId, List<TallyObjectDefinition> objects);
        Task<DiscoveryScan?> GetLatestScanAsync(string companyId);
        Task<DiscoveryScan?> GetScanByIdAsync(int scanId);
        Task<List<DiscoveryScan>> GetScanHistoryAsync(string companyId);
        Task<List<DiscoveryCollection>> GetCollectionsAsync(string companyId, bool includeSystem = false);
        Task<List<DiscoveryField>> GetFieldsAsync(int collectionId);
        Task<List<TallyRelationship>> GetRelationshipsAsync(string companyId, int? scanId = null);
        Task<List<CanonicalFieldPath>> GetCanonicalFieldPathsAsync(string companyId, int? scanId = null);
        Task<List<TallyObjectDefinition>> GetTallyObjectsAsync(string companyId, int? scanId = null);
        Task ToggleFavoriteAsync(string companyId, string collectionName);
        Task<List<string>> GetFavoritesAsync(string companyId);
        Task TogglePathFavoriteAsync(string companyId, string pathString);
        Task<List<string>> GetFavoriteFieldPathsAsync(string companyId);
    }
}

