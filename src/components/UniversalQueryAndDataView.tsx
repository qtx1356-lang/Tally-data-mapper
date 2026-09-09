import React, { useState, useEffect } from 'react';
import {
  Table,
  Play,
  Save,
  Sparkles,
  Filter,
  CheckCircle2,
  Code2,
  FileSpreadsheet,
  Search,
  Eye,
  Sliders,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

export function UniversalQueryAndDataView() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'query' | 'suggestions'>('query');

  // Query Builder State
  const [selectedCollection, setSelectedCollection] = useState('Sales Vouchers');
  const [selectedFields, setSelectedFields] = useState<string[]>(['Date', 'Voucher Number', 'Party', 'Amount']);
  const [filterText, setFilterText] = useState('Date >= 01-Apr-2026');
  const [sortField, setSortField] = useState('Date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [recordLimit, setRecordLimit] = useState(100);

  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);

  // Explorer State
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    handleRunQuery();
    fetchSmartSuggestions();
  }, []);

  const handleRunQuery = async () => {
    setQueryLoading(true);
    try {
      const res = await fetch('/api/discovery/universal/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: selectedCollection,
          fields: selectedFields,
          filter: filterText,
          sortField,
          sortOrder,
          limit: recordLimit
        })
      });
      const data = await res.json();
      setQueryResult(data);
      if (data.records?.length > 0) {
        setSelectedRecord(data.records[0]);
      }
    } catch (err) {
      console.error('Failed to run query', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const fetchSmartSuggestions = async () => {
    try {
      const res = await fetch('/api/discovery/universal/smart-suggestions');
      const data = await res.json();
      setSmartSuggestions(data);
    } catch (err) {
      console.error('Failed to fetch smart suggestions', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sliders className="w-4 h-4" />
            Phase 10 — Query & Mapping Intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Visual Query Builder & Universal Explorer</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build schema queries without writing TDL or SQL, inspect raw formatted record objects, and apply smart mapping candidates.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-3 py-1 shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('query')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'query'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Visual Query Builder
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'explorer'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          Universal Record Inspector
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'suggestions'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Smart Candidate Mapping
        </button>
      </div>

      {/* TAB 1: VISUAL QUERY BUILDER */}
      {activeTab === 'query' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Query Controls Panel */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-sky-600" /> Query Definition
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Collection (FROM)</label>
                <select
                  value={selectedCollection}
                  onChange={e => setSelectedCollection(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Sales Vouchers">Sales Vouchers</option>
                  <option value="Ledger Masters">Ledger Masters</option>
                  <option value="Stock Items">Stock Items</option>
                  <option value="Custom_VehicleTracking_TDL">Custom_VehicleTracking_TDL</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filter Condition (WHERE)</label>
                <input
                  type="text"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  placeholder="e.g. Date >= 01-Apr-2026 AND Amount > 10000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sort Field</label>
                  <input
                    type="text"
                    value={sortField}
                    onChange={e => setSortField(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order</label>
                  <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="DESC">DESC (Descending)</option>
                    <option value="ASC">ASC (Ascending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Record Limit (LIMIT)</label>
                <input
                  type="number"
                  value={recordLimit}
                  onChange={e => setRecordLimit(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <button
                onClick={handleRunQuery}
                disabled={queryLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" /> {queryLoading ? 'Executing Query...' : 'Execute Query'}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-4">
            {queryResult && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-sky-400 font-semibold">
                    <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Human-Readable Explanation</span>
                    <span className="text-slate-400 text-[10px]"><Clock className="w-3 h-3 inline mr-1" />{queryResult.executionTimeMs} ms</span>
                  </div>
                  <p className="font-mono text-slate-300 pt-1">{queryResult.explanation}</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        {Object.keys(queryResult.records[0] || {}).map(k => (
                          <th key={k} className="p-3">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-800">
                      {queryResult.records.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(r).map((v: any, vIdx) => (
                            <td key={vIdx} className="p-3">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UNIVERSAL RECORD INSPECTOR */}
      {activeTab === 'explorer' && selectedRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Formatted & Raw Field Values</h2>
            <div className="space-y-3 font-mono text-xs">
              {Object.entries(selectedRecord).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between">
                  <span className="font-semibold text-slate-700">{key}:</span>
                  <span className="text-slate-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Record JSON Object</h2>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMART MAPPING CANDIDATES */}
      {activeTab === 'suggestions' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI-Assisted Smart Candidate Mapping</h2>
            <p className="text-sm text-slate-500">
              Confidence-scored suggestions matching target export keys with TallyPrime source fields.
            </p>
          </div>

          <div className="space-y-4">
            {smartSuggestions.map((sug, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{sug.outputField}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded">
                      {sug.candidateSourceField}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{sug.explanation}</p>
                </div>

                <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full">
                  {sug.confidence} Confidence
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
