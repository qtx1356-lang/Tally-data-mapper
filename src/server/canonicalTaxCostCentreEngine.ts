/**
 * Phase 32C: Canonical Tax and Cost Centre Engine
 * Handles:
 * - CanonicalTaxEntity (Dynamic country-neutral tax categories, rates, jurisdictions, registrations)
 * - CanonicalTaxTransaction (Taxable value, tax amount, rate, components like CGST/SGST/IGST/VAT/WHT, links to Voucher, Line, Party, Ledger, Stock Item)
 * - CanonicalCostCentreCategory & CanonicalCostCentre (Parent-child hierarchy, circular check)
 * - Phase 31 Graph integration & Phase 32A Data Catalog dataset registration
 */

import {
  CanonicalTaxEntity,
  CanonicalTaxTransaction,
  CanonicalCostCentreCategory,
  CanonicalCostCentre,
  PreservedMonetaryValue,
  HierarchyIntegrityIssue,
  ExtensionField,
  DatasetMetadata,
  SchemaRegistryItem
} from '../types/phase32UniversalModel';
import { universalDataModelEngine } from './universalDataModelEngine';
import { GraphNode, GraphEdge } from '../types/phase31ObjectGraph';

export class CanonicalTaxCostCentreEngine {
  private taxEntities: Map<string, CanonicalTaxEntity> = new Map();
  private taxTransactions: Map<string, CanonicalTaxTransaction> = new Map();
  private costCentreCategories: Map<string, CanonicalCostCentreCategory> = new Map();
  private costCentres: Map<string, CanonicalCostCentre> = new Map();

  constructor() {
    this.registerTaxAndCostCentreDatasets();
    this.seedInitialTaxAndCostCentres();
  }

  // =========================================================================
  // 1. DATA CATALOG & SCHEMA REGISTRY INITIALIZATION (Phase 32A Integration)
  // =========================================================================

