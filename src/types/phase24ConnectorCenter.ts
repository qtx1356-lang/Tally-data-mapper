// Phase 24 — Enterprise Tally Integration & Connector SDK Type Definitions
// Strictly Read-Only Architecture

export type ConnectorProtocol = 'HTTP' | 'HTTPS' | 'ODBC' | 'Mock';
export type ConnectionStatus = 'Connected' | 'Degraded' | 'Offline' | 'Authentication Required' | 'Protocol Error' | 'Configuration Error' | 'Connecting';
export type CircuitBreakerState = 'Closed' | 'Open' | 'Half-Open';
export type RequestPriority = 'Interactive' | 'Background' | 'Sync' | 'Discovery';
export type SyncStatus = 'Queued' | 'Running' | 'Completed' | 'Partial' | 'Failed' | 'Cancelled';
export type SyncMode = 'Quick' | 'Full' | 'Incremental';
export type CapabilityStatus = 'Supported' | 'Unsupported' | 'Unknown';
export type TallyProductType = 'TallyPrime' | 'Tally.ERP 9' | 'Tally 9' | 'Tally.Server 9' | 'Unknown';
export type ReadOnlyPolicyAction = 'READ' | 'WRITE';

// Core Connection Model
export interface TallyConnection {
  connectionId: string;
  name: string;
  host: string;
  port: number;
  protocol: ConnectorProtocol;
  status: ConnectionStatus;
  tallyProduct: TallyProductType;
  tallyVersion: string;
  tallyBuild?: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault: boolean;
  connectionType: 'Local' | 'LAN' | 'Remote Gateway' | 'Mock';
  circuitBreaker: {
    state: CircuitBreakerState;
    failureCount: number;
    lastFailureTime?: string;
    nextRetryTime?: string;
    tripThreshold: number; // e.g. 5
    resetTimeoutMs: number; // e.g. 30000
  };
  metrics: {
    connectionTimeMs: number;
    requestTimeMs: number;
    responseTimeMs: number;
    totalRequests: number;
    successRate: number;
    activePoolConnections: number;
    maxPoolConnections: number;
  };
  timeouts: {
    connectTimeoutMs: number;
    requestTimeoutMs: number;
    discoveryTimeoutMs: number;
    syncTimeoutMs: number;
  };
  retryConfig: {
    maxRetries: number;
    backoffBaseMs: number;
    backoffMaxMs: number;
  };
}

// Company Model with Strict Isolation
export interface TallyCompanyContext {
  companyId: string;
  tallyConnectionId: string;
  name: string;
  identifier: string; // Tally internal ID or directory name
  formalName?: string;
  currency: string;
  currencySymbol: string;
  fiscalYearStart: string; // YYYY-MM-DD
  fiscalYearEnd: string;
  booksFrom: string;
  status: 'Active' | 'Closed' | 'Archived' | 'Syncing';
  lastSync?: string;
  dataFreshness: 'Live' | 'Fresh' | 'Stale' | 'Offline';
  datasetChecksum?: string;
  recordCounts: {
    ledgers: number;
    vouchers: number;
    stockItems: number;
    costCentres: number;
    groups: number;
  };
}

// Version & Capability Model
export interface TallyCapabilityMatrix {
  connectionId: string;
  product: TallyProductType;
  version: string;
  build: string;
  capabilities: Record<TallyCapabilityType, {
    status: CapabilityStatus;
    notes?: string;
    minVersionRequired?: string;
  }>;
  detectedAt: string;
}

export type TallyCapabilityType =
  | 'CompanyList'
  | 'LedgerQuery'
  | 'VoucherQuery'
  | 'StockQuery'
  | 'GroupQuery'
  | 'DayBook'
  | 'BalanceSheet'
  | 'ProfitLoss'
  | 'Outstanding'
  | 'GST'
  | 'TDLReport'
  | 'CostCentreBreakdown'
  | 'BillWiseDetails'
  | 'BatchInventory'
  | 'MultiCurrency';

// Connector Adapter Registry Model
export interface ConnectorAdapter {
  adapterId: string;
  name: string;
  version: string;
  author: string;
  supportedProducts: TallyProductType[];
  supportedProtocols: ConnectorProtocol[];
  supportedCapabilities: TallyCapabilityType[];
  status: 'Active' | 'Deprecated' | 'Beta' | 'Fallback';
  isDefault: boolean;
  rollbackVersion?: string;
  signatureVerified: boolean;
  description: string;
}

// Canonical Internal Entities
export interface CanonicalEntityHeader {
  source: string;
  connectionId: string;
  companyId: string;
  tallyVersion: string;
  adapterVersion: string;
  retrievedAt: string;
}

export interface CanonicalLedger {
  header: CanonicalEntityHeader;
  ledgerId: string;
  name: string;
  parentGroup: string;
  primaryGroup: string;
  openingBalance: number;
  closingBalance: number;
  isDebit: boolean;
  currency: string;
  gstin?: string;
  state?: string;
  creditLimit?: number;
  creditPeriodDays?: number;
  isBillWise: boolean;
  customFields?: Record<string, any>;
}

export interface CanonicalVoucher {
  header: CanonicalEntityHeader;
  voucherId: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  effectiveDate: string;
  narration: string;
  partyLedgerName?: string;
  totalAmount: number;
  isCancelled: boolean;
  lines: CanonicalVoucherLine[];
  customFields?: Record<string, any>;
}

export interface CanonicalVoucherLine {
  lineId: string;
  ledgerName: string;
  amount: number;
  isDebit: boolean;
  costCentre?: string;
  stockItem?: string;
  quantity?: number;
  rate?: number;
  unit?: string;
  billRefs?: {
    billType: 'New Ref' | 'Agst Ref' | 'Advance' | 'On Account';
    billNumber: string;
    amount: number;
  }[];
}

