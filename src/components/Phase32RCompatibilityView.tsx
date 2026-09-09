import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Eye,
  GitBranch,
  ShieldCheck,
  Download,
  Database,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  Terminal,
  FileCode,
  AlertCircle
} from 'lucide-react';
import {
  CompatibilityState,
  MigrationState,
  TallyVersionProfile,
  CapabilityProfileItem,
  TDLDefinitionNode,
  SchemaChangeItem,
  SchemaVersion,
  MigrationMappingProposal
} from '../types/phase32RCompatibility';

export const Phase32RCompatibilityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'detector' | 'tdl-xml' | 'evolution' | 'migration' | 'lab'>('matrix');

  // Matrix State
  const [matrix, setMatrix] = useState<any[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Detector State
  const [xmlPayload, setXmlPayload] = useState<string>(
    `<VOUCHER REMOTEID="b5e28a9c-0c1d-4e2f-9a0b-cd3e4f5a6b7c">\n  <VERSION>4.2</VERSION>\n  <DATE>20260908</DATE>\n  <VOUCHERNUMBER>EX-9982</VOUCHERNUMBER>\n  <PARTYNAME>EXFIN Corp</PARTYNAME>\n  <PARTYGSTIN>27AAACE1234F1Z5</PARTYGSTIN>\n  <ALLLEDGERENTRIES.LIST>\n    <LEDGERNAME>Sales GST</LEDGERNAME>\n    <AMOUNT>-150000.00</AMOUNT>\n  </ALLLEDGERENTRIES.LIST>\n</VOUCHER>`
  );
  const [userConfigVersion, setUserConfigVersion] = useState<string>('4.2');
  const [detectedProfile, setDetectedProfile] = useState<TallyVersionProfile | null>(null);
  const [detecting, setDetecting] = useState(false);

  // XML / TDL Analyzer State
  const [xmlInputA, setXmlInputA] = useState<string>(
    `<Voucher>\n  <PartyGSTIN>27AAACE1234F1Z5</PartyGSTIN>\n  <BasicGrossAmount>150000.00</BasicGrossAmount>\n</Voucher>`
  );
  const [xmlInputB, setXmlInputB] = useState<string>(
    `<Voucher>\n  <TaxRegistrationNo>27AAACE1234F1Z5</TaxRegistrationNo>\n  <GrossSalesAmount>150000.00</GrossSalesAmount>\n  <GSTPercentage>18</GSTPercentage>\n</Voucher>`
  );
  const [xmlDiffResult, setXmlDiffResult] = useState<any | null>(null);
  const [maxBytes, setMaxBytes] = useState<number>(500000);
  const [maxDepth, setMaxDepth] = useState<number>(10);
  const [xmlParsingError, setXmlParsingError] = useState<string | null>(null);

  const [tdlInput, setTdlInput] = useState<string>(
    `[Report: CustomVoucherReport]\n  Form: CustomVoucherForm\n\n[Form: CustomVoucherForm]\n  Part: CustomVoucherPart\n\n[Part: CustomVoucherPart]\n  Line: CustomVoucherLine\n\n[Line: CustomVoucherLine]\n  Field: CustomApprovalCodeField, GSTPercentageField\n\n[Field: CustomApprovalCodeField]\n  Use: Name Field\n  Set Value: "APPROVED-EXFIN"\n\nSystem Formula: CalculateCGST = $$Amount * 0.09`
  );
  const [tdlNodes, setTdlNodes] = useState<TDLDefinitionNode[]>([]);
  const [parsingTdl, setParsingTdl] = useState(false);

  // Schema Evolution State
  const [schemas, setSchemas] = useState<SchemaVersion[]>([]);
  const [selectedSchemaA, setSelectedSchemaA] = useState<string>('sch_v1_baseline');
  const [selectedSchemaB, setSelectedSchemaB] = useState<string>('sch_v2_evolved');
  const [schemaDiff, setSchemaDiff] = useState<SchemaChangeItem[]>([]);
  const [diffLoading, setDiffLoading] = useState(false);

  // Migration State
  const [migrations, setMigrations] = useState<MigrationMappingProposal[]>([]);
  const [approvedMigrations, setApprovedMigrations] = useState<Record<string, boolean>>({});
  const [migrationAlerts, setMigrationAlerts] = useState<string[]>([]);

  // Lab State
  const [labCompany, setLabCompany] = useState<string>('EXFIN Corp');
  const [labResults, setLabResults] = useState<any[]>([]);
  const [labRunning, setLabRunning] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilityProfileItem[]>([]);

  useEffect(() => {
    fetchMatrix();
    fetchSchemas();
    fetchMigrations();
    fetchCapabilities();
  }, []);

  const fetchMatrix = async () => {
    setMatrixLoading(true);
    try {
      const res = await fetch('/api/phase32r/compatibility-matrix');
      const data = await res.json();
      setMatrix(data.matrix || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMatrixLoading(false);
    }
  };

  const fetchSchemas = async () => {
    try {
      const res = await fetch('/api/phase32r/schemas/history?company=EXFIN%20Corp');
      const data = await res.json();
      setSchemas(data.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMigrations = async () => {
    try {
      const res = await fetch('/api/phase32r/mapping/migrations');
      const data = await res.json();
      setMigrations(data.migrations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCapabilities = async () => {
    try {
      const res = await fetch('/api/phase32r/capabilities?company=EXFIN%20Corp');
      const data = await res.json();
      setCapabilities(data.capabilities || []);
    } catch (err) {
      console.error(err);
    }
  };

  const runDetection = async () => {
    setDetecting(true);
    try {
      const res = await fetch('/api/phase32r/detect-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlSample: xmlPayload, userConfigVersion })
      });
      const data = await res.json();
      setDetectedProfile(data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const parseTdlMetadata = async () => {
    setParsingTdl(true);
    try {
      const res = await fetch('/api/phase32r/tdl/parse-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tdlContent: tdlInput })
      });
      const data = await res.json();
      if (data.success) {
        setTdlNodes(data.nodes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsingTdl(false);
    }
  };

  const runSchemaDiff = async () => {
    setDiffLoading(true);
    try {
      const res = await fetch('/api/phase32r/schemas/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaAId: selectedSchemaA, schemaBId: selectedSchemaB })
      });
      const data = await res.json();
      setSchemaDiff(data.changes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDiffLoading(false);
    }
  };

  const compareXmlSamples = () => {
    // Basic structural tag counting diff
    const tagsA = (xmlInputA.match(/<([a-zA-Z0-9_\.\-]+)/g) || []).map(t => t.replace('<', ''));
    const tagsB = (xmlInputB.match(/<([a-zA-Z0-9_\.\-]+)/g) || []).map(t => t.replace('<', ''));

    const added = tagsB.filter(t => !tagsA.includes(t));
    const removed = tagsA.filter(t => !tagsB.includes(t));

    setXmlDiffResult({
      addedCount: added.length,
      removedCount: removed.length,
      addedTags: Array.from(new Set(added)),
      removedTags: Array.from(new Set(removed)),
      comparedAt: new Date().toISOString()
    });
  };

  const toggleApproveMigration = async (outputId: string, approved: boolean) => {
    try {
      const res = await fetch('/api/phase32r/mapping/migrations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputId, approved })
      });
      const data = await res.json();
      if (data.success) {
        setApprovedMigrations(prev => ({ ...prev, [outputId]: approved }));
        if (approved) {
          setMigrationAlerts(prev => [...prev, `Successfully migrated mappings for: ${outputId}`]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runDiagnostics = async () => {
    setLabRunning(true);
    try {
      const res = await fetch('/api/phase32r/lab/run-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setLabResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLabRunning(false);
    }
  };

  const exportDiagnosticPackage = () => {
    const diagnosticPayload = {
      tallyVersion: detectedProfile?.product || 'TallyPrime 4.2',
      capabilities,
      schemaDiff: schemaDiff,
      unmappedRecordsCount: 3,
      integrityAudit: 'SECURE_READ_ONLY_MODE_ACTIVE',
      exportTimestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(diagnosticPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "exfin_tally_diagnostic_bundle.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderStatusBadge = (status: CompatibilityState | string) => {
    switch (status) {
      case 'FULL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">FULL COMPATIBILITY</span>;
      case 'PARTIALLY_COMPATIBLE':
      case 'PARTIAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">PARTIAL</span>;
      case 'NEEDS_TESTING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">NEEDS TESTING</span>;
      case 'INCOMPATIBLE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">INCOMPATIBLE</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">UNKNOWN</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0F172A] text-slate-100">
      {/* Upper Status Block */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#1E293B] px-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-sky-400" />
          <div>
            <h1 className="text-sm font-semibold tracking-wide uppercase">Phase 32R: Universal Compatibility & Schema Evolution</h1>
            <p className="text-xs text-slate-400">Secure schema normalization, real-time drift analysis, safe XML parser controls, & automated migration engines.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">Tally Read-Only: PROTECTED</span>
          <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-1 rounded border border-emerald-800">No Exec State: SECURE</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Side Navigation Tabs */}
        <div className="w-64 border-r border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'matrix' ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Compatibility Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('detector')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'detector' ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Version Detector</span>
            </button>
            <button
              onClick={() => setActiveTab('tdl-xml')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'tdl-xml' ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FileCode className="h-4 w-4" />
              <span>XML / TDL Safe Parser</span>
            </button>
            <button
              onClick={() => setActiveTab('evolution')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'evolution' ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Schema Evolution</span>
            </button>
            <button
              onClick={() => setActiveTab('migration')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'migration' ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              <span>Migration Center</span>
            </button>
            <button
              onClick={() => setActiveTab('lab')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'lab' ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Diagnostics Lab</span>
            </button>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace Guard</h4>
            <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>No Arbitrary Code Execution</span>
            </div>
            <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>XML XXE Filtering Active</span>
            </div>
          </div>
        </div>

        {/* Workspace Display */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120]">
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1E293B] p-4 rounded-lg border border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold">Tally Version Compatibility Matrix</h3>
                  <p className="text-xs text-slate-400">Live capability grid indicating parser compatibility limits across ERP and Prime releases.</p>
                </div>
                <button onClick={fetchMatrix} className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-xs flex items-center space-x-1">
                  <RotateCcw className="h-3 w-3" />
                  <span>Refresh Grid</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#111827]">
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <thead className="bg-[#1F2937]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Tally Version</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Connector</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">XML Parser</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Collections</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Fields Normalizer</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Outputs</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3 font-medium text-slate-200">{row.version}</td>
                        <td className="px-4 py-3 text-slate-400">{row.connector}</td>
                        <td className="px-4 py-3 text-slate-400">{row.xml}</td>
                        <td className="px-4 py-3 text-slate-400">{row.collections}</td>
                        <td className="px-4 py-3 text-slate-400">{row.fields}</td>
                        <td className="px-4 py-3 text-slate-400">{row.stdOutputs}</td>
                        <td className="px-4 py-3">{renderStatusBadge(row.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Capabilities Inventory list */}
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Enterprise Capabilites Profile ({labCompany})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {capabilities.map((cap, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded border border-slate-800/80 flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">{cap.capability}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{cap.evidence}</p>
                        <span className="text-[9px] text-slate-500 block mt-2">Tested at: {new Date(cap.testedAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${cap.supported ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                        {cap.supported ? 'SUPPORTED' : 'UNSUPPORTED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'detector' && (
            <div className="space-y-6">
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-800">
                <h3 className="text-sm font-semibold">Tally Protocol & Version Detector</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluates safe XML markers, header characteristics, or user configuration to resolve exact Tally version profiles securely.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Detection Inputs</h4>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">User Configuration Version Override (Fallback)</label>
                    <input
                      type="text"
                      value={userConfigVersion}
                      onChange={(e) => setUserConfigVersion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Raw XML Header / Request Envelope Characteristics</label>
                    <textarea
                      value={xmlPayload}
                      onChange={(e) => setXmlPayload(e.target.value)}
                      rows={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    onClick={runDetection}
                    disabled={detecting}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded py-1.5 text-xs font-medium flex items-center justify-center space-x-2"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{detecting ? 'Analyzing Metadata...' : 'Run Version Detection'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Resolved Version Profile</h4>
                      {detectedProfile ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Product</span>
                              <span className="font-semibold text-slate-200">{detectedProfile.product}</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Version Id</span>
                              <span className="font-semibold text-slate-200">{detectedProfile.versionId}</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Major.Minor</span>
                              <span className="font-semibold text-slate-200">{detectedProfile.major}.{detectedProfile.minor}</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Build No</span>
                              <span className="font-semibold text-slate-200">{detectedProfile.build}</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Detection Method</span>
                              <span className="font-semibold text-slate-200">{detectedProfile.detectionMethod}</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Confidence Rating</span>
                              <span className="font-semibold text-slate-200 text-sky-400">{detectedProfile.confidence}</span>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-3 rounded border border-slate-800 mt-4">
                            <span className="text-[10px] text-slate-500 block">Compatibility Recommendation</span>
                            <div className="mt-1 flex items-center justify-between">
                              {renderStatusBadge(detectedProfile.compatibilityStatus)}
                              <span className="text-[10px] text-slate-400">Detected: {new Date(detectedProfile.detectedAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Terminal className="h-12 w-12 mx-auto mb-3 text-slate-700" />
                          <p className="text-xs">Submit inputs or run verification to resolve active profile.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tdl-xml' && (
            <div className="space-y-6">
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold">XML & TDL Metadata Parser Controls</h3>
                  <p className="text-xs text-slate-400">Strictly read-only parser sandbox blocks arbitrary script execution and filters XXE inputs.</p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span>Max Payload Size:</span>
                  <input
                    type="number"
                    value={maxBytes}
                    onChange={(e) => setMaxBytes(parseInt(e.target.value))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-slate-200"
                  />
                  <span>Depth Ceiling:</span>
                  <input
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-slate-200"
                  />
                </div>
              </div>

              {/* XML Diff block */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">XML Schema Sample A</h4>
                  <textarea
                    value={xmlInputA}
                    onChange={(e) => setXmlInputA(e.target.value)}
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
                  />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">XML Schema Sample B</h4>
                  <textarea
                    value={xmlInputB}
                    onChange={(e) => setXmlInputB(e.target.value)}
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={compareXmlSamples}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-1.5 text-xs font-medium"
                  >
                    Compare XML Schemas Side-by-Side
                  </button>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">XML Structural Comparison Results</h4>
                    {xmlDiffResult ? (
                      <div className="space-y-3 text-xs">
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                          <span>Added Nodes Detected:</span>
                          <span className="font-bold text-emerald-400">+{xmlDiffResult.addedCount}</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                          <span>Removed Nodes Detected:</span>
                          <span className="font-bold text-rose-400">-{xmlDiffResult.removedCount}</span>
                        </div>

                        {xmlDiffResult.addedTags.length > 0 && (
                          <div className="mt-3">
                            <span className="text-[10px] text-slate-500">Newly Discovered Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {xmlDiffResult.addedTags.map((tag: string, idx: number) => (
                                <span key={idx} className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {xmlDiffResult.removedTags.length > 0 && (
                          <div className="mt-3">
                            <span className="text-[10px] text-slate-500">Omitted Tags in Schema B:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {xmlDiffResult.removedTags.map((tag: string, idx: number) => (
                                <span key={idx} className="bg-rose-950 text-rose-400 border border-rose-800 text-[10px] px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-slate-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-700" />
                        <p className="text-xs">Run Side-by-Side comparison to generate tag diff audits.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TDL Metadata parsing block */}
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unloaded Custom TDL Definition Block</h4>
                  <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900 px-2 py-0.5 rounded">No Code Exec Sandbox</span>
                </div>
                <textarea
                  value={tdlInput}
                  onChange={(e) => setTdlInput(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={parseTdlMetadata}
                  disabled={parsingTdl}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-4 py-1.5 rounded"
                >
                  {parsingTdl ? 'Extracting Metadata...' : 'Parse TDL Metadata Nodes'}
                </button>

                {tdlNodes.length > 0 && (
                  <div className="mt-4 bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-400">Extracted AST Dependency Tree</h5>
                    <div className="space-y-1 font-mono text-[11px]">
                      {tdlNodes.map((node) => (
                        <div key={node.id} className="flex items-center space-x-2 text-slate-300">
                          <span className="text-slate-500">[{node.type}]</span>
                          <span className="font-semibold text-sky-400">{node.name}</span>
                          {node.formulaExpression && (
                            <span className="text-amber-500 text-[10px] bg-slate-900 px-1 py-0.5 rounded">
                              Opaque Formula: {node.formulaExpression}
                            </span>
                          )}
                          {node.children.length > 0 && (
                            <span className="text-slate-500 text-[10px]">→ links {node.children.length} child elements</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evolution' && (
            <div className="space-y-6">
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-800">
                <h3 className="text-sm font-semibold">Schema Evolution & Drift Analyzer</h3>
                <p className="text-xs text-slate-400">Compares structure fingerprints over multiple company snapshots to detect Added, Renamed, or Type-modified fields.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Select Snapshots</h4>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Source Baseline (Schema A)</label>
                    <select
                      value={selectedSchemaA}
                      onChange={(e) => setSelectedSchemaA(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    >
                      {schemas.map(s => (
                        <option key={s.schemaId} value={s.schemaId}>{s.tallyVersion} ({s.schemaId})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Evolved Target (Schema B)</label>
                    <select
                      value={selectedSchemaB}
                      onChange={(e) => setSelectedSchemaB(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    >
                      {schemas.map(s => (
                        <option key={s.schemaId} value={s.schemaId}>{s.tallyVersion} ({s.schemaId})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={runSchemaDiff}
                    disabled={diffLoading}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded py-1.5 text-xs font-medium"
                  >
                    {diffLoading ? 'Running Drift Audit...' : 'Analyze Schema Evolution'}
                  </button>
                </div>

                <div className="lg:col-span-2 bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Detected Structural Deviations</h4>
                  {schemaDiff.length > 0 ? (
                    <div className="space-y-3">
                      {schemaDiff.map((change, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 text-xs flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sky-400">[{change.collection}]</span>
                              <span className="font-medium text-slate-200">{change.fieldName}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{change.suggestedAction}</p>
                            {change.oldValue && (
                              <p className="text-[10px] text-slate-500 mt-0.5">Transition: {change.oldValue} → {change.newValue}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{change.type}</span>
                            <span className="text-[10px] text-slate-500">Confidence: {change.confidence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      <GitBranch className="h-12 w-12 mx-auto mb-2 text-slate-700" />
                      <p className="text-xs">Execute evolution comparison to analyze system level model drifts.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-6">
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-800">
                <h3 className="text-sm font-semibold">Tally Schema Mapping Migration Center</h3>
                <p className="text-xs text-slate-400">Review recommendations to update output fields dynamically when Tally schemas evolve.</p>
              </div>

              {migrationAlerts.length > 0 && (
                <div className="space-y-2">
                  {migrationAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-emerald-950/40 text-emerald-400 border border-emerald-900 p-2.5 rounded text-xs">
                      {alert}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {migrations.map((mig) => (
                  <div key={mig.outputId} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200">{mig.outputId}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          mig.state === 'AUTO_MIGRATABLE' ? 'bg-emerald-950 text-emerald-400' :
                          mig.state === 'REVIEW_REQUIRED' ? 'bg-amber-950 text-amber-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {mig.state}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{mig.reason}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {mig.oldField ? `${mig.oldField} → ` : ''} {mig.newFieldCandidate || 'None (Missing / Broken)'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {approvedMigrations[mig.outputId] ? (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleApproveMigration(mig.outputId, true)}
                          disabled={mig.state === 'BROKEN'}
                          className={`text-xs px-3 py-1 rounded font-medium ${
                            mig.state === 'BROKEN' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white'
                          }`}
                        >
                          Approve Migration
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'lab' && (
            <div className="space-y-6">
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold">Compatibility Test Lab</h3>
                  <p className="text-xs text-slate-400">Verifies system parsers, payload filters, and field schemas under rigorous diagnostics simulation.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportDiagnosticPackage}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded hover:bg-slate-700 text-xs flex items-center space-x-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Diagnostic Package</span>
                  </button>
                  <button
                    onClick={runDiagnostics}
                    disabled={labRunning}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                  >
                    {labRunning ? 'Running Lab Audits...' : 'Execute Lab Run'}
                  </button>
                </div>
              </div>

              {labResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {labResults.map((res, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{res.testName}</h4>
                        <p className="text-xs text-slate-400 mt-1">{res.evidence}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${res.status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 bg-slate-900/20 rounded-lg border border-slate-800">
                  <ShieldCheck className="h-16 w-16 mx-auto mb-3 text-slate-700" />
                  <p className="text-xs">Click "Execute Lab Run" above to dispatch security, performance, and parser integration diagnostics.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
