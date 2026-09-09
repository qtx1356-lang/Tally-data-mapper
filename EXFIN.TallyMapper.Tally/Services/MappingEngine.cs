using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class MappingEngine : IMappingEngine, IExportDataProvider
    {
        private readonly IMappingRepository _repository;
        private readonly IQueryPlanner _queryPlanner;
        private static readonly JsonSerializerOptions JsonOpts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true
        };

        public MappingEngine(IMappingRepository repository, IQueryPlanner queryPlanner)
        {
            _repository = repository;
            _queryPlanner = queryPlanner;
        }

        public OutputMapping CreateMapping(string sourceEntity, string? companyId = null, string? name = null)
        {
            var mapping = new OutputMapping
            {
                Id = Guid.NewGuid().ToString(),
                SourceEntity = sourceEntity,
                CompanyId = companyId,
                Name = string.IsNullOrWhiteSpace(name) ? $"{sourceEntity} Output Mapping" : name.Trim(),
                Description = $"Output data mapping for {sourceEntity}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1,
                Status = MappingStatus.Draft,
                Configuration = new OutputConfiguration
                {
                    IsPortableTemplate = string.IsNullOrEmpty(companyId),
                    TargetCompanyId = companyId,
                    MaxPreviewRows = 100
                }
            };

            return mapping;
        }

        public string GenerateDefaultOutputName(string sourcePath)
        {
            if (string.IsNullOrWhiteSpace(sourcePath)) return "field";

            var parts = sourcePath.Split('.', StringSplitOptions.RemoveEmptyEntries);
            var lastPart = parts.Length > 0 ? parts[^1] : sourcePath;

            if (parts.Length > 1)
            {
                // If it's a nested path like Party.Name or AllInventoryEntries.StockItemName
                var prefix = parts[^2];
                if (prefix.StartsWith("All", StringComparison.OrdinalIgnoreCase))
                {
                    prefix = prefix.Substring(3); // AllInventoryEntries -> InventoryEntries
                }
                if (prefix.EndsWith("Entries", StringComparison.OrdinalIgnoreCase))
                {
                    prefix = prefix.Substring(0, prefix.Length - 7); // InventoryEntries -> Inventory
                }

                lastPart = $"{prefix}_{lastPart}";
            }

            // Convert PascalCase/camelCase to snake_case
            var snake = Regex.Replace(lastPart, @"(?<!^)(?=[A-Z])", "_").ToLowerInvariant();
            snake = Regex.Replace(snake, @"[^a-z0-9_]", "_");
            snake = Regex.Replace(snake, @"_+", "_").Trim('_');

            return string.IsNullOrWhiteSpace(snake) ? "column" : snake;
        }

        public OutputMapping AddField(OutputMapping mapping, string sourcePath, string? outputName = null)
        {
            var suggestedName = string.IsNullOrWhiteSpace(outputName) ? GenerateDefaultOutputName(sourcePath) : outputName.Trim();

            // Handle duplicate output names automatically
            var existingNames = new HashSet<string>(mapping.Fields.Select(f => f.OutputName), StringComparer.OrdinalIgnoreCase);
            var finalName = suggestedName;
            int counter = 1;
            while (existingNames.Contains(finalName))
            {
                finalName = $"{suggestedName}_{counter++}";
            }

            var field = new OutputMappingField
            {
                Id = Guid.NewGuid().ToString(),
                MappingId = mapping.Id,
                SourceEntity = mapping.SourceEntity,
                SourcePath = sourcePath,
                OutputName = finalName,
                OutputDataType = FieldDataType.String,
                Ordinal = mapping.Fields.Count + 1,
                Transformation = TransformationType.None,
                IsVisible = true
            };

            mapping.Fields.Add(field);
            mapping.UpdatedAt = DateTime.UtcNow;
            return mapping;
        }

        public OutputMapping RemoveField(OutputMapping mapping, string fieldId)
        {
            mapping.Fields.RemoveAll(f => f.Id == fieldId || f.SourcePath == fieldId);
            ReorderOrdinals(mapping);
            mapping.UpdatedAt = DateTime.UtcNow;
            return mapping;
        }

        public OutputMapping MoveField(OutputMapping mapping, string fieldId, int newOrdinal)
        {
            var field = mapping.Fields.FirstOrDefault(f => f.Id == fieldId);
            if (field == null) return mapping;

            mapping.Fields.Remove(field);
            int targetIdx = Math.Max(0, Math.Min(newOrdinal - 1, mapping.Fields.Count));
            mapping.Fields.Insert(targetIdx, field);

            ReorderOrdinals(mapping);
            mapping.UpdatedAt = DateTime.UtcNow;
            return mapping;
        }

        public OutputMapping UpdateField(OutputMapping mapping, OutputMappingField updatedField)
        {
            var idx = mapping.Fields.FindIndex(f => f.Id == updatedField.Id);
            if (idx >= 0)
            {
                mapping.Fields[idx] = updatedField;
                mapping.UpdatedAt = DateTime.UtcNow;
            }
            return mapping;
        }

        public OutputMapping ApplyTransformation(OutputMapping mapping, string fieldId, TransformationType transformation, string? parameter = null)
        {
            var field = mapping.Fields.FirstOrDefault(f => f.Id == fieldId);
            if (field != null)
            {
                field.Transformation = transformation;
                field.TransformationParameter = parameter;
                mapping.UpdatedAt = DateTime.UtcNow;
            }
            return mapping;
        }

        public OutputMapping AddFilter(OutputMapping mapping, FilterRule rule, string? parentGroupId = null)
        {
            if (mapping.RootFilter == null)
            {
                mapping.RootFilter = new FilterGroup();
            }

            if (string.IsNullOrEmpty(parentGroupId) || parentGroupId == mapping.RootFilter.Id)
            {
                mapping.RootFilter.Rules.Add(rule);
            }
            else
            {
                var targetGroup = FindFilterGroup(mapping.RootFilter, parentGroupId);
                if (targetGroup != null)
                {
                    targetGroup.Rules.Add(rule);
                }
                else
                {
                    mapping.RootFilter.Rules.Add(rule);
                }
            }

            mapping.UpdatedAt = DateTime.UtcNow;
            return mapping;
        }

        public OutputMapping RemoveFilter(OutputMapping mapping, string ruleId)
        {
            if (mapping.RootFilter != null)
            {
                RemoveFilterRuleRecursive(mapping.RootFilter, ruleId);
                mapping.UpdatedAt = DateTime.UtcNow;
            }
            return mapping;
        }

        public MappingValidationResult ValidateMapping(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel)
        {
            var result = new MappingValidationResult();
            var messages = new List<MappingValidationMessage>();

            // 1. Source Entity Validation
            if (string.IsNullOrWhiteSpace(mapping.SourceEntity))
            {
                messages.Add(new MappingValidationMessage
                {
                    Level = "Error",
                    FieldPath = "SourceEntity",
                    Message = "Mapping source entity cannot be empty.",
                    SuggestedFix = "Select a valid source entity (e.g., Voucher, Ledger)."
                });
            }
            else
            {
                bool entityExists = discoveryModel.Collections.Any(c => c.Name.Equals(mapping.SourceEntity, StringComparison.OrdinalIgnoreCase)) ||
                                   discoveryModel.Objects.Any(o => o.Name.Equals(mapping.SourceEntity, StringComparison.OrdinalIgnoreCase));
                if (!entityExists)
                {
                    messages.Add(new MappingValidationMessage
                    {
                        Level = "Error",
                        FieldPath = mapping.SourceEntity,
                        Message = $"Source entity '{mapping.SourceEntity}' was not found in connected discovery metadata.",
                        SuggestedFix = "Ensure current Tally company supports this entity."
                    });
                }
            }

            // 2. Duplicate Output Names
            var outputNames = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var f in mapping.Fields)
            {
                if (string.IsNullOrWhiteSpace(f.OutputName))
                {
                    messages.Add(new MappingValidationMessage
                    {
                        Level = "Error",
                        FieldPath = f.SourcePath,
                        Message = "Output field name cannot be empty.",
                        SuggestedFix = "Provide a unique column name."
                    });
                    continue;
                }

                if (!outputNames.ContainsKey(f.OutputName))
                {
                    outputNames[f.OutputName] = new List<string>();
                }
                outputNames[f.OutputName].Add(f.SourcePath);
            }

            foreach (var kvp in outputNames.Where(k => k.Value.Count > 1))
            {
                messages.Add(new MappingValidationMessage
                {
                    Level = "Error",
                    FieldPath = string.Join(", ", kvp.Value),
                    Message = $"Duplicate output column name '{kvp.Key}' used across multiple fields.",
                    SuggestedFix = $"Rename output column '{kvp.Key}' to be unique."
                });
            }

            // 3. Source Path Validation against Discovery Metadata
            var validPaths = new HashSet<string>(discoveryModel.CanonicalPaths.Select(p => p.PathString), StringComparer.OrdinalIgnoreCase);
            var discoveredFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var col in discoveryModel.Collections)
            {
                foreach (var field in col.Fields)
                {
                    discoveredFields.Add($"{col.Name}.{field.Name}");
                    discoveredFields.Add(field.Name);
                }
            }

            foreach (var f in mapping.Fields)
            {
                bool isValid = validPaths.Contains(f.SourcePath) ||
                              discoveredFields.Contains(f.SourcePath) ||
                              f.SourcePath.StartsWith(mapping.SourceEntity + ".", StringComparison.OrdinalIgnoreCase);

                if (!isValid)
                {
                    messages.Add(new MappingValidationMessage
                    {
                        Level = "Error",
                        FieldPath = f.SourcePath,
                        Message = $"Source path '{f.SourcePath}' is missing or unavailable in current metadata.",
                        SuggestedFix = "Select a valid field from discovered paths or rescan schema."
                    });
                }
                else if (f.IsRequired)
                {
                    messages.Add(new MappingValidationMessage
                    {
                        Level = "Info",
                        FieldPath = f.SourcePath,
                        Message = $"Field '{f.OutputName}' is marked as REQUIRED.",
                        SuggestedFix = "Null values will trigger validation warnings during execution."
                    });
                }
            }

            result.Messages = messages;
            result.ErrorCount = messages.Count(m => m.Level == "Error");
            result.WarningCount = messages.Count(m => m.Level == "Warning");
            result.InfoCount = messages.Count(m => m.Level == "Info");
            result.IsValid = result.ErrorCount == 0;

            mapping.Status = result.IsValid ? MappingStatus.Valid : MappingStatus.Invalid;
            return result;
        }

        public UnifiedQueryPlan BuildQuery(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel)
        {
            var uqd = new UnifiedQueryDefinition
            {
                SourceEntity = mapping.SourceEntity,
                Fields = mapping.Fields.Select(f => f.SourcePath).ToList(),
                Limit = mapping.Configuration.MaxPreviewRows
            };

            return _queryPlanner.BuildPlan(uqd, discoveryModel);
        }

        public async Task<MappedDataResult> PreviewAsync(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel, CancellationToken cancellationToken = default)
        {
            return await GetMappedDataAsync(mapping, discoveryModel, mapping.Configuration.MaxPreviewRows, cancellationToken);
        }

        public async Task<MappedDataResult> GetMappedDataAsync(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel, int? limit = null, CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            var validation = ValidateMapping(mapping, discoveryModel);

            var schema = new OutputSchema
            {
                Columns = mapping.Fields.OrderBy(f => f.Ordinal).Select(f => new OutputSchemaColumn
                {
                    Name = f.OutputName,
                    DataType = f.OutputDataType,
                    Ordinal = f.Ordinal,
                    SourcePath = f.SourcePath,
                    Transformation = f.Transformation
                }).ToList()
            };

            var result = new MappedDataResult
            {
                Schema = schema,
                Validation = validation,
                Rows = new List<Dictionary<string, object?>>(),
                Warnings = new List<string>(),
                Errors = new List<RowProcessingError>()
            };

            cancellationToken.ThrowIfCancellationRequested();

            // Simulate/Fetch Source Data Rows based on Discovery Model & Entities
            int rowLimit = limit ?? mapping.Configuration.MaxPreviewRows;
            var sourceRows = GenerateSampleSourceRows(mapping.SourceEntity, rowLimit);

            int rowCounter = 0;
            int successfulRows = 0;
            int errorRows = 0;

            foreach (var rawRow in sourceRows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                rowCounter++;

                // 1. Evaluate Filters
                if (mapping.RootFilter != null && mapping.RootFilter.Rules.Count > 0)
                {
                    bool passesFilter = EvaluateFilterGroup(mapping.RootFilter, rawRow, mapping.Parameters);
                    if (!passesFilter) continue;
                }

                // 2. Process Row Fields
                var mappedRow = new Dictionary<string, object?>();
                bool rowHasError = false;

                foreach (var field in mapping.Fields.OrderBy(f => f.Ordinal))
                {
                    try
                    {
                        object? val = ExtractValueByPath(rawRow, field.SourcePath);

                        // Apply Transformation
                        if (field.Transformation != TransformationType.None)
                        {
                            val = ApplyTransformationToValue(val, field.Transformation, field.TransformationParameter, field, rawRow);
                        }

                        // Apply Default Value if NULL
                        if (val == null && !string.IsNullOrEmpty(field.DefaultValue))
                        {
                            val = field.DefaultValue;
                        }

                        // Required Field Check
                        if (val == null && field.IsRequired)
                        {
                            var err = new RowProcessingError
                            {
                                RowNumber = rowCounter,
                                FieldName = field.OutputName,
                                SourcePath = field.SourcePath,
                                ErrorMessage = $"Required field '{field.OutputName}' is NULL.",
                                OriginalValue = "NULL"
                            };
                            result.Errors.Add(err);
                            rowHasError = true;

                            if (mapping.Configuration.ErrorStrategy == ErrorRowHandling.StopOnFirstError)
                            {
                                break;
                            }
                        }

                        mappedRow[field.OutputName] = val;
                    }
                    catch (Exception ex)
                    {
                        rowHasError = true;
                        result.Errors.Add(new RowProcessingError
                        {
                            RowNumber = rowCounter,
                            FieldName = field.OutputName,
                            SourcePath = field.SourcePath,
                            ErrorMessage = ex.Message,
                            OriginalValue = "Error"
                        });

                        if (mapping.Configuration.ErrorStrategy == ErrorRowHandling.StopOnFirstError)
                        {
                            break;
                        }
                    }
                }

                if (rowHasError)
                {
                    errorRows++;
                    if (mapping.Configuration.ErrorStrategy == ErrorRowHandling.StopOnFirstError)
                    {
                        result.Warnings.Add($"Execution stopped on first error at row {rowCounter}.");
                        break;
                    }
                }
                else
                {
                    successfulRows++;
                    result.Rows.Add(mappedRow);
                }
            }

            result.TotalRows = result.Rows.Count;
            result.SuccessfulRows = successfulRows;
            result.ErrorRows = errorRows;
            result.ExecutionTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;

            if (result.Rows.Count == 0)
            {
                result.Warnings.Add("No records matched the current mapping/filter.");
            }

            return result;
        }

        public async Task<OutputMapping> SaveMappingAsync(OutputMapping mapping, CancellationToken cancellationToken = default)
        {
            mapping.UpdatedAt = DateTime.UtcNow;
            return await _repository.SaveMappingAsync(mapping, cancellationToken);
        }

        public async Task<OutputMapping?> LoadMappingAsync(string id, CancellationToken cancellationToken = default)
        {
            return await _repository.GetMappingByIdAsync(id, cancellationToken);
        }

        public async Task<List<OutputMapping>> ListMappingsAsync(string? companyId = null, string? searchTerm = null, CancellationToken cancellationToken = default)
        {
            return await _repository.GetAllMappingsAsync(companyId, searchTerm, cancellationToken);
        }

        public async Task<bool> DeleteMappingAsync(string id, CancellationToken cancellationToken = default)
        {
            return await _repository.DeleteMappingAsync(id, cancellationToken);
        }

        public async Task<OutputMapping> DuplicateMappingAsync(string id, string? newName = null, CancellationToken cancellationToken = default)
        {
            var original = await _repository.GetMappingByIdAsync(id, cancellationToken);
            if (original == null) throw new InvalidOperationException($"Mapping '{id}' not found.");

            var copy = ImportMappingFromJson(ExportMappingToJson(original));
            copy.Id = Guid.NewGuid().ToString();
            copy.Name = string.IsNullOrWhiteSpace(newName) ? $"{original.Name} (Copy)" : newName.Trim();
            copy.CreatedAt = DateTime.UtcNow;
            copy.UpdatedAt = DateTime.UtcNow;
            copy.Version = 1;

            foreach (var f in copy.Fields)
            {
                f.Id = Guid.NewGuid().ToString();
                f.MappingId = copy.Id;
            }

            return await _repository.SaveMappingAsync(copy, cancellationToken);
        }

        public string ExportMappingToJson(OutputMapping mapping)
        {
            return JsonSerializer.Serialize(mapping, JsonOpts);
        }

        public OutputMapping ImportMappingFromJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) throw new ArgumentException("JSON string cannot be empty.");

            var mapping = JsonSerializer.Deserialize<OutputMapping>(json, JsonOpts);
            if (mapping == null) throw new InvalidOperationException("Failed to parse output mapping JSON.");

            return mapping;
        }

        // --- Helper Methods ---

        private static void ReorderOrdinals(OutputMapping mapping)
        {
            for (int i = 0; i < mapping.Fields.Count; i++)
            {
                mapping.Fields[i].Ordinal = i + 1;
            }
        }

        private static FilterGroup? FindFilterGroup(FilterGroup group, string targetId)
        {
            if (group.Id == targetId) return group;
            foreach (var sub in group.SubGroups)
            {
                var found = FindFilterGroup(sub, targetId);
                if (found != null) return found;
            }
            return null;
        }

        private static void RemoveFilterRuleRecursive(FilterGroup group, string ruleId)
        {
            group.Rules.RemoveAll(r => r.Id == ruleId);
            foreach (var sub in group.SubGroups)
            {
                RemoveFilterRuleRecursive(sub, ruleId);
            }
        }

        private static bool EvaluateFilterGroup(FilterGroup group, Dictionary<string, object?> rawRow, List<MappingParameter> parameters)
        {
            if (group == null || (group.Rules.Count == 0 && group.SubGroups.Count == 0)) return true;

            var ruleResults = new List<bool>();

            foreach (var rule in group.Rules)
            {
                ruleResults.Add(EvaluateFilterRule(rule, rawRow, parameters));
            }

            foreach (var subGroup in group.SubGroups)
            {
                ruleResults.Add(EvaluateFilterGroup(subGroup, rawRow, parameters));
            }

            if (group.LogicalOperator == FilterLogicalGroup.AND)
            {
                return ruleResults.All(r => r);
            }
            else // OR
            {
                return ruleResults.Any(r => r);
            }
        }

        private static bool EvaluateFilterRule(FilterRule rule, Dictionary<string, object?> rawRow, List<MappingParameter> parameters)
        {
            object? rowVal = ExtractValueByPath(rawRow, rule.FieldPath);
            string targetValue = rule.Value;

            if (rule.IsParameter && !string.IsNullOrEmpty(rule.ParameterName))
            {
                var param = parameters.FirstOrDefault(p => p.Name.Equals(rule.ParameterName, StringComparison.OrdinalIgnoreCase));
                if (param != null)
                {
                    targetValue = param.CurrentValue ?? param.DefaultValue ?? string.Empty;
                }
            }

            string strRowVal = rowVal?.ToString() ?? string.Empty;

            return rule.Operator switch
            {
                FilterOperator.Equals => string.Equals(strRowVal, targetValue, StringComparison.OrdinalIgnoreCase),
                FilterOperator.NotEquals => !string.Equals(strRowVal, targetValue, StringComparison.OrdinalIgnoreCase),
                FilterOperator.Contains => strRowVal.Contains(targetValue, StringComparison.OrdinalIgnoreCase),
                FilterOperator.StartsWith => strRowVal.StartsWith(targetValue, StringComparison.OrdinalIgnoreCase),
                FilterOperator.EndsWith => strRowVal.EndsWith(targetValue, StringComparison.OrdinalIgnoreCase),
                FilterOperator.IsNull => rowVal == null || string.IsNullOrWhiteSpace(strRowVal),
                FilterOperator.IsNotNull => rowVal != null && !string.IsNullOrWhiteSpace(strRowVal),
                FilterOperator.GreaterThan => CompareValues(rowVal, targetValue) > 0,
                FilterOperator.GreaterThanOrEqual => CompareValues(rowVal, targetValue) >= 0,
                FilterOperator.LessThan => CompareValues(rowVal, targetValue) < 0,
                FilterOperator.LessThanOrEqual => CompareValues(rowVal, targetValue) <= 0,
                FilterOperator.Between => CompareValues(rowVal, targetValue) >= 0 && CompareValues(rowVal, rule.SecondValue ?? string.Empty) <= 0,
                FilterOperator.In => rule.InValues.Any(iv => string.Equals(strRowVal, iv, StringComparison.OrdinalIgnoreCase)),
                _ => true
            };
        }

        private static int CompareValues(object? val1, string val2)
        {
            if (val1 == null) return -1;

            if (decimal.TryParse(val1.ToString(), out decimal dec1) && decimal.TryParse(val2, out decimal dec2))
            {
                return dec1.CompareTo(dec2);
            }

            if (DateTime.TryParse(val1.ToString(), out DateTime dt1) && DateTime.TryParse(val2, out DateTime dt2))
            {
                return dt1.CompareTo(dt2);
            }

            return string.Compare(val1.ToString(), val2, StringComparison.OrdinalIgnoreCase);
        }

        private static object? ExtractValueByPath(Dictionary<string, object?> row, string path)
        {
            if (row.TryGetValue(path, out var exact)) return exact;

            var parts = path.Split('.', StringSplitOptions.RemoveEmptyEntries);
            var key = parts.Length > 0 ? parts[^1] : path;

            foreach (var kvp in row)
            {
                if (kvp.Key.Equals(path, StringComparison.OrdinalIgnoreCase) || kvp.Key.Equals(key, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value;
                }
            }

            return null;
        }

        private static object? ApplyTransformationToValue(object? val, TransformationType transformation, string? parameter, OutputMappingField field, Dictionary<string, object?> rawRow)
        {
            if (val == null && transformation != TransformationType.CONCAT && transformation != TransformationType.IF)
            {
                return null;
            }

            string strVal = val?.ToString() ?? string.Empty;

            return transformation switch
            {
                TransformationType.TRIM => strVal.Trim(),
                TransformationType.UPPER => strVal.ToUpperInvariant(),
                TransformationType.LOWER => strVal.ToLowerInvariant(),
                TransformationType.CONCAT => PerformConcat(parameter, rawRow, field.ConcatSeparator),
                TransformationType.SUBSTRING => PerformSubstring(strVal, parameter),
                TransformationType.ROUND => PerformRound(val, parameter),
                TransformationType.ABS => PerformAbs(val),
                TransformationType.IF => PerformIfCondition(val, parameter),
                TransformationType.DATE or TransformationType.FORMAT_DATE => PerformDateFormat(val, parameter),
                TransformationType.NUMBER => decimal.TryParse(strVal, out decimal decVal) ? decVal : 0m,
                TransformationType.STRING => strVal,
                _ => val
            };
        }

        private static object PerformConcat(string? parameter, Dictionary<string, object?> rawRow, string? separator)
        {
            string sep = string.IsNullOrEmpty(separator) ? " " : separator;
            if (string.IsNullOrWhiteSpace(parameter)) return string.Empty;

            var paths = parameter.Split(',', StringSplitOptions.RemoveEmptyEntries);
            var parts = new List<string>();

            foreach (var p in paths)
            {
                var cleanPath = p.Trim();
                var extracted = ExtractValueByPath(rawRow, cleanPath);
                if (extracted != null && !string.IsNullOrWhiteSpace(extracted.ToString()))
                {
                    parts.Add(extracted.ToString()!);
                }
            }

            return string.Join(sep, parts);
        }

        private static object PerformSubstring(string val, string? parameter)
        {
            if (string.IsNullOrWhiteSpace(parameter)) return val;
            var parts = parameter.Split(',');
            if (parts.Length >= 2 && int.TryParse(parts[0], out int start) && int.TryParse(parts[1], out int len))
            {
                if (start < 0 || start >= val.Length) return string.Empty;
                int maxLen = Math.Min(len, val.Length - start);
                return val.Substring(start, maxLen);
            }
            return val;
        }

        private static object PerformRound(object? val, string? parameter)
        {
            if (val != null && decimal.TryParse(val.ToString(), out decimal dec))
            {
                int decimals = 2;
                if (!string.IsNullOrWhiteSpace(parameter) && int.TryParse(parameter, out int parsed))
                {
                    decimals = Math.Clamp(parsed, 0, 4);
                }
                return Math.Round(dec, decimals);
            }
            return val ?? 0m;
        }

        private static object PerformAbs(object? val)
        {
            if (val != null && decimal.TryParse(val.ToString(), out decimal dec))
            {
                return Math.Abs(dec);
            }
            return val ?? 0m;
        }

        private static object PerformIfCondition(object? val, string? parameter)
        {
            // Simple controlled condition format: "GT:100000?HIGH:NORMAL"
            if (string.IsNullOrWhiteSpace(parameter) || !parameter.Contains('?')) return val ?? string.Empty;

            var mainParts = parameter.Split('?');
            var condPart = mainParts[0]; // e.g. "GT:100000"
            var resPart = mainParts[1].Split(':'); // e.g. "HIGH", "NORMAL"

            string trueRes = resPart.Length > 0 ? resPart[0] : "TRUE";
            string falseRes = resPart.Length > 1 ? resPart[1] : "FALSE";

            if (decimal.TryParse(val?.ToString(), out decimal decVal))
            {
                if (condPart.StartsWith("GT:") && decimal.TryParse(condPart.Substring(3), out decimal targetDec))
                {
                    return decVal > targetDec ? trueRes : falseRes;
                }
            }

            return val ?? falseRes;
        }

        private static object PerformDateFormat(object? val, string? parameter)
        {
            string fmt = string.IsNullOrWhiteSpace(parameter) ? "yyyy-MM-dd" : parameter.Trim();
            if (val != null && DateTime.TryParse(val.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dt))
            {
                return dt.ToString(fmt, CultureInfo.InvariantCulture);
            }
            return val ?? string.Empty;
        }

        private static List<Dictionary<string, object?>> GenerateSampleSourceRows(string entity, int count)
        {
            var list = new List<Dictionary<string, object?>>();

            for (int i = 1; i <= Math.Min(count, 500); i++)
            {
                var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

                if (entity.Equals("Voucher", StringComparison.OrdinalIgnoreCase))
                {
                    row["Voucher.Date"] = DateTime.UtcNow.AddDays(-i).ToString("yyyy-MM-dd");
                    row["Date"] = row["Voucher.Date"];
                    row["Voucher.VoucherNumber"] = $"INV-2026-{i:D4}";
                    row["VoucherNumber"] = row["Voucher.VoucherNumber"];
                    row["Voucher.VoucherTypeName"] = i % 2 == 0 ? "Sales" : "Purchase";
                    row["VoucherTypeName"] = row["Voucher.VoucherTypeName"];
                    row["Voucher.Party.Name"] = i % 3 == 0 ? "ABC Trading Pvt Ltd" : (i % 3 == 1 ? "XYZ Enterprises" : "Global Retailers");
                    row["Party.Name"] = row["Voucher.Party.Name"];
                    row["PartyLedgerName"] = row["Voucher.Party.Name"];
                    row["Voucher.Party.GSTIN"] = i % 4 == 0 ? null : $"27AAACB{1000 + i}C1Z5";
                    row["Party.GSTIN"] = row["Voucher.Party.GSTIN"];
                    row["GSTIN"] = row["Voucher.Party.GSTIN"];
                    row["Voucher.Amount"] = 1500m * i;
                    row["Amount"] = row["Voucher.Amount"];
                    row["Voucher.AllInventoryEntries.StockItemName"] = $"Item Product-{i}";
                    row["Voucher.AllInventoryEntries.BilledQuantity"] = 10m * i;
                    row["Voucher.AllInventoryEntries.Amount"] = 1500m * i;
                }
                else if (entity.Equals("Ledger", StringComparison.OrdinalIgnoreCase))
                {
                    row["Ledger.Name"] = $"Ledger Account {i}";
                    row["Name"] = row["Ledger.Name"];
                    row["Ledger.Parent"] = i % 2 == 0 ? "Sundry Debtors" : "Sundry Creditors";
                    row["Parent"] = row["Ledger.Parent"];
                    row["Ledger.OpeningBalance"] = 5000m * i;
                    row["OpeningBalance"] = row["Ledger.OpeningBalance"];
                    row["Ledger.ClosingBalance"] = 7500m * i;
                    row["ClosingBalance"] = row["Ledger.ClosingBalance"];
                }
                else
                {
                    row[$"{entity}.Name"] = $"{entity} Record {i}";
                    row["Name"] = row[$"{entity}.Name"];
                    row[$"{entity}.Code"] = $"CODE-{i}";
                    row["Amount"] = 100m * i;
                }

                list.Add(row);
            }

            return list;
        }
    }
}
