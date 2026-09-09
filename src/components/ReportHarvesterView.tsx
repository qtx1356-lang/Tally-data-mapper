import React, { useState, useEffect } from 'react';
import {
  Compass,
  FileSpreadsheet,
  Layers,
  Database,
  Search,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sliders,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  Eye,
  FileText,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  Unplug,
  Copy,
  Download,
  UploadCloud,
  Check,
  X,
  Radio,
  Filter,
  ArrowRight,
  GitMerge,
  Terminal,
  Code
} from 'lucide-react';
import {
  DiscoverySessionModel,
  ReportCatalogItem,
  DiscoveredCollectionModel,
  DiscoveredObjectModel,
  DiscoveredFieldModel,
  SemanticMappingModel,
  ExtractionTemplateModel,
  ExtractionJobModel,
  QueryLabResultModel,
  SchemaDiffModel,
  DiscoveryDepth,
  DiscoveryScope
} from '../types/phase29ReportHarvester';

type HarvesterTab =
  | 'Discover'
  | 'Reports'
  | 'Collections'
  | 'Objects'
  | 'Fields'
  | 'Parameters'
  | 'Mappings'
  | 'Samples & Query Lab'
  | 'Jobs'
  | 'History & Snapshots';

export const ReportHarvesterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HarvesterTab>('Discover');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core Data
  const [sessions, setSessions] = useState<DiscoverySessionModel[]>([]);
  const [reports, setReports] = useState<ReportCatalogItem[]>([]);
  const [collections, setCollections] = useState<DiscoveredCollectionModel[]>([]);
  const [objects, setObjects] = useState<DiscoveredObjectModel[]>([]);
  const [mappings, setMappings] = useState<SemanticMappingModel[]>([]);
  const [templates, setTemplates] = useState<ExtractionTemplateModel[]>([]);
  const [jobs, setJobs] = useState<ExtractionJobModel[]>([]);
  const [schemaDiff, setSchemaDiff] = useState<SchemaDiffModel | null>(null);

  // Selected State
  const [selectedReport, setSelectedReport] = useState<ReportCatalogItem | null>(null);

  // Discovery Form
  const [discoveryDepth, setDiscoveryDepth] = useState<DiscoveryDepth>('Standard');
  const [discoveryScope, setDiscoveryScope] = useState<DiscoveryScope>('Entire Company');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  // Query Lab State
  const [queryLabReportId, setQueryLabReportId] = useState<string>('REP-TALLY-01');
  const [queryLabParams, setQueryLabParams] = useState({ FromDate: '20250401', ToDate: '20260331' });
  const [queryLabResult, setQueryLabResult] = useState<QueryLabResultModel | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resSess, resRep, resCol, resObj, resMap, resTmpl, resJobs, resDiff] = await Promise.all([
        fetch('/api/report-harvester/sessions'),
        fetch('/api/report-harvester/reports'),
        fetch('/api/report-harvester/collections'),
        fetch('/api/report-harvester/objects'),
        fetch('/api/report-harvester/mappings'),
        fetch('/api/report-harvester/templates'),
        fetch('/api/report-harvester/jobs'),
        fetch('/api/report-harvester/diff')
      ]);

      const dataSess = await resSess.json();
      const dataRep = await resRep.json();
      const dataCol = await resCol.json();
      const dataObj = await resObj.json();
      const dataMap = await resMap.json();
      const dataTmpl = await resTmpl.json();
      const dataJobs = await resJobs.json();
      const dataDiff = await resDiff.json();

      if (dataSess.success) setSessions(dataSess.data);
      if (dataRep.success) {
        setReports(dataRep.data);
        if (dataRep.data.length > 0) setSelectedReport(dataRep.data[0]);
      }
      if (dataCol.success) setCollections(dataCol.data);
      if (dataObj.success) setObjects(dataObj.data);
      if (dataMap.success) setMappings(dataMap.data);
      if (dataTmpl.success) setTemplates(dataTmpl.data);
      if (dataJobs.success) setJobs(dataJobs.data);
      if (dataDiff.success) setSchemaDiff(dataDiff.data);
    } catch (err) {
      console.error('Failed to load Report Harvester data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/report-harvester/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: discoveryScope, depth: discoveryDepth })
      });
      const data = await res.json();
      if (data.success) {
        setSessions([data.data, ...sessions]);
        showNotification('success', `Discovery session ${data.data.sessionId} completed. Discovered ${data.data.reportsDiscovered} reports and ${data.data.fieldsDiscovered} fields.`);
        fetchInitialData();
      }
    } catch (err) {
      showNotification('error', 'Discovery execution failed');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleUpdateMappingStatus = async (mappingId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/report-harvester/mappings/${mappingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: 'Controller Arjun' })
      });
      const data = await res.json();
      if (data.success) {
        setMappings(mappings.map((m) => (m.mappingId === mappingId ? data.data : m)));
        showNotification('success', `Mapping ${mappingId} marked as ${status}.`);
      }
    } catch (err) {
      showNotification('error', 'Failed to update mapping status');
    }
  };

  const handleExecuteQueryLab = async () => {
    setIsExecutingQuery(true);
    try {
      const res = await fetch('/api/report-harvester/query-lab/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: queryLabReportId, parameters: queryLabParams })
      });
      const data = await res.json();
      if (data.success) {
        setQueryLabResult(data.data);
        showNotification('success', `Test query executed successfully in ${data.data.durationMs}ms (Read-Only).`);
      }
    } catch (err) {
      showNotification('error', 'Test query execution failed');
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const handleTriggerExtractionJob = async (reportId: string) => {
    try {
      const res = await fetch('/api/report-harvester/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      });
      const data = await res.json();
      if (data.success) {
        setJobs([data.data, ...jobs]);
        showNotification('success', `Extraction job ${data.data.jobId} completed (${data.data.recordCount} records harvested).`);
      }
    } catch (err) {
      showNotification('error', 'Failed to trigger extraction job');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Universal Report Harvester</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  PHASE 29 REPORT DISCOVERY & SCHEMA MINING
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  READ-ONLY TALLY GUARD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatic Report Enumeration, Parameter Discovery, Entity Mining & Semantic Auto-Mapping (Discover First, Map Second)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-200 font-medium">Acme Enterprise Ltd (HO)</span>
            </div>
            <button
              onClick={() => {
                fetchInitialData();
                showNotification('info', 'Refreshed discovery schemas and mapping queues.');
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'Discover', label: 'Discover Sessions', icon: Compass },
            { id: 'Reports', label: `Report Catalog (${reports.length})`, icon: FileSpreadsheet },
            { id: 'Collections', label: `Collections (${collections.length})`, icon: Layers },
            { id: 'Objects', label: `Objects & Entities (${objects.length})`, icon: Database },
            { id: 'Fields', label: 'Field Mining & Profiling', icon: FileCode },
            { id: 'Parameters', label: 'Dynamic Parameters', icon: Sliders },
            { id: 'Mappings', label: `Semantic Mappings (${mappings.length})`, icon: GitMerge },
            { id: 'Samples & Query Lab', label: 'Tally Query Lab', icon: Terminal },
            { id: 'Jobs', label: `Extraction Jobs (${jobs.length})`, icon: Play },
            { id: 'History & Snapshots', label: 'Schema Diff & History', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HarvesterTab)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-t-md font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-800 text-purple-400 border-t-2 border-purple-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* TAB 1: DISCOVER */}
        {/* ========================================== */}
        {activeTab === 'Discover' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trigger Discovery Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Launch Discovery Session</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Execute safe, read-only introspection to enumerate exposed Tally reports, collections, and custom TDL fields.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Discovery Depth</label>
                    <select
                      value={discoveryDepth}
                      onChange={(e) => setDiscoveryDepth(e.target.value as DiscoveryDepth)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                    >
                      <option value="Quick">Quick (Major Reports & Domains)</option>
                      <option value="Standard">Standard (Reports, Collections, Objects & Sample Records)</option>
                      <option value="Deep">Deep (Custom TDL Outputs, Nested Paths & Schema Fingerprint)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Scope</label>
                    <select
                      value={discoveryScope}
                      onChange={(e) => setDiscoveryScope(e.target.value as DiscoveryScope)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                    >
                      <option value="Entire Company">Entire Company (Full Schema Scan)</option>
                      <option value="Selected Domains">Selected Domains (Accounting & Inventory)</option>
                      <option value="Selected Reports">Selected Reports Only</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div>Rate Limit: <strong>10 req/sec (Safe Read-Only)</strong></div>
                    <div>Max Payload Guard: <strong>50 MB per batch</strong></div>
                    <div>Resource Shield: <strong>Enabled (Zero Lock Contention)</strong></div>
                  </div>

                  <button
                    onClick={handleStartDiscovery}
                    disabled={isDiscovering}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center space-x-2"
                  >
                    <Compass className={`w-4 h-4 ${isDiscovering ? 'animate-spin' : ''}`} />
                    <span>{isDiscovering ? 'Introspecting Tally...' : 'Run Discovery Session'}</span>
                  </button>
                </div>
              </div>

              {/* Discovery Sessions History */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Discovery Sessions Log</span>
                </h3>

                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div key={sess.sessionId} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-purple-400">{sess.sessionId}</span>
                          <span className="text-slate-300 font-semibold">• {sess.tallyVersion} ({sess.depth} Depth)</span>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {sess.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <div className="text-[10px] text-slate-400">Reports</div>
                          <div className="text-base font-bold text-white">{sess.reportsDiscovered}</div>
                        </div>
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <div className="text-[10px] text-slate-400">Collections</div>
                          <div className="text-base font-bold text-blue-400">{sess.collectionsDiscovered}</div>
                        </div>
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <div className="text-[10px] text-slate-400">Fields Mined</div>
                          <div className="text-base font-bold text-emerald-400">{sess.fieldsDiscovered}</div>
                        </div>
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <div className="text-[10px] text-slate-400">Auto-Mappings</div>
                          <div className="text-base font-bold text-purple-400">{sess.mappingsGenerated}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: REPORTS */}
        {/* ========================================== */}
        {activeTab === 'Reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="lg:col-span-2 space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.reportId}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedReport?.reportId === rep.reportId
                        ? 'bg-slate-900 border-purple-500 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                          {rep.category}
                        </span>
                        <h4 className="text-sm font-bold text-white">{rep.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">({rep.tallyIdentifier})</span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {rep.availability}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">{rep.description}</p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">
                        Fields: <strong className="text-white">{rep.fields.length}</strong> • Parameters: <strong className="text-white">{rep.parameters.length}</strong>
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerExtractionJob(rep.reportId);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold text-[11px]"
                        >
                          Harvest Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Report Preview Drawer */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span>Report Sample Records</span>
                </h3>

                {selectedReport ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <div className="font-bold text-white">{selectedReport.name}</div>
                      <div className="text-slate-400">Source: {selectedReport.source}</div>
                      <div className="text-slate-400">Discovered: {selectedReport.lastDiscovered}</div>
                    </div>

                    {/* Sample Table */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-300 block">Bounded Sample Rows:</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border border-slate-800 rounded">
                          <thead className="bg-slate-950 text-slate-400">
                            <tr>
                              {Object.keys(selectedReport.sampleRows[0] || {}).map((k, i) => (
                                <th key={i} className="p-1.5 text-left border-b border-slate-800">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {selectedReport.sampleRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                {Object.values(row).map((v: any, vi) => (
                                  <td key={vi} className="p-1.5 text-slate-200 truncate">{String(v)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Select a report to inspect sample data.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: COLLECTIONS */}
        {/* ========================================== */}
        {activeTab === 'Collections' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Discovered Tally Collections (ICollectionDiscoveryEngine)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Structural collection definitions enumerated from standard and custom TDL definitions.
                </p>
              </div>

              <div className="space-y-3">
                {collections.map((col) => (
                  <div key={col.collectionId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{col.name}</span>
                        <span className="text-slate-400">({col.type})</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {col.availability}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {col.fields.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-purple-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: OBJECTS */}
        {/* ========================================== */}
        {activeTab === 'Objects' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Discovered Entity Objects & Relationships (IObjectDiscoveryEngine)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Discovered domain entities, primary identifiers, and inferred structural foreign relationships.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objects.map((obj) => (
                  <div key={obj.objectId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{obj.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Identifier: {obj.identifier}</div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded">
                        {obj.category}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 font-semibold block">Discovered Relationships:</span>
                      {obj.relationships.map((rel, i) => (
                        <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-purple-300">→ {rel.targetObject}</span>
                          <span className="text-emerald-400 font-semibold">{rel.type} ({rel.confidence} Confidence)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: FIELDS */}
        {/* ========================================== */}
        {activeTab === 'Fields' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span>Field-Level Schema Mining & Data Profiling (IFieldDiscoveryEngine)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deep inspection of nested paths, data types, nullability, uniqueness, and safe sample values.
                </p>
              </div>

              <div className="space-y-3">
                {selectedReport?.fields.map((f) => (
                  <div key={f.fieldId} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-purple-300 font-bold">{f.name}</span>
                        <span className="text-slate-400 text-[11px]">Path: {f.path}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Type: <strong className="text-slate-200">{f.type}</strong> • Nullability: <strong className="text-slate-200">{f.nullable}</strong> • Null%: {f.nullPct}% • Unique%: {f.uniquePct}%
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                        {f.confidence} Confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: PARAMETERS */}
        {/* ========================================== */}
        {activeTab === 'Parameters' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Dynamic Parameter Discovery Engine (IParameterDiscoveryEngine)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Auto-generates validated form controls corresponding to discovered Tally report variables.
                </p>
              </div>

              <div className="space-y-3">
                {selectedReport?.parameters.map((p) => (
                  <div key={p.parameterId} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">{p.type}</span>
                        {p.isRequired ? (
                          <span className="px-1.5 py-0.5 text-[10px] bg-rose-950 text-rose-300 rounded font-bold">Required</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">Optional</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{p.description}</p>
                    </div>

                    <div className="text-right text-slate-300 font-mono text-[11px]">
                      Default: {p.defaultValue || 'None'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 7: MAPPINGS */}
        {/* ========================================== */}
        {activeTab === 'Mappings' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <GitMerge className="w-4 h-4 text-purple-400" />
                    <span>Semantic Auto-Mapping & Review Queue (ISemanticMappingEngine)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Maps discovered source fields to canonical entities with explicit confidence scoring and audit approval.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {mappings.map((m) => (
                  <div key={m.mappingId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{m.sourceReport}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({m.sourceField} → {m.canonicalField})</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                          m.status === 'Approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-[11px] space-y-1">
                      <div>Method: <strong className="text-purple-300">{m.method}</strong> • Semantic Type: <strong className="text-blue-300">{m.semanticType}</strong></div>
                      <div>Evidence: <span className="text-slate-400">{m.reason}</span></div>
                    </div>

                    {m.status !== 'Approved' && (
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleUpdateMappingStatus(m.mappingId, 'Approved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Mapping</span>
                        </button>
                        <button
                          onClick={() => handleUpdateMappingStatus(m.mappingId, 'Rejected')}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: QUERY LAB */}
        {/* ========================================== */}
        {activeTab === 'Samples & Query Lab' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Query Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Tally Query Lab (Read-Only Test Console)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Directly test extraction envelopes without modifying any accounting ledger or voucher.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Target Report</label>
                    <select
                      value={queryLabReportId}
                      onChange={(e) => setQueryLabReportId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                    >
                      {reports.map((r) => (
                        <option key={r.reportId} value={r.reportId}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">From Date (YYYYMMDD)</label>
                    <input
                      type="text"
                      value={queryLabParams.FromDate}
                      onChange={(e) => setQueryLabParams({ ...queryLabParams, FromDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">To Date (YYYYMMDD)</label>
                    <input
                      type="text"
                      value={queryLabParams.ToDate}
                      onChange={(e) => setQueryLabParams({ ...queryLabParams, ToDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                    />
                  </div>

                  <button
                    onClick={handleExecuteQueryLab}
                    disabled={isExecutingQuery}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isExecutingQuery ? 'Querying Tally...' : 'Execute Read-Only Query'}</span>
                  </button>
                </div>
              </div>

              {/* Response Viewer */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span>Raw Tally XML Envelope & Normalized Response</span>
                </h3>

                {queryLabResult ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center space-x-4 text-slate-300">
                      <div>Execution Time: <strong className="text-emerald-400">{queryLabResult.durationMs}ms</strong></div>
                      <div>Records: <strong className="text-white">{queryLabResult.totalRecords}</strong></div>
                      <div>Payload Size: <strong className="text-slate-400">{queryLabResult.payloadSizeBytes} Bytes</strong></div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto whitespace-pre">
                      {queryLabResult.rawPayload}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Run a test query in the lab to inspect real-time responses.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 9: JOBS */}
        {/* ========================================== */}
        {activeTab === 'Jobs' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Play className="w-4 h-4 text-purple-400" />
                  <span>Harvesting Jobs & Execution History (IReportExtractionJob)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitors active and historical batch extraction jobs across configured Tally reports.
                </p>
              </div>

              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.jobId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-purple-400 font-bold">{job.jobId}</span>
                        <span className="font-bold text-white">{job.reportName}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Harvested <strong className="text-emerald-400">{job.recordCount}</strong> Records • Started: {job.startedAt.slice(11, 19)} • Completed: {job.completedAt?.slice(11, 19)}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 10: HISTORY & SNAPSHOTS */}
        {/* ========================================== */}
        {activeTab === 'History & Snapshots' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Schema Versioning & Discovery Diff (ISchemaMiningEngine)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks structural evolution across Tally discovery sessions and alerts on breaking schema changes.
                </p>
              </div>

              {schemaDiff && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="font-bold text-purple-300 text-sm">
                    Comparison: {schemaDiff.sessionA} vs {schemaDiff.sessionB}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-emerald-400 block">Added Reports ({schemaDiff.addedReports.length}):</span>
                      {schemaDiff.addedReports.map((r, i) => (
                        <div key={i} className="text-slate-300 ml-2 text-[11px]">+ {r}</div>
                      ))}
                    </div>

                    <div>
                      <span className="font-semibold text-blue-400 block">Added Fields ({schemaDiff.addedFields.length}):</span>
                      {schemaDiff.addedFields.map((f, i) => (
                        <div key={i} className="text-slate-300 ml-2 text-[11px]">+ {f}</div>
                      ))}
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded text-[11px] text-slate-400">
                      Breaking Changes Detected: <strong className="text-emerald-400">0 (Schema Additive)</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
