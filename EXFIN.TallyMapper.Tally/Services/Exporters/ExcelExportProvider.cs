using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services.Exporters
{
    public class ExcelExportProvider : IExportProvider
    {
        public ExportFormat Format => ExportFormat.Excel;
        public string FormatId => "EXCEL";
        public string DisplayName => "Excel Workbook (.xlsx)";
        public string DefaultFileExtension => ".xlsx";

        public ExportCapabilities Capabilities => new ExportCapabilities
        {
            SupportsStreaming = true,
            SupportsMultipleSheets = true,
            SupportsHierarchicalData = false,
            RequiresSchema = false,
            SupportsAppend = false,
            SupportsOverwrite = true
        };

        public async Task<ExportResult> ExportAsync(
            MappedDataResult mappedData,
            ExportRequest request,
            IProgress<ExportProgressUpdate>? progress = null,
            CancellationToken cancellationToken = default)
        {
            var result = new ExportResult
            {
                DestinationPath = request.DestinationPath,
                Validation = mappedData.Validation
            };

            var stats = new ExportStatistics
            {
                StartedAt = DateTime.UtcNow,
                Format = ExportFormat.Excel,
                RecordsRead = mappedData.TotalRows
            };

            var excelOpts = request.Options.Excel ?? new ExcelExportOptions();
            string baseSheetName = string.IsNullOrWhiteSpace(excelOpts.WorksheetName) ? "Data" : excelOpts.WorksheetName;
            int splitLimit = excelOpts.SplitRowsLimit > 0 ? excelOpts.SplitRowsLimit : 1000000;

            try
            {
                // Calculate sheet splits if total rows exceed split limit
                int totalRows = mappedData.Rows.Count;
                int sheetCount = Math.Max(1, (int)Math.Ceiling((double)totalRows / splitLimit));

                using (var fileStream = new FileStream(request.DestinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var zip = new ZipArchive(fileStream, ZipArchiveMode.Create, true))
                {
                    // 1. [Content_Types].xml
                    var contentTypesEntry = zip.CreateEntry("[Content_Types].xml");
                    using (var writer = new StreamWriter(contentTypesEntry.Open(), Encoding.UTF8))
                    {
                        writer.Write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
                        writer.Write("<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">\n");
                        writer.Write("  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>\n");
                        writer.Write("  <Default Extension=\"xml\" ContentType=\"application/xml\"/>\n");
                        writer.Write("  <Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>\n");
                        writer.Write("  <Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>\n");
                        for (int s = 1; s <= sheetCount; s++)
                        {
                            writer.Write($"  <Override PartName=\"/xl/worksheets/sheet{s}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>\n");
                        }
                        writer.Write("</Types>");
                    }

                    // 2. _rels/.rels
                    var relsEntry = zip.CreateEntry("_rels/.rels");
                    using (var writer = new StreamWriter(relsEntry.Open(), Encoding.UTF8))
                    {
                        writer.Write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
                        writer.Write("<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n");
                        writer.Write("  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>\n");
                        writer.Write("</Relationships>");
                    }

                    // 3. xl/_rels/workbook.xml.rels
                    var wbRelsEntry = zip.CreateEntry("xl/_rels/workbook.xml.rels");
                    using (var writer = new StreamWriter(wbRelsEntry.Open(), Encoding.UTF8))
                    {
                        writer.Write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
                        writer.Write("<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n");
                        writer.Write("  <Relationship Id=\"rIdStyles\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>\n");
                        for (int s = 1; s <= sheetCount; s++)
                        {
                            writer.Write($"  <Relationship Id=\"rIdSheet{s}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{s}.xml\"/>\n");
                        }
                        writer.Write("</Relationships>");
                    }

                    // 4. xl/workbook.xml
                    var wbEntry = zip.CreateEntry("xl/workbook.xml");
                    using (var writer = new StreamWriter(wbEntry.Open(), Encoding.UTF8))
                    {
                        writer.Write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
                        writer.Write("<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">\n");
                        writer.Write("  <sheets>\n");
                        for (int s = 1; s <= sheetCount; s++)
                        {
                            string sName = sheetCount == 1 ? baseSheetName : $"{baseSheetName}_{s}";
                            writer.Write($"    <sheet name=\"{XmlEscape(sName)}\" sheetId=\"{s}\" r:id=\"rIdSheet{s}\"/>\n");
                        }
                        writer.Write("  </sheets>\n");
                        writer.Write("</workbook>");
                    }

                    // 5. xl/styles.xml
                    var stylesEntry = zip.CreateEntry("xl/styles.xml");
                    using (var writer = new StreamWriter(stylesEntry.Open(), Encoding.UTF8))
                    {
                        writer.Write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
                        writer.Write("<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">\n");
                        writer.Write("  <fonts count=\"2\">\n");
                        writer.Write("    <font><sz val=\"11\"/><name val=\"Calibri\"/></font>\n");
                        writer.Write("    <font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font>\n");
                        writer.Write("  </fonts>\n");
                        writer.Write("  <fills count=\"2\">\n");
                        writer.Write("    <fill><patternFill patternType=\"none\"/></fill>\n");
                        writer.Write("    <fill><patternFill patternType=\"gray125\"/></fill>\n");
                        writer.Write("  </fills>\n");
                        writer.Write("  <borders count=\"1\">\n");
                        writer.Write("    <border><left/><right/><top/><bottom/></border>\n");
                        writer.Write("  </borders>\n");
                        writer.Write("  <cellStyleXfs count=\"1\">\n");
                        writer.Write("    <xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/>\n");
                        writer.Write("  </cellStyleXfs>\n");
                        writer.Write("  <cellXfs count=\"2\">\n");
                        writer.Write("    <xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>\n"); // 0: Normal
                        writer.Write("    <xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>\n"); // 1: Header Bold
                        writer.Write("  </cellXfs>\n");
                        writer.Write("</styleSheet>");
                    }

                    // 6. xl/worksheets/sheet1.xml ... sheetN.xml
                    int processedRecords = 0;
                    int writtenRecords = 0;

                    for (int s = 1; s <= sheetCount; s++)
                    {
                        var sheetEntry = zip.CreateEntry($"xl/worksheets/sheet{s}.xml");
                        using (var writer = new StreamWriter(sheetEntry.Open(), Encoding.UTF8))
                        {
                            writer.Write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
                            writer.Write("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">\n");

                            if (excelOpts.FreezeHeader)
                            {
                                writer.Write("  <sheetViews>\n");
                                writer.Write("    <sheetView tabSelected=\"1\" workbookViewId=\"0\">\n");
                                writer.Write("      <pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/>\n");
                                writer.Write("    </sheetView>\n");
                                writer.Write("  </sheetViews>\n");
                            }

                            writer.Write("  <sheetData>\n");

                            int startIdx = (s - 1) * splitLimit;
                            int endIdx = Math.Min(totalRows, s * splitLimit);

                            // Header Row
                            if (excelOpts.IncludeHeaders)
                            {
                                writer.Write("    <row r=\"1\">\n");
                                var columns = mappedData.Schema.Columns;
                                for (int c = 0; c < columns.Count; c++)
                                {
                                    string colRef = GetColumnRef(c + 1);
                                    writer.Write($"      <c r=\"{colRef}1\" t=\"inlineStr\" s=\"1\"><is><t>{XmlEscape(columns[c].Name)}</t></is></c>\n");
                                }
                                writer.Write("    </row>\n");
                            }

                            int excelRowNumber = excelOpts.IncludeHeaders ? 2 : 1;

                            for (int rIdx = startIdx; rIdx < endIdx; rIdx++)
                            {
                                cancellationToken.ThrowIfCancellationRequested();
                                var row = mappedData.Rows[rIdx];
                                processedRecords++;

                                writer.Write($"    <row r=\"{excelRowNumber}\">\n");
                                var columns = mappedData.Schema.Columns;

                                for (int c = 0; c < columns.Count; c++)
                                {
                                    string colRef = GetColumnRef(c + 1);
                                    string colName = columns[c].Name;
                                    row.TryGetValue(colName, out var rawVal);

                                    if (rawVal == null || rawVal == DBNull.Value)
                                    {
                                        if (!string.IsNullOrEmpty(excelOpts.NullRepresentation))
                                        {
                                            writer.Write($"      <c r=\"{colRef}{excelRowNumber}\" t=\"inlineStr\"><is><t>{XmlEscape(excelOpts.NullRepresentation)}</t></is></c>\n");
                                        }
                                    }
                                    else if (rawVal is int || rawVal is long || rawVal is decimal || rawVal is double || rawVal is float)
                                    {
                                        writer.Write($"      <c r=\"{colRef}{excelRowNumber}\"><v>{rawVal}</v></c>\n");
                                    }
                                    else if (rawVal is bool b)
                                    {
                                        writer.Write($"      <c r=\"{colRef}{excelRowNumber}\" t=\"b\"><v>{(b ? 1 : 0)}</v></c>\n");
                                    }
                                    else if (rawVal is DateTime dt)
                                    {
                                        string dtStr = dt.ToString(excelOpts.DateFormat ?? request.Options.DateFormat ?? "yyyy-MM-dd");
                                        writer.Write($"      <c r=\"{colRef}{excelRowNumber}\" t=\"inlineStr\"><is><t>{XmlEscape(dtStr)}</t></is></c>\n");
                                    }
                                    else
                                    {
                                        string valStr = rawVal.ToString() ?? string.Empty;
                                        writer.Write($"      <c r=\"{colRef}{excelRowNumber}\" t=\"inlineStr\"><is><t>{XmlEscape(valStr)}</t></is></c>\n");
                                    }
                                }

                                writer.Write("    </row>\n");
                                excelRowNumber++;
                                writtenRecords++;

                                if (processedRecords % 100 == 0 || processedRecords == totalRows)
                                {
                                    progress?.Report(new ExportProgressUpdate
                                    {
                                        Status = ExportJobStatus.WritingOutput,
                                        Message = $"Writing Excel records ({processedRecords}/{totalRows})...",
                                        RecordsProcessed = processedRecords,
                                        TotalRecords = totalRows
                                    });
                                }
                            }

                            writer.Write("  </sheetData>\n");
                            writer.Write("</worksheet>");
                        }
                    }

                    stats.RecordsWritten = writtenRecords;
                    stats.BytesWritten = fileStream.Length;
                }

                stats.CompletedAt = DateTime.UtcNow;
                stats.DurationMs = (long)(stats.CompletedAt.Value - stats.StartedAt).TotalMilliseconds;
                result.Statistics = stats;
                result.Success = true;
                result.Status = ExportJobStatus.Completed;
            }
            catch (OperationCanceledException)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Cancelled;
                result.Errors.Add("Excel export was cancelled.");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Failed;
                result.Errors.Add($"Excel Export failed: {ex.Message}");
            }

            return result;
        }

        private static string GetColumnRef(int columnNumber)
        {
            int dividend = columnNumber;
            string columnName = string.Empty;

            while (dividend > 0)
            {
                int modulo = (dividend - 1) % 26;
                columnName = Convert.ToChar(65 + modulo) + columnName;
                dividend = (dividend - modulo) / 26;
            }

            return columnName;
        }

        private static string XmlEscape(string unescaped)
        {
            if (string.IsNullOrEmpty(unescaped)) return string.Empty;
            return unescaped
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&apos;");
        }
    }
}
