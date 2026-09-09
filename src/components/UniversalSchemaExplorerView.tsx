import React, { useState, useEffect } from 'react';
import {
  Compass,
  Layers,
  Database,
  Tag,
  GitBranch,
  ShieldCheck,
  Search,
  Sparkles,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Eye,
  FileCode,
  ArrowRight,
  Info,
  RefreshCw,
  Cpu,
  Building2,
  Lock
} from 'lucide-react';

export function UniversalSchemaExplorerView() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'snapshots' | 'lineage' | 'relationships'>('explorer');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [sampleRecords, setSampleRecords] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [diffData, setDiffData] = useState<any>(null);
  const [lineage, setLineage] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileAndCollections();
  }, [selectedCategory, searchQuery]);

  const fetchProfileAndCollections = async () => {
    setLoading(true);
    try {
      const [profRes, colsRes, snapRes, linRes, relRes] = await Promise.all([
        fetch('/api/discovery/universal/company-profile'),
        fetch(`/api/discovery/universal/collections?category=${selectedCategory}&search=${searchQuery}`),
        fetch('/api/discovery/universal/snapshots'),
        fetch('/api/discovery/universal/lineage'),
        fetch('/api/discovery/universal/relationships')
      ]);

      const prof = await profRes.json();
      const cols = await colsRes.json();
      const snaps = await snapRes.json();
      const lin = await linRes.json();
      const rel = await relRes.json();

      setProfile(prof);
      setCollections(cols);
      setSnapshots(snaps);
      setLineage(lin);
      setRelationships(rel);

      if (cols.length > 0 && !selectedCollection) {
        handleSelectCollection(cols[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch universal discovery data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = async (name: string) => {
    try {
      const res = await fetch(`/api/discovery/universal/collections/${encodeURIComponent(name)}`);
      const data = await res.json();
      setSelectedCollection(data.collection);
      setSampleRecords(data.sampleRecords || []);
    } catch (err) {
      console.error('Error fetching collection detail', err);
    }
  };

  const fetchDiff = async () => {
    try {
      const res = await fetch('/api/discovery/universal/diff');
      const data = await res.json();
      setDiffData(data);
    } catch (err) {
      console.error('Failed to fetch diff', err);
    }
  };

  const categories = ['All', 'Vouchers', 'Masters', 'Inventory', 'Accounting', 'GST', 'Custom', 'Payroll'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Compass className="w-4 h-4" />
            Phase 10 — Universal Discovery Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tally Schema & Metadata Explorer</h1>
          <p className="text-slate-400 text-sm mt-1">
            Universal discovery of TallyPrime company collections, custom TDL extensions, confidence inference, and schema lineage.
          </p>
        </div>

        {profile && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5 min-w-[280px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" /> {profile.companyName}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-500/20">
                Connected (Read-Only)
              </span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-700/50">
              <span>Tally Version: <strong className="text-slate-200">{profile.tallyVersion}</strong></span>
              <span>Books: <strong className="text-slate-200">{profile.booksBeginning}</strong></span>
            </div>
            {/* Capabilities */}
            <div className="pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${profile.capabilities.gstEnabled ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-500'}`}>
                GST: {profile.capabilities.gstEnabled ? 'Active' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${profile.capabilities.inventoryEnabled ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500'}`}>
                Inventory: {profile.capabilities.inventoryEnabled ? 'Active' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${profile.capabilities.payrollEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'}`}>
                Payroll: {profile.capabilities.payrollEnabled ? 'Active' : 'Unavailable'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${profile.capabilities.costCentresEnabled ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-500'}`}>
                Cost Centres: {profile.capabilities.costCentresEnabled ? 'Active' : 'Off'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-3 py-1 shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'explorer'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Collections & Fields Explorer
        </button>
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'snapshots'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Schema Snapshots & Diff
        </button>
        <button
          onClick={() => setActiveTab('lineage')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'lineage'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Visual Data Lineage
        </button>
        <button
          onClick={() => setActiveTab('relationships')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'relationships'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Relationship Graph
        </button>
      </div>

      {/* TAB 1: COLLECTIONS & FIELDS EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Collections List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search collections or objects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Collection Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {collections.map(col => (
                <button
                  key={col.name}
                  onClick={() => handleSelectCollection(col.name)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    selectedCollection?.name === col.name ? 'bg-sky-50/70 border-l-4 border-sky-600' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{col.name}</span>
                      {col.isCustom && (
                        <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Object: {col.objectType}</span>
                      <span>•</span>
                      <span>{col.recordCount.toLocaleString()} records</span>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                    {col.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Fields & Sample Details */}
          <div className="lg:col-span-8 space-y-6">
            {selectedCollection ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedCollection.name}</h2>
                      {selectedCollection.isCustom && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded">
                          Custom TDL Structure
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Target Object: <strong className="text-slate-700">{selectedCollection.objectType}</strong> | Category: <strong className="text-slate-700">{selectedCollection.category}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">{selectedCollection.recordCount?.toLocaleString()}</span>
                    <span className="block text-xs text-slate-400">Total Indexed Records</span>
                  </div>
                </div>

                {/* Fields Spec Table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-600" /> Discovered Fields & Data Types ({selectedCollection.fields?.length || 0})
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Field Name</th>
                          <th className="p-3">Display Name</th>
                          <th className="p-3">Data Type</th>
                          <th className="p-3">Confidence</th>
                          <th className="p-3">Sample Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedCollection.fields?.map((f: any) => (
                          <tr key={f.fieldName} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-xs font-semibold text-slate-900">
                              {f.fieldName}
                              {f.isCustomTDL && (
                                <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                                  TDL
                                </span>
                              )}
                              {f.isSensitive && (
                                <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-800 font-bold px-1 rounded flex-inline items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5 inline" /> SENSITIVE
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-800 font-medium">{f.displayName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {f.dataType}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  f.confidence === 'High'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {f.confidence}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-xs text-slate-500 max-w-[200px] truncate">
                              {f.isSensitive && f.maskedPattern
                                ? f.maskedPattern
                                : f.sampleValues?.join(', ') || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sample Record Preview */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" /> Sample Record Preview
                  </h3>
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <pre>{JSON.stringify(sampleRecords[0] || {}, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                Select a collection from the list to inspect fields and sample data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEMA SNAPSHOTS & DIFF */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Schema Snapshots & Version History</h2>
                <p className="text-sm text-slate-500">
                  Compare company schema snapshots over time to detect new fields, modified types, or custom TDL changes.
                </p>
              </div>
              <button
                onClick={fetchDiff}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Run Schema Diff Comparison
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshots.map(snap => (
                <div key={snap.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{snap.id}</span>
                    <span className="text-xs text-slate-500">{new Date(snap.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Collections Indexed: <strong>{snap.collectionsCount}</strong></div>
                    <div>Total Fields: <strong>{snap.totalFieldsCount}</strong></div>
                    <div>Custom TDL Fields: <strong>{snap.customFieldsCount}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Diff Results Box */}
            {diffData && (
              <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> Schema Diff Analysis ({diffData.oldSnapshotId} vs {diffData.newSnapshotId})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
                    <span className="text-emerald-400 font-bold block mb-1">Added Fields (+):</span>
                    {diffData.addedFields.map((f: string) => (
                      <div key={f} className="text-emerald-300">• {f}</div>
                    ))}
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
                    <span className="text-sky-400 font-bold block mb-1">New Collections (+):</span>
                    {diffData.addedCollections.map((c: string) => (
                      <div key={c} className="text-sky-300">• {c}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL DATA LINEAGE */}
      {activeTab === 'lineage' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Source Traceability & Data Lineage</h2>
            <p className="text-sm text-slate-500">
              End-to-end traceability mapping from original Tally source fields to saved mapping definitions, report fields, and final export file columns.
            </p>
          </div>

          <div className="space-y-4">
            {lineage.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs min-w-[180px] text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Tally Source</span>
                  <strong className="text-slate-900">{item.source}</strong>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                <div className="bg-sky-50 p-3 rounded-lg border border-sky-200 text-center min-w-[180px]">
                  <span className="text-sky-600 block text-[10px] uppercase font-sans">Mapping Key</span>
                  <strong className="text-sky-900">{item.mappingKey}</strong>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-center min-w-[180px]">
                  <span className="text-indigo-600 block text-[10px] uppercase font-sans">Report Field</span>
                  <strong className="text-indigo-900">{item.reportField}</strong>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center min-w-[180px]">
                  <span className="text-emerald-600 block text-[10px] uppercase font-sans">Export Column</span>
                  <strong className="text-emerald-900">{item.exportColumn}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RELATIONSHIP GRAPH */}
      {activeTab === 'relationships' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Entity Relationship Graph</h2>
            <p className="text-sm text-slate-500">
              Discovered links between Vouchers, Ledgers, Stock Items, Cost Centres, and Godowns with confidence scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relationships.map((rel, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {rel.fromCollection} <span className="text-slate-400">({rel.fromField})</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Links to <strong className="text-slate-800">{rel.toCollection}</strong> ({rel.toField})
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full">
                    {rel.confidence} Confidence
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">{rel.relationshipType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
