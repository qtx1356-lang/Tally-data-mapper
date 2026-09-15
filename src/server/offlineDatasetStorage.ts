/**
 * EXFIN Tally Data Mapper - Persistent Offline Dataset Storage Layer
 * 
 * Provides atomic, persistent local storage on disk for Electron / Desktop environments.
 * Persists datasets, metadata, ledgers, vouchers, voucher lines, exceptions, mappings, and source traceability.
 * Ensures datasets remain available across application and system restarts without re-importing.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { 
  CanonicalDatasetRecord, 
  CanonicalVoucher,
  CanonicalAuditException,
  ImportedDatasetSummary 
} from '../types/offlineDataImport';

export class OfflineDatasetStorage {
  private baseDir: string;
  private datasetsDir: string;
  private indexFilePath: string;
  private isInitialized = false;

  // In-memory cache for fast query performance, synchronized with disk
  private datasetCache: Map<string, CanonicalDatasetRecord> = new Map();
  private activeDatasetId: string | null = null;

  constructor(customDir?: string) {
    this.baseDir = customDir || path.join(process.cwd(), 'data', 'offline_datasets');
    this.datasetsDir = path.join(this.baseDir, 'records');
    this.indexFilePath = path.join(this.baseDir, 'index.json');
    this.init();
  }

  /**
   * Initialize local directory structure and load existing records from disk
   */
  public init(): void {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      if (!fs.existsSync(this.datasetsDir)) {
        fs.mkdirSync(this.datasetsDir, { recursive: true });
      }

      this.loadFromDisk();
      this.isInitialized = true;
    } catch (err: any) {
      console.error('[OfflineDatasetStorage] Failed to initialize persistent storage:', err);
    }
  }

  /**
   * Reads up to maxItems from a JSONL file on disk incrementally using 64KB buffer chunks
   * without ever reading the entire file into memory.
   */
  private readBoundedJsonlSync<T>(filePath: string, maxItems: number): T[] {
    if (!fs.existsSync(filePath)) return [];
    const items: T[] = [];
    let fd: number | null = null;
    try {
      fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(64 * 1024); // 64 KB chunk
      let leftover = '';
      let bytesRead = 0;
      let position = 0;

      while (items.length < maxItems && (bytesRead = fs.readSync(fd, buffer, 0, buffer.length, position)) > 0) {
        position += bytesRead;
        const chunk = leftover + buffer.toString('utf8', 0, bytesRead);
        const lines = chunk.split('\n');
        leftover = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            try {
              items.push(JSON.parse(trimmed));
              if (items.length >= maxItems) break;
            } catch (e) {}
          }
        }
      }

      if (items.length < maxItems && leftover.trim()) {
        try {
          items.push(JSON.parse(leftover.trim()));
        } catch (e) {}
      }
    } catch (err) {
      console.warn(`[OfflineDatasetStorage] Error reading bounded JSONL from ${filePath}:`, err);
    } finally {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch (e) {}
      }
    }
    return items;
  }

  /**
   * Load index and all stored datasets from local disk (both legacy JSON files and folder-based JSONL datasets)
   */
  private loadFromDisk(): void {
    this.datasetCache.clear();

    if (!fs.existsSync(this.indexFilePath)) {
      return;
    }

    try {
      const indexRaw = fs.readFileSync(this.indexFilePath, 'utf8');
      const indexData = JSON.parse(indexRaw);
      this.activeDatasetId = indexData.activeDatasetId || null;

      const datasetEntries = fs.readdirSync(this.datasetsDir);
      for (const entry of datasetEntries) {
        const fullEntryPath = path.join(this.datasetsDir, entry);
        try {
          const stats = fs.statSync(fullEntryPath);

          // CASE A: Legacy / Small single JSON file
          if (stats.isFile() && entry.endsWith('.json')) {
            const content = fs.readFileSync(fullEntryPath, 'utf8');
            const record: CanonicalDatasetRecord = JSON.parse(content);
            if (record && record.id) {
              record.isStreamingDataset = false;
              record.storageMode = 'SINGLE_JSON';
              if (record.metadata) {
                record.metadata.isStreamingDataset = false;
                record.metadata.storageMode = 'SINGLE_JSON';
              }
              record.sampleVouchers = (record.vouchers || []).slice(0, 50);
              this.datasetCache.set(record.id, record);
            }
          }
          // CASE B: Large / Streaming folder-backed dataset
          else if (stats.isDirectory()) {
            const metaFilePath = path.join(fullEntryPath, 'metadata.json');
            if (fs.existsSync(metaFilePath)) {
              const meta: ImportedDatasetSummary = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
              meta.isStreamingDataset = true;
              meta.storageMode = 'STREAMING_JSONL';

              let mappings = [];
              const mapFilePath = path.join(fullEntryPath, 'mappings.json');
              if (fs.existsSync(mapFilePath)) {
                try { mappings = JSON.parse(fs.readFileSync(mapFilePath, 'utf8')); } catch (e) {}
              }

              // Load up to 50 sample exceptions bounded preview (complete set available via streamExceptions)
              const excFilePath = path.join(fullEntryPath, 'exceptions.jsonl');
              const exceptions: CanonicalAuditException[] = this.readBoundedJsonlSync<CanonicalAuditException>(excFilePath, 50);

              // Load up to 50 sample vouchers bounded preview (complete set available via streamVouchers)
              const vouchersPath = path.join(fullEntryPath, 'vouchers.jsonl');
              const sampleVouchers: CanonicalVoucher[] = this.readBoundedJsonlSync<CanonicalVoucher>(vouchersPath, 50);

              const datasetRecord: CanonicalDatasetRecord = {
                id: entry,
                metadata: meta,
                companies: meta.companyName ? [{ name: meta.companyName, financialYearFrom: meta.financialYearFrom, financialYearTo: meta.financialYearTo, id: entry }] : [],
                groups: [],
                ledgers: [],
                parties: [],
                vouchers: sampleVouchers,
                voucherLines: sampleVouchers.flatMap(v => v.entries || []),
                stockItems: [],
                costCentres: [],
                taxRecords: [],
                bankAccounts: [],
                exceptions,
                mappings,
                isStreamingDataset: true,
                storageMode: 'STREAMING_JSONL',
                sampleVouchers
              };
              this.datasetCache.set(entry, datasetRecord);
            }
          }
        } catch (entryErr) {
          console.warn(`[OfflineDatasetStorage] Failed to read dataset entry ${entry}:`, entryErr);
        }
      }

      // If active ID is not in cache, select first available if any
      if (this.activeDatasetId && !this.datasetCache.has(this.activeDatasetId)) {
        const first = Array.from(this.datasetCache.keys())[0];
        this.activeDatasetId = first || null;
      }
    } catch (err) {
      console.error('[OfflineDatasetStorage] Error reading index file:', err);
    }
  }

  /**
   * Atomic file writer: Writes to a temporary file first, then renames to prevent partial writes
   */
  private atomicWriteFileSync(filePath: string, data: string): void {
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempPath, data, 'utf8');
    fs.renameSync(tempPath, filePath);
  }

  /**
   * Synchronize the central index with current memory state
   */
  private persistIndex(): void {
    try {
      const summaries: ImportedDatasetSummary[] = [];
      for (const record of this.datasetCache.values()) {
        summaries.push({
          ...record.metadata,
          isActive: record.id === this.activeDatasetId
        });
      }

      const payload = {
        updatedAt: new Date().toISOString(),
        activeDatasetId: this.activeDatasetId,
        datasetCount: summaries.length,
        datasets: summaries
      };

      this.atomicWriteFileSync(this.indexFilePath, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('[OfflineDatasetStorage] Failed to persist index to disk:', err);
    }
  }

  /**
   * Get all dataset summaries
   */
  public listDatasets(): ImportedDatasetSummary[] {
    const list: ImportedDatasetSummary[] = [];
    for (const record of this.datasetCache.values()) {
      list.push({
        ...record.metadata,
        isActive: record.id === this.activeDatasetId
      });
    }
    return list.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  }

  /**
   * Retrieve dataset record by ID
   */
  public getDataset(id: string): CanonicalDatasetRecord | null {
    return this.datasetCache.get(id) || null;
  }

  /**
   * Get currently active dataset record
   */
  public getActiveDataset(): CanonicalDatasetRecord | null {
    if (!this.activeDatasetId) {
      const first = Array.from(this.datasetCache.keys())[0];
      if (first) {
        this.activeDatasetId = first;
        this.persistIndex();
      }
    }
    if (!this.activeDatasetId) return null;
    return this.datasetCache.get(this.activeDatasetId) || null;
  }

  /**
   * Set active dataset ID
   */
  public setActiveDatasetId(id: string): boolean {
    if (this.datasetCache.has(id)) {
      this.activeDatasetId = id;
      this.persistIndex();
      return true;
    }
    return false;
  }

  /**
   * Save or update a dataset record atomically to disk (Single-file format for small datasets)
   */
  public saveDataset(record: CanonicalDatasetRecord): void {
    this.datasetCache.set(record.id, record);
    this.activeDatasetId = record.id;

    try {
      const datasetFilePath = path.join(this.datasetsDir, `${record.id}.json`);
      this.atomicWriteFileSync(datasetFilePath, JSON.stringify(record, null, 2));
      this.persistIndex();
    } catch (err) {
      console.error(`[OfflineDatasetStorage] Failed to persist dataset ${record.id} to disk:`, err);
      throw err;
    }
  }

  /**
   * Register a completed folder-based streaming dataset in cache and index
   */
  public saveStreamingDataset(record: CanonicalDatasetRecord): void {
    record.isStreamingDataset = true;
    record.storageMode = 'STREAMING_JSONL';
    if (record.metadata) {
      record.metadata.isStreamingDataset = true;
      record.metadata.storageMode = 'STREAMING_JSONL';
    }
    record.sampleVouchers = (record.vouchers || []).slice(0, 50);
    this.datasetCache.set(record.id, record);
    this.activeDatasetId = record.id;
    this.persistIndex();
  }

  /**
   * Check if dataset is stored as a streaming directory
   */
  public isStreamingDataset(id: string): boolean {
    const dir = path.join(this.datasetsDir, id);
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  }

  /**
   * Get folder path for directory-based dataset
   */
  public getDatasetDir(id: string): string | null {
    const dir = path.join(this.datasetsDir, id);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return dir;
    }
    return null;
  }

  /**
   * Stream vouchers from disk for a dataset (supporting both directory-based .jsonl and single-file .json)
   */
  public async streamVouchers(
    datasetId: string,
    onVoucher: (voucher: CanonicalVoucher) => void | Promise<void>
  ): Promise<number> {
    const dir = path.join(this.datasetsDir, datasetId);
    let count = 0;

    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const vouchersPath = path.join(dir, 'vouchers.jsonl');
      if (!fs.existsSync(vouchersPath)) return 0;

      const fileStream = fs.createReadStream(vouchersPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        if (line.trim()) {
          const v = JSON.parse(line);
          count++;
          const res = onVoucher(v);
          if (res && typeof (res as any).then === 'function') {
            await res;
          }
        }
      }
      return count;
    }

    const singleFilePath = path.join(this.datasetsDir, `${datasetId}.json`);
    if (fs.existsSync(singleFilePath)) {
      const record = JSON.parse(fs.readFileSync(singleFilePath, 'utf8'));
      for (const v of record.vouchers || []) {
        count++;
        const res = onVoucher(v);
        if (res && typeof (res as any).then === 'function') {
          await res;
        }
      }
      return count;
    }

    const memRecord = this.datasetCache.get(datasetId);
    if (memRecord && memRecord.vouchers) {
      for (const v of memRecord.vouchers) {
        count++;
        const res = onVoucher(v);
        if (res && typeof (res as any).then === 'function') {
          await res;
        }
      }
      return count;
    }

    return 0;
  }

  /**
   * Stream voucher lines incrementally from disk
   */
  public async streamVoucherLines(
    datasetId: string,
    onLine: (line: any) => void | Promise<void>
  ): Promise<number> {
    const dir = path.join(this.datasetsDir, datasetId);
    let count = 0;

    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const linesPath = path.join(dir, 'voucher_lines.jsonl');
      if (!fs.existsSync(linesPath)) {
        return this.streamVouchers(datasetId, async (v) => {
          for (const entry of v.entries || []) {
            count++;
            const res = onLine(entry);
            if (res && typeof (res as any).then === 'function') await res;
          }
        });
      }

      const fileStream = fs.createReadStream(linesPath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
      for await (const lineStr of rl) {
        if (lineStr.trim()) {
          count++;
          const l = JSON.parse(lineStr);
          const res = onLine(l);
          if (res && typeof (res as any).then === 'function') await res;
        }
      }
      return count;
    }

    const singleFilePath = path.join(this.datasetsDir, `${datasetId}.json`);
    if (fs.existsSync(singleFilePath)) {
      const record = JSON.parse(fs.readFileSync(singleFilePath, 'utf8'));
      const lines = record.voucherLines || (record.vouchers || []).flatMap((v: any) => v.entries || []);
      for (const l of lines) {
        count++;
        const res = onLine(l);
        if (res && typeof (res as any).then === 'function') await res;
      }
      return count;
    }

    return 0;
  }

  /**
   * Stream audit exceptions incrementally from disk
   */
  public async streamExceptions(
    datasetId: string,
    onException: (exc: CanonicalAuditException) => void | Promise<void>
  ): Promise<number> {
    const dir = path.join(this.datasetsDir, datasetId);
    let count = 0;

    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const excPath = path.join(dir, 'exceptions.jsonl');
      if (!fs.existsSync(excPath)) return 0;

      const fileStream = fs.createReadStream(excPath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (line.trim()) {
          count++;
          const e = JSON.parse(line);
          const res = onException(e);
          if (res && typeof (res as any).then === 'function') await res;
        }
      }
      return count;
    }

    const record = this.getDataset(datasetId);
    if (record && record.exceptions) {
      for (const e of record.exceptions) {
        count++;
        const res = onException(e);
        if (res && typeof (res as any).then === 'function') await res;
      }
    }
    return count;
  }

  /**
   * Calculate aggregates incrementally without loading all vouchers into memory
   */
  public async getDatasetAggregates(datasetId: string): Promise<{
    totalVouchers: number;
    totalDebit: number;
    totalCredit: number;
    balanceDifference: number;
    isBalanced: boolean;
    voucherTypeCounts: Record<string, number>;
    monthlyTotals: Record<string, { count: number; totalDebit: number; totalCredit: number }>;
    topParties: { party: string; amount: number; count: number }[];
    exceptionCount: number;
  }> {
    let totalVouchers = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const voucherTypeCounts: Record<string, number> = {};
    const monthlyTotals: Record<string, { count: number; totalDebit: number; totalCredit: number }> = {};
    const partyMap: Record<string, { amount: number; count: number }> = {};

    await this.streamVouchers(datasetId, (v) => {
      totalVouchers++;
      let dr = 0;
      let cr = 0;
      if (v.entries && v.entries.length > 0) {
        for (const entry of v.entries) {
          const amt = entry.amount || 0;
          if (entry.isDebit === true || entry.direction === 'Debit') {
            dr += amt;
          } else {
            cr += amt;
          }
        }
      } else if (typeof v.totalDebit === 'number' || typeof v.totalCredit === 'number') {
        dr = typeof v.totalDebit === 'number' ? v.totalDebit : (v.amount || 0);
        cr = typeof v.totalCredit === 'number' ? v.totalCredit : (v.amount || 0);
      } else {
        const amt = v.amount || 0;
        dr = amt;
        cr = amt;
      }
      totalDebit += dr;
      totalCredit += cr;

      const type = v.voucherType || 'Other';
      voucherTypeCounts[type] = (voucherTypeCounts[type] || 0) + 1;

      if (v.date) {
        const monthKey = v.date.substring(0, 7);
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { count: 0, totalDebit: 0, totalCredit: 0 };
        }
        monthlyTotals[monthKey].count++;
        monthlyTotals[monthKey].totalDebit += dr;
        monthlyTotals[monthKey].totalCredit += cr;
      }

      if (v.partyLedger) {
        if (!partyMap[v.partyLedger]) {
          partyMap[v.partyLedger] = { amount: 0, count: 0 };
        }
        partyMap[v.partyLedger].amount += dr;
        partyMap[v.partyLedger].count++;
      }
    });

    let exceptionCount = 0;
    await this.streamExceptions(datasetId, () => { exceptionCount++; });

    const topParties = Object.entries(partyMap)
      .map(([party, stat]) => ({ party, amount: stat.amount, count: stat.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);

    const balanceDifference = Math.abs(totalDebit - totalCredit);
    const isBalanced = balanceDifference < 0.01;

    return {
      totalVouchers,
      totalDebit,
      totalCredit,
      balanceDifference,
      isBalanced,
      voucherTypeCounts,
      monthlyTotals,
      topParties,
      exceptionCount
    };
  }

  /**
   * Delete dataset from memory and disk (cleaning up either single file or directory)
   */
  public deleteDataset(id: string): boolean {
    const existed = this.datasetCache.delete(id);
    if (existed) {
      try {
        const datasetFilePath = path.join(this.datasetsDir, `${id}.json`);
        if (fs.existsSync(datasetFilePath)) {
          fs.unlinkSync(datasetFilePath);
        }

        const datasetDirPath = path.join(this.datasetsDir, id);
        if (fs.existsSync(datasetDirPath) && fs.statSync(datasetDirPath).isDirectory()) {
          fs.rmSync(datasetDirPath, { recursive: true, force: true });
        }
      } catch (err) {
        console.warn(`[OfflineDatasetStorage] Failed to delete dataset files for ${id}:`, err);
      }

      if (this.activeDatasetId === id) {
        const remaining = Array.from(this.datasetCache.keys())[0];
        this.activeDatasetId = remaining || null;
      }
      this.persistIndex();
    }
    return existed;
  }

  /**
   * Returns whether storage currently has any datasets loaded
   */
  public hasDatasets(): boolean {
    return this.datasetCache.size > 0;
  }

  public getDatasetsDir(): string {
    return this.datasetsDir;
  }
}
