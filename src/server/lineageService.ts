/**
 * Phase 32H - Lineage Service Engine
 * Complete record, field, query, report traceability graph & search engine.
 */

import {
  ILineageService,
  RecordLineage,
  FieldLineage,
  ReportLineage,
  LineageGraph,
  LineageNode,
  LineageEdge,
  LineageSearchFilter
} from '../types/phase32HOperationalSafety';

export class LineageService implements ILineageService {
  private recordLineages: Map<string, RecordLineage> = new Map(); // warehouseRecordId -> RecordLineage
  private fieldLineages: Map<string, FieldLineage[]> = new Map(); // datasetId -> FieldLineage[]
  private reportLineages: Map<string, ReportLineage> = new Map(); // reportId -> ReportLineage

  constructor() {
    this.seedDefaultFieldAndReportLineages();
  }

  private seedDefaultFieldAndReportLineages() {
    // Seed default Field Lineages for standard financial datasets
    this.fieldLineages.set('canonical-vouchers', [
      {
        fieldLineageId: 'FL-VOUCHER-01',
        datasetId: 'canonical-vouchers',
        sourceField: 'VOUCHERNUMBER',
        canonicalField: 'voucherNumber',
        transformationRuleId: 'TR-TRIM-UPPER',
        warehouseField: 'voucherNumber',
        dataType: 'string',
        isCalculated: false,
        notes: 'Normalized voucher identifier from Tally XML'
      },
      {
        fieldLineageId: 'FL-VOUCHER-02',
        datasetId: 'canonical-vouchers',
        sourceField: 'AMOUNT',
        canonicalField: 'amount',
        transformationRuleId: 'TR-ABS-DECIMAL',
        warehouseField: 'amount',
        dataType: 'number',
        isCalculated: false,
        notes: 'Absolute ledger entry amount normalized from debit/credit signs'
      },
      {
        fieldLineageId: 'FL-VOUCHER-03',
        datasetId: 'canonical-vouchers',
        sourceField: 'PARTYLEDGERNAME',
        canonicalField: 'partyName',
        transformationRuleId: 'TR-CLEAN-STRING',
        warehouseField: 'partyName',
        dataType: 'string',
        isCalculated: false,
        notes: 'Name of the party or counterparty'
      }
    ]);

    this.fieldLineages.set('canonical-ledgers', [
      {
        fieldLineageId: 'FL-LEDGER-01',
        datasetId: 'canonical-ledgers',
        sourceField: 'NAME',
        canonicalField: 'ledgerName',
        transformationRuleId: 'TR-NONE',
        warehouseField: 'ledgerName',
        dataType: 'string',
        isCalculated: false,
        notes: 'Chart of accounts ledger name'
      },
      {
        fieldLineageId: 'FL-LEDGER-02',
        datasetId: 'canonical-ledgers',
        sourceField: 'CLOSINGBALANCE',
        canonicalField: 'closingBalance',
        transformationRuleId: 'TR-NET-BALANCE',
        warehouseField: 'closingBalance',
        dataType: 'number',
        isCalculated: true,
        notes: 'Net calculated closing balance from accumulated ledger transactions'
      }
    ]);

    // Seed default Report Lineage
    this.reportLineages.set('RPT-FIN-001', {
      reportLineageId: 'RL-001',
      reportId: 'RPT-FIN-001',
      reportName: 'Trial Balance & Financial Summary',
      queryId: 'QRY-TB-001',
      queryDefinitionSummary: 'SELECT partyName, SUM(amount) FROM canonical-vouchers GROUP BY partyName',
      datasetIds: ['canonical-vouchers', 'canonical-ledgers'],
      snapshotId: 'SNP-LATEST',
      companyId: 'CMP-001',
      sourceSystems: ['Tally Prime XML Gateway (Read-Only)'],
      lastGeneratedAt: new Date().toISOString()
    });
  }

  public async recordTrace(record: RecordLineage): Promise<void> {
    this.recordLineages.set(record.warehouseRecordId, record);
  }

  public async getRecordLineage(warehouseRecordId: string): Promise<RecordLineage | undefined> {
    return this.recordLineages.get(warehouseRecordId);
  }

  public async getFieldLineage(datasetId: string, warehouseField?: string): Promise<FieldLineage[]> {
    const fields = this.fieldLineages.get(datasetId) || [];
    if (warehouseField) {
      return fields.filter(f => f.warehouseField.toLowerCase() === warehouseField.toLowerCase());
    }
    return fields;
  }

  public async getReportLineage(reportId: string): Promise<ReportLineage | undefined> {
    return this.reportLineages.get(reportId);
  }

  public async searchLineage(filter: LineageSearchFilter): Promise<LineageNode[]> {
    const results: LineageNode[] = [];

    for (const lineage of this.recordLineages.values()) {
      let matches = true;

      if (filter.companyId && lineage.companyId !== filter.companyId) matches = false;
      if (filter.datasetId && lineage.datasetId !== filter.datasetId) matches = false;
      if (filter.sourceId && !lineage.sourceRecordId.toLowerCase().includes(filter.sourceId.toLowerCase())) matches = false;
      if (filter.recordId && !lineage.warehouseRecordId.toLowerCase().includes(filter.recordId.toLowerCase())) matches = false;
      if (filter.snapshotId && lineage.snapshotId !== filter.snapshotId) matches = false;
      if (filter.syncJobId && lineage.syncJobId !== filter.syncJobId) matches = false;

      if (matches) {
        results.push({
          nodeId: `LIN-NODE-${lineage.warehouseRecordId}`,
          type: 'WAREHOUSE_RECORD',
          label: `Record ${lineage.warehouseRecordId} (${lineage.datasetId})`,
          companyId: lineage.companyId,
          datasetId: lineage.datasetId,
          metadata: lineage,
          timestamp: lineage.transformedAt
        });
      }
    }

    return results;
  }

