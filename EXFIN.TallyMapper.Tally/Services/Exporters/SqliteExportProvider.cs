using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using Microsoft.Data.Sqlite;

namespace EXFIN.TallyMapper.Tally.Services.Exporters
{
    public class SqliteExportProvider : IExportProvider
    {
        public ExportFormat Format => ExportFormat.Sqlite;
        public string FormatId => "SQLITE";
        public string DisplayName => "SQLite Database (.db)";
        public string DefaultFileExtension => ".db";

        public ExportCapabilities Capabilities => new ExportCapabilities
        {
            SupportsStreaming = true,
            SupportsMultipleSheets = false,
            SupportsHierarchicalData = false,
            RequiresSchema = true,
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
                Format = ExportFormat.Sqlite,
                RecordsRead = mappedData.TotalRows
            };

            var sqliteOpts = request.Options.Sqlite ?? new SqliteExportOptions();
            string tableName = SanitizeSqliteIdentifier(sqliteOpts.TableName);
            if (string.IsNullOrEmpty(tableName)) tableName = "ExportTable";

            var connectionString = $"Data Source={request.DestinationPath};";

            try
            {
                using (var conn = new SqliteConnection(connectionString))
                {
                    await conn.OpenAsync(cancellationToken);

                    // 1. Create / Manage Table Schema
                    using (var cmd = conn.CreateCommand())
                    {
                        if (sqliteOpts.OverwriteMode == "Replace" || sqliteOpts.OverwriteMode == "Overwrite")
                        {
                            cmd.CommandText = $"DROP TABLE IF EXISTS \"{tableName}\";";
                            await cmd.ExecuteNonQueryAsync(cancellationToken);
                        }

                        var sbCreate = new StringBuilder();
                        sbCreate.AppendLine($"CREATE TABLE IF NOT EXISTS \"{tableName}\" (");
                        sbCreate.AppendLine("  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,");

                        var cols = mappedData.Schema.Columns;
                        for (int i = 0; i < cols.Count; i++)
                        {
                            var col = cols[i];
                            string colName = SanitizeSqliteIdentifier(col.Name);
                            string sqliteType = MapToSqliteType(col.DataType);

                            sbCreate.Append($"  \"{colName}\" {sqliteType}");
                            if (i < cols.Count - 1) sbCreate.Append(",");
                            sbCreate.AppendLine();
                        }
                        sbCreate.AppendLine(");");

                        cmd.CommandText = sbCreate.ToString();
                        await cmd.ExecuteNonQueryAsync(cancellationToken);
                    }

                    // 2. Prepare Insert Statement
                    var colsList = mappedData.Schema.Columns;
                    var colNamesClean = new List<string>();
                    var paramNames = new List<string>();

                    for (int i = 0; i < colsList.Count; i++)
                    {
                        string cName = SanitizeSqliteIdentifier(colsList[i].Name);
                        colNamesClean.Add($"\"{cName}\"");
                        paramNames.Add($"@p{i}");
                    }

                    string insertSql = $"INSERT INTO \"{tableName}\" ({string.Join(", ", colNamesClean)}) VALUES ({string.Join(", ", paramNames)});";

                    int processed = 0;
                    int written = 0;
                    int batchSize = 500;

                    using (var tx = conn.BeginTransaction())
                    {
                        using (var insertCmd = conn.CreateCommand())
                        {
                            insertCmd.Transaction = tx;
                            insertCmd.CommandText = insertSql;

                            for (int i = 0; i < colsList.Count; i++)
                            {
                                insertCmd.Parameters.Add(new SqliteParameter($"@p{i}", DBNull.Value));
                            }

                            foreach (var row in mappedData.Rows)
                            {
                                cancellationToken.ThrowIfCancellationRequested();
                                processed++;

                                for (int i = 0; i < colsList.Count; i++)
                                {
                                    var col = colsList[i];
                                    row.TryGetValue(col.Name, out var rawVal);
                                    insertCmd.Parameters[i].Value = FormatSqliteParamValue(rawVal, col.DataType, request.Options);
                                }

                                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
                                written++;

                                if (processed % batchSize == 0)
                                {
                                    tx.Commit();
                                    // start new transaction
                                    tx.Dispose();
                                    // re-assign transaction variable
                                    break; // batch loop handled below
                                }
                            }
                        }
                    }

                    // Complete remaining rows if batch handled
                    if (written < mappedData.Rows.Count)
                    {
                        using (var tx = conn.BeginTransaction())
                        using (var insertCmd = conn.CreateCommand())
                        {
                            insertCmd.Transaction = tx;
                            insertCmd.CommandText = insertSql;
                            for (int i = 0; i < colsList.Count; i++)
                            {
                                insertCmd.Parameters.Add(new SqliteParameter($"@p{i}", DBNull.Value));
                            }

                            for (int idx = written; idx < mappedData.Rows.Count; idx++)
                            {
                                cancellationToken.ThrowIfCancellationRequested();
                                var row = mappedData.Rows[idx];
                                processed++;

                                for (int i = 0; i < colsList.Count; i++)
                                {
                                    var col = colsList[i];
                                    row.TryGetValue(col.Name, out var rawVal);
                                    insertCmd.Parameters[i].Value = FormatSqliteParamValue(rawVal, col.DataType, request.Options);
                                }

                                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
                                written++;

                                if (processed % 100 == 0 || processed == mappedData.Rows.Count)
                                {
                                    progress?.Report(new ExportProgressUpdate
                                    {
                                        Status = ExportJobStatus.WritingOutput,
                                        Message = $"Writing SQLite records ({processed}/{mappedData.TotalRows})...",
                                        RecordsProcessed = processed,
                                        TotalRecords = mappedData.TotalRows
                                    });
                                }
                            }

                            tx.Commit();
                        }
                    }

                    stats.RecordsWritten = written;
                    stats.BytesWritten = new FileInfo(request.DestinationPath).Length;
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
                result.Errors.Add("SQLite export was cancelled.");
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Status = ExportJobStatus.Failed;
                result.Errors.Add($"SQLite Export failed: {ex.Message}");
            }

            return result;
        }

        public static string SanitizeSqliteIdentifier(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Field";
            string clean = Regex.Replace(name.Trim(), @"[^\w]", "_");
            if (char.IsDigit(clean[0])) clean = "_" + clean;
            return clean;
        }

        private static string MapToSqliteType(FieldDataType dataType)
        {
            return dataType switch
            {
                FieldDataType.Integer => "INTEGER",
                FieldDataType.Decimal => "REAL",
                FieldDataType.Boolean => "INTEGER",
                FieldDataType.Date => "TEXT",
                FieldDataType.DateTime => "TEXT",
                _ => "TEXT"
            };
        }

        private static object FormatSqliteParamValue(object? rawVal, FieldDataType dataType, ExportOptions opts)
        {
            if (rawVal == null || rawVal == DBNull.Value) return DBNull.Value;

            if (dataType == FieldDataType.Decimal || dataType == FieldDataType.Double)
            {
                if (decimal.TryParse(rawVal.ToString(), out var dec))
                {
                    return Math.Round(dec, opts.DecimalPlaces);
                }
            }

            if (dataType == FieldDataType.Date && rawVal is DateTime dt)
            {
                return dt.ToString(opts.DateFormat ?? "yyyy-MM-dd");
            }

            if (dataType == FieldDataType.Boolean)
            {
                if (rawVal is bool b) return b ? 1 : 0;
                if (bool.TryParse(rawVal.ToString(), out var bParsed)) return bParsed ? 1 : 0;
            }

            return rawVal.ToString() ?? (object)DBNull.Value;
        }
    }
}
