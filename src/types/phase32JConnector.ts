/**
 * Phase 32J - Modular Tally Connector Layer & Connectivity Auto-Detection
 * Types & Interfaces
 */

export type ConnectorType =
  | 'TALLY_XML'
  | 'TALLY_ODBC'
  | 'JSON_API'
  | 'FILE_SOURCE'
  | 'CUSTOM_ADAPTER';

export type ConnectorStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'DEGRADED'
  | 'ERROR'
  | 'UNAVAILABLE';

export type ExtractionCompleteness = 'COMPLETE' | 'PARTIAL' | 'UNKNOWN';

export type ConnectionTestStatus =
  | 'Connected'
  | 'Unavailable'
  | 'Timeout'
  | 'Authentication Required'
  | 'Protocol Error'
  | 'Unsupported'
  | 'Unknown';

export type SourceErrorCategory =
  | 'Unavailable'
  | 'Timeout'
  | 'Invalid Request'
  | 'Unsupported'
  | 'Permission'
  | 'Malformed Data'
  | 'Server Error'
  | 'Unknown';

export type CommandClassification = 'READ' | 'WRITE' | 'UNKNOWN';

export type SourceType =
  | 'TALLY_XML_HTTP'
  | 'TALLY_ODBC'
  | 'JSON_API'
  | 'FILE_CSV'
  | 'FILE_XML'
  | 'FILE_JSON';

export interface ConnectionProfile {
  id: string;
  name: string;
  connectorType: ConnectorType;
  host: string;
  port: number;
  databaseScope?: string;
  companyScope?: string[];
  timeoutMs: number;
  readOnly: boolean; // Always true for Tally safety
  secureTransport?: boolean;
  authRequired?: boolean;
  secretKeyReference?: string; // Reference to secure secret store, no plaintext passwords
  filePath?: string;
  fileFormat?: 'JSON' | 'XML' | 'CSV';
  priority: number; // e.g. 1 (Tally XML) -> 2 (ODBC) -> 3 (JSON) -> 4 (File)
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorDiagnostics {
  connectorId: string;
  connectorType: ConnectorType;
  endpoint: string;
  latencyMs: number;
  tallyAvailable: boolean;
  detectedVersion: string;
  companyCount: number;
  capabilityCount: number;
  status: ConnectorStatus;
  lastSuccessfulConnection: string | null;
  lastError?: string;
}

export interface CapabilityEvidence {
  discoveredDataset?: string;
  successfulQuery?: string;
  schemaId?: string;
  outputDefinitionId?: string;
  sampleCount?: number;
}

export interface TallyCapability {
  capabilityId: string;
  name: string;
  available: boolean;
  source: SourceType;
  version: string;
  detectedAt: string;
  evidence: CapabilityEvidence;
}

export interface TallyCompany {
  companyId: string;
  companyName: string;
  sourceId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  available: boolean;
  tallyVersion?: string;
  financialYear?: string;
}

export interface ConnectorError {
  errorId: string;
  connector: string;
  companyId?: string;
  datasetId?: string;
  code: SourceErrorCategory;
  message: string;
  retryable: boolean;
  timestamp: string;
  correlationId: string;
  details?: Record<string, any>;
}

export interface ExtractionProgress {
  companyId: string;
  datasetId: string;
  recordsRead: number;
  currentBatch: number;
  totalBatches?: number;
  elapsedMs: number;
  errorsCount: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
}

export interface RawExtractionResult {
  extractionId: string;
  connectorId: string;
  profileId: string;
  sourceType: SourceType;
  sourceEndpoint: string;
  companyId: string;
  datasetId: string;
  recordsRead: number;
  batchCount: number;
  elapsedMs: number;
  completeness: ExtractionCompleteness;
  records: Record<string, any>[];
  rawResponseSample?: string;
  schemaVersion: number;
  correlationId: string;
  errors: ConnectorError[];
}

export interface RequestAuditLog {
  requestId: string;
  connectorId: string;
  companyId: string;
  operationType: CommandClassification;
  datasetId: string;
  timestamp: string;
  durationMs: number;
  result: 'SUCCESS' | 'REJECTED' | 'ERROR';
  rejectionReason?: string;
}

export interface ExtractionHandoffPayload {
  extractionResult: RawExtractionResult;
  profile: ConnectionProfile;
  schemaMetadata?: any;
  normalizedRecords?: any[];
  qualityResult?: any;
}

export interface ReadOnlyQueryRequest {
  queryText?: string;
  datasetId?: string;
  companyId?: string;
  params?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface ITallyConnector {
  id: string;
  type: ConnectorType;
  name: string;
  version: string;
  
  connect(profile: ConnectionProfile): Promise<boolean>;
  disconnect(): Promise<void>;
  testConnection(profile: ConnectionProfile): Promise<{
    status: ConnectionTestStatus;
    latencyMs: number;
    message: string;
    version?: string;
  }>;
  discoverCapabilities(companyId?: string): Promise<TallyCapability[]>;
  discoverCompanies(): Promise<TallyCompany[]>;
  discoverOutputs(companyId?: string): Promise<any[]>;
  discoverSchema(companyId?: string): Promise<any>;
  readDataset(
    companyId: string,
    datasetId: string,
    options?: {
      limit?: number;
      offset?: number;
      batchSize?: number;
      onProgress?: (progress: ExtractionProgress) => void;
    }
  ): Promise<RawExtractionResult>;
  executeReadOnlyQuery(request: ReadOnlyQueryRequest): Promise<any>;
}

export interface RegisteredConnectorInfo {
  connectorId: string;
  type: ConnectorType;
  name: string;
  version: string;
  availability: boolean;
  status: ConnectorStatus;
  capabilities: TallyCapability[];
  priority: number;
  instance: ITallyConnector;
}
