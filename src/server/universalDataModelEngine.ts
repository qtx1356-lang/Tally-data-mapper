/**
 * Phase 32A - Universal Normalized Tally Data Model & Dynamic Schema Engine
 */

import {
  DatasetMetadata,
  DatasetCategory,
  DatasetStatus,
  RawSourceMetadata,
  ExtensionField,
  CanonicalRecord,
  SchemaRegistryItem,
  SchemaFieldDefinition,
  SchemaRelationshipDefinition,
  SchemaStatus,
  SchemaComparisonResult,
  SchemaFieldDiff,
  SchemaRelationshipDiff,
  SchemaCompatibilityType,
  FieldCatalogItem,
  FieldDataType,
  FieldNullable,
  ConfidenceLevel
} from '../types/phase32UniversalModel';

export class UniversalDataModelEngine {
  private datasets: Map<string, DatasetMetadata> = new Map();
  private rawSources: Map<string, RawSourceMetadata> = new Map();
  private canonicalRecords: Map<string, CanonicalRecord> = new Map();
  private schemas: Map<string, SchemaRegistryItem> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // =========================================================================
  // 1. DATASET METADATA & LIFECYCLE
  // =========================================================================

  public getAllDatasets(companyId?: string, category?: DatasetCategory): DatasetMetadata[] {
    let list = Array.from(this.datasets.values());
    if (companyId) {
      list = list.filter((d) => d.companyId === companyId);
    }
    if (category) {
      list = list.filter((d) => d.category === category);
    }
    // Update live counts
    return list.map((d) => this.enrichDatasetMetrics(d));
  }

  public getDataCatalog(companyId?: string): DatasetMetadata[] {
    return this.getAllDatasets(companyId);
  }

  public getDatasetById(datasetId: string, companyId?: string): DatasetMetadata | undefined {
    let ds: DatasetMetadata | undefined;

    if (companyId) {
      // Direct search for company-scoped dataset first
      const allDs = Array.from(this.datasets.values());
      ds = allDs.find(
        (d) =>
          d.companyId === companyId &&
          (d.datasetId === datasetId ||
            d.datasetId === `ds-${datasetId}-${companyId}` ||
            d.datasetId.includes(datasetId))
      );
    }

    if (!ds) {
      ds = this.datasets.get(datasetId);
    }

    if (!ds) {
      const alias = datasetId.startsWith('canonical-')
        ? datasetId.replace('canonical-', 'ds-')
        : datasetId.startsWith('ds-')
        ? datasetId.replace('ds-', 'canonical-')
        : datasetId;
      ds = this.datasets.get(alias);
    }

    if (!ds) {
      const candidates = Array.from(this.datasets.values()).filter(
        (d) => d.datasetId.includes(datasetId) || datasetId.includes(d.datasetId)
      );
      if (companyId) {
        ds = candidates.find((d) => d.companyId === companyId);
      }
      if (!ds && candidates.length > 0) {
        ds = candidates[0];
      }
    }

    if (!ds) return undefined;

    if (companyId && ds.companyId !== companyId && ds.companyId !== 'GLOBAL' && ds.companyId !== 'MULTI_COMPANY') {
      throw new Error(`Company Isolation Violation: Dataset '${datasetId}' belongs to '${ds.companyId}', not '${companyId}'.`);
    }

    return this.enrichDatasetMetrics(ds);
  }

  public createDataset(dataset: Omit<DatasetMetadata, 'createdAt' | 'updatedAt'>): DatasetMetadata {
    const now = new Date().toISOString();
    const newDataset: DatasetMetadata = {
      ...dataset,
      createdAt: now,
      updatedAt: now
    };
    this.datasets.set(newDataset.datasetId, newDataset);
    return newDataset;
  }

  private enrichDatasetMetrics(ds: DatasetMetadata): DatasetMetadata {
    const records = Array.from(this.canonicalRecords.values()).filter(
      (r) => r.datasetId === ds.datasetId && r.companyId === ds.companyId && r.isCurrent
    );
    const extCount = records.reduce((sum, r) => sum + (r.extensionFields?.length || 0), 0);
    return {
      ...ds,
      recordCount: records.length,
      extensionFieldCount: extCount,
      freshness: records.length > 0 ? records[records.length - 1].updatedAt : ds.updatedAt
    };
  }

  // =========================================================================
  // 2. SCHEMA REGISTRY & LIFECYCLE (Draft -> Review -> Approved -> Deprecated)
  // =========================================================================

  public getAllSchemas(datasetId?: string, status?: SchemaStatus): SchemaRegistryItem[] {
    let list = Array.from(this.schemas.values());
    if (datasetId) {
      const alias = datasetId.startsWith('canonical-')
        ? datasetId.replace('canonical-', 'ds-')
        : datasetId.startsWith('ds-')
        ? datasetId.replace('ds-', 'canonical-')
        : datasetId;
      list = list.filter((s) => s.datasetId === datasetId || s.datasetId === alias);
    }
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    return list.sort((a, b) => b.version - a.version);
  }

