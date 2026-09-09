using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Exceptions;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Services;
using Moq;
using Xunit;

namespace EXFIN.TallyMapper.Tests.Tally
{
    public class Phase3OdbcDiscoveryTests
    {
        [Theory]
        [InlineData("INSERT INTO Ledger VALUES ('Test')")]
        [InlineData("UPDATE Ledger SET Name = 'Changed'")]
        [InlineData("DELETE FROM Voucher")]
        [InlineData("DROP TABLE StockItem")]
        [InlineData("TRUNCATE TABLE Group")]
        public async Task TallyOdbcConnector_ExecuteQueryAsync_RejectsForbiddenWriteQueries(string forbiddenSql)
        {
            var settingsMock = new Mock<Core.Interfaces.IAppSettingsService>();
            settingsMock.Setup(s => s.GetSettings()).Returns(new AppSettings());

            var loggingMock = new Mock<Core.Interfaces.ILoggingService>();
            var connector = new TallyOdbcConnector(settingsMock.Object, loggingMock.Object);

            var queryDef = new QueryDefinition
            {
                CollectionName = forbiddenSql,
                Limit = 10
            };

            await Assert.ThrowsAsync<TallyOdbcException>(() => connector.ExecuteQueryAsync(queryDef));
        }

        [Fact]
        public async Task OdbcSchemaDiscoveryService_PerformsScanAndClassifiesCollections()
        {
            var connectorMock = new Mock<ITallyOdbcConnector>();
            connectorMock.Setup(c => c.GetTablesAsync(default))
                .ReturnsAsync(new List<string> { "Ledger", "Voucher", "UnknownTable" });

            connectorMock.Setup(c => c.GetColumnsAsync("Ledger", default))
                .ReturnsAsync(new List<DiscoveryField>
                {
                    new DiscoveryField { Name = "Name", DataType = FieldDataType.String, Ordinal = 1 }
                });

            connectorMock.Setup(c => c.GetColumnsAsync("Voucher", default))
                .ReturnsAsync(new List<DiscoveryField>
                {
                    new DiscoveryField { Name = "VoucherNumber", DataType = FieldDataType.String, Ordinal = 1 }
                });

            connectorMock.Setup(c => c.GetColumnsAsync("UnknownTable", default))
                .ReturnsAsync(new List<DiscoveryField>());

            var repoMock = new Mock<IDiscoveryRepository>();
            repoMock.Setup(r => r.SaveScanAsync(It.IsAny<DiscoveryScan>())).ReturnsAsync(1);

            var loggingMock = new Mock<Core.Interfaces.ILoggingService>();
            var service = new OdbcSchemaDiscoveryService(connectorMock.Object, repoMock.Object, loggingMock.Object);

            var scan = await service.PerformScanAsync("COMP_001", "Acme Corp");

            Assert.Equal("COMP_001", scan.CompanyId);
            Assert.Equal(3, scan.CollectionCount);
            Assert.Equal("Completed", scan.Status);
        }

        [Fact]
        public async Task DataExplorerService_RecordRecentCollection_MaintainsRecentStack()
        {
            var connectorMock = new Mock<ITallyOdbcConnector>();
            var repoMock = new Mock<IDiscoveryRepository>();
            var explorer = new DataExplorerService(connectorMock.Object, repoMock.Object);

            await explorer.RecordRecentCollectionAsync("COMP_A", "Ledger");
            await explorer.RecordRecentCollectionAsync("COMP_A", "Voucher");
            await explorer.RecordRecentCollectionAsync("COMP_A", "Ledger");

            var recents = await explorer.GetRecentCollectionsAsync("COMP_A");

            Assert.Equal(2, recents.Count);
            Assert.Equal("Ledger", recents[0]);
            Assert.Equal("Voucher", recents[1]);
        }
    }
}
