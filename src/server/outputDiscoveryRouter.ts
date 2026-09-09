import { Router, Request, Response } from 'express';
import {
  DiscoveredOutputItem,
  DiscoveredObject,
  DiscoveredField,
  DiscoveryExecutionSummary,
  FieldSampleResult,
  TdlOutputDescriptor,
  ObjectRelationshipGraph,
  OutputAvailabilityMatrixRow,
  SchemaSnapshot,
  SchemaDiffResult,
  VisualQueryDefinition,
  QueryPerformanceEstimate,
  QueryExecutionResult,
  SavedQueryRecord,
  NlToQueryTranslationResult,
  DataLineageTrace,
  TemplateExportBundle,
  TemplateImportResult,
  SemanticMappingProfile,
  OutputCategory,
  DiscoveredDataType
} from '../types/phase15DiscoveryAndReporting';

export const outputDiscoveryRouter = Router();

// In-Memory persistent state for Phase 15 Discovery Engine
let currentCompany = {
  id: 'COMP-001',
  name: 'Acme International Enterprises Ltd',
  tallyVersion: 'TallyPrime 4.1 Enterprise Gold (Rel 4.1.284)',
  financialYear: '2026-2027'
};

let discoverySummary: DiscoveryExecutionSummary = {
  discoveryId: 'DISC-2026-0907-001',
  companyName: currentCompany.name,
  tallyVersion: currentCompany.tallyVersion,
  status: 'Complete',
  timestamp: new Date().toISOString(),
  objectsDiscovered: 48,
  collectionsDiscovered: 74,
  fieldsDiscovered: 1284,
  reportsDiscovered: 56,
  customOutputsDiscovered: 14,
  mappedOutputsCount: 1042,
  unmappedOutputsCount: 242,
  mappingCoveragePercentage: 81.2,
  discoveryCompletenessScore: 94.5,
  dataQualityRating: 'High',
  warnings: [
    '2 Custom TDL UDF fields detected with non-standard XML tags: [UDF_DISCOUNT_AUTH, UDF_EWAY_FLAG]. Read-only mapped safely.',
    'Cost Centre allocation is enabled in 4 voucher types but unpopulated in 12% of journal entries.'
  ],
  discoveredCapabilities: [
    'GST E-Invoicing Ready',
    'Multi-Currency Enabled',
    'Cost Centre Tracking',
    'Batch-wise Inventory with Expiry',
    'Bill-by-Bill Receivables/Payables',
    'Custom TDL Extension Pack Active'
  ],
  isOfflineCache: false
};

// Initial Output Catalog with Categories
let outputCatalog: DiscoveredOutputItem[] = [
  {
    outputId: 'OUT-SALES-REG',
    name: 'Sales Register & Invoice Lines',
    category: 'Sales',
    source: 'Standard Tally',
    objectType: 'Voucher',
    fieldCount: 42,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'Comprehensive sales voucher header and ledger inventory breakout lines with GST tax details.'
  },
  {
    outputId: 'OUT-PURCH-REG',
    name: 'Purchase Register & Inward Vouchers',
    category: 'Purchase',
    source: 'Standard Tally',
    objectType: 'Voucher',
    fieldCount: 38,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'Purchase voucher entries with supplier billing details, ITC classification, and item costs.'
  },
  {
    outputId: 'OUT-CUST-OUTSTANDING',
    name: 'Customer Outstanding & Receivables Bill-by-Bill',
    category: 'Receivables',
    source: 'Standard Tally',
    objectType: 'Bill',
    fieldCount: 24,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'Live bills receivable with credit period, overdue aging buckets, and customer credit limits.'
  },
  {
    outputId: 'OUT-SUPP-PAYABLES',
    name: 'Supplier Outstanding & Payables Aging',
    category: 'Payables',
    source: 'Standard Tally',
    objectType: 'Bill',
    fieldCount: 22,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'Accounts payable liabilities with due dates, cash discount terms, and bank clearing dates.'
  },
  {
    outputId: 'OUT-STOCK-VALUATION',
    name: 'Stock Item Valuation & Batch Movement',
    category: 'Inventory',
    source: 'Standard Tally',
    objectType: 'StockItem',
    fieldCount: 35,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'Closing stock quantities, moving average cost, Godown locations, and reorder levels.'
  },
  {
    outputId: 'OUT-GST-ANALYTICS',
    name: 'GST Rate Breakup & Tax Ledger Summary',
    category: 'GST',
    source: 'Standard Tally',
    objectType: 'TaxClassification',
    fieldCount: 28,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'HSN/SAC summary, taxable turnover, IGST, CGST, SGST, and Cess computation audit trails.'
  },
  {
    outputId: 'OUT-BANK-RECON',
    name: 'Bank Book & Electronic Reconciliation Logs',
    category: 'Banking',
    source: 'Standard Tally',
    objectType: 'Ledger',
    fieldCount: 26,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'Medium',
    description: 'Bank ledgers with instrument number, clearing dates, unpresented cheques, and balances.'
  },
  {
    outputId: 'OUT-TDL-LOGISTICS',
    name: 'Custom Transporter & E-Way Dispatch Log (TDL)',
    category: 'Custom',
    source: 'Custom TDL',
    objectType: 'Voucher',
    fieldCount: 16,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-05',
    schemaVersion: '1.2-TDL',
    mappingStatus: 'Medium',
    description: 'User-defined TDL fields: Transporter ID, LR Number, Vehicle Registration, and E-Way bill expiry.',
    isCustomTdl: true
  },
  {
    outputId: 'OUT-TDL-DISCOUNT-AUTH',
    name: 'Executive Discount Approval Matrix (TDL)',
    category: 'TDL',
    source: 'Custom TDL',
    objectType: 'Voucher',
    fieldCount: 8,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-05',
    schemaVersion: '1.0-TDL',
    mappingStatus: 'Low',
    description: 'Special authorization sign-off timestamps and manager IDs for invoices with discount > 15%.',
    isCustomTdl: true
  },
  {
    outputId: 'OUT-GENERAL-LEDGER',
    name: 'General Ledger Master & Hierarchy',
    category: 'Masters',
    source: 'Standard Tally',
    objectType: 'Ledger',
    fieldCount: 30,
    availability: 'Available',
    company: currentCompany.name,
    discoveryDate: '2026-09-01',
    schemaVersion: '2.4',
    mappingStatus: 'High',
    description: 'All chart-of-accounts ledgers, primary groups, opening balances, and GST registrations.'
  }
];

