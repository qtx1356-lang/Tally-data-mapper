import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  TaskModel,
  ExceptionModel,
  ExceptionRule,
  ApprovalModel,
  PeriodControlModel,
  ChecklistInstance,
  ReconciliationSignOffModel,
  AuditPackModel,
  PolicyModel,
  ControlLibraryItem,
  ControlCenterKPIs,
  ControlAuditEntry
} from '../types/phase26ControlCenter';

export const controlCenterRouter = Router();

// ==========================================
// IN-MEMORY WORKFLOW REPOSITORY
// ==========================================

let tasksList: TaskModel[] = [
  {
    taskId: 'tsk-101',
    title: 'Review High-Value Vendor Payment Variance',
    description: 'Investigate ₹12.5L disbursement variance on Apex Industrial voucher journal entries before Q4 closing.',
    type: 'Review',
    priority: 'Critical',
    status: 'In Progress',
    assignedTo: 'Vikram Joshi (Senior Controller)',
    assignedRole: 'Finance Controller',
    createdBy: 'Automated Control Policy',
    companyId: 'comp-101',
    period: 'March 2026',
    dueDate: '2026-03-31',
    dependencies: [],
    checklist: [
      { id: 'c1', item: 'Cross-check bank debit advice against voucher line', isRequired: true, isCompleted: true, completedBy: 'Vikram Joshi', completedAt: '2026-03-28T10:00:00Z', evidence: 'DOC-BNK-8819' },
      { id: 'c2', item: 'Obtain vendor confirmation balance certificate', isRequired: true, isCompleted: false },
      { id: 'c3', item: 'Sign off exception resolution note', isRequired: true, isCompleted: false }
    ],
    comments: [
      { id: 'cm1', author: 'Vikram Joshi', role: 'Finance Controller', content: 'Bank debit confirmed at ₹12.5L. Waiting on vendor ledger statement.', createdAt: '2026-03-28T10:15:00Z' }
    ],
    evidenceRefs: ['REP-VOUCHER-0881', 'DOC-BNK-8819'],
    createdAt: '2026-03-27T08:00:00Z',
    updatedAt: '2026-03-28T10:15:00Z'
  },
  {
    taskId: 'tsk-102',
    title: 'Bank Reconciliation Sign-off - HDFC Operative A/c',
    description: 'Execute March month-end bank statement 3-way match and sign off unreconciled credit float.',
    type: 'Reconciliation',
    priority: 'High',
    status: 'Pending Review',
    assignedTo: 'Arjun Mehta (VP Finance)',
    assignedRole: 'Finance Lead',
    createdBy: 'Pooja Nair',
    companyId: 'comp-101',
    period: 'March 2026',
    dueDate: '2026-03-30',
    dependencies: [],
    checklist: [
      { id: 'c1', item: 'Verify unpresented cheques under 30 days', isRequired: true, isCompleted: true, completedBy: 'Pooja Nair', completedAt: '2026-03-28T14:00:00Z' },
      { id: 'c2', item: 'Check interest credit tax line posting', isRequired: true, isCompleted: true, completedBy: 'Pooja Nair', completedAt: '2026-03-28T14:15:00Z' }
    ],
    comments: [],
    evidenceRefs: ['RECON-HDFC-MAR26'],
    createdAt: '2026-03-28T09:00:00Z',
    updatedAt: '2026-03-28T14:15:00Z'
  },
  {
    taskId: 'tsk-103',
    title: 'GSTR-3B vs GSTR-2B Input Tax Credit Reconciliation',
    description: 'Perform outward and inward statutory GST parity review prior to return submission.',
    type: 'Review',
    priority: 'High',
    status: 'Blocked',
    assignedTo: 'Rohan Sharma (Tax Lead)',
    assignedRole: 'Tax Lead',
    createdBy: 'Arjun Mehta',
    companyId: 'comp-101',
    period: 'March 2026',
    dueDate: '2026-04-05',
    dependencies: ['tsk-101'], // Blocked by Task 101
    checklist: [
      { id: 'c1', item: 'Validate 2B ITC eligible breakdown', isRequired: true, isCompleted: false },
      { id: 'c2', item: 'Sign off Section 16(4) compliance checklist', isRequired: true, isCompleted: false }
    ],
    comments: [
      { id: 'cm1', author: 'Rohan Sharma', role: 'Tax Lead', content: 'Blocked pending final resolution of high-value vendor voucher classification.', createdAt: '2026-03-28T11:00:00Z' }
    ],
    evidenceRefs: ['GST-ITC-MAR26'],
    createdAt: '2026-03-28T09:30:00Z',
    updatedAt: '2026-03-28T11:00:00Z'
  }
];

