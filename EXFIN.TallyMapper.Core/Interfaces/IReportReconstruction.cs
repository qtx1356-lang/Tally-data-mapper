using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IReportRegistry
    {
        Task<List<ReconstructedReportDefinition>> GetAllReportsAsync(string companyId);
        Task<ReconstructedReportDefinition?> GetReportByIdAsync(string reportId, string companyId);
        Task<ReconstructedReportDefinition> RegisterReportAsync(ReconstructedReportDefinition report);
        Task<bool> UpdateReportStatusAsync(string reportId, ReportReconstructionStatus status);
        Task<bool> ToggleFavoriteAsync(string reportId);
        Task<bool> TogglePinnedAsync(string reportId);
    }

    public interface IReportReconstructionEngine
    {
        Task<List<ReconstructedReportDefinition>> DiscoverReportsAsync(string companyId);
        Task<ReconstructedReportDefinition> InspectReportAsync(string reportId, string companyId);
        Task<ReconstructedReportDefinition> ReconstructReportAsync(string reportId, string companyId);
        Task<ReconstructedReportDefinition> CloneReportAsync(string sourceReportId, string newName, string companyId);
        Task<List<Dictionary<string, object>>> PreviewReportAsync(string reportId, string companyId, bool preferLocalData, int rowLimit);
    }

    public interface IReportParityEngine
    {
        Task<ParityTestResult> RunParityTestAsync(string reportId, string companyId, double numericTolerance = 0.01);
        Task<List<ParityTestResult>> GetParityHistoryAsync(string reportId);
    }

    public interface ITdlStaticAnalyzer
    {
        Task<TdlStaticAnalysisResult> AnalyzeTdlContentAsync(string fileName, string tdlSourceText);
    }
}
