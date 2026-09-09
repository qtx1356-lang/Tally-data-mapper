/**
 * Phase 32G - Unified Query & Indexing Layer UI Component
 * Visual Query Builder, Explain Plan Viewer, Results Console,
 * Saved Queries, Materialized Views, Performance & Index Recommendations, and Test Suite.
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  FileText,
  Save,
  Download,
  Database,
  Layers,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Sliders,
  ChevronRight,
  TrendingUp,
  Cpu,
  Eye,
  Settings,
  HelpCircle,
  StopCircle
} from 'lucide-react';
import {
  QueryDefinition,
  QueryResult,
  QueryPlan,
  SavedQuery,
  MaterializedViewDefinition,
  IndexRecommendation,
  QueryPerformanceStats,
  FilterOperator,
  AggregationFunction,
  JoinType,
  QuerySourcePreference
} from '../types/phase32GQuery';

export function Phase32GUnifiedQueryCenterView() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'builder' | 'explain' | 'saved' | 'views' | 'performance' | 'tests'
  >('builder');

  // Company and Dataset Context
  const [selectedCompanyId, setSelectedCompanyId] = useState('CMP-001');
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([
    'canonical-vouchers',
    'canonical-voucher-lines',
    'canonical-ledgers',
    'canonical-groups',
    'canonical-stock-items',
    'canonical-tax-transactions',
    'canonical-inventory-movements',
    'canonical-parties',
    'canonical-cost-centres'
  ]);

  // Query Builder State
  const [selectedDataset, setSelectedDataset] = useState('canonical-vouchers');
  const [sourcePreference, setSourcePreference] = useState<QuerySourcePreference>('WAREHOUSE');
  const [snapshotId, setSnapshotId] = useState('');

  // Selected Fields
  const [datasetFields, setDatasetFields] = useState<string[]>([
    'voucherNumber',
    'voucherType',
    'date',
    'partyLedgerId',
    'amount',
    'narration'
  ]);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'voucherNumber',
    'voucherType',
    'date',
    'partyLedgerId',
    'amount'
  ]);

  // Filters
  const [filters, setFilters] = useState<
    { field: string; operator: FilterOperator; value: any; valueTo?: any }[]
  >([{ field: 'voucherType', operator: 'EQ', value: 'Sales' }]);

  // Joins
  const [joins, setJoins] = useState<
    {
      targetDataset: string;
      joinType: JoinType;
      sourceField: string;
      targetField: string;
      allowFanout?: boolean;
    }[]
  >([]);

  // Group By & Aggregations
  const [groupByFields, setGroupByFields] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<
    { field: string; function: AggregationFunction; alias: string }[]
  >([]);

  // Calculated Fields
  const [calculatedFields, setCalculatedFields] = useState<
    { name: string; expression: string }[]
  >([]);

  // Sorting & Pagination
  const [sortField, setSortField] = useState('amount');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Execution & Plan State
  const [isRunning, setIsRunning] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryPlan, setQueryPlan] = useState<QueryPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved Queries & Materialized Views State
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [materializedViews, setMaterializedViews] = useState<MaterializedViewDefinition[]>([]);
  const [performanceStats, setPerformanceStats] = useState<QueryPerformanceStats | null>(null);
  const [activeIndexes, setActiveIndexes] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<IndexRecommendation[]>([]);

  // Save Query Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [newQueryDesc, setNewQueryDesc] = useState('');

  // Automated Test Suite State
  const [testSuiteRunning, setTestSuiteRunning] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);

  // Update fields list when dataset changes
  useEffect(() => {
    switch (selectedDataset) {
      case 'canonical-vouchers':
        setDatasetFields(['voucherNumber', 'voucherType', 'date', 'partyLedgerId', 'amount', 'narration']);
        setSelectedFields(['voucherNumber', 'voucherType', 'date', 'partyLedgerId', 'amount']);
        break;
      case 'canonical-voucher-lines':
        setDatasetFields(['voucherId', 'ledgerId', 'amount', 'entryType', 'costCenterId']);
        setSelectedFields(['voucherId', 'ledgerId', 'amount', 'entryType']);
        break;
      case 'canonical-ledgers':
        setDatasetFields(['name', 'parentGroupId', 'openingBalance', 'closingBalance', 'isDeemedPositive']);
        setSelectedFields(['name', 'parentGroupId', 'openingBalance', 'closingBalance']);
        break;
      case 'canonical-stock-items':
        setDatasetFields(['name', 'partNumber', 'baseUnit', 'openingBalance', 'closingBalance', 'standardCost']);
        setSelectedFields(['name', 'partNumber', 'closingBalance', 'standardCost']);
        break;
      case 'canonical-tax-transactions':
        setDatasetFields(['voucherId', 'taxType', 'taxRate', 'taxableAmount', 'taxAmount']);
        setSelectedFields(['voucherId', 'taxType', 'taxRate', 'taxableAmount', 'taxAmount']);
        break;
      default:
        setDatasetFields(['id', 'name', 'date', 'amount', 'status']);
        setSelectedFields(['id', 'name', 'date', 'amount']);
    }
  }, [selectedDataset]);

  // Load Saved Queries, Views & Stats
  useEffect(() => {
    loadSavedQueries();
    loadMaterializedViews();
    loadPerformanceStats();
  }, [selectedCompanyId]);

  const loadSavedQueries = async () => {
    try {
      const res = await fetch(`/api/query/saved?companyId=${selectedCompanyId}`);
      const data = await res.json();
      if (data.success) setSavedQueries(data.savedQueries);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMaterializedViews = async () => {
    try {
      const res = await fetch('/api/query/materialized-views');
      const data = await res.json();
      if (data.success) setMaterializedViews(data.views);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPerformanceStats = async () => {
    try {
      const pRes = await fetch('/api/query/performance');
      const pData = await pRes.json();
      if (pData.success) setPerformanceStats(pData.performance);

      const iRes = await fetch(`/api/query/indexes?companyId=${selectedCompanyId}`);
      const iData = await iRes.json();
      if (iData.success) {
        setActiveIndexes(iData.activeIndexes || []);
        setRecommendations(iData.recommendations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Build current query definition
  const getCurrentQueryDefinition = (): QueryDefinition => {
    return {
      queryId: `qry_${Date.now()}`,
      companyId: selectedCompanyId,
      dataset: selectedDataset,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
      filters: filters.filter((f) => f.field && f.operator),
      joins: joins.length > 0 ? joins : undefined,
      groupBy: groupByFields.length > 0 ? groupByFields : undefined,
      aggregations: aggregations.length > 0 ? aggregations : undefined,
      calculatedFields: calculatedFields.filter((c) => c.name && c.expression),
      orderBy: sortField ? [{ field: sortField, order: sortOrder }] : undefined,
      limit,
      offset,
      sourcePreference,
      snapshotId: snapshotId ? snapshotId : undefined
    };
  };

  // Execute Query
  const handleExecuteQuery = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    const def = getCurrentQueryDefinition();
    setActiveQueryId(def.queryId);

    try {
      const res = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(def)
      });
      const data = await res.json();

      if (data.success) {
        setQueryResult(data.result);
        loadPerformanceStats();
      } else {
        setErrorMessage(data.error || 'Query execution failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error executing query.');
    } finally {
      setIsRunning(false);
      setActiveQueryId(null);
    }
  };

  // Explain Query Plan
  const handleExplainPlan = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    const def = getCurrentQueryDefinition();

    try {
      const res = await fetch('/api/query/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(def)
      });
      const data = await res.json();

      if (data.success) {
        setQueryPlan(data.plan);
        setActiveTab('explain');
      } else {
        setErrorMessage(data.error || 'Failed to generate query plan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setIsRunning(false);
    }
  };

  // Cancel Query
  const handleCancelQuery = async () => {
    if (!activeQueryId) return;
    try {
      await fetch('/api/query/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: activeQueryId })
      });
      setIsRunning(false);
      setErrorMessage('Query cancelled by user.');
    } catch (e) {
      console.error(e);
    }
  };

  // Export Results
  const handleExport = async (format: 'csv' | 'json') => {
    const def = getCurrentQueryDefinition();
    try {
      const res = await fetch('/api/query/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: def, format })
      });

      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${def.dataset}_export.csv`;
        a.click();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.exportData, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${def.dataset}_export.json`;
        a.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Query
  const handleSaveQuery = async () => {
    if (!newQueryName.trim()) return;
    const def = getCurrentQueryDefinition();

    try {
      const res = await fetch('/api/query/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: `sq_${Date.now()}`,
          name: newQueryName.trim(),
          description: newQueryDesc.trim(),
          companyScope: selectedCompanyId,
          definition: def,
          schemaVersion: 1,
          createdBy: 'Accounting Analyst'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSaveModalOpen(false);
        setNewQueryName('');
        setNewQueryDesc('');
        loadSavedQueries();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh Materialized View
  const handleRefreshView = async (viewId: string) => {
    try {
      await fetch('/api/query/materialized-views/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewId })
      });
      loadMaterializedViews();
    } catch (e) {
      console.error(e);
    }
  };

  // Approve Index Recommendation
  const handleApproveIndex = async (recId: string) => {
    try {
      await fetch('/api/query/indexes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId })
      });
      loadPerformanceStats();
    } catch (e) {
      console.error(e);
    }
  };

  // Dismiss Index Recommendation
  const handleDismissIndex = async (recId: string) => {
    try {
      await fetch('/api/query/indexes/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId })
      });
      loadPerformanceStats();
    } catch (e) {
      console.error(e);
    }
  };

  // Run Test Suite
  const handleRunTests = async () => {
    setTestSuiteRunning(true);
    try {
      const res = await fetch('/api/query/tests/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestResults(data.testResults);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestSuiteRunning(false);
    }
  };

  return (
    <div id="phase32g-unified-query-container" className="space-y-6">
      {/* Top Banner: Read-Only Safety & Engine Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/30">
              PHASE 32G
            </span>
            <h2 className="text-lg font-bold tracking-tight">
              Unified Query & Indexing Layer
            </h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Dynamic dataset query engine with accounting grain safety, predicate pushdown, safe AST calculations, and result caching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tally 100% Read-Only</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Company:</span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none"
            >
              <option value="CMP-001" className="bg-slate-800">Acme Trading Ltd (CMP-001)</option>
              <option value="CMP-002" className="bg-slate-800">Apex Global (CMP-002)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap items-center border-b border-slate-200 gap-2 pb-1">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'builder'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Query Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('explain')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'explain'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Explain Plan</span>
          {queryPlan && (
            <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
              Ready
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'saved'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>Saved Queries</span>
          <span className="bg-slate-200 text-slate-700 text-xs px-1.5 py-0.5 rounded-full">
            {savedQueries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('views')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'views'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Materialized Views</span>
          <span className="bg-slate-200 text-slate-700 text-xs px-1.5 py-0.5 rounded-full">
            {materializedViews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'performance'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Performance & Indexes</span>
          {recommendations.filter((r) => r.status === 'Recommended').length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full font-semibold">
              {recommendations.filter((r) => r.status === 'Recommended').length} Rec
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'tests'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Automated Test Suite (21 Tests)</span>
        </button>
      </div>

      {/* Error / Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 text-sm flex items-start justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Query Execution Error</div>
              <div className="text-xs whitespace-pre-wrap mt-0.5">{errorMessage}</div>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: VISUAL QUERY BUILDER & CONSOLE
      ========================================================================= */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Query Configurator */}
          <div className="lg:col-span-5 space-y-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Query Definition
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded bg-indigo-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>

            {/* 1. Dataset & Source Routing */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Target Dataset (Discovered / Normalized)
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {availableDatasets.map((ds) => (
                  <option key={ds} value={ds}>
                    {ds}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-xs text-slate-500 block">Routing Preference</label>
                  <select
                    value={sourcePreference}
                    onChange={(e) => setSourcePreference(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 bg-slate-50"
                  >
                    <option value="WAREHOUSE">Analytical Warehouse</option>
                    <option value="SNAPSHOT">Historical Snapshot</option>
                    <option value="LIVE_TALLY">Live Tally (Read-Only)</option>
                  </select>
                </div>
                {sourcePreference === 'SNAPSHOT' && (
                  <div>
                    <label className="text-xs text-slate-500 block">Snapshot ID</label>
                    <input
                      type="text"
                      placeholder="e.g. snap-20260308"
                      value={snapshotId}
                      onChange={(e) => setSnapshotId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Field Selection */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Select Columns
                </label>
                <button
                  onClick={() => {
                    if (selectedFields.length === datasetFields.length) setSelectedFields([]);
                    else setSelectedFields([...datasetFields]);
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {selectedFields.length === datasetFields.length ? 'Clear All' : 'Select All'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-100 rounded-lg bg-slate-50">
                {datasetFields.map((f) => {
                  const isChecked = selectedFields.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        if (isChecked) setSelectedFields(selectedFields.filter((x) => x !== f));
                        else setSelectedFields([...selectedFields, f]);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        isChecked
                          ? 'bg-indigo-600 text-white font-medium shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Filter Predicates */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  Filter Predicates ({filters.length})
                </label>
                <button
                  onClick={() =>
                    setFilters([
                      ...filters,
                      { field: datasetFields[0] || 'amount', operator: 'EQ', value: '' }
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Filter
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filters.map((filt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                  >
                    <select
                      value={filt.field}
                      onChange={(e) => {
                        const next = [...filters];
                        next[idx].field = e.target.value;
                        setFilters(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white max-w-[110px]"
                    >
                      {datasetFields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filt.operator}
                      onChange={(e) => {
                        const next = [...filters];
                        next[idx].operator = e.target.value as any;
                        setFilters(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white font-mono text-[11px]"
                    >
                      <option value="EQ">=</option>
                      <option value="NEQ">!=</option>
                      <option value="GT">&gt;</option>
                      <option value="GTE">&gt;=</option>
                      <option value="LT">&lt;</option>
                      <option value="LTE">&lt;=</option>
                      <option value="CONTAINS">contains</option>
                      <option value="STARTS_WITH">starts</option>
                      <option value="ENDS_WITH">ends</option>
                      <option value="IN">in [list]</option>
                      <option value="BETWEEN">between</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Value"
                      value={filt.value}
                      onChange={(e) => {
                        const next = [...filters];
                        next[idx].value = e.target.value;
                        setFilters(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white flex-1 min-w-[70px]"
                    />

                    {filt.operator === 'BETWEEN' && (
                      <input
                        type="text"
                        placeholder="To"
                        value={filt.valueTo || ''}
                        onChange={(e) => {
                          const next = [...filters];
                          next[idx].valueTo = e.target.value;
                          setFilters(next);
                        }}
                        className="border border-slate-200 rounded p-1 bg-white w-16"
                      />
                    )}

                    <button
                      onClick={() => setFilters(filters.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Safe Hash Joins */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  Registered Dataset Joins ({joins.length})
                </label>
                <button
                  onClick={() =>
                    setJoins([
                      ...joins,
                      {
                        targetDataset: 'canonical-voucher-lines',
                        joinType: 'INNER',
                        sourceField: 'voucherNumber',
                        targetField: 'voucherId',
                        allowFanout: false
                      }
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Join
                </button>
              </div>

              {joins.map((j, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <select
                      value={j.joinType}
                      onChange={(e) => {
                        const next = [...joins];
                        next[idx].joinType = e.target.value as any;
                        setJoins(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white font-semibold"
                    >
                      <option value="INNER">INNER JOIN</option>
                      <option value="LEFT">LEFT JOIN</option>
                    </select>

                    <select
                      value={j.targetDataset}
                      onChange={(e) => {
                        const next = [...joins];
                        next[idx].targetDataset = e.target.value;
                        setJoins(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white flex-1 mx-2"
                    >
                      {availableDatasets
                        .filter((d) => d !== selectedDataset)
                        .map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => setJoins(joins.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <span>ON:</span>
                    <input
                      type="text"
                      placeholder="Source field"
                      value={j.sourceField}
                      onChange={(e) => {
                        const next = [...joins];
                        next[idx].sourceField = e.target.value;
                        setJoins(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white flex-1"
                    />
                    <span>=</span>
                    <input
                      type="text"
                      placeholder="Target field"
                      value={j.targetField}
                      onChange={(e) => {
                        const next = [...joins];
                        next[idx].targetField = e.target.value;
                        setJoins(next);
                      }}
                      className="border border-slate-200 rounded p-1 bg-white flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Safe Calculated Fields (AST Engine) */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Calculated Fields (Safe AST)
                </label>
                <button
                  onClick={() =>
                    setCalculatedFields([
                      ...calculatedFields,
                      { name: 'amountWithTax', expression: 'amount * 1.18' }
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Formula
                </button>
              </div>

              {calculatedFields.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                >
                  <input
                    type="text"
                    placeholder="Column Name"
                    value={c.name}
                    onChange={(e) => {
                      const next = [...calculatedFields];
                      next[idx].name = e.target.value;
                      setCalculatedFields(next);
                    }}
                    className="border border-slate-200 rounded p-1 bg-white w-28"
                  />
                  <span className="font-mono text-slate-400">=</span>
                  <input
                    type="text"
                    placeholder="e.g. amount * 1.18"
                    value={c.expression}
                    onChange={(e) => {
                      const next = [...calculatedFields];
                      next[idx].expression = e.target.value;
                      setCalculatedFields(next);
                    }}
                    className="border border-slate-200 rounded p-1 bg-white flex-1 font-mono text-[11px]"
                  />
                  <button
                    onClick={() => setCalculatedFields(calculatedFields.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* 6. Aggregations & Group By */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  Aggregations & Grouping
                </label>
                <button
                  onClick={() =>
                    setAggregations([
                      ...aggregations,
                      { field: 'amount', function: 'SUM', alias: 'totalAmount' }
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Aggregate
                </button>
              </div>

              {aggregations.length > 0 && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Group By Field(s):</label>
                    <select
                      value={groupByFields[0] || ''}
                      onChange={(e) => setGroupByFields(e.target.value ? [e.target.value] : [])}
                      className="w-full border border-slate-200 rounded p-1 bg-white text-xs"
                    >
                      <option value="">(None - Global Aggregate)</option>
                      {datasetFields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {aggregations.map((agg, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <select
                        value={agg.function}
                        onChange={(e) => {
                          const next = [...aggregations];
                          next[idx].function = e.target.value as any;
                          setAggregations(next);
                        }}
                        className="border border-slate-200 rounded p-1 bg-white font-semibold"
                      >
                        <option value="SUM">SUM</option>
                        <option value="COUNT">COUNT</option>
                        <option value="AVG">AVG</option>
                        <option value="MIN">MIN</option>
                        <option value="MAX">MAX</option>
                        <option value="COUNT_DISTINCT">COUNT_DISTINCT</option>
                      </select>

                      <select
                        value={agg.field}
                        onChange={(e) => {
                          const next = [...aggregations];
                          next[idx].field = e.target.value;
                          setAggregations(next);
                        }}
                        className="border border-slate-200 rounded p-1 bg-white flex-1"
                      >
                        {datasetFields.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Alias"
                        value={agg.alias}
                        onChange={(e) => {
                          const next = [...aggregations];
                          next[idx].alias = e.target.value;
                          setAggregations(next);
                        }}
                        className="border border-slate-200 rounded p-1 bg-white w-24"
                      />

                      <button
                        onClick={() => setAggregations(aggregations.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Sorting & Limit */}
            <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Sort By:</label>
                <div className="flex gap-1">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="border border-slate-200 rounded p-1 bg-slate-50 flex-1"
                  >
                    <option value="">(None)</option>
                    {datasetFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="px-2 py-1 border border-slate-200 rounded bg-slate-50 font-mono font-semibold"
                  >
                    {sortOrder}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Page Limit:</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 25)}
                  className="w-full border border-slate-200 rounded p-1 bg-slate-50"
                />
              </div>
            </div>

            {/* Execute & Plan Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleExecuteQuery}
                disabled={isRunning}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Execute Query</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExplainPlan}
                disabled={isRunning}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-lg flex items-center gap-1.5 text-sm border border-slate-200 transition-colors"
                title="Explain Plan without running"
              >
                <Cpu className="w-4 h-4 text-slate-600" />
                <span>Explain</span>
              </button>

              {isRunning && (
                <button
                  onClick={handleCancelQuery}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-2 rounded-lg"
                  title="Cancel Query"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Execution Results Console */}
          <div className="lg:col-span-7 space-y-4">
            {/* Query Result Header & Metadata */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">Query Results</span>
                  {queryResult && (
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-mono">
                      {queryResult.recordCount} rows ({queryResult.executionTimeMs}ms)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {queryResult && (
                    <>
                      <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-1 text-xs border border-slate-200 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="flex items-center gap-1 text-xs border border-slate-200 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700"
                      >
                        <Download className="w-3 h-3" />
                        JSON
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status & Warning Badges */}
              {queryResult && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                        queryResult.source.startsWith('CACHED_')
                          ? 'bg-emerald-100 text-emerald-800'
                          : queryResult.source === 'LIVE_TALLY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      Source: {queryResult.source}
                    </span>

                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Company: {queryResult.companyId}
                    </span>

                    {queryResult.lineageReference && (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                        Plan: {queryResult.lineageReference.planFingerprint}
                      </span>
                    )}
                  </div>

                  {/* Warning notifications */}
                  {queryResult.warnings && queryResult.warnings.length > 0 && (
                    <div className="space-y-1">
                      {queryResult.warnings.map((w, i) => (
                        <div
                          key={i}
                          className="text-xs bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scalar Aggregates Display */}
                  {queryResult.aggregates && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      {Object.entries(queryResult.aggregates).map(([k, v]) => (
                        <div key={k} className="text-center">
                          <span className="text-[11px] text-slate-500 block truncate">{k}</span>
                          <span className="font-bold text-indigo-900 text-sm font-mono">
                            {typeof v === 'number' ? v.toLocaleString() : v}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {queryResult && queryResult.rows.length > 0 ? (
                <div className="overflow-x-auto max-h-[480px]">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5 w-10 text-slate-400">#</th>
                        {queryResult.columns.map((c) => (
                          <th key={c.name} className="p-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span>{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({c.type})
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{offset + idx + 1}</td>
                          {queryResult.columns.map((c) => {
                            const val = row[c.name];
                            const isNum = typeof val === 'number';
                            return (
                              <td
                                key={c.name}
                                className={`p-2.5 whitespace-nowrap ${isNum ? 'font-mono text-slate-800' : ''}`}
                              >
                                {val !== null && val !== undefined ? (
                                  isNum ? val.toLocaleString() : String(val)
                                ) : (
                                  <span className="text-slate-300 italic">null</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-medium">No results to display</p>
                  <p className="text-xs text-slate-400">
                    Configure your query filters and click &quot;Execute Query&quot; to inspect records.
                  </p>
                </div>
              )}

              {/* Table Footer with Pagination */}
              {queryResult && queryResult.pagination && (
                <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Showing {queryResult.rows.length} of {queryResult.totalMatchedRows} matched rows
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newOffset = Math.max(0, offset - limit);
                        setOffset(newOffset);
                        setTimeout(handleExecuteQuery, 50);
                      }}
                      disabled={offset === 0}
                      className="px-2.5 py-1 border border-slate-200 rounded bg-white disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      onClick={() => {
                        const newOffset = offset + limit;
                        setOffset(newOffset);
                        setTimeout(handleExecuteQuery, 50);
                      }}
                      disabled={!queryResult.pagination.hasMore}
                      className="px-2.5 py-1 border border-slate-200 rounded bg-white disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EXPLAIN PLAN VIEWER
      ========================================================================= */}
      {activeTab === 'explain' && (
        <div className="space-y-6">
          {queryPlan ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Plan Summary & Grain Safety */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      Execution Plan Overview
                    </h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">
                      {queryPlan.planId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block">Primary Source</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {queryPlan.source}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block">Target Dataset</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {queryPlan.primaryDataset}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block">Estimated Cost</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {queryPlan.estimatedCost} units
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block">Primary Grain</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {queryPlan.primaryDatasetGrain}
                      </span>
                    </div>
                  </div>

                  {/* Accounting Grain Safety Guard Badge */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Accounting Grain Safety
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          queryPlan.grainSafety.isSafe
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {queryPlan.grainSafety.actionTaken}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {queryPlan.grainSafety.warning ||
                        'Grain Verified: No cartesian duplication detected. Aggregations adhere to dataset granularity rules.'}
                    </p>
                  </div>

                  {/* Indexes Utilized */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                      Index Utilization
                    </label>
                    {queryPlan.indexesUsed.length > 0 ? (
                      queryPlan.indexesUsed.map((idx, i) => (
                        <div
                          key={i}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2 rounded-lg text-xs space-y-0.5"
                        >
                          <div className="font-semibold flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            {idx.indexId} ({idx.fields.join(', ')})
                          </div>
                          <div className="text-[11px] text-emerald-700">{idx.reason}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs bg-slate-50 p-2 rounded text-slate-500 italic">
                        No composite index matched; using in-memory dataset filter scan.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Step-by-Step Pipeline & Human Explanation */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Query Execution Pipeline ({queryPlan.executionSteps.length} Steps)
                  </h3>

                  <div className="space-y-3">
                    {queryPlan.executionSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {step.stepNumber}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-sm">
                              {step.operation}
                            </span>
                            <div className="flex items-center gap-2">
                              {step.pushdown && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                  Pushed Down
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 font-mono">
                                Cost: {step.costEstimate}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-600 text-xs">{step.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Human Readable Narrative */}
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                      Execution Narrative
                    </label>
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono space-y-1 leading-relaxed">
                      {queryPlan.humanReadableExplanation.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2">
              <Cpu className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No Query Plan Generated</p>
              <p className="text-xs text-slate-400">
                Click &quot;Explain&quot; on the Query Builder tab to visualize execution steps, pushdown optimizations, and grain safety.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SAVED QUERIES LIBRARY
      ========================================================================= */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Saved Analytical Queries</h3>
              <p className="text-xs text-slate-500">
                Queries are validated against Schema Registry versions. Incompatible queries are flagged for review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedQueries.map((sq) => (
              <div
                key={sq.queryId}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{sq.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{sq.description || 'No description'}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      sq.status === 'Valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sq.status}
                  </span>
                </div>

                {sq.compatibilityIssues && sq.compatibilityIssues.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded text-xs space-y-1">
                    <div className="font-semibold">Compatibility Warning:</div>
                    {sq.compatibilityIssues.map((iss, i) => (
                      <div key={i} className="text-[11px]">• {iss}</div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded">
                  <div>
                    <span className="text-slate-400 block">Dataset:</span>
                    <span className="font-mono text-slate-700">{sq.definition.dataset}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Created By:</span>
                    <span className="text-slate-700">{sq.createdBy}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedDataset(sq.definition.dataset);
                      if (sq.definition.fields) setSelectedFields(sq.definition.fields);
                      if (sq.definition.filters) setFilters(sq.definition.filters);
                      if (sq.definition.joins) setJoins(sq.definition.joins);
                      setActiveTab('builder');
                    }}
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium px-3 py-1.5 rounded transition-colors"
                  >
                    Load into Builder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MATERIALIZED VIEWS REGISTRY
      ========================================================================= */}
      {activeTab === 'views' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Materialized Views Registry</h3>
              <p className="text-xs text-slate-500">
                Pre-aggregated summary tables refreshed on sync or manual schedule.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materializedViews.map((mv) => (
              <div
                key={mv.viewId}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-slate-800 text-sm">{mv.name}</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      {mv.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dataset:</span>
                      <span className="font-mono">{mv.dataset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Policy:</span>
                      <span className="font-mono">{mv.refreshPolicy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cached Rows:</span>
                      <span className="font-bold">{mv.rowCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Refresh:</span>
                      <span className="text-[11px]">
                        {mv.lastRefresh ? new Date(mv.lastRefresh).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRefreshView(mv.viewId)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-1.5 px-3 rounded-lg text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh View Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: PERFORMANCE & INDEX RECOMMENDATIONS
      ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          {performanceStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Total Queries
                </span>
                <span className="text-xl font-bold text-slate-800 font-mono">
                  {performanceStats.totalQueries}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Avg Latency
                </span>
                <span className="text-xl font-bold text-indigo-600 font-mono">
                  {performanceStats.avgExecutionTimeMs}ms
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  P95 Latency
                </span>
                <span className="text-xl font-bold text-slate-800 font-mono">
                  {performanceStats.p95ExecutionTimeMs}ms
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Cache Hit Rate
                </span>
                <span className="text-xl font-bold text-emerald-600 font-mono">
                  {performanceStats.cacheHitRatePercent}%
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Rows Scanned
                </span>
                <span className="text-xl font-bold text-slate-800 font-mono">
                  {performanceStats.rowsScanned.toLocaleString()}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Slow Queries
                </span>
                <span className="text-xl font-bold text-amber-600 font-mono">
                  {performanceStats.slowQueryCount}
                </span>
              </div>
            </div>
          )}

          {/* Index Recommendations Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Index Recommendations
                </h3>
                <p className="text-xs text-slate-500">
                  Automatically suggested composite/single-column indexes based on filter and join frequencies.
                </p>
              </div>
            </div>

            {recommendations.filter((r) => r.status === 'Recommended').length > 0 ? (
              <div className="space-y-3">
                {recommendations
                  .filter((r) => r.status === 'Recommended')
                  .map((rec) => (
                    <div
                      key={rec.recommendationId}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 font-mono">
                            {rec.datasetId} [{rec.fields.join(', ')}]
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                            Score: {rec.frequencyScore}
                          </span>
                        </div>
                        <p className="text-slate-600">{rec.reason}</p>
                        <p className="text-emerald-700 text-[11px]">{rec.estimatedBenefit}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveIndex(rec.recommendationId)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-medium transition-colors"
                        >
                          Approve & Create
                        </button>
                        <button
                          onClick={() => handleDismissIndex(rec.recommendationId)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No new index recommendations. Query engine indexes are optimal.
              </div>
            )}
          </div>

          {/* Active Indexes List */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-emerald-600" />
              Active Analytical Indexes ({activeIndexes.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeIndexes.map((idx) => (
                <div
                  key={idx.indexId}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                    <span>{idx.indexId}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-normal">
                      {idx.bucketCount} buckets
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-400">Fields: </span>
                    <span className="font-mono font-medium">{idx.fields.join(', ')}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Dataset: <span className="font-mono">{idx.datasetId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: AUTOMATED TEST SUITE (21 TESTS)
      ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Phase 32G Automated Test Suite (21 Comprehensive Tests)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validates dynamic datasets, filter operators, accounting grain safety (no voucher double counting), join safety, safe AST calculations, result caching, security, read-only guarantees, and 100k performance benchmark.
                </p>
              </div>

              <button
                onClick={handleRunTests}
                disabled={testSuiteRunning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-xs transition-colors shrink-0 disabled:opacity-50"
              >
                {testSuiteRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Test Suite...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Test Suite Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Results Summary Banner */}
            {testResults && (
              <div
                className={`p-4 rounded-lg border flex items-center justify-between text-xs ${
                  testResults.failed === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {testResults.failed === 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {testResults.failed === 0
                        ? 'All 21 Test Cases Passed Cleanly!'
                        : `${testResults.failed} Test(s) Failed`}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Executed in {testResults.durationMs}ms ({testResults.passed} passed,{' '}
                      {testResults.failed} failed)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Test Results Table */}
            {testResults && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-slate-400">#</th>
                      <th className="p-2.5">Test Case</th>
                      <th className="p-2.5 w-24">Status</th>
                      <th className="p-2.5 w-24">Latency</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testResults.results.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-medium">{r.testName}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                              r.status === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-500 text-[11px]">{r.durationMs}ms</td>
                        <td className="p-2.5 text-slate-500 text-[11px]">
                          {r.message ? (
                            <span className="text-rose-600">{r.message}</span>
                          ) : (
                            <span className="text-slate-400">Verified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Query Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-base">Save Query Definition</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Query Name</label>
                <input
                  type="text"
                  placeholder="e.g. Top Sales by Party"
                  value={newQueryName}
                  onChange={(e) => setNewQueryName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium">Description</label>
                <textarea
                  placeholder="Optional description of this analytical query"
                  value={newQueryDesc}
                  onChange={(e) => setNewQueryDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!newQueryName.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                Save Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
