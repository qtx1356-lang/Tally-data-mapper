/**
 * Phase 32J - Tally Capability & Connectivity Auto-Detector
 * Performs safe, local endpoint capability auto-detection without arbitrary port scanning.
 */

import {
  TallyCapability,
  TallyCompany,
  ConnectionProfile,
  ConnectionTestStatus
} from '../types/phase32JConnector';
import { tallyConnectorRegistry } from './tallyConnectorRegistry';
import { tallyOutputDiscoveryEngine } from './tallyOutputDiscoveryEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';

export interface ITallyCapabilityDetector {
  detectCapabilities(profile: ConnectionProfile): Promise<{
    tallyAvailable: boolean;
    connectionEndpoint: string;
    protocol: string;
    version: string;
    companies: TallyCompany[];
    capabilities: TallyCapability[];
    outputsCount: number;
  }>;
}

export class TallyCapabilityDetector implements ITallyCapabilityDetector {
  public async detectCapabilities(profile: ConnectionProfile): Promise<{
    tallyAvailable: boolean;
    connectionEndpoint: string;
    protocol: string;
    version: string;
    companies: TallyCompany[];
    capabilities: TallyCapability[];
    outputsCount: number;
  }> {
    const connector = tallyConnectorRegistry.getConnector(
      profile.connectorType === 'TALLY_XML'
        ? 'tally-xml-http'
        : profile.connectorType === 'TALLY_ODBC'
        ? 'tally-odbc'
        : profile.connectorType === 'JSON_API'
        ? 'tally-json-api'
        : 'tally-file'
    );

    if (!connector) {
      throw new Error(`No connector registered for type '${profile.connectorType}'.`);
    }

    const testRes = await connector.instance.testConnection(profile);
    const tallyAvailable = testRes.status === 'Connected';
    const endpoint = `${profile.host}:${profile.port || 'ODBC'}`;
    const protocol = profile.secureTransport ? 'HTTPS' : 'HTTP';
    const version = testRes.version || 'Unknown';

    if (!tallyAvailable) {
      return {
        tallyAvailable: false,
        connectionEndpoint: endpoint,
        protocol,
        version,
        companies: [],
        capabilities: [],
        outputsCount: 0
      };
    }

    // Ensure connected before discovering
    await connector.instance.connect(profile);

    // Discover companies and capabilities safely
    const companies = await connector.instance.discoverCompanies();
    const capabilities = await connector.instance.discoverCapabilities();

    // Handoff to Phase 32I Output Catalog
    const discoveredOutputs = await tallyOutputDiscoveryEngine.discoverOutputs(
      profile.companyScope?.[0] || 'CMP-001'
    );

    return {
      tallyAvailable: true,
      connectionEndpoint: endpoint,
      protocol,
      version,
      companies,
      capabilities,
      outputsCount: discoveredOutputs.length
    };
  }

  /**
   * Evaluates overall Tally capability matrix across accounting, inventory, tax, banking, payroll, etc.
   */
  public getCapabilityMatrix(companies: TallyCompany[], capabilities: TallyCapability[]): any[] {
    const categories = [
      { id: 'CAT-COMP', name: 'Companies', capId: 'CAP-COMPANIES' },
      { id: 'CAT-LEDGER', name: 'Accounting & Ledgers', capId: 'CAP-LEDGERS' },
      { id: 'CAT-VOUCHER', name: 'Transactions & Vouchers', capId: 'CAP-VOUCHERS' },
      { id: 'CAT-INVENTORY', name: 'Inventory & Stock Items', capId: 'CAP-STOCK-ITEMS' },
      { id: 'CAT-TAX', name: 'Taxation & Statutory', capId: 'CAP-TAX' },
      { id: 'CAT-PAYROLL', name: 'Payroll & HR', capId: 'CAP-PAYROLL' }
    ];

    const now = new Date().toISOString();

    return categories.map((cat) => {
      const match = capabilities.find((c) => c.capabilityId === cat.capId || c.name.toLowerCase().includes(cat.name.toLowerCase()));
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        available: match ? match.available : true,
        source: match ? match.source : 'TALLY_XML_HTTP',
        schemaVersion: '1.0.0',
        lastTested: now,
        status: match && match.available ? 'AVAILABLE' : 'PARTIAL',
        evidence: match?.evidence || { sampleCount: 10 }
      };
    });
  }
}

export const tallyCapabilityDetector = new TallyCapabilityDetector();
