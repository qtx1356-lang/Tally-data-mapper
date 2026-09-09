export type ConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Busy'
  | 'Degraded'
  | 'Error';

export type TallyProtocol = 'HTTP' | 'HTTPS' | 'ODBC' | 'Mock';

export type RelationshipConfidence = 'Confirmed' | 'High' | 'Medium' | 'Low';

export type DiscoveryLevel = 'Quick' | 'Full';

export type DiscoveryStatus = 'Complete' | 'Partial' | 'Failed';

export interface TimeoutConfig {
  connectionTimeoutSeconds: number; // default 5
  requestTimeoutSeconds: number; // default 15
  discoveryTimeoutSeconds: number; // default 60
  exportTimeoutSeconds: number; // default 120
}

export interface RetryPolicy {
  maxRetries: number; // default 3
  backoffFactorMs: number; // default 500
  retryTransientOnly: boolean;
}

export interface TallyConnectionProfile {
  id: string;
  name: string; // e.g. "Office Tally", "Server Tally", "Test Tally"
  host: string; // e.g. "localhost" or LAN IP
  port: number; // e.g. 9000
  protocol: TallyProtocol;
  company: string;
  companyContextId: string;
  lastSuccessfulConnection?: string;
  detectedVersion: string;
  detectedProduct: string;
  status: ConnectionState;
  isDefault: boolean;
  autoConnect: boolean;
  timeouts: TimeoutConfig;
  retryPolicy: RetryPolicy;
  isMock?: boolean;
}

export interface TallyCapabilities {
  canQueryCollections: boolean;
  canReadLedgers: boolean;
  canReadVouchers: boolean;
  canReadInventory: boolean;
  canReadGST: boolean;
  canReadPayroll: boolean;
  canReadCustomOutputs: boolean;
  supportsXml: boolean;
  supportsJson: boolean;
  supportsOdbc: boolean;
  verifiedAt: string;
}

export interface TallyVersionInfo {
  product: string; // TallyPrime, Tally.ERP 9, Legacy Tally
  version: string; // e.g. 4.1, 3.0, 2.1, 9.0
  build: string; // e.g. "Release 4.1 (64-Bit)"
  protocolCharacteristics: string;
  detectedCapabilities: string[];
}

export interface ConnectionDiagnostics {
  profileId: string;
  host: string;
  port: number;
  protocol: TallyProtocol;
  latencyMs: number;
  detectedProduct: string;
  detectedVersion: string;
  responseStatus: string;
  protocolStatus: string;
  isReachable: boolean;
  state: ConnectionState;
  errorClassification?:
    | 'CONNECTION_FAILED'
    | 'TIMEOUT'
    | 'INVALID_RESPONSE'
    | 'UNSUPPORTED_VERSION'
    | 'PERMISSION_DENIED'
    | 'MALFORMED_XML'
    | 'MALFORMED_JSON'
    | 'DISCOVERY_PARTIAL'
    | 'SCHEMA_CHANGED'
    | 'REQUEST_REJECTED'
    | 'RESPONSE_TOO_LARGE'
    | 'NONE';
  userMessage?: string;
  technicalDetails?: string;
  checkedAt: string;
}

export interface TallyHealthStatus {
  isConnected: boolean;
  state: ConnectionState;
  responseTimeMs: number;
  lastSuccessfulRequest?: string;
  statusMessage: string;
  activeCompany: string;
  uptimeSeconds: number;
}

export interface RequestTemplate {
  templateId: string;
  category: 'Company' | 'Ledger' | 'Voucher' | 'Inventory' | 'GST' | 'Collection' | 'Object' | 'Report';
  protocolVersion: string;
  discoveryVersion: string;
  status: 'Active' | 'Deprecated';
  templateXml: string;
}

export interface NormalizedField {
  name: string;
  displayName: string;
  type: string; // Numeric, Date, String, Boolean, Variant Type
  value: any;
  sourcePath: string; // e.g. Voucher.InventoryEntries[0].Amount
  objectType: string;
  availability: 'Available' | 'Requires Licensing' | 'Unavailable';
}

export interface CollectionDefinition {
  name: string;
  parent?: string;
  itemType: string;
  fields: string[];
  sourcePath: string;
  nestedCollections?: CollectionDefinition[];
}

