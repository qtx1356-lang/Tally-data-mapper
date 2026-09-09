using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Services;
using Xunit;

namespace EXFIN.TallyMapper.Tests
{
    public class Phase17LocalDataEngineTests
    {
        [Fact]
        public async Task CreateDataset_EnforcesTenantCompanyIsolation()
        {
            var db = new DuckDbAnalyticsDatabase();
            var engine = new LocalDataEngineService(db);

            var dataset = await engine.CreateDatasetAsync(
                companyId: "COMP-TEST-100",
                objectType: DatasetType.Voucher,
                source: "TallyPrime XML Stream",
                schemaVersion: "1.0.0",
                mappingVersion: "1.0.0"
            );

            Assert.NotNull(dataset);
            Assert.Equal("COMP-TEST-100", dataset.CompanyId);
            Assert.Equal(0, dataset.RowCount);

            // Verify query against different company returns empty (tenant isolation)
            var queryOtherCompany = await engine.QueryDatasetAsync(dataset.DatasetId, "COMP-OTHER-999", "");
            Assert.Equal(0, queryOtherCompany.TotalRows);
        }

        [Fact]
        public async Task InsertBatch_RejectsForeignCompanyRecords()
        {
            var db = new DuckDbAnalyticsDatabase();
            var engine = new LocalDataEngineService(db);

            var dataset = await engine.CreateDatasetAsync(
                companyId: "COMP-ACME",
                objectType: DatasetType.Voucher,
                source: "TallyPrime",
                schemaVersion: "1.0",
                mappingVersion: "1.0"
            );

            var records = new List<NormalizedRecord>
            {
                new NormalizedRecord
                {
                    RecordId = "REC-1",
                    CompanyId = "COMP-ACME",
                    Fields = new Dictionary<string, object> { { "Amount", 1000m } }
                },
                new NormalizedRecord
                {
                    RecordId = "REC-2",
                    CompanyId = "COMP-FOREIGN", // Must be rejected due to tenant safety
                    Fields = new Dictionary<string, object> { { "Amount", 5000m } }
                }
            };

            await engine.InsertBatchAsync(dataset.DatasetId, records);
            var stats = await engine.GetDatasetStatisticsAsync(dataset.DatasetId, "COMP-ACME");

            Assert.NotNull(stats);
            Assert.Equal(1, stats.RowCount); // Only valid company record accepted
        }

        [Fact]
        public async Task DeleteLocalDataset_OnlyDeletesLocalCache()
        {
            var db = new DuckDbAnalyticsDatabase();
            var engine = new LocalDataEngineService(db);

            var dataset = await engine.CreateDatasetAsync("COMP-ACME", DatasetType.Ledger, "TallyPrime", "1.0", "1.0");
            var deleted = await engine.DeleteLocalDatasetAsync(dataset.DatasetId, "COMP-ACME");

            Assert.True(deleted);
            var statsAfter = await engine.GetDatasetStatisticsAsync(dataset.DatasetId, "COMP-ACME");
            Assert.Null(statsAfter);
        }
    }
}
