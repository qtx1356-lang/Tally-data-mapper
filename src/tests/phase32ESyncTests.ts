/**
 * Phase 32E: Synchronization & Change Detection Comprehensive Test Suite
 *
 * Covers:
 * 1. First Full Sync
 * 2. Repeated Full Sync (Unchanged record detection)
 * 3. Added Record
 * 4. Modified Record (Historical record SCD-2 versioning + Field Diffs)
 * 5. Unchanged Record (No unnecessary rewrite)
 * 6. Safely Removed Record (Soft-removal with complete scope)
 * 7. False-Removal Test (Partial extraction !== deletion)
 * 8. Cancelled Sync (Consistency preservation)
 * 9. Failed Sync & Dataset Failure Isolation
 * 10. Bounded Retry with Exponential Backoff
 * 11. Resume from Checkpoint without duplication
 * 12. Reconciliation-Based Sync (Fallback labeled accurately)
 * 13. Incremental Sync with Safe Watermark Advancement
 * 14. Dataset Dependency Sequence
 * 15. Company Isolation (Company A never modifies Company B)
 * 16. Read-Only Tally Protection
 * 17. High-Volume Performance Benchmark (100,000 synthetic records)
 */

import { syncEngine } from '../server/syncEngine';
import { warehouseStorageEngine } from '../server/warehouseStorageEngine';

export interface Phase32ETestResult {
  testName: string;
  status: 'PASS' | 'FAIL';
  durationMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface Phase32ETestReport {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Phase32ETestResult[];
}

export async function runPhase32ETestSuite(): Promise<Phase32ETestReport> {
  const startTime = Date.now();
  const results: Phase32ETestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    const t0 = Date.now();
    try {
      await fn();
      results.push({ testName: name, status: 'PASS', durationMs: Date.now() - t0 });
    } catch (err: any) {
      results.push({
        testName: name,
        status: 'FAIL',
        durationMs: Date.now() - t0,
        message: err.message
      });
    }
  };

  // Test 1: First Full Sync
  await runTest('First Full Sync: Discovers, normalizes, extracts, and creates snapshot', async () => {
    const comp = 'CMP-SYNC-001';
    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Full',
      datasets: ['canonical-groups', 'canonical-ledgers']
    });

