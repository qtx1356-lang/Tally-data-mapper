import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { 
  DiscoverySnapshot, 
  SemanticMapping, 
  OutputCapability, 
  CompanyCompatibility 
} from "../types/phase33ADiscovery";

export const phase33aRouter = Router();

// Simulated Real-World Tally Discovery Profiles
const MOCK_SNAPSHOTS: Record<string, DiscoverySnapshot> = {
  "comp_standard": {
    snapshotId: `snap_${uuidv4()}`,
    companyName: "EXFIN Global Trading (Standard Profile)",
    companyIdentifier: "EXF-1001",
    financialYear: "2023-2024",
    tallyVersion: "TallyPrime 4.0",
    discoveryTime: new Date().toISOString(),
    masters: ["Ledger", "Group", "Stock Item", "Stock Group", "Unit", "Godown", "Voucher Type", "Currency", "Cost Centre"],
    vouchers: ["Sales", "Purchase", "Receipt", "Payment", "Contra", "Journal", "Debit Note", "Credit Note"],
    collections: [
      {
        name: "Ledger",
        purpose: "Financial Accounts",
        status: "AVAILABLE",
        fields: [
          { fieldName: "$Name", type: "String", availability: "AVAILABLE" },
          { fieldName: "$Parent", type: "String", availability: "AVAILABLE" },
          { fieldName: "$ClosingBalance", type: "Currency", availability: "AVAILABLE" }
        ]
      },
      {
        name: "Voucher",
        purpose: "Transactions",
        status: "AVAILABLE",
        fields: [
          { fieldName: "$VoucherTypeName", type: "String", availability: "AVAILABLE" },
          { fieldName: "$Date", type: "Date", availability: "AVAILABLE" },
          { fieldName: "$Amount", type: "Currency", availability: "AVAILABLE" }
        ]
      }
    ],
    warnings: [],
    errors: []
  },
  "comp_limited": {
    snapshotId: `snap_${uuidv4()}`,
    companyName: "EXFIN Services (Limited Profile)",
    companyIdentifier: "EXF-2002",
    financialYear: "2023-2024",
    tallyVersion: "Tally.ERP 9 Release 6.6",
    discoveryTime: new Date().toISOString(),
    masters: ["Ledger", "Group", "Voucher Type"], // No Inventory
    vouchers: ["Receipt", "Payment", "Journal"], // Service only
    collections: [
      {
        name: "Ledger",
        purpose: "Financial Accounts",
        status: "AVAILABLE",
        fields: [
          { fieldName: "$Name", type: "String", availability: "AVAILABLE" },
          { fieldName: "$ClosingBalance", type: "Currency", availability: "AVAILABLE" }
        ]
      },
      {
        name: "Stock Item",
        purpose: "Inventory",
        status: "ERROR",
        fields: []
      }
    ],
    warnings: ["Inventory module not enabled in Tally company."],
    errors: ["Collection 'Stock Item' failed: Does not exist."]
  }
};

const MOCK_MAPPINGS: SemanticMapping[] = [
  {
    mappingId: "map_001",
    sourceCollection: "Ledger",
    sourceField: "$Name",
    targetConcept: "Account.Name",
    confidence: 0.99,
    reason: "Exact semantic match with known dictionary",
    status: "MAPPED",
    mappingVersion: "1.0",
    isLocked: true,
    sampleValues: ["Cash", "Bank A/c", "Sales A/c"]
  },
  {
    mappingId: "map_002",
    sourceCollection: "Ledger",
    sourceField: "$UDF_CustomCode",
    targetConcept: "Account.ExternalId",
    confidence: 0.45,
    reason: "Fuzzy match on 'Code', highly null sample set",
    status: "REQUIRES_REVIEW",
    mappingVersion: "1.0",
    isLocked: false,
    sampleValues: ["", "EXT-99", ""]
  }
];

const MOCK_OUTPUTS: Record<string, OutputCapability[]> = {
  "comp_standard": [
    {
      outputId: "out_tb",
      name: "Trial Balance",
      category: "Financial",
      status: "AVAILABLE",
      reason: "All required fields mapped and available.",
      sourceType: "APPLICATION GENERATED",
      dependencies: { requiredDatasets: ["Ledger"], requiredFields: ["$Name", "$ClosingBalance"], requiredMappings: ["map_001"] }
    },
    {
      outputId: "out_inv",
      name: "Inventory Aging",
      category: "Inventory",
      status: "AVAILABLE",
      reason: "Stock Item and Godown collections present.",
      sourceType: "APPLICATION GENERATED",
      dependencies: { requiredDatasets: ["Stock Item", "Voucher"], requiredFields: [], requiredMappings: [] }
    }
  ],
  "comp_limited": [
    {
      outputId: "out_tb",
      name: "Trial Balance",
      category: "Financial",
      status: "AVAILABLE",
      reason: "Core ledger data present.",
      sourceType: "APPLICATION GENERATED",
      dependencies: { requiredDatasets: ["Ledger"], requiredFields: ["$Name", "$ClosingBalance"], requiredMappings: ["map_001"] }
    },
    {
      outputId: "out_inv",
      name: "Inventory Aging",
      category: "Inventory",
      status: "UNAVAILABLE",
      reason: "Required collection missing: Stock Item",
      sourceType: "APPLICATION GENERATED",
      dependencies: { requiredDatasets: ["Stock Item", "Voucher"], requiredFields: [], requiredMappings: [] }
    }
  ]
};

phase33aRouter.get("/discovery/:profile", (req, res) => {
  const profile = req.params.profile;
  res.json({
    snapshot: MOCK_SNAPSHOTS[profile],
    mappings: MOCK_MAPPINGS,
    outputs: MOCK_OUTPUTS[profile],
    compatibility: {
      companyName: MOCK_SNAPSHOTS[profile].companyName,
      connectionScore: 100,
      discoveryScore: profile === 'comp_standard' ? 100 : 65,
      schemaScore: profile === 'comp_standard' ? 95 : 60,
      mappingScore: 85,
      dataQualityScore: 90,
      outputCoverage: {
        available: profile === 'comp_standard' ? 24 : 12,
        partial: 5,
        unavailable: profile === 'comp_standard' ? 2 : 14
      },
      overallScore: profile === 'comp_standard' ? 92 : 68
    }
  });
});
