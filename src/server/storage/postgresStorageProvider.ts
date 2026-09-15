/**
 * EXFIN Tally Audit Platform - PostgreSQL Storage Provider
 * Implements IStorageProvider for Cloud / Web Deployments (Render, Railway, Cloud Run).
 * Provides atomic, durable persistence with SQL-level pagination and incremental streaming.
 */

import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
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

export class PostgresStorageProvider implements IStorageProvider {
  public readonly modeName = 'postgres' as const;
  private pool: Pool | null = null;
  private connectionString: string;
  private isConnected = false;
  private localFallbackDir: string;

  constructor(databaseUrl?: string) {
    this.connectionString = databaseUrl || process.env.DATABASE_URL || '';
    this.localFallbackDir = path.join(process.cwd(), 'data', 'offline_datasets');
  }

  public async init(): Promise<void> {
    if (!this.connectionString) {
      throw new Error('DATABASE_URL environment variable is not configured for PostgreSQL storage provider.');
    }

    try {
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });

      // Verify connection
      const client = await this.pool.connect();
      try {
        await this.bootstrapSchema(client);
        this.isConnected = true;
        console.log('[PostgresStorageProvider] Successfully connected to PostgreSQL database and verified schema.');
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[PostgresStorageProvider] Failed to connect to PostgreSQL database:', err.message);
      this.isConnected = false;
      throw err;
    }
  }

  private async bootstrapSchema(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS exfin_datasets (
        id VARCHAR(255) PRIMARY KEY,
        metadata JSONB NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exfin_mappings (
        dataset_id VARCHAR(255) PRIMARY KEY REFERENCES exfin_datasets(id) ON DELETE CASCADE,
        mapping_data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exfin_vouchers (
        id BIGSERIAL PRIMARY KEY,
        dataset_id VARCHAR(255) NOT NULL REFERENCES exfin_datasets(id) ON DELETE CASCADE,
        voucher_id VARCHAR(255),
        voucher_type VARCHAR(100),
        voucher_number VARCHAR(100),
        date VARCHAR(50),
        party_ledger VARCHAR(255),
        amount NUMERIC,
        raw_voucher JSONB NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exfin_vouchers_ds_id ON exfin_vouchers(dataset_id, id);
      CREATE INDEX IF NOT EXISTS idx_exfin_vouchers_type ON exfin_vouchers(dataset_id, voucher_type);

      CREATE TABLE IF NOT EXISTS exfin_voucher_lines (
        id BIGSERIAL PRIMARY KEY,
        dataset_id VARCHAR(255) NOT NULL REFERENCES exfin_datasets(id) ON DELETE CASCADE,
        ledger_name VARCHAR(255),
        amount NUMERIC,
        is_debit BOOLEAN,
        raw_line JSONB NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exfin_vlines_ds_id ON exfin_voucher_lines(dataset_id, id);

      CREATE TABLE IF NOT EXISTS exfin_exceptions (
        id BIGSERIAL PRIMARY KEY,
        dataset_id VARCHAR(255) NOT NULL REFERENCES exfin_datasets(id) ON DELETE CASCADE,
        code VARCHAR(100),
        severity VARCHAR(50),
        title TEXT,
        description TEXT,
        raw_exception JSONB NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exfin_exceptions_ds_id ON exfin_exceptions(dataset_id, id);
      CREATE INDEX IF NOT EXISTS idx_exfin_exceptions_severity ON exfin_exceptions(dataset_id, severity);

      CREATE TABLE IF NOT EXISTS exfin_system_state (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  public isReady(): boolean {
    return this.isConnected && this.pool !== null;
  }

  public getDatasetsDir(): string {
    return this.localFallbackDir;
  }

  public async listDatasets(): Promise<ImportedDatasetSummary[]> {
    if (!this.pool) return [];
    try {
      const res = await this.pool.query(
        `SELECT id, metadata, is_active FROM exfin_datasets ORDER BY (metadata->>'importedAt') DESC`
      );
      return res.rows.map(r => ({
        ...r.metadata,
        isActive: r.is_active
      }));
    } catch (err: any) {
      console.error('[PostgresStorageProvider] listDatasets error:', err);
      return [];
    }
  }

  public async getDataset(id: string): Promise<CanonicalDatasetRecord | null> {
    if (!this.pool) return null;
    try {
      const res = await this.pool.query(
        `SELECT id, metadata, is_active FROM exfin_datasets WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];

      // Fetch sample vouchers (up to 50) for fast preview
      const vRes = await this.pool.query(
        `SELECT raw_voucher FROM exfin_vouchers WHERE dataset_id = $1 ORDER BY id ASC LIMIT 50`,
        [id]
      );
      const sampleVouchers = vRes.rows.map(r => r.raw_voucher);

      // Fetch sample exceptions (up to 50)
      const eRes = await this.pool.query(
        `SELECT raw_exception FROM exfin_exceptions WHERE dataset_id = $1 ORDER BY id ASC LIMIT 50`,
        [id]
      );
      const sampleExceptions = eRes.rows.map(r => r.raw_exception);

      // Fetch mappings
      const mRes = await this.pool.query(
        `SELECT mapping_data FROM exfin_mappings WHERE dataset_id = $1`,
        [id]
      );
      const mappings = mRes.rows.length > 0 ? mRes.rows[0].mapping_data : [];

      const meta = row.metadata;
      return {
        id: row.id,
        metadata: { ...meta, isActive: row.is_active },
        companies: meta.companyName ? [{ name: meta.companyName, financialYearFrom: meta.financialYearFrom, financialYearTo: meta.financialYearTo, id: row.id }] : [],
        groups: [],
        ledgers: [],
        parties: [],
        vouchers: sampleVouchers,
        voucherLines: sampleVouchers.flatMap((v: any) => v.entries || []),
        stockItems: [],
        costCentres: [],
        taxRecords: [],
        bankAccounts: [],
        exceptions: sampleExceptions,
        mappings,
        isStreamingDataset: true,
        storageMode: 'STREAMING_JSONL',
        sampleVouchers
      };
    } catch (err: any) {
      console.error('[PostgresStorageProvider] getDataset error:', err);
      return null;
    }
  }

  public async getActiveDataset(): Promise<CanonicalDatasetRecord | null> {
    if (!this.pool) return null;
    try {
      const stateRes = await this.pool.query(
        `SELECT value FROM exfin_system_state WHERE key = 'active_dataset_id'`
      );
      const activeId = stateRes.rows.length > 0 ? stateRes.rows[0].value?.datasetId : null;
      if (activeId) {
        return this.getDataset(activeId);
      }

      // Fallback to first available active dataset
      const firstRes = await this.pool.query(
        `SELECT id FROM exfin_datasets WHERE is_active = true LIMIT 1`
      );
      if (firstRes.rows.length > 0) {
        return this.getDataset(firstRes.rows[0].id);
      }
      return null;
    } catch (err: any) {
      console.error('[PostgresStorageProvider] getActiveDataset error:', err);
      return null;
    }
  }

  public async setActiveDatasetId(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE exfin_datasets SET is_active = false`);
      const updateRes = await client.query(
        `UPDATE exfin_datasets SET is_active = true, updated_at = NOW() WHERE id = $1`,
        [id]
      );
      await client.query(
        `INSERT INTO exfin_system_state (key, value, updated_at) 
         VALUES ('active_dataset_id', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [JSON.stringify({ datasetId: id })]
      );
      await client.query('COMMIT');
      return (updateRes.rowCount || 0) > 0;
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[PostgresStorageProvider] setActiveDatasetId error:', err);
      return false;
    } finally {
      client.release();
    }
  }

  public async saveDataset(record: CanonicalDatasetRecord): Promise<void> {
    if (!this.pool) return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO exfin_datasets (id, metadata, is_active, updated_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (id) DO UPDATE SET metadata = $2, is_active = true, updated_at = NOW()`,
        [record.id, JSON.stringify(record.metadata)]
      );

      if (record.mappings) {
        await client.query(
          `INSERT INTO exfin_mappings (dataset_id, mapping_data, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (dataset_id) DO UPDATE SET mapping_data = $2, updated_at = NOW()`,
          [record.id, JSON.stringify(record.mappings)]
        );
      }

      await this.setActiveDatasetId(record.id);
      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[PostgresStorageProvider] saveDataset error:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Save a streaming dataset: Inserts metadata and streams vouchers, lines, and exceptions from disk into Postgres
   * using bounded batch insertions (500 records per batch) so memory stays minimal (< 20MB).
   */
  public async saveStreamingDataset(record: CanonicalDatasetRecord, datasetDir?: string): Promise<void> {
    if (!this.pool) return;
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert/Update dataset metadata
      await client.query(
        `INSERT INTO exfin_datasets (id, metadata, is_active, updated_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (id) DO UPDATE SET metadata = $2, is_active = true, updated_at = NOW()`,
        [record.id, JSON.stringify(record.metadata)]
      );

      // 2. Insert Mappings
      if (record.mappings && record.mappings.length > 0) {
        await client.query(
          `INSERT INTO exfin_mappings (dataset_id, mapping_data, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (dataset_id) DO UPDATE SET mapping_data = $2, updated_at = NOW()`,
          [record.id, JSON.stringify(record.mappings)]
        );
      }

      // 3. If a directory is provided, stream JSONL records in batches into PostgreSQL
      const dir = datasetDir || path.join(this.localFallbackDir, 'records', record.id);
      if (fs.existsSync(dir)) {
        const vouchersPath = path.join(dir, 'vouchers.jsonl');
        if (fs.existsSync(vouchersPath)) {
          await this.batchInsertVouchersFromJsonl(client, record.id, vouchersPath);
        }

        const linesPath = path.join(dir, 'voucher_lines.jsonl');
        if (fs.existsSync(linesPath)) {
          await this.batchInsertLinesFromJsonl(client, record.id, linesPath);
        }

        const exceptionsPath = path.join(dir, 'exceptions.jsonl');
        if (fs.existsSync(exceptionsPath)) {
          await this.batchInsertExceptionsFromJsonl(client, record.id, exceptionsPath);
        }
      }

      await client.query('COMMIT');
      await this.setActiveDatasetId(record.id);
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[PostgresStorageProvider] saveStreamingDataset error:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  private async batchInsertVouchersFromJsonl(client: PoolClient, datasetId: string, filePath: string): Promise<void> {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    let batch: CanonicalVoucher[] = [];
    const BATCH_SIZE = 500;

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const v = JSON.parse(line);
        batch.push(v);
        if (batch.length >= BATCH_SIZE) {
          await this.flushVouchersBatch(client, datasetId, batch);
          batch = [];
        }
      } catch (e) {}
    }

    if (batch.length > 0) {
      await this.flushVouchersBatch(client, datasetId, batch);
    }
  }

  private async flushVouchersBatch(client: PoolClient, datasetId: string, items: CanonicalVoucher[]): Promise<void> {
    if (items.length === 0) return;
    const values: any[] = [];
    const rows: string[] = [];

    items.forEach((v, idx) => {
      const offset = idx * 8;
      rows.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
      values.push(
        datasetId,
        v.id || null,
        v.voucherType || 'Other',
        v.voucherNumber || null,
        v.date || null,
        v.partyLedger || null,
        typeof v.amount === 'number' ? v.amount : 0,
        JSON.stringify(v)
      );
    });

    const query = `
      INSERT INTO exfin_vouchers (dataset_id, voucher_id, voucher_type, voucher_number, date, party_ledger, amount, raw_voucher)
      VALUES ${rows.join(', ')}
    `;
    await client.query(query, values);
  }

  private async batchInsertLinesFromJsonl(client: PoolClient, datasetId: string, filePath: string): Promise<void> {
    const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
    let batch: any[] = [];
    const BATCH_SIZE = 500;

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const l = JSON.parse(line);
        batch.push(l);
        if (batch.length >= BATCH_SIZE) {
          await this.flushLinesBatch(client, datasetId, batch);
          batch = [];
        }
      } catch (e) {}
    }

    if (batch.length > 0) {
      await this.flushLinesBatch(client, datasetId, batch);
    }
  }

  private async flushLinesBatch(client: PoolClient, datasetId: string, items: any[]): Promise<void> {
    if (items.length === 0) return;
    const values: any[] = [];
    const rows: string[] = [];

    items.forEach((l, idx) => {
      const offset = idx * 5;
      rows.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
      values.push(
        datasetId,
        l.ledgerName || null,
        typeof l.amount === 'number' ? l.amount : 0,
        l.isDebit === true || l.direction === 'Debit',
        JSON.stringify(l)
      );
    });

    const query = `
      INSERT INTO exfin_voucher_lines (dataset_id, ledger_name, amount, is_debit, raw_line)
      VALUES ${rows.join(', ')}
    `;
    await client.query(query, values);
  }

  private async batchInsertExceptionsFromJsonl(client: PoolClient, datasetId: string, filePath: string): Promise<void> {
    const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
    let batch: CanonicalAuditException[] = [];
    const BATCH_SIZE = 500;

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        batch.push(e);
        if (batch.length >= BATCH_SIZE) {
          await this.flushExceptionsBatch(client, datasetId, batch);
          batch = [];
        }
      } catch (e) {}
    }

    if (batch.length > 0) {
      await this.flushExceptionsBatch(client, datasetId, batch);
    }
  }

  private async flushExceptionsBatch(client: PoolClient, datasetId: string, items: CanonicalAuditException[]): Promise<void> {
    if (items.length === 0) return;
    const values: any[] = [];
    const rows: string[] = [];

    items.forEach((e, idx) => {
      const offset = idx * 6;
      const eAny = e as any;
      rows.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      values.push(
        datasetId,
        e.exceptionType || eAny.code || null,
        e.risk || eAny.severity || 'LOW',
        e.exceptionType || eAny.title || null,
        e.reason || eAny.description || null,
        JSON.stringify(e)
      );
    });

    const query = `
      INSERT INTO exfin_exceptions (dataset_id, code, severity, title, description, raw_exception)
      VALUES ${rows.join(', ')}
    `;
    await client.query(query, values);
  }

  /**
   * SQL-level bounded pagination for audit exceptions
   */
  public async getExceptionsPaginated(
    datasetId: string,
    page: number,
    limit: number,
    filters?: { search?: string; severity?: string; type?: string }
  ): Promise<ExceptionPaginationResult> {
    if (!this.pool) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 500);
    const offset = (safePage - 1) * safeLimit;

    const whereClauses: string[] = ['dataset_id = $1'];
    const params: any[] = [datasetId];

    if (filters?.severity) {
      params.push(filters.severity.toUpperCase());
      whereClauses.push(`severity = $${params.length}`);
    }

    if (filters?.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      whereClauses.push(`(LOWER(title) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(code) LIKE $${params.length})`);
    }

    const whereSql = whereClauses.join(' AND ');

    // 1. Total count
    const countRes = await this.pool.query(
      `SELECT COUNT(*)::int as total FROM exfin_exceptions WHERE ${whereSql}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // 2. Paginated rows
    params.push(safeLimit);
    params.push(offset);
    const rowsRes = await this.pool.query(
      `SELECT raw_exception FROM exfin_exceptions WHERE ${whereSql} ORDER BY id ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const items: CanonicalAuditException[] = rowsRes.rows.map(r => r.raw_exception);
    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages
    };
  }

  /**
   * SQL-level bounded pagination for vouchers
   */
  public async getVouchersPaginated(
    datasetId: string,
    page: number,
    limit: number,
    filters?: { search?: string; voucherType?: string }
  ): Promise<VoucherPaginationResult> {
    if (!this.pool) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 500);
    const offset = (safePage - 1) * safeLimit;

    const whereClauses: string[] = ['dataset_id = $1'];
    const params: any[] = [datasetId];

    if (filters?.voucherType) {
      params.push(filters.voucherType);
      whereClauses.push(`voucher_type ILIKE $${params.length}`);
    }

    if (filters?.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      whereClauses.push(`(LOWER(voucher_number) LIKE $${params.length} OR LOWER(party_ledger) LIKE $${params.length})`);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRes = await this.pool.query(
      `SELECT COUNT(*)::int as total FROM exfin_vouchers WHERE ${whereSql}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    params.push(safeLimit);
    params.push(offset);
    const rowsRes = await this.pool.query(
      `SELECT raw_voucher FROM exfin_vouchers WHERE ${whereSql} ORDER BY id ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const items: CanonicalVoucher[] = rowsRes.rows.map(r => r.raw_voucher);
    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      items,
      total,
      matchedCount: total,
      page: safePage,
      limit: safeLimit,
      totalPages
    };
  }

  /**
   * Keyset-based streaming for vouchers (never loads all into RAM)
   */
  public async streamVouchers(
    datasetId: string,
    onVoucher: (voucher: CanonicalVoucher) => void | Promise<void>
  ): Promise<number> {
    if (!this.pool) return 0;
    let count = 0;
    let lastId = 0;
    const CHUNK_SIZE = 500;

    while (true) {
      const res = await this.pool.query(
        `SELECT id, raw_voucher FROM exfin_vouchers 
         WHERE dataset_id = $1 AND id > $2 
         ORDER BY id ASC LIMIT $3`,
        [datasetId, lastId, CHUNK_SIZE]
      );

      if (res.rows.length === 0) break;

      for (const row of res.rows) {
        count++;
        lastId = row.id;
        const p = onVoucher(row.raw_voucher);
        if (p && typeof (p as any).then === 'function') {
          await p;
        }
      }

      if (res.rows.length < CHUNK_SIZE) break;
    }

    return count;
  }

  /**
   * Keyset-based streaming for voucher lines
   */
  public async streamVoucherLines(
    datasetId: string,
    onLine: (line: any) => void | Promise<void>
  ): Promise<number> {
    if (!this.pool) return 0;
    let count = 0;
    let lastId = 0;
    const CHUNK_SIZE = 500;

    while (true) {
      const res = await this.pool.query(
        `SELECT id, raw_line FROM exfin_voucher_lines 
         WHERE dataset_id = $1 AND id > $2 
         ORDER BY id ASC LIMIT $3`,
        [datasetId, lastId, CHUNK_SIZE]
      );

      if (res.rows.length === 0) break;

      for (const row of res.rows) {
        count++;
        lastId = row.id;
        const p = onLine(row.raw_line);
        if (p && typeof (p as any).then === 'function') {
          await p;
        }
      }

      if (res.rows.length < CHUNK_SIZE) break;
    }

    return count;
  }

  /**
   * Keyset-based streaming for audit exceptions
   */
  public async streamExceptions(
    datasetId: string,
    onException: (exc: CanonicalAuditException) => void | Promise<void>
  ): Promise<number> {
    if (!this.pool) return 0;
    let count = 0;
    let lastId = 0;
    const CHUNK_SIZE = 500;

    while (true) {
      const res = await this.pool.query(
        `SELECT id, raw_exception FROM exfin_exceptions 
         WHERE dataset_id = $1 AND id > $2 
         ORDER BY id ASC LIMIT $3`,
        [datasetId, lastId, CHUNK_SIZE]
      );

      if (res.rows.length === 0) break;

      for (const row of res.rows) {
        count++;
        lastId = row.id;
        const p = onException(row.raw_exception);
        if (p && typeof (p as any).then === 'function') {
          await p;
        }
      }

      if (res.rows.length < CHUNK_SIZE) break;
    }

    return count;
  }

  public async getDatasetAggregates(datasetId: string): Promise<DatasetAggregatesResult> {
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

  public async deleteDataset(id: string): Promise<boolean> {
    if (!this.pool) return false;
    try {
      const res = await this.pool.query(`DELETE FROM exfin_datasets WHERE id = $1`, [id]);
      return (res.rowCount || 0) > 0;
    } catch (err: any) {
      console.error('[PostgresStorageProvider] deleteDataset error:', err);
      return false;
    }
  }

  public async hasDatasets(): Promise<boolean> {
    if (!this.pool) return false;
    try {
      const res = await this.pool.query(`SELECT COUNT(*)::int as count FROM exfin_datasets`);
      return (res.rows[0]?.count || 0) > 0;
    } catch (err) {
      return false;
    }
  }
}
