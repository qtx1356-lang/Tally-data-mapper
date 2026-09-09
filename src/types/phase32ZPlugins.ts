/**
 * Phase 32Z: Universal Tally Integration Marketplace & Plugin Framework Types
 */

export type PluginState = 
  | 'DISCOVERED'
  | 'INSTALLED'
  | 'VALIDATING'
  | 'ENABLED'
  | 'DISABLED'
  | 'FAILED'
  | 'INCOMPATIBLE'
  | 'QUARANTINED'
  | 'REMOVED';

export type PluginCapability = 
  | 'company.read'
  | 'dataset.read'
  | 'report.create'
  | 'report.read'
  | 'dashboard.create'
  | 'analytics.read'
  | 'export.create'
  | 'notification.send'
  | 'webhook.register'
  | 'connector.read'
  | 'schema.read';

export interface PluginManifest {
  pluginId: string;
  name: string;
  displayName: string;
  version: string;
  publisher: string;
  description: string;
  compatibility: {
    minAppVersion: string;
    maxTestedAppVersion: string;
    requiredApiVersion: string;
    requiredSdkVersion: string;
  };
  capabilities: PluginCapability[];
  dependencies: Record<string, string>; // pluginId -> version semver
  signatureStatus: 'VERIFIED' | 'UNVERIFIED' | 'INVALID' | 'MISSING';
  checksum: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstalledPlugin extends PluginManifest {
  state: PluginState;
  installDate: string;
  lastError: string | null;
  resourceUsage: {
    cpuPercent: number;
    memoryMb: number;
  };
}

export interface ConnectorModel {
  connectorId: string;
  name: string;
  version: string;
  provider: string;
  capabilities: string[];
  status: 'CONNECTED' | 'DISCONNECTED' | 'AUTHENTICATION_FAILED' | 'UNAVAILABLE' | 'ERROR';
  companies: string[];
  lastSync: string;
}

export interface MarketplacePlugin extends PluginManifest {
  rating: number;
  downloads: number;
  isOfficial: boolean;
}
