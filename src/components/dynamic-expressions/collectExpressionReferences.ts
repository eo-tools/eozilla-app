import type {
  ExpressionReference,
  IdentifierExpression,
  MemberExpression,
  PathSegment,
  SupportedExpression,
} from "./types";

interface MemberPath {
  name: string;
  path: PathSegment[];
}

export function collectExpressionReferences(
  expression: SupportedExpression,
): readonly ExpressionReference[] {
  const references = new Map<string, ExpressionReference>();
  collect(expression, references);
  return [...references.values()];
}

function collect(
  expression: SupportedExpression,
  references: Map<string, ExpressionReference>,
): void {
  const memberPath = getMemberPath(expression);
  if (memberPath) {
    addReference(references, createReference(memberPath));
    return;
  }

  switch (expression.type) {
    case "Literal":
      return;
    case "Identifier":
      addReference(
        references,
        createReference({ name: expression.name, path: [] }),
      );
      return;
    case "MemberExpression":
      throw new Error("Validated member expression has no static path.");
    case "UnaryExpression":
      collect(expression.argument, references);
      return;
    case "BinaryExpression":
      collect(expression.left, references);
      collect(expression.right, references);
      return;
    case "ConditionalExpression":
      collect(expression.test, references);
      collect(expression.consequent, references);
      collect(expression.alternate, references);
  }
}

function getMemberPath(expression: SupportedExpression): MemberPath | null {
  if (expression.type === "Identifier") {
    return { name: expression.name, path: [] };
  }
  if (expression.type !== "MemberExpression") {
    return null;
  }

  const parent = getMemberPath(expression.object);
  if (!parent) {
    return null;
  }
  return {
    name: parent.name,
    path: [...parent.path, getPropertyName(expression)],
  };
}

function getPropertyName(expression: MemberExpression): PathSegment {
  if (expression.computed) {
    return (expression.property as { value: PathSegment }).value;
  }
  return (expression.property as IdentifierExpression).name;
}

function createReference({ name, path }: MemberPath): ExpressionReference {
  if (name === "$root") {
    return { base: "root", path };
  }
  if (name === "$value") {
    return { base: "value", path };
  }
  if (name === "$index") {
    return { base: "index", path: [] };
  }
  return { base: "sibling", path: [name, ...path] };
}

function addReference(
  references: Map<string, ExpressionReference>,
  reference: ExpressionReference,
) {
  references.set(
    `${reference.base}:${JSON.stringify(reference.path)}`,
    reference,
  );
}
