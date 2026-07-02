import { formatJsonValue } from "@/utils/json";
import { SyntaxCode, type SyntaxCodeProps } from "./SyntaxCode";

export interface JsonCodeProps extends Omit<
  SyntaxCodeProps,
  "code" | "language"
> {
  value: unknown;
}

const collapsedStringLength = 500;

export function JsonCode({ value, ...props }: JsonCodeProps) {
  const code =
    typeof value === "string"
      ? formatJsonValue(
          value.length > collapsedStringLength
            ? `<collapsed string: ${value.length} characters>`
            : value,
        )
      : (() => {
          try {
            return (
              JSON.stringify(
                value,
                (_key, currentValue) =>
                  typeof currentValue === "string" &&
                  currentValue.length > collapsedStringLength
                    ? `<collapsed string: ${currentValue.length} characters>`
                    : currentValue,
                2,
              ) ?? String(value)
            );
          } catch {
            return formatJsonValue(value);
          }
        })();

  return (
    <SyntaxCode code={code} language="json" {...props} />
  );
}
