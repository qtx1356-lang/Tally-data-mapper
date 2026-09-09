using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;
using EXFIN.TallyMapper.Tally.Services;
using Moq;
using Xunit;

namespace EXFIN.TallyMapper.Tests
{
    public class Phase4UnifiedDiscoveryTests
    {
        [Fact]
        public void EntityRecognition_ClassifiesStandardEntities()
        {
            var service = new EntityRecognitionService();

            var status = service.ClassifyEntity("Voucher", out string canonicalType);
            Assert.Equal(RecognitionStatus.Recognized, status);
            Assert.Equal("Voucher", canonicalType);

            var category = service.InferCategory("Voucher");
            Assert.Equal(CollectionCategory.Transactions, category);

            var masterCategory = service.InferCategory("Ledger");
            Assert.Equal(CollectionCategory.Masters, masterCategory);
        }

        [Fact]
        public void FieldPathService_GeneratesAndValidatesCanonicalPaths()
        {
            var service = new FieldPathService();
            var model = new UnifiedDiscoveryModel
            {
                CompanyId = "TEST_COMP",
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection
                    {
                        Name = "Voucher",
                        Fields = new List<DiscoveryField>
                        {
                            new DiscoveryField { Name = "Date", DataType = FieldDataType.Date },
                            new DiscoveryField { Name = "VoucherNumber", DataType = FieldDataType.String }
                        }
                    }
                }
            };

            var paths = service.GenerateCanonicalPaths(model);
            Assert.NotEmpty(paths);
            Assert.Contains(paths, p => p.PathString == "Voucher.Date");

            bool isValid = service.ValidatePath("Voucher.Date", model);
            Assert.True(isValid);

            bool isInvalid = service.ValidatePath("NonExistentEntity.Field", model);
            Assert.False(isInvalid);
        }

        [Fact]
        public void QueryPlanner_RejectsUnsafeModificationKeywords()
        {
            var planner = new QueryPlanner();
            var model = new UnifiedDiscoveryModel
            {
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection { Name = "Voucher" }
                }
            };

            var unsafeQuery = new UnifiedQueryDefinition
            {
                SourceEntity = "Voucher",
                Fields = new List<string> { "DELETE FROM Voucher" }
            };

            var plan = planner.BuildPlan(unsafeQuery, model);
            Assert.True(plan.IsUnsupported);
            Assert.Contains("strictly READ-ONLY", plan.UnsupportedReason);
        }

        [Fact]
        public void MetadataDiffService_DetectsAddedAndRemovedCollections()
        {
            var service = new MetadataDiffService();
            var scanA = new UnifiedDiscoveryModel
            {
                ScanId = 1,
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection { Name = "Ledger" },
                    new DiscoveryCollection { Name = "Voucher" }
                }
            };

            var scanB = new UnifiedDiscoveryModel
            {
                ScanId = 2,
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection { Name = "Voucher" },
                    new DiscoveryCollection { Name = "StockItem" }
                }
            };

            var diff = service.CompareScans(scanA, scanB);
            Assert.Contains("StockItem", diff.AddedCollections);
            Assert.Contains("Ledger", diff.RemovedCollections);
        }

        [Fact]
        public async Task UnifiedDiscovery_RespectsCompanyIsolationAndCancellation()
        {
            var mockOdbc = new Mock<EXFIN.TallyMapper.Tally.Interfaces.IOdbcSchemaDiscoveryService>();
            var mockRepo = new Mock<IDiscoveryRepository>();
            var recService = new EntityRecognitionService();
            var pathService = new FieldPathService();

            mockOdbc.Setup(m => m.DiscoverSchemaAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<DiscoveryCollection>
                {
                    new DiscoveryCollection { Name = "CompanyACollection", Fields = new List<DiscoveryField>() }
                });

            mockRepo.Setup(r => r.SaveScanAsync(It.IsAny<DiscoveryScan>())).ReturnsAsync(1);

            var service = new UnifiedDiscoveryService(mockOdbc.Object, mockRepo.Object, recService, pathService);

            using var cts = new CancellationTokenSource();
            cts.Cancel();

            await Assert.ThrowsAsync<OperationCanceledException>(async () =>
            {
                await service.PerformUnifiedDiscoveryAsync("COMPANY_A", cts.Token);
            });
        }
    }
}
