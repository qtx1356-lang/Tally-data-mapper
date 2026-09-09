using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IReportEngine
    {
        Task<ReportDataSet> ExecuteReportAsync(string reportId, Dictionary<string, object> parameterValues, CancellationToken cancellationToken = default);
        Task<ReportValidationResult> ValidateReportAsync(ReportDefinition report, CancellationToken cancellationToken = default);
        Task<ReportDefinition> DuplicateReportAsync(string reportId);
        Task<string> RenderReportToHtmlAsync(ReportDefinition report, ReportDataSet dataSet);
    }

    public class ReportDataSet
    {
        public string ReportId { get; set; }
        public string ReportName { get; set; }
        public int RowCount { get; set; }
        public List<Dictionary<string, object>> Data { get; set; } = new List<Dictionary<string, object>>();
        public System.DateTime ExecutedAt { get; set; } = System.DateTime.UtcNow;
    }

    public class ReportValidationResult
    {
        public bool IsValid { get; set; }
        public bool MappingCompatible { get; set; }
        public string Status { get; set; }
        public List<ReportValidationMessage> Messages { get; set; } = new List<ReportValidationMessage>();
    }

    public class ReportValidationMessage
    {
        public string Level { get; set; } // Error, Warning, Info
        public string ComponentId { get; set; }
        public string Message { get; set; }
    }
}
