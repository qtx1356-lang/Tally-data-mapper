import React, { useState, useEffect } from 'react';
import {
  Database,
  Filter,
  Layers,
  Calculator,
  Play,
  RotateCcw,
  Save,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  HelpCircle,
  Eye,
  FileSpreadsheet,
  FileText,
  StopCircle,
  ArrowRight,
  GitBranch,
  ShieldAlert
} from 'lucide-react';
import {
  VisualQueryDefinition,
  QueryFilterCondition,
  QueryAggregationRule,
  QuerySortRule,
  CalculatedFieldRule,
  QueryOperator,
  QueryPerformanceEstimate,
  QueryExecutionResult,
  SavedQueryRecord,
  NlToQueryTranslationResult,
  DataLineageTrace,
  DiscoveredObject
} from '../types/phase15DiscoveryAndReporting';

export const VisualQueryBuilderView: React.FC = () => {
  // Mode state: Simple vs Advanced
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);

  // Active Query Definition
  const [query, setQuery] = useState<VisualQueryDefinition>({
    queryId: 'QRY-ACTIVE-01',
    queryName: 'Customer High Value Sales & Turnover Report',
    primaryObject: 'Voucher',
    selectedFields: ['VOUCHERNUMBER', 'DATE', 'PARTYLEDGERNAME', 'AMOUNT', 'PARTYGSTIN'],
    filters: [
      { id: 'f1', fieldName: 'VOUCHERTYPENAME', operator: 'CONTAINS', value: 'Sales' },
      { id: 'f2', fieldName: 'AMOUNT', operator: '>', value: '100000' }
    ],
    filterLogicalOperator: 'AND',
    groupByFields: ['PARTYLEDGERNAME'],
    aggregations: [
      { id: 'a1', fieldName: 'AMOUNT', function: 'SUM', outputAlias: 'Total Sales (₹)' }
    ],
    sortRules: [{ id: 's1', fieldName: 'AMOUNT', direction: 'DESC' }],
    calculatedFields: [
      {
        id: 'c1',
        outputFieldName: 'Estimated Gross Margin (₹)',
        safeExpression: '[AMOUNT] * 0.22',
        outputDataType: 'Currency'
      }
    ],
    limitRows: 25
  });

  // Discovered Objects and Fields
  const [availableObjects, setAvailableObjects] = useState<DiscoveredObject[]>([]);
  const [isLoadingObjects, setIsLoadingObjects] = useState<boolean>(false);

  // Execution & Performance States
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<QueryExecutionResult | null>(null);
  const [performanceEstimate, setPerformanceEstimate] = useState<QueryPerformanceEstimate | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Saved Queries
  const [savedQueriesList, setSavedQueriesList] = useState<SavedQueryRecord[]>([]);
  const [showSavedQueriesModal, setShowSavedQueriesModal] = useState<boolean>(false);

  // Copilot Natural Language Assistant
  const [nlPrompt, setNlPrompt] = useState<string>('Show customers with sales above 10 lakh this year');
  const [isTranslatingNl, setIsTranslatingNl] = useState<boolean>(false);
  const [nlResult, setNlResult] = useState<NlToQueryTranslationResult | null>(null);
  const [showNlDiffModal, setShowNlDiffModal] = useState<boolean>(false);

  // Lineage / "Why this value?" Modal
  const [activeLineage, setActiveLineage] = useState<DataLineageTrace | null>(null);
  const [showLineageModal, setShowLineageModal] = useState<boolean>(false);

  // Cancellation Controller
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Fetch objects and saved queries on load
  useEffect(() => {
    fetchObjects();
    fetchSavedQueries();
    fetchEstimate(query);
  }, []);

  const fetchObjects = async () => {
    setIsLoadingObjects(true);
    try {
      const res = await fetch('/api/discovery/objects');
      if (res.ok) {
        const data = await res.json();
        setAvailableObjects(data);
      }
    } catch (err) {
      console.error('Failed to load discovered objects', err);
    } finally {
      setIsLoadingObjects(false);
    }
  };

  const fetchSavedQueries = async () => {
    try {
      const res = await fetch('/api/query-builder/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedQueriesList(data);
      }
    } catch (err) {
      console.error('Failed to load saved queries', err);
    }
  };

  const fetchEstimate = async (def: VisualQueryDefinition) => {
    try {
      const res = await fetch('/api/query-builder/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(def)
      });
      if (res.ok) {
        const data = await res.json();
        setPerformanceEstimate(data);
      }
    } catch (err) {
      console.error('Failed to estimate performance', err);
    }
  };

  const activeObjectDef = availableObjects.find((o) => o.name === query.primaryObject) || availableObjects[0];

  // Handler: Change Object
  const handleObjectChange = (newObj: string) => {
    const target = availableObjects.find((o) => o.name === newObj);
    const firstFields = target ? target.fields.slice(0, 5).map((f) => f.fieldName) : [];
    const updated = {
      ...query,
      primaryObject: newObj,
      selectedFields: firstFields,
      filters: [],
      groupByFields: [],
      aggregations: [],
      calculatedFields: []
    };
    setQuery(updated);
    fetchEstimate(updated);
  };

  // Handler: Toggle Field Selection
  const toggleFieldSelection = (fieldName: string) => {
    let next: string[];
    if (query.selectedFields.includes(fieldName)) {
      if (query.selectedFields.length === 1) return; // Keep at least one field
      next = query.selectedFields.filter((f) => f !== fieldName);
    } else {
      next = [...query.selectedFields, fieldName];
    }
    const updated = { ...query, selectedFields: next };
    setQuery(updated);
    fetchEstimate(updated);
  };

  // Handler: Add Filter
  const addFilterCondition = () => {
    const newFilter: QueryFilterCondition = {
      id: `f-${Date.now()}`,
      fieldName: activeObjectDef?.fields[0]?.fieldName || 'AMOUNT',
      operator: '=',
      value: ''
    };
    const updated = { ...query, filters: [...query.filters, newFilter] };
    setQuery(updated);
    fetchEstimate(updated);
  };

  // Handler: Remove Filter
  const removeFilterCondition = (id: string) => {
    const updated = { ...query, filters: query.filters.filter((f) => f.id !== id) };
    setQuery(updated);
    fetchEstimate(updated);
  };

  // Handler: Update Filter
  const updateFilterCondition = (id: string, updates: Partial<QueryFilterCondition>) => {
    const updated = {
      ...query,
      filters: query.filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    };
    setQuery(updated);
    fetchEstimate(updated);
  };

  // Handler: Add Calculated Field
  const addCalculatedField = () => {
    const newCalc: CalculatedFieldRule = {
      id: `c-${Date.now()}`,
      outputFieldName: `Custom Metric ${query.calculatedFields.length + 1}`,
      safeExpression: '[AMOUNT] * 0.18',
      outputDataType: 'Currency'
    };
    setQuery({ ...query, calculatedFields: [...query.calculatedFields, newCalc] });
  };

  // Handler: Remove Calculated Field
  const removeCalculatedField = (id: string) => {
    setQuery({ ...query, calculatedFields: query.calculatedFields.filter((c) => c.id !== id) });
  };

  // Handler: Execute Query Preview
  const handleExecuteQuery = async (limit: number = 25) => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsExecuting(true);
    setValidationErrors([]);

    try {
      // Step 1: Validate
      const valRes = await fetch('/api/query-builder/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
        signal: controller.signal
      });

      const valData = await valRes.json();
      if (!valData.isValid) {
        setValidationErrors(valData.validationErrors);
        setIsExecuting(false);
        return;
      }

      // Step 2: Execute
      const execRes = await fetch('/api/query-builder/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...query, limitRows: limit }),
        signal: controller.signal
      });

      if (execRes.ok) {
        const execData = await execRes.json();
        setExecutionResult(execData);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Query preview cancelled by user safely.');
      } else {
        console.error('Execution error', err);
      }
    } finally {
      setIsExecuting(false);
      setAbortController(null);
    }
  };

  // Handler: Cancel in-flight Query
  const handleCancelExecution = () => {
    if (abortController) {
      abortController.abort();
      setIsExecuting(false);
      setAbortController(null);
    }
  };

  // Handler: Save Query
  const handleSaveQuery = async () => {
    try {
      const res = await fetch('/api/query-builder/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      if (res.ok) {
        await fetchSavedQueries();
        alert('Query saved successfully with version increment!');
      }
    } catch (err) {
      console.error('Failed to save query', err);
    }
  };

  // Handler: Copilot Natural Language Translation
  const handleTranslateNl = async () => {
    if (!nlPrompt.trim()) return;
    setIsTranslatingNl(true);
    try {
      const res = await fetch('/api/query-builder/copilot-nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlPrompt })
      });
      if (res.ok) {
        const data: NlToQueryTranslationResult = await res.json();
        setNlResult(data);
        setShowNlDiffModal(true);
      }
    } catch (err) {
      console.error('Failed to translate NL prompt', err);
    } finally {
      setIsTranslatingNl(false);
    }
  };

  // Handler: Accept Copilot Query
  const handleAcceptCopilotQuery = () => {
    if (nlResult) {
      setQuery(nlResult.generatedQuery);
      fetchEstimate(nlResult.generatedQuery);
      setShowNlDiffModal(false);
      handleExecuteQuery(25);
    }
  };

  // Handler: Inspect Lineage ("Why this value?")
  const handleInspectLineage = async (columnId: string) => {
    try {
      const res = await fetch(`/api/reports/lineage/${columnId}`);
      if (res.ok) {
        const trace = await res.json();
        setActiveLineage(trace);
        setShowLineageModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch lineage', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Read-Only Banner */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                100% Read-Only Safety Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-950/80 text-sky-400 border border-sky-800">
                Phase 15 Universal Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2 flex items-center gap-2.5">
              <Filter className="h-6 w-6 text-sky-400" />
              Visual Query & Custom Output Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Construct precise multi-dimensional queries across discovered Tally objects, collections, and TDL attributes with zero write operations.
            </p>
          </div>

          {/* Mode Switch & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setIsAdvancedMode(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  !isAdvancedMode
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simple Mode
              </button>
              <button
                onClick={() => setIsAdvancedMode(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isAdvancedMode
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Advanced Mode
              </button>
            </div>

            <button
              onClick={() => setShowSavedQueriesModal(true)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              Saved Queries ({savedQueriesList.length})
            </button>
          </div>
        </div>

        {/* Copilot Natural Language Assistant Bar */}
        <div className="mt-5 pt-5 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Sparkles className="h-4 w-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder="Ask Copilot in plain English, e.g., 'Show customers with sales above 10 lakh this year' or 'Stock items with zero balance'..."
                className="w-full bg-slate-900/90 border border-purple-500/30 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={handleTranslateNl}
              disabled={isTranslatingNl}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isTranslatingNl ? 'Translating Query...' : 'Generate Query with Copilot'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Object & Field Selection (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Object Selector */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              1. Target Tally Object / Collection
            </label>
            <div className="space-y-1.5">
              {['Voucher', 'Ledger', 'StockItem', 'Bill'].map((objName) => {
                const isSelected = query.primaryObject === objName;
                return (
                  <button
                    key={objName}
                    onClick={() => handleObjectChange(objName)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-600/20 border-sky-500 text-sky-200 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Database className={`h-3.5 w-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span>{objName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {objName === 'Voucher' ? '52 fields' : objName === 'Ledger' ? '38 fields' : '32 fields'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field Selection Checklist */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Select Output Fields ({query.selectedFields.length})
              </label>
              <span className="text-[10px] text-slate-400">Click to toggle</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {activeObjectDef?.fields.map((field) => {
                const isSelected = query.selectedFields.includes(field.fieldName);
                return (
                  <div
                    key={field.fieldName}
                    onClick={() => toggleFieldSelection(field.fieldName)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500/50 text-sky-100'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-sky-600 border-sky-400' : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="truncate">
                        <div className="font-medium truncate">{field.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{field.fieldName}</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {field.dataType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance & Row Scanning Estimate */}
          {performanceEstimate && (
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Performance Estimate
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    performanceEstimate.estimatedTier === 'Small'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : performanceEstimate.estimatedTier === 'Medium'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {performanceEstimate.estimatedTier} Execution
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{performanceEstimate.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Est. Rows Scanned</span>
                  <span className="text-slate-200 font-bold">{performanceEstimate.estimatedRowCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Est. Scan Time</span>
                  <span className="text-slate-200 font-bold">{performanceEstimate.estimatedExecutionTimeMs} ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Filters, Grouping, Expressions, and Preview (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Query Name & Actions Header */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Query Title</label>
              <input
                type="text"
                value={query.queryName}
                onChange={(e) => setQuery({ ...query, queryName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveQuery}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5 text-sky-400" />
                Save Query
              </button>
              {isExecuting ? (
                <button
                  onClick={handleCancelExecution}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => handleExecuteQuery(25)}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Preview (25)
                </button>
              )}
            </div>
          </div>

          {/* Visual Filters Section */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  3. Query Filters ({query.filters.length})
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Match: {query.filterLogicalOperator}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setQuery({
                      ...query,
                      filterLogicalOperator: query.filterLogicalOperator === 'AND' ? 'OR' : 'AND'
                    })
                  }
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Toggle to {query.filterLogicalOperator === 'AND' ? 'OR' : 'AND'}
                </button>
                <button
                  onClick={addFilterCondition}
                  className="text-[11px] px-2.5 py-1 rounded bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-700/50 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Filter Condition
                </button>
              </div>
            </div>

            {query.filters.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-900/40 rounded-lg border border-dashed border-slate-800">
                No filters defined. All records in collection will be scanned up to preview limit.
              </div>
            ) : (
              <div className="space-y-2">
                {query.filters.map((flt, idx) => (
                  <div
                    key={flt.id}
                    className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs"
                  >
                    <span className="text-[10px] text-slate-400 font-mono w-6">#{idx + 1}</span>

                    {/* Field Dropdown */}
                    <select
                      value={flt.fieldName}
                      onChange={(e) => updateFilterCondition(flt.id, { fieldName: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      {activeObjectDef?.fields.map((f) => (
                        <option key={f.fieldName} value={f.fieldName}>
                          {f.displayName} ({f.fieldName})
                        </option>
                      ))}
                    </select>

                    {/* Operator Dropdown (All 13 Operators) */}
                    <select
                      value={flt.operator}
                      onChange={(e) => updateFilterCondition(flt.id, { operator: e.target.value as QueryOperator })}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    >
                      <option value="=">=</option>
                      <option value="≠">≠ (Not equal)</option>
                      <option value="<">&lt;</option>
                      <option value=">">&gt;</option>
                      <option value="≤">≤</option>
                      <option value="≥">≥</option>
                      <option value="CONTAINS">CONTAINS</option>
                      <option value="STARTS WITH">STARTS WITH</option>
                      <option value="ENDS WITH">ENDS WITH</option>
                      <option value="IS EMPTY">IS EMPTY</option>
                      <option value="IS NOT EMPTY">IS NOT EMPTY</option>
                      <option value="IN">IN</option>
                      <option value="BETWEEN">BETWEEN</option>
                    </select>

                    {/* Value Input */}
                    {!['IS EMPTY', 'IS NOT EMPTY'].includes(flt.operator) && (
                      <input
                        type="text"
                        value={flt.value}
                        onChange={(e) => updateFilterCondition(flt.id, { value: e.target.value })}
                        placeholder="Criteria value..."
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 flex-1 min-w-[120px] focus:outline-none focus:border-sky-500"
                      />
                    )}

                    {flt.operator === 'BETWEEN' && (
                      <input
                        type="text"
                        value={flt.secondValue || ''}
                        onChange={(e) => updateFilterCondition(flt.id, { secondValue: e.target.value })}
                        placeholder="End value..."
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 w-28 focus:outline-none focus:border-sky-500"
                      />
                    )}

                    <button
                      onClick={() => removeFilterCondition(flt.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete filter"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grouping, Aggregations & Calculated Fields (Advanced) */}
          {isAdvancedMode && (
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-400" />
                  4. Safe Expressions & Calculated Columns
                </span>
                <button
                  onClick={addCalculatedField}
                  className="text-[11px] px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Calculated Field
                </button>
              </div>

              {query.calculatedFields.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No calculated formulas added yet.</p>
              ) : (
                <div className="space-y-2">
                  {query.calculatedFields.map((cf) => (
                    <div
                      key={cf.id}
                      className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cf.outputFieldName}
                          onChange={(e) => {
                            const next = query.calculatedFields.map((c) =>
                              c.id === cf.id ? { ...c, outputFieldName: e.target.value } : c
                            );
                            setQuery({ ...query, calculatedFields: next });
                          }}
                          placeholder="Output column label..."
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-medium flex-1 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => removeCalculatedField(cf.id)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Formula:</span>
                        <input
                          type="text"
                          value={cf.safeExpression}
                          onChange={(e) => {
                            const next = query.calculatedFields.map((c) =>
                              c.id === cf.id ? { ...c, safeExpression: e.target.value } : c
                            );
                            setQuery({ ...query, calculatedFields: next });
                          }}
                          placeholder="e.g. [AMOUNT] * 0.18 or [AMOUNT] - [COST]"
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono flex-1 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Validation Warnings / Errors Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-4 text-xs text-rose-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Query Validation Issues
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Data Preview Section */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4 text-sky-400" />
                  Live Preview Result
                </span>
                {executionResult && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {executionResult.explanation} (Duration: {executionResult.executionDurationMs} ms)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExecuteQuery(100)}
                  disabled={isExecuting}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Preview 100
                </button>
                <button
                  onClick={() => handleExecuteQuery(500)}
                  disabled={isExecuting}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Preview 500
                </button>
              </div>
            </div>

            {/* Results Table */}
            {isExecuting ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Scanning Tally Collection [{query.primaryObject}]...</p>
                <p className="text-[10px] text-slate-500">Read-only connection active. Zero mutations generated.</p>
              </div>
            ) : executionResult && executionResult.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3 w-10 text-slate-500">#</th>
                      {executionResult.columns.map((col) => (
                        <th key={col} className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{col}</span>
                            <button
                              onClick={() => handleInspectLineage(col)}
                              title="Why this value? (View Data Lineage)"
                              className="text-slate-500 hover:text-sky-400"
                            >
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {executionResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-500 text-[10px]">{idx + 1}</td>
                        {executionResult.columns.map((col) => {
                          const val = row[col];
                          const isCurrency =
                            typeof val === 'number' &&
                            (col.toUpperCase().includes('AMOUNT') ||
                              col.toUpperCase().includes('MARGIN') ||
                              col.toUpperCase().includes('BALANCE'));

                          return (
                            <td key={col} className="py-2 px-3 text-slate-200 whitespace-nowrap">
                              {isCurrency ? `₹ ${val.toLocaleString('en-IN')}` : String(val ?? '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-lg border border-slate-800">
                Click &quot;Run Preview (25)&quot; to inspect live records from Tally.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Copilot NL Translation Diff Preview */}
      {showNlDiffModal && nlResult && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-purple-500/40 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">Copilot Generated Query</h3>
              </div>
              <button
                onClick={() => setShowNlDiffModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Natural Language Prompt:</span>
                <p className="text-slate-100 font-semibold mt-0.5">"{nlResult.originalPrompt}"</p>
              </div>

              <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg space-y-1">
                <span className="text-purple-300 font-bold block text-[11px]">Why these fields were selected:</span>
                <p className="text-purple-200 text-xs">{nlResult.explanationOfChoices}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400">Target Object:</span>
                  <p className="text-slate-100 font-bold">{nlResult.generatedQuery.primaryObject}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Selected Fields:</span>
                  <p className="text-slate-200 font-mono text-[11px] truncate">
                    {nlResult.generatedQuery.selectedFields.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowNlDiffModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Discard
              </button>
              <button
                onClick={handleAcceptCopilotQuery}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Apply to Query Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Data Lineage ("Why this value?") */}
      {showLineageModal && activeLineage && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-sky-500/40 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">Data Lineage: {activeLineage.outputColumn}</h3>
              </div>
              <button
                onClick={() => setShowLineageModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block">Tally Source Object:</span>
                <span className="text-sky-300 font-semibold">{activeLineage.tallyObject}</span>
              </div>

              {activeLineage.calculatedFormula && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Calculation Formula:</span>
                  <span className="text-emerald-300 font-mono text-[11px]">{activeLineage.calculatedFormula}</span>
                </div>
              )}

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block">Verified Tally XML Tags:</span>
                <ul className="list-disc list-inside text-slate-300 font-mono text-[11px] space-y-0.5">
                  {activeLineage.tallySourceFields.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-slate-400 italic">{activeLineage.explanation}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowLineageModal(false)}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Saved Queries Library */}
      {showSavedQueriesModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">Saved Queries Library</h3>
              </div>
              <button
                onClick={() => setShowSavedQueriesModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {savedQueriesList.map((sq) => (
                <div
                  key={sq.queryId}
                  className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{sq.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-sky-400 border border-slate-700 font-mono">
                        v{sq.version}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Object: <span className="text-slate-300">{sq.definition.primaryObject}</span> • Created by {sq.createdBy} • Updated {new Date(sq.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setQuery(sq.definition);
                      fetchEstimate(sq.definition);
                      setShowSavedQueriesModal(false);
                      handleExecuteQuery(25);
                    }}
                    className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                  >
                    Load & Run
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSavedQueriesModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
