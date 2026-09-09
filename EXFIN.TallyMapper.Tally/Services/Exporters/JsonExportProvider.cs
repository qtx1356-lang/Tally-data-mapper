using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services.Exporters
{
    public class JsonExportProvider : IExportProvider
    {
        public ExportFormat Format => ExportFormat.Json;
        public string FormatId => "JSON";
        public string DisplayName => "JSON (JavaScript Object Notation)";
        public string DefaultFileExtension => ".json";

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
                Format = ExportFormat.Json,
                RecordsRead = mappedData.TotalRows
            };

            var jsonOpts = request.Options.Json ?? new JsonExportOptions();
            bool isMetadataAndData = jsonOpts.FormatStyle == "MetadataAndData";

            var jsonWriterOptions = new JsonWriterOptions
            {
                Indented = jsonOpts.Indented
            };

            try
            {
                using (var stream = new FileStream(request.DestinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new Utf8JsonWriter(stream, jsonWriterOptions))
                {
                    if (isMetadataAndData)
                    {
                        writer.WriteStartObject();

                        // Metadata header
                        writer.WriteStartObject("metadata");
                        writer.WriteString("mapping", request.Mapping?.Name ?? "Output Mapping");
                        writer.WriteString("company", request.CompanyName);
                        writer.WriteString("generatedAt", DateTime.UtcNow.ToString("o"));
                        writer.WriteNumber("totalRecords", mappedData.TotalRows);
                        writer.WriteEndObject();

                        // Data array
                        writer.WriteStartArray("data");
                    }
                    else
                    {
                        writer.WriteStartArray();
                    }

                    int processed = 0;
                    int written = 0;

                    foreach (var row in mappedData.Rows)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        processed++;

                        writer.WriteStartObject();
                        foreach (var col in mappedData.Schema.Columns)
                        {
                            row.TryGetValue(col.Name, out var val);
                            WriteJsonValue(writer, col.Name, val, request.Options);
                        }
                        writer.WriteEndObject();
                        written++;

                        if (processed % 100 == 0 || processed == mappedData.Rows.Count)
                        {
                            progress?.Report(new ExportProgressUpdate
                            {
                                Status = ExportJobStatus.WritingOutput,
                                Message = $"Writing JSON records ({processed}/{mappedData.TotalRows})...",
                                RecordsProcessed = processed,
                                TotalRecords = mappedData.TotalRows
                            });
                        }
                    }

                    if (isMetadataAndData)
                    {
                        writer.WriteEndArray(); // end data
                        writer.WriteEndObject(); // end root
                    }
                    else
                    {
                        writer.WriteEndArray();
                    }

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
                result.Errors.Add("JSON export was cancelled.");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Failed;
                result.Errors.Add($"JSON Export failed: {ex.Message}");
            }

            return result;
        }

        private static void WriteJsonValue(Utf8JsonWriter writer, string propertyName, object? val, ExportOptions globalOptions)
        {
            if (val == null || val == DBNull.Value)
            {
                if (string.IsNullOrEmpty(globalOptions.NullRepresentation))
                {
                    writer.WriteNull(propertyName);
                }
                else
                {
                    writer.WriteString(propertyName, globalOptions.NullRepresentation);
                }
                return;
            }

            if (val is bool b)
            {
                writer.WriteBoolean(propertyName, b);
            }
            else if (val is int i)
            {
                writer.WriteNumber(propertyName, i);
            }
            else if (val is long l)
            {
                writer.WriteNumber(propertyName, l);
            }
            else if (val is decimal dec)
            {
                writer.WriteNumber(propertyName, Math.Round(dec, globalOptions.DecimalPlaces));
            }
            else if (val is double d)
            {
                writer.WriteNumber(propertyName, Math.Round(d, globalOptions.DecimalPlaces));
            }
            else if (val is DateTime dt)
            {
                writer.WriteString(propertyName, dt.ToString(globalOptions.DateFormat ?? "yyyy-MM-dd"));
            }
            else
            {
                writer.WriteString(propertyName, val.ToString());
            }
        }
    }
}
