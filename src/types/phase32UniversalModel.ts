/**
 * Phase 32A: Universal Normalized Tally Data Model, Dynamic Schema Registry & Data Catalog
 */

export type DatasetCategory =
  | 'Master'
  | 'Transaction'
  | 'Inventory'
  | 'Tax'
  | 'Payroll'
  | 'Banking'
  | 'CostCentre'
  | 'Management'
  | 'Other';

export type DatasetStatus = 'Active' | 'Inactive' | 'Draft' | 'Deprecated';

export type FieldDataType =
  | 'String'
  | 'Integer'
  | 'Decimal'
  | 'Date'
  | 'DateTime'
  | 'Boolean'
  | 'Object'
  | 'Array'
  | 'Unknown';

export type FieldNullable = 'Required' | 'Optional' | 'Nullable' | 'Unknown';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type SchemaStatus = 'Draft' | 'Review' | 'Approved' | 'Deprecated';

export type SchemaCompatibilityType = 'Compatible' | 'Compatible With Migration' | 'Breaking';

/**
 * 1. Dataset Metadata
 */
export interface DatasetMetadata {
  datasetId: string;
  name: string;
  displayName: string;
  category: DatasetCategory;
  companyId: string;
  source: string;
  sourceObject: string;
  schemaVersion: number;
  grain: string;
  status: DatasetStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
  recordCount?: number;
  freshness?: string;
  extensionFieldCount?: number;
}

/**
 * 2. Raw Source Metadata Layer
 */
export interface RawSourceMetadata {
  rawRecordId: string;
  companyId: string;
  source: string;
  sourceReport: string;
  sourceObject: string;
  extractionId: string;
  capturedAt: string;
  payloadReference: string;
  fingerprint: string;
  rawPayload?: Record<string, any>;
}

/**
 * 3. Controlled Extension Field (Unknown Source Field Preservation)
 */
export interface ExtensionField {
  name: string;
  type: FieldDataType;
  path: string;
  value: any;
  source: string;
  confidence: ConfidenceLevel;
  semanticMeaning?: string;
  discoveredAt?: string;
}

/**
 * 4. Canonical Record Model
 */
export interface CanonicalRecord {
  canonicalRecordId: string;
  datasetId: string;
  companyId: string;
  sourceRecordId: string;
  sourceSystem: string;
  sourceObject: string;
  schemaVersion: number;
  validFrom: string;
  validTo?: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, any>;
  extensionFields: ExtensionField[];
  rawRecordReference?: string;
}

/**
 * 5. Schema Field Definition
 */
export interface SchemaFieldDefinition {
  name: string;
  type: FieldDataType;
  nullable: FieldNullable;
  path: string;
  isPrimary: boolean;
  isForeignKey: boolean;
  foreignKeyTarget?: string; // e.g. "dataset-ledgers.ledgerId"
  description?: string;
  semanticMeaning?: string;
  source: string;
  confidence: ConfidenceLevel;
  defaultValue?: any;
}

/**
 * 6. Schema Relationship Definition
 */
export interface SchemaRelationshipDefinition {
  relationshipId: string;
  targetDatasetId: string;
  type: '1:1' | '1:N' | 'N:1' | 'N:M';
  sourceField: string;
  targetField: string;
  confidence: ConfidenceLevel;
  description?: string;
}

/**
 * 7. Schema Registry Model
 */
