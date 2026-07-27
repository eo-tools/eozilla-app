import type { JsonValue } from "@/utils/json";

export type ExpressionValue = JsonValue | undefined;
export type PathSegment = string | number;
export type ValuePath = readonly PathSegment[];

export interface LiteralExpression {
  type: "Literal";
  value: JsonValue;
}

export interface IdentifierExpression {
  type: "Identifier";
  name: string;
}

export interface MemberExpression {
  type: "MemberExpression";
  computed: boolean;
  object: SupportedExpression;
  property: LiteralExpression | IdentifierExpression;
}

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: "!";
  argument: SupportedExpression;
}

export type BinaryOperator =
  | "&&"
  | "||"
  | "??"
  | "==="
  | "!=="
  | "<"
  | "<="
  | ">"
  | ">=";

export interface BinaryExpression {
  type: "BinaryExpression";
  operator: BinaryOperator;
  left: SupportedExpression;
  right: SupportedExpression;
}

export interface ConditionalExpression {
  type: "ConditionalExpression";
  test: SupportedExpression;
  consequent: SupportedExpression;
  alternate: SupportedExpression;
}

export type SupportedExpression =
  | LiteralExpression
  | IdentifierExpression
  | MemberExpression
  | UnaryExpression
  | BinaryExpression
  | ConditionalExpression;

export type ExpressionReference =
  | { base: "sibling"; path: ValuePath }
  | { base: "root"; path: ValuePath }
  | { base: "value"; path: ValuePath }
  | { base: "index"; path: readonly [] };

export interface CompiledExpression {
  source: string;
  ast: SupportedExpression;
  references: readonly ExpressionReference[];
}

export interface ExpressionScope {
  root: ExpressionValue;
  valuePath: ValuePath;
  index?: number;
}

export type UiConditionName = "visible" | "hidden" | "enabled" | "disabled";

export type CompiledUiExpressions = Partial<
  Record<UiConditionName, CompiledExpression>
>;

export class ExpressionCompilationError extends Error {
  constructor(
    message: string,
    readonly source: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ExpressionCompilationError";
  }
}

export class ExpressionEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionEvaluationError";
  }
}

export class ExpressionResultTypeError extends ExpressionEvaluationError {
  constructor(readonly value: ExpressionValue) {
    super(`Expression returned ${describeValue(value)}, expected boolean.`);
    this.name = "ExpressionResultTypeError";
  }
}

function describeValue(value: ExpressionValue): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "an array";
  }
  return typeof value;
}
