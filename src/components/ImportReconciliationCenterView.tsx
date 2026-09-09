import React, { useState, useEffect } from "react";
import {
  ExternalDataset,
  ReconciliationSession,
  DataProfileReport,
  ColumnMappingDefinition,
  ReconciliationPairResult,
  MatchingRuleConfig,
  ReconciliationAuditLog,
  BankStatementBalanceValidation,
  ExternalSourceType,
  SupportedFileFormat,
  MatchCategory
} from "../types/phase21ImportReconciliation";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Layers,
  FileText,
  Building,
  Check,
  ChevronRight,
  Database,
  Search,
  Download,
  Eye,
  Info,
  Sparkles,
  Zap,
  Lock,
  ArrowLeftRight,
  History,
  Activity
} from "lucide-react";

export const ImportReconciliationCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "importWizard" | "reconcileStudio" | "bankBalCheck" | "audit">("dashboard");
  const [datasets, setDatasets] = useState<ExternalDataset[]>([]);
  const [sessions, setSessions] = useState<ReconciliationSession[]>([]);
  const [activeSession, setActiveSession] = useState<ReconciliationSession | null>(null);
  const [selectedPair, setSelectedPair] = useState<ReconciliationPairResult | null>(null);
  const [copilotExplanation, setCopilotExplanation] = useState<string | null>(null);
  const [copilotActions, setCopilotActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Bank balance check state
  const [bankCheck, setBankCheck] = useState<BankStatementBalanceValidation | null>(null);

  // Import Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [importSourceType, setImportSourceType] = useState<ExternalSourceType>("Bank Statement");
  const [importFormat, setImportFormat] = useState<SupportedFileFormat>("CSV");
  const [uploadedFileName, setUploadedFileName] = useState("HDFC_Aug2026_Live.csv");
  const [profileResult, setProfileResult] = useState<DataProfileReport | null>(null);
  const [suggestedMappings, setSuggestedMappings] = useState<ColumnMappingDefinition[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isDuplicateWarning, setIsDuplicateWarning] = useState(false);

  // Reconcile Studio Config
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [ruleConfig, setRuleConfig] = useState<MatchingRuleConfig>({
    ruleId: "RUL_USER_CUSTOM",
    ruleName: "Standard Strict Match",
    strategy: "Combined",
    cardinality: "OneToOne",
    amountTolerance: 1.0,
    dateToleranceDays: 2,
    partyFuzzyThreshold: 0.8,
    referenceExactMatch: true,
    requireSameSign: true,
    ignoreSpecialCharacters: true
  });

  // Manual override dialog
  const [overridePairId, setOverridePairId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideCategory, setOverrideCategory] = useState<MatchCategory>("Exact Match");

  // Load initial data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [dsRes, sessRes, bankRes] = await Promise.all([
        fetch("/api/import-recon/datasets").then((r) => r.json()),
        fetch("/api/import-recon/reconcile/sessions").then((r) => r.json()),
        fetch("/api/import-recon/bank-balance-check/DS_BANK_HDFC_AUG26").then((r) => r.json())
      ]);
      setDatasets(dsRes || []);
      setSessions(sessRes || []);
      if (sessRes && sessRes.length > 0) {
        setActiveSession(sessRes[0]);
        if (sessRes[0].results.length > 0) {
          setSelectedPair(sessRes[0].results[0]);
        }
      }
      if (dsRes && dsRes.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(dsRes[0].datasetId);
      }
      setBankCheck(bankRes);
    } catch (err) {
      console.error("Error loading reconciliation data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Wizard: Step 1 -> 2 (Profile & Preview)
  const handleProfileFile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/import-recon/profile-and-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadedFileName,
          sourceType: importSourceType,
          fileFormat: importFormat
        })
      });
      const data = await res.json();
      setProfileResult(data.profile);
      setSuggestedMappings(data.suggestedMappings);
      setPreviewRows(data.previewRows);
      setIsDuplicateWarning(data.isDuplicateWarning);
      setWizardStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Wizard: Step 3 -> 4 (Commit Import)
  const handleCommitImport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/import-recon/import-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetName: `${importSourceType} - ${uploadedFileName}`,
          sourceType: importSourceType,
          fileFormat: importFormat,
          originalFileName: uploadedFileName,
          columnMappings: suggestedMappings,
          previewRows: previewRows
        })
      });
      const data = await res.json();
      await refreshData();
      if (data.dataset) {
        setSelectedDatasetId(data.dataset.datasetId);
      }
      setWizardStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Reconcile
  const handleRunReconciliation = async (isDryRun = false) => {
    if (!selectedDatasetId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/import-recon/reconcile/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: selectedDatasetId,
          ruleConfig,
          isDryRun
        })
      });
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        if (data.session.results.length > 0) {
          setSelectedPair(data.session.results[0]);
        }
      }
      if (!isDryRun) {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Explain with Copilot
  const handleExplainPair = async (pair: ReconciliationPairResult) => {
    setSelectedPair(pair);
    try {
      const res = await fetch("/api/import-recon/copilot/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: pair.pairId,
          sessionId: activeSession?.sessionId
        })
      });
      const data = await res.json();
      setCopilotExplanation(data.explanation);
      setCopilotActions(data.potentialActions || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Manual Override
  const handleOverrideSubmit = async () => {
    if (!overridePairId || !activeSession) return;
    try {
      const res = await fetch(`/api/import-recon/reconcile/sessions/${activeSession.sessionId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: overridePairId,
          newCategory: overrideCategory,
          overrideReason: overrideReason || "Auditor manual verification"
        })
      });
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        const updated = data.session.results.find((r: any) => r.pairId === overridePairId);
        if (updated) setSelectedPair(updated);
      }
      setOverridePairId(null);
      setOverrideReason("");
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered pairs
  const filteredPairs = activeSession?.results.filter((p) => {
    if (filterCategory !== "ALL" && p.matchCategory !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const extRef = (p.externalRow.normalizedValues.Reference || "").toLowerCase();
      const extParty = (p.externalRow.normalizedValues.PartyName || "").toLowerCase();
      const reason = p.reason.toLowerCase();
      return extRef.includes(term) || extParty.includes(term) || reason.includes(term);
    }
    return true;
  }) || [];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Header Bar */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">EXFIN Universal Import & Reconciliation</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Phase 21
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Universal External Ingestion • Deterministic & Fuzzy Matching Engine • Tally Read-Only Isolation
            </p>
          </div>
        </div>

        {/* Read-Only Guarantee Badge */}
        <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-lg text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold">Tally Isolated & Read-Only</span>: External data never written to Tally
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "dashboard" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("importWizard");
              setWizardStep(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "importWizard" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Import Wizard
          </button>
          <button
            onClick={() => setActiveTab("reconcileStudio")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "reconcileStudio" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Reconciliation Studio
          </button>
          <button
            onClick={() => setActiveTab("bankBalCheck")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "bankBalCheck" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Bank Balance Check
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "audit" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Audit & Lineage
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>External Datasets</span>
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{datasets.length}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {datasets.reduce((a, b) => a + b.importedRows, 0)} total imported records
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Exact Match Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {activeSession ? `${activeSession.matchRatePercentage}%` : "0%"}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {activeSession ? `${activeSession.exactMatchCount + activeSession.strongMatchCount} of ${activeSession.totalExternalCount} matched` : "No session"}
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Unmatched Records</span>
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {activeSession ? activeSession.unmatchedCount : 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">External items missing in Tally ledger</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Conflicts Detected</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400">
                  {activeSession ? activeSession.conflictCount : 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Ref match with amount discrepancy</div>
              </div>
            </div>

            {/* Quick Actions & Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Reconciliation Sessions */}
              <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-white">Reconciliation Sessions</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("reconcileStudio")}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
                  >
                    <span>Open Studio</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.sessionId}
                      onClick={() => {
                        setActiveSession(sess);
                        setActiveTab("reconcileStudio");
                      }}
                      className="bg-slate-900/70 border border-slate-700/80 hover:border-cyan-500/50 p-4 rounded-lg cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">{sess.sessionName}</span>
                          <span className="px-2 py-0.5 text-[10px] rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                            {sess.sourceType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Period: {sess.period} • Evaluated: {sess.totalExternalCount} records • Completed:{" "}
                          {new Date(sess.completedAt || sess.startedAt).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-400">{sess.matchRatePercentage}% Match</div>
                          <div className="text-[11px] text-slate-400">
                            {sess.exactMatchCount} exact • {sess.unmatchedCount} unmatched
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Ingestion Quick Launch */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-white">Universal Ingestion</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Import bank statements, GST portal reports (GSTR-2B), payroll registers, or custom ERP exports. Automated column profiling detects types & semantic roles.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-300">Supported Sources:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Bank Statements", "GST 2B/1", "Payroll", "Physical Stock", "Excel/CSV", "Scanned PDF"].map((s) => (
                        <span key={s} className="px-2 py-1 text-[11px] rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("importWizard");
                    setWizardStep(1);
                  }}
                  className="w-full mt-4 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/20"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Launch Import Wizard</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IMPORT WIZARD */}
        {/* ========================================================================= */}
        {activeTab === "importWizard" && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 space-y-6">
            {/* Wizard Header Progress */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Universal Data Import Wizard</h2>
                <p className="text-xs text-slate-400">Step {wizardStep} of 4: Ingestion, Profiling, Mapping & Verification</p>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      wizardStep === step
                        ? "bg-cyan-600 text-white"
                        : wizardStep > step
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {wizardStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Select Source & File */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source Preset Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Select Source Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Bank Statement",
                        "GST Data",
                        "Payroll",
                        "Inventory",
                        "Sales",
                        "Purchase",
                        "Custom"
                      ].map((st) => (
                        <button
                          key={st}
                          onClick={() => setImportSourceType(st as ExternalSourceType)}
                          className={`p-3 rounded-lg border text-left text-xs font-medium transition ${
                            importSourceType === st
                              ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow"
                              : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format & File Upload Simulation */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      File Format & Input
                    </label>
                    <div className="flex space-x-2">
                      {["CSV", "XLSX", "PDF", "JSON", "XML"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setImportFormat(fmt as SupportedFileFormat)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                            importFormat === fmt
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-slate-900 border-slate-700 text-slate-400"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>

                    <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center space-y-3 bg-slate-900/50 transition">
                      <FileSpreadsheet className="w-10 h-10 text-cyan-400 mx-auto" />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Selected: <span className="text-cyan-400">{uploadedFileName}</span>
                        </div>
                        <div className="text-xs text-slate-400">Drag & drop or click to replace sample file</div>
                      </div>
                      <input
                        type="text"
                        value={uploadedFileName}
                        onChange={(e) => setUploadedFileName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200"
                        placeholder="File name"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileFile}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center space-x-2 shadow"
                  >
                    <span>Analyze & Profile File</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Data Profiling & Quality Metrics */}
            {wizardStep === 2 && profileResult && (
              <div className="space-y-6">
                {isDuplicateWarning && (
                  <div className="p-3 bg-amber-950/60 border border-amber-600 rounded-lg text-amber-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Warning: File with identical SHA-256 fingerprint was imported previously. Versioning will be applied.</span>
                  </div>
                )}

                {/* Quality Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-slate-400">Total Rows / Columns</div>
                    <div className="text-lg font-bold text-white">
                      {profileResult.rowCount} rows • {profileResult.columnCount} cols
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-slate-400">Completeness Score</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {profileResult.qualityMetrics.completeness}%
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-slate-400">Type Validity</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {profileResult.qualityMetrics.typeValidity}%
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-slate-400">Encoding / Delimiter</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {profileResult.detectedEncoding} ({profileResult.detectedDelimiter})
                    </div>
                  </div>
                </div>

                {/* Column Profiling Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Detected Columns & Semantic Suggestions
                  </h3>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="p-3">Source Column</th>
                          <th className="p-3">Detected Type</th>
                          <th className="p-3">Suggested Role</th>
                          <th className="p-3">Confidence</th>
                          <th className="p-3">Sample Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {profileResult.columns.map((col, idx) => (
                          <tr key={idx} className="hover:bg-slate-850">
                            <td className="p-3 font-semibold text-white">{col.columnName}</td>
                            <td className="p-3 font-mono text-cyan-300">{col.detectedType}</td>
                            <td className="p-3 font-semibold text-amber-300">{col.suggestedSemanticRole}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  col.suggestedConfidence === "High"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                    : "bg-blue-950 text-blue-400 border border-blue-800"
                                }`}
                              >
                                {col.suggestedConfidence}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                              {col.sampleValues.filter(Boolean).slice(0, 3).join(" | ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center space-x-2"
                  >
                    <span>Proceed to Column Mapping</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Column Mapping & Transformation Customization */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Configure Semantic Mappings & Transformation Pipelines
                  </h3>
                  <p className="text-xs text-slate-400">
                    Map each external column to EXFIN standard accounting schema fields. INR currency formats and dates are normalized automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  {suggestedMappings.map((map, idx) => (
                    <div
                      key={map.mappingId}
                      className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="font-semibold text-white w-48 truncate">{map.externalColumn}</div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Role:</span>
                        <select
                          value={map.targetSemanticField}
                          onChange={(e) => {
                            const copy = [...suggestedMappings];
                            copy[idx].targetSemanticField = e.target.value as any;
                            copy[idx].isUserConfirmed = true;
                            setSuggestedMappings(copy);
                          }}
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                        >
                          {[
                            "Date",
                            "Amount",
                            "Debit",
                            "Credit",
                            "Balance",
                            "Reference",
                            "ChequeNumber",
                            "UTR",
                            "InvoiceNumber",
                            "PartyName",
                            "GSTIN",
                            "TaxableValue",
                            "TaxAmount",
                            "CGST",
                            "SGST",
                            "IGST",
                            "EmployeeId",
                            "GrossPay",
                            "NetPay",
                            "ItemCode",
                            "Quantity",
                            "Description",
                            "Custom"
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Type:</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">
                          {map.targetDataType}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                        <span>Pipeline:</span>
                        <span className="text-amber-400 font-mono">[{map.transformationPipeline.join(", ")}]</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCommitImport}
                    disabled={isLoading}
                    className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-2 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>Commit & Save External Dataset</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success & Lineage Confirmation */}
            {wizardStep === 4 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">External Dataset Imported Successfully</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Dataset is saved inside EXFIN Local Parquet storage. Tally remains unmodified and isolated in read-only mode.
                </p>

                <div className="flex justify-center space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setActiveTab("reconcileStudio");
                    }}
                    className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center space-x-2"
                  >
                    <span>Open in Reconciliation Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setWizardStep(1);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Import Another File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RECONCILIATION STUDIO */}
        {/* ========================================================================= */}
        {activeTab === "reconcileStudio" && (
          <div className="space-y-6">
            {/* Studio Controls Header */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">External Dataset</label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-semibold"
                  >
                    {datasets.map((d) => (
                      <option key={d.datasetId} value={d.datasetId}>
                        {d.datasetName} ({d.sourceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Tally Source</label>
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-emerald-400 font-mono flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>Live Tally Cache (Parquet Columnar)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRunReconciliation(true)}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Dry Run Preview</span>
                </button>
                <button
                  onClick={() => handleRunReconciliation(false)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Run Reconciliation</span>
                </button>
                <a
                  href={`/api/import-recon/reconcile/sessions/${activeSession?.sessionId || "REC_SESS_BANK_AUG26_01"}/export?format=CSV`}
                  download
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            {/* Filter & Matching Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Matched Pairs List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                    {["ALL", "Exact Match", "Strong Match", "No Match", "Conflict"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          filterCategory === cat
                            ? "bg-cyan-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ref, party, amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-48 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Pairs Cards */}
                <div className="space-y-3">
                  {filteredPairs.map((pair) => (
                    <div
                      key={pair.pairId}
                      onClick={() => handleExplainPair(pair)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        selectedPair?.pairId === pair.pairId
                          ? "bg-slate-800/95 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/50"
                          : "bg-slate-850/80 border-slate-700/80 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pair.matchCategory === "Exact Match"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : pair.matchCategory === "Strong Match"
                                  ? "bg-blue-950 text-blue-400 border border-blue-800"
                                  : pair.matchCategory === "Conflict"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {pair.matchCategory} ({pair.matchScore}%)
                            </span>
                            {pair.isManualOverride && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                                Manual Override
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-mono">
                              {pair.externalRow.normalizedValues.Date || "N/A"}
                            </span>
                          </div>

                          <div className="text-sm font-semibold text-white">
                            {pair.externalRow.normalizedValues.Description ||
                              pair.externalRow.normalizedValues.PartyName ||
                              "External Entry"}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            Ref: {pair.externalRow.normalizedValues.Reference || "N/A"} • Amount: ₹
                            {(
                              pair.externalRow.normalizedValues.Amount ||
                              pair.externalRow.normalizedValues.Credit ||
                              pair.externalRow.normalizedValues.Debit ||
                              0
                            ).toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-xs font-semibold text-slate-300">
                            {pair.tallyVouchers.length > 0 ? (
                              <span className="text-emerald-400 font-mono">
                                Tally: {pair.tallyVouchers[0].voucherNumber || pair.tallyVouchers[0].invoiceNumber || pair.tallyVouchers[0].voucherId}
                              </span>
                            ) : (
                              <span className="text-rose-400">Missing in Tally</span>
                            )}
                          </div>
                          {pair.differenceAmount ? (
                            <div className="text-[11px] text-amber-400">
                              Diff: ₹{pair.differenceAmount.toLocaleString("en-IN")}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-750 pt-2 flex items-center justify-between">
                        <span>{pair.reason}</span>
                        <span className="text-cyan-400 hover:underline flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Explain with Copilot</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Deep Inspection & Copilot Explanation Drawer */}
              <div className="space-y-4">
                {selectedPair ? (
                  <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div className="flex items-center space-x-2">
                        <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Side-by-Side Comparison</h3>
                      </div>
                      <button
                        onClick={() => {
                          setOverridePairId(selectedPair.pairId);
                          setOverrideCategory(selectedPair.matchCategory);
                        }}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200"
                      >
                        Override Match
                      </button>
                    </div>

                    {/* Field Level Comparison */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field Diff</div>
                      <div className="space-y-1.5">
                        {selectedPair.fieldComparisons.map((fc, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs ${
                              fc.isMatched
                                ? "bg-emerald-950/30 border-emerald-800/40 text-slate-200"
                                : "bg-rose-950/30 border-rose-800/40 text-rose-200"
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span>{fc.field}</span>
                              {fc.isMatched ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">External</span>
                                <span className="font-mono text-white">{String(fc.externalValue)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Tally Cache</span>
                                <span className="font-mono text-cyan-300">{String(fc.tallyValue)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lineage Traceability */}
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Lineage</div>
                      <div className="text-xs font-mono text-cyan-300 break-all">
                        {selectedPair.externalRow.lineage.rawSourceLocation}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SHA-256: {selectedPair.externalRow.lineage.fileSha256.substring(0, 16)}...
                      </div>
                    </div>

                    {/* Copilot Natural Language Explanation */}
                    <div className="p-3.5 bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-700/50 rounded-lg space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Accounting Copilot Analysis</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {copilotExplanation || selectedPair.reason}
                      </p>

                      {copilotActions.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-indigo-900/50">
                          <span className="text-[10px] uppercase font-bold text-indigo-300">Recommended Next Steps:</span>
                          {copilotActions.map((act, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                              <span className="text-indigo-400">•</span>
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center text-slate-400 text-xs">
                    Select a reconciled pair to inspect side-by-side comparison & Copilot lineage.
                  </div>
                )}
              </div>
            </div>

            {/* Manual Override Dialog Modal */}
            {overridePairId && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <h3 className="text-sm font-bold text-white">Manual Auditor Match Override</h3>
                    <button onClick={() => setOverridePairId(null)} className="text-slate-400 hover:text-white">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Set Match Category</label>
                      <select
                        value={overrideCategory}
                        onChange={(e) => setOverrideCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                      >
                        <option value="Exact Match">Exact Match (Verified)</option>
                        <option value="Strong Match">Strong Match</option>
                        <option value="Possible Match">Possible Match</option>
                        <option value="No Match">Mark as Unmatched / Disputed</option>
                        <option value="Conflict">Mark as Conflict</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Auditor Reason / Justification</label>
                      <textarea
                        rows={3}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g., Verified against physical invoice copy #INV-42 and bank clearing slip."
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setOverridePairId(null)}
                      className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleOverrideSubmit}
                      className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BANK STATEMENT BALANCE INTEGRITY */}
        {/* ========================================================================= */}
        {activeTab === "bankBalCheck" && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Bank Balance Integrity Engine</h2>
                <p className="text-xs text-slate-400">
                  Mathematical validation: Opening Balance + Total Credits - Total Debits = Stated Closing Balance
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 ${
                  bankCheck?.isBalanced
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-700"
                    : "bg-rose-950 text-rose-400 border border-rose-700"
                }`}
              >
                {bankCheck?.isBalanced ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{bankCheck?.isBalanced ? "Mathematical Integrity Verified" : "Discrepancy Detected"}</span>
              </div>
            </div>

            {bankCheck && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-400">Opening Balance</span>
                  <div className="text-xl font-bold text-white font-mono">
                    ₹{bankCheck.openingBalance.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs text-emerald-400">Total Deposits (Credits)</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    + ₹{bankCheck.totalCredits.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs text-rose-400">Total Withdrawals (Debits)</span>
                  <div className="text-xl font-bold text-rose-400 font-mono">
                    - ₹{bankCheck.totalDebits.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs text-cyan-400">Computed Closing Balance</span>
                  <div className="text-xl font-bold text-cyan-400 font-mono">
                    ₹{bankCheck.computedClosingBalance.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 text-xs space-y-2">
              <h3 className="font-bold text-slate-200">Reconciliation Analysis & Bank Charge Tracking</h3>
              <p className="text-slate-400 leading-relaxed">
                Bank statements often feature periodic charges, SMS alerts, or direct debits that have not yet been passed in Tally. EXFIN identifies these as "Missing in Tally" differences with direct reference tracing, enabling one-click voucher draft generation.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AUDIT & LINEAGE */}
        {/* ========================================================================= */}
        {activeTab === "audit" && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Immutable Reconciliation Audit Log</h2>
                <p className="text-xs text-slate-400">Every import, mapping adjustment, matching run, and manual override is permanently logged.</p>
              </div>
              <button
                onClick={refreshData}
                className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: "AUD_101",
                  action: "Reconcile",
                  user: "finance.ops@exfin.internal",
                  time: "10 mins ago",
                  details: "Executed Deterministic Bank Reconciler against Tally Parquet snapshot. 3 Matched, 1 Unmatched."
                },
                {
                  id: "AUD_102",
                  action: "Import",
                  user: "finance.ops@exfin.internal",
                  time: "1 hour ago",
                  details: "Imported HDFC_Statement_5020001234_Aug2026.csv (SHA-256 e3b0c4...)"
                }
              ].map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono text-[10px]">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-200">{log.details}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      User: {log.user} • Time: {log.time}
                    </div>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">{log.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
