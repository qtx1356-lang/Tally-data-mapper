import fs from 'fs';
import path from 'path';

export interface FileHeaderInspection {
  encoding: string;
  hasBOM: boolean;
  firstNonWhitespaceChar: string;
  rootType: 'object' | 'array' | 'other';
  topLevelKeys: string[];
  headerSnippet: string;
}

export interface TallyStructureDiagnostic {
  rootType: 'object' | 'array' | 'other';
  topLevelKeys: string[];
  candidateCollectionNames: string[];
  recordsExamined: number;
  candidateTransactionCount: number;
  detectedVoucherKeys: string[];
  detectedDateField: string | null;
  detectedVoucherNumberField: string | null;
  detectedVoucherTypeField: string | null;
  detectedLedgerEntryField: string | null;
  parserReason: string;
}

/**
 * Normalizes field names for comparison (strips punctuation, whitespace, and lowercases).
 * Example: 'Vch No.' -> 'vchno', 'ALLLEDGERENTRIES.LIST' -> 'allledgerentrieslist'
 */
export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Known patterns for Tally DayBook fields
const DATE_CANDIDATE_KEYS = [
  'date', 'voucherdate', 'vchdate', 'txdate', 'txndate', 'effectivedate', 'dateformatted', 'txndateformatted'
];

const VOUCHER_NUMBER_CANDIDATE_KEYS = [
  'vouchernumber', 'voucherno', 'vchno', 'invoiceno', 'docno', 'reference', 'refno', 
  'number', 'id', 'guid', 'alterid', 'masterid'
];

const VOUCHER_TYPE_CANDIDATE_KEYS = [
  'vouchertype', 'vouchertypename', 'vchtype', 'transactiontype', 'type', 'vchtypename'
];

const PARTY_LEDGER_CANDIDATE_KEYS = [
  'partyledgername', 'partyname', 'party', 'particulars', 'ledgername', 'account', 'customer', 'headofaccount'
];

const LEDGER_ENTRY_COLLECTION_KEYS = [
  'allledgerentries', 'allledgerentrieslist', 'ledgerentries', 'ledgerentrieslist', 'entries', 'lines', 'transactions',
  'allinventoryentries', 'allinventoryentrieslist'
];

const AMOUNT_CANDIDATE_KEYS = [
  'debit', 'debitamount', 'credit', 'creditamount', 'amount', 'netamount', 'total', 'rawamount', 'value'
];

/**
 * Step 2: Inspect only the beginning of the assembled file (first 64 KB).
 * Never loads the entire 126.5 MB file into RAM.
 */
