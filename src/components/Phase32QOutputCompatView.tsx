import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Cpu,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle,
  HelpCircle,
  Layers,
  Database,
  GitMerge,
  GitPullRequest,
  Check,
  FileDown,
  FileUp,
  X,
  Compass,
  Code,
  ListFilter,
  BarChart4,
  Activity
} from 'lucide-react';
import {
  TallyOutputDefinition,
  CollectionInventoryItem,
  CustomTDLDefinition,
  OutputDependencyGraph,
  XMLAnalysisResult,
  UnknownOutputRecord,
  OutputStatus,
  MappingConfidence
} from '../types/phase32QOutputCompat';

export function Phase32QOutputCompatView() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'mapping' | 'discovery' | 'xml' | 'recovery' | 'lab'>('mapping');

  // Core State
  const [company, setCompany] = useState('EXFIN Corp');
  const [outputs, setOutputs] = useState<TallyOutputDefinition[]>([]);
  const [inventory, setInventory] = useState<CollectionInventoryItem[]>([]);
  const [tdlCatalog, setTdlCatalog] = useState<CustomTDLDefinition[]>([]);
  const [unknownRecords, setUnknownRecords] = useState<UnknownOutputRecord[]>([]);
  
  // Loading & Action feedback states
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'quick' | 'full' | 'targeted'>('quick');
  const [scanOutput, setScanOutput] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Details Modal & Mapping Editor
  const [selectedOutput, setSelectedOutput] = useState<TallyOutputDefinition | null>(null);
  const [editingMapping, setEditingMapping] = useState<boolean>(false);
  const [editStatus, setEditStatus] = useState<OutputStatus>('MAPPED');
  const [editConfidence, setEditConfidence] = useState<MappingConfidence>('HIGH');
  const [editApproval, setEditApproval] = useState<'Draft' | 'Reviewed' | 'Approved' | 'Rejected'>('Approved');
  const [editFormula, setEditFormula] = useState('');
  const [impactData, setImpactData] = useState<{
    affectedReports: string[];
    affectedDashboards: string[];
    affectedKPIs: string[];
    affectedAutomations: string[];
  } | null>(null);

  // XML Analyzer state
  const [xmlPayloadA, setXmlPayloadA] = useState(`<ENVELOPE>
  <HEADER>
    <VERSION>4.2</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
      <VOUCHER>
        <Date>2026-09-01</Date>
        <VoucherNumber>S-1093</VoucherNumber>
        <VoucherTypeName>Sales</VoucherTypeName>
        <PartyName>Acme Retail Ltd</PartyName>
        <Amount>145000</Amount>
        <CustomApprovalCode>APP-884</CustomApprovalCode>
      </VOUCHER>
    </DATA>
  </BODY>
</ENVELOPE>`);
  const [xmlPayloadB, setXmlPayloadB] = useState(`<ENVELOPE>
  <HEADER>
    <VERSION>5.0</VERSION>
  </HEADER>
  <BODY>
    <DATA>
      <VOUCHER>
        <Date>2026-09-01</Date>
        <VoucherNumber>S-1093</VoucherNumber>
        <VoucherTypeName>Sales</VoucherTypeName>
        <PartyName>Acme Retail Ltd</PartyName>
        <Amount>145000</Amount>
        <CustomApprovalCode>APP-884</CustomApprovalCode>
        <GSTPercentage>18</GSTPercentage>
      </VOUCHER>
    </DATA>
  </BODY>
</ENVELOPE>`);
  const [xmlAnalysis, setXmlAnalysis] = useState<XMLAnalysisResult | null>(null);
  const [xmlDiffResult, setXmlDiffResult] = useState<{
    identical: boolean;
    schemaDifferences: string[];
    uniqueTagsA: number;
    uniqueTagsB: number;
  } | null>(null);

  // Validation lab state
  const [testOutputId, setTestOutputId] = useState('out_profit_loss');
  const [reconciliationTolerance, setReconciliationTolerance] = useState('0.01');
  const [testResult, setTestResult] = useState<any>(null);
  const [labSuiteResults, setLabSuiteResults] = useState<any>(null);
  const [testingSuite, setTestingSuite] = useState(false);

  // Unknown recovery assistant state
  const [recoveryName, setRecoveryName] = useState('');
  const [recoveryEvidence, setRecoveryEvidence] = useState('');
  const [recoveryContext, setRecoveryContext] = useState('');
  const [recoveryFields, setRecoveryFields] = useState('');
  const [recoveryDeps, setRecoveryDeps] = useState('');

  // Fetch initial definitions
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/phase32q/outputs?company=${encodeURIComponent(company)}`);
      const data = await res.json();
      if (data.outputs) {
        setOutputs(data.outputs);
      }

      const resRecs = await fetch('/api/phase32q/unknown-records');
      const dataRecs = await resRecs.json();
      if (dataRecs.records) {
        setUnknownRecords(dataRecs.records);
      }
    } catch (e) {
      console.error("Failed to load outputs compatibility map", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  // Handle Full Scan Discovery
  const handleStartDiscovery = async () => {
    setIsScanning(true);
    setScanOutput('Starting output scan...\nActive Rate Control safe throttle applied (avoiding overloading Tally).\n');
    try {
      const res = await fetch('/api/phase32q/discovery/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, mode: scanMode })
      });
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory);
        setTdlCatalog(data.tdlCatalog);
        setScanOutput(prev => prev + `Scan complete in ${data.durationMs}ms.\nDetected Tally Server: ${data.tallyVersion}\nSuccessfully verified ${data.inventory.length} active collections.\nDiscovered ${data.discoveredOutputsCount} output structures.\nCustom TDL definitions cataloged.`);
      }
    } catch (e) {
      setScanOutput(prev => prev + `\nError during scan: ${String(e)}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Safe XML Analyze
  const handleAnalyzeXML = async () => {
    try {
      const res = await fetch('/api/phase32q/xml-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent: xmlPayloadA })
      });
      const data = await res.json();
      setXmlAnalysis(data);
    } catch (e) {
      alert("Analysis failed: " + String(e));
    }
  };

  // XML Diff
  const handleCompareXML = async () => {
    try {
      const res = await fetch('/api/phase32q/xml-analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlA: xmlPayloadA, xmlB: xmlPayloadB })
      });
      const data = await res.json();
      setXmlDiffResult(data);
    } catch (e) {
      alert("Comparison failed: " + String(e));
    }
  };

  // Open output details and load impact data
  const handleSelectOutput = async (out: TallyOutputDefinition) => {
    setSelectedOutput(out);
    setEditStatus(out.status);
    setEditConfidence(out.confidence);
    setEditFormula(out.formula || '');
    setEditingMapping(false);

    try {
      const res = await fetch(`/api/phase32q/impact?outputId=${out.outputId}`);
      const data = await res.json();
      setImpactData(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Save updated mapping metadata
  const handleSaveMapping = async () => {
    if (!selectedOutput) return;
    try {
      const res = await fetch('/api/phase32q/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          outputId: selectedOutput.outputId,
          overrides: {
            status: editStatus,
            confidence: editConfidence,
            formula: editFormula
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingMapping(false);
        setSelectedOutput(data.updatedDefinition);
        // Refresh mapping list
        loadData();
      }
    } catch (e) {
      alert("Failed to save mapping: " + String(e));
    }
  };

  // Run Test Reconciliation
  const handleRunReconciliation = async () => {
    try {
      const res = await fetch('/api/phase32q/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          outputId: testOutputId,
          tolerance: parseFloat(reconciliationTolerance) || 0.01
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      alert("Reconciliation test failed: " + String(e));
    }
  };

  // Run Diagnostic Test Suite
  const handleRunSuite = async () => {
    setTestingSuite(true);
    try {
      const res = await fetch('/api/phase32q/test-lab/run-all', {
        method: 'POST'
      });
      const data = await res.json();
      setLabSuiteResults(data);
    } catch (e) {
      alert("Suite runner failed: " + String(e));
    } finally {
      setTestingSuite(false);
    }
  };

  // Unknown output recovery handler
  const handleAddUnknownOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryName) return;

    try {
      const res = await fetch('/api/phase32q/unknown-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recoveryName,
          evidenceText: recoveryEvidence,
          sourceContext: recoveryContext,
          missingFields: recoveryFields.split(',').map(s => s.trim()).filter(Boolean),
          possibleDependencies: recoveryDeps.split(',').map(s => s.trim()).filter(Boolean),
          suggestedInvestigation: 'Scan custom godowns & voucher parameters'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRecoveryName('');
        setRecoveryEvidence('');
        setRecoveryContext('');
        setRecoveryFields('');
        setRecoveryDeps('');
        // Reload unknown records
        const resRecs = await fetch('/api/phase32q/unknown-records');
        const dataRecs = await resRecs.json();
        if (dataRecs.records) {
          setUnknownRecords(dataRecs.records);
        }
      }
    } catch (err) {
      alert(err);
    }
  };

  // Export output catalog definition schema
  const handleExportCatalog = () => {
    window.open(`/api/phase32q/catalog/export?company=${encodeURIComponent(company)}`, '_blank');
  };

  // Calculate high level metrics
  const totalOutputs = outputs.length;
  const fullySupported = outputs.filter(o => o.status === 'MAPPED' || o.status === 'RECONSTRUCTABLE').length;
  const partiallySupported = outputs.filter(o => o.status === 'PARTIALLY_RECONSTRUCTABLE').length;
  const unsupportedCount = outputs.filter(o => o.status === 'UNSUPPORTED' || o.status === 'BLOCKED').length;
  const unknownCount = unknownRecords.length;

  const coverageScore = totalOutputs > 0 ? Math.round((fullySupported / totalOutputs) * 100) : 0;

  // Filter outputs
  const filteredOutputs = outputs.filter(item => {
    const matchesSearch = item.outputName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceCollection.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-900 font-sans" id="phase32q-main-layout">
      {/* Header section with Company Scope */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-6 gap-4" id="view-header">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
            Phase 32Q Active
          </span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1.5">
            Universal Tally Output Discovery & Compatibility
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Discover, inventory, equivalence match, and safely reconstruct arbitrary TallyPrime outputs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto" id="scope-selector-container">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Company Context:</label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
            id="company-scope-selector"
          >
            <option value="EXFIN Corp">EXFIN Corp</option>
            <option value="Tally Demo Ltd">Tally Demo Ltd</option>
            <option value="Acme Enterprise">Acme Enterprise</option>
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg shadow transition"
            id="refresh-compatibility-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6" id="kpi-overview-cards">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm" id="card-coverage-score">
          <div className="text-xs text-slate-500 font-medium uppercase">Catalog Coverage</div>
          <div className="text-2xl font-bold text-slate-800 mt-1 flex items-baseline gap-1.5">
            {coverageScore}%
            <span className="text-xs font-normal text-indigo-600">reconstructable</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${coverageScore}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm" id="card-fully-supported">
          <div className="text-xs text-slate-500 font-medium uppercase">Fully Supported</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {fullySupported} <span className="text-xs text-slate-400 font-normal">/ {totalOutputs} reports</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Ready to execute seamlessly</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm" id="card-partially-supported">
          <div className="text-xs text-slate-500 font-medium uppercase">Partially Supported</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {partiallySupported} <span className="text-xs text-slate-400 font-normal">outputs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Missing secondary ledger attributes</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm" id="card-unsupported">
          <div className="text-xs text-slate-500 font-medium uppercase">Unsupported/Blocked</div>
          <div className="text-2xl font-bold text-rose-500 mt-1">
            {unsupportedCount} <span className="text-xs text-slate-400 font-normal">outputs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Missing core structural collections</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm" id="card-unknown-unmapped">
          <div className="text-xs text-slate-500 font-medium uppercase">Unknown Outputs</div>
          <div className="text-2xl font-bold text-slate-700 mt-1 flex items-center gap-2">
            {unknownCount}
            {unknownCount > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Review</span>}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Awaiting layout recovery assist</div>
        </div>
      </div>

      {/* Subnavigation Bar */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-lg p-1 shadow-sm" id="tab-navigation">
        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${activeTab === 'mapping' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          id="tab-mapping-btn"
        >
          <Layers className="h-4 w-4" />
          Output Mapping Center
        </button>
        <button
          onClick={() => setActiveTab('discovery')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${activeTab === 'discovery' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          id="tab-discovery-btn"
        >
          <Compass className="h-4 w-4" />
          Discover Tally Outputs
        </button>
        <button
          onClick={() => setActiveTab('xml')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${activeTab === 'xml' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          id="tab-xml-btn"
        >
          <Code className="h-4 w-4" />
          XML Safe Analyzer
        </button>
        <button
          onClick={() => setActiveTab('recovery')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${activeTab === 'recovery' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          id="tab-recovery-btn"
        >
          <GitMerge className="h-4 w-4" />
          Recovery Assistant
        </button>
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${activeTab === 'lab' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          id="tab-lab-btn"
        >
          <Activity className="h-4 w-4" />
          Validation Lab
        </button>
      </div>

      {/* MAIN VIEW CONTENTS */}

      {/* TAB 1: OUTPUT MAPPING CENTER */}
      {activeTab === 'mapping' && (
        <div className="space-y-6" id="mapping-center-tab">
          {/* Filters and search line */}
          <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="mapping-filters">
            <div className="flex flex-1 gap-3 items-center" id="search-container">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Tally reports, fields, collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  id="search-input"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ListFilter className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                id="category-filter"
              >
                <option value="All">All Categories</option>
                <option value="Accounting">Accounting</option>
                <option value="Analysis">Analysis</option>
                <option value="Receivables">Receivables</option>
                <option value="Payables">Payables</option>
                <option value="Inventory">Inventory</option>
                <option value="Sales">Sales</option>
                <option value="Tax">Tax</option>
                <option value="Payroll">Payroll</option>
              </select>
            </div>

            <div className="flex items-center gap-2" id="catalog-actions">
              <button
                onClick={handleExportCatalog}
                className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-lg transition"
                id="export-catalog-btn"
              >
                <FileDown className="h-3.5 w-3.5 text-slate-500" />
                Export Verified Catalog
              </button>
            </div>
          </div>

          {/* Outputs Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="outputs-table-container">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Output Compatibility Matrix</h3>
              <span className="text-xs text-slate-500">{filteredOutputs.length} item(s) found</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" id="outputs-matrix-table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 font-bold text-slate-600">
                    <th className="p-3">Tally Output</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Source Collection</th>
                    <th className="p-3">Equivalence Status</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Required Fields</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOutputs.map(out => (
                    <tr key={out.outputId} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{out.displayName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{out.description}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{out.category}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-indigo-600">{out.sourceCollection}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          out.status === 'MAPPED' || out.status === 'RECONSTRUCTABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          out.status === 'PARTIALLY_RECONSTRUCTABLE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {out.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1 font-semibold text-[10px] ${
                          out.confidence === 'HIGH' ? 'text-emerald-600' :
                          out.confidence === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            out.confidence === 'HIGH' ? 'bg-emerald-600' :
                            out.confidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {out.confidence}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {out.requiredFields.slice(0, 3).map(f => (
                            <span key={f} className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] border border-slate-100">{f}</span>
                          ))}
                          {out.requiredFields.length > 3 && (
                            <span className="text-[10px] text-slate-400">+{out.requiredFields.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSelectOutput(out)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded text-[11px] transition"
                        >
                          Configure Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & Editor Drawer/Panel (opens when output is selected) */}
          {selectedOutput && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-lg space-y-5 animate-fade-in" id="output-details-drawer">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    Mapping Details: {selectedOutput.displayName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedOutput.outputId} | Category: {selectedOutput.category}</p>
                </div>
                <button
                  onClick={() => setSelectedOutput(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Section */}
                <div className="space-y-4 col-span-2">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Functional Description</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{selectedOutput.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Required Source Fields</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedOutput.requiredFields.map(f => (
                          <span key={f} className="bg-white text-slate-700 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected Query Parameters</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedOutput.parameters.map(p => (
                          <span key={p} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-2 py-0.5 text-xs">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lineage Proof / Discovery Evidence</h4>
                    <ul className="space-y-1">
                      {selectedOutput.evidence.map((ev, index) => (
                        <li key={index} className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact analysis visualizer */}
                  {impactData && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-indigo-50 bg-opacity-30">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-indigo-600" />
                        Impact Analysis (Prior Dependencies)
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Modifying this output schema overrides will potentially influence the following registered features:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-slate-700">Affected Reports:</span>
                          <ul className="list-disc pl-4 text-slate-600 text-[11px] mt-0.5">
                            {impactData.affectedReports.map(r => <li key={r}>{r}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Affected Dashboard Widgets:</span>
                          <ul className="list-disc pl-4 text-slate-600 text-[11px] mt-0.5">
                            {impactData.affectedDashboards.map(d => <li key={d}>{d}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editor Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
                      Mapping Configuration Editor
                    </h4>

                    {editingMapping ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Equivalence Status Override:</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as OutputStatus)}
                            className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs"
                          >
                            <option value="MAPPED">MAPPED (Validated)</option>
                            <option value="RECONSTRUCTABLE">RECONSTRUCTABLE (Calculated)</option>
                            <option value="PARTIALLY_RECONSTRUCTABLE">PARTIALLY_RECONSTRUCTABLE</option>
                            <option value="UNSUPPORTED">UNSUPPORTED</option>
                            <option value="BLOCKED">BLOCKED</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Mapping Confidence:</label>
                          <select
                            value={editConfidence}
                            onChange={(e) => setEditConfidence(e.target.value as MappingConfidence)}
                            className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs"
                          >
                            <option value="HIGH">HIGH (Strong match)</option>
                            <option value="MEDIUM">MEDIUM (Slight name difference)</option>
                            <option value="LOW">LOW (No direct XML tags)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Formula (if Derived):</label>
                          <input
                            type="text"
                            value={editFormula}
                            onChange={(e) => setEditFormula(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs font-mono"
                            placeholder="e.g. SUM(GrossSales) - SUM(Returns)"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Approval Workflow State:</label>
                          <select
                            value={editApproval}
                            onChange={(e) => setEditApproval(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs font-semibold text-indigo-700"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block">Equivalence Status:</span>
                          <span className="font-bold text-slate-700 mt-0.5 block">{selectedOutput.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Confidence Rating:</span>
                          <span className="font-bold text-indigo-600 mt-0.5 block">{selectedOutput.confidence}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Calculated Formula:</span>
                          <span className="font-mono text-slate-700 mt-0.5 block bg-slate-100 p-1.5 rounded border border-slate-200">
                            {selectedOutput.formula || 'Direct mapped relationship'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Workflow Approval Status:</span>
                          <span className="inline-flex items-center gap-1.5 mt-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                            <Check className="h-3 w-3" /> Approved
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 flex gap-2">
                    {editingMapping ? (
                      <>
                        <button
                          onClick={handleSaveMapping}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg shadow"
                        >
                          Save Override Mapping
                        </button>
                        <button
                          onClick={() => setEditingMapping(false)}
                          className="border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingMapping(true)}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-lg shadow"
                      >
                        Modify Output Metadata
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OUTPUT DISCOVERY HUB */}
      {activeTab === 'discovery' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="discovery-hub-tab">
          {/* Controls column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="discovery-controls">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-600" />
              Scanning Engine Control Center
            </h3>
            <p className="text-xs text-slate-400">
              Trigger a remote scan request to discover what schema variables, custom TDL modules, and report formats are currently accessible.
            </p>

            <div className="space-y-3" id="scan-mode-selector">
              <label className="block text-xs font-semibold text-slate-600">Scan Intensity Mode:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setScanMode('quick')}
                  className={`p-2.5 text-xs font-bold rounded-lg border text-center transition ${scanMode === 'quick' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Quick Scan
                </button>
                <button
                  onClick={() => setScanMode('full')}
                  className={`p-2.5 text-xs font-bold rounded-lg border text-center transition ${scanMode === 'full' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Full Scan
                </button>
                <button
                  onClick={() => setScanMode('targeted')}
                  className={`p-2.5 text-xs font-bold rounded-lg border text-center transition ${scanMode === 'targeted' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Targeted Scan
                </button>
              </div>
            </div>

            {scanMode === 'targeted' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Object/Collection:</label>
                <input
                  type="text"
                  value={scanOutput}
                  onChange={(e) => setScanOutput(e.target.value)}
                  placeholder="e.g. out_profit_loss or StockItem"
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs font-mono"
                />
              </div>
            )}

            <button
              onClick={handleStartDiscovery}
              disabled={isScanning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              id="trigger-discovery-btn"
            >
              <Cpu className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Verifying Tally Ports...' : 'Discover Active Outputs'}
            </button>

            {/* Simulated terminal response stream */}
            <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-[10px] space-y-1 h-44 overflow-y-auto">
              <span className="text-indigo-400 font-bold block">// Terminal Logs:</span>
              <pre className="whitespace-pre-wrap">{scanOutput || 'Engine ready. Click button above to initiate output discovery.'}</pre>
            </div>
          </div>

          {/* Discovery Inventory results */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-5" id="discovery-results">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Database className="h-4 w-4 text-indigo-600" />
              Discovered Collections Inventory & Field Dictionary
            </h3>

            {inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Compass className="h-12 w-12 text-slate-300 stroke-1 mb-2 animate-bounce" />
                <p className="text-xs font-medium">No scan completed yet</p>
                <p className="text-[11px] text-slate-400">Run a scan to pull real-time database schemas and field variables.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {inventory.map(item => (
                  <div key={item.collectionName} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs font-mono">{item.collectionName}</span>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-[10px]">{item.objectType}</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">Record Count: <strong className="text-slate-700">{item.recordCount}</strong></span>
                    </div>

                    <div className="p-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Fields Dictionary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.fields.map(f => (
                          <div key={f.name} className="bg-white border border-slate-100 p-2 rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <div className="font-semibold text-slate-700 flex items-center gap-1">
                                {f.name}
                                {f.origin === 'CUSTOM' && (
                                  <span className="bg-amber-100 text-amber-700 px-1 text-[9px] rounded font-bold uppercase">Custom</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{f.semanticRole || 'General attribute'}</div>
                            </div>
                            <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Custom TDL catalog */}
                {tdlCatalog.length > 0 && (
                  <div className="border border-indigo-100 rounded-xl bg-indigo-50 bg-opacity-35 p-4">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      Discovered Company-Specific Custom TDL Definitions
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      The following custom reporting specifications have been discovered within the active company's internal metadata tables. These schemas are mapped as overrides but never executed natively to maintain security.
                    </p>
                    <div className="space-y-3">
                      {tdlCatalog.map(tdl => (
                        <div key={tdl.tdlId} className="bg-white border border-indigo-100 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
                          <div>
                            <div className="font-bold text-indigo-950">{tdl.reportName}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Target: <code className="text-indigo-600 font-mono font-bold">{tdl.collectionName}</code> | Source: {tdl.definitionSource}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold text-[10px] block">
                              {tdl.fieldName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: XML SAFE ANALYZER */}
      {activeTab === 'xml' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="xml-analyzer-tab">
          {/* Analysis module */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="xml-analysis-panel">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-indigo-600" />
              Tally XML Payload Structural Analyzer
            </h3>
            <p className="text-xs text-slate-400">
              Paste arbitrary Tally XML response bodies below. The engine safely parses tags, identifies collections, and extracts schema variables without executing any embedded code block.
            </p>

            <textarea
              value={xmlPayloadA}
              onChange={(e) => setXmlPayloadA(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg w-full h-80 p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste XML sample here..."
            />

            <button
              onClick={handleAnalyzeXML}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition"
              id="analyze-xml-btn"
            >
              Analyze XML Layout Structure
            </button>

            {xmlAnalysis && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 text-xs">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Analysis Outcomes</h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Identified Structure Type:</span>
                    <span className="font-bold text-indigo-700 block mt-0.5">{xmlAnalysis.xmlStructureType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Identified collections:</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{xmlAnalysis.detectedCollections.join(', ') || 'None'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Discovered Fields & Estimated Grains:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {xmlAnalysis.detectedFields.map(df => (
                      <span key={df.name} className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono">
                        {df.name} ({df.estimatedType})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Observed Tag Quantities:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(xmlAnalysis.tagsCount).slice(0, 6).map(([tag, count]) => (
                      <div key={tag} className="bg-white border border-slate-100 p-1.5 rounded flex justify-between font-mono text-[10px]">
                        <span className="text-slate-600">&lt;{tag}&gt;</span>
                        <span className="font-bold text-slate-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* XML Compare (Drift detection) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="xml-compare-panel">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <GitPullRequest className="h-4 w-4 text-indigo-600" />
              Tally Version & Layout Drift Detector
            </h3>
            <p className="text-xs text-slate-400">
              Paste a second XML sample to compare structural differences (ideal for tracking field deletions or new tags introduced by Tally upgrades).
            </p>

            <textarea
              value={xmlPayloadB}
              onChange={(e) => setXmlPayloadB(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg w-full h-80 p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste second XML sample to compare..."
            />

            <button
              onClick={handleCompareXML}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition"
              id="compare-xml-btn"
            >
              Analyze Schema Drift Between Inputs
            </button>

            {xmlDiffResult && (
              <div className="border border-slate-200 rounded-xl p-4 bg-indigo-50 bg-opacity-35 space-y-3 text-xs">
                <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[10px]">Drift Comparison Outcomes</h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Layout Identical:</span>
                    <span className={`font-bold block mt-0.5 ${xmlDiffResult.identical ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {xmlDiffResult.identical ? 'Yes (No schema drift)' : 'No (Drift Detected)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Tag Counts:</span>
                    <span className="font-bold text-slate-800 block mt-0.5">Input A: {xmlDiffResult.uniqueTagsA} | Input B: {xmlDiffResult.uniqueTagsB}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Detected Variations / Warning Markers:</span>
                  {xmlDiffResult.schemaDifferences.length === 0 ? (
                    <div className="text-xs text-emerald-700 font-semibold">Perfect layout alignment. Mappings remain 100% reproducible.</div>
                  ) : (
                    <ul className="space-y-1">
                      {xmlDiffResult.schemaDifferences.map((dif, idx) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1">
                          <span className="text-rose-500 font-bold">•</span> {dif}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RECOVERY ASSISTANT */}
      {activeTab === 'recovery' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="recovery-assistant-tab">
          {/* Recovery Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="recovery-form-panel">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <GitMerge className="h-4 w-4 text-indigo-600" />
              Register Unknown Output Record
            </h3>
            <p className="text-xs text-slate-400">
              When a custom Tally output is discovered but cannot be automatically mapped, create a recovery target. This starts a guided analysis flow without automatic unsafe assumptions.
            </p>

            <form onSubmit={handleAddUnknownOutput} className="space-y-4" id="unknown-output-form">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Output Name:</label>
                <input
                  type="text"
                  required
                  value={recoveryName}
                  onChange={(e) => setRecoveryName(e.target.value)}
                  placeholder="e.g. Godown Transfer Manifest"
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">XML Discovery Evidence Text:</label>
                <textarea
                  value={recoveryEvidence}
                  onChange={(e) => setRecoveryEvidence(e.target.value)}
                  placeholder="Paste found tags, e.g. <GODOWNTRANSFER> node with dynamic warehouse IDs"
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Missing Grains/Fields (comma-separated):</label>
                <input
                  type="text"
                  value={recoveryFields}
                  onChange={(e) => setRecoveryFields(e.target.value)}
                  placeholder="TransferQty, TargetBinNumber, AuthSignature"
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Possible Dependency Collections:</label>
                <input
                  type="text"
                  value={recoveryDeps}
                  onChange={(e) => setRecoveryDeps(e.target.value)}
                  placeholder="Godown, StockItem"
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-lg shadow-sm transition"
              >
                Register Unknown Output target
              </button>
            </form>
          </div>

          {/* Unknown Records list */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4" id="unknown-records-list">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Active Unmapped Recovery Log
            </h3>
            <p className="text-xs text-slate-400">
              The following outputs require manual matching mapping variables before they can be marked AVAILABLE or RECONSTRUCTABLE.
            </p>

            {unknownRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                All discovered outputs are 100% matched and resolved.
              </div>
            ) : (
              <div className="space-y-4">
                {unknownRecords.map(rec => (
                  <div key={rec.recordId} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:border-indigo-200 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Unmapped Target</span>
                          {rec.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">ID: {rec.recordId} | Detected: {new Date(rec.detectedAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch(`/api/phase32q/unknown-records/${rec.recordId}`, { method: 'DELETE' });
                          // reload
                          const res = await fetch('/api/phase32q/unknown-records');
                          const data = await res.json();
                          setUnknownRecords(data.records || []);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Remove Target
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs border-t border-slate-200 pt-3">
                      <div>
                        <span className="text-slate-400 block">XML Evidence:</span>
                        <span className="font-mono text-[11px] text-slate-600 bg-white border border-slate-100 px-1.5 py-1 rounded block mt-0.5">
                          {rec.evidenceText}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Missing Fields:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.missingFields.map(f => (
                            <span key={f} className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-rose-100">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded p-2.5 text-[11px] text-indigo-900">
                      <strong className="block font-bold">Guided Investigation Advice:</strong>
                      {rec.suggestedInvestigation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: VALIDATION LAB */}
      {activeTab === 'lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="validation-lab-tab">
          {/* Controls column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="lab-controls">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-indigo-600" />
              Reconstruction Test Runner
            </h3>
            <p className="text-xs text-slate-400">
              Run verification comparisons between the EXFIN reconstructed report output and the actual source Tally representation.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Output to Verify:</label>
                <select
                  value={testOutputId}
                  onChange={(e) => setTestOutputId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs"
                >
                  {outputs.map(o => (
                    <option key={o.outputId} value={o.outputId}>{o.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rounding/Currency Tolerance:</label>
                <input
                  type="text"
                  value={reconciliationTolerance}
                  onChange={(e) => setReconciliationTolerance(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg w-full p-2 text-xs font-mono"
                  placeholder="e.g. 0.01"
                />
              </div>

              <button
                onClick={handleRunReconciliation}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg shadow-sm transition"
                id="run-single-verification-btn"
              >
                Verify Output Mappings
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase">Automated Diagnostic Suite</h4>
              <p className="text-[11px] text-slate-400">
                Executes the comprehensive Phase 32Q test suite checking Standard Outputs, XML parser, permission safety, and prior phase regressions.
              </p>
              <button
                onClick={handleRunSuite}
                disabled={testingSuite}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                id="run-full-suite-btn"
              >
                {testingSuite ? 'Executing Tests...' : 'Run Diagnostics Test Suite'}
              </button>
            </div>
          </div>

          {/* Test Outcomes column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-6" id="lab-test-outcomes">
            {/* Single validation runner outcome */}
            {testResult && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Validation Results: {outputs.find(o => o.outputId === testResult.outputId)?.displayName}
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Status:</span>
                    <span className={`font-bold block mt-0.5 ${testResult.matched ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {testResult.reconciliationStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Differences Found:</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{testResult.differencesCount} rows</span>
                  </div>
                </div>

                {testResult.differencesCount > 0 ? (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 block">Discovered Rounding / Drift Variances:</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse bg-white border border-slate-150">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-150">
                            <th className="p-2">Row / Entity</th>
                            <th className="p-2">Observed Tally</th>
                            <th className="p-2">EXFIN Calculated</th>
                            <th className="p-2 text-right">Difference %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.differences.map((diff: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100">
                              <td className="p-2 font-semibold text-slate-700">{diff.rowId}</td>
                              <td className="p-2 font-mono">{diff.expected.toFixed(2)}</td>
                              <td className="p-2 font-mono">{diff.actual.toFixed(2)}</td>
                              <td className="p-2 text-right text-rose-600 font-mono">{(diff.diffPct * 100).toFixed(4)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    Reconstructed totals reconcile perfectly with the observed Tally Prime report values. No rounding or float drift detected.
                  </div>
                )}
              </div>
            )}

            {/* Complete Test suite outcome list */}
            {labSuiteResults && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Diagnostic Suite Outcomes</span>
                    <h3 className="text-sm font-bold mt-0.5">Overall Status: {labSuiteResults.overallStatus}</h3>
                  </div>
                  <span className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs">
                    {labSuiteResults.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {labSuiteResults.results.map((test: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white hover:shadow-sm transition flex justify-between items-start gap-4">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{test.testName}</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Evidence: {test.evidence}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        test.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback empty view */}
            {!testResult && !labSuiteResults && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Activity className="h-12 w-12 text-slate-300 stroke-1 mb-2" />
                <p className="text-xs font-medium">Validation runner pending</p>
                <p className="text-[11px] text-slate-400">Select a diagnostic mode on the left and run verification check.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
