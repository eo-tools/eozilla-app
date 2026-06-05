import { SyntaxCode, type SyntaxCodeProps } from "./SyntaxCode";
import { formatJsonValue } from "@/utils/json";

export interface JsonCodeProps
  extends Omit<SyntaxCodeProps, "code" | "language"> {
  value: unknown;
}

export function JsonCode({ value, ...props }: JsonCodeProps) {
  return <SyntaxCode code={formatJsonValue(value)} language="json" {...props} />;
}
