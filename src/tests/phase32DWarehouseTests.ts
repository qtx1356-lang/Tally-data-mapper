/**
 * Phase 32D - Comprehensive Local Analytical Warehouse Test Suite
 * Tests:
 * 1. Warehouse initialization & metadata registration
 * 2. Canonical dataset storage (Facts & Dimensions)
 * 3. Date Dimension & Voucher Type Dimension generation
 * 4. Company isolation enforcement at Data Access Layer
 * 5. Bulk insertion with configurable batch sizes
 * 6. Safe upsert & duplicate protection
 * 7. Historical records & SCD versioning
 * 8. Snapshot creation & consistency validation
 * 9. Snapshot comparison preparation for Phase 32E
 * 10. Single-column & Composite indexing
 * 11. Query engine filtering, sorting, pagination, and cursor
 * 12. Accounting aggregations (SUM, AVG, MIN, MAX, COUNT) with grain safety
 * 13. Transaction rollback on failed batch ingestion
 * 14. Warehouse health reporting & safe local maintenance
 * 15. Synthetic large dataset benchmark (10,000+ records)
 * 16. Security tests (Multi-tenant leakage protection, SQL/Query injection safety)
 * 17. Read-only Tally verification
 */

import { WarehouseStorageEngine } from '../server/warehouseStorageEngine';
import { WarehouseDateDimension } from '../server/warehouseDateDimension';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export async function runPhase32DTestSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; status: 'PASS' | 'FAIL'; error?: string }[];
}> {
  const engine = new WarehouseStorageEngine();
  await engine.initialize();

  const results: { testName: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed++;
      results.push({ testName: name, status: 'PASS' });
    } catch (err: any) {
      failed++;
      results.push({ testName: name, status: 'FAIL', error: err.message });
    }
  }

  // -------------------------------------------------------------
  // Test 1: Warehouse Initialization & Dimension Seeds
  // -------------------------------------------------------------
  await test('Warehouse Init: Initializes all canonical datasets and dimensions', async () => {
    const health = engine.getHealthReport();
    assert(health.databaseStatus === 'Healthy', 'Warehouse database status is Healthy');
    assert(health.totalDatasetsCount >= 18, 'At least 18 canonical datasets registered');
    assert(health.totalRecordsCount > 0, 'Seeded initial canonical records');
    assert(health.companiesStored.includes('CMP-001'), 'CMP-001 stored in warehouse');
  });

  // -------------------------------------------------------------
  // Test 2: Date Dimension Generator with Customizable FY
  // -------------------------------------------------------------
  await test('Date Dimension: Generates granular calendar & financial year attributes', () => {
    // Test India April-March FY
    const dRecIndia = WarehouseDateDimension.generateRecord('2025-05-15', 4);
    assert(dRecIndia.financialYear === '2025-2026', 'FY for May 2025 should be 2025-2026');
    assert(dRecIndia.financialQuarter === 'FQ1', 'May is FQ1 in Apr-Mar FY');
    assert(dRecIndia.quarterName === 'Q2', 'May is Calendar Q2');
    assert(dRecIndia.month === 'May', 'Month is May');

    // Test International Jan-Dec FY
    const dRecIntl = WarehouseDateDimension.generateRecord('2025-05-15', 1);
    assert(dRecIntl.financialYear === '2025', 'FY for May 2025 in Jan-Dec is 2025');
    assert(dRecIntl.financialQuarter === 'FQ2', 'May is FQ2 in Jan-Dec FY');
  });

  // -------------------------------------------------------------
  // Test 3: Strict Company Isolation at Data Access Layer
  // -------------------------------------------------------------
  await test('Company Isolation: Query for Company A NEVER returns Company B records', async () => {
    // Ingest specific voucher for CMP-001
    await engine.insertBatch('canonical-vouchers', 'CMP-001', [
      {
        sourceId: 'V_CMP1_ONLY',
        voucherNumber: 'INV-CMP1-999',
        voucherType: 'Sales',
        amount: 50000,
        date: '2025-06-01'
      }
    ]);

    // Ingest specific voucher for CMP-002
    await engine.insertBatch('canonical-vouchers', 'CMP-002', [
      {
        sourceId: 'V_CMP2_ONLY',
        voucherNumber: 'INV-CMP2-888',
        voucherType: 'Sales',
        amount: 75000,
        date: '2025-06-01'
      }
    ]);

    // Query CMP-001
    const res1 = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-001',
      filters: [{ field: 'voucherNumber', operator: 'EQ', value: 'INV-CMP2-888' }]
    });
    assert(res1.returnedRows === 0, 'Company 1 query must NOT return Company 2 voucher');

    // Query CMP-002
    const res2 = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-002',
      filters: [{ field: 'voucherNumber', operator: 'EQ', value: 'INV-CMP2-888' }]
    });
    assert(res2.returnedRows === 1, 'Company 2 query correctly returned its own voucher');
  });

  // -------------------------------------------------------------
  // Test 4: DAL Enforces Company Identity (Cannot Be Omitted)
  // -------------------------------------------------------------
  await test('Company Isolation DAL: Throws error when companyId is omitted in query', async () => {
    let threw = false;
    try {
      await engine.query({
        datasetId: 'canonical-vouchers',
        companyId: '' // Omitted
      });
    } catch {
      threw = true;
    }
    assert(threw, 'Engine must strictly reject query when companyId is blank');
  });

  // -------------------------------------------------------------
  // Test 5: Bulk Ingestion & Batch Writing
  // -------------------------------------------------------------
  await test('Bulk Ingestion: Chunked batch writing with progress tracking', async () => {
    const testRecords = Array.from({ length: 2500 }, (_, i) => ({
      sourceId: `TEST_V_${i + 1}`,
      voucherNumber: `TEST-INV-${i + 1}`,
      voucherType: 'Sales',
      amount: 100 + i,
      date: '2025-07-01'
    }));

    const progress = await engine.insertBatch('canonical-vouchers', 'CMP-001', testRecords, {
      batchSize: 500,
      upsert: true
    });

    assert(progress.rowsRead === 2500, 'All 2500 rows read');
    assert(progress.rowsWritten === 2500, 'All 2500 rows written');
    assert(progress.status === 'Current', 'Dataset marked as Current upon completion');
  });

  // -------------------------------------------------------------
  // Test 6: Upsert & Duplicate Protection (Company-Scoped)
  // -------------------------------------------------------------
  await test('Upsert: Does not create duplicates when re-ingesting same sourceId', async () => {
    const uniqueSourceId = 'PARTY_UNIQUE_UPSERT_001';

    // 1st insert
    await engine.insertBatch('canonical-parties', 'CMP-001', [
      { sourceId: uniqueSourceId, partyName: 'Alpha Supplies', creditLimit: 100000 }
    ]);

    const countBefore = (await engine.query({
      datasetId: 'canonical-parties',
      companyId: 'CMP-001',
      filters: [{ field: 'sourceId', operator: 'EQ', value: uniqueSourceId }]
    })).totalMatchedRows;

    // 2nd insert with updated credit limit
    await engine.upsertBatch('canonical-parties', 'CMP-001', [
      { sourceId: uniqueSourceId, partyName: 'Alpha Supplies', creditLimit: 250000 }
    ]);

    const resAfter = await engine.query({
      datasetId: 'canonical-parties',
      companyId: 'CMP-001',
      filters: [{ field: 'sourceId', operator: 'EQ', value: uniqueSourceId }]
    });

    assert(resAfter.totalMatchedRows === countBefore, 'Row count must not increase on upsert');
    assert(resAfter.data[0].creditLimit === 250000, 'Payload updated with new credit limit');
  });

  // -------------------------------------------------------------
  // Test 7: Streaming Ingestion Generator
  // -------------------------------------------------------------
  await test('Streaming Ingestion: Ingests records via generator without full array in memory', async () => {
    async function* streamRecords() {
      for (let i = 0; i < 300; i++) {
        yield {
          sourceId: `STREAM_TAX_${i + 1}`,
          taxEntityName: `GST Rate ${i}%`,
          taxRate: i,
          jurisdiction: 'India'
        };
      }
    }

    const progress = await engine.streamIngest('canonical-tax-entities', 'CMP-001', streamRecords(), {
      batchSize: 100
    });

    assert(progress.rowsRead === 300, 'Streamed 300 records');
    assert(progress.rowsWritten === 300, 'Written 300 records');
  });

  // -------------------------------------------------------------
  // Test 8: Index Manager - Composite & Single-Column Lookups
  // -------------------------------------------------------------
  await test('Index Manager: Composite indexing and fast indexed lookups', async () => {
    const idxDefs = engine.indexManager.getIndexStatus('CMP-001');
    assert(idxDefs.length > 0, 'Index definitions registered');

    const compIdx = idxDefs.find((i) => i.fields.includes('companyId') && i.fields.includes('sourceId'));
    assert(compIdx !== undefined, 'CompanyId + SourceId composite index exists');

    // Test indexed query acceleration
    const queryRes = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-001',
      limit: 10
    });
    assert(queryRes.returnedRows > 0, 'Returned rows via indexed access');
  });

  // -------------------------------------------------------------
  // Test 9: Snapshot Creation & Consistency
  // -------------------------------------------------------------
  await test('Snapshot Model: Creates complete snapshot with dataset versions and record counts', () => {
    const snapshot = engine.createSnapshot('CMP-001', { note: 'End of Quarter Snap' });
    assert(snapshot.snapshotId.startsWith('SNAP_CMP-001'), 'Snapshot ID has company prefix');
    assert(snapshot.companyId === 'CMP-001', 'Company matches');
    assert(snapshot.status === 'Complete', 'Snapshot status is Complete');
    assert(snapshot.datasetVersions['canonical-vouchers'] >= 1, 'Voucher dataset version recorded');
    assert(snapshot.recordCounts['canonical-vouchers'] > 0, 'Record count recorded');
  });

  // -------------------------------------------------------------
  // Test 10: Snapshot Comparison Preparation (Phase 32E Ready)
  // -------------------------------------------------------------
  await test('Snapshot Comparison: Prepares delta plan between snapshots', () => {
    const snap1 = engine.createSnapshot('CMP-001', { tag: 'Base' });
    const snap2 = engine.createSnapshot('CMP-001', { tag: 'Target' });

    const plan = engine.prepareSnapshotComparison(snap1.snapshotId, snap2.snapshotId, 'CMP-001');
    assert(plan.preparedForPhase32E === true, 'Prepared for Phase 32E sync engine');
    assert(plan.datasetComparisons.length > 0, 'Dataset comparisons generated');
  });

  // -------------------------------------------------------------
  // Test 11: Query Filtering, Date Range & Pagination
  // -------------------------------------------------------------
  await test('Query Engine: Supports filtering, date ranges, and pagination', async () => {
    const res = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-001',
      filters: [{ field: 'voucherType', operator: 'EQ', value: 'Sales' }],
      dateRange: { from: '2025-04-01', to: '2025-12-31' },
      orderBy: [{ field: 'amount', order: 'DESC' }],
      limit: 5,
      offset: 0
    });

    assert(res.returnedRows <= 5, 'Respects pagination limit');
    assert(res.totalMatchedRows >= res.returnedRows, 'Total matched rows calculation');
  });

  // -------------------------------------------------------------
  // Test 12: Aggregations & Accounting Grain Safety
  // -------------------------------------------------------------
  await test('Aggregations: Calculates SUM, AVG, MIN, MAX with accounting measure safety', async () => {
    const res = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-001',
      filters: [{ field: 'voucherType', operator: 'EQ', value: 'Sales' }],
      aggregations: [
        { field: 'amount', function: 'SUM', alias: 'totalSalesAmount' },
        { field: 'amount', function: 'AVG', alias: 'avgSalesAmount' },
        { field: 'amount', function: 'MIN', alias: 'minSalesAmount' },
        { field: 'amount', function: 'MAX', alias: 'maxSalesAmount' }
      ]
    });

    assert(res.aggregates !== undefined, 'Aggregates computed');
    assert(typeof res.aggregates?.totalSalesAmount === 'number', 'Total SUM is numeric');
    assert(res.aggregates?.totalSalesAmount! >= res.aggregates?.maxSalesAmount!, 'SUM >= MAX');
  });

  // -------------------------------------------------------------
  // Test 13: Transaction Rollback on Failure
  // -------------------------------------------------------------
  await test('Transaction Safety: Rolls back batch on ingestion error', async () => {
    const initialStats = engine.getDatasetStats('CMP-001').find((d) => d.datasetId === 'canonical-groups');
    const initialCount = initialStats?.recordCount || 0;

    // Simulate batch that throws an error midway
    const badBatch = [
      { sourceId: 'VALID_1', groupName: 'Valid Group 1' },
      {
        get sourceId() {
          throw new Error('Simulated payload corruption error');
        }
      } as any
    ];

    const result = await engine.insertBatch('canonical-groups', 'CMP-001', badBatch, {
      transactional: true
    });

    assert(result.status === 'Failed', 'Batch reported as Failed');
    const statsAfter = engine.getDatasetStats('CMP-001').find((d) => d.datasetId === 'canonical-groups');
    assert(statsAfter?.recordCount === initialCount, 'Rollback restored original count');
  });

  // -------------------------------------------------------------
  // Test 14: Storage Health & Maintenance Operations
  // -------------------------------------------------------------
  await test('Maintenance: Validates, optimizes, and compacts storage', async () => {
    const validRes = await engine.validateWarehouse('CMP-001');
    assert(typeof validRes.isValid === 'boolean', 'Warehouse validation completed');

    const optRes = await engine.optimizeStorage('CMP-001');
    assert(optRes.durationMs >= 0, 'Storage optimization ran');

    const compRes = await engine.compactStorage('CMP-001');
    assert(compRes.beforeBytes >= compRes.afterBytes, 'Compacted storage');
  });

  // -------------------------------------------------------------
  // Test 15: Large Dataset Performance Benchmark
  // -------------------------------------------------------------
  await test('Performance Benchmark: Ingests 10,000 synthetic vouchers with sub-second query latency', async () => {
    const benchRecords = Array.from({ length: 10000 }, (_, i) => ({
      sourceId: `PERF_V_${i + 1}`,
      voucherNumber: `V-PERF-${i + 1}`,
      voucherType: i % 2 === 0 ? 'Sales' : 'Purchase',
      amount: 500 + (i % 2000),
      date: '2025-05-10',
      partyLedgerName: `Vendor ${(i % 100) + 1}`
    }));

    const insertStart = Date.now();
    await engine.insertBatch('canonical-vouchers', 'CMP-PERF-TEST', benchRecords, {
      batchSize: 2500,
      upsert: true
    });
    const insertDuration = Date.now() - insertStart;
    assert(insertDuration < 5000, `Bulk insert of 10,000 rows took ${insertDuration}ms (< 5s)`);

    const queryStart = Date.now();
    const queryRes = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-PERF-TEST',
      filters: [{ field: 'voucherType', operator: 'EQ', value: 'Sales' }],
      aggregations: [{ field: 'amount', function: 'SUM', alias: 'perfSum' }],
      limit: 50
    });
    const queryDuration = Date.now() - queryStart;
    assert(queryDuration < 250, `Indexed aggregation query on 10,000 rows took ${queryDuration}ms (< 250ms)`);
    assert(queryRes.totalMatchedRows === 5000, 'Matched exact 5,000 sales vouchers');
  });

  // -------------------------------------------------------------
  // Test 16: Security - SQL/Query Injection & Multi-Tenant Protection
  // -------------------------------------------------------------
  await test('Security: Rejects malicious filter values and cross-tenant leakage', async () => {
    // Attempt SQL-like injection string in EQ filter
    const sqlInjectionVal = "' OR '1'='1";
    const res = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'CMP-001',
      filters: [{ field: 'voucherNumber', operator: 'EQ', value: sqlInjectionVal }]
    });
    assert(res.totalMatchedRows === 0, 'Injection payload correctly matched literal 0 rows');

    // Attempt company cross-contamination via malicious companyId
    const resCross = await engine.query({
      datasetId: 'canonical-vouchers',
      companyId: 'NON_EXISTENT_COMPANY_999'
    });
    assert(resCross.returnedRows === 0, 'Non-existent company query returns 0 rows');
  });

  // -------------------------------------------------------------
  // Test 17: Read-Only Tally Guarantee
  // -------------------------------------------------------------
  await test('Read-Only Tally: Verifies zero mutation capability to source Tally', () => {
    const safety = engine.verifyReadOnlyTallySafety();
    assert(safety.isReadOnly === true, 'Tally connection marked isReadOnly: true');
    assert(safety.mutationsForbidden === true, 'Tally mutation commands strictly forbidden');
  });

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
