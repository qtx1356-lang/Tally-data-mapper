import React, { useState, useEffect } from 'react';
import {
  Compass,
  Database,
  Search,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldAlert,
  ArrowRight,
  GitCompare,
  PlusCircle,
  Clock,
  Terminal,
  HelpCircle,
  Eye,
  Settings,
  RefreshCw,
  GitFork,
  ArrowLeftRight,
  Check,
  Play,
  History,
  TrendingUp,
  Sliders,
  FolderTree
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export function Phase32LAnalyticsView() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('canonical-ledgers');
  const [datasetDetails, setDatasetDetails] = useState<any>(null);
  const [sampleRecords, setSampleRecords] = useState<any[]>([]);
  
  // Ad-hoc query state
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [queryFilters, setQueryFilters] = useState<any[]>([{ field: 'parentGroup', operator: 'EQ', value: 'Sundry Debtors' }]);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [explainPlan, setExplainPlan] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // NL Report service state
  const [nlPrompt, setNlPrompt] = useState<string>('Sales by party for April');
  const [nlResponse, setNlResponse] = useState<any>(null);
  const [nlRefinement, setNlRefinement] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Dashboards state
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState<boolean>(false);

  // Comparisons state
  const [compareRecordIdA, setCompareRecordIdA] = useState<string>('');
  const [compareRecordIdB, setCompareRecordIdB] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Tests state
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Active view tabs
  const [activeTab, setActiveTab] = useState<'explorer' | 'query' | 'nl' | 'dashboards' | 'compare' | 'tests'>('explorer');

  useEffect(() => {
    loadDatasets();
    loadDashboards();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetDetails(selectedDatasetId);
      loadSampleRecords(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadDatasets = async () => {
    try {
      const res = await fetch('/api/phase32l/datasets');
      const data = await res.json();
      if (data.success) {
        setDatasets(data.data);
      }
    } catch (err) {
      console.error('Error loading datasets', err);
    }
  };

  const loadDatasetDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/phase32l/datasets/${id}`);
      const data = await res.json();
      if (data.success) {
        setDatasetDetails(data.data);
        // Default to select first 3 fields
        if (data.data.fields) {
          setSelectedFields(data.data.fields.slice(0, 3).map((f: any) => f.field));
        }
      }
    } catch (err) {
      console.error('Error loading dataset details', err);
    }
  };

  const loadSampleRecords = async (id: string) => {
    try {
      const res = await fetch(`/api/phase32l/datasets/${id}/sample?limit=8`);
      const data = await res.json();
      if (data.success) {
        setSampleRecords(data.data);
        if (data.data.length >= 2) {
          setCompareRecordIdA(data.data[0].id);
          setCompareRecordIdB(data.data[1].id);
        }
      }
    } catch (err) {
      console.error('Error loading sample records', err);
    }
  };

  const loadDashboards = async () => {
    try {
      const res = await fetch('/api/phase32l/dashboards');
      const data = await res.json();
      if (data.success) {
        setDashboards(data.data);
        if (data.data.length > 0) {
          setSelectedDashboard(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading dashboards', err);
    }
  };

  const handleRunQuery = async () => {
    setIsQuerying(true);
    setQueryResult(null);
    setExplainPlan(null);
    try {
      const queryDef = {
        queryId: `q_${Date.now()}`,
        companyId: 'CMP-001',
        dataset: selectedDatasetId,
        fields: selectedFields,
        filters: queryFilters.filter(f => f.field && f.value)
      };

      // Fetch results
      const resQuery = await fetch('/api/phase32l/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryDef)
      });
      const dataQuery = await resQuery.json();

      // Fetch explain plan
      const resExplain = await fetch('/api/phase32l/query/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryDef)
      });
      const dataExplain = await resExplain.json();

      if (dataQuery.success) {
        setQueryResult(dataQuery.data);
      }
      if (dataExplain.success) {
        setExplainPlan(dataExplain.data);
      }
    } catch (err) {
      console.error('Error executing query', err);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleTranslateNL = async () => {
    setIsTranslating(true);
    setNlResponse(null);
    try {
      const res = await fetch('/api/phase32l/nl-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestText: nlPrompt, companyId: 'CMP-001' })
      });
      const data = await res.json();
      if (data.success) {
        setNlResponse(data.data);
      }
    } catch (err) {
      console.error('Error translating NL prompt', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRefineNL = async () => {
    if (!nlResponse) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/phase32l/nl-refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refinementText: nlRefinement,
          currentQuery: nlResponse.interpretedRequest,
          companyId: 'CMP-001'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNlResponse({
          ...nlResponse,
          interpretedRequest: data.data.interpretedRequest,
          explanation: data.data.explanation
        });
        setNlRefinement('');
      }
    } catch (err) {
      console.error('Error refining NL query', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRefreshDashboard = async () => {
    if (!selectedDashboard) return;
    setIsRefreshingDashboard(true);
    try {
      const res = await fetch(`/api/phase32l/dashboards/${selectedDashboard.dashboardId}/refresh`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSelectedDashboard(data.data);
      }
    } catch (err) {
      console.error('Error refreshing dashboard', err);
    } finally {
      setIsRefreshingDashboard(false);
    }
  };

  const handleCompareRecords = async () => {
    setComparisonResult(null);
    try {
      const res = await fetch('/api/phase32l/records/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDatasetId,
          recordIdA: compareRecordIdA,
          recordIdB: compareRecordIdB,
          companyId: 'CMP-001'
        })
      });
      const data = await res.json();
      if (data.success) {
        setComparisonResult(data.data);
      }
    } catch (err) {
      console.error('Error comparing records', err);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestResults(null);
    try {
      const res = await fetch('/api/phase32l/run-tests', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setTestResults(data);
      }
    } catch (err) {
      console.error('Error running test cases', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Mock charts source data
  const chartMockData = [
    { name: 'Acme Corp', amount: 12000 },
    { name: 'Global Tech', amount: 9500 },
    { name: 'Nippon Ind.', amount: 15400 },
    { name: 'Tata Steel', amount: 8200 },
    { name: 'Wipro Ltd', amount: 11000 }
  ];

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-slate-100 min-h-0 overflow-y-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-4 flex-shrink-0 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="rounded bg-sky-600 p-1.5 text-white shadow">
              <Compass className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              Phase 32L: Universal Analytics & Exploration Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse discovered datasets, run verified ad-hoc queries, generate explain plans, and query via natural language.
          </p>
        </div>

        {/* Quick run test button */}
        <button
          onClick={handleRunTests}
          disabled={isRunningTests}
          className="flex items-center space-x-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          {isRunningTests ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span>{isRunningTests ? 'Running Diagnostic Tests...' : 'Execute Phase 32L Tests'}</span>
        </button>
      </div>

      {/* Main Tabs Selection */}
      <div className="flex items-center space-x-1 border-b border-slate-800 bg-slate-950 px-6 py-1.5 flex-shrink-0">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'explorer'
              ? 'bg-slate-800 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Dataset Explorer
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'query'
              ? 'bg-slate-800 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visual Query Builder
        </button>
        <button
          onClick={() => setActiveTab('nl')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'nl'
              ? 'bg-slate-800 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Natural Language Chat
        </button>
        <button
          onClick={() => setActiveTab('dashboards')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'dashboards'
              ? 'bg-slate-800 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visual Dashboards
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'compare'
              ? 'bg-slate-800 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Record Comparer
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'tests'
              ? 'bg-slate-800 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Validation Suite ({testResults?.passed || 0}/{testResults?.total || 0})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 space-y-6">

        {/* 1. DATASET EXPLORER TAB */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Datasets list */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4">
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Database className="h-4 w-4 text-sky-400" />
                  <span>Discovered Tally Datasets</span>
                </h2>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {datasets.map((ds) => (
                    <button
                      key={ds.datasetId}
                      onClick={() => setSelectedDatasetId(ds.datasetId)}
                      className={`flex w-full items-start justify-between p-3 rounded-lg border text-left transition-all ${
                        selectedDatasetId === ds.datasetId
                          ? 'border-sky-500/50 bg-sky-950/20 text-sky-200 font-semibold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-xs block font-bold">{ds.displayName}</div>
                        <span className="text-[10px] text-slate-400 font-mono font-medium block mt-1">
                          {ds.datasetId} ({ds.category})
                        </span>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        {ds.recordCount} rows
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Dataset Details */}
            <div className="lg:col-span-8 space-y-6">
              {datasetDetails && (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-6">
                  {/* Metadata Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                        <span>{datasetDetails.displayName}</span>
                        <span className="rounded bg-sky-950 border border-sky-800 text-sky-400 text-[10px] font-semibold px-2 py-0.5">
                          Grain: {datasetDetails.grain}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">{datasetDetails.description}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono">
                      <div>Last Updated: {datasetDetails.lastUpdated}</div>
                      <div>Schema Version: v{datasetDetails.schemaVersion}</div>
                    </div>
                  </div>

                  {/* Fields exploration semantics */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      Semantic Field Registry
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="py-2.5">Field Name</th>
                            <th className="py-2.5">Data Type</th>
                            <th className="py-2.5">Semantic Role</th>
                            <th className="py-2.5">Source Map</th>
                            <th className="py-2.5 text-right">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {datasetDetails.fields?.map((f: any) => (
                            <tr key={f.field} className="hover:bg-slate-900/40 text-slate-300">
                              <td className="py-2.5 font-mono font-medium text-slate-200">{f.field}</td>
                              <td className="py-2.5">
                                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                                  {f.type}
                                </span>
                              </td>
                              <td className="py-2.5">{f.semanticRole}</td>
                              <td className="py-2.5 font-mono text-[10px] text-slate-400">{f.sourceField}</td>
                              <td className="py-2.5 text-right">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                                  f.confidence === 'Confirmed' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                }`}>
                                  {f.confidence}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Semantic Relationships */}
                  {datasetDetails.relationships?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                        Relational Graph Bindings (Phase 31)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {datasetDetails.relationships.map((rel: any) => (
                          <div key={rel.relationshipId} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-xs">{rel.name}</span>
                              <span className="rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono font-medium px-1.5 py-0.5">
                                {rel.cardinality}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              Join key: {rel.sourceDataset}.{rel.sourceKey} = {rel.targetDataset}.{rel.targetKey}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Records rows */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Warehouse Sample Records</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        Total Records in Memory: {datasetDetails.recordCount}
                      </span>
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/50">
                      <table className="w-full text-left text-[11px] border-collapse font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40 font-semibold">
                            <th className="px-4 py-2.5">ID</th>
                            {datasetDetails.fields?.slice(0, 4).map((f: any) => (
                              <th key={f.field} className="px-4 py-2.5">{f.field}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {sampleRecords.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-900/40">
                              <td className="px-4 py-2.5 font-bold text-sky-400">{r.id}</td>
                              {datasetDetails.fields?.slice(0, 4).map((f: any) => (
                                <td key={f.field} className="px-4 py-2.5 truncate max-w-[200px]">
                                  {JSON.stringify(r[f.field])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. VISUAL QUERY BUILDER TAB */}
        {activeTab === 'query' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Control panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-4">
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  <span>Build Ad-Hoc Query</span>
                </h2>

                {/* Target dataset */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Target Dataset</label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                  >
                    {datasets.map(ds => (
                      <option key={ds.datasetId} value={ds.datasetId}>{ds.displayName}</option>
                    ))}
                  </select>
                </div>

                {/* Fields Projection */}
                {datasetDetails && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Select Projections</label>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                      {datasetDetails.fields?.map((f: any) => (
                        <label key={f.field} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(f.field)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFields([...selectedFields, f.field]);
                              } else {
                                setSelectedFields(selectedFields.filter(field => field !== f.field));
                              }
                            }}
                          />
                          <span className="font-mono">{f.field}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                {datasetDetails && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Query Filters</label>
                    <div className="space-y-2">
                      {queryFilters.map((qf, i) => (
                        <div key={i} className="grid grid-cols-3 gap-1">
                          <select
                            value={qf.field}
                            onChange={(e) => {
                              const updated = [...queryFilters];
                              updated[i].field = e.target.value;
                              setQueryFilters(updated);
                            }}
                            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 font-mono focus:outline-none"
                          >
                            <option value="">(Field)</option>
                            {datasetDetails.fields?.map((f: any) => (
                              <option key={f.field} value={f.field}>{f.field}</option>
                            ))}
                          </select>
                          <select
                            value={qf.operator}
                            onChange={(e) => {
                              const updated = [...queryFilters];
                              updated[i].operator = e.target.value;
                              setQueryFilters(updated);
                            }}
                            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                          >
                            <option value="EQ">Equals</option>
                            <option value="CONTAINS">Contains</option>
                            <option value="GT">Greater Than</option>
                          </select>
                          <input
                            type="text"
                            value={qf.value}
                            onChange={(e) => {
                              const updated = [...queryFilters];
                              updated[i].value = e.target.value;
                              setQueryFilters(updated);
                            }}
                            placeholder="Value"
                            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 font-mono focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleRunQuery}
                  disabled={isQuerying || selectedFields.length === 0}
                  className="w-full flex items-center justify-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 py-2 text-xs font-bold text-white shadow-md transition-colors"
                >
                  {isQuerying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>Run Safe Analytical Query</span>
                </button>
              </div>
            </div>

            {/* Execution results & plan details */}
            <div className="lg:col-span-8 space-y-6">
              {queryResult ? (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-6">
                  {/* Performance stats banner */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-slate-200 text-sm flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Execution Result Details</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Completed in {queryResult.executionTimeMs}ms • Source: {queryResult.source} • Records: {queryResult.sampleRows?.length}
                    </span>
                  </div>

                  {/* Results table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40 font-semibold font-mono">
                          {queryResult.columns?.map((c: string) => (
                            <th key={c} className="px-4 py-2.5">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                        {queryResult.sampleRows?.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            {queryResult.columns?.map((c: string) => (
                              <td key={c} className="px-4 py-2">{JSON.stringify(row[c])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Explain Plan details */}
                  {explainPlan && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                        <Terminal className="h-4 w-4 text-sky-400" />
                        <span>Query Execution Explain Plan & Safety Verification</span>
                      </h3>

                      <div className="rounded-lg bg-slate-950 p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-[250px] overflow-y-auto">
                        <div className="text-sky-400 font-semibold border-b border-slate-800 pb-1 mb-2">
                          PLAN DETAILS [Plan ID: {explainPlan.plan.queryId || 'plan_auto_9831'}]
                        </div>
                        {explainPlan.plan.executionSteps?.map((step: any) => (
                          <div key={step.stepNumber} className="flex items-start space-x-2">
                            <span className="text-slate-500 font-bold">Step {step.stepNumber}:</span>
                            <div>
                              <span className="text-emerald-400 font-semibold">[{step.operation}]</span>
                              <span className="text-slate-300 pl-1.5">{step.details}</span>
                              <span className="text-slate-500 text-[10px] pl-2">(Cost: {step.costEstimate})</span>
                            </div>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-slate-800 mt-2 flex flex-col gap-1 text-[10px]">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 font-bold">Company Isolation:</span>
                            <span className="text-emerald-400">Strict isolation active on [CMP-001]</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 font-bold">Accounting Grain Protection:</span>
                            <span className={explainPlan.plan.grainSafety?.isSafe ? 'text-emerald-400' : 'text-amber-400'}>
                              {explainPlan.plan.grainSafety?.isSafe ? 'Verified Safe' : `Action Taken: ${explainPlan.plan.grainSafety?.actionTaken}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#1E293B] p-12 text-center text-slate-400">
                  <Sliders className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
                  <p className="text-xs">No active query run results. Construct projections and press Run safe query.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. NATURAL LANGUAGE CHAT TAB */}
        {activeTab === 'nl' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input and chat interface */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  <span>Translate Natural Language Report</span>
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Your query / request</label>
                    <textarea
                      value={nlPrompt}
                      onChange={(e) => setNlPrompt(e.target.value)}
                      placeholder="Ask anything, e.g. 'Sales by party for April' or 'Top 10 ledgers by amount'"
                      className="w-full h-24 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Suggestion list */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Try these queries:</span>
                    <button
                      onClick={() => setNlPrompt('Sales by party for April')}
                      className="block text-left text-[11px] text-sky-400 hover:underline"
                    >
                      • Sales by party for April
                    </button>
                    <button
                      onClick={() => setNlPrompt('Top 10 ledgers by amount')}
                      className="block text-left text-[11px] text-sky-400 hover:underline"
                    >
                      • Top 10 ledgers by amount
                    </button>
                    <button
                      onClick={() => setNlPrompt('Stock movement this month')}
                      className="block text-left text-[11px] text-sky-400 hover:underline"
                    >
                      • Stock movement this month
                    </button>
                    <button
                      onClick={() => setNlPrompt('Show current Bitcoin price history')}
                      className="block text-left text-[11px] text-sky-400 hover:underline"
                    >
                      • Show current Bitcoin price history (Hallucination Safeguard Test)
                    </button>
                  </div>

                  <button
                    onClick={handleTranslateNL}
                    disabled={isTranslating || nlPrompt.trim() === ''}
                    className="w-full flex items-center justify-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 py-2 text-xs font-bold text-white shadow-md transition-colors"
                  >
                    {isTranslating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Deconstruct Intent & Translate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Translation interpretation & availability check */}
            <div className="lg:col-span-7 space-y-6">
              {nlResponse ? (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-6">
                  {/* Interpretation Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-bold text-slate-200 text-sm block">Interpreted Intent Summary</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        Confidence Assessment: {nlResponse.confidence}
                      </span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      nlResponse.availability?.isAvailable ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}>
                      {nlResponse.availability?.isAvailable ? 'Data Available' : 'UNSUPPORTED REQUEST'}
                    </span>
                  </div>

                  {/* Availability check list */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <GitFork className="h-4 w-4 text-sky-400" />
                      <span>Dataset Availability Validation</span>
                    </h3>
                    <p className="text-xs text-slate-300">{nlResponse.explanation}</p>

                    {nlResponse.availability?.missingFields?.length > 0 && (
                      <div className="text-[11px] text-rose-300 bg-rose-950/20 rounded border border-rose-900/40 p-2 font-mono">
                        Missing Schema Fields: {nlResponse.availability.missingFields.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Generated Query Definition */}
                  {nlResponse.availability?.isAvailable && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                        <FileCode className="h-4 w-4 text-sky-400" />
                        <span>Candidate Query Definition</span>
                      </h3>

                      <pre className="rounded-lg bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre">
                        {JSON.stringify(nlResponse.interpretedRequest, null, 2)}
                      </pre>

                      {/* Conversational refinement */}
                      <div className="space-y-2 border-t border-slate-800 pt-4">
                        <label className="block text-slate-300 font-semibold text-xs">Conversational Refinement</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={nlRefinement}
                            onChange={(e) => setNlRefinement(e.target.value)}
                            placeholder="Add context, e.g. 'limit it to top 10' or 'group it by month'"
                            className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                          />
                          <button
                            onClick={handleRefineNL}
                            className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-1.5 text-xs font-bold text-white transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#1E293B] p-12 text-center text-slate-400">
                  <Sparkles className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
                  <p className="text-xs">Submit a natural language question to generate validated queries safely.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. VISUAL DASHBOARDS TAB */}
        {activeTab === 'dashboards' && (
          <div className="space-y-6">
            {/* Dashboard Selector */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-sky-400" />
                <span className="font-bold text-slate-100 text-sm">Active Workspace Dashboard</span>
                <select
                  value={selectedDashboard?.dashboardId}
                  onChange={(e) => {
                    const found = dashboards.find(d => d.dashboardId === e.target.value);
                    if (found) setSelectedDashboard(found);
                  }}
                  className="rounded border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 font-semibold focus:outline-none ml-2"
                >
                  {dashboards.map(d => (
                    <option key={d.dashboardId} value={d.dashboardId}>{d.title}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRefreshDashboard}
                disabled={isRefreshingDashboard}
                className="flex items-center space-x-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingDashboard ? 'animate-spin' : ''}`} />
                <span>Refresh Dashboard Widgets</span>
              </button>
            </div>

            {/* Dashboard widgets grid */}
            {selectedDashboard && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* KPI Cards */}
                {selectedDashboard.widgets?.filter((w: any) => w.type === 'KPI').map((w: any) => (
                  <div key={w.widgetId} className="md:col-span-4 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                      {w.title}
                    </span>
                    <div className="text-2xl font-bold text-slate-100">
                      {w.widgetId.includes('sales') ? '₹1,54,300' : w.widgetId.includes('outstanding') ? '₹45,200' : '4,850 Units'}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Synchronized via {w.freshness.source}</span>
                    </div>
                  </div>
                ))}

                {/* Analytical Charts */}
                <div className="md:col-span-6 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                    <span>Sales by Party Chart Widget</span>
                    <span className="text-[10px] text-emerald-400">Fresh (Warehouse-backed)</span>
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMockData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                        <Bar dataKey="amount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Table Widgets */}
                <div className="md:col-span-6 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                    <span>Outstanding Receivables by Debtor</span>
                    <span className="text-[10px] text-emerald-400">Analytical Warehouse</span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/30">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40 font-semibold font-mono">
                          <th className="px-4 py-2">Debtor Ledger Name</th>
                          <th className="px-4 py-2">Parent Group</th>
                          <th className="px-4 py-2 text-right">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                        <tr className="hover:bg-slate-900/40">
                          <td className="px-4 py-2">Acme Technologies Pvt Ltd</td>
                          <td className="px-4 py-2">Sundry Debtors</td>
                          <td className="px-4 py-2 text-right text-sky-400">₹45,200 Dr</td>
                        </tr>
                        <tr className="hover:bg-slate-900/40">
                          <td className="px-4 py-2">Hindustan Trading House</td>
                          <td className="px-4 py-2">Sundry Debtors</td>
                          <td className="px-4 py-2 text-right text-sky-400">₹22,100 Dr</td>
                        </tr>
                        <tr className="hover:bg-slate-900/40">
                          <td className="px-4 py-2">Nippon Enterprises Inc</td>
                          <td className="px-4 py-2">Sundry Debtors</td>
                          <td className="px-4 py-2 text-right text-sky-400">₹14,500 Dr</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. RECORD COMPARISON TAB */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                <GitCompare className="h-4 w-4 text-sky-400" />
                <span>Side-by-Side Warehouse Record Comparison</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Dataset</label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  >
                    {datasets.map(ds => (
                      <option key={ds.datasetId} value={ds.datasetId}>{ds.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Record ID A</label>
                  <input
                    type="text"
                    value={compareRecordIdA}
                    onChange={(e) => setCompareRecordIdA(e.target.value)}
                    placeholder="e.g. LED-001"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Record ID B</label>
                  <input
                    type="text"
                    value={compareRecordIdB}
                    onChange={(e) => setCompareRecordIdB(e.target.value)}
                    placeholder="e.g. LED-002"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCompareRecords}
                className="flex items-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Compare Records</span>
              </button>
            </div>

            {comparisonResult ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Meta details */}
                <div className="md:col-span-12 rounded-lg border border-slate-800 bg-[#1E293B] p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Comparison Metadata & Transformation Lineage</span>
                    <span className="rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-semibold px-2 py-0.5">
                      Schema Status: {comparisonResult.schemaCompatibility}
                    </span>
                  </div>
                </div>

                {/* Diff table */}
                <div className="md:col-span-12 rounded-lg border border-slate-800 bg-[#1E293B] p-5 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 pb-2">
                        <th className="py-2">Field Key</th>
                        <th className="py-2">Record A Values ({comparisonResult.recordA?.metadata?.canonicalRecordId})</th>
                        <th className="py-2">Record B Values ({comparisonResult.recordB?.metadata?.canonicalRecordId})</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.keys(comparisonResult.differences || {}).map(key => {
                        const diff = comparisonResult.differences[key];
                        return (
                          <tr key={key} className="hover:bg-slate-900/40 text-slate-300">
                            <td className="py-2 font-bold text-slate-200">{key}</td>
                            <td className="py-2">{JSON.stringify(diff.valueA)}</td>
                            <td className="py-2">{JSON.stringify(diff.valueB)}</td>
                            <td className="py-2 text-right">
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                diff.matches ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              }`}>
                                {diff.matches ? 'Matches' : 'Different'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#1E293B] p-12 text-center text-slate-400">
                <GitCompare className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
                <p className="text-xs">Specify record IDs A and B from warehouse to compare field differences.</p>
              </div>
            )}
          </div>
        )}

        {/* 6. DIAGNOSTIC TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Phase 32L Advanced Analytics Validation Suite</span>
                <span className="text-[10px] text-slate-400 font-mono">Automated verification matrix</span>
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                Run rigorous regression checks matching the user's intent: maps NL requests correctly, verifies strict read-only tally adapters, tests blank company safety blockings, validates grain safety & ledger fanout, and simulates performance limits.
              </p>

              <button
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="flex items-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors"
              >
                {isRunningTests ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Run Diagnostic Tests Suite</span>
              </button>
            </div>

            {testResults && (
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-slate-200 text-sm">Automated Test Results Summary</span>
                  <span className="text-xs text-slate-300 font-mono">
                    Passed: <span className="text-emerald-400 font-bold">{testResults.passed}</span> • Failed: <span className={testResults.failed > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{testResults.failed}</span>
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {testResults.results?.map((res: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between p-3 rounded-md bg-slate-950 border border-slate-800">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-200 block">{res.testName}</span>
                        <span className="text-slate-400 text-[10px] block">{res.message}</span>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        res.passed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {res.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
