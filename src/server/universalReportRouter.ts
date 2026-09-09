/**
 * Phase 32I - Universal Report Router
 * Express REST API endpoints for Output Catalog, Discovery, Report Definitions,
 * Execution, Preview, Grain Validation, Drill-Down, Record Details, and Export.
 */

import { Router } from 'express';
import { universalReportEngine } from './universalReportEngine';
import { tallyOutputDiscoveryEngine } from './tallyOutputDiscoveryEngine';

export const universalReportRouter = Router();

// 1. Output Catalog & Discovery
universalReportRouter.get(['/catalog', '/phase32i/catalog'], async (req, res) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const catalog = await universalReportEngine.getOutputCatalog(companyId);
    res.json({ success: true, count: catalog.length, catalog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

universalReportRouter.post(['/catalog/discover', '/phase32i/catalog/discover'], async (req, res) => {
  try {
    const companyId = req.body.companyId || 'CMP-001';
    const outputs = await universalReportEngine.discoverOutputs(companyId);
    res.json({ success: true, count: outputs.length, outputs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

universalReportRouter.post(['/catalog/refresh', '/phase32i/catalog/refresh'], async (req, res) => {
  try {
    const companyId = req.body.companyId || 'CMP-001';
    const result = await tallyOutputDiscoveryEngine.refreshCatalog(companyId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Report Templates
universalReportRouter.get(['/templates', '/phase32i/templates'], async (req, res) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const templates = await universalReportEngine.getTemplates(companyId);
    res.json({ success: true, count: templates.length, templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Report Definitions
universalReportRouter.get(['/definitions', '/phase32i/definitions'], async (req, res) => {
  try {
    const companyId = req.query.companyId as string;
    const userRole = (req.headers['x-user-role'] as string) || 'ADMIN';
    const reports = await universalReportEngine.listReports(companyId, userRole);
    res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

universalReportRouter.get(['/definitions/:reportId', '/phase32i/definitions/:reportId'], async (req, res) => {
  try {
    const report = await universalReportEngine.getReportDefinition(req.params.reportId);
    if (!report) {
      res.status(404).json({ success: false, error: 'Report definition not found' });
      return;
    }
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

universalReportRouter.post(['/definitions', '/phase32i/definitions'], async (req, res) => {
  try {
    const report = await universalReportEngine.createReportDefinition(req.body);
    res.status(201).json({ success: true, report });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

universalReportRouter.put(['/definitions/:reportId', '/phase32i/definitions/:reportId'], async (req, res) => {
  try {
    const report = await universalReportEngine.updateReportDefinition(req.params.reportId, req.body);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Execution & Preview
universalReportRouter.post(['/execute/:reportId', '/phase32i/execute/:reportId'], async (req, res) => {
  try {
    const userRole = (req.headers['x-user-role'] as string) || 'ADMIN';
    const result = await universalReportEngine.executeReport(req.params.reportId, req.body, userRole);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

universalReportRouter.post(['/preview', '/phase32i/preview'], async (req, res) => {
  try {
    const limit = req.body.limit ? Number(req.body.limit) : 10;
    const result = await universalReportEngine.previewReport(req.body, limit);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

universalReportRouter.post(['/validate-grain', '/phase32i/validate-grain'], async (req, res) => {
  try {
    const result = await universalReportEngine.validateReportGrain(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Drill-down, Drill-up & Record Detail
universalReportRouter.get(['/drill-down', '/phase32i/drill-down'], async (req, res) => {
  try {
    const level = (req.query.level as string) || 'Group';
    const filterKey = (req.query.filterKey as string) || 'groupName';
    const filterValue = req.query.filterValue as string;
    const companyId = (req.query.companyId as string) || 'CMP-001';

    const rows = await universalReportEngine.drillDown(level, filterKey, filterValue, companyId);
    res.json({ success: true, count: rows.length, rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

universalReportRouter.get(['/drill-up', '/phase32i/drill-up'], async (req, res) => {
  try {
    const level = (req.query.level as string) || 'Voucher';
    const currentKey = req.query.currentKey as string;
    const companyId = (req.query.companyId as string) || 'CMP-001';

    const rows = await universalReportEngine.drillUp(level, currentKey, companyId);
    res.json({ success: true, count: rows.length, rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

universalReportRouter.get(['/record-detail', '/phase32i/record-detail'], async (req, res) => {
  try {
    const datasetId = (req.query.datasetId as string) || 'canonical-vouchers';
    const recordId = req.query.recordId as string;
    const companyId = (req.query.companyId as string) || 'CMP-001';

    const detail = await universalReportEngine.getRecordDetail(datasetId, recordId, companyId);
    res.json({ success: true, detail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Export & Favorites
universalReportRouter.post(['/export/:reportId', '/phase32i/export/:reportId'], async (req, res) => {
  try {
    const format = (req.body.format as 'CSV' | 'Excel' | 'PDF') || 'CSV';
    const userRole = (req.headers['x-user-role'] as string) || 'ADMIN';

    const exportRes = await universalReportEngine.exportReport(req.params.reportId, format, userRole);
    res.setHeader('Content-Type', exportRes.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportRes.fileName}"`);
    res.send(exportRes.content);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

universalReportRouter.post(['/favorite/:reportId', '/phase32i/favorite/:reportId'], async (req, res) => {
  try {
    const isFav = await universalReportEngine.toggleFavorite(req.params.reportId);
    res.json({ success: true, isFavorite: isFav });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
