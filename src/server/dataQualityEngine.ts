/**
 * Phase 32F: Data Quality, Validation, Duplicate Detection, Type Analysis & Controlled Transformation Engine
 *
 * Implements:
 * 1. IDataQualityEngine - Dataset & Field quality scoring, null/type/date/monetary/quantity/relationship validation
 * 2. IDuplicateDetectionEngine - Exact & Fuzzy duplicate detection without destructive merge
 * 3. ITransformationEngine - Controlled transformation rules, preview, audit, and source value preservation
 * 4. IValidationRuleEngine - Configurable validation rules with severities, critical blocking & exception audit trail
 */

import {
  QualityStatus,
  QualitySeverity,
  ExceptionAction,
  QualityFinding,
  QualityException,
  FieldQualityMetrics,
  DatasetQualitySummary,
  DuplicateMatch,
  TransformationRule,
  TransformationPreviewResult,
  ValidationRule,
  QualityTrendPoint,
  CompanyQualityDashboard,
  IDataQualityEngine,
  IDuplicateDetectionEngine,
  ITransformationEngine,
  IValidationRuleEngine
} from '../types/phase32FQuality';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { universalDataModelEngine } from './universalDataModelEngine';

export class DataQualityEngine implements IDataQualityEngine, IDuplicateDetectionEngine, ITransformationEngine, IValidationRuleEngine {
  // In-memory repositories scoped by Company ID
  private findingsMap: Map<string, QualityFinding[]> = new Map(); // key: companyId
  private exceptionsMap: Map<string, QualityException[]> = new Map(); // key: companyId
  private rulesMap: Map<string, ValidationRule> = new Map(); // key: ruleId
  private transformationRules: Map<string, TransformationRule> = new Map(); // key: ruleId
  private duplicateMatches: Map<string, DuplicateMatch[]> = new Map(); // key: companyId
  private trendHistory: QualityTrendPoint[] = [];

  constructor() {
    this.initializeDefaultValidationRules();
    this.initializeDefaultTransformationRules();
  }

  // ============================================================================
  // 1. DEFAULT VALIDATION RULES INITIALIZATION
  // ============================================================================

  private initializeDefaultValidationRules() {
    const now = '2026-03-08T00:00:00Z';

    const defaultRules: Omit<ValidationRule, 'ruleId' | 'createdAt' | 'updatedAt'>[] = [
      // Required Fields
      {
        name: 'Group Name Required',
        datasetId: 'canonical-groups',
        field: 'name',
        condition: 'RequiredField',
        severity: 'Critical',
        message: 'Group name must not be null or empty',
        remediationTemplate: 'Verify source Group Name in Tally master XML export.',
        isCriticalBlocking: true,
        isEnabled: true
      },
      {
        name: 'Ledger Name Required',
        datasetId: 'canonical-ledgers',
        field: 'name',
        condition: 'RequiredField',
        severity: 'Critical',
        message: 'Ledger name must not be null or empty',
        remediationTemplate: 'Verify source Ledger Name in Tally master XML export.',
        isCriticalBlocking: true,
        isEnabled: true
      },
      {
        name: 'Voucher Number Required',
        datasetId: 'canonical-vouchers',
        field: 'voucherNumber',
        condition: 'RequiredField',
        severity: 'Error',
        message: 'Voucher number is required for transaction auditing',
        remediationTemplate: 'Check voucher numbering configuration in Tally voucher type settings.',
        isCriticalBlocking: false,
        isEnabled: true
      },
      {
        name: 'Voucher Date Required',
        datasetId: 'canonical-vouchers',
        field: 'date',
        condition: 'DateFormat',
        severity: 'Critical',
        message: 'Valid ISO date format required for voucher posting',
        remediationTemplate: 'Normalize source voucher date or correct date formatting in export.',
        isCriticalBlocking: true,
        isEnabled: true
      },

      // Type & Numeric Validation
      {
        name: 'Voucher Amount Numeric',
        datasetId: 'canonical-vouchers',
        field: 'amount',
        condition: 'NumericType',
        severity: 'Critical',
        message: 'Total voucher amount must be a valid numeric representation',
        remediationTemplate: 'Apply Controlled Transformation rule to parse string to decimal number.',
        isCriticalBlocking: true,
        isEnabled: true
      },
      {
        name: 'Ledger Opening Balance Numeric',
        datasetId: 'canonical-ledgers',
        field: 'openingBalance',
        condition: 'NumericType',
        severity: 'Error',
        message: 'Opening balance must be numeric',
        remediationTemplate: 'Validate opening balance formatting in source ledger export.',
        isCriticalBlocking: false,
        isEnabled: true
      },

      // Hierarchy & Relationships
      {
        name: 'Group Parent Reference Exists',
        datasetId: 'canonical-groups',
        field: 'parentGroupId',
        condition: 'ReferenceExists',
        conditionConfig: { targetDataset: 'canonical-groups', foreignKey: 'groupId' },
        severity: 'Warning',
        message: 'Parent group ID does not exist in canonical groups (Orphan Group)',
        remediationTemplate: 'Synchronize parent group hierarchy or reassign orphan group in Chart of Accounts.',
        isCriticalBlocking: false,
        isEnabled: true
      },
      {
        name: 'No Circular Group Hierarchy',
        datasetId: 'canonical-groups',
        field: 'parentGroupId',
        condition: 'NoCircularDependency',
        severity: 'Critical',
        message: 'Circular reference loop detected in Chart of Accounts group tree',
        remediationTemplate: 'Break cycle in group hierarchy by resetting parent to standard Primary root.',
        isCriticalBlocking: true,
        isEnabled: true
      },
      {
        name: 'Voucher Ledger Exists',
        datasetId: 'canonical-voucher-lines',
        field: 'ledgerId',
        condition: 'ReferenceExists',
        conditionConfig: { targetDataset: 'canonical-ledgers', foreignKey: 'ledgerId' },
        severity: 'Error',
        message: 'Voucher line references non-existent ledger master',
        remediationTemplate: 'Synchronize canonical-ledgers master dataset before syncing transactions.',
        isCriticalBlocking: false,
        isEnabled: true
      },
      {
        name: 'Stock Item Group Reference',
        datasetId: 'canonical-stock-items',
        field: 'stockGroupId',
        condition: 'ReferenceExists',
        conditionConfig: { targetDataset: 'canonical-stock-groups', foreignKey: 'stockGroupId' },
        severity: 'Warning',
        message: 'Stock item references unknown stock group',
        remediationTemplate: 'Verify Inventory Stock Group synchronization status.',
        isCriticalBlocking: false,
        isEnabled: true
      }
    ];

    defaultRules.forEach((r, idx) => {
      const ruleId = `QRULE_DEF_${idx + 1}`;
      this.rulesMap.set(ruleId, {
        ...r,
        ruleId,
        createdAt: now,
        updatedAt: now
      });
    });
  }

