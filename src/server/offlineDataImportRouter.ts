import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import multer from 'multer';
import { offlineDataImportEngine } from './offlineDataImportEngine';
import { importSessionManager } from './importSessionManager';
import { ImportFileFormat } from '../types/offlineDataImport';
import { inspectFileHeader, detectStreamStructure } from './tallyJsonStructureDetector';

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

// Concurrency control for resource-intensive imports (Fix #16)
let activeImportsCount = 0;
const MAX_CONCURRENT_IMPORTS = 2;

// Filename sanitizer to prevent directory traversal and null-byte injection (Fix #11)
export function sanitizeUploadedFilename(name: string): string {
  if (!name || typeof name !== 'string') return 'upload';
  const noNulls = name.replace(/\0/g, '').trim();
  const base = path.basename(noNulls).replace(/[/\\?%*:|"<>]/g, '_');
  return base.replace(/\.\.+/g, '.').trim() || 'upload';
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
    const safeBase = sanitizeUploadedFilename(file.originalname);
    const ext = path.extname(safeBase) || '.dat';
    cb(null, `tally_import_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.includes('\0') || file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename containing path traversal characters'));
    }
    cb(null, true);
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

// -----------------------------------------------------------------------------
// CHUNKED UPLOAD CONSTANTS & HELPERS
// -----------------------------------------------------------------------------

export const CHUNK_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
export const chunksBaseDir = path.join(process.cwd(), 'data', 'temp_uploads', 'chunks');
try {
  fs.mkdirSync(chunksBaseDir, { recursive: true });
} catch (_) {}

/**
 * Diagnostic & Health endpoint for large-file chunked upload
 * GET /api/import/chunk/health
 */
offlineDataImportRouter.get('/chunk/health', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    success: true,
    chunkUpload: true,
    chunkSize: CHUNK_SIZE_BYTES,
    maxFileSize: MAX_FILE_SIZE_BYTES
  });
});

/**
 * Initialize a chunked upload session
 * POST /api/import/chunk/init
 */
offlineDataImportRouter.post('/chunk/init', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { originalFilename, totalFileSize, totalChunks, mimeType } = req.body || {};

    if (!originalFilename || totalFileSize === undefined || totalChunks === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: originalFilename, totalFileSize, totalChunks',
        code: 'INVALID_REQUEST'
      });
    }

    const parsedTotalSize = Number(totalFileSize);
    const parsedTotalChunks = Number(totalChunks);

    if (isNaN(parsedTotalSize) || parsedTotalSize <= 0 || isNaN(parsedTotalChunks) || parsedTotalChunks <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid totalFileSize or totalChunks',
        code: 'INVALID_PARAMETERS'
      });
    }

    if (parsedTotalSize > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({
        success: false,
        error: 'File size exceeds 500 MB limit',
        code: 'FILE_TOO_LARGE'
      });
    }

    // Path traversal check & allowed extension
    const safeFilename = sanitizeUploadedFilename(originalFilename);
    const lowerExt = path.extname(safeFilename).toLowerCase();
    const allowedExtensions = ['.json', '.xml', '.xlsx', '.xls', '.csv'];
    if (!allowedExtensions.includes(lowerExt)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    const uploadId = crypto.randomUUID ? crypto.randomUUID() : (crypto.randomBytes(16).toString('hex') + '-' + Date.now());
    const uploadSessionDir = path.join(chunksBaseDir, uploadId);

    fs.mkdirSync(uploadSessionDir, { recursive: true });

    // Store session metadata on disk
    fs.writeFileSync(path.join(uploadSessionDir, 'session.json'), JSON.stringify({
      uploadId,
      originalFilename,
      safeFilename,
      totalFileSize: parsedTotalSize,
      totalChunks: parsedTotalChunks,
      mimeType: mimeType ? String(mimeType) : 'application/octet-stream',
      createdAt: Date.now()
    }, null, 2));

    return res.json({
      success: true,
      uploadId,
      safeFilename
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to initialize chunked upload',
      code: 'INIT_ERROR'
    });
  }
});

/**
 * Get upload session status and list of received chunks for resumption
 * GET /api/import/chunk/status
 */
offlineDataImportRouter.get('/chunk/status', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const uploadId = ((req.headers['x-upload-id'] as string) || (req.query.uploadId as string) || '').trim();

  if (!uploadId || !/^[a-zA-Z0-9_-]+$/.test(uploadId)) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid uploadId',
      code: 'INVALID_UPLOAD_ID'
    });
  }

  const uploadSessionDir = path.join(chunksBaseDir, uploadId);
  if (!fs.existsSync(uploadSessionDir)) {
    return res.status(404).json({
      success: false,
      error: 'Upload session not found or expired',
      code: 'SESSION_NOT_FOUND'
    });
  }

  try {
    let sessionMeta: any = {};
    const sessionPath = path.join(uploadSessionDir, 'session.json');
    if (fs.existsSync(sessionPath)) {
      sessionMeta = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    }

    let manifestMeta: any = {};
    const manifestPath = path.join(uploadSessionDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      manifestMeta = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

    const totalChunks = manifestMeta.totalChunks || sessionMeta.totalChunks || 0;
    const receivedChunks: number[] = [];
    const missingChunks: number[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const paddedName = `chunk-${String(i).padStart(6, '0')}`;
      const legacyName = `chunk_${i}`;
      const paddedPath = path.join(uploadSessionDir, paddedName);
      const legacyPath = path.join(uploadSessionDir, legacyName);
      if (fs.existsSync(paddedPath) || fs.existsSync(legacyPath)) {
        receivedChunks.push(i);
      } else {
        missingChunks.push(i);
      }
    }

    const memory = process.memoryUsage();
    return res.json({
      success: true,
      uploadId,
      fileName: manifestMeta.fileName || sessionMeta.originalFilename || '',
      totalFileSize: manifestMeta.totalFileSize || sessionMeta.totalFileSize || 0,
      chunkSize: manifestMeta.chunkSize || 3 * 1024 * 1024,
      totalChunks,
      receivedChunks,
      receivedCount: receivedChunks.length,
      missingChunks,
      isComplete: totalChunks > 0 && receivedChunks.length === totalChunks,
      serverHealth: {
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        rssMb: +(memory.rss / (1024 * 1024)).toFixed(2),
        heapUsedMb: +(memory.heapUsed / (1024 * 1024)).toFixed(2),
        heapTotalMb: +(memory.heapTotal / (1024 * 1024)).toFixed(2)
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve upload status: ${err.message}`,
      code: 'STATUS_ERROR'
    });
  }
});

