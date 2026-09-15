/**
 * EXFIN Tally Audit Platform - Local Filesystem Storage Provider
 * Implements IStorageProvider for Desktop / Electron and local development.
 */

import { OfflineDatasetStorage } from '../offlineDatasetStorage';
import {
  CanonicalDatasetRecord,
  CanonicalVoucher,
  CanonicalAuditException,
  ImportedDatasetSummary
} from '../../types/offlineDataImport';
import {
  IStorageProvider,
  ExceptionPaginationResult,
  VoucherPaginationResult,
  DatasetAggregatesResult
} from './storageTypes';

export class LocalStorageProvider implements IStorageProvider {
  public readonly modeName = 'local' as const;
  private underlyingStorage: OfflineDatasetStorage;

  constructor(customStorageDir?: string) {
    this.underlyingStorage = new OfflineDatasetStorage(customStorageDir);
  }

  public async init(): Promise<void> {
    this.underlyingStorage.init();
  }

  public isReady(): boolean {
    return true;
  }

  public getDatasetsDir(): string {
    return this.underlyingStorage.getDatasetsDir();
  }

  public async listDatasets(): Promise<ImportedDatasetSummary[]> {
    return this.underlyingStorage.listDatasets();
  }

  public async getDataset(id: string): Promise<CanonicalDatasetRecord | null> {
    return this.underlyingStorage.getDataset(id);
  }

  public async getActiveDataset(): Promise<CanonicalDatasetRecord | null> {
    return this.underlyingStorage.getActiveDataset();
  }

  public async setActiveDatasetId(id: string): Promise<boolean> {
    return this.underlyingStorage.setActiveDatasetId(id);
  }

  public async saveDataset(record: CanonicalDatasetRecord): Promise<void> {
    this.underlyingStorage.saveDataset(record);
  }

  public async saveStreamingDataset(record: CanonicalDatasetRecord): Promise<void> {
    this.underlyingStorage.saveStreamingDataset(record);
  }

  public async streamVouchers(
    datasetId: string,
    onVoucher: (voucher: CanonicalVoucher) => void | Promise<void>
  ): Promise<number> {
    return this.underlyingStorage.streamVouchers(datasetId, onVoucher);
  }

  public async streamVoucherLines(
    datasetId: string,
    onLine: (line: any) => void | Promise<void>
  ): Promise<number> {
    return this.underlyingStorage.streamVoucherLines(datasetId, onLine);
  }

  public async streamExceptions(
    datasetId: string,
    onException: (exc: CanonicalAuditException) => void | Promise<void>
  ): Promise<number> {
    return this.underlyingStorage.streamExceptions(datasetId, onException);
  }

  /**
   * Bounded streaming pagination for exceptions without loading whole arrays in RAM
   */
  public async getExceptionsPaginated(
    datasetId: string,
    page: number,
    limit: number,
    filters?: { search?: string; severity?: string; type?: string }
  ): Promise<ExceptionPaginationResult> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 500);
    const startIdx = (safePage - 1) * safeLimit;

    const search = (filters?.search || '').toLowerCase().trim();
    const severity = (filters?.severity || '').toLowerCase().trim();
    const typeFilter = (filters?.type || '').toLowerCase().trim();

    const items: CanonicalAuditException[] = [];
    let matchedCount = 0;

    await this.streamExceptions(datasetId, (exc) => {
      let matches = true;
      const excAny = exc as any;
      const excRisk = (exc.risk || excAny.severity || '').toLowerCase();
      const excType = (exc.exceptionType || excAny.type || excAny.ruleCategory || '').toLowerCase();
      
      if (severity && excRisk !== severity) {
        matches = false;
      }
      if (matches && typeFilter && excType !== typeFilter) {
        matches = false;
      }
      if (matches && search) {
        const str = `${exc.exceptionType || excAny.title || ''} ${exc.reason || excAny.description || ''} ${exc.voucherNo || excAny.voucherNumber || ''} ${exc.ledger || excAny.ledgerName || ''}`.toLowerCase();
        if (!str.includes(search)) {
          matches = false;
        }
      }

      if (matches) {
        if (matchedCount >= startIdx && items.length < safeLimit) {
          items.push(exc);
        }
        matchedCount++;
      }
    });

    const totalPages = Math.ceil(matchedCount / safeLimit) || 1;

    return {
      items,
      total: matchedCount,
      page: safePage,
      limit: safeLimit,
      totalPages
    };
  }

  /**
   * Bounded streaming pagination for vouchers without loading all into RAM
   */
  public async getVouchersPaginated(
    datasetId: string,
    page: number,
    limit: number,
    filters?: { search?: string; voucherType?: string }
  ): Promise<VoucherPaginationResult> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 500);
    const startIdx = (safePage - 1) * safeLimit;

    const search = (filters?.search || '').toLowerCase().trim();
    const typeFilter = (filters?.voucherType || '').toLowerCase().trim();

    const items: CanonicalVoucher[] = [];
    let totalCount = 0;
    let matchedCount = 0;

    await this.streamVouchers(datasetId, (v) => {
      totalCount++;
      let matches = true;
      if (typeFilter && (v.voucherType || '').toLowerCase() !== typeFilter) {
        matches = false;
      }
      if (matches && search) {
        const str = `${v.voucherNumber || ''} ${v.partyLedger || ''} ${v.narration || ''} ${v.amount || ''}`.toLowerCase();
        if (!str.includes(search)) {
          matches = false;
        }
      }

      if (matches) {
        if (matchedCount >= startIdx && items.length < safeLimit) {
          items.push(v);
        }
        matchedCount++;
      }
    });

    const totalPages = Math.ceil(matchedCount / safeLimit) || 1;

    return {
      items,
      total: totalCount,
      matchedCount,
      page: safePage,
      limit: safeLimit,
      totalPages
    };
  }

  public async getDatasetAggregates(datasetId: string): Promise<DatasetAggregatesResult> {
    return this.underlyingStorage.getDatasetAggregates(datasetId);
  }

  public async deleteDataset(id: string): Promise<boolean> {
    return this.underlyingStorage.deleteDataset(id);
  }

  public async hasDatasets(): Promise<boolean> {
    return this.underlyingStorage.hasDatasets();
  }

  public getUnderlying(): OfflineDatasetStorage {
    return this.underlyingStorage;
  }
}
