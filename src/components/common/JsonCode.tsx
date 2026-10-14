import type { CSSProperties } from "react";
import { ActionIcon, Box, CopyButton, Tooltip } from "@mantine/core";
import {
  IconArrowsMaximize,
  IconCheck,
  IconCopy,
  IconEye,
} from "@tabler/icons-react";
import { CodeHighlight, JsonViewer } from "@mantine/code-highlight";
import {
  useFocusWithin,
  useMediaQuery,
  useMergedRef,
  useResizeObserver,
} from "@mantine/hooks";
import "@mantine/code-highlight/styles.css";
import { useHoverReveal } from "./useHoverReveal";
import styles from "./styles";

export interface JsonCodeProps {
  value: unknown;
  language?: "json" | "text";
  maxHeight?: CSSProperties["maxHeight"];
  onEnlarge?: () => void;
  preview?: boolean;
}

export function JsonCode({
  value,
  language = "json",
  maxHeight = "16rem",
  onEnlarge,
  preview = false,
}: JsonCodeProps) {
  const { containerProps, revealStyle } = useHoverReveal(200, 0, 1);
  const { focused, ref: focusRef } = useFocusWithin();
  const [panelRef, panelSize] = useResizeObserver<HTMLDivElement>();
  const [contentRef, contentSize] = useResizeObserver<HTMLDivElement>();
  const ref = useMergedRef(containerProps.ref, focusRef, panelRef);
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
  const scrollarea = { maxHeight, overflow: "auto" };
  const toolbarRight = contentSize.height > panelSize.height ? 24 : 8;
  const paddingRight = toolbarRight + (onEnlarge ? 44 : 22) + 12;
  const viewLabel = preview ? "Preview output" : "Open larger view";
  return (
    <Box ref={ref} pos="relative">
      <ActionIcon.Group
        pos="absolute"
        top={8}
        right={toolbarRight}
        style={{ ...copyStyle, zIndex: 1 }}
      >
        <CopyButton
          value={text ? String(value) : (JSON.stringify(data, null, 2) ?? "")}
        >
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
              <ActionIcon
                {...styles.actionIcon.sm}
                aria-label={text ? "Copy code" : "Copy JSON"}
                onClick={copy}
              >
                {copied ? (
                  <IconCheck {...styles.icon.sm} />
                ) : (
                  <IconCopy {...styles.icon.sm} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        {onEnlarge && (
          <Tooltip label={viewLabel} withArrow>
            <ActionIcon
              {...styles.actionIcon.sm}
              aria-label={viewLabel}
              onClick={onEnlarge}
            >
              {preview ? (
                <IconEye {...styles.icon.sm} />
              ) : (
                <IconArrowsMaximize {...styles.icon.sm} />
              )}
            </ActionIcon>
          </Tooltip>
        )}
      </ActionIcon.Group>
      {text ? (
        <CodeHighlight
          code={String(value)}
          language="text"
          radius="md"
          withBorder
          withFirstLineIndentation
          withCopyButton={false}
          attributes={{ codeWrapper: { ref: contentRef } }}
          styles={{
            scrollarea,
            pre: {
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            },
            code: { paddingRight },
          }}
        />
      ) : (
        <JsonViewer
          value={data}
          defaultExpandDepth={2}
          maxDisplayLength={Infinity}
          withKeyQuotes
          withSize
          withChevrons
          withBorder
          radius="md"
          attributes={{ wrapper: { ref: contentRef } }}
          styles={{ scrollarea, content: { paddingRight } }}
        />
      )}
    </Box>
  );
}
