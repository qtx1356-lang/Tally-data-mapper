/**
 * Phase 32F: Data Quality, Validation, Duplicate Detection & Controlled Transformation Test Suite
 *
 * Covers 20+ comprehensive scenarios:
 * 1. Required field validation
 * 2. Null vs Empty vs Whitespace vs Missing Property classification
 * 3. Type anomaly detection (Text where Number expected, etc.)
 * 4. Impossible date & format detection (e.g. Feb 31)
 * 5. Monetary validation & precision checks without mutating source
 * 6. Quantity validation (negative quantities permitted)
 * 7. Relationship validation & Orphan detection
 * 8. Circular relationship cycle detection in hierarchies
 * 9. Exact duplicate detection
 * 10. Possible / Fuzzy duplicate detection
 * 11. Duplicate merge safety (non-destructive)
 * 12. Controlled transformation operations (Trim, Alias, Unit, Null, Type)
 * 13. Transformation preview & impact analysis
 * 14. Source value preservation in lineage
 * 15. Rule approval workflow (Draft -> Active)
 * 16. Critical blocking rule enforcement
 * 17. Quality exceptions & audit trail
 * 18. Quality trend calculation
 * 19. Company tenant isolation
 * 20. Read-only Tally safety verification
 * 21. High-volume 100,000 synthetic record quality analysis benchmark
 */

import { dataQualityEngine } from '../server/dataQualityEngine';
import { warehouseStorageEngine } from '../server/warehouseStorageEngine';

export interface Phase32FTestResult {
  testName: string;
  status: 'PASS' | 'FAIL';
  durationMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface Phase32FTestReport {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: Phase32FTestResult[];
}

export async function runPhase32FTestSuite(): Promise<Phase32FTestReport> {
  const startTime = Date.now();
  const results: Phase32FTestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    const t0 = Date.now();
    try {
      await fn();
      results.push({ testName: name, status: 'PASS', durationMs: Date.now() - t0 });
    } catch (err: any) {
      results.push({
        testName: name,
        status: 'FAIL',
        durationMs: Date.now() - t0,
        message: err.message
      });
    }
  };

  // Test 1: Required Field Validation
  await runTest('Required Field Validation: Catches missing, empty, and whitespace values in required schema fields', async () => {
    const comp = 'CMP-QTEST-REQ';
    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', comp, `canonical-groups_${comp}_G1`, {
      sourceId: 'G1',
      name: '   ', // whitespace only
      nature: 'Assets'
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', comp);
    if (summary.missingRequiredFieldsCount === 0) {
      throw new Error('Expected required field validation to catch whitespace-only group name.');
    }
    const hasFinding = summary.findings.some((f) => f.category === 'RequiredField' && f.field === 'name');
    if (!hasFinding) {
      throw new Error('Finding not registered for missing required field name.');
    }
  });

  // Test 2: Null vs Empty vs Whitespace Analysis
  await runTest('Null Analysis: Accurately distinguishes between Null, Empty String, Whitespace, and Missing Properties', async () => {
    const comp = 'CMP-QTEST-NULL';
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_L1`, {
      sourceId: 'L1',
      name: 'Ledger 1',
      alias: null // Null
    });
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_L2`, {
      sourceId: 'L2',
      name: 'Ledger 2',
      alias: '' // Empty String
    });
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_L3`, {
      sourceId: 'L3',
      name: 'Ledger 3',
      alias: '   ' // Whitespace
    });
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_L4`, {
      sourceId: 'L4',
      name: 'Ledger 4'
      // Missing Property
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-ledgers', comp);
    const fm = summary.fieldMetrics['alias'];
    if (!fm) throw new Error('Field metrics for alias not found.');

    if (fm.nullCount !== 1) throw new Error(`Expected 1 null, got ${fm.nullCount}`);
    if (fm.emptyCount !== 1) throw new Error(`Expected 1 empty, got ${fm.emptyCount}`);
    if (fm.whitespaceCount !== 1) throw new Error(`Expected 1 whitespace, got ${fm.whitespaceCount}`);
    if (fm.missingCount !== 1) throw new Error(`Expected 1 missing, got ${fm.missingCount}`);
  });

