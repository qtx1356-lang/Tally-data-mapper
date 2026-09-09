using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface ITallyConnectionService
    {
        TallyConnectionStatus CurrentStatus { get; }
        TallyConnectionOptions Options { get; }
        TallyConnectionResult? LastResult { get; }
        TallyCompanyContext? ActiveCompanyContext { get; }

        Task<TallyConnectionResult> TestConnectionAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default);
        Task<TallyConnectionResult> ConnectAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default);
        Task DisconnectAsync();
        void UpdateOptions(TallyConnectionOptions options);
        void SetCompanyContext(TallyCompanyContext context);
        void ClearCompanyContext();
    }
}
