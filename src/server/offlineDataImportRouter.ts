import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import multer from 'multer';
import { offlineDataImportEngine } from './offlineDataImportEngine';
import { importSessionManager } from './importSessionManager';
import { ImportFileFormat } from '../types/offlineDataImport';

export const offlineDataImportRouter = Router();

// Ensure temporary upload directory exists
const tempUploadDir = path.join(process.cwd(), 'data', 'temp_uploads');
try {
  if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[OfflineDataImport] Could not create local temp upload dir, falling back to os.tmpdir()', e);
}

// Configure multer for disk-based streaming uploads up to 500MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (fs.existsSync(tempUploadDir)) {
      cb(null, tempUploadDir);
    } else {
      cb(null, os.tmpdir());
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `tally_import_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB limit
  }
});

// Helper to infer format from filename
function inferFileType(fileName: string): ImportFileFormat {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.xml')) return 'XML';
  if (lower.endsWith('.json')) return 'JSON';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return 'EXCEL';
  return 'JSON';
}

// Multer error handling wrapper to ensure strict JSON 413 on file > 500MB
function handleUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'File size exceeds the 500 MB limit',
          code: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Error occurred during file upload',
        code: 'INVALID_REQUEST'
      });
    }
    next();
  });
}

// 1. Get all imported datasets
offlineDataImportRouter.get('/datasets', (req: Request, res: Response) => {
  try {
    const datasets = offlineDataImportEngine.getAllDatasets();
    res.json({ success: true, count: datasets.length, datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 2. Get history (alias of datasets)
offlineDataImportRouter.get('/history', (req: Request, res: Response) => {
  try {
    const datasets = offlineDataImportEngine.getAllDatasets();
    res.json({ success: true, count: datasets.length, history: datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 3. Get currently active dataset
offlineDataImportRouter.get('/active', (req: Request, res: Response) => {
  try {
    const active = offlineDataImportEngine.getActiveDataset();
    if (!active) {
      return res.json({ success: false, message: 'No offline dataset active' });
    }
    res.json({ success: true, activeDataset: active });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 4. Set active dataset
offlineDataImportRouter.post('/active', (req: Request, res: Response) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res.status(400).json({ success: false, error: 'datasetId is required', code: 'INVALID_REQUEST' });
    }
    const success = offlineDataImportEngine.setActiveDataset(datasetId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Dataset not found', code: 'DATASET_NOT_FOUND' });
    }
    const active = offlineDataImportEngine.getActiveDataset();
    res.json({ success: true, activeDataset: active });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 5. Get dataset by ID
offlineDataImportRouter.get('/datasets/:id', (req: Request, res: Response) => {
  try {
    const dataset = offlineDataImportEngine.getDatasetById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found', code: 'DATASET_NOT_FOUND' });
    }
    res.json({ success: true, dataset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 5a. Get paginated vouchers for a dataset (supporting both streaming and in-memory datasets)
offlineDataImportRouter.get('/datasets/:id/vouchers', async (req: Request, res: Response) => {
  try {
    const datasetId = req.params.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const typeFilter = ((req.query.voucherType as string) || '').toLowerCase().trim();

    const startIdx = (page - 1) * limit;
    const items: any[] = [];
    let totalCount = 0;
    let matchedCount = 0;

    await offlineDataImportEngine.streamVouchers(datasetId, (v) => {
      totalCount++;
      let matches = true;
      if (typeFilter && (v.voucherType || '').toLowerCase() !== typeFilter) {
        matches = false;
      }
      if (matches && search) {
        const str = `${v.voucherNumber || ''} ${v.partyLedger || ''} ${v.narration || ''} ${v.amount || ''}`.toLowerCase();
        if (!str.includes(search)) {
          matches = false;
        }
      }

      if (matches) {
        if (matchedCount >= startIdx && items.length < limit) {
          items.push(v);
        }
        matchedCount++;
      }
    });

    res.json({
      success: true,
      datasetId,
      page,
      limit,
      totalVouchers: totalCount,
      matchedVouchers: matchedCount,
      totalPages: Math.ceil(matchedCount / limit) || 1,
      vouchers: items
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 5b. Get exceptions for a dataset (supporting both streaming and in-memory datasets)
offlineDataImportRouter.get('/datasets/:id/exceptions', async (req: Request, res: Response) => {
  try {
    const datasetId = req.params.id;
    const exceptions: any[] = [];
    await offlineDataImportEngine.streamExceptions(datasetId, (exc) => {
      exceptions.push(exc);
    });
    res.json({ success: true, datasetId, count: exceptions.length, exceptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 5c. Get incremental financial aggregates for a dataset
offlineDataImportRouter.get('/datasets/:id/aggregates', async (req: Request, res: Response) => {
  try {
    const datasetId = req.params.id;
    const aggregates = await offlineDataImportEngine.getDatasetAggregates(datasetId);
    res.json({ success: true, datasetId, aggregates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 6. Delete dataset by ID
offlineDataImportRouter.delete('/datasets/:id', (req: Request, res: Response) => {
  try {
    const success = offlineDataImportEngine.deleteDataset(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Dataset not found', code: 'DATASET_NOT_FOUND' });
    }
    res.json({ success: true, message: 'Dataset removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 7. Multipart / Streaming Upload and Parse (Session-backed, bounded preview)
offlineDataImportRouter.post('/upload-and-parse', handleUploadMiddleware, async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;
  let sessionId: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a file in the "file" field of multipart form data.',
        code: 'INVALID_REQUEST'
      });
    }

    uploadedFilePath = req.file.path;
    const fileSize = req.file.size;
    const originalFileName = req.file.originalname || path.basename(uploadedFilePath);
    const fileType: ImportFileFormat = (req.body.fileType as ImportFileFormat) || inferFileType(originalFileName);

    // Inspect and log the first 2048 bytes of the uploaded file
    try {
      const sampleBuf = Buffer.alloc(2048);
      const fd = fs.openSync(uploadedFilePath, 'r');
      const bytesRead = fs.readSync(fd, sampleBuf, 0, 2048, 0);
      fs.closeSync(fd);
      const sampleText = sampleBuf.subarray(0, bytesRead).toString('utf8');
      console.log(`[OfflineDataImport] RAW FIRST ${bytesRead} BYTES OF UPLOADED FILE (${originalFileName}):\n${sampleText}`);
      const inspectDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(inspectDir)) fs.mkdirSync(inspectDir, { recursive: true });
      fs.writeFileSync(path.join(inspectDir, 'last_uploaded_raw_header.txt'), sampleText, 'utf8');
    } catch (e) {
      console.warn('[OfflineDataImport] Failed to inspect uploaded file header:', e);
    }

    // Create session
    const session = importSessionManager.createSession(originalFileName, fileType, fileSize);
    sessionId = session.sessionId;

    importSessionManager.updateProgress(sessionId, {
      phase: 'Processing',
      percent: 10,
      message: `Analyzing structure of ${originalFileName}...`
    });

    const sessionRecordsPath = path.join(process.cwd(), 'data', 'import_sessions', sessionId, 'records.json');

    // Parse file directly from temporary disk location with incremental streaming support
    const parsedResult = await offlineDataImportEngine.parseFileFromDiskAsync(
      uploadedFilePath,
      fileType,
      originalFileName,
      sessionRecordsPath,
      (progress) => {
        if (sessionId) {
          importSessionManager.updateProgress(sessionId, {
            phase: progress.phase,
            recordsProcessed: progress.recordsProcessed,
            percent: Math.min(90, Math.round(progress.percent * 0.8) + 10)
          });
        }
      }
    );

    importSessionManager.updateProgress(sessionId, {
      phase: 'Mapping',
      percent: 85,
      message: 'Generating semantic field mappings...'
    });

    // Auto-generate field mappings using sample/preview records
    const sampleVouchers = parsedResult.preview.sampleRecords || [];
    const sampleRecords = {
      vouchers: sampleVouchers,
      ledgers: [],
      stockItems: []
    };
    const mappings = offlineDataImportEngine.generateAutoMappings(sampleRecords);

    importSessionManager.updateProgress(sessionId, {
      phase: 'Quality Check',
      percent: 95,
      message: 'Evaluating accounting data quality...'
    });

    const qualityReport = offlineDataImportEngine.evaluateDataQuality(sampleRecords, mappings);

    const counts = parsedResult.preview.counts || {
      vouchers: sampleVouchers.length,
      ledgers: 0,
      stockItems: 0,
      totalDebit: 0,
      totalCredit: 0
    };

    // Persist parsed data into session storage
    importSessionManager.saveSessionParsedData(
      sessionId,
      {
        detectedCompany: parsedResult.preview.detectedCompany,
        detectedFinancialYear: parsedResult.preview.detectedFinancialYear,
        counts: {
          vouchers: counts.vouchers,
          ledgers: counts.ledgers,
          stockItems: counts.stockItems,
          totalDebit: counts.totalDebit ?? 0,
          totalCredit: counts.totalCredit ?? 0
        },
        isBalanced: parsedResult.preview.auditSummary?.isBalanced ?? true,
        balanceDifference: parsedResult.preview.auditSummary?.difference ?? 0
      },
      parsedResult.preview,
      mappings,
      qualityReport,
      sessionRecordsPath
    );

    // Return ONLY bounded preview and session ID to React — no rawRecords in large payload!
    res.json({
      success: true,
      importSessionId: sessionId,
      preview: parsedResult.preview,
      mappings,
      qualityReport,
      // For backward compatibility on small files only:
      rawRecords: fileSize < 5 * 1024 * 1024 ? parsedResult.rawRecords : undefined
    });
  } catch (err: any) {
    console.error('[OfflineDataImport] Parse error:', err);
    if (sessionId) {
      importSessionManager.updateProgress(sessionId, {
        phase: 'Failed',
        percent: 100,
        error: err.message
      });
    }

    const isMalformed = err.message && (err.message.includes('JSON') || err.message.includes('syntax') || err.message.includes('XML'));
    res.status(isMalformed ? 422 : 400).json({
      success: false,
      error: err.message || 'Failed to parse uploaded file',
      code: isMalformed ? 'INVALID_TALLY_DATA' : 'INVALID_REQUEST'
    });
  } finally {
    // Clean up temporary upload file immediately
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.warn('[OfflineDataImport] Failed to cleanup temp file:', uploadedFilePath, cleanupErr);
      }
    }
  }
});

// 8. Backward-compatible /parse endpoint supporting both multipart upload and JSON body
offlineDataImportRouter.post('/parse', handleUploadMiddleware, async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;
  let sessionId: string | null = null;

  try {
    // Case A: Multipart upload
    if (req.file) {
      uploadedFilePath = req.file.path;
      const fileSize = req.file.size;
      const originalFileName = req.file.originalname || path.basename(uploadedFilePath);
      const fileType: ImportFileFormat = (req.body.fileType as ImportFileFormat) || inferFileType(originalFileName);

      const session = importSessionManager.createSession(originalFileName, fileType, fileSize);
      sessionId = session.sessionId;

      const sessionRecordsPath = path.join(process.cwd(), 'data', 'import_sessions', sessionId, 'records.json');
      const parsedResult = await offlineDataImportEngine.parseFileFromDiskAsync(
        uploadedFilePath,
        fileType,
        originalFileName,
        sessionRecordsPath
      );

      const sampleRecords = {
        vouchers: parsedResult.preview.sampleRecords || [],
        ledgers: [],
        stockItems: []
      };
      const mappings = offlineDataImportEngine.generateAutoMappings(sampleRecords);
      const qualityReport = offlineDataImportEngine.evaluateDataQuality(sampleRecords, mappings);

      const counts = parsedResult.preview.counts || {
        vouchers: sampleRecords.vouchers.length,
        ledgers: 0,
        stockItems: 0,
        totalDebit: 0,
        totalCredit: 0
      };

      importSessionManager.saveSessionParsedData(
        sessionId,
        {
          detectedCompany: parsedResult.preview.detectedCompany,
          detectedFinancialYear: parsedResult.preview.detectedFinancialYear,
          counts: {
            vouchers: counts.vouchers,
            ledgers: counts.ledgers,
            stockItems: counts.stockItems,
            totalDebit: counts.totalDebit ?? 0,
            totalCredit: counts.totalCredit ?? 0
          },
          isBalanced: parsedResult.preview.auditSummary?.isBalanced ?? true,
          balanceDifference: parsedResult.preview.auditSummary?.difference ?? 0
        },
        parsedResult.preview,
        mappings,
        qualityReport,
        sessionRecordsPath
      );

      return res.json({
        success: true,
        importSessionId: sessionId,
        preview: parsedResult.preview,
        mappings,
        qualityReport,
        rawRecords: fileSize < 5 * 1024 * 1024 ? parsedResult.rawRecords : undefined
      });
    }

    // Case B: JSON body payload
    const { fileContent, fileType, fileName, base64Buffer } = req.body || {};

    if (!fileType) {
      return res.status(400).json({ success: false, error: 'fileType (XML, JSON, EXCEL) is required', code: 'INVALID_REQUEST' });
    }

    let parsedResult: { preview: any; rawRecords: any };

    if (fileType === 'XML') {
      if (!fileContent) {
        return res.status(400).json({ success: false, error: 'fileContent string is required for XML', code: 'INVALID_REQUEST' });
      }
      parsedResult = offlineDataImportEngine.parseXmlData(fileContent, fileName || 'imported_data.xml');
    } else if (fileType === 'JSON') {
      if (!fileContent) {
        return res.status(400).json({ success: false, error: 'fileContent string is required for JSON', code: 'INVALID_REQUEST' });
      }
      parsedResult = offlineDataImportEngine.parseJsonData(fileContent, fileName || 'imported_data.json');
    } else if (fileType === 'EXCEL') {
      if (!base64Buffer && !fileContent) {
        return res.status(400).json({ success: false, error: 'base64Buffer or fileContent is required for Excel', code: 'INVALID_REQUEST' });
      }
      const rawBuf = Buffer.from(base64Buffer || fileContent, 'base64');
      parsedResult = offlineDataImportEngine.parseExcelBuffer(rawBuf, fileName || 'imported_data.xlsx');
    } else {
      return res.status(400).json({ success: false, error: `Unsupported fileType: ${fileType}`, code: 'INVALID_REQUEST' });
    }

    const mappings = offlineDataImportEngine.generateAutoMappings(parsedResult.rawRecords);
    const qualityReport = offlineDataImportEngine.evaluateDataQuality(parsedResult.rawRecords, mappings);

    // Create session for JSON body import
    const contentLen = (fileContent || base64Buffer || '').length;
    const session = importSessionManager.createSession(fileName || 'imported_dataset', fileType, contentLen);
    sessionId = session.sessionId;

    importSessionManager.saveSessionParsedData(
      sessionId,
      {
        detectedCompany: parsedResult.preview.detectedCompany,
        detectedFinancialYear: parsedResult.preview.detectedFinancialYear,
        counts: parsedResult.preview.counts,
        isBalanced: parsedResult.preview.auditSummary?.isBalanced ?? true,
        balanceDifference: parsedResult.preview.auditSummary?.difference ?? 0
      },
      parsedResult.preview,
      mappings,
      qualityReport,
      parsedResult.rawRecords
    );

    res.json({
      success: true,
      importSessionId: sessionId,
      preview: parsedResult.preview,
      mappings,
      qualityReport,
      rawRecords: contentLen < 5 * 1024 * 1024 ? parsedResult.rawRecords : undefined
    });
  } catch (err: any) {
    const isMalformed = err.message && (err.message.includes('JSON') || err.message.includes('syntax') || err.message.includes('XML'));
    res.status(isMalformed ? 422 : 400).json({
      success: false,
      error: err.message,
      code: isMalformed ? 'INVALID_TALLY_DATA' : 'INVALID_REQUEST'
    });
  } finally {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {}
    }
  }
});

// 9. Session Progress Endpoint
offlineDataImportRouter.get('/session/:sessionId/progress', (req: Request, res: Response) => {
  try {
    const progress = importSessionManager.getProgress(req.params.sessionId);
    if (!progress) {
      return res.status(404).json({ success: false, error: 'Session not found or expired', code: 'SESSION_NOT_FOUND' });
    }
    res.json({ success: true, sessionId: req.params.sessionId, progress });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 10. Get Session Details Endpoint (Bounded preview, mappings, quality)
offlineDataImportRouter.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const meta = importSessionManager.getSessionMeta(req.params.sessionId);
    if (!meta) {
      return res.status(404).json({ success: false, error: 'Session not found or expired', code: 'SESSION_NOT_FOUND' });
    }
    const preview = importSessionManager.getSessionPreview(req.params.sessionId);
    const mappings = importSessionManager.getSessionMappings(req.params.sessionId);
    const qualityReport = importSessionManager.getSessionQuality(req.params.sessionId);

    res.json({
      success: true,
      meta,
      preview,
      mappings,
      qualityReport
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 11. Update Session Mappings Endpoint
offlineDataImportRouter.post('/session/:sessionId/mappings', (req: Request, res: Response) => {
  try {
    const { mappings } = req.body;
    if (!Array.isArray(mappings)) {
      return res.status(400).json({ success: false, error: 'mappings array is required', code: 'INVALID_REQUEST' });
    }

    const updatedQuality = importSessionManager.updateSessionMappings(req.params.sessionId, mappings);
    if (!updatedQuality) {
      return res.status(404).json({ success: false, error: 'Session not found', code: 'SESSION_NOT_FOUND' });
    }

    res.json({
      success: true,
      mappings,
      qualityReport: updatedQuality
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 12. Delete / Abandon Session
offlineDataImportRouter.delete('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const deleted = importSessionManager.cleanupSession(req.params.sessionId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 13. Commit and save dataset into canonical store (Using importSessionId)
offlineDataImportRouter.post('/commit', (req: Request, res: Response) => {
  try {
    const { importSessionId, fileName, fileType, fileSize, rawRecords, mappings, overrides } = req.body;

    // PATH 1: Memory-Safe Session Commit via importSessionId
    if (importSessionId) {
      const savedRecord = importSessionManager.commitSession(importSessionId, overrides, mappings);
      return res.json({
        success: true,
        dataset: savedRecord.metadata,
        datasetRecord: savedRecord
      });
    }

    // PATH 2: Backward-compatible in-memory commit
    if (!rawRecords || !mappings) {
      return res.status(400).json({
        success: false,
        error: 'Either importSessionId or (rawRecords and mappings) are required to commit dataset',
        code: 'INVALID_REQUEST'
      });
    }

    const savedRecord = offlineDataImportEngine.commitDataset(
      fileName || 'imported_dataset',
      fileType || 'XML',
      fileSize || 50000,
      rawRecords,
      mappings,
      overrides
    );

    res.json({
      success: true,
      dataset: savedRecord.metadata,
      datasetRecord: savedRecord
    });
  } catch (err: any) {
    console.error('[OfflineDataImport] Commit error:', err);
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 14. Cleanup Abandoned Sessions & Temp Files
offlineDataImportRouter.post('/cleanup', (req: Request, res: Response) => {
  try {
    const maxAgeMs = req.body?.maxAgeMs ? Number(req.body.maxAgeMs) : 24 * 60 * 60 * 1000;
    const cleanedSessions = importSessionManager.cleanupAbandonedSessions(maxAgeMs);
    const cleanedUploads = importSessionManager.cleanupTempUploads(tempUploadDir, 60 * 60 * 1000);

    res.json({
      success: true,
      cleanedSessions,
      cleanedUploads,
      message: `Cleaned ${cleanedSessions} expired sessions and ${cleanedUploads} temporary files`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 15. Load Sample Dataset
offlineDataImportRouter.post('/sample', (req: Request, res: Response) => {
  try {
    const { sampleType = 'XML' } = req.body;
    let fileName = 'DEMO_Apex_Global_Trading_FY2024_25.xml';
    let fileType: any = 'XML';
    let content = '';

    if (sampleType === 'JSON') {
      fileName = 'DEMO_Quantum_Retailers_FY2024_25.json';
      fileType = 'JSON';
      content = offlineDataImportEngine.generateSampleJson();
      const parsed = offlineDataImportEngine.parseJsonData(content, fileName);
      const mappings = offlineDataImportEngine.generateAutoMappings(parsed.rawRecords);
      const saved = offlineDataImportEngine.commitDataset(
        fileName, 
        fileType, 
        content.length, 
        parsed.rawRecords, 
        mappings, 
        {
          companyName: '[DEMO DATA] Quantum Retailers Limited',
          financialYearFrom: '2024-04-01',
          financialYearTo: '2025-03-31',
          isDemoData: true
        }
      );
      return res.json({ success: true, dataset: saved.metadata, datasetRecord: saved });
    } else {
      content = offlineDataImportEngine.generateSampleXml();
      const parsed = offlineDataImportEngine.parseXmlData(content, fileName);
      const mappings = offlineDataImportEngine.generateAutoMappings(parsed.rawRecords);
      const saved = offlineDataImportEngine.commitDataset(
        fileName, 
        fileType, 
        content.length, 
        parsed.rawRecords, 
        mappings, 
        {
          companyName: '[DEMO DATA] Apex Global Trading Pvt Ltd',
          financialYearFrom: '2024-04-01',
          financialYearTo: '2025-03-31',
          isDemoData: true
        }
      );
      return res.json({ success: true, dataset: saved.metadata, datasetRecord: saved });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 16. Run Offline Data Import Verification Tests
offlineDataImportRouter.get('/run-tests', async (req: Request, res: Response) => {
  try {
    const { runOfflineDataImportTests } = await import('./tests/offlineDataImport.test');
    const testResults = await runOfflineDataImportTests();
    res.json({ success: true, ...testResults });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// Centralized JSON Error Handler for Import Router — NEVER returns HTML
offlineDataImportRouter.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[OfflineDataImport Router Error]', err);
  const status = err.status || err.statusCode || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  let code = 'IMPORT_ERROR';
  if (status === 413 || err.code === 'LIMIT_FILE_SIZE') code = 'FILE_TOO_LARGE';
  else if (status === 400) code = 'INVALID_REQUEST';
  else if (status === 422) code = 'INVALID_TALLY_DATA';

  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected error occurred during offline import processing',
    code
  });
});
