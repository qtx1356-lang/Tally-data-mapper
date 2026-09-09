namespace EXFIN.TallyMapper.Core.Enums
{
    public enum MappingStatus
    {
        Draft = 0,
        Valid = 1,
        Invalid = 2
    }

    public enum TransformationType
    {
        None = 0,
        TRIM = 1,
        UPPER = 2,
        LOWER = 3,
        CONCAT = 4,
        SUBSTRING = 5,
        ROUND = 6,
        ABS = 7,
        IF = 8,
        DATE = 9,
        FORMAT_DATE = 10,
        NUMBER = 11,
        STRING = 12
    }

    public enum FilterOperator
    {
        Equals = 0,
        NotEquals = 1,
        LessThan = 2,
        LessThanOrEqual = 3,
        GreaterThan = 4,
        GreaterThanOrEqual = 5,
        Contains = 6,
        StartsWith = 7,
        EndsWith = 8,
        IsNull = 9,
        IsNotNull = 10,
        Between = 11,
        In = 12
    }

    public enum FilterLogicalGroup
    {
        AND = 0,
        OR = 1
    }

    public enum OneToManyHandling
    {
        ExpandRows = 0,
        Aggregate = 1,
        First = 2,
        Last = 3,
        Count = 4,
        Concatenate = 5
    }

    public enum AggregationType
    {
        None = 0,
        SUM = 1,
        COUNT = 2,
        MIN = 3,
        MAX = 4,
        AVG = 5
    }

    public enum ErrorRowHandling
    {
        ContinueAndReport = 0,
        StopOnFirstError = 1
    }
}