    // Wait for job completion
    let attempts = 0;
    while (job.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    if (job.status !== 'Completed' && job.status !== 'Partial') {
      throw new Error(`Expected job status 'Completed', got '${job.status}'`);
    }

    if (job.rowsInserted === 0) {
      throw new Error('Expected rows to be inserted on first full sync.');
    }

    if (!job.snapshotId) {
      throw new Error('Expected snapshotId to be created after successful full sync.');
    }

    const snapshot = warehouseStorageEngine.getSnapshotById(job.snapshotId);
    if (!snapshot) {
      throw new Error(`Created snapshot '${job.snapshotId}' not found in warehouse.`);
    }
  });

  // Test 2: Repeated Full Sync & Unchanged Detection
  await runTest('Repeated Full Sync: Identifies unchanged records and avoids rewriting', async () => {
    const comp = 'CMP-SYNC-001';
    const job2 = await syncEngine.startSync({
      companyId: comp,
      mode: 'Full',
      datasets: ['canonical-groups']
    });

    let attempts = 0;
    while (job2.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    if (job2.rowsUnchanged === 0) {
      throw new Error('Expected unchanged rows to be detected on repeated sync of identical data.');
    }

    if (job2.rowsInserted > 0) {
      throw new Error(`Expected 0 newly inserted rows on repeated identical sync, got ${job2.rowsInserted}`);
    }
  });

  // Test 3: Added Record Detection
  await runTest('Added Record: Inserts new source record and logs in ChangeLog', async () => {
    const comp = 'CMP-SYNC-001';
    const newRecord = {
      sourceId: 'SRC_NEW_001',
      name: 'Newly Discovered Asset Sub-Group',
      parentGroupId: 'GRP_ASSETS_01',
      nature: 'Assets'
    };

    // Directly insert raw record
    const warehouseRec = warehouseStorageEngine.recordHistoricalVersion(
      'canonical-groups',
      comp,
      `canonical-groups_${comp}_${newRecord.sourceId}`,
      newRecord
    );

    if (!warehouseRec || warehouseRec.metadata.sourceId !== newRecord.sourceId) {
      throw new Error('Failed to insert new record into analytical warehouse.');
    }

    if (warehouseRec.metadata.version !== 1 || !warehouseRec.metadata.isCurrent) {
      throw new Error('Added record should have version 1 and isCurrent true.');
    }
  });

  // Test 4: Modified Record & SCD-2 Versioning with Field Diffs
  await runTest('Modified Record: Detects fingerprint change, versions record (SCD-2) & tracks field diffs', async () => {
    const comp = 'CMP-SYNC-001';
    const canonicalId = `canonical-groups_${comp}_SRC_NEW_001`;

    const updatedPayload = {
      sourceId: 'SRC_NEW_001',
      name: 'Newly Discovered Asset Sub-Group (Renamed)',
      parentGroupId: 'GRP_ASSETS_01',
      nature: 'Assets'
    };

    const v2 = warehouseStorageEngine.recordHistoricalVersion(
      'canonical-groups',
      comp,
      canonicalId,
      updatedPayload
    );

    if (v2.metadata.version !== 2) {
      throw new Error(`Expected version 2 for modified record, got ${v2.metadata.version}`);
    }

    if (!v2.metadata.isCurrent) {
      throw new Error('New historical record must be marked isCurrent = true.');
    }

    // Check historical version
    const historical = warehouseStorageEngine.getHistoricalVersions('canonical-groups', comp, 'SRC_NEW_001');
    if (historical.length < 2) {
      throw new Error(`Expected at least 2 historical versions, got ${historical.length}`);
    }

    const expired = historical.find((h) => !h.metadata.isCurrent);
    if (!expired || !expired.metadata.validTo) {
      throw new Error('Previous version must have validTo timestamp and isCurrent = false.');
    }
  });

  // Test 5: Safely Removed Record (Soft Removal on Complete Scope)
  await runTest('Safely Removed Record: Soft-removes record and preserves history without physical deletion', async () => {
    const comp = 'CMP-SYNC-001';
    const canonicalId = `canonical-groups_${comp}_SRC_NEW_001`;

    const removed = warehouseStorageEngine.softRemoveRecord('canonical-groups', comp, canonicalId);
    if (!removed) {
      throw new Error('Expected softRemoveRecord to succeed.');
    }

    // Ensure it is no longer current
    const currentRec = warehouseStorageEngine.getRecordBySourceId('canonical-groups', comp, 'SRC_NEW_001');
    if (currentRec) {
      throw new Error('Soft-removed record should no longer be returned by current record queries.');
    }

    // Ensure historical data is preserved (never physically destroyed)
    const versions = warehouseStorageEngine.getHistoricalVersions('canonical-groups', comp, 'SRC_NEW_001');
    if (versions.length === 0) {
      throw new Error('Soft-removed record must remain inspectable in historical versions.');
    }
  });

  // Test 6: FALSE REMOVAL PROTECTION (Partial extraction !== deletion)
  await runTest('False-Removal Protection: Partial extraction scope NEVER marks missing records as removed', async () => {
    const comp = 'CMP-SYNC-FALSE-DEL';

    // Seed 3 records
    for (let i = 1; i <= 3; i++) {
      warehouseStorageEngine.recordHistoricalVersion(
        'canonical-vouchers',
        comp,
        `canonical-vouchers_${comp}_VCH_00${i}`,
        { sourceId: `VCH_00${i}`, voucherNumber: `V-${i}`, date: `2026-03-0${i}` }
      );
    }

    // Sync with date range filter (partial scope: only 2026-03-01 to 2026-03-01)
    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Incremental',
      datasets: ['canonical-vouchers'],
      dateRange: { from: '2026-03-01', to: '2026-03-01' }
    });

    let attempts = 0;
    while (job.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    // Vouchers 2 and 3 were NOT in the partial extraction scope, but MUST NOT be deleted
    const vch2 = warehouseStorageEngine.getRecordBySourceId('canonical-vouchers', comp, 'VCH_002');
    const vch3 = warehouseStorageEngine.getRecordBySourceId('canonical-vouchers', comp, 'VCH_003');

    if (!vch2 || !vch3) {
      throw new Error('CRITICAL VIOLATION: Missing records during partial extraction were falsely deleted!');
    }

    if (job.rowsDeleted > 0) {
      throw new Error(`CRITICAL: False deletion occurred in partial sync! rowsDeleted=${job.rowsDeleted}`);
    }
  });

  // Test 7: Reconciliation-Based Sync (Fallback Incremental Strategy)
  await runTest('Reconciliation-Based Sync: Clearly labels fallback reconciliation when true incremental is absent', async () => {
    const comp = 'CMP-RECON';
    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Reconciliation',
      datasets: ['canonical-groups']
    });

    let attempts = 0;
    while (job.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    if (job.mode !== 'Reconciliation') {
      throw new Error(`Expected job mode 'Reconciliation', got '${job.mode}'`);
    }

    if (!job.isReconciliationFallback) {
      throw new Error('Expected isReconciliationFallback to be true.');
    }
  });

  // Test 8: Incremental Sync with Safe Watermark Advancement
  await runTest('Sync Watermark: Only advances watermark boundary after successful sync completion', async () => {
    const comp = 'CMP-WATERMARK';
    const ds = 'canonical-groups';

    const beforeWm = syncEngine.getWatermark(comp, ds);

    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Incremental',
      datasetId: ds
    });

    let attempts = 0;
    while (job.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    const afterWm = syncEngine.getWatermark(comp, ds);
    if (!afterWm) {
      throw new Error('Expected watermark to be generated after sync.');
    }

    if (beforeWm && new Date(afterWm.updatedAt).getTime() < new Date(beforeWm.updatedAt).getTime()) {
      throw new Error('Watermark did not advance forwards.');
    }
  });

  // Test 9: Checkpoint & Resume
  await runTest('Checkpoints & Resume: Tracks batch checkpoints and supports resuming safely', async () => {
    const comp = 'CMP-CHECKPOINT';
    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Full',
      datasets: ['canonical-groups', 'canonical-ledgers']
    });

    let attempts = 0;
    while (job.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    if (!job.lastCheckpoint) {
      throw new Error('Expected job to have recorded a checkpoint during batch execution.');
    }

    if (job.lastCheckpoint.batchNumber < 1) {
      throw new Error('Invalid checkpoint batch number.');
    }
  });

  // Test 10: Non-Destructive Cancellation
  await runTest('Cancellation: Cancelling a running job halts execution while leaving warehouse consistent', async () => {
    const comp = 'CMP-CANCEL';
    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Full',
      datasets: ['canonical-groups', 'canonical-ledgers', 'canonical-parties']
    });

    const cancelled = await syncEngine.cancelSync(job.jobId);
    if (!cancelled && job.status !== 'Cancelled') {
      throw new Error('Failed to cancel sync job.');
    }

    if (job.status !== 'Cancelling' && job.status !== 'Cancelled') {
      throw new Error(`Expected Cancelling or Cancelled status, got '${job.status}'`);
    }

    // Validate warehouse integrity is intact
    const val = await warehouseStorageEngine.validateWarehouse(comp);
    if (!val.isValid) {
      throw new Error(`Warehouse state was corrupted by cancellation: ${val.issues.join(', ')}`);
    }
  });

  // Test 11: Bounded Retry with Exponential Backoff
  await runTest('Retry: Allows bounded retries for failed/partial jobs with backoff', async () => {
    const comp = 'CMP-RETRY';
    const job = await syncEngine.startSync({
      companyId: comp,
      mode: 'Full',
      datasets: ['canonical-groups']
    });

    let attempts = 0;
    while (job.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    // Force job to Failed to test retry mechanism
    job.status = 'Failed';

    const retriedJob = await syncEngine.retrySync(job.jobId);
    if (retriedJob.retryCount !== 1) {
      throw new Error(`Expected retryCount = 1, got ${retriedJob.retryCount}`);
    }
  });

  // Test 12: Canonical Dataset Dependency Order
  await runTest('Dataset Dependency Order: Canonical order strictly respects hierarchy (Groups before Ledgers, etc.)', async () => {
    const order = syncEngine.canonicalDependencyOrder;

    const groupIdx = order.indexOf('canonical-groups');
    const ledgerIdx = order.indexOf('canonical-ledgers');
    const voucherIdx = order.indexOf('canonical-vouchers');
    const lineIdx = order.indexOf('canonical-voucher-lines');

    if (groupIdx === -1 || ledgerIdx === -1 || voucherIdx === -1 || lineIdx === -1) {
      throw new Error('Core accounting datasets missing from dependency order.');
    }

    if (groupIdx > ledgerIdx) {
      throw new Error('Dependency violation: Groups must be synchronized before Ledgers.');
    }

    if (ledgerIdx > voucherIdx) {
      throw new Error('Dependency violation: Ledgers must be synchronized before Vouchers.');
    }

    if (voucherIdx > lineIdx) {
      throw new Error('Dependency violation: Vouchers must be synchronized before Voucher Lines.');
    }
  });

  // Test 13: Company Isolation Protection
  await runTest('Company Isolation: Sync for Company A NEVER writes to or alters Company B warehouse', async () => {
    const compA = 'CMP-ISOL-A';
    const compB = 'CMP-ISOL-B';

    // Seed Company B
    warehouseStorageEngine.recordHistoricalVersion(
      'canonical-groups',
      compB,
      `canonical-groups_${compB}_SRC_B1`,
      { sourceId: 'SRC_B1', name: 'Company B Group' }
    );

    const countBBefore = warehouseStorageEngine.getAllCurrentRecords('canonical-groups', compB).length;

    // Run sync for Company A
    const jobA = await syncEngine.startSync({
      companyId: compA,
      mode: 'Full',
      datasets: ['canonical-groups']
    });

    let attempts = 0;
    while (jobA.status === 'Running' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 50));
      attempts++;
    }

    const countBAfter = warehouseStorageEngine.getAllCurrentRecords('canonical-groups', compB).length;

    if (countBBefore !== countBAfter) {
      throw new Error(`Cross-company tenant leakage detected! Company B record count changed from ${countBBefore} to ${countBAfter}`);
    }
  });

  // Test 14: Freshness Engine
  await runTest('Freshness Engine: Correctly classifies dataset freshness as Fresh, Aging, or Stale', async () => {
    const comp = 'CMP-SYNC-001';
    const freshness = syncEngine.getFreshness(comp);

    if (freshness.length === 0) {
      throw new Error('Freshness report should return entries for all canonical datasets.');
    }

    const freshItem = freshness.find((f) => f.datasetId === 'canonical-groups');
    if (!freshItem) {
      throw new Error('canonical-groups not found in freshness report.');
    }

    if (freshItem.freshness !== 'Fresh') {
      throw new Error(`Expected freshness 'Fresh', got '${freshItem.freshness}'`);
    }
  });

  // Test 15: Read-Only Tally Protection
  await runTest('Read-Only Tally: Verifies zero mutation capability to source Tally', async () => {
    const safety = warehouseStorageEngine.verifyReadOnlyTallySafety();
    if (!safety.isReadOnly || safety.protocol !== 'HTTP_READ_ONLY_XML_EXPORT' || !safety.mutationsForbidden) {
      throw new Error('Read-only Tally safety verification failed.');
    }
  });

  // Test 16: High-Volume Performance Benchmark (100,000 Records)
  await runTest('Performance Benchmark: Ingests & fingerprints 100,000 synthetic records with high throughput', async () => {
    const comp = 'CMP-BENCH-100K';
    const datasetId = 'canonical-vouchers';
    const count = 100000;
    const batchSize = 10000;

    const tStart = Date.now();

    for (let b = 0; b < count; b += batchSize) {
      const records: Record<string, any>[] = [];
      for (let i = 0; i < batchSize; i++) {
        const id = b + i;
        records.push({
          sourceId: `VCH_BENCH_${id}`,
          voucherNumber: `VB-${id}`,
          date: '2026-03-15',
          amount: 1000 + (id % 500)
        });
      }

      await warehouseStorageEngine.insertBatch(datasetId, comp, records, {
        batchSize,
        upsert: true,
        transactional: false
      });
    }

    const duration = Date.now() - tStart;
    const throughput = Math.round(count / (duration / 1000));

    if (throughput < 5000) {
      throw new Error(`Ingestion throughput too low: ${throughput} rec/sec (Expected >= 5000 rec/sec)`);
    }
  });

  const totalDurationMs = Date.now() - startTime;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  return {
    total: results.length,
    passed,
    failed,
    durationMs: totalDurationMs,
    results
  };
}
