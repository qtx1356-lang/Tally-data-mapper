/**
 * Phase 32A - Universal Normalized Tally Data Model & Dynamic Schema Express Router
 */

import { Router, Request, Response } from 'express';
import { universalDataModelEngine } from './universalDataModelEngine';
import { DatasetCategory, SchemaStatus } from '../types/phase32UniversalModel';

export const universalDataModelRouter = Router();

// ============================================================================
// 1. DATASETS ENDPOINTS
// ============================================================================

/**
 * GET /api/universal-data/datasets
 * List all datasets with optional companyId and category filter
 */
universalDataModelRouter.get('/datasets', (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const category = req.query.category as DatasetCategory | undefined;
    const datasets = universalDataModelEngine.getAllDatasets(companyId, category);
    res.json({ success: true, count: datasets.length, data: datasets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/datasets/:datasetId
 * Get a specific dataset with active schema
 */
universalDataModelRouter.get('/datasets/:datasetId', (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const companyId = req.query.companyId as string | undefined;
    const dataset = universalDataModelEngine.getDatasetById(datasetId, companyId);

    if (!dataset) {
      return res.status(404).json({ success: false, error: `Dataset '${datasetId}' not found.` });
    }

    const activeSchema = universalDataModelEngine.getActiveSchemaForDataset(datasetId);
    res.json({ success: true, data: { dataset, activeSchema } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/datasets
 * Create a new dynamic dataset definition
 */
universalDataModelRouter.post('/datasets', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.datasetId || !body.name || !body.category || !body.companyId) {
      return res.status(400).json({ success: false, error: 'Missing required dataset fields (datasetId, name, category, companyId).' });
    }
    const created = universalDataModelEngine.createDataset(body);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 2. SCHEMA REGISTRY & LIFECYCLE ENDPOINTS
// ============================================================================

/**
 * GET /api/universal-data/schemas
 * List all registered schemas with optional datasetId and status filters
 */
universalDataModelRouter.get('/schemas', (req: Request, res: Response) => {
  try {
    const datasetId = req.query.datasetId as string | undefined;
    const status = req.query.status as SchemaStatus | undefined;
    const schemas = universalDataModelEngine.getAllSchemas(datasetId, status);
    res.json({ success: true, count: schemas.length, data: schemas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/schemas/:schemaId
 * Get a specific schema by ID
 */
universalDataModelRouter.get('/schemas/:schemaId', (req: Request, res: Response) => {
  try {
    const { schemaId } = req.params;
    const schema = universalDataModelEngine.getSchemaById(schemaId);
    if (!schema) {
      return res.status(404).json({ success: false, error: `Schema '${schemaId}' not found.` });
    }
    res.json({ success: true, data: schema });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/schemas/propose
 * Auto-generate a schema proposal from Phase 29/31 Discovery results (Proposal First)
 */
universalDataModelRouter.post('/schemas/propose', (req: Request, res: Response) => {
  try {
    const { datasetId, discoveredFields, grain, relationships } = req.body;
    if (!datasetId || !discoveredFields || !Array.isArray(discoveredFields) || !grain) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters: datasetId, discoveredFields (array), and grain are required.'
      });
    }

    const result = universalDataModelEngine.proposeSchemaFromDiscoveredObject(
      datasetId,
      discoveredFields,
      grain,
      relationships || []
    );

    res.status(201).json({
      success: true,
      message: 'Schema proposal generated in Review state. Active schema remains unaffected until approved.',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/schemas/:schemaId/status
 * Transition schema lifecycle: Draft -> Review -> Approved -> Deprecated
 */
universalDataModelRouter.post('/schemas/:schemaId/status', (req: Request, res: Response) => {
  try {
    const { schemaId } = req.params;
    const { status, actor, notes } = req.body;

    if (!status || !['Draft', 'Review', 'Approved', 'Deprecated'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status required: Draft, Review, Approved, or Deprecated.' });
    }

    const updated = universalDataModelEngine.updateSchemaStatus(
      schemaId,
      status as SchemaStatus,
      actor || 'System User',
      notes
    );

    res.json({ success: true, message: `Schema status updated to ${status}.`, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/schemas/compare
 * Compare any two schemas (e.g. proposal vs active or v1 vs v2)
 */
universalDataModelRouter.post('/schemas/compare', (req: Request, res: Response) => {
  try {
    const { schemaAId, schemaBId } = req.body;
    if (!schemaAId || !schemaBId) {
      return res.status(400).json({ success: false, error: 'schemaAId and schemaBId are required.' });
    }

    const result = universalDataModelEngine.compareSchemas(schemaAId, schemaBId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 3. FIELD CATALOG & METADATA
// ============================================================================

/**
 * GET /api/universal-data/fields
 * Get global or dataset-scoped field catalog
 */
universalDataModelRouter.get('/fields', (req: Request, res: Response) => {
  try {
    const datasetId = req.query.datasetId as string | undefined;
    const companyId = req.query.companyId as string | undefined;
    const fields = universalDataModelEngine.getFieldCatalog(datasetId, companyId);
    res.json({ success: true, count: fields.length, data: fields });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 4. CANONICAL RECORDS & UNKNOWN FIELD PRESERVATION
// ============================================================================

/**
 * GET /api/universal-data/records/:datasetId
 * Query canonical records enforcing company isolation, with optional historical versions
 */
universalDataModelRouter.get('/records/:datasetId', (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const includeHistorical = req.query.includeHistorical === 'true';
    const schemaVersion = req.query.schemaVersion ? Number(req.query.schemaVersion) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const records = universalDataModelEngine.getRecordsForDataset(datasetId, companyId, {
      includeHistorical,
      schemaVersion,
      limit
    });

    res.json({
      success: true,
      datasetId,
      companyId,
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/records/:datasetId/ingest
 * Ingest raw Tally payload, normalize known fields, preserve unknown fields as extension fields
 */
universalDataModelRouter.post('/records/:datasetId/ingest', (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const {
      companyId,
      sourceRecordId,
      sourceSystem,
      sourceObject,
      rawPayload,
      sourceReport,
      extractionId
    } = req.body;

    if (!companyId || !sourceRecordId || !sourceObject || !rawPayload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: companyId, sourceRecordId, sourceObject, rawPayload.'
      });
    }

    const result = universalDataModelEngine.ingestRecord(
      datasetId,
      companyId,
      sourceRecordId,
      sourceSystem || 'Tally Gateway',
      sourceObject,
      rawPayload,
      sourceReport,
      extractionId
    );

    res.status(201).json({
      success: true,
      message: `Record ingested successfully with ${result.canonicalRecord.extensionFields.length} unknown extension fields preserved.`,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/raw-sources/:rawRecordId
 * Get raw source metadata and payload
 */
universalDataModelRouter.get('/raw-sources/:rawRecordId', (req: Request, res: Response) => {
  try {
    const { rawRecordId } = req.params;
    const companyId = req.query.companyId as string | undefined;
    const raw = universalDataModelEngine.getRawSourceMetadata(rawRecordId, companyId);
    if (!raw) {
      return res.status(404).json({ success: false, error: `Raw metadata '${rawRecordId}' not found.` });
    }
    res.json({ success: true, data: raw });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 5. PHASE 32B: CANONICAL NORMALIZATION ENDPOINTS
// ============================================================================

import { canonicalNormalizationEngine } from './canonicalNormalizationEngine';

/**
 * GET /api/universal-data/canonical/groups
 */
universalDataModelRouter.get('/canonical/groups', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const groups = canonicalNormalizationEngine.getGroups(companyId);
    res.json({ success: true, companyId, count: groups.length, data: groups });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/groups/normalize
 */
universalDataModelRouter.post('/canonical/groups/normalize', (req: Request, res: Response) => {
  try {
    const { rawGroup, companyId, sourceReport, extractionId } = req.body;
    if (!rawGroup || !companyId) {
      return res.status(400).json({ success: false, error: 'rawGroup and companyId are required.' });
    }
    const normalized = canonicalNormalizationEngine.normalizeGroup(rawGroup, companyId, {
      sourceReport,
      extractionId
    });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/ledgers
 */
universalDataModelRouter.get('/canonical/ledgers', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const ledgers = canonicalNormalizationEngine.getLedgers(companyId);
    res.json({ success: true, companyId, count: ledgers.length, data: ledgers });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/ledgers/normalize
 */
universalDataModelRouter.post('/canonical/ledgers/normalize', (req: Request, res: Response) => {
  try {
    const { rawLedger, companyId, sourceReport, extractionId, mappingVersion } = req.body;
    if (!rawLedger || !companyId) {
      return res.status(400).json({ success: false, error: 'rawLedger and companyId are required.' });
    }
    const normalized = canonicalNormalizationEngine.normalizeLedger(rawLedger, companyId, {
      sourceReport,
      extractionId,
      mappingVersion
    });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/parties
 */
universalDataModelRouter.get('/canonical/parties', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const parties = canonicalNormalizationEngine.getParties(companyId);
    res.json({ success: true, companyId, count: parties.length, data: parties });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/parties/normalize
 */
universalDataModelRouter.post('/canonical/parties/normalize', (req: Request, res: Response) => {
  try {
    const { rawParty, companyId, sourceReport, extractionId } = req.body;
    if (!rawParty || !companyId) {
      return res.status(400).json({ success: false, error: 'rawParty and companyId are required.' });
    }
    const normalized = canonicalNormalizationEngine.normalizeParty(rawParty, companyId, {
      sourceReport,
      extractionId
    });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/vouchers
 */
universalDataModelRouter.get('/canonical/vouchers', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const vouchers = canonicalNormalizationEngine.getVouchers(companyId);
    res.json({ success: true, companyId, count: vouchers.length, data: vouchers });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/vouchers/normalize
 */
universalDataModelRouter.post('/canonical/vouchers/normalize', (req: Request, res: Response) => {
  try {
    const { rawVoucher, companyId, sourceReport, extractionId } = req.body;
    if (!rawVoucher || !companyId) {
      return res.status(400).json({ success: false, error: 'rawVoucher and companyId are required.' });
    }
    const normalized = canonicalNormalizationEngine.normalizeVoucher(rawVoucher, companyId, {
      sourceReport,
      extractionId
    });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/voucher-lines
 */
universalDataModelRouter.get('/canonical/voucher-lines', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const voucherId = req.query.voucherId as string | undefined;
    const lines = canonicalNormalizationEngine.getVoucherLines(companyId, voucherId);
    res.json({ success: true, companyId, count: lines.length, data: lines });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/voucher-lines/normalize
 */
universalDataModelRouter.post('/canonical/voucher-lines/normalize', (req: Request, res: Response) => {
  try {
    const { rawVoucherLine, companyId, sourceReport, extractionId, parentVoucherId } = req.body;
    if (!rawVoucherLine || !companyId) {
      return res.status(400).json({ success: false, error: 'rawVoucherLine and companyId are required.' });
    }
    const normalized = canonicalNormalizationEngine.normalizeVoucherLine(rawVoucherLine, companyId, {
      sourceReport,
      extractionId,
      parentVoucherId
    });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/hierarchy-issues
 */
universalDataModelRouter.get('/canonical/hierarchy-issues', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const issues = canonicalNormalizationEngine.getIntegrityIssues(companyId);
    res.json({ success: true, companyId, count: issues.length, data: issues });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/normalization-states
 */
universalDataModelRouter.get('/canonical/normalization-states', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const states = canonicalNormalizationEngine.getNormalizationStates(companyId);
    res.json({ success: true, companyId, data: states });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/universal-data/canonical/graph
 */
universalDataModelRouter.get('/canonical/graph', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const graph = canonicalNormalizationEngine.getGraphData(companyId);
    res.json({ success: true, companyId, data: graph });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/sync-graph
 */
universalDataModelRouter.post('/canonical/sync-graph', (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ success: false, error: 'companyId is required.' });
    const result = canonicalNormalizationEngine.syncWithPhase31Graph(companyId);
    res.json({ success: true, companyId, message: `Synchronized ${result.nodesCount} nodes and ${result.edgesCount} edges to Phase 31 Accounting Graph.`, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 7. PHASE 32C: INVENTORY DOMAIN ENDPOINTS
// ============================================================================

universalDataModelRouter.get('/canonical/stock-groups', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const groups = canonicalNormalizationEngine.getStockGroups(companyId);
    res.json({ success: true, companyId, count: groups.length, data: groups });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.post('/canonical/stock-groups', (req: Request, res: Response) => {
  try {
    const { rawStockGroup, companyId, sourceReport, extractionId } = req.body;
    if (!rawStockGroup || !companyId) return res.status(400).json({ success: false, error: 'rawStockGroup and companyId are required.' });
    const normalized = canonicalNormalizationEngine.normalizeStockGroup(rawStockGroup, companyId, { sourceReport, extractionId });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/stock-items', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const items = canonicalNormalizationEngine.getStockItems(companyId);
    res.json({ success: true, companyId, count: items.length, data: items });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.post('/canonical/stock-items', (req: Request, res: Response) => {
  try {
    const { rawStockItem, companyId, sourceReport, extractionId } = req.body;
    if (!rawStockItem || !companyId) return res.status(400).json({ success: false, error: 'rawStockItem and companyId are required.' });
    const normalized = canonicalNormalizationEngine.normalizeStockItem(rawStockItem, companyId, { sourceReport, extractionId });
    res.status(201).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/godowns', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const godowns = canonicalNormalizationEngine.getGodowns(companyId);
    res.json({ success: true, companyId, count: godowns.length, data: godowns });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/batches', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const stockItemId = req.query.stockItemId as string | undefined;
    const batches = canonicalNormalizationEngine.getBatches(companyId, stockItemId);
    res.json({ success: true, companyId, count: batches.length, data: batches });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/inventory-movements', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const voucherId = req.query.voucherId as string | undefined;
    const stockItemId = req.query.stockItemId as string | undefined;
    const movements = canonicalNormalizationEngine.getInventoryMovements(companyId, voucherId, stockItemId);
    res.json({ success: true, companyId, count: movements.length, data: movements });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 8. PHASE 32C: TAX & COST CENTRE ENDPOINTS
// ============================================================================

universalDataModelRouter.get('/canonical/tax-entities', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const taxes = canonicalNormalizationEngine.getTaxEntities(companyId);
    res.json({ success: true, companyId, count: taxes.length, data: taxes });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/tax-transactions', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const voucherId = req.query.voucherId as string | undefined;
    const taxTrxs = canonicalNormalizationEngine.getTaxTransactions(companyId, voucherId);
    res.json({ success: true, companyId, count: taxTrxs.length, data: taxTrxs });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/cost-centre-categories', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const cats = canonicalNormalizationEngine.getCostCentreCategories(companyId);
    res.json({ success: true, companyId, count: cats.length, data: cats });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/cost-centres', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const ccs = canonicalNormalizationEngine.getCostCentres(companyId);
    res.json({ success: true, companyId, count: ccs.length, data: ccs });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 9. PHASE 32C: PAYROLL & BANKING ENDPOINTS (WITH PRIVACY CONTROLS)
// ============================================================================

universalDataModelRouter.get('/canonical/domain-availability', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const isPayrollAvailable = canonicalNormalizationEngine.isPayrollAvailable(companyId);
    const isBankingAvailable = canonicalNormalizationEngine.isBankingAvailable(companyId);

    res.json({
      success: true,
      companyId,
      availability: {
        inventory: 'Complete',
        tax: 'Complete',
        costCentre: 'Complete',
        payroll: isPayrollAvailable ? 'Complete' : 'Not Available',
        banking: isBankingAvailable ? 'Complete' : 'Not Available'
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/employees', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const userRole = (req.query.userRole as string) || 'GUEST';
    const employees = canonicalNormalizationEngine.getEmployees(companyId, { userRole });
    res.json({
      success: true,
      companyId,
      userRole,
      count: employees.length,
      data: employees
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/payroll-transactions', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const userRole = (req.query.userRole as string) || 'GUEST';
    const employeeId = req.query.employeeId as string | undefined;
    const transactions = canonicalNormalizationEngine.getPayrollTransactions(companyId, { userRole, employeeId });
    res.json({
      success: true,
      companyId,
      userRole,
      count: transactions.length,
      data: transactions
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/bank-accounts', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const userRole = (req.query.userRole as string) || 'GUEST';
    const accounts = canonicalNormalizationEngine.getBankAccounts(companyId, { userRole });
    res.json({
      success: true,
      companyId,
      userRole,
      count: accounts.length,
      data: accounts
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

universalDataModelRouter.get('/canonical/bank-transactions', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const bankAccountId = req.query.bankAccountId as string | undefined;
    const transactions = canonicalNormalizationEngine.getBankTransactions(companyId, { bankAccountId });
    res.json({
      success: true,
      companyId,
      count: transactions.length,
      data: transactions
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/run-phase32c-tests
 * Execute unit, RBAC security, and cross-tenant isolation tests for Phase 32C
 */
universalDataModelRouter.post('/canonical/run-phase32c-tests', async (req: Request, res: Response) => {
  try {
    const { runPhase32CTestSuite } = await import('../tests/phase32CDomainTests');
    const testReport = runPhase32CTestSuite();
    res.json({
      success: testReport.failed === 0,
      report: testReport
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/universal-data/canonical/run-phase32d-tests
 * Execute local warehouse unit, company isolation, and indexing tests for Phase 32D
 */
universalDataModelRouter.post('/canonical/run-phase32d-tests', async (req: Request, res: Response) => {
  try {
    const { runPhase32DTestSuite } = await import('../tests/phase32DWarehouseTests');
    const testReport = await runPhase32DTestSuite();
    res.json({
      success: testReport.failed === 0,
      report: testReport
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


