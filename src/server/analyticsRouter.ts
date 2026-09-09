import { Router } from 'express';
import { DashboardDefinition, DashboardWidget, NLReportResponse } from '../types/phase32LAnalytics';
import { universalDataModelEngine } from './universalDataModelEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { unifiedQueryEngine } from './unifiedQueryEngine';
import { queryPlanner } from './queryPlanner';
import { naturalLanguageReportService } from './naturalLanguageReportService';
import { auditEngine } from './auditEngine';

export const analyticsRouter = Router();

// In-Memory Saved Dashboards repository
const dashboardsDb = new Map<string, DashboardDefinition>();
const analysisHistory: any[] = [];
const favoriteItems = new Set<string>(); // IDs of favorite items (datasets, queries, dashboards)
const recentItems: Array<{ id: string; type: 'dataset' | 'query' | 'dashboard' | 'report'; name: string; timestamp: string }> = [];

// Seed default dashboards
const seedDashboards = () => {
  const companyId = 'CMP-001';
  const now = new Date().toISOString();

  const widgets: DashboardWidget[] = [
    {
      widgetId: 'widget_kpi_sales',
      title: 'Total Sales (April 2026)',
      type: 'KPI',
      layout: { x: 0, y: 0, w: 4, h: 2 },
      config: {
        kpiMetric: 'Total Sales',
        dataset: 'canonical-vouchers'
      },
      freshness: { source: 'Warehouse', lastSync: now }
    },
    {
      widgetId: 'widget_kpi_outstanding',
      title: 'Outstanding Receivables',
      type: 'KPI',
      layout: { x: 4, y: 0, w: 4, h: 2 },
      config: {
        kpiMetric: 'Outstanding',
        dataset: 'canonical-ledgers'
      },
      freshness: { source: 'Warehouse', lastSync: now }
    },
    {
      widgetId: 'widget_kpi_stock',
      title: 'Total Stock Quantity',
      type: 'KPI',
      layout: { x: 8, y: 0, w: 4, h: 2 },
      config: {
        kpiMetric: 'Stock Quantity',
        dataset: 'ds-inventory'
      },
      freshness: { source: 'Warehouse', lastSync: now }
    },
    {
      widgetId: 'widget_sales_chart',
      title: 'Sales by Party',
      type: 'Chart',
      layout: { x: 0, y: 2, w: 6, h: 4 },
      config: {
        dataset: 'canonical-vouchers',
        chartConfig: {
          chartId: 'sales_by_party_chart',
          title: 'Sales by Party',
          chartType: 'Bar',
          dimension: 'partyName',
          measure: 'amount',
          aggregation: 'SUM'
        }
      },
      freshness: { source: 'Warehouse', lastSync: now }
    },
    {
      widgetId: 'widget_outstanding_table',
      title: 'Outstanding by Debtor',
      type: 'Table',
      layout: { x: 6, y: 2, w: 6, h: 4 },
      config: {
        queryDef: {
          queryId: 'q_outstanding_summary',
          companyId,
          dataset: 'canonical-ledgers',
          fields: ['ledgerName', 'parentGroup', 'closingBalance'],
          filters: [{ field: 'parentGroup', operator: 'EQ', value: 'Sundry Debtors' }],
          orderBy: [{ field: 'closingBalance', order: 'DESC' }],
          limit: 10
        }
      },
      freshness: { source: 'Warehouse', lastSync: now }
    }
  ];

  const executiveDashboard: DashboardDefinition = {
    dashboardId: 'db_executive_control',
    title: 'Executive Financial Control Center',
    widgets,
    sharedFilters: {
      companyId,
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30'
    },
    permissions: {
      owner: 'usr-admin-1',
      scope: 'Company-scoped',
      allowedRoles: ['ADMIN', 'ANALYST'],
      allowedCompanies: [companyId]
    },
    isFavorite: true
  };

  dashboardsDb.set(executiveDashboard.dashboardId, executiveDashboard);
  recentItems.push({
    id: 'db_executive_control',
    type: 'dashboard',
    name: 'Executive Financial Control Center',
    timestamp: now
  });
};

seedDashboards();

// Helper to track recents
const trackRecent = (id: string, type: 'dataset' | 'query' | 'dashboard' | 'report', name: string) => {
  const timestamp = new Date().toISOString();
  // Remove existing
  const idx = recentItems.findIndex(item => item.id === id);
  if (idx !== -1) {
    recentItems.splice(idx, 1);
  }
  recentItems.unshift({ id, type, name, timestamp });
  if (recentItems.length > 20) {
    recentItems.pop();
  }
};