/**
 * Handle raw binary octet-stream chunk upload streamed directly to disk
 * POST /api/import/chunk
 */
export function handleRawChunkUpload(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');

  // Prevent socket timeouts during chunk transfers
  if (req.socket) {
    req.socket.setTimeout(120000);
  }

  const uploadId = ((req.headers['x-upload-id'] as string) || (req.query.uploadId as string) || '').trim();
  const rawChunkIndex = (req.headers['x-chunk-index'] as string) || (req.query.chunkIndex as string);
  const rawTotalChunks = (req.headers['x-total-chunks'] as string) || (req.query.totalChunks as string);
  const rawTotalFileSize = (req.headers['x-total-file-size'] as string) || (req.query.totalFileSize as string);
  const rawOriginalFilename = (req.headers['x-original-filename'] as string) || (req.query.originalFilename as string) || '';

  const initialMem = process.memoryUsage();
  const reqStart = Date.now();

  if (!uploadId || rawChunkIndex === undefined || rawTotalChunks === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required metadata headers or query params: uploadId, chunkIndex, totalChunks',
      code: 'INVALID_REQUEST'
    });
  }

  // Prevent path traversal in uploadId
  if (!/^[a-zA-Z0-9_-]+$/.test(uploadId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid uploadId format (potential path traversal)',
      code: 'INVALID_UPLOAD_ID'
    });
  }

  const chunkIndex = parseInt(rawChunkIndex, 10);
  const totalChunks = parseInt(rawTotalChunks, 10);
  const totalFileSize = rawTotalFileSize ? parseInt(rawTotalFileSize, 10) : undefined;

  if (isNaN(chunkIndex) || chunkIndex < 0 || isNaN(totalChunks) || totalChunks <= 0 || chunkIndex >= totalChunks) {
    return res.status(400).json({
      success: false,
      error: `Invalid chunkIndex (${chunkIndex}) or totalChunks (${totalChunks})`,
      code: 'INVALID_INDEX'
    });
  }

  if (totalFileSize !== undefined && totalFileSize > MAX_FILE_SIZE_BYTES) {
    return res.status(413).json({
      success: false,
      error: 'File size exceeds 500 MB limit',
      code: 'FILE_TOO_LARGE'
    });
  }

  const uploadSessionDir = path.join(chunksBaseDir, uploadId);
  if (!fs.existsSync(uploadSessionDir)) {
    return res.status(404).json({
      success: false,
      error: 'Upload session not found or expired',
      code: 'SESSION_NOT_FOUND'
    });
  }

  // Verify previous chunks exist on disk (Requirement 5)
  let previousChunksVerified = true;
  if (chunkIndex > 0) {
    for (let prev = 0; prev < chunkIndex; prev++) {
      const prevPadded = `chunk-${String(prev).padStart(6, '0')}`;
      const prevLegacy = `chunk_${prev}`;
      if (!fs.existsSync(path.join(uploadSessionDir, prevPadded)) && !fs.existsSync(path.join(uploadSessionDir, prevLegacy))) {
        previousChunksVerified = false;
        break;
      }
    }
  }

  // Standard chunk format: chunk-000000, chunk-000001, etc.
  const chunkFileName = `chunk-${String(chunkIndex).padStart(6, '0')}`;
  const chunkFilePath = path.join(uploadSessionDir, chunkFileName);
  const tempChunkPath = `${chunkFilePath}.tmp_${Date.now()}`;

  const writeStream = fs.createWriteStream(tempChunkPath);
  let receivedBytes = 0;
  let aborted = false;

  req.on('data', (data: Buffer) => {
    receivedBytes += data.length;
    // Cap chunk size to 15 MB to prevent abuse
    if (receivedBytes > 15 * 1024 * 1024) {
      aborted = true;
      req.destroy(new Error('Chunk exceeded maximum chunk size limit (15 MB)'));
    }
  });

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    if (aborted) {
      try { if (fs.existsSync(tempChunkPath)) fs.unlinkSync(tempChunkPath); } catch (_) {}
      return;
    }

    try {
      if (fs.existsSync(chunkFilePath)) {
        fs.unlinkSync(chunkFilePath);
      }
      fs.renameSync(tempChunkPath, chunkFilePath);

      const chunkStat = fs.statSync(chunkFilePath);
      const finalMem = process.memoryUsage();

      // Persistent Manifest on Disk (Requirement 6)
      try {
        const manifestPath = path.join(uploadSessionDir, 'manifest.json');
        let manifest: any = {
          uploadId,
          fileName: rawOriginalFilename ? decodeURIComponent(rawOriginalFilename) : 'uploaded_file',
          totalFileSize: totalFileSize || 0,
          chunkSize: chunkStat.size,
          totalChunks,
          receivedChunks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          chunks: {}
        };

        if (fs.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          } catch (_) {}
        }

        manifest.updatedAt = new Date().toISOString();
        if (!manifest.chunks) manifest.chunks = {};
        manifest.chunks[String(chunkIndex)] = {
          index: chunkIndex,
          size: chunkStat.size,
          path: chunkFilePath,
          receivedAt: new Date().toISOString(),
          durationMs: Date.now() - reqStart
        };

        // Recalculate receivedChunks array
        const allIndices: number[] = [];
        for (let idx = 0; idx < totalChunks; idx++) {
          const pName = `chunk-${String(idx).padStart(6, '0')}`;
          const lName = `chunk_${idx}`;
          if (fs.existsSync(path.join(uploadSessionDir, pName)) || fs.existsSync(path.join(uploadSessionDir, lName))) {
            allIndices.push(idx);
          }
        }
        manifest.receivedChunks = allIndices;

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

        // Also write chunks_manifest.json for backwards compatibility
        const legacyManifestPath = path.join(uploadSessionDir, 'chunks_manifest.json');
        fs.writeFileSync(legacyManifestPath, JSON.stringify(manifest.chunks, null, 2), 'utf-8');
      } catch (_) {}

      // Server Diagnostic Logging (Requirement 2 & 4) - Metadata only, NO accounting or file content
      const expectedChunkBytes = req.headers['content-length'] ? parseInt(req.headers['content-length'] as string, 10) : receivedBytes;
      console.log(`[CHUNK] uploadId=${uploadId} chunk=${chunkIndex + 1}/${totalChunks} expectedBytes=${expectedChunkBytes} receivedBytes=${receivedBytes} status=200 pid=${process.pid} uptime=${Math.floor(process.uptime())}s rss=${(finalMem.rss / (1024 * 1024)).toFixed(1)}MB heapUsed=${(finalMem.heapUsed / (1024 * 1024)).toFixed(1)}MB prevChunksOk=${previousChunksVerified}`);

    } catch (renameErr: any) {
      console.error(`[CHUNK ERROR] uploadId=${uploadId} chunk=${chunkIndex + 1}/${totalChunks} save failed: ${renameErr.message}`);
      return res.status(500).json({
        success: false,
        error: `Failed to save chunk to disk: ${renameErr.message}`,
        code: 'CHUNK_SAVE_FAILED'
      });
    }

    const currentMem = process.memoryUsage();
    return res.json({
      success: true,
      uploadId,
      chunkIndex,
      receivedBytes,
      serverHealth: {
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        rssMb: +(currentMem.rss / (1024 * 1024)).toFixed(2),
        heapUsedMb: +(currentMem.heapUsed / (1024 * 1024)).toFixed(2)
      }
    });
  });

  writeStream.on('error', (err: any) => {
    try { if (fs.existsSync(tempChunkPath)) fs.unlinkSync(tempChunkPath); } catch (_) {}
    console.error(`[CHUNK ERROR] uploadId=${uploadId} chunk=${chunkIndex + 1}/${totalChunks} write error: ${err.message}`);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: `Error writing chunk: ${err.message}`,
        code: 'CHUNK_WRITE_ERROR'
      });
    }
  });

  req.on('error', (err: any) => {
    writeStream.destroy();
    try { if (fs.existsSync(tempChunkPath)) fs.unlinkSync(tempChunkPath); } catch (_) {}
    console.error(`[CHUNK ERROR] uploadId=${uploadId} chunk=${chunkIndex + 1}/${totalChunks} stream error: ${err.message}`);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: `Request stream error: ${err.message}`,
        code: 'STREAM_ERROR'
      });
    }
  });
}

