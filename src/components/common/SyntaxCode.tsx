import type { CSSProperties, ReactNode } from "react";
import { Code, type CodeProps } from "@mantine/core";

import {
  tokenizeJsonCode,
  type SyntaxToken,
  type SyntaxTokenType,
} from "./tokenizeJsonCode";

export type SyntaxLanguage = "json" | "text" | (string & {});

export type SyntaxTheme = Record<SyntaxTokenType, string>;

export interface SyntaxCodeProps extends Omit<CodeProps, "children"> {
  code: string;
  language?: SyntaxLanguage;
  maxHeight?: CSSProperties["maxHeight"];
  theme?: Partial<SyntaxTheme>;
}

const defaultSyntaxTheme: SyntaxTheme = {
  plain: "var(--mantine-color-text)",
  key: "var(--mantine-color-blue-text, var(--mantine-color-blue-7))",
  string: "var(--mantine-color-green-text, var(--mantine-color-green-7))",
  number: "var(--mantine-color-orange-text, var(--mantine-color-orange-7))",
  boolean: "var(--mantine-color-violet-text, var(--mantine-color-violet-7))",
  null: "var(--mantine-color-dimmed)",
  punctuation: "var(--mantine-color-dimmed)",
};

export function SyntaxCode({
  code,
  language = "text",
  maxHeight,
  theme,
  style,
  ...props
}: SyntaxCodeProps) {
  const mergedTheme = { ...defaultSyntaxTheme, ...theme };
  const tokens = tokenizeSyntax(code, language);

  return (
    <Code
      block
      style={{
        color: mergedTheme.plain,
        maxHeight,
        overflow: maxHeight ? "auto" : undefined,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        ...style,
      }}
      {...props}
    >
      {renderTokens(tokens, mergedTheme)}
    </Code>
  );
}

function tokenizeSyntax(code: string, language: SyntaxLanguage): SyntaxToken[] {
  if (language === "json") {
    return tokenizeJsonCode(code);
  }

  return [{ type: "plain", value: code }];
}

function renderTokens(tokens: SyntaxToken[], theme: SyntaxTheme): ReactNode[] {
  return tokens.map((token, index) => (
    <span key={index} style={{ color: theme[token.type] }}>
      {token.value}
    </span>
  ));
}
