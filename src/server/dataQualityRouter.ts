/**
 * Phase 32F: Data Quality, Validation, Duplicate Detection & Controlled Transformation Router
 *
 * Exposes REST API endpoints mounted at /api/quality and /api/phase32f
 */

import { Router, Request, Response } from 'express';
import { dataQualityEngine } from './dataQualityEngine';
import { runPhase32FTestSuite } from '../tests/phase32FQualityTests';

export const dataQualityRouter = Router();

// 1. Overall Company Quality Dashboard
dataQualityRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const financialYear = req.query.financialYear as string;
    const dashboard = await dataQualityEngine.evaluateCompanyQuality(companyId, financialYear);
    res.json({ success: true, dashboard });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Specific Dataset Quality Drilldown
dataQualityRouter.get('/dataset', async (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const datasetId = (req.query.datasetId as string) || 'canonical-groups';
    const summary = await dataQualityEngine.evaluateDatasetQuality(datasetId, companyId);
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Findings Filter
dataQualityRouter.get('/findings', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const datasetId = req.query.datasetId as string;
    const severity = req.query.severity as any;
    const findings = dataQualityEngine.getFindings(companyId, datasetId, severity);
    res.json({ success: true, findings, count: findings.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Quality Exceptions (Mark as Reviewed, Accepted, Ignored)
dataQualityRouter.post('/exceptions', (req: Request, res: Response) => {
  try {
    const { findingId, action, reason, user } = req.body;
    if (!findingId || !action || !reason) {
      return res.status(400).json({ success: false, error: 'findingId, action, and reason are required.' });
    }
    const exc = dataQualityEngine.addException(findingId, action, reason, user || 'Admin');
    res.json({ success: true, exception: exc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.get('/exceptions', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const exceptions = dataQualityEngine.getExceptions(companyId);
    res.json({ success: true, exceptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Validation Rules
dataQualityRouter.get('/rules', (req: Request, res: Response) => {
  try {
    const datasetId = req.query.datasetId as string;
    const rules = dataQualityEngine.getRules(datasetId);
    res.json({ success: true, rules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.post('/rules', (req: Request, res: Response) => {
  try {
    const rule = dataQualityEngine.registerRule(req.body);
    res.json({ success: true, rule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Duplicates (Exact & Possible)
dataQualityRouter.get('/duplicates', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const datasetId = (req.query.datasetId as string) || 'canonical-ledgers';
    const exact = dataQualityEngine.findExactDuplicates(datasetId, companyId);
    const possible = dataQualityEngine.findPossibleDuplicates(datasetId, companyId);
    res.json({ success: true, exact, possible, totalDuplicates: exact.length + possible.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.post('/duplicates/review', (req: Request, res: Response) => {
  try {
    const { matchId, status, user } = req.body;
    if (!matchId || !status) {
      return res.status(400).json({ success: false, error: 'matchId and status are required.' });
    }
    dataQualityEngine.reviewDuplicate(matchId, status, user || 'Admin');
    res.json({ success: true, message: `Duplicate match ${matchId} marked as ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Transformation Rules & Approval
dataQualityRouter.get('/transformations/rules', (req: Request, res: Response) => {
  try {
    const datasetId = req.query.datasetId as string;
    const rules = dataQualityEngine.getRules(datasetId);
    res.json({ success: true, rules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.post('/transformations/rules', (req: Request, res: Response) => {
  try {
    const rule = dataQualityEngine.createRule(req.body);
    res.json({ success: true, rule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.post('/transformations/rules/:ruleId/approve', (req: Request, res: Response) => {
  try {
    const ruleId = req.params.ruleId;
    const approvedBy = req.body.approvedBy || 'Admin';
    const rule = dataQualityEngine.approveRule(ruleId, approvedBy);
    res.json({ success: true, rule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.post('/transformations/preview', async (req: Request, res: Response) => {
  try {
    const { ruleId, companyId, sampleSize } = req.body;
    const preview = await dataQualityEngine.previewTransformation(ruleId, companyId || 'CMP-001', sampleSize || 25);
    res.json({ success: true, preview });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

dataQualityRouter.post('/transformations/apply', async (req: Request, res: Response) => {
  try {
    const { datasetId, companyId } = req.body;
    const result = await dataQualityEngine.applyTransformations(datasetId, companyId || 'CMP-001');
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Quality Findings Export
dataQualityRouter.get('/export', (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'CMP-001';
    const format = (req.query.format as string) || 'json';
    const findings = dataQualityEngine.getFindings(companyId);

    if (format === 'csv') {
      const headers = 'findingId,datasetId,recordId,field,severity,category,message,detectedAt\n';
      const rows = findings
        .map(
          (f) =>
            `"${f.findingId}","${f.datasetId}","${f.recordId}","${f.field || ''}","${f.severity}","${f.category}","${f.message.replace(
              /"/g,
              '""'
            )}","${f.detectedAt}"`
        )
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="data-quality-findings-${companyId}.csv"`);
      return res.send(headers + rows);
    }

    res.json({ success: true, findings, exportedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Read-Only Tally Safety Verification
dataQualityRouter.get('/safety', (req: Request, res: Response) => {
  const safety = dataQualityEngine.verifyReadOnlyTallySafety();
  res.json({ success: true, safety });
});

// 10. Automated Test Runner for Phase 32F
dataQualityRouter.post('/run-phase32f-tests', async (req: Request, res: Response) => {
  try {
    const report = await runPhase32FTestSuite();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
