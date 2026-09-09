/**
 * Phase 32B - Comprehensive Unit & Integration Test Suite
 * Tests:
 * 1. Canonical Group normalization with unknown nature handling & Group Hierarchy integrity checks
 * 2. Canonical Ledger normalization with value preservation, stable identity & lineage
 * 3. Canonical Party normalization with evidence-based party typing (Customer, Supplier, Employee, Other, Unknown)
 * 4. Party <-> Ledger relationship linkage
 * 5. Canonical Voucher & Voucher-Line normalization with grain enforcement & date/monetary preservation
 * 6. Phase 31 Accounting Graph integration (Company -> Group -> Ledger -> Voucher -> VoucherLine)
 * 7. Strict company isolation between CMP-001 and custom test companies
 */

import { CanonicalNormalizationEngine } from '../canonicalNormalizationEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runPhase32BTests(): { total: number; passed: number; failed: number; results: string[] } {
  const engine = new CanonicalNormalizationEngine();
  const companyId = 'CMP-TEST-32B';
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      results.push(`[PASS] ${name}`);
    } catch (err: any) {
      failed++;
      results.push(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Canonical Group Normalization & Unknown Nature Handling
  // -------------------------------------------------------------
  test('Canonical Group: Preserves source values and defaults unsupported nature to Unknown', () => {
    // Normal group with explicit nature
    const groupWithNature = engine.normalizeGroup(
      {
        groupId: 'GRP-SRC-01',
        name: 'Secured Loans',
        parentGroup: 'Loans (Liability)',
        nature: 'Liabilities',
        CUSTOM_AUDIT_TAG: 'AUDIT-2026'
      },
      companyId
    );

    assert(groupWithNature.groupId.includes('GRP-SRC-01'), 'Group ID generated correctly');
    assert(groupWithNature.name === 'Secured Loans', 'Name preserved');
    assert(groupWithNature.nature === 'Liabilities', 'Nature preserved as Liabilities');
    assert(
      groupWithNature.extensionFields.some((f) => f.name === 'CUSTOM_AUDIT_TAG' && f.value === 'AUDIT-2026'),
      'Unknown extension field preserved'
    );

    // Group without nature in source payload -> should store as Unknown
    const groupWithoutNature = engine.normalizeGroup(
      {
        groupId: 'GRP-SRC-02',
        name: 'Special Provision Pool',
        parentGroup: 'Provisions'
      },
      companyId
    );

    assert(groupWithoutNature.nature === 'Unknown', 'Unsupported nature defaulted to Unknown');
  });

  // -------------------------------------------------------------
  // Test 2: Group Hierarchy Integrity Checks
  // -------------------------------------------------------------
  test('Group Hierarchy Integrity: Detects missing parent and circular references', () => {
    // Register root group
    engine.normalizeGroup(
      { groupId: 'GRP-ROOT', name: 'Primary Assets', isPrimary: true, nature: 'Assets' },
      companyId
    );

    // Register orphan group with nonexistent parent
    engine.normalizeGroup(
      { groupId: 'GRP-ORPHAN', name: 'Floating Balance', parentGroup: 'NONEXISTENT-PARENT-GRP' },
      companyId
    );

    // Register circular references: GRP-CIRC-A -> GRP-CIRC-B -> GRP-CIRC-A
    engine.normalizeGroup(
      { groupId: 'GRP-CIRC-A', name: 'Cycle Node A', parentGroup: 'GRP-CIRC-B' },
      companyId
    );
    engine.normalizeGroup(
      { groupId: 'GRP-CIRC-B', name: 'Cycle Node B', parentGroup: 'GRP-CIRC-A' },
      companyId
    );

    const issues = engine.getIntegrityIssues(companyId);
    
    // Check missing parent or orphan issue
    const missingParent = issues.find(i => (i.type === 'MissingParent' || i.type === 'OrphanGroup') && i.targetId.includes('GRP-ORPHAN'));
    assert(missingParent !== undefined, 'Missing parent / orphan group detected');

    // Check circular hierarchy issue
    const circular = issues.find(i => i.type === 'CircularHierarchy');
    assert(circular !== undefined, 'Circular group hierarchy detected');
  });

  // -------------------------------------------------------------
  // Test 3: Canonical Ledger Normalization & Value Preservation
  // -------------------------------------------------------------
  test('Canonical Ledger: Preserves monetary values, currency, lineage, and detects duplicate names', () => {
    // Register first ledger
    const ledger1 = engine.normalizeLedger(
      {
        ledgerId: 'LED-CASH-01',
        name: 'Petty Cash Desk',
        parentGroup: 'Cash-in-Hand',
        nature: 'Assets',
        currency: 'INR',
        closingBalance: 45000,
        INTERNAL_LOCK_STATUS: 'UNLOCKED'
      },
      companyId
    );

    assert(ledger1.ledgerId.includes('LED-CASH-01'), 'Ledger ID created with stable prefix');
    assert(ledger1.name === 'Petty Cash Desk', 'Ledger name preserved');
    assert(ledger1.closingBalance.normalizedValue === 45000, 'Closing balance preserved accurately');
    assert(ledger1.currency === 'INR', 'Currency preserved');
    assert(
      ledger1.extensionFields.some((f) => f.name === 'INTERNAL_LOCK_STATUS' && f.value === 'UNLOCKED'),
      'Unknown ledger extension field preserved'
    );

    // Register duplicate ledger name under different ID
    const ledger2 = engine.normalizeLedger(
      {
        ledgerId: 'LED-CASH-02',
        name: 'Petty Cash Desk', // Duplicate name
        parentGroup: 'Cash-in-Hand'
      },
      companyId
    );

    assert(ledger2.isDuplicateNameFlagged === true, 'Duplicate ledger name flagged');
  });

  // -------------------------------------------------------------
  // Test 4: Discovered Party Normalization & Evidence-Based Typing
  // -------------------------------------------------------------
  test('Discovered Party: Classifies PartyType based on source evidence and preserves tax/contact details', () => {
    const party = engine.normalizeParty(
      {
        partyId: 'PTY-8801',
        name: 'Starlight Tech Solutions',
        parentGroup: 'Sundry Debtors',
        ledgerId: 'LED-CASH-01',
        gstin: '27AAACS1429B1Z8',
        pan: 'AAACS1429B',
        state: 'Maharashtra',
        address: '101 Cyber Towers, Pune',
        pincode: '411014'
      },
      companyId
    );

    assert(party.partyId.includes('PTY-8801'), 'Party ID created');
    assert(party.partyType === 'Customer', 'Evidence-based type is Customer from Sundry Debtors parent');
    assert(party.taxRegistration?.gstin === '27AAACS1429B1Z8', 'GSTIN preserved');
    assert(party.taxRegistration?.pan === 'AAACS1429B', 'PAN preserved');
    assert(party.address?.state === 'Maharashtra', 'State preserved');
    assert(party.ledgerId !== undefined, 'Linked to Canonical Ledger');
  });

  // -------------------------------------------------------------
  // Test 5: Canonical Voucher & Voucher Lines with Date Fidelity
  // -------------------------------------------------------------
  test('Canonical Voucher & Lines: Preserves original date and normalized ISO date without guessing', () => {
    // Voucher with YYYYMMDD date format from Tally
    const voucher = engine.normalizeVoucher(
      {
        voucherId: 'VCH-INV-9901',
        voucherNumber: 'INV/2026/089',
        voucherType: 'Sales',
        date: '20260415',
        partyName: 'Starlight Tech Solutions',
        reference: 'PO-9921',
        narration: 'Enterprise Software Subscription FY 2026'
      },
      companyId
    );

    assert(voucher.voucherId.includes('VCH-INV-9901'), 'Voucher ID created');
    assert(voucher.date.originalSourceDate === '20260415', 'Original source date preserved verbatim');
    assert(voucher.date.normalizedDate === '2026-04-15', 'Normalized to ISO date format');
    assert(voucher.voucherType === 'Sales', 'Voucher type preserved');

    // Voucher Line 1 (Debit Party)
    const line1 = engine.normalizeVoucherLine(
      {
        lineId: 'LINE-01',
        voucherId: voucher.voucherId,
        lineNumber: 1,
        ledgerId: 'LED-CASH-01',
        ledgerName: 'Petty Cash Desk',
        isDebit: true,
        amount: 118000
      },
      companyId
    );

    assert(line1.amount.isDebit === true, 'Line 1 is Debit');
    assert(line1.amount.normalizedValue === 118000, 'Line 1 amount is 118,000');
    assert(line1.voucherId === voucher.voucherId, 'Voucher FK link established');

    // Voucher Line 2 (Credit Sales Account)
    const line2 = engine.normalizeVoucherLine(
      {
        lineId: 'LINE-02',
        voucherId: voucher.voucherId,
        lineNumber: 2,
        ledgerId: 'LED-CASH-01',
        ledgerName: 'Petty Cash Desk',
        isDebit: false,
        amount: 100000,
        quantity: 1,
        rate: 100000
      },
      companyId
    );

    assert(line2.amount.isDebit === false, 'Line 2 is Credit');
    assert(line2.quantity?.normalizedValue === 1, 'Quantity preserved');
    assert(line2.rate?.normalizedValue === 100000, 'Rate preserved');
  });

  // -------------------------------------------------------------
  // Test 6: Phase 31 Object Graph Sync
  // -------------------------------------------------------------
  test('Phase 31 Object Graph Sync: Unifies canonical masters and vouchers into graph topology', () => {
    const syncResult = engine.syncWithPhase31Graph(companyId);
    assert(syncResult.nodesCount > 0, 'Graph nodes created');
    assert(syncResult.edgesCount > 0, 'Graph edges created');

    const graphData = engine.getGraphData(companyId);
    assert(graphData.nodes.some(n => n.nodeType === 'Group'), 'Group nodes present in graph');
    assert(graphData.nodes.some(n => n.nodeType === 'Ledger'), 'Ledger nodes present in graph');
    assert(graphData.nodes.some(n => n.nodeType === 'Voucher'), 'Voucher nodes present in graph');
    assert(graphData.nodes.some(n => n.nodeType === 'VoucherLine'), 'VoucherLine nodes present in graph');
  });

  // -------------------------------------------------------------
  // Test 7: Strict Company Isolation
  // -------------------------------------------------------------
  test('Company Isolation: CMP-001 and CMP-TEST-32B repositories remain completely segregated', () => {
    const cmp1Groups = engine.getGroups('CMP-001');
    const testGroups = engine.getGroups(companyId);

    assert(cmp1Groups.every(g => g.companyId === 'CMP-001'), 'CMP-001 groups belong exclusively to CMP-001');
    assert(testGroups.every(g => g.companyId === companyId), 'Test groups belong exclusively to test company');
    assert(cmp1Groups.length > 0, 'Default CMP-001 seeded groups exist');
    assert(testGroups.length > 0, 'Test company groups exist independently');
  });

  return {
    total: passed + failed,
    passed,
    failed,
    results
  };
}
