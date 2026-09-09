using System;

namespace EXFIN.TallyMapper.Core.Exceptions
{
    public class TallyMapperException : Exception
    {
        public string ErrorCode { get; }

        public TallyMapperException(string message, string errorCode = "GENERAL_ERROR") : base(message)
        {
            ErrorCode = errorCode;
        }

        public TallyMapperException(string message, Exception innerException, string errorCode = "GENERAL_ERROR") : base(message, innerException)
        {
            ErrorCode = errorCode;
        }
    }
}
