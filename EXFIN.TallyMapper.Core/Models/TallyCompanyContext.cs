using System;

namespace EXFIN.TallyMapper.Core.Models
{
    public class TallyCompanyContext
    {
        public string ConnectionId { get; set; } = Guid.NewGuid().ToString("N");
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyGuid { get; set; } = string.Empty;
        public string FinancialYearFrom { get; set; } = string.Empty;
        public string FinancialYearTo { get; set; } = string.Empty;
        public DateTime SelectedAt { get; set; } = DateTime.Now;
        public bool IsActive { get; set; }

        public string DisplayFinancialYear => !string.IsNullOrEmpty(FinancialYearFrom) && !string.IsNullOrEmpty(FinancialYearTo)
            ? $"{FinancialYearFrom} → {FinancialYearTo}"
            : "Not Specified";
    }
}
