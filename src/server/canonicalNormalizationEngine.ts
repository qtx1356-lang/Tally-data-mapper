/**
 * Phase 32B - Canonical Normalization Engine for Accounting Masters and Voucher Data
 *
 * Implements:
 * 1. Canonical Group normalization with unknown nature handling & Group Hierarchy integrity checks
 * 2. Canonical Ledger normalization with value preservation, stable identity & lineage
 * 3. Canonical Party normalization with evidence-based party typing (Customer, Supplier, Employee, Other, Unknown)
 * 4. Party <-> Ledger relationship creation via Phase 31 relationship engine
 * 5. Canonical Voucher & Voucher-Line normalization with grain enforcement & date/monetary preservation
 * 6. Phase 31 Accounting Graph integration (Company -> Group -> Ledger -> Voucher -> VoucherLine)
 * 7. Phase 32A Data Catalog dataset registration (Groups, Ledgers, Parties, Vouchers, Voucher Lines)
 * 8. Strict Company Isolation & Duplicate Protection
 * 9. Comprehensive error resilience & audit logging
 */

import {
  CanonicalGroup,
  CanonicalLedger,
  CanonicalParty,
  CanonicalVoucher,
  CanonicalVoucherLine,
  CanonicalStockGroup,
  CanonicalStockItem,
  CanonicalGodown,
  CanonicalBatch,
  CanonicalInventoryMovement,
  CanonicalTaxEntity,
  CanonicalTaxTransaction,
  CanonicalCostCentreCategory,
  CanonicalCostCentre,
  CanonicalEmployee,
  CanonicalPayrollPeriod,
  CanonicalPayrollTransaction,
  CanonicalBankAccount,
  CanonicalBankTransaction,
  GroupNature,
  PartyType,
  PreservedMonetaryValue,
  PreservedDateValue,
  PreservedQuantityValue,
  HierarchyIntegrityIssue,
  DatasetNormalizationState,
  NormalizationStatusType,
  ExtensionField,
  DatasetMetadata,
  SchemaRegistryItem
} from '../types/phase32UniversalModel';
import { universalDataModelEngine } from './universalDataModelEngine';
import { canonicalInventoryEngine } from './canonicalInventoryEngine';
import { canonicalTaxCostCentreEngine } from './canonicalTaxCostCentreEngine';
import { canonicalPayrollBankingEngine } from './canonicalPayrollBankingEngine';
import { GraphNode, GraphEdge, RelationshipType } from '../types/phase31ObjectGraph';

export class CanonicalNormalizationEngine {
  // In-memory canonical repositories indexed by Canonical ID
  private canonicalGroups: Map<string, CanonicalGroup> = new Map();
  private canonicalLedgers: Map<string, CanonicalLedger> = new Map();
  private canonicalParties: Map<string, CanonicalParty> = new Map();
  private canonicalVouchers: Map<string, CanonicalVoucher> = new Map();
  private canonicalVoucherLines: Map<string, CanonicalVoucherLine> = new Map();

  // Integrity Issues Log
  private integrityIssues: HierarchyIntegrityIssue[] = [];

  // Normalization Status
  private normalizationStates: Map<string, DatasetNormalizationState> = new Map();

  // Phase 31 Graph sync cache
  private graphNodes: Map<string, GraphNode> = new Map();
  private graphEdges: Map<string, GraphEdge> = new Map();

  constructor() {
    this.registerCanonicalDatasets();
    this.seedInitialCanonicalMastersAndVouchers();
  }

  // =========================================================================
  // 1. DATA CATALOG & SCHEMA REGISTRY INITIALIZATION (Phase 32A Integration)
  // =========================================================================

  private registerCanonicalDatasets() {
    const now = '2026-03-08T08:00:00Z';
    const companies = ['CMP-001', 'CMP-002'];

    for (const companyId of companies) {
      // 1. Canonical Groups
      const dsGroup: DatasetMetadata = {
        datasetId: `ds-canonical-groups-${companyId}`,
        name: `Canonical Groups Master (${companyId})`,
        displayName: `Chart of Accounts - Groups Master`,
        category: 'Master',
        companyId,
        source: 'Tally Group Master Gateway',
        sourceObject: 'GROUP',
        schemaVersion: 1,
        grain: 'Group',
        status: 'Active',
        description: 'Normalized accounting group taxonomy, nature classifications, and parent-child hierarchies.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsGroup);

      const schGroupV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-groups-${companyId}-v1`,
        datasetId: dsGroup.datasetId,
        version: 1,
        grain: 'Group',
        status: 'Approved',
        approvedBy: 'Phase 32B Normalizer',
        approvedAt: now,
        fields: [
          { name: 'groupId', type: 'String', nullable: 'Required', path: 'GROUP.GUID', isPrimary: true, isForeignKey: false, source: 'Canonical Group Engine', confidence: 'High', description: 'Canonical Group ID' },
          { name: 'sourceId', type: 'String', nullable: 'Required', path: 'GROUP.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Source ID' },
          { name: 'name', type: 'String', nullable: 'Required', path: 'GROUP.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High', description: 'Group Name' },
          { name: 'parentGroupId', type: 'String', nullable: 'Optional', path: 'GROUP.PARENT', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsGroup.datasetId}.groupId`, source: 'Tally Master', confidence: 'High', description: 'Parent Group ID' },
          { name: 'nature', type: 'String', nullable: 'Required', path: 'GROUP.NATURE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'Medium', description: 'Accounting Nature (Assets/Liabilities/Income/Expenses/Unknown)' },
          { name: 'companyId', type: 'String', nullable: 'Required', path: 'COMPANY.ID', isPrimary: false, isForeignKey: false, source: 'System', confidence: 'High' }
        ],
        relationships: [
          { relationshipId: `rel-grp-parent-${companyId}`, targetDatasetId: dsGroup.datasetId, type: 'N:1', sourceField: 'parentGroupId', targetField: 'groupId', confidence: 'High', description: 'Group belongs to parent group' }
        ]
      };
      universalDataModelEngine.registerSchema(schGroupV1, 'Approved');

      // 2. Canonical Ledgers
      const dsLedger: DatasetMetadata = {
        datasetId: `ds-canonical-ledgers-${companyId}`,
        name: `Canonical Ledgers Master (${companyId})`,
        displayName: `Chart of Accounts - Ledgers Master`,
        category: 'Master',
        companyId,
        source: 'Tally Ledger Master Gateway',
        sourceObject: 'LEDGER',
        schemaVersion: 1,
        grain: 'Ledger',
        status: 'Active',
        description: 'Normalized accounting ledgers with balance preservation, lineage traces, and group relationships.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsLedger);

      const schLedgerV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-ledgers-${companyId}-v1`,
        datasetId: dsLedger.datasetId,
        version: 1,
        grain: 'Ledger',
        status: 'Approved',
        approvedBy: 'Phase 32B Normalizer',
        approvedAt: now,
        fields: [
          { name: 'ledgerId', type: 'String', nullable: 'Required', path: 'LEDGER.GUID', isPrimary: true, isForeignKey: false, source: 'Canonical Ledger Engine', confidence: 'High', description: 'Canonical Ledger ID' },
          { name: 'sourceId', type: 'String', nullable: 'Required', path: 'LEDGER.GUID', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'name', type: 'String', nullable: 'Required', path: 'LEDGER.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'parentGroupId', type: 'String', nullable: 'Optional', path: 'LEDGER.PARENT', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsGroup.datasetId}.groupId`, source: 'Tally Master', confidence: 'High' },
          { name: 'openingBalance', type: 'Decimal', nullable: 'Required', path: 'LEDGER.OPENINGBALANCE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'closingBalance', type: 'Decimal', nullable: 'Required', path: 'LEDGER.CLOSINGBALANCE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'currency', type: 'String', nullable: 'Optional', path: 'LEDGER.CURRENCY', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'Medium' },
          { name: 'isActive', type: 'Boolean', nullable: 'Required', path: 'LEDGER.ISACTIVE', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' }
        ],
        relationships: [
          { relationshipId: `rel-led-grp-${companyId}`, targetDatasetId: dsGroup.datasetId, type: 'N:1', sourceField: 'parentGroupId', targetField: 'groupId', confidence: 'High', description: 'Ledger belongs to Group' }
        ]
      };
      universalDataModelEngine.registerSchema(schLedgerV1, 'Approved');