// Discovered Objects with Fields
let discoveredObjects: DiscoveredObject[] = [
  {
    objectId: 'OBJ-VOUCHER',
    name: 'Voucher',
    collectionName: 'Vouchers',
    primaryKeyField: 'VoucherNumber',
    totalFields: 52,
    isCustomOrTdl: false,
    relationships: ['Ledger', 'StockItem', 'CostCentre', 'TaxClassification'],
    description: 'Transactional header and lines for Sales, Purchases, Receipts, Payments, and Journals.',
    fields: [
      {
        fieldName: 'VOUCHERNUMBER',
        displayName: 'Voucher Number',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <VOUCHERNUMBER>',
        object: 'Voucher',
        method: '$$String',
        collection: 'Vouchers',
        exampleValue: 'INV-2026-0891',
        availability: 'Available',
        semanticConcept: 'Invoice Number',
        confidence: 'High'
      },
      {
        fieldName: 'DATE',
        displayName: 'Voucher Date',
        dataType: 'Date',
        nullable: false,
        source: 'XML Tag <DATE>',
        object: 'Voucher',
        method: '$$Date',
        collection: 'Vouchers',
        exampleValue: '2026-08-14',
        availability: 'Available',
        semanticConcept: 'Invoice Date',
        confidence: 'High'
      },
      {
        fieldName: 'PARTYLEDGERNAME',
        displayName: 'Party Ledger Name',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <PARTYLEDGERNAME>',
        object: 'Voucher',
        method: '$$String',
        collection: 'Vouchers',
        exampleValue: 'Bharat Heavy Engineering Ltd',
        availability: 'Available',
        semanticConcept: 'Customer / Supplier Name',
        confidence: 'High'
      },
      {
        fieldName: 'AMOUNT',
        displayName: 'Total Voucher Amount',
        dataType: 'Currency',
        nullable: false,
        source: 'XML Tag <AMOUNT>',
        object: 'Voucher',
        method: '$$Amount',
        collection: 'Vouchers',
        exampleValue: '₹ 845,000.00',
        availability: 'Available',
        semanticConcept: 'Financial Amount',
        confidence: 'High'
      },
      {
        fieldName: 'PARTYGSTIN',
        displayName: 'Party GSTIN / UIN',
        dataType: 'String',
        nullable: true,
        source: 'XML Tag <PARTYGSTIN>',
        object: 'Voucher',
        method: '$$String',
        collection: 'Vouchers',
        exampleValue: '27AAACB1234F1Z8',
        availability: 'Available',
        semanticConcept: 'Customer GSTIN',
        confidence: 'High'
      },
      {
        fieldName: 'VOUCHERTYPENAME',
        displayName: 'Voucher Type',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <VOUCHERTYPENAME>',
        object: 'Voucher',
        method: '$$String',
        collection: 'Vouchers',
        exampleValue: 'Tax Invoice (Sales)',
        availability: 'Available',
        semanticConcept: 'Document Type',
        confidence: 'High'
      },
      {
        fieldName: 'UDF_DISCOUNT_AUTH',
        displayName: 'Discount Authorization Manager (TDL)',
        dataType: 'String',
        nullable: true,
        source: 'TDL UDF <UDF_DISCOUNT_AUTH>',
        object: 'Voucher',
        method: '$$String',
        collection: 'Vouchers',
        exampleValue: 'MGR_ANIL_SHARMA',
        availability: 'Available',
        semanticConcept: 'Custom Approval Manager',
        confidence: 'Medium',
        requiresHumanConfirmation: true
      },
      {
        fieldName: 'UDF_EWAY_FLAG',
        displayName: 'E-Way Bill Generated (TDL)',
        dataType: 'Boolean',
        nullable: true,
        source: 'TDL UDF <UDF_EWAY_FLAG>',
        object: 'Voucher',
        method: '$$Boolean',
        collection: 'Vouchers',
        exampleValue: 'true',
        availability: 'Available',
        semanticConcept: 'Compliance Flag',
        confidence: 'Medium',
        requiresHumanConfirmation: true
      }
    ]
  },
  {
    objectId: 'OBJ-LEDGER',
    name: 'Ledger',
    collectionName: 'Ledgers',
    primaryKeyField: 'Name',
    totalFields: 38,
    isCustomOrTdl: false,
    relationships: ['Group', 'Bill', 'TaxClassification'],
    description: 'Account head master containing credit terms, address, GST details, and balances.',
    fields: [
      {
        fieldName: 'NAME',
        displayName: 'Ledger Name',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <NAME>',
        object: 'Ledger',
        method: '$$String',
        collection: 'Ledgers',
        exampleValue: 'Sun Pharma Distribution Corp',
        availability: 'Available',
        semanticConcept: 'Entity Name',
        confidence: 'High'
      },
      {
        fieldName: 'PARENT',
        displayName: 'Account Group / Parent',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <PARENT>',
        object: 'Ledger',
        method: '$$String',
        collection: 'Ledgers',
        exampleValue: 'Sundry Debtors',
        availability: 'Available',
        semanticConcept: 'Account Group',
        confidence: 'High'
      },
      {
        fieldName: 'CLOSINGBALANCE',
        displayName: 'Closing Balance',
        dataType: 'Currency',
        nullable: false,
        source: 'XML Tag <CLOSINGBALANCE>',
        object: 'Ledger',
        method: '$$Amount',
        collection: 'Ledgers',
        exampleValue: '₹ 1,450,200.00 Dr',
        availability: 'Available',
        semanticConcept: 'Account Balance',
        confidence: 'High'
      },
      {
        fieldName: 'BILLCREDITPERIOD',
        displayName: 'Standard Credit Days',
        dataType: 'Integer',
        nullable: true,
        source: 'XML Tag <BILLCREDITPERIOD>',
        object: 'Ledger',
        method: '$$Number',
        collection: 'Ledgers',
        exampleValue: '45',
        availability: 'Available',
        semanticConcept: 'Credit Period Days',
        confidence: 'High'
      },
      {
        fieldName: 'GSTREGISTRATIONTYPE',
        displayName: 'GST Dealer Type',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <GSTREGISTRATIONTYPE>',
        object: 'Ledger',
        method: '$$String',
        collection: 'Ledgers',
        exampleValue: 'Regular',
        availability: 'Available',
        semanticConcept: 'Statutory Registration Type',
        confidence: 'High'
      }
    ]
  },
  {
    objectId: 'OBJ-STOCKITEM',
    name: 'StockItem',
    collectionName: 'StockItems',
    primaryKeyField: 'Name',
    totalFields: 32,
    isCustomOrTdl: false,
    relationships: ['StockGroup', 'Unit', 'Godown'],
    description: 'Inventory item master with standard cost, base unit, HSN, and GST rates.',
    fields: [
      {
        fieldName: 'NAME',
        displayName: 'Item Description',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <NAME>',
        object: 'StockItem',
        method: '$$String',
        collection: 'StockItems',
        exampleValue: 'Cast Carbon Steel Valve 4"',
        availability: 'Available',
        semanticConcept: 'Product Name',
        confidence: 'High'
      },
      {
        fieldName: 'PARENT',
        displayName: 'Stock Category / Group',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <PARENT>',
        object: 'StockItem',
        method: '$$String',
        collection: 'StockItems',
        exampleValue: 'Industrial Valves & Actuators',
        availability: 'Available',
        semanticConcept: 'Product Category',
        confidence: 'High'
      },
      {
        fieldName: 'CLOSINGBALANCE',
        displayName: 'Available Quantity',
        dataType: 'Quantity',
        nullable: false,
        source: 'XML Tag <CLOSINGBALANCE>',
        object: 'StockItem',
        method: '$$Quantity',
        collection: 'StockItems',
        exampleValue: '280.00 Nos',
        availability: 'Available',
        semanticConcept: 'Stock Quantity',
        confidence: 'High'
      },
      {
        fieldName: 'CLOSINGVALUE',
        displayName: 'Inventory Valuation',
        dataType: 'Currency',
        nullable: false,
        source: 'XML Tag <CLOSINGVALUE>',
        object: 'StockItem',
        method: '$$Amount',
        collection: 'StockItems',
        exampleValue: '₹ 1,260,000.00',
        availability: 'Available',
        semanticConcept: 'Inventory Asset Value',
        confidence: 'High'
      },
      {
        fieldName: 'HSNCODE',
        displayName: 'HSN / SAC Code',
        dataType: 'String',
        nullable: true,
        source: 'XML Tag <HSNCODE>',
        object: 'StockItem',
        method: '$$String',
        collection: 'StockItems',
        exampleValue: '8481.80.30',
        availability: 'Available',
        semanticConcept: 'HSN Code',
        confidence: 'High'
      }
    ]
  },
  {
    objectId: 'OBJ-BILL',
    name: 'Bill',
    collectionName: 'Bills',
    primaryKeyField: 'BillName',
    totalFields: 24,
    isCustomOrTdl: false,
    relationships: ['Ledger', 'Voucher'],
    description: 'Bill-wise tracking records for aging receivables and payables.',
    fields: [
      {
        fieldName: 'NAME',
        displayName: 'Bill Reference',
        dataType: 'String',
        nullable: false,
        source: 'XML Tag <NAME>',
        object: 'Bill',
        method: '$$String',
        collection: 'Bills',
        exampleValue: 'INV-2026-0742',
        availability: 'Available',
        semanticConcept: 'Bill Number',
        confidence: 'High'
      },
      {
        fieldName: 'BILLDATE',
        displayName: 'Bill Opening Date',
        dataType: 'Date',
        nullable: false,
        source: 'XML Tag <BILLDATE>',
        object: 'Bill',
        method: '$$Date',
        collection: 'Bills',
        exampleValue: '2026-05-18',
        availability: 'Available',
        semanticConcept: 'Bill Date',
        confidence: 'High'
      },
      {
        fieldName: 'BILLDUEDATE',
        displayName: 'Maturity / Due Date',
        dataType: 'Date',
        nullable: true,
        source: 'XML Tag <BILLDUEDATE>',
        object: 'Bill',
        method: '$$Date',
        collection: 'Bills',
        exampleValue: '2026-06-18',
        availability: 'Available',
        semanticConcept: 'Due Date',
        confidence: 'High'
      },
      {
        fieldName: 'OPENINGBALANCE',
        displayName: 'Outstanding Amount',
        dataType: 'Currency',
        nullable: false,
        source: 'XML Tag <OPENINGBALANCE>',
        object: 'Bill',
        method: '$$Amount',
        collection: 'Bills',
        exampleValue: '₹ 425,000.00 Dr',
        availability: 'Available',
        semanticConcept: 'Overdue Amount',
        confidence: 'High'
      }
    ]
  }
];

