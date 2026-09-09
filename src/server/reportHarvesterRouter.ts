import { Router, Request, Response } from 'express';
import {
  DiscoverySessionModel,
  ReportCatalogItem,
  DiscoveredCollectionModel,
  DiscoveredObjectModel,
  DiscoveredFieldModel,
  SemanticMappingModel,
  ExtractionTemplateModel,
  ExtractionJobModel,
  QueryLabResultModel,
  SchemaDiffModel
} from '../types/phase29ReportHarvester';

export const reportHarvesterRouter = Router();

// ==========================================
// IN-MEMORY DATA REPOSITORY FOR REPORT HARVESTER
// ==========================================

let discoverySessionsList: DiscoverySessionModel[] = [
  {
    sessionId: 'DISC-SESS-01',
    connectionId: 'conn-01',
    companyId: 'comp-101',
    tallyVersion: 'TallyPrime Server 4.1',
    scope: 'Entire Company',
    depth: 'Deep',
    status: 'Completed',
    startedAt: '2026-03-28T09:00:00Z',
    completedAt: '2026-03-28T09:02:14Z',
    adapterVersion: '4.2.0',
    reportsDiscovered: 16,
    collectionsDiscovered: 12,
    objectsDiscovered: 8,
    fieldsDiscovered: 142,
    mappingsGenerated: 128
  }
];

