using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;
using EXFIN.TallyMapper.Tally.Interfaces;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class OdbcSchemaDiscoveryService : IOdbcSchemaDiscoveryService
    {
        private readonly ITallyOdbcConnector _odbcConnector;
        private readonly IDiscoveryRepository _discoveryRepository;
        private readonly ILoggingService _loggingService;

        public OdbcSchemaDiscoveryService(
            ITallyOdbcConnector odbcConnector,
            IDiscoveryRepository discoveryRepository,
            ILoggingService loggingService)
        {
            _odbcConnector = odbcConnector;
            _discoveryRepository = discoveryRepository;
            _loggingService = loggingService;
        }

        public async Task<DiscoveryScan> PerformScanAsync(
            string companyId,
            string companyName,
            Action<DiscoveryProgress>? progressCallback = null,
            CancellationToken cancellationToken = default)
        {
            var scan = new DiscoveryScan
            {
                CompanyId = companyId,
                CompanyName = companyName,
                StartedAt = DateTime.UtcNow,
                Status = "In Progress"
            };

            int scanId = await _discoveryRepository.SaveScanAsync(scan);
            var progress = new DiscoveryProgress { Stage = "Connecting" };
            progressCallback?.Invoke(progress);

            int collectionCount = 0;
            int fieldCount = 0;
            int errorCount = 0;
            var discoveredCollections = new List<DiscoveryCollection>();
            var errorLogs = new List<string>();

            try
            {
                _loggingService.LogInfo($"Starting discovery scan #{scanId} for company '{companyName}' ({companyId})");

                progress.Stage = "Reading schema";
                progressCallback?.Invoke(progress);

                var tables = await _odbcConnector.GetTablesAsync(cancellationToken);
                progress.Stage = "Discovering collections";
                progressCallback?.Invoke(progress);

                foreach (var tableName in tables)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        progress.IsCancelled = true;
                        progress.StatusMessage = "Scan cancelled by user.";
                        progressCallback?.Invoke(progress);
                        await _discoveryRepository.UpdateScanStatusAsync(scanId, "Cancelled", collectionCount, fieldCount, errorCount, "User cancelled scan.");
                        scan.Status = "Cancelled";
                        return scan;
                    }

                    progress.CurrentItem = $"Discovering {tableName}...";
                    progressCallback?.Invoke(progress);

                    try
                    {
                        var fields = await _odbcConnector.GetColumnsAsync(tableName, cancellationToken);
                        var (category, classification, objectType) = ClassifyTable(tableName);

                        var collection = new DiscoveryCollection
                        {
                            ScanId = scanId,
                            CompanyId = companyId,
                            Name = tableName,
                            DisplayName = NormalizeDisplayName(tableName),
                            Source = SourceType.ODBC,
                            ObjectType = objectType,
                            Category = category,
                            CategoryClassification = classification,
                            IsQueryable = true,
                            IsReadable = true,
                            RecordCount = null,
                            Fields = fields
                        };

                        discoveredCollections.Add(collection);
                        collectionCount++;
                        fieldCount += fields.Count;
                        progress.CollectionsDiscovered = collectionCount;
                        progress.FieldsDiscovered = fieldCount;
                        progressCallback?.Invoke(progress);
                    }
                    catch (Exception ex)
                    {
                        errorCount++;
                        string err = $"Collection '{tableName}' GetColumns error: {ex.Message}";
                        errorLogs.Add(err);
                        _loggingService.LogError(err, ex);

                        progress.ErrorCount = errorCount;
                        progressCallback?.Invoke(progress);
                    }
                }

                progress.Stage = "Saving metadata";
                progressCallback?.Invoke(progress);

                await _discoveryRepository.SaveCollectionsAndFieldsAsync(scanId, discoveredCollections);

                string finalStatus = errorCount > 0 ? "CompletedWithWarnings" : "Completed";
                string techDetails = errorCount > 0 ? string.Join("; ", errorLogs) : "Scan executed successfully with zero schema errors.";

                await _discoveryRepository.UpdateScanStatusAsync(scanId, finalStatus, collectionCount, fieldCount, errorCount, techDetails);

                scan.CompletedAt = DateTime.UtcNow;
                scan.Status = finalStatus;
                scan.CollectionCount = collectionCount;
                scan.FieldCount = fieldCount;
                scan.ErrorCount = errorCount;
                scan.TechnicalDetails = techDetails;

                progress.Stage = "Completed";
                progress.IsCompleted = true;
                progress.StatusMessage = $"Scan finished with {collectionCount} collections and {fieldCount} fields ({errorCount} warnings).";
                progressCallback?.Invoke(progress);

                return scan;
            }
            catch (Exception ex)
            {
                _loggingService.LogError($"Fatal scan error during discovery #{scanId}", ex);
                await _discoveryRepository.UpdateScanStatusAsync(scanId, "Failed", collectionCount, fieldCount, errorCount + 1, ex.Message);
                scan.Status = "Failed";
                scan.TechnicalDetails = ex.Message;
                return scan;
            }
        }

        public async Task<DiscoveryScan?> GetLatestScanAsync(string companyId)
        {
            return await _discoveryRepository.GetLatestScanAsync(companyId);
        }

        public async Task<List<DiscoveryCollection>> GetCollectionsAsync(string companyId, bool includeSystem = false)
        {
            return await _discoveryRepository.GetCollectionsAsync(companyId, includeSystem);
        }

        public async Task<List<DiscoveryField>> GetFieldsAsync(int collectionId)
        {
            return await _discoveryRepository.GetFieldsAsync(collectionId);
        }

        private (CollectionCategory Category, CategoryClassification Classification, string ObjectType) ClassifyTable(string tableName)
        {
            string t = tableName.ToLowerInvariant();

            if (t.Contains("ledger") || t.Contains("stockitem") || t.Contains("group") || t.Contains("costcentre") || t.Contains("currency") || t.Contains("godown") || t.Contains("vouchertype"))
            {
                return (CollectionCategory.Masters, CategoryClassification.Known, "Tally-related");
            }
            if (t.Contains("voucher") || t.Contains("entry") || t.Contains("inventory"))
            {
                return (CollectionCategory.Transactions, CategoryClassification.Known, "Tally-related");
            }
            if (t.Contains("stock") || t.Contains("batch") || t.Contains("unit"))
            {
                return (CollectionCategory.Inventory, CategoryClassification.Inferred, "Tally-related");
            }
            if (t.Contains("payroll") || t.Contains("employee") || t.Contains("attendance"))
            {
                return (CollectionCategory.Payroll, CategoryClassification.Inferred, "Tally-related");
            }
            if (t.Contains("sys") || t.Contains("schema") || t.Contains("audit") || t.Contains("config"))
            {
                return (CollectionCategory.System, CategoryClassification.Known, "System");
            }

            return (CollectionCategory.Other, CategoryClassification.Unknown, "Tally-related");
        }

        private string NormalizeDisplayName(string rawName)
        {
            if (string.IsNullOrWhiteSpace(rawName)) return string.Empty;
            return System.Text.RegularExpressions.Regex.Replace(rawName, @"(\b[a-z]|\b[A-Z])", " $1").Trim();
        }
    }
}
