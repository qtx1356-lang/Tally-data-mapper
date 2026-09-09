/**
 * Phase 32G - Express Router for Local Query & Indexing Layer
 * Exposes API endpoints for query execution, query explanation, validation,
 * saved queries, index recommendations, materialized views, and performance stats.
 */

import { Router, Request, Response } from 'express';
import { unifiedQueryEngine } from './unifiedQueryEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { universalDataModelEngine } from './universalDataModelEngine';
import { QueryDefinition } from '../types/phase32GQuery';

export const queryRouter = Router();

// ============================================================================
// 1. QUERY EXECUTION & EXPLAIN
// ============================================================================

/**
 * Execute dynamic dataset query
 * POST /api/query/execute
 */
queryRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const definition: QueryDefinition = req.body;

    if (!definition || !definition.companyId || !definition.dataset) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query payload. companyId and dataset are strictly required.'
      });
    }

    if (!definition.queryId) {
      definition.queryId = `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    if (!definition.createdAt) {
      definition.createdAt = new Date().toISOString();
    }

    const result = await unifiedQueryEngine.executeQuery(definition);
    return res.json({
      success: true,
      result
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error executing query'
    });
  }
});

/**
 * Generate execution plan (EXPLAIN query)
 * POST /api/query/explain
 */
queryRouter.post('/explain', async (req: Request, res: Response) => {
  try {
    const definition: QueryDefinition = req.body;
    if (!definition || !definition.companyId || !definition.dataset) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query payload for explain. companyId and dataset are required.'
      });
    }

    const plan = await unifiedQueryEngine.explainQuery(definition);
    return res.json({
      success: true,
      plan
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error generating query plan'
    });
  }
});

/**
 * Validate query definition before running
 * POST /api/query/validate
 */
queryRouter.post('/validate', (req: Request, res: Response) => {
  try {
    const definition: QueryDefinition = req.body;
    const validation = unifiedQueryEngine.validateQuery(definition);
    return res.json({
      success: true,
      validation
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error validating query'
    });
  }
});

/**
 * Cancel long-running query
 * POST /api/query/cancel/:queryId
 */
queryRouter.post('/cancel/:queryId', (req: Request, res: Response) => {
  const cancelled = unifiedQueryEngine.cancelQuery(req.params.queryId);
  return res.json({
    success: true,
    cancelled
  });
});

// ============================================================================
// 2. SAVED QUERIES & DRIFT RESILIENCE
// ============================================================================

/**
 * List saved queries
 * GET /api/query/saved
 */
queryRouter.get('/saved', (req: Request, res: Response) => {
  const companyId = req.query.companyId as string | undefined;
  const queries = unifiedQueryEngine.getSavedQueries(companyId);
  return res.json({
    success: true,
    savedQueries: queries
  });
});

/**
 * Save a new query
 * POST /api/query/saved
 */
queryRouter.post('/saved', (req: Request, res: Response) => {
  try {
    const { name, definition, companyScope, description, createdBy } = req.body;
    if (!name || !definition) {
      return res.status(400).json({
        success: false,
        error: 'Query name and definition are required.'
      });
    }

    const saved = unifiedQueryEngine.saveQuery(
      name,
      definition,
      companyScope || definition.companyId || 'CMP-001',
      description,
      createdBy || 'User'
    );

    return res.json({
      success: true,
      savedQuery: saved
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error saving query'
    });
  }
});

/**
 * Delete a saved query
 * DELETE /api/query/saved/:id
 */
queryRouter.delete('/saved/:id', (req: Request, res: Response) => {
  const deleted = unifiedQueryEngine.deleteSavedQuery(req.params.id);
  return res.json({
    success: true,
    deleted
  });
});

/**
 * Validate saved query against current schema
 * POST /api/query/saved/:id/validate
 */
queryRouter.post('/saved/:id/validate', (req: Request, res: Response) => {
  try {
    const validated = unifiedQueryEngine.validateSavedQueryAgainstCurrentSchema(req.params.id);
    return res.json({
      success: true,
      savedQuery: validated
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error validating saved query'
    });
  }
});

// ============================================================================
// 3. MATERIALIZED ANALYTICS VIEWS
// ============================================================================

/**
 * List materialized views
 * GET /api/query/materialized
 */
queryRouter.get('/materialized', (req: Request, res: Response) => {
  const companyId = req.query.companyId as string | undefined;
  const views = unifiedQueryEngine.getMaterializedViews(companyId);
  return res.json({
    success: true,
    materializedViews: views
  });
});

/**
 * Refresh a materialized view
 * POST /api/query/materialized/:id/refresh
 */
queryRouter.post('/materialized/:id/refresh', async (req: Request, res: Response) => {
  try {
    const refreshed = await unifiedQueryEngine.refreshMaterializedView(req.params.id);
    return res.json({
      success: true,
      materializedView: refreshed
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error refreshing materialized view'
    });
  }
});

/**
 * Register a new materialized view
 * POST /api/query/materialized
 */
queryRouter.post('/materialized', (req: Request, res: Response) => {
  try {
    const { name, dataset, companyId, definition, refreshPolicy } = req.body;
    if (!name || !dataset || !companyId || !definition) {
      return res.status(400).json({
        success: false,
        error: 'name, dataset, companyId, and definition are required.'
      });
    }

    const view = unifiedQueryEngine.registerMaterializedView(
      name,
      dataset,
      companyId,
      definition,
      refreshPolicy || 'Manual'
    );

    return res.json({
      success: true,
      materializedView: view
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error registering materialized view'
    });
  }
});

// ============================================================================
// 4. PERFORMANCE DASHBOARD & STATISTICS
// ============================================================================

/**
 * Get query performance statistics
 * GET /api/query/stats
 */
queryRouter.get('/stats', (req: Request, res: Response) => {
  const stats = unifiedQueryEngine.getPerformanceStats();
  return res.json({
    success: true,
    stats
  });
});

/**
 * Set slow query threshold
 * POST /api/query/stats/threshold
 */
queryRouter.post('/stats/threshold', (req: Request, res: Response) => {
  const { thresholdMs } = req.body;
  if (thresholdMs !== undefined && typeof thresholdMs === 'number') {
    unifiedQueryEngine.setSlowQueryThreshold(thresholdMs);
  }
  return res.json({
    success: true,
    thresholdMs: unifiedQueryEngine.getSlowQueryThreshold()
  });
});

/**
 * Clear slow queries history
 * POST /api/query/stats/clear
 */
queryRouter.post('/stats/clear', (req: Request, res: Response) => {
  unifiedQueryEngine.clearSlowQueries();
  return res.json({
    success: true,
    message: 'Slow query history cleared'
  });
});

// ============================================================================
// 5. INDEX MANAGEMENT & RECOMMENDATIONS
// ============================================================================

/**
 * Get indexes and usage stats
 * GET /api/query/indexes
 */
queryRouter.get('/indexes', (req: Request, res: Response) => {
  const companyId = req.query.companyId as string | undefined;
  const indexes = warehouseStorageEngine.indexManager.getIndexStatus(companyId);
  return res.json({
    success: true,
    indexes
  });
});

/**
 * Get index recommendations
 * GET /api/query/indexes/recommendations
 */
queryRouter.get('/indexes/recommendations', (req: Request, res: Response) => {
  const datasetId = req.query.datasetId as string | undefined;
  const recommendations = warehouseStorageEngine.indexManager.getIndexRecommendations(datasetId);
  return res.json({
    success: true,
    recommendations
  });
});

/**
 * Approve an index recommendation and build index
 * POST /api/query/indexes/recommendations/:id/approve
 */
queryRouter.post('/indexes/recommendations/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const recs = warehouseStorageEngine.indexManager.getIndexRecommendations();
  const rec = recs.find((r) => r.recommendationId === id);

  if (!rec) {
    return res.status(404).json({ success: false, error: 'Recommendation not found' });
  }

  const allRecords = warehouseStorageEngine.getRecordsForDataset(rec.datasetId);
  const approved = warehouseStorageEngine.indexManager.approveRecommendation(id, allRecords);

  return res.json({
    success: approved,
    message: approved ? 'Index created and built successfully' : 'Failed to approve recommendation'
  });
});

/**
 * Dismiss an index recommendation
 * POST /api/query/indexes/recommendations/:id/dismiss
 */
queryRouter.post('/indexes/recommendations/:id/dismiss', (req: Request, res: Response) => {
  const dismissed = warehouseStorageEngine.indexManager.dismissRecommendation(req.params.id);
  return res.json({
    success: dismissed
  });
});

/**
 * Delete an index
 * DELETE /api/query/indexes/:id
 */
queryRouter.delete('/indexes/:id', (req: Request, res: Response) => {
  const removed = warehouseStorageEngine.indexManager.removeIndex(req.params.id);
  return res.json({
    success: removed,
    message: removed ? 'Index removed' : 'Index not found'
  });
});

// ============================================================================
// 6. METADATA & SCHEMA DISCOVERY FOR VISUAL QUERY BUILDER
// ============================================================================

/**
 * Get available datasets, fields, and relationships for the query builder
 * GET /api/query/metadata/datasets
 */
queryRouter.get('/metadata/datasets', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'CMP-001';

  // Datasets from universalDataModelEngine
  const registryDatasets = universalDataModelEngine.getAllDatasets(companyId);

  // Datasets from warehouseStorageEngine
  const warehouseDatasetIds = warehouseStorageEngine.getAllDatasetIds();

  const datasetList = warehouseDatasetIds.map((dId) => {
    const regDs = registryDatasets.find((r) => r.datasetId === dId);
    const activeSchema = universalDataModelEngine.getActiveSchemaForDataset(dId);
    const records = warehouseStorageEngine.getRecordsForDataset(dId, companyId);

    // Derive field list from schema or sample records
    let fields: Array<{ name: string; type: string; isPrimary?: boolean; description?: string }> = [];
    if (activeSchema) {
      fields = activeSchema.fields.map((f) => ({
        name: f.name,
        type: f.type,
        isPrimary: f.isPrimary,
        description: f.description
      }));
    } else if (records.length > 0) {
      const sample = records[0].payload;
      fields = Object.keys(sample).map((k) => ({
        name: k,
        type: typeof sample[k] === 'number' ? 'Decimal' : 'String'
      }));
    }

    return {
      datasetId: dId,
      name: regDs?.name || dId,
      displayName: regDs?.displayName || dId,
      category: regDs?.category || (dId.includes('voucher') ? 'Transaction' : 'Master'),
      grain: activeSchema?.grain || (dId.includes('line') ? 'VoucherLine' : 'Voucher'),
      schemaVersion: activeSchema?.version || 1,
      recordCount: records.length,
      fields,
      relationships: activeSchema?.relationships || []
    };
  });

  return res.json({
    success: true,
    datasets: datasetList
  });
});

/**
 * Check Read-Only Safety Assurance
 * GET /api/query/safety
 */
queryRouter.get('/safety', (req: Request, res: Response) => {
  const safety = unifiedQueryEngine.verifyReadOnlyTallySafety();
  return res.json({
    success: true,
    safety
  });
});
