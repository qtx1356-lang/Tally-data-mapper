using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum ComponentType
    {
        Text,
        Image,
        Table,
        KPICard,
        Chart,
        Pivot,
        GroupHeader,
        GroupFooter,
        Summary,
        Spacer,
        PageBreak
    }

    public enum ChartType
    {
        Bar,
        Column,
        Line,
        Area,
        Pie,
        Donut
    }

    public enum ColumnFormatType
    {
        Text,
        Number,
        Currency,
        Percentage,
        Date,
        DateTime
    }

    public enum AggregationType
    {
        SUM,
        COUNT,
        AVG,
        MIN,
        MAX
    }

    public class TableColumnConfig
    {
        public string Id { get; set; }
        public string SourceField { get; set; }
        public string DisplayName { get; set; }
        public string Width { get; set; }
        public string Alignment { get; set; } = "Left";
        public ColumnFormatType Format { get; set; } = ColumnFormatType.Text;
        public string CurrencySymbol { get; set; } = "₹";
        public bool UseIndianFormat { get; set; } = true;
        public bool Visible { get; set; } = true;
        public bool Sortable { get; set; } = true;
        public AggregationType? Aggregate { get; set; }
        public bool GroupHeader { get; set; }
    }

    public class KPIConfig
    {
        public string Title { get; set; }
        public string ValueField { get; set; }
        public AggregationType Aggregation { get; set; } = AggregationType.SUM;
        public string CurrencySymbol { get; set; } = "₹";
        public bool UseIndianFormat { get; set; } = true;
        public string ComparisonPeriod { get; set; }
        public double? ComparisonValue { get; set; }
        public double? PercentageChange { get; set; }
        public string Subtitle { get; set; }
    }

    public class ChartConfig
    {
        public ChartType ChartType { get; set; } = ChartType.Bar;
        public string CategoryField { get; set; }
        public string ValueField { get; set; }
        public AggregationType Aggregation { get; set; } = AggregationType.SUM;
        public string SeriesField { get; set; }
        public int Limit { get; set; } = 20;
        public string Title { get; set; }
        public bool ShowLegend { get; set; } = true;
        public bool ShowLabels { get; set; } = true;
    }

    public class PivotConfig
    {
        public List<string> Rows { get; set; } = new List<string>();
        public List<string> Columns { get; set; } = new List<string>();
        public List<PivotValueField> Values { get; set; } = new List<PivotValueField>();
        public List<string> Filters { get; set; } = new List<string>();
    }

    public class PivotValueField
    {
        public string Field { get; set; }
        public AggregationType Aggregation { get; set; } = AggregationType.SUM;
        public string DisplayName { get; set; }
    }

    public class CalculatedField
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Expression { get; set; }
        public string DataType { get; set; } = "Decimal";
        public ColumnFormatType Format { get; set; } = ColumnFormatType.Number;
        public string CurrencySymbol { get; set; }
    }

    public class ReportComponent
    {
        public string Id { get; set; }
        public ComponentType Type { get; set; }
        public string Title { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int W { get; set; } = 6;
        public int H { get; set; } = 2;
        public List<TableColumnConfig> TableColumns { get; set; } = new List<TableColumnConfig>();
        public KPIConfig KPIConfig { get; set; }
        public ChartConfig ChartConfig { get; set; }
        public PivotConfig PivotConfig { get; set; }
        public string TextContent { get; set; }
        public int? FontSize { get; set; }
        public bool IsBold { get; set; }
        public string Alignment { get; set; } = "Left";
    }

    public class ReportParameter
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public string DataType { get; set; } = "Text";
        public object DefaultValue { get; set; }
        public List<string> Options { get; set; } = new List<string>();
        public bool Required { get; set; }
    }

    public class ReportFilter
    {
        public string Id { get; set; }
        public string Field { get; set; }
        public string Operator { get; set; } = "=";
        public object Value { get; set; }
        public object SecondValue { get; set; }
    }

    public class ReportTheme
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PrimaryFont { get; set; }
        public string HeadingFont { get; set; }
        public string PrimaryColor { get; set; }
        public string AccentColor { get; set; }
        public string BackgroundColor { get; set; }
        public string TextColor { get; set; }
        public string BorderStyle { get; set; }
    }

    public class ReportDefinition
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int Version { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedBy { get; set; }
        public string MappingId { get; set; }
        public string MappingName { get; set; }
        public List<ReportComponent> Components { get; set; } = new List<ReportComponent>();
        public List<CalculatedField> CalculatedFields { get; set; } = new List<CalculatedField>();
        public List<ReportParameter> Parameters { get; set; } = new List<ReportParameter>();
        public List<ReportFilter> Filters { get; set; } = new List<ReportFilter>();
        public ReportTheme Theme { get; set; }
        public PageSettings PageSettings { get; set; } = new PageSettings();
        public bool IsFavorite { get; set; }
    }

    public class PageSettings
    {
        public string PaperSize { get; set; } = "A4";
        public string Orientation { get; set; } = "Landscape";
        public string Margins { get; set; } = "Normal";
    }
}
