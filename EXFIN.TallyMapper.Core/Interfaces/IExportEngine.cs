using System;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IExportEngine
    {
        Task<ExportResult> ExecuteExportAsync(
            ExportRequest request,
            IProgress<ExportProgressUpdate>? progress = null,
            CancellationToken cancellationToken = default);

        Task<MappingValidationResult> ValidateExportRequestAsync(ExportRequest request);

        string ResolveDestinationPath(
            string rawPath,
            string companyName,
            string mappingName,
            DateTime timestamp);
    }
}
