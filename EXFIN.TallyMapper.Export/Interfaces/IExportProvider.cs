using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Export.Models;
using EXFIN.TallyMapper.Mapping.Models;

namespace EXFIN.TallyMapper.Export.Interfaces
{
    public interface IExportProvider
    {
        string FormatName { get; }
        Task<ExportResult> ExportAsync(OutputMapping mapping, IEnumerable<IDictionary<string, object?>> records, string destinationPath, CancellationToken cancellationToken = default);
    }
}
