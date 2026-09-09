/**
 * Phase 32H - Operational Safety Router
 * Lineage, Snapshots, Backup & Restore, Storage Health, Audit Logs, Security Events & Disaster Recovery APIs.
 */

import { Router, Request, Response } from 'express';
import { lineageService } from './lineageService';
import { snapshotManager } from './snapshotManager';
import { backupEngine } from './backupEngine';
import { storageManager } from './storageManager';
import { auditEngine } from './auditEngine';
import { runPhase32HTestSuite } from '../tests/phase32HOperationalSafetyTests';

export const operationalSafetyRouter = Router();

// ============================================================================
// 1. LINEAGE ENDPOINTS
// ============================================================================

operationalSafetyRouter.get('/lineage/record/:id', async (req: Request, res: Response) => {
  try {
    const trace = await lineageService.getRecordLineage(req.params.id);
    return res.json({ success: true, recordLineage: trace });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/lineage/field/:datasetId', async (req: Request, res: Response) => {
  try {
    const fields = await lineageService.getFieldLineage(req.params.datasetId, req.query.field as string);
    return res.json({ success: true, fieldLineages: fields });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/lineage/report/:reportId', async (req: Request, res: Response) => {
  try {
    const reportLineage = await lineageService.getReportLineage(req.params.reportId);
    return res.json({ success: true, reportLineage });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/lineage/graph/:rootId', async (req: Request, res: Response) => {
  try {
    const graph = await lineageService.buildLineageGraph(req.params.rootId);
    return res.json({ success: true, graph });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/lineage/search', async (req: Request, res: Response) => {
  try {
    const results = await lineageService.searchLineage(req.body);
    return res.json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. SNAPSHOT ENDPOINTS
// ============================================================================

operationalSafetyRouter.get('/snapshots', async (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const snapshots = await snapshotManager.listSnapshots(companyId, req.query.status as any);
    return res.json({ success: true, snapshots });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/snapshots', async (req: Request, res: Response) => {
  try {
    const companyId = req.body.companyId || 'CMP-001';
    const snapshot = await snapshotManager.createSnapshot(companyId, req.body.datasetIds, req.body.syncJobId);
    
    await auditEngine.recordEvent({
      user: req.body.user || 'Admin',
      action: 'SNAPSHOT_CREATION',
      companyId,
      result: 'SUCCESS',
      severity: 'INFO',
      correlationId: `CORR-${Date.now()}`,
      details: { snapshotId: snapshot.snapshotId, totalRecords: snapshot.totalRecords }
    });

    return res.json({ success: true, snapshot });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/snapshots/compare', async (req: Request, res: Response) => {
  try {
    const { snapA, snapB } = req.query;
    if (!snapA || !snapB) return res.status(400).json({ success: false, error: 'snapA and snapB query parameters required' });
    const comparison = await snapshotManager.compareSnapshots(snapA as string, snapB as string);
    return res.json({ success: true, comparison });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/snapshots/:id/archive', async (req: Request, res: Response) => {
  try {
    const snapshot = await snapshotManager.archiveSnapshot(req.params.id);
    return res.json({ success: true, snapshot });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/snapshots/:id/restore', async (req: Request, res: Response) => {
  try {
    const companyId = req.body.companyId || 'CMP-001';
    const result = await snapshotManager.restoreSnapshot({
      snapshotId: req.params.id,
      companyId,
      createCheckpointFirst: req.body.createCheckpointFirst ?? true,
      validateSchema: true,
      validateIntegrity: true
    });

    await auditEngine.recordEvent({
      user: req.body.user || 'Admin',
      action: 'RESTORE',
      companyId,
      result: result.success ? 'SUCCESS' : 'FAILURE',
      severity: result.success ? 'INFO' : 'ERROR',
      correlationId: `CORR-${Date.now()}`,
      details: { snapshotId: req.params.id, recordsRestored: result.recordsRestored }
    });

    return res.json({ success: result.success, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.delete('/snapshots/:id', async (req: Request, res: Response) => {
  try {
    const result = await snapshotManager.deleteSnapshot(req.params.id, req.query.force === 'true');
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/snapshots/retention', async (req: Request, res: Response) => {
  try {
    const result = await snapshotManager.applyRetentionPolicy(req.body, req.query.companyId as string);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. BACKUP & RESTORE ENDPOINTS
// ============================================================================

operationalSafetyRouter.get('/backups', async (req: Request, res: Response) => {
  try {
    const backups = await backupEngine.listBackups(req.query.companyId as string);
    return res.json({ success: true, backups });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/backups', async (req: Request, res: Response) => {
  try {
    const companyIds = req.body.companyIds || ['CMP-001'];
    const user = req.body.user || 'System Administrator';
    const backup = await backupEngine.createBackup(companyIds, user);

    await auditEngine.recordEvent({
      user,
      action: 'BACKUP',
      companyId: companyIds[0],
      result: 'SUCCESS',
      severity: 'INFO',
      correlationId: `CORR-${Date.now()}`,
      details: { backupId: backup.backupId, recordCount: backup.recordCounts.warehouseRecords }
    });

    return res.json({ success: true, backup });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/backups/:id/validate', async (req: Request, res: Response) => {
  try {
    const validation = await backupEngine.validateBackup(req.params.id);
    return res.json({ success: true, validation });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/backups/:id/preview', async (req: Request, res: Response) => {
  try {
    const preview = await backupEngine.getRestorePreview(req.params.id, req.query.companyId as string);
    return res.json({ success: true, preview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/backups/restore', async (req: Request, res: Response) => {
  try {
    const user = req.body.user || 'Admin';
    const companyId = req.body.targetCompanyId || 'CMP-001';

    const log = await backupEngine.restoreBackup({
      backupId: req.body.backupId,
      targetCompanyId: companyId,
      createCheckpoint: req.body.createCheckpoint ?? true,
      runIntegrityCheckAfter: true,
      runDataQualityCheckAfter: true,
      user
    });

    await auditEngine.recordEvent({
      user,
      action: 'RESTORE',
      companyId,
      result: log.status === 'COMPLETED' ? 'SUCCESS' : 'FAILURE',
      severity: log.status === 'COMPLETED' ? 'INFO' : 'CRITICAL',
      correlationId: `CORR-${Date.now()}`,
      details: { restoreId: log.restoreId, backupId: req.body.backupId, recordsRestored: log.recordsRestored }
    });

    return res.json({ success: log.status === 'COMPLETED', log });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 4. STORAGE & SYSTEM HEALTH ENDPOINTS
// ============================================================================

operationalSafetyRouter.get('/storage/breakdown', async (req: Request, res: Response) => {
  try {
    const breakdown = await storageManager.getStorageBreakdown();
    return res.json({ success: true, breakdown });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/storage/health', async (req: Request, res: Response) => {
  try {
    const health = await storageManager.getStorageHealth();
    return res.json({ success: true, health });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/storage/clean-cache', async (req: Request, res: Response) => {
  try {
    const result = await storageManager.cleanCache();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/storage/vacuum', async (req: Request, res: Response) => {
  try {
    const result = await storageManager.vacuumStorage();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5. AUDIT & SECURITY HARDENING ENDPOINTS
// ============================================================================

operationalSafetyRouter.get('/audit/events', async (req: Request, res: Response) => {
  try {
    const events = await auditEngine.searchEvents(req.query as any);
    return res.json({ success: true, events });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/security/events', async (req: Request, res: Response) => {
  try {
    const events = await auditEngine.listSecurityEvents(req.query.companyId as string);
    return res.json({ success: true, events });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.get('/integrity/check', async (req: Request, res: Response) => {
  try {
    const report = await auditEngine.runSystemIntegrityCheck((req.query.companyId as string) || 'CMP-001');
    return res.json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

operationalSafetyRouter.post('/recovery/execute', async (req: Request, res: Response) => {
  try {
    const backupId = req.body.backupId || 'BKP-EXFIN-20260331-001';
    const companyId = req.body.companyId || 'CMP-001';
    const result = await auditEngine.executeDisasterRecoverySequence(backupId, companyId);
    return res.json({ success: result.success, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Test Suite Runner Endpoint
operationalSafetyRouter.get('/tests/run', async (_req: Request, res: Response) => {
  try {
    const suite = await runPhase32HTestSuite();
    return res.json({ success: true, ...suite });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