let exceptionsList: ExceptionModel[] = [
  {
    exceptionId: 'exp-201',
    ruleId: 'rul-01',
    ruleName: 'Unusual High-Value Transaction Variance',
    companyId: 'comp-101',
    period: 'March 2026',
    severity: 'Critical',
    title: 'Unusual Journal Voucher Amount Exceeding ₹10,00,000 Threshold',
    description: 'Voucher #JV-2026-901 posted at ₹12,50,000 exceeds single-entry standard variance threshold.',
    source: 'Vouchers (Journal Register)',
    detectedAt: '2026-03-27T08:00:00Z',
    status: 'Investigating',
    assignedTo: 'Vikram Joshi (Senior Controller)',
    detectedValue: 1250000,
    thresholdValue: 1000000,
    deduplicationHash: crypto.createHash('sha256').update('rul-01:comp-101:March2026:JV-2026-901').digest('hex'),
    underlyingRecordId: 'JV-2026-901'
  },
  {
    exceptionId: 'exp-202',
    ruleId: 'rul-02',
    ruleName: 'Negative Inventory Balance Alert',
    companyId: 'comp-101',
    period: 'March 2026',
    severity: 'High',
    title: 'Negative Physical Stock on SKU-0091 (Industrial IoT Controller X4)',
    description: 'Closing inventory balance computed at -4.00 Units due to out-of-order delivery challan posting.',
    source: 'Stock Items (Godown Register)',
    detectedAt: '2026-03-26T14:30:00Z',
    status: 'Acknowledged',
    assignedTo: 'Pooja Nair (Supply Chain)',
    detectedValue: -4.0,
    thresholdValue: 0,
    deduplicationHash: crypto.createHash('sha256').update('rul-02:comp-101:March2026:SKU-0091').digest('hex'),
    underlyingRecordId: 'SKU-0091'
  },
  {
    exceptionId: 'exp-203',
    ruleId: 'rul-03',
    ruleName: 'Unreconciled Bank Float > 15 Days',
    companyId: 'comp-101',
    period: 'March 2026',
    severity: 'Warning',
    title: 'Uncredited Inward RTGS Remittance Unmatched',
    description: 'Inward remittance of ₹2,80,000 from Kaveri Distributors pending ledger allocation for 18 days.',
    source: 'Reconciliations (Bank Float)',
    detectedAt: '2026-03-25T11:00:00Z',
    status: 'Accepted Risk',
    assignedTo: 'Vikram Joshi',
    detectedValue: '18 Days',
    thresholdValue: '15 Days',
    resolutionType: 'Accepted Risk',
    resolutionComment: 'Customer confirmed advance payment for upcoming FY27 contract; ledger allocation will occur upon April billing.',
    acceptedRiskReason: 'Advance customer remittance pending formal tax invoice generation.',
    acceptedRiskApprover: 'Arjun Mehta (VP Finance)',
    acceptedRiskExpiryDate: '2026-04-15',
    resolvedAt: '2026-03-26T16:00:00Z',
    resolvedBy: 'Vikram Joshi',
    deduplicationHash: crypto.createHash('sha256').update('rul-03:comp-101:March2026:FLOAT-881').digest('hex')
  }
];

let exceptionRulesList: ExceptionRule[] = [
  {
    ruleId: 'rul-01',
    name: 'Unusual High-Value Transaction Variance',
    description: 'Flags any single journal/payment voucher exceeding absolute amount threshold.',
    category: 'Threshold',
    severity: 'Critical',
    thresholdType: 'Absolute',
    thresholdValue: 1000000,
    comparisonBase: 'Current Period',
    isActive: true,
    version: 2,
    createdBy: 'Arjun Mehta',
    updatedBy: 'Vikram Joshi'
  },
  {
    ruleId: 'rul-02',
    name: 'Negative Inventory Balance Alert',
    description: 'Detects negative stock closing balances across godowns and batch registers.',
    category: 'Variance',
    severity: 'High',
    thresholdType: 'Absolute',
    thresholdValue: 0,
    comparisonBase: 'Current Period',
    isActive: true,
    version: 1,
    createdBy: 'Pooja Nair',
    updatedBy: 'Pooja Nair'
  },
  {
    ruleId: 'rul-03',
    name: 'Unreconciled Bank Float > 15 Days',
    description: 'Highlights bank ledger float items unreconciled past standard threshold.',
    category: 'Reconciliation',
    severity: 'Warning',
    thresholdType: 'Count',
    thresholdValue: 15,
    comparisonBase: 'Current Period',
    isActive: true,
    version: 1,
    createdBy: 'Vikram Joshi',
    updatedBy: 'Vikram Joshi'
  },
  {
    ruleId: 'rul-04',
    name: 'Duplicate Vendor Invoice Number Detection',
    description: 'Identifies matching vendor invoice references within same financial year.',
    category: 'Duplicate',
    severity: 'Critical',
    thresholdType: 'Count',
    thresholdValue: 1,
    comparisonBase: 'Previous Year',
    isActive: true,
    version: 3,
    createdBy: 'Arjun Mehta',
    updatedBy: 'Arjun Mehta'
  }
];

