using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;
using EXFIN.TallyMapper.Tally.Services;
using Xunit;

namespace EXFIN.TallyMapper.Tests.Tally
{
    public class TallyConnectionServiceTests
    {
        private class FakeTallyConnector : ITallyConnector
        {
            public string Protocol => "HTTP";
            public bool ShouldSucceed { get; set; } = true;

            public Task<TallyConnectionResult> TestConnectionAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
            {
                if (ShouldSucceed)
                {
                    return Task.FromResult(TallyConnectionResult.CreateSuccess(15, "HTTP", "<ENVELOPE></ENVELOPE>"));
                }
                return Task.FromResult(TallyConnectionResult.CreateFailure(TallyErrorCode.CONNECTION_REFUSED, "Refused", "Details"));
            }

            public Task<TallyResponse> SendXmlRequestAsync(TallyConnectionOptions options, string xmlPayload, CancellationToken cancellationToken = default)
            {
                return Task.FromResult(new TallyResponse { Success = ShouldSucceed, RawPreview = "<ENVELOPE></ENVELOPE>" });
            }

            public Task<TallyCapabilities> DetectCapabilitiesAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
            {
                return Task.FromResult(new TallyCapabilities { IsTallyDetected = ShouldSucceed });
            }
        }

        private class FakeLoggingService : ILoggingService
        {
            public void LogInfo(string message) { }
            public void LogWarning(string message) { }
            public void LogError(string message, System.Exception? exception = null) { }
            public void LogDebug(string message) { }
        }

        [Fact]
        public async Task ConnectAsync_SuccessfulResponse_UpdatesStatusToConnected()
        {
            var connector = new FakeTallyConnector { ShouldSucceed = true };
            var logger = new FakeLoggingService();
            var service = new TallyConnectionService(connector, logger);

            var options = new TallyConnectionOptions { Host = "localhost", Port = 9000 };
            var result = await service.ConnectAsync(options);

            Assert.True(result.Success);
            Assert.Equal(TallyConnectionStatus.Connected, service.CurrentStatus);
        }

        [Fact]
        public async Task DisconnectAsync_ClearsCompanyContextAndSetsStatusDisconnected()
        {
            var connector = new FakeTallyConnector();
            var logger = new FakeLoggingService();
            var service = new TallyConnectionService(connector, logger);

            service.SetCompanyContext(new TallyCompanyContext { CompanyName = "ABC TRADING" });
            Assert.NotNull(service.ActiveCompanyContext);

            await service.DisconnectAsync();

            Assert.Equal(TallyConnectionStatus.Disconnected, service.CurrentStatus);
            Assert.Null(service.ActiveCompanyContext);
        }
    }
}
