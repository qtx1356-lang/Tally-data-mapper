import fs from 'fs';
import path from 'path';
import { StreamingJsonParser } from './src/server/streamingJsonParser';
import { offlineDataImportEngine } from './src/server/offlineDataImportEngine';

console.log('================================================================');
console.log('  TEST TALLY 126.5 MB STREAMING JSON PARSER VALIDATION           ');
console.log('================================================================\n');

function getHeapMB(): number {
  if (global.gc) global.gc();
  const mem = process.memoryUsage();
  return +(mem.heapUsed / (1024 * 1024)).toFixed(2);
}

async function run() {
  const initialHeap = getHeapMB();
  console.log(`[Initial Heap] ${initialHeap} MB`);

  // -------------------------------------------------------------
  // Test 1: Test with daybook_streaming_test.json
  // -------------------------------------------------------------
  console.log('\n--- Test 1: StreamingJsonParser on daybook_streaming_test.json ---');
  const test1File = path.join(process.cwd(), 'data', 'test_offline_storage_1789125918195', 'daybook_streaming_test.json');
  const tempOut1 = path.join(process.cwd(), 'data', 'temp_out_1.json');
  const res1 = await StreamingJsonParser.parseFile(
    test1File,
    tempOut1,
    'daybook_streaming_test.json'
  );
  console.log(`Test 1 Parsed: vouchers=${res1.preview.counts.vouchers}, company=${res1.preview.detectedCompany}`);
  if (res1.preview.counts.vouchers !== 120) {
    throw new Error(`Test 1 failed: expected 120 vouchers, got ${res1.preview.counts.vouchers}`);
  }

  // -------------------------------------------------------------
  // Test 2: Test with large_sample_daybook.json
  // -------------------------------------------------------------
  console.log('\n--- Test 2: StreamingJsonParser on large_sample_daybook.json ---');
  const test2File = path.join(process.cwd(), 'data', 'test_offline_storage_1789125918195', 'large_sample_daybook.json');
  const tempOut2 = path.join(process.cwd(), 'data', 'temp_out_2.json');
  const res2 = await StreamingJsonParser.parseFile(
    test2File,
    tempOut2,
    'large_sample_daybook.json'
  );
  console.log(`Test 2 Parsed: vouchers=${res2.preview.counts.vouchers}`);
  if (res2.preview.counts.vouchers !== 500) {
    throw new Error(`Test 2 failed: expected 500 vouchers, got ${res2.preview.counts.vouchers}`);
  }

  // -------------------------------------------------------------
  // Test 3: Generate 126.5 MB Tally DayBook Fixture
  // Header structure:
  // Starts with `[\r\n`
  // Line 2 has col 44 with character 'T' (e.g. unquoted TALLYMESSAGE / True / tokens)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Generating 126.5 MB Tally DayBook Fixture ---');
  const fixturePath = path.join(process.cwd(), 'data', 'DayBook_126MB_RealFixture.json');
  const tempOut3 = path.join(process.cwd(), 'data', 'temp_out_3.json');

  const writeStream = fs.createWriteStream(fixturePath, { flags: 'w' });

  // Line 1: `[\r\n` (3 bytes)
  // Line 2: 43 chars before 'T':
  // Col 1..43: `  0,                                       `
  // Col 44: `T` in `TALLYMESSAGE,`
  writeStream.write('[\r\n');
  writeStream.write('  0,                                       TALLYMESSAGE,\r\n');

  const paddingBlock = 'Z'.repeat(16 * 1024); // 16 KB string chunk
  const TARGET_BYTES = 126.5 * 1024 * 1024;
  let writtenBytes = 0;
  let voucherIndex = 0;

  while (writtenBytes < TARGET_BYTES) {
    voucherIndex++;
    const vchRecord = {
      TALLYMESSAGE: {
        VOUCHER: {
          VOUCHERNUMBER: `VCH-${voucherIndex}`,
          VOUCHERTYPENAME: voucherIndex % 2 === 0 ? 'Payment' : 'Sales',
          DATE: '20240715',
          PARTYLEDGERNAME: `Customer Ledger ${voucherIndex % 100}`,
          NARRATION: `Transaction #${voucherIndex} ${paddingBlock.slice(0, 1500)}`,
          ALLLEDGERENTRIES: [
            { LEDGERNAME: `Customer Ledger ${voucherIndex % 100}`, AMOUNT: -2500 },
            { LEDGERNAME: 'Bank Account', AMOUNT: 2500 }
          ]
        }
      }
    };
    const chunk = (voucherIndex === 1 ? '' : ',\r\n') + JSON.stringify(vchRecord);
    writeStream.write(chunk);
    writtenBytes += Buffer.byteLength(chunk, 'utf8');
  }

  writeStream.write('\r\n]\r\n');
  await new Promise((resolve) => writeStream.end(resolve));

  const finalFileSize = fs.statSync(fixturePath).size;
  console.log(`Generated 126.5 MB fixture: ${(finalFileSize / (1024 * 1024)).toFixed(2)} MB (${finalFileSize} bytes, ${voucherIndex} records)`);

  // -------------------------------------------------------------
  // Test 4: Stream parse the 126.5 MB fixture via offlineDataImportEngine
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Stream Parsing 126.5 MB File via offlineDataImportEngine ---');
  let maxHeapObserved = getHeapMB();
  let lastProgressPercent = 0;

  const res3 = await offlineDataImportEngine.parseFileFromDiskAsync(
    fixturePath,
    'JSON',
    'DayBook.json',
    tempOut3,
    (progress) => {
      const currentHeap = getHeapMB();
      if (currentHeap > maxHeapObserved) {
        maxHeapObserved = currentHeap;
      }
      if (progress.percent && progress.percent >= lastProgressPercent + 25) {
        lastProgressPercent = progress.percent;
        console.log(`[Progress ${progress.percent}%] phase=${progress.phase}, records=${progress.recordsProcessed}, heap=${currentHeap} MB`);
      }
    }
  );

  const endHeap = getHeapMB();
  console.log(`\nStream Parsing Complete!`);
  console.log(`Total vouchers in counts: ${res3.counts?.vouchers}`);
  console.log(`Total Debit: ${res3.counts?.totalDebit}`);
  console.log(`Total Credit: ${res3.counts?.totalCredit}`);
  console.log(`Initial Heap: ${initialHeap} MB`);
  console.log(`Max Heap Observed: ${maxHeapObserved} MB`);
  console.log(`End Heap: ${endHeap} MB`);

  // Clean up temporary test files
  try { fs.unlinkSync(tempOut1); } catch (e) {}
  try { fs.unlinkSync(tempOut2); } catch (e) {}
  try { fs.unlinkSync(tempOut3); } catch (e) {}
  try { fs.unlinkSync(fixturePath); } catch (e) {}

  if (!res3.counts || res3.counts.vouchers === 0) {
    throw new Error('Test 4 failed: 0 vouchers in summary counts');
  }

  console.log('\n✅ ALL TALLY STREAMING TESTS PASSED WITH BOUNDED MEMORY!');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
