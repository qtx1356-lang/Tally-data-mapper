/**
 * EXFIN Tally Audit Platform - Web Deployment Configuration
 * Defines production cloud deployment specs, network exposure rules,
 * security boundaries, health endpoints, and storage profiles.
 */

export interface WebDeploymentConfiguration {
  metadata: {
    name: string;
    productName: string;
    version: string;
    description: string;
    targetArchitecture: 'web' | 'desktop' | 'hybrid';
  };
  server: {
    defaultPort: number;
    host: string;
    dynamicPortResolution: boolean;
    nodeEnv: string;
  };
  security: {
    tallyPort9000ExposedPublicly: boolean;
    directPort9000Policy: string;
    ssrfProtectionEnabled: boolean;
    readOnlyIntegrations: boolean;
  };
  endpoints: {
    health: string[];
    offlineImport: string[];
    tallyGateway: string[];
  };
  dataIngestion: {
    primaryWebPathway: string;
    supportedOfflineFormats: string[];
    streamingMemoryBudgetMb: number;
    maxUploadSizeMb: number;
  };
}

export const webDeploymentConfig: WebDeploymentConfiguration = {
  metadata: {
    name: 'exfin-tally-audit-platform',
    productName: 'EXFIN Tally Audit Platform',
    version: '1.0.1',
    description: 'Enterprise Financial Audit & Tally Intelligence Platform for Cloud Web and Desktop Environments',
    targetArchitecture: 'hybrid'
  },
  server: {
    defaultPort: 3000,
    host: '0.0.0.0',
    dynamicPortResolution: false,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  security: {
    tallyPort9000ExposedPublicly: false,
    directPort9000Policy: 'Tally Port 9000 is strictly reserved for local Desktop/LAN operation and is never exposed directly as a public listener in Cloud Web Deployment.',
    ssrfProtectionEnabled: true,
    readOnlyIntegrations: true
  },
  endpoints: {
    health: ['/api/health', '/health', '/api/healthz', '/api/system/deployment-info'],
    offlineImport: [
      '/api/import/upload-and-parse',
      '/api/import/commit-session',
      '/api/import/sessions',
      '/api/offline-dataset/list',
      '/api/offline-dataset/query',
      '/api/offline-dataset/active'
    ],
    tallyGateway: [
      '/api/tally/test-connection',
      '/api/tally/companies',
      '/api/tally/execute-xml'
    ]
  },
  dataIngestion: {
    primaryWebPathway: 'Offline Data Import (XML DayBook/Masters, JSON DayBook/Collections, Excel P&L/Ledgers/Trial Balance)',
    supportedOfflineFormats: ['XML', 'JSON', 'EXCEL', 'CSV', 'JSONL'],
    streamingMemoryBudgetMb: 128,
    maxUploadSizeMb: 500
  }
};
