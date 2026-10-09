import type { CSSProperties, ReactNode } from "react";
import {
  ActionIcon,
  Box,
  Code,
  CopyButton,
  Group,
  Text,
  Tooltip,
  type CodeProps,
} from "@mantine/core";
import { IconCheck, IconCode, IconCopy } from "@tabler/icons-react";

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
  const label =
    language === "json" ? "JSON" : language === "text" ? "Text" : language;

  return (
    <Code
      component="div"
      block
      style={{
        color: mergedTheme.plain,
        padding: 0,
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
        ...style,
      }}
      {...props}
    >
      <Group justify="space-between" wrap="nowrap" px="xs" py={6}>
        <Group gap={6} wrap="nowrap">
          <IconCode size={16} stroke={1.5} />
          <Text size="xs" fw={500}>
            {label}
          </Text>
        </Group>
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied" : `Copy ${label}`}>
              <ActionIcon
                variant="subtle"
                color={copied ? "teal" : "gray"}
                size="sm"
                aria-label={`Copy ${label}`}
                onClick={copy}
              >
                {copied ? (
                  <IconCheck size={16} />
                ) : (
                  <IconCopy size={16} stroke={1.5} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <Box
        component="pre"
        m={0}
        p="xs"
        style={{
          maxHeight,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          font: "inherit",
        }}
      >
        {renderTokens(tokens, mergedTheme)}
      </Box>
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
