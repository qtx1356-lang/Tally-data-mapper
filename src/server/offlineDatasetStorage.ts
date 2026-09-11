/**
 * EXFIN Tally Data Mapper - Persistent Offline Dataset Storage Layer
 * 
 * Provides atomic, persistent local storage on disk for Electron / Desktop environments.
 * Persists datasets, metadata, ledgers, vouchers, voucher lines, exceptions, mappings, and source traceability.
 * Ensures datasets remain available across application and system restarts without re-importing.
 */

import fs from 'fs';
import path from 'path';
import { 
  CanonicalDatasetRecord, 
  ImportedDatasetSummary 
} from '../types/offlineDataImport';

export class OfflineDatasetStorage {
  private baseDir: string;
  private datasetsDir: string;
  private indexFilePath: string;
  private isInitialized = false;

  // In-memory cache for ultra-fast query performance, synchronized with disk
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
   * Load index and all stored datasets from local disk
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

      const datasetFiles = fs.readdirSync(this.datasetsDir);
      for (const file of datasetFiles) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.datasetsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const record: CanonicalDatasetRecord = JSON.parse(content);
            if (record && record.id) {
              this.datasetCache.set(record.id, record);
            }
          } catch (fileErr) {
            console.warn(`[OfflineDatasetStorage] Failed to read dataset file ${file}:`, fileErr);
          }
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
   * Retrieve full dataset record by ID
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
   * Save or update a dataset record atomically to disk
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
   * Delete dataset from memory and disk
   */
  public deleteDataset(id: string): boolean {
    const existed = this.datasetCache.delete(id);
    if (existed) {
      try {
        const datasetFilePath = path.join(this.datasetsDir, `${id}.json`);
        if (fs.existsSync(datasetFilePath)) {
          fs.unlinkSync(datasetFilePath);
        }
      } catch (err) {
        console.warn(`[OfflineDatasetStorage] Failed to delete dataset file for ${id}:`, err);
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
}
