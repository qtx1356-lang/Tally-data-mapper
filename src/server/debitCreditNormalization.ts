/**
 * EXFIN Tally Audit Platform - Centralized Debit / Credit Normalization Engine
 * 
 * Strict accounting direction normalization with ZERO JavaScript truthiness hazards.
 * 
 * CRITICAL ACCOUNTING INVARIANT:
 * In JavaScript, Boolean("false") === true.
 * Therefore, any naive usage of `Boolean(value)` on string data (e.g. from JSON payloads or XML attributes)
 * causes catastrophic accounting direction reversal where "isDebit": "false" becomes Debit.
 * 
 * This module enforces strict, deterministic, non-fabricating normalization across:
 * - Tally XML (<ALLLEDGERENTRIES.LIST>, <LEDGERENTRIES.LIST>, <ISDEEMEDPOSITIVE>, <AMOUNT>)
 * - Tally JSON (arrays, object-wrapped, isDebit, isCredit, ISDEEMEDPOSITIVE, type, Dr/Cr)
 * - Tally Excel (separate Debit/Credit columns, amount with Dr/Cr text, transaction type)
 */

export type AccountingDirection = 'Debit' | 'Credit' | 'UNKNOWN';

export interface DebitCreditNormalizationInput {
  // Explicit boolean or string flags
  isDebit?: any;
  IsDebit?: any;
  ISDEBIT?: any;
  is_debit?: any;

  isCredit?: any;
  IsCredit?: any;
  ISCREDIT?: any;
  is_credit?: any;

  isDeemedPositive?: any;
  IsDeemedPositive?: any;
  ISDEEMEDPOSITIVE?: any;
  is_deemed_positive?: any;

  // Type or dr/cr text indicator (e.g. "Dr", "Cr", "Debit", "Credit", "D", "C")
  type?: any;
  Type?: any;
  TYPE?: any;
  drCr?: any;
  DrCr?: any;
  DR_CR?: any;
  dr_cr?: any;

  // Explicit debit/credit numeric or string amounts (e.g. from separate columns or fields)
  debitAmount?: any;
  DebitAmount?: any;
  debit?: any;
  Debit?: any;
  DEBIT?: any;

  creditAmount?: any;
  CreditAmount?: any;
  credit?: any;
  Credit?: any;
  CREDIT?: any;

  // General raw amount (could be number or string e.g. "15000", "-15000", "15000 Dr")
  rawAmount?: any;
  RawAmount?: any;
  RAWAMOUNT?: any;
  amount?: any;
  Amount?: any;
  AMOUNT?: any;
  sourceAmount?: any;
  SourceAmount?: any;

  // Optional contextual file format hint ('XML' | 'JSON' | 'EXCEL')
  fileFormatHint?: 'XML' | 'JSON' | 'EXCEL';
}

export interface DebitCreditNormalizationResult {
  direction: AccountingDirection;
  isDebit: boolean | null; // true for Debit, false for Credit, null for UNKNOWN
  isDeemedPositive: boolean | null;
  sourceAmount: any;
  normalizedAmount: number | null; // Absolute numeric magnitude
  ruleApplied: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  reviewRequired: boolean;
  reviewReason?: string;
}

/**
 * EXACT TALLY NORMALIZATION RULE FOR `ISDEEMEDPOSITIVE`:
 * 
 * In TallyPrime / Tally.ERP 9 XML and JSON data structures:
 * `<ISDEEMEDPOSITIVE>` is a boolean flag indicating whether the ledger line entry
 * represents an increase in the natural balance of that ledger.
 * In Tally's internal double-entry accounting model:
 * - "Yes", "true", or 1:
 *   Indicates a DEBIT entry (asset/expense increase or liability/income decrease).
 *   In Tally XML, debit lines typically pair `ISDEEMEDPOSITIVE = Yes` with a negative `<AMOUNT>`.
 * - "No", "false", or 0:
 *   Indicates a CREDIT entry (asset/expense decrease or liability/income increase).
 *   In Tally XML, credit lines typically pair `ISDEEMEDPOSITIVE = No` with a positive `<AMOUNT>`.
 * 
 * Rule Mapping:
 * - ISDEEMEDPOSITIVE in ['yes', 'true', '1', 'y', 't'] => Direction: 'Debit', isDebit: true, isDeemedPositive: true
 * - ISDEEMEDPOSITIVE in ['no', 'false', '0', 'n', 'f'] => Direction: 'Credit', isDebit: false, isDeemedPositive: false
 * - Any other / missing value => Not resolved via ISDEEMEDPOSITIVE; falls through to other explicit rules or UNKNOWN.
 * 
 * PRODUCTION CERTIFICATION NOTICE:
 * The exact ISDEEMEDPOSITIVE semantics must be validated against real TallyPrime exported data
 * before being treated as production-certified across bespoke third-party exporter variants.
 */

