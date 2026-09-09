using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class TallyCompanyService : ITallyCompanyService
    {
        private readonly ITallyConnector _connector;
        private readonly ITallyResponseParser _xmlParser;
        private readonly ILoggingService _logger;

        public TallyCompanyService(ITallyConnector connector, ITallyResponseParser xmlParser, ILoggingService logger)
        {
            _connector = connector;
            _xmlParser = xmlParser;
            _logger = logger;
        }

        public async Task<List<TallyCompany>> GetCompaniesAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            _logger.LogInfo($"Fetching available Tally companies from {options.BaseUrl}...");

            string requestXml = @"<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Companies</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>";

            try
            {
                var response = await _connector.SendXmlRequestAsync(options, requestXml, cancellationToken);
                if (response.Success && !string.IsNullOrEmpty(response.RawPreview))
                {
                    var companies = _xmlParser.ParseCompanies(response.RawPreview);
                    _logger.LogInfo($"Successfully detected {companies.Count} Tally company/companies.");
                    return companies;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to fetch companies from Tally: {ex.Message}");
            }

            return new List<TallyCompany>();
        }

        public Task<TallyCompanyContext?> SelectCompanyAsync(TallyConnectionOptions options, TallyCompany company, CancellationToken cancellationToken = default)
        {
            if (company == null || string.IsNullOrWhiteSpace(company.Name))
            {
                _logger.LogWarning("Cannot select an empty or null Tally company.");
                return Task.FromResult<TallyCompanyContext?>(null);
            }

            var context = new TallyCompanyContext
            {
                ConnectionId = Guid.NewGuid().ToString("N"),
                CompanyName = company.Name,
                CompanyGuid = company.Guid ?? string.Empty,
                FinancialYearFrom = company.FinancialYearFrom ?? string.Empty,
                FinancialYearTo = company.FinancialYearTo ?? string.Empty,
                SelectedAt = DateTime.Now,
                IsActive = true
            };

            _logger.LogInfo($"Company '{company.Name}' selected. Context created successfully.");
            return Task.FromResult<TallyCompanyContext?>(context);
        }

        public async Task<bool> VerifyCompanyContextAsync(TallyConnectionOptions options, TallyCompanyContext context, CancellationToken cancellationToken = default)
        {
            if (context == null || string.IsNullOrWhiteSpace(context.CompanyName))
            {
                return false;
            }

            _logger.LogInfo($"Verifying company context for '{context.CompanyName}'...");

            // Get live list of companies from Tally
            var liveCompanies = await GetCompaniesAsync(options, cancellationToken);
            bool exists = liveCompanies.Exists(c => c.Name.Equals(context.CompanyName, StringComparison.OrdinalIgnoreCase));

            if (!exists)
            {
                _logger.LogWarning($"Company '{context.CompanyName}' is no longer available in TallyPrime.");
                context.IsActive = false;
            }
            else
            {
                _logger.LogInfo($"Company '{context.CompanyName}' verified active in TallyPrime.");
            }

            return exists;
        }
    }
}
