/**
 * Phase 32D - Local Analytical Warehouse Express Router
 */

import { Router, Request, Response } from 'express';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { WarehouseQueryParams } from '../types/phase32DWarehouse';

export const warehouseRouter = Router();

// ============================================================================
// 1. HEALTH & METRICS ENDPOINTS
// ============================================================================

/**
 * GET /api/warehouse/health
 */
warehouseRouter.get('/health', (req: Request, res: Response) => {
  try {
    const health = warehouseStorageEngine.getHealthReport();
    res.json({ success: true, data: health });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/warehouse/datasets
 */
warehouseRouter.get('/datasets', (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const stats = warehouseStorageEngine.getDatasetStats(companyId);
    res.json({ success: true, count: stats.length, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 2. QUERY ENGINE (STRICT COMPANY ISOLATION)
// ============================================================================

/**
 * POST /api/warehouse/query
 */
warehouseRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const params = req.body as WarehouseQueryParams;
    if (!params.datasetId || !params.companyId) {
      return res.status(400).json({
        success: false,
        error: 'datasetId and companyId are required for warehouse queries.'
      });
    }

    const result = await warehouseStorageEngine.query(params);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/warehouse/records/:datasetId/:recordId
 */
warehouseRouter.get('/records/:datasetId/:recordId', (req: Request, res: Response) => {
  try {
    const { datasetId, recordId } = req.params;
    const companyId = (req.query.companyId as string) || 'CMP-001';

    const record = warehouseStorageEngine.getRecordById(datasetId, companyId, recordId);
    if (!record) {
      return res.status(404).json({ success: false, error: `Record '${recordId}' not found in dataset '${datasetId}' for company '${companyId}'.` });
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/warehouse/records/:datasetId/by-source/:sourceId
 */
warehouseRouter.get('/records/:datasetId/by-source/:sourceId', (req: Request, res: Response) => {
  try {
    const { datasetId, sourceId } = req.params;
    const companyId = (req.query.companyId as string) || 'CMP-001';

    const record = warehouseStorageEngine.getRecordBySourceId(datasetId, companyId, sourceId);
    if (!record) {
      return res.status(404).json({ success: false, error: `Record with sourceId '${sourceId}' not found.` });
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/warehouse/records/:datasetId/history/:sourceId
 */
warehouseRouter.get('/records/:datasetId/history/:sourceId', (req: Request, res: Response) => {
  try {
    const { datasetId, sourceId } = req.params;
    const companyId = (req.query.companyId as string) || 'CMP-001';

    const history = warehouseStorageEngine.getHistoricalVersions(datasetId, companyId, sourceId);
    res.json({ success: true, companyId, count: history.length, data: history });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 3. BULK INGESTION & BATCH WRITING
// ============================================================================

/**
 * POST /api/warehouse/ingest
 */
warehouseRouter.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { datasetId, companyId, records, options } = req.body;
    if (!datasetId || !companyId || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        error: 'datasetId, companyId, and records (array) are required.'
      });
    }

    const result = await warehouseStorageEngine.insertBatch(datasetId, companyId, records, options || {});
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 4. SNAPSHOTS & COMPARISON
// ============================================================================

/**
 * POST /api/warehouse/snapshots
 */
warehouseRouter.post('/snapshots', (req: Request, res: Response) => {
  try {
    const { companyId, metadata } = req.body;
    if (!companyId) return res.status(400).json({ success: false, error: 'companyId is required.' });

    const snapshot = warehouseStorageEngine.createSnapshot(companyId, metadata);
    res.status(201).json({ success: true, data: snapshot });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/warehouse/snapshots
 */
warehouseRouter.get('/snapshots', (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const list = warehouseStorageEngine.listSnapshots(companyId);
    res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/warehouse/snapshots/compare
 */
warehouseRouter.post('/snapshots/compare', (req: Request, res: Response) => {
  try {
    const { baseSnapshotId, targetSnapshotId, companyId } = req.body;
    if (!baseSnapshotId || !targetSnapshotId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'baseSnapshotId, targetSnapshotId, and companyId are required.'
      });
    }

    const plan = warehouseStorageEngine.prepareSnapshotComparison(baseSnapshotId, targetSnapshotId, companyId);
    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 5. INDEXES & MAINTENANCE
// ============================================================================

/**
 * GET /api/warehouse/indexes
 */
warehouseRouter.get('/indexes', (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const indexes = warehouseStorageEngine.indexManager.getIndexStatus(companyId);
    res.json({ success: true, count: indexes.length, data: indexes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/warehouse/indexes/rebuild
 */
warehouseRouter.post('/indexes/rebuild', async (req: Request, res: Response) => {
  try {
    const { companyId, indexId } = req.body;
    if (indexId) {
      const ok = await warehouseStorageEngine.indexManager.rebuildIndex(indexId);
      res.json({ success: ok, message: `Index ${indexId} rebuilt.` });
    } else {
      const resCount = await warehouseStorageEngine.rebuildIndexes(companyId);
      res.json({ success: true, data: resCount });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/warehouse/maintenance/optimize
 */
warehouseRouter.post('/maintenance/optimize', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const result = await warehouseStorageEngine.optimizeStorage(companyId);
    res.json({ success: true, message: 'Storage optimization completed.', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/warehouse/maintenance/compact
 */
warehouseRouter.post('/maintenance/compact', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const result = await warehouseStorageEngine.compactStorage(companyId);
    res.json({ success: true, message: 'Storage compaction completed.', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/warehouse/maintenance/validate
 */
warehouseRouter.post('/maintenance/validate', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const result = await warehouseStorageEngine.validateWarehouse(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 6. SYNTHETIC PERFORMANCE BENCHMARK (100,000 / 1,000,000 records)
// ============================================================================

/**
 * POST /api/warehouse/benchmark-synthetic
 */
warehouseRouter.post('/benchmark-synthetic', async (req: Request, res: Response) => {
  try {
    const count = Number(req.body.count) || 100000;
    const companyId = req.body.companyId || 'CMP-BENCH-01';
    const batchSize = Number(req.body.batchSize) || 5000;

    const startTime = Date.now();
    const records: any[] = [];
    const baseDate = new Date('2025-04-01T00:00:00.000Z');

    for (let i = 0; i < count; i++) {
      const dayOffset = (i % 365);
      const curDate = new Date(baseDate.getTime() + dayOffset * 86400000).toISOString().split('T')[0];
      records.push({
        sourceId: `BENCH_VOUCH_${i + 1}`,
        sourceObject: 'VOUCHER',
        voucherNumber: `INV-2025-${String(i + 1).padStart(6, '0')}`,
        voucherType: i % 2 === 0 ? 'Sales' : 'Purchase',
        date: curDate,
        partyLedgerName: `Party ${(i % 500) + 1} Corp`,
        partyLedgerId: `party_${(i % 500) + 1}`,
        amount: 1000 + (i % 5000),
        narration: `Benchmark invoice #${i + 1}`
      });
    }

    const genTimeMs = Date.now() - startTime;
    const insertStartTime = Date.now();

    const result = await warehouseStorageEngine.insertBatch('canonical-vouchers', companyId, records, {
      batchSize,
      upsert: true
    });

    const insertTimeMs = Date.now() - insertStartTime;

    // Benchmark query speed
    const queryStartTime = Date.now();
    const queryResult = await warehouseStorageEngine.query({
      datasetId: 'canonical-vouchers',
      companyId,
      filters: [{ field: 'voucherType', operator: 'EQ', value: 'Sales' }],
      aggregations: [
        { field: 'amount', function: 'SUM', alias: 'totalSales' },
        { field: 'amount', function: 'AVG', alias: 'avgSales' }
      ],
      limit: 100
    });
    const queryTimeMs = Date.now() - queryStartTime;

    res.json({
      success: true,
      benchmark: {
        recordCount: count,
        companyId,
        batchSize,
        generationTimeMs: genTimeMs,
        insertionTimeMs: insertTimeMs,
        recordsPerSecond: Math.round((count / (insertTimeMs || 1)) * 1000),
        queryExecutionTimeMs: queryTimeMs,
        matchedRows: queryResult.totalMatchedRows,
        totalSalesAggregate: queryResult.aggregates?.totalSales,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 7. TEST SUITE RUNNER
// ============================================================================

/**
 * POST /api/warehouse/run-phase32d-tests
 */
warehouseRouter.post('/run-phase32d-tests', async (req: Request, res: Response) => {
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
