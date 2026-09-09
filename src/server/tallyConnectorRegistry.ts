/**
 * Phase 32J - Tally Connector Registry
 * Manages registered connectors, priority routing, active profiles, and company switch contexts.
 */

import {
  ITallyConnector,
  ConnectorType,
  ConnectorStatus,
  ConnectionProfile,
  RegisteredConnectorInfo,
  TallyCompany,
  TallyCapability,
  ConnectorDiagnostics
} from '../types/phase32JConnector';
import { TallyXmlHttpConnector } from './connectors/TallyXmlHttpConnector';
import { TallyOdbcConnector } from './connectors/TallyOdbcConnector';
import { TallyJsonApiConnector } from './connectors/TallyJsonApiConnector';
import { TallyFileConnector } from './connectors/TallyFileConnector';
import { queryResultCache } from './queryResultCache';
import { auditEngine } from './auditEngine';

export class TallyConnectorRegistry {
  private connectors: Map<string, RegisteredConnectorInfo> = new Map();
  private profiles: Map<string, ConnectionProfile> = new Map();
  private activeProfileId: string | null = null;
  private activeCompanyId: string = 'CMP-001';
  private selectedCompanies: string[] = ['CMP-001'];

  constructor() {
    this.registerDefaultConnectors();
    this.registerDefaultProfiles();
  }

  private registerDefaultConnectors(): void {
    const xml = new TallyXmlHttpConnector();
    const odbc = new TallyOdbcConnector();
    const json = new TallyJsonApiConnector();
    const file = new TallyFileConnector();

    this.registerConnector(xml, 1);
    this.registerConnector(odbc, 2);
    this.registerConnector(json, 3);
    this.registerConnector(file, 4);
  }

  private registerDefaultProfiles(): void {
    const now = new Date().toISOString();
    const defaultProfiles: ConnectionProfile[] = [
      {
        id: 'PROF-XML-LOCAL',
        name: 'Local Tally XML HTTP (Port 9000)',
        connectorType: 'TALLY_XML',
        host: 'localhost',
        port: 9000,
        companyScope: ['CMP-001'],
        timeoutMs: 5000,
        readOnly: true,
        priority: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'PROF-ODBC-LOCAL',
        name: 'Local Tally ODBC DSN',
        connectorType: 'TALLY_ODBC',
        host: 'localhost',
        port: 0,
        databaseScope: 'TallyODBC_9000',
        companyScope: ['CMP-001'],
        timeoutMs: 5000,
        readOnly: true,
        priority: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'PROF-JSON-API',
        name: 'Local JSON API Gateway',
        connectorType: 'JSON_API',
        host: 'localhost',
        port: 8080,
        timeoutMs: 5000,
        readOnly: true,
        priority: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'PROF-FILE-DEFAULT',
        name: 'Local Exported File Source',
        connectorType: 'FILE_SOURCE',
        host: 'localhost',
        port: 0,
        filePath: '/exports/tally_vouchers.xml',
        fileFormat: 'XML',
        timeoutMs: 5000,
        readOnly: true,
        priority: 4,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const prof of defaultProfiles) {
      this.saveProfile(prof);
    }

    this.activeProfileId = 'PROF-XML-LOCAL';
  }

  public registerConnector(connector: ITallyConnector, priority: number): void {
    this.connectors.set(connector.id, {
      connectorId: connector.id,
      type: connector.type,
      name: connector.name,
      version: connector.version,
      availability: true,
      status: 'DISCONNECTED',
      capabilities: [],
      priority,
      instance: connector
    });
  }

  public listConnectors(): RegisteredConnectorInfo[] {
    return Array.from(this.connectors.values()).sort((a, b) => a.priority - b.priority);
  }

  public getConnector(connectorId: string): RegisteredConnectorInfo | undefined {
    return this.connectors.get(connectorId);
  }

  public getActiveConnector(): RegisteredConnectorInfo | undefined {
    const profile = this.getActiveProfile();
    if (!profile) return this.listConnectors()[0];
    const match = Array.from(this.connectors.values()).find((c) => c.type === profile.connectorType);
    return match || this.listConnectors()[0];
  }

  public saveProfile(profile: ConnectionProfile): ConnectionProfile {
    // Validate profile for read-only safety
    const validatedProfile: ConnectionProfile = {
      ...profile,
      readOnly: true, // Always enforce read-only
      updatedAt: new Date().toISOString()
    };
    this.profiles.set(validatedProfile.id, validatedProfile);
    return validatedProfile;
  }

  public listProfiles(): ConnectionProfile[] {
    return Array.from(this.profiles.values()).sort((a, b) => a.priority - b.priority);
  }

  public getActiveProfile(): ConnectionProfile | undefined {
    if (!this.activeProfileId) return undefined;
    return this.profiles.get(this.activeProfileId);
  }

  public setActiveProfile(profileId: string): ConnectionProfile {
    const prof = this.profiles.get(profileId);
    if (!prof) throw new Error(`Connection profile '${profileId}' not found.`);
    this.activeProfileId = profileId;
    return prof;
  }

  /**
   * Safe Company Switch context handling.
   * Invalidates live query/report caches for company changes without destroying local warehouse data.
   */
  public switchCompany(companyId: string, additionalCompanies: string[] = []): void {
    const prevCompany = this.activeCompanyId;
    this.activeCompanyId = companyId;
    this.selectedCompanies = Array.from(new Set([companyId, ...additionalCompanies]));

    // Invalidate live query cache for clean company context transition
    queryResultCache.clear();

    auditEngine.recordEvent({
      action: 'CONFIGURATION_CHANGE',
      user: 'SYSTEM',
      companyId,
      result: 'SUCCESS',
      severity: 'INFO',
      correlationId: `CORR-COMP-SWITCH-${Date.now()}`,
      details: { previousCompany: prevCompany, newCompany: companyId, selectedCompanies: this.selectedCompanies }
    });
  }

  public getActiveCompanyId(): string {
    return this.activeCompanyId;
  }

  public getSelectedCompanies(): string[] {
    return this.selectedCompanies;
  }

  public async runDiagnostics(): Promise<ConnectorDiagnostics[]> {
    const results: ConnectorDiagnostics[] = [];
    const profiles = this.listProfiles();

    for (const profile of profiles) {
      const connInfo = Array.from(this.connectors.values()).find((c) => c.type === profile.connectorType);
      if (!connInfo) continue;

      const testRes = await connInfo.instance.testConnection(profile);
      const caps = testRes.status === 'Connected' ? await connInfo.instance.discoverCapabilities() : [];
      const companies = testRes.status === 'Connected' ? await connInfo.instance.discoverCompanies() : [];

      // Update internal status
      connInfo.status = testRes.status === 'Connected' ? 'CONNECTED' : 'UNAVAILABLE';
      connInfo.capabilities = caps;

      results.push({
        connectorId: connInfo.connectorId,
        connectorType: profile.connectorType,
        endpoint: `${profile.host}:${profile.port || 'ODBC'}`,
        latencyMs: testRes.latencyMs,
        tallyAvailable: testRes.status === 'Connected',
        detectedVersion: testRes.version || 'Unknown',
        companyCount: companies.length,
        capabilityCount: caps.length,
        status: connInfo.status,
        lastSuccessfulConnection: testRes.status === 'Connected' ? new Date().toISOString() : null,
        lastError: testRes.status !== 'Connected' ? testRes.message : undefined
      });
    }

    return results;
  }
}

export const tallyConnectorRegistry = new TallyConnectorRegistry();
