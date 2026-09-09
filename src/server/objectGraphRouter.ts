import { Router } from 'express';
import {
  IAccountingGraph,
  GraphNode,
  GraphEdge,
  GroupHierarchyNode,
  LedgerDetailModel,
  VoucherDetailModel,
  InventoryItemDetailModel,
  PartyDetailModel,
  GraphIntegrityIssue,
  SemanticMeasure,
  SemanticDimension,
  SemanticJoinPath,
  DeepDrillDownResult,
  GraphSnapshotDiff,
  AIGraphGroundingResponse,
  GraphAuditItem
} from '../types/phase31ObjectGraph';

export const objectGraphRouter = Router();

// =========================================================================
// IN-MEMORY SEED DATA: CANONICAL ACCOUNTING OBJECT GRAPH
// =========================================================================

const companyRoot: GraphNode = {
  nodeId: 'node-comp-1',
  nodeType: 'Company',
  sourceId: 'CMP-001',
  companyId: 'CMP-001',
  name: 'Acme Enterprise Ltd (HO)',
  displayName: 'Acme Enterprise Ltd (HO)',
  status: 'Active',
  source: 'Live Tally XML Gateway',
  snapshotId: 'snap-20260308-01',
  firstSeen: '2026-01-01T00:00:00Z',
  lastSeen: '2026-03-08T08:15:00Z',
  financialYear: '2025-2026',
  metadata: { gstin: '27AABCA1234F1Z5', currency: 'INR', booksFrom: '2025-04-01' }
};