// Also register chunk upload and status on the router for direct routing
offlineDataImportRouter.post('/chunk', handleRawChunkUpload);

/**
 * Complete chunked upload, assemble chunks sequentially via streaming, verify size/hash,
 * and pass to existing streaming parser
 * POST /api/import/chunk/complete
 */
offlineDataImportRouter.post('/chunk/complete', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  let assembledFilePath: string | null = null;
  let sessionId: string | null = null;
  let calculatedSha256: string | undefined;
  const { uploadId, originalFilename, totalFileSize, totalChunks, fileType: rawFileType } = req.body || {};
  const parsedTotalChunks = totalChunks !== undefined ? parseInt(totalChunks, 10) : 0;
  const parsedTotalFileSize = totalFileSize !== undefined ? parseInt(totalFileSize, 10) : 0;

  try {
    if (!uploadId || !originalFilename || totalFileSize === undefined || totalChunks === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: uploadId, originalFilename, totalFileSize, totalChunks',
        code: 'INVALID_REQUEST'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(uploadId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid uploadId format (potential path traversal)',
        code: 'INVALID_UPLOAD_ID'
      });
    }

    const uploadSessionDir = path.join(chunksBaseDir, uploadId);

    if (!fs.existsSync(uploadSessionDir)) {
      return res.status(404).json({
        success: false,
        error: 'Upload session not found or expired',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (activeImportsCount >= MAX_CONCURRENT_IMPORTS) {
      res.setHeader('Retry-After', '30');
      return res.status(429).json({
        success: false,
        error: 'The server is processing the maximum concurrent large file imports. Please retry shortly.',
        code: 'CONCURRENT_IMPORT_LIMIT_EXCEEDED'
      });
    }

    // 1. Verify every chunk exists (support both chunk-000000 and chunk_0 for backwards compatibility)
    for (let i = 0; i < parsedTotalChunks; i++) {
      const paddedName = `chunk-${String(i).padStart(6, '0')}`;
      const legacyName = `chunk_${i}`;
      const hasPadded = fs.existsSync(path.join(uploadSessionDir, paddedName));
      const hasLegacy = fs.existsSync(path.join(uploadSessionDir, legacyName));
      if (!hasPadded && !hasLegacy) {
        return res.status(400).json({
          success: false,
          error: `Missing chunk ${i} of ${parsedTotalChunks}`,
          code: 'CHUNK_MISSING'
        });
      }
    }

    activeImportsCount++;

    const safeFilename = sanitizeUploadedFilename(originalFilename);
    assembledFilePath = path.join(tempUploadDir, `assembled_${uploadId}_${safeFilename}`);

    // 2. Assemble chunks sequentially into one temporary file without loading into RAM (Step 1)
    const writeStream = fs.createWriteStream(assembledFilePath);
    const hash = crypto.createHash('sha256');

    for (let i = 0; i < parsedTotalChunks; i++) {
      const paddedName = `chunk-${String(i).padStart(6, '0')}`;
      const legacyName = `chunk_${i}`;
      const chunkPath = fs.existsSync(path.join(uploadSessionDir, paddedName))
        ? path.join(uploadSessionDir, paddedName)
        : path.join(uploadSessionDir, legacyName);

      await new Promise<void>((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.on('data', (chunkBuffer: Buffer) => {
          hash.update(chunkBuffer);
          const canWrite = writeStream.write(chunkBuffer);
          if (!canWrite) {
            readStream.pause();
            writeStream.once('drain', () => readStream.resume());
          }
        });
        readStream.on('end', () => resolve());
        readStream.on('error', reject);
      });
    }

    writeStream.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    // 3. Verify assembled file size and SHA-256 (Step 1)
    const stats = fs.statSync(assembledFilePath);
    const sha256 = hash.digest('hex');
    calculatedSha256 = sha256;

    if (stats.size !== parsedTotalFileSize) {
      return res.status(400).json({
        success: false,
        error: `File size mismatch: assembled ${stats.size} bytes, expected ${parsedTotalFileSize} bytes`,
        code: 'FILE_SIZE_MISMATCH',
        assembly: {
          assembled: false,
          originalSize: parsedTotalFileSize,
          assembledSize: stats.size,
          sizeMatch: false,
          sha256,
          chunkCount: parsedTotalChunks
        }
      });
    }

    // 4. Delete chunks directory only after successful assembly
    try {
      fs.rmSync(uploadSessionDir, { recursive: true, force: true });
    } catch (rmErr) {
      console.warn('Notice: Failed to clean chunk dir:', rmErr);
    }

    // Step 2: Verify File Type by inspecting only the beginning of the assembled file
    const fileType: ImportFileFormat = (rawFileType as ImportFileFormat) || inferFileType(safeFilename);
    const headerInfo = inspectFileHeader(assembledFilePath, 65536);
    if (fileType === 'JSON' && headerInfo.rootType === 'other') {
      return res.status(422).json({
        success: false,
        code: 'INVALID_JSON',
        error: `Invalid JSON file: first non-whitespace character '${headerInfo.firstNonWhitespaceChar}' is neither '{' nor '['`,
        assembly: {
          assembled: true,
          originalSize: parsedTotalFileSize,
          assembledSize: stats.size,
          sizeMatch: true,
          sha256,
          chunkCount: parsedTotalChunks
        },
        headerInspection: headerInfo
      });
    }

    // 5. Invoke the existing disk-based streaming parser
    const session = importSessionManager.createSession(safeFilename, fileType, stats.size);
    sessionId = session.sessionId;

    importSessionManager.updateProgress(sessionId, {
      phase: 'Processing',
      percent: 10,
      message: `Analyzing structure of ${safeFilename}...`
    });

    const sessionRecordsPath = path.join(process.cwd(), 'data', 'import_sessions', sessionId, 'records.json');

    const parsedResult = await offlineDataImportEngine.parseFileFromDiskAsync(
      assembledFilePath,
      fileType,
      safeFilename,
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

    const sampleVouchers = parsedResult.preview.sampleRecords || [];
    const sampleRecords = { vouchers: sampleVouchers, ledgers: [], stockItems: [] };
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
      sha256: calculatedSha256,
      assembly: {
        assembled: true,
        originalSize: parsedTotalFileSize,
        assembledSize: stats.size,
        sizeMatch: true,
        sha256: calculatedSha256,
        chunkCount: parsedTotalChunks
      },
      preview: parsedResult.preview,
      mappings,
      qualityReport,
      rawRecords: undefined
    });

  } catch (err: any) {
    console.error('[OfflineDataImport Chunk Complete Error]', err);
    if (sessionId) {
      importSessionManager.updateProgress(sessionId, {
        phase: 'Failed',
        percent: 100,
        error: err.message
      });
    }

    const currentAssembledSize = assembledFilePath && fs.existsSync(assembledFilePath) ? fs.statSync(assembledFilePath).size : 0;
    const assemblyInfo = {
      assembled: assembledFilePath ? fs.existsSync(assembledFilePath) : false,
      originalSize: parsedTotalFileSize,
      assembledSize: currentAssembledSize,
      sizeMatch: currentAssembledSize === parsedTotalFileSize,
      sha256: calculatedSha256,
      chunkCount: parsedTotalChunks
    };

    if (err.code === 'NO_VOUCHERS_FOUND') {
      let diagnostic = err.diagnostic;
      if (!diagnostic && assembledFilePath && fs.existsSync(assembledFilePath)) {
        try {
          diagnostic = await detectStreamStructure(assembledFilePath);
        } catch (_) {}
      }
      return res.status(422).json({
        success: false,
        code: 'NO_VOUCHERS_FOUND',
        error: 'DayBook JSON assembled successfully, but no supported voucher structure was detected.',
        assembly: assemblyInfo,
        diagnostic
      });
    }

    if (err.code === 'UNSUPPORTED_TALLY_JSON_STRUCTURE') {
      return res.status(422).json({
        success: false,
        code: 'UNSUPPORTED_TALLY_JSON_STRUCTURE',
        error: err.message,
        assembly: assemblyInfo
      });
    }

    const isMalformed = err.message && (err.message.includes('Invalid JSON') || err.message.includes('syntax') || err.message.includes('unclosed syntax') || err.message.includes('XML'));
    return res.status(422).json({
      success: false,
      error: err.message || 'Failed to parse assembled DayBook JSON',
      code: isMalformed ? 'INVALID_JSON' : (err.code || 'PARSER_ERROR'),
      assembly: assemblyInfo
    });
  } finally {
    if (activeImportsCount > 0) {
      activeImportsCount--;
    }
    if (assembledFilePath && fs.existsSync(assembledFilePath)) {
      try {
        fs.unlinkSync(assembledFilePath);
      } catch (e) {}
    }
  }
});

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
    const search = ((req.query.search as string) || '').trim();
    const voucherType = ((req.query.voucherType as string) || '').trim();

    const result = await offlineDataImportEngine.getVouchersPaginated(datasetId, page, limit, {
      search,
      voucherType
    });

    res.json({
      success: true,
      datasetId,
      page: result.page,
      limit: result.limit,
      totalVouchers: result.total,
      matchedVouchers: result.matchedCount ?? result.total,
      totalPages: result.totalPages,
      vouchers: result.items,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'IMPORT_ERROR' });
  }
});

