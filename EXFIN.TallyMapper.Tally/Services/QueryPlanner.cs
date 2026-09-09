using System;
using System.Collections.Generic;
using System.Linq;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class QueryPlanner : IQueryPlanner
    {
        private static readonly string[] ProhibitedKeywords = new[]
        {
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "EXEC", "EXECUTE"
        };

        public QueryPlan BuildPlan(UnifiedQueryDefinition queryDef, UnifiedDiscoveryModel model)
        {
            var plan = new QueryPlan
            {
                TargetConnector = "ODBC",
                Operations = new List<string>()
            };

            if (queryDef == null || string.IsNullOrWhiteSpace(queryDef.SourceEntity))
            {
                plan.IsUnsupported = true;
                plan.UnsupportedReason = "Source entity is required.";
                return plan;
            }

            // Read-Only Safety Check
            string rawQueryCheck = $"{queryDef.SourceEntity} {string.Join(" ", queryDef.Fields)} {string.Join(" ", queryDef.Filters)}";
            foreach (var kw in ProhibitedKeywords)
            {
                if (rawQueryCheck.Contains(kw, StringComparison.OrdinalIgnoreCase))
                {
                    plan.IsUnsupported = true;
                    plan.UnsupportedReason = $"Query contains unsafe modification keyword '{kw}'. EXFIN Tally Data Mapper is strictly READ-ONLY.";
                    return plan;
                }
            }

            var collection = model?.Collections.FirstOrDefault(c => c.Name.Equals(queryDef.SourceEntity, StringComparison.OrdinalIgnoreCase));
            if (collection == null)
            {
                var obj = model?.Objects.FirstOrDefault(o => o.Name.Equals(queryDef.SourceEntity, StringComparison.OrdinalIgnoreCase));
                if (obj == null)
                {
                    plan.IsUnsupported = true;
                    plan.UnsupportedReason = $"Source entity '{queryDef.SourceEntity}' was not found in discovered metadata.";
                    return plan;
                }
            }

            plan.Operations.Add($"Select fields from {queryDef.SourceEntity}");
            
            bool hasNestedArrayFields = queryDef.Fields.Any(f => f.Contains("Inventory") || f.Contains("LedgerEntries") || f.Contains("BatchAllocations"));
            if (hasNestedArrayFields)
            {
                plan.PostProcessingRequired = true;
                plan.Operations.Add("Apply Flattening Engine to unpack sub-collections while preserving row cardinality.");
            }

            plan.Operations.Add($"Apply limit {Math.Min(queryDef.Limit <= 0 ? 100 : queryDef.Limit, 1000)}");
            plan.TechnicalDetails = $"Planned ODBC SQL translation for {queryDef.SourceEntity}";

            return plan;
        }
    }
}
