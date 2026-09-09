import { Router, Request, Response } from 'express';
import {
  ConnectionModel,
  DiscoveredCompany,
  TallyCapability,
  TallySnapshot,
  SnapshotDiff,
  ImportedDataset,
  DataFileAnalysis,
  AdapterMetadata,
  CompatibilityItem,
  DiagnosticsReport,
  ConnectionAuditLog,
  BlockedWriteLog
} from '../types/phase28UniversalConnector';

export const universalConnectorRouter = Router();

// ==========================================
// IN-MEMORY REPOSITORY FOR UNIVERSAL CONNECTOR
// ==========================================

const compatibilityMatrix: CompatibilityItem[] = [
  {
    tallyVersion: 'TallyPrime Server 4.1 / 4.0',
    isSupported: true,
    recommendedProtocol: 'HTTP',
    capabilities: ['Companies', 'Ledgers', 'Vouchers', 'Inventory', 'GST E-Invoice', 'Cost Centres', 'Custom TDL XML'],
    limitations: 'High-speed XML/JSON endpoints enabled. Supports multi-company background extraction.'
  },
  {
    tallyVersion: 'TallyPrime Release 3.0 / 3.0.1',
    isSupported: true,
    recommendedProtocol: 'HTTP',
    capabilities: ['Companies', 'Ledgers', 'Vouchers', 'Inventory', 'GST', 'Cost Centres'],
    limitations: 'Standard XML request/response model.'
  },
  {
    tallyVersion: 'Tally.ERP 9 Release 6.6.3',
    isSupported: true,
    recommendedProtocol: 'HTTP',
    capabilities: ['Companies', 'Ledgers', 'Vouchers', 'Inventory (Standard)', 'Basic GST'],
    limitations: 'Requires XML POST on port 9000. Limited native JSON serialization.'
  },
  {
    tallyVersion: 'Tally 7.2 / 8.1 (Legacy)',
    isSupported: false,
    recommendedProtocol: 'File Import',
    capabilities: ['Import Only via Exported XML/SDF'],
    limitations: 'Live HTTP/HTTPS socket not supported. Use Offline File Import.'
  }
];

let connectionsList: ConnectionModel[] = [
  {
    connectionId: 'conn-01',
    name: 'Primary TallyPrime Server (Local Port 9000)',
    host: '127.0.0.1',
    port: 9000,
    protocol: 'HTTP',
    status: 'Connected',
    tallyVersion: {
      major: 4,
      minor: 1,
      patch: 0,
      edition: 'TallyPrime Release 4.1 (64-bit)',
      build: 'Build 4.1.189',
      isDetected: true,
      rawString: 'TallyPrime Server 4.1'
    },
    discoveredCompanies: [
      {
        companyId: 'comp-101',
        name: 'Acme Enterprise Ltd (HO)',
        financialYear: '01-Apr-2025 to 31-Mar-2026',
        booksBeginning: '01-Apr-2025',
        baseCurrency: 'INR (₹)',
        address: '102 Industrial Tower, Mumbai, MH',
        tallyVersion: 'TallyPrime 4.1',
        isFavorite: true,
        status: 'Connected',
        lastSyncAt: '2026-03-28T09:30:00Z'
      },
      {
        companyId: 'comp-102',
        name: 'Acme Southern Logistics Pvt Ltd',
        financialYear: '01-Apr-2025 to 31-Mar-2026',
        booksBeginning: '01-Apr-2025',
        baseCurrency: 'INR (₹)',
        address: '44 Harbor Road, Chennai, TN',
        tallyVersion: 'TallyPrime 4.1',
        isFavorite: false,
        status: 'Available',
        lastSyncAt: '2026-03-27T16:45:00Z'
      }
    ],
    activeCompanyId: 'comp-101',
    capabilities: [
      { id: 'cap-01', name: 'Master Ledger Enumeration', category: 'Masters', status: 'Available', details: 'Direct canonical XML parsing', latencyMs: 14, lastTestedAt: '2026-03-28T09:00:00Z' },
      { id: 'cap-02', name: 'Voucher Extraction (DayBook & Registers)', category: 'Transactions', status: 'Available', details: 'Full ledger & item rows', latencyMs: 28, lastTestedAt: '2026-03-28T09:00:00Z' },
      { id: 'cap-03', name: 'Stock Item & Multi-Godown Inventory', category: 'Inventory', status: 'Available', details: 'Batch & lot tracking verified', latencyMs: 22, lastTestedAt: '2026-03-28T09:00:00Z' },
      { id: 'cap-04', name: 'GST Statutory Data (GSTR-1 / 3B / 2B)', category: 'Taxation', status: 'Available', details: 'HSN summary & ITC breakdown', latencyMs: 34, lastTestedAt: '2026-03-28T09:00:00Z' },
      { id: 'cap-05', name: 'Cost Centre & Cost Category Allocation', category: 'Transactions', status: 'Available', details: 'Multi-dimensional allocation', latencyMs: 18, lastTestedAt: '2026-03-28T09:00:00Z' },
      { id: 'cap-06', name: 'Custom TDL User Reports', category: 'Custom Reports', status: 'Available', details: 'Auto-discovery enabled', latencyMs: 42, lastTestedAt: '2026-03-28T09:00:00Z' }
    ],
    latencyMs: 18,
    lastConnected: '2026-03-28T09:30:00Z',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-28T09:30:00Z'
  }
];

