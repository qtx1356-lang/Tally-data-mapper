/**
 * Phase 28: Universal Tally Connector, Protocols, Ingestion, Snapshots & SDK Types
 */

export type ProtocolType = 'HTTP' | 'HTTPS' | 'Local IPC' | 'File Import';
export type ConnectionStatus = 'Connected' | 'Reachable' | 'Not Reachable' | 'Timeout' | 'Authentication Issue' | 'Unsupported Protocol';
export type CapabilityStatus = 'Available' | 'Unavailable' | 'Unknown' | 'Requires Test';
export type DatasetStatus = 'Staging' | 'Validated' | 'Published' | 'Archived';
export type SnapshotStatus = 'Preparing' | 'Downloading' | 'Parsing' | 'Normalizing' | 'Indexing' | 'Validating' | 'Complete' | 'Failed';

export interface TallyVersionInfo {
  major: number;
  minor: number;
  patch?: number;
  edition: string; // e.g. "TallyPrime Server 4.1", "TallyPrime 3.0", "Tally.ERP 9 Release 6.6"
  build: string;
  isDetected: boolean;
  rawString?: string;
}

export interface CompatibilityItem {
  tallyVersion: string;
  isSupported: boolean;
  recommendedProtocol: ProtocolType;
  capabilities: string[];
  limitations: string;
}

export interface DiscoveredCompany {
  companyId: string;
  name: string;
  financialYear: string;
  booksBeginning: string;
  baseCurrency: string;
  address?: string;
  tallyVersion: string;
  isFavorite?: boolean;
  status: 'Connected' | 'Available' | 'Unavailable' | 'Permission Issue';
  lastSyncAt: string;
}

export interface TallyCapability {
  id: string;
  name: string;
  category: 'Masters' | 'Transactions' | 'Inventory' | 'Taxation' | 'Payroll' | 'Custom Reports';
  status: CapabilityStatus;
  details: string;
  latencyMs?: number;
  lastTestedAt?: string;
}

export interface ConnectionModel {
  connectionId: string;
  name: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  status: ConnectionStatus;
  tallyVersion: TallyVersionInfo;
  discoveredCompanies: DiscoveredCompany[];
  activeCompanyId?: string;
  capabilities: TallyCapability[];
  latencyMs: number;
  lastConnected: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticsReport {
  connectionId: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  latencyMs: number;
  versionInfo: TallyVersionInfo;
  activeCompaniesCount: number;
  discoveredCapabilitiesCount: number;
  lastResponseCode: number;
  lastResponseDurationMs: number;
  sslCertificateStatus?: string;
  securityGuardStatus: string;
}

export interface TallySnapshot {
  snapshotId: string;
  companyId: string;
  companyName: string;
  connectionId: string;
  period: string;
  tallyVersion: string;
  recordCount: number;
  storageSizeBytes: number;
  integrityHash: string; // SHA-256
  domains: string[];
  status: SnapshotStatus;
  createdAt: string;
  immutableVersion: number;
}

export interface SnapshotDiff {
  snapshotAId: string;
  snapshotBId: string;
  addedRecordsCount: number;
  removedRecordsCount: number;
  modifiedRecordsCount: number;
  deltaSummary: string;
}

export interface DatasetField {
  fieldName: string;
  canonicalName: string;
  inferredType: 'Text' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean';
  sampleValues: any[];
  confidence: 'High' | 'Medium' | 'Low';
  nullCount: number;
  uniqueCount: number;
}

export interface ImportedDataset {
  datasetId: string;
  name: string;
  sourceFormat: 'XML' | 'JSON' | 'CSV' | 'XLSX' | 'TXT' | 'Tally Backup';
  companyId: string;
  schemaVersion: string;
  recordCount: number;
  status: DatasetStatus;
  fields: DatasetField[];
  validationErrors: { row: number; field: string; error: string; severity: 'Warning' | 'Error' }[];
  stagingRollbackAvailable: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface DataFileAnalysis {
  fileName: string;
  fileSizeBytes: number;
  detectedFormat: 'Known Tally XML' | 'Known Tally JSON' | 'Standard CSV/XLSX' | 'Encrypted Tally Backup' | 'Unsupported Proprietary Binary';
  isParsable: boolean;
  encoding: string;
  recognizedSignatures: string[];
  diagnosticMessage: string;
  recoverableMetadata?: Record<string, any>;
}

export interface AdapterMetadata {
  adapterId: string;
  name: string;
  version: string;
  author: string;
  supportedProtocols: ProtocolType[];
  supportedTallyVersions: string[];
  isProductionApproved: boolean;
  health: 'Healthy' | 'Warning' | 'Failed';
}

export interface BlockedWriteLog {
  logId: string;
  timestamp: string;
  connectionId: string;
  endpointAttempted: string;
  requestPayloadPreview: string;
  status: 'BLOCKED_WRITE_ATTEMPT';
  auditAction: 'Blocked by Read-Only Tally Guard';
}

export interface ConnectionAuditLog {
  logId: string;
  timestamp: string;
  connectionId: string;
  action: 'Connect' | 'Disconnect' | 'Test' | 'Company Selection' | 'Import' | 'Snapshot' | 'Blocked Write';
  actor: string;
  details: string;
}
