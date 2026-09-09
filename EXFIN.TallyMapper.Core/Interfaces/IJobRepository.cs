using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IJobRepository
    {
        Task<IReadOnlyList<AutomationJob>> GetAllAsync();
        Task<AutomationJob> GetByIdAsync(string id);
        Task<AutomationJob> SaveAsync(AutomationJob job);
        Task<bool> DeleteAsync(string id);
        Task<AutomationJob> DuplicateAsync(string id);
    }
}
