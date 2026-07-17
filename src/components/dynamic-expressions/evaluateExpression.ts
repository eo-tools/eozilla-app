import { isJsonValue } from "@/utils/json";
import {
  ExpressionEvaluationError,
  ExpressionResultTypeError,
  type CompiledExpression,
  type ExpressionScope,
  type ExpressionValue,
  type MemberExpression,
  type PathSegment,
  type SupportedExpression,
} from "./types";

const reservedProperties = new Set(["__proto__", "prototype", "constructor"]);

export function evaluateExpression(
  expression: CompiledExpression,
  scope: ExpressionScope,
): ExpressionValue {
  const value = evaluateNode(expression.ast, scope);
  if (value !== undefined && !isJsonValue(value)) {
    throw new ExpressionEvaluationError(
      "Expression returned a value that is not JSON-compatible.",
    );
  }
  return value;
}

export function evaluateConditionExpression(
  expression: CompiledExpression,
  scope: ExpressionScope,
): boolean {
  const value = evaluateExpression(expression, scope);
  if (typeof value !== "boolean") {
    throw new ExpressionResultTypeError(value);
  }
  return value;
}

function evaluateNode(
  expression: SupportedExpression,
  scope: ExpressionScope,
): ExpressionValue {
  switch (expression.type) {
    case "Literal":
      return expression.value;
    case "Identifier":
      return evaluateIdentifier(expression.name, scope);
    case "MemberExpression":
      return evaluateMember(expression, scope);
    case "UnaryExpression":
      return !evaluateNode(expression.argument, scope);
    case "BinaryExpression":
      return evaluateBinary(
        expression.operator,
        expression.left,
        expression.right,
        scope,
      );
    case "ConditionalExpression":
      return evaluateNode(expression.test, scope)
        ? evaluateNode(expression.consequent, scope)
        : evaluateNode(expression.alternate, scope);
  }
}

function evaluateIdentifier(
  name: string,
  scope: ExpressionScope,
): ExpressionValue {
  if (name === "$root") {
    return scope.root;
  }
  if (name === "$value") {
    return getValueAtPath(scope.root, scope.valuePath);
  }
  if (name === "$index") {
    return scope.index;
  }

  const parentPath =
    scope.valuePath.length === 0 ? [] : scope.valuePath.slice(0, -1);
  return getMemberValue(getValueAtPath(scope.root, parentPath), name);
}

function evaluateMember(
  expression: MemberExpression,
  scope: ExpressionScope,
): ExpressionValue {
  const object = evaluateNode(expression.object, scope);
  const property = expression.computed
    ? (expression.property as { value: PathSegment }).value
    : (expression.property as { name: string }).name;
  return getMemberValue(object, property);
}

function evaluateBinary(
  operator: string,
  leftExpression: SupportedExpression,
  rightExpression: SupportedExpression,
  scope: ExpressionScope,
): ExpressionValue {
  const left = evaluateNode(leftExpression, scope);
  if (operator === "&&") {
    return left ? evaluateNode(rightExpression, scope) : left;
  }
  if (operator === "||") {
    return left ? left : evaluateNode(rightExpression, scope);
  }
  if (operator === "??") {
    return left === null || left === undefined
      ? evaluateNode(rightExpression, scope)
      : left;
  }

  const right = evaluateNode(rightExpression, scope);
  switch (operator) {
    case "===":
      return left === right;
    case "!==":
      return left !== right;
    case "<":
      return compareValues(left, right, (a, b) => a < b);
    case "<=":
      return compareValues(left, right, (a, b) => a <= b);
    case ">":
      return compareValues(left, right, (a, b) => a > b);
    case ">=":
      return compareValues(left, right, (a, b) => a >= b);
    default:
      throw new ExpressionEvaluationError(
        `Unsupported operator '${operator}'.`,
      );
  }
}

function compareValues(
  left: ExpressionValue,
  right: ExpressionValue,
  compare: (left: string | number, right: string | number) => boolean,
): boolean {
  if (
    (typeof left !== "string" && typeof left !== "number") ||
    typeof right !== typeof left
  ) {
    return false;
  }
  return compare(left, right as string | number);
}

function getValueAtPath(value: ExpressionValue, path: readonly PathSegment[]) {
  let current = value;
  for (const segment of path) {
    current = getMemberValue(current, segment);
  }
  return current;
}

function getMemberValue(
  value: ExpressionValue,
  property: PathSegment,
): ExpressionValue {
  if (
    reservedProperties.has(String(property)) ||
    value === null ||
    value === undefined
  ) {
    return undefined;
  }
  if (typeof value !== "object") {
    return undefined;
  }

  const descriptor = Object.getOwnPropertyDescriptor(value, property);
  if (!descriptor || !("value" in descriptor)) {
    return undefined;
  }
  return isJsonValue(descriptor.value) ? descriptor.value : undefined;
}