/**
 * Parses an explicit boolean or boolean-like string without using JavaScript truthiness.
 * NEVER calls `Boolean(val)`.
 * 
 * Examples:
 * - true, "true", "TRUE", "yes", "YES", 1, "1" => true
 * - false, "false", "FALSE", "no", "NO", 0, "0" => false
 * - undefined, null, "", "invalid" => null
 */
export function parseExplicitBoolean(val: any): boolean | null {
  if (val === true || val === false) {
    return val;
  }
  if (typeof val === 'number') {
    if (val === 1) return true;
    if (val === 0) return false;
    return null;
  }
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    if (clean === 'true' || clean === 'yes' || clean === 'y' || clean === '1' || clean === 't') {
      return true;
    }
    if (clean === 'false' || clean === 'no' || clean === 'n' || clean === '0' || clean === 'f') {
      return false;
    }
    return null;
  }
  return null;
}

/**
 * Extracts absolute numeric magnitude from a source amount without mutating or losing source representation.
 */
export function parseNumericMagnitude(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : Math.abs(val);
  }
  if (typeof val === 'string') {
    const cleaned = val
      .replace(/,/g, '')
      .replace(/[₹$€£]/g, '')
      .replace(/\b(dr|cr|debit|credit)\b/gi, '')
      .trim();
    if (cleaned === '') return null;
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : Math.abs(n);
  }
  return null;
}

/**
 * Parses raw signed number from input, preserving negative sign if present.
 */
