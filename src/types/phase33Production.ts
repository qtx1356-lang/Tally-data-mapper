/**
 * Phase 33: Production Desktop Architecture Types
 */

export interface AppDiagnostics {
  appVersion: string;
  buildNumber: string;
  desktopRuntime: string;
  osDetails: string;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  tallyStatus: 'OFFLINE' | 'CONNECTED' | 'ERROR' | 'LOCAL_PORT_9000_STANDBY' | 'CLOUD_WEB_OFFLINE_DATASET_READY' | 'DESKTOP_READY' | 'WEB_MODE_OFFLINE_INGESTION';
  databaseStatus: 'MOCKED_MEMORY' | 'SQLITE_READY' | 'ERROR' | 'DISK_BOUNDED_JSONL' | 'PERSISTENT_JSONL_STORAGE';
  lastErrors: string[];
  deploymentMode?: 'web' | 'desktop';
}

export interface SupportBundle {
  diagnosticId: string;
  generatedAt: string;
  diagnostics: AppDiagnostics;
  sanitizedLogs: string[];
  safeConfigStatus: any;
}

export interface LicenseInfo {
  productName: string;
  edition: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'TRIAL' | 'LICENSED' | 'EXPIRED' | 'DISABLED';
  expiryDate: string | null;
  features: string[];
}

export interface AppSettings {
  logLevel: 'INFO' | 'WARNING' | 'ERROR';
  offlineCacheEnabled: boolean;
  defaultExportPath: string;
  autoUpdateEnabled: boolean;
}