let approvalsList: ApprovalModel[] = [
  {
    approvalId: 'app-301',
    objectId: 'per-mar26',
    objectType: 'Period Close',
    objectTitle: 'March 2026 (Q4 FY25-26) Financial Closing',
    requester: 'Vikram Joshi (Senior Controller)',
    currentLevel: 1,
    maxLevel: 2,
    steps: [
      { level: 1, role: 'Finance Controller', approver: 'Vikram Joshi', status: 'Approved', decisionAt: '2026-03-28T12:00:00Z', comment: 'Checklist completed and initial reconciliations verified.' },
      { level: 2, role: 'Chief Financial Officer', approver: 'Arjun Mehta (VP Finance)', status: 'Pending' }
    ],
    status: 'Pending',
    createdAt: '2026-03-28T11:45:00Z',
    quorumRequired: '2 of 2'
  },
  {
    approvalId: 'app-302',
    objectId: 'exp-203',
    objectType: 'Accepted Risk',
    objectTitle: 'Accepted Risk on Kaveri Distributors Bank Float',
    requester: 'Vikram Joshi',
    currentLevel: 1,
    maxLevel: 1,
    steps: [
      { level: 1, role: 'VP Finance', approver: 'Arjun Mehta', status: 'Approved', decisionAt: '2026-03-26T16:00:00Z', comment: 'Approved risk with expiration set for April 15, 2026.' }
    ],
    status: 'Approved',
    createdAt: '2026-03-26T15:30:00Z',
    decisionAt: '2026-03-26T16:00:00Z',
    finalComment: 'Approved advance allocation plan.',
    quorumRequired: '1 of 1'
  }
];

let periodsList: PeriodControlModel[] = [
  {
    periodId: 'per-mar26',
    companyId: 'comp-101',
    fiscalYear: 'FY 2025-26',
    periodName: 'March 2026 (Q4 & FY-End)',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'Closing',
    closeBlockersCount: 1, // Task 101 critical review
    warningsCount: 2,
    checklistCompletionPct: 80,
    reconciliationCompletionPct: 90
  },
  {
    periodId: 'per-feb26',
    companyId: 'comp-101',
    fiscalYear: 'FY 2025-26',
    periodName: 'February 2026',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    status: 'Closed',
    closeBlockersCount: 0,
    warningsCount: 0,
    checklistCompletionPct: 100,
    reconciliationCompletionPct: 100,
    closedAt: '2026-03-05T18:00:00Z',
    closedBy: 'Arjun Mehta (VP Finance)',
    lockedAt: '2026-03-05T18:00:00Z'
  }
];

let monthEndChecklist: ChecklistInstance = {
  checklistId: 'chk-mar26',
  templateId: 'tpl-monthend',
  name: 'March 2026 Month-End & Year-End Control Checklist',
  category: 'Month-End' as any,
  periodId: 'per-mar26',
  companyId: 'comp-101',
  completionPct: 80,
  version: 2,
  items: [
    { id: 'i1', title: '1. Verify Bank Reconciliations across all operative accounts', description: 'Ensure zero unrecorded bank interest, bank charges, or unmatched debit transactions.', category: 'Banking', isRequired: true, isCompleted: true, isBlocking: true, completedBy: 'Pooja Nair', completedAt: '2026-03-28T14:00:00Z', evidenceRef: 'RECON-HDFC-MAR26' },
    { id: 'i2', title: '2. Review Outstanding Receivables & Ageing Buckets', description: 'Confirm debtor dues > 90 days with sales leadership and initiate collection follow-ups.', category: 'Receivables', isRequired: true, isCompleted: true, isBlocking: false, completedBy: 'Vikram Joshi', completedAt: '2026-03-28T11:00:00Z', evidenceRef: 'REP-REC-MAR26' },
    { id: 'i3', title: '3. Review Outstanding Payables & Vendor Balances', description: 'Reconcile vendor statements and resolve credit hold disputes.', category: 'Payables', isRequired: true, isCompleted: true, isBlocking: false, completedBy: 'Vikram Joshi', completedAt: '2026-03-28T11:30:00Z' },
    { id: 'i4', title: '4. Investigate Unusual High-Value Transaction Exceptions', description: 'Ensure all vouchers exceeding ₹10L variance threshold possess supporting documentation.', category: 'Controls', isRequired: true, isCompleted: false, isBlocking: true, evidenceRef: 'EXP-201' },
    { id: 'i5', title: '5. Physical Stock Valuation & Reorder Audit', description: 'Verify closing inventory valuation and resolve negative SKU occurrences.', category: 'Inventory', isRequired: true, isCompleted: true, isBlocking: true, completedBy: 'Pooja Nair', completedAt: '2026-03-27T16:00:00Z', evidenceRef: 'STK-VAL-MAR26' },
    { id: 'i6', title: '6. Review GSTR-1, GSTR-3B & Inward ITC Tax Reports', description: 'Verify statutory GST tax credit parity before monthly return filing.', category: 'Statutory', isRequired: true, isCompleted: true, isBlocking: true, completedBy: 'Rohan Sharma', completedAt: '2026-03-28T09:00:00Z', evidenceRef: 'GST-REP-MAR26' },
    { id: 'i7', title: '7. Review Overhead Expense Allocations & Cost Centres', description: 'Audit departmental expense absorption against operational budgets.', category: 'Financial', isRequired: true, isCompleted: true, isBlocking: false, completedBy: 'Vikram Joshi', completedAt: '2026-03-28T10:00:00Z' },
    { id: 'i8', title: '8. Perform Revenue Cut-off & Billing Verification', description: 'Confirm all sales shipments up to month-end are billed and accrued.', category: 'Financial', isRequired: true, isCompleted: true, isBlocking: true, completedBy: 'Vikram Joshi', completedAt: '2026-03-28T10:30:00Z' },
    { id: 'i9', title: '9. Resolve or Sign Off Open Audit Exceptions', description: 'Verify all high-severity exceptions are either resolved or granted Accepted Risk status.', category: 'Controls', isRequired: true, isCompleted: false, isBlocking: true },
    { id: 'i10', title: '10. Obtain Multi-Level Management Period Sign-Offs', description: 'CFO and Controller sign-off approving final ledger closing lock.', category: 'Approvals', isRequired: true, isCompleted: false, isBlocking: true }
  ]
};

