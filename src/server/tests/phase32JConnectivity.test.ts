/**
 * Phase 32J - Comprehensive Automated Tests for Modular Connectivity Layer & Read-Only Safety
 */

import { readOnlyGuard } from '../readOnlyGuard';
import { TallyXmlHttpConnector } from '../connectors/TallyXmlHttpConnector';
import { TallyOdbcConnector } from '../connectors/TallyOdbcConnector';
import { TallyJsonApiConnector } from '../connectors/TallyJsonApiConnector';
import { TallyFileConnector } from '../connectors/TallyFileConnector';
import { tallyConnectorRegistry } from '../tallyConnectorRegistry';
import { tallyCapabilityDetector } from '../tallyCapabilityDetector';

export async function runPhase32JTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; message: string }[];
}> {
  const results: { testName: string; passed: boolean; message: string }[] = [];

  const assert = (testName: string, condition: boolean, message: string) => {
    results.push({ testName, passed: condition, message });
  };

  try {
    // Test 1: ReadOnlyGuard Command Classifier
    const writeClassification = readOnlyGuard.classifyRequest({
      queryText: 'DELETE FROM Voucher WHERE 1=1'
    });
    assert('ReadOnlyGuard SQL Mutation Classification', writeClassification === 'WRITE', 'Correctly identified DELETE as WRITE');

    const xmlMutation = readOnlyGuard.classifyRequest({
      xmlBody: '<ENVELOPE><BODY><DATA><VOUCHER ACTION="CREATE"><NUMBER>100</NUMBER></VOUCHER></DATA></BODY></ENVELOPE>'
    });
    assert('ReadOnlyGuard XML Mutation Classification', xmlMutation === 'WRITE', 'Correctly identified TDL Action CREATE as WRITE');

    const safeRead = readOnlyGuard.classifyRequest({
      xmlBody: '<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER></ENVELOPE>'
    });
    assert('ReadOnlyGuard Safe Read Classification', safeRead === 'READ', 'Correctly identified Export Data as READ');

    // Test 2: ReadOnlyGuard Enforcement Throw
    let threwGuardError = false;
    try {
      readOnlyGuard.enforceReadOnly('tally-xml-http', 'CMP-001', 'canonical-vouchers', {
        queryText: 'UPDATE Ledger SET $Name = "Hacked"'
      });
    } catch (err) {
      threwGuardError = true;
    }
    assert('ReadOnlyGuard Mutation Block', threwGuardError, 'Enforcement correctly threw error on UPDATE query');

    // Test 3: XML Connector XXE Protection
    const xmlConn = new TallyXmlHttpConnector();
    const profile = tallyConnectorRegistry.getActiveProfile();
    if (profile) {
      await xmlConn.connect(profile);
    }
    let xxeBlocked = false;
    try {
      xmlConn['sanitizeAndValidateXml']('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><ENVELOPE>&xxe;</ENVELOPE>');
    } catch (err) {
      xxeBlocked = true;
    }
    assert('XML Connector XXE Protection', xxeBlocked, 'XXE payload was intercepted and blocked');

    // Test 4: Connector Registry Management
    const connectors = tallyConnectorRegistry.listConnectors();
    assert('Connector Registry Listing', connectors.length >= 4, `Found ${connectors.length} registered connectors`);

    // Test 5: Capability Detector Matrix
    if (profile) {
      const detection = await tallyCapabilityDetector.detectCapabilities(profile);
      assert('Capability Detector Execution', detection.tallyAvailable === true, 'Auto-detection ran successfully and returned active Tally status');
      assert('Capability Companies Discovery', detection.companies.length > 0, `Discovered ${detection.companies.length} companies`);
    }

    // Test 6: Company Switch Context Isolation
    tallyConnectorRegistry.switchCompany('CMP-002');
    assert('Company Switch Context', tallyConnectorRegistry.getActiveCompanyId() === 'CMP-002', 'Active company context correctly switched to CMP-002');
    tallyConnectorRegistry.switchCompany('CMP-001');

  } catch (err: any) {
    results.push({ testName: 'Phase 32J Test Suite Runner', passed: false, message: `Unexpected error: ${err.message}` });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
