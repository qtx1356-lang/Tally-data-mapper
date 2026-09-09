using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IUnifiedDiscoveryService
    {
        Task<UnifiedDiscoveryModel> PerformUnifiedDiscoveryAsync(string companyId, CancellationToken cancellationToken = default);
        Task<UnifiedDiscoveryModel> GetLatestModelAsync(string companyId);
        Task<UnifiedDiscoveryModel> GetModelForScanAsync(int scanId);
    }
}