let reconciliationsList: ReconciliationSignOffModel[] = [
  {
    signOffId: 'sgo-401',
    reconId: 'rec-hdfc-01',
    title: 'HDFC Bank Primary Operative Account Reconciliation',
    companyId: 'comp-101',
    period: 'March 2026',
    status: 'Signed Off',
    matchedCount: 420,
    varianceAmount: 0.0,
    reviewer: 'Vikram Joshi (Senior Controller)',
    signedOffAt: '2026-03-28T14:30:00Z',
    decision: 'Approved',
    comment: '3-way automated matching verified 420 entries with zero net discrepancy. Cryptographic seal attached.',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    datasetSnapshotId: 'SNP-2026-0328-994',
    reportVersion: 4,
    evidenceRef: 'DOC-HDFC-STMT-MAR26'
  },
  {
    signOffId: 'sgo-402',
    reconId: 'rec-gst-01',
    title: 'GSTR-2B vs Vendor Inward Purchase Invoices',
    companyId: 'comp-101',
    period: 'March 2026',
    status: 'Reviewed',
    matchedCount: 380,
    varianceAmount: 14200.0,
    reviewer: 'Rohan Sharma (Tax Lead)',
    decision: 'Approved With Exception',
    comment: 'Minor ₹14.2K ITC timing difference acknowledged; vendor to reflect in April portal filing.',
    integrityHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    datasetSnapshotId: 'SNP-2026-0328-994',
    reportVersion: 2,
    evidenceRef: 'GST-2B-MATCH-LOG'
  }
];

let auditPacksList: AuditPackModel[] = [
  {
    auditPackId: 'ap-501',
    title: 'Q4 FY25-26 Financial Audit & Control Package',
    companyId: 'comp-101',
    companyName: 'Acme Enterprise Ltd (HO - Mumbai)',
    fiscalYear: 'FY 2025-26',
    period: 'March 2026',
    version: 1,
    status: 'Generated',
    watermark: 'CONFIDENTIAL',
    generatedAt: '2026-03-28T15:00:00Z',
    generatedBy: 'Arjun Mehta (VP Finance)',
    integrityChecksum: 'a7c9381c7e6e5b42d1f043e62a19842f9b8c0e27a6f23d456789abcdef012345',
    manifest: [
      { filename: '01_Executive_Period_Summary.pdf', type: 'PDF Document', sizeBytes: 245000, checksum: 'sha256-e81a7b', version: 'v1.0', createdAt: '2026-03-28T15:00:00Z' },
      { filename: '02_Trial_Balance_Hierarchical.xlsx', type: 'Excel Spreadsheet', sizeBytes: 580000, checksum: 'sha256-42d19f', version: 'v1.0', createdAt: '2026-03-28T15:00:00Z' },
      { filename: '03_Bank_Reconciliation_SignOffs.pdf', type: 'PDF Document', sizeBytes: 310000, checksum: 'sha256-88a4e1', version: 'v1.0', createdAt: '2026-03-28T15:00:00Z' },
      { filename: '04_Exceptions_Register_AcceptedRisks.xlsx', type: 'Excel Spreadsheet', sizeBytes: 190000, checksum: 'sha256-99b2c3', version: 'v1.0', createdAt: '2026-03-28T15:00:00Z' },
      { filename: '05_Immutable_Audit_Trail_Manifest.json', type: 'JSON Manifest', sizeBytes: 125000, checksum: 'sha256-c77e91', version: 'v1.0', createdAt: '2026-03-28T15:00:00Z' }
    ],
    lineage: [
      { source: 'TallyPrime Enterprise (Local Engine)', period: 'March 2026', snapshot: 'SNP-2026-0328-994', report: 'Trial Balance', version: 4 },
      { source: 'HDFC Banking Engine', period: 'March 2026', snapshot: 'SNP-2026-0328-994', report: 'Bank Reconciliation', version: 2 }
    ]
  }
];

let policiesList: PolicyModel[] = [
  {
    policyId: 'pol-601',
    name: 'Block Period Close on Unresolved Critical Exceptions',
    scope: 'Company',
    condition: { field: 'Exception.Severity', operator: '=', value: 'Critical' },
    severity: 'Critical',
    action: 'Block Close',
    approverRole: 'VP Finance',
    version: 1,
    status: 'Active',
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'Arjun Mehta'
  },
  {
    policyId: 'pol-602',
    name: 'Mandate Approval for Journal Vouchers > ₹10,00,000',
    scope: 'Global',
    condition: { field: 'Voucher.Amount', operator: '>', value: '1000000' },
    severity: 'High',
    action: 'Require Approval',
    approverRole: 'Finance Controller',
    version: 2,
    status: 'Active',
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'Arjun Mehta'
  }
];

