using System.Threading.Tasks;
using Xunit;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Services;

namespace EXFIN.TallyMapper.Tests
{
    public class Phase18ReportReconstructionTests
    {
        [Fact]
        public async Task TestReportDiscoveryAndParityVerification()
        {
            var service = new ReportReconstructionService();
            var reports = await service.GetAllReportsAsync("COMP-ACME-001");

            Assert.NotEmpty(reports);
            var dayBook = reports.Find(r => r.ReportId == "REP-DAYBOOK-001");
            Assert.NotNull(dayBook);
            Assert.Equal(ReportClassification.Standard, dayBook.Type);

            // Parity test
            var parity = await service.RunParityTestAsync(dayBook.ReportId, "COMP-ACME-001");
            Assert.Equal(ParityLevel.Exact, parity.OverallParity);
            Assert.True(parity.ControlTotalsMatched);
            Assert.Equal(0.00m, parity.VarianceAmount);
        }

        [Fact]
        public async Task TestReportCloningSafety()
        {
            var service = new ReportReconstructionService();
            var clone = await service.CloneReportAsync("REP-SALES-REG-001", "Custom Sales Audit", "COMP-ACME-001");

            Assert.NotNull(clone);
            Assert.True(clone.IsCloned);
            Assert.Equal(ReportClassification.Derived, clone.Type);
            Assert.Equal("REP-SALES-REG-001", clone.SourceTallyReportId);
        }

        [Fact]
        public async Task TestTdlStaticAnalysisSandboxing()
        {
            var service = new ReportReconstructionService();
            string mockTdl = @"
[Report: CustomDispatchReport]
Form: CustomDispatchForm
[Collection: CustomDispatchColl]
Type: Voucher
[Field: DispatchLRNumber]
Set as: ##LRNum
";
            var result = await service.AnalyzeTdlContentAsync("test.tdl", mockTdl);
            Assert.Contains("CustomDispatchReport", result.DiscoveredReports);
            Assert.Contains("CustomDispatchColl", result.DiscoveredCollections);
            Assert.False(result.ContainsExecutableRisk);
        }
    }
}
