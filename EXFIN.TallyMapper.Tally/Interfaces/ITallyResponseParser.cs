using System.Collections.Generic;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface ITallyResponseParser
    {
        string SupportedFormat { get; }
        bool CanParse(string responseBody);
        TallyResponse ParseResponse(string responseBody);
        List<TallyCompany> ParseCompanies(string responseBody);
    }
}
