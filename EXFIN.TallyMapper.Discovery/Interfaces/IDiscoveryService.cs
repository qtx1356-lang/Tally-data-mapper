using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Discovery.Models;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Discovery.Interfaces
{
    public interface IDiscoveryService
    {
        Task<TallyCompanyInfo?> DiscoverCompanyAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveryCollection>> DiscoverCollectionsAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveryField>> DiscoverFieldsAsync(string collectionName, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveryObject>> DiscoverObjectsAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoveryRelationship>> DiscoverRelationshipsAsync(CancellationToken cancellationToken = default);
        Task<DiscoverySummary> GetDiscoverySummaryAsync(CancellationToken cancellationToken = default);
    }
}