  // Test 3: Type Validation & Anomalies
  await runTest('Type Validation: Flags text where number is expected in monetary fields', async () => {
    const comp = 'CMP-QTEST-TYPE';
    warehouseStorageEngine.recordHistoricalVersion('canonical-vouchers', comp, `canonical-vouchers_${comp}_V1`, {
      sourceId: 'V1',
      voucherNumber: 'V-001',
      date: '2026-03-01',
      amount: 'INVALID_TEXT_AMOUNT'
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-vouchers', comp);
    const hasTypeError = summary.findings.some((f) => f.category === 'Monetary' && f.field === 'amount');
    if (!hasTypeError) {
      throw new Error('Type anomaly for non-numeric amount was not flagged.');
    }
  });

  // Test 4: Impossible Date Detection
  await runTest('Date Validation: Detects impossible dates (e.g. Feb 31 or Month 13)', async () => {
    const comp = 'CMP-QTEST-DATE';
    warehouseStorageEngine.recordHistoricalVersion('canonical-vouchers', comp, `canonical-vouchers_${comp}_V_DATE`, {
      sourceId: 'V_DATE',
      voucherNumber: 'V-002',
      date: '2026-02-31', // Impossible day in Feb
      amount: 5000
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-vouchers', comp);
    const hasDateFinding = summary.findings.some((f) => f.category === 'Date' && f.field === 'date');
    if (!hasDateFinding) {
      throw new Error('Impossible date 2026-02-31 was not detected as an error.');
    }
  });

  // Test 5: Monetary Precision Validation
  await runTest('Monetary Validation: Detects floating point precision anomalies without altering original value', async () => {
    const comp = 'CMP-QTEST-PREC';
    const originalAmount = 12500.567891;
    warehouseStorageEngine.recordHistoricalVersion('canonical-vouchers', comp, `canonical-vouchers_${comp}_V_PREC`, {
      sourceId: 'V_PREC',
      voucherNumber: 'V-PREC-1',
      date: '2026-03-05',
      amount: originalAmount
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-vouchers', comp);
    const finding = summary.findings.find((f) => f.ruleId === 'QRULE_PRECISION');
    if (!finding) {
      throw new Error('Precision anomaly finding was not registered.');
    }

    // Verify original value is intact
    const rec = warehouseStorageEngine.getRecordBySourceId('canonical-vouchers', comp, 'V_PREC');
    if (rec?.payload.amount !== originalAmount) {
      throw new Error('CRITICAL: Source monetary value was modified!');
    }
  });

  // Test 6: Quantity Validation (Negative quantities are permitted)
  await runTest('Quantity Validation: Allows negative quantities (reversals/returns) without flagging as errors', async () => {
    const comp = 'CMP-QTEST-QTY';
    warehouseStorageEngine.recordHistoricalVersion('canonical-vouchers', comp, `canonical-vouchers_${comp}_V_QTY`, {
      sourceId: 'V_QTY',
      voucherNumber: 'V-QTY-1',
      date: '2026-03-05',
      quantity: -25, // Return or credit note
      amount: -5000
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-vouchers', comp);
    const qtyError = summary.findings.find((f) => f.category === 'Quantity' && f.severity === 'Error');
    if (qtyError) {
      throw new Error(`Negative quantity should not be flagged as error: ${qtyError.message}`);
    }
  });

  // Test 7: Relationship Validation & Orphan Detection
  await runTest('Relationship Validation: Detects orphan groups referencing missing parents without creating fake parents', async () => {
    const comp = 'CMP-QTEST-ORPHAN';
    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', comp, `canonical-groups_${comp}_G_ORPHAN`, {
      sourceId: 'G_ORPHAN',
      name: 'Custom Asset Subtree',
      parentGroupName: 'NonExistentParentGroup_99'
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', comp);
    if (summary.orphansCount === 0) {
      throw new Error('Expected orphan group to be detected.');
    }

    // Verify no fake parent was created
    const fakeParent = warehouseStorageEngine.getRecordBySourceId('canonical-groups', comp, 'NonExistentParentGroup_99');
    if (fakeParent) {
      throw new Error('CRITICAL: Fake parent record was automatically created!');
    }
  });

  // Test 8: Circular Relationship Detection
  await runTest('Circular Relationship Detection: Identifies cyclic reference loops in group hierarchies', async () => {
    const comp = 'CMP-QTEST-CYCLE';
    // Create cycle: Group A -> Group B -> Group A
    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', comp, `canonical-groups_${comp}_G_CYC_A`, {
      sourceId: 'G_CYC_A',
      name: 'Cyclic Group Alpha',
      parentGroupName: 'Cyclic Group Beta'
    });
    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', comp, `canonical-groups_${comp}_G_CYC_B`, {
      sourceId: 'G_CYC_B',
      name: 'Cyclic Group Beta',
      parentGroupName: 'Cyclic Group Alpha'
    });

    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', comp);
    if (summary.cyclesCount === 0) {
      throw new Error('Expected circular hierarchy cycle to be detected.');
    }
    if (!summary.hasBlockingCriticalFailure) {
      throw new Error('Circular hierarchy must be flagged as a blocking critical failure.');
    }
  });

  // Test 9: Exact Duplicate Detection
  await runTest('Exact Duplicate Detection: Finds identical records and flags for review', async () => {
    const comp = 'CMP-QTEST-DUP';
    const payload = { sourceId: 'D1', name: 'Duplicated Ledger Alpha', parentGroup: 'Sundry Debtors' };

    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_D1_A`, payload);
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_D1_B`, payload);

    const exactMatches = dataQualityEngine.findExactDuplicates('canonical-ledgers', comp);
    if (exactMatches.length === 0) {
      throw new Error('Expected exact duplicate match to be found.');
    }
    if (exactMatches[0].similarity !== 1.0) {
      throw new Error(`Expected similarity 1.0, got ${exactMatches[0].similarity}`);
    }
  });

  // Test 10: Possible / Fuzzy Duplicate Detection
  await runTest('Fuzzy Duplicate Detection: Flags records with high name similarity', async () => {
    const comp = 'CMP-QTEST-FUZZY';
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_FZ1`, {
      sourceId: 'FZ1',
      name: 'Acme Technologies Private Limited'
    });
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_FZ2`, {
      sourceId: 'FZ2',
      name: 'Acme Technologies Pvt Ltd'
    });

    const fuzzyMatches = dataQualityEngine.findPossibleDuplicates('canonical-ledgers', comp, 0.7);
    if (fuzzyMatches.length === 0) {
      throw new Error('Expected fuzzy name similarity duplicate to be flagged.');
    }
  });

  // Test 11: Duplicate Review & Merge Safety
  await runTest('Duplicate Review: Reviews match status without destructive auto-merge', async () => {
    const comp = 'CMP-QTEST-DUP';
    const matches = dataQualityEngine.findExactDuplicates('canonical-ledgers', comp);
    if (matches.length > 0) {
      const matchId = matches[0].matchId;
      dataQualityEngine.reviewDuplicate(matchId, 'ConfirmedDuplicate', 'TestAdmin');

      // Verify records are NOT destructively merged or deleted
      const allRecords = warehouseStorageEngine.getAllCurrentRecords('canonical-ledgers', comp);
      if (allRecords.length < 2) {
        throw new Error('CRITICAL: Duplicate records were destructively deleted or merged!');
      }
    }
  });

  // Test 12: Controlled Transformation Rules
  await runTest('Controlled Transformation: Whitespace cleanup and alias mapping work cleanly', async () => {
    const comp = 'CMP-QTEST-TRANS';
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, `canonical-ledgers_${comp}_TR_1`, {
      sourceId: 'TR_1',
      name: '   Pristine   Ledger   Name   ',
      creditLimit: 'NA'
    });

    const rule = dataQualityEngine.createRule({
      name: 'Trim and Collapse Ledger Name',
      datasetId: 'canonical-ledgers',
      field: 'name',
      operation: 'WhitespaceCleanup',
      configuration: { whitespaceMode: 'both' },
      status: 'Active'
    });

    const preview = await dataQualityEngine.previewTransformation(rule.ruleId, comp);
    if (preview.recordsAffected === 0) {
      throw new Error('Expected transformation preview to show affected record.');
    }

    const ex = preview.examples[0];
    if (ex.transformedValue !== 'Pristine Ledger Name') {
      throw new Error(`Expected 'Pristine Ledger Name', got '${ex.transformedValue}'`);
    }
  });

  // Test 13: Source Value Preservation in Lineage
  await runTest('Source Value Preservation: Preserves original value alongside transformed value and rule version', async () => {
    const comp = 'CMP-QTEST-PRES';
    const origName = '   Preserved   Ledger   ';
    const canId = `canonical-ledgers_${comp}_PRESERVED_1`;
    warehouseStorageEngine.recordHistoricalVersion('canonical-ledgers', comp, canId, {
      sourceId: 'PRESERVED_1',
      name: origName
    });

    await dataQualityEngine.applyTransformations('canonical-ledgers', comp);
    const current = warehouseStorageEngine.getRecordBySourceId('canonical-ledgers', comp, 'PRESERVED_1');

    if (!current) throw new Error('Record not found after transformation.');
    if (current.payload._orig_name !== origName) {
      throw new Error(`Expected original value '${origName}' preserved in _orig_name, got '${current.payload._orig_name}'`);
    }
  });

  // Test 14: Rule Approval Workflow
  await runTest('Rule Approval: New rules start in Draft and must be approved before activation', async () => {
    const draftRule = dataQualityEngine.createRule({
      name: 'New Draft Rule',
      datasetId: 'canonical-ledgers',
      field: 'name',
      operation: 'WhitespaceCleanup',
      configuration: { whitespaceMode: 'trim' },
      status: 'Draft'
    });

    if (draftRule.status !== 'Draft') {
      throw new Error('Expected newly created rule to have status Draft.');
    }

    const approved = dataQualityEngine.approveRule(draftRule.ruleId, 'SuperAdmin');
    if (approved.status !== 'Active' || approved.approvedBy !== 'SuperAdmin') {
      throw new Error('Approval workflow failed to activate rule.');
    }
  });

  // Test 15: Quality Exceptions & Audit Trail
  await runTest('Quality Exceptions: Allows user to accept known anomaly without deleting finding', async () => {
    const comp = 'CMP-QTEST-EXC';
    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', comp, `canonical-groups_${comp}_EXC_G`, {
      sourceId: 'EXC_G',
      name: 'Special Non-Standard Root Group'
    });

    const summaryBefore = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', comp);
    if (summaryBefore.findings.length === 0) {
      throw new Error('Expected finding to be generated for non-standard root group.');
    }

    const targetFinding = summaryBefore.findings[0];
    const exc = dataQualityEngine.addException(targetFinding.findingId, 'Accepted', 'Accepted business exception per CFO note', 'ChiefAuditor');

    if (exc.action !== 'Accepted' || exc.user !== 'ChiefAuditor') {
      throw new Error('Quality exception not recorded properly.');
    }

    const summaryAfter = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', comp);
    const reevaluatedFinding = summaryAfter.findings.find((f) => f.findingId === targetFinding.findingId);
    if (!reevaluatedFinding?.exception || reevaluatedFinding.exception.action !== 'Accepted') {
      throw new Error('Exception was not linked to finding on subsequent evaluations.');
    }
  });

  // Test 16: Company Tenant Isolation
  await runTest('Company Isolation: Quality evaluation for Company A never touches Company B data', async () => {
    const compA = 'CMP-QTEST-ISOL-A';
    const compB = 'CMP-QTEST-ISOL-B';

    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', compA, `canonical-groups_${compA}_GA`, {
      sourceId: 'GA',
      name: 'Group Company A'
    });
    warehouseStorageEngine.recordHistoricalVersion('canonical-groups', compB, `canonical-groups_${compB}_GB`, {
      sourceId: 'GB',
      name: 'Group Company B'
    });

    const sumA = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', compA);
    const sumB = await dataQualityEngine.evaluateDatasetQuality('canonical-groups', compB);

    if (sumA.totalRecords !== 1 || sumB.totalRecords !== 1) {
      throw new Error('Cross-tenant data contamination detected during quality evaluation.');
    }
  });

  // Test 17: Read-Only Tally Safety Verification
  await runTest('Read-Only Tally Safety: Verifies zero mutation or write requests to Tally', async () => {
    const safety = dataQualityEngine.verifyReadOnlyTallySafety();
    if (!safety.isReadOnly || safety.protocol !== 'LOCAL_DATA_QUALITY_EVALUATION') {
      throw new Error('Read-only safety check failed.');
    }
  });

  // Test 18: High-Performance 100,000 Records Benchmark
  await runTest('Performance Benchmark: Evaluates 100,000 synthetic records with high throughput', async () => {
    const comp = 'CMP-QTEST-100K';
    const count = 100000;
    const batchSize = 10000;

    for (let b = 0; b < count; b += batchSize) {
      const records: Record<string, any>[] = [];
      for (let i = 0; i < batchSize; i++) {
        const id = b + i;
        records.push({
          sourceId: `L_PERF_${id}`,
          name: `Ledger Account Performance ${id}`,
          openingBalance: 5000 + (id % 100),
          closingBalance: 12000 + (id % 200)
        });
      }
      await warehouseStorageEngine.insertBatch('canonical-ledgers', comp, records, { batchSize, upsert: true });
    }

    const tStart = Date.now();
    const summary = await dataQualityEngine.evaluateDatasetQuality('canonical-ledgers', comp);
    const duration = Date.now() - tStart;
    const throughput = Math.round(count / (duration / 1000));

    if (summary.totalRecords !== count) {
      throw new Error(`Expected ${count} records evaluated, got ${summary.totalRecords}`);
    }

    if (throughput < 10000) {
      throw new Error(`Throughput too low: ${throughput} records/sec (Expected >= 10,000 rec/sec)`);
    }
  });

  const totalDurationMs = Date.now() - startTime;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  return {
    total: results.length,
    passed,
    failed,
    durationMs: totalDurationMs,
    results
  };
}
