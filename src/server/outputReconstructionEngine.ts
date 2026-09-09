/**
 * Phase 32K - Output Reconstruction Engine
 * Reconstructs semantic meaning of Tally outputs, determines required datasets/fields/relationships,
 * discovers calculations/grains, and produces ReconstructionDefinition for Phase 32I Report Engine.
 */

import {
  OutputSemanticDefinition,
  ReconstructionDefinition,
  FieldSemanticClassification,
  DiscoveredCalculation,
  RelationshipSemantic,
  OutputParameter,
  ReportGrain,
  SemanticRole,
  ConfidenceLevel,
  OutputCategory,
  OutputPurpose,
  ReconstructionStatus,
  AiSuggestionAuditLog
} from '../types/phase32KReconstruction';
import { tallyOutputDiscoveryEngine } from './tallyOutputDiscoveryEngine';
import { auditEngine } from './auditEngine';

export interface IOutputReconstructionEngine {
  analyzeOutputSemantics(outputId: string, companyId?: string): Promise<OutputSemanticDefinition>;
  classifyFields(fields: { fieldName: string; dataType?: string; sampleValues?: any[] }[]): FieldSemanticClassification[];
  discoverGrain(outputName: string, fields: FieldSemanticClassification[]): { grain: ReportGrain; confidence: ConfidenceLevel; evidence: string[] };
  discoverCalculations(fields: FieldSemanticClassification[]): DiscoveredCalculation[];
  discoverRelationships(outputName: string, fields: FieldSemanticClassification[]): RelationshipSemantic[];
  discoverParameters(fields: FieldSemanticClassification[]): OutputParameter[];
  buildReconstructionDefinition(semantics: OutputSemanticDefinition): ReconstructionDefinition;
  semanticSearch(queryText: string): Promise<OutputSemanticDefinition[]>;
}

export class OutputReconstructionEngine implements IOutputReconstructionEngine {
  private semanticCache: Map<string, OutputSemanticDefinition> = new Map();
  private aiAuditLogs: AiSuggestionAuditLog[] = [];

