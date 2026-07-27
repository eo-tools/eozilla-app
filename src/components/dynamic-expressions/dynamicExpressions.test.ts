import { beforeEach, describe, expect, it } from "vitest";

import {
  clearExpressionCache,
  compileExpression,
  evaluateConditionExpression,
  evaluateExpression,
  ExpressionCompilationError,
  ExpressionResultTypeError,
} from ".";

describe("dynamic expressions", () => {
  beforeEach(clearExpressionCache);

  it("parses, validates, and evaluates conditions", () => {
    const expression = compileExpression("auth_type !== 'login'");

    expect(expression.references).toEqual([
      { base: "sibling", path: ["auth_type"] },
    ]);
    expect(
      evaluateConditionExpression(expression, {
        root: { auth_type: "anonymous" },
        valuePath: ["password"],
      }),
    ).toBe(true);
  });

  it("supports root, current-value, and array-index scopes", () => {
    const rootExpression = compileExpression("$root.mode === 'advanced'");
    const valueExpression = compileExpression("$value.name");
    const indexExpression = compileExpression("$index >= 2");
    const scope = {
      root: { mode: "advanced", items: [{ name: "Ada" }] },
      valuePath: ["items", 0] as const,
      index: 2,
    };

    expect(evaluateExpression(rootExpression, scope)).toBe(true);
    expect(evaluateExpression(valueExpression, scope)).toBe("Ada");
    expect(evaluateExpression(indexExpression, scope)).toBe(true);
  });

  it("uses short-circuit and conditional semantics", () => {
    const expression = compileExpression(
      "missing && missing.value ? 'bad' : 'fallback'",
    );

    expect(
      evaluateExpression(expression, { root: {}, valuePath: ["target"] }),
    ).toBe("fallback");
  });

  it("rejects unsafe and unsupported constructs", () => {
    expect(() => compileExpression("lookup(value)")).toThrow(
      ExpressionCompilationError,
    );
    expect(() => compileExpression("value.constructor")).toThrow(
      "not accessible",
    );
    expect(() => compileExpression("values[key]")).toThrow("literal key");
    expect(() => compileExpression("value == 1")).toThrow(
      "Unsupported binary operator",
    );
  });

  it("requires boolean condition results", () => {
    const expression = compileExpression("auth_type");
    expect(() =>
      evaluateConditionExpression(expression, {
        root: { auth_type: "login" },
        valuePath: ["password"],
      }),
    ).toThrow(ExpressionResultTypeError);
  });

  it("memoizes successful compilations", () => {
    expect(compileExpression("enabled === true")).toBe(
      compileExpression("enabled === true"),
    );
  });
});
