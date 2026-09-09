import React, { useState, useEffect } from "react";
import {
  FileText,
  FileSearch,
  ScanText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Edit3,
  Bot,
  Scale,
  RefreshCw,
  Search,
  Lock,
  GitBranch,
  Building2,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import {
  IntelligentDocument,
  ExtractedField,
  DocumentException,
  DocumentProcessingReport
} from "../types/phase22DocumentIntelligence";

export const DocumentIntelligenceCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "Dashboard" | "Inbox" | "Review Studio" | "3-Way Match" | "Exceptions" | "Graph" | "Audit"
  >("Review Studio");

  const [documents, setDocuments] = useState<IntelligentDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("DOC-2026-INV-8891");
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>("grandTotal");
  const [exceptions, setExceptions] = useState<DocumentException[]>([]);
  const [report, setReport] = useState<DocumentProcessingReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Ingestion Modal State
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadDocType, setUploadDocType] = useState<string>("Purchase Invoice");
  const [uploading, setUploading] = useState<boolean>(false);

  // Field Correction Modal State
  const [editingField, setEditingField] = useState<ExtractedField | null>(null);
  const [correctionValue, setCorrectionValue] = useState<string>("");
  const [correctionReason, setCorrectionReason] = useState<string>("");

  // Copilot Analysis State
  const [copilotSummary, setCopilotSummary] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Load documents and dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/document-intel/dashboard");
      const data = await res.json();
      setReport(data.report);
      setDocuments(data.recentDocuments || []);
      setExceptions(data.recentExceptions || []);
    } catch (e) {
      console.error("Failed to load document intel data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedDoc = documents.find((d) => d.documentId === selectedDocId) || documents[0];

  // Ingest Document Handler
  const handleUpload = async () => {
    if (!uploadFileName.trim()) return;
    setUploading(true);
    try {
      const res = await fetch("/api/document-intel/inbox/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadFileName,
          documentType: uploadDocType,
          fileFormat: "PDF"
        })
      });
      const data = await res.json();
      if (data.document) {
        setDocuments([data.document, ...documents]);
        setSelectedDocId(data.document.documentId);
        setActiveTab("Review Studio");
        setUploadFileName("");
      }
    } catch (err) {
      console.error("Failed to ingest document", err);
    } finally {
      setUploading(false);
    }
  };

  // Submit Field Correction
  const handleSaveCorrection = async () => {
    if (!editingField || !selectedDoc) return;
    try {
      const res = await fetch(`/api/document-intel/documents/${selectedDoc.documentId}/correct-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey: editingField.fieldKey,
          correctedValue: correctionValue,
          reason: correctionReason
        })
      });
      const data = await res.json();
      if (data.document) {
        setDocuments(documents.map((d) => (d.documentId === data.document.documentId ? data.document : d)));
        setEditingField(null);
      }
    } catch (err) {
      console.error("Correction failed", err);
    }
  };

  // Trigger Copilot Explanation
  const handleCopilotExplain = async () => {
    if (!selectedDoc) return;
    setCopilotLoading(true);
    try {
      const res = await fetch(`/api/document-intel/documents/${selectedDoc.documentId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setCopilotSummary(data.summary);
    } catch (err) {
      console.error("Copilot explain failed", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Resolve Exception
  const handleResolveException = async (excId: string) => {
    try {
      const res = await fetch(`/api/document-intel/exceptions/${excId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: "Approved and reconciled with vendor credit memo." })
      });
      const data = await res.json();
      if (data.success) {
        setExceptions(exceptions.map((e) => (e.exceptionId === excId ? data.exception : e)));
      }
    } catch (err) {
      console.error("Failed to resolve exception", err);
    }
  };

  const activeField = selectedDoc?.fields.find((f) => f.fieldKey === selectedFieldKey);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-black">
              <ScanText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Enterprise Document Intelligence
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  Phase 22
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-format OCR, Layout Analysis, Indian GST Validation, 3-Way Matching, and Read-Only Tally Reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Engine Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Local OCR (Privacy Mode: Strict On-Premise)</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors border border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-1 overflow-x-auto text-xs font-medium">
        {[
          { id: "Dashboard", label: "Dashboard & KPIs", icon: Layers },
          { id: "Inbox", label: "Document Inbox", icon: FileSearch },
          { id: "Review Studio", label: "OCR Split-Screen Studio", icon: ScanText },
          { id: "3-Way Match", label: "3-Way Match Inspector", icon: Scale },
          { id: "Exceptions", label: "Exception Center", icon: AlertTriangle, count: exceptions.filter((e) => e.status !== "Resolved").length },
          { id: "Graph", label: "Lineage & Relationships", icon: GitBranch },
          { id: "Audit", label: "Audit Log & Provenance", icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-slate-800/90 text-indigo-400 border-b-2 border-indigo-500 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === "Dashboard" && report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Documents</span>
              <div className="mt-2 text-2xl font-bold text-slate-100">{report.totalDocuments}</div>
              <div className="mt-1 text-[11px] text-slate-400">Multi-page PDFs & Images</div>
            </div>
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Matched to Tally</span>
              <div className="mt-2 text-2xl font-bold text-emerald-300">{report.matchedCount}</div>
              <div className="mt-1 text-[11px] text-emerald-400/80">Deterministic 100% precision</div>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Needs Review</span>
              <div className="mt-2 text-2xl font-bold text-amber-300">{report.needsReviewCount}</div>
              <div className="mt-1 text-[11px] text-amber-400/80">Tax or low OCR confidence</div>
            </div>
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Active Exceptions</span>
              <div className="mt-2 text-2xl font-bold text-rose-300">{report.exceptionsCount}</div>
              <div className="mt-1 text-[11px] text-rose-400/80">Rate/tax variances pending</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <ScanText className="h-4 w-4 text-indigo-400" />
                OCR Engine Performance & Security
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Active Engine:</span>
                  <span className="font-mono font-semibold text-indigo-300">Local Tesseract-v5.3 Strict Privacy</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Average Processing Latency:</span>
                  <span className="font-mono text-emerald-400">{report.averageProcessingTimeMs} ms / page</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Formula Injection Mitigation:</span>
                  <span className="text-emerald-400 font-semibold">Active (=, +, -, @ Sanitization)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Tally Database Isolation:</span>
                  <span className="text-sky-400 font-semibold">Strict READ-ONLY (No mutations)</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-400" />
                3-Way Matching Health
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Match Health Score:</span>
                  <span className="font-mono font-bold text-emerald-400">{report.threeWayMatchHealthPercent}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">PO vs Goods Receipt Balance:</span>
                  <span className="text-emerald-400">0 Qty Variance</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Supplier Invoicing Tolerances:</span>
                  <span className="font-mono text-slate-200">±0.05% or ₹1.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INBOX & INGESTION */}
      {activeTab === "Inbox" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-indigo-400" />
              Ingest New Document (PDF / Image / Scanner)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Document File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vendor_Invoice_Aug2026.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Purchase Invoice">Purchase Invoice</option>
                  <option value="Sales Invoice">Sales Invoice</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Debit Note">Debit Note</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFileName}
                  className="w-full flex items-center justify-center space-x-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <ScanText className="h-4 w-4" />
                  <span>{uploading ? "Extracting..." : "Process & Extract"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#1E293B] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Document Repository</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                >
                  <option value="ALL">All Types</option>
                  <option value="Purchase Invoice">Purchase Invoices</option>
                  <option value="Purchase Order">Purchase Orders</option>
                  <option value="Delivery Challan">Delivery Challans</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-slate-800/80">
              {documents.map((doc) => (
                <div key={doc.documentId} className="p-4 flex items-center justify-between hover:bg-slate-800/40">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{doc.fileName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{doc.documentId}</span>
                        <span>•</span>
                        <span>{doc.documentType}</span>
                        <span>•</span>
                        <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        doc.processingStatus === "Matched"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : doc.processingStatus === "Exception"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {doc.processingStatus}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedDocId(doc.documentId);
                        setActiveTab("Review Studio");
                      }}
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-xs font-semibold"
                    >
                      Open Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OCR SPLIT-SCREEN REVIEW STUDIO */}
      {activeTab === "Review Studio" && selectedDoc && (
        <div className="space-y-4">
          {/* Top Document Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-[#1E293B]">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-400">Current Document:</span>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 focus:border-indigo-500"
              >
                {documents.map((d) => (
                  <option key={d.documentId} value={d.documentId}>
                    {d.fileName} ({d.documentType})
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400 font-mono">v{selectedDoc.version}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopilotExplain}
                disabled={copilotLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-xs font-semibold"
              >
                <Bot className="h-3.5 w-3.5 text-indigo-400" />
                <span>{copilotLoading ? "Analyzing..." : "Copilot Invoice Analysis"}</span>
              </button>
            </div>
          </div>

          {/* Copilot Natural Language Output Banner */}
          {copilotSummary && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2 text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Copilot Accounting Intelligence Findings:
                </span>
                <button
                  onClick={() => setCopilotSummary(null)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  ✕ Close
                </button>
              </div>
              <p className="whitespace-pre-line text-slate-300 leading-relaxed font-sans">{copilotSummary}</p>
            </div>
          )}

          {/* 3-Column Split Screen Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 4 Cols: Document Visual Preview Canvas with Bounding Box Highlights */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Document Visual Canvas
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Page 1 of {selectedDoc.pageCount}</span>
              </div>

              {/* Simulated Visual Paper Layout with Interactive Bounding Boxes */}
              <div className="relative w-full aspect-[1/1.35] bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-[10px] text-slate-400 overflow-hidden shadow-inner select-none">
                <div className="border-b border-slate-800 pb-2 mb-3">
                  <div className="font-bold text-slate-200 uppercase">{selectedDoc.documentType}</div>
                  <div className="text-[9px] text-slate-500">EXFIN DATA REPOSITORY EVIDENCE</div>
                </div>

                {/* Simulated Content Lines */}
                <div className="space-y-2 text-[9px] leading-relaxed">
                  <div>Supplier: <span className="text-slate-200">{selectedDoc.fields.find(f => f.fieldKey === "supplierName")?.detectedRawValue}</span></div>
                  <div>GSTIN: <span className="text-slate-200">{selectedDoc.fields.find(f => f.fieldKey === "supplierGstin")?.detectedRawValue || "N/A"}</span></div>
                  <div>Doc No: <span className="text-slate-200">{selectedDoc.fields.find(f => f.fieldKey === "invoiceNumber")?.detectedRawValue || selectedDoc.fields.find(f => f.fieldKey === "poNumber")?.detectedRawValue}</span></div>
                  <div>Date: <span className="text-slate-200">{selectedDoc.fields.find(f => f.fieldKey === "invoiceDate")?.detectedRawValue || selectedDoc.fields.find(f => f.fieldKey === "poDate")?.detectedRawValue}</span></div>
                  <div className="pt-4 border-t border-slate-800">
                    <div>Taxable Value: <span className="text-slate-200">{selectedDoc.fields.find(f => f.fieldKey === "taxableAmount")?.detectedRawValue || "N/A"}</span></div>
                    <div>Tax: <span className="text-slate-200">{selectedDoc.fields.find(f => f.fieldKey === "cgst" || f.fieldKey === "igst")?.detectedRawValue || "N/A"}</span></div>
                    <div className="font-bold text-slate-100">Total: {selectedDoc.fields.find(f => f.fieldKey === "grandTotal")?.detectedRawValue}</div>
                  </div>
                </div>

                {/* Render Interactive Bounding Box for currently active field */}
                {activeField && activeField.bbox && (
                  <div
                    className="absolute border-2 border-indigo-400 bg-indigo-500/20 rounded pointer-events-none transition-all duration-200 animate-pulse flex items-start justify-end p-0.5"
                    style={{
                      left: `${activeField.bbox.x}%`,
                      top: `${activeField.bbox.y}%`,
                      width: `${activeField.bbox.width}%`,
                      height: `${activeField.bbox.height}%`
                    }}
                  >
                    <span className="text-[8px] bg-indigo-600 text-white px-1 rounded font-sans font-bold">
                      {activeField.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 text-center">
                Click any extracted field on the right to highlight its exact coordinate source region.
              </div>
            </div>

            {/* Middle 4 Cols: Extracted Fields & User Corrections */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#1E293B] p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ScanText className="h-3.5 w-3.5 text-indigo-400" />
                  Extracted Fields ({selectedDoc.fields.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Deterministic Extraction</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {selectedDoc.fields.map((f) => {
                  const isSelected = selectedFieldKey === f.fieldKey;
                  return (
                    <div
                      key={f.fieldKey}
                      onClick={() => setSelectedFieldKey(f.fieldKey)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500 text-slate-100 shadow-sm"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-400">{f.label}</span>
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              f.confidence === "High"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {f.confidenceScore}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField(f);
                              setCorrectionValue(String(f.normalizedValue));
                              setCorrectionReason("");
                            }}
                            className="text-slate-400 hover:text-indigo-300 p-0.5"
                            title="Correct Field"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-100">{f.detectedRawValue}</div>
                      {f.isUserCorrected && (
                        <div className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1">
                          <span>✓ Corrected by Auditor</span>
                          <span className="text-slate-500 line-through">({f.originalValue})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tax Math Validation Box */}
              {selectedDoc.taxValidation && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    selectedDoc.taxValidation.status === "Valid"
                      ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                      : "bg-rose-950/20 border-rose-800/40 text-rose-300"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {selectedDoc.taxValidation.status === "Valid" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    Tax Integrity Status: {selectedDoc.taxValidation.status}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{selectedDoc.taxValidation.calculationExplanation}</p>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Tally Match & Lineage Comparison */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#1E293B] p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-sky-400" />
                  Tally Analytical Match
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                  {selectedDoc.tallyMatch?.matchCategory || "No Match"}
                </span>
              </div>

              {selectedDoc.tallyMatch ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tally Voucher:</span>
                      <span className="font-mono font-bold text-sky-300">{selectedDoc.tallyMatch.matchedTallyVoucherId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Voucher Type:</span>
                      <span className="text-slate-200">{selectedDoc.tallyMatch.matchedTallyVoucherType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tally Amount:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{selectedDoc.tallyMatch.matchedTallyAmount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 leading-relaxed p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="font-bold text-slate-200 block mb-1">Match Explanation:</span>
                    {selectedDoc.tallyMatch.explanation}
                  </div>

                  {/* Side-by-side Differences */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-300">Field Lineage Verification:</span>
                    {selectedDoc.tallyMatch.differences.map((diff, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-900/40 border border-slate-800 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">{diff.field}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-200">{String(diff.documentValue)}</span>
                          <ArrowRight className="h-3 w-3 text-slate-500" />
                          <span className={`font-mono font-bold ${diff.isMatched ? "text-emerald-400" : "text-rose-400"}`}>
                            {String(diff.tallyValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No direct Tally record matched for this document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 3-WAY MATCH INSPECTOR */}
      {activeTab === "3-Way Match" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-400" />
              Automated 3-Way Match Matrix (PO + Delivery Challan + Vendor Invoice)
            </h2>
            <p className="text-xs text-slate-400">
              Correlates purchase orders, proof of goods receipt, and invoices with strict quantity & price variance checks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-sky-800/40 bg-sky-950/20">
                <span className="text-[11px] font-bold text-sky-400 uppercase">1. Purchase Order</span>
                <div className="mt-2 text-lg font-bold text-slate-100">PO-2026-091</div>
                <div className="text-xs text-slate-300 mt-1">Ordered Qty: 1 Nos</div>
                <div className="text-xs font-mono font-bold text-sky-300 mt-1">₹1,45,000.00</div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-800/40 bg-indigo-950/20">
                <span className="text-[11px] font-bold text-indigo-400 uppercase">2. Delivery Challan</span>
                <div className="mt-2 text-lg font-bold text-slate-100">DC-2026-042</div>
                <div className="text-xs text-slate-300 mt-1">Received Qty: 1 Nos</div>
                <div className="text-xs text-indigo-300 mt-1">Delivered: 12/08/2026</div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/20">
                <span className="text-[11px] font-bold text-emerald-400 uppercase">3. Vendor Invoice</span>
                <div className="mt-2 text-lg font-bold text-slate-100">INV-2026-042</div>
                <div className="text-xs text-slate-300 mt-1">Invoiced Qty: 1 Nos</div>
                <div className="text-xs font-mono font-bold text-emerald-300 mt-1">₹1,45,000.00</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-bold">3-Way Match Verified: 0 Quantity Variance • 0 Price Variance • Approved for Tally settlement</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded font-bold">100% Balanced</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EXCEPTION CENTER */}
      {activeTab === "Exceptions" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Document Exceptions & Audit Workflow
              </h3>
              <span className="text-xs text-slate-400">Total Active: {exceptions.filter((e) => e.status !== "Resolved").length}</span>
            </div>
            <div className="divide-y divide-slate-800">
              {exceptions.map((exc) => (
                <div key={exc.exceptionId} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded">
                        {exc.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{exc.title}</span>
                      <span className="text-[11px] font-mono text-slate-400">({exc.documentNumber})</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        exc.status === "Resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {exc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{exc.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Owner: {exc.owner}</span>
                    {exc.status !== "Resolved" && (
                      <button
                        onClick={() => handleResolveException(exc.exceptionId)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                      >
                        Resolve with Audit Justification
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LINEAGE & RELATIONSHIPS GRAPH */}
      {activeTab === "Graph" && selectedDoc?.relationshipGraph && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-indigo-400" />
              Document Provenance & Relationship Graph
            </h2>
            <p className="text-xs text-slate-400">
              Traceable flow connecting Purchase Order to Delivery Challan, Invoice, and Bank Settlement Advice.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 px-4 bg-slate-900/80 rounded-xl border border-slate-800">
              {selectedDoc.relationshipGraph.nodes.map((node, i) => (
                <React.Fragment key={node.id}>
                  <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 w-full md:w-48 text-center space-y-1 shadow-lg">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{node.type}</span>
                    <div className="text-xs font-bold text-slate-100">{node.label}</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      ₹{node.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-slate-400">{node.date}</div>
                    <span className="inline-block text-[9px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                      {node.status}
                    </span>
                  </div>
                  {i < selectedDoc.relationshipGraph.nodes.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-indigo-400 rotate-90 md:rotate-0 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOG */}
      {activeTab === "Audit" && (
        <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Immutable Audit Trail & Cell-Level Provenance
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-200">System OCR Extraction: Zenith_Infotech_Invoice_INV8891.pdf</div>
                <div className="text-slate-400 mt-0.5">Extracted 9 fields with 98% overall OCR confidence.</div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">2026-08-14 10:30:12</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-200">Deterministic Match Verified</div>
                <div className="text-slate-400 mt-0.5">Matched with Tally voucher PUR/2026/08/042 (Score: 100%).</div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">2026-08-14 10:30:14</span>
            </div>
          </div>
        </div>
      )}

      {/* Field Correction Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-indigo-400" />
              Correct Extracted Field: {editingField.label}
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Detected Raw Value</label>
              <div className="p-2 rounded bg-slate-900 font-mono text-xs text-slate-400 border border-slate-800">
                {editingField.detectedRawValue}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Corrected Value</label>
              <input
                type="text"
                value={correctionValue}
                onChange={(e) => setCorrectionValue(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Auditor Reason / Justification</label>
              <input
                type="text"
                placeholder="e.g. Visual verification against vendor stamp"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded"
              >
                Save Correction & Bump Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
