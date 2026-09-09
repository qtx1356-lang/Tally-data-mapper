/**
 * Phase 26: Enterprise Workflow, Control Center, Approvals & Period Closing Types
 * Specification for Task Engine, Exception Engine, Approval Engine, Period Control,
 * Checklists, Reconciliation Sign-off, Audit Pack Generator, and Policy Engine.
 */

export type TaskType =
  | 'Review'
  | 'Reconciliation'
  | 'Approval'
  | 'Follow-up'
  | 'Exception'
  | 'Checklist'
  | 'Period Close'
  | 'Audit';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskStatus =
  | 'Open'
  | 'In Progress'
  | 'Blocked'
  | 'Pending Review'
  | 'Completed'
  | 'Cancelled'
  | 'Overdue';

export type ExceptionSeverity = 'Info' | 'Warning' | 'High' | 'Critical';

export type ExceptionStatus =
  | 'New'
  | 'Acknowledged'
  | 'Investigating'
  | 'Waiting'
  | 'Resolved'
  | 'Rejected'
  | 'Accepted Risk';

export type ResolutionType =
  | 'Corrected Externally'
  | 'Valid Transaction'
  | 'False Positive'
  | 'Accepted Risk'
  | 'Duplicate Confirmed'
  | 'Data Issue'
  | 'Other';

export type ApprovalObjectType =
  | 'Report Approval'
  | 'Exception Resolution'
  | 'Accepted Risk'
  | 'Period Close'
  | 'Audit Pack'
  | 'Checklist Override';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired';

export type PeriodStatus = 'Open' | 'Closing' | 'Closed' | 'Reopened';

export type ControlFrequency =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Yearly'
  | 'Event-Based';

export type ControlResult = 'Pass' | 'Fail' | 'Warning' | 'Not Applicable';

export type AuditPackStatus = 'Draft' | 'Generated' | 'Reviewed' | 'Approved' | 'Archived';

export type WatermarkType = 'DRAFT' | 'CONFIDENTIAL' | 'FINAL';

export interface TaskChecklistItem {
  id: string;
  item: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  evidence?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  isEdited?: boolean;
}