const initialNodes: GraphNode[] = [
  companyRoot,
  // Primary & Subgroups
  {
    nodeId: 'node-grp-assets',
    nodeType: 'Group',
    sourceId: 'GRP-PRIMARY-ASSETS',
    companyId: 'CMP-001',
    name: 'Current Assets',
    displayName: 'Current Assets',
    status: 'Active',
    source: 'Tally Group Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { isPrimary: true, natureOfGroup: 'Assets' }
  },
  {
    nodeId: 'node-grp-debtors',
    nodeType: 'Group',
    sourceId: 'GRP-DEBTORS',
    companyId: 'CMP-001',
    name: 'Sundry Debtors',
    displayName: 'Sundry Debtors',
    status: 'Active',
    source: 'Tally Group Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parent: 'Current Assets', isSubgroup: true }
  },
  {
    nodeId: 'node-grp-bank',
    nodeType: 'Group',
    sourceId: 'GRP-BANK',
    companyId: 'CMP-001',
    name: 'Bank Accounts',
    displayName: 'Bank Accounts',
    status: 'Active',
    source: 'Tally Group Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parent: 'Current Assets' }
  },
  {
    nodeId: 'node-grp-sales',
    nodeType: 'Group',
    sourceId: 'GRP-SALES',
    companyId: 'CMP-001',
    name: 'Sales Accounts',
    displayName: 'Sales Accounts',
    status: 'Active',
    source: 'Tally Group Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { isPrimary: true, natureOfGroup: 'Income' }
  },
  {
    nodeId: 'node-grp-duties',
    nodeType: 'Group',
    sourceId: 'GRP-DUTIES',
    companyId: 'CMP-001',
    name: 'Duties & Taxes',
    displayName: 'Duties & Taxes',
    status: 'Active',
    source: 'Tally Group Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { natureOfGroup: 'Liabilities' }
  },

  // Ledgers
  {
    nodeId: 'node-led-customer-acme',
    nodeType: 'Ledger',
    sourceId: 'LED-CUST-001',
    companyId: 'CMP-001',
    name: 'Acme Tech Corp',
    displayName: 'Acme Tech Corp (Debtor)',
    status: 'Active',
    source: 'Tally Ledger Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parentGroup: 'Sundry Debtors', openingBal: 245000, closingBal: 850000 }
  },
  {
    nodeId: 'node-led-customer-zenith',
    nodeType: 'Ledger',
    sourceId: 'LED-CUST-002',
    companyId: 'CMP-001',
    name: 'Zenith Logistics Ltd',
    displayName: 'Zenith Logistics Ltd (Debtor)',
    status: 'Active',
    source: 'Tally Ledger Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parentGroup: 'Sundry Debtors', openingBal: 120000, closingBal: 420000 }
  },
  {
    nodeId: 'node-led-sales-dom',
    nodeType: 'Ledger',
    sourceId: 'LED-SALES-DOM',
    companyId: 'CMP-001',
    name: 'Domestic Sales @18%',
    displayName: 'Domestic Sales @18%',
    status: 'Active',
    source: 'Tally Ledger Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parentGroup: 'Sales Accounts', turnover: 4500000 }
  },
  {
    nodeId: 'node-led-cgst',
    nodeType: 'Ledger',
    sourceId: 'LED-CGST-9',
    companyId: 'CMP-001',
    name: 'CGST Input/Output 9%',
    displayName: 'CGST 9% Ledger',
    status: 'Active',
    source: 'Tally Ledger Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parentGroup: 'Duties & Taxes', rate: 9 }
  },
  {
    nodeId: 'node-led-sgst',
    nodeType: 'Ledger',
    sourceId: 'LED-SGST-9',
    companyId: 'CMP-001',
    name: 'SGST Input/Output 9%',
    displayName: 'SGST 9% Ledger',
    status: 'Active',
    source: 'Tally Ledger Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parentGroup: 'Duties & Taxes', rate: 9 }
  },
  {
    nodeId: 'node-led-hdfc',
    nodeType: 'Ledger',
    sourceId: 'LED-BANK-HDFC',
    companyId: 'CMP-001',
    name: 'HDFC Current A/c - 50200',
    displayName: 'HDFC Bank Account',
    status: 'Active',
    source: 'Tally Ledger Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { parentGroup: 'Bank Accounts', closingBal: 1845000 }
  },

  // Parties
  {
    nodeId: 'node-pty-acme',
    nodeType: 'Party',
    sourceId: 'PTY-ACME-CORP',
    companyId: 'CMP-001',
    name: 'Acme Tech Corp (GSTIN: 27AABCA1234F1Z5)',
    displayName: 'Acme Tech Corp',
    status: 'Active',
    source: 'Tally Party Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { classification: 'Customer', creditPeriod: '30 Days' }
  },

  // Stock Items & Stock Groups
  {
    nodeId: 'node-stkgrp-cloud',
    nodeType: 'StockGroup',
    sourceId: 'STKGRP-HW-CLOUD',
    companyId: 'CMP-001',
    name: 'Enterprise Cloud Hardware',
    displayName: 'Cloud Hardware Group',
    status: 'Active',
    source: 'Tally Inventory Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026'
  },
  {
    nodeId: 'node-item-server',
    nodeType: 'StockItem',
    sourceId: 'ITEM-SRV-200X',
    companyId: 'CMP-001',
    name: 'Enterprise Cloud Server Rack 200X',
    displayName: 'Cloud Server 200X',
    status: 'Active',
    source: 'Tally Inventory Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { unit: 'NOS', hsn: '84715000', gstRate: 18 }
  },

  // Cost Centres & Godowns
  {
    nodeId: 'node-cc-software',
    nodeType: 'CostCentre',
    sourceId: 'CC-SW-RD',
    companyId: 'CMP-001',
    name: 'Software Engineering & Cloud R&D',
    displayName: 'Software R&D Cost Centre',
    status: 'Active',
    source: 'Tally Cost Centre Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026'
  },
  {
    nodeId: 'node-godown-main',
    nodeType: 'Godown',
    sourceId: 'GDN-MUM-CENTRAL',
    companyId: 'CMP-001',
    name: 'Mumbai Central Warehouse Godown',
    displayName: 'Central Warehouse (Godown A)',
    status: 'Active',
    source: 'Tally Godown Master',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-01-01T00:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026'
  },

  // Vouchers
  {
    nodeId: 'node-vch-inv-001',
    nodeType: 'Voucher',
    sourceId: 'VCH-INV-2026-001',
    companyId: 'CMP-001',
    name: 'Sales Invoice INV-2026-001',
    displayName: 'Sales INV-2026-001 (₹ 3,54,000)',
    status: 'Active',
    source: 'Tally Sales Daybook',
    snapshotId: 'snap-20260308-01',
    firstSeen: '2026-03-01T10:00:00Z',
    lastSeen: '2026-03-08T08:15:00Z',
    financialYear: '2025-2026',
    metadata: { voucherType: 'Sales', date: '2026-03-01', totalAmount: 354000 }
  }
];

