using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services.Exporters
{
    public class XmlExportProvider : IExportProvider
    {
        public ExportFormat Format => ExportFormat.Xml;
        public string FormatId => "XML";
        public string DisplayName => "XML (Extensible Markup Language)";
        public string DefaultFileExtension => ".xml";

        public ExportCapabilities Capabilities => new ExportCapabilities
        {
            SupportsStreaming = true,
            SupportsMultipleSheets = false,
            SupportsHierarchicalData = true,
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
                Format = ExportFormat.Xml,
                RecordsRead = mappedData.TotalRows
            };

            var xmlOpts = request.Options.Xml ?? new XmlExportOptions();
            string rootTag = SanitizeXmlElementName(xmlOpts.RootElementName);
            if (string.IsNullOrEmpty(rootTag)) rootTag = "ExportData";

            string rowTag = SanitizeXmlElementName(xmlOpts.RowElementName);
            if (string.IsNullOrEmpty(rowTag)) rowTag = "Row";

            var xmlWriterSettings = new XmlWriterSettings
            {
                Async = true,
                Indent = true,
                Encoding = Encoding.UTF8
            };

            try
            {
                using (var stream = new FileStream(request.DestinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = XmlWriter.Create(stream, xmlWriterSettings))
                {
                    await writer.WriteStartDocumentAsync();
                    await writer.WriteStartElementAsync(null, rootTag, null);

                    if (xmlOpts.IncludeMetadata)
                    {
                        await writer.WriteStartElementAsync(null, "Metadata", null);
                        await writer.WriteElementStringAsync(null, "Mapping", null, request.Mapping?.Name ?? "Output Mapping");
                        await writer.WriteElementStringAsync(null, "Company", null, request.CompanyName);
                        await writer.WriteElementStringAsync(null, "GeneratedAt", null, DateTime.UtcNow.ToString("o"));
                        await writer.WriteElementStringAsync(null, "TotalRecords", null, mappedData.TotalRows.ToString());
                        await writer.WriteEndElementAsync(); // Metadata
                    }

                    await writer.WriteStartElementAsync(null, "Data", null);

                    int processed = 0;
                    int written = 0;

                    foreach (var row in mappedData.Rows)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        processed++;

                        await writer.WriteStartElementAsync(null, rowTag, null);

                        foreach (var col in mappedData.Schema.Columns)
                        {
                            string elementTag = SanitizeXmlElementName(col.Name);
                            row.TryGetValue(col.Name, out var rawVal);

                            string valStr = FormatValue(rawVal, xmlOpts.NullRepresentation, request.Options);
                            await writer.WriteElementStringAsync(null, elementTag, null, valStr);
                        }

                        await writer.WriteEndElementAsync(); // Row
                        written++;

                        if (processed % 100 == 0 || processed == mappedData.Rows.Count)
                        {
                            progress?.Report(new ExportProgressUpdate
                            {
                                Status = ExportJobStatus.WritingOutput,
                                Message = $"Writing XML records ({processed}/{mappedData.TotalRows})...",
                                RecordsProcessed = processed,
                                TotalRecords = mappedData.TotalRows
                            });
                        }
                    }

                    await writer.WriteEndElementAsync(); // Data
                    await writer.WriteEndElementAsync(); // Root
                    await writer.WriteEndDocumentAsync();
                    await writer.FlushAsync();

                    stats.RecordsWritten = written;
                    stats.BytesWritten = stream.Length;
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
                result.Errors.Add("XML export was cancelled.");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Failed;
                result.Errors.Add($"XML Export failed: {ex.Message}");
            }

            return result;
        }

        public static string SanitizeXmlElementName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Field";

            // Replace spaces and invalid chars with underscore
            string clean = Regex.Replace(name.Trim(), @"[^\w\-]", "_");

            // Element name cannot start with digit or hyphens
            if (char.IsDigit(clean[0]) || clean[0] == '-')
            {
                clean = "_" + clean;
            }

            return clean;
        }

        private static string FormatValue(object? rawVal, string nullRep, ExportOptions opts)
        {
            if (rawVal == null || rawVal == DBNull.Value) return nullRep ?? string.Empty;

            if (rawVal is DateTime dt)
            {
                return dt.ToString(opts.DateFormat ?? "yyyy-MM-dd");
            }

            if (rawVal is decimal d)
            {
                return Math.Round(d, opts.DecimalPlaces).ToString($"F{opts.DecimalPlaces}");
            }

            if (rawVal is double db)
            {
                return Math.Round(db, opts.DecimalPlaces).ToString($"F{opts.DecimalPlaces}");
            }

            return rawVal.ToString() ?? nullRep ?? string.Empty;
        }
    }
}
