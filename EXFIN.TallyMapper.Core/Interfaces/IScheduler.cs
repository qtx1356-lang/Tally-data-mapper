using System;
using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IScheduler
    {
        DateTime? CalculateNextRunAt(JobSchedule schedule, DateTime fromDate);
        IReadOnlyList<DateTime> GenerateSchedulePreview(JobSchedule schedule, int count = 5);
        bool IsDue(AutomationJob job, DateTime checkTime);
    }
}
