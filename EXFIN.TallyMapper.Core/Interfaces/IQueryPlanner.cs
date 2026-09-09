using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IQueryPlanner
    {
        QueryPlan BuildPlan(UnifiedQueryDefinition queryDef, UnifiedDiscoveryModel model);
    }

    public interface IUnifiedQueryExecutor
    {
        Task<List<Dictionary<string, object>>> ExecuteQueryAsync(string companyId, UnifiedQueryDefinition queryDef, CancellationToken cancellationToken = default);
    }
}
