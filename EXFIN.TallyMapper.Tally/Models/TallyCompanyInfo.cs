namespace EXFIN.TallyMapper.Tally.Models
{
    public class TallyCompanyInfo
    {
        public string Name { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public string FinancialYear { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
    }
}