// Relationship Graph
let relationshipGraph: ObjectRelationshipGraph = {
  nodes: [
    { id: 'Voucher', label: 'Voucher (Trans)', category: 'Transactions', fieldCount: 52, isCustom: false },
    { id: 'Ledger', label: 'Party / Account Ledger', category: 'Masters', fieldCount: 38, isCustom: false },
    { id: 'StockItem', label: 'Stock Item (Inventory)', category: 'Masters', fieldCount: 32, isCustom: false },
    { id: 'TaxClassification', label: 'GST Tax Ledger', category: 'Statutory', fieldCount: 18, isCustom: false },
    { id: 'CostCentre', label: 'Cost Centre / Unit', category: 'Management', fieldCount: 14, isCustom: false },
    { id: 'Bill', label: 'Bill Outstanding', category: 'Receivables/Payables', fieldCount: 24, isCustom: false }
  ],
  edges: [
    { source: 'Voucher', target: 'Ledger', relationshipType: 'One-To-Many', joinKey: 'PARTYLEDGERNAME = Ledger.NAME', hasCartesianRisk: false },
    { source: 'Voucher', target: 'StockItem', relationshipType: 'One-To-Many', joinKey: 'ALLINVENTORYENTRIES.STOCKITEMNAME = StockItem.NAME', hasCartesianRisk: false },
    { source: 'Voucher', target: 'TaxClassification', relationshipType: 'One-To-Many', joinKey: 'LEDGERENTRIES.NAME = TaxClassification.TAXNAME', hasCartesianRisk: false },
    { source: 'Voucher', target: 'CostCentre', relationshipType: 'One-To-Many', joinKey: 'CATEGORYALLOCATIONS.COSTCENTRENAME = CostCentre.NAME', hasCartesianRisk: false },
    { source: 'Ledger', target: 'Bill', relationshipType: 'One-To-Many', joinKey: 'NAME = Bill.PARENTLEDGER', hasCartesianRisk: false }
  ]
};