export interface TaskModel {
  taskId: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  assignedRole?: string;
  createdBy: string;
  companyId: string;
  period: string;
  dueDate: string;
  dependencies: string[]; // TaskIds that must be completed first
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ExceptionRule {
  ruleId: string;
  name: string;
  description: string;
  category: 'Duplicate' | 'Threshold' | 'Variance' | 'Compliance' | 'Reconciliation';
  severity: ExceptionSeverity;
  thresholdType: 'Absolute' | 'Percentage' | 'Count';
  thresholdValue: number;
  comparisonBase: 'Current Period' | 'Previous Period' | 'Previous Year';
  isActive: boolean;
  version: number;
  createdBy: string;
  updatedBy: string;
}

export interface ExceptionModel {
  exceptionId: string;
  ruleId: string;
  ruleName: string;
  companyId: string;
  period: string;
  severity: ExceptionSeverity;
  title: string;
  description: string;
  source: string;
  detectedAt: string;
  status: ExceptionStatus;
  assignedTo: string;
  detectedValue: string | number;
  thresholdValue: string | number;
  resolutionType?: ResolutionType;
  resolutionComment?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  acceptedRiskReason?: string;
  acceptedRiskApprover?: string;
  acceptedRiskExpiryDate?: string;
  deduplicationHash: string;
  underlyingRecordId?: string;
}

export interface ApprovalStep {
  level: number;
  role: string;
  approver?: string;
  status: ApprovalStatus;
  decisionAt?: string;
  comment?: string;
}

export interface ApprovalModel {
  approvalId: string;
  objectId: string;
  objectType: ApprovalObjectType;
  objectTitle: string;
  requester: string;
  currentLevel: number;
  maxLevel: number;
  steps: ApprovalStep[];
  status: ApprovalStatus;
  createdAt: string;
  decisionAt?: string;
  finalComment?: string;
  quorumRequired: string; // e.g. "1 of 1" or "2 of 3"
  isMaterialChangeReapproval?: boolean;
}

export interface PeriodControlModel {
  periodId: string;
  companyId: string;
  fiscalYear: string;
  periodName: string; // e.g. "March 2026", "Q4 FY25-26"
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  closeBlockersCount: number;
  warningsCount: number;
  checklistCompletionPct: number;
  reconciliationCompletionPct: number;
  reopenReason?: string;
  reopenApprover?: string;
  reopenedAt?: string;
  closedAt?: string;
  closedBy?: string;
  lockedAt?: string;
}

export interface ChecklistItemInstance {
  id: string;
  title: string;
  description: string;
  category: string;
  isRequired: boolean;
  isCompleted: boolean;
  isBlocking: boolean;
  completedBy?: string;
  completedAt?: string;
  evidenceRef?: string;
}

export interface ChecklistInstance {
  checklistId: string;
  templateId: string;
  name: string;
  category: 'Monthly' | 'Quarterly' | 'Year-End' | 'GST' | 'Inventory' | 'Management';
  periodId: string;
  companyId: string;
  items: ChecklistItemInstance[];
  completionPct: number;
  version: number;
}

export interface ReconciliationSignOffModel {
  signOffId: string;
  reconId: string;
  title: string;
  companyId: string;
  period: string;
  status: 'Not Started' | 'In Progress' | 'Matched' | 'Partially Matched' | 'Unmatched' | 'Reviewed' | 'Signed Off';
  matchedCount: number;
  varianceAmount: number;
  reviewer: string;
  signedOffAt?: string;
  decision: 'Approved' | 'Rejected' | 'Approved With Exception';
  comment?: string;
  integrityHash: string; // SHA-256 hash of the reconciled state
  datasetSnapshotId: string;
  reportVersion: number;
  evidenceRef?: string;
}

export interface AuditPackManifestFile {
  filename: string;
  type: string;
  sizeBytes: number;
  checksum: string; // SHA-256
  version: string;
  createdAt: string;
}

export interface AuditPackModel {
  auditPackId: string;
  title: string;
  companyId: string;
  companyName: string;
  fiscalYear: string;
  period: string;
  version: number;
  status: AuditPackStatus;
  watermark: WatermarkType;
  generatedAt: string;
  generatedBy: string;
  integrityChecksum: string;
  manifest: AuditPackManifestFile[];
  lineage: {
    source: string;
    period: string;
    snapshot: string;
    report: string;
    version: number;
  }[];
}

export interface PolicyRuleCondition {
  field: string;
  operator: '=' | '≠' | '>' | '<' | '≥' | '≤' | 'Contains' | 'Is Empty' | 'Exceeds Percentage';
  value: string;
  period?: string;
  company?: string;
  role?: string;
}

export interface PolicyModel {
  policyId: string;
  name: string;
  scope: 'Company' | 'Global' | 'Department';
  condition: PolicyRuleCondition;
  severity: ExceptionSeverity;
  action: 'Notify' | 'Create Task' | 'Create Exception' | 'Require Approval' | 'Block Close';
  approverRole?: string;
  version: number;
  status: 'Active' | 'Draft' | 'Archived';
  effectiveDate: string;
  createdAt: string;
  createdBy: string;
}

export interface ControlLibraryItem {
  controlId: string;
  name: string;
  category: 'Financial' | 'Statutory' | 'Inventory' | 'Security' | 'Operational';
  frequency: ControlFrequency;
  owner: string;
  reviewer: string;
  approver: string;
  description: string;
  lastRunId?: string;
  lastResult: ControlResult;
  lastRunTimestamp?: string;
  evidenceRefs: string[];
}

export interface ControlCenterKPIs {
  closeCompletionPct: number;
  exceptionResolutionPct: number;
  reconciliationCompletionPct: number;
  approvalCompletionPct: number;
  openTasksCount: number;
  overdueTasksCount: number;
  pendingApprovalsCount: number;
  criticalExceptionsCount: number;
  controlPassRatePct: number;
}

export interface ControlAuditEntry {
  auditId: string;
  event:
    | 'Task Created'
    | 'Task Status Changed'
    | 'Exception Created'
    | 'Exception Resolved'
    | 'Rule Triggered'
    | 'Approval Requested'
    | 'Approval Granted'
    | 'Approval Rejected'
    | 'Checklist Completed'
    | 'Override Granted'
    | 'Sign-Off Completed'
    | 'Period Closed'
    | 'Period Reopened'
    | 'Audit Pack Generated';
  objectId: string;
  objectType: string;
  actor: string;
  role: string;
  timestamp: string;
  companyId: string;
  details: string;
  previousState?: string;
  newState?: string;
}
