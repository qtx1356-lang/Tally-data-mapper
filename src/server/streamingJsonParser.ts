/**
 * EXFIN Tally Audit Platform - Memory-Safe Streaming JSON Parser
 * 
 * Provides true incremental streaming JSON parsing for large Tally exports (e.g. 126.5 MB DayBook.json).
 * 
 * INVARIANT:
 * Does NOT call `fs.readFileSync(filePath, 'utf-8')` or `JSON.parse(entireFile)`.
 * Reads in 64KB/128KB chunks, parses voucher items one-by-one, extracts canonical voucher lines,
 * normalizes debit/credit with zero truthiness hazards, streams canonical records directly to disk,
 * and maintains only a bounded preview (first 50 records) and aggregate statistics in memory.
 */

import fs from 'fs';
import path from 'path';
import { 
  CanonicalVoucher, 
  CanonicalVoucherLine, 
  ImportFileFormat, 
  SourceTraceability 
} from '../types/offlineDataImport';
import { normalizeDebitCredit } from './debitCreditNormalization';

export interface StreamingParseProgress {
  phase: 'Uploading' | 'Processing' | 'Normalizing' | 'Mapping' | 'Quality Check' | 'Finalizing' | 'Completed' | 'Failed';
  recordsProcessed: number;
  totalBytes: number;
  bytesRead: number;
  percent: number;
}

export interface StreamingParseResult {
  detectedCompany: string | null;
  detectedFinancialYear: {
    from: string | null;
    to: string | null;
    isDetected: boolean;
    status: 'DETECTED' | 'REVIEW_REQUIRED';
  };
  totalVouchers: number;
  totalLedgers: number;
  totalStockItems: number;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  balanceDifference: number;
  sampleVouchers: CanonicalVoucher[]; // Bounded preview: up to 50 records
  sourceTraceabilitySamples: SourceTraceability[];
  preview: any;
  recordsFilePath: string; // Disk path where the canonical records are stored
}

export class StreamingJsonParser {
  private static readonly CHUNK_SIZE = 128 * 1024; // 128 KB buffer per read
  private static readonly MAX_PREVIEW_RECORDS = 50;

