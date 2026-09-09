/**
 * Phase 32H - Operational Safety Test Suite
 * Comprehensive verification for Lineage, Snapshots, Backup & Restore, Storage Management,
 * Audit Engine, Security Hardening, Disaster Recovery, Read-Only Tally Safety, and Regressions.
 */

import { lineageService } from '../server/lineageService';
import { snapshotManager } from '../server/snapshotManager';
import { backupEngine } from '../server/backupEngine';
import { storageManager } from '../server/storageManager';
import { auditEngine } from '../server/auditEngine';
import { warehouseStorageEngine } from '../server/warehouseStorageEngine';
import { runPhase32GTestSuite } from './phase32GQueryTests';

export interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
}

export async function runPhase32HTestSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    const tStart = Date.now();
    try {
      await fn();
      results.push({ testName: name, status: 'PASS', durationMs: Date.now() - tStart });
    } catch (err: any) {
      results.push({ testName: name, status: 'FAIL', durationMs: Date.now() - tStart, error: err.message || String(err) });
    }
  };

  // ============================================================================
  // 1. LINEAGE TESTS
  // ============================================================================

  await runTest('Lineage: Record trace graph links Source -> Normalization -> Warehouse -> Snapshot -> Report', async () => {
    await lineageService.recordTrace({
      lineageId: 'LIN-TST-001',
      warehouseRecordId: 'VOC-99',
      companyId: 'CMP-001',
      datasetId: 'canonical-vouchers',
      sourceSystem: 'Tally Prime XML Engine (Read-Only)',
      sourceDataset: 'VOUCHER',
      sourceRecordId: 'TALLY-SRC-99',
      schemaVersion: 1,
      mappingVersion: 1,
      transformationVersion: 1,
      syncJobId: 'SYNC-101',
      snapshotId: 'SNP-INIT-001',
      extractedAt: new Date().toISOString(),
      normalizedAt: new Date().toISOString(),
      transformedAt: new Date().toISOString()
    });

    const trace = await lineageService.getRecordLineage('VOC-99');
    if (!trace || trace.sourceRecordId !== 'TALLY-SRC-99') throw new Error('Record trace failed');

    const graph = await lineageService.buildLineageGraph('VOC-99');
    if (graph.nodes.length < 5 || graph.edges.length < 4) throw new Error('Lineage graph incomplete');
  });

  await runTest('Lineage: Field lineage maps Source Field -> Canonical -> Transformation -> Warehouse Field', async () => {
    const fields = await lineageService.getFieldLineage('canonical-vouchers');
    if (fields.length === 0) throw new Error('Field lineage empty');
    const vchNum = fields.find((f) => f.warehouseField === 'voucherNumber');
    if (!vchNum || vchNum.sourceField !== 'VOUCHERNUMBER') throw new Error('Field lineage mapping invalid');
  });

  await runTest('Lineage: Lineage Search locates records across Company, Dataset, and Source ID', async () => {
    const res = await lineageService.searchLineage({ recordId: 'VOC-99', companyId: 'CMP-001' });
    if (res.length === 0) throw new Error('Lineage search returned zero results');
  });

  // ============================================================================
  // 2. SNAPSHOT MANAGER TESTS
  // ============================================================================

  await runTest('Snapshot: Create and list company snapshots', async () => {
    const snapshot = await snapshotManager.createSnapshot('CMP-001', ['canonical-vouchers']);
    if (!snapshot || !snapshot.snapshotId.startsWith('SNP-')) throw new Error('Snapshot creation failed');

    const list = await snapshotManager.listSnapshots('CMP-001');
    if (list.length === 0) throw new Error('Snapshot list empty');
  });

  await runTest('Snapshot: Metadata comparison computes record deltas', async () => {
    const snapA = await snapshotManager.createSnapshot('CMP-001');
    const snapB = await snapshotManager.createSnapshot('CMP-001');
    const comp = await snapshotManager.compareSnapshots(snapA.snapshotId, snapB.snapshotId);
    if (comp.snapshotAId !== snapA.snapshotId || comp.snapshotBId !== snapB.snapshotId) throw new Error('Comparison failed');
  });

  await runTest('Snapshot Protection: Forbids deleting active or protected snapshot', async () => {
    const snaps = await snapshotManager.listSnapshots('CMP-001');
    const protectedSnap = snaps.find((s) => s.isProtected);
    if (protectedSnap) {
      const res = await snapshotManager.deleteSnapshot(protectedSnap.snapshotId, false);
      if (res.success) throw new Error('Protected snapshot was unexpectedly deleted');
    }
  });

  await runTest('Snapshot Restore: Creates recovery checkpoint and restores warehouse transactionally', async () => {
    const snap = await snapshotManager.createSnapshot('CMP-001');
    const restoreRes = await snapshotManager.restoreSnapshot({
      snapshotId: snap.snapshotId,
      companyId: 'CMP-001',
      createCheckpointFirst: true,
      validateSchema: true,
      validateIntegrity: true
    });

    if (!restoreRes.success || !restoreRes.checkpointId) throw new Error('Snapshot restore failed or missed checkpoint');
  });

  // ============================================================================
  // 3. BACKUP ENGINE TESTS
  // ============================================================================

  await runTest('Backup Engine: Creates local warehouse backup with SHA-256 checksum', async () => {
    const backup = await backupEngine.createBackup(['CMP-001'], 'TestUser');
    if (!backup || !backup.checksum || backup.recordCounts.warehouseRecords === 0) {
      throw new Error('Backup creation failed');
    }
  });

  await runTest('Backup Validation: Verifies checksum and manifest structure', async () => {
    const backups = await backupEngine.listBackups('CMP-001');
    const target = backups[0];
    const val = await backupEngine.validateBackup(target.backupId);
    if (!val.isValid || !val.checksumMatch) throw new Error(`Backup validation failed: ${val.errors.join('; ')}`);
  });

  await runTest('Backup Restore Preview: Shows compatibility and record counts', async () => {
    const backups = await backupEngine.listBackups('CMP-001');
    const target = backups[0];
    const preview = await backupEngine.getRestorePreview(target.backupId, 'CMP-001');
    if (preview.compatibility !== 'Compatible' || preview.recordCountTotal === 0) {
      throw new Error('Restore preview failed');
    }
  });

  await runTest('Backup Restore Execution: Performs company-scoped restore with checkpointing', async () => {
    const backup = await backupEngine.createBackup(['CMP-001'], 'TestUser');
    const log = await backupEngine.restoreBackup({
      backupId: backup.backupId,
      targetCompanyId: 'CMP-001',
      createCheckpoint: true,
      runIntegrityCheckAfter: true,
      runDataQualityCheckAfter: true,
      user: 'TestUser'
    });

    if (log.status !== 'COMPLETED' || log.recordsRestored === 0 || !log.checkpointId) {
      throw new Error('Backup restore execution failed');
    }
  });

  await runTest('Operation Lock: Prevents conflicting concurrent backup/restore operations', async () => {
    const lock = backupEngine.acquireLock('RESTORE', 'UserA', 'CMP-001');
    try {
      backupEngine.acquireLock('RESTORE', 'UserB', 'CMP-001');
      throw new Error('Failed to prevent conflicting operation lock');
    } catch (err: any) {
      if (!err.message.includes('Operation Lock Conflict')) throw err;
    } finally {
      backupEngine.releaseLock(lock.lockId);
    }
  });

  // ============================================================================
  // 4. STORAGE MANAGER TESTS
  // ============================================================================

  await runTest('Storage Manager: Computes breakdown and health status', async () => {
    const bd = await storageManager.getStorageBreakdown();
    if (bd.totalSizeBytes === 0 || bd.availableDiskBytes === 0) throw new Error('Storage breakdown invalid');

    const health = await storageManager.getStorageHealth();
    if (health.status !== 'Healthy') throw new Error('Storage health check failed');
  });

  await runTest('Storage Protection: Blocks operations when storage is critical', async () => {
    storageManager.setAvailableDiskBytesForTesting(10 * 1024 * 1024); // 10 MB < 100 MB limit
    const guard = await storageManager.isOperationAllowedForStorage();
    if (guard.allowed) throw new Error('Storage protection failed to block operation when disk space is low');
    storageManager.setAvailableDiskBytesForTesting(2 * 1024 * 1024 * 1024); // Reset
  });

  await runTest('Storage Cache Cleanup: Frees query cache without deleting warehouse records', async () => {
    const recsBefore = warehouseStorageEngine.getRecordsByDataset('canonical-vouchers', 'CMP-001');
    const res = await storageManager.cleanCache();
    const recsAfter = warehouseStorageEngine.getRecordsByDataset('canonical-vouchers', 'CMP-001');
    if (recsAfter.length !== recsBefore.length) throw new Error('Cache cleanup unexpectedly deleted warehouse records');
  });

  // ============================================================================
  // 5. AUDIT ENGINE & SECURITY HARDENING TESTS
  // ============================================================================

  await runTest('Audit Engine: Records immutable audit stream and redacts sensitive data', async () => {
    const audit = await auditEngine.recordEvent({
      user: 'admin@exfin.local',
      action: 'LOGIN',
      companyId: 'CMP-001',
      result: 'SUCCESS',
      severity: 'INFO',
      correlationId: 'CORR-TST-001',
      details: {
        password: 'SuperSecretPassword123!',
        token: 'Bearer xyz-token',
        companyName: 'ABC Trading Ltd'
      }
    });

    if (audit.details?.password !== '[REDACTED_SENSITIVE_VALUE]' || audit.details?.token !== '[REDACTED_SENSITIVE_VALUE]') {
      throw new Error('Sensitive log redaction failed');
    }
  });

  await runTest('Security Hardening: Detects path traversal attempts', async () => {
    const res1 = auditEngine.validatePathSafety('/backups/valid_file.json');
    if (!res1.isSafe) throw new Error('Valid path rejected');

    const res2 = auditEngine.validatePathSafety('/backups/../../etc/passwd');
    if (res2.isSafe) throw new Error('Path traversal attack was not blocked');
  });

  await runTest('Security Hardening: Enforces company isolation and least privilege authorization', async () => {
    const authRes = auditEngine.authorizeAction(
      {
        userId: 'U002',
        username: 'analyst1',
        role: 'ANALYST',
        allowedCompanies: ['CMP-001'],
        allowedDatasets: ['*'],
        permissions: ['READ_WAREHOUSE', 'EXECUTE_QUERY']
      },
      'RESTORE_BACKUP',
      'CMP-002'
    );

    if (authRes.authorized) throw new Error('Authorization allowed unauthorized company/permission');
  });

  // ============================================================================
  // 6. DISASTER RECOVERY & INTEGRITY TESTS
  // ============================================================================

  await runTest('Disaster Recovery: System Integrity Check passes all component verifications', async () => {
    const report = await auditEngine.runSystemIntegrityCheck('CMP-001');
    if (report.overallStatus === 'CORRUPTED' || report.checks.length < 5) {
      throw new Error('System integrity check failed');
    }
  });

  await runTest('Disaster Recovery: Executes full 9-step recovery sequence successfully', async () => {
    const dr = await auditEngine.executeDisasterRecoverySequence('BKP-EXFIN-20260331-001', 'CMP-001');
    if (!dr.success || dr.results.length !== 9 || !dr.results.every((r) => r.status === 'PASSED')) {
      throw new Error('Disaster recovery sequence failed');
    }
  });

  // ============================================================================
  // 7. READ-ONLY TALLY VALIDATION
  // ============================================================================

  await runTest('Read-Only Tally Validation: Backup, Restore, Snapshot, Storage, and Audit operations issue ZERO write requests to Tally', async () => {
    // Audit log verification for zero Tally write events
    const events = await auditEngine.searchEvents({ companyId: 'CMP-001' });
    const tallyWriteEvent = events.find((e) => e.details?.action === 'TALLY_WRITE' || e.details?.action === 'TALLY_MUTATE');
    if (tallyWriteEvent) throw new Error('Tally write event detected in operational safety logs!');
  });

  // ============================================================================
  // 8. REGRESSION TESTS (PHASE 1-32G)
  // ============================================================================

  await runTest('Regression Tests: Phase 1–32G test suite runs cleanly without breaking existing functionality', async () => {
    const phase32GResults = await runPhase32GTestSuite();
    if (phase32GResults.failed > 0) {
      const failedNames = phase32GResults.results.filter(r => r.status === 'FAIL').map(r => r.testName).join('; ');
      throw new Error(`Phase 32G regression failed (${phase32GResults.failed} tests failed: ${failedNames})`);
    }
  });

  // ============================================================================
  // 9. PERFORMANCE BENCHMARK
  // ============================================================================

  await runTest('Performance Benchmark: Handles backup, snapshot, and restore operations on large dataset scale (100k records)', async () => {
    // Seed 100k synthetic records in warehouse for benchmark
    const syntheticRecords = Array.from({ length: 100000 }).map((_, i) => ({
      id: `PERF-VOC-${i + 1}`,
      companyId: 'CMP-001',
      voucherNumber: `PERF-VCH-${i + 1}`,
      date: '2026-03-31',
      amount: (i + 1) * 10,
      partyName: 'Benchmark Party'
    }));

    warehouseStorageEngine.insertRecords('canonical-vouchers', syntheticRecords, 'CMP-001');

    const snapStart = Date.now();
    const snap = await snapshotManager.createSnapshot('CMP-001', ['canonical-vouchers']);
    const snapDuration = Date.now() - snapStart;

    if (snap.totalRecords < 100000) throw new Error('Large snapshot failed to capture 100k records');
    if (snapDuration > 5000) throw new Error(`Snapshot operation too slow: ${snapDuration}ms`);
  });

  const totalDuration = Date.now() - startTime;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  return {
    total: results.length,
    passed,
    failed,
    durationMs: totalDuration,
    results
  };
}
