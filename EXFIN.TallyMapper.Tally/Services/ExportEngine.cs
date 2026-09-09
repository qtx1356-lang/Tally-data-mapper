using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Services.Exporters;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class ExportEngine : IExportEngine
    {
        private readonly IMappingEngine _mappingEngine;
        private readonly IExportDataProvider _exportDataProvider;
        private readonly IExportProfileRepository _profileRepository;
        private readonly IExportHistoryRepository _historyRepository;
        private readonly ITallyCompanyService _companyService;
        private readonly Dictionary<ExportFormat, IExportProvider> _providers;

        public ExportEngine(
            IMappingEngine mappingEngine,
            IExportDataProvider exportDataProvider,
            IExportProfileRepository profileRepository,
            IExportHistoryRepository historyRepository,
            ITallyCompanyService companyService,
            IEnumerable<IExportProvider> providers)
        {
            _mappingEngine = mappingEngine;
            _exportDataProvider = exportDataProvider;
            _profileRepository = profileRepository;
            _historyRepository = historyRepository;
            _companyService = companyService;
            _providers = providers.ToDictionary(p => p.Format, p => p);
        }

        public string ResolveDestinationPath(
            string rawPath,
            string companyName,
            string mappingName,
            DateTime timestamp)
        {
            if (string.IsNullOrWhiteSpace(rawPath))
            {
                rawPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "{mapping}_{company}_{date}.xlsx");
            }

            string cleanCompany = SanitizeFilename(companyName);
            string cleanMapping = SanitizeFilename(mappingName);

            string dateStr = timestamp.ToString("yyyy-MM-dd");
            string timeStr = timestamp.ToString("HHmmss");
            string dateTimeStr = timestamp.ToString("yyyy-MM-dd_HHmmss");

            string resolved = rawPath
                .Replace("{date}", dateStr)
                .Replace("{time}", timeStr)
                .Replace("{datetime}", dateTimeStr)
                .Replace("{company}", cleanCompany)
                .Replace("{mapping}", cleanMapping);

            return resolved;
        }

        public async Task<MappingValidationResult> ValidateExportRequestAsync(ExportRequest request)
        {
            var result = new MappingValidationResult();

            if (request.Mapping == null && string.IsNullOrEmpty(request.MappingId))
            {
                result.IsValid = false;
                result.ErrorCount++;
                result.Messages.Add(new MappingValidationMessage
                {
                    Level = "Error",
                    Message = "No mapping definition or Mapping ID was provided for export."
                });
                return result;
            }

            if (request.Mapping != null)
            {
                var mappingVal = _mappingEngine.ValidateMapping(request.Mapping);
                if (!mappingVal.IsValid)
                {
                    result.IsValid = false;
                    result.ErrorCount += mappingVal.ErrorCount;
                    result.Messages.AddRange(mappingVal.Messages);
                }
            }

            // Verify company context safety
            try
            {
                var activeCompany = await _companyService.GetActiveCompanyAsync();
                if (activeCompany != null && !string.IsNullOrEmpty(request.CompanyId))
                {
                    if (activeCompany.CompanyId != request.CompanyId && activeCompany.CompanyName != request.CompanyName)
                    {
                        result.IsValid = false;
                        result.ErrorCount++;
                        result.Messages.Add(new MappingValidationMessage
                        {
                            Level = "Error",
                            Message = $"Company context changed since mapping preparation. Active Tally company is '{activeCompany.CompanyName}', but request target is '{request.CompanyName}'."
                        });
                    }
                }
            }
            catch { }

            return result;
        }

        public async Task<ExportResult> ExecuteExportAsync(
            ExportRequest request,
            IProgress<ExportProgressUpdate>? progress = null,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            progress?.Report(new ExportProgressUpdate
            {
                Status = ExportJobStatus.Preparing,
                Message = "Initializing export engine pipeline...",
                RecordsProcessed = 0,
                TotalRecords = 0
            });

            // 1. Resolve Path Tokens & Destination
            string mappingName = request.Mapping?.Name ?? "Export";
            string resolvedPath = ResolveDestinationPath(request.DestinationPath, request.CompanyName, mappingName, startTime);
            request.DestinationPath = resolvedPath;

            // Ensure output extension matches format
            if (!_providers.TryGetValue(request.Format, out var provider))
            {
                return new ExportResult
                {
                    Success = false,
                    Status = ExportJobStatus.Failed,
                    Errors = new List<string> { $"Unsupported export format '{request.Format}'." }
                };
            }

            string expectedExt = provider.DefaultFileExtension;
            if (!resolvedPath.EndsWith(expectedExt, StringComparison.OrdinalIgnoreCase))
            {
                resolvedPath = Path.ChangeExtension(resolvedPath, expectedExt);
                request.DestinationPath = resolvedPath;
            }

            // 2. Validate Request
            progress?.Report(new ExportProgressUpdate
            {
                Status = ExportJobStatus.ValidatingMapping,
                Message = "Validating mapping schema and company context...",
                RecordsProcessed = 0,
                TotalRecords = 0
            });

            var validation = await ValidateExportRequestAsync(request);
            if (!validation.IsValid)
            {
                return new ExportResult
                {
                    Success = false,
                    Status = ExportJobStatus.Failed,
                    Validation = validation,
                    Errors = validation.Messages.Select(m => m.Message).ToList()
                };
            }

            // 3. Check Directory & Atomic Temp File Setup
            string? dir = Path.GetDirectoryName(resolvedPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            // Overwrite Policy check
            if (File.Exists(resolvedPath) && request.Options.OverwritePolicy == "Cancel")
            {
                return new ExportResult
                {
                    Success = false,
                    Status = ExportJobStatus.Failed,
                    Errors = new List<string> { $"Destination file '{resolvedPath}' already exists and overwrite policy is set to Cancel." }
                };
            }
            else if (File.Exists(resolvedPath) && request.Options.OverwritePolicy == "CreateNewName")
            {
                string nameWithoutExt = Path.GetFileNameWithoutExtension(resolvedPath);
                string ext = Path.GetExtension(resolvedPath);
                resolvedPath = Path.Combine(dir ?? "", $"{nameWithoutExt}_{DateTime.UtcNow:HHmmss}{ext}");
                request.DestinationPath = resolvedPath;
            }

            string tempPath = resolvedPath + $".tmp_{Guid.NewGuid():N}";

            // 4. Fetch Mapped Data Result from Phase 5 Mapping Engine
            progress?.Report(new ExportProgressUpdate
            {
                Status = ExportJobStatus.ExecutingQuery,
                Message = "Querying Tally and transforming records...",
                RecordsProcessed = 0,
                TotalRecords = 0
            });

            MappedDataResult mappedData;
            try
            {
                var discoveryModel = new UnifiedDiscoveryModel(); // Standard model lookup
                mappedData = await _exportDataProvider.GetMappedDataAsync(
                    request.Mapping!,
                    discoveryModel,
                    limit: null,
                    cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                return new ExportResult
                {
                    Success = false,
                    Status = ExportJobStatus.Failed,
                    Errors = new List<string> { $"Failed to extract and transform Tally data: {ex.Message}" }
                };
            }

            // 5. Execute Export using Provider to Temporary Path
            progress?.Report(new ExportProgressUpdate
            {
                Status = ExportJobStatus.WritingOutput,
                Message = $"Writing records using {provider.DisplayName} provider...",
                RecordsProcessed = 0,
                TotalRecords = mappedData.TotalRows
            });

            var tempRequest = new ExportRequest
            {
                Id = request.Id,
                ProfileId = request.ProfileId,
                MappingId = request.MappingId,
                Mapping = request.Mapping,
                CompanyId = request.CompanyId,
                CompanyName = request.CompanyName,
                Format = request.Format,
                DestinationPath = tempPath,
                Options = request.Options
            };

            ExportResult exportResult;
            try
            {
                exportResult = await provider.ExportAsync(mappedData, tempRequest, progress, cancellationToken);
            }
            catch (Exception ex)
            {
                CleanupTempFile(tempPath);
                return new ExportResult
                {
                    Success = false,
                    Status = ExportJobStatus.Failed,
                    Errors = new List<string> { $"Export writer failed: {ex.Message}" }
                };
            }

            if (!exportResult.Success)
            {
                CleanupTempFile(tempPath);
                exportResult.DestinationPath = resolvedPath;
                await LogHistoryAsync(request, exportResult, startTime);
                return exportResult;
            }

            // 6. Verify File Integrity & Atomic Move
            progress?.Report(new ExportProgressUpdate
            {
                Status = ExportJobStatus.Finalizing,
                Message = "Verifying atomic file write integrity...",
                RecordsProcessed = mappedData.TotalRows,
                TotalRecords = mappedData.TotalRows
            });

            try
            {
                if (!File.Exists(tempPath) || new FileInfo(tempPath).Length == 0)
                {
                    CleanupTempFile(tempPath);
                    return new ExportResult
                    {
                        Success = false,
                        Status = ExportJobStatus.Failed,
                        Errors = new List<string> { "Export temporary file verification failed (file missing or 0 bytes)." }
                    };
                }

                // Atomic Rename / Move
                if (File.Exists(resolvedPath))
                {
                    File.Delete(resolvedPath);
                }
                File.Move(tempPath, resolvedPath);
            }
            catch (Exception ex)
            {
                CleanupTempFile(tempPath);
                return new ExportResult
                {
                    Success = false,
                    Status = ExportJobStatus.Failed,
                    Errors = new List<string> { $"Atomic file commit failed: {ex.Message}" }
                };
            }

            // 7. Post-Export Tasks (Hash calculation, Error CSV, History)
            exportResult.DestinationPath = resolvedPath;
            var fileInfo = new FileInfo(resolvedPath);
            exportResult.Statistics.BytesWritten = fileInfo.Length;

            if (request.Options.CalculateSha256Hash)
            {
                try
                {
                    using var sha = SHA256.Create();
                    using var stream = File.OpenRead(resolvedPath);
                    var hashBytes = sha.ComputeHash(stream);
                    exportResult.Statistics.FileHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                }
                catch { }
            }

            // Generate error CSV if row errors occurred
            if (mappedData.Errors != null && mappedData.Errors.Count > 0 && request.Options.GenerateErrorCsv)
            {
                try
                {
                    string errCsvPath = Path.Combine(dir ?? "", $"{Path.GetFileNameWithoutExtension(resolvedPath)}-errors.csv");
                    using var errWriter = new StreamWriter(errCsvPath, false, Encoding.UTF8);
                    await errWriter.WriteLineAsync("Row,Output Field,Source Path,Error Message,Original Value");
                    foreach (var err in mappedData.Errors)
                    {
                        string line = $"{err.RowNumber},{CsvExportProvider.FormatCsvField(err.FieldName, ",", "Auto")},{CsvExportProvider.FormatCsvField(err.SourcePath, ",", "Auto")},{CsvExportProvider.FormatCsvField(err.ErrorMessage, ",", "Auto")},{CsvExportProvider.FormatCsvField(err.OriginalValue ?? "", ",", "Auto")}";
                        await errWriter.WriteLineAsync(line);
                    }
                    exportResult.ErrorCsvPath = errCsvPath;
                }
                catch { }
            }

            exportResult.Statistics.CompletedAt = DateTime.UtcNow;
            exportResult.Statistics.DurationMs = (long)(exportResult.Statistics.CompletedAt.Value - startTime).TotalMilliseconds;
            exportResult.Status = exportResult.Errors.Count == 0 && (mappedData.Errors?.Count ?? 0) == 0 ? ExportJobStatus.Completed : ExportJobStatus.CompletedWithWarnings;
            exportResult.Success = true;

            // Log History & Update Profile
            await LogHistoryAsync(request, exportResult, startTime);

            progress?.Report(new ExportProgressUpdate
            {
                Status = exportResult.Status,
                Message = $"Export completed successfully ({exportResult.Statistics.RecordsWritten} records exported).",
                RecordsProcessed = exportResult.Statistics.RecordsWritten,
                TotalRecords = mappedData.TotalRows
            });

            return exportResult;
        }

        private async Task LogHistoryAsync(ExportRequest request, ExportResult result, DateTime startTime)
        {
            try
            {
                var history = new ExportHistory
                {
                    ProfileId = request.ProfileId,
                    MappingId = request.MappingId,
                    MappingName = request.Mapping?.Name ?? "Output Mapping",
                    CompanyId = request.CompanyId,
                    CompanyName = request.CompanyName,
                    StartedAt = startTime,
                    CompletedAt = result.Statistics.CompletedAt ?? DateTime.UtcNow,
                    Status = result.Status,
                    Format = request.Format,
                    DestinationPath = result.DestinationPath,
                    RecordsRead = result.Statistics.RecordsRead,
                    RecordsWritten = result.Statistics.RecordsWritten,
                    ErrorCount = result.Errors.Count + (result.Statistics.ErrorCount),
                    WarningCount = result.Warnings.Count + (result.Statistics.WarningCount),
                    FileSize = result.Statistics.BytesWritten,
                    FileHash = result.Statistics.FileHash,
                    DurationMs = result.Statistics.DurationMs,
                    ErrorMessage = result.Errors.FirstOrDefault()
                };

                await _historyRepository.LogExportAsync(history);

                if (!string.IsNullOrEmpty(request.ProfileId))
                {
                    var profile = await _profileRepository.GetProfileByIdAsync(request.ProfileId);
                    if (profile != null)
                    {
                        profile.LastExportAt = history.CompletedAt;
                        profile.LastStatus = result.Status;
                        await _profileRepository.SaveProfileAsync(profile);
                    }
                }
            }
            catch { }
        }

        private static void CleanupTempFile(string tempPath)
        {
            try
            {
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                }
            }
            catch { }
        }

        public static string SanitizeFilename(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Export";
            string invalidChars = Regex.Escape(new string(Path.GetInvalidFileNameChars()));
            string invalidRegStr = string.Format(@"[{0}]", invalidChars);
            return Regex.Replace(name.Trim(), invalidRegStr, "_");
        }
    }
}
