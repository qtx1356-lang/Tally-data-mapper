using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IExportDataProvider
    {
        Task<MappedDataResult> GetMappedDataAsync(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel, int? limit = null, CancellationToken cancellationToken = default);
    }
}