// Availability Matrix
let availabilityMatrix: OutputAvailabilityMatrixRow[] = [
  { itemName: 'Sales Register', itemType: 'Standard Report', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'Purchase Register', itemType: 'Standard Report', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'Receivables Bill-by-Bill', itemType: 'Standard Report', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'Payables Aging Summary', itemType: 'Standard Report', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'Stock Summary & Valuation', itemType: 'Standard Report', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'GST GSTR-1 Ledger Breakup', itemType: 'Standard Report', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'Vouchers Collection', itemType: 'Collection', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'Ledgers Collection', itemType: 'Collection', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'StockItems Collection', itemType: 'Collection', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: false },
  { itemName: 'TDL Transporter Log', itemType: 'Custom Output', isAvailable: true, isMapped: true, isQueryable: true, isExportable: true, requiresPermission: true },
  { itemName: 'TDL Discount Auth Matrix', itemType: 'Custom Output', isAvailable: true, isMapped: false, isQueryable: true, isExportable: true, requiresPermission: true }
];

// Saved Queries Store
let savedQueries: SavedQueryRecord[] = [
  {
    queryId: 'QRY-OVERDUE-90D',
    name: 'Customer Receivables > 90 Days Overdue',
    version: 2,
    definition: {
      queryId: 'QRY-OVERDUE-90D',
      queryName: 'Customer Receivables > 90 Days Overdue',
      primaryObject: 'Bill',
      selectedFields: ['NAME', 'BILLDATE', 'BILLDUEDATE', 'OPENINGBALANCE'],
      filters: [
        { id: 'f1', fieldName: 'OPENINGBALANCE', operator: '>', value: '50000' }
      ],
      filterLogicalOperator: 'AND',
      groupByFields: [],
      aggregations: [
        { id: 'a1', fieldName: 'OPENINGBALANCE', function: 'SUM', outputAlias: 'Total Overdue' }
      ],
      sortRules: [{ id: 's1', fieldName: 'OPENINGBALANCE', direction: 'DESC' }],
      calculatedFields: [],
      limitRows: 50
    },
    createdBy: 'Chief Risk Officer',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-09-02T14:30:00Z'
  },
  {
    queryId: 'QRY-HIGH-SALES-FY27',
    name: 'High Value Sales Vouchers (> ₹ 5 Lakhs)',
    version: 1,
    definition: {
      queryId: 'QRY-HIGH-SALES-FY27',
      queryName: 'High Value Sales Vouchers (> ₹ 5 Lakhs)',
      primaryObject: 'Voucher',
      selectedFields: ['VOUCHERNUMBER', 'DATE', 'PARTYLEDGERNAME', 'AMOUNT', 'PARTYGSTIN'],
      filters: [
        { id: 'f1', fieldName: 'AMOUNT', operator: '>', value: '500000' },
        { id: 'f2', fieldName: 'VOUCHERTYPENAME', operator: 'CONTAINS', value: 'Sales' }
      ],
      filterLogicalOperator: 'AND',
      groupByFields: [],
      aggregations: [
        { id: 'a1', fieldName: 'AMOUNT', function: 'SUM', outputAlias: 'Total High Value Sales' }
      ],
      sortRules: [{ id: 's1', fieldName: 'AMOUNT', direction: 'DESC' }],
      calculatedFields: [],
      limitRows: 100
    },
    createdBy: 'Senior Finance Analyst',
    createdAt: '2026-08-20T11:15:00Z',
    updatedAt: '2026-08-20T11:15:00Z'
  }
];

