import { useContext, useMemo } from "react";

import {
  evaluateConditionExpression,
  evaluateExpression,
} from "./evaluateExpression";
import { DynamicExpressionContext, missingExpressionProvider } from "./context";
import type {
  CompiledExpression,
  CompiledUiExpressions,
  ExpressionValue,
  ValuePath,
} from "./types";

export function useExpression(
  expression: CompiledExpression,
  valuePath: ValuePath,
  index?: number,
): ExpressionValue {
  const root = useExpressionRoot();
  return useMemo(
    () => evaluateExpression(expression, { root, valuePath, index }),
    [expression, index, root, valuePath],
  );
}

export function useConditionExpression(
  expression: CompiledExpression,
  valuePath: ValuePath,
  index?: number,
): boolean {
  const root = useExpressionRoot();
  return useMemo(
    () => evaluateConditionExpression(expression, { root, valuePath, index }),
    [expression, index, root, valuePath],
  );
}

export function useConditionalUiState({
  expressions,
  valuePath,
  index,
  parentDisabled,
  visible = true,
  hidden = false,
  enabled = true,
  disabled = false,
}: {
  expressions: CompiledUiExpressions;
  valuePath: ValuePath;
  index?: number;
  parentDisabled: boolean;
  visible?: boolean;
  hidden?: boolean;
  enabled?: boolean;
  disabled?: boolean;
}) {
  const root = useExpressionRoot();
  return useMemo(() => {
    const scope = { root, valuePath, index };
    const evaluate = (
      expression: CompiledExpression | undefined,
      fallback: boolean,
    ) => {
      if (!expression) {
        return fallback;
      }
      try {
        return evaluateConditionExpression(expression, scope);
      } catch (error) {
        console.error(
          `Failed to evaluate expression '${expression.source}'.`,
          error,
        );
        return fallback;
      }
    };

    const isVisible =
      evaluate(expressions.visible, visible) &&
      !evaluate(expressions.hidden, hidden);
    const isEnabled =
      !parentDisabled &&
      evaluate(expressions.enabled, enabled) &&
      !evaluate(expressions.disabled, disabled);
    return { visible: isVisible, disabled: !isEnabled };
  }, [
    disabled,
    enabled,
    expressions,
    hidden,
    index,
    parentDisabled,
    root,
    valuePath,
    visible,
  ]);
}

function useExpressionRoot() {
  const value = useContext(DynamicExpressionContext);
  if (value === missingExpressionProvider) {
    throw new Error("Dynamic expressions require DynamicExpressionProvider.");
  }
  return value;
}
