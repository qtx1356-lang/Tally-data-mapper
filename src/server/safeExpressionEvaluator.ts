/**
 * Phase 32G - Safe Expression Evaluator & AST Engine
 * Zero-eval, AST-based arithmetic and logical expression parser.
 * Protects against code injection, prototype pollution, SQL injection and runaway execution.
 */

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export type ASTNode =
  | { type: 'Literal'; value: number | string | boolean | null }
  | { type: 'Identifier'; name: string }
  | { type: 'UnaryOp'; operator: string; argument: ASTNode }
  | { type: 'BinaryOp'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

// Forbidden keywords and identifiers
const FORBIDDEN_IDENTIFIERS = new Set([
  'eval',
  'function',
  'class',
  'prototype',
  '__proto__',
  'constructor',
  'window',
  'global',
  'process',
  'require',
  'import',
  'document',
  'xmlhttprequest',
  'fetch',
  'settimeout',
  'setinterval',
  'exec',
  'spawn',
  'select',
  'insert',
  'update',
  'delete',
  'drop',
  'union',
  'script'
]);

// Allowed safe built-in functions
const ALLOWED_FUNCTIONS = new Set([
  'abs',
  'round',
  'ceil',
  'floor',
  'min',
  'max',
  'coalesce',
  'concat',
  'upper',
  'lower'
]);

export class SafeExpressionEvaluator {
  private static MAX_TOKENS = 500;
  private static MAX_DEPTH = 30;

  /**
   * Tokenize an expression string safely without regular expression catastrophic backtracking
   */
  public static tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      if (tokens.length > this.MAX_TOKENS) {
        throw new Error('Expression too complex: exceeds token limit (500).');
      }

      const ch = expr[i];

      // Skip whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Check parentheses
      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: i });
        i++;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: i });
        i++;
        continue;
      }
      if (ch === ',') {
        tokens.push({ type: 'COMMA', value: ',', position: i });
        i++;
        continue;
      }

      // Numbers (integers or decimals)
      if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
        let numStr = '';
        const start = i;
        while (i < len && (/[\d.]/.test(expr[i]))) {
          numStr += expr[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr, position: start });
        continue;
      }

      // String literals: 'text' or "text"
      if (ch === "'" || ch === '"') {
        const quote = ch;
        let strVal = '';
        const start = i;
        i++; // skip opening quote
        while (i < len && expr[i] !== quote) {
          if (expr[i] === '\\' && i + 1 < len) {
            i++;
            strVal += expr[i];
          } else {
            strVal += expr[i];
          }
          i++;
        }
        if (i >= len) {
          throw new Error(`Unterminated string literal starting at position ${start}`);
        }
        i++; // skip closing quote
        tokens.push({ type: 'STRING', value: strVal, position: start });
        continue;
      }

      // Bracketed field identifiers: [Field Name]
      if (ch === '[') {
        let fieldName = '';
        const start = i;
        i++; // skip '['
        while (i < len && expr[i] !== ']') {
          fieldName += expr[i];
          i++;
        }
        if (i >= len) {
          throw new Error(`Unterminated bracketed identifier starting at position ${start}`);
        }
        i++; // skip ']'
        tokens.push({ type: 'IDENTIFIER', value: fieldName.trim(), position: start });
        continue;
      }

      // Operators: +, -, *, /, %, ==, !=, >=, <=, >, <
      if (['+', '-', '*', '/', '%'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch, position: i });
        i++;
        continue;
      }
      if (ch === '=' || ch === '!' || ch === '>' || ch === '<') {
        let op = ch;
        const start = i;
        if (i + 1 < len && expr[i + 1] === '=') {
          op += '=';
          i++;
        }
        tokens.push({ type: 'OPERATOR', value: op, position: start });
        i++;
        continue;
      }

      // Identifiers / function names
      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        const start = i;
        while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) {
          ident += expr[i];
          i++;
        }
        const lower = ident.toLowerCase();
        if (FORBIDDEN_IDENTIFIERS.has(lower)) {
          throw new Error(`Security Violation: Forbidden identifier '${ident}' in expression.`);
        }
        tokens.push({ type: 'IDENTIFIER', value: ident, position: start });
        continue;
      }

      throw new Error(`Invalid character '${ch}' in expression at position ${i}`);
    }

    tokens.push({ type: 'EOF', value: '', position: len });
    return tokens;
  }

  /**
   * Recursive descent parser to construct a safe AST
   */
  public static parse(expr: string): ASTNode {
    const tokens = this.tokenize(expr);
    let current = 0;

    function peek(): Token {
      return tokens[current];
    }

    function consume(expectedType?: TokenType): Token {
      const tok = tokens[current];
      if (expectedType && tok.type !== expectedType) {
        throw new Error(`Expected token type ${expectedType}, found ${tok.type} ('${tok.value}') at position ${tok.position}`);
      }
      current++;
      return tok;
    }

    function parseExpression(depth: number = 0): ASTNode {
      if (depth > SafeExpressionEvaluator.MAX_DEPTH) {
        throw new Error('Expression nesting depth exceeded safety limit.');
      }
      return parseComparison(depth);
    }

    function parseComparison(depth: number): ASTNode {
      let node = parseAdditive(depth + 1);

      while (peek().type === 'OPERATOR' && ['==', '!=', '>', '<', '>=', '<='].includes(peek().value)) {
        const op = consume().value;
        const right = parseAdditive(depth + 1);
        node = { type: 'BinaryOp', operator: op, left: node, right };
      }
      return node;
    }

    function parseAdditive(depth: number): ASTNode {
      let node = parseMultiplicative(depth + 1);

      while (peek().type === 'OPERATOR' && ['+', '-'].includes(peek().value)) {
        const op = consume().value;
        const right = parseMultiplicative(depth + 1);
        node = { type: 'BinaryOp', operator: op, left: node, right };
      }
      return node;
    }

    function parseMultiplicative(depth: number): ASTNode {
      let node = parseUnary(depth + 1);

      while (peek().type === 'OPERATOR' && ['*', '/', '%'].includes(peek().value)) {
        const op = consume().value;
        const right = parseUnary(depth + 1);
        node = { type: 'BinaryOp', operator: op, left: node, right };
      }
      return node;
    }

    function parseUnary(depth: number): ASTNode {
      if (peek().type === 'OPERATOR' && ['-', '+'].includes(peek().value)) {
        const op = consume().value;
        const arg = parseUnary(depth + 1);
        return { type: 'UnaryOp', operator: op, argument: arg };
      }
      return parsePrimary(depth + 1);
    }

    function parsePrimary(depth: number): ASTNode {
      const tok = peek();

      if (tok.type === 'NUMBER') {
        consume();
        return { type: 'Literal', value: parseFloat(tok.value) };
      }

      if (tok.type === 'STRING') {
        consume();
        return { type: 'Literal', value: tok.value };
      }

      if (tok.type === 'IDENTIFIER') {
        consume();
        // Check if it is a function call
        if (peek().type === 'LPAREN') {
          const fnName = tok.value.toLowerCase();
          if (!ALLOWED_FUNCTIONS.has(fnName)) {
            throw new Error(`Function '${tok.value}' is not allowed in safe expressions.`);
          }
          consume('LPAREN');
          const args: ASTNode[] = [];
          if (peek().type !== 'RPAREN') {
            args.push(parseExpression(depth + 1));
            while (peek().type === 'COMMA') {
              consume('COMMA');
              args.push(parseExpression(depth + 1));
            }
          }
          consume('RPAREN');
          return { type: 'FunctionCall', name: fnName, args };
        }

        // Standard field identifier
        return { type: 'Identifier', name: tok.value };
      }

      if (tok.type === 'LPAREN') {
        consume('LPAREN');
        const exprNode = parseExpression(depth + 1);
        consume('RPAREN');
        return exprNode;
      }

      throw new Error(`Unexpected token '${tok.value}' at position ${tok.position}`);
    }

    const ast = parseExpression(0);
    if (peek().type !== 'EOF') {
      throw new Error(`Unexpected trailing content at position ${peek().position}`);
    }
    return ast;
  }

  /**
   * Evaluate parsed AST against a record's properties
   */
  public static evaluateNode(node: ASTNode, record: Record<string, any>): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier': {
        const name = node.name;
        // Lookup in record directly, or case-insensitive fallback
        if (record[name] !== undefined) return record[name];

        const lowerName = name.toLowerCase().replace(/[\s_-]/g, '');
        for (const [k, v] of Object.entries(record)) {
          if (k.toLowerCase().replace(/[\s_-]/g, '') === lowerName) {
            return v;
          }
        }
        return null;
      }

      case 'UnaryOp': {
        const arg = this.evaluateNode(node.argument, record);
        if (node.operator === '-') {
          return -(Number(arg) || 0);
        }
        if (node.operator === '+') {
          return +(Number(arg) || 0);
        }
        return arg;
      }

      case 'BinaryOp': {
        const left = this.evaluateNode(node.left, record);
        const right = this.evaluateNode(node.right, record);

        switch (node.operator) {
          case '+': {
            if (typeof left === 'string' || typeof right === 'string') {
              return String(left ?? '') + String(right ?? '');
            }
            return (Number(left) || 0) + (Number(right) || 0);
          }
          case '-':
            return (Number(left) || 0) - (Number(right) || 0);
          case '*':
            return (Number(left) || 0) * (Number(right) || 0);
          case '/': {
            const divisor = Number(right);
            if (divisor === 0 || isNaN(divisor)) return 0; // Division by zero protection
            return (Number(left) || 0) / divisor;
          }
          case '%': {
            const divisor = Number(right);
            if (divisor === 0 || isNaN(divisor)) return 0;
            return (Number(left) || 0) % divisor;
          }
          case '==':
            return left == right;
          case '!=':
            return left != right;
          case '>':
            return Number(left) > Number(right);
          case '<':
            return Number(left) < Number(right);
          case '>=':
            return Number(left) >= Number(right);
          case '<=':
            return Number(left) <= Number(right);
          default:
            return null;
        }
      }

      case 'FunctionCall': {
        const evaluatedArgs = node.args.map((a) => this.evaluateNode(a, record));

        switch (node.name) {
          case 'abs':
            return Math.abs(Number(evaluatedArgs[0]) || 0);
          case 'round': {
            const val = Number(evaluatedArgs[0]) || 0;
            const decimals = evaluatedArgs[1] !== undefined ? Number(evaluatedArgs[1]) : 0;
            const factor = Math.pow(10, decimals);
            return Math.round(val * factor) / factor;
          }
          case 'ceil':
            return Math.ceil(Number(evaluatedArgs[0]) || 0);
          case 'floor':
            return Math.floor(Number(evaluatedArgs[0]) || 0);
          case 'min':
            return Math.min(...evaluatedArgs.map((a) => Number(a) || 0));
          case 'max':
            return Math.max(...evaluatedArgs.map((a) => Number(a) || 0));
          case 'coalesce': {
            for (const arg of evaluatedArgs) {
              if (arg !== null && arg !== undefined && arg !== '') return arg;
            }
            return null;
          }
          case 'concat':
            return evaluatedArgs.map((a) => (a === null || a === undefined ? '' : String(a))).join('');
          case 'upper':
            return String(evaluatedArgs[0] || '').toUpperCase();
          case 'lower':
            return String(evaluatedArgs[0] || '').toLowerCase();
          default:
            return null;
        }
      }

      default:
        return null;
    }
  }

  /**
   * Helper to validate expression syntax and ensure safety before execution
   */
  public static validate(expr: string): { isValid: boolean; error?: string; ast?: ASTNode } {
    try {
      const ast = this.parse(expr);
      return { isValid: true, ast };
    } catch (err: any) {
      return { isValid: false, error: err.message };
    }
  }

  /**
   * Evaluate expression directly on a record
   */
  public static evaluate(expr: string, record: Record<string, any>): any {
    const ast = this.parse(expr);
    return this.evaluateNode(ast, record);
  }
}
