import { Router, Request, Response } from 'express';
import { offlineDataImportEngine } from './offlineDataImportEngine';

export const offlineDataImportRouter = Router();

// 1. Get all imported datasets
offlineDataImportRouter.get('/datasets', (req: Request, res: Response) => {
  try {
    const datasets = offlineDataImportEngine.getAllDatasets();
    res.json({ success: true, count: datasets.length, datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get history (alias of datasets)
offlineDataImportRouter.get('/history', (req: Request, res: Response) => {
  try {
    const datasets = offlineDataImportEngine.getAllDatasets();
    res.json({ success: true, count: datasets.length, history: datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Set active dataset
offlineDataImportRouter.post('/active', (req: Request, res: Response) => {
  try {
    const { datasetId } = req.body;
    if (!datasetId) {
      return res.status(400).json({ success: false, error: 'datasetId is required' });
    }
    const success = offlineDataImportEngine.setActiveDataset(datasetId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }
    const active = offlineDataImportEngine.getActiveDataset();
    res.json({ success: true, activeDataset: active });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get dataset by ID
offlineDataImportRouter.get('/datasets/:id', (req: Request, res: Response) => {
  try {
    const dataset = offlineDataImportEngine.getDatasetById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }
    res.json({ success: true, dataset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Delete dataset by ID
offlineDataImportRouter.delete('/datasets/:id', (req: Request, res: Response) => {
  try {
    const success = offlineDataImportEngine.deleteDataset(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }
    res.json({ success: true, message: 'Dataset removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Parse uploaded file content (XML, JSON, Base64 Excel)
offlineDataImportRouter.post('/parse', (req: Request, res: Response) => {
  try {
    const { fileContent, fileType, fileName, base64Buffer } = req.body;

    if (!fileType) {
      return res.status(400).json({ success: false, error: 'fileType (XML, JSON, EXCEL) is required' });
    }

    let parsedResult: { preview: any; rawRecords: any };

    if (fileType === 'XML') {
      if (!fileContent) {
        return res.status(400).json({ success: false, error: 'fileContent string is required for XML' });
      }
      parsedResult = offlineDataImportEngine.parseXmlData(fileContent, fileName || 'imported_data.xml');
    } else if (fileType === 'JSON') {
      if (!fileContent) {
        return res.status(400).json({ success: false, error: 'fileContent string is required for JSON' });
      }
      parsedResult = offlineDataImportEngine.parseJsonData(fileContent, fileName || 'imported_data.json');
    } else if (fileType === 'EXCEL') {
      if (!base64Buffer && !fileContent) {
        return res.status(400).json({ success: false, error: 'base64Buffer or fileContent is required for Excel' });
      }
      const rawBuf = Buffer.from(base64Buffer || fileContent, 'base64');
      parsedResult = offlineDataImportEngine.parseExcelBuffer(rawBuf, fileName || 'imported_data.xlsx');
    } else {
      return res.status(400).json({ success: false, error: `Unsupported fileType: ${fileType}` });
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
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Commit and save dataset into canonical store
offlineDataImportRouter.post('/commit', (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize, rawRecords, mappings } = req.body;

    if (!rawRecords || !mappings) {
      return res.status(400).json({ success: false, error: 'rawRecords and mappings are required' });
    }

    const savedRecord = offlineDataImportEngine.commitDataset(
      fileName || 'imported_dataset',
      fileType || 'XML',
      fileSize || 50000,
      rawRecords,
      mappings
    );

    res.json({
      success: true,
      dataset: savedRecord.metadata,
      datasetRecord: savedRecord
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Load Sample Dataset
offlineDataImportRouter.post('/sample', (req: Request, res: Response) => {
  try {
    const { sampleType = 'XML' } = req.body;
    let fileName = 'Apex_Global_Trading_FY2024_25.xml';
    let fileType: any = 'XML';
    let content = '';

    if (sampleType === 'JSON') {
      fileName = 'Quantum_Retailers_FY2024_25.json';
      fileType = 'JSON';
      content = offlineDataImportEngine.generateSampleJson();
      const parsed = offlineDataImportEngine.parseJsonData(content, fileName);
      const mappings = offlineDataImportEngine.generateAutoMappings(parsed.rawRecords);
      const saved = offlineDataImportEngine.commitDataset(fileName, fileType, content.length, parsed.rawRecords, mappings);
      return res.json({ success: true, dataset: saved.metadata, datasetRecord: saved });
    } else {
      content = offlineDataImportEngine.generateSampleXml();
      const parsed = offlineDataImportEngine.parseXmlData(content, fileName);
      const mappings = offlineDataImportEngine.generateAutoMappings(parsed.rawRecords);
      const saved = offlineDataImportEngine.commitDataset(fileName, fileType, content.length, parsed.rawRecords, mappings);
      return res.json({ success: true, dataset: saved.metadata, datasetRecord: saved });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
