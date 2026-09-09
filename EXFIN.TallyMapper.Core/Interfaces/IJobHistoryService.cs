using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IJobHistoryService
    {
        Task<IReadOnlyList<JobExecution>> GetHistoryAsync(string jobId = null, int limit = 100);
        Task<JobExecution> RecordExecutionAsync(JobExecution execution);
        Task<int> CleanHistoryAsync(int retentionDays = 90);
    }
}
