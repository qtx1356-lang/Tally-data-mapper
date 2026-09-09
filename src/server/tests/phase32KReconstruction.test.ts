/**
 * Phase 32K Automated Test Suite
 * Tests Output Reconstruction Engine, Field Classification, Grain Discovery, Calculation Discovery,
 * Report Equivalence Engine, Numeric Tolerances, Rounding, Difference Classification, and Read-Only Validation.
 */

import { outputReconstructionEngine } from '../outputReconstructionEngine';
import { reportEquivalenceEngine } from '../reportEquivalenceEngine';
import { outputReconstructionCatalog } from '../outputReconstructionCatalog';
import { readOnlyGuard } from '../readOnlyGuard';

export interface TestResultItem {
  testName: string;
  passed: boolean;
  message: string;
}

export async function runPhase32KTests(): Promise<{ total: number; passed: number; failed: number; results: TestResultItem[] }> {
  const results: TestResultItem[] = [];

  const assert = (testName: string, condition: boolean, message: string) => {
    results.push({ testName, passed: condition, message });
  };

  try {
    // Test 1: Field Semantic Classification & Confidence
    const fields = [
      { fieldName: 'voucherNumber', dataType: 'string' },
      { fieldName: 'date', dataType: 'date' },
      { fieldName: 'debitAmount', dataType: 'number' },
      { fieldName: 'creditAmount', dataType: 'number' },
      { fieldName: 'partyName', dataType: 'string' },
      { fieldName: 'taxAmount', dataType: 'number' }
    ];

    const classified = outputReconstructionEngine.classifyFields(fields);
    const voucherField = classified.find((f) => f.fieldName === 'voucherNumber');
    const debitField = classified.find((f) => f.fieldName === 'debitAmount');

    assert(
      'Field Classification Role & Confidence',
      voucherField?.semanticRole === 'Voucher' && voucherField.confidence === 'Confirmed' && debitField?.semanticRole === 'Debit',
      'Correctly classified voucherNumber as Voucher and debitAmount as Debit with Confirmed confidence'
    );

    // Test 2: Record Grain Discovery
    const grainResult = outputReconstructionEngine.discoverGrain('Voucher Register', classified);
    assert(
      'Record Grain Discovery',
      grainResult.grain === 'Voucher' && grainResult.confidence === 'Confirmed',
      `Correctly inferred grain '${grainResult.grain}' with ${grainResult.confidence} confidence`
    );

    // Test 3: Controlled Calculation Discovery
    const calcs = outputReconstructionEngine.discoverCalculations(classified);
    const netCalc = calcs.find((c) => c.calculationId === 'CALC-NET-DRCR');
    assert(
      'Controlled Calculation Discovery',
      netCalc !== undefined && netCalc.expression === 'debitAmount - creditAmount',
      'Discovered Debit - Credit calculation expression safely'
    );

    // Test 4: Report Equivalence Engine - Exact Match
    const semantics = await outputReconstructionEngine.analyzeOutputSemantics('OUT-VCH-REG');
    const reconstruction = outputReconstructionEngine.buildReconstructionDefinition(semantics);
    const exactEquivalence = reportEquivalenceEngine.evaluateEquivalence(semantics, reconstruction);

    assert(
      'Equivalence Testing - Functional Match',
      exactEquivalence.overallScore >= 90 &&
        (exactEquivalence.equivalenceLevel === 'EXACT' || exactEquivalence.equivalenceLevel === 'FUNCTIONALLY_EQUIVALENT'),
      `Evaluated equivalence score ${exactEquivalence.overallScore}% with level ${exactEquivalence.equivalenceLevel}`
    );

    // Test 5: Numeric Tolerance & Rounding Difference Classification
    const sampleRef = [{ voucherNumber: 'V-1', debitAmount: 1000.004 }];
    const sampleRec = [{ voucherNumber: 'V-1', debitAmount: 1000.001 }];

    const toleranceRes = reportEquivalenceEngine.evaluateEquivalence(
      semantics,
      reconstruction,
      sampleRef,
      sampleRec,
      { currencyTolerance: 0.01 }
    );

    const roundingDiff = toleranceRes.differences.find((d) => d.classification === 'Rounding');
    assert(
      'Numeric Tolerance & Rounding Classification',
      toleranceRes.valueMatchScore === 100 && (roundingDiff ? roundingDiff.tolerated : true),
      'Correctly identified minor numeric precision difference as tolerated rounding difference'
    );

    // Test 6: Human Review Override & Versioning
    const updatedRec = await outputReconstructionCatalog.applyHumanOverride(
      'OUT-VCH-REG',
      'GRAIN',
      undefined,
      'Voucher Line',
      'Senior Auditor',
      'Reconstructing at voucher line level'
    );

    assert(
      'Human Review Override & Versioning',
      updatedRec.grain === 'Voucher Line' && updatedRec.version > 1,
      `Successfully applied override to grain '${updatedRec.grain}' and bumped version to v${updatedRec.version}`
    );

    // Test 7: Impact Analysis Warning Detection
    const impact = outputReconstructionCatalog.analyzeMappingImpact('OUT-VCH-REG');
    assert(
      'Impact Analysis Warning',
      impact.affectedReports.length > 0 && impact.warnings.length > 0,
      `Correctly identified ${impact.affectedReports.length} affected downstream reports`
    );

    // Test 8: Read-Only Tally Validation
    let mutationBlocked = false;
    try {
      readOnlyGuard.enforceReadOnly('tally-xml-http', 'CMP-001', 'OUT-VCH-REG', {
        xmlBody: '<ENVELOPE><HEADER><TALLYREQUEST>Execute</TALLYREQUEST></HEADER><BODY><ACTION>CREATE</ACTION></BODY></ENVELOPE>'
      });
    } catch (err) {
      mutationBlocked = true;
    }

    assert(
      'Read-Only Tally Validation',
      mutationBlocked,
      'ReadOnlyGuard strictly intercepted and blocked unpermitted Tally write payload during reconstruction'
    );

    // Test 9: Null Semantics Comparison
    const nullSemanticsRes = (reportEquivalenceEngine as any).compareValuesWithNullSemantics(0, '');
    assert(
      'Null Semantics Distinction',
      nullSemanticsRes.match === false,
      'Correctly distinguished numeric Zero (0) from Empty String ("")'
    );
  } catch (err: any) {
    results.push({
      testName: 'Phase 32K Test Suite Runner',
      passed: false,
      message: `Unexpected error during test suite run: ${err.message}`
    });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { total: results.length, passed, failed, results };
}