let controlLibrary: ControlLibraryItem[] = [
  {
    controlId: 'ctl-01',
    name: 'Automated Duplicate Invoice Reference Check',
    category: 'Statutory',
    frequency: 'Daily',
    owner: 'Rohan Sharma',
    reviewer: 'Vikram Joshi',
    approver: 'Arjun Mehta',
    description: 'Scans all sales and purchase vouchers for identical vendor invoice references.',
    lastResult: 'Pass',
    lastRunTimestamp: '2026-03-28T06:00:00Z',
    evidenceRefs: ['CTL-RUN-8891']
  },
  {
    controlId: 'ctl-02',
    name: 'Negative Stock Balance Verification',
    category: 'Inventory',
    frequency: 'Daily',
    owner: 'Pooja Nair',
    reviewer: 'Vikram Joshi',
    approver: 'Arjun Mehta',
    description: 'Validates inventory physical balances across godowns against ledger issues.',
    lastResult: 'Warning',
    lastRunTimestamp: '2026-03-28T06:00:00Z',
    evidenceRefs: ['EXP-202']
  },
  {
    controlId: 'ctl-03',
    name: 'High-Value Journal Entry Threshold Monitor',
    category: 'Financial',
    frequency: 'Event-Based',
    owner: 'Vikram Joshi',
    reviewer: 'Vikram Joshi',
    approver: 'Arjun Mehta',
    description: 'Intercepts non-standard journals exceeding ₹10L for controller authorization.',
    lastResult: 'Fail',
    lastRunTimestamp: '2026-03-27T08:00:00Z',
    evidenceRefs: ['EXP-201', 'TSK-101']
  }
];

let auditLogsList: ControlAuditEntry[] = [
  {
    auditId: 'aud-901',
    event: 'Sign-Off Completed',
    objectId: 'sgo-401',
    objectType: 'Reconciliation',
    actor: 'Vikram Joshi',
    role: 'Senior Controller',
    timestamp: '2026-03-28T14:30:00Z',
    companyId: 'comp-101',
    details: 'Completed cryptographic sign-off for HDFC Bank operative ledger matching.',
    newState: 'Signed Off'
  },
  {
    auditId: 'aud-902',
    event: 'Audit Pack Generated',
    objectId: 'ap-501',
    objectType: 'Audit Pack',
    actor: 'Arjun Mehta',
    role: 'VP Finance',
    timestamp: '2026-03-28T15:00:00Z',
    companyId: 'comp-101',
    details: 'Generated and sealed Q4 FY25-26 Financial Audit & Control Package with SHA-256 manifest.',
    newState: 'Generated'
  }
];

// ==========================================
// 1. CONTROL DASHBOARD & KPIS
// ==========================================

controlCenterRouter.get('/dashboard', (req: Request, res: Response) => {
  const openTasks = tasksList.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
  const overdueTasks = tasksList.filter((t) => t.status === 'Overdue');
  const pendingApprovals = approvalsList.filter((a) => a.status === 'Pending');
  const criticalExceptions = exceptionsList.filter((e) => e.severity === 'Critical' && e.status !== 'Resolved' && e.status !== 'Accepted Risk');

  const kpis: ControlCenterKPIs = {
    closeCompletionPct: 80,
    exceptionResolutionPct: 75,
    reconciliationCompletionPct: 90,
    approvalCompletionPct: 85,
    openTasksCount: openTasks.length,
    overdueTasksCount: overdueTasks.length,
    pendingApprovalsCount: pendingApprovals.length,
    criticalExceptionsCount: criticalExceptions.length,
    controlPassRatePct: 88
  };

  res.json({
    success: true,
    data: {
      kpis,
      activePeriod: periodsList.find((p) => p.status === 'Closing') || periodsList[0],
      openTasks: openTasks.slice(0, 5),
      pendingApprovals,
      criticalExceptions,
      recentAudits: auditLogsList.slice(0, 6)
    }
  });
});

// ==========================================
// 2. TASK ENGINE (ITaskEngine)
// ==========================================

controlCenterRouter.get('/tasks', (req: Request, res: Response) => {
  const { status, priority, search } = req.query;
  let filtered = [...tasksList];

  if (status && status !== 'All') {
    filtered = filtered.filter((t) => t.status.toLowerCase() === String(status).toLowerCase());
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter((t) => t.priority.toLowerCase() === String(priority).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: filtered });
});

controlCenterRouter.post('/tasks', (req: Request, res: Response) => {
  const body = req.body as Partial<TaskModel>;

  if (!body.title) {
    return res.status(400).json({ success: false, error: 'Task title is mandatory.' });
  }

  const newTask: TaskModel = {
    taskId: `tsk-${Date.now().toString().slice(-4)}`,
    title: body.title,
    description: body.description || '',
    type: body.type || 'Review',
    priority: body.priority || 'Medium',
    status: 'Open',
    assignedTo: body.assignedTo || 'Unassigned',
    assignedRole: body.assignedRole || 'Finance Controller',
    createdBy: 'Current User',
    companyId: 'comp-101',
    period: body.period || 'March 2026',
    dueDate: body.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    dependencies: body.dependencies || [],
    checklist: body.checklist || [],
    comments: [],
    evidenceRefs: body.evidenceRefs || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasksList.unshift(newTask);

  // Log audit entry
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Task Created',
    objectId: newTask.taskId,
    objectType: 'Task',
    actor: 'Current User',
    role: 'Finance Controller',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Created new operational control task: ${newTask.title}`,
    newState: 'Open'
  });

  res.json({ success: true, data: newTask });
});

controlCenterRouter.put('/tasks/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const idx = tasksList.findIndex((t) => t.taskId === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const prev = tasksList[idx].status;
  tasksList[idx].status = status;
  tasksList[idx].updatedAt = new Date().toISOString();
  if (status === 'Completed') {
    tasksList[idx].completedAt = new Date().toISOString();
  }

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Task Status Changed',
    objectId: tasksList[idx].taskId,
    objectType: 'Task',
    actor: 'Current User',
    role: 'Finance Controller',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Updated task ${tasksList[idx].taskId} status from ${prev} to ${status}`,
    previousState: prev,
    newState: status
  });

  res.json({ success: true, data: tasksList[idx] });
});

