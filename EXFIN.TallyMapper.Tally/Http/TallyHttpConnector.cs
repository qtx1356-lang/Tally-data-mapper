using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Core.Utilities;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Http
{
    public class TallyHttpConnector : ITallyConnector
    {
        private readonly HttpClient _httpClient;
        private readonly ILoggingService _logger;
        private readonly ITallyResponseParser _xmlParser;

        public string Protocol => "HTTP";

        public TallyHttpConnector(HttpClient httpClient, ILoggingService logger, ITallyResponseParser xmlParser)
        {
            _httpClient = httpClient ?? new HttpClient();
            _logger = logger;
            _xmlParser = xmlParser;
        }

        public async Task<TallyConnectionResult> TestConnectionAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            if (!options.IsValidHost)
            {
                return TallyConnectionResult.CreateFailure(
                    TallyErrorCode.INVALID_HOST,
                    TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.INVALID_HOST, options.Host, options.Port),
                    "Host cannot be empty or whitespace.");
            }

            if (!options.IsValidPort)
            {
                return TallyConnectionResult.CreateFailure(
                    TallyErrorCode.INVALID_PORT,
                    TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.INVALID_PORT, options.Host, options.Port),
                    $"Port {options.Port} is out of range (1-65535).");
            }

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

            var sw = Stopwatch.StartNew();
            _logger.LogInfo($"Initiating Tally connection test to {options.BaseUrl}...");

            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(options.TimeoutSeconds));

                var content = new StringContent(requestXml, Encoding.UTF8, "text/xml");
                var response = await _httpClient.PostAsync(options.BaseUrl, content, cts.Token);
                sw.Stop();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Tally test returned HTTP Status {(int)response.StatusCode} {response.ReasonPhrase}");
                    return TallyConnectionResult.CreateFailure(
                        TallyErrorCode.HTTP_ERROR,
                        $"Tally returned HTTP Status {(int)response.StatusCode} ({response.ReasonPhrase})",
                        $"Endpoint: {options.BaseUrl}\nStatusCode: {(int)response.StatusCode}\nReason: {response.ReasonPhrase}",
                        sw.ElapsedMilliseconds);
                }

                string responseBody = await response.Content.ReadAsStringAsync(cts.Token);
                string preview = responseBody.Length > 4096 ? responseBody.Substring(0, 4096) : responseBody;

                if (_xmlParser.CanParse(responseBody))
                {
                    _logger.LogInfo($"Tally connection test successful. Response time: {sw.ElapsedMilliseconds} ms");
                    return TallyConnectionResult.CreateSuccess(sw.ElapsedMilliseconds, "HTTP", preview);
                }
                else
                {
                    _logger.LogWarning("Tally responded, but response was not recognized as valid Tally XML.");
                    return TallyConnectionResult.CreateFailure(
                        TallyErrorCode.INVALID_TALLY_RESPONSE,
                        TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.INVALID_TALLY_RESPONSE, options.Host, options.Port),
                        $"Received unexpected response preview: {preview.Substring(0, Math.Min(200, preview.Length))}",
                        sw.ElapsedMilliseconds);
                }
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                sw.Stop();
                _logger.LogWarning($"Connection timeout to Tally at {options.BaseUrl} after {options.TimeoutSeconds}s.");
                return TallyConnectionResult.CreateFailure(
                    TallyErrorCode.CONNECTION_TIMEOUT,
                    TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.CONNECTION_TIMEOUT, options.Host, options.Port),
                    $"Timed out after {options.TimeoutSeconds} seconds trying to reach {options.BaseUrl}.",
                    sw.ElapsedMilliseconds);
            }
            catch (HttpRequestException ex)
            {
                sw.Stop();
                _logger.LogError($"HTTP connection error reaching Tally at {options.BaseUrl}: {ex.Message}");

                TallyErrorCode code = TallyErrorCode.TALLY_NOT_RUNNING;
                if (ex.Message.Contains("refused") || ex.Message.Contains("No connection could be made"))
                {
                    code = TallyErrorCode.CONNECTION_REFUSED;
                }

                return TallyConnectionResult.CreateFailure(
                    code,
                    TallyErrorMessages.GetFriendlyMessage(code, options.Host, options.Port),
                    $"Technical exception: {ex.Message}",
                    sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogError($"Unexpected connection error: {ex.Message}");
                return TallyConnectionResult.CreateFailure(
                    TallyErrorCode.UNKNOWN_ERROR,
                    TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.UNKNOWN_ERROR, options.Host, options.Port),
                    $"Exception: {ex.GetType().Name} - {ex.Message}",
                    sw.ElapsedMilliseconds);
            }
        }

        public async Task<TallyResponse> SendXmlRequestAsync(TallyConnectionOptions options, string xmlPayload, CancellationToken cancellationToken = default)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(options.TimeoutSeconds));

                var content = new StringContent(xmlPayload, Encoding.UTF8, "text/xml");
                var response = await _httpClient.PostAsync(options.BaseUrl, content, cts.Token);
                string responseBody = await response.Content.ReadAsStringAsync(cts.Token);

                return _xmlParser.ParseResponse(responseBody);
            }
            catch (Exception ex)
            {
                return new TallyResponse
                {
                    Success = false,
                    Format = "XML",
                    Status = "ERROR",
                    Message = ex.Message,
                    RawPreview = string.Empty
                };
            }
        }

        public async Task<TallyCapabilities> DetectCapabilitiesAsync(TallyConnectionOptions options, CancellationToken cancellationToken = default)
        {
            var capabilities = new TallyCapabilities
            {
                Port = options.Port,
                ServerName = options.Host
            };

            var testResult = await TestConnectionAsync(options, cancellationToken);
            capabilities.IsTallyDetected = testResult.Success;
            capabilities.SupportsHttp = testResult.Success;

            if (testResult.Success)
            {
                capabilities.SupportsXml = true;
                capabilities.SupportsJson = null; // Unknown unless JSON interface tested
                capabilities.SupportsOdbc = null; // Phase 2: ODBC detection boundary
                capabilities.SupportsTdl = true; // TDL supported via XML HTTP request
                capabilities.TallyVersion = "TallyPrime 3.0+";
            }
            else
            {
                capabilities.SupportsXml = false;
                capabilities.SupportsJson = false;
                capabilities.SupportsOdbc = null;
                capabilities.SupportsTdl = false;
            }

            return capabilities;
        }
    }
}
