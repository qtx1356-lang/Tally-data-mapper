/**
 * EXFIN Tally Audit Platform - Storage Provider Abstraction Types
 * Supports both Local Disk (Desktop/Electron) and PostgreSQL (Cloud/Web).
 */

import {
  CanonicalDatasetRecord,
  CanonicalVoucher,
  CanonicalAuditException,
  ImportedDatasetSummary
} from '../../types/offlineDataImport';

export interface ExceptionPaginationResult {
  items: CanonicalAuditException[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoucherPaginationResult {
  items: CanonicalVoucher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  matchedCount?: number;
}

export interface DatasetAggregatesResult {
  totalVouchers: number;
  totalDebit: number;
  totalCredit: number;
  balanceDifference: number;
  isBalanced: boolean;
  voucherTypeCounts: Record<string, number>;
  monthlyTotals: Record<string, { count: number; totalDebit: number; totalCredit: number }>;
  topParties: { party: string; amount: number; count: number }[];
  exceptionCount: number;
}

export interface IStorageProvider {
  readonly modeName: 'local' | 'postgres';

  init(): Promise<void>;
  listDatasets(): Promise<ImportedDatasetSummary[]>;
  getDataset(id: string): Promise<CanonicalDatasetRecord | null>;
  getActiveDataset(): Promise<CanonicalDatasetRecord | null>;
  setActiveDatasetId(id: string): Promise<boolean>;
  saveDataset(record: CanonicalDatasetRecord): Promise<void>;
  saveStreamingDataset(record: CanonicalDatasetRecord, datasetDir?: string): Promise<void>;

  streamVouchers(
    datasetId: string,
    onVoucher: (voucher: CanonicalVoucher) => void | Promise<void>
  ): Promise<number>;

  streamVoucherLines(
    datasetId: string,
    onLine: (line: any) => void | Promise<void>
  ): Promise<number>;

  streamExceptions(
    datasetId: string,
    onException: (exc: CanonicalAuditException) => void | Promise<void>
  ): Promise<number>;

  getExceptionsPaginated(
    datasetId: string,
    page: number,
    limit: number,
    filters?: { search?: string; severity?: string; type?: string }
  ): Promise<ExceptionPaginationResult>;

  getVouchersPaginated(
    datasetId: string,
    page: number,
    limit: number,
    filters?: { search?: string; voucherType?: string }
  ): Promise<VoucherPaginationResult>;

  getDatasetAggregates(datasetId: string): Promise<DatasetAggregatesResult>;
  deleteDataset(id: string): Promise<boolean>;
  hasDatasets(): Promise<boolean>;
  getDatasetsDir(): string;
  isReady(): boolean;
}