controlCenterRouter.post('/tasks/:id/comments', (req: Request, res: Response) => {
  const { content } = req.body;
  const idx = tasksList.findIndex((t) => t.taskId === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const comment = {
    id: `cm-${Date.now().toString().slice(-4)}`,
    author: 'Current User',
    role: 'Finance Controller',
    content,
    createdAt: new Date().toISOString()
  };

  tasksList[idx].comments.push(comment);
  tasksList[idx].updatedAt = new Date().toISOString();

  res.json({ success: true, data: comment });
});

// ==========================================
// 3. EXCEPTION ENGINE (IExceptionEngine)
// ==========================================

controlCenterRouter.get('/exceptions', (req: Request, res: Response) => {
  const { severity, status } = req.query;
  let filtered = [...exceptionsList];

  if (severity && severity !== 'All') {
    filtered = filtered.filter((e) => e.severity.toLowerCase() === String(severity).toLowerCase());
  }
  if (status && status !== 'All') {
    filtered = filtered.filter((e) => e.status.toLowerCase() === String(status).toLowerCase());
  }

  res.json({ success: true, data: filtered });
});

controlCenterRouter.post('/exceptions/:id/resolve', (req: Request, res: Response) => {
  const { resolutionType, resolutionComment, acceptedRiskReason, acceptedRiskApprover, acceptedRiskExpiryDate } = req.body;
  const idx = exceptionsList.findIndex((e) => e.exceptionId === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Exception not found' });
  }

  const isAcceptedRisk = resolutionType === 'Accepted Risk';
  const newStatus = isAcceptedRisk ? 'Accepted Risk' : 'Resolved';

  exceptionsList[idx] = {
    ...exceptionsList[idx],
    status: newStatus as any,
    resolutionType,
    resolutionComment,
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'Current User',
    acceptedRiskReason: isAcceptedRisk ? acceptedRiskReason : undefined,
    acceptedRiskApprover: isAcceptedRisk ? acceptedRiskApprover : undefined,
    acceptedRiskExpiryDate: isAcceptedRisk ? acceptedRiskExpiryDate : undefined
  };

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Exception Resolved',
    objectId: exceptionsList[idx].exceptionId,
    objectType: 'Exception',
    actor: 'Current User',
    role: 'Senior Controller',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Resolved exception with resolution type: ${resolutionType}`,
    newState: newStatus
  });

  res.json({ success: true, data: exceptionsList[idx] });
});

controlCenterRouter.get('/exception-rules', (req: Request, res: Response) => {
  res.json({ success: true, data: exceptionRulesList });
});

// ==========================================
// 4. APPROVAL ENGINE (IApprovalEngine)
// ==========================================

controlCenterRouter.get('/approvals', (req: Request, res: Response) => {
  res.json({ success: true, data: approvalsList });
});

controlCenterRouter.post('/approvals/:id/decision', (req: Request, res: Response) => {
  const { decision, comment } = req.body; // 'Approved' | 'Rejected'
  const idx = approvalsList.findIndex((a) => a.approvalId === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Approval not found' });
  }

  const approval = approvalsList[idx];

  // Self-approval protection check
  if (approval.requester.toLowerCase().includes('current user') && decision === 'Approved') {
    return res.status(403).json({
      success: false,
      error: 'SECURITY VIOLATION: Self-approval prohibited by technical separation of duties policy.'
    });
  }

  if (decision === 'Rejected' && (!comment || comment.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Rejection requires a mandatory explanation comment.'
    });
  }

  // Update active step
  const stepIdx = approval.steps.findIndex((s) => s.status === 'Pending');
  if (stepIdx !== -1) {
    approval.steps[stepIdx].status = decision;
    approval.steps[stepIdx].decisionAt = new Date().toISOString();
    approval.steps[stepIdx].comment = comment;
    approval.steps[stepIdx].approver = 'Current User (Authorized Approver)';
  }

  if (decision === 'Rejected') {
    approval.status = 'Rejected';
  } else if (approval.currentLevel >= approval.maxLevel || stepIdx === approval.steps.length - 1) {
    approval.status = 'Approved';
  } else {
    approval.currentLevel += 1;
  }

  approval.decisionAt = new Date().toISOString();
  approval.finalComment = comment;

  approvalsList[idx] = approval;

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: decision === 'Approved' ? 'Approval Granted' : 'Approval Rejected',
    objectId: approval.approvalId,
    objectType: approval.objectType,
    actor: 'Current User',
    role: 'VP Finance',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `${decision} for ${approval.objectTitle}. Comment: ${comment || 'None'}`,
    newState: approval.status
  });

  res.json({ success: true, data: approval });
});

// ==========================================
// 5. PERIOD CONTROL & CHECKLISTS
// ==========================================

controlCenterRouter.get('/periods', (req: Request, res: Response) => {
  res.json({ success: true, data: periodsList });
});

controlCenterRouter.get('/checklists/current', (req: Request, res: Response) => {
  res.json({ success: true, data: monthEndChecklist });
});

controlCenterRouter.post('/checklists/items/:id/toggle', (req: Request, res: Response) => {
  const itemIdx = monthEndChecklist.items.findIndex((i) => i.id === req.params.id);
  if (itemIdx === -1) {
    return res.status(404).json({ success: false, error: 'Checklist item not found' });
  }

  const isCompleted = !monthEndChecklist.items[itemIdx].isCompleted;
  monthEndChecklist.items[itemIdx].isCompleted = isCompleted;
  monthEndChecklist.items[itemIdx].completedBy = isCompleted ? 'Current User' : undefined;
  monthEndChecklist.items[itemIdx].completedAt = isCompleted ? new Date().toISOString() : undefined;

  const completedCount = monthEndChecklist.items.filter((i) => i.isCompleted).length;
  monthEndChecklist.completionPct = Math.round((completedCount / monthEndChecklist.items.length) * 100);

  res.json({ success: true, data: monthEndChecklist });
});

controlCenterRouter.post('/periods/:id/close', (req: Request, res: Response) => {
  const { overrideBlockers } = req.body;
  const idx = periodsList.findIndex((p) => p.periodId === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Period not found' });
  }

  if (periodsList[idx].closeBlockersCount > 0 && !overrideBlockers) {
    return res.status(400).json({
      success: false,
      error: `Cannot close period: ${periodsList[idx].closeBlockersCount} critical blocker items remain unaddressed. Override requires management approval.`
    });
  }

  periodsList[idx].status = 'Closed';
  periodsList[idx].closedAt = new Date().toISOString();
  periodsList[idx].closedBy = 'Arjun Mehta (VP Finance)';
  periodsList[idx].lockedAt = new Date().toISOString();

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Period Closed',
    objectId: periodsList[idx].periodId,
    objectType: 'Period',
    actor: 'Arjun Mehta',
    role: 'VP Finance',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Officially locked and closed financial period ${periodsList[idx].periodName}.`,
    newState: 'Closed'
  });

  res.json({
    success: true,
    data: periodsList[idx],
    message: 'Period successfully closed. EXFIN workflow state locked.'
  });
});

