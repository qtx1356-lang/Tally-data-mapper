import { Router } from "express";
import { 
  InstalledPlugin, 
  MarketplacePlugin, 
  ConnectorModel 
} from "../types/phase32ZPlugins";

export const phase32zRouter = Router();

// Mock Internal State
const MOCK_INSTALLED_PLUGINS: InstalledPlugin[] = [
  {
    pluginId: 'com.exfin.packs.retail',
    name: 'exfin-retail-pack',
    displayName: 'EXFIN Retail Industry Pack',
    version: '1.2.0',
    publisher: 'EXFIN Corp',
    description: 'Adds retail-specific KPIs, dashboards, and schema maps for Tally data.',
    compatibility: {
      minAppVersion: '32.0.0',
      maxTestedAppVersion: '33.0.0',
      requiredApiVersion: 'v1',
      requiredSdkVersion: '1.0.0'
    },
    capabilities: ['dataset.read', 'report.create', 'dashboard.create', 'schema.read'],
    dependencies: {},
    signatureStatus: 'VERIFIED',
    checksum: 'sha256:abcd1234efgh5678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: 'ENABLED',
    installDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastError: null,
    resourceUsage: { cpuPercent: 0.1, memoryMb: 12.5 }
  },
  {
    pluginId: 'com.thirdparty.export.pdf-pro',
    name: 'pdf-pro-exporter',
    displayName: 'PDF Pro Advanced Export',
    version: '2.0.1',
    publisher: 'PDFSoft Inc.',
    description: 'High-performance PDF generation with custom watermarks.',
    compatibility: {
      minAppVersion: '30.0.0',
      maxTestedAppVersion: '32.9.9',
      requiredApiVersion: 'v1',
      requiredSdkVersion: '1.0.0'
    },
    capabilities: ['export.create', 'dataset.read'],
    dependencies: {},
    signatureStatus: 'VERIFIED',
    checksum: 'sha256:1122334455667788',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: 'DISABLED',
    installDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastError: null,
    resourceUsage: { cpuPercent: 0, memoryMb: 0 }
  },
  {
    pluginId: 'com.unknown.sketchy',
    name: 'sketchy-plugin',
    displayName: 'Sketchy Analytics',
    version: '0.1.0',
    publisher: 'Unknown',
    description: 'Provides totally real analytics. Trust me.',
    compatibility: {
      minAppVersion: '1.0.0',
      maxTestedAppVersion: '99.9.9',
      requiredApiVersion: 'v1',
      requiredSdkVersion: '1.0.0'
    },
    capabilities: ['dataset.read', 'company.read'],
    dependencies: {},
    signatureStatus: 'INVALID',
    checksum: 'sha256:deadbeef',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: 'QUARANTINED',
    installDate: new Date().toISOString(),
    lastError: 'Signature verification failed. Plugin isolated in sandbox.',
    resourceUsage: { cpuPercent: 0, memoryMb: 0 }
  }
];

const MOCK_CONNECTORS: ConnectorModel[] = [
  {
    connectorId: 'conn_tally_direct',
    name: 'TallyPrime Direct API Connector',
    version: '4.0.0',
    provider: 'EXFIN Core',
    capabilities: ['Company Discovery', 'Schema Discovery', 'Data Read', 'Incremental Read', 'Health Check'],
    status: 'CONNECTED',
    companies: ['comp_001', 'comp_003'],
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    connectorId: 'conn_erp_salesforce',
    name: 'Salesforce CRM Sync (Preview)',
    version: '0.9.0',
    provider: 'EXFIN Labs',
    capabilities: ['Data Read', 'Health Check'],
    status: 'DISCONNECTED',
    companies: [],
    lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// Management Routes
phase32zRouter.get("/plugins/installed", (req, res) => {
  res.json(MOCK_INSTALLED_PLUGINS);
});

phase32zRouter.get("/connectors", (req, res) => {
  res.json(MOCK_CONNECTORS);
});

phase32zRouter.post("/plugins/:id/enable", (req, res) => {
  res.json({ success: true, message: `Plugin ${req.params.id} enabled successfully in isolated sandbox.` });
});

phase32zRouter.post("/plugins/:id/disable", (req, res) => {
  res.json({ success: true, message: `Plugin ${req.params.id} disabled and processes terminated.` });
});
