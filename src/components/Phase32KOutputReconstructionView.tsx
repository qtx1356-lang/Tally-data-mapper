import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Layers,
  GitCompare,
  ShieldAlert,
  ArrowRight,
  History,
  Sliders,
  Database,
  RefreshCw,
  Eye,
  PlusCircle,
  Check,
  X,
  Building2,
  HelpCircle,
  Cpu,
  BarChart3,
  Award
} from 'lucide-react';
import {
  OutputSemanticDefinition,
  ReconstructionDefinition,
  EquivalenceTestResult,
  ReconstructionCatalogEntry,
  HumanReviewOverride,
  ImpactAnalysisResult,
  SemanticRole,
  ReportGrain
} from '../types/phase32KReconstruction';

export function Phase32KOutputReconstructionView() {
  const [catalog, setCatalog] = useState<ReconstructionCatalogEntry[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string>('OUT-VCH-REG');
  const [activeSemantics, setActiveSemantics] = useState<OutputSemanticDefinition | null>(null);
  const [activeReconstruction, setActiveReconstruction] = useState<ReconstructionDefinition | null>(null);
  const [activeEquivalence, setActiveEquivalence] = useState<EquivalenceTestResult | null>(null);
  const [activeOverrides, setActiveOverrides] = useState<HumanReviewOverride[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysisResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Override Form Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideField, setOverrideField] = useState<string>('');
  const [overrideRole, setOverrideRole] = useState<SemanticRole>('Amount');
  const [overrideGrain, setOverrideGrain] = useState<ReportGrain>('Voucher');
  const [overrideType, setOverrideType] = useState<'FIELD_ROLE' | 'GRAIN' | 'MARK_UNAVAILABLE'>('FIELD_ROLE');
  const [overrideReason, setOverrideReason] = useState('');

  // Impact Modal State
  const [showImpactModal, setShowImpactModal] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (selectedOutputId) {
      loadOutputDetails(selectedOutputId);
    }
  }, [selectedOutputId]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/phase32k/catalog');
      const data = await res.json();
      if (data.success) {
        setCatalog(data.catalog);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOutputDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/phase32k/output/${id}`);
      const data = await res.json();
      if (data.success) {
        setActiveSemantics(data.semantics);
        setActiveReconstruction(data.reconstruction);
        setActiveEquivalence(data.equivalence);
        setActiveOverrides(data.overrides || []);
      }
    } catch (err) {
      console.error('Failed to load output details', err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const res = await fetch(`/api/phase32k/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.results.length > 0) {
        setSelectedOutputId(data.results[0].outputId);
      }
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const handleReconstructAgain = async () => {
    if (!selectedOutputId) return;
    try {
      const res = await fetch(`/api/phase32k/output/${selectedOutputId}/reconstruct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: 'CMP-001' })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSemantics(data.semantics);
        setActiveReconstruction(data.reconstruction);
        setActionMessage('Reconstructed output definition successfully updated.');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Reconstruct error', err);
    }
  };

  const handleRunEquivalence = async () => {
    if (!selectedOutputId) return;
    try {
      const res = await fetch(`/api/phase32k/output/${selectedOutputId}/equivalence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceData: [
            { voucherNumber: 'VCH-101', date: '2026-04-01', debitAmount: 5000, creditAmount: 0, partyName: 'Acme Traders' },
            { voucherNumber: 'VCH-102', date: '2026-04-02', debitAmount: 0, creditAmount: 5000, partyName: 'Acme Traders' }
          ],
          reconstructedData: [
            { voucherNumber: 'VCH-101', date: '2026-04-01', debitAmount: 5000, creditAmount: 0, partyName: 'Acme Traders' },
            { voucherNumber: 'VCH-102', date: '2026-04-02', debitAmount: 5000, creditAmount: 0.01, partyName: 'Acme Traders' }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveEquivalence(data.testResult);
        setActionMessage('Equivalence evaluation test re-run completed.');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Equivalence test error', err);
    }
  };

  const handleOpenImpact = async () => {
    if (!selectedOutputId) return;
    try {
      const res = await fetch(`/api/phase32k/output/${selectedOutputId}/impact`);
      const data = await res.json();
      if (data.success) {
        setImpactAnalysis(data.impact);
        setShowImpactModal(true);
      }
    } catch (err) {
      console.error('Impact analysis error', err);
    }
  };

  const handleApplyOverride = async () => {
    if (!selectedOutputId || !overrideReason) return;
    try {
      const res = await fetch(`/api/phase32k/output/${selectedOutputId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overrideType,
          fieldName: overrideType === 'FIELD_ROLE' ? overrideField : undefined,
          newValue: overrideType === 'FIELD_ROLE' ? overrideRole : overrideGrain,
          user: 'Lead Controller',
          reason: overrideReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowOverrideModal(false);
        setOverrideReason('');
        loadOutputDetails(selectedOutputId);
        loadCatalog();
        setActionMessage('Human override successfully applied and versioned.');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Override submit error', err);
    }
  };

  const handleCreateTemplate = async () => {
    if (!selectedOutputId) return;
    try {
      const res = await fetch(`/api/phase32k/output/${selectedOutputId}/create-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Template created: ${data.templateId}`);
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('Create template error', err);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'HIGH_CONFIDENCE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Sparkles className="w-3 h-3" /> High Confidence</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3" /> Partial</span>;
      case 'LOW_CONFIDENCE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><HelpCircle className="w-3 h-3" /> Low Confidence</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="w-3 h-3" /> Unavailable</span>;
    }
  };

  const getEquivalenceBadge = (level?: string) => {
    switch (level) {
      case 'EXACT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white"><Award className="w-3 h-3" /> EXACT</span>;
      case 'FUNCTIONALLY_EQUIVALENT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white"><Check className="w-3 h-3" /> FUNCTIONALLY EQUIVALENT</span>;
      case 'PARTIALLY_EQUIVALENT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-600 text-white"><AlertTriangle className="w-3 h-3" /> PARTIALLY EQUIVALENT</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white"><X className="w-3 h-3" /> NOT EQUIVALENT</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full border border-indigo-400/30 font-semibold uppercase tracking-wider">
                Phase 32K
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full border border-emerald-400/30 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Read-Only Tally Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Output Reconstruction & Equivalence Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Semantic interpretation of discovered Tally reports with automated dataset requirement discovery, grain detection, controlled calculation discovery, and equivalence testing against EXFIN canonical models.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCatalog}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Catalog
            </button>
            <button
              onClick={handleCreateTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" /> Create Report Template
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-slate-800 text-center">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 font-medium">Total Outputs</div>
              <div className="text-xl font-bold text-white mt-1">{metrics.totalOutputs}</div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-emerald-400 font-medium">Confirmed</div>
              <div className="text-xl font-bold text-emerald-300 mt-1">{metrics.confirmed}</div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-blue-400 font-medium">High Confidence</div>
              <div className="text-xl font-bold text-blue-300 mt-1">{metrics.highConfidence}</div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-amber-400 font-medium">Partial</div>
              <div className="text-xl font-bold text-amber-300 mt-1">{metrics.partial}</div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-purple-400 font-medium">Exact Equivalent</div>
              <div className="text-xl font-bold text-purple-300 mt-1">{metrics.equivalenceBreakdown.exact}</div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-indigo-400 font-medium">Functional Eq.</div>
              <div className="text-xl font-bold text-indigo-300 mt-1">{metrics.equivalenceBreakdown.functionallyEquivalent}</div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-xs text-rose-400 font-medium">Unavailable</div>
              <div className="text-xl font-bold text-rose-300 mt-1">{metrics.unavailable}</div>
            </div>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Discovered Outputs Selector & Semantic Search */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" /> Discovered Tally Outputs
              </h2>
              <span className="text-xs text-slate-500 font-medium">{catalog.length} available</span>
            </div>

            {/* Semantic Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder='Search outputs (e.g. "ledger statement")'
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-800 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Catalog Items List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {catalog.map((item) => (
                <div
                  key={item.outputId}
                  onClick={() => setSelectedOutputId(item.outputId)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedOutputId === item.outputId
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{item.outputName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">ID: {item.outputId} • {item.category}</div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-700">Confidence: {item.confidence}%</span>
                    <span>Version v{item.version}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: TALLY OUTPUT MAPPING - Side-by-Side Comparison */}
        <div className="lg:col-span-8 space-y-6">
          {activeSemantics && activeReconstruction ? (
            <>
              {/* Output Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{activeSemantics.outputName}</h2>
                      {getStatusBadge(activeReconstruction.status)}
                      {activeEquivalence && getEquivalenceBadge(activeEquivalence.equivalenceLevel)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Category: <strong className="text-slate-700">{activeSemantics.category}</strong></span>
                      <span>Purpose: <strong className="text-slate-700">{activeSemantics.purpose}</strong></span>
                      <span>Grain: <strong className="text-slate-700">{activeReconstruction.grain}</strong></span>
                      <span>Version: <strong className="text-slate-700">v{activeReconstruction.version}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReconstructAgain}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze
                    </button>
                    <button
                      onClick={handleRunEquivalence}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center gap-1.5"
                    >
                      <GitCompare className="w-3.5 h-3.5" /> Test Equivalence
                    </button>
                    <button
                      onClick={() => setShowOverrideModal(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Human Override
                    </button>
                  </div>
                </div>

                {/* Evidence & Confidence Banner */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Semantic Evidence & Reconstruction Trail:
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
                    {activeSemantics.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                {activeReconstruction.missingComponents && activeReconstruction.missingComponents.length > 0 && (
                  <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Missing Components (PARTIAL Reconstruction):
                    </div>
                    <ul className="list-disc list-inside text-amber-700 space-y-0.5 pl-1">
                      {activeReconstruction.missingComponents.map((mc, idx) => (
                        <li key={idx}>{mc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Discovered Tally Output Structure */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" /> Discovered Tally Structure
                    </h3>
                    <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">Source Spec</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">Fields ({activeSemantics.requiredFields.length})</div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {activeSemantics.requiredFields.map((field) => (
                        <div key={field.fieldName} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-900">{field.fieldName}</div>
                            <div className="text-[11px] text-slate-500">Type: {field.dataType}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-semibold">
                            {field.semanticRole}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeSemantics.calculations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-700">Discovered Calculations</div>
                      {activeSemantics.calculations.map((c) => (
                        <div key={c.calculationId} className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs">
                          <div className="font-medium text-indigo-950">{c.name}</div>
                          <div className="text-[11px] text-indigo-800 font-mono mt-0.5">{c.expression}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: EXFIN Reconstruction */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600" /> EXFIN Reconstruction
                    </h3>
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">Canonical Model</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">Mapped Canonical Fields</div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {activeReconstruction.fields.map((field) => (
                        <div key={field.fieldName} className="p-2.5 bg-indigo-50/30 rounded-lg border border-indigo-100 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-indigo-950">{field.canonicalFieldMapping || field.fieldName}</div>
                            <div className="text-[11px] text-slate-500">Role: {field.semanticRole} ({field.confidence})</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeReconstruction.relationships.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-700">Semantic Relationships</div>
                      {activeReconstruction.relationships.map((r) => (
                        <div key={r.relationshipId} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <span className="font-medium text-slate-800">{r.sourceObject} → {r.targetObject}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">{r.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Equivalence Test Results Panel */}
              {activeEquivalence && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-base">Equivalence Evaluation Test</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Overall Score:</span>
                      <span className="text-lg font-extrabold text-indigo-600">{activeEquivalence.overallScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Field Match</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{activeEquivalence.fieldMatchScore}%</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Grain Match</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{activeEquivalence.grainMatchScore}%</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Filter Match</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{activeEquivalence.filterMatchScore}%</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Calc Match</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{activeEquivalence.calculationMatchScore}%</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Rel Match</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{activeEquivalence.relationshipMatchScore}%</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Value Match</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{activeEquivalence.valueMatchScore}%</div>
                    </div>
                  </div>

                  {/* Differences Classification Table */}
                  {activeEquivalence.differences.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-700">Differences Classification ({activeEquivalence.differences.length})</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Field / Item</th>
                              <th className="p-2.5">Classification</th>
                              <th className="p-2.5">Tally Value</th>
                              <th className="p-2.5">EXFIN Value</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeEquivalence.differences.map((diff, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-medium text-slate-900">{diff.fieldOrItem}</td>
                                <td className="p-2.5 font-semibold text-slate-700">{diff.classification}</td>
                                <td className="p-2.5 text-slate-600 font-mono text-[11px]">{String(diff.tallyValue)}</td>
                                <td className="p-2.5 text-slate-600 font-mono text-[11px]">{String(diff.exfinValue)}</td>
                                <td className="p-2.5">
                                  {diff.tolerated ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Tolerated</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Critical</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero differences detected! Reconstruction matches Tally reference output perfectly.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Version History & Overrides */}
              {activeOverrides.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" /> Human Overrides & Mapping History
                  </h3>
                  <div className="space-y-2">
                    {activeOverrides.map((ov) => (
                      <div key={ov.overrideId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>{ov.overrideType} {ov.fieldName ? `(${ov.fieldName})` : ''}</span>
                          <span className="text-[11px] text-slate-500">{new Date(ov.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-600">
                          Changed: <span className="font-mono">{String(ov.previousValue)}</span> → <strong className="text-indigo-600 font-mono">{String(ov.newValue)}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 italic">User: {ov.user} • Reason: "{ov.reason}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-slate-400 mx-auto animate-spin" />
              <div className="text-slate-600 font-medium text-sm">Loading output semantics and reconstruction details...</div>
            </div>
          )}
        </div>
      </div>

      {/* Human Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" /> Apply Human Mapping Override
              </h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Override Target</label>
                <select
                  value={overrideType}
                  onChange={(e: any) => setOverrideType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                >
                  <option value="FIELD_ROLE">Field Semantic Role</option>
                  <option value="GRAIN">Report Record Grain</option>
                  <option value="MARK_UNAVAILABLE">Mark Output Unavailable</option>
                </select>
              </div>

              {overrideType === 'FIELD_ROLE' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Field</label>
                    <select
                      value={overrideField}
                      onChange={(e) => setOverrideField(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                    >
                      <option value="">Select Field...</option>
                      {activeSemantics?.requiredFields.map((f) => (
                        <option key={f.fieldName} value={f.fieldName}>{f.fieldName} ({f.semanticRole})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Semantic Role</label>
                    <select
                      value={overrideRole}
                      onChange={(e: any) => setOverrideRole(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                    >
                      {['Amount', 'Debit', 'Credit', 'Balance', 'Date', 'Party', 'Ledger', 'Stock', 'Quantity', 'Rate', 'Tax', 'Voucher', 'Identifier', 'Name', 'Other'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {overrideType === 'GRAIN' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Report Grain</label>
                  <select
                    value={overrideGrain}
                    onChange={(e: any) => setOverrideGrain(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                  >
                    {['Voucher', 'Voucher Line', 'Ledger', 'Stock Item', 'Inventory Movement', 'Party', 'Group', 'Company'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Reason (Required)</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this mapping is being overridden..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={handleOpenImpact}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition"
              >
                Check Impact First
              </button>
              <button
                onClick={handleApplyOverride}
                disabled={!overrideReason}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition"
              >
                Submit & Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impact Analysis Warning Modal */}
      {showImpactModal && impactAnalysis && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Mapping Impact Analysis Warning
              </h3>
              <button onClick={() => setShowImpactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-800">
                {impactAnalysis.warnings[0]}
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-slate-900">Affected Downstream Artifacts:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-800">Reports:</span> {impactAnalysis.affectedReports.length}
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-800">Queries:</span> {impactAnalysis.affectedQueries.length}
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-800">Templates:</span> {impactAnalysis.affectedTemplates.length}
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-800">Dashboards:</span> {impactAnalysis.affectedDashboards.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowImpactModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Acknowledge Impact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
