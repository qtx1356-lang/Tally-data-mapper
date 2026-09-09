using System;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class TallyConnectionService : ITallyConnectionService
    {
        private readonly ITallyConnector _connector;
        private readonly ILoggingService _logger;

        public TallyConnectionStatus CurrentStatus { get; private set; } = TallyConnectionStatus.Disconnected;
        public TallyConnectionOptions Options { get; private set; } = new TallyConnectionOptions();
        public TallyConnectionResult? LastResult { get; private set; }
        public TallyCompanyContext? ActiveCompanyContext { get; private set; }

        public TallyConnectionService(ITallyConnector connector, ILoggingService logger)
        {
            _connector = connector;
            _logger = logger;
        }

        public async Task<TallyConnectionResult> TestConnectionAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            Options = options;
            CurrentStatus = TallyConnectionStatus.Connecting;
            _logger.LogInfo($"Testing Tally connection to {options.Host}:{options.Port}...");

            var result = await _connector.TestConnectionAsync(options, cancellationToken);
            LastResult = result;
            CurrentStatus = result.Success ? TallyConnectionStatus.Connected : result.Status;

            return result;
        }

        public async Task<TallyConnectionResult> ConnectAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            var result = await TestConnectionAsync(options, cancellationToken);
            if (result.Success)
            {
                CurrentStatus = TallyConnectionStatus.Connected;
                _logger.LogInfo($"Successfully connected to TallyPrime at {options.Host}:{options.Port}");
            }
            else
            {
                CurrentStatus = result.Status;
                _logger.LogWarning($"Failed to connect to TallyPrime: {result.ErrorMessage}");
            }
            return result;
        }

        public Task DisconnectAsync()
        {
            CurrentStatus = TallyConnectionStatus.Disconnected;
            ClearCompanyContext();
            _logger.LogInfo("Tally connection disconnected by user.");
            return Task.CompletedTask;
        }

        public void UpdateOptions(TallyConnectionOptions options)
        {
            Options = options;
        }

        public void SetCompanyContext(TallyCompanyContext context)
        {
            ActiveCompanyContext = context;
            ActiveCompanyContext.IsActive = true;
            _logger.LogInfo($"Active company context set to '{context.CompanyName}' ({context.DisplayFinancialYear}).");
        }

        public void ClearCompanyContext()
        {
            if (ActiveCompanyContext != null)
            {
                _logger.LogInfo($"Cleared active company context for '{ActiveCompanyContext.CompanyName}'.");
                ActiveCompanyContext = null;
            }
        }
    }
}
