import type { ReactNode } from "react";

import type { JsonValue } from "@/utils/json";
import { DynamicExpressionContext } from "./context";

export function DynamicExpressionProvider({
  value,
  children,
}: {
  value: JsonValue | undefined;
  children: ReactNode;
}) {
  return (
    <DynamicExpressionContext.Provider value={value}>
      {children}
    </DynamicExpressionContext.Provider>
  );
}
