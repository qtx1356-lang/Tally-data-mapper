namespace EXFIN.TallyMapper.Core.Enums
{
    public enum TallyErrorCode
    {
        None = 0,
        TALLY_NOT_RUNNING,
        CONNECTION_REFUSED,
        CONNECTION_TIMEOUT,
        INVALID_HOST,
        INVALID_PORT,
        HTTP_ERROR,
        INVALID_TALLY_RESPONSE,
        COMPANY_NOT_FOUND,
        COMPANY_SELECTION_REQUIRED,
        ODBC_NOT_AVAILABLE,
        UNSUPPORTED_OPERATION,
        UNKNOWN_ERROR
    }
}