  public async buildLineageGraph(rootId: string, depth: number = 5): Promise<LineageGraph> {
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];

    // Find if root is a record, dataset, report, or company
    const record = this.recordLineages.get(rootId);
    
    if (record) {
      // Build 5-tier lineage tree for specific record
      const compNodeId = `NODE-CMP-${record.companyId}`;
      const sourceNodeId = `NODE-SRC-${record.sourceSystem.replace(/\s+/g, '_')}`;
      const srcDatasetNodeId = `NODE-SRCDS-${record.sourceDataset}`;
      const normNodeId = `NODE-NORM-${record.mappingVersion}`;
      const wrhNodeId = `NODE-WRH-${record.warehouseRecordId}`;
      const snapNodeId = record.snapshotId ? `NODE-SNP-${record.snapshotId}` : `NODE-SNP-LIVE`;
      const reportNodeId = `NODE-RPT-FIN-001`;

      nodes.push(
        { nodeId: compNodeId, type: 'COMPANY', label: `Company: ${record.companyId}`, companyId: record.companyId, metadata: {} },
        { nodeId: sourceNodeId, type: 'SOURCE_SYSTEM', label: `Source: ${record.sourceSystem}`, companyId: record.companyId, metadata: {} },
        { nodeId: srcDatasetNodeId, type: 'SOURCE_DATASET', label: `Dataset: ${record.sourceDataset}`, companyId: record.companyId, metadata: {} },
        { nodeId: normNodeId, type: 'NORMALIZATION_RULE', label: `Map v${record.mappingVersion} / Transform v${record.transformationVersion}`, companyId: record.companyId, metadata: {} },
        { nodeId: wrhNodeId, type: 'WAREHOUSE_RECORD', label: `Wrh Record: ${record.warehouseRecordId}`, companyId: record.companyId, datasetId: record.datasetId, metadata: record },
        { nodeId: snapNodeId, type: 'SNAPSHOT', label: record.snapshotId ? `Snapshot: ${record.snapshotId}` : 'Live Snapshot', companyId: record.companyId, metadata: {} },
        { nodeId: reportNodeId, type: 'REPORT', label: 'Financial Summary Report', companyId: record.companyId, metadata: {} }
      );

      edges.push(
        { edgeId: 'E1', sourceNodeId: compNodeId, targetNodeId: sourceNodeId, relationshipType: 'EXTRACTED_FROM' },
        { edgeId: 'E2', sourceNodeId: sourceNodeId, targetNodeId: srcDatasetNodeId, relationshipType: 'EXTRACTED_FROM' },
        { edgeId: 'E3', sourceNodeId: srcDatasetNodeId, targetNodeId: normNodeId, relationshipType: 'NORMALIZED_BY' },
        { edgeId: 'E4', sourceNodeId: normNodeId, targetNodeId: wrhNodeId, relationshipType: 'TRANSFORMED_BY' },
        { edgeId: 'E5', sourceNodeId: wrhNodeId, targetNodeId: snapNodeId, relationshipType: 'CAPTURED_BY' },
        { edgeId: 'E6', sourceNodeId: snapNodeId, targetNodeId: reportNodeId, relationshipType: 'GENERATED_REPORT' }
      );

      return { nodes, edges, rootNodeId: wrhNodeId };
    }

    // Default macro-level lineage graph
    const cId = rootId.startsWith('CMP-') ? rootId : 'CMP-001';
    const n1 = `MACRO-CMP-${cId}`;
    const n2 = `MACRO-SRC-TALLY`;
    const n3 = `MACRO-CANONICAL-VOUCHERS`;
    const n4 = `MACRO-SNAPSHOT-ACTIVE`;
    const n5 = `MACRO-REPORT-SUMMARY`;

    nodes.push(
      { nodeId: n1, type: 'COMPANY', label: `Company Scope (${cId})`, companyId: cId, metadata: {} },
      { nodeId: n2, type: 'SOURCE_SYSTEM', label: 'Tally Prime XML Engine', companyId: cId, metadata: {} },
      { nodeId: n3, type: 'WAREHOUSE_RECORD', label: 'Canonical Vouchers Dataset', companyId: cId, datasetId: 'canonical-vouchers', metadata: {} },
      { nodeId: n4, type: 'SNAPSHOT', label: 'Active Snapshot (SNP-ACTIVE)', companyId: cId, metadata: {} },
      { nodeId: n5, type: 'REPORT', label: 'Query & Executive Financial Reports', companyId: cId, metadata: {} }
    );

    edges.push(
      { edgeId: 'ME1', sourceNodeId: n1, targetNodeId: n2, relationshipType: 'EXTRACTED_FROM' },
      { edgeId: 'ME2', sourceNodeId: n2, targetNodeId: n3, relationshipType: 'TRANSFORMED_BY' },
      { edgeId: 'ME3', sourceNodeId: n3, targetNodeId: n4, relationshipType: 'CAPTURED_BY' },
      { edgeId: 'ME4', sourceNodeId: n4, targetNodeId: n5, relationshipType: 'GENERATED_REPORT' }
    );

    return { nodes, edges, rootNodeId: n1 };
  }
}

export const lineageService = new LineageService();
