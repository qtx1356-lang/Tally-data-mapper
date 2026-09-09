/**
 * Phase 32G - Safe AST-Based Query Expression Engine
 * Evaluates derived and calculated fields without using eval() or Function().
 * Enforces strict limits, zero division safety, and AST depth protection.
 */

export type ASTNodeType =
  | 'Literal'
  | 'Identifier'
  | 'BinaryOp'
  | 'UnaryOp'
  | 'FunctionCall';

export interface ASTNode {
  type: ASTNodeType;
  value?: any;
  name?: string;
  op?: string;
  left?: ASTNode;
  right?: ASTNode;
  argument?: ASTNode;
  args?: ASTNode[];
}

export interface ExpressionValidationResult {
  isValid: boolean;
  error?: string;
  referencedIdentifiers: string[];
}

export class QueryExpressionEngine {
  private static readonly MAX_DEPTH = 30;
  private static readonly ALLOWED_FUNCTIONS = new Set([
    'ABS',
    'ROUND',
    'FLOOR',
    'CEIL',
    'COALESCE',
    'IF',
    'MIN',
    'MAX',
    'CONCAT',
    'UPPER',
    'LOWER',
    'TRIM'
  ]);

  /**
   * Validates and parses an expression into an AST, checking for syntax errors and unsafe tokens
   */
  public parse(expressionStr: string): ASTNode {
    const trimmed = expressionStr.trim();
    if (!trimmed) {
      throw new Error('Expression cannot be empty.');
    }

    // Safety checks against injection tokens
    if (/(__proto__|constructor|prototype|process|require|import|eval|Function|window|global)/i.test(trimmed)) {
      throw new Error('Unsafe keyword detected in expression.');
    }

    const tokens = this.tokenize(trimmed);
    let current = 0;

    const parseExpression = (depth: number): ASTNode => {
      if (depth > QueryExpressionEngine.MAX_DEPTH) {
        throw new Error('Expression exceeds maximum recursion depth.');
      }
      return parseLogicalOr(depth + 1);
    };

    const parseLogicalOr = (depth: number): ASTNode => {
      let node = parseLogicalAnd(depth + 1);
      while (current < tokens.length && (tokens[current].value === '||' || tokens[current].value.toUpperCase() === 'OR')) {
        const op = tokens[current].value;
        current++;
        const right = parseLogicalAnd(depth + 1);
        node = { type: 'BinaryOp', op, left: node, right };
      }
      return node;
    };

    const parseLogicalAnd = (depth: number): ASTNode => {
      let node = parseEquality(depth + 1);
      while (current < tokens.length && (tokens[current].value === '&&' || tokens[current].value.toUpperCase() === 'AND')) {
        const op = tokens[current].value;
        current++;
        const right = parseEquality(depth + 1);
        node = { type: 'BinaryOp', op, left: node, right };
      }
      return node;
    };

    const parseEquality = (depth: number): ASTNode => {
      let node = parseRelational(depth + 1);
      while (current < tokens.length && (tokens[current].value === '==' || tokens[current].value === '!=' || tokens[current].value === '=')) {
        const op = tokens[current].value === '=' ? '==' : tokens[current].value;
        current++;
        const right = parseRelational(depth + 1);
        node = { type: 'BinaryOp', op, left: node, right };
      }
      return node;
    };

    const parseRelational = (depth: number): ASTNode => {
      let node = parseAdditive(depth + 1);
      while (current < tokens.length && ['<', '<=', '>', '>='].includes(tokens[current].value)) {
        const op = tokens[current].value;
        current++;
        const right = parseAdditive(depth + 1);
        node = { type: 'BinaryOp', op, left: node, right };
      }
      return node;
    };

    const parseAdditive = (depth: number): ASTNode => {
      let node = parseMultiplicative(depth + 1);
      while (current < tokens.length && (tokens[current].value === '+' || tokens[current].value === '-')) {
        const op = tokens[current].value;
        current++;
        const right = parseMultiplicative(depth + 1);
        node = { type: 'BinaryOp', op, left: node, right };
      }
      return node;
    };

    const parseMultiplicative = (depth: number): ASTNode => {
      let node = parseUnary(depth + 1);
      while (
        current < tokens.length &&
        (tokens[current].value === '*' ||
          tokens[current].value === '/' ||
          tokens[current].value === '%' ||
          tokens[current].value === '×')
      ) {
        const op = tokens[current].value === '×' ? '*' : tokens[current].value;
        current++;
        const right = parseUnary(depth + 1);
        node = { type: 'BinaryOp', op, left: node, right };
      }
      return node;
    };

    const parseUnary = (depth: number): ASTNode => {
      if (current < tokens.length && (tokens[current].value === '-' || tokens[current].value === '!')) {
        const op = tokens[current].value;
        current++;
        const arg = parseUnary(depth + 1);
        return { type: 'UnaryOp', op, argument: arg };
      }
      return parsePrimary(depth + 1);
    };

    const parsePrimary = (depth: number): ASTNode => {
      if (current >= tokens.length) {
        throw new Error('Unexpected end of expression.');
      }

      const token = tokens[current];

      // Number literal
      if (token.type === 'NUMBER') {
        current++;
        return { type: 'Literal', value: parseFloat(token.value) };
      }

      // String literal
      if (token.type === 'STRING') {
        current++;
        return { type: 'Literal', value: token.value };
      }

      // Boolean literal
      if (token.type === 'IDENTIFIER' && (token.value.toLowerCase() === 'true' || token.value.toLowerCase() === 'false')) {
        current++;
        return { type: 'Literal', value: token.value.toLowerCase() === 'true' };
      }

      // Null literal
      if (token.type === 'IDENTIFIER' && token.value.toLowerCase() === 'null') {
        current++;
        return { type: 'Literal', value: null };
      }

      // Function call or Identifier
      if (token.type === 'IDENTIFIER') {
        const ident = token.value;
        current++;

        // Function invocation
        if (current < tokens.length && tokens[current].value === '(') {
          const funcUpper = ident.toUpperCase();
          if (!QueryExpressionEngine.ALLOWED_FUNCTIONS.has(funcUpper)) {
            throw new Error(`Function '${ident}' is not supported in query expressions.`);
          }
          current++; // eat '('
          const args: ASTNode[] = [];
          if (current < tokens.length && tokens[current].value !== ')') {
            args.push(parseExpression(depth + 1));
            while (current < tokens.length && tokens[current].value === ',') {
              current++; // eat ','
              args.push(parseExpression(depth + 1));
            }
          }
          if (current >= tokens.length || tokens[current].value !== ')') {
            throw new Error(`Expected ')' closing function call for '${ident}'.`);
          }
          current++; // eat ')'
          return { type: 'FunctionCall', name: funcUpper, args };
        }

        // Regular identifier
        return { type: 'Identifier', name: ident };
      }

      // Parentheses grouping
      if (token.value === '(') {
        current++; // eat '('
        const inner = parseExpression(depth + 1);
        if (current >= tokens.length || tokens[current].value !== ')') {
          throw new Error("Mismatched parentheses: expected ')'.");
        }
        current++; // eat ')'
        return inner;
      }

      throw new Error(`Unexpected token '${token.value}'.`);
    };

    const root = parseExpression(0);
    if (current < tokens.length) {
      throw new Error(`Unexpected trailing characters near '${tokens[current].value}'.`);
    }

    return root;
  }

