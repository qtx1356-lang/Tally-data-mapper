using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface ITallyHealthService
    {
        Task<ConnectionDiagnostics> GetDiagnosticsAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default);
        Task<TallyCapabilities> CheckCapabilitiesAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default);
    }
}