  /**
   * Classifies field semantic role based on name, data type, and sample values.
   * Does NOT classify uncertain fields as confirmed without supporting evidence.
   */
  public classifyFields(fields: { fieldName: string; dataType?: string; sampleValues?: any[] }[]): FieldSemanticClassification[] {
    return fields.map((f) => {
      const lower = f.fieldName.toLowerCase();
      let role: SemanticRole = 'Other';
      let confidence: ConfidenceLevel = 'Unknown';
      const evidence: string[] = [];

      // 1. Pattern Matching on Field Name & Display Name
      if (lower.includes('voucher') && (lower.includes('num') || lower.includes('no') || lower.includes('id'))) {
        role = 'Voucher';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Voucher Identifier pattern`);
      } else if (lower.includes('date') || lower.includes('dt') || lower.includes('period')) {
        role = 'Date';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Date pattern`);
      } else if (lower.includes('debit') || lower.endsWith('_dr') || lower === 'dr') {
        role = 'Debit';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Debit accounting pattern`);
      } else if (lower.includes('credit') || lower.endsWith('_cr') || lower === 'cr') {
        role = 'Credit';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Credit accounting pattern`);
      } else if (lower.includes('amount') || lower.includes('total') || lower.includes('sum') || lower.includes('val')) {
        role = 'Amount';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Numeric Amount pattern`);
      } else if (lower.includes('balance') || lower.includes('bal')) {
        role = 'Balance';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Ledger Balance pattern`);
      } else if (lower.includes('quantity') || lower.includes('qty') || lower.includes('units')) {
        role = 'Quantity';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Quantity pattern`);
      } else if (lower.includes('rate') || lower.includes('price')) {
        role = 'Rate';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Unit Rate pattern`);
      } else if (lower.includes('party') || lower.includes('customer') || lower.includes('vendor') || lower.includes('supplier')) {
        role = 'Party';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Party/Customer pattern`);
      } else if (lower.includes('ledger') || lower.includes('account')) {
        role = 'Ledger';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Ledger Account pattern`);
      } else if (lower.includes('stock') || lower.includes('item') || lower.includes('sku')) {
        role = 'Stock';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Inventory Item pattern`);
      } else if (lower.includes('tax') || lower.includes('gst') || lower.includes('vat') || lower.includes('tds')) {
        role = 'Tax';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Statutory Tax pattern`);
      } else if (lower.includes('godown') || lower.includes('warehouse') || lower.includes('location')) {
        role = 'Godown';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Location/Godown pattern`);
      } else if (lower.includes('employee') || lower.includes('emp') || lower.includes('staff')) {
        role = 'Employee';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Payroll Employee pattern`);
      } else if (lower.includes('bank') || lower.includes('cheque') || lower.includes('ifsc')) {
        role = 'Bank';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Banking pattern`);
      } else if (lower.includes('narration') || lower.includes('remark') || lower.includes('memo')) {
        role = 'Narration';
        confidence = 'Confirmed';
        evidence.push(`Field name '${f.fieldName}' matches Narration/Remark pattern`);
      } else if (lower.includes('id') || lower.includes('code') || lower.includes('key')) {
        role = 'Identifier';
        confidence = 'Probable';
        evidence.push(`Field name '${f.fieldName}' matches Key/ID pattern`);
      } else if (lower.includes('name') || lower.includes('title')) {
        role = 'Name';
        confidence = 'Probable';
        evidence.push(`Field name '${f.fieldName}' matches Display Name pattern`);
      } else {
        role = 'Other';
        confidence = 'Unknown';
        evidence.push(`Field '${f.fieldName}' has insufficient evidence for confirmed role classification`);
      }

      // 2. Data Type Analysis & Validation
      if (f.dataType) {
        if ((f.dataType === 'number' || f.dataType === 'decimal') && (role === 'Name' || role === 'Date')) {
          role = 'Amount';
          confidence = 'Probable';
          evidence.push(`Data type '${f.dataType}' adjusted classification to Amount`);
        }
        if (f.dataType === 'date' && role !== 'Date') {
          role = 'Date';
          confidence = 'Confirmed';
          evidence.push(`Data type 'date' confirmed Date role`);
        }
      }

      // 3. Canonical Mapping Inference
      let canonicalFieldMapping: string | undefined = undefined;
      if (role === 'Debit') canonicalFieldMapping = 'canonical_debit_amount';
      else if (role === 'Credit') canonicalFieldMapping = 'canonical_credit_amount';
      else if (role === 'Amount') canonicalFieldMapping = 'canonical_net_amount';
      else if (role === 'Date') canonicalFieldMapping = 'canonical_transaction_date';
      else if (role === 'Party') canonicalFieldMapping = 'canonical_party_name';
      else if (role === 'Ledger') canonicalFieldMapping = 'canonical_ledger_name';
      else if (role === 'Voucher') canonicalFieldMapping = 'canonical_voucher_number';
      else if (role === 'Stock') canonicalFieldMapping = 'canonical_stock_item_name';

      return {
        fieldName: f.fieldName,
        displayName: f.fieldName.replace(/([A-Z])/g, ' $1').trim(),
        semanticRole: role,
        confidence,
        evidence,
        canonicalFieldMapping,
        dataType: f.dataType || 'string',
        sampleValue: f.sampleValues?.[0]
      };
    });
  }

  /**
   * Infers report record grain based on unique identifiers, dataset structure, and relationships.
   */
  public discoverGrain(outputName: string, fields: FieldSemanticClassification[]): { grain: ReportGrain; confidence: ConfidenceLevel; evidence: string[] } {
    const roles = fields.map((f) => f.semanticRole);
    const lowerName = outputName.toLowerCase();
    const evidence: string[] = [];

    if (roles.includes('Voucher') && roles.includes('Stock')) {
      evidence.push('Output contains both Voucher ID and Stock Item -> Grain is Inventory Movement / Voucher Line');
      return { grain: 'Inventory Movement', confidence: 'Confirmed', evidence };
    }

    if (roles.includes('Voucher')) {
      if (roles.includes('Ledger') || roles.includes('Amount')) {
        evidence.push('Output contains Voucher ID with Ledger/Amount lines -> Grain is Voucher');
        return { grain: 'Voucher', confidence: 'Confirmed', evidence };
      }
    }

    if (roles.includes('Stock') && (roles.includes('Quantity') || roles.includes('Rate'))) {
      evidence.push('Output contains Stock Item with Quantity/Rate -> Grain is Stock Item');
      return { grain: 'Stock Item', confidence: 'Confirmed', evidence };
    }

    if (roles.includes('Ledger') && (roles.includes('Balance') || roles.includes('Debit') || roles.includes('Credit'))) {
      evidence.push('Output contains Ledger with Balance/Movement -> Grain is Ledger');
      return { grain: 'Ledger', confidence: 'Confirmed', evidence };
    }

    if (roles.includes('Party')) {
      evidence.push('Output contains Party details -> Grain is Party');
      return { grain: 'Party', confidence: 'Confirmed', evidence };
    }

    if (roles.includes('Employee')) {
      evidence.push('Output contains Employee details -> Grain is Employee');
      return { grain: 'Employee', confidence: 'Confirmed', evidence };
    }

    if (lowerName.includes('trial balance') || lowerName.includes('group')) {
      evidence.push('Output name matches Group/Trial Balance summary -> Grain is Group');
      return { grain: 'Group', confidence: 'Probable', evidence };
    }

    evidence.push('Default fallback grain based on company master context');
    return { grain: 'Company', confidence: 'Probable', evidence };
  }

  /**
   * Discovers mathematical calculations from field semantic roles using controlled expressions.
   */
  public discoverCalculations(fields: FieldSemanticClassification[]): DiscoveredCalculation[] {
    const calculations: DiscoveredCalculation[] = [];
    const roleMap = new Map<SemanticRole, string>();

    for (const f of fields) {
      roleMap.set(f.semanticRole, f.fieldName);
    }

    // 1. Debit - Credit Calculation
    if (roleMap.has('Debit') && roleMap.has('Credit')) {
      const dr = roleMap.get('Debit')!;
      const cr = roleMap.get('Credit')!;
      calculations.push({
        calculationId: 'CALC-NET-DRCR',
        name: 'Net Debit/Credit Movement',
        expression: `${dr} - ${cr}`,
        inputFields: [dr, cr],
        outputField: roleMap.get('Amount') || 'netAmount',
        confidence: 'Confirmed',
        evidence: [`Discovered Debit field '${dr}' and Credit field '${cr}'`]
      });
    }

    // 2. Quantity x Rate = Amount
    if (roleMap.has('Quantity') && roleMap.has('Rate')) {
      const qty = roleMap.get('Quantity')!;
      const rate = roleMap.get('Rate')!;
      calculations.push({
        calculationId: 'CALC-QTY-RATE',
        name: 'Line Amount',
        expression: `${qty} * ${rate}`,
        inputFields: [qty, rate],
        outputField: roleMap.get('Amount') || 'amount',
        confidence: 'Confirmed',
        evidence: [`Discovered Quantity field '${qty}' and Rate field '${rate}'`]
      });
    }

    // 3. Tax + Taxable Amount = Total Amount
    if (roleMap.has('Tax') && roleMap.has('Amount')) {
      const tax = roleMap.get('Tax')!;
      const amt = roleMap.get('Amount')!;
      calculations.push({
        calculationId: 'CALC-TOTAL-TAX',
        name: 'Total Including Tax',
        expression: `${amt} + ${tax}`,
        inputFields: [amt, tax],
        outputField: 'totalIncludingTax',
        confidence: 'Probable',
        evidence: [`Discovered Tax field '${tax}' and Amount field '${amt}'`]
      });
    }

    return calculations;
  }

  /**
   * Discovers relationship semantics across Tally objects using Phase 31 Object Graph principles.
   */
  public discoverRelationships(outputName: string, fields: FieldSemanticClassification[]): RelationshipSemantic[] {
    const relationships: RelationshipSemantic[] = [];
    const roles = fields.map((f) => f.semanticRole);

    if (roles.includes('Voucher') && roles.includes('Ledger')) {
      relationships.push({
        relationshipId: 'REL-VCH-LEDGER',
        sourceObject: 'Voucher',
        targetObject: 'Ledger',
        type: 'Reference',
        confidence: 'Confirmed',
        evidence: ['Voucher references Ledger master']
      });
    }

    if (roles.includes('Voucher') && roles.includes('Party')) {
      relationships.push({
        relationshipId: 'REL-VCH-PARTY',
        sourceObject: 'Voucher',
        targetObject: 'Party',
        type: 'Reference',
        confidence: 'Confirmed',
        evidence: ['Voucher references Party/Customer master']
      });
    }

    if (roles.includes('Stock') && roles.includes('Godown')) {
      relationships.push({
        relationshipId: 'REL-STOCK-GODOWN',
        sourceObject: 'StockItem',
        targetObject: 'Godown',
        type: 'Lookup',
        confidence: 'Confirmed',
        evidence: ['Stock Item mapped to Godown location']
      });
    }

    if (roles.includes('Ledger') && roles.includes('Group')) {
      relationships.push({
        relationshipId: 'REL-LEDGER-GROUP',
        sourceObject: 'Ledger',
        targetObject: 'Group',
        type: 'Parent',
        confidence: 'Confirmed',
        evidence: ['Ledger belongs to Parent Group hierarchy']
      });
    }

    return relationships;
  }

  /**
   * Infers filterable parameters for reports (e.g., Date Range, Ledger, Party).
   */
  public discoverParameters(fields: FieldSemanticClassification[]): OutputParameter[] {
    const parameters: OutputParameter[] = [];

    for (const f of fields) {
      if (f.semanticRole === 'Date') {
        parameters.push({
          parameterId: 'PARAM-DATE-RANGE',
          name: 'Date Range',
          targetField: f.fieldName,
          dataType: 'date-range',
          isRequired: true,
          supported: true
        });
      } else if (f.semanticRole === 'Ledger') {
        parameters.push({
          parameterId: 'PARAM-LEDGER-FILTER',
          name: 'Ledger Filter',
          targetField: f.fieldName,
          dataType: 'string',
          isRequired: false,
          supported: true
        });
      } else if (f.semanticRole === 'Party') {
        parameters.push({
          parameterId: 'PARAM-PARTY-FILTER',
          name: 'Party Filter',
          targetField: f.fieldName,
          dataType: 'string',
          isRequired: false,
          supported: true
        });
      } else if (f.semanticRole === 'Stock') {
        parameters.push({
          parameterId: 'PARAM-STOCK-FILTER',
          name: 'Stock Item Filter',
          targetField: f.fieldName,
          dataType: 'string',
          isRequired: false,
          supported: true
        });
      }
    }

    return parameters;
  }

  /**
   * Analyzes a discovered Tally output and constructs its OutputSemanticDefinition.
   */
  public async analyzeOutputSemantics(outputId: string, companyId = 'CMP-001'): Promise<OutputSemanticDefinition> {
    if (this.semanticCache.has(outputId)) {
      return this.semanticCache.get(outputId)!;
    }

    // Retrieve output metadata from Phase 32I Output Discovery Engine
    const catalog = await tallyOutputDiscoveryEngine.discoverOutputs(companyId);
    const matched = catalog.find((o) => o.outputId === outputId || o.name.toLowerCase().includes(outputId.toLowerCase()));

    const outputName = matched?.name || outputId;
    const sampleFields = matched
      ? matched.fields.map((f) => ({ fieldName: f.fieldName, dataType: f.dataType }))
      : [
          { fieldName: 'voucherNumber', dataType: 'string' },
          { fieldName: 'date', dataType: 'date' },
          { fieldName: 'partyName', dataType: 'string' },
          { fieldName: 'ledgerName', dataType: 'string' },
          { fieldName: 'debitAmount', dataType: 'number' },
          { fieldName: 'creditAmount', dataType: 'number' },
          { fieldName: 'netAmount', dataType: 'number' }
        ];

    const classifiedFields = this.classifyFields(sampleFields);
    const { grain, confidence: grainConf, evidence: grainEv } = this.discoverGrain(outputName, classifiedFields);
    const calculations = this.discoverCalculations(classifiedFields);
    const relationships = this.discoverRelationships(outputName, classifiedFields);
    const parameters = this.discoverParameters(classifiedFields);

    // Infer Category & Purpose
    let category: OutputCategory = 'Accounting';
    let purpose: OutputPurpose = 'Register';

    const lowerName = outputName.toLowerCase();
    if (lowerName.includes('stock') || lowerName.includes('inventory')) {
      category = 'Inventory';
      purpose = 'Summary';
    } else if (lowerName.includes('tax') || lowerName.includes('gst')) {
      category = 'Tax';
      purpose = 'Summary';
    } else if (lowerName.includes('bank')) {
      category = 'Banking';
      purpose = 'Statement';
    } else if (lowerName.includes('payroll') || lowerName.includes('employee')) {
      category = 'Payroll';
      purpose = 'Statement';
    } else if (lowerName.includes('ledger') || lowerName.includes('statement')) {
      category = 'Accounting';
      purpose = 'Statement';
    } else if (lowerName.includes('trial balance')) {
      category = 'Accounting';
      purpose = 'Summary';
    }

    // Determine Required Datasets
    const requiredDatasets = [
      { datasetId: 'canonical-vouchers', status: 'Required' as const },
      { datasetId: 'canonical-ledgers', status: 'Required' as const }
    ];

    const confidenceScore = Math.round(
      (classifiedFields.filter((f) => f.confidence !== 'Unknown').length / classifiedFields.length) * 100
    );

    const semantics: OutputSemanticDefinition = {
      outputId,
      outputName,
      category,
      categoryConfidence: 'Confirmed',
      purpose,
      grain,
      grainConfidence: grainConf,
      requiredDatasets,
      requiredFields: classifiedFields,
      relationships,
      calculations,
      filters: ['dateRange', 'companyId'],
      parameters,
      grouping: [grain.toLowerCase()],
      sorting: ['date', 'voucherNumber'],
      formatting: { currencyFormat: 'INR', dateFormat: 'YYYY-MM-DD' },
      confidence: confidenceScore,
      evidence: [
        `Discovered ${classifiedFields.length} fields with ${confidenceScore}% semantic confidence`,
        ...grainEv
      ]
    };

    this.semanticCache.set(outputId, semantics);
    return semantics;
  }

  /**
   * Constructs a ReconstructionDefinition for Phase 32I Report Engine.
   * Marks status PARTIAL if required components are missing.
   */
  public buildReconstructionDefinition(semantics: OutputSemanticDefinition): ReconstructionDefinition {
    const missingComponents: string[] = [];

    // Missing Data Detection
    for (const ds of semantics.requiredDatasets) {
      if (ds.status === 'Unavailable') {
        missingComponents.push(`Required dataset '${ds.datasetId}' is unavailable in warehouse.`);
      }
    }

    const unconfirmedFields = semantics.requiredFields.filter((f) => f.confidence === 'Unknown');
    if (unconfirmedFields.length > 0) {
      missingComponents.push(`${unconfirmedFields.length} fields have unconfirmed semantic classifications.`);
    }

    let status: ReconstructionStatus = 'CONFIRMED';
    if (missingComponents.length > 0) {
      status = 'PARTIAL';
    } else if (semantics.confidence >= 80) {
      status = 'HIGH_CONFIDENCE';
    } else if (semantics.confidence >= 50) {
      status = 'LOW_CONFIDENCE';
    } else {
      status = 'NOT_RECONSTRUCTABLE';
    }

    const now = new Date().toISOString();

    return {
      outputId: semantics.outputId,
      version: 1,
      grain: semantics.grain,
      datasets: semantics.requiredDatasets.map((d) => d.datasetId),
      fields: semantics.requiredFields,
      relationships: semantics.relationships,
      calculations: semantics.calculations,
      filters: semantics.filters,
      parameters: semantics.parameters,
      confidence: semantics.confidence,
      evidence: semantics.evidence,
      status,
      missingComponents,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Semantic Search over outputs using natural language concepts.
   */
  public async semanticSearch(queryText: string): Promise<OutputSemanticDefinition[]> {
    const clean = queryText.toLowerCase().trim();
    const results: OutputSemanticDefinition[] = [];

    const defaultOutputIds = [
      'OUT-VCH-REG',
      'OUT-TB-SUM',
      'OUT-DAY-BOOK',
      'OUT-LEDGER-STMT',
      'OUT-STOCK-SUM',
      'OUT-TAX-SUM',
      'OUT-BANK-STMT',
      'OUT-PAYROLL-SUM'
    ];

    for (const id of defaultOutputIds) {
      const semantics = await this.analyzeOutputSemantics(id);
      const matchScore =
        (semantics.outputName.toLowerCase().includes(clean) ? 3 : 0) +
        (semantics.category.toLowerCase().includes(clean) ? 2 : 0) +
        (semantics.purpose.toLowerCase().includes(clean) ? 2 : 0) +
        (semantics.grain.toLowerCase().includes(clean) ? 2 : 0);

      if (matchScore > 0 || clean === '' || clean === 'all') {
        results.push(semantics);
      }
    }

    return results;
  }

  public recordAiSuggestion(log: AiSuggestionAuditLog): void {
    this.aiAuditLogs.unshift(log);
  }

  public getAiAuditLogs(): AiSuggestionAuditLog[] {
    return this.aiAuditLogs;
  }
}

export const outputReconstructionEngine = new OutputReconstructionEngine();
