// Phase 31 - Accounting Object Graph Types
export type NodeType =
  | 'Company'
  | 'Group'
  | 'Ledger'
  | 'Voucher'
  | 'VoucherLine'
  | 'StockItem'
  | 'StockGroup'
  | 'Party'
  | 'Tax'
  | 'CostCentre'
  | 'Employee'
  | 'Godown'
  | 'OtherDiscoveredObject';

export type RelationshipType =
  | 'BELONGS_TO'
  | 'POSTED_TO'
  | 'CONTAINS'
  | 'REFERENCES'
  | 'USES'
  | 'PART_OF'
  | 'CHILD_OF'
  | 'PARENT_OF'
  | 'ASSIGNED_TO'
  | 'RELATED_TO';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type RelationshipOrigin = 'Direct' | 'Inferred';
export type NodeStatus = 'Active' | 'Inactive' | 'Unknown';
export type MeasureAggregationType = 'Additive' | 'Semi-Additive' | 'Non-Additive';
export type IntegritySeverity = 'Info' | 'Warning' | 'High' | 'Critical';

export interface EvidenceTrace {
  sourceField: string;
  sourceRecord: string;
  sourceReport: string;
  extraction: string;
  reason: string;
}

export interface GraphNode {
  nodeId: string;
  nodeType: NodeType;
  sourceId: string;
  companyId: string;
  name: string;
  displayName: string;
  status: NodeStatus;
  source: string;
  snapshotId: string;
  firstSeen: string;
  lastSeen: string;
  financialYear?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  edgeId: string;
  fromNode: string;
  toNode: string;
  relationshipType: RelationshipType;
  origin: RelationshipOrigin;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0.0 - 1.0
  source: string;
  evidence: EvidenceTrace;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  feedback?: 'Correct' | 'Incorrect' | 'Uncertain';
}

export interface IAccountingGraph {
  graphId: string;
  companyRootId: string;
  version: number;
  financialYear: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupHierarchyNode {
  groupId: string;
  name: string;
  parentGroupId?: string;
  level: 'Primary' | 'Group' | 'Subgroup';
  depth: number;
  ledgers: {
    ledgerId: string;
    name: string;
    openingBalance: number;
    closingBalance: number;
    status: NodeStatus;
  }[];
  subgroups: GroupHierarchyNode[];
  isOrphan?: boolean;
  isCircular?: boolean;
}

export interface LedgerDetailModel {
  ledgerId: string;
  name: string;
  parentGroup: string;
  openingBalance: number;
  closingBalance: number;
  debitTurnover: number;
  creditTurnover: number;
  voucherCount: number;
  status: NodeStatus;
  relatedParties: string[];
  relatedCostCentres: string[];
  relatedTaxInfo: string[];
}

export interface VoucherLineModel {
  voucherLineId: string;
  voucherId: string;
  ledgerId: string;
  ledgerName: string;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  rate?: number;
  amount: number;
  taxAmount?: number;
  costCentre?: string;
  isDebit: boolean;
}

export interface VoucherDetailModel {
  voucherId: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  effectiveDate: string;
  reference?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  narration?: string;
  companyId: string;
  source: string;
  snapshotId: string;
  lines: VoucherLineModel[];
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
}

export interface InventoryItemDetailModel {
  itemId: string;
  name: string;
  stockGroupName: string;
  unit: string;
  secondaryUnit?: string;
  godown?: string;
  batch?: string;
  lot?: string;
  openingQty: number;
  openingValue: number;
  receiptQty: number;
  issueQty: number;
  transferQty: number;
  closingQty: number;
  closingValue: number;
  reconciliationBalanced: boolean;
}

export interface PartyDetailModel {
  partyId: string;
  name: string;
  classification: 'Customer' | 'Supplier' | 'Other Party' | 'Classification Unknown';
  ledgerName: string;
  gstin?: string;
  pan?: string;
  transactionCount: number;
  transactionValue: number;
  outstandingBalance: number;
  lastActivityDate: string;
  topPurchasedItems: string[];
}

export interface GraphIntegrityIssue {
  issueId: string;
  rule: string;
  severity: IntegritySeverity;
  affectedNodeId: string;
  affectedNodeName: string;
  nodeType: NodeType;
  description: string;
  remediationSuggestion: string;
  detectedAt: string;
}

export interface SemanticMeasure {
  measureId: string;
  name: string;
  formula: string;
  grain: string;
  aggregation: MeasureAggregationType;
  unit: string;
  currency: string;
  description: string;
  version: number;
  isStandard: boolean;
}

export interface SemanticDimension {
  dimensionId: string;
  name: string;
  grain: string;
  hierarchyPath?: string[];
  description: string;
}

export interface SemanticJoinPath {
  sourceObject: string;
  intermediateObjects: string[];
  targetObject: string;
  joinSteps: string[];
  confidence: ConfidenceLevel;
  confidenceScore: number;
  grainValid: boolean;
  doubleCountingWarning: boolean;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
  explanation: string;
}

export interface DeepDrillDownTraceStep {
  level: 'Company' | 'Group' | 'Ledger' | 'Voucher' | 'VoucherLine' | 'Item' | 'InventoryTransaction';
  objectId: string;
  displayName: string;
  value: number | string;
  metadata?: Record<string, any>;
}

export interface DeepDrillDownResult {
  traceId: string;
  path: DeepDrillDownTraceStep[];
  underlyingVouchers: VoucherDetailModel[];
  evidenceSource: {
    source: string;
    report: string;
    record: string;
    field: string;
    extractedAt: string;
  };
}

export interface GraphSnapshotDiff {
  snapshotA: string;
  snapshotB: string;
  addedNodes: GraphNode[];
  removedNodes: GraphNode[];
  changedNodes: { nodeId: string; name: string; before: any; after: any }[];
  addedEdges: GraphEdge[];
  removedEdges: GraphEdge[];
  summary: {
    nodeDelta: number;
    edgeDelta: number;
    integrityDelta: number;
  };
}

export interface AIGraphGroundingResponse {
  question: string;
  canEstablishRelationship: boolean;
  answer: string;
  relationshipPath: string[];
  evidenceNodes: GraphNode[];
  evidenceEdges: GraphEdge[];
  confidence: ConfidenceLevel;
  warnings?: string[];
}

export interface GraphAuditItem {
  auditId: string;
  action: 'GRAPH_QUERY' | 'GRAPH_EXPORT' | 'RELATIONSHIP_APPROVAL' | 'RELATIONSHIP_OVERRIDE' | 'HIERARCHY_CHANGE';
  user: string;
  targetId: string;
  details: string;
  timestamp: string;
}