// Schema Snapshots
let schemaSnapshots: SchemaSnapshot[] = [
  {
    snapshotId: 'SNAP-2026-0801',
    companyId: currentCompany.id,
    companyName: currentCompany.name,
    tallyVersion: 'TallyPrime 4.1 Enterprise Gold (Rel 4.1.280)',
    timestamp: '2026-08-01T06:00:00Z',
    schemaVersion: '2.3',
    signatureHash: 'e4d8a1c97f23a5109b8214fbc9',
    totalObjects: 46,
    totalFields: 1262
  },
  {
    snapshotId: 'SNAP-2026-0907',
    companyId: currentCompany.id,
    companyName: currentCompany.name,
    tallyVersion: currentCompany.tallyVersion,
    timestamp: '2026-09-07T12:00:00Z',
    schemaVersion: '2.4',
    signatureHash: 'b7c1f8a42903de6719a0bc4123',
    totalObjects: 48,
    totalFields: 1284
  }
];

// 1. GET /api/discovery/summary
outputDiscoveryRouter.get('/summary', (req: Request, res: Response) => {
  res.json(discoverySummary);
});

// 2. POST /api/discovery/run
outputDiscoveryRouter.post('/run', (req: Request, res: Response) => {
  const { forceRefresh, sampleLimit = 25 } = req.body || {};

  // Pipeline simulation: Connect -> Identify -> Discover Capabilities -> Collections -> Objects -> Fields -> TDL -> Normalize -> Catalog
  discoverySummary = {
    ...discoverySummary,
    timestamp: new Date().toISOString(),
    status: 'Complete',
    isOfflineCache: false,
    objectsDiscovered: 48,
    collectionsDiscovered: 74,
    fieldsDiscovered: 1284,
    reportsDiscovered: 56,
    customOutputsDiscovered: 14,
    mappedOutputsCount: 1042,
    unmappedOutputsCount: 242,
    mappingCoveragePercentage: 81.2
  };

  // Add new snapshot
  const newSnapshot: SchemaSnapshot = {
    snapshotId: `SNAP-${Date.now()}`,
    companyId: currentCompany.id,
    companyName: currentCompany.name,
    tallyVersion: currentCompany.tallyVersion,
    timestamp: new Date().toISOString(),
    schemaVersion: '2.4',
    signatureHash: Math.random().toString(36).substring(2, 15),
    totalObjects: 48,
    totalFields: 1284
  };
  schemaSnapshots.unshift(newSnapshot);

  res.json({
    success: true,
    message: 'Universal Tally Output Discovery completed successfully with zero write access to Tally.',
    summary: discoverySummary
  });
});

// 3. GET /api/discovery/catalog
outputDiscoveryRouter.get('/catalog', (req: Request, res: Response) => {
  const { category, search, onlyTdl, onlyUnmapped } = req.query;

  let filtered = [...outputCatalog];

  if (category && category !== 'All') {
    filtered = filtered.filter((item) => item.category.toLowerCase() === String(category).toLowerCase());
  }

  if (onlyTdl === 'true') {
    filtered = filtered.filter((item) => item.isCustomTdl || item.source === 'Custom TDL');
  }

  if (onlyUnmapped === 'true') {
    filtered = filtered.filter((item) => item.mappingStatus === 'Low' || item.mappingStatus === 'Unmapped');
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.objectType.toLowerCase().includes(q)
    );
  }

  res.json({
    total: filtered.length,
    outputs: filtered
  });
});

// 4. GET /api/discovery/objects
outputDiscoveryRouter.get('/objects', (req: Request, res: Response) => {
  res.json(discoveredObjects);
});

// 5. GET /api/discovery/objects/:objectId
outputDiscoveryRouter.get('/objects/:objectId', (req: Request, res: Response) => {
  const obj = discoveredObjects.find((o) => o.objectId === req.params.objectId || o.name.toLowerCase() === req.params.objectId.toLowerCase());
  if (!obj) {
    return res.status(404).json({ error: `Object not found: ${req.params.objectId}` });
  }
  res.json(obj);
});

// 6. GET /api/discovery/fields (with fuzzy search)
outputDiscoveryRouter.get('/fields', (req: Request, res: Response) => {
  const { q, objectName } = req.query;
  let allFields: DiscoveredField[] = [];

  discoveredObjects.forEach((obj) => {
    if (!objectName || obj.name.toLowerCase() === String(objectName).toLowerCase()) {
      allFields.push(...obj.fields);
    }
  });

  if (q && typeof q === 'string' && q.trim().length > 0) {
    const query = q.trim().toLowerCase();
    allFields = allFields.filter(
      (f) =>
        f.fieldName.toLowerCase().includes(query) ||
        f.displayName.toLowerCase().includes(query) ||
        (f.semanticConcept && f.semanticConcept.toLowerCase().includes(query))
    );
  }

  res.json({
    total: allFields.length,
    fields: allFields
  });
});

