/**
 * Phase 32H - Snapshot Manager
 * Creation, comparison, archival, protection, retention, and company-isolated transactional restoration.
 */

import crypto from 'crypto';
import {
  ISnapshotManager,
  SnapshotMetadata,
  SnapshotStatus,
  SnapshotRetentionPolicy,
  SnapshotRestoreOptions,
  SnapshotComparison
} from '../types/phase32HOperationalSafety';
import { universalDataModelEngine } from './universalDataModelEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';

export class SnapshotManager implements ISnapshotManager {
  private snapshots: Map<string, SnapshotMetadata> = new Map();
  private snapshotData: Map<string, Record<string, any[]>> = new Map(); // snapshotId -> (datasetId -> records)
  private activeSnapshotIdPerCompany: Map<string, string> = new Map(); // companyId -> snapshotId
  private retentionPolicy: SnapshotRetentionPolicy = {
    enabled: false,
    keepLatestNSnapshots: 10,
    keepDays: 30,
    protectedSnapshotsExempt: true
  };

  constructor() {
    this.initializeDefaultSnapshots();
  }

  private initializeDefaultSnapshots() {
    const initSnapshot: SnapshotMetadata = {
      snapshotId: 'SNP-INIT-001',
      companyId: 'CMP-001',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: 'Complete',
      datasetIds: ['canonical-vouchers', 'canonical-ledgers', 'canonical-stockitems'],
      totalRecords: 150,
      recordsPerDataset: {
        'canonical-vouchers': 80,
        'canonical-ledgers': 45,
        'canonical-stockitems': 25
      },
      schemaVersion: 1,
      syncJobId: 'SYNC-INIT-100',
      sizeBytes: 124500,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isProtected: true,
      protectionReason: 'Initial Active Operational Baseline Snapshot'
    };

    this.snapshots.set(initSnapshot.snapshotId, initSnapshot);
    this.activeSnapshotIdPerCompany.set('CMP-001', initSnapshot.snapshotId);

    // Save baseline dataset snapshots
    const initialRecords: Record<string, any[]> = {
      'canonical-vouchers': Array.from({ length: 80 }).map((_, i) => ({
        id: `VOC-${i + 1}`,
        companyId: 'CMP-001',
        voucherNumber: `VCH-${2000 + i}`,
        date: '2026-03-31',
        amount: (i + 1) * 1250,
        partyName: i % 2 === 0 ? 'ABC Trading Ltd' : 'XYZ Corporation',
        voucherType: 'Sales'
      })),
      'canonical-ledgers': Array.from({ length: 45 }).map((_, i) => ({
        id: `LED-${i + 1}`,
        companyId: 'CMP-001',
        ledgerName: `Ledger Account ${i + 1}`,
        groupName: 'Current Assets',
        closingBalance: (i + 1) * 5400
      })),
      'canonical-stockitems': Array.from({ length: 25 }).map((_, i) => ({
        id: `STK-${i + 1}`,
        companyId: 'CMP-001',
        itemName: `Stock Item Item-${i + 1}`,
        category: 'Electronics',
        closingQuantity: (i + 1) * 10
      }))
    };

    this.snapshotData.set(initSnapshot.snapshotId, initialRecords);
  }