let snapshotsList: TallySnapshot[] = [
  {
    snapshotId: 'SNP-2026-0328-994',
    companyId: 'comp-101',
    companyName: 'Acme Enterprise Ltd (HO)',
    connectionId: 'conn-01',
    period: '01-Apr-2025 to 31-Mar-2026 (FY26)',
    tallyVersion: 'TallyPrime 4.1',
    recordCount: 2840,
    storageSizeBytes: 4892000,
    integrityHash: '8e1f5b083c21a995e8654876b0542319ef763cbda552c6f376cf99572d4cba79',
    domains: ['Ledgers', 'Vouchers', 'Stock Items', 'GST Registers', 'Bank Statements'],
    status: 'Complete',
    createdAt: '2026-03-28T08:00:00Z',
    immutableVersion: 1
  },
  {
    snapshotId: 'SNP-2026-0228-882',
    companyId: 'comp-101',
    companyName: 'Acme Enterprise Ltd (HO)',
    connectionId: 'conn-01',
    period: '01-Apr-2025 to 28-Feb-2026 (11 Months)',
    tallyVersion: 'TallyPrime 4.1',
    recordCount: 2590,
    storageSizeBytes: 4420000,
    integrityHash: '4b39178ad3819e992764b85c14589d9c827361a9bc38271059f8165b6e41b2c4',
    domains: ['Ledgers', 'Vouchers', 'Stock Items'],
    status: 'Complete',
    createdAt: '2026-02-28T18:00:00Z',
    immutableVersion: 1
  }
];

let importedDatasetsList: ImportedDataset[] = [
  {
    datasetId: 'DS-IMP-2026-01',
    name: 'External Vendor Purchase Register (XLSX)',
    sourceFormat: 'XLSX',
    companyId: 'comp-101',
    schemaVersion: '1.2',
    recordCount: 412,
    status: 'Published',
    fields: [
      { fieldName: 'Inv_No', canonicalName: 'Voucher.ReferenceNumber', inferredType: 'Text', sampleValues: ['INV-9021', 'INV-9022'], confidence: 'High', nullCount: 0, uniqueCount: 412 },
      { fieldName: 'Inv_Date', canonicalName: 'Voucher.Date', inferredType: 'Date', sampleValues: ['2026-03-15', '2026-03-16'], confidence: 'High', nullCount: 0, uniqueCount: 38 },
      { fieldName: 'Vendor_GSTIN', canonicalName: 'Party.GSTIN', inferredType: 'Text', sampleValues: ['27AABCT3491C1Z4'], confidence: 'High', nullCount: 4, uniqueCount: 29 },
      { fieldName: 'Taxable_Amt', canonicalName: 'VoucherLine.TaxableAmount', inferredType: 'Decimal', sampleValues: [45000.0, 128500.0], confidence: 'High', nullCount: 0, uniqueCount: 390 }
    ],
    validationErrors: [],
    stagingRollbackAvailable: false,
    createdAt: '2026-03-26T10:00:00Z',
    publishedAt: '2026-03-26T10:15:00Z'
  }
];

