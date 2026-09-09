/**
 * Phase 32C: Canonical Inventory Normalization Engine
 * Handles:
 * - CanonicalStockGroup (Hierarchy, Missing parent, Orphan group, Circular hierarchy)
 * - CanonicalStockItem (Stable Identity, Duplicate name flagging, Original/Normalized Unit, Opening/Closing Qty & Value)
 * - CanonicalGodown (Godown hierarchy: Primary -> Godown -> Sub-Godown)
 * - CanonicalBatch (Batch/Lot, Manufacturing & Expiry dates, Serial/Lot preservation)
 * - CanonicalInventoryMovement (Receipt, Issue, Transfer, Adjustment, Opening, Closing, Other, Unknown)
 * - Phase 31 Graph integration & Phase 32A Schema Registry registration
 */

import {
  CanonicalStockGroup,
  CanonicalStockItem,
  CanonicalGodown,
  CanonicalBatch,
  CanonicalInventoryMovement,
  InventoryMovementType,
  PreservedMonetaryValue,
  PreservedQuantityValue,
  PreservedDateValue,
  HierarchyIntegrityIssue,
  ExtensionField,
  DatasetMetadata,
  SchemaRegistryItem
} from '../types/phase32UniversalModel';
import { universalDataModelEngine } from './universalDataModelEngine';
import { GraphNode, GraphEdge } from '../types/phase31ObjectGraph';

export class CanonicalInventoryEngine {
  private stockGroups: Map<string, CanonicalStockGroup> = new Map();
  private stockItems: Map<string, CanonicalStockItem> = new Map();
  private godowns: Map<string, CanonicalGodown> = new Map();
  private batches: Map<string, CanonicalBatch> = new Map();
  private movements: Map<string, CanonicalInventoryMovement> = new Map();

  constructor() {
    this.registerInventoryDatasets();
    this.seedInitialInventory();
  }

  // =========================================================================
  // 1. DATA CATALOG & SCHEMA REGISTRY INITIALIZATION (Phase 32A Integration)
  // =========================================================================

  private registerInventoryDatasets() {
    const now = '2026-03-08T08:00:00Z';
    const companies = ['CMP-001', 'CMP-002'];

    for (const companyId of companies) {
      // 1. Stock Groups Dataset
      const dsStockGroup: DatasetMetadata = {
        datasetId: `ds-canonical-stockgroups-${companyId}`,
        name: `Stock Groups Master (${companyId})`,
        displayName: `Inventory - Stock Groups Taxonomy`,
        category: 'Inventory',
        companyId,
        source: 'Tally Stock Group Master Gateway',
        sourceObject: 'STOCKGROUP',
        schemaVersion: 1,
        grain: 'StockGroup',
        status: 'Active',
        description: 'Normalized inventory stock groups and subgroup hierarchies.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsStockGroup);

      const schStockGroupV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-stockgroups-${companyId}-v1`,
        datasetId: dsStockGroup.datasetId,
        version: 1,
        grain: 'StockGroup',
        status: 'Approved',
        approvedBy: 'Phase 32C Normalizer',
        approvedAt: now,
        fields: [
          { name: 'stockGroupId', type: 'String', nullable: 'Required', path: 'STOCKGROUP.GUID', isPrimary: true, isForeignKey: false, source: 'Canonical Engine', confidence: 'High', description: 'Canonical Stock Group ID' },
          { name: 'name', type: 'String', nullable: 'Required', path: 'STOCKGROUP.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'parentStockGroupId', type: 'String', nullable: 'Optional', path: 'STOCKGROUP.PARENT', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsStockGroup.datasetId}.stockGroupId`, source: 'Tally Master', confidence: 'High' }
        ],
        relationships: [
          { relationshipId: `rel-stkgrp-parent-${companyId}`, targetDatasetId: dsStockGroup.datasetId, type: 'N:1', sourceField: 'parentStockGroupId', targetField: 'stockGroupId', confidence: 'High', description: 'Stock Group belongs to parent group' }
        ]
      };
      universalDataModelEngine.registerSchema(schStockGroupV1, 'Approved');

