import React, { useState, useEffect } from 'react';
import {
  Compass,
  Database,
  Layers,
  GitMerge,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Eye,
  ArrowRight,
  GitBranch,
  FileCode,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Lock,
  Tag,
  Share2,
  Filter,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import {
  DiscoveredOutputItem,
  DiscoveredObject,
  DiscoveredField,
  DiscoveryExecutionSummary,
  FieldSampleResult,
  TdlOutputDescriptor,
  ObjectRelationshipGraph,
  OutputAvailabilityMatrixRow,
  SchemaSnapshot,
  SchemaDiffResult,
  OutputCategory,
  MappingConfidence
} from '../types/phase15DiscoveryAndReporting';

export const UniversalOutputDiscoveryStudioView: React.FC = () => {
  // Mode: Simple Mode (default for business users) vs Advanced Mode
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | 'catalog'
    | 'objects_graph'
    | 'mapping_studio'
    | 'tdl_intelligence'
    | 'matrix'
    | 'snapshots_diff'
  >('catalog');

  // Pipeline Execution State
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveryProgressStep, setDiscoveryProgressStep] = useState<string>('');
  const [discoverySummary, setDiscoverySummary] = useState<DiscoveryExecutionSummary | null>(null);

  // Output Catalog state
  const [outputs, setOutputs] = useState<DiscoveredOutputItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [onlyTdlFilter, setOnlyTdlFilter] = useState<boolean>(false);
  const [onlyUnmappedFilter, setOnlyUnmappedFilter] = useState<boolean>(false);

  // Object & Graph state
  const [objects, setObjects] = useState<DiscoveredObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('OBJ-VOUCHER');
  const [relationshipGraph, setRelationshipGraph] = useState<ObjectRelationshipGraph | null>(null);

  // Field Sample Preview Modal
  const [sampleResult, setSampleResult] = useState<FieldSampleResult | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [showSampleModal, setShowSampleModal] = useState<boolean>(false);

  // Human Confirmation Modal for Low Confidence Field Mappings
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [activeConfirmationField, setActiveConfirmationField] = useState<DiscoveredField | null>(null);

  // Availability Matrix
  const [matrixRows, setMatrixRows] = useState<OutputAvailabilityMatrixRow[]>([]);

  // Schema Snapshots & Diff
  const [snapshots, setSnapshots] = useState<SchemaSnapshot[]>([]);
  const [diffResult, setDiffResult] = useState<SchemaDiffResult | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(false);

  // TDL Intelligence
  const [tdlOutputs, setTdlOutputs] = useState<TdlOutputDescriptor[]>([]);

  // Initial Load
  useEffect(() => {
    loadDiscoverySummary();
    loadCatalog();
    loadObjects();
    loadRelationshipGraph();
    loadMatrix();
    loadSnapshots();
    loadTdlOutputs();
  }, []);

  const loadDiscoverySummary = async () => {
    try {
      const res = await fetch('/api/discovery/summary');
      if (res.ok) {
        const data = await res.json();
        setDiscoverySummary(data);
      }
    } catch (err) {
      console.error('Failed to load discovery summary', err);
    }
  };

  const loadCatalog = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (catalogSearch.trim()) queryParams.append('search', catalogSearch.trim());
      if (onlyTdlFilter) queryParams.append('onlyTdl', 'true');
      if (onlyUnmappedFilter) queryParams.append('onlyUnmapped', 'true');

      const res = await fetch(`/api/discovery/catalog?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOutputs(data.outputs || []);
      }
    } catch (err) {
      console.error('Failed to load output catalog', err);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, catalogSearch, onlyTdlFilter, onlyUnmappedFilter]);

  const loadObjects = async () => {
    try {
      const res = await fetch('/api/discovery/objects');
      if (res.ok) {
        const data = await res.json();
        setObjects(data);
      }
    } catch (err) {
      console.error('Failed to load objects', err);
    }
  };

  const loadRelationshipGraph = async () => {
    try {
      const res = await fetch('/api/discovery/relationships/graph');
      if (res.ok) {
        const data = await res.json();
        setRelationshipGraph(data);
      }
    } catch (err) {
      console.error('Failed to load graph', err);
    }
  };

  const loadMatrix = async () => {
    try {
      const res = await fetch('/api/discovery/matrix');
      if (res.ok) {
        const data = await res.json();
        setMatrixRows(data);
      }
    } catch (err) {
      console.error('Failed to load matrix', err);
    }
  };

  const loadSnapshots = async () => {
    try {
      const res = await fetch('/api/discovery/snapshots');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error('Failed to load snapshots', err);
    }
  };

  const loadTdlOutputs = async () => {
    try {
      const res = await fetch('/api/discovery/tdl');
      if (res.ok) {
        const data = await res.json();
        setTdlOutputs(data);
      }
    } catch (err) {
      console.error('Failed to load TDL outputs', err);
    }
  };

  // Run Full Universal Discovery Pipeline
  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    const steps = [
      '1/10 Connecting via Read-Only HTTP Port 9000...',
      '2/10 Identifying Company & Multi-Currency Context...',
      '3/10 Detecting TallyPrime Version & Release Tags...',
      '4/10 Probing XML Schema & OLE/ODBC Capabilities...',
      '5/10 Discovering Active Collections (74 Collections)...',
      '6/10 Discovering Object Types & Hierarchies...',
      '7/10 Extracting Methods, Attributes & Data Types...',
      '8/10 Scanning Custom TDL & UDF Field Definitions (Safe Read-Only)...',
      '9/10 Normalizing & Mapping to Standard Accounting Model...',
      '10/10 Compiling Persistent Output Catalog...'
    ];

    for (const step of steps) {
      setDiscoveryProgressStep(step);
      await new Promise((r) => setTimeout(r, 180));
    }

    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true })
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoverySummary(data.summary);
        await loadCatalog();
        await loadSnapshots();
      }
    } catch (err) {
      console.error('Discovery run failed', err);
    } finally {
      setIsDiscovering(false);
      setDiscoveryProgressStep('');
    }
  };

  // Field Sample Preview
  const handlePreviewFieldSample = async (fieldName: string, objectName: string) => {
    setIsLoadingSample(true);
    setShowSampleModal(true);
    try {
      const res = await fetch(
        `/api/discovery/fields/sample?fieldName=${encodeURIComponent(fieldName)}&objectName=${encodeURIComponent(objectName)}&limit=25`
      );
      if (res.ok) {
        const data = await res.json();
        setSampleResult(data);
      }
    } catch (err) {
      console.error('Sample fetch error', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Schema Diff Execution
  const handleRunSchemaDiff = async () => {
    setIsLoadingDiff(true);
    try {
      const res = await fetch('/api/discovery/snapshots/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotIdA: snapshots[1]?.snapshotId || 'SNAP-2026-0801',
          snapshotIdB: snapshots[0]?.snapshotId || 'SNAP-2026-0907'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDiffResult(data);
      }
    } catch (err) {
      console.error('Diff error', err);
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const selectedObject = objects.find((o) => o.objectId === selectedObjectId) || objects[0];

  const categoriesList: OutputCategory[] = [
    'Accounting',
    'Sales',
    'Purchase',
    'Receivables',
    'Payables',
    'Inventory',
    'GST',
    'Banking',
    'Masters',
    'Transactions',
    'Custom',
    'TDL'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Universal Discovery Top Header Banner */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                100% Read-Only Safety Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-950/80 text-sky-400 border border-sky-800">
                Phase 15 Universal Discovery
              </span>
              {discoverySummary?.isOfflineCache && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800">
                  Cached Discovery
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-2 flex items-center gap-2.5">
              <Compass className="h-6 w-6 text-sky-400" />
              Universal Tally Output Discovery Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live discovery of available reports, collections, objects, fields, and custom TDL extensions across TallyPrime instances without assuming fixed schemas.
            </p>
          </div>

          {/* Action Buttons & Simple/Advanced Mode Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setIsAdvancedMode(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  !isAdvancedMode ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simple Mode
              </button>
              <button
                onClick={() => setIsAdvancedMode(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isAdvancedMode ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Advanced Mode
              </button>
            </div>

            <a
              href="/api/discovery/export-map"
              download
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              Export Discovery Map (.json)
            </a>

            <button
              onClick={handleRunDiscovery}
              disabled={isDiscovering}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
              {isDiscovering ? 'Running Discovery...' : 'Discover Everything Available'}
            </button>
          </div>
        </div>

        {/* Live Discovery Progress Step Display */}
        {isDiscovering && (
          <div className="mt-4 p-3 bg-sky-950/60 border border-sky-800/80 rounded-lg text-xs text-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
                Pipeline Active: {discoveryProgressStep}
              </span>
              <span className="text-[10px] text-sky-300 font-mono">Zero Mutations Guaranteed</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-sky-400 h-full w-4/5 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Discovery Summary Metrics (Section 73 & 74 & 129) */}
        {discoverySummary && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Company Context</span>
              <span className="text-slate-100 font-bold truncate block" title={discoverySummary.companyName}>
                {discoverySummary.companyName}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Discovered Objects</span>
              <span className="text-slate-100 font-bold text-sm">{discoverySummary.objectsDiscovered}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Collections</span>
              <span className="text-slate-100 font-bold text-sm">{discoverySummary.collectionsDiscovered}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Fields</span>
              <span className="text-slate-100 font-bold text-sm">{discoverySummary.fieldsDiscovered.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Custom TDL Outputs</span>
              <span className="text-amber-300 font-bold text-sm">{discoverySummary.customOutputsDiscovered}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Mapped Outputs</span>
              <span className="text-emerald-400 font-bold text-sm">
                {discoverySummary.mappedOutputsCount} <span className="text-[10px] text-slate-400 font-normal">({discoverySummary.mappingCoveragePercentage}%)</span>
              </span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Completeness</span>
              <span className="text-sky-400 font-bold text-sm">{discoverySummary.discoveryCompletenessScore}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          Output Catalog ({outputs.length})
        </button>

        <button
          onClick={() => setActiveTab('objects_graph')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'objects_graph'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Object Catalog & Relationship Graph
        </button>

        <button
          onClick={() => setActiveTab('mapping_studio')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'mapping_studio'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitMerge className="h-3.5 w-3.5" />
          Data Mapping Studio (Source → Semantic → Output)
        </button>

        <button
          onClick={() => setActiveTab('tdl_intelligence')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tdl_intelligence'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="h-3.5 w-3.5 text-amber-400" />
          TDL & Custom Intelligence ({tdlOutputs.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'matrix'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Availability Matrix
        </button>

        <button
          onClick={() => setActiveTab('snapshots_diff')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'snapshots_diff'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Schema Snapshots & Diff
        </button>
      </div>

      {/* TAB 1: OUTPUT CATALOG (Sections 3, 4, 9, 10, 72) */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters & Universal Search Bar */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search outputs, e.g., 'GSTIN', 'Amount', 'Date', 'Party', 'Tax', 'Item', 'Outstanding'..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  checked={onlyTdlFilter}
                  onChange={(e) => setOnlyTdlFilter(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>TDL Only</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  checked={onlyUnmappedFilter}
                  onChange={(e) => setOnlyUnmappedFilter(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Unmapped Only</span>
              </label>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Output Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outputs.map((item) => (
              <div
                key={item.outputId}
                className="bg-[#1E293B] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.source === 'Custom TDL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-sky-400 border border-slate-700'
                      }`}
                    >
                      {item.source}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{item.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Object: <strong className="text-slate-200">{item.objectType}</strong></span>
                    <span>Fields: <strong className="text-slate-200">{item.fieldCount}</strong></span>
                    <span>
                      Mapping:{' '}
                      <strong
                        className={
                          item.mappingStatus === 'High'
                            ? 'text-emerald-400'
                            : item.mappingStatus === 'Medium'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {item.mappingStatus}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreviewFieldSample('AMOUNT', item.objectType)}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 text-center font-medium flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3 text-sky-400" />
                      Preview (25)
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('mapping_studio');
                        setSelectedObjectId(item.objectType === 'Bill' ? 'OBJ-BILL' : 'OBJ-VOUCHER');
                      }}
                      className="py-1.5 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 rounded border border-sky-700/50 font-medium"
                    >
                      Map
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OBJECT CATALOG & RELATIONSHIP GRAPH (Sections 5, 56, 57, 58, 59, 60) */}
      {activeTab === 'objects_graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Object Selector & Details (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Discovered Objects ({objects.length})
              </label>
              <div className="space-y-1.5">
                {objects.map((obj) => (
                  <button
                    key={obj.objectId}
                    onClick={() => setSelectedObjectId(obj.objectId)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      selectedObjectId === obj.objectId
                        ? 'bg-sky-600/20 border-sky-500 text-sky-100 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{obj.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Collection: {obj.collectionName}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                      {obj.fields.length} fields
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Graph & Object Relationships Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Visual Relationship Node Diagram */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-sky-400" />
                  Object Relationships & Safe Join Paths
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Cartesian Risk: Protected
                </span>
              </div>

              {/* Graphical representation of discovered nodes */}
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-600/50 space-y-1 text-center">
                    <span className="text-[10px] text-sky-300 uppercase font-semibold">Center Hub</span>
                    <h4 className="text-sm font-bold text-white">Voucher (Trans)</h4>
                    <p className="text-[10px] text-slate-400">Primary Transactional Record</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Joined Master</span>
                    <h4 className="text-sm font-bold text-slate-200">Party / Ledger</h4>
                    <p className="text-[10px] text-slate-400">Key: PARTYLEDGERNAME</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Joined Master</span>
                    <h4 className="text-sm font-bold text-slate-200">Stock Item</h4>
                    <p className="text-[10px] text-slate-400">Key: STOCKITEMNAME</p>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div>• Voucher ──[1:M]──&gt; Ledger (Join: PARTYLEDGERNAME = Ledger.NAME)</div>
                  <div>• Voucher ──[1:M]──&gt; StockItem (Join: ALLINVENTORYENTRIES.STOCKITEMNAME = StockItem.NAME)</div>
                  <div>• Voucher ──[1:M]──&gt; TaxClassification (Join: LEDGERENTRIES.NAME = TaxClassification.TAXNAME)</div>
                  <div>• Ledger ──[1:M]──&gt; Bill (Join: Ledger.NAME = Bill.PARENTLEDGER)</div>
                </div>
              </div>

              {/* Discovered Fields of Selected Object */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Fields in [{selectedObject?.name}] ({selectedObject?.fields.length})
                </h4>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Field Name</th>
                        <th className="py-2 px-3">Display Name</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Semantic Concept</th>
                        <th className="py-2 px-3 text-right">Sample</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {selectedObject?.fields.map((f) => (
                        <tr key={f.fieldName} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-sky-400">{f.fieldName}</td>
                          <td className="py-2 px-3 text-slate-200 font-sans">{f.displayName}</td>
                          <td className="py-2 px-3 text-slate-400">{f.dataType}</td>
                          <td className="py-2 px-3 text-emerald-400 font-sans">{f.semanticConcept || '-'}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handlePreviewFieldSample(f.fieldName, selectedObject.name)}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px]"
                            >
                              Preview
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA MAPPING STUDIO (SOURCE → SEMANTIC → OUTPUT) (Sections 14, 15, 16, 17, 18) */}
      {activeTab === 'mapping_studio' && (
        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-sky-400" />
                Data Mapping Studio: Source → Semantic Model → Output
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Standardize discovered Tally attributes into canonical business terms for portable multi-company reporting.
              </p>
            </div>
            <span className="px-3 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold text-[11px]">
              Active Profile: Acme Enterprise v2.4
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* 1. SOURCE PANEL */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                1. Tally Source Fields (Discovered)
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {selectedObject?.fields.map((f) => (
                  <div
                    key={f.fieldName}
                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sky-400 font-semibold">{f.fieldName}</span>
                      <span className="text-[10px] text-slate-500">{f.dataType}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{f.displayName}</p>
                    <div className="text-[10px] text-slate-400 font-mono">{f.source}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SEMANTIC PANEL */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                2. Standard Semantic Concepts
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {[
                  { concept: 'Invoice Number', sourceField: 'VOUCHERNUMBER', conf: 'High' },
                  { concept: 'Invoice Date', sourceField: 'DATE', conf: 'High' },
                  { concept: 'Customer / Supplier Name', sourceField: 'PARTYLEDGERNAME', conf: 'High' },
                  { concept: 'Financial Amount', sourceField: 'AMOUNT', conf: 'High' },
                  { concept: 'Customer GSTIN', sourceField: 'PARTYGSTIN', conf: 'High' },
                  { concept: 'Custom Approval Manager', sourceField: 'UDF_DISCOUNT_AUTH', conf: 'Medium' },
                  { concept: 'Compliance Flag', sourceField: 'UDF_EWAY_FLAG', conf: 'Medium' }
                ].map((item) => (
                  <div
                    key={item.concept}
                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{item.concept}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.conf === 'High'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {item.conf}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>Source:</span>
                      <span className="text-sky-300 font-semibold">{item.sourceField}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. OUTPUT PANEL */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                3. Final Report Output Columns
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {[
                  'Tax Invoice Number',
                  'Voucher Date (DD/MM/YYYY)',
                  'Party Entity Name',
                  'Taxable Value & Turnover',
                  'Customer GST Registration',
                  'E-Way Dispatch Status'
                ].map((col, idx) => (
                  <div
                    key={col}
                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                      <span className="text-slate-200 font-medium">{col}</span>
                    </div>
                    <button className="text-[10px] text-sky-400 hover:underline">Configure</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TDL & CUSTOM INTELLIGENCE (Sections 52, 53, 54, 55) */}
      {activeTab === 'tdl_intelligence' && (
        <div className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 text-xs text-amber-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                TDL Safety Guarantee: Verified Read-Only
              </span>
              <p className="text-[11px] text-amber-300/80">
                Custom TDLs and User-Defined Fields (UDFs) are passively discovered through Tally schema reflection. EXFIN never injects code or alters TDL configurations.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-700 font-mono font-bold text-[10px]">
              Zero Code Injection
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tdlOutputs.map((tdl) => (
              <div
                key={tdl.tdlIdentifier}
                className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                    {tdl.exposedType}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{tdl.safetyClassification}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{tdl.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{tdl.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                  Parent: <span className="text-slate-200">{tdl.parentObject}</span> • ID: {tdl.tdlIdentifier}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AVAILABILITY MATRIX (Section 71) */}
      {activeTab === 'matrix' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Universal Output Availability Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive permission and queryability checklist across all discovered Tally structures.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Monitored: {matrixRows.length} Items</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Output / Item Name</th>
                  <th className="py-2 px-3">Classification</th>
                  <th className="py-2 px-3 text-center">Available</th>
                  <th className="py-2 px-3 text-center">Mapped</th>
                  <th className="py-2 px-3 text-center">Queryable</th>
                  <th className="py-2 px-3 text-center">Exportable</th>
                  <th className="py-2 px-3 text-center">Requires Licensing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrixRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-semibold text-slate-100">{row.itemName}</td>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{row.itemType}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-emerald-400 font-bold">✓</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.isMapped ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">Unmapped</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-emerald-400 font-bold">✓</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-emerald-400 font-bold">✓</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.requiresPermission ? (
                        <span className="text-amber-400 text-[10px]">Enterprise</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Standard</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SCHEMA SNAPSHOTS & DIFF (Sections 66, 67, 68, 69, 70) */}
      {activeTab === 'snapshots_diff' && (
        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Schema Snapshots & Diff Analyzer</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Audit schema changes over time to detect added, removed, or modified fields that impact custom reports.
              </p>
            </div>
            <button
              onClick={handleRunSchemaDiff}
              disabled={isLoadingDiff}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <GitBranch className="h-3.5 w-3.5" />
              {isLoadingDiff ? 'Comparing...' : 'Compare Snapshot A vs B'}
            </button>
          </div>

          {/* Diff Result Card */}
          {diffResult && (
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-100 text-sm">
                  Schema Diff: {diffResult.snapshotIdA} ➔ {diffResult.snapshotIdB}
                </span>
                <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-medium">
                  {diffResult.summaryDescription}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-emerald-400 font-bold block">
                    Added Fields ({diffResult.addedFields.length})
                  </span>
                  <ul className="list-disc list-inside text-slate-300 font-mono text-[11px] space-y-0.5">
                    {diffResult.addedFields.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-rose-400 font-bold block">
                    Removed Fields ({diffResult.removedFields.length})
                  </span>
                  {diffResult.removedFields.length === 0 ? (
                    <span className="text-slate-500 italic text-[11px]">No fields removed (Safe)</span>
                  ) : (
                    <ul className="list-disc list-inside text-rose-300 font-mono text-[11px] space-y-0.5">
                      {diffResult.removedFields.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">
                    Impacted Saved Reports ({diffResult.impactedReports.length})
                  </span>
                  <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                    {diffResult.impactedReports.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Snapshots Table */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Snapshot Repository ({snapshots.length} Snapshots)
            </span>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Snapshot ID</th>
                    <th className="py-2 px-3">Captured At</th>
                    <th className="py-2 px-3">Tally Version</th>
                    <th className="py-2 px-3">Objects</th>
                    <th className="py-2 px-3">Fields</th>
                    <th className="py-2 px-3">Signature Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {snapshots.map((s) => (
                    <tr key={s.snapshotId} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-sky-400">{s.snapshotId}</td>
                      <td className="py-2 px-3 text-slate-300 font-sans">{new Date(s.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-400 font-sans">{s.tallyVersion}</td>
                      <td className="py-2 px-3 text-slate-300">{s.totalObjects}</td>
                      <td className="py-2 px-3 text-slate-300">{s.totalFields}</td>
                      <td className="py-2 px-3 text-slate-500">{s.signatureHash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Field Sample Modal (Section 8) */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Field Sample Preview: {sampleResult?.fieldName}
                </h3>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Safe preview of small sample ({sampleResult?.rowCount} rows). Full company datasets are never loaded for field previews.
            </p>

            {isLoadingSample ? (
              <div className="py-12 text-center text-xs text-slate-300 space-y-2">
                <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading field sample...</p>
              </div>
            ) : sampleResult ? (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-800 font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-3 w-12">#</th>
                      <th className="py-1.5 px-3">Record Key</th>
                      <th className="py-1.5 px-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sampleResult.sampleRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 text-slate-500">{r.id}</td>
                        <td className="py-1.5 px-3 text-slate-400">{r.recordKey}</td>
                        <td className="py-1.5 px-3 text-slate-200 font-semibold">{r.formatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