const adapterRegistry: AdapterMetadata[] = [
  {
    adapterId: 'adp-http-xml-v4',
    name: 'TallyPrime Native HTTP/XML Protocol Adapter',
    version: '4.2.0',
    author: 'EXFIN Core Engineering',
    supportedProtocols: ['HTTP', 'HTTPS'],
    supportedTallyVersions: ['TallyPrime 4.x', 'TallyPrime 3.x', 'Tally.ERP 9 6.6'],
    isProductionApproved: true,
    health: 'Healthy'
  },
  {
    adapterId: 'adp-json-stream-v1',
    name: 'Tally JSON High-Throughput Stream Adapter',
    version: '1.4.1',
    author: 'EXFIN Core Engineering',
    supportedProtocols: ['HTTP'],
    supportedTallyVersions: ['TallyPrime 4.x'],
    isProductionApproved: true,
    health: 'Healthy'
  },
  {
    adapterId: 'adp-file-universal-v2',
    name: 'Universal Offline Data File & Backup Analyzer',
    version: '2.1.0',
    author: 'EXFIN Core Engineering',
    supportedProtocols: ['File Import'],
    supportedTallyVersions: ['All Releases (XML / JSON / CSV / XLSX)'],
    isProductionApproved: true,
    health: 'Healthy'
  }
];

let auditLogsList: ConnectionAuditLog[] = [
  {
    logId: 'aud-conn-01',
    timestamp: '2026-03-28T09:30:00Z',
    connectionId: 'conn-01',
    action: 'Connect',
    actor: 'System Auto-Discover',
    details: 'Connected to 127.0.0.1:9000 (TallyPrime 4.1). 2 companies enumerated successfully.'
  },
  {
    logId: 'aud-conn-02',
    timestamp: '2026-03-28T08:00:00Z',
    connectionId: 'conn-01',
    action: 'Snapshot',
    actor: 'Arjun Mehta',
    details: 'Snapshot SNP-2026-0328-994 created (2,840 records, SHA-256 seal generated).'
  }
];

let blockedWriteLogs: BlockedWriteLog[] = [
  {
    logId: 'blk-01',
    timestamp: '2026-03-28T07:15:00Z',
    connectionId: 'conn-01',
    endpointAttempted: '/tally/alter-voucher/vch-901',
    requestPayloadPreview: '<ENVELOPE><BODY><DATA><TALLYMESSAGE><VOUCHER ACTION="Alter">...</VOUCHER></TALLYMESSAGE></DATA></BODY></ENVELOPE>',
    status: 'BLOCKED_WRITE_ATTEMPT',
    auditAction: 'Blocked by Read-Only Tally Guard'
  }
];

// ==========================================
// ROUTES
// ==========================================

universalConnectorRouter.get('/connections', (req: Request, res: Response) => {
  res.json({ success: true, data: connectionsList });
});

