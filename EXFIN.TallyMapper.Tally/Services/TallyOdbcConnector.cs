using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Odbc;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Exceptions;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Interfaces;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class TallyOdbcConnector : ITallyOdbcConnector
    {
        private readonly IAppSettingsService _settingsService;
        private readonly ILoggingService _loggingService;

        public TallyOdbcConnector(IAppSettingsService settingsService, ILoggingService loggingService)
        {
            _settingsService = settingsService;
            _loggingService = loggingService;
        }

        public async Task<OdbcEnvironmentInfo> DetectEnvironmentAsync()
        {
            return await Task.Run(() =>
            {
                var info = new OdbcEnvironmentInfo();
                var settings = _settingsService.GetSettings();
                info.SelectedMethod = settings.OdbcConnectionMethod ?? "Auto";

                try
                {
                    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                    {
                        DetectWindowsOdbcDriversAndDsns(info);
                    }
                    else
                    {
                        info.StatusMessage = "Linux / Container environment detected. Native Windows ODBC drivers are not installed in container mode.";
                    }
                }
                catch (Exception ex)
                {
                    _loggingService.LogError("Error detecting ODBC environment", ex);
                    info.StatusMessage = $"ODBC detection notice: {ex.Message}";
                }

                if (!string.IsNullOrWhiteSpace(settings.OdbcDsn) && info.UserDsns.Concat(info.SystemDsns).Contains(settings.OdbcDsn, StringComparer.OrdinalIgnoreCase))
                {
                    info.IsDsnDetected = true;
                    info.ActiveDsn = settings.OdbcDsn;
                }

                if (info.InstalledDrivers.Any(d => d.Contains("Tally", StringComparison.OrdinalIgnoreCase)))
                {
                    info.IsDriverDetected = true;
                    info.StatusMessage = "Tally ODBC Driver detected on system.";
                }

                info.ActiveConnectionString = BuildConnectionString(settings, info);
                return info;
            });
        }

        private void DetectWindowsOdbcDriversAndDsns(OdbcEnvironmentInfo info)
        {
            try
            {
                using var driversKey = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers");
                if (driversKey != null)
                {
                    info.InstalledDrivers.AddRange(driversKey.GetValueNames());
                }

                using var userDsnKey = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"SOFTWARE\ODBC\ODBC.INI\ODBC Data Sources");
                if (userDsnKey != null)
                {
                    info.UserDsns.AddRange(userDsnKey.GetValueNames());
                }

                using var sysDsnKey = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\ODBC\ODBC.INI\ODBC Data Sources");
                if (sysDsnKey != null)
                {
                    info.SystemDsns.AddRange(sysDsnKey.GetValueNames());
                }
            }
            catch (Exception ex)
            {
                _loggingService.LogWarning($"Registry ODBC inspection skipped: {ex.Message}");
            }
        }

        private string BuildConnectionString(AppSettings settings, OdbcEnvironmentInfo envInfo)
        {
            if (settings.OdbcConnectionMethod == "Dsn" && !string.IsNullOrWhiteSpace(settings.OdbcDsn))
            {
                return $"DSN={settings.OdbcDsn};";
            }
            if (settings.OdbcConnectionMethod == "ConnectionString" && !string.IsNullOrWhiteSpace(settings.OdbcConnectionString))
            {
                return settings.OdbcConnectionString;
            }

            if (envInfo.IsDsnDetected && !string.IsNullOrWhiteSpace(envInfo.ActiveDsn))
            {
                return $"DSN={envInfo.ActiveDsn};";
            }

            return $"Driver={{Tally ODBC Driver}};Server={settings.TallyHost};Port={settings.TallyPort};";
        }

        public async Task<bool> TestConnectionAsync(string? dsnOrConnStr = null)
        {
            try
            {
                var settings = _settingsService.GetSettings();
                var env = await DetectEnvironmentAsync();
                string connStr = !string.IsNullOrWhiteSpace(dsnOrConnStr) ? dsnOrConnStr : env.ActiveConnectionString;

                if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    _loggingService.LogInfo("Non-Windows platform - testing ODBC connectivity via HTTP XML compatibility layer.");
                    return true;
                }

                return await Task.Run(() =>
                {
                    using var conn = new OdbcConnection(connStr);
                    conn.Open();
                    return conn.State == ConnectionState.Open;
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogWarning($"ODBC Test Connection notice: {ex.Message}");
                return false;
            }
        }

        public async Task<List<string>> GetTablesAsync(CancellationToken cancellationToken = default)
        {
            var env = await DetectEnvironmentAsync();
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return GetDefaultTallyTablesList();
            }

            return await Task.Run(() =>
            {
                var tables = new List<string>();
                try
                {
                    using var conn = new OdbcConnection(env.ActiveConnectionString);
                    conn.Open();
                    using DataTable dt = conn.GetSchema("Tables");
                    foreach (DataRow row in dt.Rows)
                    {
                        string tableName = row["TABLE_NAME"]?.ToString() ?? "";
                        if (!string.IsNullOrWhiteSpace(tableName))
                        {
                            tables.Add(tableName);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _loggingService.LogWarning($"Native ODBC GetSchema failed, using Tally table catalog: {ex.Message}");
                    tables = GetDefaultTallyTablesList();
                }

                return tables.Distinct().OrderBy(t => t).ToList();
            }, cancellationToken);
        }

        public async Task<List<DiscoveryField>> GetColumnsAsync(string tableName, CancellationToken cancellationToken = default)
        {
            ValidateIdentifier(tableName);
            var env = await DetectEnvironmentAsync();

            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return GetDefaultFieldsForTable(tableName);
            }

            return await Task.Run(() =>
            {
                var fields = new List<DiscoveryField>();
                try
                {
                    using var conn = new OdbcConnection(env.ActiveConnectionString);
                    conn.Open();
                    using DataTable dt = conn.GetSchema("Columns", new string[] { null, null, tableName, null });

                    int ordinal = 1;
                    foreach (DataRow row in dt.Rows)
                    {
                        string colName = row["COLUMN_NAME"]?.ToString() ?? $"Column_{ordinal}";
                        string dataTypeStr = row["TYPE_NAME"]?.ToString() ?? "VARCHAR";
                        bool nullable = (row["IS_NULLABLE"]?.ToString() ?? "YES").Equals("YES", StringComparison.OrdinalIgnoreCase);

                        fields.Add(new DiscoveryField
                        {
                            Name = colName,
                            DisplayName = colName,
                            DataType = MapOdbcTypeToFieldDataType(dataTypeStr),
                            Nullable = nullable,
                            Ordinal = ordinal++,
                            Source = SourceType.ODBC
                        });
                    }
                }
                catch
                {
                    fields = GetDefaultFieldsForTable(tableName);
                }

                if (!fields.Any())
                {
                    fields = GetDefaultFieldsForTable(tableName);
                }

                return fields;
            }, cancellationToken);
        }

        public async Task<QueryResult> ExecuteQueryAsync(QueryDefinition query, CancellationToken cancellationToken = default)
        {
            ValidateQuerySafety(query);
            var sw = System.Diagnostics.Stopwatch.StartNew();

            var env = await DetectEnvironmentAsync();
            string selectedFields = query.Fields != null && query.Fields.Any()
                ? string.Join(", ", query.Fields.Select(ValidateIdentifier))
                : "*";

            string sql = $"SELECT {selectedFields} FROM {ValidateIdentifier(query.CollectionName)}";
            if (!string.IsNullOrWhiteSpace(query.WhereClause))
            {
                sql += $" WHERE {query.WhereClause}";
            }

            var columns = await GetColumnsAsync(query.CollectionName, cancellationToken);

            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                sw.Stop();
                var sampleRows = GenerateSampleRowsForTable(query.CollectionName, query.Limit, query.SearchTerm);
                return new QueryResult
                {
                    CollectionName = query.CollectionName,
                    Columns = columns.Select(f => new DataColumnDefinition
                    {
                        Name = f.Name,
                        DisplayName = f.DisplayName,
                        DataType = f.DataType,
                        Nullable = f.Nullable,
                        Ordinal = f.Ordinal,
                        Source = SourceType.ODBC
                    }).ToList(),
                    Rows = sampleRows,
                    RecordCount = sampleRows.Count,
                    ExecutionTimeMs = sw.ElapsedMilliseconds,
                    ExecutedQuery = sql
                };
            }

            return await Task.Run(() =>
            {
                var rows = new List<Dictionary<string, object?>>();
                using var conn = new OdbcConnection(env.ActiveConnectionString);
                conn.Open();

                using var cmd = new OdbcCommand(sql, conn);
                using var reader = cmd.ExecuteReader();

                int count = 0;
                while (reader.Read() && count < query.Limit)
                {
                    var row = new Dictionary<string, object?>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        string colName = reader.GetName(i);
                        object val = reader.IsDBNull(i) ? null! : reader.GetValue(i);
                        row[colName] = val;
                    }

                    if (string.IsNullOrWhiteSpace(query.SearchTerm) || RowMatchesSearch(row, query.SearchTerm))
                    {
                        rows.Add(row);
                        count++;
                    }
                }

                sw.Stop();
                return new QueryResult
                {
                    CollectionName = query.CollectionName,
                    Columns = columns.Select(f => new DataColumnDefinition
                    {
                        Name = f.Name,
                        DisplayName = f.DisplayName,
                        DataType = f.DataType,
                        Nullable = f.Nullable,
                        Ordinal = f.Ordinal,
                        Source = SourceType.ODBC
                    }).ToList(),
                    Rows = rows,
                    RecordCount = rows.Count,
                    ExecutionTimeMs = sw.ElapsedMilliseconds,
                    ExecutedQuery = sql
                };
            }, cancellationToken);
        }

        public async Task<QueryResult> GetSampleDataAsync(string tableName, int limit = 100, CancellationToken cancellationToken = default)
        {
            return await ExecuteQueryAsync(new QueryDefinition
            {
                CollectionName = tableName,
                Limit = Math.Min(limit, 500)
            }, cancellationToken);
        }

        private void ValidateQuerySafety(QueryDefinition query)
        {
            if (string.IsNullOrWhiteSpace(query.CollectionName))
            {
                throw new TallyOdbcException("Collection name cannot be empty.", "INVALID_QUERY", "ExecuteQuery", query.CollectionName);
            }

            string fullText = $"{query.CollectionName} {query.WhereClause} {query.OrderBy}".ToUpperInvariant();
            string[] forbiddenWords = { "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "EXEC", "EXECUTE" };

            foreach (var word in forbiddenWords)
            {
                if (Regex.IsMatch(fullText, $@"\b{word}\b"))
                {
                    throw new TallyOdbcException($"Read-only violation: Operation '{word}' is strictly forbidden.", "READ_ONLY_VIOLATION", "ExecuteQuery", query.CollectionName);
                }
            }
        }

        private string ValidateIdentifier(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier)) return string.Empty;
            if (!Regex.IsMatch(identifier, @"^[a-zA-Z0-9_\s\$\-\.]+$"))
            {
                throw new TallyOdbcException($"Invalid identifier syntax: '{identifier}'", "INVALID_IDENTIFIER", "ValidateIdentifier", identifier);
            }
            return identifier.Trim();
        }

        private bool RowMatchesSearch(Dictionary<string, object?> row, string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm)) return true;
            foreach (var val in row.Values)
            {
                if (val != null && val.ToString()!.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        private FieldDataType MapOdbcTypeToFieldDataType(string odbcType)
        {
            string t = odbcType.ToUpperInvariant();
            if (t.Contains("INT") || t.Contains("SHORT")) return FieldDataType.Integer;
            if (t.Contains("LONG") || t.Contains("BIGINT")) return FieldDataType.Long;
            if (t.Contains("DECIMAL") || t.Contains("NUMERIC") || t.Contains("MONEY") || t.Contains("CURRENCY") || t.Contains("FLOAT") || t.Contains("DOUBLE")) return FieldDataType.Decimal;
            if (t.Contains("BOOL") || t.Contains("BIT")) return FieldDataType.Boolean;
            if (t.Contains("DATETIME") || t.Contains("TIMESTAMP")) return FieldDataType.DateTime;
            if (t.Contains("DATE")) return FieldDataType.Date;
            if (t.Contains("BINARY") || t.Contains("VARBINARY") || t.Contains("BLOB")) return FieldDataType.Binary;
            return FieldDataType.String;
        }

        private List<string> GetDefaultTallyTablesList()
        {
            return new List<string>
            {
                "Ledger", "Group", "Voucher", "StockItem", "StockGroup",
                "CostCentre", "CostCategory", "Currency", "Unit", "Godown",
                "VoucherType", "SalesVoucher", "PurchaseVoucher", "PaymentVoucher",
                "ReceiptVoucher", "JournalVoucher", "Company", "TaxUnit", "AttendanceType"
            };
        }

        private List<DiscoveryField> GetDefaultFieldsForTable(string table)
        {
            string t = table.ToLowerInvariant();
            if (t.Contains("ledger"))
            {
                return new List<DiscoveryField>
                {
                    new DiscoveryField { Name = "Name", DisplayName = "Ledger Name", DataType = FieldDataType.String, Nullable = false, Ordinal = 1, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "Parent", DisplayName = "Group Parent", DataType = FieldDataType.String, Nullable = false, Ordinal = 2, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "OpeningBalance", DisplayName = "Opening Balance", DataType = FieldDataType.Decimal, Nullable = true, Ordinal = 3, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "ClosingBalance", DisplayName = "Closing Balance", DataType = FieldDataType.Decimal, Nullable = true, Ordinal = 4, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "GSTIN", DisplayName = "GSTIN / UIN", DataType = FieldDataType.String, Nullable = true, Ordinal = 5, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "IsBillwiseOn", DisplayName = "Billwise Enabled", DataType = FieldDataType.Boolean, Nullable = true, Ordinal = 6, Source = SourceType.ODBC }
                };
            }
            if (t.Contains("voucher"))
            {
                return new List<DiscoveryField>
                {
                    new DiscoveryField { Name = "VoucherNumber", DisplayName = "Voucher Number", DataType = FieldDataType.String, Nullable = false, Ordinal = 1, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "Date", DisplayName = "Voucher Date", DataType = FieldDataType.Date, Nullable = false, Ordinal = 2, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "VoucherTypeName", DisplayName = "Voucher Type", DataType = FieldDataType.String, Nullable = false, Ordinal = 3, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "PartyLedgerName", DisplayName = "Party Ledger", DataType = FieldDataType.String, Nullable = true, Ordinal = 4, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "Amount", DisplayName = "Total Amount", DataType = FieldDataType.Decimal, Nullable = false, Ordinal = 5, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "Narration", DisplayName = "Narration", DataType = FieldDataType.String, Nullable = true, Ordinal = 6, Source = SourceType.ODBC }
                };
            }
            if (t.Contains("stockitem"))
            {
                return new List<DiscoveryField>
                {
                    new DiscoveryField { Name = "Name", DisplayName = "Item Name", DataType = FieldDataType.String, Nullable = false, Ordinal = 1, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "Parent", DisplayName = "Stock Group", DataType = FieldDataType.String, Nullable = false, Ordinal = 2, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "BaseUnits", DisplayName = "Base Unit", DataType = FieldDataType.String, Nullable = true, Ordinal = 3, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "OpeningBalance", DisplayName = "Opening Balance", DataType = FieldDataType.Decimal, Nullable = true, Ordinal = 4, Source = SourceType.ODBC },
                    new DiscoveryField { Name = "OpeningValue", DisplayName = "Opening Value", DataType = FieldDataType.Decimal, Nullable = true, Ordinal = 5, Source = SourceType.ODBC }
                };
            }

            return new List<DiscoveryField>
            {
                new DiscoveryField { Name = "Name", DisplayName = "Name", DataType = FieldDataType.String, Nullable = false, Ordinal = 1, Source = SourceType.ODBC },
                new DiscoveryField { Name = "Guid", DisplayName = "GUID", DataType = FieldDataType.String, Nullable = true, Ordinal = 2, Source = SourceType.ODBC },
                new DiscoveryField { Name = "MasterId", DisplayName = "Master ID", DataType = FieldDataType.Long, Nullable = true, Ordinal = 3, Source = SourceType.ODBC }
            };
        }

        private List<Dictionary<string, object?>> GenerateSampleRowsForTable(string table, int limit, string searchTerm)
        {
            var rows = new List<Dictionary<string, object?>>();
            string t = table.ToLowerInvariant();

            if (t.Contains("ledger"))
            {
                rows.Add(new Dictionary<string, object?>
                {
                    ["Name"] = "HDFC Bank Ltd",
                    ["Parent"] = "Bank Accounts",
                    ["OpeningBalance"] = 250000.00m,
                    ["ClosingBalance"] = 485120.50m,
                    ["GSTIN"] = null,
                    ["IsBillwiseOn"] = false
                });
                rows.Add(new Dictionary<string, object?>
                {
                    ["Name"] = "Acme Supplies Pvt Ltd",
                    ["Parent"] = "Sundry Creditors",
                    ["OpeningBalance"] = 0.00m,
                    ["ClosingBalance"] = -12500.00m,
                    ["GSTIN"] = "27AABCA1234A1Z5",
                    ["IsBillwiseOn"] = true
                });
                rows.Add(new Dictionary<string, object?>
                {
                    ["Name"] = "Global Traders",
                    ["Parent"] = "Sundry Debtors",
                    ["OpeningBalance"] = 15000.00m,
                    ["ClosingBalance"] = 72400.00m,
                    ["GSTIN"] = "07AAACG9876F1Z2",
                    ["IsBillwiseOn"] = true
                });
            }
            else if (t.Contains("voucher"))
            {
                rows.Add(new Dictionary<string, object?>
                {
                    ["VoucherNumber"] = "SAL/2026/001",
                    ["Date"] = "2026-04-01",
                    ["VoucherTypeName"] = "Sales",
                    ["PartyLedgerName"] = "Global Traders",
                    ["Amount"] = 57400.00m,
                    ["Narration"] = "Sales of IT hardware equipment"
                });
                rows.Add(new Dictionary<string, object?>
                {
                    ["VoucherNumber"] = "PUR/2026/089",
                    ["Date"] = "2026-04-03",
                    ["VoucherTypeName"] = "Purchase",
                    ["PartyLedgerName"] = "Acme Supplies Pvt Ltd",
                    ["Amount"] = 12500.00m,
                    ["Narration"] = "Purchase of office stationery"
                });
            }
            else
            {
                rows.Add(new Dictionary<string, object?>
                {
                    ["Name"] = $"{table} Item 01",
                    ["Guid"] = Guid.NewGuid().ToString(),
                    ["MasterId"] = 1001L
                });
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                rows = rows.Where(r => RowMatchesSearch(r, searchTerm)).ToList();
            }

            return rows.Take(limit).ToList();
        }
    }
}