let reportCatalogList: ReportCatalogItem[] = [
  {
    reportId: 'REP-TALLY-01',
    name: 'Sales Day Book Register',
    tallyIdentifier: '$$DayBook_Sales',
    source: 'Tally Standard XML Export',
    type: 'Standard',
    category: 'Accounting',
    availability: 'Available',
    description: 'Chronological sequence of all posted sales tax invoices, credit notes, and bill allocations.',
    parameters: [
      {
        parameterId: 'p-01',
        name: 'FromDate',
        type: 'Date',
        defaultValue: '20250401',
        isRequired: true,
        description: 'Beginning boundary date for voucher enumeration',
        source: 'Tally Standard SVFromDate'
      },
      {
        parameterId: 'p-02',
        name: 'ToDate',
        type: 'Date',
        defaultValue: '20260331',
        isRequired: true,
        description: 'Ending boundary date for voucher enumeration',
        source: 'Tally Standard SVToDate'
      },
      {
        parameterId: 'p-03',
        name: 'VoucherType',
        type: 'Enum',
        defaultValue: 'Sales',
        isRequired: false,
        allowedValues: ['Sales', 'Sales Order', 'Proforma Invoice'],
        description: 'Optional voucher subtype filter',
        source: 'Tally Filter'
      }
    ],
    fields: [
      { fieldId: 'f-01', name: 'VoucherNumber', path: 'Voucher.VoucherNumber', type: 'String', nullable: 'Required', sampleValues: ['INV-2026-901', 'INV-2026-902'], source: 'VOUCHERNUMBER', confidence: 'High', nullPct: 0, uniquePct: 100 },
      { fieldId: 'f-02', name: 'Date', path: 'Voucher.Date', type: 'Date', nullable: 'Required', sampleValues: ['2026-03-28', '2026-03-27'], source: 'DATE', confidence: 'High', nullPct: 0, uniquePct: 24 },
      { fieldId: 'f-03', name: 'PartyName', path: 'Voucher.PartyLedgerName', type: 'String', nullable: 'Required', sampleValues: ['Zenith Logistics Ltd', 'Kaveri Distributors'], source: 'PARTYLEDGERNAME', confidence: 'High', nullPct: 0, uniquePct: 42 },
      { fieldId: 'f-04', name: 'Amount', path: 'Voucher.LedgerEntries.Amount', type: 'Decimal', nullable: 'Required', sampleValues: [145000.0, 320000.0], source: 'AMOUNT', confidence: 'High', nullPct: 0, uniquePct: 88 }
    ],
    lastDiscovered: '2026-03-28T09:01:10Z',
    version: '1.0',
    sampleRows: [
      { VoucherNumber: 'INV-2026-901', Date: '2026-03-28', PartyName: 'Zenith Logistics Ltd', Amount: 320000.0, State: 'Maharashtra', GSTIN: '27AABCT3491C1Z4' },
      { VoucherNumber: 'INV-2026-902', Date: '2026-03-27', PartyName: 'Kaveri Distributors', Amount: 145000.0, State: 'Karnataka', GSTIN: '29AAACK4812D1Z9' }
    ]
  },
  {
    reportId: 'REP-TALLY-02',
    name: 'Stock Item Godown Movement Summary',
    tallyIdentifier: '$$Stock_Movement_Godown',
    source: 'Tally Standard XML Export',
    type: 'Standard',
    category: 'Inventory',
    availability: 'Available',
    description: 'Detailed multi-godown stock movement with batch identification and valuation metrics.',
    parameters: [
      {
        parameterId: 'p-10',
        name: 'StockGroupName',
        type: 'Text',
        defaultValue: 'Primary',
        isRequired: false,
        description: 'Filter by specific inventory hierarchy branch',
        source: 'Tally Filter'
      }
    ],
    fields: [
      { fieldId: 'f-11', name: 'ItemName', path: 'StockItem.Name', type: 'String', nullable: 'Required', sampleValues: ['Industrial IoT Controller X4'], source: 'NAME', confidence: 'High', nullPct: 0, uniquePct: 100 },
      { fieldId: 'f-12', name: 'ClosingBalance', path: 'StockItem.ClosingBalance', type: 'Decimal', nullable: 'Required', sampleValues: [-4.0, 120.0], source: 'CLOSINGBALANCE', confidence: 'High', nullPct: 0, uniquePct: 92 },
      { fieldId: 'f-13', name: 'ClosingRate', path: 'StockItem.ClosingRate', type: 'Decimal', nullable: 'Optional', sampleValues: [4500.0], source: 'CLOSINGRATE', confidence: 'High', nullPct: 4, uniquePct: 80 }
    ],
    lastDiscovered: '2026-03-28T09:01:25Z',
    version: '1.0',
    sampleRows: [
      { ItemName: 'Industrial IoT Controller X4', ClosingBalance: -4.0, Unit: 'NOS', ClosingRate: 4500.0, Valuation: -18000.0 },
      { ItemName: 'Smart Gateway Series 4', ClosingBalance: 88.0, Unit: 'NOS', ClosingRate: 2200.0, Valuation: 193600.0 }
    ]
  },
  {
    reportId: 'REP-TALLY-03',
    name: 'Custom TDL Project Cost Allocation Matrix',
    tallyIdentifier: '$$User_Project_CostMatrix',
    source: 'Custom TDL Module',
    type: 'Custom',
    category: 'Cost Centre',
    availability: 'Available',
    description: 'Customized TDL report exposing multi-level cost center expenditure broken down by project milestone.',
    parameters: [],
    fields: [
      { fieldId: 'f-21', name: 'ProjectCode', path: 'CostMatrix.ProjectCode', type: 'String', nullable: 'Required', sampleValues: ['PRJ-HYD-04'], source: 'PRJCODE', confidence: 'Medium', nullPct: 0, uniquePct: 100 },
      { fieldId: 'f-22', name: 'AllocatedCost', path: 'CostMatrix.AllocatedCost', type: 'Decimal', nullable: 'Required', sampleValues: [1250000.0], source: 'COSTALLOC', confidence: 'Medium', nullPct: 0, uniquePct: 90 }
    ],
    lastDiscovered: '2026-03-28T09:01:45Z',
    version: '1.1',
    sampleRows: [
      { ProjectCode: 'PRJ-HYD-04', ProjectName: 'Hyderabad Smart Grid Expansion', AllocatedCost: 1250000.0, Manager: 'Suresh Menon' }
    ]
  }
];

let collectionsList: DiscoveredCollectionModel[] = [
  { collectionId: 'col-01', name: 'Voucher Collection', type: 'Primary Transaction', source: 'Tally Standard Collection', availability: 'Available', fields: ['VoucherNumber', 'Date', 'PartyLedgerName', 'Amount', 'Narrations'], sampleCount: 190 },
  { collectionId: 'col-02', name: 'Ledger Master Collection', type: 'Master Collection', source: 'Tally Standard Collection', availability: 'Available', fields: ['Name', 'ParentGroup', 'OpeningBalance', 'ClosingBalance', 'GSTIN'], sampleCount: 142 },
  { collectionId: 'col-03', name: 'Stock Item Collection', type: 'Inventory Master', source: 'Tally Standard Collection', availability: 'Available', fields: ['Name', 'BaseUnit', 'CostingMethod', 'ClosingBalance', 'StandardCost'], sampleCount: 84 }
];

