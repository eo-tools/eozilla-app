import { useState, type CSSProperties } from "react";
import {
  ActionIcon,
  CopyButton,
  Divider,
  Group,
  Paper,
  Modal,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowsMaximize, IconCheck, IconCopy } from "@tabler/icons-react";
import { CodeHighlight, JsonViewer } from "@mantine/code-highlight";
import "@mantine/code-highlight/styles.css";
import { useFocusWithin, useMediaQuery, useMergedRef } from "@mantine/hooks";
import { useHoverReveal } from "./useHoverReveal";
import styles from "./styles";

export interface JsonCodeProps {
  value: unknown;
  plainText?: boolean;
  mediaType?: string;
  encoding?: string;
  maxHeight?: CSSProperties["maxHeight"];
  withExpandButton?: boolean;
}

export function JsonCode({
  value,
  plainText = false,
  mediaType,
  encoding,
  maxHeight = "16rem",
  withExpandButton = true,
}: JsonCodeProps) {
  const [expanded, setExpanded] = useState(false);
  const { containerProps, revealStyle } = useHoverReveal(200, 0, 1);
  const { ref: focusRef, focused } = useFocusWithin();
  const ref = useMergedRef(containerProps.ref, focusRef);
  const touch = useMediaQuery("(hover: none)");
  const actionStyle = {
    ...revealStyle,
    ...(focused || touch ? { opacity: 1 } : {}),
  };
  let data = value;
  let text = plainText || !!encoding;
  if (!text && typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch {
      text = true;
    }
  }
  const type = mediaType
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase()
    .split("/")[1]
    ?.replace(/^x-/, "");
  const format = encoding || type;
  const label = format ? format.toUpperCase() : text ? "Text" : "JSON";
  const scrollarea = { maxHeight, overflow: "auto" };
  const code = text ? String(value) : (JSON.stringify(data, null, 2) ?? "");
  return (
    <Paper ref={ref} withBorder radius="md" style={{ overflow: "hidden" }}>
      <Group
        justify="space-between"
        wrap="nowrap"
        px="sm"
        py={6}
        bg="var(--mantine-color-default-hover)"
      >
        <Text size="xs" c="dimmed" fw={500}>
          {label}
        </Text>
        <ActionIcon.Group style={actionStyle}>
          <CopyButton value={code}>
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
          {withExpandButton && (
            <Tooltip label="Expand code" withArrow>
              <ActionIcon
                {...styles.actionIcon.sm}
                aria-label="Expand code"
                onClick={() => setExpanded(true)}
              >
                <IconArrowsMaximize {...styles.icon.sm} />
              </ActionIcon>
            </Tooltip>
          )}
        </ActionIcon.Group>
      </Group>
      <Divider color="var(--panel-divider)" />
      {text ? (
        <CodeHighlight
          code={code}
          language={encoding ? "plaintext" : type?.split("+").pop()}
          radius={0}
          withFirstLineIndentation
          withCopyButton={false}
          styles={{
            scrollarea,
            code: {
              padding: "var(--mantine-spacing-xs) var(--mantine-spacing-md)",
              backgroundColor: "var(--ch-background)",
            },
            pre: {
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            },
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
          radius={0}
          styles={{ scrollarea }}
        />
      )}
      {expanded && (
        <Modal
          opened
          onClose={() => setExpanded(false)}
          title={label}
          size="lg"
          centered
        >
          <JsonCode
            value={value}
            plainText={plainText}
            mediaType={mediaType}
            encoding={encoding}
            maxHeight="70vh"
            withExpandButton={false}
          />
        </Modal>
      )}
    </Paper>
  );
}
