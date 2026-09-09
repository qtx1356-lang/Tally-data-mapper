/**
 * Phase 32K Express Router
 * REST API endpoints for Output Reconstruction, Semantic Analysis, Report Equivalence,
 * Human Review Overrides, and Impact Analysis.
 */

import { Router } from 'express';
import { outputReconstructionEngine } from './outputReconstructionEngine';
import { reportEquivalenceEngine } from './reportEquivalenceEngine';
import { outputReconstructionCatalog } from './outputReconstructionCatalog';
import { auditEngine } from './auditEngine';
import { readOnlyGuard } from './readOnlyGuard';

export const outputReconstructionRouter = Router();

// GET /api/phase32k/catalog - Catalog & Reconstruction Dashboard summary
outputReconstructionRouter.get('/catalog', async (req, res) => {
  try {
    const entries = outputReconstructionCatalog.getAllCatalogEntries();
    const metrics = {
      totalOutputs: entries.length,
      confirmed: entries.filter((e) => e.status === 'CONFIRMED').length,
      highConfidence: entries.filter((e) => e.status === 'HIGH_CONFIDENCE').length,
      partial: entries.filter((e) => e.status === 'PARTIAL').length,
      lowConfidence: entries.filter((e) => e.status === 'LOW_CONFIDENCE').length,
      unavailable: entries.filter((e) => e.status === 'UNAVAILABLE').length,
      notReconstructable: entries.filter((e) => e.status === 'NOT_RECONSTRUCTABLE').length,
      equivalenceBreakdown: {
        exact: entries.filter((e) => e.equivalenceLevel === 'EXACT').length,
        functionallyEquivalent: entries.filter((e) => e.equivalenceLevel === 'FUNCTIONALLY_EQUIVALENT').length,
        partiallyEquivalent: entries.filter((e) => e.equivalenceLevel === 'PARTIALLY_EQUIVALENT').length,
        approximate: entries.filter((e) => e.equivalenceLevel === 'APPROXIMATE').length,
        notEquivalent: entries.filter((e) => e.equivalenceLevel === 'NOT_EQUIVALENT').length
      }
    };

    res.json({ success: true, metrics, catalog: entries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/phase32k/output/:id - Detailed Reconstruction & Semantics
outputReconstructionRouter.get('/output/:id', async (req, res) => {
  try {
    const outputId = req.params.id;
    const data = await outputReconstructionCatalog.getReconstruction(outputId);
    const overrides = outputReconstructionCatalog.getOverrides(outputId);
    const history = outputReconstructionCatalog.getMappingHistory(outputId);

    res.json({ success: true, ...data, overrides, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/phase32k/output/:id/reconstruct - Re-run semantic reconstruction
outputReconstructionRouter.post('/output/:id/reconstruct', async (req, res) => {
  try {
    const outputId = req.params.id;
    const { companyId } = req.body;

    // Safety check: ensure read-only
    readOnlyGuard.enforceReadOnly('tally-xml-http', companyId || 'CMP-001', outputId, { payload: { action: 'Reconstruct Output' } });

    const semantics = await outputReconstructionEngine.analyzeOutputSemantics(outputId, companyId);
    const reconstruction = outputReconstructionEngine.buildReconstructionDefinition(semantics);

    res.json({ success: true, semantics, reconstruction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/phase32k/output/:id/equivalence - Run Equivalence Test
outputReconstructionRouter.post('/output/:id/equivalence', async (req, res) => {
  try {
    const outputId = req.params.id;
    const { referenceData, reconstructedData, toleranceConfig } = req.body;

    const { semantics, reconstruction } = await outputReconstructionCatalog.getReconstruction(outputId);
    const testResult = reportEquivalenceEngine.evaluateEquivalence(
      semantics,
      reconstruction,
      referenceData,
      reconstructedData,
      toleranceConfig
    );

    await auditEngine.recordEvent({
      user: 'usr-analyst-1',
      action: 'QUERY',
      companyId: 'CMP-001',
      result: 'SUCCESS',
      severity: 'INFO',
      correlationId: `CORR-EQUIV-${outputId}-${Date.now()}`,
      details: { outputId, equivalenceLevel: testResult.equivalenceLevel, score: testResult.overallScore }
    });

    res.json({ success: true, testResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/phase32k/output/:id/override - Human Review Override
outputReconstructionRouter.post('/output/:id/override', async (req, res) => {
  try {
    const outputId = req.params.id;
    const { overrideType, fieldName, newValue, user, reason } = req.body;

    if (!overrideType || !reason) {
      return res.status(400).json({ success: false, error: 'overrideType and reason are required' });
    }

    const updated = await outputReconstructionCatalog.applyHumanOverride(
      outputId,
      overrideType,
      fieldName,
      newValue,
      user || 'Senior Accountant',
      reason
    );

    res.json({ success: true, reconstruction: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/phase32k/output/:id/impact - Impact Analysis
outputReconstructionRouter.get('/output/:id/impact', (req, res) => {
  try {
    const outputId = req.params.id;
    const impact = outputReconstructionCatalog.analyzeMappingImpact(outputId);
    res.json({ success: true, impact });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/phase32k/search - Semantic Search Outputs
outputReconstructionRouter.get('/search', async (req, res) => {
  try {
    const query = String(req.query.q || '');
    const searchResults = await outputReconstructionEngine.semanticSearch(query);
    res.json({ success: true, count: searchResults.length, results: searchResults });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/phase32k/output/:id/create-template - Generate Report Template (Phase 32I Integration)
outputReconstructionRouter.post('/output/:id/create-template', async (req, res) => {
  try {
    const outputId = req.params.id;
    const { semantics, reconstruction } = await outputReconstructionCatalog.getReconstruction(outputId);

    // Automatic Template Safety: Do NOT publish low-confidence templates automatically
    if (reconstruction.status === 'LOW_CONFIDENCE' || reconstruction.status === 'NOT_RECONSTRUCTABLE' || reconstruction.confidence < 60) {
      return res.status(400).json({
        success: false,
        error: `Cannot generate published template for low-confidence or non-reconstructable output (Confidence: ${reconstruction.confidence}%, Status: ${reconstruction.status}). Human review required.`
      });
    }

    const templateId = `TPL-RECONSTRUCTED-${outputId}`;

    await auditEngine.recordEvent({
      user: 'usr-admin-1',
      action: 'EXPORT',
      companyId: 'CMP-001',
      result: 'SUCCESS',
      severity: 'INFO',
      correlationId: `CORR-TEMPLATE-${outputId}-${Date.now()}`,
      details: { outputId, templateId, templateName: `Reconstructed ${semantics.outputName}` }
    });

    res.json({
      success: true,
      templateId,
      message: `Successfully created Phase 32I Report Template '${templateId}' from ReconstructionDefinition`,
      template: {
        templateId,
        name: semantics.outputName,
        category: semantics.category,
        grain: reconstruction.grain,
        version: reconstruction.version,
        published: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