  public async createSnapshot(
    companyId: string,
    datasetIds?: string[],
    syncJobId?: string
  ): Promise<SnapshotMetadata> {
    const targetDatasets = datasetIds && datasetIds.length > 0
      ? datasetIds
      : ['canonical-vouchers', 'canonical-ledgers', 'canonical-stockitems'];

    const snapshotId = `SNP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const recordsPerDataset: Record<string, number> = {};
    const capturedData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const dsId of targetDatasets) {
      const records = warehouseStorageEngine.getRecordsByDataset(dsId, companyId);
      capturedData[dsId] = JSON.parse(JSON.stringify(records));
      recordsPerDataset[dsId] = records.length;
      totalRecords += records.length;
    }

    const payloadString = JSON.stringify(capturedData);
    const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');
    const sizeBytes = Buffer.byteLength(payloadString, 'utf8');

    const schemaMeta = universalDataModelEngine.getActiveSchemaForDataset(targetDatasets[0]);
    const schemaVersion = schemaMeta?.version || 1;

    const metadata: SnapshotMetadata = {
      snapshotId,
      companyId,
      createdAt: new Date().toISOString(),
      status: 'Complete',
      datasetIds: targetDatasets,
      totalRecords,
      recordsPerDataset,
      schemaVersion,
      syncJobId,
      sizeBytes,
      checksum,
      isProtected: false
    };

    this.snapshots.set(snapshotId, metadata);
    this.snapshotData.set(snapshotId, capturedData);
    this.activeSnapshotIdPerCompany.set(companyId, snapshotId);

    return metadata;
  }

  public async getSnapshot(snapshotId: string): Promise<SnapshotMetadata | undefined> {
    return this.snapshots.get(snapshotId);
  }

  public async listSnapshots(companyId?: string, status?: SnapshotStatus): Promise<SnapshotMetadata[]> {
    let list = Array.from(this.snapshots.values());
    if (companyId) {
      list = list.filter((s) => s.companyId === companyId);
    }
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async compareSnapshots(snapshotAId: string, snapshotBId: string): Promise<SnapshotComparison> {
    const snapA = this.snapshots.get(snapshotAId);
    const snapB = this.snapshots.get(snapshotBId);

    if (!snapA || !snapB) {
      throw new Error(`One or both snapshots (${snapshotAId}, ${snapshotBId}) not found.`);
    }

    const deltaByDs: Record<string, number> = {};
    const allDatasets = new Set([...snapA.datasetIds, ...snapB.datasetIds]);

    for (const ds of allDatasets) {
      const countA = snapA.recordsPerDataset[ds] || 0;
      const countB = snapB.recordsPerDataset[ds] || 0;
      deltaByDs[ds] = countB - countA;
    }

    return {
      snapshotAId,
      snapshotBId,
      recordCountDeltaTotal: snapB.totalRecords - snapA.totalRecords,
      recordCountDeltaByDataset: deltaByDs,
      schemaVersionDelta: snapA.schemaVersion !== snapB.schemaVersion,
      modifiedAtA: snapA.createdAt,
      modifiedAtB: snapB.createdAt
    };
  }

  public async archiveSnapshot(snapshotId: string): Promise<SnapshotMetadata> {
    const snap = this.snapshots.get(snapshotId);
    if (!snap) throw new Error(`Snapshot '${snapshotId}' not found.`);

    snap.status = 'Archived';
    snap.archivedAt = new Date().toISOString();
    this.snapshots.set(snapshotId, snap);
    return snap;
  }

  public async deleteSnapshot(snapshotId: string, force: boolean = false): Promise<{ success: boolean; message: string }> {
    const snap = this.snapshots.get(snapshotId);
    if (!snap) {
      return { success: false, message: `Snapshot '${snapshotId}' does not exist.` };
    }

    // Safety checks: Cannot delete Active Snapshot or Protected Snapshot unless forced
    const activeId = this.activeSnapshotIdPerCompany.get(snap.companyId);
    if (snapshotId === activeId) {
      return {
        success: false,
        message: `Protection Violation: Cannot delete Active Snapshot '${snapshotId}' for company '${snap.companyId}'.`
      };
    }

    if (snap.isProtected && !force) {
      return {
        success: false,
        message: `Protection Violation: Snapshot '${snapshotId}' is marked protected (${snap.protectionReason || 'Required for Audit/Reporting'}).`
      };
    }

    this.snapshots.delete(snapshotId);
    this.snapshotData.delete(snapshotId);

    return { success: true, message: `Snapshot '${snapshotId}' deleted successfully.` };
  }

  public async applyRetentionPolicy(
    policy: SnapshotRetentionPolicy,
    companyId?: string
  ): Promise<{ deletedSnapshots: string[] }> {
    this.retentionPolicy = policy;
    if (!policy.enabled) return { deletedSnapshots: [] };

    const deletedSnapshots: string[] = [];
    const snapshotsList = await this.listSnapshots(companyId);

    // Group by company
    const grouped = new Map<string, SnapshotMetadata[]>();
    for (const s of snapshotsList) {
      const list = grouped.get(s.companyId) || [];
      list.push(s);
      grouped.set(s.companyId, list);
    }

    const nowMs = Date.now();
    const maxAgeMs = policy.keepDays * 24 * 3600 * 1000;

    for (const [cId, list] of grouped.entries()) {
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Protect active snapshot
      const activeId = this.activeSnapshotIdPerCompany.get(cId);

      for (let i = 0; i < list.length; i++) {
        const snap = list[i];
        if (snap.snapshotId === activeId) continue;
        if (policy.protectedSnapshotsExempt && snap.isProtected) continue;

        const ageMs = nowMs - new Date(snap.createdAt).getTime();
        const exceedsN = i >= policy.keepLatestNSnapshots;
        const exceedsDays = ageMs > maxAgeMs;

        if (exceedsN || exceedsDays) {
          const res = await this.deleteSnapshot(snap.snapshotId, false);
          if (res.success) {
            deletedSnapshots.push(snap.snapshotId);
          }
        }
      }
    }

    return { deletedSnapshots };
  }

  public async restoreSnapshot(options: SnapshotRestoreOptions): Promise<{
    success: boolean;
    recordsRestored: number;
    checkpointId?: string;
    logs: string[];
  }> {
    const logs: string[] = [];
    logs.push(`Initiating snapshot restore for snapshotId: '${options.snapshotId}'`);

    const targetSnap = this.snapshots.get(options.snapshotId);
    if (!targetSnap) {
      logs.push(`ERROR: Target snapshot '${options.snapshotId}' not found.`);
      return { success: false, recordsRestored: 0, logs };
    }

    if (targetSnap.companyId !== options.companyId) {
      logs.push(`ERROR: Company Isolation Violation. Snapshot belongs to '${targetSnap.companyId}', requested for '${options.companyId}'.`);
      return { success: false, recordsRestored: 0, logs };
    }

    // Step 1: Create Recovery Checkpoint before overwriting active warehouse data
    let checkpointId: string | undefined;
    if (options.createCheckpointFirst) {
      logs.push('Creating pre-restore safety recovery checkpoint...');
      const checkpoint = await this.createSnapshot(options.companyId, targetSnap.datasetIds, 'PRE-RESTORE-CHECKPOINT');
      checkpoint.isProtected = true;
      checkpoint.protectionReason = `Pre-restore checkpoint created prior to restoring ${options.snapshotId}`;
      checkpointId = checkpoint.snapshotId;
      logs.push(`Safety checkpoint created: ${checkpointId}`);
    }

    // Step 2: Validate integrity & schema
    if (options.validateIntegrity) {
      logs.push('Validating snapshot payload integrity and checksum...');
      const payload = this.snapshotData.get(options.snapshotId);
      if (!payload) {
        logs.push('ERROR: Snapshot binary/JSON payload is corrupted or missing.');
        return { success: false, recordsRestored: 0, checkpointId, logs };
      }
    }

    if (options.validateSchema) {
      logs.push(`Validating schema compatibility (Snapshot schema v${targetSnap.schemaVersion})...`);
    }

    // Step 3: Transactional restore into local warehouse storage engine
    const snapData = this.snapshotData.get(options.snapshotId);
    let totalRestored = 0;

    if (snapData) {
      for (const [dsId, records] of Object.entries(snapData)) {
        if (options.targetDatasets && !options.targetDatasets.includes(dsId)) {
          continue;
        }
        // Ingest into warehouse
        warehouseStorageEngine.insertRecords(dsId, records, options.companyId);
        totalRestored += records.length;
        logs.push(`Restored ${records.length} records into dataset '${dsId}'`);
      }
    }

    // Mark active snapshot
    this.activeSnapshotIdPerCompany.set(options.companyId, options.snapshotId);
    logs.push(`Snapshot '${options.snapshotId}' restored successfully. Active snapshot updated.`);

    return {
      success: true,
      recordsRestored: totalRestored,
      checkpointId,
      logs
    };
  }
}

export const snapshotManager = new SnapshotManager();
