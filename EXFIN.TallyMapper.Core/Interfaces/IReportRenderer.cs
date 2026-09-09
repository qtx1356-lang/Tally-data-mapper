using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IReportRenderer
    {
        Task<string> RenderAsync(ReportDefinition report, ReportDataSet dataSet);
        Task<byte[]> ExportToExcelAsync(ReportDefinition report, ReportDataSet dataSet);
        Task<string> ExportToCsvAsync(ReportDefinition report, ReportDataSet dataSet);
        Task<string> ExportToJsonAsync(ReportDefinition report, ReportDataSet dataSet);
    }
}