controlCenterRouter.post('/periods/:id/reopen', (req: Request, res: Response) => {
  const { reason, approver } = req.body;

  if (!reason || !approver) {
    return res.status(400).json({
      success: false,
      error: 'Reopening a closed period mandates an explicit audit reason and approving officer name.'
    });
  }

  const idx = periodsList.findIndex((p) => p.periodId === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Period not found' });
  }

  periodsList[idx].status = 'Reopened';
  periodsList[idx].reopenReason = reason;
  periodsList[idx].reopenApprover = approver;
  periodsList[idx].reopenedAt = new Date().toISOString();

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Period Reopened',
    objectId: periodsList[idx].periodId,
    objectType: 'Period',
    actor: 'Current User',
    role: 'VP Finance',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Reopened closed period ${periodsList[idx].periodName}. Reason: ${reason}`,
    newState: 'Reopened'
  });

  res.json({ success: true, data: periodsList[idx] });
});

// ==========================================
// 6. RECONCILIATION SIGN-OFF (ISignOffService)
// ==========================================

controlCenterRouter.get('/reconciliations', (req: Request, res: Response) => {
  res.json({ success: true, data: reconciliationsList });
});

controlCenterRouter.post('/reconciliations/:id/signoff', (req: Request, res: Response) => {
  const { decision, comment } = req.body;
  const idx = reconciliationsList.findIndex((r) => r.signOffId === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Reconciliation not found' });
  }

  // Generate SHA-256 seal
  const integrityPayload = `${reconciliationsList[idx].reconId}:${reconciliationsList[idx].period}:${reconciliationsList[idx].matchedCount}:${Date.now()}`;
  const integrityHash = crypto.createHash('sha256').update(integrityPayload).digest('hex');

  reconciliationsList[idx].status = 'Signed Off';
  reconciliationsList[idx].decision = decision || 'Approved';
  reconciliationsList[idx].comment = comment;
  reconciliationsList[idx].reviewer = 'Current User (Senior Controller)';
  reconciliationsList[idx].signedOffAt = new Date().toISOString();
  reconciliationsList[idx].integrityHash = integrityHash;

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Sign-Off Completed',
    objectId: reconciliationsList[idx].signOffId,
    objectType: 'Reconciliation',
    actor: 'Current User',
    role: 'Senior Controller',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Signed off reconciliation ${reconciliationsList[idx].title} with SHA-256 seal ${integrityHash.slice(0, 12)}...`,
    newState: 'Signed Off'
  });

  res.json({ success: true, data: reconciliationsList[idx] });
});

