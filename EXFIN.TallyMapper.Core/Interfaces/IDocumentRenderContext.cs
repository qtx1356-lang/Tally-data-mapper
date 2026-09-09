using System;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IDocumentRenderContext
    {
        TallyCompanyContext CompanyContext { get; set; }
        CompanyBrandingSettings BrandingSettings { get; set; }
        DocumentPrintSettings PrintSettings { get; set; }
        DateTime RenderTimestamp { get; set; }
        string ResolvedPeriodLabel { get; set; }
    }
}
