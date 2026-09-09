namespace EXFIN.TallyMapper.Tally.Models
{
    public class TallyCompany
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Guid { get; set; }
        public string? BooksFrom { get; set; }
        public string? FinancialYearFrom { get; set; }
        public string? FinancialYearTo { get; set; }
        public bool IsActive { get; set; }
        public bool IsSelected { get; set; }
        public string? RawIdentifier { get; set; }

        public string DisplayFinancialYear => !string.IsNullOrEmpty(FinancialYearFrom) && !string.IsNullOrEmpty(FinancialYearTo)
            ? $"{FinancialYearFrom} → {FinancialYearTo}"
            : (BooksFrom ?? "Not Specified");
    }
}
