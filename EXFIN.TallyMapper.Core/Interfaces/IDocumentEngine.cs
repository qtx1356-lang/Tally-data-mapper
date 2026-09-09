using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IDocumentEngine
    {
        Task<byte[]> GeneratePdfDocumentAsync(ReportDefinition report, ReportDataSet dataSet, DocumentPrintSettings settings);
        Task<string> GenerateHtmlDocumentAsync(ReportDefinition report, ReportDataSet dataSet, DocumentPrintSettings settings);
        Task<byte[]> BuildReportPackageAsync(ReportPackageDefinition package, DocumentPrintSettings settings);
    }
}