let objectsList: DiscoveredObjectModel[] = [
  {
    objectId: 'obj-01',
    name: 'Voucher (Accounting & Inventory)',
    category: 'Transaction Entity',
    identifier: 'VOUCHER',
    fieldCount: 28,
    relationships: [
      { targetObject: 'Ledger Master', type: 'One-to-many', confidence: 'High' },
      { targetObject: 'Stock Item', type: 'One-to-many', confidence: 'High' },
      { targetObject: 'Cost Centre', type: 'One-to-one', confidence: 'Medium' }
    ],
    sampleRecord: { GUID: 'e92f1b0a-912c-4e89', VoucherNumber: 'INV-2026-901', Date: '2026-03-28', Amount: 320000.0 }
  },
  {
    objectId: 'obj-02',
    name: 'Ledger Master',
    category: 'Master Entity',
    identifier: 'LEDGER',
    fieldCount: 18,
    relationships: [
      { targetObject: 'Group Master', type: 'One-to-one', confidence: 'High' }
    ],
    sampleRecord: { Name: 'Legal & Professional Expenses', Parent: 'Indirect Expenses', ClosingBalance: 3840000.0 }
  }
];

let semanticMappingsList: SemanticMappingModel[] = [
  {
    mappingId: 'map-01',
    sourceReport: 'Sales Day Book Register',
    sourceField: 'VoucherNumber',
    sourcePath: 'Voucher.VoucherNumber',
    canonicalField: 'voucher.reference_number',
    semanticType: 'Reference',
    confidence: 'High',
    method: 'Exact Match',
    reason: "Matched Tally 'VOUCHERNUMBER' to canonical voucher.reference_number.",
    status: 'Approved',
    approvedBy: 'Arjun Mehta',
    approvedAt: '2026-03-28T09:10:00Z'
  },
  {
    mappingId: 'map-02',
    sourceReport: 'Sales Day Book Register',
    sourceField: 'PartyName',
    sourcePath: 'Voucher.PartyLedgerName',
    canonicalField: 'party.name',
    semanticType: 'Party',
    confidence: 'High',
    method: 'Alias Match',
    reason: "Matched alias 'PartyLedgerName' to canonical party.name via Semantic Dictionary.",
    status: 'Approved',
    approvedBy: 'Arjun Mehta',
    approvedAt: '2026-03-28T09:10:00Z'
  },
  {
    mappingId: 'map-03',
    sourceReport: 'Custom TDL Project Cost Allocation Matrix',
    sourceField: 'AllocatedCost',
    sourcePath: 'CostMatrix.AllocatedCost',
    canonicalField: 'cost_centre.allocated_amount',
    semanticType: 'Amount',
    confidence: 'Medium',
    method: 'Context Match',
    reason: 'Inferred cost allocation amount from parent CostMatrix context.',
    status: 'Proposed'
  }
];

let extractionTemplatesList: ExtractionTemplateModel[] = [
  {
    templateId: 'tmpl-01',
    name: 'Daily Sales & DayBook Harvester',
    companyScope: 'Acme Enterprise Ltd (HO)',
    reportId: 'REP-TALLY-01',
    parameters: { FromDate: '20250401', ToDate: '20260331', VoucherType: 'Sales' },
    schedule: 'Every 4 Hours',
    status: 'Active',
    lastRunAt: '2026-03-28T09:00:00Z'
  }
];

let extractionJobsList: ExtractionJobModel[] = [
  {
    jobId: 'job-901',
    reportId: 'REP-TALLY-01',
    reportName: 'Sales Day Book Register',
    companyId: 'comp-101',
    parameters: { FromDate: '20250401', ToDate: '20260331' },
    startedAt: '2026-03-28T09:00:00Z',
    completedAt: '2026-03-28T09:00:18Z',
    status: 'Completed',
    recordCount: 190,
    errorCount: 0
  }
];

// ==========================================
// ROUTES
// ==========================================

reportHarvesterRouter.get('/sessions', (req: Request, res: Response) => {
  res.json({ success: true, data: discoverySessionsList });
});

reportHarvesterRouter.post('/sessions', (req: Request, res: Response) => {
  const { scope, depth } = req.body;
  const newSession: DiscoverySessionModel = {
    sessionId: `DISC-SESS-${Date.now().toString().slice(-4)}`,
    connectionId: 'conn-01',
    companyId: 'comp-101',
    tallyVersion: 'TallyPrime Server 4.1',
    scope: scope || 'Entire Company',
    depth: depth || 'Standard',
    status: 'Completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    adapterVersion: '4.2.0',
    reportsDiscovered: depth === 'Deep' ? 16 : depth === 'Standard' ? 8 : 4,
    collectionsDiscovered: depth === 'Deep' ? 12 : 6,
    objectsDiscovered: 8,
    fieldsDiscovered: depth === 'Deep' ? 142 : 64,
    mappingsGenerated: depth === 'Deep' ? 128 : 58
  };

  discoverySessionsList.unshift(newSession);
  res.json({ success: true, data: newSession });
});