// ==========================================
// 7. AUDIT PACK GENERATOR
// ==========================================

controlCenterRouter.get('/audit-packs', (req: Request, res: Response) => {
  res.json({ success: true, data: auditPacksList });
});

controlCenterRouter.post('/audit-packs/generate', (req: Request, res: Response) => {
  const { period, watermark } = req.body;

  const packId = `ap-${Date.now().toString().slice(-4)}`;
  const integrityChecksum = crypto.createHash('sha256').update(`${packId}:${period}:${Date.now()}`).digest('hex');

  const newPack: AuditPackModel = {
    auditPackId: packId,
    title: `Financial Audit & Control Evidence Package (${period || 'March 2026'})`,
    companyId: 'comp-101',
    companyName: 'Acme Enterprise Ltd (HO)',
    fiscalYear: 'FY 2025-26',
    period: period || 'March 2026',
    version: 1,
    status: 'Generated',
    watermark: watermark || 'CONFIDENTIAL',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Current User',
    integrityChecksum,
    manifest: [
      { filename: '01_Period_Closing_Executive_Summary.pdf', type: 'PDF Document', sizeBytes: 210000, checksum: `sha256-${integrityChecksum.slice(0, 8)}`, version: 'v1.0', createdAt: new Date().toISOString() },
      { filename: '02_Trial_Balance_Ledger_Extract.xlsx', type: 'Excel Spreadsheet', sizeBytes: 450000, checksum: `sha256-${integrityChecksum.slice(8, 16)}`, version: 'v1.0', createdAt: new Date().toISOString() },
      { filename: '03_Bank_Reconciliation_Certificates.pdf', type: 'PDF Document', sizeBytes: 380000, checksum: `sha256-${integrityChecksum.slice(16, 24)}`, version: 'v1.0', createdAt: new Date().toISOString() },
      { filename: '04_Audit_Manifest_Signatures.json', type: 'JSON Manifest', sizeBytes: 85000, checksum: `sha256-${integrityChecksum.slice(24, 32)}`, version: 'v1.0', createdAt: new Date().toISOString() }
    ],
    lineage: [
      { source: 'TallyPrime Enterprise', period: period || 'March 2026', snapshot: 'SNP-2026-0328-994', report: 'Trial Balance', version: 4 },
      { source: 'EXFIN Control Engine', period: period || 'March 2026', snapshot: 'SNP-2026-0328-994', report: 'Reconciliation Register', version: 2 }
    ]
  };

  auditPacksList.unshift(newPack);

  // Audit
  auditLogsList.unshift({
    auditId: `aud-${Date.now().toString().slice(-4)}`,
    event: 'Audit Pack Generated',
    objectId: newPack.auditPackId,
    objectType: 'Audit Pack',
    actor: 'Current User',
    role: 'Finance Controller',
    timestamp: new Date().toISOString(),
    companyId: 'comp-101',
    details: `Generated audit package with watermark ${newPack.watermark} and integrity seal.`,
    newState: 'Generated'
  });

  res.json({ success: true, data: newPack });
});

// ==========================================
// 8. POLICY ENGINE & SIMULATION (IPolicyEngine)
// ==========================================

controlCenterRouter.get('/policies', (req: Request, res: Response) => {
  res.json({ success: true, data: policiesList });
});

controlCenterRouter.post('/policies/simulate', (req: Request, res: Response) => {
  const { condition, action } = req.body;

  // Simulate policy against historical snapshot without side-effects
  res.json({
    success: true,
    data: {
      isSimulated: true,
      conditionEvaluated: condition,
      actionProposed: action,
      wouldTriggerCount: 4,
      wouldNotTriggerCount: 180,
      impactedRecordsSample: [
        { id: 'JV-2026-901', name: 'Apex Industrial Voucher', amount: 1250000, triggerReason: 'Amount exceeds threshold' },
        { id: 'JV-2026-904', name: 'Trident Energy Voucher', amount: 1800000, triggerReason: 'Amount exceeds threshold' }
      ]
    }
  });
});

// ==========================================
// 9. CONTROL LIBRARY & AUDIT LOGS
// ==========================================

controlCenterRouter.get('/controls', (req: Request, res: Response) => {
  res.json({ success: true, data: controlLibrary });
});

controlCenterRouter.post('/controls/:id/run', (req: Request, res: Response) => {
  const idx = controlLibrary.findIndex((c) => c.controlId === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Control item not found' });
  }

  controlLibrary[idx].lastRunTimestamp = new Date().toISOString();
  controlLibrary[idx].lastRunId = `run-${Date.now().toString().slice(-4)}`;

  res.json({ success: true, data: controlLibrary[idx] });
});

controlCenterRouter.get('/audits', (req: Request, res: Response) => {
  res.json({ success: true, data: auditLogsList });
});

// ==========================================
// 10. STRICT READ-ONLY INTEGRATION GUARD
// ==========================================

controlCenterRouter.all('/write-block/*', (req: Request, res: Response) => {
  res.status(403).json({
    success: false,
    error: 'SECURITY VIOLATION: Tally write operations strictly prohibited. All workflow entities exist exclusively within EXFIN operational control layer.'
  });
});
