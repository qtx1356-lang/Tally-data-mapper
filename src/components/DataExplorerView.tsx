import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Star,
  RefreshCw,
  Filter,
  CheckCircle2,
  Table,
  Info,
  Clock,
  Code2,
  FileText,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  GitBranch,
  Layers,
  Sparkles,
  ArrowRight,
  Copy,
  CheckSquare,
  Zap,
  Sliders
} from 'lucide-react';

interface DataExplorerViewProps {
  selectedCompany: any;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({ selectedCompany }) => {
  const companyId = selectedCompany ? selectedCompany.name : 'DEFAULT_COMP';

  // Mode: DataGrid | RelationshipGraph | CanonicalPaths
  const [explorerMode, setExplorerMode] = useState<'DataGrid' | 'RelationshipGraph' | 'CanonicalPaths'>('DataGrid');

  // Left Pane State
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [collectionSearch, setCollectionSearch] = useState('');
  const [activeCollection, setActiveCollection] = useState<string>('Ledger');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Center Data Grid State
  const [queryResult, setQueryResult] = useState<any>(null);
  const [gridLimit, setGridLimit] = useState<number>(100);
  const [gridSearchTerm, setGridSearchTerm] = useState<string>('');
  const [isLoadingGrid, setIsLoadingGrid] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colName: string } | null>(null);

  // Phase 4 State
  const [unifiedModel, setUnifiedModel] = useState<any>(null);
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [queryPlan, setQueryPlan] = useState<any>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Right Inspector State
  const [selectedField, setSelectedField] = useState<any>(null);

  useEffect(() => {
    fetchCollections();
    fetchUnifiedDiscovery();
  }, [companyId, selectedCategory]);

  useEffect(() => {
    if (activeCollection) {
      fetchSampleData(activeCollection, gridLimit, gridSearchTerm);
    }
  }, [activeCollection, gridLimit, companyId]);

