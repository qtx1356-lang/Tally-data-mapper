using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services.Exporters
{
    public class CsvExportProvider : IExportProvider
    {
        public ExportFormat Format => ExportFormat.Csv;
        public string FormatId => "CSV";
        public string DisplayName => "CSV (Comma Separated Values)";
        public string DefaultFileExtension => ".csv";

        public ExportCapabilities Capabilities => new ExportCapabilities
        {
            SupportsStreaming = true,
            SupportsMultipleSheets = false,
            SupportsHierarchicalData = false,
            RequiresSchema = false,
            SupportsAppend = true,
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
                Format = ExportFormat.Csv,
                RecordsRead = mappedData.TotalRows
            };

            var csvOpts = request.Options.Csv ?? new CsvExportOptions();
            string delimiter = csvOpts.Delimiter;
            if (delimiter == "\\t" || delimiter == "Tab") delimiter = "\t";
            if (string.IsNullOrEmpty(delimiter)) delimiter = ",";

            string nullRep = csvOpts.NullRepresentation ?? request.Options.NullRepresentation ?? string.Empty;
            string dateFormat = request.Options.DateFormat ?? "yyyy-MM-dd";
            int decimalPlaces = request.Options.DecimalPlaces;

            Encoding encoding = csvOpts.UseUtf8Bom ? new UTF8Encoding(true) : new UTF8Encoding(false);

            try
            {
                using (var stream = new FileStream(request.DestinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new StreamWriter(stream, encoding))
                {
                    var columns = mappedData.Schema.Columns;

                    // Header
                    if (csvOpts.IncludeHeaders)
                    {
                        for (int i = 0; i < columns.Count; i++)
                        {
                            if (i > 0) await writer.WriteAsync(delimiter);
                            await writer.WriteAsync(FormatCsvField(columns[i].Name, delimiter, csvOpts.QuoteHandling));
                        }
                        await writer.WriteAsync(csvOpts.NewlineStyle);
                    }

                    int processed = 0;
                    int written = 0;
                    int errors = 0;

                    foreach (var row in mappedData.Rows)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        processed++;

                        try
                        {
                            for (int i = 0; i < columns.Count; i++)
                            {
                                if (i > 0) await writer.WriteAsync(delimiter);

                                var colName = columns[i].Name;
                                row.TryGetValue(colName, out var rawVal);

                                string formattedStr = FormatValue(rawVal, nullRep, dateFormat, decimalPlaces);
                                string escaped = FormatCsvField(formattedStr, delimiter, csvOpts.QuoteHandling);
                                await writer.WriteAsync(escaped);
                            }

                            await writer.WriteAsync(csvOpts.NewlineStyle);
                            written++;
                        }
                        catch (Exception ex)
                        {
                            errors++;
                            result.Errors.Add($"Row {processed}: {ex.Message}");
                            if (request.Options.StopOnRowError)
                            {
                                throw;
                            }
                        }

                        if (processed % 100 == 0 || processed == mappedData.Rows.Count)
                        {
                            progress?.Report(new ExportProgressUpdate
                            {
                                Status = ExportJobStatus.WritingOutput,
                                Message = $"Writing CSV records ({processed}/{mappedData.TotalRows})...",
                                RecordsProcessed = processed,
                                TotalRecords = mappedData.TotalRows
                            });
                        }
                    }

                    await writer.FlushAsync();
                    stats.RecordsWritten = written;
                    stats.RecordsSkipped = processed - written;
                    stats.ErrorCount = errors;
                    stats.BytesWritten = stream.Length;
                }

                stats.CompletedAt = DateTime.UtcNow;
                stats.DurationMs = (long)(stats.CompletedAt.Value - stats.StartedAt).TotalMilliseconds;
                result.Statistics = stats;
                result.Success = errors == 0;
                result.Status = errors == 0 ? ExportJobStatus.Completed : ExportJobStatus.CompletedWithWarnings;
            }
            catch (OperationCanceledException)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Cancelled;
                result.Errors.Add("CSV export was cancelled.");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Failed;
                result.Errors.Add($"CSV Export failed: {ex.Message}");
            }

            return result;
        }

        public static string FormatCsvField(string val, string delimiter, string quoteHandling)
        {
            if (val == null) return string.Empty;

            bool mustQuote = quoteHandling == "AlwaysQuote" ||
                             val.Contains(delimiter) ||
                             val.Contains("\"") ||
                             val.Contains("\r") ||
                             val.Contains("\n");

            if (mustQuote)
            {
                string escaped = val.Replace("\"", "\"\"");
                return $"\"{escaped}\"";
            }

            return val;
        }

        private static string FormatValue(object? rawVal, string nullRep, string dateFormat, int decimalPlaces)
        {
            if (rawVal == null || rawVal == DBNull.Value)
            {
                return nullRep;
            }

            if (rawVal is DateTime dt)
            {
                return dt.ToString(dateFormat);
            }

            if (rawVal is decimal d)
            {
                return Math.Round(d, decimalPlaces).ToString($"F{decimalPlaces}");
            }

            if (rawVal is double db)
            {
                return Math.Round(db, decimalPlaces).ToString($"F{decimalPlaces}");
            }

            if (rawVal is float fl)
            {
                return Math.Round(fl, decimalPlaces).ToString($"F{decimalPlaces}");
            }

            return rawVal.ToString() ?? nullRep;
        }
    }
}
