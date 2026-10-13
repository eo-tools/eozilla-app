import type { CSSProperties } from "react";
import { Box } from "@mantine/core";
import { CodeHighlight, JsonViewer } from "@mantine/code-highlight";
import { useFocusWithin, useMediaQuery, useMergedRef } from "@mantine/hooks";
import "@mantine/code-highlight/styles.css";
import { useHoverReveal } from "./useHoverReveal";

export interface JsonCodeProps {
  value: unknown;
  language?: "json" | "text";
  height?: CSSProperties["height"];
  maxHeight?: CSSProperties["maxHeight"];
}

export function JsonCode({
  value,
  language = "json",
  height,
  maxHeight = "16rem",
}: JsonCodeProps) {
  const { containerProps, revealStyle } = useHoverReveal(200, 0, 1);
  const { focused, ref: focusRef } = useFocusWithin();
  const ref = useMergedRef(containerProps.ref, focusRef);
  const touch = useMediaQuery("(hover: none)");
  const copyStyle =
    focused || touch ? { ...revealStyle, opacity: 1 } : revealStyle;
  let data = value;
  let text = language === "text";
  if (!text && typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch {
      text = true;
    }
  }
  const scrollarea = { height, maxHeight, overflow: "auto" };
  return (
    <Box ref={ref}>
      {text ? (
        <CodeHighlight
          code={String(value)}
          language="text"
          radius="md"
          withBorder
          withFirstLineIndentation
          styles={{
            scrollarea,
            pre: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
            controls: copyStyle,
          }}
        />
      ) : (
        <JsonViewer
          value={data}
          defaultExpandDepth={2}
          maxDisplayLength={Infinity}
          withCopyButton
          withKeyQuotes
          withSize
          withChevrons
          withBorder
          radius="md"
          styles={{ scrollarea, copyAllButton: copyStyle }}
        />
      )}
    </Box>
  );
}
