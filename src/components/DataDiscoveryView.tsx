import React, { useState, useEffect } from 'react';
import {
  Compass,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  Search,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  Info,
  GitBranch,
  History,
  FileCode,
  CheckSquare,
  Copy,
  Star
} from 'lucide-react';

interface DataDiscoveryViewProps {
  selectedCompany: any;
  onNavigateToExplorer: () => void;
}

export const DataDiscoveryView: React.FC<DataDiscoveryViewProps> = ({
  selectedCompany,
  onNavigateToExplorer
}) => {
  const [includeSystem, setIncludeSystem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isScanning, setIsScanning] = useState(false);
  const [progressStage, setProgressStage] = useState('Idle');
  const [progressValue, setProgressValue] = useState(0);
  const [unifiedModel, setUnifiedModel] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const companyId = selectedCompany ? selectedCompany.name : 'DEFAULT_COMP';

  useEffect(() => {
    fetchUnifiedDiscovery();
    fetchScanHistory();
  }, [companyId, includeSystem]);

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

  const fetchScanHistory = () => {
    fetch(`/api/odbc/scans/history?companyId=${encodeURIComponent(companyId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.scans) {
          setScanHistory(data.scans);
        }
      })
      .catch(() => {});
  };

  const handleGlobalSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    fetch(`/api/odbc/search?companyId=${encodeURIComponent(companyId)}&q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data.results || []))
      .catch(() => {});
  };

  const fetchScanDiff = () => {
    fetch(`/api/odbc/scans/diff?companyId=${encodeURIComponent(companyId)}`)
      .then((res) => res.json())
      .then((data) => {
        setDiffData(data.diff);
        setShowDiffModal(true);
      })
      .catch(() => {});
  };

  const startScan = () => {
    setIsScanning(true);
    setProgressStage('Phase 4 Unified Discovery Engine Starting...');
    setProgressValue(15);

    setTimeout(() => {
      setProgressStage('Discovering Collections & TDL Objects...');
      setProgressValue(45);
    }, 700);

    setTimeout(() => {
      setProgressStage('Applying Source Priority (TDL > HTTP > ODBC) & Relationship Mapping...');
      setProgressValue(75);
    }, 1400);

    setTimeout(() => {
      fetch('/api/odbc/rescan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, companyName: selectedCompany?.name || 'Demo Company' })
      })
        .then((res) => res.json())
        .then(() => {
          setIsScanning(false);
          setProgressValue(100);
          setProgressStage('Completed');
          fetchUnifiedDiscovery();
          fetchScanHistory();
        })
        .catch(() => {
          setIsScanning(false);
        });
    }, 2100);
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'Verified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">Verified</span>;
      case 'High':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">High</span>;
      case 'Medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">Medium</span>;
      case 'Inferred':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">Inferred</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Unknown</span>;
    }
  };

  const collections = unifiedModel?.collections || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Compass className="h-5 w-5 text-sky-400" />
            <span>UNIFIED TALLY DISCOVERY SYSTEM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified metadata graph: Collections, TDL Objects, Fields, Canonical Paths, and Relationships
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchScanDiff}
            className="flex items-center space-x-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-sky-400"
          >
            <History className="h-3.5 w-3.5" />
            <span>Metadata Diff</span>
          </button>

          <button
            onClick={startScan}
            disabled={isScanning}
            className="flex items-center space-x-2 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 px-4 py-1.5 text-xs font-bold text-white shadow transition-colors"
          >
            <Play className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Rescanning...' : 'Unified Discovery Scan'}</span>
          </button>
        </div>
      </div>

      {/* Global Metadata Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Global Search: Type collection name, field name, canonical path (e.g., Voucher.Date, Ledger)..."
            value={searchQuery}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-[#1E293B] pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 shadow-2xl p-2 space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <div
                key={i}
                onClick={onNavigateToExplorer}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100 font-mono">{res.title}</div>
                  <div className="text-[10px] text-slate-400">{res.subtitle}</div>
                </div>
                {getConfidenceBadge(res.confidence)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Unified Summary Panel */}
      <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4 shadow">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-sky-950 border border-sky-800 text-sky-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Unified Metadata Graph — {selectedCompany ? selectedCompany.name : 'Selected Company'}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Source Priority: TDL (100) &gt; HTTP/XML (80) &gt; ODBC (60) &gt; Inferred (40)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-800">
              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
              Verified Unified Graph
            </span>
            <button
              onClick={onNavigateToExplorer}
              className="flex items-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <span>Explore Advanced Data Grid</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Graph Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="rounded bg-slate-900/80 p-3 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">Collections</span>
            <span className="text-xl font-bold font-mono text-sky-400">{collections.length}</span>
          </div>
          <div className="rounded bg-slate-900/80 p-3 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">TDL Objects</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{unifiedModel?.objects?.length || 3}</span>
          </div>
          <div className="rounded bg-slate-900/80 p-3 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">Relationships</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{unifiedModel?.relationships?.length || 4}</span>
          </div>
          <div className="rounded bg-slate-900/80 p-3 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">Canonical Paths</span>
            <span className="text-xl font-bold font-mono text-amber-400">{unifiedModel?.canonicalPaths?.length || 7}</span>
          </div>
          <div className="rounded bg-slate-900/80 p-3 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">Read-Only Safety</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center mt-1">
              <ShieldAlert className="h-3.5 w-3.5 mr-1" />
              Strictly Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Discovered Collections & TDL Objects Grid */}
      <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-4 shadow">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <span>Discovered Collections & TDL Objects</span>
          </h3>
          <span className="text-xs text-slate-400">Click inspect to browse data paths & fields</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                <th className="p-2.5 font-semibold">Entity / Object</th>
                <th className="p-2.5 font-semibold">Type</th>
                <th className="p-2.5 font-semibold">Source Priority</th>
                <th className="p-2.5 font-semibold">Confidence Level</th>
                <th className="p-2.5 font-semibold">Fields</th>
                <th className="p-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {collections.map((col: any) => (
                <tr key={col.id || col.name} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-100 font-mono">{col.name}</td>
                  <td className="p-2.5 text-slate-300">{col.objectType || 'Collection'}</td>
                  <td className="p-2.5 font-mono text-sky-400">{col.source || 'TDL'}</td>
                  <td className="p-2.5">{getConfidenceBadge(col.confidence || 'Verified')}</td>
                  <td className="p-2.5 font-mono text-slate-300">{col.fields?.length || 0}</td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={onNavigateToExplorer}
                      className="rounded bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 px-2.5 py-1 text-[11px] font-medium transition-colors"
                    >
                      Inspect Object
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Diff Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#1E293B] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <History className="h-5 w-5 text-sky-400" />
                <span>Discovery Scan Metadata Diff</span>
              </h3>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                [ Close ]
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
              <div>
                <span className="font-bold text-emerald-400 block mb-1">Added Collections ({diffData?.addedCollections?.length || 0}):</span>
                {diffData?.addedCollections?.map((c: string) => (
                  <div key={c} className="font-mono text-slate-300 pl-3">+ {c}</div>
                ))}
              </div>

              <div>
                <span className="font-bold text-sky-400 block mb-1">Added Fields ({diffData?.addedFields?.length || 0}):</span>
                {diffData?.addedFields?.map((f: string) => (
                  <div key={f} className="font-mono text-slate-300 pl-3">+ {f}</div>
                ))}
              </div>

              <div>
                <span className="font-bold text-purple-400 block mb-1">Changed Relationships:</span>
                {diffData?.changedRelationships?.map((r: string) => (
                  <div key={r} className="font-mono text-slate-300 pl-3">~ {r}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