export function inspectFileHeader(filePath: string, maxBytes: number = 65536): FileHeaderInspection {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found for header inspection: ${filePath}`);
  }

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(maxBytes);
  const bytesRead = fs.readSync(fd, buffer, 0, maxBytes, 0);
  fs.closeSync(fd);

  if (bytesRead === 0) {
    return {
      encoding: 'utf-8',
      hasBOM: false,
      firstNonWhitespaceChar: '',
      rootType: 'other',
      topLevelKeys: [],
      headerSnippet: ''
    };
  }

  let slice = buffer.subarray(0, bytesRead);
  let hasBOM = false;
  // Check for UTF-8 BOM EF BB BF
  if (slice.length >= 3 && slice[0] === 0xEF && slice[1] === 0xBB && slice[2] === 0xBF) {
    hasBOM = true;
    slice = slice.subarray(3);
  }

  const text = slice.toString('utf-8');
  let firstChar = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c !== ' ' && c !== '\t' && c !== '\r' && c !== '\n') {
      firstChar = c;
      break;
    }
  }

  let rootType: 'object' | 'array' | 'other' = 'other';
  if (firstChar === '{') {
    rootType = 'object';
  } else if (firstChar === '[') {
    rootType = 'array';
  }

  // Scan top-level keys from the header snippet if it's an object
  const topLevelKeys: string[] = [];
  if (rootType === 'object') {
    // Regex to match top-level keys before major array or deep nesting
    // e.g. "DayBook": or "Company": or "Header":
    const keyRegex = /"([a-zA-Z0-9_$.-]+)"\s*:/g;
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = keyRegex.exec(text)) !== null && count < 30) {
      const k = match[1];
      if (!topLevelKeys.includes(k)) {
        topLevelKeys.push(k);
      }
      count++;
    }
  }

  return {
    encoding: 'utf-8',
    hasBOM,
    firstNonWhitespaceChar: firstChar,
    rootType,
    topLevelKeys,
    headerSnippet: text.substring(0, 1000)
  };
}

/**
 * Step 3 & 8: Detect structure and build diagnostic response if needed.
 * Reads a bounded sample of records (up to 2,000 objects or 10 MB) directly from the stream.
 */
export async function detectStreamStructure(filePath: string): Promise<TallyStructureDiagnostic> {
  const headerInfo = inspectFileHeader(filePath, 65536);

  const candidateCollectionNames: string[] = [];
  const detectedVoucherKeysSet = new Set<string>();
  let recordsExamined = 0;
  let candidateTransactionCount = 0;

  let detectedDateField: string | null = null;
  let detectedVoucherNumberField: string | null = null;
  let detectedVoucherTypeField: string | null = null;
  let detectedLedgerEntryField: string | null = null;

  // Stream up to 8 MB of the file to examine candidate objects
  await new Promise<void>((resolve) => {
    let bytesReadTotal = 0;
    const MAX_SAMPLE_BYTES = 8 * 1024 * 1024; // 8 MB sample limit

    let inString = false;
    let isEscaped = false;
    let objectDepth = 0;
    let currentObjectChars: string[] = [];

    const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

    stream.on('data', (chunk: Buffer) => {
      bytesReadTotal += chunk.length;
      const str = chunk.toString('utf-8');

      for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (inString) {
          if (objectDepth > 0) currentObjectChars.push(char);
          if (isEscaped) {
            isEscaped = false;
          } else if (char === '\\') {
            isEscaped = true;
          } else if (char === '"') {
            inString = false;
          }
          continue;
        }

        if (char === '"') {
          inString = true;
          if (objectDepth > 0) currentObjectChars.push(char);
          continue;
        }

        if (char === '{') {
          objectDepth++;
          if (objectDepth === 1) {
            currentObjectChars = ['{'];
          } else {
            currentObjectChars.push('{');
          }
          continue;
        }

        if (char === '}') {
          if (objectDepth > 0) {
            currentObjectChars.push('}');
            objectDepth--;

            if (objectDepth === 0) {
              recordsExamined++;
              const objStr = currentObjectChars.join('');
              currentObjectChars = [];

              try {
                const parsed = JSON.parse(objStr);
                inspectObjectForVouchers(parsed);
              } catch (_) {
                // Ignore parsing errors of partial inner structures
              }

              if (recordsExamined >= 2000) {
                stream.destroy();
                resolve();
                return;
              }
            }
          }
          continue;
        }

        if (objectDepth > 0) {
          currentObjectChars.push(char);
        }
      }

      if (bytesReadTotal >= MAX_SAMPLE_BYTES) {
        stream.destroy();
        resolve();
      }
    });

    stream.on('end', () => resolve());
    stream.on('error', () => resolve());
    stream.on('close', () => resolve());
  });

  function inspectObjectForVouchers(obj: any) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;

    // Check candidate collection keys inside this object
    for (const key of Object.keys(obj)) {
      const normKey = normalizeKey(key);
      if (['daybook', 'vouchers', 'voucher', 'transactions', 'tallymessage', 'data', 'records', 'items'].includes(normKey)) {
        if (!candidateCollectionNames.includes(key)) {
          candidateCollectionNames.push(key);
        }
      }
    }

    // Check for nested VOUCHER / DayBook / TALLYMESSAGE wrappers
    let target = obj;
    if (target.VOUCHER && typeof target.VOUCHER === 'object' && !Array.isArray(target.VOUCHER)) {
      target = target.VOUCHER;
    } else if (target.voucher && typeof target.voucher === 'object' && !Array.isArray(target.voucher)) {
      target = target.voucher;
    } else if (target.TALLYMESSAGE && typeof target.TALLYMESSAGE === 'object' && !Array.isArray(target.TALLYMESSAGE)) {
      if (target.TALLYMESSAGE.VOUCHER && typeof target.TALLYMESSAGE.VOUCHER === 'object') {
        target = target.TALLYMESSAGE.VOUCHER;
      }
    }

    const keys = Object.keys(target);
    for (const k of keys) {
      if (detectedVoucherKeysSet.size < 40) {
        detectedVoucherKeysSet.add(k);
      }
      const nk = normalizeKey(k);

      if (!detectedDateField && DATE_CANDIDATE_KEYS.includes(nk)) {
        detectedDateField = k;
      }
      if (!detectedVoucherNumberField && VOUCHER_NUMBER_CANDIDATE_KEYS.includes(nk)) {
        detectedVoucherNumberField = k;
      }
      if (!detectedVoucherTypeField && VOUCHER_TYPE_CANDIDATE_KEYS.includes(nk)) {
        detectedVoucherTypeField = k;
      }
      if (!detectedLedgerEntryField && LEDGER_ENTRY_COLLECTION_KEYS.includes(nk)) {
        detectedLedgerEntryField = k;
      }
    }

    // Determine if candidate transaction
    const hasDate = Boolean(detectedDateField && target[detectedDateField] !== undefined);
    const hasVchNo = Boolean(detectedVoucherNumberField && target[detectedVoucherNumberField] !== undefined);
    const hasVchType = Boolean(detectedVoucherTypeField && target[detectedVoucherTypeField] !== undefined);
    const hasEntries = Boolean(detectedLedgerEntryField && target[detectedLedgerEntryField] !== undefined);
    const hasAmounts = keys.some(k => AMOUNT_CANDIDATE_KEYS.includes(normalizeKey(k)));

    if (hasDate || hasVchNo || hasVchType || hasEntries || hasAmounts) {
      candidateTransactionCount++;
    }
  }

  // Populate candidate collection names from header top level keys if not already populated
  for (const k of headerInfo.topLevelKeys) {
    const nk = normalizeKey(k);
    if (['daybook', 'vouchers', 'voucher', 'transactions', 'tallymessage', 'data', 'records'].includes(nk)) {
      if (!candidateCollectionNames.includes(k)) {
        candidateCollectionNames.push(k);
      }
    }
  }

  let parserReason = '';
  if (recordsExamined === 0) {
    parserReason = `Root ${headerInfo.rootType} detected with keys [${headerInfo.topLevelKeys.join(', ')}], but no valid child objects were found in the stream sample.`;
  } else if (candidateTransactionCount === 0) {
    parserReason = `Examined ${recordsExamined.toLocaleString()} records across collections [${candidateCollectionNames.join(', ')} || root], but none contained recognized voucher fields (Date, VoucherNumber, VoucherType, or LedgerEntries).`;
  } else {
    parserReason = `Detected ${candidateTransactionCount.toLocaleString()} candidate transactions among ${recordsExamined.toLocaleString()} inspected records with date field '${detectedDateField || 'none'}', voucher type field '${detectedVoucherTypeField || 'none'}', and voucher number field '${detectedVoucherNumberField || 'none'}'.`;
  }

  return {
    rootType: headerInfo.rootType,
    topLevelKeys: headerInfo.topLevelKeys,
    candidateCollectionNames,
    recordsExamined,
    candidateTransactionCount,
    detectedVoucherKeys: Array.from(detectedVoucherKeysSet),
    detectedDateField,
    detectedVoucherNumberField,
    detectedVoucherTypeField,
    detectedLedgerEntryField,
    parserReason
  };
}
