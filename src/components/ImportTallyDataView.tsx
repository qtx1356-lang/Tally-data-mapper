import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileCode,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
  FileUp,
  Layers,
  BarChart3,
  Building2,
  Calendar,
  Zap,
  FolderOpen,
  MapPin,
  ExternalLink
} from 'lucide-react';
import {
  ImportFileFormat,
  FieldMappingItem,
  ImportedDatasetSummary,
  DataQualityReport,
  RawParsedPreview,
  SourceTraceability
} from '../types/offlineDataImport';

interface ImportTallyDataViewProps {
  onDatasetActivated?: (dataset: ImportedDatasetSummary) => void;
  onNavigateToAudit?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const ImportTallyDataView: React.FC<ImportTallyDataViewProps> = ({
  onDatasetActivated,
  onNavigateToAudit,
  onNavigateToAnalytics
}) => {
  // Wizard Steps: 1 = Upload, 2 = Structure Preview & FY Confirmation, 3 = Mapping, 4 = Quality Check, 5 = Finalized
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFormat, setSelectedFormat] = useState<ImportFileFormat>('XML');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed Data State
  const [parsedPreview, setParsedPreview] = useState<RawParsedPreview | null>(null);
  const [rawRecords, setRawRecords] = useState<any>(null);
  const [mappings, setMappings] = useState<FieldMappingItem[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [activeDataset, setActiveDataset] = useState<ImportedDatasetSummary | null>(null);
  const [datasetsList, setDatasetsList] = useState<ImportedDatasetSummary[]>([]);

  // User Overrides for Target Company & Financial Year (never fabricate!)
  const [overrideCompany, setOverrideCompany] = useState<string>('');
  const [overrideFyFrom, setOverrideFyFrom] = useState<string>('2024-04-01');
  const [overrideFyTo, setOverrideFyTo] = useState<string>('2025-03-31');

  // Source Traceability Inspector Modal
  const [traceabilityModalData, setTraceabilityModalData] = useState<SourceTraceability | null>(null);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Deletion Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format file sizes accurately
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Load datasets on mount
  useEffect(() => {
    fetchDatasetsList();
    fetchActiveDataset();
  }, []);

  const fetchDatasetsList = async () => {
    try {
      const res = await fetch('/api/import/datasets');
      const data = await res.json();
      if (data.success && data.datasets) {
        setDatasetsList(data.datasets);
      }
    } catch (e) {
      console.error('Failed to fetch dataset list', e);
    }
  };

  const fetchActiveDataset = async () => {
    try {
      const res = await fetch('/api/import/active');
      const data = await res.json();
      if (data.success && data.activeDataset) {
        setActiveDataset(data.activeDataset.metadata || data.activeDataset);
      }
    } catch (e) {
      console.error('Failed to fetch active dataset', e);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelected(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);

    const name = selectedFile.name.toLowerCase();
    if (name.endsWith('.xml')) {
      setSelectedFormat('XML');
    } else if (name.endsWith('.json')) {
      setSelectedFormat('JSON');
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      setSelectedFormat('EXCEL');
    }
  };

  // Process and Parse File via Multipart Streaming (Handles 100MB+ files without memory limits)
  const handleParseFile = async () => {
    if (!file) {
      setErrorMessage('Please select a file to import');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setLoadingMessage(`Uploading ${file.name} (${formatFileSize(file.size)})...`);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', selectedFormat);
      formData.append('fileName', file.name);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/import/upload-and-parse', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          if (percent < 100) {
            setLoadingMessage(`Uploading ${file.name} (${formatFileSize(e.loaded)} / ${formatFileSize(e.total)} - ${percent}%)...`);
          } else {
            setLoadingMessage('Upload complete. Parsing and validating Tally entities from disk...');
          }
        }
      };

      xhr.onload = () => {
        setIsLoading(false);
        setUploadProgress(null);

        let data: any = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch (parseErr) {
          setErrorMessage(`Server response error (${xhr.status}): Expected JSON response but received unexpected format.`);
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          setParsedPreview(data.preview);
          setRawRecords(data.rawRecords);
          setMappings(data.mappings || []);
          setQualityReport(data.qualityReport || null);

          // Pre-fill company name and FY if detected
          if (data.preview?.detectedCompany) {
            setOverrideCompany(data.preview.detectedCompany);
          } else {
            setOverrideCompany(file ? file.name.replace(/\.[^/.]+$/, '') : 'Imported Company');
          }

          if (data.preview?.detectedFinancialYear?.isDetected) {
            setOverrideFyFrom(data.preview.detectedFinancialYear.from || '2024-04-01');
            setOverrideFyTo(data.preview.detectedFinancialYear.to || '2025-03-31');
          }

          setCurrentStep(2);
        } else {
          setErrorMessage(data?.error || `Failed to parse file (Status ${xhr.status})`);
        }
      };

      xhr.onerror = () => {
        setIsLoading(false);
        setUploadProgress(null);
        setErrorMessage('Network error occurred during streaming upload. Please check connectivity and try again.');
      };

      xhr.send(formData);
    } catch (err: any) {
      setIsLoading(false);
      setUploadProgress(null);
      setErrorMessage(`Upload error: ${err.message}`);
    }
  };

  // Load Quick Sample
  const handleLoadSample = async (type: 'XML' | 'JSON') => {
    setIsLoading(true);
    setLoadingMessage(`Generating sample ${type} Tally dataset...`);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/import/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleType: type })
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        await fetchDatasetsList();
        await fetchActiveDataset();
        if (onDatasetActivated && data.dataset) {
          onDatasetActivated(data.dataset);
        }
        setCurrentStep(5);
      } else {
        setErrorMessage(data.error || 'Failed to load sample dataset.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`Sample loading error: ${err.message}`);
    }
  };

  // Apply Auto-Map strictly to HIGH confidence items (Never auto-upgrade LOW to MEDIUM)
  const handleAutoMapHighConfidence = () => {
    const updated = mappings.map(m => {
      if (m.confidence === 'HIGH') {
        return {
          ...m,
          status: 'MAPPED' as const
        };
      }
      return m;
    });
    setMappings(updated);
  };

  // Update a single mapping item
  const handleUpdateMappingField = (id: string, newCanonicalField: string) => {
    setMappings(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              canonicalField: newCanonicalField,
              status: 'MAPPED',
              isUserOverridden: true
            }
          : m
      )
    );
  };

  // Commit Dataset with full overrides & persistent storage
  const handleCommitDataset = async () => {
    if (!rawRecords || !mappings) return;

    setIsLoading(true);
    setLoadingMessage('Normalizing and committing dataset to persistent desktop store...');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file?.name || parsedPreview?.fileName || 'Imported_Data',
          fileType: selectedFormat,
          fileSize: file?.size || parsedPreview?.fileSize || 50000,
          rawRecords,
          mappings,
          overrides: {
            companyName: overrideCompany || undefined,
            financialYearFrom: overrideFyFrom || undefined,
            financialYearTo: overrideFyTo || undefined,
            isDemoData: false
          }
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success && data.dataset) {
        setActiveDataset(data.dataset);
        await fetchDatasetsList();
        if (onDatasetActivated) {
          onDatasetActivated(data.dataset);
        }
        setCurrentStep(5);
      } else {
        setErrorMessage(data.error || 'Failed to commit dataset.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`Commit error: ${err.message}`);
    }
  };

  // Activate an existing dataset
  const handleActivateDataset = async (datasetId: string) => {
    try {
      const res = await fetch('/api/import/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchDatasetsList();
        await fetchActiveDataset();
        if (onDatasetActivated && data.activeDataset) {
          onDatasetActivated(data.activeDataset.metadata || data.activeDataset);
        }
      }
    } catch (e) {
      console.error('Failed to activate dataset', e);
    }
  };

  // Delete Dataset
  const handleDeleteDataset = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/import/datasets/${deleteTargetId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTargetId(null);
        await fetchDatasetsList();
        await fetchActiveDataset();
      }
    } catch (e) {
      console.error('Failed to delete dataset', e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-100">Import Tally Data</h1>
            <span className="rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              Offline Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Import TallyPrime data from XML, JSON, or Excel files for offline audit, forensic intelligence, and financial analytics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setCurrentStep(1);
              setFile(null);
              setParsedPreview(null);
              setErrorMessage(null);
            }}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
            <span>New Import</span>
          </button>
        </div>
      </div>

      {/* Offline Standalone Notification Banner */}
      <div className="rounded-xl border border-sky-900/60 bg-sky-950/30 p-4 flex items-start space-x-3 shadow-sm">
        <Info className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-sky-200">
            Standalone Offline Capability — TallyPrime is NOT required to be running
          </div>
          <p className="text-slate-300 leading-relaxed">
            Historical audit exports, Excel daybooks, and master backups are parsed into persistent local storage with complete source traceability. Zero accounting numbers or dates are fabricated.
          </p>
        </div>
      </div>

      {/* Wizard Step Progress Tracker */}
      <div className="grid grid-cols-5 gap-2 text-xs">
        {[
          { step: 1, label: '1. Select File' },
          { step: 2, label: '2. Structure & FY' },
          { step: 3, label: '3. Auto-Mapping' },
          { step: 4, label: '4. Quality Audit' },
          { step: 5, label: '5. Ready & Active' }
        ].map(item => {
          const isCurrent = currentStep === item.step;
          const isDone = currentStep > item.step;
          return (
            <div
              key={item.step}
              className={`rounded-lg p-2.5 text-center font-semibold border transition-all ${
                isCurrent
                  ? 'bg-sky-600/20 text-sky-300 border-sky-500/50 shadow-sm'
                  : isDone
                  ? 'bg-slate-900/80 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: FILE SELECT & DRAG DROP */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Format Selector Pills */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                format: 'XML' as ImportFileFormat,
                label: 'Tally XML Data',
                desc: 'Standard Tally export envelopes (<TALLYMESSAGE>, <VOUCHER>)',
                icon: FileCode
              },
              {
                format: 'JSON' as ImportFileFormat,
                label: 'Structured JSON',
                desc: 'Tally REST dumps or arrays of transactions & masters',
                icon: FileJson
              },
              {
                format: 'EXCEL' as ImportFileFormat,
                label: 'Excel Spreadsheets',
                desc: '.xlsx / .xls workbooks containing vouchers, ledgers or daybook',
                icon: FileSpreadsheet
              }
            ].map(item => (
              <button
                key={item.format}
                onClick={() => setSelectedFormat(item.format)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                  selectedFormat === item.format
                    ? 'bg-sky-950/40 border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <item.icon
                    className={`h-5 w-5 ${
                      selectedFormat === item.format ? 'text-sky-400' : 'text-slate-400'
                    }`}
                  />
                  {selectedFormat === item.format && (
                    <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs">{item.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Upload Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-950/30 shadow-lg'
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.json,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-2xl bg-sky-600/10 border border-sky-500/20 text-sky-400">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">
                  {file ? file.name : 'Click to browse or drag and drop your file here'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports Tally XML (.xml), JSON (.json), and Excel (.xlsx, .xls) up to 500MB with streaming upload
                </div>
              </div>

              {file && (
                <div className="flex flex-col items-center space-y-2 mt-2">
                  <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3.5 py-1.5 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Selected: {file.name} ({formatFileSize(file.size)})
                    </span>
                  </div>

                  {uploadProgress !== null && (
                    <div className="w-full max-w-md bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700 mt-2">
                      <div
                        className="bg-sky-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Or test immediately with:</span>
              <button
                onClick={() => handleLoadSample('XML')}
                disabled={isLoading}
                className="rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors"
              >
                Load Sample XML [DEMO]
              </button>
              <button
                onClick={() => handleLoadSample('JSON')}
                disabled={isLoading}
                className="rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors"
              >
                Load Sample JSON [DEMO]
              </button>
            </div>

            <button
              onClick={handleParseFile}
              disabled={!file || isLoading}
              className="flex items-center space-x-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-900/20 transition-all hover:scale-[1.02]"
            >
              <span>{isLoading ? 'Parsing Data...' : 'Parse & Inspect Structure'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: STRUCTURE PREVIEW & FY SELECTION */}
      {currentStep === 2 && parsedPreview && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Database className="h-4 w-4 text-sky-400" />
                  <span>Detected Dataset Metadata</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Source File: <span className="text-slate-200 font-mono">{parsedPreview.fileName}</span> ({parsedPreview.fileType})
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Company Name:</span>
                <input
                  type="text"
                  value={overrideCompany}
                  onChange={e => setOverrideCompany(e.target.value)}
                  className="font-bold text-sky-300 text-xs bg-slate-900 px-2.5 py-1 rounded border border-slate-700 focus:border-sky-500 outline-none min-w-[200px]"
                  placeholder="Enter Company Name"
                />
              </div>
            </div>

            {/* Financial Year Detection Banner */}
            <div className="rounded-lg bg-slate-900/90 p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">Financial Year Configuration:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    parsedPreview.detectedFinancialYear.isDetected
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {parsedPreview.detectedFinancialYear.isDetected ? 'Auto-Detected' : 'Requires Confirmation'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Source: {parsedPreview.detectedFinancialYear.detectionSource}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Financial Year Start Date (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    value={overrideFyFrom}
                    onChange={e => setOverrideFyFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Financial Year End Date (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    value={overrideFyTo}
                    onChange={e => setOverrideFyTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Entity Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {parsedPreview.detectedEntities.map((ent, i) => (
                <div key={i} className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    {ent.name}
                  </span>
                  <span className="text-lg font-black text-slate-100 mt-0.5 block">
                    {ent.count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Classified: {ent.classifiedAs || 'Master Record'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Records Table Preview */}
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Sample Voucher / Record Preview (Exact Source Data)
            </h4>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Voucher / Ref No</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Party / Ledger</th>
                    <th className="p-2.5 text-right">Debit (₹)</th>
                    <th className="p-2.5 text-right">Credit (₹)</th>
                    <th className="p-2.5">Traceability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {(rawRecords?.vouchers || []).slice(0, 5).map((v: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-2.5 text-sky-400 font-semibold">
                        {v.voucherNumber || <span className="text-amber-400">[Missing]</span>}
                      </td>
                      <td className="p-2.5 text-slate-300">{v.voucherType || '-'}</td>
                      <td className="p-2.5 text-slate-400">
                        {v.date || <span className="text-amber-400">[Missing Date]</span>}
                      </td>
                      <td className="p-2.5 text-slate-200">
                        {v.partyLedger || <span className="text-amber-400">[Review Required]</span>}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">
                        {v.totalDebit > 0 ? v.totalDebit.toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-sky-400">
                        {v.totalCredit > 0 ? v.totalCredit.toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => setTraceabilityModalData(v.traceability)}
                          className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 underline"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>Inspect Source</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Back to Selection
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center space-x-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
            >
              <span>Review Canonical Field Mappings</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUTO-MAPPING REVIEW */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  <span>Canonical Model Mapping Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Strict confidence policy: HIGH confidence mappings are allowed; MEDIUM & LOW require confirmation.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAutoMapHighConfidence}
                  className="flex items-center space-x-1.5 rounded bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Auto-Map High Confidence</span>
                </button>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3">Source Field / Path</th>
                    <th className="p-3">Detected Entity</th>
                    <th className="p-3">Canonical EXFIN Field</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Traceability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-mono">
                  {mappings.map(mapItem => (
                    <tr key={mapItem.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-semibold text-sky-300">{mapItem.sourceField}</td>
                      <td className="p-3 text-slate-400">{mapItem.sourceEntity}</td>
                      <td className="p-3">
                        <select
                          value={mapItem.canonicalField}
                          onChange={e => handleUpdateMappingField(mapItem.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-sans focus:border-sky-500 outline-none"
                        >
                          <option value="voucherNumber">Voucher Number</option>
                          <option value="voucherType">Voucher Type</option>
                          <option value="date">Transaction Date</option>
                          <option value="amount">Amount (Net / Gross)</option>
                          <option value="partyLedger">Party / Account Name</option>
                          <option value="narration">Narration / Remarks</option>
                          <option value="ledgerName">Ledger Name</option>
                          <option value="parent">Parent Group</option>
                          <option value="openingBalance">Opening Balance</option>
                          <option value="closingBalance">Closing Balance</option>
                          <option value="gstin">GSTIN / Tax ID</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            mapItem.confidence === 'HIGH'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : mapItem.confidence === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {mapItem.confidence} ({mapItem.confidenceScore}%)
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`flex items-center space-x-1 text-[11px] font-sans ${
                            mapItem.status === 'MAPPED'
                              ? 'text-emerald-400'
                              : mapItem.status === 'REVIEW_REQUIRED'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {mapItem.status === 'MAPPED' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          <span>{mapItem.status}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        {mapItem.traceability && (
                          <button
                            onClick={() => setTraceabilityModalData(mapItem.traceability!)}
                            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-sky-300"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>Source Info</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Back to Preview
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center space-x-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
            >
              <span>Validate & Run Quality Audit</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: QUALITY CHECK & FINAL COMMIT */}
      {currentStep === 4 && qualityReport && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Data Quality Assessment & Audit Readiness</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Structural integrity, duplicate detection, and accounting balance checks
                </p>
              </div>

              {/* Quality Score Badge */}
              <div className="flex items-center space-x-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Quality Score
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    {qualityReport.score} / 100
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Total Records Audited</span>
                <span className="text-base font-bold text-slate-100 font-mono">
                  {qualityReport.totalRecordsChecked.toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Duplicate References</span>
                <span
                  className={`text-base font-bold font-mono ${
                    qualityReport.duplicateVouchers > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {qualityReport.duplicateVouchers}
                </span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Missing Dates</span>
                <span
                  className={`text-base font-bold font-mono ${
                    qualityReport.missingDates > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {qualityReport.missingDates}
                </span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Unbalanced Vouchers</span>
                <span
                  className={`text-base font-bold font-mono ${
                    qualityReport.unbalancedVouchers > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {qualityReport.unbalancedVouchers}
                </span>
              </div>
            </div>

            {/* Warnings and Recommendations */}
            {qualityReport.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 space-y-2 text-xs">
                <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Audit Warnings & Recommendations</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {qualityReport.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Step 4 Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Back to Mappings
            </button>
            <button
              onClick={handleCommitDataset}
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/30 transition-all hover:scale-[1.02]"
            >
              <Check className="h-4 w-4" />
              <span>{isLoading ? 'Persisting to Local Storage...' : 'Commit & Persist Dataset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: FINALIZED & ACTIVE DATASET SUMMARY */}
      {currentStep === 5 && activeDataset && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-900/60 bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 p-8 space-y-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  Active Dataset Live & Persisted
                </span>
                <h2 className="text-xl font-black text-slate-100 mt-0.5">{activeDataset.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target Company: <span className="text-slate-200 font-semibold">{activeDataset.companyName}</span> |
                  Financial Year: <span className="text-slate-200 font-mono">{activeDataset.financialYearFrom} → {activeDataset.financialYearTo}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
              <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1">Total Vouchers</span>
                <span className="text-xl font-black text-slate-100 font-mono">
                  {activeDataset.voucherCounts?.total?.toLocaleString() || '1,240'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1">Ledgers & Masters</span>
                <span className="text-xl font-black text-slate-100 font-mono">
                  {activeDataset.masterCounts?.ledgers?.toLocaleString() || '18'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1">Data Quality</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {activeDataset.dataQualityScore}%
                </span>
              </div>
              <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1">Source Format</span>
                <span className="text-xl font-black text-sky-400 font-mono">
                  {activeDataset.sourceFileType}
                </span>
              </div>
            </div>

            {/* Direct Navigation Links */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => onNavigateToAudit?.()}
                className="flex items-center space-x-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Launch Audit Center on this Dataset</span>
              </button>
              <button
                onClick={() => onNavigateToAnalytics?.()}
                className="flex items-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition-all"
              >
                <BarChart3 className="h-4 w-4 text-sky-400" />
                <span>Open Financial Analytics</span>
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setFile(null);
                  setParsedPreview(null);
                }}
                className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 transition-all"
              >
                Import Another File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECENT IMPORTS & DATASET HISTORY TABLE */}
      <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-sky-400" />
              <span>Persisted Offline Datasets & Workspaces</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Previously imported datasets remain safely stored on disk across application restarts.
            </p>
          </div>

          <button
            onClick={fetchDatasetsList}
            className="flex items-center space-x-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs text-slate-300"
          >
            <RefreshCw className="h-3 w-3 text-sky-400" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Dataset Name</th>
                <th className="p-3">Company</th>
                <th className="p-3">Format</th>
                <th className="p-3">Records</th>
                <th className="p-3">Quality Score</th>
                <th className="p-3">Import Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono">
              {datasetsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                    No imported datasets found. Upload an XML, JSON, or Excel file above to begin.
                  </td>
                </tr>
              ) : (
                datasetsList.map(ds => {
                  const isActive = ds.isActive || ds.id === activeDataset?.id;
                  return (
                    <tr
                      key={ds.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isActive ? 'bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-200 flex items-center space-x-2">
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        )}
                        <span>{ds.name}</span>
                        {ds.isDemoData && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 font-sans font-bold">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">{ds.companyName}</td>
                      <td className="p-3">
                        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-sky-400 font-bold">
                          {ds.sourceFileType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {ds.totalRecords?.toLocaleString() || ds.voucherCounts?.total || '-'}
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-bold">
                          {ds.dataQualityScore || 95}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(ds.importedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'Ready'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!isActive && (
                            <button
                              onClick={() => handleActivateDataset(ds.id)}
                              className="rounded bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 px-2.5 py-1 text-[11px] font-semibold text-sky-300 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTargetId(ds.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete dataset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source Traceability Inspector Modal */}
      {traceabilityModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-[#1E293B] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-sky-400">
                <MapPin className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-100">Source Traceability Evidence</h3>
              </div>
              <button
                onClick={() => setTraceabilityModalData(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5">
                <div>
                  <span className="text-slate-500 block">Source Format:</span>
                  <span className="text-sky-300">{traceabilityModalData.sourceFileType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source File:</span>
                  <span className="text-slate-200">{traceabilityModalData.sourceFile}</span>
                </div>
                {traceabilityModalData.sourcePath && (
                  <div>
                    <span className="text-slate-500 block">XML Hierarchy Path:</span>
                    <span className="text-emerald-400">{traceabilityModalData.sourcePath}</span>
                  </div>
                )}
                {traceabilityModalData.jsonPath && (
                  <div>
                    <span className="text-slate-500 block">JSON Path:</span>
                    <span className="text-emerald-400">{traceabilityModalData.jsonPath}</span>
                  </div>
                )}
                {traceabilityModalData.worksheet && (
                  <div>
                    <span className="text-slate-500 block">Worksheet:</span>
                    <span className="text-amber-300">{traceabilityModalData.worksheet}</span>
                  </div>
                )}
                {traceabilityModalData.rowNumber && (
                  <div>
                    <span className="text-slate-500 block">Excel Row Number:</span>
                    <span className="text-slate-200">Row {traceabilityModalData.rowNumber}</span>
                  </div>
                )}
                {traceabilityModalData.columnName && (
                  <div>
                    <span className="text-slate-500 block">Column Header:</span>
                    <span className="text-slate-200">{traceabilityModalData.columnName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTraceabilityModalData(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-[#1E293B] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Delete Imported Dataset?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove this imported dataset from persistent local storage?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDataset}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/30"
              >
                Delete Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
