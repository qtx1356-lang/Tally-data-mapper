using System;
using System.Collections.Generic;
using System.Linq;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class MetadataDiffService : IMetadataDiffService
    {
        public ScanDiffResult CompareScans(UnifiedDiscoveryModel scanA, UnifiedDiscoveryModel scanB)
        {
            var diff = new ScanDiffResult
            {
                ScanAId = scanA?.ScanId ?? 0,
                ScanBId = scanB?.ScanId ?? 0,
                ScanADate = scanA?.ScanDate,
                ScanBDate = scanB?.ScanDate,
                CompanyId = scanB?.CompanyId ?? scanA?.CompanyId ?? string.Empty
            };

            if (scanA == null || scanB == null) return diff;

            var colsA = scanA.Collections.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);
            var colsB = scanB.Collections.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);

            diff.AddedCollections = colsB.Keys.Except(colsA.Keys, StringComparer.OrdinalIgnoreCase).ToList();
            diff.RemovedCollections = colsA.Keys.Except(colsB.Keys, StringComparer.OrdinalIgnoreCase).ToList();

            foreach (var kvp in colsB)
            {
                if (colsA.TryGetValue(kvp.Key, out var colA))
                {
                    var fieldsA = colA.Fields.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);
                    var fieldsB = kvp.Value.Fields.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);

                    foreach (var fldB in fieldsB)
                    {
                        if (!fieldsA.ContainsKey(fldB.Key))
                        {
                            diff.AddedFields.Add($"{kvp.Key}.{fldB.Key}");
                        }
                        else
                        {
                            var fldA = fieldsA[fldB.Key];
                            if (fldA.DataType != fldB.Value.DataType)
                            {
                                diff.ChangedTypes.Add($"{kvp.Key}.{fldB.Key}: {fldA.DataType} -> {fldB.Value.DataType}");
                            }
                        }
                    }

                    foreach (var fldA in fieldsA)
                    {
                        if (!fieldsB.ContainsKey(fldA.Key))
                        {
                            diff.RemovedFields.Add($"{kvp.Key}.{fldA.Key}");
                        }
                    }
                }
            }

            var relsA = scanA.Relationships.Select(r => $"{r.FromEntityId}->{r.ToEntityId}").ToHashSet(StringComparer.OrdinalIgnoreCase);
            var relsB = scanB.Relationships.Select(r => $"{r.FromEntityId}->{r.ToEntityId}").ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var r in relsB)
            {
                if (!relsA.Contains(r)) diff.ChangedRelationships.Add($"Added Relationship: {r}");
            }
            foreach (var r in relsA)
            {
                if (!relsB.Contains(r)) diff.ChangedRelationships.Add($"Removed Relationship: {r}");
            }

            return diff;
        }
    }
}
