using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Database.Repositories
{
    public interface IMappingRepository
    {
        Task<OutputMapping> SaveMappingAsync(OutputMapping mapping, CancellationToken cancellationToken = default);
        Task<OutputMapping?> GetMappingByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<List<OutputMapping>> GetAllMappingsAsync(string? companyId = null, string? searchTerm = null, CancellationToken cancellationToken = default);
        Task<bool> DeleteMappingAsync(string id, CancellationToken cancellationToken = default);
    }
}
