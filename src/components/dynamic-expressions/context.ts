import { createContext } from "react";

import type { JsonValue } from "@/utils/json";

export const missingExpressionProvider = Symbol("missing-expression-provider");
export const DynamicExpressionContext = createContext<
  JsonValue | undefined | typeof missingExpressionProvider
>(missingExpressionProvider);
