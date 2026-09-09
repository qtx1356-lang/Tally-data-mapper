using System;
using System.Collections.Generic;
using System.Linq;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class FieldPathService : IFieldPathService
    {
        public List<CanonicalFieldPath> GenerateCanonicalPaths(UnifiedDiscoveryModel model)
        {
            var paths = new List<CanonicalFieldPath>();
            if (model == null) return paths;

            foreach (var col in model.Collections)
            {
                foreach (var field in col.Fields)
                {
                    var pathStr = $"{col.Name}.{field.Name}";
                    paths.Add(new CanonicalFieldPath
                    {
                        ScanId = model.ScanId,
                        CompanyId = model.CompanyId,
                        PathString = pathStr,
                        EntityName = col.Name,
                        FieldName = field.Name,
                        DataType = field.DataType,
                        IsValid = true,
                        Confidence = field.Confidence,
                        SourceType = field.Source,
                        UsageContexts = field.UsageContexts
                    });
                }
            }

            foreach (var obj in model.Objects)
            {
                foreach (var field in obj.Fields)
                {
                    var pathStr = $"{obj.Name}.{field.Name}";
                    if (!paths.Any(p => p.PathString.Equals(pathStr, StringComparison.OrdinalIgnoreCase)))
                    {
                        paths.Add(new CanonicalFieldPath
                        {
                            ScanId = model.ScanId,
                            CompanyId = model.CompanyId,
                            PathString = pathStr,
                            EntityName = obj.Name,
                            FieldName = field.Name,
                            DataType = field.DataType,
                            IsValid = true,
                            Confidence = field.Confidence,
                            SourceType = obj.SourceType,
                            UsageContexts = field.UsageContexts
                        });
                    }
                }
            }

            // Standard Tally Canonical Paths (e.g., Voucher.AllInventoryEntries.StockItemName)
            var standardPaths = new List<(string entity, string path, FieldDataType dataType)>
            {
                ("Voucher", "Voucher.Date", FieldDataType.Date),
                ("Voucher", "Voucher.VoucherNumber", FieldDataType.String),
                ("Voucher", "Voucher.VoucherTypeName", FieldDataType.String),
                ("Voucher", "Voucher.PartyLedgerName", FieldDataType.String),
                ("Voucher", "Voucher.Amount", FieldDataType.Decimal),
                ("Voucher", "Voucher.AllInventoryEntries.StockItemName", FieldDataType.String),
                ("Voucher", "Voucher.AllInventoryEntries.BilledQuantity", FieldDataType.Decimal),
                ("Voucher", "Voucher.AllInventoryEntries.Rate", FieldDataType.Decimal),
                ("Voucher", "Voucher.AllInventoryEntries.Amount", FieldDataType.Decimal),
                ("Voucher", "Voucher.AllLedgerEntries.LedgerName", FieldDataType.String),
                ("Voucher", "Voucher.AllLedgerEntries.Amount", FieldDataType.Decimal),
                ("Ledger", "Ledger.Name", FieldDataType.String),
                ("Ledger", "Ledger.Parent", FieldDataType.String),
                ("Ledger", "Ledger.OpeningBalance", FieldDataType.Decimal),
                ("Ledger", "Ledger.ClosingBalance", FieldDataType.Decimal),
                ("StockItem", "StockItem.Name", FieldDataType.String),
                ("StockItem", "StockItem.Parent", FieldDataType.String),
                ("StockItem", "StockItem.BaseUnits", FieldDataType.String)
            };

            foreach (var sp in standardPaths)
            {
                if (!paths.Any(p => p.PathString.Equals(sp.path, StringComparison.OrdinalIgnoreCase)))
                {
                    paths.Add(new CanonicalFieldPath
                    {
                        ScanId = model.ScanId,
                        CompanyId = model.CompanyId,
                        PathString = sp.path,
                        EntityName = sp.entity,
                        FieldName = sp.path.Split('.').Last(),
                        DataType = sp.dataType,
                        IsValid = true,
                        Confidence = DiscoveryConfidence.Verified,
                        SourceType = SourceType.TDL,
                        UsageContexts = new List<string> { "Standard TDL Path" }
                    });
                }
            }

            return paths;
        }

        public bool ValidatePath(string pathString, UnifiedDiscoveryModel model)
        {
            if (string.IsNullOrWhiteSpace(pathString)) return false;

            var parts = pathString.Split('.');
            if (parts.Length < 2) return false;

            string entityName = parts[0];
            string lastField = parts[^1];

            bool entityExists = model.Collections.Any(c => c.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase)) ||
                               model.Objects.Any(o => o.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase));

            return entityExists && !string.IsNullOrWhiteSpace(lastField);
        }
    }
}