const initialEdges: GraphEdge[] = [
  // Company -> Groups
  {
    edgeId: 'edge-comp-assets',
    fromNode: 'node-comp-1',
    toNode: 'node-grp-assets',
    relationshipType: 'CONTAINS',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Company Master Hierarchy',
    evidence: {
      sourceField: 'COMPANY.GROUPS',
      sourceRecord: 'CMP-001',
      sourceReport: 'Trial Balance Hierarchy',
      extraction: 'Primary Group Direct Child',
      reason: 'Assets group explicitly belongs to company root'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-comp-salesgrp',
    fromNode: 'node-comp-1',
    toNode: 'node-grp-sales',
    relationshipType: 'CONTAINS',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Company Master Hierarchy',
    evidence: {
      sourceField: 'COMPANY.GROUPS',
      sourceRecord: 'CMP-001',
      sourceReport: 'Profit & Loss Hierarchy',
      extraction: 'Primary Income Group',
      reason: 'Sales Accounts group explicitly belongs to company root'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },

  // Group -> Subgroups
  {
    edgeId: 'edge-assets-debtors',
    fromNode: 'node-grp-assets',
    toNode: 'node-grp-debtors',
    relationshipType: 'CONTAINS',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Group Schema',
    evidence: {
      sourceField: 'GROUP.PARENT',
      sourceRecord: 'Sundry Debtors',
      sourceReport: 'Group Summary',
      extraction: 'PARENT="Current Assets"',
      reason: 'Sundry Debtors is a subgroup of Current Assets'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-assets-bank',
    fromNode: 'node-grp-assets',
    toNode: 'node-grp-bank',
    relationshipType: 'CONTAINS',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Group Schema',
    evidence: {
      sourceField: 'GROUP.PARENT',
      sourceRecord: 'Bank Accounts',
      sourceReport: 'Group Summary',
      extraction: 'PARENT="Current Assets"',
      reason: 'Bank Accounts is a subgroup of Current Assets'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },

  // Subgroup -> Ledgers
  {
    edgeId: 'edge-debtors-acme',
    fromNode: 'node-grp-debtors',
    toNode: 'node-led-customer-acme',
    relationshipType: 'CONTAINS',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Ledger Schema',
    evidence: {
      sourceField: 'LEDGER.PARENT',
      sourceRecord: 'Acme Tech Corp',
      sourceReport: 'Sundry Debtors Summary',
      extraction: 'PARENT="Sundry Debtors"',
      reason: 'Customer ledger parent is Sundry Debtors'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-sales-dom',
    fromNode: 'node-grp-sales',
    toNode: 'node-led-sales-dom',
    relationshipType: 'CONTAINS',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Ledger Schema',
    evidence: {
      sourceField: 'LEDGER.PARENT',
      sourceRecord: 'Domestic Sales @18%',
      sourceReport: 'Sales Accounts Summary',
      extraction: 'PARENT="Sales Accounts"',
      reason: 'Revenue ledger parent is Sales Accounts'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },

  // Party -> Ledger (Inferred & Verified)
  {
    edgeId: 'edge-pty-led-acme',
    fromNode: 'node-pty-acme',
    toNode: 'node-led-customer-acme',
    relationshipType: 'POSTED_TO',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 0.98,
    source: 'Tally Voucher Ledger Posting',
    evidence: {
      sourceField: 'PARTYLEDGERNAME',
      sourceRecord: 'INV-2026-001',
      sourceReport: 'Sales Voucher Extract',
      extraction: 'Party "Acme Tech Corp" mapped to ledger "Acme Tech Corp"',
      reason: 'Exact name and GSTIN alignment across Master and Daybook'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },

  // Voucher -> Ledger, Item, Tax
  {
    edgeId: 'edge-vch-led-customer',
    fromNode: 'node-vch-inv-001',
    toNode: 'node-led-customer-acme',
    relationshipType: 'POSTED_TO',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Voucher Line Header',
    evidence: {
      sourceField: 'VOUCHER.PARTYNAME',
      sourceRecord: 'VCH-INV-2026-001',
      sourceReport: 'Daybook',
      extraction: 'Debit Debit Rs 3,54,000 to Acme Tech Corp',
      reason: 'Header party ledger posting'
    },
    createdAt: '2026-03-01T10:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-vch-led-sales',
    fromNode: 'node-vch-inv-001',
    toNode: 'node-led-sales-dom',
    relationshipType: 'POSTED_TO',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Voucher Line Line 1',
    evidence: {
      sourceField: 'ALLLEDGERENTRIES.LEDGERNAME',
      sourceRecord: 'VCH-INV-2026-001',
      sourceReport: 'Daybook Line Items',
      extraction: 'Credit Rs 3,00,000 to Domestic Sales @18%',
      reason: 'Revenue line item ledger entry'
    },
    createdAt: '2026-03-01T10:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-vch-item-server',
    fromNode: 'node-vch-inv-001',
    toNode: 'node-item-server',
    relationshipType: 'USES',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Inventory Allocation',
    evidence: {
      sourceField: 'INVENTORYALLOCATIONS.STOCKITEMNAME',
      sourceRecord: 'VCH-INV-2026-001',
      sourceReport: 'Sales Invoice XML Payload',
      extraction: 'Stock item "Enterprise Cloud Server Rack 200X" qty 2 @ 1,50,000',
      reason: 'Direct item allocation in sales voucher'
    },
    createdAt: '2026-03-01T10:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-item-stkgrp',
    fromNode: 'node-item-server',
    toNode: 'node-stkgrp-cloud',
    relationshipType: 'BELONGS_TO',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Stock Item Schema',
    evidence: {
      sourceField: 'STOCKITEM.PARENT',
      sourceRecord: 'ITEM-SRV-200X',
      sourceReport: 'Stock Item Master List',
      extraction: 'PARENT="Enterprise Cloud Hardware"',
      reason: 'Stock Item belongs to Stock Group'
    },
    createdAt: '2026-01-01T00:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-vch-tax-cgst',
    fromNode: 'node-vch-inv-001',
    toNode: 'node-led-cgst',
    relationshipType: 'POSTED_TO',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Tax Entries',
    evidence: {
      sourceField: 'LEDGERENTRIES.CGST',
      sourceRecord: 'VCH-INV-2026-001',
      sourceReport: 'Daybook Tax Lines',
      extraction: 'Credit Rs 27,000 to CGST 9%',
      reason: 'Tax posting component'
    },
    createdAt: '2026-03-01T10:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-vch-tax-sgst',
    fromNode: 'node-vch-inv-001',
    toNode: 'node-led-sgst',
    relationshipType: 'POSTED_TO',
    origin: 'Direct',
    confidence: 'High',
    confidenceScore: 1.0,
    source: 'Tally Tax Entries',
    evidence: {
      sourceField: 'LEDGERENTRIES.SGST',
      sourceRecord: 'VCH-INV-2026-001',
      sourceReport: 'Daybook Tax Lines',
      extraction: 'Credit Rs 27,000 to SGST 9%',
      reason: 'Tax posting component'
    },
    createdAt: '2026-03-01T10:00:00Z',
    status: 'Approved'
  },
  {
    edgeId: 'edge-vch-costcentre',
    fromNode: 'node-vch-inv-001',
    toNode: 'node-cc-software',
    relationshipType: 'ASSIGNED_TO',
    origin: 'Inferred',
    confidence: 'Medium',
    confidenceScore: 0.85,
    source: 'Tally Cost Centre Allocations',
    evidence: {
      sourceField: 'CATEGORYALLOCATIONS.COSTCENTRENAME',
      sourceRecord: 'VCH-INV-2026-001',
      sourceReport: 'Cost Category Summary',
      extraction: 'Allocated 100% to Software Engineering & Cloud R&D',
      reason: 'Cost centre tag detected in voucher payload'
    },
    createdAt: '2026-03-01T10:00:00Z',
    status: 'Approved'
  }
];

// Graph Audit Storage
const graphAuditLog: GraphAuditItem[] = [
  {
    auditId: 'AUD-GR-001',
    action: 'GRAPH_QUERY',
    user: 'Controller Arjun',
    targetId: 'node-comp-1',
    details: 'Initial Full Object Graph generation and structural validation',
    timestamp: '2026-03-08T08:15:00Z'
  },
  {
    auditId: 'AUD-GR-002',
    action: 'RELATIONSHIP_APPROVAL',
    user: 'Compliance Officer Priya',
    targetId: 'edge-vch-costcentre',
    details: 'Approved inferred Cost Centre relationship for voucher INV-2026-001',
    timestamp: '2026-03-08T08:18:00Z'
  }
];

// Semantic Measures Registry
const semanticMeasures: SemanticMeasure[] = [
  {
    measureId: 'm-sales-amt',
    name: 'Sales Amount',
    formula: 'SUM(VoucherLine.Amount WHERE VoucherType="Sales")',
    grain: 'VoucherLine',
    aggregation: 'Additive',
    unit: 'Currency',
    currency: 'INR',
    description: 'Total revenue recognized from domestic and export sales vouchers',
    version: 1,
    isStandard: true
  },
  {
    measureId: 'm-closing-bal',
    name: 'Ledger Closing Balance',
    formula: 'Ledger.OpeningBalance + SUM(Debits) - SUM(Credits)',
    grain: 'Ledger',
    aggregation: 'Semi-Additive',
    unit: 'Currency',
    currency: 'INR',
    description: 'Point-in-time balance of ledger; non-additive across time periods',
    version: 1,
    isStandard: true
  },
  {
    measureId: 'm-gp-margin',
    name: 'Gross Profit Margin %',
    formula: '(Sales Amount - COGS) / Sales Amount * 100',
    grain: 'Company',
    aggregation: 'Non-Additive',
    unit: 'Percentage',
    currency: '%',
    description: 'Gross profit percentage; non-additive across entities or periods',
    version: 1,
    isStandard: true
  },
  {
    measureId: 'm-stock-val',
    name: 'Stock Valuation',
    formula: 'SUM(StockItem.ClosingQty * StockItem.ClosingRate)',
    grain: 'Item',
    aggregation: 'Semi-Additive',
    unit: 'Currency',
    currency: 'INR',
    description: 'Inventory valuation on average or FIFO cost basis',
    version: 1,
    isStandard: true
  }
];

// Semantic Dimensions Registry
const semanticDimensions: SemanticDimension[] = [
  { dimensionId: 'dim-company', name: 'Company', grain: 'Company', hierarchyPath: ['Enterprise Group', 'Company', 'Branch'], description: 'Legal accounting entity' },
  { dimensionId: 'dim-group', name: 'Group Hierarchy', grain: 'Group', hierarchyPath: ['Primary Group', 'Group', 'Subgroup', 'Ledger'], description: 'Chart of accounts hierarchical classification' },
  { dimensionId: 'dim-customer', name: 'Customer / Debtor', grain: 'Party', hierarchyPath: ['Territory', 'Customer Group', 'Customer Master'], description: 'Debtor entity with credit profile' },
  { dimensionId: 'dim-item', name: 'Stock Item', grain: 'Item', hierarchyPath: ['Category', 'Stock Group', 'Stock Item'], description: 'Inventory SKU master' },
  { dimensionId: 'dim-costcentre', name: 'Cost Centre', grain: 'CostCentre', hierarchyPath: ['Cost Category', 'Parent Cost Centre', 'Cost Centre'], description: 'Departmental expenditure tracker' }
];

// Integrity issues
const integrityIssues: GraphIntegrityIssue[] = [
  {
    issueId: 'INT-001',
    rule: 'ORPHAN_LEDGER_CHECK',
    severity: 'Warning',
    affectedNodeId: 'node-led-legacy-misc',
    affectedNodeName: 'Legacy Miscellaneous Adjustment',
    nodeType: 'Ledger',
    description: 'Ledger has no valid active parent group in current financial year chart of accounts.',
    remediationSuggestion: 'Assign to "Indirect Expenses" or "Suspense Account" in Tally master.',
    detectedAt: '2026-03-08T08:15:00Z'
  },
  {
    issueId: 'INT-002',
    rule: 'DUPLICATE_MASTER_DETECTION',
    severity: 'Info',
    affectedNodeId: 'node-led-customer-acme',
    affectedNodeName: 'Acme Tech Corp vs Acme Technologies Private Limited',
    nodeType: 'Party',
    description: 'Potential duplicate debtor party identified with identical PAN substring and phone number.',
    remediationSuggestion: 'Review debtor masters for potential vendor consolidation.',
    detectedAt: '2026-03-08T08:15:00Z'
  }
];

// =========================================================================
// API ROUTES
// =========================================================================

// 1. GET FULL ACCOUNTING OBJECT GRAPH
objectGraphRouter.get('/', (req, res) => {
  const graph: IAccountingGraph = {
    graphId: 'graph-acme-live',
    companyRootId: 'node-comp-1',
    version: 1,
    financialYear: '2025-2026',
    nodes: initialNodes,
    edges: initialEdges,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: graph,
    metadata: {
      totalNodes: initialNodes.length,
      totalEdges: initialEdges.length,
      directEdges: initialEdges.filter(e => e.origin === 'Direct').length,
      inferredEdges: initialEdges.filter(e => e.origin === 'Inferred').length,
      highConfidenceRatio: '92%'
    }
  });
});

// 2. GET MASTER INTELLIGENCE SUMMARY & CONCENTRATION
objectGraphRouter.get('/intelligence/summary', (req, res) => {
  const summary = {
    totalLedgers: initialNodes.filter(n => n.nodeType === 'Ledger').length,
    totalGroups: initialNodes.filter(n => n.nodeType === 'Group').length,
    totalVouchers: initialNodes.filter(n => n.nodeType === 'Voucher').length,
    totalStockItems: initialNodes.filter(n => n.nodeType === 'StockItem').length,
    totalParties: initialNodes.filter(n => n.nodeType === 'Party').length,
    totalRelationships: initialEdges.length,
    integrityIssuesCount: integrityIssues.length,
    activeLedgerRate: '96.4%',
    topLedgersByVolume: [
      { name: 'Acme Tech Corp', volume: 850000, vouchers: 14, contribution: '24.2%' },
      { name: 'Domestic Sales @18%', volume: 4500000, vouchers: 38, contribution: '35.0%' },
      { name: 'HDFC Bank Account', volume: 1845000, vouchers: 26, contribution: '18.5%' }
    ],
    topDebtorsConcentration: [
      { name: 'Acme Tech Corp', outstanding: 850000, overdueDays: 12, risk: 'Low' },
      { name: 'Zenith Logistics Ltd', outstanding: 420000, overdueDays: 45, risk: 'Medium' }
    ],
    masterChangeAlerts: [
      { type: 'Added', entity: 'Ledger', name: 'Cloud Server Maintenance AMC', date: '2026-03-05' },
      { type: 'Modified', entity: 'Group', name: 'Sundry Debtors (Credit limit revised)', date: '2026-03-02' }
    ]
  };

  res.json({ success: true, data: summary });
});

// 3. GET INTERACTIVE GROUP HIERARCHY TREE
objectGraphRouter.get('/hierarchy/groups', (req, res) => {
  const hierarchyTree: GroupHierarchyNode[] = [
    {
      groupId: 'node-grp-assets',
      name: 'Current Assets',
      level: 'Primary',
      depth: 1,
      ledgers: [],
      subgroups: [
        {
          groupId: 'node-grp-debtors',
          name: 'Sundry Debtors',
          parentGroupId: 'node-grp-assets',
          level: 'Subgroup',
          depth: 2,
          ledgers: [
            { ledgerId: 'node-led-customer-acme', name: 'Acme Tech Corp', openingBalance: 245000, closingBalance: 850000, status: 'Active' },
            { ledgerId: 'node-led-customer-zenith', name: 'Zenith Logistics Ltd', openingBalance: 120000, closingBalance: 420000, status: 'Active' }
          ],
          subgroups: []
        },
        {
          groupId: 'node-grp-bank',
          name: 'Bank Accounts',
          parentGroupId: 'node-grp-assets',
          level: 'Subgroup',
          depth: 2,
          ledgers: [
            { ledgerId: 'node-led-hdfc', name: 'HDFC Current A/c - 50200', openingBalance: 500000, closingBalance: 1845000, status: 'Active' }
          ],
          subgroups: []
        }
      ]
    },
    {
      groupId: 'node-grp-sales',
      name: 'Sales Accounts',
      level: 'Primary',
      depth: 1,
      ledgers: [
        { ledgerId: 'node-led-sales-dom', name: 'Domestic Sales @18%', openingBalance: 0, closingBalance: 4500000, status: 'Active' }
      ],
      subgroups: []
    },
    {
      groupId: 'node-grp-duties',
      name: 'Duties & Taxes',
      level: 'Primary',
      depth: 1,
      ledgers: [
        { ledgerId: 'node-led-cgst', name: 'CGST Input/Output 9%', openingBalance: 14000, closingBalance: 185000, status: 'Active' },
        { ledgerId: 'node-led-sgst', name: 'SGST Input/Output 9%', openingBalance: 14000, closingBalance: 185000, status: 'Active' }
      ],
      subgroups: []
    }
  ];

  res.json({
    success: true,
    data: hierarchyTree,
    metadata: {
      maxDepth: 2,
      orphanCount: 1,
      circularCount: 0
    }
  });
});

// 4. GET GRAPH INTEGRITY ISSUES
objectGraphRouter.get('/integrity/issues', (req, res) => {
  res.json({ success: true, data: integrityIssues });
});

// 5. GET SEMANTIC MEASURES & DIMENSIONS
objectGraphRouter.get('/measures', (req, res) => {
  res.json({ success: true, data: semanticMeasures });
});

objectGraphRouter.get('/dimensions', (req, res) => {
  res.json({ success: true, data: semanticDimensions });
});

// 6. SEMANTIC JOIN SUGGESTION ENGINE
objectGraphRouter.post('/semantic-join/suggest', (req, res) => {
  const { sourceObject, targetObject } = req.body;

  let suggestion: SemanticJoinPath = {
    sourceObject: sourceObject || 'Sales Voucher',
    intermediateObjects: ['Voucher Line', 'Customer Ledger'],
    targetObject: targetObject || 'Party Customer Master',
    joinSteps: [
      'SalesVoucher.VoucherId = VoucherLine.VoucherId (1:N)',
      'VoucherLine.LedgerId = Ledger.LedgerId (N:1)',
      'Ledger.LedgerId = Party.LedgerId (1:1)'
    ],
    confidence: 'High',
    confidenceScore: 0.98,
    grainValid: true,
    doubleCountingWarning: false,
    cardinality: '1:N',
    explanation:
      'Suggested join connects Sales Voucher to Customer Master via Voucher Line allocation and Chart of Accounts Ledger relationship with zero loss of accounting grain.'
  };

  if (sourceObject === 'Expense' && targetObject === 'Item') {
    suggestion = {
      sourceObject: 'Expense Ledger',
      intermediateObjects: ['Direct Voucher Allocation'],
      targetObject: 'Stock Item',
      joinSteps: ['Expense.LedgerId = VoucherLine.LedgerId', 'VoucherLine.ItemId = StockItem.ItemId'],
      confidence: 'Medium',
      confidenceScore: 0.78,
      grainValid: true,
      doubleCountingWarning: true,
      cardinality: 'N:M',
      explanation:
        'Warning: Many-to-many relationship detected. Ensure amounts are aggregated at the Voucher Line level before summing.'
    };
  }

  res.json({ success: true, data: suggestion });
});

// 7. DEEP DRILL-DOWN TRACE
objectGraphRouter.post('/drill-down', (req, res) => {
  const { nodeType, nodeId, filterValue } = req.body;

  const result: DeepDrillDownResult = {
    traceId: `TRACE-${Date.now()}`,
    path: [
      { level: 'Company', objectId: 'node-comp-1', displayName: 'Acme Enterprise Ltd (HO)', value: '₹ 45,00,000' },
      { level: 'Group', objectId: 'node-grp-assets', displayName: 'Current Assets → Sundry Debtors', value: '₹ 12,70,000' },
      { level: 'Ledger', objectId: nodeId || 'node-led-customer-acme', displayName: filterValue || 'Acme Tech Corp', value: '₹ 8,50,000' },
      { level: 'Voucher', objectId: 'node-vch-inv-001', displayName: 'Sales Invoice INV-2026-001', value: '₹ 3,54,000' },
      { level: 'VoucherLine', objectId: 'line-001', displayName: 'Cloud Server 200X (Qty: 2 NOS)', value: '₹ 3,00,000 + GST' }
    ],
    underlyingVouchers: [
      {
        voucherId: 'VCH-INV-2026-001',
        voucherNumber: 'INV-2026-001',
        voucherType: 'Sales',
        date: '2026-03-01',
        effectiveDate: '2026-03-01',
        invoiceNumber: 'INV/2025-26/089',
        narration: 'Being sale of Enterprise Server Rack hardware with 3-year warranty',
        companyId: 'CMP-001',
        source: 'Live Tally XML Gateway',
        snapshotId: 'snap-20260308-01',
        isBalanced: true,
        totalDebit: 354000,
        totalCredit: 354000,
        lines: [
          { voucherLineId: 'vl-01', voucherId: 'VCH-INV-2026-001', ledgerId: 'node-led-customer-acme', ledgerName: 'Acme Tech Corp', amount: 354000, isDebit: true },
          { voucherLineId: 'vl-02', voucherId: 'VCH-INV-2026-001', ledgerId: 'node-led-sales-dom', ledgerName: 'Domestic Sales @18%', itemId: 'node-item-server', itemName: 'Enterprise Cloud Server Rack 200X', quantity: 2, rate: 150000, amount: 300000, isDebit: false },
          { voucherLineId: 'vl-03', voucherId: 'VCH-INV-2026-001', ledgerId: 'node-led-cgst', ledgerName: 'CGST 9%', amount: 27000, isDebit: false },
          { voucherLineId: 'vl-04', voucherId: 'VCH-INV-2026-001', ledgerId: 'node-led-sgst', ledgerName: 'SGST 9%', amount: 27000, isDebit: false }
        ]
      }
    ],
    evidenceSource: {
      source: 'Live Tally Native XML Export',
      report: 'Sales Register / Daybook Detailed',
      record: 'GUID: 49b7-88cf-9912a-000451',
      field: 'ALLLEDGERENTRIES.LIST',
      extractedAt: new Date().toISOString()
    }
  };

  res.json({ success: true, data: result });
});

// 8. RELATIONSHIP APPROVAL & FEEDBACK
objectGraphRouter.post('/edges/:edgeId/approval', (req, res) => {
  const { edgeId } = req.params;
  const { status, feedback, user } = req.body;

  const edge = initialEdges.find(e => e.edgeId === edgeId);
  if (edge) {
    edge.status = status || 'Approved';
    edge.feedback = feedback || 'Correct';
    edge.approvedBy = user || 'Controller Arjun';
    edge.approvedAt = new Date().toISOString();

    graphAuditLog.unshift({
      auditId: `AUD-GR-${Date.now()}`,
      action: status === 'Approved' ? 'RELATIONSHIP_APPROVAL' : 'RELATIONSHIP_OVERRIDE',
      user: user || 'Controller Arjun',
      targetId: edgeId,
      details: `Relationship edge ${edgeId} (${edge.relationshipType}) updated to ${edge.status} (Feedback: ${edge.feedback})`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, data: edge });
  } else {
    res.status(404).json({ success: false, error: 'Edge not found' });
  }
});

// 9. AI GRAPH GROUNDING (Q&A WITH EVIDENCE PATHS)
objectGraphRouter.post('/ai-grounding', (req, res) => {
  const { question } = req.body;
  const qLower = (question || '').toLowerCase();

  let response: AIGraphGroundingResponse;

  if (qLower.includes('customer') && (qLower.includes('cloud') || qLower.includes('server'))) {
    response = {
      question,
      canEstablishRelationship: true,
      answer:
        'Acme Tech Corp purchased 2 units of Enterprise Cloud Server Rack 200X on 2026-03-01 via Sales Invoice INV-2026-001 for ₹ 3,54,000 (including ₹ 54,000 GST).',
      relationshipPath: [
        'Party "Acme Tech Corp" [PartyMaster]',
        '→ POSTED_TO → Ledger "Acme Tech Corp" [Sundry Debtors]',
        '→ REFERENCES → Voucher "INV-2026-001" [Sales Daybook]',
        '→ USES → StockItem "Enterprise Cloud Server Rack 200X" [InventoryMaster]'
      ],
      evidenceNodes: [
        initialNodes.find(n => n.nodeId === 'node-pty-acme')!,
        initialNodes.find(n => n.nodeId === 'node-vch-inv-001')!,
        initialNodes.find(n => n.nodeId === 'node-item-server')!
      ],
      evidenceEdges: initialEdges.filter(e => e.edgeId === 'edge-pty-led-acme' || e.edgeId === 'edge-vch-item-server'),
      confidence: 'High'
    };
  } else if (qLower.includes('expense') || qLower.includes('cost centre') || qLower.includes('r&d')) {
    response = {
      question,
      canEstablishRelationship: true,
      answer:
        'Software Engineering & Cloud R&D Cost Centre was allocated to sales transaction INV-2026-001 (100% allocation). Total R&D cost centre turnover reflects ₹ 3,00,000.',
      relationshipPath: [
        'Voucher "INV-2026-001" [Sales]',
        '→ ASSIGNED_TO → CostCentre "Software Engineering & Cloud R&D"'
      ],
      evidenceNodes: [
        initialNodes.find(n => n.nodeId === 'node-vch-inv-001')!,
        initialNodes.find(n => n.nodeId === 'node-cc-software')!
      ],
      evidenceEdges: initialEdges.filter(e => e.edgeId === 'edge-vch-costcentre'),
      confidence: 'Medium'
    };
  } else if (qLower.includes('balance') || qLower.includes('debtor') || qLower.includes('acme')) {
    response = {
      question,
      canEstablishRelationship: true,
      answer:
        'Acme Tech Corp has an opening balance of ₹ 2,45,000, debited ₹ 6,05,000 during the period, resulting in a closing balance of ₹ 8,50,000. Balance is reconciled across 14 daybook vouchers.',
      relationshipPath: [
        'Group "Sundry Debtors" → CONTAINS → Ledger "Acme Tech Corp"',
        '→ POSTED_TO → 14 Sales & Receipt Vouchers'
      ],
      evidenceNodes: [
        initialNodes.find(n => n.nodeId === 'node-grp-debtors')!,
        initialNodes.find(n => n.nodeId === 'node-led-customer-acme')!
      ],
      evidenceEdges: initialEdges.filter(e => e.edgeId === 'edge-debtors-acme'),
      confidence: 'High'
    };
  } else {
    response = {
      question,
      canEstablishRelationship: false,
      answer: 'I cannot establish this relationship from the available accounting graph evidence in Tally.',
      relationshipPath: [],
      evidenceNodes: [],
      evidenceEdges: [],
      confidence: 'Low',
      warnings: ['No connecting semantic edges found between queried entities in the active snapshot.']
    };
  }

  res.json({ success: true, data: response });
});

// 10. GRAPH SNAPSHOT COMPARISON
objectGraphRouter.get('/snapshots/compare', (req, res) => {
  const diff: GraphSnapshotDiff = {
    snapshotA: 'snap-20260228-00',
    snapshotB: 'snap-20260308-01',
    addedNodes: [
      {
        nodeId: 'node-led-new-amc',
        nodeType: 'Ledger',
        sourceId: 'LED-AMC-001',
        companyId: 'CMP-001',
        name: 'Cloud Maintenance AMC',
        displayName: 'Cloud Maintenance AMC',
        status: 'Active',
        source: 'Tally Ledger Master',
        snapshotId: 'snap-20260308-01',
        firstSeen: '2026-03-05T00:00:00Z',
        lastSeen: '2026-03-08T08:15:00Z'
      }
    ],
    removedNodes: [],
    changedNodes: [
      {
        nodeId: 'node-led-customer-acme',
        name: 'Acme Tech Corp',
        before: { closingBal: 500000, voucherCount: 8 },
        after: { closingBal: 850000, voucherCount: 14 }
      }
    ],
    addedEdges: [
      {
        edgeId: 'edge-new-amc',
        fromNode: 'node-grp-sales',
        toNode: 'node-led-new-amc',
        relationshipType: 'CONTAINS',
        origin: 'Direct',
        confidence: 'High',
        confidenceScore: 1.0,
        source: 'Tally Master',
        evidence: {
          sourceField: 'PARENT',
          sourceRecord: 'Cloud Maintenance AMC',
          sourceReport: 'Group Summary',
          extraction: 'PARENT="Sales Accounts"',
          reason: 'Newly discovered ledger added to Sales Accounts group'
        },
        createdAt: '2026-03-05T00:00:00Z'
      }
    ],
    removedEdges: [],
    summary: {
      nodeDelta: 1,
      edgeDelta: 1,
      integrityDelta: 0
    }
  };

  res.json({ success: true, data: diff });
});

// 11. AUDIT TRAIL
objectGraphRouter.get('/audit', (req, res) => {
  res.json({ success: true, data: graphAuditLog });
});
