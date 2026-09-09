using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface ITallyCompanyService
    {
        Task<List<TallyCompany>> GetCompaniesAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default);
        Task<TallyCompanyContext?> SelectCompanyAsync(TallyConnectionOptions options, TallyCompany company, CancellationToken cancellationToken = default);
        Task<bool> VerifyCompanyContextAsync(TallyConnectionOptions options, TallyCompanyContext context, CancellationToken cancellationToken = default);
    }
}
