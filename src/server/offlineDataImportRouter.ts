import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import multer from 'multer';
import { offlineDataImportEngine } from './offlineDataImportEngine';
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
    fileSize: 500 * 1024 * 1024 // 500 MB
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

// 1. Get all imported datasets
offlineDataImportRouter.get('/datasets', (req: Request, res: Response) => {
  try {
    const datasets = offlineDataImportEngine.getAllDatasets();
    res.json({ success: true, count: datasets.length, datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'FETCH_DATASETS_ERROR' });
  }
});

// 2. Get history (alias of datasets)
offlineDataImportRouter.get('/history', (req: Request, res: Response) => {
  try {
    const datasets = offlineDataImportEngine.getAllDatasets();
    res.json({ success: true, count: datasets.length, history: datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'FETCH_HISTORY_ERROR' });
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
    res.status(500).json({ success: false, error: err.message, code: 'FETCH_ACTIVE_ERROR' });
  }
});

// 4. Set active dataset
offlineDataImportRouter.post('/active', (req: Request, res: Response) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res.status(400).json({ success: false, error: 'datasetId is required', code: 'MISSING_DATASET_ID' });
    }
    const success = offlineDataImportEngine.setActiveDataset(datasetId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Dataset not found', code: 'DATASET_NOT_FOUND' });
    }
    const active = offlineDataImportEngine.getActiveDataset();
    res.json({ success: true, activeDataset: active });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'SET_ACTIVE_ERROR' });
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
    res.status(500).json({ success: false, error: err.message, code: 'GET_DATASET_ERROR' });
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
    res.status(500).json({ success: false, error: err.message, code: 'DELETE_DATASET_ERROR' });
  }
});

// 7. Multipart / Streaming Upload and Parse (Handles files up to 500MB without memory exhaustion)
offlineDataImportRouter.post('/upload-and-parse', upload.single('file'), (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a file in the "file" field of multipart form data.',
        code: 'NO_FILE_UPLOADED'
      });
    }

    uploadedFilePath = req.file.path;
    const originalFileName = req.file.originalname || path.basename(uploadedFilePath);
    const fileType: ImportFileFormat = (req.body.fileType as ImportFileFormat) || inferFileType(originalFileName);

    // Parse file directly from temporary disk location
    const parsedResult = offlineDataImportEngine.parseFileFromDisk(uploadedFilePath, fileType, originalFileName);

    // Auto-generate field mappings and evaluate data quality
    const mappings = offlineDataImportEngine.generateAutoMappings(parsedResult.rawRecords);
    const qualityReport = offlineDataImportEngine.evaluateDataQuality(parsedResult.rawRecords, mappings);

    res.json({
      success: true,
      preview: parsedResult.preview,
      rawRecords: parsedResult.rawRecords,
      mappings,
      qualityReport
    });
  } catch (err: any) {
    console.error('[OfflineDataImport] Parse error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to parse uploaded file',
      code: 'PARSE_FAILED'
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
offlineDataImportRouter.post('/parse', upload.single('file'), (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;
  try {
    // If uploaded via multipart/form-data
    if (req.file) {
      uploadedFilePath = req.file.path;
      const originalFileName = req.file.originalname || path.basename(uploadedFilePath);
      const fileType: ImportFileFormat = (req.body.fileType as ImportFileFormat) || inferFileType(originalFileName);

      const parsedResult = offlineDataImportEngine.parseFileFromDisk(uploadedFilePath, fileType, originalFileName);
      const mappings = offlineDataImportEngine.generateAutoMappings(parsedResult.rawRecords);
      const qualityReport = offlineDataImportEngine.evaluateDataQuality(parsedResult.rawRecords, mappings);

      return res.json({
        success: true,
        preview: parsedResult.preview,
        rawRecords: parsedResult.rawRecords,
        mappings,
        qualityReport
      });
    }

    // Otherwise handle JSON body payload
    const { fileContent, fileType, fileName, base64Buffer } = req.body || {};

    if (!fileType) {
      return res.status(400).json({ success: false, error: 'fileType (XML, JSON, EXCEL) is required', code: 'MISSING_FILE_TYPE' });
    }

    let parsedResult: { preview: any; rawRecords: any };

    if (fileType === 'XML') {
      if (!fileContent) {
        return res.status(400).json({ success: false, error: 'fileContent string is required for XML', code: 'MISSING_CONTENT' });
      }
      parsedResult = offlineDataImportEngine.parseXmlData(fileContent, fileName || 'imported_data.xml');
    } else if (fileType === 'JSON') {
      if (!fileContent) {
        return res.status(400).json({ success: false, error: 'fileContent string is required for JSON', code: 'MISSING_CONTENT' });
      }
      parsedResult = offlineDataImportEngine.parseJsonData(fileContent, fileName || 'imported_data.json');
    } else if (fileType === 'EXCEL') {
      if (!base64Buffer && !fileContent) {
        return res.status(400).json({ success: false, error: 'base64Buffer or fileContent is required for Excel', code: 'MISSING_CONTENT' });
      }
      const rawBuf = Buffer.from(base64Buffer || fileContent, 'base64');
      parsedResult = offlineDataImportEngine.parseExcelBuffer(rawBuf, fileName || 'imported_data.xlsx');
    } else {
      return res.status(400).json({ success: false, error: `Unsupported fileType: ${fileType}`, code: 'UNSUPPORTED_TYPE' });
    }

    // Generate auto-mappings & initial quality score
    const mappings = offlineDataImportEngine.generateAutoMappings(parsedResult.rawRecords);
    const qualityReport = offlineDataImportEngine.evaluateDataQuality(parsedResult.rawRecords, mappings);

    res.json({
      success: true,
      preview: parsedResult.preview,
      rawRecords: parsedResult.rawRecords,
      mappings,
      qualityReport
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message, code: 'PARSE_FAILED' });
  } finally {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.warn('[OfflineDataImport] Failed to cleanup temp file:', uploadedFilePath, cleanupErr);
      }
    }
  }
});

// 9. Commit and save dataset into canonical store
offlineDataImportRouter.post('/commit', (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize, rawRecords, mappings, overrides } = req.body;

    if (!rawRecords || !mappings) {
      return res.status(400).json({ success: false, error: 'rawRecords and mappings are required', code: 'MISSING_COMMIT_PAYLOAD' });
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
    res.status(500).json({ success: false, error: err.message, code: 'COMMIT_FAILED' });
  }
});

// 10. Load Sample Dataset
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
    res.status(500).json({ success: false, error: err.message, code: 'LOAD_SAMPLE_ERROR' });
  }
});

// 11. Run Offline Data Import Verification Tests
offlineDataImportRouter.get('/run-tests', async (req: Request, res: Response) => {
  try {
    const { runOfflineDataImportTests } = await import('./tests/offlineDataImport.test');
    const testResults = await runOfflineDataImportTests();
    res.json({ success: true, ...testResults });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'RUN_TESTS_ERROR' });
  }
});

// Centralized JSON Error Handler for Import Router
offlineDataImportRouter.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[OfflineDataImport Router Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected error occurred during offline import processing',
    code: err.code || 'IMPORT_ROUTE_ERROR'
  });
});