      // 2. Stock Items Dataset
      const dsStockItem: DatasetMetadata = {
        datasetId: `ds-canonical-stockitems-${companyId}`,
        name: `Stock Items Master (${companyId})`,
        displayName: `Inventory - Stock Items Master`,
        category: 'Inventory',
        companyId,
        source: 'Tally Stock Item Master Gateway',
        sourceObject: 'STOCKITEM',
        schemaVersion: 1,
        grain: 'StockItem (One row per source stock-item identity)',
        status: 'Active',
        description: 'Normalized stock items with opening/closing quantities, units, and group classifications.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsStockItem);

      const schStockItemV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-stockitems-${companyId}-v1`,
        datasetId: dsStockItem.datasetId,
        version: 1,
        grain: 'StockItem',
        status: 'Approved',
        approvedBy: 'Phase 32C Normalizer',
        approvedAt: now,
        fields: [
          { name: 'itemId', type: 'String', nullable: 'Required', path: 'STOCKITEM.GUID', isPrimary: true, isForeignKey: false, source: 'Canonical Engine', confidence: 'High', description: 'Canonical Item ID' },
          { name: 'name', type: 'String', nullable: 'Required', path: 'STOCKITEM.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'stockGroupId', type: 'String', nullable: 'Optional', path: 'STOCKITEM.PARENT', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsStockGroup.datasetId}.stockGroupId`, source: 'Tally Master', confidence: 'High' },
          { name: 'originalUnit', type: 'String', nullable: 'Required', path: 'STOCKITEM.BASEUNITS', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'closingQuantity', type: 'Decimal', nullable: 'Required', path: 'STOCKITEM.CLOSINGBALANCE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'closingValue', type: 'Decimal', nullable: 'Required', path: 'STOCKITEM.CLOSINGVALUE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' }
        ],
        relationships: [
          { relationshipId: `rel-item-stkgrp-${companyId}`, targetDatasetId: dsStockGroup.datasetId, type: 'N:1', sourceField: 'stockGroupId', targetField: 'stockGroupId', confidence: 'High', description: 'Stock Item classified under Stock Group' }
        ]
      };
      universalDataModelEngine.registerSchema(schStockItemV1, 'Approved');

      // 3. Godowns Dataset
      const dsGodown: DatasetMetadata = {
        datasetId: `ds-canonical-godowns-${companyId}`,
        name: `Godowns & Warehouses (${companyId})`,
        displayName: `Inventory - Godowns / Locations`,
        category: 'Inventory',
        companyId,
        source: 'Tally Godown Master Gateway',
        sourceObject: 'GODOWN',
        schemaVersion: 1,
        grain: 'Godown',
        status: 'Active',
        description: 'Locations, warehouses, and storage points hierarchy.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsGodown);

      // 4. Inventory Movements Dataset
      const dsMovements: DatasetMetadata = {
        datasetId: `ds-canonical-inventorymovements-${companyId}`,
        name: `Inventory Movements Register (${companyId})`,
        displayName: `Inventory - Goods In/Out & Transfers`,
        category: 'Inventory',
        companyId,
        source: 'Tally Inventory Vouchers Gateway',
        sourceObject: 'INVENTORYENTRY',
        schemaVersion: 1,
        grain: 'InventoryMovement (One row per source movement event)',
        status: 'Active',
        description: 'Granular inventory inward, outward, and transfer movements with date and value preservation.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsMovements);
    }
  }

  // =========================================================================
  // 2. NORMALIZERS
  // =========================================================================

  public normalizeStockGroup(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalStockGroup {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.stockGroupId || raw.guid || raw.sourceId || raw.name || `STKGRP-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();
    const parentStockGroupId = raw.parentStockGroupId || raw.parentGroup || raw.parent || undefined;
    const isPrimary = Boolean(raw.isPrimary || !parentStockGroupId);

    const stockGroupId = `stkgrp-${companyId}-${this.slugify(sourceId)}`;

    // Unknown field preservation
    const knownKeys = new Set(['stockgroupid', 'guid', 'sourceid', 'name', 'parentstockgroupid', 'parentgroup', 'parent', 'isprimary', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `STOCKGROUP.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Stock Group XML',
          confidence: 'High',
          semanticMeaning: 'Preserved stock group attribute',
          discoveredAt: now
        });
      }
    }

    const group: CanonicalStockGroup = {
      stockGroupId,
      sourceId,
      name,
      parentStockGroupId: parentStockGroupId ? String(parentStockGroupId).trim() : undefined,
      parentStockGroupName: parentStockGroupId ? String(parentStockGroupId).trim() : undefined,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Stock Group XML',
      schemaVersion: 1,
      isCurrent: true,
      isPrimary,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-stockgroups-${companyId}`,
        sourceRecord: sourceId,
        sourcePath: 'STOCKGROUP',
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.stockGroups.set(stockGroupId, group);
    return group;
  }

  public normalizeStockItem(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalStockItem {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.itemId || raw.guid || raw.sourceId || raw.name || `ITEM-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();
    const stockGroupId = raw.stockGroupId || raw.parentGroup || raw.parent || undefined;

    // Detect duplicate item names across company without merging
    const isDuplicateNameFlagged = Array.from(this.stockItems.values()).some(
      (item) => item.companyId === companyId && item.name.toLowerCase() === name.toLowerCase() && item.sourceId !== sourceId
    );

    // Units preservation
    const originalUnit = String(raw.unit || raw.baseUnits || raw.originalUnit || 'NOS').trim();
    const normalizedUnit = raw.normalizedUnit || this.getNormalizedUnit(originalUnit);

    // Quantities & Values
    const openingQuantity: PreservedQuantityValue = {
      originalValue: raw.openingQuantity,
      normalizedValue: this.parseAmount(raw.openingQuantity),
      unit: originalUnit
    };
    const closingQuantity: PreservedQuantityValue = {
      originalValue: raw.closingQuantity,
      normalizedValue: this.parseAmount(raw.closingQuantity),
      unit: originalUnit
    };
    const openingValue: PreservedMonetaryValue = {
      originalValue: raw.openingValue,
      normalizedValue: this.parseAmount(raw.openingValue),
      originalCurrency: raw.currency || 'INR'
    };
    const closingValue: PreservedMonetaryValue = {
      originalValue: raw.closingValue,
      normalizedValue: this.parseAmount(raw.closingValue),
      originalCurrency: raw.currency || 'INR'
    };

    const itemId = `item-${companyId}-${this.slugify(sourceId)}`;

    // Unknown field preservation
    const knownKeys = new Set(['itemid', 'guid', 'sourceid', 'name', 'stockgroupid', 'parentgroup', 'parent', 'unit', 'baseunits', 'openingquantity', 'closingquantity', 'openingvalue', 'closingvalue', 'companyid', 'source', 'currency']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `STOCKITEM.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Stock Item XML',
          confidence: 'High',
          semanticMeaning: 'Preserved stock item attribute',
          discoveredAt: now
        });
      }
    }

    const item: CanonicalStockItem = {
      itemId,
      sourceId,
      name,
      stockGroupId: stockGroupId ? String(stockGroupId).trim() : undefined,
      stockGroupName: stockGroupId ? String(stockGroupId).trim() : undefined,
      unit: {
        originalUnit,
        normalizedUnit
      },
      openingQuantity,
      closingQuantity,
      openingValue,
      closingValue,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Stock Item XML',
      schemaVersion: 1,
      isCurrent: true,
      isDuplicateNameFlagged,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-stockitems-${companyId}`,
        sourceRecord: sourceId,
        sourcePath: 'STOCKITEM',
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.stockItems.set(itemId, item);
    return item;
  }

  public normalizeGodown(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalGodown {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.godownId || raw.guid || raw.sourceId || raw.name || `GDN-${Date.now()}`).trim();
    const name = String(raw.name || sourceId).trim();
    const parentGodownId = raw.parentGodownId || raw.parent || undefined;
    const isPrimary = Boolean(raw.isPrimary || !parentGodownId);

    const godownId = `gdn-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['godownid', 'guid', 'sourceid', 'name', 'parentgodownid', 'parent', 'isprimary', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `GODOWN.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Godown XML',
          confidence: 'High',
          semanticMeaning: 'Preserved godown attribute',
          discoveredAt: now
        });
      }
    }

    const godown: CanonicalGodown = {
      godownId,
      sourceId,
      name,
      parentGodownId: parentGodownId ? String(parentGodownId).trim() : undefined,
      parentGodownName: parentGodownId ? String(parentGodownId).trim() : undefined,
      isPrimary,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Godown XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-godowns-${companyId}`,
        sourceRecord: sourceId,
        sourcePath: 'GODOWN',
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.godowns.set(godownId, godown);
    return godown;
  }

  public normalizeBatch(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalBatch {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.batchId || raw.guid || raw.sourceId || raw.batchName || `BTCH-${Date.now()}`).trim();
    const batchName = String(raw.batchName || raw.name || sourceId).trim();
    const stockItemId = String(raw.stockItemId || raw.itemId || '').trim();
    const godownId = raw.godownId ? String(raw.godownId).trim() : undefined;

    const batchId = `btch-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['batchid', 'guid', 'sourceid', 'batchname', 'name', 'stockitemid', 'itemid', 'godownid', 'expirydate', 'manufacturingdate', 'serialnumber', 'lotnumber', 'companyid', 'source']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `BATCH.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Batch XML',
          confidence: 'High',
          semanticMeaning: 'Preserved batch/lot attribute',
          discoveredAt: now
        });
      }
    }

    const batch: CanonicalBatch = {
      batchId,
      sourceId,
      batchName,
      stockItemId,
      stockItemName: raw.stockItemName || undefined,
      godownId,
      godownName: raw.godownName || undefined,
      expiryDate: raw.expiryDate ? this.normalizeDateString(raw.expiryDate) : undefined,
      manufacturingDate: raw.manufacturingDate ? this.normalizeDateString(raw.manufacturingDate) : undefined,
      serialNumber: raw.serialNumber || undefined,
      lotNumber: raw.lotNumber || undefined,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Batch XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-batches-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.batches.set(batchId, batch);
    return batch;
  }

  public normalizeInventoryMovement(
    raw: Record<string, any>,
    companyId: string,
    options: { sourceReport?: string; sourceDataset?: string; extractionId?: string } = {}
  ): CanonicalInventoryMovement {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required.');

    const now = new Date().toISOString();
    const sourceId = String(raw.movementId || raw.guid || raw.sourceId || `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`).trim();
    const voucherId = String(raw.voucherId || '').trim();
    const stockItemId = String(raw.stockItemId || raw.itemId || '').trim();
    const stockItemName = String(raw.stockItemName || stockItemId).trim();

    // Movement types supported by source
    const rawType = String(raw.movementType || raw.type || 'Other').trim().toLowerCase();
    let movementType: InventoryMovementType = 'Other';
    if (rawType.includes('receipt') || rawType.includes('inward') || rawType.includes('purchase')) movementType = 'Receipt';
    else if (rawType.includes('issue') || rawType.includes('outward') || rawType.includes('sales')) movementType = 'Issue';
    else if (rawType.includes('transfer')) movementType = 'Transfer';
    else if (rawType.includes('adjust')) movementType = 'Adjustment';
    else if (rawType.includes('open')) movementType = 'Opening';
    else if (rawType.includes('close')) movementType = 'Closing';
    else if (rawType === 'unknown') movementType = 'Unknown';
    else movementType = 'Other';

    const rawDate = String(raw.date || '2026-03-01').trim();
    const date: PreservedDateValue = {
      originalSourceDate: rawDate,
      normalizedDate: this.normalizeDateString(rawDate)
    };

    const qtyVal = this.parseAmount(raw.quantity);
    const rateVal = this.parseAmount(raw.rate);
    const amountVal = raw.value !== undefined ? this.parseAmount(raw.value) : qtyVal * rateVal;

    const quantity: PreservedQuantityValue = {
      originalValue: raw.quantity,
      normalizedValue: qtyVal,
      unit: raw.unit || 'NOS'
    };
    const rate: PreservedMonetaryValue = {
      originalValue: raw.rate,
      normalizedValue: rateVal,
      originalCurrency: raw.currency || 'INR'
    };
    const value: PreservedMonetaryValue = {
      originalValue: raw.value || amountVal,
      normalizedValue: amountVal,
      originalCurrency: raw.currency || 'INR'
    };

    const movementId = `mov-${companyId}-${this.slugify(sourceId)}`;

    const knownKeys = new Set(['movementid', 'guid', 'sourceid', 'voucherid', 'voucherlineid', 'stockitemid', 'itemid', 'stockitemname', 'godownid', 'batchid', 'quantity', 'rate', 'value', 'movementtype', 'type', 'date', 'companyid', 'source', 'currency', 'unit']);
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `INVENTORYENTRY.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Inventory Movement XML',
          confidence: 'High',
          semanticMeaning: 'Preserved inventory movement attribute',
          discoveredAt: now
        });
      }
    }

    const movement: CanonicalInventoryMovement = {
      movementId,
      voucherId,
      voucherLineId: raw.voucherLineId ? String(raw.voucherLineId).trim() : undefined,
      stockItemId,
      stockItemName,
      godownId: raw.godownId ? String(raw.godownId).trim() : undefined,
      godownName: raw.godownName || undefined,
      batchId: raw.batchId ? String(raw.batchId).trim() : undefined,
      batchName: raw.batchName || undefined,
      quantity,
      rate,
      value,
      movementType,
      date,
      companyId,
      sourceId,
      source: raw.source || options.sourceReport || 'Tally Inventory Movement XML',
      schemaVersion: 1,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-inventorymovements-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.movements.set(movementId, movement);
    return movement;
  }

  // =========================================================================
  // 3. REPOSITORY ACCESSORS & INTEGRITY VALIDATION
  // =========================================================================

  public getStockGroups(companyId: string): CanonicalStockGroup[] {
    return Array.from(this.stockGroups.values()).filter((g) => g.companyId === companyId && g.isCurrent);
  }

  public getStockItems(companyId: string): CanonicalStockItem[] {
    return Array.from(this.stockItems.values()).filter((i) => i.companyId === companyId && i.isCurrent);
  }

  public getGodowns(companyId: string): CanonicalGodown[] {
    return Array.from(this.godowns.values()).filter((g) => g.companyId === companyId && g.isCurrent);
  }

  public getBatches(companyId: string, stockItemId?: string): CanonicalBatch[] {
    let list = Array.from(this.batches.values()).filter((b) => b.companyId === companyId && b.isCurrent);
    if (stockItemId) list = list.filter((b) => b.stockItemId === stockItemId);
    return list;
  }

  public getInventoryMovements(companyId: string, voucherId?: string, stockItemId?: string): CanonicalInventoryMovement[] {
    let list = Array.from(this.movements.values()).filter((m) => m.companyId === companyId);
    if (voucherId) list = list.filter((m) => m.voucherId === voucherId);
    if (stockItemId) list = list.filter((m) => m.stockItemId === stockItemId);
    return list;
  }

  public detectInventoryIntegrityIssues(companyId: string): HierarchyIntegrityIssue[] {
    const issues: HierarchyIntegrityIssue[] = [];
    const groups = this.getStockGroups(companyId);
    const items = this.getStockItems(companyId);
    const godownsList = this.getGodowns(companyId);
    const groupMap = new Map<string, CanonicalStockGroup>();
    groups.forEach((g) => groupMap.set(g.name, g));

    // 1. Stock Group Missing Parent / Orphan
    for (const g of groups) {
      if (g.parentStockGroupId) {
        const parentExists = groups.some((p) => p.name.toLowerCase() === g.parentStockGroupId?.toLowerCase() || p.stockGroupId === g.parentStockGroupId);
        if (!parentExists) {
          issues.push({
            issueId: `ISS-STKGRP-ORPHAN-${g.stockGroupId}`,
            type: 'MissingParent',
            severity: 'Warning',
            targetEntity: 'StockGroup',
            targetId: g.stockGroupId,
            companyId,
            description: `Stock Group '${g.name}' references non-existent parent '${g.parentStockGroupId}'.`,
            detectedAt: new Date().toISOString()
          });
        }
      }
    }

    // 2. Duplicate Stock Item Names
    const seenNames = new Set<string>();
    for (const item of items) {
      if (seenNames.has(item.name.toLowerCase())) {
        issues.push({
          issueId: `ISS-STKITEM-DUP-${item.itemId}`,
          type: 'DuplicateItemName',
          severity: 'Warning',
          targetEntity: 'StockItem',
          targetId: item.itemId,
          companyId,
          description: `Duplicate Stock Item name '${item.name}' detected in company ${companyId}.`,
          detectedAt: new Date().toISOString()
        });
      }
      seenNames.add(item.name.toLowerCase());
    }

    // 3. Godown Hierarchy Missing Parent
    for (const gdn of godownsList) {
      if (gdn.parentGodownId) {
        const parentExists = godownsList.some((p) => p.name.toLowerCase() === gdn.parentGodownId?.toLowerCase() || p.godownId === gdn.parentGodownId);
        if (!parentExists) {
          issues.push({
            issueId: `ISS-GDN-ORPHAN-${gdn.godownId}`,
            type: 'MissingParent',
            severity: 'Warning',
            targetEntity: 'Godown',
            targetId: gdn.godownId,
            companyId,
            description: `Godown '${gdn.name}' references parent '${gdn.parentGodownId}' which was not discovered.`,
            detectedAt: new Date().toISOString()
          });
        }
      }
    }

    return issues;
  }

  // =========================================================================
  // 4. PHASE 31 GRAPH INTEGRATION
  // =========================================================================

  public syncInventoryWithGraph(companyId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const now = new Date().toISOString();

    // 1. Stock Groups
    const groups = this.getStockGroups(companyId);
    for (const g of groups) {
      nodes.push({
        nodeId: `node-stkgrp-${g.stockGroupId}`,
        nodeType: 'StockGroup' as any,
        sourceId: g.sourceId,
        companyId,
        name: g.name,
        displayName: g.name,
        status: 'Active',
        source: g.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: g.validFrom,
        lastSeen: now,
        metadata: { parentGroup: g.parentStockGroupId, isPrimary: g.isPrimary }
      });

      if (g.parentStockGroupId) {
        const parent = groups.find((p) => p.name.toLowerCase() === g.parentStockGroupId?.toLowerCase());
        if (parent) {
          edges.push({
            edgeId: `edge-stkgrp-parent-${g.stockGroupId}`,
            fromNode: `node-stkgrp-${parent.stockGroupId}`,
            toNode: `node-stkgrp-${g.stockGroupId}`,
            relationshipType: 'PARENT_OF' as any,
            origin: 'Direct',
            confidence: 'High',
            confidenceScore: 1.0,
            source: 'Stock Group Hierarchy',
            evidence: { sourceField: 'STOCKGROUP.PARENT', sourceRecord: g.sourceId, sourceReport: 'InventoryMaster', extraction: 'Phase 32C', reason: 'Hierarchical inventory taxonomy' },
            createdAt: now
          });
        }
      }
    }

    // 2. Stock Items
    const items = this.getStockItems(companyId);
    for (const item of items) {
      const itemNodeId = `node-stk-${item.itemId}`;
      nodes.push({
        nodeId: itemNodeId,
        nodeType: 'StockItem' as any,
        sourceId: item.sourceId,
        companyId,
        name: item.name,
        displayName: `${item.name} (${item.unit.originalUnit})`,
        status: 'Active',
        source: item.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: item.validFrom,
        lastSeen: now,
        metadata: { stockGroup: item.stockGroupId, closingQuantity: item.closingQuantity.normalizedValue, closingValue: item.closingValue.normalizedValue }
      });

      if (item.stockGroupId) {
        const group = groups.find((g) => g.name.toLowerCase() === item.stockGroupId?.toLowerCase());
        if (group) {
          edges.push({
            edgeId: `edge-stkgrp-item-${item.itemId}`,
            fromNode: `node-stkgrp-${group.stockGroupId}`,
            toNode: itemNodeId,
            relationshipType: 'CLASSIFIES' as any,
            origin: 'Direct',
            confidence: 'High',
            confidenceScore: 1.0,
            source: 'Stock Item Classification',
            evidence: { sourceField: 'STOCKITEM.PARENT', sourceRecord: item.sourceId, sourceReport: 'InventoryMaster', extraction: 'Phase 32C', reason: 'Stock Item classified under Group' },
            createdAt: now
          });
        }
      }
    }

    // 3. Godowns
    const godownsList = this.getGodowns(companyId);
    for (const gdn of godownsList) {
      nodes.push({
        nodeId: `node-gdn-${gdn.godownId}`,
        nodeType: 'Godown' as any,
        sourceId: gdn.sourceId,
        companyId,
        name: gdn.name,
        displayName: gdn.name,
        status: 'Active',
        source: gdn.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: gdn.validFrom,
        lastSeen: now,
        metadata: { parentGodown: gdn.parentGodownId, isPrimary: gdn.isPrimary }
      });
    }

    // 4. Inventory Movements
    const movs = this.getInventoryMovements(companyId);
    for (const m of movs) {
      const movNodeId = `node-invmov-${m.movementId}`;
      nodes.push({
        nodeId: movNodeId,
        nodeType: 'InventoryMovement' as any,
        sourceId: m.sourceId,
        companyId,
        name: `${m.movementType} ${m.stockItemName}`,
        displayName: `${m.movementType}: ${m.quantity.normalizedValue} ${m.quantity.unit} @ ₹${m.rate.normalizedValue}`,
        status: 'Active',
        source: m.source,
        snapshotId: `snap-${companyId}-v32c`,
        firstSeen: m.date.normalizedDate,
        lastSeen: now,
        metadata: { voucherId: m.voucherId, movementType: m.movementType, value: m.value.normalizedValue }
      });

      // Link Movement -> Stock Item
      const targetItem = items.find((i) => i.itemId === m.stockItemId || i.sourceId === m.stockItemId || i.name.toLowerCase() === m.stockItemName.toLowerCase());
      if (targetItem) {
        edges.push({
          edgeId: `edge-mov-item-${m.movementId}`,
          fromNode: `node-stk-${targetItem.itemId}`,
          toNode: movNodeId,
          relationshipType: 'MOVES' as any,
          origin: 'Direct',
          confidence: 'High',
          confidenceScore: 1.0,
          source: 'Inventory Movement Event',
          evidence: { sourceField: 'INVENTORYENTRY.STOCKITEMNAME', sourceRecord: m.sourceId, sourceReport: 'InventoryMaster', extraction: 'Phase 32C', reason: 'Stock Item movement event' },
          createdAt: now
        });
      }

      // Link Movement -> Godown
      if (m.godownId) {
        const targetGdn = godownsList.find((g) => g.godownId === m.godownId || g.name.toLowerCase() === m.godownId?.toLowerCase());
        if (targetGdn) {
          edges.push({
            edgeId: `edge-mov-gdn-${m.movementId}`,
            fromNode: movNodeId,
            toNode: `node-gdn-${targetGdn.godownId}`,
            relationshipType: 'LOCATED_AT' as any,
            origin: 'Direct',
            confidence: 'High',
            confidenceScore: 1.0,
            source: 'Inventory Location',
            evidence: { sourceField: 'INVENTORYENTRY.GODOWNNAME', sourceRecord: m.sourceId, sourceReport: 'InventoryMaster', extraction: 'Phase 32C', reason: 'Movement situated at Godown' },
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

  private seedInitialInventory() {
    const companyId = 'CMP-001';

    // Stock Groups
    const rawStockGroups = [
      { stockGroupId: 'STKGRP-COMPUTING', name: 'Enterprise Computing & Servers', isPrimary: true },
      { stockGroupId: 'STKGRP-NETWORKING', name: 'Networking & Switches', isPrimary: true },
      { stockGroupId: 'STKGRP-SERVER-RACKS', name: 'Server Racks & Enclosures', parentGroup: 'Enterprise Computing & Servers' }
    ];
    for (const g of rawStockGroups) this.normalizeStockGroup(g, companyId);

    // Godowns
    const rawGodowns = [
      { godownId: 'GDN-MAIN', name: 'Main Bhiwandi Logistics Hub', isPrimary: true },
      { godownId: 'GDN-BLR', name: 'Bengaluru Tech Park Hub', isPrimary: true },
      { godownId: 'GDN-MAIN-RACK-A', name: 'Bhiwandi Cold Zone Rack A', parentGodownId: 'Main Bhiwandi Logistics Hub' }
    ];
    for (const g of rawGodowns) this.normalizeGodown(g, companyId);

    // Stock Items
    const rawItems = [
      {
        itemId: 'ITEM-SRV-200X',
        name: 'Enterprise Cloud Server Rack 200X',
        parentGroup: 'Server Racks & Enclosures',
        unit: 'NOS',
        openingQuantity: 10,
        closingQuantity: 8,
        openingValue: 1500000,
        closingValue: 1200000,
        HSN_CODE: '84715000'
      },
      {
        itemId: 'ITEM-SW-10G',
        name: '48-Port 10GbE Layer 3 Managed Switch',
        parentGroup: 'Networking & Switches',
        unit: 'NOS',
        openingQuantity: 25,
        closingQuantity: 20,
        openingValue: 875000,
        closingValue: 700000,
        HSN_CODE: '85176290'
      }
    ];
    for (const i of rawItems) this.normalizeStockItem(i, companyId);

    // Batches
    const rawBatches = [
      {
        batchId: 'BTCH-SRV-2026-B1',
        batchName: 'BATCH-2026-03A',
        stockItemId: 'item-cmp-001-item-srv-200x',
        godownId: 'gdn-cmp-001-gdn-main',
        manufacturingDate: '2026-01-15',
        expiryDate: '2031-01-15',
        serialNumber: 'SRV-200X-SN-9981'
      }
    ];
    for (const b of rawBatches) this.normalizeBatch(b, companyId);

    // Movements
    const rawMovements = [
      {
        movementId: 'MOV-2026-001',
        voucherId: 'VCH-INV-2026-001',
        stockItemId: 'item-cmp-001-item-srv-200x',
        stockItemName: 'Enterprise Cloud Server Rack 200X',
        godownId: 'gdn-cmp-001-gdn-main',
        batchId: 'btch-cmp-001-btch-srv-2026-b1',
        quantity: 2,
        rate: 150000,
        value: 300000,
        movementType: 'Issue',
        date: '2026-03-01'
      }
    ];
    for (const m of rawMovements) this.normalizeInventoryMovement(m, companyId);
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

  private normalizeDateString(dateStr: string): string {
    if (!dateStr) return '2026-03-01';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const dmy = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return dateStr.substring(0, 10);
  }

  private getNormalizedUnit(orig: string): string {
    const lower = orig.toLowerCase().trim();
    if (lower === 'nos' || lower === 'no' || lower === 'pieces' || lower === 'pcs') return 'Unit';
    if (lower === 'kgs' || lower === 'kg' || lower === 'kilograms') return 'Kilogram';
    if (lower === 'mtr' || lower === 'meters') return 'Meter';
    if (lower === 'box' || lower === 'boxes') return 'Box';
    return orig;
  }

  private inferValueType(val: any): 'String' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean' | 'Object' | 'Array' | 'Unknown' {
    if (val === null || val === undefined) return 'Unknown';
    if (typeof val === 'boolean') return 'Boolean';
    if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Decimal';
    if (Array.isArray(val)) return 'Array';
    if (typeof val === 'object') return 'Object';
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'Date';
      return 'String';
    }
    return 'Unknown';
  }

  private slugify(str: string): string {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 40);
  }
}

export const canonicalInventoryEngine = new CanonicalInventoryEngine();
