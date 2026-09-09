/**
 * Phase 32M: Production Hardening & Windows Desktop Distribution Types
 */

export type LicenseState =
  | 'TRIAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'INVALID'
  | 'OFFLINE_GRACE'
  | 'UNLICENSED';

export interface LicenseInfo {
  licenseKey: string;
  status: LicenseState;
  edition: 'Standard' | 'Professional' | 'Enterprise';
  expirationDate: string;
  activatedDate: string;
  machineId: string;
  entitlements: {
    tallyConnector: boolean;
    advancedMapping: boolean;
    reports: boolean;
    dashboards: boolean;
    exports: boolean;
    multiCompany: boolean;
    advancedAnalytics: boolean;
  };
  trialDaysRemaining?: number;
}

export interface AppDiagnosticBundle {
  applicationVersion: string;
  osVersion: string;
  connectorStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  capabilitySummary: string[];
  recentErrors: Array<{
    errorId: string;
    timestamp: string;
    component: string;
    severity: string;
    message: string;
  }>;
  databaseVersion: string;
  migrationStatus: {
    currentVersion: number;
    targetVersion: number;
    history: string[];
  };
}

export interface ConnectionProfile {
  profileId: string;
  name: string;
  connector: 'tally-xml-http' | 'odbc' | 'rest-api';
  endpoint: string;
  port: number;
  timeoutMs: number;
  selectedCompanyId?: string;
  isDefault?: boolean;
}

export interface DesktopAppStatus {
  application: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  database: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  tally: 'ONLINE' | 'OFFLINE' | 'UNAVAILABLE';
  warehouse: 'AVAILABLE' | 'UNAVAILABLE';
  sync: 'IDLE' | 'ACTIVE' | 'PARTIAL' | 'ERROR';
  license: LicenseState;
}

export interface DesktopUpdateInfo {
  version: string;
  releaseDate: string;
  channel: 'Stable' | 'Beta';
  changes: string[];
  bugFixes: string[];
  securityFixes: string[];
  sizeBytes: number;
  hash: string;
}
