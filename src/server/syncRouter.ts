/**
 * Phase 32E: Synchronization & Change Detection Router
 * Exposes REST API endpoints for full sync, incremental sync, reconciliation fallback,
 * watermark management, checkpoints, freshness tracking, change logs, and testing.
 */

import { Router, Request, Response } from 'express';
import { syncEngine } from './syncEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { runPhase32ETestSuite } from '../tests/phase32ESyncTests';

export const syncRouter = Router();

// ============================================================================
// 1. SYNC EXECUTION & CONTROL
// ============================================================================

/**
 * POST /api/sync/start
 * Starts a new synchronization job
 */
syncRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      mode = 'Full',
      datasetId,
      datasets,
      financialYear,
      dateRange,
      batchSize,
      maxRetries,
      forceReconciliation,
      initiatedBy = 'API User'
    } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required to start a synchronization job.' });
    }

    const job = await syncEngine.startSync({
      companyId,
      mode,
      datasetId,
      datasets,
      financialYear,
      dateRange,
      batchSize,
      maxRetries,
      forceReconciliation,
      initiatedBy
    });

    res.json({
      success: true,
      message: `Sync job '${job.jobId}' initialized in mode '${job.mode}'. This operation updates the local EXFIN warehouse only. Tally data is not modified.`,
      job
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sync/:jobId/pause
 */
syncRouter.post('/:jobId/pause', async (req: Request, res: Response) => {
  try {
    const success = await syncEngine.pauseSync(req.params.jobId);
    if (!success) {
      return res.status(400).json({ error: 'Cannot pause job. Job may not be running or does not exist.' });
    }
    res.json({ success: true, message: `Job ${req.params.jobId} paused.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sync/:jobId/resume
 */
syncRouter.post('/:jobId/resume', async (req: Request, res: Response) => {
  try {
    const success = await syncEngine.resumeSync(req.params.jobId);
    if (!success) {
      return res.status(400).json({ error: 'Cannot resume job. Job may not be paused or does not exist.' });
    }
    res.json({ success: true, message: `Job ${req.params.jobId} resumed from checkpoint.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sync/:jobId/cancel
 */
syncRouter.post('/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const success = await syncEngine.cancelSync(req.params.jobId);
    if (!success) {
      return res.status(400).json({ error: 'Cannot cancel job. Job is already completed or cancelled.' });
    }
    res.json({ success: true, message: `Job ${req.params.jobId} cancelled. Warehouse remains consistent.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sync/:jobId/retry
 */
syncRouter.post('/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const job = await syncEngine.retrySync(req.params.jobId);
    res.json({ success: true, message: `Job ${req.params.jobId} retried.`, job });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 2. JOBS & STATUS
// ============================================================================

/**
 * GET /api/sync/jobs
 */
syncRouter.get('/jobs', (req: Request, res: Response) => {
  const companyId = req.query.companyId as string | undefined;
  const jobs = syncEngine.listJobs(companyId);
  res.json({ total: jobs.length, jobs });
});

/**
 * GET /api/sync/jobs/:jobId
 */
syncRouter.get('/jobs/:jobId', (req: Request, res: Response) => {
  const job = syncEngine.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Sync job not found.' });
  }
  res.json({ job });
});

// ============================================================================
// 3. WATERMARKS & FRESHNESS
// ============================================================================

/**
 * GET /api/sync/watermarks
 */
syncRouter.get('/watermarks', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'CMP-001';
  const datasetId = req.query.datasetId as string | undefined;

  if (datasetId) {
    const wm = syncEngine.getWatermark(companyId, datasetId);
    return res.json({ watermark: wm });
  }

  const freshness = syncEngine.getFreshness(companyId);
  const watermarks = freshness.map((f) => syncEngine.getWatermark(companyId, f.datasetId)).filter(Boolean);
  res.json({ companyId, watermarks });
});

/**
 * GET /api/sync/freshness
 */
syncRouter.get('/freshness', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'CMP-001';
  const freshness = syncEngine.getFreshness(companyId);
  res.json({ companyId, freshness });
});

/**
 * GET /api/sync/graph-status
 */
syncRouter.get('/graph-status', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'CMP-001';
  const graphStatus = syncEngine.getGraphStatus(companyId);
  res.json({ companyId, graphStatus });
});

// ============================================================================
// 4. CHANGE LOGS & AUDIT TRAIL
// ============================================================================

/**
 * GET /api/sync/changes
 */
syncRouter.get('/changes', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'CMP-001';
  const jobId = req.query.jobId as string | undefined;
  const datasetId = req.query.datasetId as string | undefined;
  const changeType = req.query.changeType as any;

  const logs = syncEngine.getChangeLogs(companyId, { jobId, datasetId, changeType });

  const summary = {
    added: logs.filter((l) => l.changeType === 'Added').length,
    modified: logs.filter((l) => l.changeType === 'Modified').length,
    unchanged: logs.filter((l) => l.changeType === 'Unchanged').length,
    removed: logs.filter((l) => l.changeType === 'Removed').length,
    total: logs.length
  };

  res.json({ companyId, summary, changes: logs });
});

// ============================================================================
// 5. TEST RUNNER (PHASE 32E)
// ============================================================================

/**
 * POST /api/sync/run-phase32e-tests
 */
syncRouter.post('/run-phase32e-tests', async (_req: Request, res: Response) => {
  try {
    const report = await runPhase32ETestSuite();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
