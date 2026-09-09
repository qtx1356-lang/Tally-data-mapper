using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public class CompanyProfile
    {
        public string CompanyId { get; set; }
        public string CompanyName { get; set; } = "EXFIN GLOBAL ENTERPRISES PVT LTD";
        public string FinancialYear { get; set; } = "2026-2027";
        public string BooksBeginning { get; set; } = "01-Apr-2026";
        public string Country { get; set; } = "India";
        public string State { get; set; } = "Telangana";
        public string BaseCurrency { get; set; } = "INR (₹)";
        public string TallyVersion { get; set; } = "TallyPrime 4.1 Gold";
        
        // Capabilities
        public bool GstEnabled { get; set; } = true;
        public bool InventoryEnabled { get; set; } = true;
        public bool PayrollEnabled { get; set; } = false;
        public bool CostCentresEnabled { get; set; } = true;
        public bool GodownsEnabled { get; set; } = true;
    }

    public class DiscoveredField
    {
        public string FieldName { get; set; }
        public string DisplayName { get; set; }
        public string DataType { get; set; } // String, Decimal, Integer, Date, Boolean, Object, Collection
        public string Category { get; set; } // Identity, Date, Amount, Quantity, Tax, Customer, Supplier, Product, Address, Accounting, Inventory, Custom, Other
        public string Confidence { get; set; } = "High"; // High, Medium, Low
        public bool IsNullable { get; set; } = true;
        public bool IsCustomTDL { get; set; } = false;
        public bool IsSensitive { get; set; } = false; // Masking candidate
        public string Description { get; set; }
        public List<string> SampleValues { get; set; } = new List<string>();
        public string MaskedPattern { get; set; } // e.g., XXXXXX1234
    }

    public class DiscoveredCollection
    {
        public string Name { get; set; }
        public string Category { get; set; } // Accounting, Inventory, Masters, Vouchers, Payroll, GST, Custom, Unknown
        public string ObjectType { get; set; }
        public int RecordCount { get; set; }
        public bool IsCustom { get; set; }
        public List<DiscoveredField> Fields { get; set; } = new List<DiscoveredField>();
        public List<string> SupportedFilters { get; set; } = new List<string>();
    }

    public class DiscoveredObject
    {
        public string Name { get; set; }
        public string ParentCollection { get; set; }
        public List<DiscoveredField> MethodsAndFields { get; set; } = new List<DiscoveredField>();
    }

    public class DiscoveredRelationship
    {
        public string FromCollection { get; set; }
        public string FromField { get; set; }
        public string ToCollection { get; set; }
        public string ToField { get; set; }
        public string RelationshipType { get; set; } = "OneToMany";
        public string Confidence { get; set; } = "High"; // High, Medium, Low
    }

    public class SchemaSnapshot
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string CompanyId { get; set; }
        public string CompanyName { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string TallyVersion { get; set; }
        public CompanyProfile Profile { get; set; } = new CompanyProfile();
        public List<DiscoveredCollection> Collections { get; set; } = new List<DiscoveredCollection>();
        public List<DiscoveredRelationship> Relationships { get; set; } = new List<DiscoveredRelationship>();
        public int TotalFieldsCount { get; set; }
        public int CustomFieldsCount { get; set; }
    }

    public class SchemaDiffResult
    {
        public string OldSnapshotId { get; set; }
        public string NewSnapshotId { get; set; }
        public List<string> AddedFields { get; set; } = new List<string>();
        public List<string> RemovedFields { get; set; } = new List<string>();
        public List<string> ChangedDataTypes { get; set; } = new List<string>();
        public List<string> AddedCollections { get; set; } = new List<string>();
        public List<string> RemovedCollections { get; set; } = new List<string>();
        public List<string> BreakingChanges { get; set; } = new List<string>();
    }

    public class ReconciliationResult
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string CompanyName { get; set; }
        public string ReportName { get; set; }
        public decimal TallyTotalAmount { get; set; }
        public decimal ExportTotalAmount { get; set; }
        public decimal DiscrepancyAmount { get; set; }
        public string Status { get; set; } = "MATCH"; // MATCH, MISMATCH
        public double ToleranceThreshold { get; set; } = 0.01;
        public DateTime ExecutionTime { get; set; } = DateTime.UtcNow;
        public List<ReconciliationGroupBreakdown> GroupBreakdowns { get; set; } = new List<ReconciliationGroupBreakdown>();
    }

    public class ReconciliationGroupBreakdown
    {
        public string GroupName { get; set; }
        public decimal TallyValue { get; set; }
        public decimal ReportValue { get; set; }
        public decimal Difference { get; set; }
        public double PercentageDifference { get; set; }
        public string Status { get; set; } = "MATCH";
    }

    public class DataQualityReport
    {
        public string CollectionName { get; set; }
        public int TotalRecordsAnalyzed { get; set; }
        public double OverallQualityScore { get; set; } = 96.0; // Percentage
        public double CompletenessScore { get; set; } = 98.0;
        public double ConsistencyScore { get; set; } = 95.0;
        public double ValidityScore { get; set; } = 97.0;
        public List<DataQualityIssue> IssuesFound { get; set; } = new List<DataQualityIssue>();
    }

    public class DataQualityIssue
    {
        public string IssueType { get; set; } // NullValue, MissingGSTIN, DuplicateId, InvalidDate, NegativeQuantity
        public string FieldName { get; set; }
        public int AffectedRecordCount { get; set; }
        public string Severity { get; set; } // High, Medium, Low
        public string RecommendedAction { get; set; }
    }

    public class FieldProfilingResult
    {
        public string FieldName { get; set; }
        public string DataType { get; set; }
        public int NullCount { get; set; }
        public int DistinctCount { get; set; }
        public string MinValue { get; set; }
        public string MaxValue { get; set; }
        public List<string> TopSampleValues { get; set; } = new List<string>();
    }

    public class SmartMappingSuggestion
    {
        public string OutputField { get; set; }
        public string CandidateSourceField { get; set; }
        public string Confidence { get; set; } = "High";
        public string Explanation { get; set; }
    }
}
