import jsep, { type Expression } from "jsep";

import { isJsonValue } from "@/utils/json";
import { collectExpressionReferences } from "./collectExpressionReferences";
import {
  ExpressionCompilationError,
  type BinaryOperator,
  type CompiledExpression,
  type IdentifierExpression,
  type LiteralExpression,
  type MemberExpression,
  type SupportedExpression,
} from "./types";

const binaryOperators = new Set<BinaryOperator>([
  "&&",
  "||",
  "??",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
]);
const reservedProperties = new Set(["__proto__", "prototype", "constructor"]);
const cache = new Map<
  string,
  { compiled?: CompiledExpression; error?: ExpressionCompilationError }
>();
const maxCacheSize = 512;

export function compileExpression(source: string): CompiledExpression {
  const cached = cache.get(source);
  if (cached) {
    touchCacheEntry(source, cached);
    if (cached.compiled) {
      return cached.compiled;
    }
    throw cached.error;
  }

  try {
    const ast = validateExpression(jsep(source));
    const compiled = {
      source,
      ast,
      references: collectExpressionReferences(ast),
    } satisfies CompiledExpression;
    setCacheEntry(source, { compiled });
    return compiled;
  } catch (cause) {
    const error = new ExpressionCompilationError(
      cause instanceof Error ? cause.message : "Invalid expression.",
      source,
      cause instanceof Error ? { cause } : undefined,
    );
    setCacheEntry(source, { error });
    throw error;
  }
}

export function clearExpressionCache(): void {
  cache.clear();
}

function validateExpression(expression: Expression): SupportedExpression {
  switch (expression.type) {
    case "Literal": {
      const value = (expression as unknown as { value: unknown }).value;
      if (!isJsonValue(value)) {
        throw unsupported("Only JSON-compatible literals are supported.");
      }
      return { type: "Literal", value };
    }
    case "Identifier": {
      const name = (expression as unknown as { name: string }).name;
      if (
        name.startsWith("$") &&
        !["$root", "$value", "$index"].includes(name)
      ) {
        throw unsupported(`Unknown scope identifier '${name}'.`);
      }
      return { type: "Identifier", name };
    }
    case "MemberExpression":
      return validateMemberExpression(expression as jsep.MemberExpression);
    case "UnaryExpression": {
      const unary = expression as jsep.UnaryExpression;
      if (unary.operator !== "!") {
        throw unsupported(`Unsupported unary operator '${unary.operator}'.`);
      }
      return {
        type: "UnaryExpression",
        operator: "!",
        argument: validateExpression(unary.argument),
      };
    }
    case "BinaryExpression": {
      const binary = expression as jsep.BinaryExpression;
      if (!binaryOperators.has(binary.operator as BinaryOperator)) {
        throw unsupported(`Unsupported binary operator '${binary.operator}'.`);
      }
      return {
        type: "BinaryExpression",
        operator: binary.operator as BinaryOperator,
        left: validateExpression(binary.left),
        right: validateExpression(binary.right),
      };
    }
    case "ConditionalExpression": {
      const conditional = expression as jsep.ConditionalExpression;
      return {
        type: "ConditionalExpression",
        test: validateExpression(conditional.test),
        consequent: validateExpression(conditional.consequent),
        alternate: validateExpression(conditional.alternate),
      };
    }
    default:
      throw unsupported(
        `Unsupported expression construct '${expression.type}'.`,
      );
  }
}

function validateMemberExpression(
  expression: jsep.MemberExpression,
): MemberExpression {
  const object = validateExpression(expression.object);
  let property: LiteralExpression | IdentifierExpression;

  if (expression.computed) {
    const validated = validateExpression(expression.property);
    if (
      validated.type !== "Literal" ||
      (typeof validated.value !== "string" &&
        typeof validated.value !== "number")
    ) {
      throw unsupported("Computed property access requires a literal key.");
    }
    property = validated;
  } else {
    const validated = validateExpression(expression.property);
    if (validated.type !== "Identifier") {
      throw unsupported("Property access requires an identifier.");
    }
    property = validated;
  }

  const propertyName =
    property.type === "Identifier" ? property.name : String(property.value);
  if (reservedProperties.has(propertyName)) {
    throw unsupported(`Property '${propertyName}' is not accessible.`);
  }

  return {
    type: "MemberExpression",
    computed: expression.computed,
    object,
    property,
  };
}

function unsupported(message: string): ExpressionCompilationError {
  return new ExpressionCompilationError(message, "");
}

function setCacheEntry(
  source: string,
  entry: { compiled?: CompiledExpression; error?: ExpressionCompilationError },
) {
  cache.set(source, entry);
  if (cache.size > maxCacheSize) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
}

function touchCacheEntry(
  source: string,
  entry: { compiled?: CompiledExpression; error?: ExpressionCompilationError },
) {
  cache.delete(source);
  cache.set(source, entry);
}
