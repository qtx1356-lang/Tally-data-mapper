/**
 * Phase 32D - Local Analytical Warehouse Explorer & Management UI
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Play,
  Key,
  FolderTree,
  TrendingUp,
  Activity,
  Calendar,
  Tag,
  Boxes,
  FileCode,
  Zap,
  HardDrive,
  RefreshCw,
  Sliders,
  Check,
  BarChart3
} from 'lucide-react';
import {
  WarehouseHealthReport,
  DatasetStorageStats,
  WarehouseSnapshot,
  WarehouseIndexDefinition,
  WarehouseQueryResult
} from '../types/phase32DWarehouse';

export const Phase32DWarehouseView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'Overview' | 'Query Studio' | 'Dimensions' | 'Snapshots' | 'Indexes' | 'Benchmark' | 'Test Suite'
  >('Overview');

  const [companyId, setCompanyId] = useState<string>('CMP-001');
  const [health, setHealth] = useState<WarehouseHealthReport | null>(null);
  const [datasets, setDatasets] = useState<DatasetStorageStats[]>([]);
  const [snapshots, setSnapshots] = useState<WarehouseSnapshot[]>([]);
  const [indexes, setIndexes] = useState<WarehouseIndexDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Query Studio States
  const [queryDataset, setQueryDataset] = useState<string>('canonical-vouchers');
  const [queryFilterField, setQueryFilterField] = useState<string>('voucherType');
  const [queryFilterOp, setQueryFilterOp] = useState<string>('EQ');
  const [queryFilterVal, setQueryFilterVal] = useState<string>('Sales');
  const [queryAggField, setQueryAggField] = useState<string>('amount');
  const [queryAggFunc, setQueryAggFunc] = useState<string>('SUM');
  const [queryResult, setQueryResult] = useState<WarehouseQueryResult | null>(null);
  const [queryRunning, setQueryRunning] = useState<boolean>(false);

  // Snapshot Comparison States
  const [snapA, setSnapA] = useState<string>('');
  const [snapB, setSnapB] = useState<string>('');
  const [comparePlan, setComparePlan] = useState<any | null>(null);

  // Benchmark States
  const [benchCount, setBenchCount] = useState<number>(25000);
  const [benchResult, setBenchResult] = useState<any | null>(null);
  const [benchRunning, setBenchRunning] = useState<boolean>(false);

  // Test Suite States
  const [testReport, setTestReport] = useState<any | null>(null);
  const [testsRunning, setTestsRunning] = useState<boolean>(false);

  useEffect(() => {
    fetchWarehouseData();
  }, [companyId]);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const [hRes, dRes, sRes, iRes] = await Promise.all([
        fetch('/api/warehouse/health').then((r) => r.json()),
        fetch(`/api/warehouse/datasets?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/warehouse/snapshots?companyId=${companyId}`).then((r) => r.json()),
        fetch(`/api/warehouse/indexes?companyId=${companyId}`).then((r) => r.json())
      ]);

      if (hRes.success) setHealth(hRes.data);
      if (dRes.success) setDatasets(dRes.data);
      if (sRes.success) {
        setSnapshots(sRes.data);
        if (sRes.data.length >= 2) {
          setSnapA(sRes.data[0].snapshotId);
          setSnapB(sRes.data[1].snapshotId);
        } else if (sRes.data.length === 1) {
          setSnapA(sRes.data[0].snapshotId);
        }
      }
      if (iRes.success) setIndexes(iRes.data);
    } catch (err: any) {
      console.error('Failed to load warehouse data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = async () => {
    setQueryRunning(true);
    try {
      const res = await fetch('/api/warehouse/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: queryDataset,
          companyId,
          filters: queryFilterVal
            ? [{ field: queryFilterField, operator: queryFilterOp, value: queryFilterVal }]
            : [],
          aggregations: queryAggField && queryAggFunc
            ? [{ field: queryAggField, function: queryAggFunc, alias: `agg_${queryAggFunc.toLowerCase()}` }]
            : [],
          limit: 25
        })
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data.data);
      }
    } catch (err: any) {
      console.error('Query failed', err);
    } finally {
      setQueryRunning(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch('/api/warehouse/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, metadata: { trigger: 'Manual UI Trigger' } })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Created snapshot ${data.data.snapshotId}`);
        fetchWarehouseData();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Snapshot failed', err);
    }
  };

  const handleCompareSnapshots = async () => {
    if (!snapA || !snapB) return;
    try {
      const res = await fetch('/api/warehouse/snapshots/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseSnapshotId: snapB, targetSnapshotId: snapA, companyId })
      });
      const data = await res.json();
      if (data.success) {
        setComparePlan(data.data);
      }
    } catch (err: any) {
      console.error('Compare failed', err);
    }
  };

  const handleMaintenance = async (op: 'optimize' | 'compact' | 'validate' | 'rebuild') => {
    try {
      let endpoint = `/api/warehouse/maintenance/${op}`;
      if (op === 'rebuild') endpoint = '/api/warehouse/indexes/rebuild';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Maintenance operation '${op}' completed successfully.`);
        fetchWarehouseData();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Maintenance failed', err);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchRunning(true);
    try {
      const res = await fetch('/api/warehouse/benchmark-synthetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: benchCount, companyId: 'CMP-BENCH-01', batchSize: 5000 })
      });
      const data = await res.json();
      if (data.success) {
        setBenchResult(data.benchmark);
      }
    } catch (err: any) {
      console.error('Benchmark error', err);
    } finally {
      setBenchRunning(false);
    }
  };

  const handleRunTests = async () => {
    setTestsRunning(true);
    try {
      const res = await fetch('/api/warehouse/run-phase32d-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setTestReport(data.report);
    } catch (err: any) {
      console.error('Tests failed', err);
    } finally {
      setTestsRunning(false);
    }
  };

  return (
    <div className="space-y-6" id="phase32d-warehouse-container">
      {/* Header & Company Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Local Analytical Warehouse (Phase 32D)
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                  Columnar & Indexed
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Reliable local analytical warehouse with company isolation, Fact/Dimension semantics, and sub-millisecond queries
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Building2 className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs font-medium text-slate-500 mr-2">Tenant:</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="CMP-001">Acme Enterprise (CMP-001)</option>
              <option value="CMP-002">Zenith Global (CMP-002)</option>
              <option value="CMP-003">Nexus Tech (CMP-003)</option>
            </select>
          </div>

          <button
            onClick={fetchWarehouseData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
        {(
          [
            { id: 'Overview', label: 'Warehouse Overview', icon: Database },
            { id: 'Query Studio', label: 'Query Engine', icon: Search },
            { id: 'Dimensions', label: 'Date & Master Dimensions', icon: Calendar },
            { id: 'Snapshots', label: 'Snapshots & Diffs (Phase 32E Ready)', icon: Boxes },
            { id: 'Indexes', label: 'Indexes & Composite Keys', icon: Zap },
            { id: 'Benchmark', label: '100K+ Record Benchmark', icon: TrendingUp },
            { id: 'Test Suite', label: 'Regression & Security Tests', icon: ShieldCheck }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: OVERVIEW & DATASETS */}
      {activeSubTab === 'Overview' && (
        <div className="space-y-6">
          {/* Health Metrics Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engine Status</span>
                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  {health?.databaseStatus || 'Healthy'}
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {health?.totalRecordsCount.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total normalized records stored</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Memory</span>
                <HardDrive className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {health ? `${(health.storageSizeBytes / 1024).toFixed(1)} KB` : '0 KB'}
              </div>
              <p className="text-xs text-slate-500 mt-1">{health?.totalDatasetsCount || 0} active storage datasets</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Indexes</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {health?.indexStatus.healthyIndexes || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Composite & single-column indexes</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Point-in-Time Snaps</span>
                <Boxes className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">{snapshots.length}</div>
              <p className="text-xs text-slate-500 mt-1">Current tenant: {companyId}</p>
            </div>
          </div>

          {/* Maintenance Action Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-sm text-slate-700">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold">Local Storage Maintenance:</span>
              <span className="text-xs text-slate-500">Non-destructive indexing and vacuum compaction</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMaintenance('optimize')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm"
              >
                Optimize Storage
              </button>
              <button
                onClick={() => handleMaintenance('compact')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm"
              >
                Compact (Vacuum)
              </button>
              <button
                onClick={() => handleMaintenance('validate')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm"
              >
                Validate Integrity
              </button>
              <button
                onClick={() => handleMaintenance('rebuild')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm"
              >
                Rebuild Indexes
              </button>
              <button
                onClick={handleCreateSnapshot}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm flex items-center space-x-1"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Create Snapshot</span>
              </button>
            </div>
          </div>

          {/* Datasets Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Stored Canonical Datasets & Tables</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Partitioned facts and dimensions stored locally with company isolation
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                {datasets.length} Datasets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Dataset / Table</th>
                    <th className="px-6 py-3">Grain Classification</th>
                    <th className="px-6 py-3 text-right">Rows Stored</th>
                    <th className="px-6 py-3 text-right">Current / History</th>
                    <th className="px-6 py-3 text-right">Est. Size</th>
                    <th className="px-6 py-3 text-center">Indexes</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {datasets.map((d) => (
                    <tr key={d.datasetId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{d.datasetName}</div>
                        <div className="text-xs text-slate-400 font-mono">{d.datasetId}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            d.grainType === 'Fact'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {d.grainType === 'Fact' ? '⚡ Fact Table' : '📐 Dimension'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-800">
                        {d.recordCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-slate-500">
                        <span className="text-emerald-700 font-medium">{d.currentRecords} curr</span> /{' '}
                        <span>{d.historicalRecords} hist</span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-slate-500">
                        {(d.approximateSizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                          {d.activeIndexes}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUERY STUDIO */}
      {activeSubTab === 'Query Studio' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Analytical Query Builder (Company-Isolated DAL)
            </h3>
            <p className="text-sm text-slate-500">
              Executes high-speed analytical queries, filters, date windows, and accounting aggregations with automatic tenant isolation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Dataset</label>
                <select
                  value={queryDataset}
                  onChange={(e) => setQueryDataset(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 font-medium"
                >
                  <option value="canonical-vouchers">Accounting Vouchers (Fact)</option>
                  <option value="canonical-voucher-lines">Voucher Lines (Fact)</option>
                  <option value="canonical-stock-items">Stock Items (Dimension)</option>
                  <option value="canonical-inventory-movements">Inventory Movements (Fact)</option>
                  <option value="canonical-ledgers">General Ledgers (Dimension)</option>
                  <option value="canonical-parties">Parties & Customers (Dimension)</option>
                  <option value="canonical-tax-transactions">Tax Transactions (Fact)</option>
                  <option value="canonical-payroll-transactions">Payroll Transactions (Fact)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Filter Field & Operator</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={queryFilterField}
                    onChange={(e) => setQueryFilterField(e.target.value)}
                    placeholder="Field (e.g. voucherType)"
                    className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  />
                  <select
                    value={queryFilterOp}
                    onChange={(e) => setQueryFilterOp(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  >
                    <option value="EQ">=</option>
                    <option value="NEQ">!=</option>
                    <option value="GT">&gt;</option>
                    <option value="GTE">&gt;=</option>
                    <option value="LT">&lt;</option>
                    <option value="LTE">&lt;=</option>
                    <option value="LIKE">LIKE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Filter Value</label>
                <input
                  type="text"
                  value={queryFilterVal}
                  onChange={(e) => setQueryFilterVal(e.target.value)}
                  placeholder="Value (e.g. Sales)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Aggregation Function</label>
                <div className="flex gap-2">
                  <select
                    value={queryAggFunc}
                    onChange={(e) => setQueryAggFunc(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-semibold text-indigo-700"
                  >
                    <option value="SUM">SUM</option>
                    <option value="AVG">AVG</option>
                    <option value="COUNT">COUNT</option>
                    <option value="MIN">MIN</option>
                    <option value="MAX">MAX</option>
                  </select>
                  <input
                    type="text"
                    value={queryAggField}
                    onChange={(e) => setQueryAggField(e.target.value)}
                    placeholder="Field (amount)"
                    className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleRunQuery}
                disabled={queryRunning}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center space-x-2"
              >
                <Play className={`w-4 h-4 ${queryRunning ? 'animate-spin' : ''}`} />
                <span>Execute Analytical Query</span>
              </button>
            </div>
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Query Output</h4>
                  <p className="text-xs text-slate-500">
                    Matched {queryResult.totalMatchedRows} rows • Execution time:{' '}
                    <span className="font-semibold text-emerald-600">{queryResult.executionTimeMs} ms</span>
                  </p>
                </div>
                {queryResult.aggregates && (
                  <div className="flex items-center gap-3">
                    {Object.entries(queryResult.aggregates).map(([k, v]) => (
                      <div key={k} className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-slate-500 font-medium uppercase mr-1">{k}:</span>
                        <span className="text-indigo-800 font-bold text-sm">
                          {typeof v === 'number' ? v.toLocaleString() : v}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Source ID</th>
                      <th className="px-4 py-2.5">Key Identifiers</th>
                      <th className="px-4 py-2.5">Attributes</th>
                      <th className="px-4 py-2.5">Lineage Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {queryResult.data.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 font-mono">
                        <td className="px-4 py-2 font-semibold text-slate-900">
                          {row.sourceId || row.voucherNumber || `row_${idx}`}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {row.voucherType || row.partyName || row.stockItemName || row.ledgerName || '—'}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {row.amount !== undefined ? `₹${Number(row.amount).toLocaleString()}` : JSON.stringify(row).slice(0, 80)}
                        </td>
                        <td className="px-4 py-2 text-slate-400 text-[11px]">
                          {row._warehouseMetadata?.sourceSystem} • {row._warehouseMetadata?.sourceObject}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DIMENSIONS (DATE & VOUCHER TYPES) */}
      {activeSubTab === 'Dimensions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Standard Reusable Date Dimension
            </h3>
            <p className="text-sm text-slate-500">
              Granular calendar & financial year dimension supporting company-specific FY configurations (India standard: April–March).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-400 block font-medium">Financial Year Start</span>
                <span className="text-slate-900 font-bold text-sm">Month 4 (April)</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-400 block font-medium">Active FY Window</span>
                <span className="text-slate-900 font-bold text-sm">2024-25 to 2026-27</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-400 block font-medium">Granularity</span>
                <span className="text-slate-900 font-bold text-sm">Daily (Calendar + FY)</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-400 block font-medium">Quarter Mapping</span>
                <span className="text-slate-900 font-bold text-sm">FQ1, FQ2, FQ3, FQ4</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Standard Voucher Type Dimension
            </h3>
            <p className="text-sm text-slate-500">
              Preserves source Tally voucher types and normalizes them into canonical categories for aggregate reporting.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Sales / Tax Invoice', cat: 'Sales', inv: 'Yes', num: 'Auto' },
                { name: 'Purchase Voucher', cat: 'Purchase', inv: 'Yes', num: 'Auto' },
                { name: 'Payment Voucher', cat: 'Payment', inv: 'No', num: 'Auto' },
                { name: 'Receipt Voucher', cat: 'Receipt', inv: 'No', num: 'Auto' },
                { name: 'Journal Entry', cat: 'Journal', inv: 'No', num: 'Auto' },
                { name: 'Contra Voucher', cat: 'Contra', inv: 'No', num: 'Auto' }
              ].map((v, i) => (
                <div key={i} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{v.name}</div>
                    <div className="text-slate-500">Canonical: {v.cat}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[11px]">
                    Inv: {v.inv}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SNAPSHOTS */}
      {activeSubTab === 'Snapshots' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-indigo-600" />
                  Warehouse Snapshots & Version Tracking
                </h3>
                <p className="text-sm text-slate-500">
                  Point-in-time state captures of all company datasets with schema compatibility validation.
                </p>
              </div>
              <button
                onClick={handleCreateSnapshot}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
              >
                Create New Snapshot
              </button>
            </div>

            <div className="space-y-3">
              {snapshots.map((snap) => (
                <div key={snap.snapshotId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 font-mono text-sm">{snap.snapshotId}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Created: {new Date(snap.createdAt).toLocaleString()} • Total Stored:{' '}
                      {(snap.approximateTotalSizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                    {snap.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 32E Preparation: Snapshot Diff Tool */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              Snapshot Comparison Plan (Prepared for Phase 32E Incremental Sync)
            </h3>
            <p className="text-sm text-slate-500">
              Generates dataset delta metrics and schema mutation flags between any two points in time.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={snapA}
                onChange={(e) => setSnapA(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-xs font-mono"
              >
                {snapshots.map((s) => (
                  <option key={s.snapshotId} value={s.snapshotId}>
                    Target: {s.snapshotId}
                  </option>
                ))}
              </select>

              <select
                value={snapB}
                onChange={(e) => setSnapB(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-xs font-mono"
              >
                {snapshots.map((s) => (
                  <option key={s.snapshotId} value={s.snapshotId}>
                    Base: {s.snapshotId}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCompareSnapshots}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Compare Snapshots
              </button>
            </div>

            {comparePlan && (
              <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-indigo-900">
                  Ready for Phase 32E Watermark & Change Detection Engine
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {comparePlan.datasetComparisons.slice(0, 6).map((c: any) => (
                    <div key={c.datasetId} className="p-2 bg-white rounded border border-indigo-100 text-xs">
                      <div className="font-bold text-slate-800 truncate">{c.datasetId}</div>
                      <div className="text-slate-500">
                        Base: {c.baseRowCount} → Target: {c.targetRowCount} ({c.deltaRows >= 0 ? `+${c.deltaRows}` : c.deltaRows})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: INDEXES */}
      {activeSubTab === 'Indexes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Warehouse Index Manager (Single-Column & Composite)
            </h3>
            <p className="text-sm text-slate-500">
              Essential in-memory B-Tree/Hash indexes enabling zero-latency filtering across millions of normalized rows.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Index Identifier</th>
                    <th className="px-4 py-3">Dataset</th>
                    <th className="px-4 py-3">Indexed Fields</th>
                    <th className="px-4 py-3 text-center">Type</th>
                    <th className="px-4 py-3 text-right">Keys Cached</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {indexes.map((idx) => (
                    <tr key={idx.indexId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{idx.indexId}</td>
                      <td className="px-4 py-3 text-slate-700">{idx.datasetId}</td>
                      <td className="px-4 py-3 text-indigo-700 font-semibold">{idx.fields.join(' + ')}</td>
                      <td className="px-4 py-3 text-center font-sans">
                        <span className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {idx.isComposite ? 'Composite' : 'Single'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                        {idx.itemCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center font-sans">
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                          {idx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: BENCHMARK */}
      {activeSubTab === 'Benchmark' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              High-Speed Synthetic Ingestion & Query Benchmark
            </h3>
            <p className="text-sm text-slate-500">
              Tests memory safety, streaming chunk ingestion, indexing throughput, and sub-second analytical query speed.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Record Count</label>
                <select
                  value={benchCount}
                  onChange={(e) => setBenchCount(Number(e.target.value))}
                  className="p-2 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value={10000}>10,000 Records (Quick Test)</option>
                  <option value={25000}>25,000 Records (Standard)</option>
                  <option value={50000}>50,000 Records (Heavy)</option>
                  <option value={100000}>100,000 Records (Stress Benchmark)</option>
                </select>
              </div>

              <div className="pt-5">
                <button
                  onClick={handleRunBenchmark}
                  disabled={benchRunning}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center space-x-2"
                >
                  <Play className={`w-4 h-4 ${benchRunning ? 'animate-spin' : ''}`} />
                  <span>Run Live Ingestion Benchmark</span>
                </button>
              </div>
            </div>

            {benchResult && (
              <div className="mt-6 p-6 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-4">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Benchmark Completed Successfully</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                    <span className="text-xs text-slate-500 block">Insertion Speed</span>
                    <span className="text-lg font-bold text-slate-900">
                      {benchResult.recordsPerSecond.toLocaleString()} rows/sec
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                    <span className="text-xs text-slate-500 block">Query Latency</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {benchResult.queryExecutionTimeMs} ms
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                    <span className="text-xs text-slate-500 block">Total Matched</span>
                    <span className="text-lg font-bold text-slate-900">
                      {benchResult.matchedRows.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                    <span className="text-xs text-slate-500 block">Heap Memory</span>
                    <span className="text-lg font-bold text-slate-900">
                      {benchResult.memoryUsageMb} MB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: TEST SUITE */}
      {activeSubTab === 'Test Suite' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Phase 32D Automated Verification Suite
                </h3>
                <p className="text-sm text-slate-500">
                  Executes 17 comprehensive unit, DAL multi-tenant security, aggregation, and read-only Tally tests.
                </p>
              </div>
              <button
                onClick={handleRunTests}
                disabled={testsRunning}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center space-x-2"
              >
                <Play className={`w-4 h-4 ${testsRunning ? 'animate-spin' : ''}`} />
                <span>Run Test Suite</span>
              </button>
            </div>

            {testReport && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-sm">
                  <div className="font-bold text-slate-800">
                    Results: {testReport.passed}/{testReport.total} Tests Passed
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      testReport.failed === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {testReport.failed === 0 ? '100% GREEN' : `${testReport.failed} FAILED`}
                  </span>
                </div>

                <div className="space-y-2">
                  {testReport.results.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        {r.status === 'PASS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-800">{r.testName}</span>
                      </div>
                      <span
                        className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                          r.status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