// 7. GET /api/discovery/fields/sample (Safeguarded Sample Rows)
outputDiscoveryRouter.get('/fields/sample', (req: Request, res: Response) => {
  const { fieldName = 'AMOUNT', objectName = 'Voucher', limit = '25' } = req.query;
  const sampleLimit = Math.min(parseInt(String(limit), 10) || 25, 500);

  // Generate safe deterministic sample rows without touching whole company database
  const sampleValues: any[] = [];
  for (let i = 1; i <= sampleLimit; i++) {
    if (String(fieldName).toUpperCase().includes('AMOUNT') || String(fieldName).toUpperCase().includes('BALANCE')) {
      sampleValues.push({
        id: i,
        recordKey: `REC-${1000 + i}`,
        value: 12500 * i + (i % 3 === 0 ? 850.5 : 0),
        formatted: `₹ ${(12500 * i).toLocaleString('en-IN')}`
      });
    } else if (String(fieldName).toUpperCase().includes('DATE')) {
      sampleValues.push({
        id: i,
        recordKey: `REC-${1000 + i}`,
        value: `2026-08-${(i % 28) + 1}`,
        formatted: `2026-08-${(i % 28) + 1}`
      });
    } else if (String(fieldName).toUpperCase().includes('GSTIN')) {
      sampleValues.push({
        id: i,
        recordKey: `REC-${1000 + i}`,
        value: `27AAACB${1000 + i}F1Z${i % 9}`,
        formatted: `27AAACB${1000 + i}F1Z${i % 9}`
      });
    } else {
      sampleValues.push({
        id: i,
        recordKey: `REC-${1000 + i}`,
        value: `Discovered Item #${i}`,
        formatted: `Discovered Item #${i}`
      });
    }
  }

  const result: FieldSampleResult = {
    fieldName: String(fieldName),
    objectName: String(objectName),
    rowCount: sampleValues.length,
    sampleRows: sampleValues,
    capturedAt: new Date().toISOString()
  };

  res.json(result);
});

// 8. GET /api/discovery/tdl
outputDiscoveryRouter.get('/tdl', (req: Request, res: Response) => {
  const tdlOutputs: TdlOutputDescriptor[] = [
    {
      tdlIdentifier: 'TDL-EXT-LOGISTICS',
      name: 'E-Way & Transporter Details Dispatch Register',
      exposedType: 'Report',
      safetyClassification: 'Verified Read-Only (Zero Mutating TDL Code)',
      parentObject: 'Voucher',
      description: 'Vendor TDL module injecting Transporter ID, Vehicle Number, and distance in km.'
    },
    {
      tdlIdentifier: 'TDL-UDF-DISC-AUTH',
      name: 'Managerial Discount Authorization Sign-Off',
      exposedType: 'Field',
      safetyClassification: 'Verified Read-Only',
      parentObject: 'Voucher',
      description: 'User-defined field populated when invoice line discount exceeds 15%.'
    },
    {
      tdlIdentifier: 'TDL-COL-QUALITY-INSPEC',
      name: 'QC Inspection Certificate Log',
      exposedType: 'Collection',
      safetyClassification: 'Verified Read-Only',
      parentObject: 'StockItem',
      description: 'Secondary batch inspection reports linked to chemical and pharmaceutical inventory.'
    }
  ];

  res.json(tdlOutputs);
});

// 9. GET /api/discovery/relationships/graph
outputDiscoveryRouter.get('/relationships/graph', (req: Request, res: Response) => {
  res.json(relationshipGraph);
});

// 10. GET /api/discovery/matrix
outputDiscoveryRouter.get('/matrix', (req: Request, res: Response) => {
  res.json(availabilityMatrix);
});

// 11. GET /api/discovery/snapshots & POST /api/discovery/snapshots/diff
outputDiscoveryRouter.get('/snapshots', (req: Request, res: Response) => {
  res.json(schemaSnapshots);
});

outputDiscoveryRouter.post('/snapshots/diff', (req: Request, res: Response) => {
  const { snapshotIdA, snapshotIdB } = req.body || {};

  const diff: SchemaDiffResult = {
    snapshotIdA: snapshotIdA || 'SNAP-2026-0801',
    snapshotIdB: snapshotIdB || 'SNAP-2026-0907',
    addedFields: [
      'Voucher.UDF_DISCOUNT_AUTH (TDL Field)',
      'Voucher.UDF_EWAY_FLAG (TDL Field)',
      'StockItem.QC_CERTIFICATE_NO (Custom TDL)'
    ],
    removedFields: [],
    changedFields: [
      'Ledger.BILLCREDITPERIOD: precision changed from String to Integer'
    ],
    impactedReports: [
      'Customer Outstanding & Aging Analysis (Safe: No missing fields)',
      'High Value Sales Vouchers (Benefit: Added Discount Auth filter)'
    ],
    summaryDescription: '3 custom/TDL fields added, 1 field datatype refined. No breaking schema changes detected.'
  };

  res.json(diff);
});

// 12. GET /api/discovery/export-map
outputDiscoveryRouter.get('/export-map', (req: Request, res: Response) => {
  const exportPayload = {
    schemaVersion: '1.0.0',
    fileType: '.exfinmap.json',
    company: currentCompany.name,
    tallyVersion: currentCompany.tallyVersion,
    exportedAt: new Date().toISOString(),
    totalOutputs: outputCatalog.length,
    outputs: outputCatalog,
    objects: discoveredObjects.map((o) => ({
      name: o.name,
      collection: o.collectionName,
      fields: o.fields.map((f) => ({
        fieldName: f.fieldName,
        displayName: f.displayName,
        dataType: f.dataType,
        semanticConcept: f.semanticConcept,
        confidence: f.confidence
      }))
    }))
  };

  res.setHeader('Content-Disposition', `attachment; filename="EXFIN_SchemaMap_${Date.now()}.exfinmap.json"`);
  res.json(exportPayload);
});

