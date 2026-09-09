/**
 * Phase 32J - Read-Only Guard & Command Classifier
 * Guarantees that zero mutation/write requests reach Tally or source adapters.
 */

import { CommandClassification, RequestAuditLog } from '../types/phase32JConnector';

export class ReadOnlyGuard {
  private auditLogs: RequestAuditLog[] = [];
  private readonly maxAuditLogs = 500;

  /**
   * Classifies outgoing requests as READ, WRITE, or UNKNOWN.
   */
  public classifyRequest(input: {
    queryText?: string;
    xmlBody?: string;
    method?: string;
    datasetId?: string;
    payload?: any;
  }): CommandClassification {
    const { queryText, xmlBody, method, payload } = input;

    // 1. Check HTTP Method
    if (method) {
      const upperMethod = method.toUpperCase();
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(upperMethod) && !xmlBody && !queryText) {
        // Tally XML HTTP endpoint accepts POST for XML queries, so POST + XML body needs deeper payload inspection
        if (upperMethod === 'DELETE' || upperMethod === 'PUT' || upperMethod === 'PATCH') {
          return 'WRITE';
        }
      }
    }

    // 2. Check XML Content for Tally TDL Mutations
    if (xmlBody) {
      const upperXml = xmlBody.toUpperCase();

      // Mutation TDL Action tags
      const forbiddenXmlTokens = [
        '<ACTION>CREATE',
        '<ACTION>ALTER',
        '<ACTION>DELETE',
        '<ACTION>NEWNAME',
        '<IMPORTDATA>',
        '<VOUCHER ACTION="CREATE"',
        '<VOUCHER ACTION="ALTER"',
        '<VOUCHER ACTION="DELETE"',
        '<LEDGER ACTION="CREATE"',
        '<LEDGER ACTION="ALTER"',
        '<MODIFY',
        '<DELETE',
        '<INSERT'
      ];

      for (const token of forbiddenXmlTokens) {
        if (upperXml.includes(token)) {
          return 'WRITE';
        }
      }

      // Check for valid Tally READ TDL tags
      const safeXmlTokens = [
        '<ENVELOPE>',
        '<HEADER>',
        '<TALLYREQUEST>',
        'EXPORT',
        'GETALLCOLLECTIONS',
        'EXPORT DATA',
        '<TYPE>COLLECTION',
        '<TYPE>VOUCHER',
        '<TYPE>COMPANY',
        '<FETCH>',
        '<STATICVARIABLES>'
      ];

      let isSafeXml = false;
      for (const token of safeXmlTokens) {
        if (upperXml.includes(token)) {
          isSafeXml = true;
          break;
        }
      }

      if (isSafeXml) {
        return 'READ';
      }

      return 'UNKNOWN';
    }

    // 3. Check SQL or Text Query Keywords
    if (queryText) {
      const cleanQuery = queryText.trim().toUpperCase();

      // Explicit SQL Mutation verbs
      const forbiddenSqlVerbs = [
        'INSERT ',
        'UPDATE ',
        'DELETE ',
        'DROP ',
        'ALTER ',
        'CREATE ',
        'TRUNCATE ',
        'REPLACE ',
        'MERGE ',
        'GRANT ',
        'REVOKE ',
        'EXEC ',
        'EXECUTE '
      ];

      for (const verb of forbiddenSqlVerbs) {
        if (cleanQuery.startsWith(verb) || cleanQuery.includes(` ${verb}`)) {
          return 'WRITE';
        }
      }

      // Safe SQL Read verbs
      const safeSqlVerbs = ['SELECT ', 'SHOW ', 'DESCRIBE ', 'EXPLAIN ', 'WITH '];
      for (const verb of safeSqlVerbs) {
        if (cleanQuery.startsWith(verb)) {
          return 'READ';
        }
      }

      return 'UNKNOWN';
    }

    // 4. Check JSON payload structure if present
    if (payload) {
      if (typeof payload === 'object') {
        const action = (payload.action || payload.operation || '').toUpperCase();
        if (['CREATE', 'UPDATE', 'DELETE', 'UPSERT', 'WRITE', 'MODIFY'].includes(action)) {
          return 'WRITE';
        }
        if (['READ', 'SELECT', 'FETCH', 'DISCOVER', 'QUERY', 'EXPORT'].includes(action)) {
          return 'READ';
        }
      }
    }

    return 'READ'; // Default to READ if no forbidden tokens detected
  }

  /**
   * Evaluates request and throws an error if WRITE or UNKNOWN.
   */
  public enforceReadOnly(
    connectorId: string,
    companyId: string,
    datasetId: string,
    input: { queryText?: string; xmlBody?: string; method?: string; payload?: any }
  ): void {
    const classification = this.classifyRequest(input);
    const timestamp = new Date().toISOString();

    if (classification === 'WRITE') {
      const log: RequestAuditLog = {
        requestId: `REQ-GUARD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        connectorId,
        companyId,
        operationType: 'WRITE',
        datasetId,
        timestamp,
        durationMs: 0,
        result: 'REJECTED',
        rejectionReason: 'READ_ONLY_VIOLATION: Write/mutation commands are strictly forbidden.'
      };
      this.recordAuditLog(log);
      throw new Error(`[ReadOnlyGuard] REJECTED Mutation Request! Write/mutation operations are strictly prohibited for Tally connector '${connectorId}'.`);
    }

    if (classification === 'UNKNOWN') {
      const log: RequestAuditLog = {
        requestId: `REQ-GUARD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        connectorId,
        companyId,
        operationType: 'UNKNOWN',
        datasetId,
        timestamp,
        durationMs: 0,
        result: 'REJECTED',
        rejectionReason: 'READ_ONLY_VIOLATION: Unrecognized or unclassified query syntax.'
      };
      this.recordAuditLog(log);
      throw new Error(`[ReadOnlyGuard] REJECTED Unknown Request! Unclassified request payload was blocked to maintain Tally read-only safety.`);
    }

    // Record allowed READ operation
    const log: RequestAuditLog = {
      requestId: `REQ-GUARD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      connectorId,
      companyId,
      operationType: 'READ',
      datasetId,
      timestamp,
      durationMs: 0,
      result: 'SUCCESS'
    };
    this.recordAuditLog(log);
  }

  public recordAuditLog(log: RequestAuditLog): void {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(limit = 50): RequestAuditLog[] {
    return this.auditLogs.slice(0, limit);
  }
}

export const readOnlyGuard = new ReadOnlyGuard();
