/**
 * EXFIN Tally Audit Platform - Import Session Manager
 * 
 * Provides disk-persisted session management for offline Tally imports.
 * Eliminates the need to send entire datasets (e.g. 126.5 MB JSON) back to the browser.
 * 
 * Flow:
 * 1. Upload & Parse -> Session created in data/import_sessions/<sessionId>/
 * 2. Return ONLY bounded preview (50 records), counts, mappings, and quality report
 * 3. Browser confirms mappings & financial year
 * 4. Commit via importSessionId -> server loads records directly from session disk,
 *    commits to persistent storage (data/offline_datasets/), and cleans up temporary session.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  CanonicalDatasetRecord, 
  CanonicalVoucher,
  CanonicalVoucherLine,
  CanonicalAuditException,
  FieldMappingItem, 
  DataQualityReport, 
  ImportFileFormat,
  ImportedDatasetSummary
} from '../types/offlineDataImport';
import { 
  offlineDataImportEngine, 
  OfflineDataImportEngine,
  STREAMING_SIZE_THRESHOLD_BYTES,
  StreamingJsonParser 
} from './offlineDataImportEngine';

export interface ImportSessionProgress {
  phase: 'Uploading' | 'Processing' | 'Normalizing' | 'Mapping' | 'Quality Check' | 'Finalizing' | 'Completed' | 'Failed';
  recordsProcessed: number;
  totalEstimatedRecords?: number;
  bytesRead?: number;
  totalBytes?: number;
  percent: number;
  error?: string;
  message?: string;
}

export interface ImportSessionMeta {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  status: 'INITIALIZING' | 'PARSING' | 'PARSED' | 'COMMITTED' | 'FAILED' | 'ABANDONED';
  fileName: string;
  fileType: ImportFileFormat;
  fileSize: number;
  progress: ImportSessionProgress;
  detectedCompany: string | null;
  detectedFinancialYear: {
    from: string | null;
    to: string | null;
    isDetected: boolean;
    status: 'DETECTED' | 'REVIEW_REQUIRED';
    derivedFromVouchersSuggestion?: {
      earliestVoucherDate: string;
      latestVoucherDate: string;
    };
  };
  counts: {
    vouchers: number;
    ledgers: number;
    stockItems: number;
    totalDebit: number;
    totalCredit: number;
  };
  isBalanced: boolean;
  balanceDifference: number;
}

export class ImportSessionManager {
  private baseDir: string;
  private inMemoryProgress: Map<string, ImportSessionProgress> = new Map();

  constructor(customDir?: string) {
    this.baseDir = customDir || path.join(process.cwd(), 'data', 'import_sessions');
    this.ensureDirExists();
    // Run initial cleanup of abandoned sessions on startup
    this.cleanupAbandonedSessions(24 * 60 * 60 * 1000);
  }

  private ensureDirExists() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (e) {
      console.warn('[ImportSessionManager] Could not create session base directory:', e);
    }
  }

  private getSessionDir(sessionId: string): string {
    return path.join(this.baseDir, sessionId);
  }

  /**
   * Create a new import session on disk
   */
  public createSession(fileName: string, fileType: ImportFileFormat, fileSize: number): ImportSessionMeta {
    const sessionId = `import_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const sessionDir = this.getSessionDir(sessionId);

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const initialProgress: ImportSessionProgress = {
      phase: 'Uploading',
      recordsProcessed: 0,
      percent: 0,
      message: `Receiving ${fileName}...`
    };

    const meta: ImportSessionMeta = {
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'INITIALIZING',
      fileName,
      fileType,
      fileSize,
      progress: initialProgress,
      detectedCompany: null,
      detectedFinancialYear: {
        from: null,
        to: null,
        isDetected: false,
        status: 'REVIEW_REQUIRED'
      },
      counts: {
        vouchers: 0,
        ledgers: 0,
        stockItems: 0,
        totalDebit: 0,
        totalCredit: 0
      },
      isBalanced: true,
      balanceDifference: 0
    };

    this.inMemoryProgress.set(sessionId, initialProgress);
    fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

    return meta;
  }

  /**
   * Update active progress for a session
   */
  public updateProgress(sessionId: string, progress: Partial<ImportSessionProgress>): void {
    const current = this.inMemoryProgress.get(sessionId) || {
      phase: 'Processing',
      recordsProcessed: 0,
      percent: 0
    };

    const updated = { ...current, ...progress };
    this.inMemoryProgress.set(sessionId, updated);

    // Save to disk meta if session directory exists
    const sessionDir = this.getSessionDir(sessionId);
    const metaPath = path.join(sessionDir, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const meta: ImportSessionMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        meta.progress = updated;
        meta.updatedAt = new Date().toISOString();
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      } catch (e) {
        // Silently skip if disk write collides
      }
    }
  }

  public getProgress(sessionId: string): ImportSessionProgress | null {
    if (this.inMemoryProgress.has(sessionId)) {
      return this.inMemoryProgress.get(sessionId)!;
    }
    const meta = this.getSessionMeta(sessionId);
    return meta ? meta.progress : null;
  }

  /**
   * Save parsed session data (metadata, preview, mappings, quality report, records on disk)
   */
  public saveSessionParsedData(
    sessionId: string,
    metaUpdates: Partial<ImportSessionMeta>,
    preview: any,
    mappings: FieldMappingItem[],
    qualityReport: DataQualityReport,
    rawRecordsOrFilePath: any | string
  ): void {
    const sessionDir = this.getSessionDir(sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // If a records file path is provided, move or keep it in sessionDir/records.json
    const recordsTarget = path.join(sessionDir, 'records.json');
    if (typeof rawRecordsOrFilePath === 'string') {
      if (rawRecordsOrFilePath !== recordsTarget) {
        if (fs.existsSync(rawRecordsOrFilePath)) {
          fs.copyFileSync(rawRecordsOrFilePath, recordsTarget);
          try { fs.unlinkSync(rawRecordsOrFilePath); } catch (e) {}
        }
      }
    } else {
      // Save object to disk
      fs.writeFileSync(recordsTarget, JSON.stringify(rawRecordsOrFilePath), 'utf-8');
    }

    // Save preview, mappings, and quality report
    fs.writeFileSync(path.join(sessionDir, 'preview.json'), JSON.stringify(preview, null, 2), 'utf-8');
    fs.writeFileSync(path.join(sessionDir, 'mappings.json'), JSON.stringify(mappings, null, 2), 'utf-8');
    fs.writeFileSync(path.join(sessionDir, 'quality.json'), JSON.stringify(qualityReport, null, 2), 'utf-8');

    // Update meta.json
    const metaPath = path.join(sessionDir, 'meta.json');
    let meta: ImportSessionMeta;
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } else {
      meta = {
        sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'PARSED',
        fileName: metaUpdates.fileName || 'imported_dataset',
        fileType: metaUpdates.fileType || 'JSON',
        fileSize: metaUpdates.fileSize || 0,
        progress: { phase: 'Completed', recordsProcessed: 0, percent: 100 },
        detectedCompany: null,
        detectedFinancialYear: { from: null, to: null, isDetected: false, status: 'REVIEW_REQUIRED' },
        counts: { vouchers: 0, ledgers: 0, stockItems: 0, totalDebit: 0, totalCredit: 0 },
        isBalanced: true,
        balanceDifference: 0
      };
    }

    Object.assign(meta, metaUpdates);
    meta.status = 'PARSED';
    meta.updatedAt = new Date().toISOString();
    meta.progress = {
      phase: 'Completed',
      recordsProcessed: meta.counts?.vouchers || 0,
      percent: 100,
      message: 'Parsing and validation complete'
    };
    this.inMemoryProgress.set(sessionId, meta.progress);

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  }

  public getSessionMeta(sessionId: string): ImportSessionMeta | null {
    const metaPath = path.join(this.getSessionDir(sessionId), 'meta.json');
    if (!fs.existsSync(metaPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  public getSessionPreview(sessionId: string): any | null {
    const pPath = path.join(this.getSessionDir(sessionId), 'preview.json');
    if (!fs.existsSync(pPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(pPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  public getSessionMappings(sessionId: string): FieldMappingItem[] | null {
    const mPath = path.join(this.getSessionDir(sessionId), 'mappings.json');
    if (!fs.existsSync(mPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(mPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  public updateSessionMappings(sessionId: string, mappings: FieldMappingItem[]): DataQualityReport | null {
    const sessionDir = this.getSessionDir(sessionId);
    if (!fs.existsSync(sessionDir)) return null;

    fs.writeFileSync(path.join(sessionDir, 'mappings.json'), JSON.stringify(mappings, null, 2), 'utf-8');

    // Re-evaluate data quality using sample records
    const preview = this.getSessionPreview(sessionId);
    const sampleVouchers = preview?.sampleRecords || [];
    const sampleRecords = { vouchers: sampleVouchers, ledgers: [], stockItems: [] };
    const updatedQuality = offlineDataImportEngine.evaluateDataQuality(sampleRecords, mappings);

    fs.writeFileSync(path.join(sessionDir, 'quality.json'), JSON.stringify(updatedQuality, null, 2), 'utf-8');
    return updatedQuality;
  }

  public getSessionQuality(sessionId: string): DataQualityReport | null {
    const qPath = path.join(this.getSessionDir(sessionId), 'quality.json');
    if (!fs.existsSync(qPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(qPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  public getSessionRecords(sessionId: string): any | null {
    const rPath = path.join(this.getSessionDir(sessionId), 'records.json');
    if (!fs.existsSync(rPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(rPath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  private saveMeta(sessionId: string, meta: ImportSessionMeta): void {
    const sessionDir = this.getSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
    }
  }

  /**
   * Commit dataset from disk session directly into persistent offline storage.
   * Cleans up the temporary session on success.
   * Automatically streams large files (>= 10MB) incrementally to prevent high RAM usage.
   */
  public commitSession(
    sessionId: string,
    overrides?: {
      companyName?: string;
      financialYearFrom?: string;
      financialYearTo?: string;
      isDemoData?: boolean;
    },
    userMappings?: FieldMappingItem[]
  ): CanonicalDatasetRecord {
    const meta = this.getSessionMeta(sessionId);
    if (!meta) {
      throw new Error(`Import session "${sessionId}" not found or expired.`);
    }

    const sessionDir = this.getSessionDir(sessionId);
    const recordsPath = path.join(sessionDir, 'records.json');
    if (!fs.existsSync(recordsPath)) {
      throw new Error(`Session records file missing for session "${sessionId}".`);
    }

    const recordsStats = fs.statSync(recordsPath);
    const isLargeStreaming = recordsStats.size >= STREAMING_SIZE_THRESHOLD_BYTES;

    if (isLargeStreaming) {
      return this.commitStreamingSession(sessionId, meta, sessionDir, recordsPath, overrides, userMappings);
    }

    // Small File Fallback (< 10 MB)
    try {
      const rawRecords = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
      const mappings = userMappings || this.getSessionMappings(sessionId) || [];

      const savedRecord = offlineDataImportEngine.commitDataset(
        meta.fileName,
        meta.fileType,
        meta.fileSize,
        rawRecords,
        mappings,
        overrides
      );

      meta.status = 'COMMITTED';
      meta.updatedAt = new Date().toISOString();
      this.saveMeta(sessionId, meta);
      this.inMemoryProgress.delete(sessionId);
      this.cleanupSession(sessionId);

      return savedRecord;
    } catch (err: any) {
      meta.status = 'FAILED';
      meta.updatedAt = new Date().toISOString();
      this.saveMeta(sessionId, meta);
      this.updateProgress(sessionId, {
        phase: 'Failed',
        percent: 0,
        error: err.message,
        message: `Commit failed: ${err.message}`
      });
      throw err;
    }
  }

  /**
   * Memory-safe streaming commit for large imports.
   * Incremental chunk-by-chunk processing to avoid loading entire datasets into RAM.
   */
  private commitStreamingSession(
    sessionId: string,
    meta: ImportSessionMeta,
    sessionDir: string,
    recordsPath: string,
    overrides?: {
      companyName?: string;
      financialYearFrom?: string;
      financialYearTo?: string;
      isDemoData?: boolean;
    },
    userMappings?: FieldMappingItem[]
  ): CanonicalDatasetRecord {
    const storage = offlineDataImportEngine.getStorage();
    const datasetsDir = storage.getDatasetsDir();
    const datasetId = `ds-offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const targetDatasetDirTmp = path.join(datasetsDir, `${datasetId}.tmp.${Date.now()}`);
    const targetDatasetDir = path.join(datasetsDir, datasetId);

    fs.mkdirSync(targetDatasetDirTmp, { recursive: true });

    const vouchersFd = fs.openSync(path.join(targetDatasetDirTmp, 'vouchers.jsonl'), 'w');
    const voucherLinesFd = fs.openSync(path.join(targetDatasetDirTmp, 'voucher_lines.jsonl'), 'w');
    const exceptionsFd = fs.openSync(path.join(targetDatasetDirTmp, 'exceptions.jsonl'), 'w');
    const ledgersFd = fs.openSync(path.join(targetDatasetDirTmp, 'ledgers.jsonl'), 'w');
    const stockItemsFd = fs.openSync(path.join(targetDatasetDirTmp, 'stock_items.jsonl'), 'w');

    let totalVouchers = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let sales = 0, purchase = 0, payment = 0, receipt = 0, journal = 0, contra = 0, other = 0;
    let duplicateVouchers = 0;
    let missingDates = 0;
    let invalidAmounts = 0;
    let unbalancedVouchers = 0;
    const seenVoucherNumbers = new Set<string>();
    const sampleVouchers: CanonicalVoucher[] = [];
    const canonicalExceptions: CanonicalAuditException[] = [];

    try {
      this.updateProgress(sessionId, {
        phase: 'Finalizing',
        percent: 50,
        recordsProcessed: 0,
        message: 'Streaming dataset commit to persistent offline storage...'
      });

      StreamingJsonParser.iterateVouchersFromRecordsFileSync(
        recordsPath,
        (v: CanonicalVoucher, index: number) => {
          totalVouchers++;
          const cVoucher: CanonicalVoucher = {
            ...v,
            id: v.id || `CANON-V-${totalVouchers}`,
            datasetId,
            sourceFile: meta.fileName
          };

          const typeStr = (cVoucher.voucherType || '').toLowerCase();
          if (typeStr.includes('sale')) sales++;
          else if (typeStr.includes('purch')) purchase++;
          else if (typeStr.includes('paym')) payment++;
          else if (typeStr.includes('receipt')) receipt++;
          else if (typeStr.includes('journal')) journal++;
          else if (typeStr.includes('contra')) contra++;
          else other++;

          // Track debit / credit and write voucher lines
          if (cVoucher.entries && cVoucher.entries.length > 0) {
            for (let lineIdx = 0; lineIdx < cVoucher.entries.length; lineIdx++) {
              const entry = cVoucher.entries[lineIdx];
              const cEntry: CanonicalVoucherLine = {
                ...entry,
                id: entry.id || `CANON-L-${totalVouchers}-${lineIdx + 1}`
              };
              fs.writeSync(voucherLinesFd, JSON.stringify(cEntry) + '\n');

              if (cEntry.isDebit === true || cEntry.direction === 'Debit') {
                totalDebit += cEntry.amount || 0;
              } else {
                totalCredit += cEntry.amount || 0;
              }
            }
          } else {
            if (cVoucher.totalDebit) totalDebit += cVoucher.totalDebit;
            if (cVoucher.totalCredit) totalCredit += cVoucher.totalCredit;
          }

          // Write voucher line to JSONL
          fs.writeSync(vouchersFd, JSON.stringify(cVoucher) + '\n');

          // Keep bounded sample vouchers for in-memory preview
          if (sampleVouchers.length < 50) {
            sampleVouchers.push(cVoucher);
          }

          // Quality tracking
          if (!cVoucher.voucherNumber) {
            duplicateVouchers++;
          } else if (seenVoucherNumbers.has(cVoucher.voucherNumber)) {
            duplicateVouchers++;
          } else if (seenVoucherNumbers.size < 100000) {
            seenVoucherNumbers.add(cVoucher.voucherNumber);
          }

          if (!cVoucher.date) missingDates++;
          if (cVoucher.amount === null || isNaN(cVoucher.amount) || cVoucher.amount <= 0) invalidAmounts++;
          if (cVoucher.entries && cVoucher.entries.length >= 2 && !cVoucher.isBalanced && cVoucher.difference > 0.05) {
            unbalancedVouchers++;
          }

          // Audit Intelligence: Evaluate exception
          const exc = OfflineDataImportEngine.evaluateVoucherAuditException(cVoucher, datasetId, totalVouchers - 1);
          if (exc) {
            fs.writeSync(exceptionsFd, JSON.stringify(exc) + '\n');
            if (canonicalExceptions.length < 5000) {
              canonicalExceptions.push(exc);
            }
          }
        },
        (processed, bytesRead, totalBytes) => {
          this.updateProgress(sessionId, {
            phase: 'Finalizing',
            recordsProcessed: processed,
            bytesRead,
            totalBytes,
            percent: Math.min(99, Math.round((bytesRead / totalBytes) * 100)),
            message: `Committing record ${processed}...`
          });
        }
      );

      // Close all file descriptors
      fs.closeSync(vouchersFd);
      fs.closeSync(voucherLinesFd);
      fs.closeSync(exceptionsFd);
      fs.closeSync(ledgersFd);
      fs.closeSync(stockItemsFd);

      // Data Quality Score Calculation
      const totalRecords = totalVouchers;
      let score = 100;
      score -= duplicateVouchers * 2;
      score -= missingDates * 3;
      score -= invalidAmounts * 4;
      score -= unbalancedVouchers * 5;
      score = Math.max(10, Math.min(100, Math.round(score)));

      const warnings: string[] = [];
      const errors: string[] = [];
      const recommendations: string[] = [];

      if (duplicateVouchers > 0) warnings.push(`${duplicateVouchers} vouchers have duplicate or missing voucher numbers.`);
      if (missingDates > 0) errors.push(`${missingDates} vouchers are missing transaction dates.`);
      if (invalidAmounts > 0) errors.push(`${invalidAmounts} vouchers have missing or zero transaction amounts.`);
      if (unbalancedVouchers > 0) errors.push(`${unbalancedVouchers} vouchers have unbalanced debit and credit entries.`);

      const qualityReport: DataQualityReport = {
        score,
        totalRecordsChecked: totalRecords,
        passedRecords: Math.max(0, totalRecords - (duplicateVouchers + missingDates + invalidAmounts + unbalancedVouchers)),
        duplicateVouchers,
        missingDates,
        invalidAmounts,
        unbalancedVouchers,
        orphanLedgers: 0,
        unmappedFieldsCount: 0,
        reviewRequiredFieldsCount: 0,
        warnings,
        errors,
        recommendations
      };

      // Strict Company & FY Resolution
      const isDemoData = overrides?.isDemoData ?? false;
      const companyName = overrides?.companyName?.trim() || meta.detectedCompany || null;
      const fyFrom = overrides?.financialYearFrom?.trim() || meta.detectedFinancialYear?.from || null;
      const fyTo = overrides?.financialYearTo?.trim() || meta.detectedFinancialYear?.to || null;
      const isFinancialYearDetected = Boolean(fyFrom && fyTo);

      const voucherCounts = {
        total: totalVouchers,
        sales,
        purchase,
        payment,
        receipt,
        journal,
        contra,
        other
      };

      const masterCounts = {
        ledgers: 0,
        groups: 0,
        parties: 0,
        stockItems: 0,
        costCentres: 0,
        bankAccounts: 0
      };

      const mappings = userMappings || this.getSessionMappings(sessionId) || [];

      const metadata: ImportedDatasetSummary = {
        id: datasetId,
        name: isDemoData 
          ? `[DEMO DATA] ${companyName || 'Sample Company'} (${meta.fileType})` 
          : `${companyName || 'Offline Dataset'} (${meta.fileType})`,
        description: `Imported from ${meta.fileName} with ${voucherCounts.total} vouchers and ${masterCounts.ledgers} masters.`,
        sourceFileName: meta.fileName,
        sourceFileType: meta.fileType,
        sourceFileSize: meta.fileSize,
        companyName,
        financialYearFrom: fyFrom,
        financialYearTo: fyTo,
        isFinancialYearDetected,
        financialYearStatus: isFinancialYearDetected ? 'DETECTED' : 'REVIEW_REQUIRED',
        financialYearExplanation: isFinancialYearDetected ? undefined : 'Financial year was not detected in the source data.',
        financialYearDetectionSource: isFinancialYearDetected
          ? (overrides?.financialYearFrom ? 'User Specified Override' : 'Detected in Source')
          : 'Not Detected in Source Data',
        importedAt: new Date().toISOString(),
        totalRecords: voucherCounts.total + masterCounts.ledgers + masterCounts.stockItems,
        masterCounts,
        voucherCounts,
        dataQualityScore: qualityReport.score,
        dataQualityReport: qualityReport,
        status: 'Ready',
        mappingsCount: {
          total: mappings.length,
          mapped: mappings.filter(m => m.status === 'MAPPED').length,
          reviewRequired: mappings.filter(m => m.status === 'REVIEW_REQUIRED').length,
          unmapped: mappings.filter(m => m.status === 'UNMAPPED').length
        },
        isActive: true,
        isDemoData
      };

      // Write metadata, mappings, and index files into directory
      fs.writeFileSync(path.join(targetDatasetDirTmp, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
      fs.writeFileSync(path.join(targetDatasetDirTmp, 'mappings.json'), JSON.stringify(mappings, null, 2), 'utf-8');
      fs.writeFileSync(path.join(targetDatasetDirTmp, 'index.json'), JSON.stringify({ datasetId, totalVouchers, importedAt: metadata.importedAt }, null, 2), 'utf-8');

      // Atomic rename of temporary directory to permanent dataset directory
      fs.renameSync(targetDatasetDirTmp, targetDatasetDir);

      const canonicalRecord: CanonicalDatasetRecord = {
        id: datasetId,
        metadata,
        companies: companyName ? [{ name: companyName, financialYearFrom: fyFrom, financialYearTo: fyTo, id: datasetId }] : [],
        groups: [],
        ledgers: [],
        parties: [],
        vouchers: sampleVouchers,
        voucherLines: sampleVouchers.flatMap(v => v.entries || []),
        stockItems: [],
        costCentres: [],
        taxRecords: [],
        bankAccounts: [],
        exceptions: canonicalExceptions,
        mappings
      };

      // Register with storage and activate
      storage.saveStreamingDataset(canonicalRecord);
      const storageProvider = offlineDataImportEngine.getStorageProvider();
      if (storageProvider.modeName === 'postgres') {
        storageProvider.saveStreamingDataset(canonicalRecord, targetDatasetDir).catch((pgErr: any) => {
          console.error('[ImportSessionManager] Failed to persist to PostgreSQL:', pgErr.message);
        });
      }

      meta.status = 'COMMITTED';
      meta.updatedAt = new Date().toISOString();
      this.updateProgress(sessionId, {
        phase: 'Completed',
        percent: 100,
        recordsProcessed: totalVouchers,
        message: 'Commit completed successfully.'
      });

      // Cleanup session temporary files
      this.cleanupSession(sessionId);

      return canonicalRecord;
    } catch (err: any) {
      try { fs.closeSync(vouchersFd); } catch (e) {}
      try { fs.closeSync(voucherLinesFd); } catch (e) {}
      try { fs.closeSync(exceptionsFd); } catch (e) {}
      try { fs.closeSync(ledgersFd); } catch (e) {}
      try { fs.closeSync(stockItemsFd); } catch (e) {}

      if (fs.existsSync(targetDatasetDirTmp)) {
        try { fs.rmSync(targetDatasetDirTmp, { recursive: true, force: true }); } catch (e) {}
      }

      meta.status = 'FAILED';
      meta.updatedAt = new Date().toISOString();
      this.updateProgress(sessionId, {
        phase: 'Failed',
        percent: 0,
        error: err.message,
        message: `Commit failed: ${err.message}`
      });

      throw err;
    }
  }

  /**
   * Asynchronous version of commitSession with streaming progress support
   */
  public async commitSessionAsync(
    sessionId: string,
    overrides?: {
      companyName?: string;
      financialYearFrom?: string;
      financialYearTo?: string;
      isDemoData?: boolean;
    },
    userMappings?: FieldMappingItem[],
    onProgress?: (progress: ImportSessionProgress) => void
  ): Promise<CanonicalDatasetRecord> {
    const meta = this.getSessionMeta(sessionId);
    if (!meta) {
      throw new Error(`Import session "${sessionId}" not found or expired.`);
    }

    const sessionDir = this.getSessionDir(sessionId);
    const recordsPath = path.join(sessionDir, 'records.json');
    if (!fs.existsSync(recordsPath)) {
      throw new Error(`Session records file missing for session "${sessionId}".`);
    }

    const recordsStats = fs.statSync(recordsPath);
    const isLargeStreaming = recordsStats.size >= STREAMING_SIZE_THRESHOLD_BYTES;

    if (!isLargeStreaming) {
      return this.commitSession(sessionId, overrides, userMappings);
    }

    const storage = offlineDataImportEngine.getStorage();
    const datasetsDir = storage.getDatasetsDir();
    const datasetId = `ds-offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const targetDatasetDirTmp = path.join(datasetsDir, `${datasetId}.tmp.${Date.now()}`);
    const targetDatasetDir = path.join(datasetsDir, datasetId);

    fs.mkdirSync(targetDatasetDirTmp, { recursive: true });

    const vouchersStream = fs.createWriteStream(path.join(targetDatasetDirTmp, 'vouchers.jsonl'), { flags: 'w' });
    const voucherLinesStream = fs.createWriteStream(path.join(targetDatasetDirTmp, 'voucher_lines.jsonl'), { flags: 'w' });
    const exceptionsStream = fs.createWriteStream(path.join(targetDatasetDirTmp, 'exceptions.jsonl'), { flags: 'w' });
    const ledgersStream = fs.createWriteStream(path.join(targetDatasetDirTmp, 'ledgers.jsonl'), { flags: 'w' });
    const stockItemsStream = fs.createWriteStream(path.join(targetDatasetDirTmp, 'stock_items.jsonl'), { flags: 'w' });

    let totalVouchers = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let sales = 0, purchase = 0, payment = 0, receipt = 0, journal = 0, contra = 0, other = 0;
    let duplicateVouchers = 0;
    let missingDates = 0;
    let invalidAmounts = 0;
    let unbalancedVouchers = 0;
    const seenVoucherNumbers = new Set<string>();
    const sampleVouchers: CanonicalVoucher[] = [];
    const canonicalExceptions: CanonicalAuditException[] = [];

    try {
      this.updateProgress(sessionId, {
        phase: 'Finalizing',
        percent: 50,
        recordsProcessed: 0,
        message: 'Streaming dataset commit to persistent offline storage...'
      });

      await StreamingJsonParser.iterateVouchersFromRecordsFile(
        recordsPath,
        async (v: CanonicalVoucher, index: number) => {
          totalVouchers++;
          const cVoucher: CanonicalVoucher = {
            ...v,
            id: v.id || `CANON-V-${totalVouchers}`,
            datasetId,
            sourceFile: meta.fileName
          };

          const typeStr = (cVoucher.voucherType || '').toLowerCase();
          if (typeStr.includes('sale')) sales++;
          else if (typeStr.includes('purch')) purchase++;
          else if (typeStr.includes('paym')) payment++;
          else if (typeStr.includes('receipt')) receipt++;
          else if (typeStr.includes('journal')) journal++;
          else if (typeStr.includes('contra')) contra++;
          else other++;

          if (cVoucher.entries && cVoucher.entries.length > 0) {
            for (let lineIdx = 0; lineIdx < cVoucher.entries.length; lineIdx++) {
              const entry = cVoucher.entries[lineIdx];
              const cEntry: CanonicalVoucherLine = {
                ...entry,
                id: entry.id || `CANON-L-${totalVouchers}-${lineIdx + 1}`
              };
              await this.writeWithBackpressure(voucherLinesStream, JSON.stringify(cEntry) + '\n');

              if (cEntry.isDebit === true || cEntry.direction === 'Debit') {
                totalDebit += cEntry.amount || 0;
              } else {
                totalCredit += cEntry.amount || 0;
              }
            }
          } else {
            if (cVoucher.totalDebit) totalDebit += cVoucher.totalDebit;
            if (cVoucher.totalCredit) totalCredit += cVoucher.totalCredit;
          }

          await this.writeWithBackpressure(vouchersStream, JSON.stringify(cVoucher) + '\n');

          if (sampleVouchers.length < 50) {
            sampleVouchers.push(cVoucher);
          }

          if (!cVoucher.voucherNumber) {
            duplicateVouchers++;
          } else if (seenVoucherNumbers.has(cVoucher.voucherNumber)) {
            duplicateVouchers++;
          } else if (seenVoucherNumbers.size < 100000) {
            seenVoucherNumbers.add(cVoucher.voucherNumber);
          }

          if (!cVoucher.date) missingDates++;
          if (cVoucher.amount === null || isNaN(cVoucher.amount) || cVoucher.amount <= 0) invalidAmounts++;
          if (cVoucher.entries && cVoucher.entries.length >= 2 && !cVoucher.isBalanced && cVoucher.difference > 0.05) {
            unbalancedVouchers++;
          }

          const exc = OfflineDataImportEngine.evaluateVoucherAuditException(cVoucher, datasetId, totalVouchers - 1);
          if (exc) {
            await this.writeWithBackpressure(exceptionsStream, JSON.stringify(exc) + '\n');
            if (canonicalExceptions.length < 50) {
              canonicalExceptions.push(exc);
            }
          }
        },
        (processed, bytesRead, totalBytes) => {
          const prog: ImportSessionProgress = {
            phase: 'Finalizing',
            recordsProcessed: processed,
            bytesRead,
            totalBytes,
            percent: Math.min(99, Math.round((bytesRead / totalBytes) * 100)),
            message: `Committing record ${processed}...`
          } as any;
          this.updateProgress(sessionId, prog);
          if (onProgress) onProgress(prog);
        }
      );

      // Finish write streams
      await Promise.all([
        new Promise((res) => vouchersStream.end(res)),
        new Promise((res) => voucherLinesStream.end(res)),
        new Promise((res) => exceptionsStream.end(res)),
        new Promise((res) => ledgersStream.end(res)),
        new Promise((res) => stockItemsStream.end(res))
      ]);

      const totalRecords = totalVouchers;
      let score = 100;
      score -= duplicateVouchers * 2;
      score -= missingDates * 3;
      score -= invalidAmounts * 4;
      score -= unbalancedVouchers * 5;
      score = Math.max(10, Math.min(100, Math.round(score)));

      const warnings: string[] = [];
      const errors: string[] = [];
      const recommendations: string[] = [];

      if (duplicateVouchers > 0) warnings.push(`${duplicateVouchers} vouchers have duplicate or missing voucher numbers.`);
      if (missingDates > 0) errors.push(`${missingDates} vouchers are missing transaction dates.`);
      if (invalidAmounts > 0) errors.push(`${invalidAmounts} vouchers have missing or zero transaction amounts.`);
      if (unbalancedVouchers > 0) errors.push(`${unbalancedVouchers} vouchers have unbalanced debit and credit entries.`);

      const qualityReport: DataQualityReport = {
        score,
        totalRecordsChecked: totalRecords,
        passedRecords: Math.max(0, totalRecords - (duplicateVouchers + missingDates + invalidAmounts + unbalancedVouchers)),
        duplicateVouchers,
        missingDates,
        invalidAmounts,
        unbalancedVouchers,
        orphanLedgers: 0,
        unmappedFieldsCount: 0,
        reviewRequiredFieldsCount: 0,
        warnings,
        errors,
        recommendations
      };

      const isDemoData = overrides?.isDemoData ?? false;
      const companyName = overrides?.companyName?.trim() || meta.detectedCompany || null;
      const fyFrom = overrides?.financialYearFrom?.trim() || meta.detectedFinancialYear?.from || null;
      const fyTo = overrides?.financialYearTo?.trim() || meta.detectedFinancialYear?.to || null;
      const isFinancialYearDetected = Boolean(fyFrom && fyTo);

      const voucherCounts = {
        total: totalVouchers,
        sales,
        purchase,
        payment,
        receipt,
        journal,
        contra,
        other
      };

      const masterCounts = {
        ledgers: 0,
        groups: 0,
        parties: 0,
        stockItems: 0,
        costCentres: 0,
        bankAccounts: 0
      };

      const mappings = userMappings || this.getSessionMappings(sessionId) || [];

      const metadata: ImportedDatasetSummary = {
        id: datasetId,
        name: isDemoData 
          ? `[DEMO DATA] ${companyName || 'Sample Company'} (${meta.fileType})` 
          : `${companyName || 'Offline Dataset'} (${meta.fileType})`,
        description: `Imported from ${meta.fileName} with ${voucherCounts.total} vouchers and ${masterCounts.ledgers} masters.`,
        sourceFileName: meta.fileName,
        sourceFileType: meta.fileType,
        sourceFileSize: meta.fileSize,
        companyName,
        financialYearFrom: fyFrom,
        financialYearTo: fyTo,
        isFinancialYearDetected,
        financialYearStatus: isFinancialYearDetected ? 'DETECTED' : 'REVIEW_REQUIRED',
        financialYearExplanation: isFinancialYearDetected ? undefined : 'Financial year was not detected in the source data.',
        financialYearDetectionSource: isFinancialYearDetected
          ? (overrides?.financialYearFrom ? 'User Specified Override' : 'Detected in Source')
          : 'Not Detected in Source Data',
        importedAt: new Date().toISOString(),
        totalRecords: voucherCounts.total + masterCounts.ledgers + masterCounts.stockItems,
        masterCounts,
        voucherCounts,
        dataQualityScore: qualityReport.score,
        dataQualityReport: qualityReport,
        status: 'Ready',
        mappingsCount: {
          total: mappings.length,
          mapped: mappings.filter(m => m.status === 'MAPPED').length,
          reviewRequired: mappings.filter(m => m.status === 'REVIEW_REQUIRED').length,
          unmapped: mappings.filter(m => m.status === 'UNMAPPED').length
        },
        isActive: true,
        isDemoData
      };

      fs.writeFileSync(path.join(targetDatasetDirTmp, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
      fs.writeFileSync(path.join(targetDatasetDirTmp, 'mappings.json'), JSON.stringify(mappings, null, 2), 'utf-8');
      fs.writeFileSync(path.join(targetDatasetDirTmp, 'index.json'), JSON.stringify({ datasetId, totalVouchers, importedAt: metadata.importedAt }, null, 2), 'utf-8');

      fs.renameSync(targetDatasetDirTmp, targetDatasetDir);

      const canonicalRecord: CanonicalDatasetRecord = {
        id: datasetId,
        metadata,
        companies: companyName ? [{ name: companyName, financialYearFrom: fyFrom, financialYearTo: fyTo, id: datasetId }] : [],
        groups: [],
        ledgers: [],
        parties: [],
        vouchers: sampleVouchers,
        voucherLines: sampleVouchers.flatMap(v => v.entries || []),
        stockItems: [],
        costCentres: [],
        taxRecords: [],
        bankAccounts: [],
        exceptions: canonicalExceptions,
        mappings
      };

      storage.saveStreamingDataset(canonicalRecord);
      const storageProvider = offlineDataImportEngine.getStorageProvider();
      if (storageProvider.modeName === 'postgres') {
        try {
          await storageProvider.saveStreamingDataset(canonicalRecord, targetDatasetDir);
        } catch (pgErr: any) {
          console.error('[ImportSessionManager] Failed to persist to PostgreSQL:', pgErr.message);
        }
      }

      meta.status = 'COMMITTED';
      meta.updatedAt = new Date().toISOString();
      const finalProg = {
        phase: 'Completed',
        percent: 100,
        recordsProcessed: totalVouchers,
        message: 'Commit completed successfully.'
      } as any;
      this.updateProgress(sessionId, finalProg);
      if (onProgress) onProgress(finalProg);

      this.cleanupSession(sessionId);

      return canonicalRecord;
    } catch (err: any) {
      if (fs.existsSync(targetDatasetDirTmp)) {
        try { fs.rmSync(targetDatasetDirTmp, { recursive: true, force: true }); } catch (e) {}
      }

      meta.status = 'FAILED';
      meta.updatedAt = new Date().toISOString();
      this.updateProgress(sessionId, {
        phase: 'Failed',
        percent: 0,
        error: err.message,
        message: `Commit failed: ${err.message}`
      });

      throw err;
    }
  }

  /**
   * Clean up a specific session folder
   */
  public cleanupSession(sessionId: string): boolean {
    const sessionDir = this.getSessionDir(sessionId);
    this.inMemoryProgress.delete(sessionId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        return true;
      } catch (e) {
        console.warn(`[ImportSessionManager] Failed to remove session dir: ${sessionDir}`, e);
        return false;
      }
    }
    return false;
  }

  /**
   * Clean up abandoned or expired sessions.
   * Guaranteed NEVER to delete persistent datasets in data/offline_datasets/.
   */
  public cleanupAbandonedSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    if (!fs.existsSync(this.baseDir)) return 0;
    let cleaned = 0;
    try {
      const entries = fs.readdirSync(this.baseDir);
      const now = Date.now();

      for (const entry of entries) {
        const fullPath = path.join(this.baseDir, entry);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            let sessionAge = now - stats.mtimeMs;
            const metaFile = path.join(fullPath, 'meta.json');
            if (fs.existsSync(metaFile)) {
              try {
                const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
                const createdTime = meta.createdAt ? new Date(meta.createdAt).getTime() : NaN;
                if (!isNaN(createdTime)) {
                  sessionAge = Math.max(sessionAge, now - createdTime);
                }
              } catch (mErr) {}
            }
            if (sessionAge >= maxAgeMs) {
              fs.rmSync(fullPath, { recursive: true, force: true });
              cleaned++;
            }
          }
        } catch (err) {
          // Skip if locked
        }
      }
    } catch (e) {
      console.warn('[ImportSessionManager] Error during abandoned session cleanup:', e);
    }
    return cleaned;
  }

  /**
   * Helper to write a string chunk to a Node.js WritableStream with backpressure handling.
   * If stream.write() returns false, waits for the 'drain' event before continuing.
   */
  private async writeWithBackpressure(stream: fs.WriteStream, chunk: string): Promise<void> {
    if (!stream.write(chunk)) {
      await new Promise<void>((resolve) => stream.once('drain', resolve));
    }
  }

  /**
   * Clean up temporary upload files
   */
  public cleanupTempUploads(tempUploadDir: string, maxAgeMs: number = 60 * 60 * 1000): number {
    if (!fs.existsSync(tempUploadDir)) return 0;
    let cleaned = 0;
    try {
      const files = fs.readdirSync(tempUploadDir);
      const now = Date.now();
      for (const file of files) {
        const fullPath = path.join(tempUploadDir, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isFile() && (now - stats.mtimeMs > maxAgeMs)) {
            fs.unlinkSync(fullPath);
            cleaned++;
          }
        } catch (e) {}
      }
    } catch (e) {}
    return cleaned;
  }
}

export const importSessionManager = new ImportSessionManager();