reportHarvesterRouter.get('/reports', (req: Request, res: Response) => {
  res.json({ success: true, data: reportCatalogList });
});

reportHarvesterRouter.get('/collections', (req: Request, res: Response) => {
  res.json({ success: true, data: collectionsList });
});

reportHarvesterRouter.get('/objects', (req: Request, res: Response) => {
  res.json({ success: true, data: objectsList });
});

reportHarvesterRouter.get('/mappings', (req: Request, res: Response) => {
  res.json({ success: true, data: semanticMappingsList });
});

reportHarvesterRouter.put('/mappings/:id/status', (req: Request, res: Response) => {
  const { status, approvedBy } = req.body;
  const idx = semanticMappingsList.findIndex((m) => m.mappingId === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  semanticMappingsList[idx].status = status;
  if (status === 'Approved') {
    semanticMappingsList[idx].approvedBy = approvedBy || 'Admin Controller';
    semanticMappingsList[idx].approvedAt = new Date().toISOString();
  }

  res.json({ success: true, data: semanticMappingsList[idx] });
});

reportHarvesterRouter.get('/templates', (req: Request, res: Response) => {
  res.json({ success: true, data: extractionTemplatesList });
});

reportHarvesterRouter.get('/jobs', (req: Request, res: Response) => {
  res.json({ success: true, data: extractionJobsList });
});

reportHarvesterRouter.post('/jobs', (req: Request, res: Response) => {
  const { reportId, parameters } = req.body;
  const rep = reportCatalogList.find((r) => r.reportId === reportId) || reportCatalogList[0];

  const newJob: ExtractionJobModel = {
    jobId: `job-${Date.now().toString().slice(-4)}`,
    reportId: rep.reportId,
    reportName: rep.name,
    companyId: 'comp-101',
    parameters: parameters || {},
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'Completed',
    recordCount: rep.sampleRows.length * 10,
    errorCount: 0
  };

  extractionJobsList.unshift(newJob);
  res.json({ success: true, data: newJob });
});

// Tally Query Lab Live Test Execution
reportHarvesterRouter.post('/query-lab/execute', (req: Request, res: Response) => {
  const { reportId, parameters } = req.body;
  const rep = reportCatalogList.find((r) => r.reportId === reportId) || reportCatalogList[0];

  const rawXml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>${rep.name}</REPORTNAME>
        <STATICVARIABLES>
          <SVFROMDATE>${parameters?.FromDate || '20250401'}</SVFROMDATE>
          <SVTODATE>${parameters?.ToDate || '20260331'}</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
      <RESPONSE>
        <RECORDCOUNT>${rep.sampleRows.length}</RECORDCOUNT>
        <VOUCHERS>
          ${rep.sampleRows.map((r) => `<VOUCHER><VOUCHERNUMBER>${r.VoucherNumber || r.ItemName || r.ProjectCode}</VOUCHERNUMBER><AMOUNT>${r.Amount || r.AllocatedCost || r.Valuation || 0}</AMOUNT></VOUCHER>`).join('\n          ')}
        </VOUCHERS>
      </RESPONSE>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

  const result: QueryLabResultModel = {
    queryId: `qry-${Date.now()}`,
    companyId: 'comp-101',
    reportId: rep.reportId,
    parameters: parameters || {},
    durationMs: 24,
    rawPayload: rawXml,
    parsedJson: rep.sampleRows,
    totalRecords: rep.sampleRows.length,
    totalFields: rep.fields.length,
    payloadSizeBytes: rawXml.length
  };

  res.json({ success: true, data: result });
});

// Discovery Diff
reportHarvesterRouter.get('/diff', (req: Request, res: Response) => {
  const diff: SchemaDiffModel = {
    sessionA: 'DISC-SESS-01 (Current)',
    sessionB: 'DISC-SESS-00 (Baseline)',
    addedReports: ['Custom TDL Project Cost Allocation Matrix'],
    removedReports: [],
    addedFields: ['CostMatrix.ProjectCode', 'CostMatrix.AllocatedCost'],
    removedFields: [],
    breakingChanges: []
  };
  res.json({ success: true, data: diff });
});

// Strict Read-Only Guard
reportHarvesterRouter.all('/write-block/*', (req: Request, res: Response) => {
  res.status(403).json({
    success: false,
    error: 'SECURITY VIOLATION: Tally write operations strictly prohibited in Report Harvester.'
  });
});