universalConnectorRouter.post('/connections', (req: Request, res: Response) => {
  const { name, host, port, protocol } = req.body;
  const newConn: ConnectionModel = {
    connectionId: `conn-${Date.now().toString().slice(-4)}`,
    name: name || `Tally Connection (${host}:${port})`,
    host: host || '127.0.0.1',
    port: Number(port) || 9000,
    protocol: protocol || 'HTTP',
    status: 'Connected',
    tallyVersion: {
      major: 4,
      minor: 1,
      edition: 'TallyPrime Release 4.1',
      build: 'Build 4.1.189',
      isDetected: true
    },
    discoveredCompanies: [
      {
        companyId: `comp-${Date.now().toString().slice(-3)}`,
        name: 'Acme Enterprise Ltd (HO)',
        financialYear: '01-Apr-2025 to 31-Mar-2026',
        booksBeginning: '01-Apr-2025',
        baseCurrency: 'INR (₹)',
        tallyVersion: 'TallyPrime 4.1',
        isFavorite: true,
        status: 'Connected',
        lastSyncAt: new Date().toISOString()
      }
    ],
    capabilities: [
      { id: 'cap-01', name: 'Master Ledgers', category: 'Masters', status: 'Available', details: 'XML protocol verified', latencyMs: 15 },
      { id: 'cap-02', name: 'Vouchers & DayBook', category: 'Transactions', status: 'Available', details: 'Full extraction enabled', latencyMs: 25 },
      { id: 'cap-03', name: 'Inventory & Stock Items', category: 'Inventory', status: 'Available', details: 'Batch & UOM tracking', latencyMs: 20 }
    ],
    latencyMs: 16,
    lastConnected: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  connectionsList.unshift(newConn);
  auditLogsList.unshift({
    logId: `aud-conn-${Date.now()}`,
    timestamp: new Date().toISOString(),
    connectionId: newConn.connectionId,
    action: 'Connect',
    actor: 'User Admin',
    details: `Added new connection ${newConn.name} (${newConn.host}:${newConn.port}).`
  });

  res.json({ success: true, data: newConn });
});

universalConnectorRouter.post('/connections/test', (req: Request, res: Response) => {
  const { host, port } = req.body;
  const isLocal = host === '127.0.0.1' || host === 'localhost';

  if (isLocal && (port === 9000 || port === '9000' || port === 9001 || port === '9001')) {
    res.json({
      success: true,
      data: {
        reachable: true,
        latencyMs: 14,
        tallyVersion: 'TallyPrime Release 4.1 (64-bit)',
        companyCount: 2,
        protocol: 'HTTP',
        message: 'Connection test successful. Tally instance reachable and responsive.'
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        reachable: true,
        latencyMs: 38,
        tallyVersion: 'Tally.ERP 9 Release 6.6.3',
        companyCount: 1,
        protocol: 'HTTP',
        message: 'Connection reachable. Legacy Tally protocol detected.'
      }
    });
  }
});

// Local Candidate Port Discovery
universalConnectorRouter.get('/discover', (req: Request, res: Response) => {
  const candidatePorts = [9000, 9001, 9002, 9005, 8080];
  const results = candidatePorts.map((port) => ({
    port,
    status: port === 9000 ? 'Active Tally Instance Detected' : port === 9001 ? 'Secondary Instance Responding' : 'Port Closed / Unreachable',
    versionDetected: port === 9000 ? 'TallyPrime 4.1' : port === 9001 ? 'TallyPrime 3.0' : null,
    latencyMs: port === 9000 ? 12 : port === 9001 ? 24 : null
  }));

  res.json({ success: true, data: results });
});

universalConnectorRouter.get('/compatibility', (req: Request, res: Response) => {
  res.json({ success: true, data: compatibilityMatrix });
});

universalConnectorRouter.get('/diagnostics', (req: Request, res: Response) => {
  const report: DiagnosticsReport = {
    connectionId: 'conn-01',
    host: '127.0.0.1',
    port: 9000,
    protocol: 'HTTP',
    latencyMs: 18,
    versionInfo: {
      major: 4,
      minor: 1,
      edition: 'TallyPrime Server 4.1',
      build: 'Build 4.1.189',
      isDetected: true
    },
    activeCompaniesCount: 2,
    discoveredCapabilitiesCount: 6,
    lastResponseCode: 200,
    lastResponseDurationMs: 24,
    sslCertificateStatus: 'N/A (Local Loopback Socket)',
    securityGuardStatus: 'Strict Read-Only Guard Active (Zero Write Access)'
  };
  res.json({ success: true, data: report });
});

universalConnectorRouter.get('/snapshots', (req: Request, res: Response) => {
  res.json({ success: true, data: snapshotsList });
});

universalConnectorRouter.post('/snapshots', (req: Request, res: Response) => {
  const { companyId, period, domains } = req.body;
  const newSnapshot: TallySnapshot = {
    snapshotId: `SNP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    companyId: companyId || 'comp-101',
    companyName: 'Acme Enterprise Ltd (HO)',
    connectionId: 'conn-01',
    period: period || 'FY 2025-26',
    tallyVersion: 'TallyPrime 4.1',
    recordCount: 2840,
    storageSizeBytes: 4892000,
    integrityHash: 'a71e428f9d6c810b4278c31295b71946ec39d1b0927c4918e762cba3901458b2',
    domains: domains || ['Ledgers', 'Vouchers', 'Stock Items', 'GST Registers'],
    status: 'Complete',
    createdAt: new Date().toISOString(),
    immutableVersion: 1
  };

  snapshotsList.unshift(newSnapshot);
  auditLogsList.unshift({
    logId: `aud-conn-${Date.now()}`,
    timestamp: new Date().toISOString(),
    connectionId: 'conn-01',
    action: 'Snapshot',
    actor: 'User Controller',
    details: `Created snapshot ${newSnapshot.snapshotId} for ${newSnapshot.companyName}.`
  });

  res.json({ success: true, data: newSnapshot });
});

universalConnectorRouter.get('/snapshots/compare', (req: Request, res: Response) => {
  const diff: SnapshotDiff = {
    snapshotAId: 'SNP-2026-0328-994',
    snapshotBId: 'SNP-2026-0228-882',
    addedRecordsCount: 250,
    removedRecordsCount: 0,
    modifiedRecordsCount: 18,
    deltaSummary: '250 new March 2026 vouchers added. 18 sub-ledger balances updated with zero primary key collisions.'
  };
  res.json({ success: true, data: diff });
});

// Import Center & File Analyzer
universalConnectorRouter.post('/import/analyze-file', (req: Request, res: Response) => {
  const { fileName } = req.body;
  const name = fileName || 'Tally_DayBook_Export.xml';

  let analysis: DataFileAnalysis = {
    fileName: name,
    fileSizeBytes: 2450000,
    detectedFormat: 'Known Tally XML',
    isParsable: true,
    encoding: 'UTF-8 / UTF-16LE',
    recognizedSignatures: ['<ENVELOPE>', '<TALLYMESSAGE>', '<VOUCHER VCHTYPE="Sales">'],
    diagnosticMessage: 'Valid Tally canonical XML schema detected. Safe to parse and stage for canonical normalization.',
    recoverableMetadata: {
      companyName: 'Acme Enterprise Ltd',
      voucherCount: 190,
      financialYear: '2025-2026',
      generator: 'TallyPrime Release 4.1 Export Engine'
    }
  };

  if (name.endsWith('.dat') || name.endsWith('.900') || name.endsWith('.tsf')) {
    analysis = {
      fileName: name,
      fileSizeBytes: 8900000,
      detectedFormat: 'Unsupported Proprietary Binary',
      isParsable: false,
      encoding: 'Binary / Proprietary Encrypted',
      recognizedSignatures: ['TallyDataFile-MagicHeader-0x54414C'],
      diagnosticMessage: 'Unsupported proprietary binary data file. Native Tally runtime required or export via standard XML/JSON/XLSX.',
      recoverableMetadata: {}
    };
  }

  res.json({ success: true, data: analysis });
});

universalConnectorRouter.get('/import/datasets', (req: Request, res: Response) => {
  res.json({ success: true, data: importedDatasetsList });
});

universalConnectorRouter.get('/adapters', (req: Request, res: Response) => {
  res.json({ success: true, data: adapterRegistry });
});

universalConnectorRouter.get('/audits', (req: Request, res: Response) => {
  res.json({ success: true, data: { audits: auditLogsList, blockedWrites: blockedWriteLogs } });
});

// Strict Read-Only Guard
universalConnectorRouter.all('/write-block/*', (req: Request, res: Response) => {
  const blockedLog: BlockedWriteLog = {
    logId: `blk-${Date.now()}`,
    timestamp: new Date().toISOString(),
    connectionId: 'conn-01',
    endpointAttempted: req.path,
    requestPayloadPreview: JSON.stringify(req.body || {}).slice(0, 120),
    status: 'BLOCKED_WRITE_ATTEMPT',
    auditAction: 'Blocked by Read-Only Tally Guard'
  };

  blockedWriteLogs.unshift(blockedLog);
  auditLogsList.unshift({
    logId: `aud-conn-${Date.now()}`,
    timestamp: new Date().toISOString(),
    connectionId: 'conn-01',
    action: 'Blocked Write',
    actor: 'Security Enforcer',
    details: `Blocked unauthorized write attempt on ${req.path}.`
  });

  res.status(403).json({
    success: false,
    error: 'SECURITY VIOLATION: Tally write operations strictly prohibited. All connector ingestion operates read-only.'
  });
});
