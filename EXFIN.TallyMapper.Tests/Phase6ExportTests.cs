using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Services;
using EXFIN.TallyMapper.Tally.Services.Exporters;
using Xunit;

namespace EXFIN.TallyMapper.Tests
{
    public class Phase6ExportTests
    {
        [Fact]
        public void CsvExport_Formats_Fields_With_Quotes_Correctly()
        {
            string normal = CsvExportProvider.FormatCsvField("SimpleText", ",", "Auto");
            Assert.Equal("SimpleText", normal);

            string withComma = CsvExportProvider.FormatCsvField("ABC, LTD", ",", "Auto");
            Assert.Equal("\"ABC, LTD\"", withComma);

            string withQuotes = CsvExportProvider.FormatCsvField("Say \"Hello\"", ",", "Auto");
            Assert.Equal("\"Say \"\"Hello\"\"\"", withQuotes);

            string withNewline = CsvExportProvider.FormatCsvField("Line 1\nLine 2", ",", "Auto");
            Assert.Equal("\"Line 1\nLine 2\"", withNewline);
        }

        [Fact]
        public void XmlExport_Sanitizes_Element_Names_Correctly()
        {
            Assert.Equal("Invoice_Date", XmlExportProvider.SanitizeXmlElementName("Invoice Date"));
            Assert.Equal("Party_GSTIN", XmlExportProvider.SanitizeXmlElementName("Party@GSTIN!"));
            Assert.Equal("_123_Field", XmlExportProvider.SanitizeXmlElementName("123 Field"));
            Assert.Equal("Voucher_No", XmlExportProvider.SanitizeXmlElementName("Voucher#No"));
        }

        [Fact]
        public void SqliteExport_Sanitizes_Identifiers_Correctly()
        {
            Assert.Equal("Customer_Name", SqliteExportProvider.SanitizeSqliteIdentifier("Customer Name"));
            Assert.Equal("_2026_Sales", SqliteExportProvider.SanitizeSqliteIdentifier("2026 Sales"));
            Assert.Equal("Voucher_Amount", SqliteExportProvider.SanitizeSqliteIdentifier("Voucher-Amount"));
        }

        [Fact]
        public void ExportEngine_Sanitizes_Filenames_Correctly()
        {
            Assert.Equal("ABC_TRADING_PVT_LTD", ExportEngine.SanitizeFilename("ABC TRADING PVT LTD"));
            Assert.Equal("GST_Sales_2026", ExportEngine.SanitizeFilename("GST/Sales\\2026"));
        }

        [Fact]
        public void ExportEngine_Resolves_Destination_Tokens_Correctly()
        {
            var mockEngine = new ExportEngine(null!, null!, null!, null!, null!, new List<IExportProvider>());
            var timestamp = new DateTime(2026, 9, 7, 12, 30, 45);

            string rawPath = @"C:\Exports\{company}\{mapping}_{date}.xlsx";
            string resolved = mockEngine.ResolveDestinationPath(rawPath, "ABC Trading", "GST Sales", timestamp);

            Assert.Equal(@"C:\Exports\ABC_Trading\GST_Sales_2026-09-07.xlsx", resolved);
        }

        [Fact]
        public async Task CsvExportProvider_Generates_Valid_Csv_File()
        {
            var provider = new CsvExportProvider();
            string tempFile = Path.Combine(Path.GetTempPath(), $"test_export_{Guid.NewGuid():N}.csv");

            try
            {
                var mappedData = new MappedDataResult
                {
                    Schema = new OutputSchema
                    {
                        Columns = new List<OutputSchemaColumn>
                        {
                            new OutputSchemaColumn { Name = "Date", DataType = FieldDataType.Date },
                            new OutputSchemaColumn { Name = "Customer", DataType = FieldDataType.String },
                            new OutputSchemaColumn { Name = "Amount", DataType = FieldDataType.Decimal }
                        }
                    },
                    Rows = new List<Dictionary<string, object?>>
                    {
                        new Dictionary<string, object?>
                        {
                            ["Date"] = new DateTime(2026, 9, 7),
                            ["Customer"] = "ACME, Inc.",
                            ["Amount"] = 1500.50m
                        }
                    },
                    TotalRows = 1
                };

                var request = new ExportRequest
                {
                    DestinationPath = tempFile,
                    Format = ExportFormat.Csv,
                    CompanyName = "TEST CO",
                    Options = new ExportOptions { Csv = new CsvExportOptions { Delimiter = "," } }
                };

                var result = await provider.ExportAsync(mappedData, request);

                Assert.True(result.Success);
                Assert.True(File.Exists(tempFile));

                string content = await File.ReadAllTextAsync(tempFile);
                Assert.Contains("Date,Customer,Amount", content);
                Assert.Contains("\"ACME, Inc.\"", content);
                Assert.Contains("1500.50", content);
            }
            finally
            {
                if (File.Exists(tempFile)) File.Delete(tempFile);
            }
        }

        [Fact]
        public async Task JsonExportProvider_Generates_Valid_Json_Structure()
        {
            var provider = new JsonExportProvider();
            string tempFile = Path.Combine(Path.GetTempPath(), $"test_export_{Guid.NewGuid():N}.json");

            try
            {
                var mappedData = new MappedDataResult
                {
                    Schema = new OutputSchema
                    {
                        Columns = new List<OutputSchemaColumn>
                        {
                            new OutputSchemaColumn { Name = "InvoiceNo", DataType = FieldDataType.String },
                            new OutputSchemaColumn { Name = "Amount", DataType = FieldDataType.Decimal }
                        }
                    },
                    Rows = new List<Dictionary<string, object?>>
                    {
                        new Dictionary<string, object?>
                        {
                            ["InvoiceNo"] = "INV-1001",
                            ["Amount"] = 2500m
                        }
                    },
                    TotalRows = 1
                };

                var request = new ExportRequest
                {
                    DestinationPath = tempFile,
                    Format = ExportFormat.Json,
                    CompanyName = "ABC TRADING",
                    Options = new ExportOptions { Json = new JsonExportOptions { FormatStyle = "MetadataAndData" } }
                };

                var result = await provider.ExportAsync(mappedData, request);

                Assert.True(result.Success);
                Assert.True(File.Exists(tempFile));

                string content = await File.ReadAllTextAsync(tempFile);
                Assert.Contains("\"metadata\"", content);
                Assert.Contains("\"company\": \"ABC TRADING\"", content);
                Assert.Contains("\"INV-1001\"", content);
            }
            finally
            {
                if (File.Exists(tempFile)) File.Delete(tempFile);
            }
        }
    }
}