      // 3. Canonical Parties
      const dsParty: DatasetMetadata = {
        datasetId: `ds-canonical-parties-${companyId}`,
        name: `Canonical Parties Master (${companyId})`,
        displayName: `Business Counterparties (Customers, Suppliers, Employees)`,
        category: 'Master',
        companyId,
        source: 'Tally Party & Ledger Evidence Engine',
        sourceObject: 'PARTY',
        schemaVersion: 1,
        grain: 'Party',
        status: 'Active',
        description: 'Normalized counterparty repository with tax registration, addresses, and evidence-based party classification.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsParty);

      const schPartyV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-parties-${companyId}-v1`,
        datasetId: dsParty.datasetId,
        version: 1,
        grain: 'Party',
        status: 'Approved',
        approvedBy: 'Phase 32B Normalizer',
        approvedAt: now,
        fields: [
          { name: 'partyId', type: 'String', nullable: 'Required', path: 'PARTY.GUID', isPrimary: true, isForeignKey: false, source: 'Canonical Party Engine', confidence: 'High' },
          { name: 'name', type: 'String', nullable: 'Required', path: 'PARTY.NAME', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' },
          { name: 'partyType', type: 'String', nullable: 'Required', path: 'PARTY.TYPE', isPrimary: false, isForeignKey: false, source: 'Evidence Engine', confidence: 'High', description: 'Customer/Supplier/Employee/Other/Unknown' },
          { name: 'ledgerId', type: 'String', nullable: 'Optional', path: 'PARTY.LEDGERGUID', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsLedger.datasetId}.ledgerId`, source: 'Evidence Engine', confidence: 'High' },
          { name: 'taxRegistration', type: 'Object', nullable: 'Optional', path: 'PARTY.TAXINFO', isPrimary: false, isForeignKey: false, source: 'Tally Master', confidence: 'High' }
        ],
        relationships: [
          { relationshipId: `rel-prt-led-${companyId}`, targetDatasetId: dsLedger.datasetId, type: '1:1', sourceField: 'ledgerId', targetField: 'ledgerId', confidence: 'High', description: 'Party is represented by Ledger' }
        ]
      };
      universalDataModelEngine.registerSchema(schPartyV1, 'Approved');

      // 4. Canonical Vouchers
      const dsVoucher: DatasetMetadata = {
        datasetId: `ds-canonical-vouchers-${companyId}`,
        name: `Canonical Vouchers Header (${companyId})`,
        displayName: `Accounting Transactions (Vouchers Header)`,
        category: 'Transaction',
        companyId,
        source: 'Tally Daybook Master Gateway',
        sourceObject: 'VOUCHER',
        schemaVersion: 1,
        grain: 'Voucher',
        status: 'Active',
        description: 'Normalized transaction headers representing discrete double-entry vouchers with preserved date metadata.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsVoucher);

      const schVoucherV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-vouchers-${companyId}-v1`,
        datasetId: dsVoucher.datasetId,
        version: 1,
        grain: 'Voucher',
        status: 'Approved',
        approvedBy: 'Phase 32B Normalizer',
        approvedAt: now,
        fields: [
          { name: 'voucherId', type: 'String', nullable: 'Required', path: 'VOUCHER.GUID', isPrimary: true, isForeignKey: false, source: 'Canonical Voucher Engine', confidence: 'High' },
          { name: 'voucherNumber', type: 'String', nullable: 'Required', path: 'VOUCHER.VOUCHERNUMBER', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
          { name: 'voucherType', type: 'String', nullable: 'Required', path: 'VOUCHER.VOUCHERTYPENAME', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
          { name: 'date', type: 'Date', nullable: 'Required', path: 'VOUCHER.DATE', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
          { name: 'reference', type: 'String', nullable: 'Optional', path: 'VOUCHER.REFERENCE', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'Medium' },
          { name: 'narration', type: 'String', nullable: 'Optional', path: 'VOUCHER.NARRATION', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'Medium' },
          { name: 'partyId', type: 'String', nullable: 'Optional', path: 'VOUCHER.PARTYLEDGERNAME', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsParty.datasetId}.partyId`, source: 'Evidence Engine', confidence: 'Medium' }
        ],
        relationships: [
          { relationshipId: `rel-vch-prt-${companyId}`, targetDatasetId: dsParty.datasetId, type: 'N:1', sourceField: 'partyId', targetField: 'partyId', confidence: 'Medium', description: 'Voucher involves Party' }
        ]
      };
      universalDataModelEngine.registerSchema(schVoucherV1, 'Approved');

      // 5. Canonical Voucher Lines
      const dsVoucherLine: DatasetMetadata = {
        datasetId: `ds-canonical-voucher-lines-${companyId}`,
        name: `Canonical Voucher Lines (${companyId})`,
        displayName: `Accounting Transactions (Voucher Line Items)`,
        category: 'Transaction',
        companyId,
        source: 'Tally Daybook Line Entry Gateway',
        sourceObject: 'VOUCHERLINE',
        schemaVersion: 1,
        grain: 'VoucherLine',
        status: 'Active',
        description: 'Normalized individual posting entries representing ledger debits/credits, amounts, and multi-object relationships.',
        createdAt: now,
        updatedAt: now
      };
      universalDataModelEngine.createDataset(dsVoucherLine);

      const schVoucherLineV1: Omit<SchemaRegistryItem, 'createdAt' | 'fingerprint'> = {
        schemaId: `sch-canonical-voucher-lines-${companyId}-v1`,
        datasetId: dsVoucherLine.datasetId,
        version: 1,
        grain: 'VoucherLine',
        status: 'Approved',
        approvedBy: 'Phase 32B Normalizer',
        approvedAt: now,
        fields: [
          { name: 'voucherLineId', type: 'String', nullable: 'Required', path: 'VOUCHERLINE.LINEID', isPrimary: true, isForeignKey: false, source: 'Canonical Voucher Engine', confidence: 'High' },
          { name: 'voucherId', type: 'String', nullable: 'Required', path: 'VOUCHERLINE.VOUCHERGUID', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsVoucher.datasetId}.voucherId`, source: 'Tally Daybook', confidence: 'High' },
          { name: 'ledgerId', type: 'String', nullable: 'Required', path: 'VOUCHERLINE.LEDGERGUID', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsLedger.datasetId}.ledgerId`, source: 'Tally Daybook', confidence: 'High' },
          { name: 'amount', type: 'Decimal', nullable: 'Required', path: 'VOUCHERLINE.AMOUNT', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'High' },
          { name: 'partyId', type: 'String', nullable: 'Optional', path: 'VOUCHERLINE.PARTYGUID', isPrimary: false, isForeignKey: true, foreignKeyTarget: `${dsParty.datasetId}.partyId`, source: 'Evidence Engine', confidence: 'Medium' },
          { name: 'stockItemId', type: 'String', nullable: 'Optional', path: 'VOUCHERLINE.STOCKITEMGUID', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'Medium' },
          { name: 'costCentreId', type: 'String', nullable: 'Optional', path: 'VOUCHERLINE.COSTCENTREGUID', isPrimary: false, isForeignKey: false, source: 'Tally Daybook', confidence: 'Medium' }
        ],
        relationships: [
          { relationshipId: `rel-vchl-vch-${companyId}`, targetDatasetId: dsVoucher.datasetId, type: 'N:1', sourceField: 'voucherId', targetField: 'voucherId', confidence: 'High', description: 'Voucher line belongs to Voucher header' },
          { relationshipId: `rel-vchl-led-${companyId}`, targetDatasetId: dsLedger.datasetId, type: 'N:1', sourceField: 'ledgerId', targetField: 'ledgerId', confidence: 'High', description: 'Voucher line posts to Ledger' }
        ]
      };
      universalDataModelEngine.registerSchema(schVoucherLineV1, 'Approved');

      // Initialize dataset normalization states
      const entityKeys: Array<'Groups' | 'Ledgers' | 'Parties' | 'Vouchers' | 'VoucherLines'> = [
        'Groups',
        'Ledgers',
        'Parties',
        'Vouchers',
        'VoucherLines'
      ];
      for (const key of entityKeys) {
        this.normalizationStates.set(`${companyId}-${key}`, {
          datasetKey: key,
          datasetId: `ds-canonical-${key.toLowerCase()}-${companyId}`,
          status: 'Complete',
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          errors: [],
          lastNormalizedAt: now
        });
      }
    }
  }

  // =========================================================================
  // 2. CANONICAL GROUP NORMALIZATION & HIERARCHY
  // =========================================================================

  public normalizeGroup(
    raw: Record<string, any>,
    companyId: string,
    options: {
      sourceDataset?: string;
      sourceReport?: string;
      extractionId?: string;
    } = {}
  ): CanonicalGroup {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required for group normalization.');

    const now = new Date().toISOString();
    const sourceId = String(raw.groupId || raw.guid || raw.sourceId || raw.name || `GRP-${Date.now()}`).trim();
    const name = String(raw.name || raw.groupName || sourceId).trim();

    // Nature evaluation: If Nature is not explicitly supported by source, store as 'Unknown'
    let nature: GroupNature = 'Unknown';
    const explicitNature = (raw.nature || raw.natureOfGroup || raw.NATURE || '').toString().trim().toLowerCase();
    if (explicitNature.includes('asset')) nature = 'Assets';
    else if (explicitNature.includes('liabilit')) nature = 'Liabilities';
    else if (explicitNature.includes('income') || explicitNature.includes('revenue')) nature = 'Income';
    else if (explicitNature.includes('expense') || explicitNature.includes('expenditure')) nature = 'Expenses';
    else nature = 'Unknown'; // Strict: do not guess!

    // Parent group resolution
    const parentGroupName = raw.parentGroup || raw.parent || raw.parentGroupName ? String(raw.parentGroup || raw.parent || raw.parentGroupName).trim() : undefined;
    let parentGroupId: string | undefined = undefined;

    if (parentGroupName) {
      // Find matching parent group within this company
      const foundParent = Array.from(this.canonicalGroups.values()).find(
        (g) => g.companyId === companyId && (g.name.toLowerCase() === parentGroupName.toLowerCase() || g.sourceId === parentGroupName)
      );
      if (foundParent) {
        parentGroupId = foundParent.groupId;
      }
    }

    const groupId = `grp-${companyId}-${this.slugify(sourceId)}`;

    // Known canonical fields
    const knownKeys = new Set([
      'groupid', 'guid', 'sourceid', 'name', 'groupname', 'parent', 'parentgroup', 'parentgroupname', 'nature', 'natureofgroup', 'companyid', 'source', 'isprimary'
    ]);

    // Preserve unknown source fields using Phase 32A ExtensionField mechanism
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `GROUP.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Group Master',
          confidence: 'High',
          semanticMeaning: 'Preserved source group attribute',
          discoveredAt: now
        });
      }
    }

    // Duplicate Protection & Versioning
    const existing = this.canonicalGroups.get(groupId);
    if (existing) {
      existing.isCurrent = false;
      existing.validTo = now;
    }

    const canonicalGroup: CanonicalGroup = {
      groupId,
      sourceId,
      name,
      parentGroupId,
      parentGroupName,
      nature,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Group Master XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-groups-${companyId}`,
        sourceRecord: sourceId,
        sourcePath: 'GROUP',
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.canonicalGroups.set(groupId, canonicalGroup);
    this.updateNormalizationMetric(companyId, 'Groups', true);

    return canonicalGroup;
  }

  public detectGroupHierarchyIssues(companyId: string): HierarchyIntegrityIssue[] {
    const issues: HierarchyIntegrityIssue[] = [];
    const now = new Date().toISOString();
    const groups = Array.from(this.canonicalGroups.values()).filter((g) => g.companyId === companyId && g.isCurrent);
    const groupNameMap = new Map<string, CanonicalGroup>();
    const groupIdMap = new Map<string, CanonicalGroup>();
    const seenSourceIds = new Set<string>();

    for (const g of groups) {
      groupNameMap.set(g.name.toLowerCase(), g);
      groupIdMap.set(g.groupId, g);

      // Check Duplicate Source IDs
      if (seenSourceIds.has(g.sourceId)) {
        issues.push({
          issueId: `ISSUE-DUP-SRC-${g.groupId}`,
          type: 'DuplicateSourceId',
          severity: 'High',
          targetEntity: 'Group',
          targetId: g.groupId,
          companyId,
          description: `Duplicate source group identifier '${g.sourceId}' detected in Company ${companyId}.`,
          details: { sourceId: g.sourceId, groupName: g.name },
          detectedAt: now
        });
      } else {
        seenSourceIds.add(g.sourceId);
      }
    }

    const standardPrimaryRoots = new Set([
      'primary', 'capital account', 'loans (liability)', 'current liabilities', 'fixed assets', 'investments', 'current assets', 'branch / divisions', 'misc. expenses (asset)', 'suspense a/c', 'sales accounts', 'purchase accounts', 'direct incomes', 'indirect incomes', 'direct expenses', 'indirect expenses'
    ]);

    for (const g of groups) {
      // 1. Missing Parent Check
      if (g.parentGroupName) {
        const parentFound = groupNameMap.has(g.parentGroupName.toLowerCase());
        if (!parentFound) {
          issues.push({
            issueId: `ISSUE-MISSPARENT-${g.groupId}`,
            type: 'MissingParent',
            severity: 'High',
            targetEntity: 'Group',
            targetId: g.groupId,
            companyId,
            description: `Group '${g.name}' references non-existent parent group '${g.parentGroupName}'.`,
            details: { groupName: g.name, parentGroupName: g.parentGroupName },
            detectedAt: now
          });
        }
      } else if (!standardPrimaryRoots.has(g.name.toLowerCase())) {
        // 2. Orphan Group Check (Non-standard root with no parent)
        issues.push({
          issueId: `ISSUE-ORPHAN-${g.groupId}`,
          type: 'OrphanGroup',
          severity: 'Warning',
          targetEntity: 'Group',
          targetId: g.groupId,
          companyId,
          description: `Non-primary group '${g.name}' has no parent group assigned (Orphan Group).`,
          details: { groupName: g.name },
          detectedAt: now
        });
      }

      // 3. Circular Hierarchy Check (DFS cycle detection)
      const visited = new Set<string>();
      let curr: CanonicalGroup | undefined = g;
      let depth = 0;
      while (curr && curr.parentGroupName && depth < 20) {
        if (visited.has(curr.name.toLowerCase())) {
          issues.push({
            issueId: `ISSUE-CIRCULAR-${g.groupId}`,
            type: 'CircularHierarchy',
            severity: 'Critical',
            targetEntity: 'Group',
            targetId: g.groupId,
            companyId,
            description: `Circular group hierarchy detected involving group '${g.name}' -> parent '${curr.parentGroupName}'.`,
            details: { initialGroup: g.name, cycleAt: curr.name },
            detectedAt: now
          });
          break;
        }
        visited.add(curr.name.toLowerCase());
        curr = groupNameMap.get(curr.parentGroupName.toLowerCase());
        depth++;
      }
    }

    this.integrityIssues = issues;
    return issues;
  }

  // =========================================================================
  // 3. CANONICAL LEDGER NORMALIZATION & LINEAGE
  // =========================================================================

  public normalizeLedger(
    raw: Record<string, any>,
    companyId: string,
    options: {
      sourceDataset?: string;
      sourceReport?: string;
      extractionId?: string;
      mappingVersion?: string;
    } = {}
  ): CanonicalLedger {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required for ledger normalization.');

    const now = new Date().toISOString();
    // Stable identifier preference: GUID > masterId > sourceId > remoteId
    const sourceId = String(raw.ledgerId || raw.guid || raw.masterId || raw.sourceId || raw.name || `LED-${Date.now()}`).trim();
    const name = String(raw.name || raw.ledgerName || sourceId).trim();
    const parentGroupName = raw.parentGroup || raw.parent || raw.parentGroupName ? String(raw.parentGroup || raw.parent || raw.parentGroupName).trim() : undefined;

    // Resolve parent group ID within company
    let parentGroupId: string | undefined = undefined;
    if (parentGroupName) {
      const p = Array.from(this.canonicalGroups.values()).find(
        (g) => g.companyId === companyId && g.name.toLowerCase() === parentGroupName.toLowerCase()
      );
      if (p) parentGroupId = p.groupId;
    }

    // Preserve accounting monetary values with original source values
    const rawOpening = raw.openingBalance !== undefined ? raw.openingBalance : 0;
    const rawClosing = raw.closingBalance !== undefined ? raw.closingBalance : 0;
    const currency = raw.currency ? String(raw.currency).trim() : 'INR';

    const openingBalance: PreservedMonetaryValue = {
      originalValue: rawOpening,
      normalizedValue: this.parseAmount(rawOpening),
      originalCurrency: currency
    };

    const closingBalance: PreservedMonetaryValue = {
      originalValue: rawClosing,
      normalizedValue: this.parseAmount(rawClosing),
      originalCurrency: currency
    };

    const isActive = raw.isActive !== false && raw.status !== 'Inactive' && raw.status !== 'Deleted';

    const ledgerId = `led-${companyId}-${this.slugify(sourceId)}`;

    // Known canonical fields
    const knownKeys = new Set([
      'ledgerid', 'guid', 'masterid', 'sourceid', 'name', 'ledgername', 'parent', 'parentgroup', 'parentgroupname', 'openingbalance', 'closingbalance', 'currency', 'isactive', 'status', 'companyid', 'source'
    ]);

    // Preserve unknown source fields
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `LEDGER.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Master Ledger',
          confidence: 'High',
          semanticMeaning: 'Preserved source ledger attribute',
          discoveredAt: now
        });
      }
    }

    // Duplicate Name check (flagged, not merged)
    const existingWithSameName = Array.from(this.canonicalLedgers.values()).find(
      (l) => l.companyId === companyId && l.isCurrent && l.sourceId !== sourceId && l.name.toLowerCase() === name.toLowerCase()
    );
    const isDuplicateNameFlagged = !!existingWithSameName;
    if (isDuplicateNameFlagged) {
      this.integrityIssues.push({
        issueId: `ISSUE-DUP-NAME-${ledgerId}`,
        type: 'DuplicateLedgerName',
        severity: 'Warning',
        targetEntity: 'Ledger',
        targetId: ledgerId,
        companyId,
        description: `Potential duplicate ledger name '${name}' detected with distinct source IDs: '${sourceId}' vs '${existingWithSameName?.sourceId}'. Not auto-merged.`,
        details: { name, sourceIdA: sourceId, sourceIdB: existingWithSameName?.sourceId },
        detectedAt: now
      });
    }

    // Duplicate Protection & Versioning
    const existing = this.canonicalLedgers.get(ledgerId);
    if (existing) {
      existing.isCurrent = false;
      existing.validTo = now;
    }

    const canonicalLedger: CanonicalLedger = {
      ledgerId,
      sourceId,
      name,
      parentGroupId,
      parentGroupName,
      openingBalance,
      closingBalance,
      currency,
      isActive,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Ledger Master XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-ledgers-${companyId}`,
        sourceRecord: sourceId,
        sourceFieldPath: 'LEDGER',
        schemaVersion: 1,
        mappingVersion: options.mappingVersion || '32B.1',
        transformationRules: ['ExtractStableGUID', 'PreserveOriginalBalance', 'RetainCurrencyOriginal', 'FlagDuplicateNames'],
        extractionTimestamp: now
      },
      rawRecordReference: options.extractionId,
      extensionFields,
      isDuplicateNameFlagged
    };

    this.canonicalLedgers.set(ledgerId, canonicalLedger);
    this.updateNormalizationMetric(companyId, 'Ledgers', true);

    return canonicalLedger;
  }

  // =========================================================================
  // 4. CANONICAL PARTY NORMALIZATION & PARTY ↔ LEDGER
  // =========================================================================

  public normalizeParty(
    raw: Record<string, any>,
    companyId: string,
    options: {
      sourceDataset?: string;
      sourceReport?: string;
      extractionId?: string;
    } = {}
  ): CanonicalParty {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required for party normalization.');

    const now = new Date().toISOString();
    const sourceId = String(raw.partyId || raw.guid || raw.sourceId || raw.ledgerId || raw.name || `PRT-${Date.now()}`).trim();
    const name = String(raw.name || raw.partyName || sourceId).trim();

    // Evidence-based party typing: Do NOT infer Customer/Supplier solely from name!
    let partyType: PartyType = 'Unknown';
    const evidence: string[] = [];

    const explicitType = (raw.partyType || raw.type || '').toString().toLowerCase();
    const parentGroup = (raw.parentGroup || raw.parent || '').toString().toLowerCase();

    if (explicitType.includes('customer') || explicitType.includes('client')) {
      partyType = 'Customer';
      evidence.push(`Explicit partyType attribute: '${raw.partyType}'`);
    } else if (explicitType.includes('supplier') || explicitType.includes('vendor') || explicitType.includes('creditor')) {
      partyType = 'Supplier';
      evidence.push(`Explicit partyType attribute: '${raw.partyType}'`);
    } else if (explicitType.includes('employee') || explicitType.includes('staff')) {
      partyType = 'Employee';
      evidence.push(`Explicit partyType attribute: '${raw.partyType}'`);
    } else if (parentGroup.includes('sundry debtor') || parentGroup.includes('debtor') || parentGroup.includes('customer')) {
      partyType = 'Customer';
      evidence.push(`Accounting parent group evidence: '${raw.parentGroup}' (Sundry Debtors)`);
    } else if (parentGroup.includes('sundry creditor') || parentGroup.includes('creditor') || parentGroup.includes('supplier') || parentGroup.includes('vendor')) {
      partyType = 'Supplier';
      evidence.push(`Accounting parent group evidence: '${raw.parentGroup}' (Sundry Creditors)`);
    } else if (parentGroup.includes('salary') || parentGroup.includes('payroll') || parentGroup.includes('employee')) {
      partyType = 'Employee';
      evidence.push(`Accounting parent group evidence: '${raw.parentGroup}' (Payroll/Employee)`);
    } else if (raw.gstin || raw.GSTIN || raw.pan || raw.PAN) {
      partyType = 'Other';
      evidence.push(`Tax registration present (GSTIN/PAN) without distinct Customer/Supplier classification`);
    } else {
      partyType = 'Unknown';
      evidence.push(`Insufficient evidence in source to classify PartyType without speculation`);
    }

    // Tax Registration Info
    const gstin = raw.gstin || raw.GSTIN || raw.CUSTOM_GSTIN || raw.gstNumber || undefined;
    const pan = raw.pan || raw.PAN || raw.CUSTOM_PAN_NUMBER || (gstin && gstin.length === 15 ? gstin.substring(2, 12) : undefined);
    const taxRegistration = gstin || pan ? {
      gstin: gstin ? String(gstin).trim() : undefined,
      pan: pan ? String(pan).trim() : undefined,
      taxType: raw.taxType || (gstin ? 'GST Regular' : undefined),
      stateCode: gstin && gstin.length >= 2 ? gstin.substring(0, 2) : undefined
    } : undefined;

    // Address & Contact Info
    const address = (raw.address || raw.ADDRESS || raw.city || raw.state || raw.pincode) ? {
      line1: raw.address || raw.ADDRESS || raw.addressLine1 || undefined,
      line2: raw.addressLine2 || undefined,
      city: raw.city || raw.CITY || undefined,
      state: raw.state || raw.STATE || undefined,
      pincode: raw.pincode || raw.PINCODE || raw.zip || undefined,
      country: raw.country || raw.COUNTRY || 'India'
    } : undefined;

    const contact = (raw.email || raw.phone || raw.mobile || raw.contactPerson || raw.CONTACT_PERSON_DIRECT) ? {
      email: raw.email || raw.EMAIL || undefined,
      phone: raw.phone || raw.PHONE || undefined,
      mobile: raw.mobile || raw.MOBILE || undefined,
      contactPerson: raw.contactPerson || raw.CONTACT_PERSON_DIRECT || undefined
    } : undefined;

    // Link to Canonical Ledger if available
    let ledgerId: string | undefined = undefined;
    const targetLedgerSource = raw.ledgerId || raw.guid || raw.sourceId || name;
    const matchingLedger = Array.from(this.canonicalLedgers.values()).find(
      (l) => l.companyId === companyId && (l.sourceId === targetLedgerSource || l.name.toLowerCase() === name.toLowerCase())
    );
    if (matchingLedger) {
      ledgerId = matchingLedger.ledgerId;
      evidence.push(`Linked to Canonical Ledger: ${matchingLedger.ledgerId}`);
    }

    const partyId = `party-${companyId}-${this.slugify(sourceId)}`;

    // Known canonical keys
    const knownKeys = new Set([
      'partyid', 'guid', 'sourceid', 'name', 'partyname', 'partytype', 'type', 'ledgerid', 'parent', 'parentgroup', 'gstin', 'pan', 'custom_pan_number', 'custom_gstin', 'address', 'city', 'state', 'pincode', 'country', 'email', 'phone', 'mobile', 'contactperson', 'contact_person_direct', 'companyid', 'source'
    ]);

    // Unknown fields preservation
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `PARTY.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Party Master',
          confidence: 'High',
          semanticMeaning: 'Preserved source party attribute',
          discoveredAt: now
        });
      }
    }

    const canonicalParty: CanonicalParty = {
      partyId,
      sourceId,
      name,
      partyType,
      ledgerId,
      taxRegistration,
      address,
      contact,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Party Engine',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      evidence,
      rawRecordReference: options.extractionId,
      extensionFields
    };

    this.canonicalParties.set(partyId, canonicalParty);
    this.updateNormalizationMetric(companyId, 'Parties', true);

    return canonicalParty;
  }

  // =========================================================================
  // 5. CANONICAL VOUCHER NORMALIZATION & GRAIN
  // =========================================================================

  public normalizeVoucher(
    raw: Record<string, any>,
    companyId: string,
    options: {
      sourceDataset?: string;
      sourceReport?: string;
      extractionId?: string;
    } = {}
  ): CanonicalVoucher {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required for voucher normalization.');

    const now = new Date().toISOString();
    // Grain: One canonical row per source voucher identity
    const sourceId = String(raw.voucherId || raw.guid || raw.sourceId || raw.voucherNumber || `VCH-${Date.now()}`).trim();
    const voucherNumber = String(raw.voucherNumber || raw.voucherno || raw.invNo || sourceId).trim();
    const voucherType = String(raw.voucherType || raw.vouchertypename || raw.type || 'Journal').trim();

    // Date preservation: Original source date + parsed ISO date (NO timezone assumption)
    const rawDate = raw.date || raw.voucherDate || raw.DATE || '2026-03-01';
    const date: PreservedDateValue = {
      originalSourceDate: String(rawDate),
      normalizedDate: this.normalizeDateString(String(rawDate))
    };

    let effectiveDate: PreservedDateValue | undefined = undefined;
    if (raw.effectiveDate) {
      effectiveDate = {
        originalSourceDate: String(raw.effectiveDate),
        normalizedDate: this.normalizeDateString(String(raw.effectiveDate))
      };
    }

    const reference = raw.reference || raw.refNo || raw.REFERENCE ? String(raw.reference || raw.refNo || raw.REFERENCE).trim() : undefined;
    const narration = raw.narration || raw.NARRATION ? String(raw.narration || raw.NARRATION).trim() : undefined;

    // Party Link resolution
    let partyId: string | undefined = undefined;
    let partyName: string | undefined = undefined;
    const candidatePartyName = raw.partyName || raw.partyLedgerName || raw.party || undefined;
    if (candidatePartyName) {
      partyName = String(candidatePartyName).trim();
      const p = Array.from(this.canonicalParties.values()).find(
        (party) => party.companyId === companyId && (party.name.toLowerCase() === partyName?.toLowerCase() || party.sourceId === partyName)
      );
      if (p) partyId = p.partyId;
    }

    const voucherId = `vch-${companyId}-${this.slugify(sourceId)}`;

    // Known canonical fields
    const knownKeys = new Set([
      'voucherid', 'guid', 'sourceid', 'vouchernumber', 'voucherno', 'vouchertype', 'vouchertypename', 'date', 'voucherdate', 'effectivedate', 'reference', 'refno', 'narration', 'partyname', 'partyledgername', 'partyid', 'companyid', 'source'
    ]);

    // Unknown fields preservation
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase()) && k !== 'lines' && k !== 'ledgerEntries' && k !== 'allLedgerEntries') {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `VOUCHER.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Daybook',
          confidence: 'High',
          semanticMeaning: 'Preserved source voucher header attribute',
          discoveredAt: now
        });
      }
    }

    const canonicalVoucher: CanonicalVoucher = {
      voucherId,
      sourceId,
      voucherNumber,
      voucherType,
      date,
      effectiveDate,
      reference,
      narration,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Daybook XML',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      partyId,
      partyName,
      rawRecordReference: options.extractionId,
      extensionFields,
      lineage: {
        sourceDataset: options.sourceDataset || `ds-canonical-vouchers-${companyId}`,
        sourceRecord: sourceId,
        schemaVersion: 1,
        extractedAt: now
      }
    };

    this.canonicalVouchers.set(voucherId, canonicalVoucher);
    this.updateNormalizationMetric(companyId, 'Vouchers', true);

    return canonicalVoucher;
  }

  // =========================================================================
  // 6. CANONICAL VOUCHER LINE NORMALIZATION & LINE GRAIN
  // =========================================================================

  public normalizeVoucherLine(
    raw: Record<string, any>,
    companyId: string,
    options: {
      sourceDataset?: string;
      sourceReport?: string;
      extractionId?: string;
      parentVoucherId?: string;
    } = {}
  ): CanonicalVoucherLine {
    if (!companyId) throw new Error('Company Isolation Violation: companyId is required for voucher line normalization.');

    const now = new Date().toISOString();
    // Grain: One row per source voucher line
    const sourceId = String(raw.voucherLineId || raw.lineId || raw.guid || raw.sourceId || `${options.parentVoucherId || 'VCH'}-L${Date.now()}`).trim();
    const rawVoucherId = raw.voucherId || options.parentVoucherId || 'VCH-DEFAULT';
    const voucherId = rawVoucherId.startsWith('vch-') ? rawVoucherId : `vch-${companyId}-${this.slugify(rawVoucherId)}`;

    // Ledger resolution
    const ledgerName = String(raw.ledgerName || raw.ledger || raw.account || 'General Account').trim();
    let ledgerId = `led-${companyId}-${this.slugify(raw.ledgerId || ledgerName)}`;
    const matchingLedger = Array.from(this.canonicalLedgers.values()).find(
      (l) => l.companyId === companyId && (l.sourceId === raw.ledgerId || l.name.toLowerCase() === ledgerName.toLowerCase())
    );
    if (matchingLedger) {
      ledgerId = matchingLedger.ledgerId;
    } else {
      this.integrityIssues.push({
        issueId: `ISSUE-MISSING-LEDGER-${sourceId}`,
        type: 'MissingLedgerInVoucher',
        severity: 'Warning',
        targetEntity: 'VoucherLine',
        targetId: sourceId,
        companyId,
        description: `Voucher line references unmapped ledger '${ledgerName}' in Company ${companyId}.`,
        details: { ledgerName, sourceId },
        detectedAt: now
      });
    }

    // Party resolution if present
    let partyId: string | undefined = undefined;
    if (raw.partyId || raw.partyName) {
      const p = Array.from(this.canonicalParties.values()).find(
        (party) => party.companyId === companyId && (party.sourceId === raw.partyId || party.name.toLowerCase() === String(raw.partyName).toLowerCase())
      );
      if (p) partyId = p.partyId;
    }

    // Monetary Amount preservation
    const rawAmount = raw.amount !== undefined ? raw.amount : 0;
    const isDebit = raw.isDebit !== undefined ? Boolean(raw.isDebit) : (typeof rawAmount === 'number' && rawAmount < 0) || raw.amountType === 'Dr';
    const currency = raw.currency ? String(raw.currency).trim() : 'INR';

    const amount: PreservedMonetaryValue = {
      originalValue: rawAmount,
      normalizedValue: Math.abs(this.parseAmount(rawAmount)),
      originalCurrency: currency,
      isDebit
    };

    // Quantity preservation if inventory line
    let quantity: PreservedQuantityValue | undefined = undefined;
    if (raw.quantity !== undefined || raw.qty !== undefined) {
      const rawQty = raw.quantity !== undefined ? raw.quantity : raw.qty;
      quantity = {
        originalValue: rawQty,
        normalizedValue: this.parseAmount(rawQty),
        unit: raw.unit || raw.uom || undefined
      };
    }

    // Rate preservation
    let rate: PreservedMonetaryValue | undefined = undefined;
    if (raw.rate !== undefined || raw.unitRate !== undefined) {
      const rawRate = raw.rate !== undefined ? raw.rate : raw.unitRate;
      rate = {
        originalValue: rawRate,
        normalizedValue: this.parseAmount(rawRate),
        originalCurrency: currency
      };
    }

    // Prepare other relationship fields without fake relationships
    const stockItemId = raw.stockItemId || raw.itemId ? String(raw.stockItemId || raw.itemId).trim() : undefined;
    const taxId = raw.taxId || raw.taxLedgerId ? String(raw.taxId || raw.taxLedgerId).trim() : undefined;
    const costCentreId = raw.costCentreId || raw.costCentre ? String(raw.costCentreId || raw.costCentre).trim() : undefined;
    const bankingId = raw.bankingId || raw.bankTransactionId ? String(raw.bankingId || raw.bankTransactionId).trim() : undefined;

    const voucherLineId = `vchl-${companyId}-${this.slugify(sourceId)}`;

    // Known canonical fields
    const knownKeys = new Set([
      'voucherlineid', 'lineid', 'guid', 'sourceid', 'voucherid', 'ledgerid', 'ledgername', 'ledger', 'partyid', 'partyname', 'stockitemid', 'itemid', 'amount', 'isdebit', 'currency', 'quantity', 'qty', 'unit', 'rate', 'unitrate', 'taxid', 'costcentreid', 'bankingid', 'companyid', 'source'
    ]);

    // Unknown fields preservation
    const extensionFields: ExtensionField[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k.toLowerCase())) {
        extensionFields.push({
          name: k,
          type: this.inferValueType(v),
          path: `VOUCHERLINE.${k.toUpperCase()}`,
          value: v,
          source: options.sourceReport || 'Tally Daybook Lines',
          confidence: 'High',
          semanticMeaning: 'Preserved source voucher line attribute',
          discoveredAt: now
        });
      }
    }

    const canonicalVoucherLine: CanonicalVoucherLine = {
      voucherLineId,
      voucherId,
      ledgerId,
      ledgerName,
      partyId,
      stockItemId,
      quantity,
      rate,
      amount,
      taxId,
      costCentreId,
      bankingId,
      sourceId,
      companyId,
      source: raw.source || options.sourceReport || 'Tally Daybook Line Gateway',
      schemaVersion: 1,
      isCurrent: true,
      validFrom: now,
      rawRecordReference: options.extractionId,
      extensionFields
    };

    this.canonicalVoucherLines.set(voucherLineId, canonicalVoucherLine);
    this.updateNormalizationMetric(companyId, 'VoucherLines', true);

    return canonicalVoucherLine;
  }

  // =========================================================================
  // 7. PHASE 31 GRAPH INTEGRATION
  // =========================================================================

  public syncWithPhase31Graph(companyId: string): { nodesCount: number; edgesCount: number } {
    if (!companyId) throw new Error('Company Isolation Violation: companyId required for graph sync.');

    const now = new Date().toISOString();
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Company Root Node
    const companyNode: GraphNode = {
      nodeId: `node-company-${companyId}`,
      nodeType: 'Company',
      sourceId: companyId,
      companyId,
      name: companyId === 'CMP-001' ? 'Acme Enterprise Ltd' : `Enterprise Subsidiary (${companyId})`,
      displayName: companyId === 'CMP-001' ? 'Acme Enterprise Ltd' : `Enterprise Subsidiary (${companyId})`,
      status: 'Active',
      source: 'Canonical Normalization Layer',
      snapshotId: `snap-${companyId}-v32b`,
      firstSeen: now,
      lastSeen: now,
      metadata: { phase: '32B' }
    };
    nodes.push(companyNode);

    // 2. Group Nodes & Hierarchy Edges
    const groups = Array.from(this.canonicalGroups.values()).filter((g) => g.companyId === companyId && g.isCurrent);
    for (const g of groups) {
      const node: GraphNode = {
        nodeId: `node-grp-${g.groupId}`,
        nodeType: 'Group',
        sourceId: g.sourceId,
        companyId,
        name: g.name,
        displayName: g.name,
        status: 'Active',
        source: g.source,
        snapshotId: `snap-${companyId}-v32b`,
        firstSeen: g.validFrom,
        lastSeen: now,
        metadata: { nature: g.nature, parentGroupName: g.parentGroupName, extensionCount: g.extensionFields.length }
      };
      nodes.push(node);

      // Edge: Company CONTAINS Group OR Parent Group CHILD_OF Parent
      if (g.parentGroupId) {
        edges.push({
          edgeId: `edge-grp-child-${g.groupId}`,
          fromNode: `node-grp-${g.groupId}`,
          toNode: `node-grp-${g.parentGroupId}`,
          relationshipType: 'CHILD_OF',
          origin: 'Direct',
          confidence: 'High',
          confidenceScore: 1.0,
          source: 'Tally Group Master Hierarchy',
          evidence: {
            sourceField: 'GROUP.PARENT',
            sourceRecord: g.sourceId,
            sourceReport: 'Group Master',
            extraction: 'Phase 32B Normalizer',
            reason: `Group '${g.name}' is child of parent '${g.parentGroupName}'`
          },
          createdAt: now
        });
      } else {
        edges.push({
          edgeId: `edge-comp-grp-${g.groupId}`,
          fromNode: companyNode.nodeId,
          toNode: node.nodeId,
          relationshipType: 'CONTAINS',
          origin: 'Direct',
          confidence: 'High',
          confidenceScore: 1.0,
          source: 'Chart of Accounts Root',
          evidence: {
            sourceField: 'COMPANY.ID',
            sourceRecord: companyId,
            sourceReport: 'Root Hierarchy',
            extraction: 'Phase 32B Normalizer',
            reason: 'Company contains top-level root Group'
          },
          createdAt: now
        });
      }
    }

    // 3. Ledger Nodes & Group CONTAINS Ledger Edges
    const ledgers = Array.from(this.canonicalLedgers.values()).filter((l) => l.companyId === companyId && l.isCurrent);
    for (const l of ledgers) {
      const node: GraphNode = {
        nodeId: `node-led-${l.ledgerId}`,
        nodeType: 'Ledger',
        sourceId: l.sourceId,
        companyId,
        name: l.name,
        displayName: l.name,
        status: l.isActive ? 'Active' : 'Inactive',
        source: l.source,
        snapshotId: `snap-${companyId}-v32b`,
        firstSeen: l.validFrom,
        lastSeen: now,
        metadata: {
          openingBalance: l.openingBalance.normalizedValue,
          closingBalance: l.closingBalance.normalizedValue,
          currency: l.currency,
          isDuplicateFlagged: l.isDuplicateNameFlagged
        }
      };
      nodes.push(node);

      if (l.parentGroupId) {
        edges.push({
          edgeId: `edge-grp-led-${l.ledgerId}`,
          fromNode: `node-grp-${l.parentGroupId}`,
          toNode: node.nodeId,
          relationshipType: 'CONTAINS',
          origin: 'Direct',
          confidence: 'High',
          confidenceScore: 1.0,
          source: 'Tally Ledger Parent Assignment',
          evidence: {
            sourceField: 'LEDGER.PARENT',
            sourceRecord: l.sourceId,
            sourceReport: 'Ledger Master',
            extraction: 'Phase 32B Normalizer',
            reason: `Group contains Ledger '${l.name}'`
          },
          createdAt: now
        });
      }
    }

    // 4. Party Nodes & Party REFERENCES Ledger Edges
    const parties = Array.from(this.canonicalParties.values()).filter((p) => p.companyId === companyId && p.isCurrent);
    for (const p of parties) {
      const node: GraphNode = {
        nodeId: `node-prt-${p.partyId}`,
        nodeType: 'Party',
        sourceId: p.sourceId,
        companyId,
        name: p.name,
        displayName: `${p.name} (${p.partyType})`,
        status: 'Active',
        source: p.source,
        snapshotId: `snap-${companyId}-v32b`,
        firstSeen: p.validFrom,
        lastSeen: now,
        metadata: { partyType: p.partyType, gstin: p.taxRegistration?.gstin, evidence: p.evidence }
      };
      nodes.push(node);

      if (p.ledgerId) {
        edges.push({
          edgeId: `edge-prt-led-${p.partyId}`,
          fromNode: node.nodeId,
          toNode: `node-led-${p.ledgerId}`,
          relationshipType: 'REFERENCES',
          origin: 'Inferred',
          confidence: 'High',
          confidenceScore: 0.95,
          source: 'Party Evidence Engine',
          evidence: {
            sourceField: 'PARTY.LEDGERGUID',
            sourceRecord: p.sourceId,
            sourceReport: 'Party Master',
            extraction: 'Phase 32B Normalizer',
            reason: p.evidence.join('; ')
          },
          createdAt: now
        });
      }
    }

    // 5. Voucher Nodes & Voucher Line Edges
    const vouchers = Array.from(this.canonicalVouchers.values()).filter((v) => v.companyId === companyId && v.isCurrent);
    for (const v of vouchers) {
      const vNode: GraphNode = {
        nodeId: `node-vch-${v.voucherId}`,
        nodeType: 'Voucher',
        sourceId: v.sourceId,
        companyId,
        name: `${v.voucherType} ${v.voucherNumber}`,
        displayName: `${v.voucherType} ${v.voucherNumber} (${v.date.normalizedDate})`,
        status: 'Active',
        source: v.source,
        snapshotId: `snap-${companyId}-v32b`,
        firstSeen: v.validFrom,
        lastSeen: now,
        metadata: { voucherNumber: v.voucherNumber, voucherType: v.voucherType, date: v.date.normalizedDate, reference: v.reference }
      };
      nodes.push(vNode);

      if (v.partyId) {
        edges.push({
          edgeId: `edge-vch-prt-${v.voucherId}`,
          fromNode: vNode.nodeId,
          toNode: `node-prt-${v.partyId}`,
          relationshipType: 'REFERENCES',
          origin: 'Direct',
          confidence: 'High',
          confidenceScore: 0.9,
          source: 'Voucher Party Reference',
          evidence: {
            sourceField: 'VOUCHER.PARTYLEDGERNAME',
            sourceRecord: v.sourceId,
            sourceReport: 'Daybook Header',
            extraction: 'Phase 32B Normalizer',
            reason: `Voucher involves Party '${v.partyName}'`
          },
          createdAt: now
        });
      }
    }

    // 6. Voucher Line Nodes: Voucher CONTAINS VoucherLine, VoucherLine POSTED_TO Ledger
    const voucherLines = Array.from(this.canonicalVoucherLines.values()).filter((vl) => vl.companyId === companyId && vl.isCurrent);
    for (const vl of voucherLines) {
      const vlNode: GraphNode = {
        nodeId: `node-vchl-${vl.voucherLineId}`,
        nodeType: 'VoucherLine',
        sourceId: vl.sourceId,
        companyId,
        name: `${vl.ledgerName} (${vl.amount.isDebit ? 'Dr' : 'Cr'} ${vl.amount.normalizedValue})`,
        displayName: `${vl.ledgerName} (${vl.amount.isDebit ? 'Dr' : 'Cr'} ${vl.amount.normalizedValue})`,
        status: 'Active',
        source: vl.source,
        snapshotId: `snap-${companyId}-v32b`,
        firstSeen: vl.validFrom,
        lastSeen: now,
        metadata: { amount: vl.amount.normalizedValue, isDebit: vl.amount.isDebit, ledgerName: vl.ledgerName }
      };
      nodes.push(vlNode);

      // Voucher CONTAINS VoucherLine
      edges.push({
        edgeId: `edge-vch-vchl-${vl.voucherLineId}`,
        fromNode: `node-vch-${vl.voucherId}`,
        toNode: vlNode.nodeId,
        relationshipType: 'CONTAINS',
        origin: 'Direct',
        confidence: 'High',
        confidenceScore: 1.0,
        source: 'Voucher Line Items',
        evidence: {
          sourceField: 'VOUCHER.LINE',
          sourceRecord: vl.sourceId,
          sourceReport: 'Daybook Lines',
          extraction: 'Phase 32B Normalizer',
          reason: `Voucher contains Line Item posting to ${vl.ledgerName}`
        },
        createdAt: now
      });

      // VoucherLine POSTED_TO Ledger
      edges.push({
        edgeId: `edge-vchl-led-${vl.voucherLineId}`,
        fromNode: vlNode.nodeId,
        toNode: `node-led-${vl.ledgerId}`,
        relationshipType: 'POSTED_TO',
        origin: 'Direct',
        confidence: 'High',
        confidenceScore: 1.0,
        source: 'Accounting General Ledger Posting',
        evidence: {
          sourceField: 'VOUCHERLINE.LEDGERGUID',
          sourceRecord: vl.sourceId,
          sourceReport: 'Daybook Postings',
          extraction: 'Phase 32B Normalizer',
          reason: `Line amount ${vl.amount.normalizedValue} posted to Ledger '${vl.ledgerName}'`
        },
        createdAt: now
      });
    }

    // Cache into in-memory graph repository
    for (const n of nodes) this.graphNodes.set(n.nodeId, n);
    for (const e of edges) this.graphEdges.set(e.edgeId, e);

    return { nodesCount: nodes.length, edgesCount: edges.length };
  }

  // =========================================================================
  // 8. REPOSITORY ACCESSORS (WITH STRICT COMPANY ISOLATION)
  // =========================================================================

  public getGroups(companyId: string): CanonicalGroup[] {
    return Array.from(this.canonicalGroups.values()).filter((g) => g.companyId === companyId && g.isCurrent);
  }

  public getLedgers(companyId: string): CanonicalLedger[] {
    return Array.from(this.canonicalLedgers.values()).filter((l) => l.companyId === companyId && l.isCurrent);
  }

  public getParties(companyId: string): CanonicalParty[] {
    return Array.from(this.canonicalParties.values()).filter((p) => p.companyId === companyId && p.isCurrent);
  }

  public getVouchers(companyId: string): CanonicalVoucher[] {
    return Array.from(this.canonicalVouchers.values()).filter((v) => v.companyId === companyId && v.isCurrent);
  }

  public getVoucherLines(companyId: string, voucherId?: string): CanonicalVoucherLine[] {
    let lines = Array.from(this.canonicalVoucherLines.values()).filter((vl) => vl.companyId === companyId && vl.isCurrent);
    if (voucherId) {
      lines = lines.filter((vl) => vl.voucherId === voucherId);
    }
    return lines;
  }

  public getIntegrityIssues(companyId: string): HierarchyIntegrityIssue[] {
    this.detectGroupHierarchyIssues(companyId);
    const accountingIssues = this.integrityIssues.filter((i) => i.companyId === companyId);
    const inventoryIssues = canonicalInventoryEngine.detectInventoryIntegrityIssues(companyId);
    const taxCostCentreIssues = canonicalTaxCostCentreEngine.detectTaxCostCentreIntegrityIssues(companyId);
    return [...accountingIssues, ...inventoryIssues, ...taxCostCentreIssues];
  }

  public getNormalizationStates(companyId: string): DatasetNormalizationState[] {
    return Array.from(this.normalizationStates.values()).filter((s) => s.datasetId.includes(companyId));
  }

  public getGraphData(companyId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
    this.syncWithPhase31Graph(companyId);
    const baseNodes = Array.from(this.graphNodes.values()).filter((n) => n.companyId === companyId);
    const baseEdges = Array.from(this.graphEdges.values()).filter((e) => e.edgeId.includes(companyId) || e.fromNode.includes(companyId));

    const invGraph = canonicalInventoryEngine.syncInventoryWithGraph(companyId);
    const taxCCGraph = canonicalTaxCostCentreEngine.syncTaxAndCostCentresWithGraph(companyId);
    const payBankGraph = canonicalPayrollBankingEngine.syncPayrollAndBankingWithGraph(companyId);

    // Merge nodes and edges uniquely
    const nodeMap = new Map<string, GraphNode>();
    [...baseNodes, ...invGraph.nodes, ...taxCCGraph.nodes, ...payBankGraph.nodes].forEach((n) => nodeMap.set(n.nodeId, n));

    const edgeMap = new Map<string, GraphEdge>();
    [...baseEdges, ...invGraph.edges, ...taxCCGraph.edges, ...payBankGraph.edges].forEach((e) => edgeMap.set(e.edgeId, e));

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values())
    };
  }

  // Phase 32C Inventory Domain Delegation
  public getStockGroups(companyId: string): CanonicalStockGroup[] {
    return canonicalInventoryEngine.getStockGroups(companyId);
  }

  public getStockItems(companyId: string): CanonicalStockItem[] {
    return canonicalInventoryEngine.getStockItems(companyId);
  }

  public getGodowns(companyId: string): CanonicalGodown[] {
    return canonicalInventoryEngine.getGodowns(companyId);
  }

  public getBatches(companyId: string, stockItemId?: string): CanonicalBatch[] {
    return canonicalInventoryEngine.getBatches(companyId, stockItemId);
  }

  public getInventoryMovements(companyId: string, voucherId?: string, stockItemId?: string): CanonicalInventoryMovement[] {
    return canonicalInventoryEngine.getInventoryMovements(companyId, voucherId, stockItemId);
  }

  public normalizeStockGroup(raw: Record<string, any>, companyId: string, options?: any): CanonicalStockGroup {
    return canonicalInventoryEngine.normalizeStockGroup(raw, companyId, options);
  }

  public normalizeStockItem(raw: Record<string, any>, companyId: string, options?: any): CanonicalStockItem {
    return canonicalInventoryEngine.normalizeStockItem(raw, companyId, options);
  }

  public normalizeGodown(raw: Record<string, any>, companyId: string, options?: any): CanonicalGodown {
    return canonicalInventoryEngine.normalizeGodown(raw, companyId, options);
  }

  public normalizeBatch(raw: Record<string, any>, companyId: string, options?: any): CanonicalBatch {
    return canonicalInventoryEngine.normalizeBatch(raw, companyId, options);
  }

  public normalizeInventoryMovement(raw: Record<string, any>, companyId: string, options?: any): CanonicalInventoryMovement {
    return canonicalInventoryEngine.normalizeInventoryMovement(raw, companyId, options);
  }

  // Phase 32C Tax & Cost Centre Domain Delegation
  public getTaxEntities(companyId: string): CanonicalTaxEntity[] {
    return canonicalTaxCostCentreEngine.getTaxEntities(companyId);
  }

  public getTaxTransactions(companyId: string, voucherId?: string): CanonicalTaxTransaction[] {
    return canonicalTaxCostCentreEngine.getTaxTransactions(companyId, voucherId);
  }

  public getCostCentreCategories(companyId: string): CanonicalCostCentreCategory[] {
    return canonicalTaxCostCentreEngine.getCostCentreCategories(companyId);
  }

  public getCostCentres(companyId: string): CanonicalCostCentre[] {
    return canonicalTaxCostCentreEngine.getCostCentres(companyId);
  }

  public normalizeTaxEntity(raw: Record<string, any>, companyId: string, options?: any): CanonicalTaxEntity {
    return canonicalTaxCostCentreEngine.normalizeTaxEntity(raw, companyId, options);
  }

  public normalizeTaxTransaction(raw: Record<string, any>, companyId: string, options?: any): CanonicalTaxTransaction {
    return canonicalTaxCostCentreEngine.normalizeTaxTransaction(raw, companyId, options);
  }

  public normalizeCostCentreCategory(raw: Record<string, any>, companyId: string, options?: any): CanonicalCostCentreCategory {
    return canonicalTaxCostCentreEngine.normalizeCostCentreCategory(raw, companyId, options);
  }

  public normalizeCostCentre(raw: Record<string, any>, companyId: string, options?: any): CanonicalCostCentre {
    return canonicalTaxCostCentreEngine.normalizeCostCentre(raw, companyId, options);
  }

  // Phase 32C Payroll & Banking Domain Delegation (with Privacy Controls)
  public isPayrollAvailable(companyId: string): boolean {
    return canonicalPayrollBankingEngine.isPayrollAvailable(companyId);
  }

  public isBankingAvailable(companyId: string): boolean {
    return canonicalPayrollBankingEngine.isBankingAvailable(companyId);
  }

  public getEmployees(companyId: string, options?: { userRole?: string }): CanonicalEmployee[] {
    return canonicalPayrollBankingEngine.getEmployees(companyId, options);
  }

  public getPayrollPeriods(companyId: string): CanonicalPayrollPeriod[] {
    return canonicalPayrollBankingEngine.getPayrollPeriods(companyId);
  }

  public getPayrollTransactions(companyId: string, options?: { userRole?: string; employeeId?: string }): CanonicalPayrollTransaction[] {
    return canonicalPayrollBankingEngine.getPayrollTransactions(companyId, options);
  }

  public getBankAccounts(companyId: string, options?: { userRole?: string }): CanonicalBankAccount[] {
    return canonicalPayrollBankingEngine.getBankAccounts(companyId, options);
  }

  public getBankTransactions(companyId: string, options?: { bankAccountId?: string }): CanonicalBankTransaction[] {
    return canonicalPayrollBankingEngine.getBankTransactions(companyId, options);
  }

  public normalizeEmployee(raw: Record<string, any>, companyId: string, options?: any): CanonicalEmployee {
    return canonicalPayrollBankingEngine.normalizeEmployee(raw, companyId, options);
  }

  public normalizePayrollPeriod(raw: Record<string, any>, companyId: string): CanonicalPayrollPeriod {
    return canonicalPayrollBankingEngine.normalizePayrollPeriod(raw, companyId);
  }

  public normalizePayrollTransaction(raw: Record<string, any>, companyId: string, options?: any): CanonicalPayrollTransaction {
    return canonicalPayrollBankingEngine.normalizePayrollTransaction(raw, companyId, options);
  }

  public normalizeBankAccount(raw: Record<string, any>, companyId: string, options?: any): CanonicalBankAccount {
    return canonicalPayrollBankingEngine.normalizeBankAccount(raw, companyId, options);
  }

  public normalizeBankTransaction(raw: Record<string, any>, companyId: string, options?: any): CanonicalBankTransaction {
    return canonicalPayrollBankingEngine.normalizeBankTransaction(raw, companyId, options);
  }

  // =========================================================================
  // 9. HELPER UTILITIES
  // =========================================================================

  private updateNormalizationMetric(companyId: string, key: 'Groups' | 'Ledgers' | 'Parties' | 'Vouchers' | 'VoucherLines', success: boolean, errorMsg?: string) {
    const stateKey = `${companyId}-${key}`;
    const state = this.normalizationStates.get(stateKey) || {
      datasetKey: key,
      datasetId: `ds-canonical-${key.toLowerCase()}-${companyId}`,
      status: 'Complete',
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      lastNormalizedAt: new Date().toISOString()
    };

    state.totalRecords += 1;
    if (success) {
      state.successfulRecords += 1;
    } else {
      state.failedRecords += 1;
      state.status = 'Partial';
      if (errorMsg) {
        state.errors.push({ recordId: `ERR-${Date.now()}`, error: errorMsg, timestamp: new Date().toISOString() });
      }
    }
    state.lastNormalizedAt = new Date().toISOString();
    this.normalizationStates.set(stateKey, state);
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
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmy = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    // Return sanitized string without throwing or assuming timezone
    return dateStr.substring(0, 10);
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
    return String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 40);
  }

  // =========================================================================
  // 10. INITIAL SEED DATA FOR PHASE 32B CANONICAL MASTERS & TRANSACTIONS
  // =========================================================================

  private seedInitialCanonicalMastersAndVouchers() {
    const companyId = 'CMP-001';

    // 1. Groups
    const rawGroups = [
      { groupId: 'GRP-PRIMARY-ASSETS', name: 'Current Assets', nature: 'Assets', isPrimary: true },
      { groupId: 'GRP-DEBTORS', name: 'Sundry Debtors', parentGroup: 'Current Assets', nature: 'Assets' },
      { groupId: 'GRP-BANK', name: 'Bank Accounts', parentGroup: 'Current Assets', nature: 'Assets' },
      { groupId: 'GRP-PRIMARY-LIABILITIES', name: 'Current Liabilities', nature: 'Liabilities', isPrimary: true },
      { groupId: 'GRP-CREDITORS', name: 'Sundry Creditors', parentGroup: 'Current Liabilities', nature: 'Liabilities' },
      { groupId: 'GRP-PRIMARY-INCOME', name: 'Sales Accounts', nature: 'Income', isPrimary: true },
      { groupId: 'GRP-PRIMARY-EXPENSES', name: 'Direct Expenses', nature: 'Expenses', isPrimary: true },
      // Group with unknown nature to demonstrate non-guessing requirement
      { groupId: 'GRP-CUSTOM-CLEARING', name: 'Custom Inter-Branch Clearing', parentGroup: 'Current Liabilities', nature: '' }
    ];

    for (const g of rawGroups) {
      this.normalizeGroup(g, companyId, { sourceReport: 'Tally Group Master XML' });
    }

    // 2. Ledgers
    const rawLedgers = [
      {
        ledgerId: 'LED-CUST-001',
        name: 'Acme Tech Corp',
        parentGroup: 'Sundry Debtors',
        openingBalance: 245000,
        closingBalance: 850000,
        currency: 'INR',
        isActive: true,
        CUSTOM_PAN_NUMBER: 'AAACA1234F',
        CREDIT_DAYS_LIMIT: 30
      },
      {
        ledgerId: 'LED-CUST-002',
        name: 'Zenith Logistics Ltd',
        parentGroup: 'Sundry Debtors',
        openingBalance: 120000,
        closingBalance: 420000,
        currency: 'INR',
        isActive: true,
        CUSTOM_TRANSPORTER_ID: 'TRP-9021'
      },
      {
        ledgerId: 'LED-SUPP-001',
        name: 'Global Silicon Components Inc',
        parentGroup: 'Sundry Creditors',
        openingBalance: -450000,
        closingBalance: -620000,
        currency: 'INR',
        isActive: true,
        MSME_NUMBER: 'UDYAM-MH-01-0012938'
      },
      {
        ledgerId: 'LED-BANK-001',
        name: 'HDFC Current Account (A/c 5020001234)',
        parentGroup: 'Bank Accounts',
        openingBalance: 5200000,
        closingBalance: 6180000,
        currency: 'INR',
        isActive: true,
        IFSC_CODE: 'HDFC0000123'
      },
      {
        ledgerId: 'LED-SALES-001',
        name: 'Domestic Sales @18%',
        parentGroup: 'Sales Accounts',
        openingBalance: 0,
        closingBalance: 14500000,
        currency: 'INR',
        isActive: true,
        TAX_CATEGORY_NATIVE: 'GST_18'
      }
    ];

    for (const l of rawLedgers) {
      this.normalizeLedger(l, companyId, { sourceReport: 'Tally Master Ledger XML' });
    }

    // 3. Parties (Evidence-Based Normalization)
    const rawParties = [
      {
        partyId: 'PRT-CUST-001',
        ledgerId: 'LED-CUST-001',
        name: 'Acme Tech Corp',
        parentGroup: 'Sundry Debtors',
        gstin: '27AAACA1234F1Z5',
        pan: 'AAACA1234F',
        address: 'B-402 Silicon Towers, BKC',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        email: 'billing@acmetech.com',
        phone: '+91-22-68901234',
        contactPerson: 'Rajesh Sharma'
      },
      {
        partyId: 'PRT-SUPP-001',
        ledgerId: 'LED-SUPP-001',
        name: 'Global Silicon Components Inc',
        parentGroup: 'Sundry Creditors',
        gstin: '29AABCG5678K1Z2',
        pan: 'AABCG5678K',
        address: 'Plot 12, Electronics City Phase 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560100',
        email: 'accounts@globalsilicon.com',
        phone: '+91-80-45678901',
        contactPerson: 'Priya Sundaram'
      }
    ];

    for (const p of rawParties) {
      this.normalizeParty(p, companyId, { sourceReport: 'Tally Party XML' });
    }

    // 4. Vouchers (Header)
    const rawVouchers = [
      {
        voucherId: 'VCH-INV-2026-001',
        voucherNumber: 'INV-2026-001',
        voucherType: 'Sales',
        date: '2026-03-01',
        reference: 'PO-ACM-9921',
        narration: 'Enterprise Cloud Server Rack 200X supply and licensing',
        partyName: 'Acme Tech Corp',
        EWAY_BILL_NO: '381920192831'
      },
      {
        voucherId: 'VCH-PUR-2026-042',
        voucherNumber: 'PUR-2026-042',
        voucherType: 'Purchase',
        date: '2026-03-03',
        reference: 'INV-GSC-8812',
        narration: 'Procurement of Core Processors Batch 4B',
        partyName: 'Global Silicon Components Inc',
        GRN_NUMBER: 'GRN-2026-104'
      }
    ];

    for (const v of rawVouchers) {
      this.normalizeVoucher(v, companyId, { sourceReport: 'Tally Sales/Purchase Daybook' });
    }

    // 5. Voucher Lines
    const rawVoucherLines = [
      // Sales Voucher Lines (INV-2026-001)
      {
        voucherLineId: 'VCH-INV-2026-001-L1',
        voucherId: 'VCH-INV-2026-001',
        ledgerId: 'LED-CUST-001',
        ledgerName: 'Acme Tech Corp',
        amount: 354000,
        isDebit: true,
        partyName: 'Acme Tech Corp'
      },
      {
        voucherLineId: 'VCH-INV-2026-001-L2',
        voucherId: 'VCH-INV-2026-001',
        ledgerId: 'LED-SALES-001',
        ledgerName: 'Domestic Sales @18%',
        amount: 300000,
        isDebit: false,
        quantity: 2,
        rate: 150000,
        stockItemId: 'ITEM-SRV-200X'
      },
      // Purchase Voucher Lines (PUR-2026-042)
      {
        voucherLineId: 'VCH-PUR-2026-042-L1',
        voucherId: 'VCH-PUR-2026-042',
        ledgerId: 'LED-SUPP-001',
        ledgerName: 'Global Silicon Components Inc',
        amount: 590000,
        isDebit: false,
        partyName: 'Global Silicon Components Inc'
      }
    ];

    for (const vl of rawVoucherLines) {
      this.normalizeVoucherLine(vl, companyId, { sourceReport: 'Tally Daybook Lines' });
    }

    // Sync initial graph
    this.syncWithPhase31Graph(companyId);
  }
}

export const canonicalNormalizationEngine = new CanonicalNormalizationEngine();