  /**
   * Parse a Tally JSON file incrementally using streaming buffers.
   * @param filePath Path to the input JSON file on disk
   * @param outputRecordsFilePath Path where parsed canonical records will be written on disk
   * @param originalFileName Original uploaded filename for traceability
   * @param onProgress Optional progress callback
   */
  public static async parseFile(
    filePath: string,
    outputRecordsFilePath: string,
    originalFileName: string,
    onProgress?: (p: StreamingParseProgress) => void
  ): Promise<StreamingParseResult> {
    const stats = fs.statSync(filePath);
    const totalBytes = stats.size;
    let bytesRead = 0;

    const fileName = originalFileName || path.basename(filePath);

    // Ensure output directory exists
    const outDir = path.dirname(outputRecordsFilePath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Open write stream for canonical records file
    const outStream = fs.createWriteStream(outputRecordsFilePath, { encoding: 'utf-8' });
    outStream.write('{\n  "vouchers": [\n');

    let isFirstVoucherWritten = false;
    let totalVouchers = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const sampleVouchers: CanonicalVoucher[] = [];
    const sourceTraceabilitySamples: SourceTraceability[] = [];

    // Header metadata tracking
    let detectedCompany: string | null = null;
    let rawStartingFrom: string | null = null;
    let rawEndingAt: string | null = null;
    let rawFyFrom: string | null = null;
    let rawFyTo: string | null = null;

    let minDate: string | null = null;
    let maxDate: string | null = null;

    // Parser State Machine
    // States: 'HEADER' | 'IN_ARRAY' | 'FOOTER'
    let state: 'HEADER' | 'IN_ARRAY' | 'FOOTER' = 'HEADER';
    let objectDepth = 0;
    let arrayDepth = 0;
    let currentObjectChunks: string[] = [];

    // Position tracking for rich error reporting
    let byteOffset = 0;
    let lineNum = 1;
    let colNum = 1;

    let recentCharBuffer = '';
    const MAX_RECENT_BUFFER = 100;

    // Pre-array buffer & key stack to capture header metadata and exact container hierarchy
    let headerBuffer = '';
    const MAX_HEADER_BUFFER = 256 * 1024; // Keep at most 256KB for header metadata

    let detectedContainerPath = '$';
    const keyStack: (string | null)[] = [];
    let currentPendingKey: string | null = null;
    let inHeaderString = false;
    let isHeaderEscaped = false;
    let headerStrBuffer = '';
    let headerQuoteChar: string | null = null;
    let lastHeaderFinishedStr = '';

    const readStream = fs.createReadStream(filePath, {
      encoding: 'utf-8',
      highWaterMark: this.CHUNK_SIZE
    });

    let lastProgressReportTime = Date.now();

    const processSingleVoucherObject = (rawObjInput: string | any, itemPath?: string) => {
      let rawVch: any;
      if (typeof rawObjInput === 'string') {
        try {
          rawVch = JSON.parse(rawObjInput);
        } catch (e) {
          // Skip malformed individual segment if corrupted
          return;
        }
      } else {
        rawVch = rawObjInput;
      }

      if (!rawVch || typeof rawVch !== 'object') {
        return;
      }

      // Check if this object contains an array of vouchers or messages
      if (Array.isArray(rawVch.VOUCHER)) {
        rawVch.VOUCHER.forEach((subVch: any, subIdx: number) => {
          const subPath = itemPath ? `${itemPath}.VOUCHER[${subIdx}]` : `VOUCHER[${subIdx}]`;
          processSingleVoucherObject(subVch, subPath);
        });
        return;
      }
      if (Array.isArray(rawVch.voucher)) {
        rawVch.voucher.forEach((subVch: any, subIdx: number) => {
          const subPath = itemPath ? `${itemPath}.voucher[${subIdx}]` : `voucher[${subIdx}]`;
          processSingleVoucherObject(subVch, subPath);
        });
        return;
      }
      if (Array.isArray(rawVch.TALLYMESSAGE)) {
        rawVch.TALLYMESSAGE.forEach((subMsg: any, subIdx: number) => {
          const subPath = itemPath ? `${itemPath}.TALLYMESSAGE[${subIdx}]` : `TALLYMESSAGE[${subIdx}]`;
          processSingleVoucherObject(subMsg, subPath);
        });
        return;
      }
      if (Array.isArray(rawVch.TRANSACTIONS)) {
        rawVch.TRANSACTIONS.forEach((subTx: any, subIdx: number) => {
          const subPath = itemPath ? `${itemPath}.TRANSACTIONS[${subIdx}]` : `TRANSACTIONS[${subIdx}]`;
          processSingleVoucherObject(subTx, subPath);
        });
        return;
      }
      if (Array.isArray(rawVch.DayBook) || Array.isArray(rawVch.DAYBOOK) || Array.isArray(rawVch.daybook)) {
        const dbArr = rawVch.DayBook || rawVch.DAYBOOK || rawVch.daybook;
        dbArr.forEach((subDb: any, subIdx: number) => {
          const subPath = itemPath ? `${itemPath}.DayBook[${subIdx}]` : `DayBook[${subIdx}]`;
          processSingleVoucherObject(subDb, subPath);
        });
        return;
      }

      // Header metadata extraction from object if present
      if (!detectedCompany) {
        const comp = rawVch.COMPANY || rawVch.companyName || rawVch.company || rawVch.NAME;
        if (typeof comp === 'string' && comp.trim()) detectedCompany = comp.trim();
      }
      if (!rawStartingFrom) {
        const sf = rawVch.STARTINGFROM || rawVch.from || rawVch.startDate || rawVch.fromPeriod;
        if (typeof sf === 'string' && sf.trim()) rawStartingFrom = sf.trim();
      }
      if (!rawEndingAt) {
        const ea = rawVch.ENDINGAT || rawVch.to || rawVch.endDate || rawVch.toPeriod;
        if (typeof ea === 'string' && ea.trim()) rawEndingAt = ea.trim();
      }
      if (!rawFyFrom) {
        const ff = rawVch.financialYearFrom;
        if (typeof ff === 'string' && ff.trim()) rawFyFrom = ff.trim();
      }
      if (!rawFyTo) {
        const ft = rawVch.financialYearTo;
        if (typeof ft === 'string' && ft.trim()) rawFyTo = ft.trim();
      }

      // Check if wrapped voucher e.g. { "VOUCHER": { ... } } or { "voucher": { ... } } or { "DAYBOOK": { ... } } or { "TALLYMESSAGE": { "VOUCHER": { ... } } }
      let isWrapped = false;
      let wrapperKey: string | null = null;
      let v: any = rawVch;

      if (rawVch.ENVELOPE && typeof rawVch.ENVELOPE === 'object') {
        v = rawVch.ENVELOPE.BODY?.DATA?.TALLYMESSAGE || rawVch.ENVELOPE.BODY?.TALLYMESSAGE || rawVch.ENVELOPE;
        isWrapped = true;
        wrapperKey = 'ENVELOPE';
      }
      if (v.BODY && typeof v.BODY === 'object') {
        v = v.BODY.DATA?.TALLYMESSAGE || v.BODY.TALLYMESSAGE || v.BODY;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.BODY` : 'BODY';
      }
      if (v.DATA && typeof v.DATA === 'object') {
        v = v.DATA.TALLYMESSAGE || v.DATA;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.DATA` : 'DATA';
      }
      if (v.TALLYMESSAGE && typeof v.TALLYMESSAGE === 'object') {
        if (Array.isArray(v.TALLYMESSAGE)) {
          v.TALLYMESSAGE.forEach((subMsg: any, subIdx: number) => {
            const subPath = itemPath ? `${itemPath}.TALLYMESSAGE[${subIdx}]` : `TALLYMESSAGE[${subIdx}]`;
            processSingleVoucherObject(subMsg, subPath);
          });
          return;
        }
        v = v.TALLYMESSAGE;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.TALLYMESSAGE` : 'TALLYMESSAGE';
      }
      if (v.DayBook && typeof v.DayBook === 'object') {
        v = v.DayBook;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.DayBook` : 'DayBook';
      } else if (v.DAYBOOK && typeof v.DAYBOOK === 'object') {
        v = v.DAYBOOK;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.DAYBOOK` : 'DAYBOOK';
      }
      if (v.VOUCHER && typeof v.VOUCHER === 'object') {
        if (Array.isArray(v.VOUCHER)) {
          v.VOUCHER.forEach((subV: any, subIdx: number) => {
            const subPath = itemPath ? `${itemPath}.VOUCHER[${subIdx}]` : `VOUCHER[${subIdx}]`;
            processSingleVoucherObject(subV, subPath);
          });
          return;
        }
        v = v.VOUCHER;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.VOUCHER` : 'VOUCHER';
      } else if (v.voucher && typeof v.voucher === 'object') {
        if (Array.isArray(v.voucher)) {
          v.voucher.forEach((subV: any, subIdx: number) => {
            const subPath = itemPath ? `${itemPath}.voucher[${subIdx}]` : `voucher[${subIdx}]`;
            processSingleVoucherObject(subV, subPath);
          });
          return;
        }
        v = v.voucher;
        isWrapped = true;
        wrapperKey = wrapperKey ? `${wrapperKey}.voucher` : 'voucher';
      }

      // Check if this is a Master record (LEDGER, GROUP, STOCKITEM, COMPANY, CURRENCY, UNIT) rather than a voucher
      if (v.LEDGER || v.ledger || v.GROUP || v.group || v.STOCKITEM || v.stockItem || v.CURRENCY || v.UNIT) {
        if (!v.VOUCHER && !v.voucher && !v.voucherNumber && !v.VOUCHERNUMBER && !v.vchNo && !v.lines && !v.entries && !v.ALLLEDGERENTRIES && !v['ALLLEDGERENTRIES.LIST']) {
          return; // Skip master entities cleanly
        }
      }

      // Helper to find first defined value across candidate keys
      const firstVal = (...candidates: any[]) => {
        for (const c of candidates) {
          if (c !== undefined && c !== null && c !== '') return c;
        }
        return null;
      };

      // Check if object is a candidate voucher object
      const vchNumberRaw = firstVal(
        v.VoucherNumber, v.voucherNumber, v.VOUCHERNUMBER, v.Vouchernumber,
        v.Voucher_Number, v.voucher_number, v.VoucherNo, v.voucherNo, v.VOUCHERNO,
        v.VchNo, v.vchNo, v.VCHNO, v.InvoiceNo, v.invoiceNo, v.INVOICENO,
        v.DocNo, v.docNo, v.Reference, v.reference, v.RefNo, v.refNo,
        v.Number, v.number, v.id
      );
      
      const vchTypeRaw = firstVal(
        v.VoucherType, v.voucherType, v.VOUCHERTYPENAME, v.VOUCHERTYPE,
        v.Vouchertype, v.Voucher_Type, v.voucher_type, v.VchType, v.vchType,
        v.VCHTYPE, v.Type, v.type, v.TYPE, v.TransactionType, v.transactionType
      );

      const rawDate = firstVal(
        v.Date, v.date, v.DATE, v.VoucherDate, v.voucherDate, v.VOUCHERDATE,
        v.TxDate, v.txDate, v.TxnDate, v.txnDate, v.EffectiveDate, v.effectiveDate
      );

      const partyNameRaw = v.PartyLedgerName || v.partyLedgerName || v.PARTYLEDGERNAME ||
                           v.PartyLedger || v.partyLedger || v.PARTYLEDGER ||
                           v.PartyName || v.partyName || v.Party || v.party ||
                           v.Particulars || v.particulars || v.customerName || null;

      const narrationRaw = v.Narration || v.narration || v.NARRATION || 
                            v.Remarks || v.remarks || v.REMARKS || 
                            v.Description || v.description || v.Notes || v.notes || null;

      const hasEntries = Boolean(
        Array.isArray(v.entries) || (v.entries && typeof v.entries === 'object') ||
        Array.isArray(v.ALLLEDGERENTRIES) || (v.ALLLEDGERENTRIES && typeof v.ALLLEDGERENTRIES === 'object') ||
        (v.ALLLEDGERENTRIES && Array.isArray(v.ALLLEDGERENTRIES.LEDGERENTRIES)) ||
        (v.ALLLEDGERENTRIES && Array.isArray(v.ALLLEDGERENTRIES.LIST)) ||
        Array.isArray(v['ALLLEDGERENTRIES.LIST']) || (v['ALLLEDGERENTRIES.LIST'] && typeof v['ALLLEDGERENTRIES.LIST'] === 'object') ||
        Array.isArray(v.LEDGERENTRIES) || (v.LEDGERENTRIES && typeof v.LEDGERENTRIES === 'object') ||
        Array.isArray(v['LEDGERENTRIES.LIST']) || (v['LEDGERENTRIES.LIST'] && typeof v['LEDGERENTRIES.LIST'] === 'object') ||
        Array.isArray(v.ledgerEntries) || (v.ledgerEntries && typeof v.ledgerEntries === 'object') ||
        Array.isArray(v.lines) || (v.lines && typeof v.lines === 'object') ||
        Array.isArray(v['ALLINVENTORYENTRIES.LIST']) || Array.isArray(v.ALLINVENTORYENTRIES)
      );

      const isVoucherCandidate = Boolean(vchNumberRaw || vchTypeRaw || rawDate || partyNameRaw || narrationRaw || hasEntries);

      if (!isVoucherCandidate) {
        return; // Skip non-voucher metadata objects
      }

      totalVouchers++;
      const vchIdx = totalVouchers - 1;

      // Construct exact voucher JSON path reflecting genuine source hierarchy
      let voucherJsonPath: string;
      if (itemPath) {
        voucherJsonPath = isWrapped && wrapperKey ? `${itemPath}.${wrapperKey}` : itemPath;
      } else {
        const vchBasePath = detectedContainerPath === '$' ? `$[${vchIdx}]` : `${detectedContainerPath}[${vchIdx}]`;
        voucherJsonPath = isWrapped && wrapperKey ? `${vchBasePath}.${wrapperKey}` : vchBasePath;
      }

      // STRICT ZERO-FABRICATION: Never generate VCH-* or default 'Journal'
      const vchNumber = vchNumberRaw ? String(vchNumberRaw).trim() : null;
      const vchType = vchTypeRaw ? String(vchTypeRaw).trim() : null;
      
      // Date normalization
      let vDate: string | null = null;
      if (rawDate) {
        const strDate = String(rawDate).trim();
        if (/^\d{8}$/.test(strDate)) {
          vDate = `${strDate.substring(0, 4)}-${strDate.substring(4, 6)}-${strDate.substring(6, 8)}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(strDate)) {
          vDate = strDate;
        } else {
          vDate = strDate;
        }
      }

      if (vDate) {
        if (!minDate || vDate < minDate) minDate = vDate;
        if (!maxDate || vDate > maxDate) maxDate = vDate;
      }

      const partyName = partyNameRaw ? String(partyNameRaw).trim() : null;
      const narration = narrationRaw ? String(narrationRaw).trim() : null;

      // Extract ledger lines and detect the exact source hierarchy segments for accurate child path construction
      let rawEntriesPathSegments: string[] = [];
      let rawEntries: any[] = [];
      if (Array.isArray(v.entries)) { 
        rawEntries = v.entries; 
        rawEntriesPathSegments = ['entries']; 
      } else if (Array.isArray(v.ALLLEDGERENTRIES)) { 
        rawEntries = v.ALLLEDGERENTRIES; 
        rawEntriesPathSegments = ['ALLLEDGERENTRIES']; 
      } else if (v.ALLLEDGERENTRIES && Array.isArray(v.ALLLEDGERENTRIES.LEDGERENTRIES)) { 
        rawEntries = v.ALLLEDGERENTRIES.LEDGERENTRIES; 
        rawEntriesPathSegments = ['ALLLEDGERENTRIES', 'LEDGERENTRIES']; 
      } else if (Array.isArray(v['ALLLEDGERENTRIES.LIST'])) { 
        rawEntries = v['ALLLEDGERENTRIES.LIST']; 
        rawEntriesPathSegments = ['ALLLEDGERENTRIES.LIST']; 
      } else if (v.ALLLEDGERENTRIES && Array.isArray(v.ALLLEDGERENTRIES.LIST)) {
        rawEntries = v.ALLLEDGERENTRIES.LIST;
        rawEntriesPathSegments = ['ALLLEDGERENTRIES', 'LIST'];
      } else if (Array.isArray(v.LEDGERENTRIES)) { 
        rawEntries = v.LEDGERENTRIES; 
        rawEntriesPathSegments = ['LEDGERENTRIES']; 
      } else if (Array.isArray(v['LEDGERENTRIES.LIST'])) {
        rawEntries = v['LEDGERENTRIES.LIST'];
        rawEntriesPathSegments = ['LEDGERENTRIES.LIST'];
      } else if (v.LEDGERENTRIES && Array.isArray(v.LEDGERENTRIES.LIST)) {
        rawEntries = v.LEDGERENTRIES.LIST;
        rawEntriesPathSegments = ['LEDGERENTRIES', 'LIST'];
      } else if (Array.isArray(v.ledgerEntries)) { 
        rawEntries = v.ledgerEntries; 
        rawEntriesPathSegments = ['ledgerEntries']; 
      } else if (Array.isArray(v.lines)) { 
        rawEntries = v.lines; 
        rawEntriesPathSegments = ['lines']; 
      } else if (v['ALLLEDGERENTRIES.LIST'] && typeof v['ALLLEDGERENTRIES.LIST'] === 'object' && !Array.isArray(v['ALLLEDGERENTRIES.LIST'])) {
        rawEntries = [v['ALLLEDGERENTRIES.LIST']];
        rawEntriesPathSegments = ['ALLLEDGERENTRIES.LIST'];
      } else if (v.ALLLEDGERENTRIES && v.ALLLEDGERENTRIES.LEDGERENTRIES && typeof v.ALLLEDGERENTRIES.LEDGERENTRIES === 'object' && !Array.isArray(v.ALLLEDGERENTRIES.LEDGERENTRIES)) {
        rawEntries = [v.ALLLEDGERENTRIES.LEDGERENTRIES];
        rawEntriesPathSegments = ['ALLLEDGERENTRIES', 'LEDGERENTRIES'];
      } else if (v.ALLLEDGERENTRIES && v.ALLLEDGERENTRIES.LIST && typeof v.ALLLEDGERENTRIES.LIST === 'object' && !Array.isArray(v.ALLLEDGERENTRIES.LIST)) {
        rawEntries = [v.ALLLEDGERENTRIES.LIST];
        rawEntriesPathSegments = ['ALLLEDGERENTRIES', 'LIST'];
      } else if (v.ALLLEDGERENTRIES && typeof v.ALLLEDGERENTRIES === 'object' && !Array.isArray(v.ALLLEDGERENTRIES)) {
        rawEntries = [v.ALLLEDGERENTRIES];
        rawEntriesPathSegments = ['ALLLEDGERENTRIES'];
      } else if (v['LEDGERENTRIES.LIST'] && typeof v['LEDGERENTRIES.LIST'] === 'object' && !Array.isArray(v['LEDGERENTRIES.LIST'])) {
        rawEntries = [v['LEDGERENTRIES.LIST']];
        rawEntriesPathSegments = ['LEDGERENTRIES.LIST'];
      } else if (v.LEDGERENTRIES && typeof v.LEDGERENTRIES === 'object' && !Array.isArray(v.LEDGERENTRIES)) {
        rawEntries = [v.LEDGERENTRIES];
        rawEntriesPathSegments = ['LEDGERENTRIES'];
      } else if (v.ledgerEntries && typeof v.ledgerEntries === 'object' && !Array.isArray(v.ledgerEntries)) {
        rawEntries = [v.ledgerEntries];
        rawEntriesPathSegments = ['ledgerEntries'];
      } else if (v.lines && typeof v.lines === 'object' && !Array.isArray(v.lines)) {
        rawEntries = [v.lines];
        rawEntriesPathSegments = ['lines'];
      } else if (v.entries && typeof v.entries === 'object' && !Array.isArray(v.entries)) {
        rawEntries = [v.entries];
        rawEntriesPathSegments = ['entries'];
      }

      // Check nested inventory accounting allocations if ledger entries are still empty
      if (rawEntries.length === 0) {
        const invList = v['ALLINVENTORYENTRIES.LIST'] || v.ALLINVENTORYENTRIES || v.inventoryEntries;
        if (Array.isArray(invList)) {
          for (const inv of invList) {
            const allocs = inv['ACCOUNTINGALLOCATIONS.LIST'] || inv.ACCOUNTINGALLOCATIONS || inv.accountingAllocations;
            if (Array.isArray(allocs)) {
              rawEntries.push(...allocs);
              rawEntriesPathSegments = ['ALLINVENTORYENTRIES.LIST', 'ACCOUNTINGALLOCATIONS.LIST'];
            } else if (allocs && typeof allocs === 'object') {
              rawEntries.push(allocs);
              rawEntriesPathSegments = ['ALLINVENTORYENTRIES.LIST', 'ACCOUNTINGALLOCATIONS.LIST'];
            }
          }
        } else if (invList && typeof invList === 'object') {
          const allocs = invList['ACCOUNTINGALLOCATIONS.LIST'] || invList.ACCOUNTINGALLOCATIONS || invList.accountingAllocations;
          if (Array.isArray(allocs)) {
            rawEntries.push(...allocs);
            rawEntriesPathSegments = ['ALLINVENTORYENTRIES.LIST', 'ACCOUNTINGALLOCATIONS.LIST'];
          } else if (allocs && typeof allocs === 'object') {
            rawEntries.push(allocs);
            rawEntriesPathSegments = ['ALLINVENTORYENTRIES.LIST', 'ACCOUNTINGALLOCATIONS.LIST'];
          }
        }
      }

      const entries: CanonicalVoucherLine[] = [];
      let vchDebit = 0;
      let vchCredit = 0;

      rawEntries.forEach((e: any, lIdx: number) => {
        const lNameRaw = e.LedgerName || e.ledgerName || e.LEDGERNAME || e.Ledgername || e.ledger_name || e.LEDGER_NAME ||
                         e.Name || e.name || e.NAME ||
                         e.Account || e.account || e.ACCOUNT || e.AccountName || e.accountName ||
                         e.Party || e.party || e.PARTY || e.PartyName || e.partyName ||
                         e.PartyLedger || e.partyLedger || e.PartyLedgerName || e.partyLedgerName || e.PARTYLEDGERNAME ||
                         e.Particulars || e.particulars || e.PARTICULARS ||
                         e.HeadOfAccount || e.headOfAccount || null;
        const lName = lNameRaw ? String(lNameRaw).trim() : null;

        const eAmtRaw = e.Amount !== undefined ? e.Amount : 
                        (e.amount !== undefined ? e.amount : 
                        (e.AMOUNT !== undefined ? e.AMOUNT : 
                        (e.RawAmount !== undefined ? e.RawAmount : 
                        (e.rawAmount !== undefined ? e.rawAmount : 
                        (e.Total !== undefined ? e.Total : 
                        (e.total !== undefined ? e.total : 
                        (e.NetAmount !== undefined ? e.NetAmount : 
                        (e.netAmount !== undefined ? e.netAmount : 
                        (e.Value !== undefined ? e.Value :
                        (e.value !== undefined ? e.value :
                        (e.Amt !== undefined ? e.Amt : e.amt)))))))))));

        // Strict Centralized Normalization with ZERO JS Truthiness Hazards
        const norm = normalizeDebitCredit({
          isDebit: e.IsDebit !== undefined ? e.IsDebit : (e.isDebit !== undefined ? e.isDebit : (e.ISDEBIT !== undefined ? e.ISDEBIT : e.is_debit)),
          isCredit: e.IsCredit !== undefined ? e.IsCredit : (e.isCredit !== undefined ? e.isCredit : (e.ISCREDIT !== undefined ? e.ISCREDIT : e.is_credit)),
          isDeemedPositive: e.IsDeemedPositive !== undefined ? e.IsDeemedPositive : (e.isDeemedPositive !== undefined ? e.isDeemedPositive : (e.ISDEEMEDPOSITIVE !== undefined ? e.ISDEEMEDPOSITIVE : e.is_deemed_positive)),
          type: e.Type !== undefined ? e.Type : (e.type !== undefined ? e.type : (e.TYPE !== undefined ? e.TYPE : (e.drCr || e.DrCr || e.DR_CR || e.dr_cr))),
          debitAmount: e.Debit !== undefined ? e.Debit : (e.debit !== undefined ? e.debit : (e.DEBIT !== undefined ? e.DEBIT : (e.debitAmount !== undefined ? e.debitAmount : e.DebitAmount))),
          creditAmount: e.Credit !== undefined ? e.Credit : (e.credit !== undefined ? e.credit : (e.CREDIT !== undefined ? e.CREDIT : (e.creditAmount !== undefined ? e.creditAmount : e.CreditAmount))),
          rawAmount: eAmtRaw,
          fileFormatHint: 'JSON'
        });

        if (norm.normalizedAmount !== null && norm.isDebit !== null) {
          if (norm.isDebit) {
            vchDebit += norm.normalizedAmount;
            totalDebit += norm.normalizedAmount;
          } else {
            vchCredit += norm.normalizedAmount;
            totalCredit += norm.normalizedAmount;
          }
        }

        const lineReviewRequired = !lName || norm.normalizedAmount === null || norm.direction === 'UNKNOWN' || norm.reviewRequired;
        const lineReviewReason = !lName 
          ? 'Missing ledger name in source entry' 
          : (norm.normalizedAmount === null ? 'Invalid or missing line amount in source entry' : norm.reviewReason);

        // Construct exact child JSON path for ledger entry based on source hierarchy
        let entryJsonPath: string;
        if (rawEntriesPathSegments.length > 0) {
          const formattedSuffix = rawEntriesPathSegments.map(seg => {
            return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(seg) ? `.${seg}` : `['${seg}']`;
          }).join('');
          entryJsonPath = `${voucherJsonPath}${formattedSuffix}[${lIdx}]`;
        } else {
          entryJsonPath = `${voucherJsonPath}.entries[${lIdx}]`;
        }

        const lineTraceability: SourceTraceability = {
          sourceFileType: 'JSON' as ImportFileFormat,
          sourceFile: fileName,
          jsonPath: entryJsonPath,
          sourceField: lName || null
        };

        if (sourceTraceabilitySamples.length < 20) {
          sourceTraceabilitySamples.push(lineTraceability);
        }

        entries.push({
          id: `line-stream-${totalVouchers}-${lIdx + 1}`,
          ledgerName: lName,
          amount: norm.normalizedAmount,
          isDebit: norm.isDebit,
          isDeemedPositive: norm.isDeemedPositive,
          rawAmount: norm.sourceAmount,
          sourceAmount: norm.sourceAmount,
          normalizedAmount: norm.normalizedAmount,
          direction: norm.direction,
          ruleApplied: norm.ruleApplied,
          reviewRequired: lineReviewRequired,
          reviewReason: lineReviewReason,
          traceability: lineTraceability
        });
      });

      const diff = Math.abs(vchDebit - vchCredit);
      const isBalanced = entries.length >= 2 && diff <= 0.05 && vchDebit > 0;
      const vchAmount = vchDebit > 0 ? vchDebit : (vchCredit > 0 ? vchCredit : null);

      const reviewReasons: string[] = [];
      if (!vchNumber) reviewReasons.push('Missing voucher number in source');
      if (!vchType) reviewReasons.push('Missing voucher type in source');
      if (!vDate) reviewReasons.push('Missing or invalid voucher date in source');
      if (vchAmount === null) reviewReasons.push('Zero or missing amount in voucher lines');
      if (entries.length === 0) reviewReasons.push('No source ledger entries detected');
      else if (!isBalanced && entries.length > 0) reviewReasons.push(`Debit/Credit imbalance: difference of ₹${diff.toFixed(2)}`);

      const canonicalVoucher: CanonicalVoucher = {
        id: `vch-stream-${totalVouchers}`,
        voucherNumber: vchNumber,
        voucherType: vchType,
        date: vDate,
        partyLedger: partyName,
        amount: vchAmount,
        totalDebit: vchDebit,
        totalCredit: vchCredit,
        narration,
        entries,
        isBalanced,
        difference: diff,
        reviewRequired: reviewReasons.length > 0,
        reviewReasons: reviewReasons.length > 0 ? reviewReasons : undefined,
        sourceFile: fileName,
        datasetId: '',
        traceability: {
          sourceFileType: 'JSON' as ImportFileFormat,
          sourceFile: fileName,
          jsonPath: voucherJsonPath,
          sourceField: vchNumber || null
        }
      };

      // Keep up to 50 sample records for bounded UI preview
      if (sampleVouchers.length < StreamingJsonParser.MAX_PREVIEW_RECORDS) {
        sampleVouchers.push(canonicalVoucher);
      }

      // Incrementally stream write this voucher to disk
      const prefix = isFirstVoucherWritten ? ',\n' : '';
      outStream.write(prefix + '    ' + JSON.stringify(canonicalVoucher));
      isFirstVoucherWritten = true;

      // Periodically report progress
      const now = Date.now();
      if (now - lastProgressReportTime > 250) {
        lastProgressReportTime = now;
        if (onProgress) {
          const pct = Math.min(99, Math.round((bytesRead / totalBytes) * 100));
          onProgress({
            phase: 'Processing',
            recordsProcessed: totalVouchers,
            totalBytes,
            bytesRead,
            percent: pct
          });
        }
      }
    };

    // Stream through the file chunk-by-chunk
    let inString = false;
    let stringQuoteChar: string | null = null;
    let isEscaped = false;

    await new Promise<void>((resolve, reject) => {
      readStream.on('data', (chunk: string | Buffer) => {
        try {
          const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
          bytesRead += Buffer.byteLength(text, 'utf-8');

          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            byteOffset++;

            if (byteOffset === 1 && char.charCodeAt(0) === 0xFEFF) {
              continue;
            }

            if (recentCharBuffer.length >= MAX_RECENT_BUFFER) {
              recentCharBuffer = recentCharBuffer.substring(1);
            }
            recentCharBuffer += char;

            if (char === '\n') {
              lineNum++;
              colNum = 1;
            } else {
              colNum++;
            }

            // If buffering an item object `{ ... }` at element level
            if (objectDepth > 0) {
              currentObjectChunks.push(char);

              if (!inString) {
                if (char === '"' || char === "'") {
                  inString = true;
                  stringQuoteChar = char;
                  isEscaped = false;
                } else if (char === '{') {
                  objectDepth++;
                } else if (char === '}') {
                  objectDepth--;
                  if (objectDepth === 0) {
                    const objStr = currentObjectChunks.join('');
                    currentObjectChunks = [];
                    const vchItemIdx = totalVouchers;
                    const itemPath = detectedContainerPath === '$' ? `$[${vchItemIdx}]` : `${detectedContainerPath}[${vchItemIdx}]`;
                    processSingleVoucherObject(objStr, itemPath);
                  }
                }
              } else {
                if (isEscaped) {
                  isEscaped = false;
                } else if (char === '\\') {
                  isEscaped = true;
                } else if (char === stringQuoteChar) {
                  inString = false;
                  stringQuoteChar = null;
                }
              }
              continue;
            }

            // 1. HEADER STATE: scan until array opening `[` and accurately detect container JSON path
            if (state === 'HEADER') {
              if (headerBuffer.length < MAX_HEADER_BUFFER) {
                headerBuffer += char;
              }

              if (!inHeaderString) {
                if (char === '"' || char === "'") {
                  inHeaderString = true;
                  headerQuoteChar = char;
                  headerStrBuffer = '';
                } else if (char === ':') {
                  currentPendingKey = lastHeaderFinishedStr;
                } else if (char === '{') {
                  keyStack.push(currentPendingKey);
                  currentPendingKey = null;
                } else if (char === '}') {
                  keyStack.pop();
                  currentPendingKey = null;
                } else if (char === '[') {
                  // Target array detected!
                  state = 'IN_ARRAY';
                  arrayDepth = 1;

                  // Build exact detected container path from keyStack and currentPendingKey
                  const pathSegments: string[] = [];
                  for (const k of keyStack) {
                    if (k) pathSegments.push(k);
                  }
                  if (currentPendingKey) {
                    pathSegments.push(currentPendingKey);
                  }

                  if (pathSegments.length === 0) {
                    detectedContainerPath = '$';
                  } else {
                    detectedContainerPath = '$' + pathSegments.map(p => {
                      return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p) ? `.${p}` : `['${p}']`;
                    }).join('');
                  }

                  // Inspect header buffer for Company & FY
                  const compMatch = headerBuffer.match(/"(?:COMPANY|companyName|company|NAME)"\s*:\s*"([^"]+)"/i);
                  if (compMatch && !detectedCompany) detectedCompany = compMatch[1].trim();

                  const startMatch = headerBuffer.match(/"(?:STARTINGFROM|from|startDate|fromPeriod)"\s*:\s*"([^"]+)"/i);
                  if (startMatch && !rawStartingFrom) rawStartingFrom = startMatch[1].trim();

                  const endMatch = headerBuffer.match(/"(?:ENDINGAT|to|endDate|toPeriod)"\s*:\s*"([^"]+)"/i);
                  if (endMatch && !rawEndingAt) rawEndingAt = endMatch[1].trim();

                  const fyFromMatch = headerBuffer.match(/"financialYearFrom"\s*:\s*"([^"]+)"/i);
                  if (fyFromMatch && !rawFyFrom) rawFyFrom = fyFromMatch[1].trim();

                  const fyToMatch = headerBuffer.match(/"financialYearTo"\s*:\s*"([^"]+)"/i);
                  if (fyToMatch && !rawFyTo) rawFyTo = fyToMatch[1].trim();
                }
              } else {
                if (isHeaderEscaped) {
                  isHeaderEscaped = false;
                  headerStrBuffer += char;
                } else if (char === '\\') {
                  isHeaderEscaped = true;
                  headerStrBuffer += char;
                } else if (char === headerQuoteChar) {
                  inHeaderString = false;
                  headerQuoteChar = null;
                  lastHeaderFinishedStr = headerStrBuffer;
                  headerStrBuffer = '';
                } else {
                  headerStrBuffer += char;
                }
              }
              continue;
            }

            // 2. IN_ARRAY STATE: incrementally parse objects `{ ... }` or primitive values in array
            if (state === 'IN_ARRAY') {
              if (!inString) {
                if (char === '"' || char === "'") {
                  inString = true;
                  stringQuoteChar = char;
                  isEscaped = false;
                } else if (char === '{') {
                  objectDepth = 1;
                  currentObjectChunks = ['{'];
                } else if (char === '[') {
                  arrayDepth++;
                } else if (char === ']') {
                  arrayDepth--;
                  if (arrayDepth === 0) {
                    if (totalVouchers > 0) {
                      state = 'FOOTER';
                    } else {
                      // Return to header scanning if this was a non-voucher array (e.g. VERSION: [1, 0])
                      state = 'HEADER';
                      currentPendingKey = null;
                    }
                  }
                } else {
                  // Standard array value separator, whitespace, primitive array token character, or comments
                  continue;
                }
              } else {
                if (isEscaped) {
                  isEscaped = false;
                } else if (char === '\\') {
                  isEscaped = true;
                } else if (char === stringQuoteChar) {
                  inString = false;
                  stringQuoteChar = null;
                }
              }
              continue;
            }

            // 3. FOOTER STATE
            if (state === 'FOOTER') {
              // Ignore remaining container closing chars or whitespace after voucher array finishes
            }
          }
        } catch (streamDataErr) {
          readStream.destroy();
          reject(streamDataErr);
        }
      });

      readStream.on('end', () => {
        if (objectDepth > 0 || inString || (state === 'IN_ARRAY' && arrayDepth > 0)) {
          return reject(new Error(`Invalid JSON in ${fileName} (phase: Processing) at byte ${byteOffset}, line ${lineNum}, column ${colNum}, path ${detectedContainerPath}: unexpected end of stream with unclosed syntax`));
        }
        if (totalVouchers === 0 && state === 'HEADER') {
          return reject(new Error(`Invalid Tally JSON data in ${fileName}: no vouchers found in source JSON structure`));
        }
        resolve();
      });

      readStream.on('error', (err) => {
        reject(err);
      });
    });

    // Close output stream
    outStream.write('\n  ],\n  "ledgers": [],\n  "stockItems": []\n}\n');
    await new Promise<void>((res) => outStream.end(res));

    // Resolve financial year strictly without fabrication
    let fyFrom: string | null = null;
    let fyTo: string | null = null;
    let isFyDetected = false;

    if (rawStartingFrom && rawEndingAt) {
      fyFrom = StreamingJsonParser.normalizeDateString(rawStartingFrom);
      fyTo = StreamingJsonParser.normalizeDateString(rawEndingAt);
      isFyDetected = Boolean(fyFrom && fyTo);
    } else if (rawFyFrom && rawFyTo) {
      fyFrom = StreamingJsonParser.normalizeDateString(rawFyFrom);
      fyTo = StreamingJsonParser.normalizeDateString(rawFyTo);
      isFyDetected = Boolean(fyFrom && fyTo);
    } else {
      isFyDetected = false;
      fyFrom = null;
      fyTo = null;
    }

    const balanceDifference = Math.abs(totalDebit - totalCredit);
    const isBalanced = totalVouchers >= 2 && balanceDifference <= 0.05 && totalDebit > 0;

    const boundedPreview = {
      fileType: 'JSON' as ImportFileFormat,
      fileName: originalFileName,
      fileSize: totalBytes,
      detectedCompany,
      detectedFinancialYear: {
        from: fyFrom,
        to: fyTo,
        isDetected: isFyDetected,
        status: isFyDetected ? 'DETECTED' : 'REVIEW_REQUIRED',
        derivedFromVouchersSuggestion: (!isFyDetected && minDate && maxDate) ? {
          earliestVoucherDate: minDate,
          latestVoucherDate: maxDate
        } : undefined
      },
      rawSampleData: {
        vouchers: sampleVouchers.slice(0, 50)
      },
      entitiesDetected: [
        {
          name: 'Vouchers',
          count: totalVouchers,
          sampleFields: ['voucherNumber', 'voucherType', 'date', 'partyLedgerName', 'amount', 'entries']
        }
      ],
      sampleRecords: sampleVouchers.slice(0, 50),
      counts: {
        vouchers: totalVouchers,
        ledgers: 0,
        stockItems: 0,
        totalDebit,
        totalCredit
      },
      auditSummary: {
        totalVouchers,
        totalDebit,
        totalCredit,
        difference: balanceDifference,
        isBalanced,
        dateRange: {
          from: minDate,
          to: maxDate
        }
      }
    };

    if (onProgress) {
      onProgress({
        phase: 'Completed',
        recordsProcessed: totalVouchers,
        totalBytes,
        bytesRead: totalBytes,
        percent: 100
      });
    }

    return {
      detectedCompany,
      detectedFinancialYear: boundedPreview.detectedFinancialYear as any,
      totalVouchers,
      totalLedgers: 0,
      totalStockItems: 0,
      totalDebit,
      totalCredit,
      isBalanced,
      balanceDifference,
      sampleVouchers,
      sourceTraceabilitySamples,
      preview: boundedPreview,
      recordsFilePath: outputRecordsFilePath
    };
  }

  private static normalizeDateString(raw: string): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/^\d{8}$/.test(trimmed)) {
      return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  }

  /**
   * Incremental async streaming reader for records.json.
   * Reads vouchers one-by-one from disk without holding the entire array in memory.
   */
  public static async iterateVouchersFromRecordsFile(
    recordsFilePath: string,
    onVoucher: (voucher: CanonicalVoucher, index: number) => void | Promise<void>,
    onProgress?: (processed: number, bytesRead: number, totalBytes: number) => void
  ): Promise<{ totalVouchers: number }> {
    if (!fs.existsSync(recordsFilePath)) {
      throw new Error(`Records file not found at: ${recordsFilePath}`);
    }

    const stats = fs.statSync(recordsFilePath);
    const totalBytes = stats.size;
    let bytesRead = 0;
    let totalVouchers = 0;

    let state: 'SCANNING_FOR_VOUCHERS' | 'IN_VOUCHERS_ARRAY' | 'FINISHED' = 'SCANNING_FOR_VOUCHERS';
    let objectDepth = 0;
    let currentObjectChunks: string[] = [];
    let inString = false;
    let isEscaped = false;

    let scanBuffer = '';
    const MAX_SCAN_BUFFER = 64 * 1024;

    const readStream = fs.createReadStream(recordsFilePath, {
      encoding: 'utf-8',
      highWaterMark: this.CHUNK_SIZE
    });

    let lastProgressReportTime = Date.now();

    let processingChain: Promise<void> = Promise.resolve();

    await new Promise<void>((resolve, reject) => {
      readStream.on('data', (chunk: string | Buffer) => {
        readStream.pause();
        processingChain = processingChain.then(async () => {
          try {
            const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
            bytesRead += Buffer.byteLength(text, 'utf-8');

            for (let i = 0; i < text.length; i++) {
              const char = text[i];

              if (state === 'SCANNING_FOR_VOUCHERS') {
                if (scanBuffer.length < MAX_SCAN_BUFFER) {
                  scanBuffer += char;
                }
                if (char === '[') {
                  if (scanBuffer.includes('"vouchers"') || scanBuffer.includes('vouchers') || scanBuffer.trim().startsWith('[')) {
                    state = 'IN_VOUCHERS_ARRAY';
                  }
                }
                continue;
              }

              if (state === 'IN_VOUCHERS_ARRAY') {
                if (!inString) {
                  if (char === '"') {
                    inString = true;
                    if (objectDepth > 0) currentObjectChunks.push(char);
                  } else if (char === '{') {
                    objectDepth++;
                    currentObjectChunks.push(char);
                  } else if (char === '}') {
                    objectDepth--;
                    currentObjectChunks.push(char);
                    if (objectDepth === 0) {
                      const objStr = currentObjectChunks.join('');
                      currentObjectChunks = [];
                      try {
                        const vch = JSON.parse(objStr);
                        totalVouchers++;
                        const res = onVoucher(vch, totalVouchers - 1);
                        if (res && typeof (res as any).then === 'function') {
                          await res;
                        }
                      } catch (e) {}
                    }
                  } else if (char === ']' && objectDepth === 0) {
                    state = 'FINISHED';
                    break;
                  } else if (objectDepth > 0) {
                    currentObjectChunks.push(char);
                  }
                } else {
                  currentObjectChunks.push(char);
                  if (isEscaped) {
                    isEscaped = false;
                  } else if (char === '\\') {
                    isEscaped = true;
                  } else if (char === '"') {
                    inString = false;
                  }
                }

                const now = Date.now();
                if (now - lastProgressReportTime > 250) {
                  lastProgressReportTime = now;
                  if (onProgress) {
                    onProgress(totalVouchers, bytesRead, totalBytes);
                  }
                }
              }
            }
          } catch (err) {
            readStream.destroy();
            reject(err);
          } finally {
            readStream.resume();
          }
        });
      });

      readStream.on('end', () => {
        processingChain
          .then(() => resolve())
          .catch((err) => {
            readStream.destroy();
            reject(err);
          });
      });

      readStream.on('error', (err) => {
        reject(err);
      });
    });

    if (onProgress) {
      onProgress(totalVouchers, totalBytes, totalBytes);
    }

    return { totalVouchers };
  }

  /**
   * Synchronous incremental streaming reader for records.json.
   * Reads vouchers one-by-one from disk using a fixed 64KB buffer without loading the entire array into RAM.
   */
  public static iterateVouchersFromRecordsFileSync(
    recordsFilePath: string,
    onVoucher: (voucher: CanonicalVoucher, index: number) => void,
    onProgress?: (processed: number, bytesRead: number, totalBytes: number) => void
  ): { totalVouchers: number } {
    if (!fs.existsSync(recordsFilePath)) {
      throw new Error(`Records file not found at: ${recordsFilePath}`);
    }

    const stats = fs.statSync(recordsFilePath);
    const totalBytes = stats.size;
    let bytesRead = 0;
    let totalVouchers = 0;

    let state: 'SCANNING_FOR_VOUCHERS' | 'IN_VOUCHERS_ARRAY' | 'FINISHED' = 'SCANNING_FOR_VOUCHERS';
    let objectDepth = 0;
    let currentObjectChunks: string[] = [];
    let inString = false;
    let isEscaped = false;

    let scanBuffer = '';
    const MAX_SCAN_BUFFER = 64 * 1024;

    const fd = fs.openSync(recordsFilePath, 'r');
    const buffer = Buffer.alloc(this.CHUNK_SIZE);
    let bytesReadInChunk = 0;

    let lastProgressReportTime = Date.now();

    try {
      while ((bytesReadInChunk = fs.readSync(fd, buffer, 0, this.CHUNK_SIZE, null)) > 0) {
        bytesRead += bytesReadInChunk;
        const text = buffer.toString('utf-8', 0, bytesReadInChunk);

        for (let i = 0; i < text.length; i++) {
          const char = text[i];

          if (state === 'SCANNING_FOR_VOUCHERS') {
            if (scanBuffer.length < MAX_SCAN_BUFFER) {
              scanBuffer += char;
            }
            if (char === '[') {
              if (scanBuffer.includes('"vouchers"') || scanBuffer.includes('vouchers') || scanBuffer.trim().startsWith('[')) {
                state = 'IN_VOUCHERS_ARRAY';
              }
            }
            continue;
          }

          if (state === 'IN_VOUCHERS_ARRAY') {
            if (!inString) {
              if (char === '"') {
                inString = true;
                if (objectDepth > 0) currentObjectChunks.push(char);
              } else if (char === '{') {
                objectDepth++;
                currentObjectChunks.push(char);
              } else if (char === '}') {
                objectDepth--;
                currentObjectChunks.push(char);
                if (objectDepth === 0) {
                  const objStr = currentObjectChunks.join('');
                  currentObjectChunks = [];
                  try {
                    const vch = JSON.parse(objStr);
                    totalVouchers++;
                    onVoucher(vch, totalVouchers - 1);
                  } catch (e) {}
                }
              } else if (char === ']' && objectDepth === 0) {
                state = 'FINISHED';
                break;
              } else if (objectDepth > 0) {
                currentObjectChunks.push(char);
              }
            } else {
              currentObjectChunks.push(char);
              if (isEscaped) {
                isEscaped = false;
              } else if (char === '\\') {
                isEscaped = true;
              } else if (char === '"') {
                inString = false;
              }
            }

            const now = Date.now();
            if (now - lastProgressReportTime > 250) {
              lastProgressReportTime = now;
              if (onProgress) {
                onProgress(totalVouchers, bytesRead, totalBytes);
              }
            }
          }
        }

        if (state === 'FINISHED') {
          break;
        }
      }
    } finally {
      fs.closeSync(fd);
    }

    if (onProgress) {
      onProgress(totalVouchers, totalBytes, totalBytes);
    }

    return { totalVouchers };
  }
}