// Snapshot & Sync Model
export interface TallyDatasetSnapshot {
  snapshotId: string;
  connectionId: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  dataPeriod: {
    from: string;
    to: string;
    label: string;
  };
  adapterVersion: string;
  status: 'Complete' | 'Partial' | 'Stale' | 'Corrupted';
  recordCounts: {
    ledgers: number;
    vouchers: number;
    groups: number;
    stockItems: number;
    costCentres: number;
  };
  checksum: string;
  sizeBytes: number;
  isOfflineAvailable: boolean;
  validationPassed: boolean;
  validationNotes: string[];
}

export interface SyncJobState {
  jobId: string;
  connectionId: string;
  companyId: string;
  mode: SyncMode;
  period: string;
  status: SyncStatus;
  progressPercent: number;
  entitiesProcessed: {
    entity: string;
    processed: number;
    totalEstimated: number;
    failed: number;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  }[];
  startedAt: string;
  completedAt?: string;
  recordsTransferred: number;
  warnings: string[];
  errors: string[];
  canResume: boolean;
  bytesTransferred: number;
}

// TDL & Custom Report Adapter Model
export interface TDLReportAdapter {
  tdlId: string;
  name: string;
  tallyReportName: string;
  version: string;
  companyScope: 'All' | string; // Company ID or 'All'
  status: 'Active' | 'Draft' | 'Deprecated';
  discoveredAt: string;
  fields: TDLFieldMapping[];
  confidenceScore: number; // 0 - 100
  sampleResponseSnippet?: string;
}

export interface TDLFieldMapping {
  fieldId: string;
  sourceTDLName: string;
  sourceDataType: 'String' | 'Number' | 'Date' | 'Amount' | 'Boolean';
  canonicalFieldName: string;
  canonicalCategory: 'Ledger' | 'Voucher' | 'Inventory' | 'Tax' | 'Custom';
  mappingStatus: 'Mapped' | 'Unmapped' | 'Conflict' | 'Ignored';
  sampleValue?: string | number;
  isRequired: boolean;
  notes?: string;
}

export interface SchemaDiffReport {
  detectedAt: string;
  connectionId: string;
  companyId: string;
  previousVersion: string;
  currentVersion: string;
  addedFields: string[];
  removedFields: string[];
  changedTypes: { field: string; oldType: string; newType: string }[];
  renamedCandidates: { oldName: string; suggestedNewName: string; similarity: number }[];
  impactRating: 'Low' | 'Medium' | 'High' | 'Breaking';
  requiresMappingUpdate: boolean;
}

// 7-Point Diagnostic Suite
export interface ConnectorDiagnosticResult {
  correlationId: string;
  connectionId: string;
  testedAt: string;
  overallPassed: boolean;
  totalDurationMs: number;
  steps: {
    stepNumber: number;
    name: string;
    description: string;
    passed: boolean;
    durationMs: number;
    details: string;
    rawDataSnippet?: string;
  }[];
}

// Consolidated Portfolio Model
export interface CompanyPortfolioSummary {
  totalConfiguredInstances: number;
  healthyInstances: number;
  totalCompanies: number;
  activeCompanies: number;
  consolidatedMetrics: {
    totalRevenue: number;
    totalReceivables: number;
    totalPayables: number;
    netWorkingCapital: number;
    baseCurrency: string;
    currencyCompatibilityStatus: 'Compatible' | 'Multi-Currency Normalized' | 'Incompatible Mismatch';
    periodCompatibilityStatus: 'Aligned' | 'Staggered FY' | 'Mismatched';
    isSafelyConsolidatable: boolean;
    constituentCompanies: {
      companyId: string;
      name: string;
      currency: string;
      revenue: number;
      receivables: number;
      payables: number;
      sharePercent: number;
      freshness: string;
    }[];
  };
  recentAlertsCount: number;
}

// Security & Audit Log Model
export interface ConnectorAuditEntry {
  auditId: string;
  timestamp: string;
  userId: string;
  action:
    | 'Connection Created'
    | 'Connection Modified'
    | 'Connection Deleted'
    | 'Connection Tested'
    | 'Company Discovered'
    | 'Company Switched'
    | 'Sync Started'
    | 'Sync Completed'
    | 'Sync Cancelled'
    | 'Query Executed'
    | 'Mapping Changed'
    | 'TDL Adapter Created'
    | 'TDL Adapter Modified'
    | 'Circuit Breaker Tripped'
    | 'Circuit Breaker Reset'
    | 'Write Attempt Blocked';
  connectionId?: string;
  companyId?: string;
  details: string;
  status: 'Success' | 'Warning' | 'Blocked' | 'Failure';
  ipAddress?: string;
  correlationId?: string;
}

// Connector SDK Interfaces
export interface ITallyTransport {
  sendRequest(payload: string, options: { timeoutMs: number; correlationId: string }): Promise<{
    statusCode: number;
    data: string;
    latencyMs: number;
    headers?: Record<string, string>;
  }>;
}

export interface ITallyAdapter {
  adapterId: string;
  version: string;
  detectCapabilities(transport: ITallyTransport): Promise<TallyCapabilityMatrix>;
  fetchCompanies(transport: ITallyTransport): Promise<TallyCompanyContext[]>;
  fetchLedgers(transport: ITallyTransport, companyId: string): Promise<CanonicalLedger[]>;
  fetchVouchers(transport: ITallyTransport, companyId: string, fromDate: string, toDate: string): Promise<CanonicalVoucher[]>;
}

export interface IConnectorHealthMonitor {
  checkHealth(connection: TallyConnection): Promise<{
    status: ConnectionStatus;
    latencyMs: number;
    circuitState: CircuitBreakerState;
    error?: string;
  }>;
}
