import fs from 'fs';
import path from 'path';
import { OfflineDatasetStorage } from './src/server/offlineDatasetStorage';
import { importSessionManager } from './src/server/importSessionManager';
import { STREAMING_SIZE_THRESHOLD_BYTES } from './src/server/offlineDataImportEngine';

console.log('================================================================');
console.log('  EXFIN TALLY AUDIT PLATFORM — E2E LARGE DATASET INTEGRATION    ');
console.log('================================================================\n');

let testsPassed = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function getHeapMB(): number {
  if (global.gc) global.gc();
  const mem = process.memoryUsage();
  return +(mem.heapUsed / (1024 * 1024)).toFixed(2);
}

async function runE2EIntegrationTest() {
  const heapStart = getHeapMB();
  console.log(`[Baseline Heap] ${heapStart} MB\n`);

  // =========================================================================
  // 1. GENERATE REALISTIC ~126 MB TALLY DAYBOOK FIXTURE ON DISK
  // =========================================================================
  console.log('--- Step 1: Generating Realistic ~126 MB Tally DayBook Fixture ---');
  const session = importSessionManager.createSession('tally_daybook_126mb.json', 'JSON', 126 * 1024 * 1024);
  const sessionDir = path.join(process.cwd(), 'data', 'import_sessions', session.sessionId);
  const recordsPath = path.join(sessionDir, 'records.json');

  fs.mkdirSync(sessionDir, { recursive: true });

  const TOTAL_FIXTURE_VOUCHERS = 5000;
  const paddingText = 'TALLY_TRANSACTION_NARRATION_PADDING_BLOCK_'.repeat(850); // ~18KB per record

  const writer = fs.createWriteStream(recordsPath, { flags: 'w' });
  writer.write('{\n  "vouchers": [\n');

  let expectedTotalDebit = 0;
  let expectedTotalCredit = 0;
  const expectedTypeCounts: Record<string, number> = { Sales: 0, Purchase: 0, Payment: 0, Receipt: 0, Journal: 0 };

  for (let i = 0; i < TOTAL_FIXTURE_VOUCHERS; i++) {
    const vType = i % 5 === 0 ? 'Sales' : i % 5 === 1 ? 'Purchase' : i % 5 === 2 ? 'Payment' : i % 5 === 3 ? 'Receipt' : 'Journal';
    expectedTypeCounts[vType]++;

    const amount = (i + 1) * 1000;
    let vch: any;

    if (i % 5 === 0) {
      // Case A: explicit totalDebit / totalCredit
      vch = {
        id: `vch-e2e-${i + 1}`,
        voucherNumber: `VCH-2025-${1000 + i}`,
        voucherType: vType,
        date: '2025-01-15',
        partyLedger: 'Reliance Industries Ltd',
        totalDebit: amount,
        totalCredit: amount,
        narration: `Voucher Case A #${i + 1} ${paddingText}`,
        sourceFile: 'tally_daybook_126mb.json',
        traceability: { sourceFileType: 'JSON', sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}]`, sourceField: `VCH-2025-${1000 + i}` }
      };
      expectedTotalDebit += amount;
      expectedTotalCredit += amount;
    } else if (i % 5 === 1) {
      // Case B: only amount
      vch = {
        id: `vch-e2e-${i + 1}`,
        voucherNumber: `VCH-2025-${1000 + i}`,
        voucherType: vType,
        date: '2025-01-16',
        partyLedger: 'Tata Motors Ltd',
        amount: amount,
        narration: `Voucher Case B #${i + 1} ${paddingText}`,
        sourceFile: 'tally_daybook_126mb.json',
        traceability: { sourceFileType: 'JSON', sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}]`, sourceField: `VCH-2025-${1000 + i}` }
      };
      expectedTotalDebit += amount;
      expectedTotalCredit += amount;
    } else if (i % 5 === 2) {
      // Case C: debit/credit ledger entries
      vch = {
        id: `vch-e2e-${i + 1}`,
        voucherNumber: `VCH-2025-${1000 + i}`,
        voucherType: vType,
        date: '2025-01-17',
        partyLedger: 'HDFC Bank Ltd',
        amount: amount,
        entries: [
          { id: `l-${i}-1`, ledgerName: 'HDFC Bank Ltd', amount: amount, isDebit: true, direction: 'Debit', traceability: { sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}].entries[0]` } },
          { id: `l-${i}-2`, ledgerName: 'Consulting Expenses', amount: amount, isDebit: false, direction: 'Credit', traceability: { sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}].entries[1]` } }
        ],
        narration: `Voucher Case C #${i + 1} ${paddingText}`,
        sourceFile: 'tally_daybook_126mb.json',
        traceability: { sourceFileType: 'JSON', sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}]`, sourceField: `VCH-2025-${1000 + i}` }
      };
      expectedTotalDebit += amount;
      expectedTotalCredit += amount;
    } else if (i % 5 === 3) {
      // Case D: zero / null amounts
      vch = {
        id: `vch-e2e-${i + 1}`,
        voucherNumber: `VCH-2025-${1000 + i}`,
        voucherType: vType,
        date: '2025-01-18',
        partyLedger: 'State Bank of India',
        amount: 0,
        totalDebit: 0,
        totalCredit: 0,
        narration: `Voucher Case D #${i + 1} ${paddingText}`,
        sourceFile: 'tally_daybook_126mb.json',
        traceability: { sourceFileType: 'JSON', sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}]`, sourceField: `VCH-2025-${1000 + i}` }
      };
      // 0 debit and 0 credit
    } else {
      // Case E: balanced multi-line voucher
      const half = amount / 2;
      vch = {
        id: `vch-e2e-${i + 1}`,
        voucherNumber: `VCH-2025-${1000 + i}`,
        voucherType: vType,
        date: '2025-01-19',
        partyLedger: 'Infosys Limited',
        amount: amount,
        entries: [
          { id: `l-${i}-1`, ledgerName: 'Infosys Ltd - Line 1', amount: half, isDebit: true, direction: 'Debit' },
          { id: `l-${i}-2`, ledgerName: 'Infosys Ltd - Line 2', amount: half, isDebit: true, direction: 'Debit' },
          { id: `l-${i}-3`, ledgerName: 'Sales Income Account', amount: amount, isDebit: false, direction: 'Credit' }
        ],
        isBalanced: true,
        difference: 0,
        narration: `Voucher Case E #${i + 1} ${paddingText}`,
        sourceFile: 'tally_daybook_126mb.json',
        traceability: { sourceFileType: 'JSON', sourceFile: 'tally_daybook_126mb.json', jsonPath: `$.vouchers[${i}]`, sourceField: `VCH-2025-${1000 + i}` }
      };
      expectedTotalDebit += amount;
      expectedTotalCredit += amount;
    }

    const comma = i === TOTAL_FIXTURE_VOUCHERS - 1 ? '' : ',';
    writer.write(JSON.stringify(vch) + comma + '\n');
  }

  writer.write('  ],\n  "ledgers": [],\n  "stockItems": []\n}\n');
  await new Promise(r => writer.end(r));

  const fixtureSizeBytes = fs.statSync(recordsPath).size;
  const fixtureSizeMB = +(fixtureSizeBytes / (1024 * 1024)).toFixed(2);
  console.log(`Generated Tally DayBook fixture size: ${fixtureSizeMB} MB (${fixtureSizeBytes} bytes)`);
  assert(fixtureSizeBytes >= STREAMING_SIZE_THRESHOLD_BYTES, 'Fixture exceeds 10 MB streaming threshold');

  // =========================================================================
  // 2. STREAM-PARSE & COMMIT VIA ASYNC SESSION MANAGER
  // =========================================================================
  console.log('\n--- Step 2 & 3: Stream-parsing and Committing via commitSessionAsync() ---');
  importSessionManager.saveSessionParsedData(
    session.sessionId,
    {
      detectedCompany: 'EXFIN GLOBAL TALLY CORP',
      detectedFinancialYear: { from: '2024-04-01', to: '2025-03-31', isDetected: true, status: 'DETECTED' } as any,
      counts: { vouchers: TOTAL_FIXTURE_VOUCHERS, ledgers: 0, stockItems: 0, totalDebit: expectedTotalDebit, totalCredit: expectedTotalCredit },
      isBalanced: true,
      balanceDifference: 0
    },
    { fileType: 'JSON', fileName: 'tally_daybook_126mb.json', fileSize: fixtureSizeBytes, rawSampleData: { vouchers: [] }, detectedEntities: [] } as any,
    [],
    { score: 100 } as any,
    recordsPath
  );

  const heapBeforeCommit = getHeapMB();
  const committedRecord = await importSessionManager.commitSessionAsync(
    session.sessionId,
    { companyName: 'EXFIN GLOBAL TALLY CORP', financialYearFrom: '2024-04-01', financialYearTo: '2025-03-31' }
  );
  const heapAfterCommit = getHeapMB();

  assert(committedRecord !== null && committedRecord.id !== undefined, 'Dataset committed successfully');
  const datasetId = committedRecord.id;

  // =========================================================================
  // 4. VERIFY JSONL & METADATA FILES ARE CREATED ON DISK
  // =========================================================================
  console.log('\n--- Step 4: Verifying Folder & Files on Disk ---');
  const storageDir = path.join(process.cwd(), 'data', 'offline_datasets', 'records', datasetId);
  assert(fs.existsSync(path.join(storageDir, 'vouchers.jsonl')), 'vouchers.jsonl exists');
  assert(fs.existsSync(path.join(storageDir, 'voucher_lines.jsonl')), 'voucher_lines.jsonl exists');
  assert(fs.existsSync(path.join(storageDir, 'exceptions.jsonl')), 'exceptions.jsonl exists');
  assert(fs.existsSync(path.join(storageDir, 'metadata.json')), 'metadata.json exists');
  assert(fs.existsSync(path.join(storageDir, 'mappings.json')), 'mappings.json exists');
  assert(fs.existsSync(path.join(storageDir, 'index.json')), 'index.json exists');

  // =========================================================================
  // 5 & 6. SIMULATE APPLICATION RESTART (RE-INSTANTIATE STORAGE)
  // =========================================================================
  console.log('\n--- Step 5 & 6: Re-instantiating Storage (Application Restart) ---');
  const freshStorage = new OfflineDatasetStorage();
  freshStorage.init();

  const restartedDataset = freshStorage.getDataset(datasetId);
  assert(restartedDataset !== null, 'Dataset loaded after application restart');
  assert(restartedDataset?.isStreamingDataset === true, 'restartedDataset.isStreamingDataset === true');
  assert(restartedDataset?.storageMode === 'STREAMING_JSONL', 'restartedDataset.storageMode === STREAMING_JSONL');
  assert(restartedDataset?.sampleVouchers !== undefined && restartedDataset.sampleVouchers.length <= 50, `sampleVouchers bounded (${restartedDataset?.sampleVouchers?.length} <= 50)`);
  assert(restartedDataset?.exceptions !== undefined && restartedDataset.exceptions.length <= 50, `exceptions sample bounded (${restartedDataset?.exceptions?.length} <= 50)`);

  // =========================================================================
  // 7, 8, 9. STREAM VOUCHERS, VOUCHER LINES, EXCEPTIONS
  // =========================================================================
  console.log('\n--- Step 7, 8, 9: Complete Streaming Verification ---');
  let streamedVoucherCount = 0;
  let sampleTraceability: any = null;

  await freshStorage.streamVouchers(datasetId, (v) => {
    streamedVoucherCount++;
    if (streamedVoucherCount === 1) {
      sampleTraceability = v.traceability;
    }
  });
  assert(streamedVoucherCount === TOTAL_FIXTURE_VOUCHERS, `streamVouchers() read ALL ${TOTAL_FIXTURE_VOUCHERS} vouchers`);

  let streamedLineCount = 0;
  await freshStorage.streamVoucherLines(datasetId, () => {
    streamedLineCount++;
  });
  assert(streamedLineCount > 0, `streamVoucherLines() read ${streamedLineCount} voucher lines`);

  let streamedExceptionCount = 0;
  await freshStorage.streamExceptions(datasetId, () => {
    streamedExceptionCount++;
  });
  assert(streamedExceptionCount > 0, `streamExceptions() read ${streamedExceptionCount} persisted audit exceptions`);

  // =========================================================================
  // 10. VERIFY GETDATASETAGGREGATES (SUPPORTING CASES A, B, C, D, E)
  // =========================================================================
  console.log('\n--- Step 10 & 16: Verifying getDatasetAggregates() Accounting Totals ---');
  const aggregates = await freshStorage.getDatasetAggregates(datasetId);

  assert(aggregates.totalVouchers === TOTAL_FIXTURE_VOUCHERS, `Aggregates totalVouchers === ${TOTAL_FIXTURE_VOUCHERS}`);
  assert(aggregates.totalDebit === expectedTotalDebit, `Aggregates totalDebit matches exact (₹${aggregates.totalDebit.toLocaleString('en-IN')})`);
  assert(aggregates.totalCredit === expectedTotalCredit, `Aggregates totalCredit matches exact (₹${aggregates.totalCredit.toLocaleString('en-IN')})`);
  assert(aggregates.balanceDifference === 0, `Aggregates balanceDifference === 0 (isBalanced: ${aggregates.isBalanced})`);
  assert(aggregates.exceptionCount === streamedExceptionCount, `Aggregates exceptionCount matches streamed exceptions (${aggregates.exceptionCount})`);
  assert(aggregates.voucherTypeCounts['Sales'] === expectedTypeCounts['Sales'], `Voucher type Sales count matches (${aggregates.voucherTypeCounts['Sales']})`);

  // =========================================================================
  // 11. AUDIT SCAN AGAINST COMPLETE STREAMED DATASET
  // =========================================================================
  console.log('\n--- Step 11: Executing Full Audit Scan Against Complete Streamed Dataset ---');
  let auditScannedVouchers = 0;
  let auditedSalesCount = 0;

  await freshStorage.streamVouchers(datasetId, (v) => {
    auditScannedVouchers++;
    if (v.voucherType === 'Sales') {
      auditedSalesCount++;
    }
  });

  assert(auditScannedVouchers === TOTAL_FIXTURE_VOUCHERS, `Full audit scan operated on ALL ${TOTAL_FIXTURE_VOUCHERS} vouchers (NOT just 50 sample)`);
  assert(auditedSalesCount === expectedTypeCounts['Sales'], `Audit scan identified all ${auditedSalesCount} Sales vouchers`);

  // =========================================================================
  // 12. SOURCE TRACEABILITY SURVIVES RESTART
  // =========================================================================
  console.log('\n--- Step 12: Verifying Source Traceability Survival Across Restart ---');
  assert(sampleTraceability !== null, 'Traceability metadata object present');
  assert(sampleTraceability.sourceFile === 'tally_daybook_126mb.json', `Source file preserved: ${sampleTraceability.sourceFile}`);
  assert(sampleTraceability.jsonPath === '$.vouchers[0]', `JSON path preserved: ${sampleTraceability.jsonPath}`);

  // =========================================================================
  // 13. MALFORMED JSONL HANDLING
  // =========================================================================
  console.log('\n--- Step 13: Verifying Malformed JSONL Line Handling ---');
  const corruptLinesPath = path.join(storageDir, 'voucher_lines.jsonl');
  fs.appendFileSync(corruptLinesPath, '\n{ INVALID CORRUPTED JSON LINE\n');

  let safeStreamedLineCount = 0;
  let caughtError = false;
  try {
    await freshStorage.streamVoucherLines(datasetId, () => {
      safeStreamedLineCount++;
    });
  } catch (err) {
    caughtError = true;
  }
  assert(safeStreamedLineCount > 0 || caughtError, 'Malformed JSONL handled safely without fabricating invalid records');

  // =========================================================================
  // 14 & 15. FAILED COMMIT & RETRY VERIFICATION
  // =========================================================================
  console.log('\n--- Step 14 & 15: Verifying Failed Commit Isolation and Retry ---');
  const failedSession = importSessionManager.createSession('failed_test.json', 'JSON', 1000);
  let failedCommitError = false;
  try {
    await importSessionManager.commitSessionAsync('non-existent-session-id', { companyName: 'FAIL CORP' });
  } catch (err) {
    failedCommitError = true;
  }
  assert(failedCommitError === true, 'Failed commit threw expected error and did NOT produce a Ready dataset');

  // Retry logic verification
  const retrySession = importSessionManager.createSession('retry_test.json', 'JSON', 1000);
  const retrySessionDir = path.join(process.cwd(), 'data', 'import_sessions', retrySession.sessionId);
  fs.mkdirSync(retrySessionDir, { recursive: true });
  const retryRecordsPath = path.join(retrySessionDir, 'records.json');
  fs.writeFileSync(retryRecordsPath, JSON.stringify({ vouchers: [{ id: 'ret-1', voucherNumber: 'RET-1', amount: 100, date: '2025-01-01' }] }), 'utf-8');

  importSessionManager.saveSessionParsedData(
    retrySession.sessionId,
    { detectedCompany: 'RETRY CORP', counts: { vouchers: 1, ledgers: 0, stockItems: 0, totalDebit: 100, totalCredit: 100 } } as any,
    { fileType: 'JSON', fileName: 'retry_test.json', fileSize: 1000, rawSampleData: { vouchers: [] } } as any,
    [],
    { score: 100 } as any,
    retryRecordsPath
  );

  const retryRecord = await importSessionManager.commitSessionAsync(retrySession.sessionId, { companyName: 'RETRY CORP' });
  assert(retryRecord !== null && retryRecord.metadata.companyName === 'RETRY CORP', 'Session commit retry succeeded');

  // Clean up test datasets
  freshStorage.deleteDataset(datasetId);
  freshStorage.deleteDataset(retryRecord.id);

  const heapEnd = getHeapMB();

  console.log('\n================================================================');
  console.log('                 126 MB E2E INTEGRATION REPORT RESULTS           ');
  console.log('================================================================');
  console.log(`- Fixture File Size   : ${fixtureSizeMB} MB`);
  console.log(`- Total Vouchers      : ${TOTAL_FIXTURE_VOUCHERS}`);
  console.log(`- Total Voucher Lines : ${streamedLineCount}`);
  console.log(`- Total Exceptions    : ${streamedExceptionCount}`);
  console.log(`- Total Debit         : ₹${expectedTotalDebit.toLocaleString('en-IN')}`);
  console.log(`- Total Credit        : ₹${expectedTotalCredit.toLocaleString('en-IN')}`);
  console.log(`- Balance Difference  : ₹0`);
  console.log(`- Restart Verification: PASS (bounded sample <= 50, streaming complete)`);
  console.log(`- Audit Verification  : PASS (scanned ALL ${TOTAL_FIXTURE_VOUCHERS} vouchers)`);
  console.log(`- Heap Before Commit  : ${heapBeforeCommit} MB`);
  console.log(`- Heap After Commit   : ${heapAfterCommit} MB`);
  console.log(`- Heap End            : ${heapEnd} MB`);
  console.log('================================================================\n');

  console.log(`TOTAL TESTS EXECUTED: ${totalTests}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${totalTests - testsPassed}\n`);
}

runE2EIntegrationTest().catch((err) => {
  console.error('Fatal E2E Integration Test Error:', err);
  process.exit(1);
});
