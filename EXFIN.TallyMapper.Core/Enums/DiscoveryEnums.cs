namespace EXFIN.TallyMapper.Core.Enums
{
    public enum OdbcConnectionMethod
    {
        Auto = 0,
        Dsn = 1,
        ConnectionString = 2
    }

    public enum FieldDataType
    {
        String = 0,
        Integer = 1,
        Long = 2,
        Decimal = 3,
        Boolean = 4,
        Date = 5,
        DateTime = 6,
        Binary = 7,
        Unknown = 99
    }

    public enum CollectionCategory
    {
        Masters = 0,
        Transactions = 1,
        Inventory = 2,
        Accounting = 3,
        Payroll = 4,
        Reports = 5,
        Other = 6,
        System = 7
    }

    public enum CategoryClassification
    {
        Known = 0,
        Inferred = 1,
        Unknown = 2
    }

    public enum SourceType
    {
        ODBC = 0,
        HTTP = 1,
        XML = 2,
        JSON = 3,
        TDL = 4,
        Inferred = 5,
        VerifiedApplication = 6
    }

    public enum DiscoveryConfidence
    {
        Verified = 0,
        High = 1,
        Medium = 2,
        Inferred = 3,
        Unknown = 4
    }

    public enum TallyRelationshipType
    {
        Contains = 0,
        References = 1,
        ParentOf = 2,
        ChildOf = 3,
        BelongsTo = 4,
        Uses = 5,
        Allocates = 6,
        DerivedFrom = 7,
        Unknown = 99
    }

    public enum CardinalityType
    {
        OneToOne = 0,
        OneToMany = 1,
        ManyToOne = 2,
        ManyToMany = 3,
        Unknown = 99
    }

    public enum RecognitionStatus
    {
        Recognized = 0,
        Possible = 1,
        Unknown = 2
    }

    public enum CustomType
    {
        Standard = 0,
        Custom = 1,
        Unknown = 2
    }
}

