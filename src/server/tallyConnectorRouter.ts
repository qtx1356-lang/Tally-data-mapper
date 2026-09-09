/**
 * Phase 32J - Modular Tally Connector Router
 * Express REST endpoints for Connector Registry, Auto-Detection, Testing, Diagnostics, and Handoffs.
 */

import { Router } from 'express';
import { tallyConnectorRegistry } from './tallyConnectorRegistry';
import { tallyCapabilityDetector } from './tallyCapabilityDetector';
import { readOnlyGuard } from './readOnlyGuard';
import { dataQualityEngine } from './dataQualityEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { ConnectionProfile } from '../types/phase32JConnector';

export const tallyConnectorRouter = Router();

/**
 * GET /api/connector/connectors
 * Lists all registered connectors and their current health/capabilities.
 */
tallyConnectorRouter.get('/connectors', (req, res) => {
  try {
    const connectors = tallyConnectorRegistry.listConnectors().map((c) => ({
      connectorId: c.connectorId,
      type: c.type,
      name: c.name,
      version: c.version,
      availability: c.availability,
      status: c.status,
      priority: c.priority,
      capabilitiesCount: c.capabilities.length
    }));
    res.json({ success: true, connectors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/connector/profiles
 * Lists all connection profiles.
 */
tallyConnectorRouter.get('/profiles', (req, res) => {
  try {
    const profiles = tallyConnectorRegistry.listProfiles();
    const activeProfile = tallyConnectorRegistry.getActiveProfile();
    res.json({ success: true, activeProfileId: activeProfile?.id, profiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connector/profiles
 * Saves or updates a connection profile (enforces readOnly: true).
 */
tallyConnectorRouter.post('/profiles', (req, res) => {
  try {
    const profileData: ConnectionProfile = req.body;
    if (!profileData.name || !profileData.connectorType) {
      return res.status(400).json({ success: false, error: 'Profile name and connectorType are required.' });
    }

    const saved = tallyConnectorRegistry.saveProfile({
      ...profileData,
      id: profileData.id || `PROF-${Date.now()}`
    });

    res.json({ success: true, profile: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connector/test
 * Tests connection for a connection profile.
 */
tallyConnectorRouter.post('/test', async (req, res) => {
  try {
    const profile: ConnectionProfile = req.body;
    const conn = tallyConnectorRegistry.getConnector(
      profile.connectorType === 'TALLY_XML'
        ? 'tally-xml-http'
        : profile.connectorType === 'TALLY_ODBC'
        ? 'tally-odbc'
        : profile.connectorType === 'JSON_API'
        ? 'tally-json-api'
        : 'tally-file'
    );

    if (!conn) {
      return res.status(400).json({ success: false, error: `Connector for type '${profile.connectorType}' not found.` });
    }

    const testResult = await conn.instance.testConnection(profile);
    res.json({ success: true, testResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connector/detect
 * Auto-detects capabilities, endpoint, protocol, version, companies, datasets, and outputs.
 */
tallyConnectorRouter.post('/detect', async (req, res) => {
  try {
    const profile: ConnectionProfile = req.body;
    const result = await tallyCapabilityDetector.detectCapabilities(profile);
    res.json({ success: true, detection: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/connector/diagnostics
 * Runs diagnostics across all connection profiles.
 */
tallyConnectorRouter.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = await tallyConnectorRegistry.runDiagnostics();
    res.json({ success: true, diagnostics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/connector/companies
 * Discovers available companies for active connector.
 */
tallyConnectorRouter.get('/companies', async (req, res) => {
  try {
    const connInfo = tallyConnectorRegistry.getActiveConnector();
    if (!connInfo) {
      return res.status(400).json({ success: false, error: 'No active connector available.' });
    }
    const companies = await connInfo.instance.discoverCompanies();
    const activeCompanyId = tallyConnectorRegistry.getActiveCompanyId();
    const selectedCompanies = tallyConnectorRegistry.getSelectedCompanies();
    res.json({ success: true, activeCompanyId, selectedCompanies, companies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connector/switch-company
 * Performs safe company switch context transition.
 */
tallyConnectorRouter.post('/switch-company', (req, res) => {
  try {
    const { companyId, additionalCompanies } = req.body;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'companyId is required.' });
    }
    tallyConnectorRegistry.switchCompany(companyId, additionalCompanies || []);
    res.json({
      success: true,
      activeCompanyId: tallyConnectorRegistry.getActiveCompanyId(),
      selectedCompanies: tallyConnectorRegistry.getSelectedCompanies()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/connector/capabilities
 * Gets capability matrix across accounting, inventory, tax, payroll, banking, etc.
 */
tallyConnectorRouter.get('/capabilities', async (req, res) => {
  try {
    const connInfo = tallyConnectorRegistry.getActiveConnector();
    if (!connInfo) {
      return res.status(400).json({ success: false, error: 'No active connector available.' });
    }
    const companies = await connInfo.instance.discoverCompanies();
    const capabilities = await connInfo.instance.discoverCapabilities();
    const matrix = tallyCapabilityDetector.getCapabilityMatrix(companies, capabilities);
    res.json({ success: true, matrix });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connector/extract
 * Extracts a dataset from Tally via active connector and hands off to Warehouse/Quality Engine.
 */
tallyConnectorRouter.post('/extract', async (req, res) => {
  try {
    const { datasetId, companyId } = req.body;
    const targetCompany = companyId || tallyConnectorRegistry.getActiveCompanyId();
    const targetDataset = datasetId || 'canonical-vouchers';

    const connInfo = tallyConnectorRegistry.getActiveConnector();
    if (!connInfo) {
      return res.status(400).json({ success: false, error: 'No active connector available.' });
    }

    const profile = tallyConnectorRegistry.getActiveProfile() || {
      id: 'PROF-XML-LOCAL',
      name: 'Local Tally XML',
      connectorType: 'TALLY_XML',
      host: 'localhost',
      port: 9000,
      timeoutMs: 5000,
      readOnly: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await connInfo.instance.connect(profile);

    // Extract raw dataset
    const extractionResult = await connInfo.instance.readDataset(targetCompany, targetDataset);

    // Handoff to Warehouse Engine
    for (const record of extractionResult.records) {
      warehouseStorageEngine.insertRawRecord(
        targetDataset,
        targetCompany,
        record.id || record.voucherNumber || `REC-${Date.now()}`,
        'EXTRACTED_RECORD',
        record.id || 'SRC-001',
        record
      );
    }

    // Run Data Quality checks
    const qualityReport = await dataQualityEngine.evaluateDatasetQuality(
      targetDataset,
      targetCompany
    );

    res.json({
      success: true,
      extractionResult,
      qualityScore: qualityReport.qualityScore,
      dataHealth: qualityReport.status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/connector/audit-logs
 * Retrieves ReadOnlyGuard request audit logs.
 */
tallyConnectorRouter.get('/audit-logs', (req, res) => {
  try {
    const logs = readOnlyGuard.getAuditLogs(50);
    res.json({ success: true, auditLogs: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
