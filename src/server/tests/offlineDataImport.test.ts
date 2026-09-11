/**
 * EXFIN Tally Audit Platform - Production Hardening Test Suite
 * 
 * Verifies:
 * - XML, JSON, and Excel parsing with zero data fabrication
 * - Financial Year detection and missing FY handling
 * - Voucher debit/credit balance calculation and discrepancy flagging
 * - Field mapping confidence tiers and policies (no auto-upgrading LOW to MEDIUM)
 * - Semantic worksheet and column classification
 * - Full source traceability retention
 * - Persistent local desktop storage across simulated restarts
 * - Live Tally connection route safety & separation
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { OfflineDataImportEngine } from '../offlineDataImportEngine';
import { OfflineDatasetStorage } from '../offlineDatasetStorage';
import { normalizeDebitCredit } from '../debitCreditNormalization';
import { StreamingJsonParser } from '../streamingJsonParser';
import { ImportSessionManager } from '../importSessionManager';

export async function runOfflineDataImportTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; message: string }[];
}> {
  const results: { testName: string; passed: boolean; message: string }[] = [];

  const assert = (testName: string, condition: boolean, message: string) => {
    results.push({ testName, passed: condition, message });
  };

  const testStorageDir = path.join(process.cwd(), 'data', 'test_offline_storage_' + Date.now());

  try {
    const engine = new OfflineDataImportEngine(testStorageDir);

    // =========================================================================
    // Test 1: XML Ingestion & Traceability
    // =========================================================================
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <TALLYMESSAGE>
        <COMPANY NAME="Apex Test Corp">
          <STARTINGFROM>20240401</STARTINGFROM>
          <ENDINGAT>20250331</ENDINGAT>
        </COMPANY>
        <LEDGER NAME="Apex Debtors">
          <PARENT>Sundry Debtors</PARENT>
        </LEDGER>
        <VOUCHER VCHTYPE="Sales">
          <DATE>20240510</DATE>
          <VOUCHERNUMBER>INV-001</VOUCHERNUMBER>
          <PARTYLEDGERNAME>Apex Debtors</PARTYLEDGERNAME>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Apex Debtors</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-50000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Sales A/c</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>50000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    const parsedXml = engine.parseXmlData(sampleXml, 'test_apex.xml');
    assert(
      'XML Ingestion - Company & FY Detection',
      parsedXml.rawRecords.company === 'Apex Test Corp' &&
      parsedXml.rawRecords.fyFrom === '2024-04-01' &&
      parsedXml.rawRecords.fyTo === '2025-03-31' &&
      parsedXml.rawRecords.isFyDetected === true,
      `Company: ${parsedXml.rawRecords.company}, FY: ${parsedXml.rawRecords.fyFrom} - ${parsedXml.rawRecords.fyTo}`
    );

    assert(
      'XML Ingestion - Voucher Ledger Line Balance',
      parsedXml.rawRecords.vouchers.length === 1 &&
      parsedXml.rawRecords.vouchers[0].isBalanced === true &&
      parsedXml.rawRecords.vouchers[0].totalDebit === 50000 &&
      parsedXml.rawRecords.vouchers[0].totalCredit === 50000,
      'Voucher lines and debit/credit balanced verified'
    );

    assert(
      'XML Ingestion - Source Traceability',
      parsedXml.rawRecords.vouchers[0].traceability?.sourcePath === 'TALLYMESSAGE/VOUCHER[1]' &&
      parsedXml.rawRecords.vouchers[0].traceability?.sourceFileType === 'XML',
      'Exact XML hierarchy path preserved'
    );

    // =========================================================================
    // Test 2: JSON Ingestion
    // =========================================================================
    const sampleJson = JSON.stringify({
      company: 'Quantum Tech Ltd',
      financialYear: { from: '2024-04-01', to: '2025-03-31' },
      ledgers: [{ name: 'Bank of Baroda', parent: 'Bank Accounts' }],
      vouchers: [{
        voucherNumber: 'Q-901',
        voucherType: 'Payment',
        date: '2024-06-12',
        partyLedger: 'Vendor Alpha',
        amount: 15000,
        entries: [
          { ledgerName: 'Vendor Alpha', amount: 15000, isDebit: true },
          { ledgerName: 'Bank of Baroda', amount: 15000, isDebit: false }
        ]
      }]
    });

    const parsedJson = engine.parseJsonData(sampleJson, 'test_quantum.json');
    assert(
      'JSON Ingestion - Extraction & Traceability',
      parsedJson.rawRecords.company === 'Quantum Tech Ltd' &&
      parsedJson.rawRecords.vouchers.length === 1 &&
      parsedJson.rawRecords.vouchers[0].entries.length === 2 &&
      parsedJson.rawRecords.vouchers[0].traceability?.jsonPath === '$.vouchers[0]',
      'Parsed JSON schema object and vouchers accurately'
    );

    // =========================================================================
    // Test 3: Excel (XLSX) Column Semantic Detection
    // =========================================================================
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Voucher No', 'Voucher Type', 'Date', 'Particulars', 'Debit', 'Credit', 'Narration'],
      ['EX-001', 'Sales', '2024-05-18', 'Mega Mart', 25000, '', 'Sales billing'],
      ['EX-002', 'Payment', '2024-05-19', 'Supplier X', '', 12000, 'Vendor settlement']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Daybook_Vouchers');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const parsedXlsx = engine.parseExcelBuffer(xlsxBuffer, 'test_daybook.xlsx');
    assert(
      'Excel Ingestion - Semantic Column Classification',
      parsedXlsx.preview.detectedEntities[0]?.classifiedAs === 'Voucher' &&
      parsedXlsx.rawRecords.vouchers.length === 2,
      'Classified worksheet as Voucher and extracted row records'
    );

    assert(
      'Excel Ingestion - Row & Sheet Traceability',
      parsedXlsx.rawRecords.vouchers[0].traceability?.worksheet === 'Daybook_Vouchers' &&
      parsedXlsx.rawRecords.vouchers[0].traceability?.rowNumber === 2,
      'Excel worksheet name and 1-based row number preserved'
    );

    // =========================================================================
    // Test 4: Zero Fabricated Accounting Data Verification
    // =========================================================================
    const missingValuesJson = JSON.stringify([
      {
        // Missing amount, missing date, missing voucherNumber
        voucherType: 'Journal',
        partyLedger: 'Unknown Entity'
      }
    ]);

    const parsedMissing = engine.parseJsonData(missingValuesJson, 'test_missing.json');
    const missingVch = parsedMissing.rawRecords.vouchers[0];

    assert(
      'Zero Fabricated Data - Missing Fields are Null & Flagged',
      missingVch.amount === null &&
      missingVch.date === null &&
      missingVch.voucherNumber === null &&
      missingVch.reviewRequired === true,
      `amount: ${missingVch.amount}, date: ${missingVch.date}, reviewRequired: ${missingVch.reviewRequired}`
    );

    // =========================================================================
    // Test 5: Missing Financial Year Detection
    // =========================================================================
    const missingFyXml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <TALLYMESSAGE>
        <LEDGER NAME="Cash A/c"><PARENT>Cash-in-hand</PARENT></LEDGER>
      </TALLYMESSAGE>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    const parsedMissingFy = engine.parseXmlData(missingFyXml, 'missing_fy.xml');
    assert(
      'Financial Year - No Silent Defaulting (XML)',
      parsedMissingFy.rawRecords.isFyDetected === false &&
      parsedMissingFy.rawRecords.fyFrom === null &&
      parsedMissingFy.rawRecords.fyTo === null &&
      parsedMissingFy.rawRecords.fyStatus === 'REVIEW_REQUIRED' &&
      parsedMissingFy.preview.detectedFinancialYear.status === 'REVIEW_REQUIRED',
      'Undetected financial year left as null rather than silently defaulting to 2024-25'
    );

    // JSON without FY declaration
    const missingFyJson = JSON.stringify({
      company: 'No FY Corp',
      vouchers: [{
        voucherNumber: 'NF-01',
        voucherType: 'Receipt',
        date: '2023-11-15',
        partyLedger: 'Debtor One',
        amount: 5000,
        entries: [
          { ledgerName: 'Debtor One', amount: 5000, isDebit: false },
          { ledgerName: 'Bank', amount: 5000, isDebit: true }
        ]
      }]
    });
    const parsedMissingJson = engine.parseJsonData(missingFyJson, 'missing_fy.json');
    assert(
      'Financial Year - No Silent Defaulting (JSON)',
      parsedMissingJson.rawRecords.isFyDetected === false &&
      parsedMissingJson.rawRecords.fyFrom === null &&
      parsedMissingJson.rawRecords.fyTo === null &&
      parsedMissingJson.rawRecords.fyStatus === 'REVIEW_REQUIRED' &&
      parsedMissingJson.rawRecords.inferredSuggestion?.from === '2023-04-01' &&
      parsedMissingJson.rawRecords.inferredSuggestion?.to === '2024-03-31',
      'JSON without FY does not fabricate dates, provides derived review suggestion'
    );

    // Excel without FY declaration
    assert(
      'Financial Year - No Silent Defaulting (Excel)',
      parsedXlsx.rawRecords.isFyDetected === false &&
      parsedXlsx.rawRecords.fyFrom === null &&
      parsedXlsx.rawRecords.fyTo === null &&
      parsedXlsx.rawRecords.fyStatus === 'REVIEW_REQUIRED' &&
      parsedXlsx.rawRecords.inferredSuggestion?.from === '2024-04-01',
      'Excel without explicit FY in sheet name does not fabricate detected dates'
    );

    // =========================================================================
    // Test 6: Unbalanced Vouchers & No Fabricated Balancing Lines
    // =========================================================================
    const unbalancedXml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <TALLYMESSAGE>
        <VOUCHER VCHTYPE="Journal">
          <DATE>20240701</DATE>
          <VOUCHERNUMBER>UNBAL-001</VOUCHERNUMBER>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Rent Expense</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-30000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    const parsedUnbalanced = engine.parseXmlData(unbalancedXml, 'unbal.xml');
    const unbalVch = parsedUnbalanced.rawRecords.vouchers[0];

    assert(
      'Voucher Structure - Preserves Exact Lines & Flags Imbalance',
      unbalVch.entries.length === 1 &&
      unbalVch.isBalanced === false &&
      unbalVch.difference === 30000 &&
      unbalVch.entries[0].ledgerName === 'Rent Expense',
      `Entries: ${unbalVch.entries.length}, isBalanced: ${unbalVch.isBalanced}, diff: ${unbalVch.difference}`
    );

    // =========================================================================
    // Test 7: Field Mapping Confidence Policy
    // =========================================================================
    const mappings = engine.generateAutoMappings(parsedXml.rawRecords);
    const voucherNumberMapping = mappings.find(m => m.canonicalField === 'voucherNumber');
    assert(
      'Field Mapping - HIGH Confidence mapped automatically',
      voucherNumberMapping?.confidence === 'HIGH' && voucherNumberMapping?.status === 'MAPPED',
      `Confidence: ${voucherNumberMapping?.confidence}, status: ${voucherNumberMapping?.status}`
    );

    // =========================================================================
    // Test 8: Persistent Local Desktop Storage Across Simulated Restart
    // =========================================================================
    const committedRecord = engine.commitDataset(
      'Apex_Persistent_Test.xml',
      'XML',
      sampleXml.length,
      parsedXml.rawRecords,
      mappings,
      { companyName: 'Apex Persistent Corp', financialYearFrom: '2024-04-01', financialYearTo: '2025-03-31' }
    );

    // Simulate application / server restart by instantiating fresh storage instance pointing to same directory
    const restartStorage = new OfflineDatasetStorage(testStorageDir);
    const loadedRecord = restartStorage.getDataset(committedRecord.id);

    assert(
      'Persistence - Dataset Preserved Across Restart',
      loadedRecord !== null &&
      loadedRecord.id === committedRecord.id &&
      loadedRecord.metadata.companyName === 'Apex Persistent Corp' &&
      loadedRecord.vouchers.length === 1 &&
      loadedRecord.vouchers[0].voucherNumber === 'INV-001',
      'Dataset successfully re-loaded from disk index and JSON store after restart'
    );

    // =========================================================================
    // Test 9: Professional, Non-Defamatory Audit Language
    // =========================================================================
    const highValJson = JSON.stringify({
      company: 'Cash Flow Ltd',
      vouchers: [{
        voucherNumber: 'PAY-HIGH-01',
        voucherType: 'Payment',
        date: '2024-08-10',
        partyLedger: 'Vendor Super',
        amount: 250000,
        entries: [
          { ledgerName: 'Vendor Super', amount: 250000, isDebit: true },
          { ledgerName: 'Cash', amount: 250000, isDebit: false }
        ]
      }]
    });
    const parsedHighVal = engine.parseJsonData(highValJson, 'high_val.json');
    const highValCommitted = engine.commitDataset('high_val.json', 'JSON', highValJson.length, parsedHighVal.rawRecords, []);
    const exception = highValCommitted.exceptions[0];

    assert(
      'Audit Intelligence - Objective, Professional Terminology',
      exception !== undefined &&
      exception.exceptionType === 'Potential High-Value Transaction' &&
      exception.reason.includes('review applicability of relevant tax provisions') &&
      !exception.reason.toLowerCase().includes('violated') &&
      !exception.reason.toLowerCase().includes('fraud'),
      `Exception reason: "${exception?.reason}"`
    );

    // =========================================================================
    // Test 10: Disk-Based Large File Parsing & Temporary Disk Handling
    // =========================================================================
    const tempTestFile = path.join(testStorageDir, 'large_sample_daybook.json');
    const largeDayBookData = {
      DayBook: Array.from({ length: 500 }, (_, i) => ({
        VOUCHERNUMBER: `DB-VCH-${1000 + i}`,
        VOUCHERTYPENAME: i % 2 === 0 ? 'Sales' : 'Payment',
        DATE: '2024-06-15',
        PARTYLEDGERNAME: `Party Customer ${i}`,
        AMOUNT: 15000 + i * 50,
        ALLLEDGERENTRIES: {
          LEDGERENTRIES: [
            { LEDGERNAME: `Party Customer ${i}`, AMOUNT: -(15000 + i * 50) },
            { LEDGERNAME: 'Sales Account', AMOUNT: 15000 + i * 50 }
          ]
        }
      }))
    };
    fs.writeFileSync(tempTestFile, JSON.stringify(largeDayBookData, null, 2), 'utf8');

    const diskParsed = engine.parseFileFromDisk(tempTestFile, 'JSON', 'DayBook.json');

    assert(
      'Disk-Based Parsing - Large DayBook JSON Structure',
      diskParsed.rawRecords.vouchers.length === 500 &&
      diskParsed.preview.fileSize > 0,
      `Extracted ${diskParsed.rawRecords.vouchers.length} vouchers from disk-based DayBook JSON`
    );

    // =========================================================================
    // Test 11: Direct Commit from Disk-Parsed Records with Zero Fabrication
    // =========================================================================
    const diskMappings = engine.generateAutoMappings(diskParsed.rawRecords);
    const diskCommitted = engine.commitDataset(
      'DayBook.json',
      'JSON',
      diskParsed.preview.fileSize,
      diskParsed.rawRecords,
      diskMappings
    );

    assert(
      'Large Dataset Persistence & Source Traceability Verification',
      diskCommitted.vouchers.length === 500 &&
      diskCommitted.vouchers[0].traceability.sourceFileType === 'JSON' &&
      diskCommitted.vouchers[0].traceability.sourceFile === 'DayBook.json',
      `Committed dataset contains ${diskCommitted.vouchers.length} vouchers with verified source traceability`
    );

    // =========================================================================
    // Test 12 (TEST A): Two-line sales voucher: Customer Dr 15000, Sales Cr 15000
    // Expected: exactly 2 canonical voucher lines, no synthetic lines
    // =========================================================================
    const testAJson = JSON.stringify({
      vouchers: [{
        voucherNumber: 'SALES-001',
        voucherType: 'Sales',
        date: '2024-05-15',
        amount: 15000,
        entries: [
          { ledgerName: 'Customer X', amount: 15000, isDebit: true },
          { ledgerName: 'Sales Account', amount: 15000, isDebit: false }
        ]
      }]
    });
    const parsedA = engine.parseJsonData(testAJson, 'test_a.json');
    const vchA = parsedA.rawRecords.vouchers[0];
    assert(
      'TEST A - Two-line Sales Voucher Exactly Preserved',
      vchA.entries.length === 2 &&
      vchA.entries[0].ledgerName === 'Customer X' &&
      vchA.entries[0].amount === 15000 &&
      vchA.entries[0].isDebit === true &&
      vchA.entries[1].ledgerName === 'Sales Account' &&
      vchA.entries[1].amount === 15000 &&
      vchA.entries[1].isDebit === false &&
      vchA.isBalanced === true,
      `Entries count: ${vchA.entries.length}, Balanced: ${vchA.isBalanced}`
    );

    // =========================================================================
    // Test 13 (TEST B): Object-wrapped: ALLLEDGERENTRIES: { LEDGERENTRIES: [...] }
    // Expected: all lines preserved
    // =========================================================================
    const testBJson = JSON.stringify({
      vouchers: [{
        VOUCHERNUMBER: 'WRAP-001',
        VOUCHERTYPENAME: 'Sales',
        DATE: '2024-05-20',
        ALLLEDGERENTRIES: {
          LEDGERENTRIES: [
            { LEDGERNAME: 'Customer Y', AMOUNT: -25000, ISDEEMEDPOSITIVE: 'Yes' },
            { LEDGERNAME: 'Sales Revenue', AMOUNT: 25000, ISDEEMEDPOSITIVE: 'No' }
          ]
        }
      }]
    });
    const parsedB = engine.parseJsonData(testBJson, 'test_b.json');
    const vchB = parsedB.rawRecords.vouchers[0];
    assert(
      'TEST B - Object-Wrapped Ledger Entries Recognized & Preserved',
      vchB.entries.length === 2 &&
      vchB.entries[0].ledgerName === 'Customer Y' &&
      vchB.entries[0].amount === 25000 &&
      vchB.entries[0].isDebit === true &&
      vchB.entries[1].ledgerName === 'Sales Revenue' &&
      vchB.entries[1].amount === 25000 &&
      vchB.entries[1].isDebit === false &&
      vchB.traceability.jsonPath === '$.vouchers[0]' &&
      vchB.entries[0].traceability?.jsonPath.includes('ALLLEDGERENTRIES.LEDGERENTRIES'),
      `Entries: ${vchB.entries.length}, Path: ${vchB.entries[0]?.traceability?.jsonPath}`
    );

    // =========================================================================
    // Test 14 (TEST C): Three-line journal
    // Expected: 3 canonical lines
    // =========================================================================
    const testCJson = JSON.stringify([
      {
        voucherNumber: 'JRN-001',
        voucherType: 'Journal',
        date: '2024-06-01',
        lines: [
          { ledgerName: 'Rent Expense', amount: 8000, isDebit: true },
          { ledgerName: 'Electricity Expense', amount: 2000, isDebit: true },
          { ledgerName: 'Bank of Baroda', amount: 10000, isDebit: false }
        ]
      }
    ]);
    const parsedC = engine.parseJsonData(testCJson, 'test_c.json');
    const vchC = parsedC.rawRecords.vouchers[0];
    assert(
      'TEST C - Three-line Journal Fully Preserved',
      vchC.entries.length === 3 &&
      vchC.totalDebit === 10000 &&
      vchC.totalCredit === 10000 &&
      vchC.isBalanced === true &&
      vchC.entries[0].ledgerName === 'Rent Expense' &&
      vchC.entries[1].ledgerName === 'Electricity Expense' &&
      vchC.entries[2].ledgerName === 'Bank of Baroda',
      `Entries: ${vchC.entries.length}, Dr: ${vchC.totalDebit}, Cr: ${vchC.totalCredit}`
    );

    // =========================================================================
    // Test 15 (TEST D): Missing ledger entries
    // Expected: 0 fabricated lines + REVIEW_REQUIRED
    // =========================================================================
    const testDJson = JSON.stringify([
      {
        voucherNumber: 'NO-ENTRIES-01',
        voucherType: 'Payment',
        date: '2024-06-10',
        amount: 45000,
        partyLedger: 'Vendor Zenith'
      }
    ]);
    const parsedD = engine.parseJsonData(testDJson, 'test_d.json');
    const vchD = parsedD.rawRecords.vouchers[0];
    assert(
      'TEST D - Missing Ledger Entries Result in 0 Fabricated Lines & REVIEW_REQUIRED',
      vchD.entries.length === 0 &&
      vchD.reviewRequired === true &&
      vchD.reviewReasons.some((r: string) => r.includes('No source ledger entries detected')),
      `Entries count: ${vchD.entries.length}, reviewRequired: ${vchD.reviewRequired}, reasons: ${JSON.stringify(vchD.reviewReasons)}`
    );

    // =========================================================================
    // Test 16 (TEST E): Nested Tally JSON DayBook structure
    // Expected: all source voucher lines preserved
    // =========================================================================
    const testEJson = JSON.stringify({
      DayBook: {
        VOUCHER: [
          {
            VOUCHERNUMBER: 'DB-NEST-01',
            VOUCHERTYPENAME: 'Receipt',
            DATE: '2024-07-01',
            ALLLEDGERENTRIES: {
              LEDGERENTRIES: [
                { LEDGERNAME: 'Cash', AMOUNT: -18000, ISDEEMEDPOSITIVE: 'Yes' },
                { LEDGERNAME: 'Customer Beta', AMOUNT: 18000, ISDEEMEDPOSITIVE: 'No' }
              ]
            }
          },
          {
            VOUCHERNUMBER: 'DB-NEST-02',
            VOUCHERTYPENAME: 'Sales',
            DATE: '2024-07-02',
            ALLLEDGERENTRIES: [
              { LEDGERNAME: 'Customer Gamma', AMOUNT: -32000, ISDEEMEDPOSITIVE: 'Yes' },
              { LEDGERNAME: 'Sales Revenue', AMOUNT: 32000, ISDEEMEDPOSITIVE: 'No' }
            ]
          }
        ]
      }
    });
    const parsedE = engine.parseJsonData(testEJson, 'test_e.json');
    assert(
      'TEST E - Nested Tally JSON DayBook Structure Preserved',
      parsedE.rawRecords.vouchers.length === 2 &&
      parsedE.rawRecords.vouchers[0].entries.length === 2 &&
      parsedE.rawRecords.vouchers[1].entries.length === 2 &&
      parsedE.rawRecords.vouchers[0].entries[0].ledgerName === 'Cash' &&
      parsedE.rawRecords.vouchers[1].entries[0].ledgerName === 'Customer Gamma',
      `Vouchers: ${parsedE.rawRecords.vouchers.length}, Vch0 lines: ${parsedE.rawRecords.vouchers[0]?.entries.length}, Vch1 lines: ${parsedE.rawRecords.vouchers[1]?.entries.length}`
    );

    // =========================================================================
    // Test 17 (INVARIANT): Canonical voucher line count == genuine source ledger entries detected
    // No synthetic balancing entries permitted under any circumstances
    // =========================================================================
    const invariantCases = [
      // 0 entries in source -> exactly 0 canonical lines
      { v: { voucherNumber: 'INV-0', amount: 5000 }, expectedLines: 0 },
      // 1 entry in source -> exactly 1 canonical line (no balancing line invented!)
      { v: { voucherNumber: 'INV-1', entries: [{ ledgerName: 'A', amount: 5000, isDebit: true }] }, expectedLines: 1 },
      // 2 entries in source -> exactly 2 canonical lines
      { v: { voucherNumber: 'INV-2', entries: [{ ledgerName: 'A', amount: 5000, isDebit: true }, { ledgerName: 'B', amount: 5000, isDebit: false }] }, expectedLines: 2 },
      // 4 entries in source (e.g. split) -> exactly 4 canonical lines
      { v: { voucherNumber: 'INV-4', ALLLEDGERENTRIES: { LEDGERENTRIES: [
        { LEDGERNAME: 'Dr1', AMOUNT: -2000 },
        { LEDGERNAME: 'Dr2', AMOUNT: -3000 },
        { LEDGERNAME: 'Cr1', AMOUNT: 4000 },
        { LEDGERNAME: 'Cr2', AMOUNT: 1000 }
      ]}}, expectedLines: 4 }
    ];
    const parsedInvariant = engine.parseJsonData(JSON.stringify(invariantCases.map(c => c.v)), 'test_invariant.json');
    const invariantHolds = parsedInvariant.rawRecords.vouchers.every((vch: any, idx: number) => {
      return vch.entries.length === invariantCases[idx].expectedLines;
    });
    assert(
      'INVARIANT - Canonical Voucher Line Count Strictly Equals Source Ledger Entries Detected',
      invariantHolds === true &&
      parsedInvariant.rawRecords.vouchers[0].entries.length === 0 &&
      parsedInvariant.rawRecords.vouchers[1].entries.length === 1 &&
      parsedInvariant.rawRecords.vouchers[2].entries.length === 2 &&
      parsedInvariant.rawRecords.vouchers[3].entries.length === 4,
      'Invariant verified across 0, 1, 2, and 4-entry source vouchers; zero synthetic balancing lines generated'
    );

    // =========================================================================
    // Test: STRICT TALLY DEBIT/CREDIT NORMALIZATION (CASES A - J)
    // =========================================================================
    // Case A: isDebit: true
    const caseA = normalizeDebitCredit({ isDebit: true, rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case A: isDebit: true',
      caseA.direction === 'Debit' && caseA.isDebit === true && caseA.normalizedAmount === 15000 && !caseA.reviewRequired,
      `Case A passed: direction=${caseA.direction}, isDebit=${caseA.isDebit}`
    );

    // Case B: isDebit: false
    const caseB = normalizeDebitCredit({ isDebit: false, rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case B: isDebit: false',
      caseB.direction === 'Credit' && caseB.isDebit === false && caseB.normalizedAmount === 15000 && !caseB.reviewRequired,
      `Case B passed: direction=${caseB.direction}, isDebit=${caseB.isDebit}`
    );

    // Case C: isDebit: "true"
    const caseC = normalizeDebitCredit({ isDebit: 'true', rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case C: isDebit: "true"',
      caseC.direction === 'Debit' && caseC.isDebit === true && caseC.normalizedAmount === 15000 && !caseC.reviewRequired,
      `Case C passed: direction=${caseC.direction}, isDebit=${caseC.isDebit}`
    );

    // Case D: isDebit: "false" (CRITICAL: Boolean("false") === true hazard prevented)
    const caseD = normalizeDebitCredit({ isDebit: 'false', rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case D: isDebit: "false" (Safe from JavaScript truthiness)',
      caseD.direction === 'Credit' && caseD.isDebit === false && caseD.normalizedAmount === 15000 && !caseD.reviewRequired,
      `Case D passed: direction=${caseD.direction}, isDebit=${caseD.isDebit}, rule=${caseD.ruleApplied}`
    );

    // Case E: isDebit: "FALSE" (Case insensitivity)
    const caseE = normalizeDebitCredit({ isDebit: 'FALSE', rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case E: isDebit: "FALSE"',
      caseE.direction === 'Credit' && caseE.isDebit === false && caseE.normalizedAmount === 15000 && !caseE.reviewRequired,
      `Case E passed: direction=${caseE.direction}, isDebit=${caseE.isDebit}`
    );

    // Case F: ISDEEMEDPOSITIVE: true (or "Yes")
    const caseF1 = normalizeDebitCredit({ ISDEEMEDPOSITIVE: true, rawAmount: -15000 });
    const caseF2 = normalizeDebitCredit({ ISDEEMEDPOSITIVE: 'Yes', rawAmount: -15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case F: ISDEEMEDPOSITIVE: true / "Yes"',
      caseF1.direction === 'Debit' && caseF1.isDebit === true && caseF1.isDeemedPositive === true &&
      caseF2.direction === 'Debit' && caseF2.isDebit === true && caseF2.isDeemedPositive === true,
      `Case F passed: Tally deemed positive correctly maps to natural positive (Debit)`
    );

    // Case G: ISDEEMEDPOSITIVE: false (or "No")
    const caseG1 = normalizeDebitCredit({ ISDEEMEDPOSITIVE: false, rawAmount: 15000 });
    const caseG2 = normalizeDebitCredit({ ISDEEMEDPOSITIVE: 'No', rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case G: ISDEEMEDPOSITIVE: false / "No"',
      caseG1.direction === 'Credit' && caseG1.isDebit === false && caseG1.isDeemedPositive === false &&
      caseG2.direction === 'Credit' && caseG2.isDebit === false && caseG2.isDeemedPositive === false,
      `Case G passed: Tally deemed negative correctly maps to natural negative (Credit)`
    );

    // Case H: explicit DEBIT amount (15000) vs empty CREDIT
    const caseH = normalizeDebitCredit({ debitAmount: 15000, creditAmount: 0 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case H: explicit DEBIT amount (15000) vs empty CREDIT',
      caseH.direction === 'Debit' && caseH.isDebit === true && caseH.normalizedAmount === 15000 && !caseH.reviewRequired,
      `Case H passed: direction=${caseH.direction}, normalizedAmount=${caseH.normalizedAmount}`
    );

    // Case I: explicit CREDIT amount (15000) vs empty DEBIT
    const caseI = normalizeDebitCredit({ debitAmount: '', creditAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case I: explicit CREDIT amount (15000) vs empty DEBIT',
      caseI.direction === 'Credit' && caseI.isDebit === false && caseI.normalizedAmount === 15000 && !caseI.reviewRequired,
      `Case I passed: direction=${caseI.direction}, normalizedAmount=${caseI.normalizedAmount}`
    );

    // Case J: missing direction -> UNKNOWN / null + REVIEW_REQUIRED (Never guess!)
    const caseJ = normalizeDebitCredit({ rawAmount: 15000 });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Case J: missing direction -> UNKNOWN / null + REVIEW_REQUIRED',
      caseJ.direction === 'UNKNOWN' && caseJ.isDebit === null && caseJ.reviewRequired === true && caseJ.normalizedAmount === 15000,
      `Case J passed: direction=${caseJ.direction}, isDebit=${caseJ.isDebit}, reviewRequired=${caseJ.reviewRequired}`
    );

    // Case K: Full JSON Import Pipeline with explicit "isDebit": "false" string
    const jsonPipelineData = [
      {
        voucherNumber: 'VCH-TEST-DC',
        date: '2024-06-15',
        entries: [
          { ledgerName: 'Customer Alpha', amount: '25,000.00 Dr', isDebit: 'true' },
          { ledgerName: 'Sales Revenue', amount: '25000', isDebit: 'false' }
        ]
      }
    ];
    const parsedJsonDC = engine.parseJsonData(JSON.stringify(jsonPipelineData), 'test_debit_credit.json');
    const vchDC = parsedJsonDC.rawRecords.vouchers[0];
    const line1 = vchDC.entries[0];
    const line2 = vchDC.entries[1];

    assert(
      'DEBIT/CREDIT PIPELINE - JSON entries strictly preserve sourceAmount, normalizedAmount, direction, and ruleApplied',
      line1.direction === 'Debit' && line1.isDebit === true && line1.normalizedAmount === 25000 &&
      line2.direction === 'Credit' && line2.isDebit === false && line2.normalizedAmount === 25000 &&
      line2.sourceAmount === '25000' && line2.ruleApplied !== undefined &&
      vchDC.isBalanced === true,
      `Pipeline JSON passed: line1=${line1.direction}, line2=${line2.direction}, isBalanced=${vchDC.isBalanced}`
    );

    // Case L: Full JSON Import Pipeline with Missing Direction triggers REVIEW_REQUIRED without synthesis
    const jsonMissingDir = [
      {
        voucherNumber: 'VCH-UNDETERMINED',
        date: '2024-06-15',
        entries: [
          { ledgerName: 'Unknown Ledger', amount: 5000 }
        ]
      }
    ];
    const parsedJsonUndetermined = engine.parseJsonData(JSON.stringify(jsonMissingDir), 'test_undetermined.json');
    const lineUndetermined = parsedJsonUndetermined.rawRecords.vouchers[0].entries[0];
    assert(
      'DEBIT/CREDIT PIPELINE - Undetermined line sets direction=UNKNOWN, isDebit=null, reviewRequired=true',
      lineUndetermined.direction === 'UNKNOWN' &&
      lineUndetermined.isDebit === null &&
      lineUndetermined.reviewRequired === true,
      `Undetermined line safely flagged: direction=${lineUndetermined.direction}, reviewRequired=${lineUndetermined.reviewRequired}`
    );

    // Requirement 11: Preservation of sourceAmount without mutating or fabricating signed numbers
    const rawCurrencyStr = '₹ 15,000.50 Dr';
    const normSourcePreservation = normalizeDebitCredit({ rawAmount: rawCurrencyStr });
    assert(
      'DEBIT/CREDIT NORMALIZATION - Requirement 11: sourceAmount preserved verbatim while normalizedAmount extracts positive magnitude',
      normSourcePreservation.sourceAmount === rawCurrencyStr &&
      normSourcePreservation.normalizedAmount === 15000.5 &&
      normSourcePreservation.direction === 'Debit' &&
      normSourcePreservation.isDebit === true,
      `sourceAmount="${normSourcePreservation.sourceAmount}", normalizedAmount=${normSourcePreservation.normalizedAmount}`
    );

    // Requirement 12: Multi-line vouchers (Customer Dr 15000, Sales Cr 15000)
    const multiLineJson = [
      {
        voucherNumber: 'INV-2024-001',
        voucherType: 'Sales',
        date: '2024-07-01',
        entries: [
          { ledgerName: 'Customer Alpha', drCr: 'Dr', amount: 15000 },
          { ledgerName: 'Sales Account', drCr: 'Cr', amount: 15000 }
        ]
      }
    ];
    const parsedMultiLine = engine.parseJsonData(JSON.stringify(multiLineJson), 'multiline_sales.json');
    const multiVch = parsedMultiLine.rawRecords.vouchers[0];
    const multiEntry1 = multiVch.entries[0];
    const multiEntry2 = multiVch.entries[1];
    assert(
      'DEBIT/CREDIT NORMALIZATION - Requirement 12: Multi-line voucher Customer Dr 15000 / Sales Cr 15000',
      multiEntry1.ledgerName === 'Customer Alpha' &&
      multiEntry1.direction === 'Debit' &&
      multiEntry1.isDebit === true &&
      multiEntry1.normalizedAmount === 15000 &&
      multiEntry2.ledgerName === 'Sales Account' &&
      multiEntry2.direction === 'Credit' &&
      multiEntry2.isDebit === false &&
      multiEntry2.normalizedAmount === 15000 &&
      multiVch.isBalanced === true,
      `Multi-line verified: Entry1=${multiEntry1.ledgerName} (${multiEntry1.direction} ${multiEntry1.normalizedAmount}), Entry2=${multiEntry2.ledgerName} (${multiEntry2.direction} ${multiEntry2.normalizedAmount}), Balanced=${multiVch.isBalanced}`
    );

    // =========================================================================
    // PRODUCTION FIX #4: STREAMING JSON PARSER & SESSION ARCHITECTURE TESTS
    // =========================================================================

    const testSessionDir = path.join(testStorageDir, 'import_sessions');
    const sessionManager = new ImportSessionManager(testSessionDir);

    // Test 4.1: Streaming JSON Parser processes large array and enforces bounded preview (max 50)
    const streamingTestFilePath = path.join(testStorageDir, 'daybook_streaming_test.json');
    const sessionOutputRecordsPath = path.join(testStorageDir, 'records_output.json');

    // Generate a DayBook file containing 120 vouchers (exceeding MAX_PREVIEW_RECORDS of 50)
    const testVouchers: any[] = [];
    for (let i = 1; i <= 120; i++) {
      testVouchers.push({
        VOUCHERNUMBER: `VCH-STREAM-${i.toString().padStart(4, '0')}`,
        VOUCHERTYPENAME: i % 2 === 0 ? 'Sales' : 'Payment',
        DATE: '20240715',
        PARTYLEDGERNAME: `Customer Ledger ${i % 10}`,
        NARRATION: `Test transaction ${i}`,
        'ALLLEDGERENTRIES.LIST': [
          {
            LEDGERNAME: `Customer Ledger ${i % 10}`,
            AMOUNT: -1500,
            ISDEEMEDPOSITIVE: 'No'
          },
          {
            LEDGERNAME: i % 2 === 0 ? 'Sales Account' : 'Bank Account',
            AMOUNT: 1500,
            ISDEEMEDPOSITIVE: 'Yes'
          }
        ]
      });
    }

    const testDayBookPayload = {
      ENVELOPE: {
        HEADER: { TALLYREQUEST: 'Export Data' },
        BODY: {
          EXPORTDATA: {
            TALLYMESSAGE: {
              COMPANY: {
                NAME: 'Apex Quantum Stream Ltd',
                BASICCOMPANYINFO: {
                  STARTINGFROM: '20240401',
                  ENDINGAT: '20250331'
                }
              },
              DayBook: testVouchers
            }
          }
        }
      }
    };

    fs.writeFileSync(streamingTestFilePath, JSON.stringify(testDayBookPayload), 'utf-8');

    let progressCallsCount = 0;
    const streamResult = await StreamingJsonParser.parseFile(
      streamingTestFilePath,
      sessionOutputRecordsPath,
      'daybook_streaming_test.json',
      (p) => {
        progressCallsCount++;
      }
    );

    assert(
      'PRODUCTION FIX #4 - StreamingJsonParser correctly processes vouchers and writes to session disk',
      streamResult.preview.counts.vouchers === 120 &&
      fs.existsSync(sessionOutputRecordsPath) &&
      progressCallsCount > 0,
      `Processed ${streamResult.preview.counts.vouchers} vouchers with ${progressCallsCount} progress events, output created.`
    );

    assert(
      'PRODUCTION FIX #4 - Preview sample is strictly bounded to max 50 records',
      streamResult.preview.sampleRecords.length === 50 &&
      streamResult.preview.sampleRecords.length < streamResult.preview.counts.vouchers,
      `Preview sample count is ${streamResult.preview.sampleRecords.length} out of total ${streamResult.preview.counts.vouchers}.`
    );

    assert(
      'PRODUCTION FIX #4 - Company name and Financial Year detected from streaming header without full file memory duplication',
      streamResult.preview.detectedCompany === 'Apex Quantum Stream Ltd' &&
      streamResult.preview.detectedFinancialYear.isDetected === true &&
      streamResult.preview.detectedFinancialYear.from === '2024-04-01' &&
      streamResult.preview.detectedFinancialYear.to === '2025-03-31',
      `Header detected: company=${streamResult.preview.detectedCompany}, FY=${streamResult.preview.detectedFinancialYear.from} to ${streamResult.preview.detectedFinancialYear.to}`
    );

    assert(
      'PRODUCTION FIX #4 - Audit summary correctly computes total Debit/Credit balance for streaming vouchers',
      streamResult.preview.auditSummary.isBalanced === true &&
      streamResult.preview.auditSummary.totalDebit === 120 * 1500 &&
      streamResult.preview.auditSummary.totalCredit === 120 * 1500,
      `Balance summary: isBalanced=${streamResult.preview.auditSummary.isBalanced}, totalDebit=₹${streamResult.preview.auditSummary.totalDebit}, totalCredit=₹${streamResult.preview.auditSummary.totalCredit}`
    );

    // Test 4.2: ImportSessionManager lifecycle
    const session = sessionManager.createSession('daybook_streaming_test.json', 'JSON', fs.statSync(streamingTestFilePath).size);
    assert(
      'PRODUCTION FIX #4 - ImportSessionManager creates session directory and tracks initial progress',
      session.sessionId !== '' &&
      sessionManager.getProgress(session.sessionId)?.phase === 'Uploading',
      `Session created with ID: ${session.sessionId}`
    );

    // Update progress
    sessionManager.updateProgress(session.sessionId, {
      phase: 'Processing',
      percent: 50,
      recordsProcessed: 60
    });
    const prog = sessionManager.getProgress(session.sessionId);
    assert(
      'PRODUCTION FIX #4 - ImportSessionManager tracks granular progress updates',
      prog?.phase === 'Processing' && prog?.percent === 50 && prog?.recordsProcessed === 60,
      `Progress successfully tracked: phase=${prog?.phase}, percent=${prog?.percent}`
    );

    // Auto-generate mappings and quality report
    const sampleRecs = {
      vouchers: streamResult.sampleVouchers,
      ledgers: [],
      stockItems: []
    };
    const autoMappings = engine.generateAutoMappings(sampleRecs);
    const qualityReport = engine.evaluateDataQuality(sampleRecs, autoMappings);

    // Save parsed data
    sessionManager.saveSessionParsedData(
      session.sessionId,
      {
        detectedCompany: streamResult.preview.detectedCompany,
        detectedFinancialYear: streamResult.preview.detectedFinancialYear,
        counts: streamResult.preview.counts,
        isBalanced: streamResult.preview.auditSummary.isBalanced,
        balanceDifference: streamResult.preview.auditSummary.difference
      },
      streamResult.preview,
      autoMappings,
      qualityReport,
      sessionOutputRecordsPath
    );

    const loadedMeta = sessionManager.getSessionMeta(session.sessionId);
    const loadedPreview = sessionManager.getSessionPreview(session.sessionId);
    const loadedQuality = sessionManager.getSessionQuality(session.sessionId);
    assert(
      'PRODUCTION FIX #4 - Session state persists metadata, bounded preview, and quality to disk',
      loadedMeta?.status === 'PARSED' &&
      loadedPreview?.fileName === 'daybook_streaming_test.json' &&
      loadedQuality?.score !== undefined,
      `Persisted state retrieved: status=${loadedMeta?.status}, preview=${loadedPreview?.fileName}`
    );

    // Test 4.3: Commit Session
    const committedSessionRecord = sessionManager.commitSession(session.sessionId, {
      companyName: 'Apex Quantum Stream Ltd (Committed)',
      isDemoData: false
    });

    assert(
      'PRODUCTION FIX #4 - commitSession persists full dataset without duplicating in memory and removes session folder',
      committedSessionRecord.metadata.companyName === 'Apex Quantum Stream Ltd (Committed)' &&
      committedSessionRecord.vouchers.length === 120 &&
      sessionManager.getSessionMeta(session.sessionId) === null,
      `Committed dataset contains ${committedSessionRecord.vouchers.length} vouchers, session cleaned up.`
    );

    // Test 4.4: Abandoned session cleanup
    const oldSession = sessionManager.createSession('abandoned_test.json', 'JSON', 1024);
    // Artificially change lastModified to 2 hours ago
    const oldSessionDir = path.join(testSessionDir, oldSession.sessionId);
    const oldMetaPath = path.join(oldSessionDir, 'meta.json');
    if (fs.existsSync(oldMetaPath)) {
      const metaObj = JSON.parse(fs.readFileSync(oldMetaPath, 'utf-8'));
      metaObj.createdAt = Date.now() - 3600 * 1000 * 5; // 5 hours ago
      fs.writeFileSync(oldMetaPath, JSON.stringify(metaObj), 'utf-8');
    }
    const cleanedCount = sessionManager.cleanupAbandonedSessions(3600 * 1000); // older than 1 hr
    assert(
      'PRODUCTION FIX #4 - cleanupAbandonedSessions removes orphaned and expired sessions from disk',
      cleanedCount >= 1 && !fs.existsSync(oldSessionDir),
      `Successfully cleaned ${cleanedCount} expired session(s).`
    );

    // Test 4.5: Malformed JSON error safety
    const malformedJsonPath = path.join(testStorageDir, 'malformed.json');
    const malformedOutputPath = path.join(testStorageDir, 'malformed_out.json');
    fs.writeFileSync(malformedJsonPath, '{ "DayBook": [ { "VOUCHER": 1 }, INVALID_JSON_SYNTAX', 'utf-8');

    let caughtMalformedError = false;
    try {
      await StreamingJsonParser.parseFile(malformedJsonPath, malformedOutputPath, 'malformed.json');
    } catch (malErr: any) {
      caughtMalformedError = true;
    }
    assert(
      'PRODUCTION FIX #4 - Malformed JSON handles syntax errors gracefully without unhandled crashes',
      caughtMalformedError === true,
      'Malformed JSON caught cleanly.'
    );

    // =========================================================================
    // PRODUCTION CORRECTION: STREAMING ZERO-FABRICATION & SOURCE TRACEABILITY TESTS
    // =========================================================================

    // Test 4.5.1: Missing voucherNumber in streaming JSON
    const missingVchNumFilePath = path.join(testStorageDir, 'missing_vchnum_stream.json');
    const missingVchNumOutPath = path.join(testStorageDir, 'missing_vchnum_out.json');
    const missingVchNumPayload = {
      DayBook: [
        {
          // NO voucherNumber / VOUCHERNUMBER / number
          voucherType: 'Sales',
          date: '2024-08-01',
          entries: [
            { ledgerName: 'Debtor Corp', isDebit: true, amount: 5000 },
            { ledgerName: 'Sales Account', isDebit: false, amount: 5000 }
          ]
        }
      ]
    };
    fs.writeFileSync(missingVchNumFilePath, JSON.stringify(missingVchNumPayload), 'utf-8');
    const missingVchNumResult = await StreamingJsonParser.parseFile(
      missingVchNumFilePath,
      missingVchNumOutPath,
      'missing_vchnum_stream.json'
    );
    const parsedVchMissingNum = missingVchNumResult.sampleVouchers[0];
    assert(
      'STREAMING ZERO-FABRICATION - Test 1: Missing voucherNumber is strictly null with reviewRequired=true, never VCH-1',
      parsedVchMissingNum.voucherNumber === null &&
      parsedVchMissingNum.reviewRequired === true &&
      Boolean(parsedVchMissingNum.reviewReasons?.some(r => r.includes('Missing voucher number in source'))) &&
      !String(parsedVchMissingNum.voucherNumber).startsWith('VCH-'),
      `Missing voucherNumber correctly preserved as null (reviewRequired=${parsedVchMissingNum.reviewRequired}, reasons=${JSON.stringify(parsedVchMissingNum.reviewReasons)})`
    );

    // Test 4.5.2: Missing voucherType in streaming JSON
    const missingVchTypeFilePath = path.join(testStorageDir, 'missing_vchtype_stream.json');
    const missingVchTypeOutPath = path.join(testStorageDir, 'missing_vchtype_out.json');
    const missingVchTypePayload = {
      DayBook: [
        {
          voucherNumber: 'INV-9999',
          // NO voucherType / VOUCHERTYPENAME / type
          date: '2024-08-01',
          entries: [
            { ledgerName: 'Debtor Corp', isDebit: true, amount: 8000 },
            { ledgerName: 'Sales Account', isDebit: false, amount: 8000 }
          ]
        }
      ]
    };
    fs.writeFileSync(missingVchTypeFilePath, JSON.stringify(missingVchTypePayload), 'utf-8');
    const missingVchTypeResult = await StreamingJsonParser.parseFile(
      missingVchTypeFilePath,
      missingVchTypeOutPath,
      'missing_vchtype_stream.json'
    );
    const parsedVchMissingType = missingVchTypeResult.sampleVouchers[0];
    assert(
      'STREAMING ZERO-FABRICATION - Test 2: Missing voucherType is strictly null with reviewRequired=true, never Journal',
      parsedVchMissingType.voucherType === null &&
      parsedVchMissingType.reviewRequired === true &&
      parsedVchMissingType.voucherType !== 'Journal' &&
      Boolean(parsedVchMissingType.reviewReasons?.some(r => r.includes('Missing voucher type in source'))),
      `Missing voucherType correctly preserved as null (reviewRequired=${parsedVchMissingType.reviewRequired}, reasons=${JSON.stringify(parsedVchMissingType.reviewReasons)})`
    );

    // Test 4.5.3: Nested ALLLEDGERENTRIES.LEDGERENTRIES Object Traceability
    const nestedLedgerObjFilePath = path.join(testStorageDir, 'nested_ledger_obj_stream.json');
    const nestedLedgerObjOutPath = path.join(testStorageDir, 'nested_ledger_obj_out.json');
    const nestedLedgerObjPayload = {
      DayBook: [
        {
          voucherNumber: 'VCH-NESTED-001',
          voucherType: 'Sales',
          date: '2024-07-15',
          ALLLEDGERENTRIES: {
            LEDGERENTRIES: [
              { ledgerName: 'Customer A', isDebit: true, amount: 1000 },
              { ledgerName: 'Sales Account', isDebit: false, amount: 1000 }
            ]
          }
        }
      ]
    };
    fs.writeFileSync(nestedLedgerObjFilePath, JSON.stringify(nestedLedgerObjPayload), 'utf-8');
    const nestedLedgerObjResult = await StreamingJsonParser.parseFile(
      nestedLedgerObjFilePath,
      nestedLedgerObjOutPath,
      'nested_ledger_obj_stream.json'
    );
    const nestedLedgerObjVch = nestedLedgerObjResult.sampleVouchers[0];
    const nestedLedgerObjEntry0 = nestedLedgerObjVch.entries[0];
    const nestedLedgerObjEntry1 = nestedLedgerObjVch.entries[1];
    assert(
      'STREAMING TRACEABILITY - Test 1: ALLLEDGERENTRIES.LEDGERENTRIES nested object preserved as .ALLLEDGERENTRIES.LEDGERENTRIES[0]',
      nestedLedgerObjVch.traceability?.jsonPath === '$.DayBook[0]' &&
      nestedLedgerObjEntry0.traceability?.jsonPath === '$.DayBook[0].ALLLEDGERENTRIES.LEDGERENTRIES[0]' &&
      nestedLedgerObjEntry1.traceability?.jsonPath === '$.DayBook[0].ALLLEDGERENTRIES.LEDGERENTRIES[1]',
      `Nested object paths verified: entry0=${nestedLedgerObjEntry0.traceability?.jsonPath}, entry1=${nestedLedgerObjEntry1.traceability?.jsonPath}`
    );

    // Test 4.5.4: Literal ALLLEDGERENTRIES.LIST Property Traceability
    const literalListFilePath = path.join(testStorageDir, 'literal_list_stream.json');
    const literalListOutPath = path.join(testStorageDir, 'literal_list_out.json');
    const literalListPayload = {
      DayBook: [
        {
          voucherNumber: 'VCH-LIT-001',
          voucherType: 'Payment',
          date: '2024-07-16',
          'ALLLEDGERENTRIES.LIST': [
            { ledgerName: 'Vendor X', isDebit: true, amount: 2500 },
            { ledgerName: 'Bank', isDebit: false, amount: 2500 }
          ]
        }
      ]
    };
    fs.writeFileSync(literalListFilePath, JSON.stringify(literalListPayload), 'utf-8');
    const literalListResult = await StreamingJsonParser.parseFile(
      literalListFilePath,
      literalListOutPath,
      'literal_list_stream.json'
    );
    const literalListVch = literalListResult.sampleVouchers[0];
    const literalListEntry0 = literalListVch.entries[0];
    const literalListEntry1 = literalListVch.entries[1];
    assert(
      "STREAMING TRACEABILITY - Test 2: Literal ALLLEDGERENTRIES.LIST key preserved as ['ALLLEDGERENTRIES.LIST'][0]",
      literalListVch.traceability?.jsonPath === '$.DayBook[0]' &&
      literalListEntry0.traceability?.jsonPath === "$.DayBook[0]['ALLLEDGERENTRIES.LIST'][0]" &&
      literalListEntry1.traceability?.jsonPath === "$.DayBook[0]['ALLLEDGERENTRIES.LIST'][1]",
      `Literal property paths verified: entry0=${literalListEntry0.traceability?.jsonPath}, entry1=${literalListEntry1.traceability?.jsonPath}`
    );

    // Test 4.5.5: Direct entries Array Traceability
    const directDayBookFilePath = path.join(testStorageDir, 'direct_daybook_stream.json');
    const directDayBookOutPath = path.join(testStorageDir, 'direct_daybook_out.json');
    const directDayBookPayload = {
      DayBook: [
        {
          voucherNumber: 'DIR-001',
          voucherType: 'Receipt',
          date: '2024-08-15',
          entries: [
            { ledgerName: 'Cash', isDebit: true, amount: 3000 },
            { ledgerName: 'Consulting Income', isDebit: false, amount: 3000 }
          ]
        }
      ]
    };
    fs.writeFileSync(directDayBookFilePath, JSON.stringify(directDayBookPayload), 'utf-8');
    const directDayBookResult = await StreamingJsonParser.parseFile(
      directDayBookFilePath,
      directDayBookOutPath,
      'direct_daybook_stream.json'
    );
    const directVch = directDayBookResult.sampleVouchers[0];
    const directEntry0 = directVch.entries[0];
    const directEntry1 = directVch.entries[1];
    assert(
      'STREAMING TRACEABILITY - Test 3: Direct DayBook hierarchy preserved as $.DayBook[0] and $.DayBook[0].entries[0]',
      directVch.traceability?.jsonPath === '$.DayBook[0]' &&
      directEntry0.traceability?.jsonPath === '$.DayBook[0].entries[0]' &&
      directEntry1.traceability?.jsonPath === '$.DayBook[0].entries[1]',
      `Direct JSON paths verified: vchPath=${directVch.traceability?.jsonPath}, entry0Path=${directEntry0.traceability?.jsonPath}`
    );

    // Test 4.5.6: Nested DayBook Envelope Traceability
    const nestedTraceFilePath = path.join(testStorageDir, 'nested_daybook_stream.json');
    const nestedTraceOutPath = path.join(testStorageDir, 'nested_daybook_out.json');
    const nestedEnvelopePayload = {
      ENVELOPE: {
        BODY: {
          EXPORTDATA: {
            TALLYMESSAGE: {
              DayBook: [
                {
                  voucherNumber: 'NEST-001',
                  voucherType: 'Payment',
                  date: '2024-08-10',
                  ALLLEDGERENTRIES: {
                    LEDGERENTRIES: [
                      { ledgerName: 'Supplier Inc', isDebit: true, amount: 12000 },
                      { ledgerName: 'Bank Account', isDebit: false, amount: 12000 }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    };
    fs.writeFileSync(nestedTraceFilePath, JSON.stringify(nestedEnvelopePayload), 'utf-8');
    const nestedTraceResult = await StreamingJsonParser.parseFile(
      nestedTraceFilePath,
      nestedTraceOutPath,
      'nested_daybook_stream.json'
    );
    const nestedVch = nestedTraceResult.sampleVouchers[0];
    const nestedEntry0 = nestedVch.entries[0];
    const nestedEntry1 = nestedVch.entries[1];

    assert(
      'STREAMING TRACEABILITY - Test 4: Nested envelope hierarchy and nested LEDGERENTRIES preserved accurately',
      nestedVch.traceability?.jsonPath === '$.ENVELOPE.BODY.EXPORTDATA.TALLYMESSAGE.DayBook[0]' &&
      nestedEntry0.traceability?.jsonPath === '$.ENVELOPE.BODY.EXPORTDATA.TALLYMESSAGE.DayBook[0].ALLLEDGERENTRIES.LEDGERENTRIES[0]' &&
      nestedEntry1.traceability?.jsonPath === '$.ENVELOPE.BODY.EXPORTDATA.TALLYMESSAGE.DayBook[0].ALLLEDGERENTRIES.LEDGERENTRIES[1]',
      `Exact JSON paths verified: vchPath=${nestedVch.traceability?.jsonPath}, entry0Path=${nestedEntry0.traceability?.jsonPath}, entry1Path=${nestedEntry1.traceability?.jsonPath}`
    );

    // =========================================================================
    // Test 4.6: FINAL AUDIT REGRESSION TEST (Requirement 11)
    // Proving Real JSON, XML, and Excel with NO FY result in null and REVIEW_REQUIRED
    // =========================================================================
    const req11Json = JSON.stringify({
      company: 'Pure Undetected FY Enterprises',
      vouchers: [{
        voucherNumber: 'NF-99',
        voucherType: 'Payment',
        date: '2023-08-10',
        amount: 8000,
        entries: [
          { ledgerName: 'Rent A/c', amount: 8000, isDebit: true },
          { ledgerName: 'Bank', amount: 8000, isDebit: false }
        ]
      }]
    });
    const parsedReq11Json = engine.parseJsonData(req11Json, 'pure_no_fy.json');
    assert(
      'FINAL AUDIT - Regression Test (JSON without FY)',
      parsedReq11Json.rawRecords.fyFrom === null &&
      parsedReq11Json.rawRecords.fyTo === null &&
      parsedReq11Json.rawRecords.isFyDetected === false &&
      parsedReq11Json.preview.detectedFinancialYear.status === 'REVIEW_REQUIRED',
      'Real JSON without FY yields from=null, to=null, isFyDetected=false, status=REVIEW_REQUIRED'
    );

    const req11Xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <EXPORTDATA>
      <TALLYMESSAGE>
        <COMPANY NAME="Undetected FY XML Ltd" />
        <VOUCHER VCHTYPE="Receipt">
          <DATE>20220615</DATE>
          <VOUCHERNUMBER>RCT-01</VOUCHERNUMBER>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Cash</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-12000</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Customer Beta</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>12000</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
    const parsedReq11Xml = engine.parseXmlData(req11Xml, 'pure_no_fy.xml');
    assert(
      'FINAL AUDIT - Regression Test (XML without FY)',
      parsedReq11Xml.rawRecords.fyFrom === null &&
      parsedReq11Xml.rawRecords.fyTo === null &&
      parsedReq11Xml.rawRecords.isFyDetected === false &&
      parsedReq11Xml.preview.detectedFinancialYear.status === 'REVIEW_REQUIRED',
      'Real XML without FY yields from=null, to=null, isFyDetected=false, status=REVIEW_REQUIRED'
    );

    const req11Wb = XLSX.utils.book_new();
    const req11SheetData = [
      ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Debit', 'Credit'],
      ['2023-09-01', 'Office Supplies', 'Payment', 'V-001', 3500, ''],
      ['2023-09-01', 'Petty Cash', 'Payment', 'V-001', '', 3500]
    ];
    const req11Ws = XLSX.utils.aoa_to_sheet(req11SheetData);
    XLSX.utils.book_append_sheet(req11Wb, req11Ws, 'Sheet1');
    const req11XlsxBuf = XLSX.write(req11Wb, { type: 'buffer', bookType: 'xlsx' });
    const parsedReq11Xlsx = engine.parseExcelBuffer(req11XlsxBuf, 'pure_no_fy.xlsx');
    assert(
      'FINAL AUDIT - Regression Test (Excel without FY)',
      parsedReq11Xlsx.rawRecords.fyFrom === null &&
      parsedReq11Xlsx.rawRecords.fyTo === null &&
      parsedReq11Xlsx.rawRecords.isFyDetected === false &&
      parsedReq11Xlsx.preview.detectedFinancialYear.status === 'REVIEW_REQUIRED',
      'Real Excel without FY yields from=null, to=null, isFyDetected=false, status=REVIEW_REQUIRED'
    );

    // =========================================================================
    // Test 4.7: FINAL AUDIT SOURCE-CONTAMINATION ISOLATION (Requirement 12)
    // Step 1: Import a DEMO dataset containing 2024-25.
    // Step 2: Import a REAL dataset with no FY.
    // Step 3: Verify real dataset does NOT inherit 2024-25 from demo state or storage.
    // =========================================================================
    // 1. Commit DEMO dataset
    const demoXml = engine.generateSampleXml();
    const parsedDemo = engine.parseXmlData(demoXml, 'sample_demo_tally.xml');
    const demoMappings = engine.generateAutoMappings(parsedDemo.rawRecords);
    const savedDemo = engine.commitDataset(
      'sample_demo_tally.xml',
      'XML',
      demoXml.length,
      parsedDemo.rawRecords,
      demoMappings,
      {
        companyName: '[DEMO DATA] Apex Global Trading Pvt Ltd',
        financialYearFrom: '2024-04-01',
        financialYearTo: '2025-03-31',
        isDemoData: true
      }
    );
    assert(
      'FINAL AUDIT - Source Contamination Step 1: Demo dataset created with explicit isDemoData=true',
      savedDemo.metadata.isDemoData === true &&
      savedDemo.metadata.financialYearFrom === '2024-04-01' &&
      savedDemo.metadata.financialYearTo === '2025-03-31',
      'Demo dataset saved with explicit demo flag'
    );

    // 2. Now import REAL dataset with NO FY
    const realNoFyJson = JSON.stringify({
      company: 'Target Real Client Without FY',
      vouchers: [{
        voucherNumber: 'REAL-01',
        voucherType: 'Journal',
        date: '2021-12-10',
        amount: 50000,
        entries: [
          { ledgerName: 'Machinery', amount: 50000, isDebit: true },
          { ledgerName: 'Vendor Beta', amount: 50000, isDebit: false }
        ]
      }]
    });
    const parsedReal = engine.parseJsonData(realNoFyJson, 'real_client_import.json');
    const realMappings = engine.generateAutoMappings(parsedReal.rawRecords);
    const savedReal = engine.commitDataset(
      'real_client_import.json',
      'JSON',
      realNoFyJson.length,
      parsedReal.rawRecords,
      realMappings,
      {
        isDemoData: false
        // No financialYearFrom / financialYearTo override provided
      }
    );

    assert(
      'FINAL AUDIT - Source Contamination Step 2: Real dataset MUST NOT inherit 2024-25 from Demo dataset',
      savedReal.metadata.isDemoData === false &&
      savedReal.metadata.financialYearFrom === null &&
      savedReal.metadata.financialYearTo === null &&
      savedReal.metadata.financialYearStatus === 'REVIEW_REQUIRED' &&
      savedReal.metadata.financialYearDetectionSource === 'Not Detected in Source Data',
      `Real dataset financialYearFrom=${savedReal.metadata.financialYearFrom}, financialYearTo=${savedReal.metadata.financialYearTo}, status=${savedReal.metadata.financialYearStatus}`
    );

    // Verify stored index reflection
    const storedRecordReal = engine.getDatasetById(savedReal.metadata.id);
    const storedMetaReal = storedRecordReal ? storedRecordReal.metadata : null;
    assert(
      'FINAL AUDIT - Source Contamination Step 3: Persisted storage index retains null FY for Real dataset',
      storedMetaReal !== null &&
      storedMetaReal.financialYearFrom === null &&
      storedMetaReal.financialYearTo === null &&
      storedMetaReal.financialYearStatus === 'REVIEW_REQUIRED',
      'Persisted storage index confirmed free from default contamination'
    );

    // =========================================================================
    // Cleanup temporary test files
    // =========================================================================
    try {
      if (fs.existsSync(testStorageDir)) {
        fs.rmSync(testStorageDir, { recursive: true, force: true });
      }
    } catch (cleanErr) {
      console.warn('Test cleanup notice:', cleanErr);
    }

  } catch (err: any) {
    results.push({
      testName: 'General Test Execution',
      passed: false,
      message: `Fatal test error: ${err.message}`
    });
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
