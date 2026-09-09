using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum CopilotMode
    {
        Ask,
        Analyze,
        BuildReport,
        Explain,
        Compare,
        Investigate,
        Find,
        Summarize
    }

    public enum DataSourceIndicator
    {
        LiveTally,
        LocalDataset,
        ImportedData
    }

    public class AnswerProvenance
    {
        public string Dataset { get; set; } = "Sales Vouchers";
        public string Company { get; set; } = "EXFIN GLOBAL ENTERPRISES PVT LTD";
        public string Period { get; set; } = "This Financial Year (01-Apr-2026 to 31-Mar-2027)";
        public string QueryOrReport { get; set; } = "QR_SALES_AGG_01";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string SourceType { get; set; } = "LOCAL DATASET";
        public DateTime? LastSynchronized { get; set; } = DateTime.UtcNow.AddMinutes(-12);
        public string TraceId { get; set; } = Guid.NewGuid().ToString("N");
    }

    public class AstSelectField
    {
        public string FieldName { get; set; }
        public string Alias { get; set; }
        public string AggregationFunction { get; set; } // SUM, COUNT, AVG, MIN, MAX
        public bool IsCalculated { get; set; }
        public string Expression { get; set; }
    }

    public class AstFilterNode
    {
        public string FieldName { get; set; }
        public string Operator { get; set; } // =, !=, >, >=, <, <=, LIKE, IN, BETWEEN
        public object Value { get; set; }
        public object SecondValue { get; set; }
        public string LogicalConnector { get; set; } = "AND"; // AND, OR
    }

    public class AstJoinNode
    {
        public string TargetTable { get; set; }
        public string JoinType { get; set; } = "INNER"; // INNER, LEFT
        public string SourceField { get; set; }
        public string TargetField { get; set; }
        public bool IsVerifiedRelationship { get; set; } = true;
    }

    public class AstSortNode
    {
        public string FieldName { get; set; }
        public string Direction { get; set; } = "DESC"; // ASC, DESC
    }

    public class QueryAst
    {
        public string AstId { get; set; } = Guid.NewGuid().ToString("N");
        public string PrimaryTable { get; set; } = "SalesVouchers";
        public List<AstSelectField> SelectFields { get; set; } = new List<AstSelectField>();
        public List<AstJoinNode> Joins { get; set; } = new List<AstJoinNode>();
        public List<AstFilterNode> Filters { get; set; } = new List<AstFilterNode>();
        public List<string> GroupByFields { get; set; } = new List<string>();
        public List<AstSortNode> SortNodes { get; set; } = new List<AstSortNode>();
        public int? Limit { get; set; } = 100;
        public int? Offset { get; set; } = 0;
        public int ComplexityScore { get; set; } = 1;
        public string EstimatedCost { get; set; } = "Low (<10ms)";
    }

    public class QueryValidationResult
    {
        public bool IsValid { get; set; } = true;
        public List<string> ValidationErrors { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
        public bool JoinSafetyVerified { get; set; } = true;
        public bool ComplexityWithinLimits { get; set; } = true;
        public string CompiledSafeSql { get; set; }
        public int EstimatedCostScore { get; set; } = 1;
    }

    public class TraceabilityMetadata
    {
        public string QuerySql { get; set; }
        public QueryAst QueryAst { get; set; }
        public string CalculationFormula { get; set; }
        public Dictionary<string, object> CalculationVariables { get; set; } = new Dictionary<string, object>();
        public string SourceCollectionPath { get; set; }
        public string LineagePath { get; set; }
    }

    public class InsightItem
    {
        public string InsightId { get; set; } = Guid.NewGuid().ToString("N");
        public string Type { get; set; } // Trend, Outlier, Change, Concentration, Exception, Anomaly
        public string Metric { get; set; }
        public string Period { get; set; }
        public string Evidence { get; set; }
        public string CalculationDescription { get; set; }
        public double Confidence { get; set; } = 0.95;
        public string MethodUsed { get; set; } // Z-Score, IQR, PeriodVariance, Pareto80_20, AgingBracket
        public bool RequiresAttention { get; set; }
    }

    public class AgeingBucketSummary
    {
        public string Bracket { get; set; } // 0-30 days, 31-60 days, 61-90 days, 91-180 days, 180+ days
        public decimal TotalAmount { get; set; }
        public int Count { get; set; }
        public decimal PercentageOfTotal { get; set; }
    }

    public class TaxReconciliationResult
    {
        public decimal SalesTaxComputed { get; set; }
        public decimal GstOutputRecorded { get; set; }
        public decimal Difference { get; set; }
        public bool HasVariance { get; set; }
        public string TechnicalCause { get; set; }
    }

    public class MultiStepExecutionPlan
    {
        public string PlanId { get; set; } = Guid.NewGuid().ToString("N");
        public List<string> Steps { get; set; } = new List<string>();
        public int CurrentStepIndex { get; set; } = 0;
        public Dictionary<string, object> IntermediateResults { get; set; } = new Dictionary<string, object>();
    }

    public class VoiceCommandIntent
    {
        public string CommandId { get; set; } = Guid.NewGuid().ToString("N");
        public string SpokenTranscript { get; set; }
        public string RecognizedIntent { get; set; }
        public Dictionary<string, string> ExtractedSlots { get; set; } = new Dictionary<string, string>();
        public double RecognitionConfidence { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class AiProviderConfig
    {
        public string ProviderName { get; set; } = "Gemini-3.8-Flash"; // Gemini-3.8-Flash, LocalModel, EnterpriseCloud
        public bool IsLocalMode { get; set; } = false;
        public bool IsOfflineFallbackAvailable { get; set; } = true;
        public bool DataMinimizationEnabled { get; set; } = true;
        public bool DiscloseDataTransmission { get; set; } = true;
    }
}