  private registerTaxAndCostCentreDatasets() {
    const now = '2026-03-08T08:00:00Z';
    const companies = ['CMP-001', 'CMP-002'];

    for (const companyId of companies) {
      // 1. Tax Entities Dataset
      const dsTax: DatasetMetadata = {
        datasetId: `ds-canonical-taxentities-${companyId}`,
        name: `Tax Entities Master (${companyId})`,
        displayName: `Tax - Dynamic Tax Classifications`,
        category: 'Tax',
        companyId,
        source: 'Tally Tax Master Gateway',
        sourceObject: 'TAXCLASSIFICATION',
        schemaVersion: 1,
        grain: 'TaxEntity',
        status: 'Active',
        description: 'Dynamic tax types, statutory schedules, rates, and jurisdiction registrations.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsTax);

      // 2. Tax Transactions Dataset
      const dsTaxTrx: DatasetMetadata = {
        datasetId: `ds-canonical-taxtransactions-${companyId}`,
        name: `Tax Transactions Register (${companyId})`,
        displayName: `Tax - Tax Debits/Credits & Component Breakdowns`,
        category: 'Tax',
        companyId,
        source: 'Tally Tax Accounting Lines',
        sourceObject: 'TAXENTRY',
        schemaVersion: 1,
        grain: 'TaxTransaction (One row per source tax transaction/event)',
        status: 'Active',
        description: 'Tax amount distributions, taxable bases, and component allocations.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsTaxTrx);

      // 3. Cost Centre Categories Dataset
      const dsCCCat: DatasetMetadata = {
        datasetId: `ds-canonical-costcentrecategories-${companyId}`,
        name: `Cost Centre Categories (${companyId})`,
        displayName: `Management - Cost Centre Classifications`,
        category: 'CostCentre',
        companyId,
        source: 'Tally Cost Category Master',
        sourceObject: 'COSTCATEGORY',
        schemaVersion: 1,
        grain: 'CostCategory',
        status: 'Active',
        description: 'Organizational dimensions and cost segmentations.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsCCCat);

      // 4. Cost Centres Dataset
      const dsCC: DatasetMetadata = {
        datasetId: `ds-canonical-costcentres-${companyId}`,
        name: `Cost Centres Master (${companyId})`,
        displayName: `Management - Cost Centres Hierarchy`,
        category: 'CostCentre',
        companyId,
        source: 'Tally Cost Centre Master',
        sourceObject: 'COSTCENTRE',
        schemaVersion: 1,
        grain: 'CostCentre (One row per source cost-centre identity)',
        status: 'Active',
        description: 'Analytical cost units, project codes, departments, and allocation branches.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsCC);
    }
  }

  // =========================================================================
  // 2. NORMALIZERS
  // =========================================================================

  public normalizeTaxEntity(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalTaxEntity {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.taxId || raw.guid || raw.sourceId || raw.name || `TAX-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();
    const type = String(raw.type || raw.taxType || 'Direct/Indirect Tax').trim();
    const rate = raw.rate !== undefined ? this.parseAmount(raw.rate) : undefined;
    const registration = raw.registration || raw.gstin || raw.pan || undefined;

    const taxId = `tax-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['taxid', 'guid', 'sourceid', 'name', 'type', 'taxtype', 'rate', 'registration', 'gstin', 'pan', 'jurisdiction', 'ledgerid', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `TAXCLASSIFICATION.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Tax Master XML',
          confidence: 'High',
          semanticMeaning: 'Preserved tax entity attribute',
          discoveredAt: now
        });
      }
    }

    const entity: CanonicalTaxEntity = {
      taxId,
      sourceId,
      name,
      type,
      rate,
      registration,
      jurisdiction: raw.jurisdiction || 'National/State',
      ledgerId: raw.ledgerId ? String(raw.ledgerId).trim() : undefined,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Tax Master XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-taxentities-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.taxEntities.set(taxId, entity);
    return entity;
  }

  public normalizeTaxTransaction(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalTaxTransaction {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.taxTransactionId || raw.guid || raw.sourceId || `TAXTRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`).trim();
    const voucherId = String(raw.voucherId || '').trim();
    const taxId = String(raw.taxId || raw.taxClassificationId || '').trim();
    const taxName = String(raw.taxName || raw.name || taxId).trim();
    const taxComponent = String(raw.taxComponent || raw.component || 'General Tax').trim();

    const taxableVal = this.parseAmount(raw.taxableValue);
    const taxAmountVal = this.parseAmount(raw.taxAmount || raw.amount);
    const taxRate = raw.taxRate !== undefined ? this.parseAmount(raw.taxRate) : undefined;

    const taxableValue: PreservedMonetaryValue = {
      originalValue: raw.taxableValue,
      normalizedValue: taxableVal,
      originalCurrency: raw.currency || 'INR'
    };
    const taxAmount: PreservedMonetaryValue = {
      originalValue: raw.taxAmount || raw.amount,
      normalizedValue: taxAmountVal,
      originalCurrency: raw.currency || 'INR'
    };

    const taxTransactionId = `taxtrx-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['taxtransactionid', 'guid', 'sourceid', 'voucherid', 'voucherlineid', 'taxid', 'taxname', 'taxablevalue', 'taxamount', 'amount', 'taxrate', 'taxcomponent', 'component', 'partyid', 'partyname', 'ledgerid', 'stockitemid', 'companyid', 'source', 'currency']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `TAXENTRY.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Tax Voucher XML',
          confidence: 'High',
          semanticMeaning: 'Preserved tax transaction attribute',
          discoveredAt: now
        });
      }
    }

    const transaction: CanonicalTaxTransaction = {
      taxTransactionId,
      voucherId,
      voucherLineId: raw.voucherLineId ? String(raw.voucherLineId).trim() : undefined,
      taxId,
      taxName,
      taxableValue,
      taxAmount,
      taxRate,
      taxComponent,
      partyId: raw.partyId ? String(raw.partyId).trim() : undefined,
      partyName: raw.partyName || undefined,
      ledgerId: raw.ledgerId ? String(raw.ledgerId).trim() : undefined,
      stockItemId: raw.stockItemId ? String(raw.stockItemId).trim() : undefined,
      companyId,
      sourceId,
      source: raw.source || options.sourceReport || 'Tally Tax Voucher XML',
      schemaVersion: 1,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-taxtransactions-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.taxTransactions.set(taxTransactionId, transaction);
    return transaction;
  }

  public normalizeCostCentreCategory(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalCostCentreCategory {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.categoryId || raw.guid || raw.sourceId || raw.name || `CCCAT-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();

    const categoryId = `cccat-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['categoryid', 'guid', 'sourceid', 'name', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `COSTCATEGORY.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Cost Category XML',
          confidence: 'High',
          semanticMeaning: 'Preserved cost category attribute',
          discoveredAt: now
        });
      }
    }

    const cat: CanonicalCostCentreCategory = {
      categoryId,
      sourceId,
      name,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Cost Category XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-costcentrecategories-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.costCentreCategories.set(categoryId, cat);
    return cat;
  }

  public normalizeCostCentre(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalCostCentre {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.costCentreId || raw.guid || raw.sourceId || raw.name || `CC-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();
    const parentId = raw.parentId || raw.parentCostCentre || raw.parent || undefined;
    const categoryId = raw.categoryId || raw.category || undefined;

    const costCentreId = `cc-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['costcentreid', 'guid', 'sourceid', 'name', 'parentid', 'parentcostcentre', 'parent', 'categoryid', 'category', 'categoryname', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `COSTCENTRE.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Cost Centre XML',
          confidence: 'High',
          semanticMeaning: 'Preserved cost centre attribute',
          discoveredAt: now
        });
      }
    }

    const cc: CanonicalCostCentre = {
      costCentreId,
      sourceId,
      name,
      parentId: parentId ? String(parentId).trim() : undefined,
      parentName: parentId ? String(parentId).trim() : undefined,
      categoryId: categoryId ? String(categoryId).trim() : undefined,
      categoryName: raw.categoryName || (categoryId ? String(categoryId).trim() : undefined),
      companyId,
      source: raw.source || options.sourceReport || 'Tally Cost Centre XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-costcentres-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.costCentres.set(costCentreId, cc);
    return cc;
  }

  // =========================================================================
  // 3. REPOSITORY ACCESSORS & INTEGRITY
  // =========================================================================

  public getTaxEntities(companyId: string): CanonicalTaxEntity[] {
    return Array.from(this.taxEntities.values()).filter((t) => t.companyId === companyId && t.isCurrent);
  }

  public getTaxTransactions(companyId: string, voucherId?: string): CanonicalTaxTransaction[] {
    let list = Array.from(this.taxTransactions.values()).filter((t) => t.companyId === companyId);
    if (voucherId) list = list.filter((t) => t.voucherId === voucherId);
    return list;
  }

  public getCostCentreCategories(companyId: string): CanonicalCostCentreCategory[] {
    return Array.from(this.costCentreCategories.values()).filter((c) => c.companyId === companyId && c.isCurrent);
  }

  public getCostCentres(companyId: string): CanonicalCostCentre[] {
    return Array.from(this.costCentres.values()).filter((c) => c.companyId === companyId && c.isCurrent);
  }

  public detectTaxCostCentreIntegrityIssues(companyId: string): HierarchyIntegrityIssue[] {
    const issues: HierarchyIntegrityIssue[] = [];
    const ccs = this.getCostCentres(companyId);

    // 1. Cost Centre Missing Parent
    for (const cc of ccs) {
      if (cc.parentId) {
        const parentExists = ccs.some((p) => p.name.toLowerCase() === cc.parentId?.toLowerCase() || p.costCentreId === cc.parentId);
        if (!parentExists) {
          issues.push({
            issueId: `ISS-CC-ORPHAN-${cc.costCentreId}`,
            type: 'MissingParent',
            severity: 'Warning',
            targetEntity: 'CostCentre',
            targetId: cc.costCentreId,
            companyId,
            description: `Cost Centre '${cc.name}' references non-existent parent '${cc.parentId}'.`,
            detectedAt: new Date().toISOString()
          });
        }
      }
    }

    // 2. Circular Cost Centre Hierarchy Check
    for (const cc of ccs) {
      const visited = new Set<string>();
      let curr = cc;
      let isCycle = false;
      while (curr && curr.parentId) {
        if (visited.has(curr.costCentreId)) {
          isCycle = true;
          break;
        }
        visited.add(curr.costCentreId);
        const parent = ccs.find((p) => p.name.toLowerCase() === curr.parentId?.toLowerCase() || p.costCentreId === curr.parentId);
        if (!parent) break;
        curr = parent;
      }
      if (isCycle) {
        issues.push({
          issueId: `ISS-CC-CYCLE-${cc.costCentreId}`,
          type: 'CircularHierarchy',
          severity: 'Critical',
          targetEntity: 'CostCentre',
          targetId: cc.costCentreId,
          companyId,
          description: `Circular hierarchy detected in Cost Centre '${cc.name}'.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    return issues;
  }

  // =========================================================================
  // 4. PHASE 31 GRAPH INTEGRATION
  // =========================================================================

  public syncTaxAndCostCentresWithGraph(companyId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const now = new Date().toISOString();

    // 1. Tax Entities
    const taxes = this.getTaxEntities(companyId);
    for (const t of taxes) {
      nodes.push({
        nodeId: `node-tax-${t.taxId}`,
        nodeType: 'TaxEntity' as any,
        sourceId: t.sourceId,
        companyId,
        name: t.name,
        displayName: `${t.name} (${t.rate ? t.rate + '%' : t.type})`,
        status: 'Active',
        source: t.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: t.validFrom,
        lastSeen: now,
        metadata: { type: t.type, rate: t.rate, registration: t.registration }
      });
    }

    // 2. Tax Transactions
    const taxTrxs = this.getTaxTransactions(companyId);
    for (const tt of taxTrxs) {
      const trxNodeId = `node-taxtrx-${tt.taxTransactionId}`;
      nodes.push({
        nodeId: trxNodeId,
        nodeType: 'TaxTransaction' as any,
        sourceId: tt.sourceId,
        companyId,
        name: `${tt.taxComponent} for ${tt.taxName}`,
        displayName: `${tt.taxComponent}: ₹${tt.taxAmount.normalizedValue} (Base: ₹${tt.taxableValue.normalizedValue})`,
        status: 'Active',
        source: tt.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: now,
        lastSeen: now,
        metadata: { voucherId: tt.voucherId, taxComponent: tt.taxComponent, taxAmount: tt.taxAmount.normalizedValue }
      });

      // Link TaxTransaction -> TaxEntity
      const targetTax = taxes.find((t) => t.taxId === tt.taxId || t.name.toLowerCase() === tt.taxName.toLowerCase());
      if (targetTax) {
        edges.push({
          edgeId: `edge-taxtrx-tax-${tt.taxTransactionId}`,
          fromNode: trxNodeId,
          toNode: `node-tax-${targetTax.taxId}`,
          relationshipType: 'APPLIES_TAX' as any,
          origin: 'Direct',
          confidence: 'High',
          confidenceScore: 1.0,
          source: 'Tax Calculation',
          evidence: { sourceField: 'TAXENTRY.TAXNAME', sourceRecord: tt.sourceId, sourceReport: 'TaxMaster', extraction: 'Phase 32C', reason: 'Tax transaction calculates tax under Tax Entity' },
          createdAt: now
        });
      }
    }

    // 3. Cost Centre Categories
    const categories = this.getCostCentreCategories(companyId);
    for (const cat of categories) {
      nodes.push({
        nodeId: `node-cccat-${cat.categoryId}`,
        nodeType: 'CostCentreCategory' as any,
        sourceId: cat.sourceId,
        companyId,
        name: cat.name,
        displayName: cat.name,
        status: 'Active',
        source: cat.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: cat.validFrom,
        lastSeen: now,
        metadata: { categoryId: cat.categoryId }
      });
    }

    // 4. Cost Centres
    const ccs = this.getCostCentres(companyId);
    for (const cc of ccs) {
      const ccNodeId = `node-cc-${cc.costCentreId}`;
      nodes.push({
        nodeId: ccNodeId,
        nodeType: 'CostCentre' as any,
        sourceId: cc.sourceId,
        companyId,
        name: cc.name,
        displayName: cc.name,
        status: 'Active',
        source: cc.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: cc.validFrom,
        lastSeen: now,
        metadata: { parentId: cc.parentId, categoryId: cc.categoryId }
      });

      if (cc.parentId) {
        const parent = ccs.find((p) => p.name.toLowerCase() === cc.parentId?.toLowerCase() || p.costCentreId === cc.parentId);
        if (parent) {
          edges.push({
            edgeId: `edge-cc-parent-${cc.costCentreId}`,
            fromNode: `node-cc-${parent.costCentreId}`,
            toNode: ccNodeId,
            relationshipType: 'BELONGS_TO_PARENT_CENTRE' as any,
            origin: 'Direct',
            confidence: 'High',
            confidenceScore: 1.0,
            source: 'Cost Centre Hierarchy',
            evidence: { sourceField: 'COSTCENTRE.PARENT', sourceRecord: cc.sourceId, sourceReport: 'CostCentreMaster', extraction: 'Phase 32C', reason: 'Cost centre hierarchy link' },
            createdAt: now
          });
        }
      }
    }

    return { nodes, edges };
  }

  // =========================================================================
  // 5. SEED DATA
  // =========================================================================

  private seedInitialTaxAndCostCentres() {
    const companyId = 'CMP-001';

    // Tax Entities
    const rawTaxes = [
      {
        taxId: 'TAX-GST-18',
        name: 'Integrated Goods & Services Tax 18%',
        type: 'GST',
        rate: 18,
        registration: '27AAACA1234F1Z5',
        jurisdiction: 'India Central & Interstate'
      },
      {
        taxId: 'TAX-TDS-194C',
        name: 'TDS on Contractor Payments @2%',
        type: 'Withholding Tax (TDS)',
        rate: 2,
        registration: 'MUMA00123F',
        jurisdiction: 'Income Tax Dept'
      }
    ];
    for (const t of rawTaxes) this.normalizeTaxEntity(t, companyId);

    // Tax Transactions
    const rawTaxTrxs = [
      {
        taxTransactionId: 'TAXTRX-2026-001',
        voucherId: 'VCH-INV-2026-001',
        voucherLineId: 'VCH-INV-2026-001-L2',
        taxId: 'tax-cmp-001-tax-gst-18',
        taxName: 'Integrated Goods & Services Tax 18%',
        taxableValue: 300000,
        taxAmount: 54000,
        taxRate: 18,
        taxComponent: 'IGST 18%',
        partyName: 'Acme Tech Corp'
      }
    ];
    for (const tt of rawTaxTrxs) this.normalizeTaxTransaction(tt, companyId);

    // Cost Centre Categories
    const rawCats = [
      { categoryId: 'CAT-PROJECTS', name: 'Strategic Client Projects' },
      { categoryId: 'CAT-DEPARTMENTS', name: 'Internal Business Units' }
    ];
    for (const c of rawCats) this.normalizeCostCentreCategory(c, companyId);

    // Cost Centres
    const rawCCs = [
      {
        costCentreId: 'CC-ACME-MIG',
        name: 'Project Acme Cloud Migration Phase 1',
        categoryId: 'Strategic Client Projects',
        categoryName: 'Strategic Client Projects'
      },
      {
        costCentreId: 'CC-RND-AI',
        name: 'Core R&D - AI Lab & Compute',
        categoryId: 'Internal Business Units',
        categoryName: 'Internal Business Units'
      }
    ];
    for (const cc of rawCCs) this.normalizeCostCentre(cc, companyId);
  }

  private parseAmount(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const clean = val.replace(/,/g, '').replace(/[₹$]/g, '').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private inferValueType(val: any): 'String' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean' | 'Object' | 'Array' | 'Unknown' {
    if (val === null || val === undefined) return 'Unknown';
    if (typeof val === 'boolean') return 'Boolean';
    if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Decimal';
    if (Array.isArray(val)) return 'Array';
    if (typeof val === 'object') return 'Object';
    if (typeof val === 'string') return 'String';
    return 'Unknown';
  }

  private slugify(str: string): string {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 40);
  }
}

export const canonicalTaxCostCentreEngine = new CanonicalTaxCostCentreEngine();
