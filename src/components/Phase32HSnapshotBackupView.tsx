/**
 * Phase 32H - BACKUP & RESTORE / SNAPSHOT MANAGER VIEW
 * Complete snapshot lifecycle, cryptographic backup generation, backup validation, restore preview,
 * company-scoped restore execution, and safety confirmation modal.
 */

import React, { useState, useEffect } from 'react';
import {
  Archive,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  FileText,
  Lock,
  Trash2,
  Sliders,
  History,
  Activity
} from 'lucide-react';
import {
  SnapshotMetadata,
  BackupManifest,
  BackupValidationResult,
  RestoreLog
} from '../types/phase32HOperationalSafety';

export const Phase32HSnapshotBackupView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BACKUPS' | 'SNAPSHOTS' | 'RESTORE_LOGS'>('BACKUPS');
  const [backups, setBackups] = useState<BackupManifest[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupManifest | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState<boolean>(false);
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [restoreLog, setRestoreLog] = useState<RestoreLog | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('CMP-001');

  useEffect(() => {
    fetchBackups();
    fetchSnapshots();
  }, [selectedCompanyId]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/safety/backups?companyId=${selectedCompanyId}`);
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    try {
      const res = await fetch(`/api/safety/snapshots?companyId=${selectedCompanyId}`);
      const data = await res.json();
      if (data.success) {
        setSnapshots(data.snapshots);
      }
    } catch (err) {
      console.error('Error fetching snapshots:', err);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/safety/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: [selectedCompanyId], user: 'System Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Backup '${data.backup.backupId}' created successfully with SHA-256 checksum ${data.backup.checksum.slice(0, 12)}...`);
        fetchBackups();
      }
    } catch (err) {
      console.error('Error creating backup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/safety/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompanyId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Snapshot '${data.snapshot.snapshotId}' created successfully (${data.snapshot.totalRecords} records).`);
        fetchSnapshots();
      }
    } catch (err) {
      console.error('Error creating snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateBackup = async (backupId: string) => {
    try {
      const res = await fetch(`/api/safety/backups/${backupId}/validate`);
      const data = await res.json();
      if (data.success) {
        setValidationResult(data.validation);
        alert(`Backup Validation: ${data.validation.isValid ? 'PASSED (Cryptographic Checksum Matched)' : 'FAILED'}`);
      }
    } catch (err) {
      console.error('Error validating backup:', err);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackup) return;
    try {
      setRestoreStatus('Restoring local EXFIN warehouse...');
      const res = await fetch('/api/safety/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackup.backupId,
          targetCompanyId: selectedCompanyId,
          createCheckpoint: true,
          user: 'Admin User'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRestoreLog(data.log);
        setRestoreStatus('COMPLETED');
        alert(`Restore Completed! Restored ${data.log.recordsRestored} records into LOCAL EXFIN warehouse.`);
        fetchBackups();
        fetchSnapshots();
      } else {
        setRestoreStatus('FAILED');
        alert(`Restore Failed: ${data.log?.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error restoring backup:', err);
      setRestoreStatus('FAILED');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="w-7 h-7 text-indigo-600" />
            BACKUP, RESTORE & SNAPSHOT MANAGEMENT
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Local Warehouse Backups, Cryptographic Integrity Checks & Company-Scoped Snapshots
          </p>
        </div>

        {/* Read-Only Safety Callout */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tally Read-Only Protection: Backups & Restores apply <strong>ONLY to Local EXFIN Warehouse</strong>. Tally is NEVER modified.</span>
        </div>
      </div>

      {/* Company Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700">Company Scope:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-3 py-1.5 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="CMP-001">CMP-001 (ABC Trading Ltd)</option>
            <option value="CMP-002">CMP-002 (XYZ Enterprises)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="bg-indigo-600 text-white text-xs px-3.5 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-1.5 font-medium shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Create Local Backup
          </button>

          <button
            onClick={handleCreateSnapshot}
            disabled={loading}
            className="bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-1.5 font-medium shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            Create Warehouse Snapshot
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab('BACKUPS')}
          className={`pb-2 px-3 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'BACKUPS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Archive className="w-4 h-4" />
          Backups Registry ({backups.length})
        </button>

        <button
          onClick={() => setActiveTab('SNAPSHOTS')}
          className={`pb-2 px-3 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'SNAPSHOTS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Snapshot Manager ({snapshots.length})
        </button>
      </div>

      {/* TAB 1: BACKUPS REGISTRY */}
      {activeTab === 'BACKUPS' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-600" />
            Local Warehouse Backups Manifest
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-3">Backup ID</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Company Scope</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Checksum</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {backups.map((bkp) => (
                  <tr key={bkp.backupId} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-indigo-700">{bkp.backupId}</td>
                    <td className="p-3 text-slate-600">{new Date(bkp.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-700 font-medium">{bkp.companyIds.join(', ')}</td>
                    <td className="p-3 text-slate-800 font-semibold">{bkp.recordCounts.warehouseRecords}</td>
                    <td className="p-3 text-slate-600">{(bkp.totalSizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500" title={bkp.checksum}>{bkp.checksum.slice(0, 12)}...</td>
                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {bkp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleValidateBackup(bkp.backupId)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Validate Checksum
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBackup(bkp);
                          setRestoreModalOpen(true);
                        }}
                        className="text-xs text-amber-700 hover:text-amber-900 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded"
                      >
                        Restore Backup
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SNAPSHOT MANAGER */}
      {activeTab === 'SNAPSHOTS' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Snapshot Manager & Protection
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-3">Snapshot ID</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total Records</th>
                  <th className="p-3">Datasets</th>
                  <th className="p-3">Protection</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {snapshots.map((snp) => (
                  <tr key={snp.snapshotId} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-indigo-700">{snp.snapshotId}</td>
                    <td className="p-3 text-slate-600">{new Date(snp.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-700 font-medium">{snp.companyId}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {snp.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800 font-semibold">{snp.totalRecords}</td>
                    <td className="p-3 text-slate-600 text-[11px]">{snp.datasetIds.join(', ')}</td>
                    <td className="p-3">
                      {snp.isProtected ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3 text-amber-600" />
                          Protected
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/safety/snapshots/${snp.snapshotId}/restore`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ companyId: selectedCompanyId })
                          });
                          const d = await res.json();
                          if (d.success) {
                            alert(`Snapshot '${snp.snapshotId}' restored. Safety Checkpoint ID: ${d.checkpointId}`);
                            fetchSnapshots();
                          }
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded"
                      >
                        Restore Snapshot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreModalOpen && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 text-amber-600 border-b border-gray-100 pb-3">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Warehouse Restore</h3>
                <p className="text-xs text-gray-500">Operation Scope: Local Application & Analytical Warehouse</p>
              </div>
            </div>

            {/* MANDATORY WARNING MANDATE */}
            <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-lg text-xs text-amber-900 font-semibold space-y-1">
              <p className="text-sm font-bold text-amber-900">⚠️ IMPORTANT RESTORE SAFETY NOTICE:</p>
              <p>• This operation changes the <strong>LOCAL EXFIN warehouse</strong>.</p>
              <p>• Tally data will <strong>NOT</strong> be modified under any circumstances.</p>
              <p>• A pre-restore recovery checkpoint snapshot will be automatically generated before overwriting local records.</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <p><strong>Target Backup:</strong> <code className="font-mono text-indigo-700">{selectedBackup.backupId}</code></p>
              <p><strong>Target Company:</strong> {selectedCompanyId}</p>
              <p><strong>Warehouse Records to Restore:</strong> {selectedBackup.recordCounts.warehouseRecords}</p>
              <p><strong>Cryptographic Checksum:</strong> <code className="font-mono text-slate-600">{selectedBackup.checksum}</code></p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="text-xs px-4 py-2 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setRestoreModalOpen(false);
                  handleExecuteRestore();
                }}
                className="text-xs px-4 py-2 rounded-md bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs"
              >
                Confirm & Execute Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