export interface SchemaRegistryItem {
  schemaId: string;
  datasetId: string;
  version: number;
  fingerprint: string;
  fields: SchemaFieldDefinition[];
  relationships: SchemaRelationshipDefinition[];
  grain: string;
  createdAt: string;
  status: SchemaStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

/**
 * 8. Schema Change & Compatibility Analysis
 */
export interface SchemaFieldDiff {
  fieldName: string;
  changeType: 'Added' | 'Removed' | 'TypeChanged' | 'NullabilityChanged' | 'DescriptionUpdated';
  oldType?: FieldDataType;
  newType?: FieldDataType;
  oldNullable?: FieldNullable;
  newNullable?: FieldNullable;
  impact: 'Safe' | 'MigrationRequired' | 'Breaking';
  details: string;
}

export interface SchemaRelationshipDiff {
  relationshipId: string;
  changeType: 'Added' | 'Removed' | 'Modified';
  details: string;
}

export interface SchemaComparisonResult {
  comparisonId: string;
  schemaA: {
    schemaId: string;
    version: number;
    datasetId: string;
    status: SchemaStatus;
  };
  schemaB: {
    schemaId: string;
    version: number;
    datasetId: string;
    status: SchemaStatus;
  };
  compatibility: SchemaCompatibilityType;
  grainChanged: boolean;
  oldGrain?: string;
  newGrain?: string;
  fieldDiffs: SchemaFieldDiff[];
  relationshipDiffs: SchemaRelationshipDiff[];
  summary: {
    addedFieldsCount: number;
    removedFieldsCount: number;
    modifiedFieldsCount: number;
    addedRelationshipsCount: number;
    removedRelationshipsCount: number;
    breakingChangesCount: number;
  };
  breakingReasons: string[];
  migrationSuggestions: string[];
}

/**
 * 9. Field Catalog Item
 */
export interface FieldCatalogItem {
  fieldId: string;
  fieldName: string;
  type: FieldDataType;
  datasetId: string;
  datasetName: string;
  datasetCategory: DatasetCategory;
  source: string;
  path: string;
  semanticMeaning: string;
  confidence: ConfidenceLevel;
  nullable: FieldNullable;
  isPrimary: boolean;
  isForeignKey: boolean;
  foreignKeyTarget?: string;
}

/**
 * =========================================================================
 * PHASE 32B: CANONICAL NORMALIZATION LAYER TYPES
 * =========================================================================
 */

export type GroupNature = 'Assets' | 'Liabilities' | 'Income' | 'Expenses' | 'Unknown';

export type PartyType = 'Customer' | 'Supplier' | 'Employee' | 'Other' | 'Unknown';

export type NormalizationStatusType = 'Not Available' | 'Pending' | 'Processing' | 'Complete' | 'Partial' | 'Failed';

export interface PreservedMonetaryValue {
  originalValue: any;
  normalizedValue: number;
  originalCurrency?: string;
  isDebit?: boolean;
}

export interface PreservedQuantityValue {
  originalValue: any;
  normalizedValue: number;
  unit?: string;
}

export interface PreservedDateValue {
  originalSourceDate: string;
  normalizedDate: string;
}

export interface LedgerLineage {
  sourceDataset: string;
  sourceRecord: string;
  sourceFieldPath?: string;
  schemaVersion: number;
  mappingVersion: string | number;
  transformationRules?: string[];
  extractionTimestamp: string;
}

export interface HierarchyIntegrityIssue {
  issueId: string;
  type:
    | 'MissingParent'
    | 'OrphanGroup'
    | 'CircularHierarchy'
    | 'DuplicateSourceId'
    | 'DuplicateLedgerName'
    | 'DuplicateItemName'
    | 'MissingLedgerInVoucher'
    | 'MissingStockItemInMovement'
    | 'MissingGodownInMovement'
    | 'UnlinkedParty'
    | 'UnlinkedCostCentre'
    | 'UnlinkedTaxEntity';
  severity: 'Warning' | 'High' | 'Critical';
  targetEntity:
    | 'Group'
    | 'Ledger'
    | 'Party'
    | 'Voucher'
    | 'VoucherLine'
    | 'StockGroup'
    | 'StockItem'
    | 'Godown'
    | 'Batch'
    | 'CostCentre'
    | 'TaxEntity'
    | 'Employee'
    | 'BankAccount';
  targetId: string;
  companyId: string;
  description: string;
  details?: Record<string, any>;
  detectedAt: string;
}

/**
 * 10. Canonical Group
 */
export interface CanonicalGroup {
  groupId: string;
  sourceId: string;
  name: string;
  parentGroupId?: string;
  parentGroupName?: string;
  nature: GroupNature;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    sourcePath?: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 11. Canonical Ledger
 */
export interface CanonicalLedger {
  ledgerId: string;
  sourceId: string;
  name: string;
  parentGroupId?: string;
  parentGroupName?: string;
  openingBalance: PreservedMonetaryValue;
  closingBalance: PreservedMonetaryValue;
  currency?: string;
  isActive: boolean;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  lineage: LedgerLineage;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  isDuplicateNameFlagged?: boolean;
}

/**
 * 12. Canonical Party
 */
export interface CanonicalParty {
  partyId: string;
  sourceId: string;
  name: string;
  partyType: PartyType;
  ledgerId?: string;
  taxRegistration?: {
    gstin?: string;
    pan?: string;
    taxType?: string;
    stateCode?: string;
  };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    mobile?: string;
    contactPerson?: string;
  };
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  evidence: string[];
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
}

/**
 * 13. Canonical Voucher
 */
export interface CanonicalVoucher {
  voucherId: string;
  sourceId: string;
  voucherNumber: string;
  voucherType: string;
  date: PreservedDateValue;
  effectiveDate?: PreservedDateValue;
  reference?: string;
  narration?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  partyId?: string;
  partyName?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 14. Canonical Voucher Line
 */
export interface CanonicalVoucherLine {
  voucherLineId: string;
  voucherId: string;
  ledgerId: string;
  ledgerName: string;
  partyId?: string;
  stockItemId?: string;
  quantity?: PreservedQuantityValue;
  rate?: PreservedMonetaryValue;
  amount: PreservedMonetaryValue;
  taxId?: string;
  costCentreId?: string;
  bankingId?: string;
  sourceId: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
}

/**
 * =========================================================================
 * PHASE 32C: INVENTORY, TAX, COST CENTRE, PAYROLL & BANKING CANONICAL MODELS
 * =========================================================================
 */

/**
 * 16. Canonical Stock Group
 */
export interface CanonicalStockGroup {
  stockGroupId: string;
  sourceId: string;
  name: string;
  parentStockGroupId?: string;
  parentStockGroupName?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  isPrimary?: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    sourcePath?: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 17. Canonical Stock Item
 */
export interface CanonicalStockItem {
  itemId: string;
  sourceId: string;
  name: string;
  stockGroupId?: string;
  stockGroupName?: string;
  unit: {
    originalUnit: string;
    normalizedUnit?: string;
  };
  openingQuantity: PreservedQuantityValue;
  closingQuantity: PreservedQuantityValue;
  openingValue: PreservedMonetaryValue;
  closingValue: PreservedMonetaryValue;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  isDuplicateNameFlagged?: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    sourcePath?: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 18. Canonical Godown (Warehouse / Location)
 */
export interface CanonicalGodown {
  godownId: string;
  sourceId: string;
  name: string;
  parentGodownId?: string;
  parentGodownName?: string;
  isPrimary?: boolean;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    sourcePath?: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 19. Canonical Batch / Lot
 */
export interface CanonicalBatch {
  batchId: string;
  sourceId: string;
  batchName: string;
  stockItemId: string;
  stockItemName?: string;
  godownId?: string;
  godownName?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  serialNumber?: string;
  lotNumber?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 20. Canonical Inventory Movement
 */
export type InventoryMovementType =
  | 'Receipt'
  | 'Issue'
  | 'Transfer'
  | 'Adjustment'
  | 'Opening'
  | 'Closing'
  | 'Other'
  | 'Unknown';

export interface CanonicalInventoryMovement {
  movementId: string;
  voucherId: string;
  voucherLineId?: string;
  stockItemId: string;
  stockItemName: string;
  godownId?: string;
  godownName?: string;
  batchId?: string;
  batchName?: string;
  quantity: PreservedQuantityValue;
  rate: PreservedMonetaryValue;
  value: PreservedMonetaryValue;
  movementType: InventoryMovementType;
  date: PreservedDateValue;
  companyId: string;
  sourceId: string;
  source: string;
  schemaVersion: number;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 21. Canonical Tax Entity
 */
export interface CanonicalTaxEntity {
  taxId: string;
  sourceId: string;
  name: string;
  type: string;
  rate?: number;
  registration?: string;
  jurisdiction?: string;
  ledgerId?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 22. Canonical Tax Transaction
 */
export interface CanonicalTaxTransaction {
  taxTransactionId: string;
  voucherId: string;
  voucherLineId?: string;
  taxId: string;
  taxName: string;
  taxableValue: PreservedMonetaryValue;
  taxAmount: PreservedMonetaryValue;
  taxRate?: number;
  taxComponent: string;
  partyId?: string;
  partyName?: string;
  ledgerId?: string;
  stockItemId?: string;
  companyId: string;
  sourceId: string;
  source: string;
  schemaVersion: number;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 23. Canonical Cost Centre Category
 */
export interface CanonicalCostCentreCategory {
  categoryId: string;
  sourceId: string;
  name: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 24. Canonical Cost Centre
 */
export interface CanonicalCostCentre {
  costCentreId: string;
  sourceId: string;
  name: string;
  parentId?: string;
  parentName?: string;
  categoryId?: string;
  categoryName?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 25. Canonical Employee (Payroll Domain)
 */
export type EmployeeStatus = 'Active' | 'Inactive' | 'OnLeave' | 'Terminated' | 'Unknown';

export interface CanonicalEmployee {
  employeeId: string;
  sourceId: string;
  name: string;
  employeeGroup?: string;
  department?: string;
  designation?: string;
  status: EmployeeStatus;
  joiningDate?: string;
  panMasked?: string;
  bankAccountNumberMasked?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  isRestricted: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 26. Canonical Payroll Period
 */
export interface CanonicalPayrollPeriod {
  periodId: string;
  sourceId: string;
  name: string;
  startDate: string;
  endDate: string;
  financialYear?: string;
  companyId: string;
  source: string;
  schemaVersion: number;
  isClosed: boolean;
}

/**
 * 27. Canonical Payroll Transaction
 */
export interface CanonicalPayrollTransaction {
  payrollTransactionId: string;
  employeeId: string;
  employeeName: string;
  periodId: string;
  periodName?: string;
  component: string;
  componentType: 'Earning' | 'Deduction' | 'Statutory' | 'Reimbursement' | 'Other';
  amount: PreservedMonetaryValue;
  date: PreservedDateValue;
  voucherId?: string;
  companyId: string;
  sourceId: string;
  source: string;
  schemaVersion: number;
  isRestricted: boolean;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 28. Canonical Bank Account (Banking Domain)
 */
export interface CanonicalBankAccount {
  bankAccountId: string;
  sourceId: string;
  name: string;
  ledgerId?: string;
  ledgerName?: string;
  bankName?: string;
  accountNumberMasked?: string;
  accountType?: string;
  ifscCode?: string;
  branch?: string;
  currency?: string;
  openingBalance?: PreservedMonetaryValue;
  closingBalance?: PreservedMonetaryValue;
  companyId: string;
  source: string;
  schemaVersion: number;
  isCurrent: boolean;
  isRestricted: boolean;
  validFrom: string;
  validTo?: string;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 29. Canonical Bank Transaction
 */
export interface CanonicalBankTransaction {
  bankTransactionId: string;
  voucherId?: string;
  voucherLineId?: string;
  bankAccountId: string;
  bankAccountName: string;
  date: PreservedDateValue;
  reference?: string;
  instrumentNumber?: string;
  instrumentDate?: string;
  amount: PreservedMonetaryValue;
  partyId?: string;
  partyName?: string;
  transactionType: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Charges' | 'Interest' | 'Other';
  reconciliationDate?: string;
  companyId: string;
  sourceId: string;
  source: string;
  schemaVersion: number;
  isRestricted: boolean;
  rawRecordReference?: string;
  extensionFields: ExtensionField[];
  lineage: {
    sourceDataset: string;
    sourceRecord: string;
    schemaVersion: number;
    extractedAt: string;
  };
}

/**
 * 30. Normalization Dataset Status Tracking (Universal)
 */
export type CanonicalDatasetKey =
  | 'Groups'
  | 'Ledgers'
  | 'Parties'
  | 'Vouchers'
  | 'VoucherLines'
  | 'StockGroups'
  | 'StockItems'
  | 'Godowns'
  | 'Batches'
  | 'InventoryMovements'
  | 'TaxEntities'
  | 'TaxTransactions'
  | 'CostCentreCategories'
  | 'CostCentres'
  | 'Employees'
  | 'PayrollPeriods'
  | 'PayrollTransactions'
  | 'BankAccounts'
  | 'BankTransactions';

export interface DatasetNormalizationState {
  datasetKey: CanonicalDatasetKey;
  datasetId: string;
  status: NormalizationStatusType;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: { recordId: string; error: string; timestamp: string }[];
  lastNormalizedAt?: string;
}