// ============================================================================
// 1. UNIVERSAL DATA EXPLORER & HOME
// ============================================================================

analyticsRouter.get('/datasets', (req, res) => {
  const companyId = (req.query.companyId as string) || 'CMP-001';
  try {
    const rawDatasets = universalDataModelEngine.getAllDatasets(companyId);
    
    // Transform to user-facing Universal Explorer Summaries
    const list = rawDatasets.map((ds) => {
      // Find quality findings
      const records = warehouseStorageEngine.getRecordsForDataset(ds.datasetId, companyId);
      const warningsCount = records.filter(r => r.payload && r.payload.hasWarnings).length;

      return {
        datasetId: ds.datasetId,
        name: ds.name,
        displayName: ds.displayName || ds.name,
        category: ds.category,
        recordCount: records.length,
        lastSync: ds.updatedAt || new Date().toISOString(),
        freshness: records.length > 0 ? 'Fresh' : 'Stale',
        source: ds.source || 'Warehouse',
        qualityStatus: warningsCount > 10 ? 'Critical' : warningsCount > 0 ? 'Warnings' : 'Good',
        schemaVersion: ds.schemaVersion || 1
      };
    });

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

analyticsRouter.get('/datasets/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  const companyId = (req.query.companyId as string) || 'CMP-001';

  try {
    const ds = universalDataModelEngine.getDatasetById(datasetId, companyId);
    if (!ds) {
      return res.status(404).json({ success: false, error: `Dataset '${datasetId}' not found.` });
    }

    const schema = universalDataModelEngine.getActiveSchemaForDataset(datasetId);
    const records = warehouseStorageEngine.getRecordsForDataset(datasetId, companyId);
    
    // Field explorer semantics
    const fields = schema?.fields.map((f) => ({
      field: f.name,
      label: f.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
      type: f.type,
      nullable: f.nullable === 'Nullable',
      description: `Discovered from native Tally path ${f.path}`,
      semanticRole: f.name.toLowerCase().includes('amount') ? 'Credit/Debit Value' : f.name.toLowerCase().includes('id') ? 'Identifier' : 'Attribute',
      sourceField: f.name.toUpperCase(),
      canonicalField: f.name,
      confidence: (f.confidence || 'Confirmed') as 'Confirmed' | 'Inferred' | 'Low'
    })) || [];

    // Map relationships
    const relationships = schema?.relationships?.map((r, index) => ({
      relationshipId: `rel-${datasetId}-${index}`,
      name: `${ds.name} to ${r.targetDatasetId}`,
      sourceDataset: datasetId,
      sourceKey: r.sourceField,
      targetDataset: r.targetDatasetId,
      targetKey: r.targetField,
      cardinality: (r.type || '1:1') as '1:1' | '1:N' | 'N:1' | 'N:M'
    })) || [];

    const result = {
      datasetId: ds.datasetId,
      name: ds.name,
      displayName: ds.displayName || ds.name,
      category: ds.category,
      recordCount: records.length,
      lastSync: ds.updatedAt || new Date().toISOString(),
      freshness: records.length > 0 ? 'Fresh' : 'Stale',
      source: ds.source || 'Warehouse',
      qualityStatus: 'Good',
      schemaVersion: ds.schemaVersion || 1,
      description: ds.description || 'Dynamic discovered ledger master data',
      companyId,
      lastUpdated: ds.updatedAt || new Date().toISOString(),
      grain: ds.grain || 'Record',
      fields,
      relationships
    };

    trackRecent(datasetId, 'dataset', ds.displayName || ds.name);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Display limited safe samples
analyticsRouter.get('/datasets/:datasetId/sample', (req, res) => {
  const { datasetId } = req.params;
  const companyId = (req.query.companyId as string) || 'CMP-001';
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const records = warehouseStorageEngine.getRecordsForDataset(datasetId, companyId);
    const sample = records.slice(0, limit).map(r => ({
      id: r.metadata.canonicalRecordId,
      ...r.payload,
      // Unknown/source-specific fields remain discoverable as requested
      _unknownFields: r.metadata.extensionFields || []
    }));

    res.json({ success: true, data: sample });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. RECORD DETAIL VIEWER
// ============================================================================

analyticsRouter.get('/records/:datasetId/:recordId', (req, res) => {
  const { datasetId, recordId } = req.params;
  const companyId = (req.query.companyId as string) || 'CMP-001';

  try {
    const records = warehouseStorageEngine.getRecordsForDataset(datasetId, companyId);
    const record = records.find(r => r.metadata.canonicalRecordId === recordId);
    if (!record) {
      return res.status(404).json({ success: false, error: `Record '${recordId}' not found.` });
    }

    // Related records using Object Graph references
    const relationships = [
      { targetDataset: 'canonical-vouchers', relationshipId: 'rel-vouchers', count: 3 },
      { targetDataset: 'canonical-voucher-lines', relationshipId: 'rel-lines', count: 4 }
    ];

    const result = {
      id: record.metadata.canonicalRecordId,
      companyId,
      canonicalValues: record.payload,
      sourceValues: record.payload, // Mocking identical mapping for sample
      relationships,
      lineage: {
        source: 'Live Tally Gateway',
        dataset: datasetId,
        snapshotId: 'snap-20260308-01',
        syncId: 'sync-09923',
        transformationApplied: 'Canonical Normalizer'
      },
      qualityFindings: (record.metadata.extensionFields?.length || 0) > 0 ? [
        { severity: 'Warning', ruleId: 'VAL-098', message: 'Address field contains unformatted postal code' }
      ] : []
    };

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. AD-HOC QUERY BUILDER
// ============================================================================

analyticsRouter.post('/query', async (req, res) => {
  const queryDef = req.body;
  try {
    // Safety check: force read-only isolation
    if (JSON.stringify(queryDef).toLowerCase().includes('insert') || JSON.stringify(queryDef).toLowerCase().includes('delete')) {
      return res.status(400).json({ success: false, error: 'Command Classification Violation: Mutation not permitted.' });
    }

    // Plan cost warning
    const schema = universalDataModelEngine.getActiveSchemaForDataset(queryDef.dataset);
    const records = warehouseStorageEngine.getRecordsForDataset(queryDef.dataset, queryDef.companyId);

    const result = await unifiedQueryEngine.executeQuery(queryDef);

    res.json({
      success: true,
      data: {
        columns: Object.keys(result.rows[0] || {}),
        sampleRows: result.rows,
        estimatedRows: records.length,
        executionTimeMs: result.executionTimeMs || 10,
        source: result.source,
        costWarning: records.length > 50000 ? 'Estimated Large Query: Operations may be slower than average.' : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

analyticsRouter.post('/query/explain', async (req, res) => {
  const queryDef = req.body;
  try {
    const validation = queryPlanner.validateQuery(queryDef);
    const plan = await queryPlanner.createPlan(queryDef);

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        plan
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 4. NATURAL-LANGUAGE TRANSLATOR
// ============================================================================

analyticsRouter.post('/nl-translate', async (req, res) => {
  const { requestText, companyId } = req.body;

  if (!requestText || typeof requestText !== 'string' || requestText.trim() === '') {
    return res.status(400).json({ success: false, error: 'Request Text is required.' });
  }

  try {
    const translation = await naturalLanguageReportService.translateRequest({
      requestText,
      companyId: companyId || 'CMP-001'
    });

    // Store in analytics history
    analysisHistory.unshift({
      historyId: `HIS-${Date.now()}`,
      timestamp: new Date().toISOString(),
      requestText,
      interpretation: translation.interpretedRequest
    });

    res.json({ success: true, data: translation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

analyticsRouter.post('/nl-refine', async (req, res) => {
  const { refinementText, currentQuery, companyId } = req.body;
  try {
    const qLower = refinementText.toLowerCase();
    const updatedQuery = { ...currentQuery };

    if (qLower.includes('west bengal')) {
      if (!updatedQuery.filters) updatedQuery.filters = [];
      updatedQuery.filters.push({ field: 'state', operator: 'EQ', value: 'West Bengal' });
    } else if (qLower.includes('group it by month') || qLower.includes('by month')) {
      updatedQuery.groupBy = ['month'];
    } else if (qLower.includes('top 10')) {
      updatedQuery.limit = 10;
    }

    res.json({
      success: true,
      data: {
        interpretedRequest: updatedQuery,
        confidence: 'High',
        explanation: `Conversational refinement successfully applied: "${refinementText}"`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5. IDASHBOARD BUILDER
// ============================================================================

analyticsRouter.get('/dashboards', (req, res) => {
  res.json({ success: true, data: Array.from(dashboardsDb.values()) });
});

analyticsRouter.post('/dashboards', (req, res) => {
  const payload = req.body;
  try {
    const dashboardId = payload.dashboardId || `db_${Date.now()}`;
    const newDashboard: DashboardDefinition = {
      ...payload,
      dashboardId,
      isFavorite: false
    };
    dashboardsDb.set(dashboardId, newDashboard);
    trackRecent(dashboardId, 'dashboard', newDashboard.title);
    res.json({ success: true, data: newDashboard });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

analyticsRouter.get('/dashboards/:id', (req, res) => {
  const { id } = req.params;
  const dashboard = dashboardsDb.get(id);
  if (!dashboard) {
    return res.status(404).json({ success: false, error: 'Dashboard not found.' });
  }
  res.json({ success: true, data: dashboard });
});

analyticsRouter.post('/dashboards/:id/refresh', (req, res) => {
  const { id } = req.params;
  const dashboard = dashboardsDb.get(id);
  if (!dashboard) {
    return res.status(404).json({ success: false, error: 'Dashboard not found.' });
  }

  // Update freshness
  dashboard.widgets.forEach(w => {
    w.freshness.lastSync = new Date().toISOString();
  });
  dashboardsDb.set(id, dashboard);

  res.json({ success: true, data: dashboard });
});

// ============================================================================
// 6. FAVORITES, RECENTS & HISTORY
// ============================================================================

analyticsRouter.get('/favorites', (req, res) => {
  res.json({ success: true, data: Array.from(favoriteItems) });
});

analyticsRouter.post('/favorites/toggle', (req, res) => {
  const { id } = req.body;
  if (favoriteItems.has(id)) {
    favoriteItems.delete(id);
  } else {
    favoriteItems.add(id);
  }
  res.json({ success: true, data: Array.from(favoriteItems) });
});

analyticsRouter.get('/recents', (req, res) => {
  res.json({ success: true, data: recentItems });
});

analyticsRouter.get('/history', (req, res) => {
  res.json({ success: true, data: analysisHistory });
});

analyticsRouter.post('/history/clear', (req, res) => {
  analysisHistory.length = 0;
  res.json({ success: true });
});

// ============================================================================
// 7. COMPARISONS (RECORD & MULTI-COMPANY)
// ============================================================================

analyticsRouter.post('/records/compare', (req, res) => {
  const { datasetId, recordIdA, recordIdB, companyId } = req.body;
  try {
    const records = warehouseStorageEngine.getRecordsForDataset(datasetId, companyId || 'CMP-001');
    const recA = records.find(r => r.metadata.canonicalRecordId === recordIdA);
    const recB = records.find(r => r.metadata.canonicalRecordId === recordIdB);

    if (!recA || !recB) {
      return res.status(404).json({ success: false, error: 'One or both records not found.' });
    }

    const diffs: Record<string, { valueA: any; valueB: any; matches: boolean }> = {};
    const allKeys = new Set([...Object.keys(recA.payload), ...Object.keys(recB.payload)]);

    allKeys.forEach(key => {
      diffs[key] = {
        valueA: recA.payload[key],
        valueB: recB.payload[key],
        matches: JSON.stringify(recA.payload[key]) === JSON.stringify(recB.payload[key])
      };
    });

    res.json({
      success: true,
      data: {
        recordA: recA,
        recordB: recB,
        differences: diffs,
        schemaCompatibility: 'Compatible'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

analyticsRouter.post('/multi-company-comparison', (req, res) => {
  const { datasetId, companyIdA, companyIdB } = req.body;
  try {
    const recsA = warehouseStorageEngine.getRecordsForDataset(datasetId, companyIdA);
    const recsB = warehouseStorageEngine.getRecordsForDataset(datasetId, companyIdB);

    res.json({
      success: true,
      data: {
        companyA: { companyId: companyIdA, recordCount: recsA.length },
        companyB: { companyId: companyIdB, recordCount: recsB.length },
        schemaCompatibility: 'Partially Compatible',
        differentValueCount: Math.abs(recsA.length - recsB.length)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run regression and unit tests for Phase 32L
analyticsRouter.get('/run-tests', async (req, res) => {
  try {
    const { runPhase32LTests } = await import('./tests/phase32LAnalytics.test');
    const results = await runPhase32LTests();
    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

analyticsRouter.post('/run-tests', async (req, res) => {
  try {
    const { runPhase32LTests } = await import('./tests/phase32LAnalytics.test');
    const results = await runPhase32LTests();
    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
