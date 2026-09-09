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
  tallyStatus: 'OFFLINE' | 'CONNECTED' | 'ERROR';
  databaseStatus: 'MOCKED_MEMORY' | 'SQLITE_READY' | 'ERROR';
  lastErrors: string[];
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