export interface NormalizedObject {
  objectId: string;
  objectType: string; // Ledger, Voucher, StockItem, Group, Company, Party, Tax, Bill, UnknownObject
  sourcePath: string;
  fields: Record<string, NormalizedField>;
  nestedObjects?: NormalizedObject[];
}

export interface NormalizedTallyResponse {
  status: 'SUCCESS' | 'EMPTY' | 'MALFORMED' | 'TIMEOUT' | 'CLOSED' | 'UNEXPECTED' | 'REJECTED';
  correlationId: string;
  metadata: {
    durationMs: number;
    responseSizeBytes: number;
    companyContextId: string;
    objectCount: number;
    protocol: string;
    timestamp: string;
  };
  objects: NormalizedObject[];
  collections: CollectionDefinition[];
  fields: NormalizedField[];
  errors: string[];
  rawReference?: string;
}

export interface InferredField {
  name: string;
  objectType: string;
  sourcePath: string;
  inferredType: 'Numeric' | 'Date' | 'Boolean' | 'String' | 'Variant Type' | 'Unknown';
  typeConfidence: number; // 0.0 - 1.0
  presencePercentage: number; // e.g. 92.4%
  nullability: 'Always Present' | 'Sometimes Missing' | 'Always Missing';
  sampleCount: number;
  sampleValues: string[];
  isSensitive: boolean; // Password, Token, Secret, API Key
  isFinancial: boolean; // Amount, Rate, Quantity, Balance, Tax
  isDate: boolean; // Voucher Date, Due Date, Order Date
  suggestedSemanticConcept?: string;
}

export interface InferredRelationship {
  sourceObject: string;
  sourceField: string;
  targetObject: string;
  targetField: string;
  cardinality: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  confidence: RelationshipConfidence;
  isInferred: boolean;
  joinPathExpression: string;
  explanation: string;
}

export interface InferredSchema {
  schemaVersion: string;
  schemaSignature: string; // SHA-256 hash
  companyIdentifier: string;
  inferredAt: string;
  sampleRecordCount: number;
  fields: InferredField[];
  relationships: InferredRelationship[];
  collections: CollectionDefinition[];
}

export interface DiscoveryProgress {
  isActive: boolean;
  level: DiscoveryLevel;
  progressPercentage: number;
  currentStage: string;
  stagesCompleted: string[];
  companyContextId: string;
  tallyVersion: string;
  objectsDiscovered: number;
  collectionsDiscovered: number;
  fieldsDiscovered: number;
  relationshipsInferred: number;
  customOutputsDiscovered: number;
  warnings: string[];
  status: DiscoveryStatus;
  canCancel: boolean;
  elapsedMs: number;
}

export interface ConnectorLogEntry {
  id: string;
  correlationId: string;
  timestamp: string;
  profileName: string;
  requestType: string;
  targetObject: string;
  durationMs: number;
  responseSizeBytes: number;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED' | 'TIMEOUT';
  readOnlyEnforced: boolean;
  errorSnippet?: string;
}

export interface AdminSupportPackage {
  packageVersion: string;
  generatedAt: string;
  applicationVersion: string;
  connectorVersion: string;
  operatingSystem: string;
  connectionConfigRedacted: {
    name: string;
    host: string;
    port: number;
    protocol: string;
    timeouts: TimeoutConfig;
  };
  capabilitySummary: TallyCapabilities;
  schemaSignature: string;
  tallyVersionInfo: TallyVersionInfo;
  errorSummary: {
    recentErrorCount: number;
    lastError?: string;
    lastErrorTime?: string;
  };
  performanceSummary: {
    avgLatencyMs: number;
    avgDiscoveryDurationMs: number;
    cacheHitRatePercentage: number;
    totalRequestsExecuted: number;
  };
  readOnlyVerificationNotice: string;
}

export interface CompatibilityMatrixRow {
  testedVersion: string;
  releaseDate: string;
  connectorAdapter: string;
  connection: boolean;
  discovery: boolean;
  query: boolean;
  reports: boolean;
  gst: 'Full' | 'Partial' | 'None';
  inventory: 'Full' | 'Partial' | 'None';
  customTdl: boolean;
  testNotes: string;
}
