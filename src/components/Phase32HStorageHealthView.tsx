/**
 * Phase 32H - STORAGE & SYSTEM HEALTH DASHBOARD
 * Visual storage breakdown, health metrics, cache cleanup, index optimization, and compaction.
 */

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Database,
  Cpu,
  Layers,
  Archive,
  ShieldCheck
} from 'lucide-react';
import { StorageBreakdown, StorageHealthStatus } from '../types/phase32HOperationalSafety';

export const Phase32HStorageHealthView: React.FC = () => {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [healthStatus, setHealthStatus] = useState<StorageHealthStatus>('Healthy');
  const [healthIssues, setHealthIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchStorageMetrics();
  }, []);

  const fetchStorageMetrics = async () => {
    try {
      setLoading(true);
      const [bdRes, hlRes] = await Promise.all([
        fetch('/api/safety/storage/breakdown'),
        fetch('/api/safety/storage/health')
      ]);

      const bdData = await bdRes.json();
      const hlData = await hlRes.json();

      if (bdData.success) setBreakdown(bdData.breakdown);
      if (hlData.success) {
        setHealthStatus(hlData.health.status);
        setHealthIssues(hlData.health.issues);
      }
    } catch (err) {
      console.error('Error fetching storage metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanCache = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/safety/storage/clean-cache', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Cache Cleanup Complete: Freed ${(data.bytesFreed / 1024).toFixed(1)} KB across ${data.itemsRemoved} expired entries.`);
        fetchStorageMetrics();
      }
    } catch (err) {
      console.error('Error cleaning cache:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVacuum = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/safety/storage/vacuum', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Database Vacuum Complete: Reclaimed ${(data.bytesReclaimed / (1024 * 1024)).toFixed(2)} MB in ${data.durationMs}ms.`);
        fetchStorageMetrics();
      }
    } catch (err) {
      console.error('Error running vacuum:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardDrive className="w-7 h-7 text-indigo-600" />
            STORAGE & SYSTEM HEALTH
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Local Disk Usage, Memory Compaction, Query Cache Cleanup & Database Maintenance
          </p>
        </div>

        <button
          onClick={fetchStorageMetrics}
          disabled={loading}
          className="bg-indigo-600 text-white text-xs px-3.5 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-1.5 font-medium shadow-xs self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Storage Metrics
        </button>
      </div>

      {/* Health Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        healthStatus === 'Healthy'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : healthStatus === 'Warning'
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-red-50 border-red-200 text-red-900'
      }`}>
        <div className="flex items-center gap-3">
          {healthStatus === 'Healthy' ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-bold">Storage Health: {healthStatus.toUpperCase()}</h3>
            <p className="text-xs mt-0.5 opacity-90">
              {healthIssues.length > 0 ? healthIssues.join(' ') : 'Local storage usage is optimal. Disk capacity and low-storage protections are active.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanCache}
            className="bg-white border border-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded font-semibold hover:bg-slate-50"
          >
            Clean Query Cache
          </button>
          <button
            onClick={handleVacuum}
            className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-semibold hover:bg-indigo-700"
          >
            Vacuum & Compact DB
          </button>
        </div>
      </div>

      {/* Storage Breakdown Cards */}
      {breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs space-y-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Warehouse Storage
            </span>
            <p className="text-xl font-bold text-gray-900">{(breakdown.warehouseSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-[11px] text-gray-500">Local normalized & indexed financial records</p>
          </div>

          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs space-y-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Snapshots Size
            </span>
            <p className="text-xl font-bold text-gray-900">{(breakdown.snapshotsSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-[11px] text-gray-500">Historical immutable dataset state baselines</p>
          </div>

          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs space-y-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-amber-600" />
              Backups Storage
            </span>
            <p className="text-xl font-bold text-gray-900">{(breakdown.backupsSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-[11px] text-gray-500">Full local EXFIN cryptographic backup manifests</p>
          </div>
        </div>
      )}

      {/* Disk Usage Progress */}
      {breakdown && (
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
            <span>Disk Usage Capacity ({breakdown.diskUsagePercent}% Used)</span>
            <span>Available: {(breakdown.availableDiskBytes / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                breakdown.diskUsagePercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(breakdown.diskUsagePercent * 5, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};
