using System;

namespace EXFIN.TallyMapper.Core.Exceptions
{
    public class TallyOdbcException : Exception
    {
        public string ErrorCode { get; set; } = "ODBC_ERROR";
        public string SqlState { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty;
        public string Collection { get; set; } = string.Empty;
        public string TechnicalDetails { get; set; } = string.Empty;

        public TallyOdbcException(string message) : base(message)
        {
        }

        public TallyOdbcException(string message, Exception innerException) : base(message, innerException)
        {
        }

        public TallyOdbcException(string message, string errorCode, string operation, string collection, string technicalDetails = "")
            : base(message)
        {
            ErrorCode = errorCode;
            Operation = operation;
            Collection = collection;
            TechnicalDetails = technicalDetails;
        }
    }
}
