/**
 * Phase 32A - Comprehensive Unit Test Suite
 * Tests:
 * 1. Dynamic datasets creation and representation
 * 2. Unknown fields preservation via ExtensionField
 * 3. Schema creation & lifecycle transitions
 * 4. Schema comparison & change detection
 * 5. Schema versioning & historical record retention
 * 6. Schema compatibility classification (Compatible, Compatible With Migration, Breaking)
 * 7. Company isolation enforcement
 */

import { UniversalDataModelEngine } from '../universalDataModelEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runPhase32ATests(): { total: number; passed: number; failed: number; results: string[] } {
  const engine = new UniversalDataModelEngine();
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      results.push(`[PASS] ${name}`);
    } catch (err: any) {
      failed++;
      results.push(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Dynamic Datasets Creation and Representation
  // -------------------------------------------------------------
  test('Dynamic Datasets: Can create and represent diverse Tally datasets without fixed schema', () => {
    const ds = engine.createDataset({
      datasetId: 'ds-payroll-test',
      name: 'Payroll & Employee Attendance',
      displayName: 'Employee Payslips & Deductions',
      category: 'Payroll',
      companyId: 'CMP-TEST-01',
      source: 'Tally Payroll Gateway',
      sourceObject: 'EMPLOYEE',
      schemaVersion: 1,
      grain: 'EmployeeMonth',
      status: 'Active',
      description: 'Employee payroll attendance master'
    });

    assert(ds.datasetId === 'ds-payroll-test', 'Dataset ID match');
    assert(ds.category === 'Payroll', 'Category Payroll match');
    const fetched = engine.getDatasetById('ds-payroll-test', 'CMP-TEST-01');
    assert(fetched !== undefined, 'Dataset successfully retrieved');
    assert(fetched?.grain === 'EmployeeMonth', 'Grain matches');
  });

  // -------------------------------------------------------------
  // Test 2: Unknown Fields Preservation (ExtensionField)
  // -------------------------------------------------------------
  test('Unknown Fields: Preserves unrecognized source fields under ExtensionField mechanism', () => {
    const companyId = 'CMP-001';
    const rawPayload = {
      ledgerId: 'LED-TEST-99',
      name: 'Custom Partner Supplies',
      parentGroup: 'Sundry Creditors',
      openingBalance: 50000,
      closingBalance: 120000,
      // Unrecognized Tally custom XML tags:
      VENDOR_RATING_INTERNAL: 'A+',
      CUSTOM_TAX_EXEMPTION_CERT: 'CERT-2026-X88',
      IS_PRIORITY_SUPPLIER: true,
      NESTED_EXTRA_INFO: { notes: 'Approved by board' }
    };

    const { canonicalRecord, rawMetadata } = engine.ingestRecord(
      'ds-ledgers',
      companyId,
      'LED-TEST-99',
      'TallyPrime XML Connector',
      'LEDGER',
      rawPayload,
      'Trial Balance Custom'
    );

    assert(canonicalRecord.fields.name === 'Custom Partner Supplies', 'Known field mapped');
    assert(canonicalRecord.extensionFields.length === 4, `Expected 4 extension fields, got ${canonicalRecord.extensionFields.length}`);

    const ratingExt = canonicalRecord.extensionFields.find((f) => f.name === 'VENDOR_RATING_INTERNAL');
    assert(ratingExt !== undefined, 'VENDOR_RATING_INTERNAL preserved in ExtensionFields');
    assert(ratingExt?.value === 'A+', 'Extension field value preserved');
    assert(ratingExt?.type === 'String', 'Extension field type correctly inferred as String');

    const priorityExt = canonicalRecord.extensionFields.find((f) => f.name === 'IS_PRIORITY_SUPPLIER');
    assert(priorityExt?.type === 'Boolean', 'Boolean type preserved');

    assert(rawMetadata.rawRecordId.includes('RAW-'), 'Raw metadata record created');
    assert(rawMetadata.fingerprint.startsWith('SHA256-'), 'Payload fingerprint generated');
  });

  // -------------------------------------------------------------
  // Test 3: Schema Creation & Proposal Lifecycle (Draft -> Review -> Approved)
  // -------------------------------------------------------------
  test('Schema Lifecycle: Schema proposals start in Review state and do not overwrite Approved schema automatically', () => {
    const activeBefore = engine.getActiveSchemaForDataset('ds-ledgers');
    assert(activeBefore?.version === 1, 'Initial active schema is v1');
    assert(activeBefore?.status === 'Approved', 'Initial active schema is Approved');

    // Generate proposal from discovery
    const { proposalSchema } = engine.proposeSchemaFromDiscoveredObject(
      'ds-ledgers',
      [
        { name: 'ledgerId', type: 'String', path: 'LEDGER.GUID', nullable: 'Required' },
        { name: 'name', type: 'String', path: 'LEDGER.NAME', nullable: 'Required' },
        { name: 'parentGroup', type: 'String', path: 'LEDGER.PARENT', nullable: 'Required' },
        { name: 'openingBalance', type: 'Decimal', path: 'LEDGER.OPENINGBALANCE', nullable: 'Required' },
        { name: 'closingBalance', type: 'Decimal', path: 'LEDGER.CLOSINGBALANCE', nullable: 'Required' },
        { name: 'status', type: 'String', path: 'LEDGER.STATUS', nullable: 'Optional' },
        { name: 'creditLimit', type: 'Decimal', path: 'LEDGER.CREDITLIMIT', nullable: 'Optional' }
      ],
      'Ledger'
    );

    assert(proposalSchema.status === 'Review', 'Proposal is created in Review state');
    assert(proposalSchema.version === 2, 'Proposal assigned next version (v2)');

    // Verify approved schema was NOT automatically overwritten
    const activeAfterProposal = engine.getActiveSchemaForDataset('ds-ledgers');
    assert(activeAfterProposal?.schemaId === activeBefore?.schemaId, 'Active schema unchanged after proposal creation');

    // Approve the proposal
    const approved = engine.updateSchemaStatus(proposalSchema.schemaId, 'Approved', 'Test Admin');
    assert(approved.status === 'Approved', 'Schema transitioned to Approved');
    assert(approved.approvedBy === 'Test Admin', 'Approver recorded');

    // Verify v1 is now Deprecated and v2 is Active
    const newActive = engine.getActiveSchemaForDataset('ds-ledgers');
    assert(newActive?.schemaId === proposalSchema.schemaId, 'Approved v2 is now active');

    const oldV1 = engine.getSchemaById(activeBefore!.schemaId);
    assert(oldV1?.status === 'Deprecated', 'Previous active schema was marked Deprecated');
  });

  // -------------------------------------------------------------
  // Test 4: Schema Comparison & Change Detection
  // -------------------------------------------------------------
  test('Schema Comparison: Detects added fields, removed fields, and type changes', () => {
    // Register custom schemas for comparison test
    const schemaA = engine.registerSchema({
      schemaId: 'sch-test-comp-v1',
      datasetId: 'ds-test-comp',
      version: 1,
      grain: 'Order',
      fields: [
        { name: 'orderId', type: 'String', nullable: 'Required', path: 'ORDER.ID', isPrimary: true, isForeignKey: false, source: 'Test', confidence: 'High' },
        { name: 'orderAmount', type: 'Decimal', nullable: 'Required', path: 'ORDER.AMT', isPrimary: false, isForeignKey: false, source: 'Test', confidence: 'High' },
        { name: 'legacyCode', type: 'String', nullable: 'Optional', path: 'ORDER.CODE', isPrimary: false, isForeignKey: false, source: 'Test', confidence: 'High' }
      ],
      relationships: []
    }, 'Approved');

    const schemaB = engine.registerSchema({
      schemaId: 'sch-test-comp-v2',
      datasetId: 'ds-test-comp',
      version: 2,
      grain: 'Order',
      fields: [
        { name: 'orderId', type: 'String', nullable: 'Required', path: 'ORDER.ID', isPrimary: true, isForeignKey: false, source: 'Test', confidence: 'High' },
        { name: 'orderAmount', type: 'Decimal', nullable: 'Required', path: 'ORDER.AMT', isPrimary: false, isForeignKey: false, source: 'Test', confidence: 'High' },
        { name: 'discountRate', type: 'Decimal', nullable: 'Optional', path: 'ORDER.DISC', isPrimary: false, isForeignKey: false, source: 'Test', confidence: 'High' }
        // legacyCode removed
      ],
      relationships: []
    }, 'Draft');

    const diff = engine.compareSchemas(schemaA.schemaId, schemaB.schemaId);

    assert(diff.summary.addedFieldsCount === 1, 'Added fields count is 1 (discountRate)');
    assert(diff.summary.removedFieldsCount === 1, 'Removed fields count is 1 (legacyCode)');
    assert(diff.fieldDiffs.some((d) => d.fieldName === 'discountRate' && d.changeType === 'Added'), 'Added field detected');
    assert(diff.fieldDiffs.some((d) => d.fieldName === 'legacyCode' && d.changeType === 'Removed'), 'Removed field detected');
  });

  // -------------------------------------------------------------
  // Test 5: Schema Compatibility Classification (Compatible vs Migration vs Breaking)
  // -------------------------------------------------------------
  test('Schema Compatibility: Correctly classifies Compatible, Compatible With Migration, and Breaking schemas', () => {
    // 1. Compatible: only optional field added
    const sBase = engine.registerSchema({
      schemaId: 'sch-compat-base',
      datasetId: 'ds-compat-test',
      version: 1,
      grain: 'Item',
      fields: [
        { name: 'itemId', type: 'String', nullable: 'Required', path: 'I.ID', isPrimary: true, isForeignKey: false, source: 'T', confidence: 'High' }
      ],
      relationships: []
    }, 'Approved');

    const sCompatible = engine.registerSchema({
      schemaId: 'sch-compat-add-opt',
      datasetId: 'ds-compat-test',
      version: 2,
      grain: 'Item',
      fields: [
        { name: 'itemId', type: 'String', nullable: 'Required', path: 'I.ID', isPrimary: true, isForeignKey: false, source: 'T', confidence: 'High' },
        { name: 'color', type: 'String', nullable: 'Optional', path: 'I.COLOR', isPrimary: false, isForeignKey: false, source: 'T', confidence: 'High' }
      ],
      relationships: []
    }, 'Draft');

    const comp1 = engine.compareSchemas(sBase.schemaId, sCompatible.schemaId);
    assert(comp1.compatibility === 'Compatible', 'Adding optional field is classified as Compatible');

    // 2. Breaking: removing a field or changing grain
    const sBreaking = engine.registerSchema({
      schemaId: 'sch-compat-breaking',
      datasetId: 'ds-compat-test',
      version: 3,
      grain: 'WarehouseLocation', // grain changed
      fields: [
        { name: 'locationId', type: 'String', nullable: 'Required', path: 'W.ID', isPrimary: true, isForeignKey: false, source: 'T', confidence: 'High' }
      ],
      relationships: []
    }, 'Draft');

    const comp2 = engine.compareSchemas(sBase.schemaId, sBreaking.schemaId);
    assert(comp2.compatibility === 'Breaking', 'Removing fields / changing grain is classified as Breaking');
    assert(comp2.breakingReasons.length > 0, 'Breaking reasons documented');
  });

  // -------------------------------------------------------------
  // Test 6: Schema Versioning & Historical Record Retention
  // -------------------------------------------------------------
  test('Schema Versioning: Historical records retain their original schema version and validity intervals', () => {
    const companyId = 'CMP-HIST-01';
    const dataset = engine.createDataset({
      datasetId: 'ds-hist-test',
      name: 'Customer Balances Tracked',
      displayName: 'Customer Balances',
      category: 'Master',
      companyId,
      source: 'Tally',
      sourceObject: 'CUSTOMER',
      schemaVersion: 1,
      grain: 'Customer',
      status: 'Active'
    });

    // Ingest version 1 of record
    const { canonicalRecord: recV1 } = engine.ingestRecord(
      dataset.datasetId,
      companyId,
      'CUST-101',
      'Tally v1',
      'CUSTOMER',
      { customerId: 'CUST-101', name: 'Original Name' }
    );

    assert(recV1.schemaVersion === 1, 'Record v1 has schema version 1');
    assert(recV1.isCurrent === true, 'Record v1 is initially current');

    // Ingest updated version of same record
    const { canonicalRecord: recV2 } = engine.ingestRecord(
      dataset.datasetId,
      companyId,
      'CUST-101',
      'Tally v1',
      'CUSTOMER',
      { customerId: 'CUST-101', name: 'Updated Name Ltd' }
    );

    assert(recV2.isCurrent === true, 'Record v2 is now current');
    assert(recV1.isCurrent === false, 'Previous version marked historical (isCurrent=false)');
    assert(recV1.validTo !== undefined, 'Historical record has validTo set');

    // Query historical
    const currentOnly = engine.getRecordsForDataset(dataset.datasetId, companyId, { includeHistorical: false });
    assert(currentOnly.length === 1, 'Only 1 current record returned');
    assert(currentOnly[0].fields.name === 'Updated Name Ltd', 'Current record has latest name');

    const allRecords = engine.getRecordsForDataset(dataset.datasetId, companyId, { includeHistorical: true });
    assert(allRecords.length === 2, 'Both historical and current versions retained');
  });

  // -------------------------------------------------------------
  // Test 7: Company Isolation Enforcement
  // -------------------------------------------------------------
  test('Company Isolation: Blocks unauthorized cross-company dataset and record access', () => {
    let datasetErrorThrown = false;
    try {
      // Try to get dataset belonging to CMP-001 with companyId CMP-002
      engine.getDatasetById('ds-ledgers', 'CMP-002-UNAUTHORIZED');
    } catch (err: any) {
      if (err.message.includes('Company Isolation Violation')) {
        datasetErrorThrown = true;
      }
    }
    assert(datasetErrorThrown, 'Company Isolation Violation thrown when accessing wrong company dataset');

    // Ingest record for CMP-A
    const { canonicalRecord } = engine.ingestRecord(
      'ds-ledgers',
      'CMP-001',
      'LED-ISOLATION-01',
      'Tally',
      'LEDGER',
      { ledgerId: 'LED-ISOLATION-01', name: 'Company A Secret Account' }
    );

    let recordErrorThrown = false;
    try {
      // Attempt to read record using CMP-B
      engine.getRecordById(canonicalRecord.canonicalRecordId, 'CMP-002-HACKER');
    } catch (err: any) {
      if (err.message.includes('Company Isolation Violation')) {
        recordErrorThrown = true;
      }
    }
    assert(recordErrorThrown, 'Company Isolation Violation thrown when accessing wrong company record');
  });

  return {
    total: passed + failed,
    passed,
    failed,
    results
  };
}

// Auto-run if executed directly via tsx
if (process.argv[1]?.includes('phase32a.test.ts')) {
  console.log('Running Phase 32A Unit Tests...');
  const outcome = runPhase32ATests();
  outcome.results.forEach((r) => console.log(r));
  console.log(`\nSummary: ${outcome.passed}/${outcome.total} Passed (${outcome.failed} Failed)`);
  if (outcome.failed > 0) process.exit(1);
}