  public getSchemaById(schemaId: string): SchemaRegistryItem | undefined {
    return this.schemas.get(schemaId);
  }

  public getActiveSchemaForDataset(datasetId: string): SchemaRegistryItem | undefined {
    const schemas = this.getAllSchemas(datasetId).filter((s) => s.status === 'Approved');
    return schemas[0] || this.getAllSchemas(datasetId)[0];
  }

  public registerSchema(
    schema: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint' | 'status'>,
    status: SchemaStatus = 'Draft'
  ): SchemaRegistryItem {
    const fingerprint = this.computeSchemaFingerprint(schema.fields, schema.grain);
    const now = new Date().toISOString();

    const newSchema: SchemaRegistryItem = {
      ...schema,
      fingerprint,
      createdAt: now,
      status
    };

    this.schemas.set(newSchema.schemaId, newSchema);

    // Update dataset's schemaVersion if approved
    if (status === 'Approved') {
      const ds = this.datasets.get(newSchema.datasetId);
      if (ds) {
        ds.schemaVersion = newSchema.version;
        ds.updatedAt = now;
      }
    }

    return newSchema;
  }

  public updateSchemaStatus(
    schemaId: string,
    newStatus: SchemaStatus,
    actor: string = 'System Admin',
    notes?: string
  ): SchemaRegistryItem {
    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema '${schemaId}' not found.`);
    }

    const prevStatus = schema.status;
    schema.status = newStatus;
    if (notes) schema.notes = notes;

    if (newStatus === 'Approved') {
      schema.approvedBy = actor;
      schema.approvedAt = new Date().toISOString();

      // Deprecate older approved schemas for the same dataset
      this.getAllSchemas(schema.datasetId)
        .filter((s) => s.schemaId !== schemaId && s.status === 'Approved')
        .forEach((s) => {
          s.status = 'Deprecated';
        });

      // Update dataset schema version
      const ds = this.datasets.get(schema.datasetId);
      if (ds) {
        ds.schemaVersion = schema.version;
        ds.updatedAt = new Date().toISOString();
      }
    }

    return schema;
  }

  // =========================================================================
  // 3. AUTOMATIC SCHEMA GENERATION (Proposal First, Never Auto-Replaces Approved)
  // =========================================================================

  public proposeSchemaFromDiscoveredObject(
    datasetId: string,
    discoveredFields: Array<{
      name: string;
      path: string;
      type: string;
      nullable?: string;
      source?: string;
      confidence?: string;
      semanticMeaning?: string;
    }>,
    grain: string,
    relationships: SchemaRelationshipDefinition[] = []
  ): {
    proposalSchema: SchemaRegistryItem;
    comparisonWithActive?: SchemaComparisonResult;
  } {
    const existingActive = this.getActiveSchemaForDataset(datasetId);
    const nextVersion = existingActive ? existingActive.version + 1 : 1;

    const schemaFields: SchemaFieldDefinition[] = discoveredFields.map((f) => {
      const isPrimary =
        f.name.toLowerCase().endsWith('id') ||
        f.name.toLowerCase() === 'guid' ||
        f.name.toLowerCase() === 'vouchernumber';
      const isForeignKey =
        f.name.toLowerCase().includes('ledgerid') ||
        f.name.toLowerCase().includes('itemid') ||
        f.name.toLowerCase().includes('parentgroupid');

      return {
        name: f.name,
        type: this.normalizeFieldType(f.type),
        nullable: (f.nullable as FieldNullable) || 'Optional',
        path: f.path || f.name,
        isPrimary,
        isForeignKey,
        foreignKeyTarget: isForeignKey ? `dataset-${f.name.replace(/id$/i, '').toLowerCase()}s` : undefined,
        description: `Discovered field ${f.name} from Tally source`,
        semanticMeaning: f.semanticMeaning || this.inferSemanticMeaning(f.name, f.type),
        source: f.source || 'Tally Discovery Harvester',
        confidence: (f.confidence as ConfidenceLevel) || 'High'
      };
    });

    const schemaId = `sch-${datasetId}-v${nextVersion}-prop`;
    const proposal: SchemaRegistryItem = {
      schemaId,
      datasetId,
      version: nextVersion,
      fingerprint: this.computeSchemaFingerprint(schemaFields, grain),
      fields: schemaFields,
      relationships,
      grain,
      createdAt: new Date().toISOString(),
      status: 'Review',
      notes: `Automated schema proposal generated from Phase 29/31 Discovery for review.`
    };

    this.schemas.set(proposal.schemaId, proposal);

    let comparisonWithActive: SchemaComparisonResult | undefined = undefined;
    if (existingActive) {
      comparisonWithActive = this.compareSchemas(existingActive.schemaId, proposal.schemaId);
    }

    return {
      proposalSchema: proposal,
      comparisonWithActive
    };
  }

  // =========================================================================
  // 4. SCHEMA CHANGE DETECTION & COMPATIBILITY CLASSIFIER
  // =========================================================================

  public compareSchemas(schemaAId: string, schemaBId: string): SchemaComparisonResult {
    const schemaA = this.schemas.get(schemaAId);
    const schemaB = this.schemas.get(schemaBId);

    if (!schemaA || !schemaB) {
      throw new Error(`One or both schemas not found: ${schemaAId}, ${schemaBId}`);
    }

    const fieldDiffs: SchemaFieldDiff[] = [];
    const relationshipDiffs: SchemaRelationshipDiff[] = [];
    const breakingReasons: string[] = [];
    const migrationSuggestions: string[] = [];

    const fieldsMapA = new Map(schemaA.fields.map((f) => [f.name.toLowerCase(), f]));
    const fieldsMapB = new Map(schemaB.fields.map((f) => [f.name.toLowerCase(), f]));

    let breakingChangesCount = 0;
    let addedFieldsCount = 0;
    let removedFieldsCount = 0;
    let modifiedFieldsCount = 0;

    // Check removed & modified fields (in A but not in B or altered)
    for (const [name, fA] of fieldsMapA.entries()) {
      const fB = fieldsMapB.get(name);
      if (!fB) {
        // Field removed -> Breaking Change
        removedFieldsCount++;
        breakingChangesCount++;
        const reason = `Field '${fA.name}' present in v${schemaA.version} was removed in v${schemaB.version}.`;
        breakingReasons.push(reason);
        fieldDiffs.push({
          fieldName: fA.name,
          changeType: 'Removed',
          oldType: fA.type,
          oldNullable: fA.nullable,
          impact: 'Breaking',
          details: reason
        });
      } else {
        // Check type compatibility
        if (fA.type !== fB.type) {
          modifiedFieldsCount++;
          const isSafeCast = this.isSafeTypeCast(fA.type, fB.type);
          const impact = isSafeCast ? 'MigrationRequired' : 'Breaking';
          if (!isSafeCast) {
            breakingChangesCount++;
            breakingReasons.push(`Incompatible type change on '${fA.name}': ${fA.type} -> ${fB.type}.`);
          } else {
            migrationSuggestions.push(`Apply cast/conversion transformer for '${fA.name}' (${fA.type} -> ${fB.type}).`);
          }
          fieldDiffs.push({
            fieldName: fA.name,
            changeType: 'TypeChanged',
            oldType: fA.type,
            newType: fB.type,
            impact,
            details: `Type altered from ${fA.type} to ${fB.type}.`
          });
        }

        // Check nullability changes
        if (fA.nullable !== fB.nullable) {
          if (fA.nullable === 'Optional' && fB.nullable === 'Required') {
            breakingChangesCount++;
            breakingReasons.push(`Field '${fA.name}' changed from Optional to Required without guaranteed default.`);
            fieldDiffs.push({
              fieldName: fA.name,
              changeType: 'NullabilityChanged',
              oldNullable: fA.nullable,
              newNullable: fB.nullable,
              impact: 'Breaking',
              details: `Required constraint added to previously optional field.`
            });
          }
        }
      }
    }

    // Check newly added fields (in B but not in A)
    for (const [name, fB] of fieldsMapB.entries()) {
      if (!fieldsMapA.has(name)) {
        addedFieldsCount++;
        const isRequiredWithoutDefault = fB.nullable === 'Required' && fB.defaultValue === undefined;
        const impact = isRequiredWithoutDefault ? 'MigrationRequired' : 'Safe';
        if (isRequiredWithoutDefault) {
          migrationSuggestions.push(`New required field '${fB.name}' requires default value fallback during ingestion.`);
        }
        fieldDiffs.push({
          fieldName: fB.name,
          changeType: 'Added',
          newType: fB.type,
          newNullable: fB.nullable,
          impact,
          details: `New field '${fB.name}' (${fB.type}, ${fB.nullable}) introduced in v${schemaB.version}.`
        });
      }
    }

    // Grain change detection
    const grainChanged = schemaA.grain !== schemaB.grain;
    if (grainChanged) {
      breakingChangesCount++;
      breakingReasons.push(`Dataset grain changed from '${schemaA.grain}' to '${schemaB.grain}', altering record aggregation identity.`);
    }

    // Relationship change detection
    let addedRelationshipsCount = 0;
    let removedRelationshipsCount = 0;
    const relsA = new Map(schemaA.relationships.map((r) => [r.relationshipId, r]));
    const relsB = new Map(schemaB.relationships.map((r) => [r.relationshipId, r]));

    for (const [id, rA] of relsA.entries()) {
      if (!relsB.has(id)) {
        removedRelationshipsCount++;
        relationshipDiffs.push({
          relationshipId: id,
          changeType: 'Removed',
          details: `Relationship to '${rA.targetDatasetId}' (${rA.type}) removed.`
        });
      }
    }

    for (const [id, rB] of relsB.entries()) {
      if (!relsA.has(id)) {
        addedRelationshipsCount++;
        relationshipDiffs.push({
          relationshipId: id,
          changeType: 'Added',
          details: `New relationship to '${rB.targetDatasetId}' (${rB.type}) added.`
        });
      }
    }

    // Classification
    let compatibility: SchemaCompatibilityType = 'Compatible';
    if (breakingChangesCount > 0) {
      compatibility = 'Breaking';
    } else if (fieldDiffs.some((d) => d.impact === 'MigrationRequired') || migrationSuggestions.length > 0) {
      compatibility = 'Compatible With Migration';
    }

    return {
      comparisonId: `CMP-${Date.now()}`,
      schemaA: {
        schemaId: schemaA.schemaId,
        version: schemaA.version,
        datasetId: schemaA.datasetId,
        status: schemaA.status
      },
      schemaB: {
        schemaId: schemaB.schemaId,
        version: schemaB.version,
        datasetId: schemaB.datasetId,
        status: schemaB.status
      },
      compatibility,
      grainChanged,
      oldGrain: schemaA.grain,
      newGrain: schemaB.grain,
      fieldDiffs,
      relationshipDiffs,
      summary: {
        addedFieldsCount,
        removedFieldsCount,
        modifiedFieldsCount,
        addedRelationshipsCount,
        removedRelationshipsCount,
        breakingChangesCount
      },
      breakingReasons,
      migrationSuggestions
    };
  }

  // =========================================================================
  // 5. INGESTION, CONTROLLED EXTENSION FIELDS & HISTORICAL RETENTION
  // =========================================================================

  public ingestRecord(
    datasetId: string,
    companyId: string,
    sourceRecordId: string,
    sourceSystem: string,
    sourceObject: string,
    rawPayload: Record<string, any>,
    sourceReport: string = 'Live Daybook Extract',
    extractionId: string = `EXT-${Date.now()}`
  ): {
    canonicalRecord: CanonicalRecord;
    rawMetadata: RawSourceMetadata;
  } {
    const dataset = this.getDatasetById(datasetId, companyId);
    if (!dataset) {
      throw new Error(`Dataset '${datasetId}' not found for company '${companyId}'.`);
    }

    const activeSchema = this.getActiveSchemaForDataset(datasetId);
    const schemaVersion = activeSchema ? activeSchema.version : dataset.schemaVersion || 1;
    const knownFieldNames = new Set(
      (activeSchema?.fields || []).map((f) => f.name.toLowerCase())
    );

    // 1. Create Raw Source Metadata Layer
    const now = new Date().toISOString();
    const rawRecordId = `RAW-${companyId}-${datasetId}-${sourceRecordId}`;
    const payloadRef = `s3://exfin-vault/raw/${companyId}/${datasetId}/${sourceRecordId}.json`;
    const fingerprint = this.computePayloadFingerprint(rawPayload);

    const rawMetadata: RawSourceMetadata = {
      rawRecordId,
      companyId,
      source: sourceSystem,
      sourceReport,
      sourceObject,
      extractionId,
      capturedAt: now,
      payloadReference: payloadRef,
      fingerprint,
      rawPayload
    };
    this.rawSources.set(rawRecordId, rawMetadata);

    // 2. Separate Known Fields vs Unknown Extension Fields
    const knownFields: Record<string, any> = {};
    const extensionFields: ExtensionField[] = [];
    const hasActiveSchema = !!activeSchema && activeSchema.fields.length > 0;

    for (const [key, val] of Object.entries(rawPayload)) {
      if (!hasActiveSchema || knownFieldNames.has(key.toLowerCase())) {
        knownFields[key] = val;
      } else {
        // Unknown source field: preserve under controlled extension mechanism
        extensionFields.push({
          name: key,
          type: this.inferValueType(val),
          path: `${sourceObject}.${key}`,
          value: val,
          source: sourceReport,
          confidence: 'Medium',
          semanticMeaning: this.inferSemanticMeaning(key, this.inferValueType(val)),
          discoveredAt: now
        });
      }
    }

    // 3. Historical Versioning & Invalidation of older version of same record
    const existingCurrent = Array.from(this.canonicalRecords.values()).find(
      (r) =>
        r.datasetId === datasetId &&
        r.companyId === companyId &&
        r.sourceRecordId === sourceRecordId &&
        r.isCurrent
    );

    if (existingCurrent) {
      existingCurrent.isCurrent = false;
      existingCurrent.validTo = now;
      existingCurrent.updatedAt = now;
    }

    const canonicalRecordId = `CAN-${companyId}-${datasetId}-${sourceRecordId}-v${schemaVersion}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const canonicalRecord: CanonicalRecord = {
      canonicalRecordId,
      datasetId,
      companyId,
      sourceRecordId,
      sourceSystem,
      sourceObject,
      schemaVersion,
      validFrom: now,
      isCurrent: true,
      createdAt: now,
      updatedAt: now,
      fields: knownFields,
      extensionFields,
      rawRecordReference: rawRecordId
    };

    this.canonicalRecords.set(canonicalRecordId, canonicalRecord);

    return {
      canonicalRecord,
      rawMetadata
    };
  }

  // =========================================================================
  // 6. RECORD RETRIEVAL WITH COMPANY ISOLATION
  // =========================================================================

  public getRecordsForDataset(
    datasetId: string,
    companyId: string,
    options: {
      includeHistorical?: boolean;
      schemaVersion?: number;
      limit?: number;
    } = {}
  ): CanonicalRecord[] {
    let records = Array.from(this.canonicalRecords.values()).filter(
      (r) => r.datasetId === datasetId && r.companyId === companyId
    );

    if (!options.includeHistorical) {
      records = records.filter((r) => r.isCurrent);
    }

    if (options.schemaVersion) {
      records = records.filter((r) => r.schemaVersion === options.schemaVersion);
    }

    if (options.limit && options.limit > 0) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  public getRecordById(canonicalRecordId: string, companyId: string): CanonicalRecord | undefined {
    const rec = this.canonicalRecords.get(canonicalRecordId);
    if (!rec) return undefined;
    if (rec.companyId !== companyId) {
      throw new Error(`Company Isolation Violation: Record '${canonicalRecordId}' belongs to '${rec.companyId}', not '${companyId}'.`);
    }
    return rec;
  }

  public getRawSourceMetadata(rawRecordId: string, companyId?: string): RawSourceMetadata | undefined {
    const raw = this.rawSources.get(rawRecordId);
    if (!raw) return undefined;
    if (companyId && raw.companyId !== companyId) {
      throw new Error(`Company Isolation Violation: Raw Source '${rawRecordId}' belongs to '${raw.companyId}', not '${companyId}'.`);
    }
    return raw;
  }

  // =========================================================================
  // 7. FIELD CATALOG AGGREGATOR
  // =========================================================================

  public getFieldCatalog(datasetId?: string, companyId?: string): FieldCatalogItem[] {
    const catalog: FieldCatalogItem[] = [];
    const targetDatasets = datasetId
      ? this.getAllDatasets(companyId).filter((d) => d.datasetId === datasetId)
      : this.getAllDatasets(companyId);

    for (const ds of targetDatasets) {
      const activeSchema = this.getActiveSchemaForDataset(ds.datasetId);
      if (activeSchema) {
        for (const f of activeSchema.fields) {
          catalog.push({
            fieldId: `${ds.datasetId}.${f.name}`,
            fieldName: f.name,
            type: f.type,
            datasetId: ds.datasetId,
            datasetName: ds.name,
            datasetCategory: ds.category,
            source: f.source,
            path: f.path,
            semanticMeaning: f.semanticMeaning || 'Standard accounting attribute',
            confidence: f.confidence,
            nullable: f.nullable,
            isPrimary: f.isPrimary,
            isForeignKey: f.isForeignKey,
            foreignKeyTarget: f.foreignKeyTarget
          });
        }
      }
    }

    return catalog;
  }

  // =========================================================================
  // 8. HELPERS & INFERENCE
  // =========================================================================

  private normalizeFieldType(t: string): FieldDataType {
    const lower = (t || '').toLowerCase();
    if (lower.includes('string') || lower.includes('text') || lower.includes('char')) return 'String';
    if (lower.includes('int') || lower.includes('count')) return 'Integer';
    if (lower.includes('dec') || lower.includes('amount') || lower.includes('rate') || lower.includes('num') || lower.includes('float') || lower.includes('double')) return 'Decimal';
    if (lower.includes('datetime') || lower.includes('timestamp')) return 'DateTime';
    if (lower.includes('date')) return 'Date';
    if (lower.includes('bool')) return 'Boolean';
    if (lower.includes('array') || lower.includes('list')) return 'Array';
    if (lower.includes('obj') || lower.includes('struct')) return 'Object';
    return 'Unknown';
  }

  private inferValueType(val: any): FieldDataType {
    if (val === null || val === undefined) return 'Unknown';
    if (typeof val === 'boolean') return 'Boolean';
    if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Decimal';
    if (Array.isArray(val)) return 'Array';
    if (typeof val === 'object') return 'Object';
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return 'DateTime';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'Date';
      return 'String';
    }
    return 'Unknown';
  }

  private inferSemanticMeaning(name: string, type: string): string {
    const n = name.toLowerCase();
    if (n.includes('amount') || n.includes('balance') || n.includes('debit') || n.includes('credit')) return 'Monetary Amount (INR)';
    if (n.includes('qty') || n.includes('quantity')) return 'Inventory Stock Count';
    if (n.includes('rate') || n.includes('price')) return 'Unit Rate / Price';
    if (n.includes('date')) return 'Calendar Date Attribute';
    if (n.includes('gstin') || n.includes('tax') || n.includes('hsn') || n.includes('sac')) return 'Tax & Statutory Identifier';
    if (n.includes('name')) return 'Entity Display Name';
    if (n.includes('narration') || n.includes('desc') || n.includes('memo')) return 'Descriptive Accounting Narration';
    return `${type} Data Attribute`;
  }

  private isSafeTypeCast(fromType: FieldDataType, toType: FieldDataType): boolean {
    if (fromType === toType) return true;
    if (fromType === 'Integer' && toType === 'Decimal') return true;
    if (fromType === 'Date' && toType === 'DateTime') return true;
    if (fromType === 'String' && (toType === 'Date' || toType === 'Decimal')) return true; // convertible with parser
    return false;
  }

  private computeSchemaFingerprint(fields: SchemaFieldDefinition[], grain: string): string {
    const fieldSig = fields.map((f) => `${f.name}:${f.type}:${f.nullable}`).sort().join('|');
    return `FP-${grain}-${Math.abs(this.simpleHash(fieldSig))}`;
  }

  private computePayloadFingerprint(payload: Record<string, any>): string {
    return `SHA256-${Math.abs(this.simpleHash(JSON.stringify(payload)))}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // =========================================================================
  // 9. INITIAL DATA SEEDING (Masters, Transactions, Inventory, Tax, Banking, CostCentre, Payroll)
  // =========================================================================

  private seedInitialData() {
    const companyId = 'CMP-001';
    const now = '2026-03-08T08:00:00Z';

    // -------------------------------------------------------------
    // DATASET 1: Master - Chart of Accounts Ledgers
    // -------------------------------------------------------------
    const dsLedger: DatasetMetadata = {
      datasetId: 'ds-ledgers',
      name: 'Chart of Accounts - Ledgers Master',
      displayName: 'Ledgers Master (Tally Group & Accounts)',
      category: 'Master',
      companyId,
      source: 'Tally Live XML Master Gateway',
      sourceObject: 'LEDGER',
      schemaVersion: 1,
      grain: 'Ledger',
      status: 'Active',
      description: 'Canonical master for all accounting ledgers, opening/closing balances, and parent group hierarchies.',
      createdAt: now,
      updatedAt: now
    };
    this.datasets.set(dsLedger.datasetId, dsLedger);

    const schLedgerV1: SchemaRegistryItem = {
      schemaId: 'sch-ds-ledgers-v1',
      datasetId: 'ds-ledgers',
      version: 1,
      fingerprint: 'FP-Ledger-884912',
      grain: 'Ledger',
      status: 'Approved',
      approvedBy: 'Controller Arjun',
      approvedAt: now,
      createdAt: now,
      fields: [
        { name: 'ledgerId', type: 'String', nullable: 'Required', path: 'LEDGER.GUID', isPrimary: true, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Unique Ledger GUID' },
        { name: 'name', type: 'String', nullable: 'Required', path: 'LEDGER.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Ledger Name' },
        { name: 'parentGroup', type: 'String', nullable: 'Required', path: 'LEDGER.PARENT', isPrimary: false, isForeignKey: true, foreignKeyTarget: 'ds-groups.name', source: 'Tally Master', confidence: 'High', description: 'Parent Group Name' },
        { name: 'openingBalance', type: 'Decimal', nullable: 'Required', path: 'LEDGER.OPENINGBALANCE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Opening Balance (INR)' },
        { name: 'closingBalance', type: 'Decimal', nullable: 'Required', path: 'LEDGER.CLOSINGBALANCE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Closing Balance (INR)' },
        { name: 'status', type: 'String', nullable: 'Optional', path: 'LEDGER.STATUS', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Ledger State' }
      ],
      relationships: [
        { relationshipId: 'rel-led-grp', targetDatasetId: 'ds-groups', type: 'N:1', sourceField: 'parentGroup', targetField: 'name', confidence: 'High', description: 'Ledger belongs to Group' }
      ]
    };
    this.schemas.set(schLedgerV1.schemaId, schLedgerV1);

    // -------------------------------------------------------------
    // DATASET 2: Transaction - Daybook Vouchers & Lines
    // -------------------------------------------------------------
    const dsVouchers: DatasetMetadata = {
      datasetId: 'ds-vouchers',
      name: 'Financial Daybook Vouchers',
      displayName: 'Daybook Transactions & Voucher Line Items',
      category: 'Transaction',
      companyId,
      source: 'Tally Sales/Purchase/Journal Daybook XML',
      sourceObject: 'VOUCHER',
      schemaVersion: 1,
      grain: 'VoucherLine',
      status: 'Active',
      description: 'Normalized transaction records representing double-entry voucher header and line-level accounting postings.',
      createdAt: now,
      updatedAt: now
    };
    this.datasets.set(dsVouchers.datasetId, dsVouchers);

    const schVouchersV1: SchemaRegistryItem = {
      schemaId: 'sch-ds-vouchers-v1',
      datasetId: 'ds-vouchers',
      version: 1,
      fingerprint: 'FP-VoucherLine-910243',
      grain: 'VoucherLine',
      status: 'Approved',
      approvedBy: 'Controller Arjun',
      approvedAt: now,
      createdAt: now,
      fields: [
        { name: 'voucherLineId', type: 'String', nullable: 'Required', path: 'VOUCHER.LINEID', isPrimary: true, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'voucherId', type: 'String', nullable: 'Required', path: 'VOUCHER.GUID', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'voucherNumber', type: 'String', nullable: 'Required', path: 'VOUCHER.VOUCHERNUMBER', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'voucherType', type: 'String', nullable: 'Required', path: 'VOUCHER.VOUCHERTYPENAME', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'date', type: 'Date', nullable: 'Required', path: 'VOUCHER.DATE', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'ledgerName', type: 'String', nullable: 'Required', path: 'ALLLEDGERENTRIES.LEDGERNAME', isPrimary: false, isForeignKey: true, foreignKeyTarget: 'ds-ledgers.name', source: 'Tally Daybook', confidence: 'High' },
        { name: 'amount', type: 'Decimal', nullable: 'Required', path: 'ALLLEDGERENTRIES.AMOUNT', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'isDebit', type: 'Boolean', nullable: 'Required', path: 'ALLLEDGERENTRIES.ISDEBIT', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
        { name: 'narration', type: 'String', nullable: 'Optional', path: 'VOUCHER.NARRATION', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'Medium' }
      ],
      relationships: [
        { relationshipId: 'rel-vch-led', targetDatasetId: 'ds-ledgers', type: 'N:1', sourceField: 'ledgerName', targetField: 'name', confidence: 'High', description: 'Voucher line posts to Ledger' }
      ]
    };
    this.schemas.set(schVouchersV1.schemaId, schVouchersV1);

    // -------------------------------------------------------------
    // DATASET 3: Inventory - Stock Item Master & Movement
    // -------------------------------------------------------------
    const dsInventory: DatasetMetadata = {
      datasetId: 'ds-inventory',
      name: 'Stock Items & Warehouse Master',
      displayName: 'Inventory SKUs, Units & Stock Valuation',
      category: 'Inventory',
      companyId,
      source: 'Tally Inventory Master',
      sourceObject: 'STOCKITEM',
      schemaVersion: 1,
      grain: 'StockItem',
      status: 'Active',
      description: 'Inventory SKU repository with opening/closing quantities, HSN codes, and valuation.',
      createdAt: now,
      updatedAt: now
    };
    this.datasets.set(dsInventory.datasetId, dsInventory);

    const schInventoryV1: SchemaRegistryItem = {
      schemaId: 'sch-ds-inventory-v1',
      datasetId: 'ds-inventory',
      version: 1,
      fingerprint: 'FP-StockItem-309112',
      grain: 'StockItem',
      status: 'Approved',
      approvedBy: 'Controller Arjun',
      approvedAt: now,
      createdAt: now,
      fields: [
        { name: 'itemId', type: 'String', nullable: 'Required', path: 'STOCKITEM.GUID', isPrimary: true, isForeignKey: false, source: 'Tally Inventory', confidence: 'High' },
        { name: 'name', type: 'String', nullable: 'Required', path: 'STOCKITEM.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Inventory', confidence: 'High' },
        { name: 'stockGroup', type: 'String', nullable: 'Required', path: 'STOCKITEM.PARENT', isPrimary: false, isForeignKey: false, source: 'Tally Inventory', confidence: 'High' },
        { name: 'unit', type: 'String', nullable: 'Required', path: 'STOCKITEM.BASEUNITS', isPrimary: false, isForeignKey: false, source: 'Tally Inventory', confidence: 'High' },
        { name: 'closingQty', type: 'Decimal', nullable: 'Required', path: 'STOCKITEM.CLOSINGBALANCE', isPrimary: false, isForeignKey: false, source: 'Tally Inventory', confidence: 'High' },
        { name: 'closingValue', type: 'Decimal', nullable: 'Required', path: 'STOCKITEM.CLOSINGVALUE', isPrimary: false, isForeignKey: false, source: 'Tally Inventory', confidence: 'High' }
      ],
      relationships: []
    };
    this.schemas.set(schInventoryV1.schemaId, schInventoryV1);

    // -------------------------------------------------------------
    // DATASET 4: Tax - GST & Statutory Entries
    // -------------------------------------------------------------
    const dsTax: DatasetMetadata = {
      datasetId: 'ds-tax',
      name: 'GST & Duties Statutory Tax Master',
      displayName: 'GST Rates, HSN Codes & Tax Breakdown',
      category: 'Tax',
      companyId,
      source: 'Tally GST Ledger Extract',
      sourceObject: 'TAXMASTER',
      schemaVersion: 1,
      grain: 'TaxRate',
      status: 'Active',
      description: 'Tax ledgers, CGST/SGST/IGST rates, and statutory return mappings.',
      createdAt: now,
      updatedAt: now
    };
    this.datasets.set(dsTax.datasetId, dsTax);

    // -------------------------------------------------------------
    // DATASET 5: Cost Centre - Allocation
    // -------------------------------------------------------------
    const dsCostCentre: DatasetMetadata = {
      datasetId: 'ds-costcentre',
      name: 'Cost Centres & Department Allocations',
      displayName: 'Cost Centres & Category Hierarchies',
      category: 'CostCentre',
      companyId,
      source: 'Tally Cost Centre Master',
      sourceObject: 'COSTCENTRE',
      schemaVersion: 1,
      grain: 'CostCentre',
      status: 'Active',
      description: 'Departmental expenditure trackers and cost category hierarchies.',
      createdAt: now,
      updatedAt: now
    };
    this.datasets.set(dsCostCentre.datasetId, dsCostCentre);

    // -------------------------------------------------------------
    // SEED CANONICAL RECORDS WITH CONTROLLED EXTENSION FIELDS
    // -------------------------------------------------------------

    // 1. Ledger Record (Acme Tech Corp) with unknown extension fields preserved
    this.ingestRecord(
      'ds-ledgers',
      companyId,
      'LED-CUST-001',
      'TallyPrime Live Gateway',
      'LEDGER',
      {
        ledgerId: 'LED-CUST-001',
        name: 'Acme Tech Corp',
        parentGroup: 'Sundry Debtors',
        openingBalance: 245000,
        closingBalance: 850000,
        status: 'Active',
        // Unknown source fields from Tally custom XML:
        BILLCREDITPERIOD: '30 Days',
        CUSTOM_PAN_NUMBER: 'AAACA1234F',
        CONTACT_PERSON_DIRECT: 'Rajesh Sharma',
        IS_MSME_REGISTERED: true
      },
      'Trial Balance Detailed',
      'EXT-SEED-01'
    );

    // 2. Ledger Record (Zenith Logistics)
    this.ingestRecord(
      'ds-ledgers',
      companyId,
      'LED-CUST-002',
      'TallyPrime Live Gateway',
      'LEDGER',
      {
        ledgerId: 'LED-CUST-002',
        name: 'Zenith Logistics Ltd',
        parentGroup: 'Sundry Debtors',
        openingBalance: 120000,
        closingBalance: 420000,
        status: 'Active',
        BILLCREDITPERIOD: '45 Days',
        CUSTOM_TRANSPORTER_ID: 'TRP-9021',
        CREDIT_LIMIT_INR: 1000000
      },
      'Trial Balance Detailed',
      'EXT-SEED-01'
    );

    // 3. Voucher Record (Sales Invoice INV-2026-001)
    this.ingestRecord(
      'ds-vouchers',
      companyId,
      'VCH-INV-2026-001-L1',
      'Tally Sales Daybook',
      'VOUCHER',
      {
        voucherLineId: 'VCH-INV-2026-001-L1',
        voucherId: 'VCH-INV-2026-001',
        voucherNumber: 'INV-2026-001',
        voucherType: 'Sales',
        date: '2026-03-01',
        ledgerName: 'Domestic Sales @18%',
        amount: 300000,
        isDebit: false,
        narration: 'Enterprise Cloud Server Rack 200X supply',
        // Unknown source fields preserved:
        DISPATCH_DOC_NO: 'DC-2026-099',
        EWAY_BILL_NUMBER: '381920192831',
        VEHICLE_REG_NO: 'MH-02-CB-1234',
        PAYMENT_TERMS_CUSTOM: 'Net 30'
      },
      'Sales Register Detailed',
      'EXT-SEED-02'
    );

    // 4. Inventory Record (Enterprise Cloud Server)
    this.ingestRecord(
      'ds-inventory',
      companyId,
      'ITEM-SRV-200X',
      'Tally Inventory Master',
      'STOCKITEM',
      {
        itemId: 'ITEM-SRV-200X',
        name: 'Enterprise Cloud Server Rack 200X',
        stockGroup: 'Enterprise Cloud Hardware',
        unit: 'NOS',
        closingQty: 18,
        closingValue: 2700000,
        // Unknown source fields preserved:
        HSN_CODE_NATIVE: '84715000',
        SHELF_LIFE_MONTHS: 36,
        SERIAL_TRACKING_ENABLED: true
      },
      'Stock Item Summary',
      'EXT-SEED-03'
    );
  }
}

export const universalDataModelEngine = new UniversalDataModelEngine();
