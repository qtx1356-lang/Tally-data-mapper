using System;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IExportProvider
    {
        ExportFormat Format { get; }
        string FormatId { get; }
        string DisplayName { get; }
        string DefaultFileExtension { get; }
        ExportCapabilities Capabilities { get; }

        Task<ExportResult> ExportAsync(
            MappedDataResult mappedData,
            ExportRequest request,
            IProgress<ExportProgressUpdate>? progress = null,
            CancellationToken cancellationToken = default);
    }
}