  private initializeDefaultTransformationRules() {
    const now = '2026-03-08T00:00:00Z';

    const defaultTransRules: Omit<TransformationRule, 'ruleId' | 'version' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Ledger Name Whitespace Clean',
        datasetId: 'canonical-ledgers',
        field: 'name',
        operation: 'WhitespaceCleanup',
        configuration: { whitespaceMode: 'both' },
        status: 'Active',
        approvedBy: 'Admin'
      },
      {
        name: 'Voucher Narration Whitespace Collapse',
        datasetId: 'canonical-vouchers',
        field: 'narration',
        operation: 'WhitespaceCleanup',
        configuration: { whitespaceMode: 'collapse' },
        status: 'Active',
        approvedBy: 'Admin'
      },
      {
        name: 'Ledger Credit Limit Null Normalization',
        datasetId: 'canonical-ledgers',
        field: 'creditLimit',
        operation: 'NullNormalization',
        configuration: { nullReplacements: ['NA', 'N/A', '-', 'None', 'nil'], targetNullValue: 0 },
        status: 'Active',
        approvedBy: 'Admin'
      },
      {
        name: 'Inventory Unit Standardizer (NOS to Pcs)',
        datasetId: 'canonical-stock-items',
        field: 'unitOfMeasure',
        operation: 'UnitNormalization',
        configuration: { unitMap: { NOS: 'Pcs', NUMBERS: 'Pcs', UNITS: 'Pcs', BTL: 'Bottles', KGS: 'Kg' } },
        status: 'Active',
        approvedBy: 'Admin'
      },
      {
        name: 'Party Alias Normalizer',
        datasetId: 'canonical-parties',
        field: 'partyType',
        operation: 'AliasMapping',
        configuration: { aliasMap: { 'Sundry Debtor': 'Customer', 'Sundry Creditor': 'Supplier', CLIENT: 'Customer', VENDOR: 'Supplier' } },
        status: 'Active',
        approvedBy: 'Admin'
      }
    ];

    defaultTransRules.forEach((tr, idx) => {
      const ruleId = `TRULE_DEF_${idx + 1}`;
      this.transformationRules.set(ruleId, {
        ...tr,
        ruleId,
        version: 1,
        approvedAt: now,
        createdAt: now,
        updatedAt: now
      });
    });
  }

  // ============================================================================
  // 2. DATA QUALITY EVALUATION (IDataQualityEngine)
  // ============================================================================

  public async evaluateDatasetQuality(datasetId: string, companyId: string): Promise<DatasetQualitySummary> {
    const rawRecords = warehouseStorageEngine.getAllCurrentRecords(datasetId, companyId);
    const totalRecords = rawRecords.length;

    const findings: QualityFinding[] = [];
    const fieldMetrics: Record<string, FieldQualityMetrics> = {};
    const exceptions = this.getExceptions(companyId);
    const exceptionMap = new Map<string, QualityException>();
    exceptions.forEach((e) => {
      exceptionMap.set(e.findingId, e);
      if (e.ruleId && e.recordId) {
        exceptionMap.set(`${e.ruleId}_${e.recordId}`, e);
      }
    });

    let missingRequiredCount = 0;
    let relationshipErrorsCount = 0;
    let typeErrorsCount = 0;
    let orphansCount = 0;
    let cyclesCount = 0;
    let duplicateRecordsCount = 0;
    let hasBlockingCriticalFailure = false;

    // Retrieve schema if available
    const schema = universalDataModelEngine.getActiveSchemaForDataset(datasetId);
    const requiredFieldNames = new Set<string>();

    if (schema && schema.fields) {
      schema.fields.filter((f) => f.nullable === 'Required').forEach((f) => requiredFieldNames.add(f.name));
    } else {
      // Fallback standard required fields
      if (datasetId === 'canonical-groups') requiredFieldNames.add('name');
      if (datasetId === 'canonical-ledgers') requiredFieldNames.add('name');
      if (datasetId === 'canonical-vouchers') {
        requiredFieldNames.add('voucherNumber');
        requiredFieldNames.add('date');
      }
    }

    // 1. Analyze Fields and Types per record
    const allFieldNames = new Set<string>();
    rawRecords.forEach((r) => {
      Object.keys(r.payload || {}).forEach((k) => allFieldNames.add(k));
    });

    allFieldNames.forEach((fName) => {
      fieldMetrics[fName] = {
        fieldName: fName,
        recordCount: totalRecords,
        nullCount: 0,
        emptyCount: 0,
        whitespaceCount: 0,
        missingCount: 0,
        nullRate: 0,
        distinctCount: 0,
        invalidCount: 0,
        sourceCoverage: 100,
        typeDistribution: {},
        anomaliesDetected: [],
        hasTransformation: Array.from(this.transformationRules.values()).some((tr) => tr.datasetId === datasetId && tr.field === fName && tr.status === 'Active'),
        sampleValues: []
      };
    });

    const valuesPerField: Record<string, Set<any>> = {};
    allFieldNames.forEach((f) => (valuesPerField[f] = new Set()));

    // Record-level evaluation
    for (const rec of rawRecords) {
      const payload = rec.payload || {};
      const recordId = rec.metadata.canonicalRecordId;

      // A. Check required fields & Null/Empty analysis
      for (const fieldName of allFieldNames) {
        const val = payload[fieldName];
        const fm = fieldMetrics[fieldName];

        // Type distribution tracking
        const valType = val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val;
        fm.typeDistribution[valType] = (fm.typeDistribution[valType] || 0) + 1;

        if (val !== undefined && val !== null) {
          if (valuesPerField[fieldName].size < 100) valuesPerField[fieldName].add(String(val));
          if (fm.sampleValues.length < 5) fm.sampleValues.push(val);
        }

        // Distinct category detection: Null vs Empty String vs Whitespace vs Missing
        if (!(fieldName in payload) || val === undefined) {
          fm.missingCount++;
        } else if (val === null) {
          fm.nullCount++;
        } else if (typeof val === 'string' && val === '') {
          fm.emptyCount++;
        } else if (typeof val === 'string' && val.trim() === '' && val.length > 0) {
          fm.whitespaceCount++;
        }

        // Required field validation
        if (requiredFieldNames.has(fieldName)) {
          const isMissingOrBlank = val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
          if (isMissingOrBlank) {
            missingRequiredCount++;
            const findingId = `FIND_REQ_${recordId}_${fieldName}`;
            const ruleId = 'QRULE_REQUIRED_FIELD';
            const exc = exceptionMap.get(`${ruleId}_${recordId}`);

            const finding: QualityFinding = {
              findingId,
              datasetId,
              recordId,
              field: fieldName,
              ruleId,
              ruleName: `Required Field '${fieldName}'`,
              severity: 'Critical',
              category: 'RequiredField',
              message: `Field '${fieldName}' is required by dataset schema but is missing or empty.`,
              sourceValue: val,
              remediationSuggestion: `Review upstream Tally extraction for missing property '${fieldName}'.`,
              detectedAt: new Date().toISOString(),
              companyId,
              schemaVersion: rec.metadata.schemaVersion,
              snapshotId: rec.metadata.sourceSnapshotId,
              exception: exc
            };
            findings.push(finding);
            if (!exc || exc.action !== 'Accepted') {
              hasBlockingCriticalFailure = true;
            }
          }
        }

        // B. Type Validation & Anomalies
        if (val !== undefined && val !== null) {
          // Date validation
          if (fieldName.toLowerCase().includes('date')) {
            const dateValidation = this.validateDateValue(val);
            if (!dateValidation.isValid) {
              typeErrorsCount++;
              fm.invalidCount++;
              fm.anomaliesDetected.push('InvalidDate');
              const findingId = `FIND_DATE_${recordId}_${fieldName}`;
              const ruleId = 'QRULE_VALID_DATE';
              const exc = exceptionMap.get(`${ruleId}_${recordId}`);

              findings.push({
                findingId,
                datasetId,
                recordId,
                field: fieldName,
                ruleId,
                ruleName: 'Valid Date Verification',
                severity: 'Critical',
                category: 'Date',
                message: `Date field '${fieldName}' contains invalid or impossible date: '${String(val)}' (${dateValidation.reason})`,
                sourceValue: val,
                remediationSuggestion: 'Normalize date format via Controlled Transformation.',
                detectedAt: new Date().toISOString(),
                companyId,
                schemaVersion: rec.metadata.schemaVersion,
                exception: exc
              });
              if (!exc || exc.action !== 'Accepted') {
                hasBlockingCriticalFailure = true;
              }
            }
          }

          // Monetary / Numeric validation
          if (fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('balance') || fieldName.toLowerCase().includes('rate')) {
            if (typeof val === 'string' && isNaN(Number(val))) {
              typeErrorsCount++;
              fm.invalidCount++;
              fm.anomaliesDetected.push('TextWhereNumberExpected');
              const findingId = `FIND_NUM_${recordId}_${fieldName}`;
              const ruleId = 'QRULE_NUMERIC_AMOUNT';
              const exc = exceptionMap.get(`${ruleId}_${recordId}`);

              findings.push({
                findingId,
                datasetId,
                recordId,
                field: fieldName,
                ruleId,
                ruleName: 'Numeric Value Verification',
                severity: 'Critical',
                category: 'Monetary',
                message: `Numeric field '${fieldName}' contains text value: '${val}'.`,
                sourceValue: val,
                remediationSuggestion: 'Configure controlled TypeConversion transformation to parse text to decimal.',
                detectedAt: new Date().toISOString(),
                companyId,
                exception: exc
              });
              if (!exc || exc.action !== 'Accepted') {
                hasBlockingCriticalFailure = true;
              }
            } else if (typeof val === 'number') {
              // Precision anomaly check (e.g. > 4 decimal places)
              const strVal = val.toString();
              if (strVal.includes('.') && strVal.split('.')[1].length > 4) {
                fm.anomaliesDetected.push('PrecisionAnomaly');
                findings.push({
                  findingId: `FIND_PREC_${recordId}_${fieldName}`,
                  datasetId,
                  recordId,
                  field: fieldName,
                  ruleId: 'QRULE_PRECISION',
                  ruleName: 'Monetary Precision Anomaly',
                  severity: 'Warning',
                  category: 'Monetary',
                  message: `Field '${fieldName}' has unusual floating precision (>4 decimals): ${val}`,
                  sourceValue: val,
                  remediationSuggestion: 'Verify source Tally decimal config. Do not round source values destructive.',
                  detectedAt: new Date().toISOString(),
                  companyId
                });
              }
            }
          }

          // Quantity validation (negative quantities are NOT errors)
          if (fieldName.toLowerCase().includes('quantity') || fieldName.toLowerCase().includes('qty')) {
            if (typeof val === 'string' && isNaN(Number(val))) {
              typeErrorsCount++;
              fm.invalidCount++;
              findings.push({
                findingId: `FIND_QTY_${recordId}_${fieldName}`,
                datasetId,
                recordId,
                field: fieldName,
                ruleId: 'QRULE_QUANTITY_MALFORMED',
                ruleName: 'Malformed Quantity Format',
                severity: 'Error',
                category: 'Quantity',
                message: `Quantity field '${fieldName}' contains malformed non-numeric text '${val}'`,
                sourceValue: val,
                remediationSuggestion: 'Normalize units and extract numeric quantity.',
                detectedAt: new Date().toISOString(),
                companyId
              });
            }
          }
        }
      }
    }

    // Populate field metric counts & distinct rates
    allFieldNames.forEach((fName) => {
      const fm = fieldMetrics[fName];
      fm.distinctCount = valuesPerField[fName].size;
      const totalNulls = fm.nullCount + fm.emptyCount + fm.whitespaceCount + fm.missingCount;
      fm.nullRate = totalRecords > 0 ? Number((totalNulls / totalRecords).toFixed(3)) : 0;
      fm.sourceCoverage = totalRecords > 0 ? Number((((totalRecords - totalNulls) / totalRecords) * 100).toFixed(1)) : 100;
    });

    // C. Relationship Validation & Orphan Detection
    if (datasetId === 'canonical-groups') {
      const groupMap = new Map<string, Record<string, any>>();
      rawRecords.forEach((r) => {
        const id = r.metadata.canonicalRecordId;
        const name = (r.payload?.name || '').toLowerCase();
        groupMap.set(id, r.payload);
        if (name) groupMap.set(name, r.payload);
      });

      // Standard primary roots in Tally Chart of Accounts
      const standardRoots = new Set([
        'primary',
        'capital account',
        'loans (liability)',
        'current liabilities',
        'fixed assets',
        'investments',
        'current assets',
        'branch / divisions',
        'misc. expenses (asset)',
        'suspense a/c',
        'sales accounts',
        'purchase accounts',
        'direct incomes',
        'indirect incomes',
        'direct expenses',
        'indirect expenses'
      ]);

      for (const rec of rawRecords) {
        const parentName = rec.payload?.parentGroupName || rec.payload?.parent;
        const groupName = (rec.payload?.name || '').toLowerCase();

        if (parentName) {
          const parentExists = groupMap.has(parentName.toLowerCase());
          if (!parentExists) {
            relationshipErrorsCount++;
            orphansCount++;
            findings.push({
              findingId: `FIND_ORPH_${rec.metadata.canonicalRecordId}`,
              datasetId,
              recordId: rec.metadata.canonicalRecordId,
              field: 'parentGroupName',
              ruleId: 'QRULE_ORPHAN_GROUP',
              ruleName: 'Missing Parent Group (Orphan)',
              severity: 'Warning',
              category: 'Relationship',
              message: `Group '${rec.payload?.name}' references missing parent group '${parentName}'`,
              sourceValue: parentName,
              remediationSuggestion: 'Sync parent group or assign group to standard Primary root. Do not create fake parents.',
              detectedAt: new Date().toISOString(),
              companyId
            });
          }
        } else if (!standardRoots.has(groupName)) {
          // Orphan non-standard root
          orphansCount++;
          findings.push({
            findingId: `FIND_ROOT_ORPH_${rec.metadata.canonicalRecordId}`,
            datasetId,
            recordId: rec.metadata.canonicalRecordId,
            field: 'name',
            ruleId: 'QRULE_ORPHAN_GROUP_ROOT',
            ruleName: 'Non-Standard Orphan Root Group',
            severity: 'Info',
            category: 'Relationship',
            message: `Group '${rec.payload?.name}' has no parent and is not a recognized primary Tally root.`,
            sourceValue: rec.payload?.name,
            remediationSuggestion: 'Verify if group belongs to Primary or a standard sub-group.',
            detectedAt: new Date().toISOString(),
            companyId
          });
        }
      }

      // D. Circular Relationship Detection (DFS cycle detection)
      const cycles = this.detectCircularRelationships(rawRecords, 'name', 'parentGroupName');
      if (cycles.length > 0) {
        cyclesCount += cycles.length;
        hasBlockingCriticalFailure = true;
        cycles.forEach((cycle, cIdx) => {
          findings.push({
            findingId: `FIND_CYCLE_${cIdx}`,
            datasetId,
            recordId: cycle.rootId,
            field: 'parentGroupName',
            ruleId: 'QRULE_CIRCULAR_HIERARCHY',
            ruleName: 'Circular Hierarchy Detected',
            severity: 'Critical',
            category: 'Relationship',
            message: `Circular dependency detected in group hierarchy: ${cycle.path.join(' -> ')}`,
            remediationSuggestion: 'Break loop by resetting parent group of root element to standard Primary root.',
            detectedAt: new Date().toISOString(),
            companyId
          });
        });
      }
    }

    // E. Duplicate Detection
    const exactDuplicates = this.findExactDuplicates(datasetId, companyId);
    duplicateRecordsCount = exactDuplicates.length;
    exactDuplicates.forEach((dup) => {
      findings.push({
        findingId: `FIND_DUP_${dup.matchId}`,
        datasetId,
        recordId: dup.recordA.recordId,
        ruleId: 'QRULE_EXACT_DUPLICATE',
        ruleName: 'Exact Duplicate Record Match',
        severity: 'Warning',
        category: 'Duplicate',
        message: `Exact duplicate match found between ${dup.recordA.sourceId} and ${dup.recordB.sourceId} (Fingerprint: ${dup.recordA.fingerprint})`,
        remediationSuggestion: 'Inspect duplicate in Duplicate Review Center. Do not perform destructive auto-merge.',
        detectedAt: new Date().toISOString(),
        companyId
      });
    });

    // Link recorded exceptions
    findings.forEach((f) => {
      const exc = exceptionMap.get(f.findingId) || (f.ruleId && f.recordId ? exceptionMap.get(`${f.ruleId}_${f.recordId}`) : undefined);
      if (exc) {
        f.exception = exc;
      }
    });

    // Calculate Counts
    let errorRecords = 0;
    let warningRecords = 0;
    const recordsWithErrors = new Set<string>();
    const recordsWithWarnings = new Set<string>();

    findings.forEach((f) => {
      if (f.exception && f.exception.action === 'Accepted') return;
      if (f.severity === 'Error' || f.severity === 'Critical') {
        recordsWithErrors.add(f.recordId);
      } else if (f.severity === 'Warning') {
        recordsWithWarnings.add(f.recordId);
      }
    });

    errorRecords = recordsWithErrors.size;
    warningRecords = recordsWithWarnings.size;
    const validRecords = Math.max(0, totalRecords - errorRecords - warningRecords);

    // Compute Quality Score (0 to 100)
    // Describes technical data completeness quality. (Does not claim accounting correctness).
    let score = 100;
    if (totalRecords > 0) {
      const penalty = (errorRecords * 15 + warningRecords * 4 + duplicateRecordsCount * 5 + orphansCount * 3 + cyclesCount * 25) / totalRecords;
      score = Math.max(0, Math.min(100, Math.round(100 - penalty * 100)));
    }

    // Determine Overall Quality Status
    let status: QualityStatus = 'Healthy';
    if (hasBlockingCriticalFailure || errorRecords > 0 || score < 60) {
      status = 'Error';
    } else if (warningRecords > 0 || score < 85) {
      status = 'Warning';
    } else if (totalRecords === 0) {
      status = 'Unknown';
    }

    // Store findings in cache
    this.findingsMap.set(`${companyId}_${datasetId}`, findings);

    const summary: DatasetQualitySummary = {
      datasetId,
      datasetName: datasetId.replace('canonical-', '').replace(/-/g, ' ').toUpperCase(),
      companyId,
      status,
      qualityScore: score,
      totalRecords,
      validRecords,
      warningRecords,
      errorRecords,
      unknownRecords: 0,
      duplicateRecords: duplicateRecordsCount,
      missingRequiredFieldsCount: missingRequiredCount,
      relationshipErrorsCount,
      typeErrorsCount,
      orphansCount,
      cyclesCount,
      fieldMetrics,
      findings,
      evaluatedAt: new Date().toISOString(),
      schemaVersion: 1,
      hasBlockingCriticalFailure
    };

    // Record trend point
    this.recordTrendPoint(companyId, datasetId, score, totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100, errorRecords, warningRecords);

    return summary;
  }

  public async evaluateCompanyQuality(companyId: string, financialYear?: string): Promise<CompanyQualityDashboard> {
    const canonicalDatasets = [
      'canonical-groups',
      'canonical-ledgers',
      'canonical-parties',
      'canonical-vouchers',
      'canonical-voucher-lines',
      'canonical-stock-groups',
      'canonical-stock-items'
    ];

    const datasetSummaries: DatasetQualitySummary[] = [];
    for (const ds of canonicalDatasets) {
      const sum = await this.evaluateDatasetQuality(ds, companyId);
      datasetSummaries.push(sum);
    }

    let totalRecords = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalDuplicates = 0;
    let totalOrphans = 0;
    let totalCycles = 0;
    let weightedScoreSum = 0;
    const allFindings: QualityFinding[] = [];

    datasetSummaries.forEach((s) => {
      totalRecords += s.totalRecords;
      totalErrors += s.errorRecords;
      totalWarnings += s.warningRecords;
      totalDuplicates += s.duplicateRecords;
      totalOrphans += s.orphansCount;
      totalCycles += s.cyclesCount;
      weightedScoreSum += s.qualityScore * Math.max(1, s.totalRecords);
      allFindings.push(...s.findings);
    });

    const overallScore = totalRecords > 0 ? Math.round(weightedScoreSum / totalRecords) : 100;

    let overallStatus: QualityStatus = 'Healthy';
    if (datasetSummaries.some((s) => s.hasBlockingCriticalFailure || s.status === 'Error')) {
      overallStatus = 'Error';
    } else if (datasetSummaries.some((s) => s.status === 'Warning')) {
      overallStatus = 'Warning';
    }

    // Construct remediation suggestions
    const suggestions: CompanyQualityDashboard['remediationSuggestions'] = [];

    if (totalDuplicates > 0) {
      suggestions.push({
        id: 'REM_DUP',
        datasetId: 'Multiple',
        type: 'InvestigateDuplicate',
        priority: 'High',
        title: 'Investigate Record Duplicates',
        description: `Found ${totalDuplicates} duplicate record matches across masters and vouchers. Review in Duplicate Review Center.`,
        actionLabel: 'Review Duplicates',
        affectedCount: totalDuplicates
      });
    }

    if (totalOrphans > 0) {
      suggestions.push({
        id: 'REM_ORPH',
        datasetId: 'canonical-groups',
        type: 'AddMissingRelationship',
        priority: 'Medium',
        title: 'Reassign Orphan Groups',
        description: `Identified ${totalOrphans} groups with missing parent classifications. Reassign to standard root hierarchy.`,
        actionLabel: 'Inspect Hierarchy',
        affectedCount: totalOrphans
      });
    }

    const unapprovedRules = Array.from(this.transformationRules.values()).filter((r) => r.status === 'Draft');
    if (unapprovedRules.length > 0) {
      suggestions.push({
        id: 'REM_TRANS',
        datasetId: 'System',
        type: 'ApproveTransformation',
        priority: 'Medium',
        title: 'Pending Controlled Transformations',
        description: `${unapprovedRules.length} transformation rule(s) are awaiting administrator approval before activation.`,
        actionLabel: 'Approve Rules',
        affectedCount: unapprovedRules.length
      });
    }

    // Historical trend calculation
    const companyHistory = this.trendHistory.filter((t) => t.companyId === companyId);
    const prevScore = companyHistory.length > 1 ? companyHistory[companyHistory.length - 2].score : overallScore;

    return {
      companyId,
      overallScore,
      status: overallStatus,
      totalRecordsAnalyzed: totalRecords,
      totalErrors,
      totalWarnings,
      totalDuplicates,
      totalOrphans,
      totalCycles,
      datasetSummaries,
      recentFindings: allFindings.slice(0, 50),
      remediationSuggestions: suggestions,
      trend: {
        previousScore: prevScore,
        currentScore: overallScore,
        change: overallScore - prevScore,
        history: companyHistory.slice(-20)
      },
      lastEvaluatedAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // 3. DATE & RELATIONSHIP HELPER ENGINES
  // ============================================================================

  private validateDateValue(val: any): { isValid: boolean; reason?: string } {
    if (val === null || val === undefined) return { isValid: false, reason: 'Null/undefined date' };
    const str = String(val).trim();
    if (!str) return { isValid: false, reason: 'Empty date string' };

    // Check standard ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);

      if (month < 1 || month > 12) return { isValid: false, reason: `Invalid month: ${month}` };
      if (day < 1 || day > 31) return { isValid: false, reason: `Invalid day: ${day}` };

      // Check month boundaries (e.g. Feb 30/31, April 31)
      const maxDaysInMonth = new Date(year, month, 0).getDate();
      if (day > maxDaysInMonth) {
        return { isValid: false, reason: `Impossible date ${year}-${month}-${day} (Month ${month} has ${maxDaysInMonth} days)` };
      }

      return { isValid: true };
    }

    // Check Tally YYYYMMDD format
    if (/^\d{8}$/.test(str)) {
      const year = parseInt(str.substring(0, 4), 10);
      const month = parseInt(str.substring(4, 6), 10);
      const day = parseInt(str.substring(6, 8), 10);
      if (month < 1 || month > 12 || day < 1 || day > 31) return { isValid: false, reason: 'Malformed numeric date' };
      const maxDays = new Date(year, month, 0).getDate();
      if (day > maxDays) return { isValid: false, reason: `Impossible date ${year}-${month}-${day}` };
      return { isValid: true };
    }

    // Fallback Date parser
    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) {
      return { isValid: false, reason: 'Unparseable date representation' };
    }

    return { isValid: true };
  }

  private detectCircularRelationships(
    records: Array<{ metadata: { canonicalRecordId: string }; payload: Record<string, any> }>,
    nameField: string,
    parentField: string
  ): Array<{ rootId: string; path: string[] }> {
    const parentMap = new Map<string, string>();
    records.forEach((r) => {
      const name = (r.payload[nameField] || '').toLowerCase().trim();
      const parent = (r.payload[parentField] || '').toLowerCase().trim();
      if (name && parent) {
        parentMap.set(name, parent);
      }
    });

    const cycles: Array<{ rootId: string; path: string[] }> = [];
    const visited = new Set<string>();

    for (const [name] of parentMap.entries()) {
      const path: string[] = [name];
      const seenInPath = new Set<string>([name]);
      let curr = parentMap.get(name);

      while (curr && parentMap.has(curr)) {
        path.push(curr);
        if (seenInPath.has(curr)) {
          // Cycle found!
          const cycleStartIdx = path.indexOf(curr);
          const cyclePath = path.slice(cycleStartIdx);
          const cycleKey = [...cyclePath].sort().join(':');
          if (!visited.has(cycleKey)) {
            visited.add(cycleKey);
            cycles.push({ rootId: name, path: cyclePath });
          }
          break;
        }
        seenInPath.add(curr);
        curr = parentMap.get(curr);
      }
    }

    return cycles;
  }

  // ============================================================================
  // 4. DUPLICATE DETECTION ENGINE (IDuplicateDetectionEngine)
  // ============================================================================

  public findExactDuplicates(datasetId: string, companyId: string): DuplicateMatch[] {
    const records = warehouseStorageEngine.getAllCurrentRecords(datasetId, companyId);
    const fingerprintMap = new Map<string, typeof records>();
    const matches: DuplicateMatch[] = [];

    records.forEach((rec) => {
      const payload = rec.payload || {};
      // Deterministic signature excluding volatile metadata
      const clone = { ...payload };
      delete clone.updatedAt;
      delete clone.sourceSnapshotId;
      delete clone.extractedAt;
      const signature = JSON.stringify(clone);

      if (!fingerprintMap.has(signature)) {
        fingerprintMap.set(signature, []);
      }
      fingerprintMap.get(signature)!.push(rec);
    });

    for (const [sig, group] of fingerprintMap.entries()) {
      if (group.length > 1) {
        for (let i = 0; i < group.length - 1; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const recA = group[i];
            const recB = group[j];
            const matchId = `DUP_EXACT_${recA.metadata.canonicalRecordId}_${recB.metadata.canonicalRecordId}`;
            matches.push({
              matchId,
              companyId,
              datasetId,
              type: 'Exact',
              recordA: {
                recordId: recA.metadata.canonicalRecordId,
                sourceId: recA.metadata.sourceId,
                payload: recA.payload
              },
              recordB: {
                recordId: recB.metadata.canonicalRecordId,
                sourceId: recB.metadata.sourceId,
                payload: recB.payload
              },
              similarity: 1.0,
              matchingFields: Object.keys(recA.payload || {}),
              reason: 'Exact payload signature and field contents match identically.',
              detectedAt: new Date().toISOString(),
              status: 'PendingReview'
            });
          }
        }
      }
    }

    this.duplicateMatches.set(`${companyId}_${datasetId}`, matches);
    return matches;
  }

  public findPossibleDuplicates(datasetId: string, companyId: string, threshold = 0.85): DuplicateMatch[] {
    const records = warehouseStorageEngine.getAllCurrentRecords(datasetId, companyId);
    const matches: DuplicateMatch[] = [];

    // Compare name similarity or (date + amount similarity for vouchers)
    for (let i = 0; i < records.length - 1; i++) {
      for (let j = i + 1; j < Math.min(records.length, i + 100); j++) {
        const a = records[i];
        const b = records[j];

        // Voucher date + amount duplicate check
        if (datasetId === 'canonical-vouchers') {
          const dateA = a.payload?.date;
          const dateB = b.payload?.date;
          const amtA = Math.abs(Number(a.payload?.amount || 0));
          const amtB = Math.abs(Number(b.payload?.amount || 0));

          if (dateA && dateB && dateA === dateB && amtA === amtB && amtA > 0) {
            matches.push({
              matchId: `DUP_POSS_${a.metadata.canonicalRecordId}_${b.metadata.canonicalRecordId}`,
              companyId,
              datasetId,
              type: 'Possible',
              recordA: { recordId: a.metadata.canonicalRecordId, sourceId: a.metadata.sourceId, payload: a.payload },
              recordB: { recordId: b.metadata.canonicalRecordId, sourceId: b.metadata.sourceId, payload: b.payload },
              similarity: 0.9,
              matchingFields: ['date', 'amount'],
              reason: `Identical transaction date (${dateA}) and amount (${amtA}) across different voucher numbers.`,
              detectedAt: new Date().toISOString(),
              status: 'PendingReview'
            });
          }
        } else {
          // Name fuzzy similarity check
          const nameA = String(a.payload?.name || '').toLowerCase().trim();
          const nameB = String(b.payload?.name || '').toLowerCase().trim();
          if (nameA && nameB && nameA !== nameB) {
            const sim = this.calculateStringSimilarity(nameA, nameB);
            if (sim >= threshold) {
              matches.push({
                matchId: `DUP_FUZZY_${a.metadata.canonicalRecordId}_${b.metadata.canonicalRecordId}`,
                companyId,
                datasetId,
                type: 'Possible',
                recordA: { recordId: a.metadata.canonicalRecordId, sourceId: a.metadata.sourceId, payload: a.payload },
                recordB: { recordId: b.metadata.canonicalRecordId, sourceId: b.metadata.sourceId, payload: b.payload },
                similarity: sim,
                matchingFields: ['name'],
                reason: `High name similarity (${Math.round(sim * 100)}%): '${nameA}' vs '${nameB}'`,
                detectedAt: new Date().toISOString(),
                status: 'PendingReview'
              });
            }
          }
        }
      }
    }

    return matches;
  }

  public reviewDuplicate(matchId: string, status: 'ConfirmedDuplicate' | 'Dismissed', user: string) {
    for (const matches of this.duplicateMatches.values()) {
      const target = matches.find((m) => m.matchId === matchId);
      if (target) {
        target.status = status;
        break;
      }
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0 || len2 === 0) return 0.0;

    // Levenshtein distance
    const track = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(null));
    for (let i = 0; i <= len1; i += 1) track[0][i] = i;
    for (let j = 0; j <= len2; j += 1) track[j][0] = j;

    for (let j = 1; j <= len2; j += 1) {
      for (let i = 1; i <= len1; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
      }
    }
    const distance = track[len2][len1];
    return Math.max(0, 1 - distance / Math.max(len1, len2));
  }

  // ============================================================================
  // 5. CONTROLLED TRANSFORMATION ENGINE (ITransformationEngine)
  // ============================================================================

  public createRule(rule: Omit<TransformationRule, 'ruleId' | 'version' | 'createdAt' | 'updatedAt'>): TransformationRule {
    const ruleId = `TRULE_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const newRule: TransformationRule = {
      ...rule,
      ruleId,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    this.transformationRules.set(ruleId, newRule);
    return newRule;
  }

  public updateRule(ruleId: string, updates: Partial<TransformationRule>): TransformationRule {
    const existing = this.transformationRules.get(ruleId);
    if (!existing) throw new Error(`Transformation rule '${ruleId}' not found.`);
    const updated: TransformationRule = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString()
    };
    this.transformationRules.set(ruleId, updated);
    return updated;
  }

  public approveRule(ruleId: string, approvedBy: string): TransformationRule {
    const rule = this.transformationRules.get(ruleId);
    if (!rule) throw new Error(`Transformation rule '${ruleId}' not found.`);
    rule.status = 'Active';
    rule.approvedBy = approvedBy;
    rule.approvedAt = new Date().toISOString();
    rule.updatedAt = new Date().toISOString();
    return rule;
  }

  public async previewTransformation(ruleId: string, companyId: string, sampleSize = 25): Promise<TransformationPreviewResult> {
    const rule = this.transformationRules.get(ruleId);
    if (!rule) throw new Error(`Transformation rule '${ruleId}' not found.`);

    const records = warehouseStorageEngine.getAllCurrentRecords(rule.datasetId, companyId).slice(0, sampleSize);
    const examples: TransformationPreviewResult['examples'] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let affected = 0;

    for (const rec of records) {
      const orig = rec.payload[rule.field];
      const result = this.applyTransformationOperation(orig, rule);

      if (result.transformed !== orig) {
        affected++;
      }

      examples.push({
        recordId: rec.metadata.canonicalRecordId,
        originalValue: orig,
        transformedValue: result.transformed,
        status: result.error ? 'ConversionError' : 'Success',
        error: result.error
      });

      if (result.error) errors.push(result.error);
    }

    return {
      ruleId,
      datasetId: rule.datasetId,
      field: rule.field,
      recordsAffected: affected,
      examples,
      warnings,
      errors: Array.from(new Set(errors)),
      dependentImpact: {
        reports: ['Trial Balance Reconstruction', 'General Ledger Audit', 'Daybook Drilldown'],
        queries: [`SELECT ${rule.field} FROM ${rule.datasetId}`],
        dashboards: ['Working Capital Summary', 'Cash Flow Forecast'],
        graphNodes: [`node-${rule.datasetId}`]
      }
    };
  }

  public async applyTransformations(datasetId: string, companyId: string): Promise<{ recordsProcessed: number; transformationsApplied: number; errors: number }> {
    const activeRules = Array.from(this.transformationRules.values()).filter((r) => r.datasetId === datasetId && r.status === 'Active');
    if (activeRules.length === 0) {
      return { recordsProcessed: 0, transformationsApplied: 0, errors: 0 };
    }

    const records = warehouseStorageEngine.getAllCurrentRecords(datasetId, companyId);
    let transformationsApplied = 0;
    let errors = 0;

    for (const rec of records) {
      let modified = false;
      const updatedPayload = { ...rec.payload };

      for (const rule of activeRules) {
        const origVal = updatedPayload[rule.field];
        if (origVal !== undefined) {
          const res = this.applyTransformationOperation(origVal, rule);
          if (res.error) {
            errors++;
          } else if (res.transformed !== origVal) {
            // Preserve both original and transformed value in lineage
            updatedPayload[`_orig_${rule.field}`] = origVal;
            updatedPayload[rule.field] = res.transformed;
            updatedPayload[`_transform_rule_${rule.field}`] = rule.ruleId;
            transformationsApplied++;
            modified = true;
          }
        }
      }

      if (modified) {
        warehouseStorageEngine.recordHistoricalVersion(datasetId, companyId, rec.metadata.canonicalRecordId, updatedPayload);
      }
    }

    return {
      recordsProcessed: records.length,
      transformationsApplied,
      errors
    };
  }

  public getTransformationRules(datasetId?: string): TransformationRule[] {
    const rules = Array.from(this.transformationRules.values());
    return datasetId ? rules.filter((r) => r.datasetId === datasetId) : rules;
  }

  private applyTransformationOperation(value: any, rule: TransformationRule): { transformed: any; error?: string } {
    if (value === undefined || value === null) return { transformed: value };

    try {
      switch (rule.operation) {
        case 'WhitespaceCleanup': {
          if (typeof value !== 'string') return { transformed: value };
          const mode = rule.configuration.whitespaceMode || 'both';
          let res = value;
          if (mode === 'trim' || mode === 'both') res = res.trim();
          if (mode === 'collapse' || mode === 'both') res = res.replace(/\s+/g, ' ');
          return { transformed: res };
        }

        case 'TypeConversion': {
          const target = rule.configuration.targetType || 'number';
          if (target === 'number') {
            const num = Number(value);
            if (isNaN(num)) return { transformed: value, error: `Cannot convert '${value}' to numeric number` };
            return { transformed: num };
          }
          if (target === 'string') return { transformed: String(value) };
          if (target === 'boolean') return { transformed: Boolean(value) };
          return { transformed: value };
        }

        case 'NullNormalization': {
          const replacements = rule.configuration.nullReplacements || ['NA', 'N/A', '-', 'None'];
          if (typeof value === 'string' && replacements.map((r) => r.toLowerCase()).includes(value.toLowerCase().trim())) {
            return { transformed: rule.configuration.targetNullValue ?? null };
          }
          return { transformed: value };
        }

        case 'AliasMapping': {
          const aliasMap = rule.configuration.aliasMap || {};
          const strVal = String(value);
          if (aliasMap[strVal]) return { transformed: aliasMap[strVal] };
          return { transformed: value };
        }

        case 'UnitNormalization': {
          const unitMap = rule.configuration.unitMap || {};
          const strVal = String(value).toUpperCase().trim();
          if (unitMap[strVal]) return { transformed: unitMap[strVal] };
          return { transformed: value };
        }

        case 'DateNormalization': {
          const strVal = String(value).trim();
          if (/^\d{8}$/.test(strVal)) {
            const normalized = `${strVal.substring(0, 4)}-${strVal.substring(4, 6)}-${strVal.substring(6, 8)}`;
            return { transformed: normalized };
          }
          return { transformed: value };
        }

        default:
          return { transformed: value };
      }
    } catch (err: any) {
      return { transformed: value, error: err.message };
    }
  }

  // ============================================================================
  // 6. VALIDATION RULE ENGINE & EXCEPTIONS (IValidationRuleEngine)
  // ============================================================================

  public registerRule(rule: Omit<ValidationRule, 'ruleId' | 'createdAt' | 'updatedAt'>): ValidationRule {
    const ruleId = `QRULE_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const newRule: ValidationRule = {
      ...rule,
      ruleId,
      createdAt: now,
      updatedAt: now
    };
    this.rulesMap.set(ruleId, newRule);
    return newRule;
  }

  public getValidationRules(datasetId?: string): ValidationRule[] {
    const rules = Array.from(this.rulesMap.values());
    return datasetId ? rules.filter((r) => r.datasetId === datasetId) : rules;
  }

  public getRules(datasetId?: string): ValidationRule[] {
    return this.getValidationRules(datasetId);
  }

  public validateRecord(record: Record<string, any>, datasetId: string, companyId: string): QualityFinding[] {
    const rules = this.getValidationRules(datasetId).filter((r) => r.isEnabled);
    const findings: QualityFinding[] = [];
    const recId = record.metadata?.canonicalRecordId || record.canonicalRecordId || record.id || 'rec_0';
    const payload = record.payload || record;

    for (const r of rules) {
      if (!r.field) continue;
      const val = payload[r.field];

      if (r.condition === 'RequiredField') {
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          findings.push({
            findingId: `FIND_REC_${recId}_${r.field}`,
            datasetId,
            recordId: recId,
            field: r.field,
            ruleId: r.ruleId,
            ruleName: r.name,
            severity: r.severity,
            category: 'RequiredField',
            message: r.message,
            sourceValue: val,
            remediationSuggestion: r.remediationTemplate,
            detectedAt: new Date().toISOString(),
            companyId
          });
        }
      } else if (r.condition === 'NumericType') {
        if (val !== undefined && val !== null && isNaN(Number(val))) {
          findings.push({
            findingId: `FIND_REC_${recId}_${r.field}`,
            datasetId,
            recordId: recId,
            field: r.field,
            ruleId: r.ruleId,
            ruleName: r.name,
            severity: r.severity,
            category: 'Type',
            message: r.message,
            sourceValue: val,
            remediationSuggestion: r.remediationTemplate,
            detectedAt: new Date().toISOString(),
            companyId
          });
        }
      }
    }

    return findings;
  }

  public addException(findingId: string, action: ExceptionAction, reason: string, user: string): QualityException {
    const exceptionId = `EXC_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const exception: QualityException = {
      exceptionId,
      findingId,
      recordId: findingId.split('_')[2] || 'unknown',
      ruleId: findingId.split('_')[1] || 'unknown',
      action,
      reason,
      user,
      timestamp: now
    };

    // Find companyId from finding
    let targetCompany = 'CMP-001';
    for (const [key, findings] of this.findingsMap.entries()) {
      const found = findings.find((f) => f.findingId === findingId);
      if (found) {
        found.exception = exception;
        targetCompany = found.companyId;
        break;
      }
    }

    if (!this.exceptionsMap.has(targetCompany)) {
      this.exceptionsMap.set(targetCompany, []);
    }
    this.exceptionsMap.get(targetCompany)!.push(exception);

    return exception;
  }

  public getExceptions(companyId: string): QualityException[] {
    return this.exceptionsMap.get(companyId) || [];
  }

  public getFindings(companyId: string, datasetId?: string, severity?: QualitySeverity): QualityFinding[] {
    let findings: QualityFinding[] = [];
    for (const [k, v] of this.findingsMap.entries()) {
      if (k.startsWith(companyId)) {
        findings.push(...v);
      }
    }
    if (datasetId) findings = findings.filter((f) => f.datasetId === datasetId);
    if (severity) findings = findings.filter((f) => f.severity === severity);
    return findings;
  }

  public getTrend(companyId: string, datasetId?: string): QualityTrendPoint[] {
    let points = this.trendHistory.filter((t) => t.companyId === companyId);
    if (datasetId) points = points.filter((t) => t.datasetId === datasetId);
    return points;
  }

  private recordTrendPoint(companyId: string, datasetId: string, score: number, validPct: number, errors: number, warnings: number) {
    this.trendHistory.push({
      timestamp: new Date().toISOString(),
      companyId,
      datasetId,
      score,
      validPercentage: validPct,
      errorCount: errors,
      warningCount: warnings
    });
    if (this.trendHistory.length > 500) this.trendHistory.shift();
  }

  public verifyReadOnlyTallySafety(): { isReadOnly: boolean; protocol: string; message: string } {
    return {
      isReadOnly: true,
      protocol: 'LOCAL_DATA_QUALITY_EVALUATION',
      message: 'Quality validations, duplicate matches, and transformations are executed exclusively in the local normalized warehouse. Zero mutation or write requests are issued to Tally.'
    };
  }
}

export const dataQualityEngine = new DataQualityEngine();