  const fetchUnifiedDiscovery = () => {
    fetch(`/api/odbc/unified-discovery?companyId=${encodeURIComponent(companyId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.model) {
          setUnifiedModel(data.model);
        }
      })
      .catch(() => {});
  };

  const fetchCollections = () => {
    let url = `/api/odbc/collections?companyId=${encodeURIComponent(companyId)}`;
    if (selectedCategory && selectedCategory !== 'All') {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.collections) {
          setCollections(data.collections);
          if (data.collections.length > 0 && !data.collections.some((c: any) => c.name === activeCollection)) {
            setActiveCollection(data.collections[0].name);
          }
        }
      })
      .catch(() => {});
  };

  const fetchSampleData = (colName: string, limit: number, search: string) => {
    setIsLoadingGrid(true);
    fetch('/api/odbc/sample-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName: colName, limit, searchTerm: search })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoadingGrid(false);
        setQueryResult(data);
        if (data.columns && data.columns.length > 0) {
          setSelectedField(data.columns[0]);
        }
      })
      .catch(() => {
        setIsLoadingGrid(false);
      });
  };

  const handleCopyPath = (pathString: string) => {
    navigator.clipboard.writeText(pathString);
    setCopiedPath(pathString);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const toggleFavoritePath = (pathString: string) => {
    fetch('/api/odbc/field-paths/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, pathString })
    })
      .then(() => fetchUnifiedDiscovery())
      .catch(() => {});
  };

  const handleBuildPlan = () => {
    fetch('/api/odbc/query/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceEntity: activeCollection,
        fields: queryResult?.columns?.map((c: any) => c.name) || [],
        limit: gridLimit
      })
    })
      .then((res) => res.json())
      .then((data) => setQueryPlan(data.plan))
      .catch(() => {});
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(collectionSearch.toLowerCase()) ||
    c.displayName.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  const categories = ['All', 'Favorites', 'Masters', 'Transactions', 'Inventory', 'Accounting', 'Payroll', 'System'];

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Database className="h-5 w-5 text-sky-400" />
            <span>ADVANCED TALLY DATA EXPLORER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Phase 4 Unified Data Explorer: Objects, Data Paths, Relationship Graphs & Flattened Data Grids
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setExplorerMode('DataGrid')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded font-semibold transition-colors ${
              explorerMode === 'DataGrid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Data Grid</span>
          </button>

          <button
            onClick={() => setExplorerMode('RelationshipGraph')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded font-semibold transition-colors ${
              explorerMode === 'RelationshipGraph' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Relationship Graph</span>
          </button>

          <button
            onClick={() => setExplorerMode('CanonicalPaths')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded font-semibold transition-colors ${
              explorerMode === 'CanonicalPaths' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Canonical Field Paths</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Explorer Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* LEFT PANE: Collections Tree & List */}
        <div className="md:col-span-3 rounded-lg border border-slate-800 bg-[#1E293B] p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="space-y-2 mb-2 flex-shrink-0">
            {/* Category Pills */}
            <div className="flex space-x-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Collection Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search collections..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 pl-8 pr-3 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Collection List */}
          <div className="flex-1 overflow-y-auto space-y-1 text-xs pr-1">
            {filteredCollections.map((col) => {
              const isActive = activeCollection === col.name;
              return (
                <div
                  key={col.id || col.name}
                  onClick={() => setActiveCollection(col.name)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-sky-600/30 text-sky-200 border-l-2 border-sky-500 font-semibold'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Table className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{col.name}</span>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                      {col.recordCount ?? 'Dynamic'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PANE: Dynamic Mode View */}
        <div className="md:col-span-6 rounded-lg border border-slate-800 bg-slate-950 flex flex-col min-h-0 overflow-hidden">
          
          {/* VIEW 1: DATA GRID */}
          {explorerMode === 'DataGrid' && (
            <>
              <div className="p-3 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-sky-400 font-mono">{activeCollection}</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
                    {queryResult?.rows?.length || 0} Records
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBuildPlan}
                    className="flex items-center space-x-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-amber-400 border border-slate-700"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Build Query Plan</span>
                  </button>

                  <select
                    value={gridLimit}
                    onChange={(e) => setGridLimit(Number(e.target.value))}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>
              </div>

              {/* Data Grid Body */}
              <div className="flex-1 overflow-auto">
                {isLoadingGrid ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin text-sky-400 mr-2" />
                    <span>Executing read-only unified query...</span>
                  </div>
                ) : queryResult && queryResult.rows && queryResult.rows.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#0B1120] text-slate-300 font-mono text-[11px] border-b border-slate-800">
                      <tr>
                        {queryResult.columns.map((col: any) => (
                          <th
                            key={col.name}
                            onClick={() => setSelectedField(col)}
                            className={`p-2.5 font-semibold cursor-pointer whitespace-nowrap hover:bg-slate-800 ${
                              selectedField?.name === col.name ? 'bg-sky-900/50 text-sky-300 border-b-2 border-sky-400' : ''
                            }`}
                          >
                            <span>{col.displayName || col.name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {queryResult.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-900/60">
                          {queryResult.columns.map((col: any) => {
                            const val = row[col.name];
                            return (
                              <td
                                key={col.name}
                                onClick={() => setSelectedField(col)}
                                className="p-2.5 whitespace-nowrap cursor-pointer text-slate-200"
                              >
                                {val === null || val === undefined ? <span className="text-slate-600 italic">NULL</span> : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    No sample records returned for '{activeCollection}'.
                  </div>
                )}
              </div>
            </>
          )}

          {/* VIEW 2: RELATIONSHIP GRAPH */}
          {explorerMode === 'RelationshipGraph' && (
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-sky-400" />
                  <span>Relationship Graph Nodes & Edges</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Verified Connections</span>
              </div>

              <div className="space-y-3 text-xs">
                {unifiedModel?.relationships?.map((rel: any) => (
                  <div key={rel.id} className="rounded-lg border border-slate-800 bg-[#1E293B] p-3 space-y-2">
                    <div className="flex justify-between items-center font-mono">
                      <span className="font-bold text-sky-400">{rel.fromEntityId}.{rel.fromField}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-bold text-emerald-400">{rel.toEntityId}.{rel.toField}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Type: <strong className="text-slate-200">{rel.relationshipType}</strong> ({rel.cardinality})</span>
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {rel.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: CANONICAL FIELD PATHS */}
          {explorerMode === 'CanonicalPaths' && (
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                  <Code2 className="h-4 w-4 text-sky-400" />
                  <span>Canonical Field Paths Catalog</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Click path to copy</span>
              </div>

              <div className="space-y-2 text-xs">
                {unifiedModel?.canonicalPaths?.map((pathObj: any) => (
                  <div
                    key={pathObj.id}
                    className="flex items-center justify-between rounded border border-slate-800 bg-[#1E293B] p-2.5 font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sky-300 font-bold flex items-center space-x-2">
                        <span>{pathObj.pathString}</span>
                        <button
                          onClick={() => handleCopyPath(pathObj.pathString)}
                          className="p-1 text-slate-400 hover:text-slate-100"
                        >
                          {copiedPath === pathObj.pathString ? <CheckSquare className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400">Type: {pathObj.dataType} | Entity: {pathObj.entityName}</div>
                    </div>

                    <button
                      onClick={() => toggleFavoritePath(pathObj.pathString)}
                      className="p-1 text-slate-500 hover:text-amber-400"
                    >
                      <Star className={`h-3.5 w-3.5 ${pathObj.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANE: Inspector & Plan Panel */}
        <div className="md:col-span-3 rounded-lg border border-slate-800 bg-[#1E293B] p-3 flex flex-col min-h-0 overflow-hidden space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <Info className="h-3.5 w-3.5 text-sky-400" />
              <span>FIELD & QUERY PLAN INSPECTOR</span>
            </h3>
          </div>

          {queryPlan && (
            <div className="rounded border border-amber-800/80 bg-amber-950/30 p-2.5 space-y-1 text-xs">
              <span className="font-bold text-amber-300 block">Query Plan Executed:</span>
              <div className="font-mono text-[10px] text-slate-300">{queryPlan.technicalDetails}</div>
            </div>
          )}

          {selectedField ? (
            <div className="space-y-3 text-xs flex-1 overflow-y-auto pr-1">
              <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Field Name</span>
                <span className="text-sm font-bold font-mono text-sky-300">{selectedField.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Data Type</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedField.dataType}</span>
                </div>
                <div className="rounded bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Nullable</span>
                  <span className="font-mono text-slate-200">{selectedField.nullable ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Canonical Path</span>
                <span className="font-mono text-xs text-sky-300 font-bold">{activeCollection}.{selectedField.name}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-8">
              Select a column or entity to inspect unified metadata.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
