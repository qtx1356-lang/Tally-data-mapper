using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Models
{
    public class DataColumnDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public FieldDataType DataType { get; set; } = FieldDataType.String;
        public bool Nullable { get; set; } = true;
        public int Ordinal { get; set; }
        public SourceType Source { get; set; } = SourceType.ODBC;
    }

    public class QueryDefinition
    {
        public string CollectionName { get; set; } = string.Empty;
        public List<string> Fields { get; set; } = new List<string>();
        public string WhereClause { get; set; } = string.Empty;
        public string OrderBy { get; set; } = string.Empty;
        public int Limit { get; set; } = 100;
        public string SearchTerm { get; set; } = string.Empty;
    }

    public class QueryResult
    {
        public string CollectionName { get; set; } = string.Empty;
        public List<DataColumnDefinition> Columns { get; set; } = new List<DataColumnDefinition>();
        public List<Dictionary<string, object?>> Rows { get; set; } = new List<Dictionary<string, object?>>();
        public int RecordCount { get; set; }
        public long ExecutionTimeMs { get; set; }
        public List<string> Warnings { get; set; } = new List<string>();
        public bool IsTruncated { get; set; }
        public string ExecutedQuery { get; set; } = string.Empty;
    }
}
