using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IExportProfileRepository
    {
        Task<List<ExportProfile>> GetAllProfilesAsync();
        Task<ExportProfile?> GetProfileByIdAsync(string id);
        Task<ExportProfile> SaveProfileAsync(ExportProfile profile);
        Task<bool> DeleteProfileAsync(string id);
    }

    public interface IExportHistoryRepository
    {
        Task<List<ExportHistory>> GetHistoryAsync(int limit = 100);
        Task LogExportAsync(ExportHistory history);
        Task<bool> ClearHistoryAsync();
    }
}
