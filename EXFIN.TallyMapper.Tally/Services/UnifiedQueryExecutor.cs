using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class UnifiedQueryExecutor : IUnifiedQueryExecutor
    {
        private readonly ITallyOdbcConnector _odbcConnector;
        private readonly IUnifiedDiscoveryService _discoveryService;
        private readonly IQueryPlanner _queryPlanner;

        public UnifiedQueryExecutor(
            ITallyOdbcConnector odbcConnector,
            IUnifiedDiscoveryService discoveryService,
            IQueryPlanner queryPlanner)
        {
            _odbcConnector = odbcConnector;
            _discoveryService = discoveryService;
            _queryPlanner = queryPlanner;
        }

        public async Task<List<Dictionary<string, object>>> ExecuteQueryAsync(
            string companyId,
            UnifiedQueryDefinition queryDef,
            CancellationToken cancellationToken = default)
        {
            var model = await _discoveryService.GetLatestModelAsync(companyId);
            var plan = _queryPlanner.BuildPlan(queryDef, model);

            if (plan.IsUnsupported)
            {
                throw new InvalidOperationException($"Query execution blocked: {plan.UnsupportedReason}");
            }

            int safeLimit = queryDef.Limit <= 0 ? 100 : Math.Min(queryDef.Limit, 1000);
            var selectedFields = queryDef.Fields.Count > 0 ? queryDef.Fields : new List<string> { "*" };

            string sql = $"SELECT TOP {safeLimit} {string.Join(", ", selectedFields)} FROM {queryDef.SourceEntity}";

            var rawRows = await _odbcConnector.ExecuteQueryAsync(companyId, sql, cancellationToken);

            if (plan.PostProcessingRequired)
            {
                return FlattenRows(rawRows);
            }

            return rawRows;
        }

        private List<Dictionary<string, object>> FlattenRows(List<Dictionary<string, object>> rows)
        {
            var flattened = new List<Dictionary<string, object>>();

            foreach (var row in rows)
            {
                var newRow = new Dictionary<string, object>(row, StringComparer.OrdinalIgnoreCase);
                flattened.Add(newRow);
            }

            return flattened;
        }
    }
}
