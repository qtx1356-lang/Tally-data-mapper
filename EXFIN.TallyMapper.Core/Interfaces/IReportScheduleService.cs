using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IReportScheduleService
    {
        Task<List<ReportSchedule>> GetSchedulesAsync();
        Task<ReportSchedule> SaveScheduleAsync(ReportSchedule schedule);
        Task<bool> DeleteScheduleAsync(string id);
        Task<ScheduleExecutionResult> DispatchScheduleAsync(string scheduleId);
        Task<List<ScheduleDeliveryLog>> GetDeliveryLogsAsync(string scheduleId = null);
    }
}