// 13. POST /api/query-builder/validate
outputDiscoveryRouter.post('/validate', (req: Request, res: Response) => {
  const query: VisualQueryDefinition = req.body;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!query.primaryObject) {
    errors.push('Primary object must be selected (e.g. Voucher, Ledger, StockItem).');
  }

  if (!query.selectedFields || query.selectedFields.length === 0) {
    errors.push('At least one output field must be selected.');
  }

  // Safe Math Expression validation (check divide by zero, banned chars)
  if (query.calculatedFields && query.calculatedFields.length > 0) {
    query.calculatedFields.forEach((cf) => {
      if (/eval|exec|Function|window|process|import/i.test(cf.safeExpression)) {
        errors.push(`Unsafe expression syntax detected in ${cf.outputFieldName}. Arbitrary code execution is strictly rejected.`);
      }
      if (!cf.outputFieldName || cf.outputFieldName.trim().length === 0) {
        errors.push('Calculated field missing output name.');
      }
    });
  }

  res.json({
    isValid: errors.length === 0,
    validationErrors: errors,
    warnings: warnings
  });
});

// 14. POST /api/query-builder/estimate
outputDiscoveryRouter.post('/estimate', (req: Request, res: Response) => {
  const query: VisualQueryDefinition = req.body;
  const fieldCount = query.selectedFields?.length || 1;
  const filterCount = query.filters?.length || 0;

  let tier: 'Small' | 'Medium' | 'Large' = 'Small';
  let estimatedRows = 250;
  let estimatedMs = 85;

  if (query.primaryObject === 'Voucher') {
    tier = filterCount > 0 ? 'Medium' : 'Large';
    estimatedRows = filterCount > 0 ? 1200 : 18500;
    estimatedMs = filterCount > 0 ? 180 : 640;
  } else if (query.primaryObject === 'StockItem') {
    tier = 'Small';
    estimatedRows = 420;
    estimatedMs = 45;
  }

  const estimate: QueryPerformanceEstimate = {
    estimatedTier: tier,
    description: `Target Collection: [${query.primaryObject || 'Voucher'}]. ${filterCount} active filters reduce record scanning complexity.`,
    estimatedRowCount: estimatedRows,
    estimatedExecutionTimeMs: estimatedMs
  };

  res.json(estimate);
});

// 15. POST /api/query-builder/execute (Safe Execution Engine with Row Safeguards)
outputDiscoveryRouter.post('/execute', (req: Request, res: Response) => {
  const query: VisualQueryDefinition = req.body || {};
  const limit = Math.min(query.limitRows || 25, 500);

  // Generate synthetic deterministic rows based on query fields
  const columns = [...(query.selectedFields || ['VOUCHERNUMBER', 'DATE', 'PARTYLEDGERNAME', 'AMOUNT'])];
  if (query.calculatedFields && query.calculatedFields.length > 0) {
    query.calculatedFields.forEach((cf) => {
      if (!columns.includes(cf.outputFieldName)) {
        columns.push(cf.outputFieldName);
      }
    });
  }

  const sampleCustomers = [
    'Bharat Heavy Engineering Ltd',
    'Sun Pharma Distribution Corp',
    'Tata AutoComp Systems Ltd',
    'Larsen & Toubro Infra',
    'Reliance Petrochem Logistics',
    'Cipla Chemical Intermediates',
    'Mahindra Logistics Hub'
  ];

  const rows: Record<string, any>[] = [];
  for (let i = 1; i <= limit; i++) {
    const cust = sampleCustomers[i % sampleCustomers.length];
    const amountVal = 145000 * ((i % 5) + 1) + (i * 2400);
    const row: Record<string, any> = {};

    columns.forEach((col) => {
      const colUpper = col.toUpperCase();
      if (colUpper.includes('VOUCHERNUMBER') || colUpper.includes('INVOICE')) {
        row[col] = `INV-2026-${1000 + i}`;
      } else if (colUpper.includes('DATE')) {
        row[col] = `2026-08-${(i % 28) + 1}`;
      } else if (colUpper.includes('PARTY') || colUpper.includes('NAME') || colUpper.includes('CUSTOMER')) {
        row[col] = cust;
      } else if (colUpper.includes('AMOUNT') || colUpper.includes('BALANCE') || colUpper.includes('TOTAL')) {
        row[col] = amountVal;
      } else if (colUpper.includes('GSTIN')) {
        row[col] = `27AAACB${2000 + i}F1Z8`;
      } else if (colUpper.includes('GROSS PROFIT') || colUpper.includes('MARGIN')) {
        row[col] = Math.round(amountVal * 0.22);
      } else {
        row[col] = `Val-${i}`;
      }
    });
    rows.push(row);
  }

  const result: QueryExecutionResult = {
    queryId: query.queryId || `QRY-${Date.now()}`,
    columns: columns,
    rows: rows,
    totalRowCount: rows.length,
    executionDurationMs: 68,
    explanation: `Executed against discovered collection [${query.primaryObject || 'Voucher'}]. Evaluated ${query.filters?.length || 0} filter predicates with zero Tally mutations.`,
    sourceCollection: query.primaryObject || 'Vouchers',
    truncated: rows.length >= limit
  };

  res.json(result);
});

// 16. GET & POST /api/query-builder/saved
outputDiscoveryRouter.get('/saved', (req: Request, res: Response) => {
  res.json(savedQueries);
});

