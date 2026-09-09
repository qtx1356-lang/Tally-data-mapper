using System;
using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Models
{
    public class TallyConnectionResult
    {
        public bool Success { get; set; }
        public TallyConnectionStatus Status { get; set; } = TallyConnectionStatus.Disconnected;
        public TallyErrorCode ErrorCode { get; set; } = TallyErrorCode.None;
        public string ErrorMessage { get; set; } = string.Empty;
        public string TechnicalDetails { get; set; } = string.Empty;
        public long ResponseTimeMs { get; set; }
        public string Protocol { get; set; } = "HTTP";
        public DateTime TestedAt { get; set; } = DateTime.Now;
        public string RawPreview { get; set; } = string.Empty;

        public static TallyConnectionResult CreateSuccess(long responseTimeMs, string protocol = "HTTP", string preview = "")
        {
            return new TallyConnectionResult
            {
                Success = true,
                Status = TallyConnectionStatus.Connected,
                ErrorCode = TallyErrorCode.None,
                ErrorMessage = "Connected to TallyPrime",
                TechnicalDetails = "Valid Tally integration response received.",
                ResponseTimeMs = responseTimeMs,
                Protocol = protocol,
                TestedAt = DateTime.Now,
                RawPreview = preview
            };
        }

        public static TallyConnectionResult CreateFailure(TallyErrorCode code, string message, string technicalDetails, long responseTimeMs = 0)
        {
            return new TallyConnectionResult
            {
                Success = false,
                Status = code == TallyErrorCode.CONNECTION_TIMEOUT ? TallyConnectionStatus.Timeout : TallyConnectionStatus.Failed,
                ErrorCode = code,
                ErrorMessage = message,
                TechnicalDetails = technicalDetails,
                ResponseTimeMs = responseTimeMs,
                TestedAt = DateTime.Now
            };
        }
    }
}
