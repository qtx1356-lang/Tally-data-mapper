using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface ITallyOdbcConnector
    {
        Task<OdbcEnvironmentInfo> DetectEnvironmentAsync();
        Task<bool> TestConnectionAsync(string? dsnOrConnStr = null);
        Task<List<string>> GetTablesAsync(CancellationToken cancellationToken = default);
        Task<List<DiscoveryField>> GetColumnsAsync(string tableName, CancellationToken cancellationToken = default);
        Task<QueryResult> ExecuteQueryAsync(QueryDefinition query, CancellationToken cancellationToken = default);
        Task<QueryResult> GetSampleDataAsync(string tableName, int limit = 100, CancellationToken cancellationToken = default);
    }
}