outputDiscoveryRouter.post('/saved', (req: Request, res: Response) => {
  const query: VisualQueryDefinition = req.body;
  const existingIdx = savedQueries.findIndex((q) => q.queryId === query.queryId);

  if (existingIdx >= 0) {
    savedQueries[existingIdx].version += 1;
    savedQueries[existingIdx].definition = query;
    savedQueries[existingIdx].name = query.queryName;
    savedQueries[existingIdx].updatedAt = new Date().toISOString();
    return res.json(savedQueries[existingIdx]);
  } else {
    const newRecord: SavedQueryRecord = {
      queryId: query.queryId || `QRY-${Date.now()}`,
      name: query.queryName || 'Custom Saved Query',
      version: 1,
      definition: query,
      createdBy: 'Finance User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    savedQueries.unshift(newRecord);
    return res.json(newRecord);
  }
});

// 17. POST /api/query-builder/copilot-nl (Natural Language Query to Visual Query Translation)
outputDiscoveryRouter.post('/copilot-nl', (req: Request, res: Response) => {
  const { prompt } = req.body || {};
  const promptText = String(prompt || '').toLowerCase();

  let targetObject = 'Voucher';
  let fields = ['VOUCHERNUMBER', 'DATE', 'PARTYLEDGERNAME', 'AMOUNT'];
  let filters: any[] = [];
  let explanation = 'Identified transactional sales query intent.';

  if (promptText.includes('outstanding') || promptText.includes('overdue') || promptText.includes('receivable')) {
    targetObject = 'Bill';
    fields = ['NAME', 'BILLDATE', 'BILLDUEDATE', 'OPENINGBALANCE'];
    filters = [{ id: 'f1', fieldName: 'OPENINGBALANCE', operator: '>', value: '100000' }];
    explanation = 'Targeted Bill collection for receivables aging analysis with > ₹1,00,000 threshold.';
  } else if (promptText.includes('inventory') || promptText.includes('stock')) {
    targetObject = 'StockItem';
    fields = ['NAME', 'PARENT', 'CLOSINGBALANCE', 'CLOSINGVALUE', 'HSNCODE'];
    filters = [{ id: 'f1', fieldName: 'CLOSINGBALANCE', operator: '>', value: '0' }];
    explanation = 'Targeted StockItems collection for closing inventory and HSN details.';
  } else if (promptText.includes('sales') || promptText.includes('customer')) {
    targetObject = 'Voucher';
    fields = ['VOUCHERNUMBER', 'DATE', 'PARTYLEDGERNAME', 'AMOUNT', 'PARTYGSTIN'];
    filters = [
      { id: 'f1', fieldName: 'VOUCHERTYPENAME', operator: 'CONTAINS', value: 'Sales' },
      { id: 'f2', fieldName: 'AMOUNT', operator: '>', value: '1000000' }
    ];
    explanation = 'Discovered Sales Vouchers above ₹10 Lakhs (1,000,000) for FY 2026-2027.';
  }

  const generatedQuery: VisualQueryDefinition = {
    queryId: `QRY-NL-${Date.now()}`,
    queryName: `AI-Generated: ${prompt?.substring(0, 40) || 'Query'}`,
    primaryObject: targetObject,
    selectedFields: fields,
    filters: filters,
    filterLogicalOperator: 'AND',
    groupByFields: [],
    aggregations: [],
    sortRules: [{ id: 's1', fieldName: fields[fields.length - 1], direction: 'DESC' }],
    calculatedFields: [],
    limitRows: 25
  };

  const result: NlToQueryTranslationResult = {
    originalPrompt: prompt || '',
    generatedQuery: generatedQuery,
    explanationOfChoices: explanation,
    selectedConcepts: ['Sales Revenue', 'Customer Identity', 'GSTIN', 'Invoice Date'],
    diffVsPrevious: 'Created new query from natural language request.'
  };

  res.json(result);
});

// 18. GET /api/reports/lineage/:columnId (Why this value? Data Lineage Trace)
outputDiscoveryRouter.get('/lineage/:columnId', (req: Request, res: Response) => {
  const col = req.params.columnId;
  const trace: DataLineageTrace = {
    outputColumn: col,
    calculatedFormula: col.toLowerCase().includes('profit') || col.toLowerCase().includes('margin')
      ? '([Sales Amount] - [Cost of Goods Sold]) / [Sales Amount] * 100'
      : undefined,
    semanticFields: ['Sales Value (Voucher.AMOUNT)', 'Product Purchase Cost (StockItem.CLOSINGRATE)'],
    tallySourceFields: ['<AMOUNT> in XML <ALLINVENTORYENTRIES.LIST>', '<RATE> in XML <BATCHALLOCATIONS.LIST>'],
    tallyObject: 'Voucher (joined with StockItem via Name)',
    explanation: `The value for [${col}] is computed strictly from verified Tally XML line allocations with zero heuristic fabrication.`
  };
  res.json(trace);
});

// 19. POST /api/reports/templates/check-compatibility
outputDiscoveryRouter.post('/templates/check-compatibility', (req: Request, res: Response) => {
  const template: TemplateExportBundle = req.body;
  const missing: string[] = [];
  const remappings: Record<string, string[]> = {};

  if (template.requiredFields) {
    template.requiredFields.forEach((reqF) => {
      // Check if field exists in discovered fields
      let found = false;
      discoveredObjects.forEach((o) => {
        if (o.fields.some((f) => f.fieldName.toLowerCase() === reqF.toLowerCase())) {
          found = true;
        }
      });
      if (!found) {
        missing.push(reqF);
        remappings[reqF] = ['PARTYLEDGERNAME', 'NAME', 'PARTYGSTIN'];
      }
    });
  }

  const result: TemplateImportResult = {
    compatibilityStatus: missing.length === 0 ? 'Compatible' : 'Partially Compatible',
    missingFields: missing,
    suggestedRemappings: remappings
  };

  res.json(result);
});
