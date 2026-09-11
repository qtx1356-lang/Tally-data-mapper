/**
 * EXFIN Tally Data Mapper - Offline Data Import Engine (Production Hardened)
 * 
 * Production-ready parser, normalizer, and desktop-persistent storage for Tally data (XML, JSON, Excel).
 * - Full offline operation without requiring TallyPrime to be running.
 * - Disk-persistent storage for Electron / Windows desktop environments.
 * - Zero fabricated accounting data (nulls & REVIEW_REQUIRED flags for missing source fields).
 * - Multi-method Financial Year detection without default fabrication.
 * - Comprehensive column-semantic worksheet classifier for Excel.
 * - Complete source traceability (file, sheet, row, column, XML/JSON path).
 * - Professional, non-defamatory audit intelligence risk terminology.
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { 
  ImportFileFormat, 
  FieldMappingItem, 
  FieldMappingConfidence, 
  FieldMappingStatus, 
  CanonicalEntityName, 
  ImportedDatasetSummary, 
  DataQualityReport, 
  CanonicalDatasetRecord, 
  RawParsedPreview,
  CanonicalVoucher,
  CanonicalVoucherLine,
  CanonicalAuditException,
  SourceTraceability
} from '../types/offlineDataImport';
import { OfflineDatasetStorage } from './offlineDatasetStorage';

export class OfflineDataImportEngine {
  private storage: OfflineDatasetStorage;

  constructor(customStorageDir?: string) {
    this.storage = new OfflineDatasetStorage(customStorageDir);
    this.ensureDefaultSampleIfEmpty();
  }

  // =========================================================================
  // 1. DATASET PERSISTENCE MANAGEMENT
  // =========================================================================

  public getAllDatasets(): ImportedDatasetSummary[] {
    return this.storage.listDatasets();
  }

  public getDatasetById(id: string): CanonicalDatasetRecord | null {
    return this.storage.getDataset(id);
  }

  public getActiveDataset(): CanonicalDatasetRecord | null {
    return this.storage.getActiveDataset();
  }

  public setActiveDataset(id: string): boolean {
    return this.storage.setActiveDatasetId(id);
  }

  public deleteDataset(id: string): boolean {
    return this.storage.deleteDataset(id);
  }

  // =========================================================================
  // 2. DISK-BASED STREAMING & LARGE FILE PROCESSING
  // =========================================================================

  /**
   * Parse a file directly from a local disk path without loading huge base64 payloads into HTTP request memory.
   */
  public parseFileFromDisk(filePath: string, fileType: ImportFileFormat, originalFileName: string): { preview: RawParsedPreview; rawRecords: any } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Uploaded file not found on disk at: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const fileName = originalFileName || path.basename(filePath);

    if (fileType === 'XML') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parseXmlData(content, fileName);
    } else if (fileType === 'JSON') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parseJsonData(content, fileName, stats.size);
    } else if (fileType === 'EXCEL') {
      const buffer = fs.readFileSync(filePath);
      return this.parseExcelBuffer(buffer, fileName);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  // =========================================================================
  // 2. PARSERS (XML, JSON, EXCEL) WITH ZERO FABRICATED DATA
  // =========================================================================

  /**
   * Helper: Parse Tally Date format (YYYYMMDD, YYYY-MM-DD, DD-MM-YYYY)
   */
  private parseTallyDate(raw: string | undefined | null): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // YYYYMMDD
    if (/^\d{8}$/.test(trimmed)) {
      const y = trimmed.substring(0, 4);
      const m = trimmed.substring(4, 6);
      const d = trimmed.substring(6, 8);
      const iso = `${y}-${m}-${d}`;
      if (!isNaN(new Date(iso).getTime())) return iso;
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      if (!isNaN(new Date(trimmed).getTime())) return trimmed;
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const iso = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      if (!isNaN(new Date(iso).getTime())) return iso;
    }

    // Direct Date parse check
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return null;
  }

  /**
   * Parse Raw XML String into structured entities with strict source extraction
   */
  public parseXmlData(xmlString: string, fileName: string): { preview: RawParsedPreview; rawRecords: any } {
    if (!xmlString || typeof xmlString !== 'string' || xmlString.trim().length === 0) {
      throw new Error('XML file content is empty or invalid.');
    }

    const ledgers: any[] = [];
    const groups: any[] = [];
    const vouchers: any[] = [];
    const stockItems: any[] = [];
    
    let detectedCompany: string | null = null;
    let detectedFyFrom: string | null = null;
    let detectedFyTo: string | null = null;
    let isFyDetected = false;
    let fyDetectionSource = 'Not Detected';

    // 1. Detect Company Name from XML
    const companyMatch = xmlString.match(/<CURRENTCOMPANY>([^<]+)<\/CURRENTCOMPANY>/i) ||
                         xmlString.match(/<COMPANYNAME>([^<]+)<\/COMPANYNAME>/i) ||
                         xmlString.match(/<COMPANY\b[^>]*NAME="([^"]+)"/i) ||
                         xmlString.match(/<SVCURRENTCOMPANY>([^<]+)<\/SVCURRENTCOMPANY>/i) ||
                         xmlString.match(/<BASICCOMPANYFORMALNAME>([^<]+)<\/BASICCOMPANYFORMALNAME>/i);
    if (companyMatch) {
      detectedCompany = companyMatch[1].trim();
    }

    // 2. Detect Financial Year from XML company definition or explicit tags
    const startingFromMatch = xmlString.match(/<STARTINGFROM>([^<]+)<\/STARTINGFROM>/i);
    const endingAtMatch = xmlString.match(/<ENDINGAT>([^<]+)<\/ENDINGAT>/i);
    const fyMatch = xmlString.match(/<FINANCIALYEAR>([^<]+)<\/FINANCIALYEAR>/i);

    if (startingFromMatch && endingAtMatch) {
      const fromParsed = this.parseTallyDate(startingFromMatch[1]);
      const toParsed = this.parseTallyDate(endingAtMatch[1]);
      if (fromParsed && toParsed) {
        detectedFyFrom = fromParsed;
        detectedFyTo = toParsed;
        isFyDetected = true;
        fyDetectionSource = 'XML Company Master (<STARTINGFROM>/<ENDINGAT>)';
      }
    } else if (fyMatch) {
      const parts = fyMatch[1].split(/[-–to]/i).map(s => s.trim());
      if (parts.length === 2) {
        const p1 = this.parseTallyDate(parts[0]);
        const p2 = this.parseTallyDate(parts[1]);
        if (p1 && p2) {
          detectedFyFrom = p1;
          detectedFyTo = p2;
          isFyDetected = true;
          fyDetectionSource = 'XML <FINANCIALYEAR> tag';
        }
      }
    }

    // 3. Extract Ledgers
    const ledgerRegex = /<LEDGER\b([^>]*)>([\s\S]*?)<\/LEDGER>/gi;
    let match: RegExpExecArray | null;
    let lIndex = 0;
    while ((match = ledgerRegex.exec(xmlString)) !== null) {
      lIndex++;
      const ledgerContent = match[2];
      const nameAttr = match[1].match(/NAME="([^"]+)"/i);
      const nameTag = ledgerContent.match(/<NAME>([^<]+)<\/NAME>/i) || ledgerContent.match(/<LANGUAGENAME\.LIST>[\s\S]*?<NAME\.LIST>[\s\S]*?<NAME>([^<]+)<\/NAME>/i);
      const name = nameAttr ? nameAttr[1].trim() : (nameTag ? nameTag[1].trim() : null);
      
      const parentMatch = ledgerContent.match(/<PARENT>([^<]+)<\/PARENT>/i);
      const openingBalanceMatch = ledgerContent.match(/<OPENINGBALANCE>([^<]+)<\/OPENINGBALANCE>/i);
      const closingBalanceMatch = ledgerContent.match(/<CLOSINGBALANCE>([^<]+)<\/CLOSINGBALANCE>/i);
      const gstinMatch = ledgerContent.match(/<PARTYGSTIN>([^<]+)<\/PARTYGSTIN>/i) || ledgerContent.match(/<GSTIN>([^<]+)<\/GSTIN>/i);
      const stateMatch = ledgerContent.match(/<LEDSTATENAME>([^<]+)<\/LEDSTATENAME>/i);

      const opBal = openingBalanceMatch ? parseFloat(openingBalanceMatch[1]) : null;
      const clBal = closingBalanceMatch ? parseFloat(closingBalanceMatch[1]) : null;

      ledgers.push({
        name,
        parent: parentMatch ? parentMatch[1].trim() : null,
        openingBalance: isNaN(opBal as number) ? null : opBal,
        closingBalance: isNaN(clBal as number) ? null : clBal,
        gstin: gstinMatch ? gstinMatch[1].trim() : null,
        state: stateMatch ? stateMatch[1].trim() : null,
        reviewRequired: !name || !parentMatch,
        traceability: {
          sourceFileType: 'XML' as ImportFileFormat,
          sourceFile: fileName,
          sourcePath: `TALLYMESSAGE/LEDGER[${lIndex}]`,
          sourceField: name || `LEDGER[${lIndex}]`
        }
      });
    }

    // 4. Extract Groups
    const groupRegex = /<GROUP\b([^>]*)>([\s\S]*?)<\/GROUP>/gi;
    let gIndex = 0;
    while ((match = groupRegex.exec(xmlString)) !== null) {
      gIndex++;
      const content = match[2];
      const nameAttr = match[1].match(/NAME="([^"]+)"/i);
      const nameTag = content.match(/<NAME>([^<]+)<\/NAME>/i);
      const name = nameAttr ? nameAttr[1].trim() : (nameTag ? nameTag[1].trim() : null);
      const parentMatch = content.match(/<PARENT>([^<]+)<\/PARENT>/i);
      const isSubLedger = /<ISSUBLEDGER>Yes<\/ISSUBLEDGER>/i.test(content);

      groups.push({
        name,
        parent: parentMatch ? parentMatch[1].trim() : null,
        isSubLedger,
        traceability: {
          sourceFileType: 'XML' as ImportFileFormat,
          sourceFile: fileName,
          sourcePath: `TALLYMESSAGE/GROUP[${gIndex}]`,
          sourceField: name || `GROUP[${gIndex}]`
        }
      });
    }

    // 5. Extract Vouchers
    const voucherRegex = /<VOUCHER\b([^>]*)>([\s\S]*?)<\/VOUCHER>/gi;
    let vCount = 0;
    const extractedDates: string[] = [];

    while ((match = voucherRegex.exec(xmlString)) !== null) {
      vCount++;
      const vchAttrs = match[1];
      const content = match[2];

      const vchTypeAttr = vchAttrs.match(/VCHTYPE="([^"]+)"/i);
      const dateMatch = content.match(/<DATE>([^<]+)<\/DATE>/i);
      const vNumMatch = content.match(/<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/i);
      const vTypeMatch = content.match(/<VOUCHERTYPENAME>([^<]+)<\/VOUCHERTYPENAME>/i);
      const partyMatch = content.match(/<PARTYLEDGERNAME>([^<]+)<\/PARTYLEDGERNAME>/i) || content.match(/<PARTYNAME>([^<]+)<\/PARTYNAME>/i);
      const narrationMatch = content.match(/<NARRATION>([^<]+)<\/NARRATION>/i);
      const guidMatch = content.match(/<GUID>([^<]+)<\/GUID>/i);

      const parsedDate = this.parseTallyDate(dateMatch ? dateMatch[1] : null);
      if (parsedDate) {
        extractedDates.push(parsedDate);
      }

      // Extract Ledger Entries inside Voucher with strict ISDEEMEDPOSITIVE handling
      const entries: CanonicalVoucherLine[] = [];
      const entryRegex = /<ALLLEDGERENTRIES\.LIST>([\s\S]*?)<\/ALLLEDGERENTRIES\.LIST>|<LEDGERENTRIES\.LIST>([\s\S]*?)<\/LEDGERENTRIES\.LIST>/gi;
      let entryMatch: RegExpExecArray | null;
      let lineIdx = 0;

      let totalDebit = 0;
      let totalCredit = 0;

      while ((entryMatch = entryRegex.exec(content)) !== null) {
        lineIdx++;
        const entryContent = entryMatch[1] || entryMatch[2];
        const lNameMatch = entryContent.match(/<LEDGERNAME>([^<]+)<\/LEDGERNAME>/i);
        const amtMatch = entryContent.match(/<AMOUNT>([^<]+)<\/AMOUNT>/i);
        const isDeemedPositiveMatch = entryContent.match(/<ISDEEMEDPOSITIVE>([^<]+)<\/ISDEEMEDPOSITIVE>/i);

        let parsedAmt: number | null = null;
        let rawAmt: number | null = null;
        if (amtMatch) {
          const rawNum = parseFloat(amtMatch[1]);
          if (!isNaN(rawNum)) {
            rawAmt = rawNum;
            parsedAmt = Math.abs(rawNum);
          }
        }

        // Tally ISDEEMEDPOSITIVE: Yes = Debit, No = Credit. If not present, negative amount in Tally denotes Debit
        let isDebit: boolean | null = null;
        let isDeemedPositive: boolean | null = null;
        if (isDeemedPositiveMatch) {
          isDeemedPositive = isDeemedPositiveMatch[1].trim().toLowerCase() === 'yes';
          isDebit = isDeemedPositive;
        } else if (rawAmt !== null) {
          isDebit = rawAmt < 0;
        }

        if (parsedAmt !== null && isDebit !== null) {
          if (isDebit) totalDebit += parsedAmt;
          else totalCredit += parsedAmt;
        }

        entries.push({
          id: `line-${vCount}-${lineIdx}`,
          ledgerName: lNameMatch ? lNameMatch[1].trim() : null,
          amount: parsedAmt,
          isDebit,
          isDeemedPositive,
          rawAmount: rawAmt,
          reviewRequired: !lNameMatch || parsedAmt === null,
          reviewReason: !lNameMatch ? 'Missing ledger name in entry' : (parsedAmt === null ? 'Invalid or missing line amount' : undefined),
          traceability: {
            sourceFileType: 'XML' as ImportFileFormat,
            sourceFile: fileName,
            sourcePath: `TALLYMESSAGE/VOUCHER[${vCount}]/ALLLEDGERENTRIES.LIST[${lineIdx}]`,
            sourceField: lNameMatch ? lNameMatch[1].trim() : `LINE[${lineIdx}]`
          }
        });
      }

      // Calculate Voucher Amount & Balance Difference
      const diff = Math.abs(totalDebit - totalCredit);
      const isBalanced = entries.length >= 2 && diff <= 0.05 && totalDebit > 0;
      const vchAmount = totalDebit > 0 ? totalDebit : (totalCredit > 0 ? totalCredit : null);

      const vType = vTypeMatch ? vTypeMatch[1].trim() : (vchTypeAttr ? vchTypeAttr[1].trim() : null);
      const partyLedger = partyMatch ? partyMatch[1].trim() : (entries[0]?.ledgerName || null);

      const reviewReasons: string[] = [];
      if (!parsedDate) reviewReasons.push('Missing or unparseable voucher date');
      if (!vNumMatch) reviewReasons.push('Missing voucher reference number');
      if (!isBalanced && entries.length > 0) reviewReasons.push(`Debit/Credit imbalance: difference of ₹${diff.toFixed(2)}`);
      if (entries.length === 0) reviewReasons.push('No ledger entries present in voucher record');

      vouchers.push({
        id: guidMatch ? guidMatch[1].trim() : `XML-VOUCH-${vCount}`,
        voucherNumber: vNumMatch ? vNumMatch[1].trim() : null,
        voucherType: vType,
        date: parsedDate,
        partyLedger,
        amount: vchAmount,
        totalDebit,
        totalCredit,
        difference: diff,
        isBalanced,
        narration: narrationMatch ? narrationMatch[1].trim() : null,
        entries,
        reviewRequired: reviewReasons.length > 0,
        reviewReasons,
        sourceFile: fileName,
        traceability: {
          sourceFileType: 'XML' as ImportFileFormat,
          sourceFile: fileName,
          sourcePath: `TALLYMESSAGE/VOUCHER[${vCount}]`,
          sourceField: vNumMatch ? vNumMatch[1].trim() : `VOUCHER[${vCount}]`
        }
      });
    }

    // 6. Extract Stock Items
    const stockRegex = /<STOCKITEM\b([^>]*)>([\s\S]*?)<\/STOCKITEM>/gi;
    let sIndex = 0;
    while ((match = stockRegex.exec(xmlString)) !== null) {
      sIndex++;
      const content = match[2];
      const nameMatch = content.match(/<NAME>([^<]+)<\/NAME>/i) || match[1].match(/NAME="([^"]+)"/i);
      const parentMatch = content.match(/<PARENT>([^<]+)<\/PARENT>/i);
      const closingQtyMatch = content.match(/<CLOSINGBALANCE>([^<]+)<\/CLOSINGBALANCE>/i);
      const rateMatch = content.match(/<CLOSINGRATE>([^<]+)<\/CLOSINGRATE>/i);

      stockItems.push({
        name: nameMatch ? nameMatch[1].trim() : null,
        parent: parentMatch ? parentMatch[1].trim() : null,
        closingBalance: closingQtyMatch ? closingQtyMatch[1].trim() : null,
        closingRate: rateMatch ? rateMatch[1].trim() : null,
        reviewRequired: !nameMatch,
        traceability: {
          sourceFileType: 'XML' as ImportFileFormat,
          sourceFile: fileName,
          sourcePath: `TALLYMESSAGE/STOCKITEM[${sIndex}]`,
          sourceField: nameMatch ? nameMatch[1].trim() : `STOCKITEM[${sIndex}]`
        }
      });
    }

    // 7. If Financial Year was not explicitly in header, infer from voucher dates
    if (!isFyDetected && extractedDates.length > 0) {
      extractedDates.sort();
      const minDate = extractedDates[0];
      const maxDate = extractedDates[extractedDates.length - 1];
      const minYear = parseInt(minDate.substring(0, 4));
      const minMonth = parseInt(minDate.substring(5, 7));

      // Indian Financial Year boundary: Apr 1 - Mar 31
      let startYear = minMonth >= 4 ? minYear : minYear - 1;
      detectedFyFrom = `${startYear}-04-01`;
      detectedFyTo = `${startYear + 1}-03-31`;
      isFyDetected = true;
      fyDetectionSource = `Inferred from voucher date range (${minDate} → ${maxDate})`;
    }

    const preview: RawParsedPreview = {
      fileType: 'XML',
      fileName,
      fileSize: xmlString.length,
      detectedCompany,
      detectedFinancialYear: {
        from: detectedFyFrom,
        to: detectedFyTo,
        isDetected: isFyDetected,
        detectionSource: fyDetectionSource
      },
      rawSampleData: {
        vouchers: vouchers.slice(0, 10),
        ledgers: ledgers.slice(0, 10),
        groups: groups.slice(0, 10),
        stockItems: stockItems.slice(0, 10)
      },
      detectedEntities: [
        {
          name: 'Voucher Records',
          count: vouchers.length,
          fields: ['voucherNumber', 'voucherType', 'date', 'partyLedger', 'amount', 'totalDebit', 'totalCredit', 'narration', 'entries'],
          sample: vouchers.slice(0, 5),
          classifiedAs: 'Voucher'
        },
        {
          name: 'Ledger Masters',
          count: ledgers.length,
          fields: ['name', 'parent', 'openingBalance', 'closingBalance', 'gstin', 'state'],
          sample: ledgers.slice(0, 5),
          classifiedAs: 'Ledger'
        },
        {
          name: 'Group Masters',
          count: groups.length,
          fields: ['name', 'parent', 'isSubLedger'],
          sample: groups.slice(0, 5),
          classifiedAs: 'Group'
        },
        {
          name: 'Stock Items',
          count: stockItems.length,
          fields: ['name', 'parent', 'closingBalance', 'closingRate'],
          sample: stockItems.slice(0, 5),
          classifiedAs: 'StockItem'
        }
      ]
    };

    return {
      preview,
      rawRecords: {
        ledgers,
        groups,
        vouchers,
        stockItems,
        company: detectedCompany,
        fyFrom: detectedFyFrom,
        fyTo: detectedFyTo,
        isFyDetected,
        fyDetectionSource
      }
    };
  }

  /**
   * Parse JSON Data with non-fabricated extraction and deep path traceability
   */
  public parseJsonData(jsonInput: string | any, fileName: string, explicitFileSize?: number): { preview: RawParsedPreview; rawRecords: any } {
    if (!jsonInput) {
      throw new Error('JSON content is empty or invalid.');
    }

    let parsed: any;
    let rawLength = typeof jsonInput === 'string' ? jsonInput.length : (explicitFileSize || 0);

    if (typeof jsonInput === 'string') {
      if (jsonInput.trim().length === 0) {
        throw new Error('JSON content is empty or invalid.');
      }
      try {
        parsed = JSON.parse(jsonInput);
      } catch (e: any) {
        throw new Error(`Invalid JSON syntax: ${e.message}`);
      }
    } else {
      parsed = jsonInput;
    }

    let ledgers: any[] = [];
    let groups: any[] = [];
    let vouchers: any[] = [];
    let stockItems: any[] = [];
    
    let detectedCompany: string | null = null;
    let detectedFyFrom: string | null = null;
    let detectedFyTo: string | null = null;
    let isFyDetected = false;
    let fyDetectionSource = 'Not Detected';

    const extractedDates: string[] = [];

    // Helper to extract vouchers from array of raw objects
    const extractVouchersFromArray = (arr: any[], basePath: string) => {
      return arr.map((item, idx) => {
        const rawDate = item.date || item.DATE || item.voucherDate || item.txDate || item.Date || item.VoucherDate || null;
        const parsedDate = this.parseTallyDate(rawDate);
        if (parsedDate) extractedDates.push(parsedDate);

        const rawAmt = item.amount !== undefined ? item.amount : 
                       (item.AMOUNT !== undefined ? item.AMOUNT : 
                       (item.total !== undefined ? item.total : 
                       (item.netAmount !== undefined ? item.netAmount : 
                       (item.Total !== undefined ? item.Total : item.Amount))));
        const numAmt = typeof rawAmt === 'number' ? Math.abs(rawAmt) : (rawAmt ? Math.abs(parseFloat(rawAmt)) : null);
        const validAmt = isNaN(numAmt as number) ? null : numAmt;

        const rawEntries = item.entries || item.ALLLEDGERENTRIES || item.lines || item.ledgerEntries || item.LEDGERENTRIES || item.Entries || [];
        const entries: CanonicalVoucherLine[] = [];
        let totalDebit = 0;
        let totalCredit = 0;

        if (Array.isArray(rawEntries) && rawEntries.length > 0) {
          rawEntries.forEach((e: any, lIdx: number) => {
            const lName = e.ledgerName || e.LEDGERNAME || e.name || e.account || e.LedgerName || e.Party || null;
            const eAmtRaw = e.amount !== undefined ? e.amount : (e.AMOUNT !== undefined ? e.AMOUNT : e.Amount);
            const eAmtNum = typeof eAmtRaw === 'number' ? Math.abs(eAmtRaw) : (eAmtRaw ? Math.abs(parseFloat(eAmtRaw)) : null);
            const isDebit = e.isDebit !== undefined ? Boolean(e.isDebit) : 
                           (e.type === 'Debit' || e.type === 'Dr' || e.type === 'DR' || (typeof eAmtRaw === 'number' && eAmtRaw < 0));
            
            if (eAmtNum !== null) {
              if (isDebit) totalDebit += eAmtNum;
              else totalCredit += eAmtNum;
            }

            entries.push({
              id: `line-json-${idx + 1}-${lIdx + 1}`,
              ledgerName: lName,
              amount: eAmtNum,
              isDebit,
              rawAmount: eAmtRaw,
              reviewRequired: !lName || eAmtNum === null,
              traceability: {
                sourceFileType: 'JSON' as ImportFileFormat,
                sourceFile: fileName,
                jsonPath: `${basePath}[${idx}].entries[${lIdx}]`,
                sourceField: lName || `line[${lIdx}]`
              }
            });
          });
        } else if (validAmt !== null) {
          // Single entry from flat row (preserve faithfully without creating fake counter entries)
          const singleParty = item.partyLedger || item.PARTYLEDGERNAME || item.party || item.customerName || item.Particulars || item.particulars || null;
          entries.push({
            id: `line-json-${idx + 1}-1`,
            ledgerName: singleParty,
            amount: validAmt,
            isDebit: true,
            reviewRequired: !singleParty,
            traceability: {
              sourceFileType: 'JSON' as ImportFileFormat,
              sourceFile: fileName,
              jsonPath: `${basePath}[${idx}]`,
              sourceField: singleParty || 'amount'
            }
          });
          totalDebit = validAmt;
        }

        const diff = Math.abs(totalDebit - totalCredit);
        const isBalanced = entries.length >= 2 && diff <= 0.05 && totalDebit > 0;

        const vNum = item.voucherNumber || item.VOUCHERNUMBER || item.invoiceNo || item.VoucherNumber || item.VchNo || item.billNo || null;
        const vType = item.voucherType || item.VOUCHERTYPENAME || item.type || item.VoucherType || item.VchType || null;
        const partyLedger = item.partyLedger || item.PARTYLEDGERNAME || item.party || item.customerName || item.Particulars || (entries[0]?.ledgerName || null);

        const reviewReasons: string[] = [];
        if (!parsedDate) reviewReasons.push('Missing or unparseable voucher date');
        if (!vNum) reviewReasons.push('Missing voucher reference number');
        if (validAmt === null) reviewReasons.push('Missing or non-numeric amount in source record');
        if (!isBalanced && entries.length > 0) reviewReasons.push(`Debit/Credit imbalance: difference of ₹${diff.toFixed(2)}`);

        return {
          id: item.id || item.guid || `JSON-V-${idx + 1}`,
          voucherNumber: vNum,
          voucherType: vType,
          date: parsedDate,
          partyLedger,
          amount: validAmt,
          totalDebit,
          totalCredit,
          difference: diff,
          isBalanced,
          narration: item.narration || item.NARRATION || item.remarks || item.Narration || null,
          entries,
          reviewRequired: reviewReasons.length > 0,
          reviewReasons,
          sourceFile: fileName,
          traceability: {
            sourceFileType: 'JSON' as ImportFileFormat,
            sourceFile: fileName,
            jsonPath: `${basePath}[${idx}]`,
            sourceField: String(vNum || `voucher[${idx}]`)
          }
        };
      });
    };

    if (Array.isArray(parsed)) {
      // Analyze array elements
      const first = parsed[0] || {};
      const isVoucherCandidate = first.voucherNumber !== undefined || first.VOUCHERNUMBER !== undefined || first.VchNo !== undefined ||
                                 first.voucherType !== undefined || first.VOUCHERTYPENAME !== undefined || first.VchType !== undefined ||
                                 first.date !== undefined || first.DATE !== undefined || first.Date !== undefined ||
                                 first.amount !== undefined || first.AMOUNT !== undefined || first.Amount !== undefined || first.Particulars !== undefined;

      if (isVoucherCandidate) {
        vouchers = extractVouchersFromArray(parsed, '$');
      } else {
        // Array of Ledgers
        ledgers = parsed.map((item, idx) => {
          const name = item.name || item.ledgerName || item.LEDGERNAME || item.LedgerName || null;
          const parent = item.parent || item.PARENT || item.group || item.Parent || item.Group || null;
          const opRaw = item.openingBalance !== undefined ? parseFloat(item.openingBalance) : null;
          const clRaw = item.closingBalance !== undefined ? parseFloat(item.closingBalance) : null;

          return {
            name,
            parent,
            openingBalance: isNaN(opRaw as number) ? null : opRaw,
            closingBalance: isNaN(clRaw as number) ? null : clRaw,
            gstin: item.gstin || item.GSTIN || null,
            state: item.state || item.STATE || null,
            reviewRequired: !name || !parent,
            traceability: {
              sourceFileType: 'JSON' as ImportFileFormat,
              sourceFile: fileName,
              jsonPath: `$[${idx}]`,
              sourceField: name || `ledger[${idx}]`
            }
          };
        });
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.company || parsed.companyName || parsed.COMPANYNAME || parsed.CompanyName) {
        detectedCompany = String(parsed.company || parsed.companyName || parsed.COMPANYNAME || parsed.CompanyName).trim();
      }

      if (parsed.financialYear && typeof parsed.financialYear === 'object') {
        const from = this.parseTallyDate(parsed.financialYear.from || parsed.financialYear.startDate || parsed.financialYear.From);
        const to = this.parseTallyDate(parsed.financialYear.to || parsed.financialYear.endDate || parsed.financialYear.To);
        if (from && to) {
          detectedFyFrom = from;
          detectedFyTo = to;
          isFyDetected = true;
          fyDetectionSource = 'JSON Schema Object (financialYear)';
        }
      }

      // Check for DayBook / daybook array or object
      const rawDaybook = parsed.DayBook || parsed.daybook || parsed.DAYBOOK || parsed.Daybook;
      if (Array.isArray(rawDaybook)) {
        vouchers = extractVouchersFromArray(rawDaybook, '$.DayBook');
      }

      // Check for vouchers array
      const rawVouchers = parsed.vouchers || parsed.Vouchers || parsed.VOUCHERS || parsed.transactions || parsed.Transactions || parsed.data;
      if (vouchers.length === 0 && Array.isArray(rawVouchers)) {
        vouchers = extractVouchersFromArray(rawVouchers, '$.vouchers');
      }

      // Check for Tally envelope structure: ENVELOPE.BODY.DATA.TALLYMESSAGE
      const tallyMsg = parsed.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE || parsed.ENVELOPE?.BODY?.TALLYMESSAGE || parsed.TALLYMESSAGE;
      if (tallyMsg && typeof tallyMsg === 'object') {
        if (Array.isArray(tallyMsg.VOUCHER)) {
          vouchers = extractVouchersFromArray(tallyMsg.VOUCHER, '$.ENVELOPE.BODY.TALLYMESSAGE.VOUCHER');
        } else if (tallyMsg.VOUCHER && typeof tallyMsg.VOUCHER === 'object') {
          vouchers = extractVouchersFromArray([tallyMsg.VOUCHER], '$.ENVELOPE.BODY.TALLYMESSAGE.VOUCHER');
        }

        if (Array.isArray(tallyMsg.LEDGER)) {
          ledgers = tallyMsg.LEDGER.map((l: any, idx: number) => ({
            name: l.NAME || l.name || null,
            parent: l.PARENT || l.parent || null,
            openingBalance: l.OPENINGBALANCE !== undefined ? parseFloat(l.OPENINGBALANCE) : null,
            closingBalance: l.CLOSINGBALANCE !== undefined ? parseFloat(l.CLOSINGBALANCE) : null,
            gstin: l.PARTYGSTIN || l.GSTIN || null,
            state: l.LEDSTATENAME || null,
            reviewRequired: !l.NAME,
            traceability: {
              sourceFileType: 'JSON' as ImportFileFormat,
              sourceFile: fileName,
              jsonPath: `$.ENVELOPE.BODY.TALLYMESSAGE.LEDGER[${idx}]`,
              sourceField: l.NAME || `ledger[${idx}]`
            }
          }));
        }
      }

      // Ledgers
      const rawLedgers = parsed.ledgers || parsed.Ledgers || parsed.LEDGERS || parsed.masters?.ledgers;
      if (ledgers.length === 0 && Array.isArray(rawLedgers)) {
        ledgers = rawLedgers.map((l: any, idx: number) => {
          const op = l.openingBalance !== undefined ? parseFloat(l.openingBalance) : null;
          const cl = l.closingBalance !== undefined ? parseFloat(l.closingBalance) : null;
          return {
            name: l.name || l.ledgerName || l.LedgerName || null,
            parent: l.parent || l.group || l.Parent || l.Group || null,
            openingBalance: isNaN(op as number) ? null : op,
            closingBalance: isNaN(cl as number) ? null : cl,
            gstin: l.gstin || l.GSTIN || null,
            state: l.state || l.STATE || null,
            reviewRequired: !l.name || !l.parent,
            traceability: {
              sourceFileType: 'JSON' as ImportFileFormat,
              sourceFile: fileName,
              jsonPath: `$.ledgers[${idx}]`,
              sourceField: l.name || `ledger[${idx}]`
            }
          };
        });
      }

      // Groups
      const rawGroups = parsed.groups || parsed.Groups || parsed.GROUPS;
      if (Array.isArray(rawGroups)) {
        groups = rawGroups.map((g: any, idx: number) => ({
          name: g.name || g.groupName || g.GroupName || null,
          parent: g.parent || g.parentGroup || g.Parent || null,
          isSubLedger: Boolean(g.isSubLedger || g.IsSubLedger),
          traceability: {
            sourceFileType: 'JSON' as ImportFileFormat,
            sourceFile: fileName,
            jsonPath: `$.groups[${idx}]`,
            sourceField: g.name || `group[${idx}]`
          }
        }));
      }

      // Stock Items
      const rawStock = parsed.stockItems || parsed.StockItems || parsed.items || parsed.Items;
      if (Array.isArray(rawStock)) {
        stockItems = rawStock.map((s: any, idx: number) => ({
          name: s.name || s.itemName || s.ItemName || null,
          parent: s.parent || s.category || s.Parent || null,
          closingBalance: s.closingBalance || s.quantity || s.ClosingBalance || null,
          closingRate: s.closingRate || s.rate || s.Rate || null,
          traceability: {
            sourceFileType: 'JSON' as ImportFileFormat,
            sourceFile: fileName,
            jsonPath: `$.stockItems[${idx}]`,
            sourceField: s.name || `item[${idx}]`
          }
        }));
      }
    }

    // Infer financial year from extracted dates if not provided
    if (!isFyDetected && extractedDates.length > 0) {
      extractedDates.sort();
      const minDate = extractedDates[0];
      const maxDate = extractedDates[extractedDates.length - 1];
      const minYear = parseInt(minDate.substring(0, 4));
      const minMonth = parseInt(minDate.substring(5, 7));

      let startYear = minMonth >= 4 ? minYear : minYear - 1;
      detectedFyFrom = `${startYear}-04-01`;
      detectedFyTo = `${startYear + 1}-03-31`;
      isFyDetected = true;
      fyDetectionSource = `Inferred from voucher date range (${minDate} → ${maxDate})`;
    }

    const detectedEntities: any[] = [];
    if (vouchers.length > 0) {
      detectedEntities.push({
        name: 'Voucher Records',
        count: vouchers.length,
        fields: vouchers[0] ? Object.keys(vouchers[0]) : [],
        sample: vouchers.slice(0, 5),
        classifiedAs: 'Voucher'
      });
    }
    if (ledgers.length > 0) {
      detectedEntities.push({
        name: 'Ledger Masters',
        count: ledgers.length,
        fields: ledgers[0] ? Object.keys(ledgers[0]) : [],
        sample: ledgers.slice(0, 5),
        classifiedAs: 'Ledger'
      });
    }
    if (groups.length > 0) {
      detectedEntities.push({
        name: 'Group Masters',
        count: groups.length,
        fields: groups[0] ? Object.keys(groups[0]) : [],
        sample: groups.slice(0, 5),
        classifiedAs: 'Group'
      });
    }
    if (stockItems.length > 0) {
      detectedEntities.push({
        name: 'Stock Items',
        count: stockItems.length,
        fields: stockItems[0] ? Object.keys(stockItems[0]) : [],
        sample: stockItems.slice(0, 5),
        classifiedAs: 'StockItem'
      });
    }

    const preview: RawParsedPreview = {
      fileType: 'JSON',
      fileName,
      fileSize: explicitFileSize !== undefined ? explicitFileSize : rawLength,
      detectedCompany,
      detectedFinancialYear: {
        from: detectedFyFrom,
        to: detectedFyTo,
        isDetected: isFyDetected,
        detectionSource: fyDetectionSource
      },
      rawSampleData: {
        vouchers: vouchers.slice(0, 10),
        ledgers: ledgers.slice(0, 10),
        groups: groups.slice(0, 10),
        stockItems: stockItems.slice(0, 10)
      },
      detectedEntities
    };

    return {
      preview,
      rawRecords: {
        ledgers,
        groups,
        vouchers,
        stockItems,
        company: detectedCompany,
        fyFrom: detectedFyFrom,
        fyTo: detectedFyTo,
        isFyDetected,
        fyDetectionSource
      }
    };
  }

  /**
   * Parse Excel Workbook (.xlsx / .xls) with column-semantic worksheet classification
   */
  public parseExcelBuffer(buffer: Buffer | ArrayBuffer, fileName: string): { preview: RawParsedPreview; rawRecords: any } {
    if (!buffer) {
      throw new Error('Excel buffer is empty or null.');
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch (e: any) {
      throw new Error(`Failed to read Excel workbook: ${e.message}`);
    }

    const sheetNames = workbook.SheetNames;
    if (!sheetNames || sheetNames.length === 0) {
      throw new Error('Excel workbook contains no readable worksheets.');
    }

    let detectedCompany: string | null = null;
    let detectedFyFrom: string | null = null;
    let detectedFyTo: string | null = null;
    let isFyDetected = false;
    let fyDetectionSource = 'Not Detected';

    // 1. Try to detect Financial Year from workbook properties or sheet names
    for (const sName of sheetNames) {
      const fyMatch = sName.match(/FY\s*(\d{2,4})[-_](\d{2,4})/i) || sName.match(/(\d{4})[-_](\d{2,4})/);
      if (fyMatch) {
        let y1 = parseInt(fyMatch[1]);
        let y2 = parseInt(fyMatch[2]);
        if (y1 < 100) y1 += 2000;
        if (y2 < 100) y2 += 2000;
        if (y2 === y1 + 1 || y2 === y1) {
          detectedFyFrom = `${y1}-04-01`;
          detectedFyTo = `${y1 + 1}-03-31`;
          isFyDetected = true;
          fyDetectionSource = `Worksheet Name pattern (${sName})`;
          break;
        }
      }
    }

    const ledgers: any[] = [];
    const groups: any[] = [];
    const vouchers: any[] = [];
    const stockItems: any[] = [];
    const rawSampleData: Record<string, any[]> = {};
    const detectedEntities: any[] = [];
    const extractedDates: string[] = [];

    // Semantic Column Indicators
    const voucherIndicators = ['voucher', 'vch', 'date', 'particulars', 'debit', 'credit', 'amount', 'narration', 'invoice', 'doc no', 'chq', 'txn'];
    const ledgerIndicators = ['ledger', 'account', 'parent', 'group', 'under', 'opening', 'closing', 'op bal', 'cl bal', 'gstin', 'pan', 'state'];
    const stockIndicators = ['stock', 'item', 'product', 'qty', 'quantity', 'rate', 'unit', 'uom', 'closing qty', 'godown'];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      rawSampleData[sheetName] = rows.slice(0, 10);

      if (rows.length === 0) continue;

      const colKeys = Object.keys(rows[0] || {});
      const colKeysLower = colKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const lowerSheet = sheetName.toLowerCase();

      // Compute Column Semantic Scores
      let vScore = 0;
      let lScore = 0;
      let sScore = 0;

      for (const col of colKeysLower) {
        if (voucherIndicators.some(ind => col.includes(ind.replace(/[^a-z0-9]/g, '')))) vScore += 2;
        if (ledgerIndicators.some(ind => col.includes(ind.replace(/[^a-z0-9]/g, '')))) lScore += 2;
        if (stockIndicators.some(ind => col.includes(ind.replace(/[^a-z0-9]/g, '')))) sScore += 2;
      }

      // Worksheet name supporting weight
      if (voucherIndicators.some(ind => lowerSheet.includes(ind))) vScore += 1;
      if (ledgerIndicators.some(ind => lowerSheet.includes(ind))) lScore += 1;
      if (stockIndicators.some(ind => lowerSheet.includes(ind))) sScore += 1;

      let classification = 'Unknown';
      if (vScore >= lScore && vScore >= sScore && vScore > 1) {
        classification = 'Voucher';
      } else if (lScore >= vScore && lScore >= sScore && lScore > 1) {
        classification = 'Ledger';
      } else if (sScore > 1) {
        classification = 'StockItem';
      }

      detectedEntities.push({
        name: `Sheet: ${sheetName}`,
        count: rows.length,
        fields: colKeys,
        sample: rows.slice(0, 5),
        classifiedAs: classification
      });

      // Extract rows based on classified entity
      if (classification === 'Voucher') {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const rowNum = i + 2; // 1-based header is row 1, data starts at 2

          // Find matching columns dynamically
          const vNumKey = colKeys.find(k => /voucher\s*no|vch\s*no|invoice\s*no|doc\s*no|bill\s*no/i.test(k));
          const vTypeKey = colKeys.find(k => /voucher\s*type|vch\s*type|type/i.test(k));
          const dateKey = colKeys.find(k => /date|txn\s*date|voucher\s*date/i.test(k));
          const partyKey = colKeys.find(k => /particulars|party|party\s*name|account|customer|supplier/i.test(k));
          const amtKey = colKeys.find(k => /^amount$|net\s*amount|total|value|grand\s*total/i.test(k));
          const debitKey = colKeys.find(k => /^debit$|dr\s*amount|dr/i.test(k));
          const creditKey = colKeys.find(k => /^credit$|cr\s*amount|cr/i.test(k));
          const narrKey = colKeys.find(k => /narration|remarks|description|notes/i.test(k));

          const rawDate = dateKey ? r[dateKey] : null;
          let parsedDate: string | null = null;
          if (rawDate instanceof Date) {
            parsedDate = rawDate.toISOString().split('T')[0];
          } else if (rawDate) {
            parsedDate = this.parseTallyDate(String(rawDate));
          }
          if (parsedDate) extractedDates.push(parsedDate);

          const vNum = vNumKey && r[vNumKey] ? String(r[vNumKey]).trim() : null;
          const vType = vTypeKey && r[vTypeKey] ? String(r[vTypeKey]).trim() : null;
          const party = partyKey && r[partyKey] ? String(r[partyKey]).trim() : null;
          const narration = narrKey && r[narrKey] ? String(r[narrKey]).trim() : null;

          // Amount detection: check explicit debit/credit columns first, then amount column
          const rawDr = debitKey && r[debitKey] !== '' ? parseFloat(r[debitKey]) : null;
          const rawCr = creditKey && r[creditKey] !== '' ? parseFloat(r[creditKey]) : null;
          const rawAmt = amtKey && r[amtKey] !== '' ? parseFloat(r[amtKey]) : null;

          const entries: CanonicalVoucherLine[] = [];
          let totalDebit = 0;
          let totalCredit = 0;

          if (rawDr !== null && !isNaN(rawDr) && rawDr > 0) {
            entries.push({
              id: `line-ex-${sheetName}-${rowNum}-dr`,
              ledgerName: party,
              amount: Math.abs(rawDr),
              isDebit: true,
              rawAmount: rawDr,
              reviewRequired: !party,
              traceability: {
                sourceFileType: 'EXCEL',
                sourceFile: fileName,
                worksheet: sheetName,
                rowNumber: rowNum,
                columnName: debitKey
              }
            });
            totalDebit += Math.abs(rawDr);
          }

          if (rawCr !== null && !isNaN(rawCr) && rawCr > 0) {
            entries.push({
              id: `line-ex-${sheetName}-${rowNum}-cr`,
              ledgerName: party,
              amount: Math.abs(rawCr),
              isDebit: false,
              rawAmount: rawCr,
              reviewRequired: !party,
              traceability: {
                sourceFileType: 'EXCEL',
                sourceFile: fileName,
                worksheet: sheetName,
                rowNumber: rowNum,
                columnName: creditKey
              }
            });
            totalCredit += Math.abs(rawCr);
          }

          // If no separate debit/credit column, check general amount column
          let vchAmount: number | null = null;
          if (entries.length === 0) {
            if (rawAmt !== null && !isNaN(rawAmt)) {
              vchAmount = Math.abs(rawAmt);
              entries.push({
                id: `line-ex-${sheetName}-${rowNum}-amt`,
                ledgerName: party,
                amount: vchAmount,
                isDebit: rawAmt < 0 ? true : null,
                rawAmount: rawAmt,
                reviewRequired: !party,
                traceability: {
                  sourceFileType: 'EXCEL',
                  sourceFile: fileName,
                  worksheet: sheetName,
                  rowNumber: rowNum,
                  columnName: amtKey
                }
              });
              if (rawAmt < 0) totalDebit += vchAmount;
              else totalCredit += vchAmount;
            }
          } else {
            vchAmount = totalDebit > 0 ? totalDebit : totalCredit;
          }

          const diff = Math.abs(totalDebit - totalCredit);
          const isBalanced = entries.length >= 2 && diff <= 0.05 && totalDebit > 0;

          const reviewReasons: string[] = [];
          if (!parsedDate) reviewReasons.push('Missing or unparseable voucher date in Excel row');
          if (!vNum) reviewReasons.push('Missing voucher reference number');
          if (vchAmount === null) reviewReasons.push('Missing or non-numeric amount in source row');
          if (!isBalanced && entries.length > 0) reviewReasons.push(`Debit/Credit imbalance: difference of ₹${diff.toFixed(2)}`);

          vouchers.push({
            id: `EXCEL-V-${vouchers.length + 1}`,
            voucherNumber: vNum,
            voucherType: vType,
            date: parsedDate,
            partyLedger: party,
            amount: vchAmount,
            totalDebit,
            totalCredit,
            difference: diff,
            isBalanced,
            narration,
            entries,
            reviewRequired: reviewReasons.length > 0,
            reviewReasons,
            sourceFile: fileName,
            traceability: {
              sourceFileType: 'EXCEL',
              sourceFile: fileName,
              worksheet: sheetName,
              rowNumber: rowNum,
              columnName: vNumKey || 'Voucher No'
            }
          });
        }
      } else if (classification === 'Ledger') {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const rowNum = i + 2;

          const nameKey = colKeys.find(k => /ledger\s*name|^name$|account\s*name|party\s*name/i.test(k));
          const parentKey = colKeys.find(k => /^group$|^parent$|^under$|account\s*group/i.test(k));
          const opKey = colKeys.find(k => /opening\s*balance|op\s*bal|opening/i.test(k));
          const clKey = colKeys.find(k => /closing\s*balance|cl\s*bal|closing/i.test(k));
          const gstinKey = colKeys.find(k => /gstin|gst\s*no|tax\s*id/i.test(k));
          const stateKey = colKeys.find(k => /state/i.test(k));

          const name = nameKey && r[nameKey] ? String(r[nameKey]).trim() : null;
          const parent = parentKey && r[parentKey] ? String(r[parentKey]).trim() : null;
          const opRaw = opKey && r[opKey] !== '' ? parseFloat(r[opKey]) : null;
          const clRaw = clKey && r[clKey] !== '' ? parseFloat(r[clKey]) : null;

          ledgers.push({
            name,
            parent,
            openingBalance: isNaN(opRaw as number) ? null : opRaw,
            closingBalance: isNaN(clRaw as number) ? null : clRaw,
            gstin: gstinKey && r[gstinKey] ? String(r[gstinKey]).trim() : null,
            state: stateKey && r[stateKey] ? String(r[stateKey]).trim() : null,
            reviewRequired: !name || !parent,
            traceability: {
              sourceFileType: 'EXCEL',
              sourceFile: fileName,
              worksheet: sheetName,
              rowNumber: rowNum,
              columnName: nameKey || 'Ledger Name'
            }
          });
        }
      } else if (classification === 'StockItem') {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const rowNum = i + 2;

          const nameKey = colKeys.find(k => /item\s*name|stock\s*item|^name$|product/i.test(k));
          const parentKey = colKeys.find(k => /^group$|category|^parent$/i.test(k));
          const qtyKey = colKeys.find(k => /qty|quantity|closing\s*qty/i.test(k));
          const rateKey = colKeys.find(k => /^rate$|price/i.test(k));

          stockItems.push({
            name: nameKey && r[nameKey] ? String(r[nameKey]).trim() : null,
            parent: parentKey && r[parentKey] ? String(r[parentKey]).trim() : null,
            closingBalance: qtyKey && r[qtyKey] !== '' ? String(r[qtyKey]).trim() : null,
            closingRate: rateKey && r[rateKey] !== '' ? String(r[rateKey]).trim() : null,
            reviewRequired: !nameKey || !r[nameKey],
            traceability: {
              sourceFileType: 'EXCEL',
              sourceFile: fileName,
              worksheet: sheetName,
              rowNumber: rowNum,
              columnName: nameKey || 'Item Name'
            }
          });
        }
      }
    }

    // Infer financial year from extracted dates if not detected from sheet name
    if (!isFyDetected && extractedDates.length > 0) {
      extractedDates.sort();
      const minDate = extractedDates[0];
      const maxDate = extractedDates[extractedDates.length - 1];
      const minYear = parseInt(minDate.substring(0, 4));
      const minMonth = parseInt(minDate.substring(5, 7));

      let startYear = minMonth >= 4 ? minYear : minYear - 1;
      detectedFyFrom = `${startYear}-04-01`;
      detectedFyTo = `${startYear + 1}-03-31`;
      isFyDetected = true;
      fyDetectionSource = `Inferred from Excel date column range (${minDate} → ${maxDate})`;
    }

    const preview: RawParsedPreview = {
      fileType: 'EXCEL',
      fileName,
      fileSize: typeof buffer === 'object' && 'byteLength' in buffer ? buffer.byteLength : 50000,
      detectedCompany,
      detectedFinancialYear: {
        from: detectedFyFrom,
        to: detectedFyTo,
        isDetected: isFyDetected,
        detectionSource: fyDetectionSource
      },
      sheets: sheetNames,
      selectedSheet: sheetNames[0],
      rawSampleData,
      detectedEntities
    };

    return {
      preview,
      rawRecords: {
        ledgers,
        groups,
        vouchers,
        stockItems,
        company: detectedCompany,
        fyFrom: detectedFyFrom,
        fyTo: detectedFyTo,
        isFyDetected,
        fyDetectionSource
      }
    };
  }

  // =========================================================================
  // 3. FIELD MAPPING WITH STRICT CONFIDENCE POLICIES
  // =========================================================================

  public generateAutoMappings(rawRecords: any): FieldMappingItem[] {
    const mappings: FieldMappingItem[] = [];

    const synonymMap: Record<string, { entity: CanonicalEntityName; field: string; exactSynonyms: string[]; partialSynonyms: string[] }> = {
      voucherNumber: {
        entity: 'Voucher',
        field: 'voucherNumber',
        exactSynonyms: ['vouchernumber', 'voucherno', 'vchno', 'docno', 'invoiceno', 'billno'],
        partialSynonyms: ['vch', 'voucher', 'invoice', 'bill']
      },
      voucherType: {
        entity: 'Voucher',
        field: 'voucherType',
        exactSynonyms: ['vouchertypename', 'vouchertype', 'vchtype', 'type', 'vch_type'],
        partialSynonyms: ['type', 'vchtype']
      },
      transactionDate: {
        entity: 'Voucher',
        field: 'date',
        exactSynonyms: ['date', 'voucherdate', 'txndate', 'invoicedate', 'billdate'],
        partialSynonyms: ['date', 'txn']
      },
      amount: {
        entity: 'Voucher',
        field: 'amount',
        exactSynonyms: ['amount', 'netamount', 'total', 'grandtotal', 'debit', 'credit', 'value'],
        partialSynonyms: ['amt', 'total', 'value']
      },
      partyLedger: {
        entity: 'Party',
        field: 'name',
        exactSynonyms: ['partyledgername', 'partyname', 'party', 'particulars', 'customername', 'suppliername', 'account'],
        partialSynonyms: ['party', 'customer', 'supplier', 'account']
      },
      narration: {
        entity: 'Voucher',
        field: 'narration',
        exactSynonyms: ['narration', 'remarks', 'description', 'notes', 'memo'],
        partialSynonyms: ['remark', 'desc', 'note']
      },
      ledgerName: {
        entity: 'Ledger',
        field: 'name',
        exactSynonyms: ['ledgername', 'name', 'accountname', 'headofaccount', 'ledger'],
        partialSynonyms: ['ledger', 'account']
      },
      ledgerParent: {
        entity: 'Group',
        field: 'name',
        exactSynonyms: ['parent', 'group', 'under', 'accountgroup', 'primarygroup'],
        partialSynonyms: ['group', 'under']
      },
      openingBalance: {
        entity: 'Ledger',
        field: 'openingBalance',
        exactSynonyms: ['openingbalance', 'opbal', 'opening'],
        partialSynonyms: ['open', 'opbal']
      },
      closingBalance: {
        entity: 'Ledger',
        field: 'closingBalance',
        exactSynonyms: ['closingbalance', 'clbal', 'closing'],
        partialSynonyms: ['close', 'clbal']
      },
      gstin: {
        entity: 'Party',
        field: 'gstin',
        exactSynonyms: ['gstin', 'partygstin', 'gstno', 'gstinuin', 'taxid'],
        partialSynonyms: ['gst', 'tax']
      },
      stockItemName: {
        entity: 'StockItem',
        field: 'name',
        exactSynonyms: ['itemname', 'stockitem', 'productname', 'item'],
        partialSynonyms: ['item', 'product', 'stock']
      }
    };

    const detectedSourceFields: { key: string; entity: string; samples: any[]; traceability?: SourceTraceability }[] = [];

    if (rawRecords.vouchers && rawRecords.vouchers.length > 0) {
      const sampleVch = rawRecords.vouchers[0];
      for (const k of Object.keys(sampleVch)) {
        if (!['entries', 'rawPath', 'traceability', 'reviewRequired', 'reviewReasons'].includes(k)) {
          detectedSourceFields.push({
            key: k,
            entity: 'Voucher',
            samples: rawRecords.vouchers.slice(0, 3).map((v: any) => v[k]),
            traceability: sampleVch.traceability
          });
        }
      }
    }

    if (rawRecords.ledgers && rawRecords.ledgers.length > 0) {
      const sampleLed = rawRecords.ledgers[0];
      for (const k of Object.keys(sampleLed)) {
        if (!['rawPath', 'traceability', 'reviewRequired'].includes(k)) {
          detectedSourceFields.push({
            key: k,
            entity: 'Ledger',
            samples: rawRecords.ledgers.slice(0, 3).map((l: any) => l[k]),
            traceability: sampleLed.traceability
          });
        }
      }
    }

    for (const src of detectedSourceFields) {
      const cleanKey = src.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      let bestMatch: { entity: CanonicalEntityName; field: string; confidence: FieldMappingConfidence; score: number } | null = null;

      for (const [, def] of Object.entries(synonymMap)) {
        // Exact synonym match -> HIGH confidence (>= 90) -> status: MAPPED
        for (const syn of def.exactSynonyms) {
          const cleanSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanKey === cleanSyn) {
            bestMatch = { entity: def.entity, field: def.field, confidence: 'HIGH', score: 95 };
            break;
          }
        }
        if (bestMatch && bestMatch.confidence === 'HIGH') break;

        // Partial synonym match -> MEDIUM confidence (75) -> status: REVIEW_REQUIRED (Never auto-upgraded to HIGH)
        if (!bestMatch) {
          for (const syn of def.partialSynonyms) {
            const cleanSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanKey.includes(cleanSyn) || cleanSyn.includes(cleanKey)) {
              bestMatch = { entity: def.entity, field: def.field, confidence: 'MEDIUM', score: 75 };
              break;
            }
          }
        }
      }

      const id = `map-${src.entity.toLowerCase()}-${src.key}`;
      if (bestMatch && bestMatch.confidence === 'HIGH') {
        mappings.push({
          id,
          sourceField: src.key,
          sourcePath: `${src.entity}.${src.key}`,
          sourceEntity: src.entity,
          canonicalEntity: bestMatch.entity,
          canonicalField: bestMatch.field,
          confidence: 'HIGH',
          confidenceScore: bestMatch.score,
          status: 'MAPPED',
          sampleValues: src.samples,
          detectedDataType: typeof src.samples[0] === 'number' ? 'number' : 'string',
          traceability: src.traceability
        });
      } else if (bestMatch && bestMatch.confidence === 'MEDIUM') {
        // Medium confidence requires review
        mappings.push({
          id,
          sourceField: src.key,
          sourcePath: `${src.entity}.${src.key}`,
          sourceEntity: src.entity,
          canonicalEntity: bestMatch.entity,
          canonicalField: bestMatch.field,
          confidence: 'MEDIUM',
          confidenceScore: bestMatch.score,
          status: 'REVIEW_REQUIRED',
          sampleValues: src.samples,
          detectedDataType: typeof src.samples[0] === 'number' ? 'number' : 'string',
          notes: 'Recommendation: review auto-suggested canonical field association.',
          traceability: src.traceability
        });
      } else {
        // Low confidence -> UNMAPPED / REVIEW_REQUIRED
        mappings.push({
          id,
          sourceField: src.key,
          sourcePath: `${src.entity}.${src.key}`,
          sourceEntity: src.entity,
          canonicalEntity: 'Voucher',
          canonicalField: src.key,
          confidence: 'LOW',
          confidenceScore: 30,
          status: 'REVIEW_REQUIRED',
          sampleValues: src.samples,
          detectedDataType: typeof src.samples[0] === 'number' ? 'number' : 'string',
          notes: 'No high-confidence canonical field matched. Manual mapping required.',
          traceability: src.traceability
        });
      }
    }

    return mappings;
  }

  // =========================================================================
  // 4. NORMALIZATION & PRE-AUDIT DATA QUALITY AUDIT
  // =========================================================================

  public evaluateDataQuality(rawRecords: any, mappings: FieldMappingItem[]): DataQualityReport {
    const vouchers: any[] = rawRecords.vouchers || [];
    const ledgers: any[] = rawRecords.ledgers || [];
    const totalRecords = vouchers.length + ledgers.length;

    let duplicateVouchers = 0;
    let missingDates = 0;
    let invalidAmounts = 0;
    let unbalancedVouchers = 0;
    let orphanLedgers = 0;

    const seenVNums = new Set<string>();
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    for (const v of vouchers) {
      if (!v.voucherNumber) {
        duplicateVouchers++;
      } else if (seenVNums.has(v.voucherNumber)) {
        duplicateVouchers++;
      } else {
        seenVNums.add(v.voucherNumber);
      }

      if (!v.date) {
        missingDates++;
      }

      if (v.amount === null || typeof v.amount !== 'number' || isNaN(v.amount) || v.amount <= 0) {
        invalidAmounts++;
      }

      if (v.entries && v.entries.length >= 2) {
        if (!v.isBalanced && v.difference > 0.05) {
          unbalancedVouchers++;
        }
      }
    }

    for (const l of ledgers) {
      if (!l.parent || String(l.parent).trim() === '') {
        orphanLedgers++;
      }
    }

    const unmappedFieldsCount = mappings.filter(m => m.status === 'UNMAPPED').length;
    const reviewRequiredFieldsCount = mappings.filter(m => m.status === 'REVIEW_REQUIRED').length;

    if (duplicateVouchers > 0) {
      warnings.push(`Detected ${duplicateVouchers} duplicate or missing voucher reference numbers in source.`);
      recommendations.push('Review voucher numbering sequence to eliminate duplicates before finalizing.');
    }
    if (missingDates > 0) {
      warnings.push(`Detected ${missingDates} records with missing or non-standard date formats.`);
    }
    if (unbalancedVouchers > 0) {
      errors.push(`Detected ${unbalancedVouchers} vouchers with debit/credit imbalance in source entries.`);
    }
    if (orphanLedgers > 0) {
      warnings.push(`Detected ${orphanLedgers} ledgers without defined parent group.`);
    }
    if (reviewRequiredFieldsCount > 0) {
      warnings.push(`${reviewRequiredFieldsCount} fields require mapping confirmation or manual review.`);
    }

    let score = 100;
    score -= duplicateVouchers * 2;
    score -= missingDates * 3;
    score -= invalidAmounts * 4;
    score -= unbalancedVouchers * 5;
    score -= orphanLedgers * 2;
    score -= reviewRequiredFieldsCount * 1.5;

    score = Math.max(10, Math.min(100, Math.round(score)));

    return {
      score,
      totalRecordsChecked: totalRecords,
      passedRecords: Math.max(0, totalRecords - (duplicateVouchers + missingDates + invalidAmounts + unbalancedVouchers)),
      duplicateVouchers,
      missingDates,
      invalidAmounts,
      unbalancedVouchers,
      orphanLedgers,
      unmappedFieldsCount,
      reviewRequiredFieldsCount,
      warnings,
      errors,
      recommendations
    };
  }

  // =========================================================================
  // 5. COMMIT & PERSISTENCE TO LOCAL DESKTOP STORAGE
  // =========================================================================

  public commitDataset(
    fileName: string,
    fileType: ImportFileFormat,
    fileSize: number,
    rawRecords: any,
    mappings: FieldMappingItem[],
    overrides?: { companyName?: string; financialYearFrom?: string; financialYearTo?: string; isDemoData?: boolean }
  ): CanonicalDatasetRecord {
    const datasetId = `ds-offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const qualityReport = this.evaluateDataQuality(rawRecords, mappings);
    const nowIso = new Date().toISOString();

    const rawVouchers: CanonicalVoucher[] = rawRecords.vouchers || [];
    const rawLedgers: any[] = rawRecords.ledgers || [];
    const rawGroups: any[] = rawRecords.groups || [];
    const rawStock: any[] = rawRecords.stockItems || [];

    const voucherCounts = {
      total: rawVouchers.length,
      sales: 0,
      purchase: 0,
      payment: 0,
      receipt: 0,
      journal: 0,
      contra: 0,
      other: 0
    };

    const canonicalVouchers: CanonicalVoucher[] = [];
    const canonicalExceptions: CanonicalAuditException[] = [];

    for (let i = 0; i < rawVouchers.length; i++) {
      const v = rawVouchers[i];
      const typeStr = (v.voucherType || '').toLowerCase();
      if (typeStr.includes('sale')) voucherCounts.sales++;
      else if (typeStr.includes('purch')) voucherCounts.purchase++;
      else if (typeStr.includes('paym')) voucherCounts.payment++;
      else if (typeStr.includes('receipt')) voucherCounts.receipt++;
      else if (typeStr.includes('contra')) voucherCounts.contra++;
      else if (typeStr.includes('journal')) voucherCounts.journal++;
      else voucherCounts.other++;

      const cVoucher: CanonicalVoucher = {
        ...v,
        id: v.id || `CANON-V-${i + 1}`,
        datasetId,
        sourceFile: fileName
      };
      canonicalVouchers.push(cVoucher);

      // Audit Intelligence: Professional, objective risk language (no unsupported fraud/violation claims)
      if (v.amount !== null && v.amount >= 200000 && (typeStr.includes('paym') || typeStr.includes('receipt') || typeStr.includes('cash'))) {
        canonicalExceptions.push({
          id: `EXC-${datasetId}-${i + 1}`,
          risk: 'HIGH',
          riskScore: 88,
          date: v.date,
          voucherNo: v.voucherNumber,
          voucherType: v.voucherType,
          ledger: v.partyLedger,
          party: v.partyLedger,
          amount: v.amount,
          exceptionType: 'Potential High-Value Transaction',
          reason: 'Potential high-value transaction — review applicability of relevant tax provisions based on transaction nature, aggregation and payment/receipt context.',
          status: 'Pending',
          traceability: v.traceability
        });
      } else if (v.amount !== null && v.amount % 10000 === 0 && v.amount >= 50000) {
        canonicalExceptions.push({
          id: `EXC-${datasetId}-${i + 1}`,
          risk: 'MEDIUM',
          riskScore: 65,
          date: v.date,
          voucherNo: v.voucherNumber,
          voucherType: v.voucherType,
          ledger: v.partyLedger,
          party: v.partyLedger,
          amount: v.amount,
          exceptionType: 'Unusual Pattern - Round Sum',
          reason: `Unusual round sum transaction amount of ₹${v.amount.toLocaleString('en-IN')}; review against supporting purchase or service documentation.`,
          status: 'Pending',
          traceability: v.traceability
        });
      } else if (v.date && new Date(v.date).getDay() === 0) {
        canonicalExceptions.push({
          id: `EXC-${datasetId}-${i + 1}`,
          risk: 'LOW',
          riskScore: 38,
          date: v.date,
          voucherNo: v.voucherNumber,
          voucherType: v.voucherType,
          ledger: v.partyLedger,
          party: v.partyLedger,
          amount: v.amount,
          exceptionType: 'Risk Indicator - Weekend Transaction',
          reason: `Transaction posted on Sunday (${v.date}). Recommended to cross-check against operational authorization registers.`,
          status: 'Pending',
          traceability: v.traceability
        });
      } else if (!v.isBalanced && v.difference > 0.05) {
        canonicalExceptions.push({
          id: `EXC-${datasetId}-${i + 1}`,
          risk: 'HIGH',
          riskScore: 92,
          date: v.date,
          voucherNo: v.voucherNumber,
          voucherType: v.voucherType,
          ledger: v.partyLedger,
          party: v.partyLedger,
          amount: v.amount,
          exceptionType: 'Potential Compliance Concern - Unbalanced Voucher',
          reason: `Debit and Credit entries do not balance (discrepancy of ₹${v.difference.toFixed(2)}). Requires ledger reconciliation.`,
          status: 'Pending',
          traceability: v.traceability
        });
      }
    }

    const masterCounts = {
      ledgers: rawLedgers.length,
      groups: rawGroups.length,
      parties: rawLedgers.filter((l: any) => (l.parent || '').toLowerCase().includes('debtor') || (l.parent || '').toLowerCase().includes('creditor')).length,
      stockItems: rawStock.length,
      costCentres: 0,
      bankAccounts: rawLedgers.filter((l: any) => (l.parent || '').toLowerCase().includes('bank')).length
    };

    const companyName = overrides?.companyName || rawRecords.company || null;
    const fyFrom = overrides?.financialYearFrom || rawRecords.fyFrom || null;
    const fyTo = overrides?.financialYearTo || rawRecords.fyTo || null;
    const isDemoData = overrides?.isDemoData || false;

    const metadata: ImportedDatasetSummary = {
      id: datasetId,
      name: isDemoData 
        ? `[DEMO DATA] ${companyName || 'Sample Company'} (${fileType})` 
        : `${companyName || 'Offline Dataset'} (${fileType})`,
      description: `Imported from ${fileName} with ${rawVouchers.length} vouchers and ${masterCounts.ledgers} masters.`,
      sourceFileName: fileName,
      sourceFileType: fileType,
      sourceFileSize: fileSize,
      companyName,
      financialYearFrom: fyFrom,
      financialYearTo: fyTo,
      isFinancialYearDetected: Boolean(fyFrom && fyTo),
      financialYearDetectionSource: rawRecords.fyDetectionSource || (fyFrom ? 'User Specified' : 'Not Detected'),
      importedAt: nowIso,
      totalRecords: rawVouchers.length + rawLedgers.length + rawStock.length,
      masterCounts,
      voucherCounts,
      dataQualityScore: qualityReport.score,
      dataQualityReport: qualityReport,
      status: 'Ready',
      mappingsCount: {
        total: mappings.length,
        mapped: mappings.filter(m => m.status === 'MAPPED').length,
        reviewRequired: mappings.filter(m => m.status === 'REVIEW_REQUIRED').length,
        unmapped: mappings.filter(m => m.status === 'UNMAPPED').length
      },
      isActive: true,
      isDemoData
    };

    const datasetRecord: CanonicalDatasetRecord = {
      id: datasetId,
      metadata,
      companies: companyName ? [{ name: companyName, financialYearFrom: fyFrom, financialYearTo: fyTo, id: datasetId }] : [],
      groups: rawGroups,
      ledgers: rawLedgers,
      parties: rawLedgers.map((l: any) => ({ name: l.name, gstin: l.gstin, state: l.state, parent: l.parent, traceability: l.traceability })),
      vouchers: canonicalVouchers,
      voucherLines: canonicalVouchers.flatMap(v => v.entries || []),
      stockItems: rawStock,
      costCentres: [],
      taxRecords: [],
      bankAccounts: [],
      exceptions: canonicalExceptions,
      mappings
    };

    // Save persistently to local disk
    this.storage.saveDataset(datasetRecord);

    return datasetRecord;
  }

  // =========================================================================
  // 6. SAMPLE DEMO DATASETS (Strictly Labeled as [DEMO DATA])
  // =========================================================================

  public generateSampleXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>[DEMO DATA] Apex Global Trading Pvt Ltd</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <COMPANY NAME="[DEMO DATA] Apex Global Trading Pvt Ltd">
          <BASICCOMPANYFORMALNAME>[DEMO DATA] Apex Global Trading Private Limited</BASICCOMPANYFORMALNAME>
          <STARTINGFROM>20240401</STARTINGFROM>
          <ENDINGAT>20250331</ENDINGAT>
        </COMPANY>
        <GROUP NAME="Sundry Debtors">
          <PARENT>Current Assets</PARENT>
          <ISSUBLEDGER>Yes</ISSUBLEDGER>
        </GROUP>
        <GROUP NAME="Sundry Creditors">
          <PARENT>Current Liabilities</PARENT>
          <ISSUBLEDGER>Yes</ISSUBLEDGER>
        </GROUP>
        <LEDGER NAME="Zenith Infotech Ltd">
          <PARENT>Sundry Debtors</PARENT>
          <OPENINGBALANCE>-450000.00</OPENINGBALANCE>
          <CLOSINGBALANCE>-820000.00</CLOSINGBALANCE>
          <PARTYGSTIN>27AABCU9603R1ZM</PARTYGSTIN>
          <LEDSTATENAME>Maharashtra</LEDSTATENAME>
        </LEDGER>
        <LEDGER NAME="Prime Logistics Corporation">
          <PARENT>Sundry Creditors</PARENT>
          <OPENINGBALANCE>125000.00</OPENINGBALANCE>
          <CLOSINGBALANCE>340000.00</CLOSINGBALANCE>
          <PARTYGSTIN>07AAACR4829K1ZX</PARTYGSTIN>
          <LEDSTATENAME>Delhi</LEDSTATENAME>
        </LEDGER>
        <LEDGER NAME="HDFC Bank Main A/c">
          <PARENT>Bank Accounts</PARENT>
          <OPENINGBALANCE>-2450000.00</OPENINGBALANCE>
          <CLOSINGBALANCE>-1820000.00</CLOSINGBALANCE>
        </LEDGER>
        <LEDGER NAME="Sales - GST 18%">
          <PARENT>Sales Accounts</PARENT>
          <OPENINGBALANCE>0.00</OPENINGBALANCE>
        </LEDGER>
        <LEDGER NAME="CGST Output">
          <PARENT>Duties &amp; Taxes</PARENT>
        </LEDGER>
        <LEDGER NAME="SGST Output">
          <PARENT>Duties &amp; Taxes</PARENT>
        </LEDGER>
        <STOCKITEM NAME="Enterprise Cloud Storage Server Gen4">
          <PARENT>Hardware</PARENT>
          <CLOSINGBALANCE>45 Nos</CLOSINGBALANCE>
          <CLOSINGRATE>85000.00</CLOSINGRATE>
        </STOCKITEM>
        <VOUCHER VCHTYPE="Sales" ACTION="Create">
          <DATE>20240510</DATE>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <VOUCHERNUMBER>INV/2024/00142</VOUCHERNUMBER>
          <PARTYLEDGERNAME>Zenith Infotech Ltd</PARTYLEDGERNAME>
          <NARRATION>Supply of Enterprise Cloud Server units against PO-8902</NARRATION>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Zenith Infotech Ltd</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-370000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Sales - GST 18%</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>313559.32</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>CGST Output</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>28220.34</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>SGST Output</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>28220.34</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
        <VOUCHER VCHTYPE="Payment" ACTION="Create">
          <DATE>20240514</DATE>
          <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
          <VOUCHERNUMBER>PAY/2024/00089</VOUCHERNUMBER>
          <PARTYLEDGERNAME>Prime Logistics Corporation</PARTYLEDGERNAME>
          <NARRATION>Vendor settlement payment for freight logistics invoice #5490</NARRATION>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Prime Logistics Corporation</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-250000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>HDFC Bank Main A/c</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>250000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
        <VOUCHER VCHTYPE="Payment" ACTION="Create">
          <DATE>20240519</DATE>
          <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
          <VOUCHERNUMBER>PAY/2024/00092</VOUCHERNUMBER>
          <PARTYLEDGERNAME>Director Remuneration Account</PARTYLEDGERNAME>
          <NARRATION>Round sum director advisory withdrawal on weekend</NARRATION>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Director Remuneration Account</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-100000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Cash Account</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>100000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
  }

  public generateSampleJson(): string {
    return JSON.stringify({
      company: "[DEMO DATA] Quantum Retailers Limited",
      financialYear: { from: "2024-04-01", to: "2025-03-31" },
      ledgers: [
        { name: "Aurora Lifestyle Mall", parent: "Sundry Debtors", openingBalance: 840000, closingBalance: 1200000, gstin: "29AABCR8492J1ZW" },
        { name: "Supreme Fabric Mills", parent: "Sundry Creditors", openingBalance: 320000, closingBalance: 610000, gstin: "24AABCS9912K1ZD" },
        { name: "State Bank of India OD A/c", parent: "Bank OD A/c", openingBalance: 1500000, closingBalance: 980000 }
      ],
      vouchers: [
        {
          id: "QNT-V-001",
          voucherNumber: "QNT/2024/091",
          voucherType: "Sales",
          date: "2024-05-18",
          partyLedger: "Aurora Lifestyle Mall",
          amount: 480000,
          narration: "B2B Bulk apparel consignment delivery #8120",
          entries: [
            { ledgerName: "Aurora Lifestyle Mall", amount: 480000, isDebit: true, isDeemedPositive: true },
            { ledgerName: "Sales - 12%", amount: 428571.43, isDebit: false, isDeemedPositive: false },
            { ledgerName: "GST Output 12%", amount: 51428.57, isDebit: false, isDeemedPositive: false }
          ]
        },
        {
          id: "QNT-V-002",
          voucherNumber: "QNT/2024/092",
          voucherType: "Payment",
          date: "2024-05-22",
          partyLedger: "Supreme Fabric Mills",
          amount: 280000,
          narration: "Raw material bulk procurement bank wire",
          entries: [
            { ledgerName: "Supreme Fabric Mills", amount: 280000, isDebit: true, isDeemedPositive: true },
            { ledgerName: "State Bank of India OD A/c", amount: 280000, isDebit: false, isDeemedPositive: false }
          ]
        }
      ]
    }, null, 2);
  }

  /**
   * Only seeds a clearly marked demo dataset if persistent storage has zero datasets
   */
  private ensureDefaultSampleIfEmpty(): void {
    if (!this.storage.hasDatasets()) {
      const xml = this.generateSampleXml();
      const { rawRecords } = this.parseXmlData(xml, 'DEMO_Apex_Global_Trading_FY2024_25.xml');
      const mappings = this.generateAutoMappings(rawRecords);
      this.commitDataset('DEMO_Apex_Global_Trading_FY2024_25.xml', 'XML', xml.length, rawRecords, mappings, {
        companyName: '[DEMO DATA] Apex Global Trading Pvt Ltd',
        financialYearFrom: '2024-04-01',
        financialYearTo: '2025-03-31',
        isDemoData: true
      });
    }
  }
}

export const offlineDataImportEngine = new OfflineDataImportEngine();