// 5b. Get exceptions for a dataset with bounded pagination (Fix #3)
offlineDataImportRouter.get('/datasets/:id/exceptions', async (req: Request, res: Response) => {
  try {
    const datasetId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string || '50', 10)), 500);
    const search = req.query.search as string | undefined;
    const severity = req.query.severity as string | undefined;
    const type = req.query.type as string | undefined;

    const result = await offlineDataImportEngine.getExceptionsPaginated(datasetId, page, limit, {
      search,
      severity,
      type
    });

    res.json({
      success: true,
      datasetId,
      data: result.items,
      exceptions: result.items,
      count: result.items.length,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
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

  if (activeImportsCount >= MAX_CONCURRENT_IMPORTS) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.setHeader('Retry-After', '30');
    return res.status(429).json({
      success: false,
      error: 'The server is currently processing the maximum number of concurrent large file imports (2). Please retry shortly.',
      code: 'CONCURRENT_IMPORT_LIMIT_EXCEEDED'
    });
  }

  activeImportsCount++;

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
    const originalFileName = sanitizeUploadedFilename(req.file.originalname || path.basename(uploadedFilePath));
    const fileType: ImportFileFormat = (req.body.fileType as ImportFileFormat) || inferFileType(originalFileName);

    // Safe operational metadata logging (no confidential file content or headers)
    console.log(`[OfflineDataImport] Upload received: ${originalFileName} (${fileSize} bytes, detected format: ${fileType})`);

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
    activeImportsCount = Math.max(0, activeImportsCount - 1);
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

  if (activeImportsCount >= MAX_CONCURRENT_IMPORTS) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.setHeader('Retry-After', '30');
    return res.status(429).json({
      success: false,
      error: 'The server is currently processing the maximum number of concurrent large file imports (2). Please retry shortly.',
      code: 'CONCURRENT_IMPORT_LIMIT_EXCEEDED'
    });
  }

  activeImportsCount++;

  try {
    // Case A: Multipart upload
    if (req.file) {
      uploadedFilePath = req.file.path;
      const fileSize = req.file.size;
      const originalFileName = sanitizeUploadedFilename(req.file.originalname || path.basename(uploadedFilePath));
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
    activeImportsCount = Math.max(0, activeImportsCount - 1);
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
