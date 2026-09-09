using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Utilities
{
    public static class TallyErrorMessages
    {
        public static string GetFriendlyMessage(TallyErrorCode code, string host = "localhost", int port = 9000)
        {
            return code switch
            {
                TallyErrorCode.TALLY_NOT_RUNNING => $"TallyPrime could not be reached at {host}:{port}. Please open TallyPrime and verify that its integration server is enabled.",
                TallyErrorCode.CONNECTION_REFUSED => $"The TallyPrime connection was refused at {host}:{port}.",
                TallyErrorCode.CONNECTION_TIMEOUT => $"TallyPrime at {host}:{port} did not respond within the configured timeout period.",
                TallyErrorCode.INVALID_HOST => "The specified Tally host address is invalid or empty.",
                TallyErrorCode.INVALID_PORT => "Enter a valid port between 1 and 65535.",
                TallyErrorCode.HTTP_ERROR => "HTTP request to TallyPrime returned an error code.",
                TallyErrorCode.INVALID_TALLY_RESPONSE => "Tally responded, but the response was not recognized as a supported Tally integration response.",
                TallyErrorCode.COMPANY_NOT_FOUND => "The requested company is no longer available in TallyPrime.",
                TallyErrorCode.COMPANY_SELECTION_REQUIRED => "Please select an active Tally company to proceed.",
                TallyErrorCode.ODBC_NOT_AVAILABLE => "Tally ODBC interface was not detected or is disabled.",
                TallyErrorCode.UNSUPPORTED_OPERATION => "This operation is not supported by the connected Tally version.",
                TallyErrorCode.UNKNOWN_ERROR => "An unexpected error occurred while communicating with TallyPrime.",
                _ => "Unknown status."
            };
        }
    }
}
