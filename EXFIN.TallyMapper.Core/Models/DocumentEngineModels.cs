using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public class DocumentStyle
    {
        public string FontFamily { get; set; } = "Segoe UI, Arial, sans-serif";
        public double FontSizePt { get; set; } = 10;
        public string TextColorHex { get; set; } = "#0f172a";
        public string BackgroundColorHex { get; set; } = "#ffffff";
        public string Alignment { get; set; } = "Left"; // Left, Center, Right, Justify
        public bool Bold { get; set; }
        public bool Italic { get; set; }
        public string BorderStyle { get; set; } = "Solid";
        public string BorderColorHex { get; set; } = "#e2e8f0";
    }

    public class DocumentElement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string ElementType { get; set; } = "Text"; // Text, Table, Image, Line, KpiCard, Chart
        public string TextContent { get; set; }
        public string ImageUrlOrPath { get; set; }
        public DocumentStyle Style { get; set; } = new DocumentStyle();
        public List<List<string>> TableRows { get; set; } = new List<List<string>>();
        public List<string> TableHeaderColumns { get; set; } = new List<string>();
        public bool RepeatHeaderOnNewPage { get; set; } = true;
        public bool KeepWithNext { get; set; }
        public string ChartType { get; set; } // Bar, Line, Pie, Donut
        public string KpiValue { get; set; }
        public string KpiSubtitle { get; set; }
    }

    public class DocumentSection
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; }
        public bool PageBreakBefore { get; set; }
        public bool PageBreakAfter { get; set; }
        public List<DocumentElement> Elements { get; set; } = new List<DocumentElement>();
    }

    public class DocumentPage
    {
        public int PageNumber { get; set; }
        public List<DocumentSection> Sections { get; set; } = new List<DocumentSection>();
    }

    public class DocumentDefinition
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public string CompanyName { get; set; }
        public string FinancialPeriod { get; set; }
        public bool IncludeCoverPage { get; set; } = true;
        public DocumentPrintSettings PrintSettings { get; set; } = new DocumentPrintSettings();
        public List<DocumentSection> Sections { get; set; } = new List<DocumentSection>();
    }

    public class DocumentRenderResult
    {
        public bool Success { get; set; }
        public string OutputFilePath { get; set; }
        public byte[] FileBytes { get; set; }
        public long FileSizeBytes { get; set; }
        public int TotalPages { get; set; }
        public TimeSpan RenderDuration { get; set; }
        public string ErrorSummary { get; set; }
    }

    public class DocumentTemplate
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } // e.g., "Management Report", "GST Report", "Outstanding Report"
        public string Category { get; set; } = "Financial";
        public string Description { get; set; }
        public DocumentDefinition Definition { get; set; } = new DocumentDefinition();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CompanyBrandingSettings
    {
        public string CompanyName { get; set; } = "EXFIN GLOBAL ENTERPRISES PVT LTD";
        public string Address { get; set; } = "Plot 42, Financial District, Gachibowli, Hyderabad, TS - 500032";
        public string GSTIN { get; set; } = "36AABCE1234F1ZP";
        public string Phone { get; set; } = "+91 40 6789 0100";
        public string Email { get; set; } = "compliance@company.com";
        public string Website { get; set; } = "https://company.com";
        public string LogoFileName { get; set; } = "company_logo.png";
        public string LogoPath { get; set; } = "/branding/company_logo.png";
        public bool IsLogoValid { get; set; } = true;
        public string BrandingPreset { get; set; } = "Corporate"; // Default, Minimal, Corporate, Custom
        public string PrimaryColorHex { get; set; } = "#0284c7";
    }
}