  /**
   * Safely tokenizes the expression string
   */
  private tokenize(str: string): Array<{ type: 'NUMBER' | 'STRING' | 'IDENTIFIER' | 'PUNCT'; value: string }> {
    const tokens: Array<{ type: 'NUMBER' | 'STRING' | 'IDENTIFIER' | 'PUNCT'; value: string }> = [];
    let i = 0;

    while (i < str.length) {
      const char = str[i];

      // Whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers
      if (/\d/.test(char) || (char === '.' && i + 1 < str.length && /\d/.test(str[i + 1]))) {
        let numStr = '';
        let hasDot = false;
        while (i < str.length && (/\d/.test(str[i]) || (str[i] === '.' && !hasDot))) {
          if (str[i] === '.') hasDot = true;
          numStr += str[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      // String literals (single or double quotes)
      if (char === "'" || char === '"') {
        const quote = char;
        i++;
        let content = '';
        while (i < str.length && str[i] !== quote) {
          if (str[i] === '\\' && i + 1 < str.length) {
            i++;
          }
          content += str[i];
          i++;
        }
        if (i >= str.length) {
          throw new Error('Unterminated string literal.');
        }
        i++; // eat closing quote
        tokens.push({ type: 'STRING', value: content });
        continue;
      }

      // Multi-char operators
      const twoChars = str.substr(i, 2);
      if (['==', '!=', '<=', '>=', '&&', '||'].includes(twoChars)) {
        tokens.push({ type: 'PUNCT', value: twoChars });
        i += 2;
        continue;
      }

      // Single char punctuation / operators
      if (['+', '-', '*', '/', '%', '×', '(', ')', ',', '<', '>', '=', '!'].includes(char)) {
        tokens.push({ type: 'PUNCT', value: char });
        i++;
        continue;
      }

      // Identifiers: letters, underscore, digits, dots
      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        while (i < str.length && /[a-zA-Z0-9_.]/.test(str[i])) {
          idStr += str[i];
          i++;
        }
        tokens.push({ type: 'IDENTIFIER', value: idStr });
        continue;
      }

      throw new Error(`Unsupported character '${char}' at index ${i}.`);
    }

    return tokens;
  }

  /**
   * Safely evaluates an AST against a record object
   */
  public evaluate(ast: ASTNode, record: Record<string, any>): any {
    const evalNode = (node: ASTNode): any => {
      switch (node.type) {
        case 'Literal':
          return node.value;

        case 'Identifier': {
          const name = node.name!;
          // Look inside record.payload first if exists, otherwise directly in record
          const payload = record.payload || record;
          let val: any;

          if (payload[name] !== undefined) {
            val = payload[name];
          } else if (record[name] !== undefined) {
            val = record[name];
          } else if (name.includes('.')) {
            // Nested property support: e.g. "ledger.name"
            const parts = name.split('.');
            val = payload;
            for (const p of parts) {
              if (val && typeof val === 'object' && p in val) {
                val = val[p];
              } else {
                val = undefined;
                break;
              }
            }
          }

          return val !== undefined && val !== null ? val : 0;
        }

        case 'UnaryOp': {
          const arg = evalNode(node.argument!);
          if (node.op === '-') {
            return -Number(arg || 0);
          }
          if (node.op === '!') {
            return !arg;
          }
          return arg;
        }

        case 'BinaryOp': {
          const left = evalNode(node.left!);
          const right = evalNode(node.right!);

          switch (node.op) {
            case '+':
              if (typeof left === 'string' || typeof right === 'string') {
                return String(left) + String(right);
              }
              return (Number(left) || 0) + (Number(right) || 0);
            case '-':
              return (Number(left) || 0) - (Number(right) || 0);
            case '*':
              return (Number(left) || 0) * (Number(right) || 0);
            case '/': {
              const rNum = Number(right);
              if (rNum === 0 || isNaN(rNum)) return 0; // Zero division safety
              return (Number(left) || 0) / rNum;
            }
            case '%': {
              const rNum = Number(right);
              if (rNum === 0 || isNaN(rNum)) return 0;
              return (Number(left) || 0) % rNum;
            }
            case '==':
              return left == right;
            case '!=':
              return left != right;
            case '<':
              return Number(left) < Number(right);
            case '<=':
              return Number(left) <= Number(right);
            case '>':
              return Number(left) > Number(right);
            case '>=':
              return Number(left) >= Number(right);
            case '&&':
            case 'AND':
              return Boolean(left) && Boolean(right);
            case '||':
            case 'OR':
              return Boolean(left) || Boolean(right);
            default:
              return null;
          }
        }

        case 'FunctionCall': {
          const name = node.name!;
          const args = (node.args || []).map((a) => evalNode(a));

          switch (name) {
            case 'ABS':
              return Math.abs(Number(args[0]) || 0);
            case 'ROUND': {
              const num = Number(args[0]) || 0;
              const decimals = args[1] !== undefined ? Math.max(0, Math.floor(Number(args[1]))) : 2;
              const factor = Math.pow(10, decimals);
              return Math.round(num * factor) / factor;
            }
            case 'FLOOR':
              return Math.floor(Number(args[0]) || 0);
            case 'CEIL':
              return Math.ceil(Number(args[0]) || 0);
            case 'COALESCE':
              for (const a of args) {
                if (a !== null && a !== undefined && a !== '') return a;
              }
              return null;
            case 'IF':
              return args[0] ? args[1] : args[2];
            case 'MIN':
              return Math.min(...args.map((a) => Number(a) || 0));
            case 'MAX':
              return Math.max(...args.map((a) => Number(a) || 0));
            case 'CONCAT':
              return args.map((a) => String(a !== null && a !== undefined ? a : '')).join('');
            case 'UPPER':
              return String(args[0] || '').toUpperCase();
            case 'LOWER':
              return String(args[0] || '').toLowerCase();
            case 'TRIM':
              return String(args[0] || '').trim();
            default:
              return null;
          }
        }

        default:
          return null;
      }
    };

    return evalNode(ast);
  }

  /**
   * Validates expression and extracts all referenced identifiers
   */
  public validate(expressionStr: string): ExpressionValidationResult {
    try {
      const ast = this.parse(expressionStr);
      const identifiers = new Set<string>();

      const collect = (node: ASTNode) => {
        if (node.type === 'Identifier' && node.name) {
          identifiers.add(node.name);
        }
        if (node.left) collect(node.left);
        if (node.right) collect(node.right);
        if (node.argument) collect(node.argument);
        if (node.args) node.args.forEach(collect);
      };

      collect(ast);
      return {
        isValid: true,
        referencedIdentifiers: Array.from(identifiers)
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || 'Invalid expression syntax',
        referencedIdentifiers: []
      };
    }
  }
}

export const queryExpressionEngine = new QueryExpressionEngine();
