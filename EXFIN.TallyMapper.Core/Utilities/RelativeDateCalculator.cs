using System;

namespace EXFIN.TallyMapper.Core.Utilities
{
    public class DateRangeResult
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string DisplayLabel { get; set; }
    }

    public static class RelativeDateCalculator
    {
        public static DateRangeResult ResolveRelativeDateRange(string keyword, DateTime? baseDate = null, int fyStartMonth = 4)
        {
            DateTime refDate = baseDate ?? DateTime.Today;
            DateTime fromDate;
            DateTime toDate;

            switch (keyword?.Trim()?.ToLowerInvariant())
            {
                case "today":
                    fromDate = refDate.Date;
                    toDate = refDate.Date;
                    break;

                case "yesterday":
                    fromDate = refDate.Date.AddDays(-1);
                    toDate = refDate.Date.AddDays(-1);
                    break;

                case "current week":
                    int diff = (7 + (refDate.DayOfWeek - DayOfWeek.Monday)) % 7;
                    fromDate = refDate.Date.AddDays(-1 * diff);
                    toDate = fromDate.AddDays(6);
                    break;

                case "previous week":
                    int prevDiff = (7 + (refDate.DayOfWeek - DayOfWeek.Monday)) % 7;
                    fromDate = refDate.Date.AddDays(-1 * prevDiff - 7);
                    toDate = fromDate.AddDays(6);
                    break;

                case "current month":
                    fromDate = new DateTime(refDate.Year, refDate.Month, 1);
                    toDate = fromDate.AddMonths(1).AddDays(-1);
                    break;

                case "previous month":
                    DateTime prevMonthRef = refDate.AddMonths(-1);
                    fromDate = new DateTime(prevMonthRef.Year, prevMonthRef.Month, 1);
                    toDate = fromDate.AddMonths(1).AddDays(-1);
                    break;

                case "current quarter":
                    int quarterIndex = (refDate.Month - 1) / 3;
                    fromDate = new DateTime(refDate.Year, quarterIndex * 3 + 1, 1);
                    toDate = fromDate.AddMonths(3).AddDays(-1);
                    break;

                case "previous quarter":
                    int currQIndex = (refDate.Month - 1) / 3;
                    DateTime qRef = new DateTime(refDate.Year, currQIndex * 3 + 1, 1).AddMonths(-3);
                    fromDate = new DateTime(qRef.Year, qRef.Month, 1);
                    toDate = fromDate.AddMonths(3).AddDays(-1);
                    break;

                case "current financial year":
                case "current fy":
                    int startYear = refDate.Month >= fyStartMonth ? refDate.Year : refDate.Year - 1;
                    fromDate = new DateTime(startYear, fyStartMonth, 1);
                    toDate = new DateTime(startYear + 1, fyStartMonth, 1).AddDays(-1);
                    break;

                case "previous financial year":
                case "previous fy":
                    int prevFyStartYear = (refDate.Month >= fyStartMonth ? refDate.Year : refDate.Year - 1) - 1;
                    fromDate = new DateTime(prevFyStartYear, fyStartMonth, 1);
                    toDate = new DateTime(prevFyStartYear + 1, fyStartMonth, 1).AddDays(-1);
                    break;

                default:
                    fromDate = refDate.Date;
                    toDate = refDate.Date;
                    break;
            }

            string label = $"{fromDate:dd-MMM-yyyy} to {toDate:dd-MMM-yyyy}";
            return new DateRangeResult
            {
                FromDate = fromDate,
                ToDate = toDate,
                DisplayLabel = label
            };
        }
    }
}
