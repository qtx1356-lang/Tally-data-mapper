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
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<RawParsedPreview | null>(null);
  const [rawRecords, setRawRecords] = useState<any>(null);
  const [mappings, setMappings] = useState<FieldMappingItem[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [activeDataset, setActiveDataset] = useState<ImportedDatasetSummary | null>(null);
  const [datasetsList, setDatasetsList] = useState<ImportedDatasetSummary[]>([]);

  // User Overrides for Target Company & Financial Year (never fabricate!)
  const [overrideCompany, setOverrideCompany] = useState<string>('');
  const [overrideFyFrom, setOverrideFyFrom] = useState<string>('');
  const [overrideFyTo, setOverrideFyTo] = useState<string>('');

  // Source Traceability Inspector Modal
  const [traceabilityModalData, setTraceabilityModalData] = useState<SourceTraceability | null>(null);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [forceChunkedDiagnostic, setForceChunkedDiagnostic] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any | null>(null);
  const [activeUploadSession, setActiveUploadSession] = useState<{
    uploadId: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    lastFailedChunk?: number;
  } | null>(null);

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
    setLoadingMessage(`Preparing upload...`);
    setErrorMessage(null);

    const CHUNK_THRESHOLD = forceChunkedDiagnostic ? (1024 * 1024) : (20 * 1024 * 1024); // 20 MB normal, 1 MB if forced diagnostic
    if (file.size > CHUNK_THRESHOLD) {
      await uploadChunkedFile(file);
    } else {
      await uploadStandardFile(file);
    }
  };

  const uploadChunkedFile = async (targetFile: File, customChunkSize?: number, resumeUploadId?: string) => {
    // 3 MB chunks for optimal reliability with large DayBook files
    const CHUNK_SIZE = customChunkSize || (3 * 1024 * 1024);
    const totalChunks = Math.ceil(targetFile.size / CHUNK_SIZE);
    let uploadId = resumeUploadId || (activeUploadSession?.fileName === targetFile.name && activeUploadSession?.fileSize === targetFile.size ? activeUploadSession.uploadId : '');
    const receivedChunksOnServer = new Set<number>();

    try {
      setDiagnosticReport(null);
      setLoadingMessage(`Checking large-file upload service...`);

      // STEP 1: Diagnostic health check
      try {
        const healthUrl = '/api/import/chunk/health';
        const healthRes = await fetch(healthUrl);
        const healthStatus = healthRes.status;
        const healthCt = healthRes.headers.get('content-type') || '';
        const healthText = await healthRes.text();

        console.log('[Chunk Upload Audit]', {
          method: 'GET',
          url: healthUrl,
          uploadId: '-',
          chunkIndex: '-',
          httpStatus: healthStatus,
          contentType: healthCt,
          body: healthText.substring(0, 300)
        });

        if (healthStatus !== 200 || !healthCt.includes('application/json')) {
          throw new Error(`Large-file upload service is unavailable — HTTP ${healthStatus}`);
        }
        let healthData: any;
        try {
          healthData = JSON.parse(healthText);
        } catch {
          throw new Error(`Large-file upload service is unavailable — HTTP ${healthStatus}`);
        }
        if (!healthData.success || !healthData.chunkUpload) {
          throw new Error('Large-file upload service is unavailable.');
        }
      } catch (hErr: any) {
        setIsLoading(false);
        setUploadProgress(null);
        setErrorMessage(hErr.message || 'Large-file upload service is unavailable.');
        return;
      }

      // STEP 2: Check existing session to support chunk resumption
      if (uploadId) {
        try {
          const statusRes = await fetch(`/api/import/chunk/status?uploadId=${encodeURIComponent(uploadId)}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.success && Array.isArray(statusData.receivedChunks)) {
              statusData.receivedChunks.forEach((idx: number) => receivedChunksOnServer.add(idx));
              console.log(`[Upload Resume] Resuming session ${uploadId}, already received: ${statusData.receivedChunks.length}/${totalChunks} chunks`);
            }
          }
        } catch (_) {}
      }

      // STEP 3: If no valid active session or resume failed, initialize new session
      if (!uploadId || receivedChunksOnServer.size === 0) {
        setLoadingMessage(`Initializing chunked upload for ${targetFile.name}...`);
        
        const initUrl = '/api/import/chunk/init';
        const initRes = await fetch(initUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalFilename: targetFile.name,
            totalFileSize: targetFile.size,
            totalChunks,
            mimeType: targetFile.type || 'application/json'
          })
        });

        const initStatus = initRes.status;
        const initCt = initRes.headers.get('content-type') || '';
        const initText = await initRes.text();

        console.log('[Chunk Upload Audit]', {
          method: 'POST',
          url: initUrl,
          uploadId: '-',
          chunkIndex: '-',
          httpStatus: initStatus,
          contentType: initCt,
          body: initText.substring(0, 300)
        });

        if (initStatus < 200 || initStatus >= 300) {
          throw new Error(`Upload initialization failed — HTTP ${initStatus}${initText ? `: ${initText.substring(0, 100)}` : ''}`);
        }

        if (!initCt.includes('application/json')) {
          throw new Error(`Upload initialization failed — HTTP ${initStatus}: Expected JSON but received ${initCt}`);
        }

        let initData: any;
        try {
          initData = JSON.parse(initText);
        } catch {
          throw new Error(`Upload initialization failed — invalid JSON response from server`);
        }

        if (!initData.success || !initData.uploadId) {
          throw new Error(initData.error || `Upload initialization failed — HTTP ${initStatus}`);
        }

        uploadId = initData.uploadId;
        receivedChunksOnServer.clear();
        setActiveUploadSession({ uploadId, fileName: targetFile.name, fileSize: targetFile.size, totalChunks });
      }

      let uploadedBytes = 0;
      // Precompute uploaded bytes for skipped chunks
      for (let i = 0; i < totalChunks; i++) {
        if (receivedChunksOnServer.has(i)) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, targetFile.size);
          uploadedBytes += (end - start);
        }
      }

      const totalMbStr = (targetFile.size / (1024 * 1024)).toFixed(1);

      // STEP 4: Upload chunks sequentially with retry policy
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, targetFile.size);
        const chunkBlob = targetFile.slice(start, end);
        const currentChunkBytes = end - start;

        // Skip chunks already persisted on server disk
        if (receivedChunksOnServer.has(i)) {
          console.log(`[Chunk Upload] Chunk ${i + 1}/${totalChunks} already on server. Skipping.`);
          continue;
        }

        let chunkSuccess = false;
        let attempt = 0;
        const maxAttempts = 3;
        let lastErrorMsg = '';

        while (!chunkSuccess && attempt < maxAttempts) {
          attempt++;
          try {
            const currentMbStr = (uploadedBytes / (1024 * 1024)).toFixed(1);
            setLoadingMessage(`Uploading ${targetFile.name}\nChunk ${i + 1} of ${totalChunks}\n${currentMbStr} MB / ${totalMbStr} MB`);

            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              const url = `/api/import/chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${i}&totalChunks=${totalChunks}&totalFileSize=${targetFile.size}&originalFilename=${encodeURIComponent(targetFile.name)}`;
              
              xhr.open('POST', url, true);
              xhr.timeout = 60000; // 60s timeout
              xhr.setRequestHeader('Content-Type', 'application/octet-stream');
              xhr.setRequestHeader('X-Upload-Id', uploadId);
              xhr.setRequestHeader('X-Chunk-Index', i.toString());
              xhr.setRequestHeader('X-Total-Chunks', totalChunks.toString());
              xhr.setRequestHeader('X-Original-Filename', encodeURIComponent(targetFile.name));
              xhr.setRequestHeader('X-Total-File-Size', targetFile.size.toString());

              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const totalLoadedSoFar = uploadedBytes + e.loaded;
                  const percent = Math.min(99, Math.round((totalLoadedSoFar / targetFile.size) * 100));
                  setUploadProgress(percent);
                  const soFarMbStr = (totalLoadedSoFar / (1024 * 1024)).toFixed(1);
                  setLoadingMessage(`Uploading ${targetFile.name}\nChunk ${i + 1} of ${totalChunks}\n${soFarMbStr} MB / ${totalMbStr} MB`);
                }
              };

              xhr.onload = () => {
                const status = xhr.status;
                const ct = xhr.getResponseHeader('Content-Type') || '';
                const responseText = xhr.responseText || '';

                console.log('[Chunk Upload Audit]', {
                  method: 'POST',
                  url,
                  uploadId,
                  chunkIndex: i,
                  httpStatus: status,
                  contentType: ct,
                  body: responseText.substring(0, 300)
                });

                if (status >= 200 && status < 300) {
                  if (!ct.includes('application/json')) {
                    reject(new Error(`Chunk ${i + 1} failed — HTTP ${status}: Non-JSON response received`));
                    return;
                  }
                  try {
                    const data = JSON.parse(responseText);
                    if (data.success) {
                      resolve();
                    } else {
                      reject(new Error(data.error || `Chunk ${i + 1} failed — HTTP ${status}`));
                    }
                  } catch {
                    reject(new Error(`Chunk ${i + 1} failed — HTTP ${status}: Invalid JSON response`));
                  }
                  return;
                }

                // Specific actionable HTTP error status codes
                if (status === 503) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP 503 (Service Unavailable). The upload server became temporarily unavailable. Retry will resume from chunk ${i + 1}.`));
                } else if (status === 502) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP 502 (Bad Gateway). Gateway interrupted. Retry will resume from chunk ${i + 1}.`));
                } else if (status === 504) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP 504 (Gateway Timeout). Request timed out. Retry will resume from chunk ${i + 1}.`));
                } else if (status === 500) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP 500 (Internal Server Error). Retry will resume from chunk ${i + 1}.`));
                } else if (status === 413) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP 413 (Payload Too Large). Chunk exceeded maximum allowed size.`));
                } else if (status === 404) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP 404 (Session Expired). Upload session not found on server.`));
                } else if (status === 422 || status === 400) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP ${status}: ${responseText.substring(0, 100) || 'Invalid request'}`));
                } else {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP ${status}${responseText ? `: ${responseText.substring(0, 80)}` : ''}`));
                }
              };

              xhr.onerror = () => {
                console.error('[Chunk Upload Audit Error]', {
                  method: 'POST',
                  url,
                  uploadId,
                  chunkIndex: i,
                  httpStatus: xhr.status || 0,
                  contentType: xhr.getResponseHeader('Content-Type') || '',
                  body: xhr.responseText || ''
                });
                if (xhr.status > 0) {
                  reject(new Error(`Chunk ${i + 1} failed — HTTP ${xhr.status}. Retry will resume from chunk ${i + 1}.`));
                } else {
                  reject(new Error(`Chunk ${i + 1} failed — Connection reset / network error (HTTP status 0). Server endpoint unreachable or connection interrupted. Retry will resume from chunk ${i + 1}.`));
                }
              };

              xhr.ontimeout = () => {
                console.error('[Chunk Upload Audit Timeout]', {
                  method: 'POST',
                  url,
                  uploadId,
                  chunkIndex: i,
                  httpStatus: 408,
                  contentType: '',
                  body: 'Timeout'
                });
                reject(new Error(`Chunk ${i + 1} failed — request timed out after 60s. Retry will resume from chunk ${i + 1}.`));
              };

              // Send raw Blob directly as binary body
              xhr.send(chunkBlob);
            });

            chunkSuccess = true;
            receivedChunksOnServer.add(i);
            uploadedBytes += currentChunkBytes;
            const progressPercent = Math.min(100, Math.round((uploadedBytes / targetFile.size) * 100));
            setUploadProgress(progressPercent);
          } catch (err: any) {
            lastErrorMsg = err.message || `Chunk ${i + 1} of ${totalChunks} failed`;
            console.warn(`[Chunk Upload Retry] Chunk ${i + 1} attempt ${attempt}/${maxAttempts} failed: ${lastErrorMsg}`);
            
            const isNonRetryable = lastErrorMsg.includes('400') || lastErrorMsg.includes('404') || lastErrorMsg.includes('413') || lastErrorMsg.includes('422');
            
            if (!isNonRetryable && attempt < maxAttempts) {
              const backoffMs = attempt === 1 ? 1000 : (attempt === 2 ? 2000 : 4000);
              setLoadingMessage(`Chunk ${i + 1} of ${totalChunks} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${backoffMs / 1000}s...`);
              await new Promise(r => setTimeout(r, backoffMs));
            } else {
              setActiveUploadSession(prev => prev ? { ...prev, lastFailedChunk: i } : { uploadId, fileName: targetFile.name, fileSize: targetFile.size, totalChunks, lastFailedChunk: i });
              throw new Error(lastErrorMsg);
            }
          }
        }
      }

      setLoadingMessage(`Upload complete — processing ${targetFile.name}`);
      setUploadProgress(100);

      const completeUrl = '/api/import/chunk/complete';
      const completeRes = await fetch(completeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          originalFilename: targetFile.name,
          totalFileSize: targetFile.size,
          totalChunks,
          fileType: selectedFormat
        })
      });

      const completeStatus = completeRes.status;
      const completeCt = completeRes.headers.get('content-type') || '';
      const completeText = await completeRes.text();

      console.log('[Chunk Upload Audit]', {
        method: 'POST',
        url: completeUrl,
        uploadId,
        chunkIndex: '-',
        httpStatus: completeStatus,
        contentType: completeCt,
        body: completeText.substring(0, 300)
      });

      let completeData: any = null;
      if (completeCt.includes('application/json')) {
        try {
          completeData = JSON.parse(completeText);
        } catch (_) {}
      }

      if (completeStatus < 200 || completeStatus >= 300 || !completeData?.success) {
        if (completeData?.diagnostic) {
          setDiagnosticReport({
            code: completeData.code,
            error: completeData.error,
            assembly: completeData.assembly,
            diagnostic: completeData.diagnostic
          });
        }
        const errDetail = completeData?.error || (completeText ? completeText.substring(0, 160) : `HTTP ${completeStatus}`);
        const codePrefix = completeData?.code ? `[${completeData.code}] ` : '';
        throw new Error(`${codePrefix}${errDetail}`);
      }

      setActiveUploadSession(null);
      handleSuccessfulParse(completeData, targetFile);

    } catch (err: any) {
      setIsLoading(false);
      setUploadProgress(null);
      setErrorMessage(err.message.startsWith('Upload error:') ? err.message : `Upload error: ${err.message}`);
    }
  };

  // Diagnostic runner: generates a 3.2 MB synthetic Tally DayBook JSON and tests chunked pipeline
  const handleRun3MBChunkDiagnostic = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setUploadProgress(0);
    try {
      const vouchers = [];
      const partyNames = ['Sharma Enterprises', 'Gupta Traders', 'Apex Logistics', 'Reliable Tech', 'Zenith Motors', 'National Stores'];
      for (let i = 1; i <= 3600; i++) {
        const party = partyNames[i % partyNames.length];
        vouchers.push({
          VoucherNumber: `VCH-${i}`,
          Date: `2025-${String((i % 12) + 1).padStart(2, '0')}-15`,
          VoucherType: i % 4 === 0 ? 'Sales' : i % 4 === 1 ? 'Purchase' : i % 4 === 2 ? 'Receipt' : 'Payment',
          PartyLedgerName: party,
          Amount: 1500 + (i * 12.5),
          Narration: `Diagnostic test transaction ${i} with ledger audit reconciliation for 3MB test.`
        });
      }
      const payload = {
        Header: {
          Company: 'EXFIN Diagnostic Corporation',
          FinancialYear: '2025-04-01 to 2026-03-31',
          Source: 'TallyPrime Export Diagnostic'
        },
        DayBook: vouchers
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const dummyFile = new File([blob], 'Diagnostic_3MB_DayBook.json', { type: 'application/json' });
      setSelectedFormat('JSON');
      setFile(dummyFile);
      // Upload using 1 MB chunks to deliberately test multiple chunks
      await uploadChunkedFile(dummyFile, 1 * 1024 * 1024);
    } catch (err: any) {
      setIsLoading(false);
      setUploadProgress(null);
      setErrorMessage(`Diagnostic test error: ${err.message}`);
    }
  };

  const uploadStandardFile = async (targetFile: File) => {
    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('fileType', selectedFormat);
      formData.append('fileName', targetFile.name);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/import/upload-and-parse', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          if (percent < 100) {
            setLoadingMessage(`Uploading ${targetFile.name} (${formatFileSize(e.loaded)} / ${formatFileSize(e.total)} - ${percent}%)...`);
          } else {
            setLoadingMessage('Upload complete. Parsing and validating Tally entities from disk...');
          }
        }
      };

      xhr.onload = () => {
        setIsLoading(false);
        setUploadProgress(null);

        const contentType = xhr.getResponseHeader('Content-Type') || '';
        if (!contentType.includes('application/json')) {
          setErrorMessage(`Server response error (${xhr.status}): Expected JSON response but received unexpected format: ${contentType}`);
          return;
        }

        let data: any = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch (parseErr) {
          setErrorMessage(`Server response error (${xhr.status}): Expected JSON response but received unexpected format.`);
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          handleSuccessfulParse(data, targetFile);
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

  const handleSuccessfulParse = (data: any, targetFile: File) => {
    setIsLoading(false);
    setUploadProgress(null);
    setImportSessionId(data.importSessionId || null);
    setParsedPreview(data.preview);
    setRawRecords(null);
    setMappings(data.mappings || []);
    setQualityReport(data.qualityReport || null);

    if (data.preview?.detectedCompany) {
      setOverrideCompany(data.preview.detectedCompany);
    } else {
      setOverrideCompany(targetFile ? targetFile.name.replace(/\.[^/.]+$/, '') : 'Imported Company');
    }

    if (data.preview?.detectedFinancialYear?.isDetected && data.preview.detectedFinancialYear.from && data.preview.detectedFinancialYear.to) {
      setOverrideFyFrom(data.preview.detectedFinancialYear.from);
      setOverrideFyTo(data.preview.detectedFinancialYear.to);
    } else {
      setOverrideFyFrom('');
      setOverrideFyTo('');
    }

    setCurrentStep(2);
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

  // Commit Dataset with full overrides & persistent storage via importSessionId
  const handleCommitDataset = async () => {
    if ((!importSessionId && !rawRecords) || !mappings) return;

    setIsLoading(true);
    setLoadingMessage('Normalizing and committing dataset to persistent desktop store...');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importSessionId: importSessionId || undefined,
          fileName: file?.name || parsedPreview?.fileName || 'Imported_Data',
          fileType: selectedFormat,
          fileSize: file?.size || parsedPreview?.fileSize || 50000,
          rawRecords: importSessionId ? undefined : rawRecords,
          mappings,
          overrides: {
            companyName: overrideCompany.trim() || undefined,
            financialYearFrom: overrideFyFrom.trim() || undefined,
            financialYearTo: overrideFyTo.trim() || undefined,
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

      {/* Error Alert with Resume Option */}
      {errorMessage && (
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          {activeUploadSession && file && (
            <button
              onClick={() => {
                setErrorMessage(null);
                setIsLoading(true);
                uploadChunkedFile(file, undefined, activeUploadSession.uploadId);
              }}
              disabled={isLoading}
              className="flex-shrink-0 flex items-center space-x-1.5 rounded-lg border border-rose-500/50 bg-rose-900/40 hover:bg-rose-800/60 px-3 py-1.5 font-bold text-rose-100 transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Resume Upload from Chunk {(activeUploadSession.lastFailedChunk ?? 0) + 1}</span>
            </button>
          )}
        </div>
      )}

      {/* Structural Diagnostics Panel if vouchers were not found or structure failed */}
      {diagnosticReport && (
        <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-xs text-amber-200 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Diagnostic Analysis — Structure & File Audit</span>
            </div>
            {diagnosticReport.assembly?.sha256 && (
              <span className="font-mono text-[10px] text-slate-400">
                SHA-256: {diagnosticReport.assembly.sha256.substring(0, 16)}...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Assembly Status</span>
              <span className="font-semibold text-emerald-400">
                {diagnosticReport.assembly?.assembled ? 'Assembled OK' : 'Failed'}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Assembled Size</span>
              <span className="font-semibold text-slate-200">
                {formatFileSize(diagnosticReport.assembly?.assembledSize || 0)}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Root JSON Type</span>
              <span className="font-semibold text-sky-400 font-mono">
                {diagnosticReport.diagnostic?.rootType || 'Unknown'}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Bytes Inspected</span>
              <span className="font-semibold text-slate-200">
                {formatFileSize(diagnosticReport.diagnostic?.inspectedBytes || 0)}
              </span>
            </div>
          </div>

          {diagnosticReport.diagnostic?.topLevelKeys && diagnosticReport.diagnostic.topLevelKeys.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                Top-Level Keys Detected:
              </span>
              <div className="flex flex-wrap gap-1">
                {diagnosticReport.diagnostic.topLevelKeys.map((k: string) => (
                  <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-amber-300">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.diagnostic?.voucherArrayCandidateKeys && diagnosticReport.diagnostic.voucherArrayCandidateKeys.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                Array Keys Detected in Sample:
              </span>
              <div className="flex flex-wrap gap-1">
                {diagnosticReport.diagnostic.voucherArrayCandidateKeys.map((k: string) => (
                  <span key={k} className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 font-mono text-[11px] text-sky-300">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.diagnostic?.summary && (
            <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-900/40 p-2.5 rounded border border-slate-800">
              {diagnosticReport.diagnostic.summary}
            </p>
          )}
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Quick test:</span>
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
              <button
                onClick={handleRun3MBChunkDiagnostic}
                disabled={isLoading}
                className="rounded border border-amber-600/60 bg-amber-950/40 hover:bg-amber-900/50 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors"
                title="Tests multi-chunk upload, health check, assembly and parsing with a 3 MB file"
              >
                Test 3 MB Chunked [DIAGNOSTIC]
              </button>
              <label className="flex items-center space-x-1.5 text-xs text-slate-400 ml-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceChunkedDiagnostic}
                  onChange={(e) => setForceChunkedDiagnostic(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0"
                />
                <span>Force Chunk Mode</span>
              </label>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">Financial Year Configuration:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    parsedPreview.detectedFinancialYear.isDetected
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {parsedPreview.detectedFinancialYear.isDetected ? 'Auto-Detected in Source' : 'Review Required — Not Detected in Source'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Source: {parsedPreview.detectedFinancialYear.detectionSource}
                </span>
              </div>

              {!parsedPreview.detectedFinancialYear.isDetected && (
                <div className="rounded border border-amber-900/50 bg-amber-950/20 p-2.5 text-xs text-amber-200 flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Financial Year was not detected in the source data.</p>
                    <p className="text-[11px] text-amber-300/80">
                      In accordance with EXFIN's zero-data-fabrication policy, no default financial year (e.g. 2024-25) is assumed. You may enter dates manually, apply the derived date suggestion below, or leave empty.
                    </p>
                  </div>
                </div>
              )}

              {/* Inferred suggestion banner if dates are present in vouchers */}
              {!parsedPreview.detectedFinancialYear.isDetected && parsedPreview.detectedFinancialYear.inferredSuggestion && (
                <div className="rounded border border-sky-900/40 bg-sky-950/20 p-2.5 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-300 font-medium">Derived from transaction dates </span>
                    <span className="text-slate-400 text-[11px]">
                      ({parsedPreview.detectedFinancialYear.inferredSuggestion.minDate} → {parsedPreview.detectedFinancialYear.inferredSuggestion.maxDate}):{' '}
                    </span>
                    <span className="text-sky-300 font-mono font-bold">
                      {parsedPreview.detectedFinancialYear.inferredSuggestion.from} to {parsedPreview.detectedFinancialYear.inferredSuggestion.to}
                    </span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-900/40 text-sky-400 border border-sky-800">
                      Inferred — Review Required
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (parsedPreview?.detectedFinancialYear?.inferredSuggestion) {
                        setOverrideFyFrom(parsedPreview.detectedFinancialYear.inferredSuggestion.from);
                        setOverrideFyTo(parsedPreview.detectedFinancialYear.inferredSuggestion.to);
                      }
                    }}
                    className="flex-shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-200 transition-colors"
                  >
                    Apply Inferred FY
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Financial Year Start Date (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    value={overrideFyFrom}
                    onChange={e => setOverrideFyFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 outline-none"
                  />
                  {!overrideFyFrom && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Optional: Leave empty if unassigned</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Financial Year End Date (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    value={overrideFyTo}
                    onChange={e => setOverrideFyTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 outline-none"
                  />
                  {!overrideFyTo && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Optional: Leave empty if unassigned</span>
                  )}
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
                  {((parsedPreview?.sampleRecords || parsedPreview?.rawSampleData?.vouchers || rawRecords?.vouchers || []) as any[]).slice(0, 5).map((v: any, idx: number) => {
                    const debitAmount = v.totalDebit !== undefined ? v.totalDebit : (v.isDebit === true ? v.amount : 0);
                    const creditAmount = v.totalCredit !== undefined ? v.totalCredit : (v.isDebit === false ? v.amount : 0);
                    return (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-2.5 text-sky-400 font-semibold">
                        {v.voucherNumber || <span className="text-amber-400">[Missing]</span>}
                      </td>
                      <td className="p-2.5 text-slate-300">{v.voucherType || '-'}</td>
                      <td className="p-2.5 text-slate-400">
                        {v.date || <span className="text-amber-400">[Missing Date]</span>}
                      </td>
                      <td className="p-2.5 text-slate-200">
                        {v.partyLedger || v.partyLedgerName || <span className="text-amber-400">[Review Required]</span>}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">
                        {debitAmount > 0 ? debitAmount.toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-sky-400">
                        {creditAmount > 0 ? creditAmount.toLocaleString('en-IN') : '-'}
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
                    );
                  })}
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
                <th className="p-3">Financial Year</th>
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
                  <td colSpan={9} className="p-6 text-center text-slate-500 font-sans">
                    No imported datasets found. Upload an XML, JSON, or Excel file above to begin.
                  </td>
                </tr>
              ) : (
                datasetsList.map(ds => {
                  const isActive = ds.isActive || ds.id === activeDataset?.id;
                  const hasFy = Boolean(ds.financialYearFrom && ds.financialYearTo);
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
                        {hasFy ? (
                          <span className="text-slate-200 font-mono text-xs">
                            {ds.financialYearFrom} → {ds.financialYearTo}
                          </span>
                        ) : (
                          <span className="rounded bg-amber-950/60 border border-amber-800 text-amber-300 px-2 py-0.5 text-[10px] font-sans font-semibold">
                            Not Detected (Review Required)
                          </span>
                        )}
                      </td>
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
