using System;
using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class EntityRecognitionService : IEntityRecognitionService
    {
        private static readonly Dictionary<string, string> StandardEntities = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Company", "Company" },
            { "Ledger", "Ledger" },
            { "Group", "Group" },
            { "Voucher", "Voucher" },
            { "VoucherType", "VoucherType" },
            { "StockItem", "StockItem" },
            { "StockGroup", "StockGroup" },
            { "Godown", "Godown" },
            { "Unit", "Unit" },
            { "CostCentre", "CostCentre" },
            { "Employee", "Employee" },
            { "TallyCompany", "Company" },
            { "TallyLedger", "Ledger" },
            { "TallyGroup", "Group" },
            { "TallyVoucher", "Voucher" },
            { "AllInventoryEntries", "InventoryEntry" },
            { "AllLedgerEntries", "LedgerEntry" },
            { "BatchAllocations", "BatchAllocation" }
        };

        public RecognitionStatus ClassifyEntity(string entityName, out string canonicalType)
        {
            if (string.IsNullOrWhiteSpace(entityName))
            {
                canonicalType = "Unknown";
                return RecognitionStatus.Unknown;
            }

            foreach (var kvp in StandardEntities)
            {
                if (entityName.Equals(kvp.Key, StringComparison.OrdinalIgnoreCase) ||
                    entityName.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase))
                {
                    canonicalType = kvp.Value;
                    return RecognitionStatus.Recognized;
                }
            }

            canonicalType = "CustomEntity";
            return RecognitionStatus.Possible;
        }

        public CollectionCategory InferCategory(string collectionName, string? objectType = null)
        {
            if (string.IsNullOrWhiteSpace(collectionName)) return CollectionCategory.Other;

            var name = collectionName.ToLowerInvariant();

            if (name.Contains("voucher") || name.Contains("inventory") || name.Contains("bill") || name.Contains("journal"))
                return CollectionCategory.Transactions;

            if (name.Contains("ledger") || name.Contains("group") || name.Contains("company") || name.Contains("cost"))
                return CollectionCategory.Masters;

            if (name.Contains("stock") || name.Contains("godown") || name.Contains("unit") || name.Contains("batch"))
                return CollectionCategory.Inventory;

            if (name.Contains("payroll") || name.Contains("employee") || name.Contains("attendance"))
                return CollectionCategory.Payroll;

            if (name.Contains("report") || name.Contains("balance") || name.Contains("profit") || name.Contains("loss") || name.Contains("trial"))
                return CollectionCategory.Reports;

            if (name.Contains("system") || name.Contains("schema") || name.Contains("config") || name.Contains("odbc"))
                return CollectionCategory.System;

            return CollectionCategory.Accounting;
        }
    }
}