export function parseRawSignedNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (typeof val === 'string') {
    const cleaned = val
      .replace(/,/g, '')
      .replace(/[₹$€£]/g, '')
      .replace(/\b(dr|cr|debit|credit)\b/gi, '')
      .trim();
    if (cleaned === '') return null;
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Centralized Debit/Credit Normalization Function
 * 
 * Rules in precedence order:
 * 1. Explicit `isDebit` flag (explicit boolean / string check - NEVER truthiness)
 * 2. Explicit `isCredit` flag (explicit boolean / string check)
 * 3. Tally `ISDEEMEDPOSITIVE` / `isDeemedPositive` (Yes/true=Debit, No/false=Credit)
 * 4. Explicit separate DEBIT and CREDIT amount fields (e.g. DEBIT > 0 and CREDIT == 0)
 * 5. Type / DrCr indicator ("Dr", "Cr", "Debit", "Credit", "D", "C")
 * 6. Dr/Cr indicator text inside the raw amount string itself
 * 7. Tally XML negative amount convention (if format is XML and amount < 0)
 * 8. Missing / undetermined direction => UNKNOWN, isDebit = null, reviewRequired = true.
 */
export function normalizeDebitCredit(input: DebitCreditNormalizationInput): DebitCreditNormalizationResult {
  const isDebitInput = input.isDebit !== undefined ? input.isDebit : (input.IsDebit !== undefined ? input.IsDebit : (input.ISDEBIT !== undefined ? input.ISDEBIT : input.is_debit));
  const isCreditInput = input.isCredit !== undefined ? input.isCredit : (input.IsCredit !== undefined ? input.IsCredit : (input.ISCREDIT !== undefined ? input.ISCREDIT : input.is_credit));
  const deemedRaw = input.isDeemedPositive !== undefined ? input.isDeemedPositive : (input.IsDeemedPositive !== undefined ? input.IsDeemedPositive : (input.ISDEEMEDPOSITIVE !== undefined ? input.ISDEEMEDPOSITIVE : input.is_deemed_positive));
  const rawTypeInput = input.type !== undefined ? input.type : (input.Type !== undefined ? input.Type : (input.TYPE !== undefined ? input.TYPE : (input.drCr !== undefined ? input.drCr : (input.DrCr !== undefined ? input.DrCr : (input.DR_CR !== undefined ? input.DR_CR : input.dr_cr)))));
  const debitAmountInput = input.debitAmount !== undefined ? input.debitAmount : (input.DebitAmount !== undefined ? input.DebitAmount : (input.debit !== undefined ? input.debit : (input.Debit !== undefined ? input.Debit : input.DEBIT)));
  const creditAmountInput = input.creditAmount !== undefined ? input.creditAmount : (input.CreditAmount !== undefined ? input.CreditAmount : (input.credit !== undefined ? input.credit : (input.Credit !== undefined ? input.Credit : input.CREDIT)));
  const rawAmountInput = input.rawAmount !== undefined ? input.rawAmount : (input.RawAmount !== undefined ? input.RawAmount : (input.RAWAMOUNT !== undefined ? input.RAWAMOUNT : (input.amount !== undefined ? input.amount : (input.Amount !== undefined ? input.Amount : (input.AMOUNT !== undefined ? input.AMOUNT : (input.sourceAmount !== undefined ? input.sourceAmount : input.SourceAmount))))));

  // Step 1: Preserve original source amount exactly as provided
  let sourceAmount: any = null;
  if (rawAmountInput !== undefined) {
    sourceAmount = rawAmountInput;
  } else if (debitAmountInput !== undefined && debitAmountInput !== null && debitAmountInput !== '') {
    sourceAmount = debitAmountInput;
  } else if (creditAmountInput !== undefined && creditAmountInput !== null && creditAmountInput !== '') {
    sourceAmount = creditAmountInput;
  }

  // Step 2: Compute normalized numeric magnitude (absolute value)
  let normalizedAmount: number | null = parseNumericMagnitude(sourceAmount);
  const drNum = parseNumericMagnitude(debitAmountInput);
  const crNum = parseNumericMagnitude(creditAmountInput);
  if (normalizedAmount === null) {
    if (drNum !== null && drNum > 0) normalizedAmount = drNum;
    else if (crNum !== null && crNum > 0) normalizedAmount = crNum;
  }

  // Rule 1: Explicit isDebit flag
  if (isDebitInput !== undefined && isDebitInput !== null && isDebitInput !== '') {
    const boolVal = parseExplicitBoolean(isDebitInput);
    if (boolVal === true) {
      return {
        direction: 'Debit',
        isDebit: true,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Explicit isDebit source field resolved to true (Debit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Debit direction but missing or invalid amount' : undefined
      };
    } else if (boolVal === false) {
      return {
        direction: 'Credit',
        isDebit: false,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Explicit isDebit source field resolved to false (Credit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Credit direction but missing or invalid amount' : undefined
      };
    }
  }

  // Rule 2: Explicit isCredit flag
  if (isCreditInput !== undefined && isCreditInput !== null && isCreditInput !== '') {
    const boolVal = parseExplicitBoolean(isCreditInput);
    if (boolVal === true) {
      return {
        direction: 'Credit',
        isDebit: false,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Explicit isCredit source field resolved to true (Credit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Credit direction but missing or invalid amount' : undefined
      };
    } else if (boolVal === false) {
      return {
        direction: 'Debit',
        isDebit: true,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Explicit isCredit source field resolved to false (Debit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Debit direction but missing or invalid amount' : undefined
      };
    }
  }

  // Rule 3: Tally ISDEEMEDPOSITIVE / isDeemedPositive
  if (deemedRaw !== undefined && deemedRaw !== null && deemedRaw !== '') {
    const boolVal = parseExplicitBoolean(deemedRaw);
    if (boolVal === true) {
      return {
        direction: 'Debit',
        isDebit: true,
        isDeemedPositive: true,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Tally ISDEEMEDPOSITIVE convention: Yes/true represents natural positive entry (Debit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid ISDEEMEDPOSITIVE Debit but missing amount' : undefined
      };
    } else if (boolVal === false) {
      return {
        direction: 'Credit',
        isDebit: false,
        isDeemedPositive: false,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Tally ISDEEMEDPOSITIVE convention: No/false represents natural negative entry (Credit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid ISDEEMEDPOSITIVE Credit but missing amount' : undefined
      };
    }
  }

  // Rule 4: Explicit DEBIT / CREDIT amounts (separate columns/fields)
  if (drNum !== null && drNum > 0 && (crNum === null || crNum === 0)) {
    return {
      direction: 'Debit',
      isDebit: true,
      isDeemedPositive: null,
      sourceAmount: sourceAmount !== null ? sourceAmount : { debit: debitAmountInput, credit: creditAmountInput },
      normalizedAmount: drNum,
      ruleApplied: 'Explicit DEBIT column amount > 0 while CREDIT is 0/absent (Debit)',
      confidence: 'HIGH',
      reviewRequired: false
    };
  }

  if (crNum !== null && crNum > 0 && (drNum === null || drNum === 0)) {
    return {
      direction: 'Credit',
      isDebit: false,
      isDeemedPositive: null,
      sourceAmount: sourceAmount !== null ? sourceAmount : { debit: debitAmountInput, credit: creditAmountInput },
      normalizedAmount: crNum,
      ruleApplied: 'Explicit CREDIT column amount > 0 while DEBIT is 0/absent (Credit)',
      confidence: 'HIGH',
      reviewRequired: false
    };
  }

  if (drNum !== null && drNum > 0 && crNum !== null && crNum > 0) {
    return {
      direction: 'UNKNOWN',
      isDebit: null,
      isDeemedPositive: null,
      sourceAmount: sourceAmount !== null ? sourceAmount : { debit: debitAmountInput, credit: creditAmountInput },
      normalizedAmount: drNum,
      ruleApplied: 'Ambiguous: line contains positive values in both DEBIT and CREDIT columns',
      confidence: 'UNKNOWN',
      reviewRequired: true,
      reviewReason: 'Ambiguous direction: source line contains positive amounts in both Debit and Credit fields'
    };
  }

  // Rule 5: Type / DrCr indicator string
  const rawType = rawTypeInput;
  if (rawType !== undefined && rawType !== null && rawType !== '') {
    const t = String(rawType).trim().toUpperCase();
    if (t === 'DR' || t === 'DEBIT' || t === 'D') {
      return {
        direction: 'Debit',
        isDebit: true,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: `Explicit type indicator "${t}" mapped to Debit`,
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Debit indicator but missing or invalid amount' : undefined
      };
    }
    if (t === 'CR' || t === 'CREDIT' || t === 'C') {
      return {
        direction: 'Credit',
        isDebit: false,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: `Explicit type indicator "${t}" mapped to Credit`,
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Credit indicator but missing or invalid amount' : undefined
      };
    }
  }

  // Rule 6: Dr / Cr text inside the raw amount string itself
  if (typeof input.rawAmount === 'string') {
    const amtStr = input.rawAmount.trim();
    if (/\b(dr|debit)\b/i.test(amtStr)) {
      return {
        direction: 'Debit',
        isDebit: true,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Amount string contains Dr/Debit indicator (Debit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Debit indicator but missing or invalid amount' : undefined
      };
    }
    if (/\b(cr|credit)\b/i.test(amtStr)) {
      return {
        direction: 'Credit',
        isDebit: false,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Amount string contains Cr/Credit indicator (Credit)',
        confidence: 'HIGH',
        reviewRequired: normalizedAmount === null,
        reviewReason: normalizedAmount === null ? 'Valid Credit indicator but missing or invalid amount' : undefined
      };
    }
  }

  // Rule 7: Tally XML raw negative amount convention
  if (input.fileFormatHint === 'XML') {
    const signedNum = parseRawSignedNumber(input.rawAmount);
    if (signedNum !== null && signedNum < 0) {
      return {
        direction: 'Debit',
        isDebit: true,
        isDeemedPositive: null,
        sourceAmount,
        normalizedAmount,
        ruleApplied: 'Tally XML raw negative amount convention (Debit)',
        confidence: 'MEDIUM',
        reviewRequired: false
      };
    }
  }

  // Rule 8: Missing / undetermined direction (never guess!)
  return {
    direction: 'UNKNOWN',
    isDebit: null,
    isDeemedPositive: null,
    sourceAmount,
    normalizedAmount,
    ruleApplied: 'No recognized debit/credit direction indicator found in source entry',
    confidence: 'UNKNOWN',
    reviewRequired: true,
    reviewReason: 'Undetermined debit/credit direction in source entry (review required)'
  };
}
