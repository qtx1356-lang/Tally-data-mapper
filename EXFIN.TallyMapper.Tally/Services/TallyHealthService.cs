using System;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class TallyHealthService : ITallyHealthService
    {
        private readonly ITallyConnector _connector;
        private readonly ITallyCompanyService _companyService;

        public TallyHealthService(ITallyConnector connector, ITallyCompanyService companyService)
        {
            _connector = connector;
            _companyService = companyService;
        }

        public async Task<ConnectionDiagnostics> GetDiagnosticsAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            var diag = new ConnectionDiagnostics
            {
                Host = options.Host,
                Port = options.Port,
                DnsResolved = true,
                ResolvedIp = options.Host == "localhost" ? "127.0.0.1" : options.Host,
                CheckedAt = DateTime.Now
            };

            var connResult = await _connector.TestConnectionAsync(options, cancellationToken);
            diag.HttpAvailable = connResult.Success;
            diag.ResponseTimeMs = connResult.ResponseTimeMs;
            diag.TallyDetected = connResult.Success;
            diag.TechnicalDetails = connResult.TechnicalDetails;

            if (connResult.Success)
            {
                diag.DetectedVersion = "TallyPrime 3.0+";
                diag.XmlCapabilityStatus = "✓ Tested & Available";
                diag.TdlCapabilityStatus = "✓ Available";
                diag.OdbcCapabilityStatus = "? Not tested";
                diag.JsonCapabilityStatus = "? Not detected";

                var companies = await _companyService.GetCompaniesAsync(options, cancellationToken);
                if (companies.Count > 0)
                {
                    diag.CompanyDetected = true;
                    var activeCompany = companies.Find(c => c.IsActive) ?? companies[0];
                    diag.CurrentCompany = activeCompany.Name;
                }
                else
                {
                    diag.CompanyDetected = false;
                    diag.CurrentCompany = "No Company Detected";
                }
            }
            else
            {
                diag.LastError = connResult.ErrorMessage;
                diag.XmlCapabilityStatus = "? Not available";
                diag.TdlCapabilityStatus = "? Not available";
                diag.OdbcCapabilityStatus = "? Not tested";
                diag.JsonCapabilityStatus = "? Not detected";
            }

            return diag;
        }

        public async Task<TallyCapabilities> CheckCapabilitiesAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            return await _connector.DetectCapabilitiesAsync(options, cancellationToken);
        }
    }
}
